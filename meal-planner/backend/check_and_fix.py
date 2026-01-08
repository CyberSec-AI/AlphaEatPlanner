import sys
import os
from sqlalchemy import text, inspect
from app.db import engine
from app.models import Base

def fix_database():
    print("🚑 DÉBUT DU DIAGNOSTIC & RÉPARATION BASE DE DONNÉES 🚑")
    print("-" * 50)
    
    try:
        connection = engine.connect()
        print("✅ Connexion à la base de données : SUCCÈS")
    except Exception as e:
        print(f"❌ Connexion Impossible : {e}")
        return

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"📋 Tables existantes : {tables}")

    with connection:
        # 1. Check & Fix 'grocery_library' table
        if 'grocery_library' not in tables:
            print("⚠️ Table 'grocery_library' : MANQUANTE -> Création en cours...")
            try:
                # We use the raw SQL to be sure, or rely on create_all if models are updated
                # Let's use raw SQL for v4 specific
                sql = """
                CREATE TABLE IF NOT EXISTS grocery_library (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) DEFAULT 'Divers',
                    default_unit VARCHAR(50),
                    usage_count INT DEFAULT 1,
                    last_used DATE,
                    UNIQUE KEY unique_item (name),
                    INDEX ix_grocery_library_name (name)
                );
                """
                connection.execute(text(sql))
                print("   ✅ Table 'grocery_library' créée.")
            except Exception as e:
                print(f"   ❌ Échec création table: {e}")
        else:
            print("✅ Table 'grocery_library' : PRÉSENTE")

        # 2. Check & Fix 'grocery_manual_items' -> column 'category'
        if 'grocery_manual_items' in tables:
            columns = [c['name'] for c in inspector.get_columns('grocery_manual_items')]
            if 'category' not in columns:
                print("⚠️ Colonne 'category' (grocery_manual_items) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE grocery_manual_items ADD COLUMN category VARCHAR(50) DEFAULT 'Divers';"))
                    print("   ✅ Colonne ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec ajout colonne: {e}")
            else:
                print("✅ Colonne 'category' (grocery_manual_items) : PRÉSENTE")
        else:
            print("⚠️ Table 'grocery_manual_items' n'existe pas encore (sera créée par l'app si nécessaire).")

        # 3. Check & Fix 'meal_plan_items' -> column 'is_shopped'
        if 'meal_plan_items' in tables:
            columns = [c['name'] for c in inspector.get_columns('meal_plan_items')]
            if 'is_shopped' not in columns:
                print("⚠️ Colonne 'is_shopped' (meal_plan_items) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE meal_plan_items ADD COLUMN is_shopped BOOLEAN DEFAULT FALSE;"))
                    print("   ✅ Colonne ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec ajout colonne: {e}")
            else:
                print("✅ Colonne 'is_shopped' (meal_plan_items) : PRÉSENTE")

        # 4. Check & Fix 'recipes' -> column 'image_url'
        if 'recipes' in tables:
            columns = [c['name'] for c in inspector.get_columns('recipes')]
            if 'image_url' not in columns:
                print("⚠️ Colonne 'image_url' (recipes) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE recipes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;"))
                    print("   ✅ Colonne ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec ajout colonne: {e}")
            else:
                print("✅ Colonne 'image_url' (recipes) : PRÉSENTE")

        # 5. Check & Fix 'users' -> columns 'full_name', 'profile_picture_url'
        if 'users' in tables:
            columns = [c['name'] for c in inspector.get_columns('users')]
            if 'full_name' not in columns:
                print("⚠️ Colonne 'full_name' (users) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT NULL;"))
                    print("   ✅ Colonne 'full_name' ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec: {e}")
            
            if 'profile_picture_url' not in columns:
                print("⚠️ Colonne 'profile_picture_url' (users) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) DEFAULT NULL;"))
                    print("   ✅ Colonne 'profile_picture_url' ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec: {e}")

        # 6. Check & Fix 'recipes' -> column 'author_id'
        if 'recipes' in tables:
            columns = [c['name'] for c in inspector.get_columns('recipes')]
            if 'author_id' not in columns:
                print("⚠️ Colonne 'author_id' (recipes) : MANQUANTE -> Ajout...")
                try:
                    connection.execute(text("ALTER TABLE recipes ADD COLUMN author_id INT DEFAULT NULL;"))
                    connection.execute(text("ALTER TABLE recipes ADD CONSTRAINT fk_recipes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;"))
                    print("   ✅ Colonne 'author_id' ajoutée.")
                except Exception as e:
                    print(f"   ❌ Échec ajout colonne: {e}")
            else:
                print("✅ Colonne 'author_id' (recipes) : PRÉSENTE")
                
        connection.commit()

    print("-" * 50)
    print("🚀 RÉPARATION TERMINÉE. REDÉMARREZ L'INTERFACE SI NÉCESSAIRE.")

if __name__ == "__main__":
    fix_database()
