from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Priority 1: Full URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Priority 2: Construct from partials (Docker usually sets these)
if not DATABASE_URL:
    user = os.getenv("DB_USER", "user")
    password = os.getenv("DB_PASSWORD", "password")
    host = os.getenv("DB_HOST", "db")
    db_name = os.getenv("DB_NAME", "mealplanner")
    DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:3306/{db_name}"

print(f"🔌 [DB] Connecting to: {DATABASE_URL.split('@')[-1]}") # Log host/db only for safety

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
