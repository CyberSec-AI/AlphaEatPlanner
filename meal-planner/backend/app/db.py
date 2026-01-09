from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Default to 'user'/'password' as per check_and_fix.py if env vars are missing
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@db:3306/mealplanner")

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
