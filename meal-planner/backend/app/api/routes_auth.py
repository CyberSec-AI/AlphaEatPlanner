from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, auth_utils, schemas, deps
from ..db import get_db

router = APIRouter(tags=["authentication"])

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_utils.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": {"username": user.username, "full_name": user.full_name, "profile_picture_url": user.profile_picture_url}}

@router.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check existing
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        username=user.username, 
        hashed_password=hashed_pwd,
        full_name=user.full_name,
        profile_picture_url=user.profile_picture_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(deps.get_current_user)):
    return current_user

@router.put("/users/me", response_model=schemas.User)
async def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.profile_picture_url is not None:
        current_user.profile_picture_url = user_update.profile_picture_url
    if user_update.password is not None:
        current_user.hashed_password = auth_utils.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

