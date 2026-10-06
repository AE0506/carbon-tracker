from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, Action, Tree
from schemas import RecordCreate, RecordResponse, RecordListResponse, RecordCreateResponse
from auth import get_current_user
from carbon_algorithm import (
    calculate_carbon_score, calculate_carbon_points, is_low_carbon,
    calculate_tree_value, calculate_tree_level, calculate_level,
)

router = APIRouter(prefix="/api/records", tags=["打卡记录"])


def recompute_user_stats(db: Session, user: User) -> None:
    """从打卡记录重算用户汇总，避免更新/删除记录后统计漂移。"""
    actions = db.query(Action).filter(Action.user_id == user.id).order_by(Action.date.asc()).all()

    user.total_days = len(actions)
    user.total_points = sum(action.carbon_points for action in actions)
    user.total_trees = db.query(Tree).filter(Tree.user_id == user.id).count()
    user.low_carbon_count = sum(1 for action in actions if action.is_low_carbon)
    user.walk_count = sum(1 for action in actions if action.transport == "步行")
    user.vegan_count = sum(1 for action in actions if action.diet == "素食")
    user.level = calculate_level(user.total_points)

    if not actions:
        user.streak = 0
        user.max_streak = 0
        user.last_record_date = None
        return

    parsed_dates = []
    for action in actions:
        try:
            parsed_dates.append(date_type.fromisoformat(action.date))
        except ValueError:
            continue

    if not parsed_dates:
        user.streak = 0
        user.max_streak = 0
        user.last_record_date = actions[-1].date
        return

    max_streak = 1
    run_length = 1
    for previous, current in zip(parsed_dates, parsed_dates[1:]):
        if current == previous + timedelta(days=1):
            run_length += 1
        elif current != previous:
            run_length = 1
        max_streak = max(max_streak, run_length)

    latest = parsed_dates[-1]
    today = date_type.today()
    user.streak = run_length if latest >= today - timedelta(days=1) else 0
    user.max_streak = max_streak
    user.last_record_date = latest.isoformat()


@router.post("", response_model=RecordCreateResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    req: RecordCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """保存打卡记录（当天已存在则更新）"""
    today = date_type.today().isoformat()

    # 参数校验
    valid_transports = {"步行", "骑行", "公交", "地铁", "出租车", "私家车"}
    valid_diets = {"素食", "普通", "高碳"}
    valid_statuses = {"在家", "出行"}

    if req.transport not in valid_transports:
        raise HTTPException(status_code=400, detail=f"无效的出行方式: {req.transport}")
    if req.diet not in valid_diets:
        raise HTTPException(status_code=400, detail=f"无效的饮食: {req.diet}")
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"无效的状态: {req.status}")

    # 计算评分和积分
    score = calculate_carbon_score(req.transport, req.diet, req.status)
    points = calculate_carbon_points(score)
    low_carbon = is_low_carbon(score)
    tree_value = calculate_tree_value(score)
    tree_level = calculate_tree_level(tree_value)

    # 检查当天是否已有记录
    existing = db.query(Action).filter(
        Action.user_id == user.id, Action.date == today
    ).first()

    if existing:
        # 更新已有记录
        existing.transport = req.transport
        existing.diet = req.diet
        existing.status = req.status
        existing.carbon_score = score
        existing.carbon_points = points
        existing.is_low_carbon = 1 if low_carbon else 0
        existing.tree_value = tree_value
        existing.tree_level = tree_level
        action = existing
    else:
        # 创建新记录
        action = Action(
            user_id=user.id, date=today,
            transport=req.transport, diet=req.diet, status=req.status,
            carbon_score=score, carbon_points=points,
            is_low_carbon=1 if low_carbon else 0,
            tree_value=tree_value, tree_level=tree_level,
        )
        db.add(action)

    # 更新树木
    tree_existing = db.query(Tree).filter(
        Tree.user_id == user.id, Tree.date == today
    ).first()
    if tree_existing:
        tree_existing.carbon_score = score
        tree_existing.tree_value = tree_value
        tree_existing.tree_level = tree_level
    else:
        new_tree = Tree(
            user_id=user.id, date=today,
            carbon_score=score, tree_value=tree_value, tree_level=tree_level,
        )
        db.add(new_tree)

    db.flush()
    recompute_user_stats(db, user)
    db.commit()
    db.refresh(action)

    return RecordCreateResponse(
        id=action.id, date=action.date,
        transport=action.transport, diet=action.diet, status=action.status,
        carbon_score=action.carbon_score, carbon_points=action.carbon_points,
        is_low_carbon=bool(action.is_low_carbon),
        tree_value=action.tree_value, tree_level=action.tree_level,
        created_at=action.created_at.isoformat() if action.created_at else "",
        user={
            "level": user.level,
            "total_points": user.total_points,
            "total_trees": user.total_trees,
            "streak": user.streak,
            "total_days": user.total_days,
        },
    )


@router.get("", response_model=RecordListResponse)
def list_records(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取用户的打卡记录列表"""
    query = db.query(Action).filter(Action.user_id == user.id).order_by(Action.date.desc())
    total = query.count()
    actions = query.offset((page - 1) * per_page).limit(per_page).all()

    return RecordListResponse(
        records=[
            RecordResponse(
                id=a.id, date=a.date, transport=a.transport, diet=a.diet,
                status=a.status, carbon_score=a.carbon_score,
                carbon_points=a.carbon_points, is_low_carbon=bool(a.is_low_carbon),
                tree_value=a.tree_value, tree_level=a.tree_level,
                created_at=a.created_at.isoformat() if a.created_at else "",
            )
            for a in actions
        ],
        total=total, page=page, per_page=per_page,
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    date: str = Query(..., description="要删除的日期 YYYY-MM-DD"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除某天的打卡记录（仅限当天）"""
    today = date_type.today().isoformat()
    if date != today:
        raise HTTPException(status_code=400, detail="只能删除当天的记录")

    action = db.query(Action).filter(
        Action.user_id == user.id, Action.date == date
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="记录不存在")

    tree = db.query(Tree).filter(
        Tree.user_id == user.id, Tree.date == date
    ).first()

    db.delete(action)
    if tree:
        db.delete(tree)

    # 回退用户统计
    user.total_points = max(0, user.total_points - action.carbon_points)
    user.total_days = max(0, user.total_days - 1)
    user.total_trees = max(0, user.total_trees - 1)
    if action.is_low_carbon:
        user.low_carbon_count = max(0, user.low_carbon_count - 1)

    db.flush()
    recompute_user_stats(db, user)
    db.commit()
