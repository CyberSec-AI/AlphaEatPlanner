from sqlalchemy.orm import Session
from .. import models, schemas
from datetime import date
from typing import List, Dict, Tuple
from decimal import Decimal

def generate_grocery_list(db: Session, start_date: date, end_date: date) -> List[schemas.GroceryItem]:
    # Fetch meal plan items
    meal_items = db.query(models.MealPlanItem).filter(
        models.MealPlanItem.date >= start_date,
        models.MealPlanItem.date <= end_date
    ).all()
    
    # Aggregate
    # Key: (normalized_name, normalized_unit)
    agg: Dict[Tuple[str, str], float] = {}
    
    for item in meal_items:
        recipe = item.recipe
        if not recipe:
            continue
            
        ratio = Decimal(item.servings) / Decimal(recipe.default_servings) if recipe.default_servings else 1
        
        for ing in recipe.ingredients:
            # Normalize
            norm_name = ing.name.strip().lower()
            norm_name = " ".join(norm_name.split()) # Remove double spaces
            
            norm_unit = ing.unit.strip().lower() if ing.unit else ""
            
            key = (norm_name, norm_unit)
            
            quantity = (ing.quantity * ratio)
            
            if key in agg:
                agg[key] += quantity
            else:
                agg[key] = quantity
                
    result = []
    for (name, unit), qty in agg.items():
        result.append(schemas.GroceryItem(
            name=name,
            unit=unit,
            quantity=qty,
            original_ingredients=["Generated"]
        ))
    
    # Add manual items
    # Note: Logic moved to route handler for simplicity to avoid circular imports if we used crud here,
    # OR we can inject db session here. Since route calls this, route can also call crud.get_manual...
    # BUT user asked for "generated form planning AND manual".
    # The route implementation I did in previous step combines them.
    # So this function can stay focused on PLANNED items only.
    # WAIT, if I want to merge them nicely (same ingredient name), I should do it here.
    # But for now, separate lists appended in route is safer/easier.
    # I will keep this file focused on RECIPE ingredients aggregation.
    
    return sorted(result, key=lambda x: x.name)
