from app.db import engine
from sqlalchemy import text
import sys

def run_migrations():
    print("🚀 Démarrage de la migration forcée de la base de données...")
    
    commands = [
        # V4: Grocery Library & Manual Items Category
        """
        CREATE TABLE IF NOT EXISTS grocery_library (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(50) DEFAULT 'Divers',
            default_unit VARCHAR(50),
            usage_count INT DEFAULT 1,
            last_used DATE,
            UNIQUE KEY unique_item (name)
        );
        """,
        """
        SELECT count(*) FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'mealplanner' 
        AND TABLE_NAME = 'grocery_manual_items' 
        AND COLUMN_NAME = 'category';
        """, 
        # Note: Logic to add column only if missing is harder in raw sql without procedure.
        # simpler: Try ADD COLUMN and catch error if exists.
        "ALTER TABLE grocery_manual_items ADD COLUMN category VARCHAR(50) DEFAULT 'Divers';",
        
        # V5: Is Shopped
        "ALTER TABLE meal_plan_items ADD COLUMN is_shopped BOOLEAN DEFAULT FALSE;"
    ]

    with engine.connect() as conn:
        for cmd in commands:
            try:
                # Stupid check for select (not a migration)
                if cmd.strip().startswith("SELECT"):
                    continue

                print(f"👉 Exécution: {cmd[:50]}...")
                conn.execute(text(cmd))
                conn.commit()
                print("   ✅ Succès")
            except Exception as e:
                err_str = str(e).lower()
                if "duplicate column" in err_str or "already exists" in err_str:
                    print("   ⚠️ Déjà appliqué (Ignoré)")
                else:
                    print(f"   ❌ Erreur: {e}")

    print("🏁 Migration terminée.")

if __name__ == "__main__":
    run_migrations()
