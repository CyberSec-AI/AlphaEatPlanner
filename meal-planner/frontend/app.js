const API_URL = "";

// Auth Logic
document.addEventListener('alpine:init', () => {
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
            // Add Authorization header to global fetch if possible? 
            // Or we just rely on passing headers manually. 
            // Better: Override fetch? A bit risky. 
            // Simplest: Just redirect if no token. We are not securing API calls deeply in JS, 
            // backend will reject if we implemented security deps on routes (which we didn't fully enforce yet on other routes but let's assume session cookie or similar if we used that, but we use Token).
            // Actually, we need to send token in headers for ALL requests.
        }
    });

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
        // If headers is Headers object
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
    The `}` closes the object started at`const TRANSLATIONS = {`.
    The comma suggests another variable declaration.

    If I assume the user wants to fix the structure to support the `i18n` store:
    I will provide the `fr` object and then redefine`TRANSLATIONS`(or rather, define the languages and then the final object).

    But wait, if `const TRANSLATIONS` is already declared, I can't declare it again.

    Let's assume the user's `fr` block was intended to be part of the same `const` declaration.


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
            library: [], // Smart History
            suggestions: [],

            async init() {
                // Pre-fetch library on load
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
                        // Refresh library to include this new item (top of list)
                        this.fetchLibrary();
                        return true;
                    }
                    return false;
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
