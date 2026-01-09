from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from .. import schemas, crud, models
from ..services import grocery
from ..db import get_db

router = APIRouter(prefix="/grocery-list", tags=["grocery-list"])

@router.get("/", response_model=List[schemas.GroceryItem])
def get_grocery_list(start: date, end: date, db: Session = Depends(get_db)):
    try:
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
                original_ingredients=["Manual Item", m.category]
            ))
        
        # Combine 
        return generated + manual_list
    except Exception as e:
        print(f"CRITICAL GROCERY ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Grocery Error: {str(e)}")

@router.post("/manual", response_model=schemas.GroceryManualItem)
def create_manual_item(item: schemas.GroceryManualItemCreate, db: Session = Depends(get_db)):
    try:
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
    except Exception as e:
        db.rollback()
        print(f"ERROR Create Manual: {e}")
        raise HTTPException(status_code=500, detail=f"Manual Item Error: {str(e)}")

@router.delete("/manual/{item_id}")
def delete_manual_item(item_id: int, db: Session = Depends(get_db)):
    crud.delete_manual_grocery_item(db, item_id)
    return {"status": "ok"}

@router.get("/library", response_model=List[schemas.GroceryLibraryItem])
def get_grocery_library(db: Session = Depends(get_db)):
    # Return items sorted by usage count (most frequent first)
    return db.query(models.GroceryLibraryItem).order_by(models.GroceryLibraryItem.usage_count.desc()).all()

@router.put("/library/{item_id}", response_model=schemas.GroceryLibraryItem)
def update_library_item(item_id: int, item: schemas.GroceryLibraryItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.GroceryLibraryItem).filter(models.GroceryLibraryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.name:
        db_item.name = item.name
    if item.category:
        db_item.category = item.category
    # Check if field is present in update data to allow creating empty string or null?
    # Pydantic optional defaults to None usually if not sent. 
    # Let's assume sending value means update.
    if item.default_unit is not None:
        db_item.default_unit = item.default_unit
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/library/{item_id}")
def delete_library_item(item_id: int, db: Session = Depends(get_db)):
    db.query(models.GroceryLibraryItem).filter(models.GroceryLibraryItem.id == item_id).delete()
    db.commit()
    return {"status": "ok"}

@router.post("/checkout")
def checkout_grocery_list(start: date, end: date, db: Session = Depends(get_db)):
    try:
        # 1. Mark meal plan items as shopped
        db.query(models.MealPlanItem).filter(
            models.MealPlanItem.date >= start,
            models.MealPlanItem.date <= end
        ).update({models.MealPlanItem.is_shopped: True}, synchronize_session=False)
        
        # 2. Clear manual items (Assume all manual items currently in list are bought)
        db.query(models.GroceryManualItem).delete()
        
        db.commit()
        return {"status": "ok", "message": "Grocery list cleared and items marked as shopped."}
    except Exception as e:
        db.rollback()
        print(f"ERROR Checkout: {e}")
        return {"status": "error", "detail": str(e)}
