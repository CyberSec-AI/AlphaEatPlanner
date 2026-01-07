from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..db import get_db

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.get("/", response_model=List[schemas.Recipe])
def read_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipes = crud.get_recipes(db, skip=skip, limit=limit)
    return recipes

@router.post("/", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return crud.create_recipe(db=db, recipe=recipe)

@router.get("/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = crud.get_recipe(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = crud.update_recipe(db, recipe_id=recipe_id, recipe_update=recipe)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@router.delete("/{recipe_id}", response_model=schemas.Recipe)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = crud.delete_recipe(db, recipe_id=recipe_id)
    if db_recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe
