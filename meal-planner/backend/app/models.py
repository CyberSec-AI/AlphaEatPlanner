from sqlalchemy import Column, Integer, String, Text, Boolean, Date, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from .db import Base
import json

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    description = Column(Text, nullable=True)
    default_servings = Column(Integer, default=2)
    is_favorite = Column(Boolean, default=False)
    rating = Column(Integer, default=0)
    is_vegetarian = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True)
    _tags = Column("tags", Text, nullable=True) # Storing as JSON string for simplicity in MySQL 8

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    meal_plan_items = relationship("MealPlanItem", back_populates="recipe")

    @property
    def tags(self):
        if self._tags:
            return json.loads(self._tags)
        return []

    @tags.setter
    def tags(self, value):
        self._tags = json.dumps(value)


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    name = Column(String(255), index=True)
    quantity = Column(Numeric(10, 2))
    unit = Column(String(50))

    recipe = relationship("Recipe", back_populates="ingredients")


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    servings = Column(Integer)
    meal_type = Column(String(20), default="dinner") # 'breakfast', 'lunch', 'dinner'

    recipe = relationship("Recipe", back_populates="meal_plan_items")


class GroceryManualItem(Base):
    __tablename__ = "grocery_manual_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    quantity = Column(Numeric(10, 2), default=1)
    unit = Column(String(50), nullable=True)
    is_checked = Column(Boolean, default=False)
