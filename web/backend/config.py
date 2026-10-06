import os

# JWT 配置
JWT_SECRET = os.environ.get("JWT_SECRET", "carbon-tracker-dev-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

# 数据库
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./carbon_tracker.db")

# CORS
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

# 默认头像色板
AVATAR_COLORS = [
    "#10B981", "#059669", "#0EA5E9", "#16A34A",
    "#64748B", "#8B5CF6", "#EC4899", "#F59E0B",
]
