from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.routes.deps import get_runtime

router = APIRouter()


@router.post("/record/upload")
async def upload_record(
    file: UploadFile = File(...),
    course_name: str = Form(...),
    class_name: str = Form(...),
    start_time: str = Form(...),
    date: str = Form(""),
    rt=Depends(get_runtime),
):
    course_dir = (
        rt.storage_service.build_course_dir_for_date(date, course_name, class_name, start_time)
        if date
        else rt.storage_service.build_course_dir(course_name, class_name, start_time)
    )
    ext = Path(file.filename or "audio.wav").suffix or ".wav"
    filename = f"{course_dir.name}{ext}"
    target = course_dir / filename

    content = await file.read()
    target.write_bytes(content)
    rt.status_service.init_status(course_dir, course_name, class_name, start_time)

    return {
        "course_id": course_dir.name,
        "audio_path": str(target),
        "status": "ASR_Processing",
    }