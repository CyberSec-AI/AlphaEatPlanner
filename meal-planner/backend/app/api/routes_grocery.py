from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from .. import schemas, crud
from ..services import grocery
from ..db import get_db

router = APIRouter(prefix="/grocery-list", tags=["grocery-list"])

@router.get("/", response_model=List[schemas.GroceryItem])
def get_grocery_list(start: date, end: date, db: Session = Depends(get_db)):
    # Get generated list from meal plan
    generated = grocery.generate_grocery_list(db, start_date=start, end_date=end)
    
    # Get manual items
    manual = crud.get_manual_grocery_items(db)
    
    # Convert manual items to GroceryItem schema
    manual_list = []
    for m in manual:
        manual_list.append(schemas.GroceryItem(
            name=m.name,
            quantity=m.quantity,
            unit=m.unit if m.unit else "",
            original_ingredients=["Manual Item", m.category] # Using list to pass category hackily or update schema
        ))
    
    # Combine or just append? 
    # For now, let's just append them to the list. 
    # Frontend can distinguish or we can merge if names match.
    # Simple append for now.
    return generated + manual_list

@router.post("/manual", response_model=schemas.GroceryManualItem)
def create_manual_item(item: schemas.GroceryManualItemCreate, db: Session = Depends(get_db)):
    # 1. Create the manual item in the grocery list
    new_item = crud.create_manual_grocery_item(db, item)
    
    # 2. Smart Save: Add or Update into Library
    # Check if exists
    existing_lib = db.query(models.GroceryLibraryItem).filter(models.GroceryLibraryItem.name == item.name).first()
    if existing_lib:
        existing_lib.usage_count += 1
        existing_lib.last_used = date.today()
        # Update category if user changed it? Let's assume most recent category is preferred.
        existing_lib.category = item.category
        if item.unit:
             existing_lib.default_unit = item.unit
    else:
        new_lib = models.GroceryLibraryItem(
            name=item.name,
            category=item.category,
            default_unit=item.unit,
            last_used=date.today()
        )
        db.add(new_lib)
    
    db.commit()
    return new_item

@router.delete("/manual/{item_id}")
def delete_manual_item(item_id: int, db: Session = Depends(get_db)):
    crud.delete_manual_grocery_item(db, item_id)
    return {"status": "ok"}

@router.get("/library", response_model=List[schemas.GroceryLibraryItem])
def get_grocery_library(db: Session = Depends(get_db)):
    # Return items sorted by usage count (most frequent first)
    return db.query(models.GroceryLibraryItem).order_by(models.GroceryLibraryItem.usage_count.desc()).all()

@router.delete("/library/{item_id}")
def delete_library_item(item_id: int, db: Session = Depends(get_db)):
    db.query(models.GroceryLibraryItem).filter(models.GroceryLibraryItem.id == item_id).delete()
    db.commit()
    return {"status": "ok"}
