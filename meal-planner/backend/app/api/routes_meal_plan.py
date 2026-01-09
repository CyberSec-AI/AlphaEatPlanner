from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from .. import crud, schemas
from ..db import get_db

router = APIRouter(prefix="/meal-plan", tags=["meal-plan"])

@router.get("/", response_model=List[schemas.MealPlanItem])
def read_meal_plan(start: date, end: date, db: Session = Depends(get_db)):
    print(f"DEBUG: Fetching meal plan from {start} to {end}")
    items = crud.get_meal_plan(db, start_date=start, end_date=end)
    print(f"DEBUG: Found {len(items)} items")
    return items

@router.post("/", response_model=schemas.MealPlanItem)
def create_meal_plan_item(item: schemas.MealPlanItemCreate, db: Session = Depends(get_db)):
    # Verify recipe exists
    recipe = crud.get_recipe(db, item.recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return crud.create_meal_plan_item(db=db, item=item)

@router.delete("/{item_id}", response_model=schemas.MealPlanItem)
def delete_meal_plan_item(item_id: int, db: Session = Depends(get_db)):
    crud.delete_meal_plan_item(db, item_id=item_id)
    return {"status": "ok", "id": item_id}
