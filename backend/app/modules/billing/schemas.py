import uuid
from datetime import date, datetime

from pydantic import BaseModel


class BillingPlanCreate(BaseModel):
    academy_id: uuid.UUID
    name: str
    price_per_ride: int
    monthly_cap: int | None = None


class BillingPlanResponse(BaseModel):
    id: uuid.UUID
    academy_id: uuid.UUID
    name: str
    price_per_ride: int
    monthly_cap: int | None
    is_active: bool

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    academy_id: uuid.UUID
    student_id: uuid.UUID
    billing_month: str
    total_rides: int
    amount: int
    status: str
    due_date: date
    paid_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateInvoicesRequest(BaseModel):
    academy_id: uuid.UUID
    billing_month: str  # "2026-03"


class GenerateInvoicesResponse(BaseModel):
    invoices_created: int
    total_amount: int
