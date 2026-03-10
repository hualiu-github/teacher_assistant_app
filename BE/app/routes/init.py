from fastapi import APIRouter, Depends
from app.models.schemas import AppInitResponse
from app.routes.deps import get_runtime

router = APIRouter()


@router.get("/init", response_model=AppInitResponse)
def init_app(rt=Depends(get_runtime)):
    rt.storage_service.ensure_root()
    return AppInitResponse(
        storage_root=str(rt.storage_root),
        dates=rt.storage_service.list_dates(),
        relationship_exists=rt.relationship_service.exists(),
    )
