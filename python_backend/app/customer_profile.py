from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlmodel import Session, select
from .models import User, CustomerSavedLocation
from .database import get_session
from .dependencies import get_current_user
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

router = APIRouter(prefix="/api/customer/profile", tags=["Customer Profile Engine"])

class LocationPayload(BaseModel):
    label: str
    address_line: str
    latitude: float
    longitude: float
    is_default: bool = False

class CustomerProfileUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    whatsapp_number: Optional[str] = None
    physical_address: Optional[str] = None
    saved_locations: Optional[List[LocationPayload]] = None

@router.put("/update")
async def update_customer_profile(
    payload: CustomerProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        # 1. Update Core Information
        if payload.email:
            current_user.email = payload.email
        if payload.phone_number:
            current_user.phone_number = payload.phone_number
        if payload.whatsapp_number:
            current_user.whatsapp_number = payload.whatsapp_number
        if payload.physical_address:
            current_user.physical_address = payload.physical_address

        session.add(current_user)

        # 2. Process Saved Locations Array
        if payload.saved_locations is not None:
            # If resetting defaults, mark previous as false
            if any(loc.is_default for loc in payload.saved_locations):
                statement = select(CustomerSavedLocation).where(CustomerSavedLocation.customer_id == current_user.id)
                existing_locs = session.exec(statement).all()
                for eloc in existing_locs:
                    eloc.is_default = False
                    session.add(eloc)

            for loc in payload.saved_locations:
                # Insert or Update the location record using PostGIS point conversion
                # coordinates=func.ST_SetSRID(func.ST_MakePoint(loc.longitude, loc.latitude), 4326)
                # But in SQLModel we often use geoalchemy2 types.
                # coordinates=WKTElement(f"POINT({loc.longitude} {loc.latitude})", srid=4326)

                point = Point(loc.longitude, loc.latitude)
                new_loc = CustomerSavedLocation(
                    customer_id=current_user.id,
                    location_label=loc.label,
                    address_line=loc.address_line,
                    coordinates=from_shape(point, srid=4326),
                    is_default=loc.is_default
                )
                session.add(new_loc)

        session.commit()
        return {"status": "success", "message": "E-commerce contact profile securely updated."}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
