#!/bin/bash
echo "🥑 Mise à jour de EatPlanner..."

# Stop containers
docker-compose -f deploy/docker-compose.yml down

# Rebuild and start
docker-compose -f deploy/docker-compose.yml up -d --build

# Wait for backend to be ready
echo "⏳ Attente du démarrage du backend (10s)..."
sleep 10

# Run DB Fix/Check explicitly inside container
echo "🛠️ Vérification et Réparation de la Base de Données..."
docker-compose -f deploy/docker-compose.yml exec -T backend python check_and_fix.py

# Show logs if it failed
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la vérification !"
    docker-compose -f deploy/docker-compose.yml logs backend
else
    echo "✅ Base de données vérifiée avec succès."
fi

# Prune unused images
docker image prune -f

echo "✅ Mise à jour terminée ! Rendez-vous sur http://localhost:3000"
