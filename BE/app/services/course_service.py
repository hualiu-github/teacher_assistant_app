from pathlib import Path
from app.models.schemas import CourseCard, CourseProgress


class CourseService:
    def __init__(self, storage_root: Path) -> None:
        self.storage_root = storage_root

    def list_courses(self, date: str) -> list[CourseCard]:
        date_dir = self.storage_root / date
        if not date_dir.exists():
            return []

        courses: list[CourseCard] = []
        for course_dir in sorted([d for d in date_dir.iterdir() if d.is_dir()]):
            parts = course_dir.name.split("_")
            if len(parts) < 3:
                continue
            course_name, class_name, start_time = parts[0], parts[1], parts[2]
            progress = CourseProgress(recording="pending", asr="pending", analysis="pending", push="pending")
            status_file = course_dir / "_Status.json"
            if status_file.exists():
                import json

                data = json.loads(status_file.read_text(encoding="utf-8"))
                p = data.get("progress", {})
                progress = CourseProgress(
                    recording=p.get("recording", "pending"),
                    asr=p.get("asr", "pending"),
                    analysis=p.get("analysis", "pending"),
                    push=p.get("push", "pending"),
                )
            courses.append(
                CourseCard(
                    course_id=course_dir.name,
                    date=date,
                    course_name=course_name,
                    class_name=class_name,
                    start_time=start_time,
                    progress=progress,
                )
            )
        return courses
