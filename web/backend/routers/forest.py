from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User, Tree
from schemas import TreeResponse, ForestStats, ForestResponse
from auth import get_current_user

router = APIRouter(prefix="/api/forest", tags=["森林"])


@router.get("", response_model=ForestResponse)
def get_forest(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取用户的森林数据"""
    trees = db.query(Tree).filter(
        Tree.user_id == user.id
    ).order_by(Tree.date.desc()).limit(90).all()

    stats = ForestStats(
        total_trees=user.total_trees,
        level_1_count=db.query(Tree).filter(
            Tree.user_id == user.id, Tree.tree_level == 1
        ).count(),
        level_2_count=db.query(Tree).filter(
            Tree.user_id == user.id, Tree.tree_level == 2
        ).count(),
        level_3_count=db.query(Tree).filter(
            Tree.user_id == user.id, Tree.tree_level == 3
        ).count(),
        level_4_count=db.query(Tree).filter(
            Tree.user_id == user.id, Tree.tree_level == 4
        ).count(),
    )

    return ForestResponse(
        trees=[
            TreeResponse(
                id=t.id, date=t.date, carbon_score=t.carbon_score,
                tree_value=t.tree_value, tree_level=t.tree_level,
                created_at=t.created_at.isoformat() if t.created_at else "",
            )
            for t in trees
        ],
        stats=stats,
    )
