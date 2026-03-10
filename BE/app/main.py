from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.runtime import RuntimeContainer
from app.routes.init import router as init_router
from app.routes.settings import router as settings_router
from app.routes.courses import router as courses_router
from app.routes.record import router as record_router
from app.routes.task import router as task_router
from app.routes.analysis import router as analysis_router
from app.routes.push import router as push_router
from app.routes.relationship import router as relationship_router

BASE_DIR = Path(__file__).resolve().parent
runtime = RuntimeContainer(BASE_DIR)

app = FastAPI(title="Teacher Assistant Sidecar", version="0.1.0")
app.state.runtime = runtime
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(init_router)
app.include_router(settings_router)
app.include_router(courses_router)
app.include_router(record_router)
app.include_router(task_router)
app.include_router(analysis_router)
app.include_router(push_router)
app.include_router(relationship_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
