from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import TaskStatusResponse
from app.routes.deps import get_runtime

router = APIRouter()


@router.get("/task/status/{course_id}/{task_type}", response_model=TaskStatusResponse)
def task_status(course_id: str, task_type: str, rt=Depends(get_runtime)):
    if task_type not in {"ASR", "Analysis"}:
        raise HTTPException(400, detail={"code": 4000, "message": "INVALID_TASK_TYPE"})

    date_dirs = [d for d in rt.storage_root.iterdir() if d.is_dir() and d.name != "config"] if rt.storage_root.exists() else []
    course_dir = None
    for d in date_dirs:
        p = d / course_id
        if p.exists():
            course_dir = p
            break

    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    key = "asr" if task_type == "ASR" else "analysis"
    current = progress.get(key, "pending")
    percent = 100 if current == "done" else (50 if current == "processing" else 0)

    return TaskStatusResponse(course_id=course_id, task_type=task_type, status=current, percent=percent)
