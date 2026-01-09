from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from .api import routes_recipes, routes_meal_plan, routes_upload, routes_auth
# from .api import routes_grocery # TEMPORARILY DISABLED
from . import models, auth_utils
from .db import SessionLocal, engine

# Create tables SAFE MODE
# If DB is down, printed error but let app start so user sees 500 not 502
try:
    print("🔄 Initializing Database Tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ Tables Created.")
except Exception as e:
    print(f"❌ FATAL DB INIT ERROR: {e}")

app = FastAPI(
    title="Meal Planner API",
    description="API for managing recipes, meal plans and grocery lists.",
    version="1.0.0"
)

# Ensure static dir exists
os.makedirs("/app/static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# Create Default Admin SAFE MODE
def create_default_admin():
    try:
        db = SessionLocal()
        if not db.query(models.User).filter(models.User.username == "admin").first():
            print("Creating default admin user...")
            hashed = auth_utils.get_password_hash("admin")
            admin = models.User(username="admin", hashed_password=hashed)
            db.add(admin)
            db.commit()
        db.close()
    except Exception as e:
        print(f"⚠️ Could not create admin (DB likely down): {e}")

create_default_admin()

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "*", # Allow all origins (required for VPN/IP access)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_recipes.router)
app.include_router(routes_meal_plan.router)
# Re-enabling Grocery since we fixed the module
try:
    from .api import routes_grocery
    app.include_router(routes_grocery.router)
except Exception as e:
    print(f"❌ Could not load Grocery Routes: {e}")

app.include_router(routes_upload.router)
app.include_router(routes_auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Meal Planner API is running", "db_status": "Check logs"}
