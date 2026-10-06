from pydantic import BaseModel, Field
from typing import Optional


# ── 认证 ──

class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=32)
    password: str = Field(min_length=6, max_length=64)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    level: int
    total_points: int
    total_days: int
    total_trees: int
    low_carbon_count: int
    walk_count: int
    vegan_count: int
    streak: int
    max_streak: int
    last_record_date: Optional[str] = None


class AuthResponse(UserResponse):
    access_token: str
    token_type: str = "bearer"


# ── 打卡记录 ──

class RecordCreate(BaseModel):
    transport: str = Field(description="步行/骑行/公交/地铁/出租车/私家车")
    diet: str = Field(description="素食/普通/高碳")
    status: str = Field(description="在家/出行")


class RecordResponse(BaseModel):
    id: int
    date: str
    transport: str
    diet: str
    status: str
    carbon_score: float
    carbon_points: int
    is_low_carbon: bool
    tree_value: float
    tree_level: int
    created_at: str


class RecordListResponse(BaseModel):
    records: list[RecordResponse]
    total: int
    page: int
    per_page: int


class RecordCreateResponse(BaseModel):
    id: int
    date: str
    transport: str
    diet: str
    status: str
    carbon_score: float
    carbon_points: int
    is_low_carbon: bool
    tree_value: float
    tree_level: int
    created_at: str
    user: dict


# ── 统计 ──

class WeekDayStat(BaseModel):
    date: str
    weekday: str
    scored: bool
    score: Optional[float] = None
    points: int = 0
    is_low_carbon: bool = False
    is_today: bool = False


class WeekSummary(BaseModel):
    avg_score: float
    total_points: int
    low_carbon_days: int
    max_score: float
    min_score: float


class WeekStatsResponse(BaseModel):
    week_days: list[WeekDayStat]
    summary: WeekSummary


class MonthRecord(BaseModel):
    date: str
    score: float
    points: int
    is_low_carbon: bool
    tree_level: int


class MonthSummary(BaseModel):
    total_days: int
    total_points: int
    avg_score: float
    low_carbon_days: int


class MonthStatsResponse(BaseModel):
    records: list[MonthRecord]
    summary: MonthSummary


# ── 森林 ──

class TreeResponse(BaseModel):
    id: int
    date: str
    carbon_score: float
    tree_value: float
    tree_level: int
    created_at: str


class ForestStats(BaseModel):
    total_trees: int
    level_1_count: int
    level_2_count: int
    level_3_count: int
    level_4_count: int


class ForestResponse(BaseModel):
    trees: list[TreeResponse]
    stats: ForestStats


# ── 排行榜 ──

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    nickname: str
    avatar: str
    total_points: int
    level: int
    total_days: int


class MyRank(BaseModel):
    rank: int
    user_id: int
    nickname: str
    total_points: int
    level: int


class LeaderboardResponse(BaseModel):
    leaderboard: list[LeaderboardEntry]
    my_rank: Optional[MyRank] = None


# ── 资料 ──

class ProfileUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=1, max_length=32)
