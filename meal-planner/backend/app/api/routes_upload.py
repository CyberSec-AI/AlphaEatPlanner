from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "/app/static/images"

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_location = f"{UPLOAD_DIR}/{filename}"
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL (relative to API root, served by StaticFiles)
        return {"url": f"/static/images/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
