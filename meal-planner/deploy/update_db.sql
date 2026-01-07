-- EXÉCUTEZ CE SCRIPT DANS ADMINER (http://VOTRE_IP:8080)
-- SI VOUS AVEZ DÉJÀ UNE BASE DE DONNÉES EXISTANTE.
-- SINON, si vous installez pour la première fois, ce script est inutile (les tables seront créées automatiquement).

USE mealplanner;

-- 1. Ajout de la colonne image pour les recettes
ALTER TABLE recipes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;

-- 2. Ajout du type de repas (matin, midi, soir) pour le planning
ALTER TABLE meal_plan_items ADD COLUMN meal_type VARCHAR(20) DEFAULT 'dinner';

-- 3. Création de la table pour les articles manuels de courses
CREATE TABLE IF NOT EXISTS grocery_manual_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(50),
    is_checked BOOLEAN DEFAULT 0,
    INDEX (name)
);
