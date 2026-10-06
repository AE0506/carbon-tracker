from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, create_avatar, get_current_user

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """注册新用户"""
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        nickname=req.username,
        avatar="",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 生成默认头像
    user.avatar = create_avatar(user.nickname, user.id)
    db.commit()

    token = create_access_token({"user_id": user.id})

    return AuthResponse(
        id=user.id, username=user.username, nickname=user.nickname,
        avatar=user.avatar, level=user.level, total_points=user.total_points,
        total_days=user.total_days, total_trees=user.total_trees,
        low_carbon_count=user.low_carbon_count, walk_count=user.walk_count,
        vegan_count=user.vegan_count, streak=user.streak, max_streak=user.max_streak,
        last_record_date=user.last_record_date, access_token=token,
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    token = create_access_token({"user_id": user.id})

    return AuthResponse(
        id=user.id, username=user.username, nickname=user.nickname,
        avatar=user.avatar, level=user.level, total_points=user.total_points,
        total_days=user.total_days, total_trees=user.total_trees,
        low_carbon_count=user.low_carbon_count, walk_count=user.walk_count,
        vegan_count=user.vegan_count, streak=user.streak, max_streak=user.max_streak,
        last_record_date=user.last_record_date, access_token=token,
    )


@router.get("/profile", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return UserResponse(
        id=user.id, username=user.username, nickname=user.nickname,
        avatar=user.avatar, level=user.level, total_points=user.total_points,
        total_days=user.total_days, total_trees=user.total_trees,
        low_carbon_count=user.low_carbon_count, walk_count=user.walk_count,
        vegan_count=user.vegan_count, streak=user.streak, max_streak=user.max_streak,
        last_record_date=user.last_record_date,
    )
