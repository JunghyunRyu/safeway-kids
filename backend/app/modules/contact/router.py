from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.modules.contact.models import ContactInquiry
from app.modules.contact.schemas import ContactCreateRequest, ContactResponse
from app.rate_limit import limiter

router = APIRouter()


@router.post("/", response_model=ContactResponse, status_code=201)
@limiter.limit("5/minute")
async def create_contact_inquiry(
    request: Request,
    body: ContactCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> ContactInquiry:
    inquiry = ContactInquiry(
        name=body.name,
        phone=body.phone,
        inquiry_type=body.inquiry_type,
        message=body.message,
    )
    db.add(inquiry)
    await db.flush()
    return inquiry
