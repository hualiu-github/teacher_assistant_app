import json
from pathlib import Path
from app.models.schemas import CourseStatusFile, StudentPushStatus


class StatusService:
    FILE_NAME = "_Status.json"

    def init_status(self, course_dir: Path, course_name: str, class_name: str, start_time: str) -> Path:
        status = CourseStatusFile(
            courseInfo={
                "courseName": course_name,
                "className": class_name,
                "startTime": start_time,
            },
            progress={
                "recording": "done",
                "asr": "pending",
                "analysis": "pending",
                "push": "pending",
            },
            studentList=[],
        )
        file_path = course_dir / self.FILE_NAME
        file_path.write_text(status.model_dump_json(indent=2), encoding="utf-8")
        return file_path

    def init_course_card_status(self, course_dir: Path, course_name: str, class_name: str, start_time: str) -> Path:
        status = CourseStatusFile(
            courseInfo={
                "courseName": course_name,
                "className": class_name,
                "startTime": start_time,
            },
            progress={
                "recording": "pending",
                "asr": "pending",
                "analysis": "pending",
                "push": "pending",
            },
            studentList=[],
        )
        file_path = course_dir / self.FILE_NAME
        file_path.write_text(status.model_dump_json(indent=2), encoding="utf-8")
        return file_path

    def load(self, course_dir: Path) -> dict:
        file_path = course_dir / self.FILE_NAME
        if not file_path.exists():
            return {}
        return json.loads(file_path.read_text(encoding="utf-8"))

    def save(self, course_dir: Path, payload: dict) -> None:
        (course_dir / self.FILE_NAME).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def mark_student_push(self, course_dir: Path, student_id: str, status: str, student_name: str = "") -> None:
        current = self.load(course_dir)
        lst = current.get("studentList", [])
        hit = next((s for s in lst if s.get("student_id") == student_id), None)
        if hit:
            hit["status"] = status
        else:
            lst.append(StudentPushStatus(student_id=student_id, student_name=student_name, status=status).model_dump())
        current["studentList"] = lst
        self.save(course_dir, current)
