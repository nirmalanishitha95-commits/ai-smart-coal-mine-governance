import os
import re
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

logger = logging.getLogger("coalguard.database")

# Retrieve DATABASE_URL from settings
raw_db_url = settings.DATABASE_URL or "sqlite:///./coalguard.db"

# Render PostgreSQL connection strings typically start with 'postgres://'
# SQLAlchemy 1.4+ and 2.0+ require dialect 'postgresql://' or 'postgresql+psycopg2://'
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = raw_db_url

def get_safe_url(url: str) -> str:
    """Masks database password for safe operational logging."""
    return re.sub(r":([^:@]+)@", ":****@", url)

try:
    if "sqlite" in DATABASE_URL:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
        logger.info(f"Initialized SQLite database at {get_safe_url(DATABASE_URL)}")
    else:
        # PostgreSQL / Production Database
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True
        )
        # Test connection
        with engine.connect() as conn:
            logger.info(f"Successfully connected to production database: {get_safe_url(DATABASE_URL)}")
except Exception as e:
    logger.warning(
        f"Configured database connection ({get_safe_url(DATABASE_URL)}) notice: {e}. "
        "Falling back to local SQLite database (coalguard.db) for reliable runtime."
    )
    SQLITE_URL = settings.SQLITE_FALLBACK_URL or "sqlite:///./coalguard.db"
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
