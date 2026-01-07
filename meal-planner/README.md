# Meal Planner

Self-hostable Meal Planner application built with FastAPI and MySQL.

## Features

- **Recipes**: Manage your favorite recipes with tags and default servings.
- **Meal Plan**: Schedule meals for specific dates.
- **Grocery List**: Automatically aggregate ingredients for a date range.
- **Dockerized**: Easy deployment with Docker Compose.

## Prerequisites

- Docker and Docker Compose

## Quick Start

1.  Clone the repository (if applicable) or navigate to the project directory.
2.  Navigate to `deploy` directory:
    ```bash
    cd deploy
    ```
3.  Copy `.env.example` to `.env` (already done by setup script if automated):
    ```bash
    cp .env.example .env
    ```
    Edit `.env` if you want to change passwords.
4.  Start the services:
    ```bash
    docker compose up -d --build
    ```
5.  Access the Web Interface: [http://localhost:3000](http://localhost:3000)
    - **Dashboard**: Overview of the app.
    - **Recipes**: Manage your recipes.
    - **Planner**: Plan your weekly meals.
    - **Grocery**: Generate shopping lists.
6.  Access the API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
7.  Access Adminer (Database UI): [http://localhost:8080](http://localhost:8080)
    - System: MySQL
    - Server: db
    - Username/Password/Database: As defined in `.env` (default: mealuser/mealpassword/mealplanner)

## Usage

### Managing Recipes
- Use `POST /recipes/` to add recipes.
- Include ingredients with quantities and units.

### Planning Meals
- Use `POST /meal-plan/` to assign a recipe to a date.
- Specify the number of servings (default is recipe's default).

### Grocery List
- Use `GET /grocery-list/?start=YYYY-MM-DD&end=YYYY-MM-DD` to generate a shopping list.
- Ingredients are aggregated by name and unit.

## Development

- Backend code is in `meal-planner/backend`.
- Database models in `models.py`.
- API routes in `api/`.

## Backup & Restore

**Backup:**
```bash
docker exec meal_planner_db /usr/bin/mysqldump -u root --password=rootpassword mealplanner > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker exec -i meal_planner_db /usr/bin/mysql -u root --password=rootpassword mealplanner
```
