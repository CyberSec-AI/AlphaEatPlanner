const API_URL = ""; // Nginx Proxy handles routing to Backend

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
        delete_confirm: "Are you sure you want to delete this?",
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
        meal_type: "Meal Type",
        leftovers_label: "Cook enough for leftovers (Lunch tomorrow)",
        image_url: "Image URL (Optional)",
        manual_items: "Manual Items",
        add_item: "Add Item",
        item_name: "Item Name",
        error_api: "Connection Error: Could not save/load data. Please check your internet or server."
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
        delete_confirm: "Êtes-vous sûr de vouloir supprimer ceci ?",
        breakfast: "Petit Déjeuner",
        lunch: "Déjeuner",
        dinner: "Dîner",
        meal_type: "Type de Repas",
        leftovers_label: "Cuisiner pour les restes (Demain midi)",
        image_url: "URL Image (Optionnel)",
        manual_items: "Articles Manuels",
        add_item: "Ajouter Article",
        item_name: "Nom de l'article",
        error_api: "Erreur de Connexion : Impossible de sauvegarder/charger les données. Vérifiez votre serveur."
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
                console.error(e);
                alert(Alpine.store('i18n').t('error_api'));
                this.list = [];
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
                alert(Alpine.store('i18n').t('error_api'));
                return false;
            }
            return false;
        },
        async delete(id) {
            if (!confirm(Alpine.store('i18n').t('delete_confirm'))) return;
            try {
                const res = await fetch(`${API_URL}/recipes/${id}`, { method: 'DELETE' });
                if (res.ok) this.fetch();
                else throw new Error("Delete failed");
            } catch (e) {
                alert(Alpine.store('i18n').t('error_api'));
            }
        },
        async updateRating(id, rating) {
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
            } catch (e) { console.error("Rating update failed", e); }
        },
        async uploadImage(file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch(`${API_URL}/upload/`, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.url; // Returns /static/images/uuid.jpg
                }
            } catch (e) {
                console.error(e);
                alert("Upload Failed");
            }
            return null;
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
                console.error(e);
                alert(Alpine.store('i18n').t('error_api'));
                this.weekItems = [];
            }
        },
        async add(item, withLeftovers = false) {
            try {
                // Main Item
                const res = await fetch(`${API_URL}/meal-plan/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });

                if (!res.ok) throw new Error('Failed main item');

                // Leftovers Logic (Next Day Lunch)
                if (withLeftovers) {
                    const nextDay = new Date(item.date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const leftoverItem = {
                        ...item,
                        date: nextDay.toISOString().split('T')[0],
                        meal_type: 'lunch'
                    };
                    await fetch(`${API_URL}/meal-plan/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(leftoverItem)
                    });
                }

                return true;
            } catch (e) {
                alert(Alpine.store('i18n').t('error_api'));
                return false;
            }
        },
        async remove(id) {
            if (!confirm(Alpine.store('i18n').t('delete_confirm'))) return false;
            try {
                const res = await fetch(`${API_URL}/meal-plan/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed');
                return true;
            } catch (e) {
                alert(Alpine.store('i18n').t('error_api'));
                return false;
            }
        }
    });

    Alpine.store('grocery', {
        manualItems: [],
        async fetchManual() {
            try {
                // Note: This logic might be redundant if the main grocery list endpoint already returns combined items.
                // However, for adding/deleting SPECIFIC manual items, we might need this list separately or parsed from the main list.
                // Given the route implementation returns a combined list with "Manual Item" marker, 
                // let's rely on the main list for display, but here we provide helpers for ADD/DELETE Actions.
            } catch (e) { }
        },
        async addManual(item) {
            try {
                const res = await fetch(`${API_URL}/grocery-list/manual`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                return res.ok;
            } catch (e) {
                alert(Alpine.store('i18n').t('error_api'));
                return false;
            }
        },
        async removeManual(id) {
            try {
                const res = await fetch(`${API_URL}/grocery-list/manual/${id}`, { method: 'DELETE' });
                return res.ok;
            } catch (e) { return false; }
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
