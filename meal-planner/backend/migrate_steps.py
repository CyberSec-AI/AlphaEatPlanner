from sqlalchemy import create_engine, text
import os

# Database URL (Should match db.py)
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/eatplanner_db"

def add_table():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Creating table recipe_steps...")
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS recipe_steps (
            id INT AUTO_INCREMENT PRIMARY_KEY,
            recipe_id INT,
            step_order INT,
            instruction TEXT,
            PRIMARY KEY (id),
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );
        """))
        print("Table created (if not exists).")

if __name__ == "__main__":
    add_table()
