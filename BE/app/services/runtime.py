from pathlib import Path
from app.services.settings_service import SettingsService
from app.services.storage_service import StorageService
from app.services.relationship_service import RelationshipService
from app.services.course_service import CourseService
from app.services.status_service import StatusService
from app.services.pipeline_service import PipelineService


class RuntimeContainer:
    def __init__(self, base_dir: Path) -> None:
        self.data_dir = base_dir / "data"
        self.settings_service = SettingsService(self.data_dir)
        settings = self.settings_service.get()
        self.storage_root = Path(settings.get("storage_root") or (self.data_dir / "storage"))
        self.storage_service = StorageService(self.storage_root)
        self.relationship_service = RelationshipService(self.storage_root)
        self.course_service = CourseService(self.storage_root)
        self.status_service = StatusService()
        self.pipeline_service = PipelineService()

    def refresh(self) -> None:
        settings = self.settings_service.get()
        self.storage_root = Path(settings.get("storage_root") or (self.data_dir / "storage"))
        self.storage_service = StorageService(self.storage_root)
        self.relationship_service = RelationshipService(self.storage_root)
        self.course_service = CourseService(self.storage_root)
