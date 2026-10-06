from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import ProfileUpdate, UserResponse
from auth import get_current_user, create_avatar

router = APIRouter(prefix="/api/profile", tags=["资料"])


@router.patch("", response_model=UserResponse)
def update_profile(
    req: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新用户资料"""
    if req.nickname is not None:
        user.nickname = req.nickname
        user.avatar = create_avatar(user.nickname, user.id)

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id, username=user.username, nickname=user.nickname,
        avatar=user.avatar, level=user.level, total_points=user.total_points,
        total_days=user.total_days, total_trees=user.total_trees,
        low_carbon_count=user.low_carbon_count, walk_count=user.walk_count,
        vegan_count=user.vegan_count, streak=user.streak, max_streak=user.max_streak,
        last_record_date=user.last_record_date,
    )
