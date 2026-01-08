from app.db import engine
from sqlalchemy import text

def fix_db():
    print("🔧 Checking Database Schema...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            conn.execute(text("SELECT is_shopped FROM meal_plan_items LIMIT 1"))
            print("✅ Column 'is_shopped' already exists.")
        except Exception as e:
            print("⚠️ Column 'is_shopped' missing. Adding it...")
            try:
                conn.execute(text("ALTER TABLE meal_plan_items ADD COLUMN is_shopped BOOLEAN DEFAULT FALSE"))
                conn.commit()
                print("✅ Column added successfully!")
            except Exception as e2:
                print(f"❌ Failed to add column: {e2}")

if __name__ == "__main__":
    fix_db()
