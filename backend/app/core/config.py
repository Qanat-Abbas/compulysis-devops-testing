from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv, dotenv_values
import json

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env", override=True)

fallback_env = dotenv_values(BASE_DIR / "app" / ".env")
for key, value in fallback_env.items():
    if value in (None, ""):
        continue

    current = os.getenv(key)
    if current is None or current == "":
        os.environ[key] = str(value)


class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "Compulysis OCD Risk Analyzer"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/compulysis_db")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: str = os.getenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000",
    )
    CORS_ALLOW_ORIGIN_REGEX: str = r"https?://(localhost|127\.0\.0\.1|([a-zA-Z0-9-]+\.)*ngrok-free\.dev)(:\d+)?$"
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    def get_cors_origins(self) -> List[str]:
        value = self.BACKEND_CORS_ORIGINS

        if value is None or value == "":
            return []

        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                return []

            if trimmed.startswith("["):
                try:
                    parsed = json.loads(trimmed)
                    if isinstance(parsed, list):
                        return [item.strip() for item in parsed if isinstance(item, str) and item.strip()]
                except json.JSONDecodeError:
                    pass

            return [origin.strip() for origin in trimmed.split(",") if origin.strip()]

        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]

        return []
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True
        extra = "ignore"


settings = Settings()