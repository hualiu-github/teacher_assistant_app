from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import CourseCreateRequest
from app.routes.deps import get_runtime

router = APIRouter()


@router.get("/courses/{date}")
def list_courses(date: str, rt=Depends(get_runtime)):
    return rt.course_service.list_courses(date)


@router.post("/courses/create")
def create_course(payload: CourseCreateRequest, rt=Depends(get_runtime)):
    rt.storage_service.ensure_root()

    course_id = f"{payload.course_name}_{payload.class_name}_{payload.start_time}"
    date_dir = rt.storage_root / payload.date
    if (date_dir / course_id).exists():
        raise HTTPException(409, detail={"code": 4091, "message": "COURSE_ALREADY_EXISTS"})

    course_dir = rt.storage_service.build_course_dir_for_date(
        payload.date, payload.course_name, payload.class_name, payload.start_time
    )
    rt.status_service.init_course_card_status(
        course_dir, payload.course_name, payload.class_name, payload.start_time
    )

    return {
        "course_id": course_id,
        "date": payload.date,
        "course_name": payload.course_name,
        "class_name": payload.class_name,
        "start_time": payload.start_time,
        "status": "created",
    }