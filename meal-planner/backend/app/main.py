from fastapi.staticfiles import StaticFiles
import os
from .api import routes_recipes, routes_meal_plan, routes_grocery, routes_upload

app = FastAPI(
    title="Meal Planner API",
    description="API for managing recipes, meal plans and grocery lists.",
    version="1.0.0"
)

# Ensure static dir exists
os.makedirs("/app/static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

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

@app.get("/health")
def health_check():
    return {"status": "ok"}
