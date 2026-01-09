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
        models.MealPlanItem.date <= end_date,
        models.MealPlanItem.is_shopped == False
    ).all()
    
    print(f"DEBUG: Found {len(meal_items)} meal items in range.")
    
    # Aggregate
    agg: Dict[Tuple[str, str], Decimal] = {}
    
    for item in meal_items:
        recipe = item.recipe
        if not recipe or not recipe.default_servings:
            continue
            
        print(f"DEBUG: Recipe '{recipe.title}' - Standard: {item.servings}, Veg: {item.servings_vegetarian}")

        # Ratios
        # Ratios
        total_servings = Decimal(item.servings or 0)
        veg_servings = Decimal(item.servings_vegetarian or 0)
        
        # Standard is the remainder
        std_servings = total_servings - veg_servings
        if std_servings < 0: std_servings = Decimal(0)

        base_servings = Decimal(recipe.default_servings or 1)
        
        ratio_all = total_servings / base_servings
        ratio_std = std_servings / base_servings
        ratio_veg = veg_servings / base_servings

        for ing in recipe.ingredients:
            # Normalize
            norm_name = ing.name.strip().lower()
            norm_name = " ".join(norm_name.split()) 
            norm_unit = ing.unit.strip().lower() if ing.unit else ""
            key = (norm_name, norm_unit)
            
            # Determine which ratio to use
            mode = getattr(ing, 'variant_mode', 'all')
            if not mode: mode = 'all'
            
            qty_needed = Decimal(0)
            
            if mode == 'all':
                qty_needed = Decimal(ing.quantity) * ratio_all
            elif mode == 'standard':
                qty_needed = Decimal(ing.quantity) * ratio_std
            elif mode == 'vegetarian':
                qty_needed = Decimal(ing.quantity) * ratio_veg
                
            if qty_needed > 0:
                if key in agg:
                    agg[key] += qty_needed
                else:
                    agg[key] = qty_needed
                
    result = []
    for (name, unit), qty in agg.items():
        result.append(schemas.GroceryItem(
            name=name,
            unit=unit,
            quantity=qty,
            original_ingredients=["Generated"]
        ))
    
    return sorted(result, key=lambda x: x.name)
