# BE Skeleton (FastAPI Sidecar)

## Run

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8766
```

## Current scope
- Implements API skeleton in docs (`/init`, `/settings`, `/courses/{date}`, `/courses/create`, `/record/upload`, `/task/status/*`, `/analysis/iterate`, `/push/batch`, `/relationship/sync`).
- Uses local file system as persistence (`Settings.json`, `_Status.json`).
- ASR/LLM/Push are placeholders for future real integrations.

## API Doc
- `docs/BE_API_Summary.md`
