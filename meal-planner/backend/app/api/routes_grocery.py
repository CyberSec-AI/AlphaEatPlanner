from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from .. import schemas
from ..services import grocery
from ..db import get_db

router = APIRouter(prefix="/grocery-list", tags=["grocery-list"])

@router.get("/", response_model=List[schemas.GroceryItem])
def get_grocery_list(start: date, end: date, db: Session = Depends(get_db)):
    return grocery.generate_grocery_list(db, start_date=start, end_date=end)
