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

    except Exception as e:
        print(f"💥 Erreur inattendue pendant la réparation: {e}")
    finally:
        if connection:
            connection.close()
    
    print("🏁 Fin du diagnostic.")

if __name__ == "__main__":
    fix_database()

