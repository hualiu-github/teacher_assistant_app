import asyncio
import shutil
import subprocess
from pathlib import Path
from typing import Any

from app.services.settings_service import SettingsService


class PipelineService:
    SUPPORTED_ASR_EXTENSIONS = {".pcm", ".wav", ".mp3", ".opus", ".speex", ".aac", ".amr"}
    KNOWN_AUDIO_EXTENSIONS = SUPPORTED_ASR_EXTENSIONS | {".m4a", ".webm", ".ogg", ".flac"}

    def __init__(self) -> None:
        app_dir = Path(__file__).resolve().parents[1]
        self._settings_service = SettingsService(app_dir / "data")

    def _find_latest_audio(self, course_dir: Path) -> Path | None:
        candidates = [
            p
            for p in course_dir.iterdir()
            if p.is_file() and p.suffix.lower() in self.KNOWN_AUDIO_EXTENSIONS
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda p: p.stat().st_mtime)

    def _resolve_ffmpeg_bin(self) -> str | None:
        project_root = Path(__file__).resolve().parents[2]
        bundled_ffmpeg = project_root / "tools" / "ffmpeg" / "ffmpeg.exe"
        if bundled_ffmpeg.exists():
            return str(bundled_ffmpeg)

        return shutil.which("ffmpeg")

    def _ensure_supported_audio(self, audio_file: Path) -> Path:
        ext = audio_file.suffix.lower()
        if ext in self.SUPPORTED_ASR_EXTENSIONS:
            return audio_file

        ffmpeg_bin = self._resolve_ffmpeg_bin()
        if not ffmpeg_bin:
            raise RuntimeError(
                f"Audio format {ext} is not supported by ASR and ffmpeg is not available. "
                "Please put ffmpeg at BE/tools/ffmpeg/ffmpeg.exe or install ffmpeg to PATH."
            )

        converted_path = audio_file.with_suffix(".wav")
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i",
            str(audio_file),
            "-ac",
            "1",
            "-ar",
            "16000",
            str(converted_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True, text=False)
        except subprocess.CalledProcessError as exc:
            stderr_text = (exc.stderr or b"").decode("utf-8", errors="replace").strip()
            stdout_text = (exc.stdout or b"").decode("utf-8", errors="replace").strip()
            message = stderr_text or stdout_text or str(exc)
            raise RuntimeError(f"Failed to convert audio {audio_file.name}: {message}") from exc

        return converted_path

    def _to_time_str(self, value: Any) -> str:
        if value is None:
            return "--:--:--"
        try:
            n = float(value)
        except (TypeError, ValueError):
            return "--:--:--"

        # DashScope commonly returns millisecond timestamps.
        seconds = n / 1000.0 if n >= 1000 else n
        if seconds < 0:
            seconds = 0.0
        hh = int(seconds // 3600)
        mm = int((seconds % 3600) // 60)
        ss = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{hh:02d}:{mm:02d}:{ss:02d}.{ms:03d}"

    def _pick_first(self, item: dict[str, Any], keys: tuple[str, ...]) -> Any:
        for key in keys:
            if key in item and item[key] not in (None, ""):
                return item[key]
        return None

    def _parse_segments(self, payload: Any) -> list[dict[str, str]]:
        if payload is None:
            return []

        segments: list[dict[str, str]] = []
        items: list[Any]

        if isinstance(payload, dict):
            nested = self._pick_first(payload, ("sentence", "sentences", "segments", "results"))
            if isinstance(nested, list):
                items = nested
            else:
                items = [payload]
        elif isinstance(payload, list):
            items = payload
        else:
            items = [payload]

        for raw in items:
            if isinstance(raw, str):
                text = raw.strip()
                if text:
                    segments.append({"time": "--:--:--", "speaker": "未知", "text": text})
                continue

            if not isinstance(raw, dict):
                continue

            text = self._pick_first(raw, ("text", "sentence", "content", "transcript", "value"))
            if not isinstance(text, str) or not text.strip():
                continue

            start = self._pick_first(raw, ("begin_time", "start_time", "start", "begin", "from"))
            end = self._pick_first(raw, ("end_time", "stop_time", "end", "to"))
            speaker = self._pick_first(raw, ("speaker_id", "speaker", "spk", "role", "channel_id"))

            if start is None and end is None:
                time_range = "--:--:--"
            else:
                time_range = f"{self._to_time_str(start)} ~ {self._to_time_str(end)}"

            speaker_text = "未知" if speaker is None else str(speaker)
            segments.append({"time": time_range, "speaker": speaker_text, "text": text.strip()})

        return segments

    def _extract_text_from_result(self, result: Any) -> str:
        # 1) Try SDK helper first.
        if hasattr(result, "get_sentence"):
            sentence = result.get_sentence()
            segments = self._parse_segments(sentence)
            if segments:
                header = "时间\t说话人\t说话内容"
                lines = [f"{seg['time']}\t{seg['speaker']}\t{seg['text']}" for seg in segments]
                return "\n".join([header, *lines]).strip()
            if isinstance(sentence, str) and sentence.strip():
                return sentence.strip()

        # 2) Fallback payload traversal.
        payload = None
        if hasattr(result, "output"):
            payload = getattr(result, "output")
        elif hasattr(result, "data"):
            payload = getattr(result, "data")

        segments = self._parse_segments(payload)
        if segments:
            header = "时间\t说话人\t说话内容"
            lines = [f"{seg['time']}\t{seg['speaker']}\t{seg['text']}" for seg in segments]
            return "\n".join([header, *lines]).strip()

        if isinstance(payload, dict):
            for key in ("text", "transcript"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()

        return ""

    def _run_dashscope_asr(self, audio_file: Path) -> str:
        try:
            import dashscope
            from dashscope.audio.asr import Recognition
        except ImportError as exc:
            raise RuntimeError(
                "dashscope is not installed. Please run: pip install dashscope"
            ) from exc

        settings = self._settings_service.get()
        asr_api_key = (settings.get("asr_api_key") or "").strip()
        asr_base_url = (settings.get("asr_base_url") or "").strip()

        if not asr_api_key:
            raise RuntimeError("ASR API key is empty. Please set asr_api_key in Settings.")

        dashscope.api_key = asr_api_key
        if asr_base_url:
            dashscope.base_websocket_api_url = asr_base_url

        ext = audio_file.suffix.lower().lstrip(".")
        recognition = Recognition(
            model="fun-asr-realtime",
            format=ext,
            sample_rate=16000,
            callback=None,
            diarization_enabled=True
        )

        result = recognition.call(str(audio_file))
        status_code = getattr(result, "status_code", None)
        if status_code != 200:
            err_msg = getattr(result, "message", "ASR request failed")
            raise RuntimeError(f"ASR request failed: {err_msg}")

        text = self._extract_text_from_result(result)
        if not text:
            raise RuntimeError("ASR returned empty transcript")

        return text

    async def run_asr(self, course_dir: Path) -> None:
        audio_file = self._find_latest_audio(course_dir)
        if audio_file is None:
            raise RuntimeError(f"No audio file found in {course_dir}")

        supported_audio = self._ensure_supported_audio(audio_file)
        transcript = await asyncio.to_thread(self._run_dashscope_asr, supported_audio)

        asr_file = course_dir / f"{course_dir.name}_ASR.md"
        asr_file.write_text(transcript, encoding="utf-8")

    async def run_analysis(self, course_dir: Path, suggestion: str = "") -> None:
        await asyncio.sleep(1)
        analysis_file = course_dir / f"{course_dir.name}_Analysis.md"
        body = "# Analysis Placeholder\n\nPending integration with real LLM."
        if suggestion:
            body += f"\n\nUser suggestion: {suggestion}"
        analysis_file.write_text(body, encoding="utf-8")

    async def run_push(self, course_dir: Path, student_ids: list[str]) -> dict:
        await asyncio.sleep(0.5)
        return {sid: "sent" for sid in student_ids}