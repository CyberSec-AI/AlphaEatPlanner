#!/bin/bash
echo "🥑 Mise à jour de EatPlanner..."

# Stop containers
docker-compose -f deploy/docker-compose.yml down

# Rebuild and start
docker-compose -f deploy/docker-compose.yml up -d --build

# Prune unused images to save space
docker image prune -f

echo "✅ Mise à jour terminée ! Rendez-vous sur http://localhost:3000"
