const API_URL = `${window.location.protocol}//${window.location.hostname}:8000`;

// Mock Data for Design Preview
const MOCK_RECIPES = [
    { id: 1, title: "Spaghetti Carbonara", description: "Authentic Italian pasta", default_servings: 2, rating: 5, is_vegetarian: false, ingredients: [{ name: "Spaghetti", quantity: 200, unit: "g" }, { name: "Eggs", quantity: 2, unit: "pcs" }] },
    { id: 2, title: "Greek Salad", description: "Fresh garden salad", default_servings: 1, rating: 4, is_vegetarian: true, ingredients: [{ name: "Cucumber", quantity: 1, unit: "pcs" }, { name: "Feta", quantity: 100, unit: "g" }] },
    { id: 3, title: "Beef Stew", description: "Slow cooked beef", default_servings: 4, rating: 3, is_vegetarian: false, ingredients: [{ name: "Beef", quantity: 500, unit: "g" }, { name: "Carrots", quantity: 3, unit: "pcs" }] }
];

const MOCK_PLAN = [
    { id: 1, date: new Date().toISOString().split('T')[0], recipe: MOCK_RECIPES[0], servings: 2 },
    { id: 2, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], recipe: MOCK_RECIPES[1], servings: 1 }
];

const MOCK_GROCERY = [
    { name: "Spaghetti", quantity: 200, unit: "g" },
    { name: "Eggs", quantity: 2, unit: "pcs" },
    { name: "Cucumber", quantity: 1, unit: "pcs" }
];

const TRANSLATIONS = {
    en: {
        title: "Meal Planner",
        dashboard: "Dashboard",
        recipes: "Recipes",
        planner: "Planner",
        grocery: "Grocery List",
        welcome: "Welcome to Your Meal Planner",
        welcome_sub: "Organize meals, manage recipes, and generate lists effortlessly.",
        browse_recipes: "Browse Recipes",
        plan_week: "Plan Your Week",
        add_recipe: "New Recipe",
        servings: "Servings",
        ingredients: "Ingredients",
        save: "Save",
        cancel: "Cancel",
        no_recipes: "No recipes found.",
        weekly_plan: "Weekly Plan",
        prev: "Prev",
        next: "Next",
        add_meal: "Add Meal",
        generate_list: "Generate List",
        from: "From",
        to: "To",
        print: "Print",
        loading: "Loading...",
        no_items: "No items needed.",
        vegetarian: "Vegetarian",
        is_vegetarian_label: "Is this recipe vegetarian?",
        delete_confirm: "Are you sure you want to delete this?"
    },
    fr: {
        title: "Planificateur de Repas",
        dashboard: "Tableau de bord",
        recipes: "Recettes",
        planner: "Planning",
        grocery: "Liste de courses",
        welcome: "Bienvenue sur votre Planificateur",
        welcome_sub: "Organisez vos repas, gérez vos recettes et générez vos listes simplement.",
        browse_recipes: "Voir les Recettes",
        plan_week: "Planifier la Semaine",
        add_recipe: "Nouvelle Recette",
        servings: "Portions",
        ingredients: "Ingrédients",
        save: "Enregistrer",
        cancel: "Annuler",
        no_recipes: "Aucune recette trouvée.",
        weekly_plan: "Planning Hebdomadaire",
        prev: "Préc",
        next: "Suiv",
        add_meal: "Ajouter Repas",
        generate_list: "Générer Liste",
        from: "Du",
        to: "Au",
        print: "Imprimer",
        loading: "Chargement...",
        no_items: "Aucun article nécessaire.",
        vegetarian: "Végétarien",
        is_vegetarian_label: "Cette recette est-elle végétarienne ?",
        delete_confirm: "Êtes-vous sûr de vouloir supprimer ceci ?"
    }
};

document.addEventListener('alpine:init', () => {

    Alpine.store('i18n', {
        lang: 'fr',
        t(key) { return TRANSLATIONS[this.lang][key] || key; },
        toggle() { this.lang = this.lang === 'en' ? 'fr' : 'en'; }
    });

    Alpine.store('recipes', {
        list: [],
        loading: false,
        async fetch() {
            this.loading = true;
            try {
                const res = await fetch(`${API_URL}/recipes/`);
                if (!res.ok) throw new Error('Failed');
                this.list = await res.json();
            } catch (e) {
                console.warn("API unavailable, using mock data");
                this.list = MOCK_RECIPES;
            } finally {
                this.loading = false;
            }
        },
        async create(recipe) {
            try {
                const res = await fetch(`${API_URL}/recipes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recipe)
                });
                if (res.ok) { this.fetch(); return true; }
            } catch (e) {
                recipe.id = Math.random();
                this.list.push(recipe);
                return true;
            }
            return false;
        },
        async delete(id) {
            if (!confirm(Alpine.store('i18n').t('delete_confirm'))) return;
            try {
                const res = await fetch(`${API_URL}/recipes/${id}`, { method: 'DELETE' });
                if (res.ok) this.fetch();
            } catch (e) {
                this.list = this.list.filter(r => r.id !== id);
            }
        },
        async updateRating(id, rating) {
            const recipe = this.list.find(r => r.id === id);
            if (recipe) recipe.rating = rating;

            try {
                const res = await fetch(`${API_URL}/recipes/${id}`);
                if (res.ok) {
                    const fullRecipe = await res.json();
                    fullRecipe.rating = rating;
                    fullRecipe.ingredients = fullRecipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }));
                    await fetch(`${API_URL}/recipes/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullRecipe)
                    });
                }
            } catch (e) { }
        }
    });

    Alpine.store('planner', {
        weekItems: [],
        currentStart: new Date(),
        async fetchWeek(startStr, endStr) {
            try {
                const res = await fetch(`${API_URL}/meal-plan/?start=${startStr}&end=${endStr}`);
                if (!res.ok) throw new Error('Failed');
                this.weekItems = await res.json();
            } catch (e) {
                this.weekItems = MOCK_PLAN;
            }
        },
        async add(item) {
            try {
                const res = await fetch(`${API_URL}/meal-plan/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                return res.ok;
            } catch (e) {
                const recipe = MOCK_RECIPES.find(r => r.id === item.recipe_id);
                this.weekItems.push({ ...item, id: Math.random(), recipe: recipe });
                return true;
            }
        },
        async remove(id) {
            if (!confirm(Alpine.store('i18n').t('delete_confirm'))) return false;
            try {
                const res = await fetch(`${API_URL}/meal-plan/${id}`, { method: 'DELETE' });
                return res.ok;
            } catch (e) {
                this.weekItems = this.weekItems.filter(i => i.id !== id);
                return true;
            }
        }
    });
});

function getWeekRange(date) {
    const start = new Date(date);
    const day = start.getDay() || 7;
    if (day !== 1) start.setHours(-24 * (day - 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        startObj: start
    };
}
