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


class BillingPlanUpdateRequest(BaseModel):
    name: str | None = None
    price_per_ride: int | None = None
    monthly_cap: int | None = None
    is_active: bool | None = None


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
    academy_name: str | None = None
    student_name: str | None = None

    model_config = {"from_attributes": True}


class GenerateInvoicesRequest(BaseModel):
    academy_id: uuid.UUID
    billing_month: str  # "2026-03"


class GenerateInvoicesResponse(BaseModel):
    invoices_created: int
    total_amount: int


# --- PG (Toss Payments) schemas ---


class PaymentPrepareRequest(BaseModel):
    invoice_id: uuid.UUID


class PaymentPrepareResponse(BaseModel):
    order_id: str
    amount: int
    order_name: str
    client_key: str
    customer_name: str | None = None


class PaymentConfirmRequest(BaseModel):
    payment_key: str
    order_id: str
    amount: int


class PaymentConfirmResponse(BaseModel):
    payment_id: uuid.UUID
    invoice_id: uuid.UUID
    amount: int
    status: str
    pg_payment_key: str
    pg_status: str


class TossWebhookPayload(BaseModel):
    """Toss Payments webhook event body."""
    event_type: str | None = None
    data: dict | None = None
