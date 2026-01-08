const API_URL = "";
window.API_URL = API_URL;

// Utility for Week Range
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

document.addEventListener('alpine:init', () => {

    // --- STORES ---

    Alpine.store('auth', {
        token: localStorage.getItem('token'),
        async login(username, password) {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            try {
                const res = await fetch(`${API_URL}/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    this.token = data.access_token;
                    localStorage.setItem('token', this.token);
                    return true;
                }
            } catch (e) { }
            return false;
        },
        logout() {
            this.token = null;
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        },
        check() {
            if (!this.token && !window.location.href.includes('login.html')) {
                window.location.href = 'login.html';
            }
        },
        async createUser(username, password) {
            try {
                const res = await fetch(`${API_URL}/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                    method: 'POST'
                });
                if (res.ok) return true;
                else {
                    const err = await res.json();
                    alert("Erreur: " + (err.detail || "Impossible de créer l'utilisateur"));
                }
            } catch (e) {
                alert("Erreur technique: " + e.message);
            }
            return false;
        }
    });

    Alpine.store('i18n', {
        lang: 'fr', // Force FR default
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
                    return data.url;
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
        async fetchWeek(startStr, endStr) {
            try {
                const res = await fetch(`${API_URL}/meal-plan/?start=${startStr}&end=${endStr}`);
                if (!res.ok) throw new Error('Failed');
                this.weekItems = await res.json();
            } catch (e) {
                console.error(e);
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

                // Leftovers Logic
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
        library: [],
        suggestions: [],

        async init() {
            this.fetchLibrary();
        },

        async fetchLibrary() {
            try {
                const res = await fetch(`${API_URL}/grocery-list/library`);
                if (res.ok) {
                    this.library = await res.json();
                }
            } catch (e) { }
        },

        getSuggestions(query) {
            if (!query || query.length < 2) return [];
            const q = query.toLowerCase();
            return this.library.filter(item => item.name.toLowerCase().includes(q)).slice(0, 5);
        },

        async addManual(item) {
            try {
                const res = await fetch(`${API_URL}/grocery-list/manual`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    this.fetchLibrary();
                    return true;
                } else {
                    // Alert backend error
                    const err = await res.json().catch(() => ({ detail: res.statusText }));
                    alert("Erreur: " + (err.detail || "Erreur inconnue"));
                }
                return false;
            } catch (e) {
                alert(Alpine.store('i18n').t('error_api'));
                return false;
            }
        }
    });

    // --- DATA COMPONENTS ---

    Alpine.data('libraryPage', () => ({
        search: '',
        loading: false,
        showAdd: false,
        newItem: { name: '', category: 'Divers', default_unit: '' },

        init() {
            // Ensure library is loaded
            if (Alpine.store('grocery').library.length === 0) {
                Alpine.store('grocery').fetchLibrary();
            }
        },

        get filteredItems() {
            // Use store data directly
            const lib = Alpine.store('grocery').library;
            if (!this.search) return lib;
            const q = this.search.toLowerCase();
            return lib.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
        },

        async addToGrocery(item) {
            const toAdd = {
                name: item.name,
                quantity: 1,
                unit: item.default_unit || '',
                category: item.category
            };
            if (await Alpine.store('grocery').addManual(toAdd)) {
                // Feedback
                const btn = document.getElementById('btn-' + item.id);
                if (btn) {
                    const original = btn.innerHTML;
                    btn.innerHTML = '✅';
                    setTimeout(() => btn.innerHTML = original, 1000);
                }
            }
        },

        async deleteItem(id) {
            if (!confirm('Oublier cet article pour toujours ?')) return;
            try {
                const res = await fetch(`${API_URL}/grocery-list/library/${id}`, { method: 'DELETE' });
                if (res.ok) Alpine.store('grocery').fetchLibrary();
            } catch (e) { }
        },

        openAddModal() {
            this.newItem = { name: '', category: 'Divers', default_unit: '' };
            this.showAdd = true;
        },

        async submitNewItem() {
            if (!this.newItem.name) return;
            const toAdd = {
                name: this.newItem.name,
                quantity: this.newItem.quantity || 1,
                unit: this.newItem.default_unit || '',
                category: this.newItem.category
            };
            if (await Alpine.store('grocery').addManual(toAdd)) {
                this.showAdd = false;
                alert("Produit créé !");
                this.newItem = { name: '', category: 'Divers', default_unit: '' }; // Reset
            }
        }
    }));

    Alpine.data('groceryPage', () => ({
        startDate: '',
        endDate: '',
        items: [],
        loading: false,
        showAdd: false,
        newItem: { name: '', quantity: 1, unit: '', category: 'Divers' },
        suggestions: [],
        categories: ['Fruits & Légumes', 'Viandes et Poissons', 'Frais', 'Épicerie', 'Boissons', 'Hygiène', 'Maison', 'Divers'],

        init() {
            const range = getWeekRange(new Date());
            this.startDate = range.start;
            this.endDate = range.end;
            this.generateList();
        },

        async generateList() {
            this.loading = true;
            try {
                const res = await fetch(`${API_URL}/grocery-list/?start=${this.startDate}&end=${this.endDate}`);
                if (!res.ok) throw new Error('Failed');
                this.items = await res.json();
            } catch (e) {
                console.error(e);
                alert(Alpine.store('i18n').t('error_api'));
            } finally {
                this.loading = false;
            }
        },

        selectSuggestion(s) {
            this.newItem.name = s.name;
            this.newItem.category = s.category;
            if (s.default_unit) this.newItem.unit = s.default_unit;
            this.suggestions = [];
        },

        async submitManualItem() {
            if (await Alpine.store('grocery').addManual(this.newItem)) {
                this.showAdd = false;
                this.generateList();
                this.newItem = { name: '', quantity: 1, unit: '', category: 'Divers' };
            }
        },

        async finishShopping() {
            if (!confirm("Cela va vider la liste actuelle et marquer les repas comme 'Achetés'. Continuer ?")) return;
            try {
                const res = await fetch(`${API_URL}/grocery-list/checkout?start=${this.startDate}&end=${this.endDate}`, { method: 'POST' });
                if (res.ok) {
                    alert("Liste archivée avec succès !");
                    this.generateList();
                } else {
                    const err = await res.text();
                    alert("Erreur serveur: " + err);
                }
            } catch (e) {
                alert("Erreur technique: " + e.message);
                console.error(e);
            }
        },

        printList() { window.print(); }
    }));

    Alpine.data('plannerPage', () => ({
        currentDate: new Date(),
        weekStart: '',
        weekEnd: '',
        days: [],
        showModal: false,
        selectedDate: '',
        newItem: { recipe_id: '', servings: 2, meal_type: 'dinner', with_leftovers: false },

        init() {
            this.updateWeek();
            Alpine.store('recipes').fetch();
        },

        updateWeek() {
            const range = getWeekRange(this.currentDate);
            this.weekStart = range.start;
            this.weekEnd = range.end;

            this.days = [];
            let d = new Date(range.startObj);
            const lang = Alpine.store('i18n').lang;
            const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

            for (let i = 0; i < 7; i++) {
                this.days.push({
                    date: d.toISOString().split('T')[0],
                    name: d.toLocaleDateString(locale, { weekday: 'long' }),
                    display: d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
                });
                d.setDate(d.getDate() + 1);
            }
            Alpine.store('planner').fetchWeek(this.weekStart, this.weekEnd);
        },

        prevWeek() {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
            this.updateWeek();
        },

        nextWeek() {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
            this.updateWeek();
        },

        openAddModal(dateStr, mealType) {
            this.selectedDate = dateStr;
            this.newItem = {
                recipe_id: '',
                servings: 2,
                meal_type: mealType || 'dinner',
                with_leftovers: false
            };
            this.showModal = true;
        },

        getItemsForDateAndType(dateStr, mealType) {
            return Alpine.store('planner').weekItems.filter(item =>
                item.date === dateStr && (item.meal_type === mealType || (!item.meal_type && mealType === 'dinner'))
            );
        },

        getMealTypeLabel(type) {
            const map = {
                'breakfast': Alpine.store('i18n').t('breakfast'),
                'lunch': Alpine.store('i18n').t('lunch'),
                'dinner': Alpine.store('i18n').t('dinner')
            };
            return map[type] || type;
        },

        async submitItem() {
            if (!this.newItem.recipe_id) return;
            const payload = {
                date: this.selectedDate,
                recipe_id: parseInt(this.newItem.recipe_id),
                servings: parseInt(this.newItem.servings),
                meal_type: this.newItem.meal_type
            };

            if (await Alpine.store('planner').add(payload, this.newItem.with_leftovers)) {
                this.showModal = false;
                Alpine.store('planner').fetchWeek(this.weekStart, this.weekEnd);
            }
        },

        async deleteItem(id) {
            if (await Alpine.store('planner').remove(id)) {
                Alpine.store('planner').fetchWeek(this.weekStart, this.weekEnd);
            }
        }
    }));

    Alpine.data('recipesPage', () => ({
        showModal: false,
        newRecipe: { title: '', description: '', default_servings: 2, is_vegetarian: false, tags: [], ingredients: [] },
        newIng: { name: '', quantity: 1, unit: '' },

        init() {
            Alpine.store('recipes').fetch();
        },

        addIngredient() {
            if (this.newIng.name) {
                this.newRecipe.ingredients.push({ ...this.newIng });
                this.newIng = { name: '', quantity: 1, unit: '' };
            }
        },

        removeIngredient(index) {
            this.newRecipe.ingredients.splice(index, 1);
        },

        async submitRecipe() {
            const success = await Alpine.store('recipes').create(this.newRecipe);
            if (success) {
                this.showModal = false;
                this.newRecipe = { title: '', description: '', default_servings: 2, is_vegetarian: false, tags: [], ingredients: [] };
            }
        }
    }));

    // Protect Route
    Alpine.store('auth').check();
});

// Interceptor to add Token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const token = localStorage.getItem('token');
    if (token) {
        if (!args[1]) args[1] = {};
        if (!args[1].headers) args[1].headers = {};
        if (args[1].headers instanceof Headers) {
            args[1].headers.append('Authorization', `Bearer ${token}`);
        } else {
            args[1].headers['Authorization'] = `Bearer ${token}`;
        }
    }
    const response = await originalFetch(...args);
    if (response.status === 401) {
        localStorage.removeItem('token');
        if (!window.location.href.includes('login.html'))
            window.location.href = 'login.html';
    }
    return response;
};

const TRANSLATIONS = {
    en: {
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
        grocery: "Liste de Courses",
        welcome: "Bienvenue dans votre planificateur de repas",
        welcome_sub: "Organisez vos repas, gérez vos recettes et générez des listes sans effort.",
        browse_recipes: "Parcourir les recettes",
        plan_week: "Planifier votre semaine",
        add_recipe: "Nouvelle Recette",
        servings: "Portions",
        ingredients: "Ingrédients",
        save: "Enregistrer",
        cancel: "Annuler",
        no_recipes: "Aucune recette trouvée.",
        weekly_plan: "Plan Hebdomadaire",
        prev: "Préc",
        next: "Suiv",
        add_meal: "Ajouter un repas",
        generate_list: "Générer la liste",
        from: "Du",
        to: "Au",
        print: "Imprimer",
        loading: "Chargement...",
        no_items: "Aucun article nécessaire.",
        vegetarian: "Végétarien",
        is_vegetarian_label: "Cette recette est-elle végétarienne ?",
        delete_confirm: "Êtes-vous sûr de vouloir supprimer ceci ?",
        breakfast: "Petit-déjeuner",
        lunch: "Déjeuner",
        dinner: "Dîner",
        meal_type: "Type de repas",
        leftovers_label: "Cuisiner assez pour des restes (Déjeuner demain)",
        image_url: "URL de l'image (Optionnel)",
        manual_items: "Articles Manuels",
        add_item: "Ajouter un article",
        item_name: "Nom de l'article",
        error_api: "Erreur de connexion : Impossible d'enregistrer/charger les données. Veuillez vérifier votre internet ou le serveur."
    }
};
