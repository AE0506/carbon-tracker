from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, UniqueConstraint, Index, func
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    nickname = Column(String(64), nullable=False, default="低碳践行者")
    avatar = Column(Text, nullable=False, default="")

    level = Column(Integer, nullable=False, default=1)
    total_points = Column(Integer, nullable=False, default=0)
    total_days = Column(Integer, nullable=False, default=0)
    total_trees = Column(Integer, nullable=False, default=0)
    low_carbon_count = Column(Integer, nullable=False, default=0)
    walk_count = Column(Integer, nullable=False, default=0)
    vegan_count = Column(Integer, nullable=False, default=0)

    streak = Column(Integer, nullable=False, default=0)
    max_streak = Column(Integer, nullable=False, default=0)
    last_record_date = Column(String(10), nullable=True)

    created_at = Column(DateTime, server_default=func.now())


class Action(Base):
    """打卡记录"""
    __tablename__ = "actions"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
        Index("idx_user_date", "user_id", "date"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    date = Column(String(10), nullable=False)
    transport = Column(String(16), nullable=False)
    diet = Column(String(16), nullable=False)
    status = Column(String(16), nullable=False)
    carbon_score = Column(Float, nullable=False)
    carbon_points = Column(Integer, nullable=False)
    is_low_carbon = Column(Integer, nullable=False, default=0)
    tree_value = Column(Float, nullable=False, default=0)
    tree_level = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Tree(Base):
    """树木记录"""
    __tablename__ = "trees"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_tree_user_date"),
        Index("idx_tree_user_date", "user_id", "date"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    date = Column(String(10), nullable=False)
    carbon_score = Column(Float, nullable=False)
    tree_value = Column(Float, nullable=False)
    tree_level = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, server_default=func.now())
