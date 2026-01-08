from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

# Ingredient Schemas
class IngredientBase(BaseModel):
    name: str
    quantity: Decimal
    unit: str

class IngredientCreate(IngredientBase):
    pass

class Ingredient(IngredientBase):
    id: int
    recipe_id: int

    class Config:
        from_attributes = True

# Recipe Schemas
class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    default_servings: int = 2
    is_favorite: bool = False
    rating: int = 0
    is_vegetarian: bool = False
    image_url: Optional[str] = None
    tags: List[str] = []

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeUpdate(RecipeBase):
    ingredients: Optional[List[IngredientCreate]] = None

class Recipe(RecipeBase):
    id: int
    ingredients: List[Ingredient] = []

    class Config:
        from_attributes = True

# Meal Plan Schemas
class MealPlanItemBase(BaseModel):
    date: date
    recipe_id: Optional[int] = None
    servings: int
    meal_type: str = "dinner"

class MealPlanItemCreate(MealPlanItemBase):
    pass

class MealPlanItem(MealPlanItemBase):
    id: int
    recipe: Optional[Recipe] = None

    class Config:
        from_attributes = True

class MealPlanWeek(BaseModel):
    items: List[MealPlanItem]

# Grocery List Schemas
class GroceryItem(BaseModel):
    name: str
    quantity: Decimal
    unit: str
    original_ingredients: Optional[List[str]] = None

class GroceryManualItemBase(BaseModel):
    name: str
    quantity: Decimal
    unit: Optional[str] = None
    is_checked: bool = False
    category: str = "Divers"

class GroceryManualItemCreate(GroceryManualItemBase):
    pass

class GroceryManualItem(GroceryManualItemBase):
    id: int

    class Config:
        from_attributes = True

class GroceryLibraryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    default_unit: Optional[str] = None

class GroceryLibraryItem(BaseModel):
    id: int
    name: str
    category: str
    default_unit: Optional[str] = None
    
    class Config:
        from_attributes = True
