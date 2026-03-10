from typing import Dict, List, Literal, Optional
from pydantic import BaseModel

ProgressStatus = Literal["pending", "processing", "done", "failed"]


class ErrorPayload(BaseModel):
    code: int
    message: str
    detail: Optional[dict] = None


class AppInitResponse(BaseModel):
    storage_root: str
    dates: List[str]
    relationship_exists: bool


class CourseProgress(BaseModel):
    recording: ProgressStatus
    asr: ProgressStatus
    analysis: ProgressStatus
    push: ProgressStatus


class CourseCard(BaseModel):
    course_id: str
    date: str
    course_name: str
    class_name: str
    start_time: str
    progress: CourseProgress


class CourseCreateRequest(BaseModel):
    date: str
    course_name: str
    class_name: str
    start_time: str


class SettingsUpdateRequest(BaseModel):
    storage_root: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_api_key: Optional[str] = None
    asr_base_url: Optional[str] = None
    asr_api_key: Optional[str] = None


class SettingsResponse(BaseModel):
    storage_root: str
    openai_base_url: str
    openai_api_key: str
    asr_base_url: str
    asr_api_key: str


class AnalysisIterateRequest(BaseModel):
    course_id: str
    user_suggestion: str


class PushBatchRequest(BaseModel):
    course_id: str
    student_ids: List[str]


class TaskStatusResponse(BaseModel):
    course_id: str
    task_type: Literal["ASR", "Analysis"]
    status: ProgressStatus
    percent: int


class StudentPushStatus(BaseModel):
    student_id: str
    student_name: str
    status: Literal["pending", "sent", "failed", "id_missing"]


class CourseStatusFile(BaseModel):
    courseInfo: Dict[str, str]
    progress: Dict[str, ProgressStatus]
    studentList: List[StudentPushStatus]


class RelationshipRow(BaseModel):
    StudentID: str
    StudentName: str
    ClassName: str
    ParentName: str
    ParentWX: str


class RelationshipSyncRequest(BaseModel):
    rows: List[RelationshipRow]


class RelationshipSyncResponse(BaseModel):
    updated_count: int
    file_path: str
