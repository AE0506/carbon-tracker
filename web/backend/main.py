"""
碳迹绿行 Web 后端 API
FastAPI + SQLite + JWT 认证
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import init_db
from routers import auth, records, stats, forest, leaderboard, profile

app = FastAPI(
    title="碳迹绿行 API",
    description="碳迹绿行 Web 后端服务 - 个人碳足迹追踪",
    version="1.0.0",
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(records.router)
app.include_router(stats.router)
app.include_router(forest.router)
app.include_router(leaderboard.router)
app.include_router(profile.router)


@app.on_event("startup")
def on_startup():
    """启动时初始化数据库"""
    init_db()


@app.get("/api/health")
def health_check():
    """健康检查"""
    return {"status": "ok", "version": "1.0.0"}
