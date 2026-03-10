import asyncio
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import FileResponse
from app.models.schemas import AnalysisIterateRequest
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


def _find_audio_file(course_dir):
    exts = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".aac", ".flac"}
    candidates = [p for p in course_dir.iterdir() if p.is_file() and p.suffix.lower() in exts]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


@router.post("/analysis/iterate")
async def iterate(payload: AnalysisIterateRequest, rt=Depends(get_runtime)):
    course_dir = _find_course_dir(rt, payload.course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["analysis"] = "processing"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)

    await rt.pipeline_service.run_analysis(course_dir, payload.user_suggestion)

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["analysis"] = "done"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)

    return {"course_id": payload.course_id, "status": "done"}


@router.post("/task/trigger/{course_id}/asr")
async def trigger_asr(course_id: str, rt=Depends(get_runtime)):
    course_dir = _find_course_dir(rt, course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["asr"] = "processing"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)

    try:
        await rt.pipeline_service.run_asr(course_dir)
        await asyncio.sleep(0.2)
    except Exception as exc:
        status = rt.status_service.load(course_dir)
        progress = status.get("progress", {})
        progress["asr"] = "failed"
        status["progress"] = progress
        rt.status_service.save(course_dir, status)
        raise HTTPException(500, detail={"code": 5001, "message": str(exc)}) from exc

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["asr"] = "done"
    progress["analysis"] = "pending"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)

    return {"course_id": course_id, "status": "done"}


@router.get("/audio/{course_id}")
async def get_audio(course_id: str, rt=Depends(get_runtime)):
    course_dir = _find_course_dir(rt, course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    audio_file = _find_audio_file(course_dir)
    if audio_file is None:
        raise HTTPException(404, detail={"code": 4042, "message": "AUDIO_FILE_NOT_FOUND"})

    media_type = mimetypes.guess_type(str(audio_file))[0] or "application/octet-stream"
    return FileResponse(path=audio_file, media_type=media_type, filename=audio_file.name)


@router.get("/asr/{course_id}")
async def get_asr(course_id: str, rt=Depends(get_runtime)):
    course_dir = _find_course_dir(rt, course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    asr_file = course_dir / f"{course_dir.name}_ASR.md"
    if not asr_file.exists():
        raise HTTPException(404, detail={"code": 4041, "message": "ASR_FILE_NOT_FOUND"})

    return {
        "course_id": course_id,
        "content": asr_file.read_text(encoding="utf-8"),
        "asr_file": str(asr_file),
    }


@router.post("/asr/save")
async def save_asr(
    course_id: str = Body(...),
    content: str = Body(""),
    rt=Depends(get_runtime),
):
    course_dir = _find_course_dir(rt, course_id)
    if course_dir is None:
        raise HTTPException(404, detail={"code": 4040, "message": "COURSE_NOT_FOUND"})

    asr_file = course_dir / f"{course_dir.name}_ASR.md"
    asr_file.write_text(content, encoding="utf-8")

    status = rt.status_service.load(course_dir)
    progress = status.get("progress", {})
    progress["asr"] = "done"
    status["progress"] = progress
    rt.status_service.save(course_dir, status)

    return {"course_id": course_id, "asr_file": str(asr_file), "status": "saved"}