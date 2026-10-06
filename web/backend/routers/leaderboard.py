from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import User
from schemas import LeaderboardEntry, MyRank, LeaderboardResponse
from auth import get_current_user

router = APIRouter(prefix="/api/leaderboard", tags=["排行榜"])


@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取排行榜（按总积分排序，前 20 名）"""
    users = db.query(User).order_by(desc(User.total_points)).limit(20).all()

    leaderboard = []
    my_rank = None

    for i, u in enumerate(users):
        entry = LeaderboardEntry(
            rank=i + 1,
            user_id=u.id,
            nickname=u.nickname,
            avatar=u.avatar,
            total_points=u.total_points,
            level=u.level,
            total_days=u.total_days,
        )
        leaderboard.append(entry)

        if u.id == user.id:
            my_rank = MyRank(
                rank=i + 1,
                user_id=u.id,
                nickname=u.nickname,
                total_points=u.total_points,
                level=u.level,
            )

    # 如果当前用户不在前 20 名，查询排名
    if my_rank is None:
        my_position = db.query(User).filter(
            User.total_points > user.total_points
        ).count() + 1
        my_rank = MyRank(
            rank=my_position,
            user_id=user.id,
            nickname=user.nickname,
            total_points=user.total_points,
            level=user.level,
        )

    return LeaderboardResponse(leaderboard=leaderboard, my_rank=my_rank)
