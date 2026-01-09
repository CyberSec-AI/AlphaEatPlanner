from app.db import SessionLocal
from app.models import User
from app.auth_utils import get_password_hash

def reset():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin"
        
        print(f"Checking user '{username}'...")
        user = db.query(User).filter(User.username == username).first()
        
        if user:
            print("User found. Updating password...")
            user.hashed_password = get_password_hash(password)
        else:
            print("User NOT found. Creating new user...")
            user = User(username=username, hashed_password=get_password_hash(password))
            db.add(user)
            
        db.commit()
        print("-------------")
        print("SUCCESS! User 'admin' has been updated with password 'admin'.")
        print("-------------")
        
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset()
