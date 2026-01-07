-- EXÉCUTEZ CE SCRIPT DANS ADMINER
USE mealplanner;

-- 1. Ajout de la catégorie pour les articles manuels
ALTER TABLE grocery_manual_items ADD COLUMN category VARCHAR(50) DEFAULT 'Divers';

-- 2. Création de la bibliothèque d'articles (Historique Intelligent)
CREATE TABLE IF NOT EXISTS grocery_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Divers',
    default_unit VARCHAR(50),
    usage_count INT DEFAULT 1,
    last_used DATE,
    UNIQUE KEY unique_item (name)
);
