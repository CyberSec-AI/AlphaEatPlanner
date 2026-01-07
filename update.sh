#!/bin/bash

# Configuration
REPO_USER="CyberSec-AI"
REPO_NAME="AlphaEatPlanner"
INSTALL_DIR=~/infra/docker/EatPlanner
BACKUP_DIR=~/infra/docker/EatPlanner/backups
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Démarrage de la mise à jour..."

# 1. Créer le dossier de backup si inexistant
mkdir -p "$BACKUP_DIR"

# 2. Sauvegarde de la configuration actuelle (.env) et de la base de données
echo "💾 Sauvegarde de la configuration et des données..."
if [ -d "$INSTALL_DIR/AlphaEatPlanner-main" ]; then
    cp "$INSTALL_DIR/AlphaEatPlanner-main/meal-planner/deploy/.env" "$BACKUP_DIR/.env.backup"
    
    # Backup DB (si le conteneur tourne)
    if docker ps | grep -q meal_planner_db; then
        docker exec meal_planner_db mysqldump -u root -prootpassword mealplanner > "$BACKUP_DIR/db_$DATE.sql"
        echo "✅ Base de données sauvegardée dans $BACKUP_DIR/db_$DATE.sql"
    fi
fi

# 3. Arrêt des conteneurs
echo "🛑 Arrêt des services..."
cd "$INSTALL_DIR/AlphaEatPlanner-main" 2>/dev/null || cd "$INSTALL_DIR"
docker compose down

# 4. Nettoyage de l'ancien code (avec sudo pour les fichiers root Docker)
echo "🧹 Nettoyage..."
cd "$INSTALL_DIR"
# On supprime tout SAUF le dossier backups s'il est dedans
sudo rm -rf AlphaEatPlanner-main main.zip

# 5. Téléchargement de la nouvelle version
echo "📥 Téléchargement de la dernière version..."
# NOTE: Si le repo est privé, il faut un token : https://TOKEN@github.com/...
wget "https://github.com/$REPO_USER/$REPO_NAME/archive/refs/heads/main.zip" -O main.zip

# Vérification du téléchargement
if [ ! -s main.zip ]; then
    echo "❌ ERREUR : Le téléchargement a échoué (Fichier vide ou 404)."
    echo "Vérifiez REPO_USER et REPO_NAME dans le script."
    exit 1
fi

unzip -q main.zip
rm main.zip

# Vérification dézip
if [ ! -d "$INSTALL_DIR/AlphaEatPlanner-main" ]; then
     echo "❌ ERREUR : Dossier AlphaEatPlanner-main introuvable après dézip."
     exit 1
fi

# 6. Restauration de la configuration
echo "🔧 Restauration de la configuration..."
if [ -f "$BACKUP_DIR/.env.backup" ]; then
    cp "$BACKUP_DIR/.env.backup" "$INSTALL_DIR/AlphaEatPlanner-main/meal-planner/deploy/.env"
else
    echo "⚠️ Pas de fichier .env sauvegardé ! Utilisation de l'exemple."
    cp "$INSTALL_DIR/AlphaEatPlanner-main/meal-planner/deploy/.env.example" "$INSTALL_DIR/AlphaEatPlanner-main/meal-planner/deploy/.env"
fi

# 7. Redémarrage
echo "🔥 Redémarrage et Construction..."
cd "$INSTALL_DIR/AlphaEatPlanner-main"
# Force build pour les nouvelles dépendances Python
docker compose -f meal-planner/deploy/docker-compose.yml up -d --build --remove-orphans

echo "✅ Mise à jour terminée !"
echo "👉 Site accessible sur http://$(curl -s ifconfig.me):3000"
