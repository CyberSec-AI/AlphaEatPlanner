#!/bin/bash

echo "🚀 Démarrage de la mise à jour (MODE LOCAL - PRÉSERVE VOS MODIFICATIONS)..."

# Définition du dossier racine (suppose que vous lancez le script depuis AlphaEatPlanner)
# Si le dossier meal-planner existe, on y entre.
if [ -d "meal-planner" ]; then
    cd meal-planner
fi

echo "📂 Répertoire de travail : $(pwd)"

# 1. Arrêt des services
echo "🛑 Arrêt des services..."
# On cible le fichier docker-compose spécifique
docker compose -f deploy/docker-compose.yml down

# 2. Redémarrage avec reconstruction (Force la prise en compte de app.js et du backend)
echo "🔥 Reconstruction et redémarrage..."
docker compose -f deploy/docker-compose.yml up -d --build --remove-orphans

echo "⏳ Attente du démarrage de la base de données (10s)..."
sleep 10

# 3. Migrations (Base de données)
echo "📦 Application des migrations..."

# A. Via le script Python (Plus robuste pour la structure)
echo "   - Exécution force_migration.py..."
docker cp backend/force_migration.py meal_planner_backend:/app/force_migration.py
docker exec meal_planner_backend python /app/force_migration.py

# B. Via SQL (Sécurité supplémentaire)
echo "   - Exécution des fichiers SQL..."
# Note: Les variables d'env doivent être set ou on utilise root/rootpassword par défaut si fail
# On essaie de lire le .env si possible, sinon on suppose les valeurs par défaut du docker-compose
# DB_USER=user, DB_PASSWORD=userpassword, DB_NAME=mealplanner
docker exec -i meal_planner_db mysql -uuser -puserpassword mealplanner < deploy/update_db_v5.sql 2>/dev/null || echo "   (SQL v5 ignoré ou déjà fait)"

echo "✅ Mise à jour terminée !"
echo "👉 IMPORTANT : Videz le cache de votre navigateur (Ctrl + F5) avant de tester."
