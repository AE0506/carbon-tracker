"""
碳评分核心算法
与前端 Record.tsx 中的 calculateCarbonScore 保持同步
"""

# 各项得分映射
TRANSPORT_SCORES: dict[str, float] = {
    "步行": 1.2,
    "骑行": 1.5,
    "公交": 3.2,
    "地铁": 2.8,
    "出租车": 6.2,
    "私家车": 8.4,
}

DIET_SCORES: dict[str, float] = {
    "素食": 1.6,
    "普通": 3.8,
    "高碳": 6.5,
}

STATUS_SCORES: dict[str, float] = {
    "在家": 2.0,
    "出行": 3.4,
}

# 权重
TRANSPORT_WEIGHT = 0.5
DIET_WEIGHT = 0.32
STATUS_WEIGHT = 0.18


def calculate_carbon_score(transport: str, diet: str, status: str) -> float:
    """计算碳评分（0-10，越低越好）"""
    transport_score = TRANSPORT_SCORES.get(transport, 5.0)
    diet_score = DIET_SCORES.get(diet, 3.5)
    status_score = STATUS_SCORES.get(status, 2.5)

    score = (
        transport_score * TRANSPORT_WEIGHT
        + diet_score * DIET_WEIGHT
        + status_score * STATUS_WEIGHT
    )
    return round(score, 1)


def calculate_carbon_points(score: float) -> int:
    """根据碳评分计算获得的积分（评分越低积分越高）"""
    return max(3, round((10 - score) * 3))


def is_low_carbon(score: float) -> bool:
    """判断是否属于低碳行为"""
    return score <= 3.0


def calculate_tree_value(score: float) -> float:
    """计算树木成长值（评分越低成长值越高）"""
    return round(10 - score, 1)


def calculate_tree_level(tree_value: float) -> int:
    """根据成长值确定树木等级 1-4"""
    if tree_value >= 9:
        return 4  # 巨树
    elif tree_value >= 6:
        return 3  # 大树
    elif tree_value >= 3:
        return 2  # 小树
    else:
        return 1  # 小苗


def calculate_level(total_points: int) -> int:
    """根据累计积分计算等级"""
    thresholds = [0, 30, 80, 150, 250, 400, 600, 900, 1300, 1800]
    for level, threshold in enumerate(thresholds, start=1):
        if total_points < threshold:
            return level - 1
    return 10


def calculate_streak(last_date: str | None, today: str) -> tuple[int, int]:
    """
    计算连续打卡天数。
    返回 (new_streak, new_max_streak)
    """
    from datetime import datetime, timedelta

    if last_date is None:
        return (1, 1)

    try:
        last = datetime.strptime(last_date, "%Y-%m-%d").date()
        today_date = datetime.strptime(today, "%Y-%m-%d").date()

        if last == today_date:
            # 当天已打卡，不断连
            return (0, 0)  # 调用方自行保持原有值
        elif last == today_date - timedelta(days=1):
            # 连续
            return (1, 0)  # 在原有 streak 上加 1
        else:
            # 断签
            return (1, 0)  # 重新从 1 开始
    except ValueError:
        return (1, 1)
