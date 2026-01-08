@echo off
echo ===================================================
echo 🥑 EatPlanner - Reparation de la Base de Donnees
echo ===================================================
echo.
echo Tentative de lancement du script de reparation DANS le conteneur...
echo.

docker exec -it meal_planner_backend python check_and_fix.py

echo.
echo ===================================================
echo Si vous voyez "REPARATION TERMINEE" ci-dessus, c'est bon !
echo Si vous voyez une erreur, copiez-la moi.
echo ===================================================
pause
