import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("phone IS NOT NULL OR email IS NOT NULL", name="users_contact_required"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str | None] = mapped_column(Text)
    birth_date: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(24))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(120), default="Burkina Faso")
    role: Mapped[str] = mapped_column(String(32), default="utilisateur")
    trust_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("50.00"))
    status: Mapped[str] = mapped_column(String(32), default="pending_verification")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    tontines = relationship("Tontine", back_populates="organizer")
    memberships = relationship("TontineMember", back_populates="user")


class CnibVerification(Base, TimestampMixin):
    __tablename__ = "cnib_verifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    cnib_number: Mapped[str] = mapped_column(String(80))
    first_name_extracted: Mapped[str | None] = mapped_column(String(120))
    last_name_extracted: Mapped[str | None] = mapped_column(String(120))
    birth_date_extracted: Mapped[date | None] = mapped_column(Date)
    document_front_url: Mapped[str | None] = mapped_column(Text)
    document_back_url: Mapped[str | None] = mapped_column(Text)
    selfie_url: Mapped[str | None] = mapped_column(Text)
    ocr_provider: Mapped[str | None] = mapped_column(String(80))
    ocr_raw: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)


class Tontine(Base, TimestampMixin):
    __tablename__ = "tontines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    organizer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    contribution_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3), default="XOF")
    frequency: Mapped[str] = mapped_column(String(32))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    max_members: Mapped[int | None] = mapped_column(Integer)
    rules: Mapped[dict] = mapped_column(JSON, default=dict)
    payout_order_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="draft")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organizer = relationship("User", back_populates="tontines")
    members = relationship("TontineMember", back_populates="tontine")


class TontineMember(Base, TimestampMixin):
    __tablename__ = "tontine_members"
    __table_args__ = (
        UniqueConstraint("tontine_id", "user_id", name="tontine_members_unique_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tontine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    member_number: Mapped[int | None] = mapped_column(Integer)
    payout_position: Mapped[int | None] = mapped_column(Integer)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    role: Mapped[str] = mapped_column(String(32), default="member")
    status: Mapped[str] = mapped_column(String(32), default="pending")

    tontine = relationship("Tontine", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Contribution(Base, TimestampMixin):
    __tablename__ = "contributions"
    __table_args__ = (
        UniqueConstraint("tontine_id", "member_id", "cycle_number", name="contributions_unique_cycle_member"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tontine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    member_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontine_members.id", ondelete="CASCADE"))
    cycle_number: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    amount_due: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    payment_method: Mapped[str | None] = mapped_column(String(48))
    transaction_reference: Mapped[str | None] = mapped_column(String(160))
    receipt_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="pending")


class Guarantor(Base, TimestampMixin):
    __tablename__ = "guarantors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tontine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    member_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontine_members.id", ondelete="CASCADE"))
    guarantor_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    relationship: Mapped[str | None] = mapped_column(String(120))
    guarantee_limit: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), default="pending")


class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tontine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    member_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tontine_members.id", ondelete="SET NULL"))
    contribution_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contributions.id", ondelete="SET NULL"))
    guarantor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("guarantors.id", ondelete="SET NULL"))
    type: Mapped[str] = mapped_column(String(48))
    severity: Mapped[str] = mapped_column(String(24), default="medium")
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(32), default="open")
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Vote(Base, TimestampMixin):
    __tablename__ = "votes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tontine_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    community_project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("community_projects.id", ondelete="SET NULL"))
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(48))
    status: Mapped[str] = mapped_column(String(32), default="draft")
    opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    quorum_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("50.00"))
    allow_multiple_choices: Mapped[bool] = mapped_column(Boolean, default=False)


class VoteOption(Base, TimestampMixin):
    __tablename__ = "vote_options"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vote_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("votes.id", ondelete="CASCADE"))
    label: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, default=0)


class VoteResponse(Base, TimestampMixin):
    __tablename__ = "vote_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vote_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("votes.id", ondelete="CASCADE"))
    option_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vote_options.id", ondelete="CASCADE"))
    voter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    tontine_member_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tontine_members.id", ondelete="SET NULL"))
    comment: Mapped[str | None] = mapped_column(Text)
    voted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CommunityProject(Base, TimestampMixin):
    __tablename__ = "community_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80))
    region: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    target_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    collected_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    currency: Mapped[str] = mapped_column(String(3), default="XOF")
    vote_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("votes.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(32), default="submitted")
    beneficiaries: Mapped[str | None] = mapped_column(Text)
    justification: Mapped[str | None] = mapped_column(Text)
    starts_at: Mapped[date | None] = mapped_column(Date)
    ends_at: Mapped[date | None] = mapped_column(Date)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ProjectImage(Base, TimestampMixin):
    __tablename__ = "project_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("community_projects.id", ondelete="CASCADE"))
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    image_url: Mapped[str] = mapped_column(Text)
    caption: Mapped[str | None] = mapped_column(String(240))
    type: Mapped[str] = mapped_column(String(48), default="progress")
    verification_status: Mapped[str] = mapped_column(String(32), default="pending")
    taken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    tontine_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tontines.id", ondelete="CASCADE"))
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("community_projects.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String(32), default="in_app")
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="unread")
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AdminAction(Base, TimestampMixin):
    __tablename__ = "admin_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    tontine_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tontines.id", ondelete="SET NULL"))
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("community_projects.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(120))
    reason: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    ip_address: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(Text)
