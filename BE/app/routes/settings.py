from fastapi import APIRouter, Depends
from app.models.schemas import SettingsResponse, SettingsUpdateRequest
from app.routes.deps import get_runtime

router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
def get_settings(rt=Depends(get_runtime)):
    return rt.settings_service.get()


@router.post("/settings")
def update_settings(payload: SettingsUpdateRequest, rt=Depends(get_runtime)):
    result = rt.settings_service.save(payload.model_dump())
    rt.refresh()
    return result
