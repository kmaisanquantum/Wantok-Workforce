from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, Column, String, DECIMAL
from geoalchemy2 import Geometry
from pydantic import BaseModel

class UserBase(SQLModel):
    name: str
    email: str = Field(unique=True, index=True)
    phone_number: str
    whatsapp_number: Optional[str] = None
    physical_address: Optional[str] = None
    role: str = Field(default="customer") # 'customer', 'provider', 'admin'
    is_available: bool = Field(default=True)
    status: str = Field(default="active") # 'active', 'suspended'
    trust_score: Decimal = Field(default=Decimal("0.00"), sa_column=Column(DECIMAL(10, 2)))
    wallet_total_earned: Decimal = Field(default=Decimal("0.00"), sa_column=Column(DECIMAL(10, 2)))
    wallet_in_escrow: Decimal = Field(default=Decimal("0.00"), sa_column=Column(DECIMAL(10, 2)))
    wallet_mobile_balance: Decimal = Field(default=Decimal("0.00"), sa_column=Column(DECIMAL(10, 2)))
    location_name: Optional[str] = None
    location_coords: Optional[str] = Field(sa_column=Column(Geometry("POINT", srid=4326)))

class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BookingBase(SQLModel):
    customer_id: int = Field(foreign_key="users.id")
    provider_id: Optional[int] = Field(default=None, foreign_key="users.id")
    service_type: str
    status: str = Field(default="pending") # 'pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled'
    price: Decimal = Field(sa_column=Column(DECIMAL(10, 2)))
    payout_status: str = Field(default="pending")

class Booking(BookingBase, table=True):
    __tablename__ = "bookings"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MatchBase(SQLModel):
    booking_id: int = Field(foreign_key="bookings.id")
    provider_id: int = Field(foreign_key="users.id")
    score: Decimal = Field(sa_column=Column(DECIMAL(5, 2)))
    status: str = Field(default="proposed")

class Match(MatchBase, table=True):
    __tablename__ = "matches"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SystemSetting(SQLModel, table=True):
    __tablename__ = "system_settings"
    key: str = Field(primary_key=True)
    value: str
    group_category: str = Field(default="general")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Pydantic Schemas for API
class UserUpdate(BaseModel):
    is_available: Optional[bool] = None
    status: Optional[str] = None
    role: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    service_type: str
    status: str
    price: Decimal
    provider_id: Optional[int]

class DashboardMetrics(BaseModel):
    total_customers: int
    total_providers: int
    completed_matches: int
    escrow_capital: Decimal
    platform_revenue: Decimal

class UserCreate(BaseModel):
    name: str
    email: str
    phone_number: str
    whatsapp_number: Optional[str] = None
    physical_address: Optional[str] = None
    password: str
    role: str = "customer"

class CustomerSavedLocation(SQLModel, table=True):
    __tablename__ = "customer_saved_locations"
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="users.id", index=True)
    location_label: str = Field(index=True)
    address_line: str
    coordinates: Optional[str] = Field(sa_column=Column(Geometry("POINT", srid=4326)))
    is_default: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
