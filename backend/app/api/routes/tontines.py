import csv
import io
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.crud_router import build_crud_router
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import ForbiddenError, get_current_user
from app.models import AdminAction, Contribution, Guarantor, Incident, Tontine, TontineMember, User, Vote
from app.schemas import TontineCreate, TontineRead, TontineUpdate
from app.services import CRUDService

router: APIRouter = build_crud_router(
    service=CRUDService(Tontine),
    create_schema=TontineCreate,
    update_schema=TontineUpdate,
    read_schema=TontineRead,
)


@router.get("/mine/list")
def list_my_tontines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.execute(
        select(Tontine)
        .outerjoin(TontineMember, TontineMember.tontine_id == Tontine.id)
        .where((Tontine.organizer_id == current_user.id) | (TontineMember.user_id == current_user.id))
        .order_by(Tontine.created_at.desc())
    ).unique().scalars().all()
    return [tontine_summary(db, tontine) for tontine in rows]


@router.get("/{tontine_id}/full")
def get_tontine_full(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = db.get(Tontine, tontine_id)
    if tontine is None:
        raise NotFoundError("Tontine introuvable.")
    if not can_view_tontine(db, tontine, current_user):
        raise ForbiddenError("Acces reserve aux membres de cette tontine.")
    return {
        **tontine_summary(db, tontine),
        "members": list_tontine_members_payload(db, tontine_id),
        "contributions": [
            contribution_payload(item)
            for item in db.scalars(
                select(Contribution)
                .where(Contribution.tontine_id == tontine_id)
                .order_by(Contribution.due_date.asc())
            ).all()
        ],
        "incidents": [
            {
                "id": str(item.id),
                "title": item.title,
                "type": item.type,
                "status": item.status,
                "amount": float(item.amount or 0),
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in db.scalars(
                select(Incident)
                .where(Incident.tontine_id == tontine_id)
                .order_by(Incident.created_at.desc())
            ).all()
        ],
    }


@router.get("/{tontine_id}/members/list")
def list_tontine_members(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = db.get(Tontine, tontine_id)
    if tontine is None:
        raise NotFoundError("Tontine introuvable.")
    if not can_view_tontine(db, tontine, current_user):
        raise ForbiddenError("Acces reserve aux membres de cette tontine.")
    return list_tontine_members_payload(db, tontine_id)


@router.get("/admin/{tontine_id}/overview")
def get_tontine_admin_overview(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = require_tontine_admin(db, tontine_id, current_user)
    return {
        "tontine": tontine,
        "members_count": db.scalar(select(func.count(TontineMember.id)).where(TontineMember.tontine_id == tontine_id)) or 0,
        "contributions_count": db.scalar(select(func.count(Contribution.id)).where(Contribution.tontine_id == tontine_id)) or 0,
        "late_contributions_count": db.scalar(select(func.count(Contribution.id)).where(Contribution.tontine_id == tontine_id, Contribution.status == "late")) or 0,
        "incidents_count": db.scalar(select(func.count(Incident.id)).where(Incident.tontine_id == tontine_id)) or 0,
        "votes_count": db.scalar(select(func.count(Vote.id)).where(Vote.tontine_id == tontine_id)) or 0,
    }


@router.patch("/admin/{tontine_id}/rules", response_model=TontineRead)
def update_tontine_rules(
    tontine_id: UUID,
    rules: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = require_tontine_admin(db, tontine_id, current_user)
    tontine.rules = rules
    db.add(tontine)
    log_tontine_admin_action(db, current_user, tontine_id, "tontine_rules_updated", metadata={"rules": rules})
    db.commit()
    db.refresh(tontine)
    return tontine


@router.delete("/admin/{tontine_id}/members/{member_id}")
def remove_tontine_member(
    tontine_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_tontine_admin(db, tontine_id, current_user)
    member = db.get(TontineMember, member_id)
    if member is None or member.tontine_id != tontine_id:
        raise NotFoundError("Membre introuvable dans cette tontine.")

    member.status = "removed"
    member.left_at = datetime.now(timezone.utc)
    db.add(member)
    log_tontine_admin_action(db, current_user, tontine_id, "tontine_member_removed", target_user_id=member.user_id)
    db.commit()
    return {"message": "Membre supprime de la tontine."}


@router.get("/admin/{tontine_id}/history")
def get_tontine_history(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_tontine_admin(db, tontine_id, current_user)
    contributions = list(db.scalars(select(Contribution).where(Contribution.tontine_id == tontine_id).order_by(Contribution.created_at.desc()).limit(50)).all())
    incidents = list(db.scalars(select(Incident).where(Incident.tontine_id == tontine_id).order_by(Incident.created_at.desc()).limit(50)).all())
    votes = list(db.scalars(select(Vote).where(Vote.tontine_id == tontine_id).order_by(Vote.created_at.desc()).limit(50)).all())
    actions = list(db.scalars(select(AdminAction).where(AdminAction.tontine_id == tontine_id).order_by(AdminAction.created_at.desc()).limit(50)).all())
    return {"contributions": contributions, "incidents": incidents, "votes": votes, "admin_actions": actions}


@router.get("/admin/{tontine_id}/export.csv")
def export_tontine_csv(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = require_tontine_admin(db, tontine_id, current_user)
    exported_at = datetime.now(timezone.utc)
    filename = export_filename(tontine.name, "csv", exported_at)
    output = io.StringIO()
    writer = csv.writer(output)
    data = collect_tontine_export_data(db, tontine_id)

    writer.writerow(["FasoTontine export", tontine.name, exported_at.strftime("%Y-%m-%d %H:%M UTC")])
    writer.writerow([])
    writer.writerow(["section", "id", "nom", "role/type", "statut", "montant_attendu", "montant_paye", "date", "details"])

    for member, user in data["members"]:
        writer.writerow(["membre", member.id, full_name(user), member.role, member.status, "", "", member.joined_at, f"numero={member.member_number}; passage={member.payout_position}"])
    for contribution in data["contributions"]:
        writer.writerow(["cotisation", contribution.id, "", f"cycle {contribution.cycle_number}", contribution.status, contribution.amount_due, contribution.amount_paid, contribution.due_date, f"payee_le={contribution.paid_at or ''}; preuve={contribution.receipt_url or ''}"])
    for contribution in data["late_contributions"]:
        writer.writerow(["retard", contribution.id, "", f"cycle {contribution.cycle_number}", contribution.status, contribution.amount_due, contribution.amount_paid, contribution.due_date, "cotisation en retard"])
    for incident in data["incidents"]:
        writer.writerow(["incident", incident.id, incident.title, incident.type, incident.status, incident.amount or "", "", incident.created_at, incident.description or ""])
    for vote in data["votes"]:
        writer.writerow(["vote", vote.id, vote.title, vote.type, vote.status, "", "", vote.created_at, vote.description or ""])
    for action in data["admin_actions"]:
        writer.writerow(["historique", action.id, "", action.action, "", "", "", action.created_at, action.reason or ""])

    log_tontine_admin_action(db, current_user, tontine_id, "tontine_export_csv", metadata={"filename": filename})
    db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/admin/{tontine_id}/export.pdf")
def export_tontine_pdf(
    tontine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tontine = require_tontine_admin(db, tontine_id, current_user)
    exported_at = datetime.now(timezone.utc)
    filename = export_filename(tontine.name, "pdf", exported_at)
    data = collect_tontine_export_data(db, tontine_id)
    lines = [
        "FasoTontine - Export administration tontine",
        f"Date export: {exported_at.strftime('%Y-%m-%d %H:%M UTC')}",
        f"Nom: {tontine.name}",
        f"Statut: {tontine.status}",
        f"Montant cotisation: {tontine.contribution_amount} {tontine.currency}",
        "",
        "Statistiques",
        f"- Membres: {len(data['members'])}",
        f"- Cotisations: {len(data['contributions'])}",
        f"- Retards: {len(data['late_contributions'])}",
        f"- Incidents: {len(data['incidents'])}",
        f"- Historique admin: {len(data['admin_actions'])}",
        "",
        "Membres",
    ]
    lines.extend([f"- {full_name(user)} | {member.role} | {member.status}" for member, user in data["members"][:20]])
    lines.append("")
    lines.append("Cotisations")
    lines.extend([f"- Cycle {item.cycle_number} | {item.due_date} | {item.amount_paid}/{item.amount_due} XOF | {item.status}" for item in data["contributions"][:25]])
    lines.append("")
    lines.append("Retards")
    lines.extend([f"- Cycle {item.cycle_number} | echeance {item.due_date} | {item.amount_due} XOF | {item.status}" for item in data["late_contributions"][:20]] or ["- Aucun retard actif"])
    lines.append("")
    lines.append("Incidents")
    lines.extend([f"- {item.title} | {item.type} | {item.status} | {item.amount or ''}" for item in data["incidents"][:20]] or ["- Aucun incident"])
    lines.append("")
    lines.append("Historique")
    lines.extend([f"- {item.created_at.date()} | {item.action} | {item.reason or ''}" for item in data["admin_actions"][:20]] or ["- Aucun historique admin"])

    log_tontine_admin_action(db, current_user, tontine_id, "tontine_export_pdf", metadata={"filename": filename})
    db.commit()
    pdf = build_simple_pdf(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def require_tontine_admin(db: Session, tontine_id: UUID, user: User) -> Tontine:
    tontine = db.get(Tontine, tontine_id)
    if tontine is None:
        raise NotFoundError("Tontine introuvable.")
    if tontine.organizer_id == user.id:
        return tontine
    membership = db.scalars(
        select(TontineMember).where(
            TontineMember.tontine_id == tontine_id,
            TontineMember.user_id == user.id,
            TontineMember.role == "administrator",
            TontineMember.status.in_(["active", "up_to_date", "current_beneficiary", "next_beneficiary"]),
        )
    ).first()
    if membership is None:
        raise ForbiddenError("Acces reserve aux administrateurs de cette tontine.")
    return tontine


def can_view_tontine(db: Session, tontine: Tontine, user: User) -> bool:
    if tontine.organizer_id == user.id:
        return True
    return db.scalars(
        select(TontineMember).where(
            TontineMember.tontine_id == tontine.id,
            TontineMember.user_id == user.id,
            TontineMember.status != "removed",
        )
    ).first() is not None


def tontine_summary(db: Session, tontine: Tontine) -> dict:
    members_count = db.scalar(select(func.count(TontineMember.id)).where(TontineMember.tontine_id == tontine.id)) or 0
    contributions_count = db.scalar(select(func.count(Contribution.id)).where(Contribution.tontine_id == tontine.id)) or 0
    late_count = db.scalar(select(func.count(Contribution.id)).where(Contribution.tontine_id == tontine.id, Contribution.status == "late")) or 0
    paid_count = db.scalar(select(func.count(Contribution.id)).where(Contribution.tontine_id == tontine.id, Contribution.status == "paid")) or 0
    return {
        "id": str(tontine.id),
        "name": tontine.name,
        "description": tontine.description,
        "organizer_id": str(tontine.organizer_id),
        "contribution_amount": float(tontine.contribution_amount),
        "currency": tontine.currency,
        "frequency": tontine.frequency,
        "start_date": tontine.start_date.isoformat() if tontine.start_date else None,
        "max_members": tontine.max_members,
        "rules": tontine.rules or {},
        "payout_order_locked": tontine.payout_order_locked,
        "status": tontine.status,
        "members_count": members_count,
        "contributions_count": contributions_count,
        "late_contributions_count": late_count,
        "paid_contributions_count": paid_count,
        "created_at": tontine.created_at.isoformat() if tontine.created_at else None,
        "updated_at": tontine.updated_at.isoformat() if tontine.updated_at else None,
    }


def list_tontine_members_payload(db: Session, tontine_id: UUID) -> list[dict]:
    tontine = db.get(Tontine, tontine_id)
    rows = db.execute(
        select(TontineMember, User)
        .join(User, TontineMember.user_id == User.id)
        .where(TontineMember.tontine_id == tontine_id, TontineMember.status != "removed")
        .order_by(TontineMember.member_number.asc().nulls_last(), User.first_name.asc())
    ).all()
    members = [
        {
            "id": str(member.id),
            "user_id": str(user.id),
            "full_name": full_name(user),
            "phone": user.phone,
            "email": user.email,
            "role": member.role,
            "status": member.status,
            "member_number": member.member_number,
            "payout_position": member.payout_position,
            "joined_at": member.joined_at.isoformat() if member.joined_at else None,
        }
        for member, user in rows
    ]
    if tontine and all(item["user_id"] != str(tontine.organizer_id) for item in members):
        organizer = db.get(User, tontine.organizer_id)
        if organizer:
            members.insert(
                0,
                {
                    "id": f"organizer-{tontine.id}",
                    "user_id": str(organizer.id),
                    "full_name": full_name(organizer),
                    "phone": organizer.phone,
                    "email": organizer.email,
                    "role": "administrator",
                    "status": "active",
                    "member_number": 1,
                    "payout_position": 1,
                    "joined_at": tontine.created_at.isoformat() if tontine.created_at else None,
                },
            )
    return members


def contribution_payload(item: Contribution) -> dict:
    return {
        "id": str(item.id),
        "member_id": str(item.member_id),
        "cycle_number": item.cycle_number,
        "due_date": item.due_date.isoformat() if item.due_date else None,
        "paid_at": item.paid_at.isoformat() if item.paid_at else None,
        "amount_due": float(item.amount_due),
        "amount_paid": float(item.amount_paid),
        "status": item.status,
        "receipt_url": item.receipt_url,
    }


def log_tontine_admin_action(
    db: Session,
    admin: User,
    tontine_id: UUID,
    action: str,
    *,
    target_user_id: UUID | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AdminAction(
            admin_id=admin.id,
            target_user_id=target_user_id,
            tontine_id=tontine_id,
            action=action,
            metadata_=metadata or {},
        )
    )


def collect_tontine_export_data(db: Session, tontine_id: UUID) -> dict:
    members = list(
        db.execute(
            select(TontineMember, User)
            .join(User, TontineMember.user_id == User.id)
            .where(TontineMember.tontine_id == tontine_id)
            .order_by(TontineMember.member_number.asc().nulls_last(), User.first_name.asc())
        ).all()
    )
    contributions = list(db.scalars(select(Contribution).where(Contribution.tontine_id == tontine_id).order_by(Contribution.due_date.asc())).all())
    return {
        "members": members,
        "contributions": contributions,
        "late_contributions": [item for item in contributions if item.status == "late"],
        "incidents": list(db.scalars(select(Incident).where(Incident.tontine_id == tontine_id).order_by(Incident.created_at.desc())).all()),
        "votes": list(db.scalars(select(Vote).where(Vote.tontine_id == tontine_id).order_by(Vote.created_at.desc())).all()),
        "admin_actions": list(db.scalars(select(AdminAction).where(AdminAction.tontine_id == tontine_id).order_by(AdminAction.created_at.desc())).all()),
    }


def full_name(user: User) -> str:
    return f"{user.first_name} {user.last_name}".strip()


def export_filename(tontine_name: str, extension: str, exported_at: datetime) -> str:
    safe_name = "".join(char.lower() if char.isalnum() else "-" for char in tontine_name).strip("-")
    safe_name = "-".join(part for part in safe_name.split("-") if part) or "tontine"
    return f"fasotontine-{safe_name}-{exported_at.strftime('%Y%m%d')}.{extension}"


def build_simple_pdf(lines: list[str]) -> bytes:
    commands = ["BT /F1 10 Tf 50 800 Td"]
    for index, line in enumerate(lines[:65]):
        escaped = escape_pdf_text(line[:110])
        commands.append(f"({escaped}) Tj")
        if index < len(lines[:65]) - 1:
            commands.append("0 -14 Td")
    commands.append("ET")
    stream = "\n".join(commands)
    objects = [
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(stream.encode('latin-1', errors='ignore'))} >> stream\n{stream}\nendstream endobj",
    ]
    content = "%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(content.encode("latin-1", errors="ignore")))
        content += obj + "\n"
    xref = len(content.encode("latin-1", errors="ignore"))
    content += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    content += "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    content += f"trailer << /Root 1 0 R /Size {len(objects) + 1} >>\nstartxref\n{xref}\n%%EOF"
    return content.encode("latin-1", errors="ignore")


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
