from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    app_name: str = "Teacher Assistant Sidecar"
    app_env: str = "dev"
    default_storage_root: str = str(Path.cwd() / "storage")

    model_config = SettingsConfigDict(env_prefix="TA_", extra="ignore")


settings = AppSettings()
