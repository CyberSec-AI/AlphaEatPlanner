from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from datetime import date
from . import models, schemas
from typing import List, Optional

# Recipes
def get_recipe(db: Session, recipe_id: int):
    return db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()

def get_recipes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Recipe).offset(skip).limit(limit).all()

def create_recipe(db: Session, recipe: schemas.RecipeCreate):
    db_recipe = models.Recipe(
        title=recipe.title,
        description=recipe.description,
        default_servings=recipe.default_servings,
        is_favorite=recipe.is_favorite,
        rating=recipe.rating,
        is_vegetarian=recipe.is_vegetarian,
        tags=recipe.tags
    )
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    
    for ingredient in recipe.ingredients:
        db_ingredient = models.RecipeIngredient(
            recipe_id=db_recipe.id,
            name=ingredient.name,
            quantity=ingredient.quantity,
            unit=ingredient.unit
        )
        db.add(db_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def update_recipe(db: Session, recipe_id: int, recipe_update: schemas.RecipeUpdate):
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    
    # Update fields
    db_recipe.title = recipe_update.title
    db_recipe.description = recipe_update.description
    db_recipe.default_servings = recipe_update.default_servings
    db_recipe.is_favorite = recipe_update.is_favorite
    db_recipe.rating = recipe_update.rating
    db_recipe.is_vegetarian = recipe_update.is_vegetarian
    db_recipe.tags = recipe_update.tags
    
    if recipe_update.ingredients is not None:
        # Delete existing
        db.query(models.RecipeIngredient).filter(models.RecipeIngredient.recipe_id == recipe_id).delete()
        # Add new
        for ingredient in recipe_update.ingredients:
            db_ing = models.RecipeIngredient(
                recipe_id=recipe_id,
                name=ingredient.name,
                quantity=ingredient.quantity,
                unit=ingredient.unit
            )
            db.add(db_ing)
            
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

def delete_recipe(db: Session, recipe_id: int):
    db_recipe = get_recipe(db, recipe_id)
    if db_recipe:
        db.delete(db_recipe)
        db.commit()
    return db_recipe

# Meal Plan
def get_meal_plan(db: Session, start_date: date, end_date: date):
    return db.query(models.MealPlanItem).filter(
        models.MealPlanItem.date >= start_date,
        models.MealPlanItem.date <= end_date
    ).all()

def create_meal_plan_item(db: Session, item: schemas.MealPlanItemCreate):
    # Check if exists for same recipe/date?? Allowing multiples for now.
    db_item = models.MealPlanItem(
        date=item.date,
        recipe_id=item.recipe_id,
        servings=item.servings
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_meal_plan_item(db: Session, item_id: int):
    db_item = db.query(models.MealPlanItem).filter(models.MealPlanItem.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item
