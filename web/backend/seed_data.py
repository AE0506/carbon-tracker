"""
种子数据脚本
生成测试用户和打卡记录
运行: python seed_data.py
"""
from datetime import date, timedelta
import random
import sys
import os

# 确保能导入 backend 模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, SessionLocal
from models import User, Action, Tree
from auth import hash_password, create_avatar
from carbon_algorithm import (
    calculate_carbon_score, calculate_carbon_points, is_low_carbon,
    calculate_tree_value, calculate_tree_level, calculate_level,
)

TRANSPORTS = ["步行", "骑行", "公交", "地铁", "出租车", "私家车"]
DIETS = ["素食", "普通", "高碳"]
STATUSES = ["在家", "出行"]

USERS_DATA = [
    ("green_pioneer", "绿色先锋"),
    ("low_carbon", "低碳达人"),
    ("eco_guard", "环保卫士"),
    ("forest_son", "森林之子"),
    ("carbon_tracker", "碳踪者"),
    ("walk_master", "步行大师"),
    ("vegan_hero", "素食英雄"),
    ("tree_lover", "爱树之人"),
    ("earth_friend", "地球之友"),
    ("green_starter", "绿色新手"),
    ("eco_student", "环保学生"),
    ("bike_rider", "骑行达人"),
    ("bus_rider", "公交常客"),
    ("subway_fan", "地铁通勤"),
    ("energy_saver", "节能标兵"),
    ("green_hand", "环保萌新"),
    ("carbon_warrior", "碳减排战士"),
    ("zero_hero", "零碳英雄"),
    ("plant_parent", "种树狂魔"),
    ("eco_beginner", "环保入门"),
]


def seed():
    init_db()
    db = SessionLocal()

    print("正在生成种子数据...")

    for username, nickname in USERS_DATA:
        user = User(
            username=username,
            password_hash=hash_password("123456"),
            nickname=nickname,
            avatar="",
        )
        db.add(user)
        db.flush()
        user.avatar = create_avatar(user.nickname, user.id)

        total_points = 0
        total_trees = 0
        total_days = 0
        low_carbon_count = 0
        walk_count = 0
        vegan_count = 0

        # 生成最近 7-30 天的打卡记录
        days_back = random.randint(7, 30)
        streak = random.randint(1, days_back)

        for i in range(days_back):
            d = date.today() - timedelta(days=days_back - 1 - i)
            date_str = d.isoformat()

            # 每 7 天跳过 1 天（模拟不是每天都打卡）
            if i % 7 == 0 and i > 0 and random.random() < 0.3:
                continue

            transport = random.choice(TRANSPORTS)
            diet = random.choice(DIETS)
            status = random.choice(STATUSES)
            score = calculate_carbon_score(transport, diet, status)
            points = calculate_carbon_points(score)
            low_carbon = is_low_carbon(score)
            tree_value = calculate_tree_value(score)
            tree_level = calculate_tree_level(tree_value)

            action = Action(
                user_id=user.id, date=date_str,
                transport=transport, diet=diet, status=status,
                carbon_score=score, carbon_points=points,
                is_low_carbon=1 if low_carbon else 0,
                tree_value=tree_value, tree_level=tree_level,
            )
            db.add(action)

            tree = Tree(
                user_id=user.id, date=date_str,
                carbon_score=score, tree_value=tree_value,
                tree_level=tree_level,
            )
            db.add(tree)

            total_points += points
            total_trees += 1
            total_days += 1
            if low_carbon:
                low_carbon_count += 1
            if transport == "步行":
                walk_count += 1
            if diet == "素食":
                vegan_count += 1

            user.last_record_date = date_str

        user.total_points = total_points
        user.total_trees = total_trees
        user.total_days = total_days
        user.low_carbon_count = low_carbon_count
        user.walk_count = walk_count
        user.vegan_count = vegan_count
        user.level = calculate_level(total_points)
        user.streak = streak
        user.max_streak = streak

        print(f"  {nickname:8s} → {total_days:2d}天打卡, {total_points:3d}积分, Lv{user.level}")

    db.commit()
    db.close()
    print(f"\n✅ 种子数据生成完成！共 {len(USERS_DATA)} 个用户")
    print("所有用户密码均为: 123456")


if __name__ == "__main__":
    seed()
