from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, create_engine, select, func, and_
from typing import List
from .models import User, Booking, SystemSetting, Match, UserUpdate, DashboardMetrics, BookingResponse, UserCreate
from .auth import get_current_user_id, security
from decimal import Decimal
import os

app = FastAPI(title="Wantok Workforce API")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/wantok")
engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security), session: Session = Depends(get_session)):
    sub = await get_current_user_id(auth)
    user = session.get(User, sub)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def require_role(role: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return user
    return role_checker

# --- CUSTOMER MODULE ---
@app.get("/customer/bookings", response_model=List[BookingResponse])
def get_customer_bookings(user: User = Depends(require_role("customer")), session: Session = Depends(get_session)):
    statement = select(Booking).where(Booking.customer_id == user.id)
    return session.exec(statement).all()

@app.post("/customer/bookings/{booking_id}/confirm-and-pay")
def initiate_escrow(booking_id: int, user: User = Depends(require_role("customer")), session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "assigned":
        raise HTTPException(status_code=400, detail="Only assigned bookings can be paid for")

    booking.status = "accepted"
    booking.payout_status = "escrowed"
    session.add(booking)
    session.commit()
    return {"success": True, "status": booking.status}

@app.post("/customer/bookings/{booking_id}/release")
def release_escrow(booking_id: int, user: User = Depends(require_role("customer")), session: Session = Depends(get_session)):
    booking = session.get(Booking, booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted bookings can be released to completed")

    booking.status = "completed"
    booking.payout_status = "disbursed"
    session.add(booking)
    session.commit()
    return {"success": True, "status": "completed"}

@app.get("/customer/categories")
def get_categories(session: Session = Depends(get_session)):
    # Simple mock return or query from a categories table
    return ["Plumbing", "Electrical", "Legal", "Medical", "Carpentry"]

# --- PROVIDER MODULE ---
@app.post("/provider/availability")
def toggle_availability(is_available: bool, user: User = Depends(require_role("provider")), session: Session = Depends(get_session)):
    user.is_available = is_available
    session.add(user)
    session.commit()
    return {"success": True, "is_available": user.is_available}

@app.get("/provider/wallet")
def get_provider_wallet(user: User = Depends(require_role("provider"))):
    return {
        "total_earned": user.wallet_total_earned,
        "in_escrow": user.wallet_in_escrow,
        "mobile_wallet": user.wallet_mobile_balance
    }

# --- ADMIN MODULE ---
@app.get("/admin/dashboard", response_model=DashboardMetrics)
def get_admin_dashboard(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    total_customers = session.exec(select(func.count()).select_from(User).where(User.role == "customer")).one()
    total_providers = session.exec(select(func.count()).select_from(User).where(User.role == "provider")).one()
    completed_matches = session.exec(select(func.count()).select_from(Booking).where(Booking.status == "completed")).one()

    escrow_capital = session.exec(select(func.sum(Booking.price)).where(Booking.payout_status == "escrowed")).one() or Decimal("0.00")
    platform_revenue = session.exec(select(func.count() * Decimal("10.00")).select_from(Booking).where(Booking.status == "completed")).one() or Decimal("0.00")

    return {
        "total_customers": total_customers,
        "total_providers": total_providers,
        "completed_matches": completed_matches,
        "escrow_capital": escrow_capital,
        "platform_revenue": platform_revenue
    }

@app.put("/admin/users/{user_id}/status")
def admin_update_user(user_id: int, update: UserUpdate, user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    target = session.get(User, user_id)
    if not target: raise HTTPException(404)
    if update.status: target.status = update.status
    if update.role: target.role = update.role
    if update.is_available is not None: target.is_available = update.is_available
    session.add(target)
    session.commit()
    return {"success": True}

@app.post("/admin/users", status_code=201)
def admin_create_user(payload: UserCreate, user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    from .auth import get_password_hash
    new_user = User(
        name=payload.name,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=get_password_hash(payload.password),
        role=payload.role
    )
    session.add(new_user)
    session.commit()
    return {"success": True, "id": new_user.id}

@app.post("/admin/queue/{match_id}/review")
def review_match(match_id: int, is_flagged: bool, user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    match = session.get(Match, match_id)
    if not match: raise HTTPException(404)
    match.status = "flagged" if is_flagged else "reviewed"
    session.add(match)
    session.commit()
    return {"success": True, "status": match.status}

# DYNAMIC ENGINE CONTROLS
MATCH_ENGINE_CACHE = {"radius": 50, "fee": 10.00}

@app.post("/admin/engine/reload")
def reload_engine(user: User = Depends(require_role("admin")), session: Session = Depends(get_session)):
    radius = session.get(SystemSetting, "postgis_search_radius_km")
    fee = session.get(SystemSetting, "global_fee_metric_kina")

    if radius: MATCH_ENGINE_CACHE["radius"] = float(radius.value)
    if fee: MATCH_ENGINE_CACHE["fee"] = float(fee.value)

    return {"success": True, "reloaded_values": MATCH_ENGINE_CACHE}

# GEOSPATIAL SEARCH
@app.get("/match/search")
def search_workers(lat: float, lon: float, session: Session = Depends(get_session)):
    radius_km = MATCH_ENGINE_CACHE["radius"]
    point = f"SRID=4326;POINT({lon} {lat})"

    statement = select(User).where(
        and_(
            User.role == "provider",
            User.is_available == True,
            func.ST_DWithin(User.location_coords, func.ST_GeogFromText(point), radius_km * 1000)
        )
    )
    return session.exec(statement).all()
