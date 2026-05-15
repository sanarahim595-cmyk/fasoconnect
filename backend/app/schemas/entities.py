from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import TimestampedRead


class PartialModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class UserBase(PartialModel):
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    first_name: str = Field(min_length=2, max_length=120)
    last_name: str = Field(min_length=2, max_length=120)
    birth_date: date | None = None
    gender: str | None = Field(default=None, max_length=24)
    address: str | None = None
    city: str | None = Field(default=None, max_length=120)
    country: str = Field(default="Burkina Faso", max_length=120)
    role: str = "utilisateur"
    status: str = "pending_verification"

    @field_validator("email")
    @classmethod
    def validate_email_shape(cls, value: str | None) -> str | None:
        if value and "@" not in value:
            raise ValueError("email invalide")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {"utilisateur", "administrateur_tontine", "administrateur_plateforme"}
        if value not in allowed:
            raise ValueError("role invalide")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value and not value.replace("+", "", 1).replace(" ", "").isdigit():
            raise ValueError("telephone invalide")
        return value


class UserCreate(UserBase):
    pass


class UserUpdate(PartialModel):
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    first_name: str | None = Field(default=None, min_length=2, max_length=120)
    last_name: str | None = Field(default=None, min_length=2, max_length=120)
    birth_date: date | None = None
    gender: str | None = Field(default=None, max_length=24)
    address: str | None = None
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    role: str | None = None
    status: str | None = None
    trust_score: Decimal | None = Field(default=None, ge=0, le=100)


class UserRead(UserBase, TimestampedRead):
    trust_score: Decimal
    last_login_at: datetime | None = None


class AuthLoginRequest(PartialModel):
    identifier: str = Field(min_length=3)
    method: str = Field(default="password", pattern="^(password|otp)$")
    password_or_otp: str = Field(min_length=4)


class AuthResponse(PartialModel):
    user: UserRead
    access_token: str
    token_type: str = "bearer"


class RegistrationWithCnibResponse(PartialModel):
    user: UserRead
    cnib: "CnibVerificationRead"
    access_token: str
    token_type: str = "demo"
    requires_manual_review: bool


class CnibVerificationCreate(PartialModel):
    user_id: UUID
    cnib_number: str = Field(min_length=4, max_length=80)
    first_name_extracted: str | None = None
    last_name_extracted: str | None = None
    birth_date_extracted: date | None = None
    document_front_url: str | None = None
    document_back_url: str | None = None
    selfie_url: str | None = None
    ocr_provider: str | None = None
    ocr_raw: dict[str, Any] | None = None
    status: str = "pending"


class CnibVerificationUpdate(PartialModel):
    status: str | None = None
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    ocr_raw: dict[str, Any] | None = None


class CnibVerificationRead(CnibVerificationCreate, TimestampedRead):
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None


class TontineCreate(PartialModel):
    name: str = Field(min_length=3, max_length=160)
    description: str | None = None
    organizer_id: UUID
    contribution_amount: Decimal = Field(gt=0)
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    frequency: str
    start_date: date
    end_date: date | None = None
    max_members: int | None = Field(default=None, gt=1)
    rules: dict[str, Any] = Field(default_factory=dict)
    payout_order_locked: bool = False
    status: str = "draft"

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        allowed = {"daily", "weekly", "monthly"}
        if value not in allowed:
            raise ValueError("La fréquence doit être quotidienne, hebdomadaire ou mensuelle.")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"draft", "active", "completed"}
        if value not in allowed:
            raise ValueError("Le statut doit être brouillon, active ou terminée.")
        return value


class TontineUpdate(PartialModel):
    name: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = None
    contribution_amount: Decimal | None = Field(default=None, gt=0)
    frequency: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    max_members: int | None = Field(default=None, gt=1)
    rules: dict[str, Any] | None = None
    payout_order_locked: bool | None = None
    status: str | None = None


class TontineRead(TontineCreate, TimestampedRead):
    pass


class TontineMemberCreate(PartialModel):
    tontine_id: UUID
    user_id: UUID
    member_number: int | None = Field(default=None, ge=1)
    payout_position: int | None = Field(default=None, ge=1)
    role: str = "member"
    status: str = "pending"

    @field_validator("role")
    @classmethod
    def validate_member_role(cls, value: str) -> str:
        allowed = {"member", "treasurer", "administrator"}
        if value not in allowed:
            raise ValueError("Le rôle doit être membre, trésorier ou administrateur.")
        return value


class TontineMemberUpdate(PartialModel):
    member_number: int | None = Field(default=None, ge=1)
    payout_position: int | None = Field(default=None, ge=1)
    role: str | None = None
    status: str | None = None
    validated_at: datetime | None = None
    left_at: datetime | None = None


class TontineMemberRead(TontineMemberCreate, TimestampedRead):
    joined_at: datetime
    validated_at: datetime | None = None
    left_at: datetime | None = None


class MemberInviteCreate(PartialModel):
    tontine_id: UUID
    full_name: str = Field(min_length=3, max_length=240)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    role: str = "member"
    guarantor_full_name: str = Field(min_length=3, max_length=240)
    guarantor_phone: str | None = Field(default=None, max_length=32)
    guarantor_email: str | None = Field(default=None, max_length=255)
    relationship: str | None = Field(default=None, max_length=120)

    @field_validator("role")
    @classmethod
    def validate_invite_role(cls, value: str) -> str:
        allowed = {"member", "treasurer", "administrator"}
        if value not in allowed:
            raise ValueError("Le rôle doit être membre, trésorier ou administrateur.")
        return value


class MemberInviteRead(PartialModel):
    member: TontineMemberRead
    guarantor: "GuarantorRead"
    invited_user: UserRead
    guarantor_user: UserRead
    message: str


class ContributionCreate(PartialModel):
    tontine_id: UUID
    member_id: UUID
    cycle_number: int = Field(ge=1)
    due_date: date
    amount_due: Decimal = Field(gt=0)
    amount_paid: Decimal = Field(default=0, ge=0)
    payment_method: str | None = None
    transaction_reference: str | None = None
    receipt_url: str | None = None
    status: str = "pending"

    @field_validator("status")
    @classmethod
    def validate_contribution_status(cls, value: str) -> str:
        allowed = {"paid", "pending", "late", "cancelled"}
        if value not in allowed:
            raise ValueError("Le statut doit etre paid, pending, late ou cancelled.")
        return value


class ContributionUpdate(PartialModel):
    paid_at: datetime | None = None
    amount_paid: Decimal | None = Field(default=None, ge=0)
    payment_method: str | None = None
    transaction_reference: str | None = None
    receipt_url: str | None = None
    status: str | None = None

    @field_validator("status")
    @classmethod
    def validate_contribution_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {"paid", "pending", "late", "cancelled"}
        if value not in allowed:
            raise ValueError("Le statut doit etre paid, pending, late ou cancelled.")
        return value


class ContributionRead(ContributionCreate, TimestampedRead):
    paid_at: datetime | None = None


class ContributionMarkPaid(PartialModel):
    amount_paid: Decimal = Field(gt=0)
    paid_at: datetime | None = None
    proof_url: str | None = None


class GuarantorCreate(PartialModel):
    tontine_id: UUID
    member_id: UUID
    guarantor_user_id: UUID
    relationship: str | None = None
    guarantee_limit: Decimal | None = Field(default=None, ge=0)
    status: str = "pending"


class GuarantorUpdate(PartialModel):
    relationship: str | None = None
    guarantee_limit: Decimal | None = Field(default=None, ge=0)
    accepted_at: datetime | None = None
    status: str | None = None


class GuarantorRead(GuarantorCreate, TimestampedRead):
    accepted_at: datetime | None = None


class IncidentCreate(PartialModel):
    tontine_id: UUID
    member_id: UUID | None = None
    contribution_id: UUID | None = None
    guarantor_id: UUID | None = None
    type: str
    severity: str = "medium"
    title: str = Field(min_length=3, max_length=180)
    description: str | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    status: str = "open"


class IncidentUpdate(PartialModel):
    severity: str | None = None
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = None
    amount: Decimal | None = Field(default=None, ge=0)
    status: str | None = None
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None


class IncidentRead(IncidentCreate, TimestampedRead):
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None


class OverdueScanResult(PartialModel):
    scanned: int
    marked_late: int
    incidents_created: int
    notifications_created: int


class PaymentIncidentAction(PartialModel):
    status: str
    note: str | None = None

    @field_validator("status")
    @classmethod
    def validate_payment_incident_status(cls, value: str) -> str:
        allowed = {"debt_resolved", "debt_pending", "guarantor_called"}
        if value not in allowed:
            raise ValueError("Le statut doit etre debt_resolved, debt_pending ou guarantor_called.")
        return value


class PaymentProblemRead(PartialModel):
    incident_id: UUID
    tontine_id: UUID
    member_id: UUID | None
    contribution_id: UUID | None
    guarantor_id: UUID | None = None
    member_name: str
    member_contact: str | None = None
    guarantor_name: str | None = None
    guarantor_contact: str | None = None
    due_date: date | None = None
    amount_due: Decimal | None = None
    amount_paid: Decimal | None = None
    contribution_status: str | None = None
    incident_status: str
    title: str
    description: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


class VoteCreate(PartialModel):
    tontine_id: UUID | None = None
    community_project_id: UUID | None = None
    created_by: UUID
    title: str = Field(min_length=3, max_length=180)
    description: str | None = None
    type: str
    status: str = "draft"
    opens_at: datetime | None = None
    closes_at: datetime | None = None
    quorum_percentage: Decimal = Field(default=50, ge=0, le=100)
    allow_multiple_choices: bool = False


class VoteUpdate(PartialModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = None
    status: str | None = None
    opens_at: datetime | None = None
    closes_at: datetime | None = None
    quorum_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    allow_multiple_choices: bool | None = None


class VoteRead(VoteCreate, TimestampedRead):
    pass


class VoteOptionCreate(PartialModel):
    vote_id: UUID
    label: str = Field(min_length=1, max_length=160)
    description: str | None = None
    position: int = Field(default=0, ge=0)


class VoteOptionUpdate(PartialModel):
    label: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    position: int | None = Field(default=None, ge=0)


class VoteOptionRead(VoteOptionCreate, TimestampedRead):
    pass


class VoteResponseCreate(PartialModel):
    vote_id: UUID
    option_id: UUID
    voter_id: UUID
    tontine_member_id: UUID | None = None
    comment: str | None = None


class VoteResponseUpdate(PartialModel):
    option_id: UUID | None = None
    comment: str | None = None


class VoteResponseRead(VoteResponseCreate, TimestampedRead):
    voted_at: datetime


class InternalVoteCreate(PartialModel):
    tontine_id: UUID | None = None
    community_project_id: UUID | None = None
    title: str = Field(min_length=3, max_length=180)
    description: str | None = None
    type: str
    deadline: datetime
    options: list[str] = Field(min_length=2)
    status: str = "open"
    allow_multiple_choices: bool = False

    @field_validator("type")
    @classmethod
    def validate_internal_vote_type(cls, value: str) -> str:
        allowed = {"rule_validation", "payout_order", "decision", "member_decision", "community_project"}
        if value not in allowed:
            raise ValueError("Type de vote invalide.")
        return value

    @field_validator("status")
    @classmethod
    def validate_internal_vote_status(cls, value: str) -> str:
        if value not in {"open", "closed"}:
            raise ValueError("Le statut doit etre open ou closed.")
        return value


class VoteAnswerCreate(PartialModel):
    option_id: UUID
    tontine_member_id: UUID | None = None
    comment: str | None = None


class VoteOptionResult(PartialModel):
    option_id: UUID
    label: str
    description: str | None = None
    position: int
    responses: int
    percentage: float


class VoteResultsRead(PartialModel):
    vote_id: UUID
    title: str
    description: str | None = None
    type: str
    status: str
    deadline: datetime | None = None
    results_visible: bool = True
    total_responses: int
    options: list[VoteOptionResult]


class ExpiredVotesResult(PartialModel):
    closed_votes: int


class CommunityProjectCreate(PartialModel):
    submitted_by: UUID
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=80)
    region: str | None = None
    city: str | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    target_amount: Decimal = Field(gt=0)
    collected_amount: Decimal = Field(default=0, ge=0)
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    vote_id: UUID | None = None
    beneficiaries: str | None = None
    justification: str | None = None
    photos: list[str] = Field(default_factory=list)
    status: str = "pending"
    starts_at: date | None = None
    ends_at: date | None = None

    @field_validator("category")
    @classmethod
    def validate_project_category(cls, value: str) -> str:
        allowed = {"eau", "ecole", "sante", "route", "energie_solaire", "environnement", "autre"}
        if value not in allowed:
            raise ValueError("Categorie de projet invalide.")
        return value

    @field_validator("status")
    @classmethod
    def validate_project_status(cls, value: str) -> str:
        if value not in {"pending", "approved", "rejected"}:
            raise ValueError("Le statut doit etre pending, approved ou rejected.")
        return value


class CommunityProjectUpdate(PartialModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, min_length=10)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    region: str | None = None
    city: str | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    target_amount: Decimal | None = Field(default=None, gt=0)
    collected_amount: Decimal | None = Field(default=None, ge=0)
    vote_id: UUID | None = None
    status: str | None = None
    starts_at: date | None = None
    ends_at: date | None = None

    @field_validator("category")
    @classmethod
    def validate_project_category(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {"eau", "ecole", "sante", "route", "energie_solaire", "environnement", "autre"}
        if value not in allowed:
            raise ValueError("Categorie de projet invalide.")
        return value

    @field_validator("status")
    @classmethod
    def validate_project_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in {"pending", "approved", "rejected"}:
            raise ValueError("Le statut doit etre pending, approved ou rejected.")
        return value


class CommunityProjectRead(CommunityProjectCreate, TimestampedRead):
    pass


class CommunityProjectSubmit(PartialModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10)
    category: str
    city: str = Field(min_length=2, max_length=120)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    photos: list[str] = Field(default_factory=list)
    target_amount: Decimal = Field(gt=0)
    beneficiaries: str = Field(min_length=2)
    justification: str = Field(min_length=10)

    @field_validator("category")
    @classmethod
    def validate_project_category(cls, value: str) -> str:
        allowed = {"eau", "ecole", "sante", "route", "energie_solaire", "environnement", "autre"}
        if value not in allowed:
            raise ValueError("Categorie de projet invalide.")
        return value


class CommunityProjectReview(PartialModel):
    status: str
    reason: str | None = None

    @field_validator("status")
    @classmethod
    def validate_review_status(cls, value: str) -> str:
        if value not in {"approved", "rejected"}:
            raise ValueError("Le statut doit etre approved ou rejected.")
        return value


class ProjectImageCreate(PartialModel):
    project_id: UUID
    uploaded_by: UUID | None = None
    image_url: str
    caption: str | None = None
    type: str = "progress"
    verification_status: str = "pending"
    taken_at: datetime | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)


class ProjectImageUpdate(PartialModel):
    image_url: str | None = None
    caption: str | None = None
    type: str | None = None
    verification_status: str | None = None
    taken_at: datetime | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)


class ProjectImageRead(ProjectImageCreate, TimestampedRead):
    pass


class NotificationCreate(PartialModel):
    user_id: UUID
    tontine_id: UUID | None = None
    project_id: UUID | None = None
    type: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=2)
    channel: str = "in_app"
    payload: dict[str, Any] = Field(default_factory=dict)
    status: str = "unread"


class NotificationUpdate(PartialModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    message: str | None = Field(default=None, min_length=2)
    channel: str | None = None
    payload: dict[str, Any] | None = None
    status: str | None = None
    read_at: datetime | None = None
    sent_at: datetime | None = None


class NotificationRead(NotificationCreate, TimestampedRead):
    read_at: datetime | None = None
    sent_at: datetime | None = None


class AdminActionCreate(PartialModel):
    admin_id: UUID
    target_user_id: UUID | None = None
    tontine_id: UUID | None = None
    project_id: UUID | None = None
    action: str = Field(min_length=2, max_length=120)
    reason: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    user_agent: str | None = None


class AdminActionUpdate(PartialModel):
    reason: str | None = None
    metadata: dict[str, Any] | None = None


class AdminActionRead(AdminActionCreate, TimestampedRead):
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_")
