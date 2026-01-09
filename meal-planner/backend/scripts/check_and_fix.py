import os
import time
import sqlalchemy
from sqlalchemy import text, create_engine, inspect

# Standalone DB Fixer - No app imports to avoid path issues
def get_db_url():
    # Priority 1: Use the full DATABASE_URL if available (passed by Docker)
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url
        
    # Priority 2: Fallback to individual variables (or defaults)
    user = os.getenv("DB_USER", "user")
    password = os.getenv("DB_PASSWORD", "password")
    host = os.getenv("DB_HOST", "db")
    db_name = os.getenv("DB_NAME", "mealplanner")
    return f"mysql+pymysql://{user}:{password}@{host}:3306/{db_name}"

def fix_database():
    print("🚑 [STANDALONE] DÉBUT DU DIAGNOSTIC & RÉPARATION BASE DE DONNÉES 🚑")
    
    db_url = get_db_url()
    print(f"🔌 Tentative de connexion...")
    
    connection = None
    engine = None
    max_retries = 15
    
    for i in range(max_retries):
        try:
            engine = create_engine(db_url)
            connection = engine.connect()
            print("✅ Connexion réussie !")
            break
        except Exception as e:
            print(f"⏳ (Essai {i+1}/{max_retries}) Attente DB... ({e})")
            time.sleep(3)
            
    if not connection:
        print("❌ ECHEC FATAL: Impossible de se connecter à la DB.")
        return

    try:
        with connection.begin() as trans:
             # Simply try to add columns. If they exist, it throws. We catch and ignore.
             commands = [
                 "ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT NULL;",
                 "ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) DEFAULT NULL;",
                 "ALTER TABLE recipes ADD COLUMN author_id INT DEFAULT NULL;",
                 "ALTER TABLE recipes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;",
                 "ALTER TABLE recipe_ingredients ADD COLUMN variant_mode VARCHAR(20) DEFAULT 'all';",
                 "ALTER TABLE meal_plan_items ADD COLUMN servings_vegetarian INT DEFAULT 0;",
                 "ALTER TABLE meal_plan_items ADD COLUMN is_shopped BOOLEAN DEFAULT FALSE;",
                 "ALTER TABLE grocery_manual_items ADD COLUMN category VARCHAR(50) DEFAULT 'Divers';"
             ]
             
             for cmd in commands:
                 try:
                     connection.execute(text(cmd))
                     print(f"✅ Applied: {cmd}")
                 except Exception as e:
                     # Most likely "Duplicate column name"
                     print(f"ℹ️ Skipped (exists): {cmd[:20]}...")



    except Exception as e:
        print(f"💥 Erreur inattendue pendant la réparation: {e}")
    finally:
        if connection:
            connection.close()
    
    print("🏁 Fin du diagnostic.")

if __name__ == "__main__":
    fix_database()

