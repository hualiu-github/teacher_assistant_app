from datetime import datetime


def chinese_date_str(dt: datetime) -> str:
    return dt.strftime("%Y年%m月%d日")
