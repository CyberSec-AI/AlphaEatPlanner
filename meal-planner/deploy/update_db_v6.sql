USE mealplanner;

-- 1. Add fields to Users
ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) DEFAULT NULL;

-- 2. Add author to Recipes
ALTER TABLE recipes ADD COLUMN author_id INT DEFAULT NULL;
ALTER TABLE recipes ADD CONSTRAINT fk_recipes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
