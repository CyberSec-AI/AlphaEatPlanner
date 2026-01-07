from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from .api import routes_recipes, routes_meal_plan, routes_grocery, routes_upload, routes_auth
from . import models, auth_utils
from .db import SessionLocal, engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Meal Planner API",
    description="API for managing recipes, meal plans and grocery lists.",
    version="1.0.0"
)

# Ensure static dir exists
os.makedirs("/app/static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# Create Default Admin
def create_default_admin():
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.username == "admin").first():
            print("Creating default admin user...")
            hashed = auth_utils.get_password_hash("admin")
            admin = models.User(username="admin", hashed_password=hashed)
            db.add(admin)
            db.commit()
    finally:
        db.close()

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
app.include_router(routes_grocery.router)
app.include_router(routes_upload.router)
app.include_router(routes_auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
