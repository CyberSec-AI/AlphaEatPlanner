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
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📋 Tables trouvées: {tables}")

        with connection.begin() as trans:
            # 1. USERS: Full Name & Profile Pic
            if 'users' in tables:
                cols = [c['name'] for c in inspector.get_columns('users')]
                print(f"👤 Colonnes Users: {cols}")
                
                if 'full_name' not in cols:
                    print("🛠️ Ajout 'full_name'...")
                    connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT NULL;"))
                
                if 'profile_picture_url' not in cols:
                    print("🛠️ Ajout 'profile_picture_url'...")
                    connection.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) DEFAULT NULL;"))

            # 2. RECIPES: Author ID
            if 'recipes' in tables:
                cols = [c['name'] for c in inspector.get_columns('recipes')]
                print(f"🍳 Colonnes Recipes: {cols}")
                
                if 'author_id' not in cols:
                    print("🛠️ Ajout 'author_id'...")
                    connection.execute(text("ALTER TABLE recipes ADD COLUMN author_id INT DEFAULT NULL;"))
                    try:
                        connection.execute(text("ALTER TABLE recipes ADD CONSTRAINT fk_recipes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;"))
                    except Exception as ex:
                        print(f"⚠️ Warning FK (peut-être déjà là): {ex}")
                
                if 'image_url' not in cols:
                     print("🛠️ Ajout 'image_url'...")
                     connection.execute(text("ALTER TABLE recipes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;"))

            # 3. RECIPE INGREDIENTS: Variant Mode
            if 'recipe_ingredients' in tables:
                cols = [c['name'] for c in inspector.get_columns('recipe_ingredients')]
                print(f"🥦 Colonnes Ingredients: {cols}")
                if 'variant_mode' not in cols:
                    print("🛠️ Ajout 'variant_mode' (all/standard/vegetarian)...")
                    connection.execute(text("ALTER TABLE recipe_ingredients ADD COLUMN variant_mode VARCHAR(20) DEFAULT 'all';"))

            # 4. MEAL PLAN ITEMS: Vegetarian Servings
            if 'meal_plan_items' in tables:
                cols = [c['name'] for c in inspector.get_columns('meal_plan_items')]
                print(f"📅 Colonnes MealPlan: {cols}")
                if 'servings_vegetarian' not in cols:
                    print("🛠️ Ajout 'servings_vegetarian'...")
                    connection.execute(text("ALTER TABLE meal_plan_items ADD COLUMN servings_vegetarian INT DEFAULT 0;"))
                
                # Ensure is_shopped exists (from V9)
                if 'is_shopped' not in cols:
                    print("🛠️ Ajout 'is_shopped'...")
                    connection.execute(text("ALTER TABLE meal_plan_items ADD COLUMN is_shopped BOOLEAN DEFAULT FALSE;"))

            # 5. GROCERY MANUAL ITEMS: Category
            if 'grocery_manual_items' in tables:
                cols = [c['name'] for c in inspector.get_columns('grocery_manual_items')]
                print(f"🛒 Colonnes Manual: {cols}")
                if 'category' not in cols:
                    print("🛠️ Ajout 'category'...")
                    connection.execute(text("ALTER TABLE grocery_manual_items ADD COLUMN category VARCHAR(50) DEFAULT 'Divers';"))
            
            # 6. Check for grocery_library (Just logging)
            if 'grocery_library' not in tables:
                print("⚠️ Table grocery_library manquante ! (Devrait être créée par SQLAlchemy)")
                # We could force create it but SQLAlchemy create_all usually handles this on startup if models exist.


    except Exception as e:
        print(f"💥 Erreur inattendue pendant la réparation: {e}")
    finally:
        if connection:
            connection.close()
    
    print("🏁 Fin du diagnostic.")

if __name__ == "__main__":
    fix_database()

