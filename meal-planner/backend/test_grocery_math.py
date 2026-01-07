from unittest.mock import MagicMock
from app.services.grocery import generate_grocery_list
from app.models import MealPlanItem, Recipe, RecipeIngredient
from datetime import date
from decimal import Decimal

def test_grocery_logic():
    print("--- TEST LOGIQUE COURSES V7 ---")
    
    # 1. Setup Mock Data
    print("1. Création Recette 'Tacos' (Base: 2 pers, Steak: 100g)")
    recipe = Recipe(
        id=1, 
        title="Tacos", 
        default_servings=2, 
        ingredients=[
            RecipeIngredient(name="Steak", quantity=100.0, unit="g"),
            RecipeIngredient(name="Poulet", quantity=100.0, unit="g")
        ]
    )
    
    print("2. Ajout au Planning (Pour: 3 pers)")
    # Ratio attendu: 3 / 2 = 1.5
    # Steak attendu: 100 * 1.5 = 150
    item = MealPlanItem(
        id=1,
        date=date.today(),
        servings=3,
        recipe=recipe
    )
    
    # Mock DB Session
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.all.return_value = [item]
    
    # 3. Execution
    print("3. Génération de la liste...")
    result = generate_grocery_list(mock_db, date.today(), date.today())
    
    # 4. Verification
    steak = next((i for i in result if i.name.lower() == "steak"), None)
    
    if steak:
        print(f"👉 Résultat Steak: {steak.quantity} {steak.unit}")
        if steak.quantity == 150.0:
            print("✅ SUCCÈS : Calcul proportionnel correct (100g * 1.5 = 150g).")
        else:
            print(f"❌ ÉCHEC : Attendu 150.0, Reçu {steak.quantity}")
    else:
        print("❌ ÉCHEC : Steak manquant.")

if __name__ == "__main__":
    test_grocery_logic()
