from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth
from app.api.endpoints import clinical
from app.db.session import engine
from app.db.base_class import Base
from app.db.session import SessionLocal
from app.services.seed_service import seed_initial_data
import app.models
import logging
from sqlalchemy.exc import SQLAlchemyError
import time

logger = logging.getLogger(__name__)

def ensure_database_ready(max_attempts: int = 10, delay_seconds: int = 2) -> bool:
    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return True
        except SQLAlchemyError as exc:
            logger.warning(
                "Database initialization attempt %s/%s failed: %s",
                attempt,
                max_attempts,
                exc,
            )
            time.sleep(delay_seconds)
    return False

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Configure CORS
cors_kwargs = {
    "allow_origins": settings.get_cors_origins(),
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

if settings.CORS_ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ALLOW_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)
app.include_router(
    clinical.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Clinical"]
)


@app.on_event("startup")
def startup_seed_data():
    db_ready = ensure_database_ready()
    if not db_ready:
        logger.error("Database is not ready after retries; API will start but DB-dependent routes may fail.")
        return

    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception as exc:
        # Keep API available even when seed data cannot be inserted.
        logger.exception("Seed initialization failed: %s", exc)
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Compulysis API",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }