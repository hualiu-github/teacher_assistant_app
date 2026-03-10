from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import PushBatchRequest
from app.routes.deps import get_runtime

router = APIRouter()


def _find_course_dir(rt, course_id: str):
    if not rt.storage_root.exists():
        return None
    for d in [x for x in rt.storage_root.iterdir() if x.is_dir() and x.name != "config"]:
        p = d / course_id
        if p.exists():
            return p
    return None


@router.post("/push/batch")
async def push_batch(payload: PushBatchRequest, rt=Depends(get_runtime)):
    course_dir = _find_course_dir(rt, payload.course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    result = await rt.pipeline_service.run_push(course_dir, payload.student_ids)
    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["push"] = "done"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)
    return {"course_id": payload.course_id, "result": result}
