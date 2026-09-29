import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CoalGuard AI"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    
    # Database Settings (Defaults to PostgreSQL or SQLite fallback, never hardcoded MySQL)
    # Render provides DATABASE_URL in environment
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./coalguard.db"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./coalguard.db"
    
    # JWT Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "coalguard_ai_sih_2026_jwt_secret_key_enterprise_secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Frontend URL & CORS
    # In Render production, FRONTEND_URL is set to e.g. https://coalguard-frontend.onrender.com
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    
    # Groq AI Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {"pdf", "jpg", "jpeg", "png", "docx"}

    @property
    def cors_origin_list(self) -> List[str]:
        origins = set()
        
        # Add configured FRONTEND_URL
        if self.FRONTEND_URL:
            clean_frontend = self.FRONTEND_URL.strip().rstrip("/")
            if clean_frontend:
                origins.add(clean_frontend)
                # Also include https/http variant if needed
                if clean_frontend.startswith("http://"):
                    origins.add(clean_frontend.replace("http://", "https://", 1))
                elif clean_frontend.startswith("https://"):
                    origins.add(clean_frontend.replace("https://", "http://", 1))
        
        # Add comma-separated CORS_ORIGINS
        if self.CORS_ORIGINS:
            for item in self.CORS_ORIGINS.split(","):
                cleaned = item.strip().rstrip("/")
                if cleaned:
                    origins.add(cleaned)
                    
        # In non-production or if no origins specified, include local dev ports
        if self.ENVIRONMENT != "production" or not origins:
            origins.update([
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
            ])
            
        return list(origins)

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
