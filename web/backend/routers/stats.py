from datetime import date, timedelta, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, Action
from schemas import (
    WeekDayStat, WeekSummary, WeekStatsResponse,
    MonthRecord, MonthSummary, MonthStatsResponse,
)
from auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["统计"])

WEEKDAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


@router.get("/week", response_model=WeekStatsResponse)
def get_week_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取本周统计数据"""
    today = date.today()
    monday = today - timedelta(days=today.weekday())

    week_days = []
    scores = []

    for i in range(7):
        d = monday + timedelta(days=i)
        date_str = d.isoformat()

        action = db.query(Action).filter(
            Action.user_id == user.id, Action.date == date_str
        ).first()

        scored = action is not None
        week_days.append(WeekDayStat(
            date=date_str,
            weekday=WEEKDAY_NAMES[i],
            scored=scored,
            score=action.carbon_score if action else None,
            points=action.carbon_points if action else 0,
            is_low_carbon=bool(action.is_low_carbon) if action else False,
            is_today=(date_str == today.isoformat()),
        ))
        if action:
            scores.append(action.carbon_score)

    if scores:
        summary = WeekSummary(
            avg_score=round(sum(scores) / len(scores), 1),
            total_points=sum(a.carbon_points for a in db.query(Action).filter(
                Action.user_id == user.id,
                Action.date >= monday.isoformat(),
                Action.date <= today.isoformat(),
            ).all()),
            low_carbon_days=sum(1 for s in scores if s <= 3),
            max_score=max(scores),
            min_score=min(scores),
        )
    else:
        summary = WeekSummary(
            avg_score=0, total_points=0,
            low_carbon_days=0, max_score=0, min_score=0,
        )

    return WeekStatsResponse(week_days=week_days, summary=summary)


@router.get("/month", response_model=MonthStatsResponse)
def get_month_stats(
    year: int = Query(..., ge=2020, le=2099),
    month: int = Query(..., ge=1, le=12),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定月份的统计数据"""
    start_date = f"{year:04d}-{month:02d}-01"
    if month == 12:
        end_date = f"{year+1:04d}-01-01"
    else:
        end_date = f"{year:04d}-{month+1:02d}-01"

    actions = db.query(Action).filter(
        Action.user_id == user.id,
        Action.date >= start_date,
        Action.date < end_date,
    ).order_by(Action.date.desc()).all()

    records = [
        MonthRecord(
            date=a.date, score=a.carbon_score, points=a.carbon_points,
            is_low_carbon=bool(a.is_low_carbon), tree_level=a.tree_level,
        )
        for a in actions
    ]

    if records:
        scores = [r.score for r in records]
        summary = MonthSummary(
            total_days=len(records),
            total_points=sum(r.points for r in records),
            avg_score=round(sum(scores) / len(scores), 1),
            low_carbon_days=sum(1 for s in scores if s <= 3),
        )
    else:
        summary = MonthSummary(
            total_days=0, total_points=0, avg_score=0, low_carbon_days=0,
        )

    return MonthStatsResponse(records=records, summary=summary)
