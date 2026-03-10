from fastapi import APIRouter, Depends
from app.models.schemas import RelationshipSyncRequest, RelationshipSyncResponse
from app.routes.deps import get_runtime

router = APIRouter()


@router.post("/relationship/sync", response_model=RelationshipSyncResponse)
def sync_relationship(payload: RelationshipSyncRequest, rt=Depends(get_runtime)):
    rows = [row.model_dump() for row in payload.rows]
    saved_path = rt.relationship_service.save_rows(rows)
    return RelationshipSyncResponse(updated_count=len(rows), file_path=str(saved_path))