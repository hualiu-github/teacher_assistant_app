import json
from pathlib import Path
from typing import Any, Dict


class SettingsService:
    def __init__(self, data_dir: Path) -> None:
        self._file = data_dir / "Settings.json"

    def get(self) -> Dict[str, Any]:
        if not self._file.exists():
            default = {
                "storage_root": str(self._file.parent / "storage"),
                "openai_base_url": "",
                "openai_api_key": "",
                "asr_base_url": "",
                "asr_api_key": "",
            }
            self.save(default)
            return default
        return json.loads(self._file.read_text(encoding="utf-8"))

    def save(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        merged = self.get() if self._file.exists() else {}
        merged.update({k: v for k, v in payload.items() if v is not None})
        self._file.parent.mkdir(parents=True, exist_ok=True)
        self._file.write_text(
            json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return merged
