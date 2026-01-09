from app import models, auth_utils
from app.db import SessionLocal, engine

# Create tables if not exist (just in case)
models.Base.metadata.create_all(bind=engine)

def reset_admin():
    db = SessionLocal()
    try:
        print("🔌 Checking DB Connection...")
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if user:
            print("👤 User 'admin' found. Updating password...")
            user.hashed_password = auth_utils.get_password_hash("admin")
        else:
            print("👤 User 'admin' NOT found. Creating...")
            hashed = auth_utils.get_password_hash("admin")
            user = models.User(username="admin", hashed_password=hashed)
            db.add(user)
        
        db.commit()
        print("✅ SUCCESS: User 'admin' / 'admin' is ready.")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
