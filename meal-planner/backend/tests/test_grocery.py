import unittest
from decimal import Decimal
from datetime import date
from unittest.mock import MagicMock
from app.services.grocery import generate_grocery_list
from app import models, schemas

class TestGroceryAggregation(unittest.TestCase):
    def test_aggregation_simple(self):
        # Mock DB Session
        db = MagicMock()
        
        # Mock Data
        recipe1 = models.Recipe(id=1, default_servings=2, ingredients=[
            models.RecipeIngredient(name="Tomato ", quantity=Decimal("2"), unit="pcs"),
            models.RecipeIngredient(name="onion", quantity=Decimal("1"), unit="pcs")
        ])
        
        recipe2 = models.Recipe(id=2, default_servings=4, ingredients=[
            models.RecipeIngredient(name="tomato", quantity=Decimal("4"), unit="pcs")
        ])
        
        item1 = models.MealPlanItem(date=date(2023, 1, 1), servings=2, recipe=recipe1) # 1x recipe1
        item2 = models.MealPlanItem(date=date(2023, 1, 1), servings=2, recipe=recipe2) # 0.5x recipe2
        
        # item1: 2 tomatos, 1 onion
        # item2: 0.5 * 4 = 2 tomatos
        # Total: 4 tomatos, 1 onion
        
        db.query().filter().all.return_value = [item1, item2]
        
        result = generate_grocery_list(db, date(2023, 1, 1), date(2023, 1, 1))
        
        self.assertEqual(len(result), 2)
        
        # Sort order is by name: onion, tomato
        onion = result[0]
        tomato = result[1]
        
        self.assertEqual(onion.name, "onion")
        self.assertEqual(onion.quantity, Decimal("1"))
        
        self.assertEqual(tomato.name, "tomato")
        self.assertEqual(tomato.quantity, Decimal("4"))

    def test_normalization(self):
        db = MagicMock()
        recipe = models.Recipe(id=1, default_servings=1, ingredients=[
            models.RecipeIngredient(name=" Milk ", quantity=Decimal("1"), unit=" L "),
            models.RecipeIngredient(name="milk", quantity=Decimal("2"), unit="l")
        ])
        item = models.MealPlanItem(recipe=recipe, servings=1)
        db.query().filter().all.return_value = [item]
        
        result = generate_grocery_list(db, date.today(), date.today())
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].name, "milk")
        self.assertEqual(result[0].unit, "l")
        self.assertEqual(result[0].quantity, Decimal("3"))

if __name__ == '__main__':
    unittest.main()
