from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    elevenlabs_api_key: str = ""
    pexels_api_key: str = ""
    google_api_key: str = ""
    storage_dir: str = "./storage"
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def storage_path(self) -> Path:
        return Path(self.storage_dir)

    @property
    def jobs_path(self) -> Path:
        return self.storage_path / "jobs"


settings = Settings()
