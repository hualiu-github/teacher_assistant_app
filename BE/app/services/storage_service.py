from pathlib import Path
from datetime import datetime
from app.utils.time_utils import chinese_date_str


class StorageService:
    def __init__(self, storage_root: Path) -> None:
        self.storage_root = storage_root

    def ensure_root(self) -> None:
        (self.storage_root / "config").mkdir(parents=True, exist_ok=True)

    def list_dates(self) -> list[str]:
        if not self.storage_root.exists():
            return []
        return sorted([d.name for d in self.storage_root.iterdir() if d.is_dir() and d.name != "config"])

    def build_course_dir(self, course_name: str, class_name: str, start_time: str) -> Path:
        date_dir = self.storage_root / chinese_date_str(datetime.now())
        course_dir = date_dir / f"{course_name}_{class_name}_{start_time}"
        course_dir.mkdir(parents=True, exist_ok=True)
        (course_dir / "segments").mkdir(exist_ok=True)
        return course_dir

    def build_course_dir_for_date(self, date: str, course_name: str, class_name: str, start_time: str) -> Path:
        date_dir = self.storage_root / date
        course_dir = date_dir / f"{course_name}_{class_name}_{start_time}"
        course_dir.mkdir(parents=True, exist_ok=True)
        (course_dir / "segments").mkdir(exist_ok=True)
        return course_dir
