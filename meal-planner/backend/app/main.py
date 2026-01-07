from fastapi import FastAPI
from .api import routes_recipes, routes_meal_plan, routes_grocery

app = FastAPI(
    title="Meal Planner API",
    description="API for managing recipes, meal plans and grocery lists.",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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

@app.get("/health")
def health_check():
    return {"status": "ok"}
