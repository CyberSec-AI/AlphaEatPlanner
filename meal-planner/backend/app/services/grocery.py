from sqlalchemy.orm import Session
from .. import models, schemas
from datetime import date
from typing import List, Dict, Tuple
from decimal import Decimal

def generate_grocery_list(db: Session, start_date: date, end_date: date) -> List[schemas.GroceryItem]:
    print(f"DEBUG: Generating list from {start_date} to {end_date}")
    
    # Fetch meal plan items
    meal_items = db.query(models.MealPlanItem).filter(
        models.MealPlanItem.date >= start_date,
        models.MealPlanItem.date <= end_date
    ).all()
    
    print(f"DEBUG: Found {len(meal_items)} meal items in range.")
    
    # Aggregate
    # Key: (normalized_name, normalized_unit)
    agg: Dict[Tuple[str, str], float] = {}
    
    for item in meal_items:
        recipe = item.recipe
        if not recipe:
            print(f"DEBUG: Item {item.id} has no recipe!")
            continue
            
        print(f"DEBUG: Processing Recipe '{recipe.title}' (Default: {recipe.default_servings}, Plan: {item.servings})")
        ratio = Decimal(item.servings) / Decimal(recipe.default_servings) if recipe.default_servings else 1
        print(f"DEBUG: Ratio = {ratio}")
        
        if not recipe.ingredients:
            print(f"DEBUG: Recipe '{recipe.title}' has 0 ingredients.")

        for ing in recipe.ingredients:
            # Normalize
            norm_name = ing.name.strip().lower()
            norm_name = " ".join(norm_name.split()) # Remove double spaces
            
            norm_unit = ing.unit.strip().lower() if ing.unit else ""
            
            key = (norm_name, norm_unit)
            
            quantity = (Decimal(ing.quantity) * ratio)
            
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
    
    print(f"DEBUG: Final generated list has {len(result)} items.")
    return sorted(result, key=lambda x: x.name)
