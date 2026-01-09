from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
# from .api import routes_recipes, routes_meal_plan, routes_grocery, routes_upload, routes_auth
from .api import routes_recipes, routes_meal_plan, routes_upload, routes_auth
# ...
app.include_router(routes_recipes.router)
app.include_router(routes_meal_plan.router)
# app.include_router(routes_grocery.router)
app.include_router(routes_upload.router)
app.include_router(routes_auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
