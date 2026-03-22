"""Admin module schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: str | None = None
    user_name: str | None = None
    action: str
    entity_type: str
    entity_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedAuditLogResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int


class NotificationLogResponse(BaseModel):
    id: uuid.UUID
    recipient_user_id: uuid.UUID | None = None
    recipient_phone: str | None = None
    channel: str
    notification_type: str
    title: str | None = None
    body: str | None = None
    status: str
    error_message: str | None = None
    sent_at: datetime

    model_config = {"from_attributes": True}


class PaginatedNotificationLogResponse(BaseModel):
    items: list[NotificationLogResponse]
    total: int


class StudentSearchResult(BaseModel):
    id: uuid.UUID
    name: str
    date_of_birth: str | None = None
    grade: str | None = None
    guardian_name: str | None = None
    guardian_phone: str | None = None
    academy_name: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class SupportTicketCreateRequest(BaseModel):
    category: str
    subject: str
    description: str


class SupportTicketUpdateRequest(BaseModel):
    status: str | None = None
    assigned_to: str | None = None


class SupportTicketResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    category: str
    subject: str
    description: str
    status: str
    assigned_to: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTicketResponse(BaseModel):
    items: list[SupportTicketResponse]
    total: int


class AcademyStatsResponse(BaseModel):
    total_schedules: int
    completed: int
    cancelled: int
    no_show: int
    on_time_rate: float
    avg_delay_minutes: float


class BoardingStatusItem(BaseModel):
    student_id: uuid.UUID
    student_name: str
    academy_name: str | None = None
    status: str
    pickup_time: str | None = None
    boarded_at: datetime | None = None
    alighted_at: datetime | None = None


class BoardingStatusResponse(BaseModel):
    total: int
    scheduled: int
    boarded: int
    completed: int
    cancelled: int
    no_show: int
    items: list[BoardingStatusItem]


class InternalNoteCreateRequest(BaseModel):
    entity_type: str  # user / academy / ticket / vehicle
    entity_id: str
    content: str


class InternalNoteResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: str
    author_id: uuid.UUID
    author_name: str | None = None
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SupportStatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    avg_resolution_hours: float | None = None


class MonthlyReportResponse(BaseModel):
    month: str
    total_schedules: int
    completed: int
    cancelled: int
    no_show: int
    on_time_rate: float
    avg_delay_minutes: float
    daily_breakdown: list[dict]


class DriverInfoResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    is_active: bool
    license_number: str | None = None
    license_type: str | None = None
    license_expiry: str | None = None
    criminal_check_date: str | None = None
    criminal_check_clear: bool = False
    safety_training_date: str | None = None
    safety_training_expiry: str | None = None
    is_qualified: bool = False

    model_config = {"from_attributes": True}
