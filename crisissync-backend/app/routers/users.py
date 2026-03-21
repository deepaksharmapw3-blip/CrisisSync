"""Users Router — Profile management, duty status, responder list."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import get_current_user, get_current_staff
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from typing import List

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    update_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    for field, value in update_in.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/responders", response_model=List[UserResponse])
async def list_responders(
    on_duty_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """List all active responders — used for incident assignment dropdown."""
    query = select(User).where(
        User.role.in_([UserRole.responder, UserRole.manager]),
        User.is_active == True,
    )
    if on_duty_only:
        query = query.where(User.is_on_duty == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/me/duty", response_model=UserResponse)
async def toggle_duty(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Toggle on/off duty status for responders."""
    current_user.is_on_duty = not current_user.is_on_duty
    await db.flush()
    await db.refresh(current_user)
    return current_user
