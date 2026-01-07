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
            original_ingredients=["Manual Item"] # Marker
        ))
    
    # Combine or just append? 
    # For now, let's just append them to the list. 
    # Frontend can distinguish or we can merge if names match.
    # Simple append for now.
    return generated + manual_list

@router.post("/manual", response_model=schemas.GroceryManualItem)
def create_manual_item(item: schemas.GroceryManualItemCreate, db: Session = Depends(get_db)):
    return crud.create_manual_grocery_item(db, item)

@router.delete("/manual/{item_id}")
def delete_manual_item(item_id: int, db: Session = Depends(get_db)):
    crud.delete_manual_grocery_item(db, item_id)
    return {"status": "ok"}
