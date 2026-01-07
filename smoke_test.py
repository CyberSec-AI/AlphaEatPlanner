import requests
import time
from datetime import date
from decimal import Decimal

BASE_URL = "http://localhost:8000"

def wait_for_api():
    print("Waiting for API to be ready...")
    for _ in range(10): # Try for 10 seconds
        try:
            resp = requests.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                print("API is ready!")
                return True
        except requests.ConnectionError:
            pass
        time.sleep(1)
    print("API failed to connect. Ensure Docker is running.")
    return False

def test_flow():
    # 1. Create Vegetarian Recipe
    print("Creating Vegetarian Recipe...")
    recipe_data = {
        "title": "Greek Salad",
        "description": "Fresh and healthy",
        "default_servings": 2,
        "is_favorite": True,
        "rating": 5,
        "is_vegetarian": True,
        "tags": ["salad", "greek"],
        "ingredients": [
            {"name": "Cucumber", "quantity": 1, "unit": "pcs"},
            {"name": "Feta", "quantity": 100, "unit": "g"}
        ]
    }
    resp = requests.post(f"{BASE_URL}/recipes/", json=recipe_data)
    if resp.status_code != 200:
        print(f"Failed to create recipe: {resp.text}")
        return False
    
    data = resp.json()
    recipe_id = data["id"]
    print(f"Recipe created: ID={recipe_id}")
    
    # 1.1 Verify New Fields
    if data["rating"] != 5:
        print(f"ERROR: Rating mismatch. Expected 5, got {data['rating']}")
        return False
    if data["is_vegetarian"] is not True:
        print(f"ERROR: Vegetarian mismatch. Expected True, got {data['is_vegetarian']}")
        return False
    print("Verified Rating and Vegetarian fields.")

    # 2. Add to Meal Plan
    # ... (rest of flow)
    print("Adding to Meal Plan...")
    today = date.today().isoformat()
    plan_data = {
        "date": today,
        "recipe_id": recipe_id,
        "servings": 1 # Half serving (default 2)
    }
    resp = requests.post(f"{BASE_URL}/meal-plan/", json=plan_data)
    if resp.status_code != 200: return False
    print("Meal plan item created.")

    # 3. Generate Grocery List
    print("Generating Grocery List...")
    resp = requests.get(f"{BASE_URL}/grocery-list/", params={"start": today, "end": today})
    if resp.status_code != 200: return False
    
    grocery_list = resp.json()
    print("Grocery List:", grocery_list)
    
    # Validation: 1 serving of Greek Salad
    # Ingredients: Cucumber (1 -> 0.5), Feta (100 -> 50)
    expected = {
        "cucumber": 0.5,
        "feta": 50.0
    }
    
    matched = 0
    for item in grocery_list:
        name = item["name"]
        qty = item["quantity"]
        if name in expected:
            if abs(qty - expected[name]) < 0.01:
                print(f"Confirmed: {name} - {qty} {item['unit']}")
                matched += 1
            else:
                print(f"Mismatch: {name} - Expected {expected[name]}, got {qty}")
                return False
                
    if matched == len(expected):
        print("\n>>> SMOKE TEST PASSED SUCCESSFULLY! <<<\n")
        return True
    else:
        print("Did not find all expected items.")
        return False

if __name__ == "__main__":
    if wait_for_api():
        test_flow()
    else:
        exit(1)
