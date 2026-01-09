const API_URL = "";
window.API_URL = API_URL;

const TRANSLATIONS = {
    en: {
        title: "EatPlanner",
        grocery: "Grocery List",
        welcome: "Welcome to Your Meal Planner",
        welcome_sub: "Organize meals, manage recipes, and generate lists effortlessly.",
        browse_recipes: "Browse Recipes",
        dashboard: "Dashboard",
        recipes: "Recipes",
        planner: "Planner",
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
        error_api: "Connection Error: Could not save/load data. Please check your internet or server.",
        settings: "Settings",
        edit_profile: "Edit Profile"
    },
    fr: {
        title: "EatPlanner",
        dashboard: "Tableau de Bord",
        recipes: "Mes Recettes",
        planner: "Planning",
        settings: "Paramètres",
        edit_profile: "Modifier Profil",
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
        error_api: "Erreur de connexion : Impossible d'enregistrer/charger les données. Veuillez vérifier votre internet ou le serveur.",
        edit_recipe: "Modifier la Recette",
        update: "Mettre à jour"
    }
};


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
        user: null, // Store user profile
        async init() {
            if (this.token) await this.fetchUser();
        },
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
                    if (data.user) this.user = data.user;
                    else await this.fetchUser();
                    return true;
                }
            } catch (e) { }
            return false;
        },
        async fetchUser() {
            try {
                const res = await fetch(`${API_URL}/users/me`);
                if (res.ok) this.user = await res.json();
            } catch (e) { }
        },
        logout() {
            console.log("Logging out...");
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            window.location.replace('login.html'); // Use replace to prevent back button
        },
        check() {
            if (!this.token && !window.location.href.includes('login.html')) {
                window.location.href = 'login.html';
            }
        },
        async createUserFull(userData) {
            try {
                const res = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (res.ok) {
                    Alpine.store('ui').notify("Utilisateur créé avec succès !");
                    return true;
                } else {
                    const err = await res.json();
                    Alpine.store('ui').notify("Erreur: " + (err.detail || "Impossible de créer l'utilisateur"), 'error');
                }
            } catch (e) {
                Alpine.store('ui').notify("Erreur technique: " + e.message, 'error');
            }
            return false;
        },
        async updateProfile(data) {
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    this.user = await res.json();
                    Alpine.store('ui').notify("Profil mis à jour !");
                    return true;
                }
            } catch (e) { }
            return false;
        }
    });

    Alpine.store('i18n', {
        lang: 'fr', // Strict default
        init() {
            let saved = localStorage.getItem('app_lang');
            if (saved) {
                saved = saved.toLowerCase(); // Force lowercase
                if (saved === 'en' || saved === 'fr') {
                    this.lang = saved;
                }
            } else {
                localStorage.setItem('app_lang', 'fr');
            }
        },
        t(key) {
            const dict = TRANSLATIONS[this.lang] || TRANSLATIONS['fr'];
            return dict[key] || key;
        },
        toggle() {
            this.lang = this.lang === 'en' ? 'fr' : 'en';
            localStorage.setItem('app_lang', this.lang);
        }
    });

    // --- CUSTOM UI COMPONENTS (Toast & Modal) ---
    Alpine.store('ui', {
        notifications: [],
        confirmCallback: null,
        confirmState: { open: false, title: '', message: '' },

        init() {
            // Inject UI HTML into Body if not exists
            if (!document.getElementById('ui-components-container')) {
                const html = `
                <div id="ui-components-container">
                    <!-- Toast Container -->
                    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                        <template x-for="notif in $store.ui.notifications" :key="notif.id">
                            <div x-transition:enter="transition ease-out duration-300"
                                x-transition:enter-start="opacity-0 translate-x-8"
                                x-transition:enter-end="opacity-100 translate-x-0"
                                x-transition:leave="transition ease-in duration-200"
                                x-transition:leave-start="opacity-100 translate-x-0"
                                x-transition:leave-end="opacity-0 translate-x-8"
                                class="pointer-events-auto bg-white rounded-xl shadow-lg border-l-4 p-4 min-w-[300px] flex items-start gap-3"
                                :class="notif.type === 'error' ? 'border-rose-500' : 'border-emerald-500'">
                                <div class="text-xl" x-text="notif.type === 'error' ? '🚨' : '✅'"></div>
                                <div>
                                    <h4 class="font-bold text-sm" :class="notif.type === 'error' ? 'text-rose-700' : 'text-emerald-700'"
                                        x-text="notif.type === 'error' ? 'Erreur' : 'Succès'"></h4>
                                    <p class="text-xs text-slate-600 font-medium" x-text="notif.message"></p>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Confirm Modal -->
                    <div x-show="$store.ui.confirmState.open" style="display: none" 
                        class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div x-transition.opacity class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
                        <div x-show="$store.ui.confirmState.open" x-transition.scale
                            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
                            <h3 class="text-lg font-bold text-slate-800 mb-2" x-text="$store.ui.confirmState.title">Confirmation</h3>
                            <p class="text-slate-500 text-sm mb-6" x-text="$store.ui.confirmState.message"></p>
                            <div class="flex justify-end gap-3">
                                <button @click="$store.ui.resolveConfirm(false)" 
                                    class="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition">
                                    Annuler
                                </button>
                                <button @click="$store.ui.resolveConfirm(true)"
                                    class="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-rose-200 transition transform active:scale-95">
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', html);
            }
        },

        notify(message, type = 'success') {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 5000);
        },

        confirm(message, title = 'Confirmation') {
            return new Promise((resolve) => {
                this.confirmState = { open: true, title, message };
                this.confirmCallback = resolve;
            });
        },

        resolveConfirm(result) {
            this.confirmState.open = false;
            if (this.confirmCallback) this.confirmCallback(result);
            this.confirmCallback = null;
        }
    });

    // ... [Original Recipes, Planner, Grocery stores...]
    // I will execute a partial replace to save tokens if possible, but here replacing full store init blocks is safer.

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
                // Token is auto-injected by interceptor
                const res = await fetch(`${API_URL}/recipes/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recipe)
                });
                if (res.ok) { this.fetch(); return true; }
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
                return false;
            }
            return false;
        },
        async update(id, recipe) {
            try {
                const res = await fetch(`${API_URL}/recipes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recipe)
                });
                if (res.ok) { this.fetch(); return true; }
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
                return false;
            }
            return false;
        },
        async delete(id) {
            if (!await Alpine.store('ui').confirm(Alpine.store('i18n').t('delete_confirm'))) return;
            try {
                const res = await fetch(`${API_URL}/recipes/${id}`, { method: 'DELETE' });
                if (res.ok) this.fetch();
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
            }
        },
        async updateRating(id, rating) {
            try {
                const res = await fetch(`${API_URL}/recipes/${id}`);
                if (res.ok) {
                    const fullRecipe = await res.json();
                    fullRecipe.rating = rating;
                    // Fix ingredients structure for update
                    fullRecipe.ingredients = fullRecipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }));
                    await fetch(`${API_URL}/recipes/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fullRecipe)
                    });
                    // Optimistic update
                    const local = this.list.find(r => r.id === id);
                    if (local) local.rating = rating;
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
                Alpine.store('ui').notify("Upload Failed", 'error');
            }
            return null;
        }
    });

    Alpine.data('settingsPage', () => ({
        user: { username: '', full_name: '', profile_picture_url: '' },
        init() {
            if (Alpine.store('auth').user) {
                this.user = { ...Alpine.store('auth').user };
            } else {
                Alpine.store('auth').fetchUser().then(() => {
                    if (Alpine.store('auth').user) this.user = { ...Alpine.store('auth').user };
                });
            }
        },
        async uploadPhoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            const url = await Alpine.store('recipes').uploadImage(file);
            if (url) {
                this.user.profile_picture_url = url;
            }
        },
        async updateProfile() {
            await Alpine.store('auth').updateProfile(this.user);
        }
    }));

    // --- DATA COMPONENTS ---

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
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
                return false;
            }
        },
        async remove(id) {
            if (!await Alpine.store('ui').confirm(Alpine.store('i18n').t('delete_confirm'))) return false;
            try {
                const res = await fetch(`${API_URL}/meal-plan/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed');
                return true;
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
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
                    Alpine.store('ui').notify("Erreur: " + (err.detail || "Erreur inconnue"), 'error');
                }
                return false;
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
                return false;
            }
        },

        async updateLibraryItem(id, item) {
            try {
                const res = await fetch(`${API_URL}/grocery-list/library/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (res.ok) {
                    this.fetchLibrary();
                    return true;
                }
                return false;
            } catch (e) {
                Alpine.store('ui').notify(Alpine.store('i18n').t('error_api'), 'error');
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
        editMode: false,
        editingId: null,

        init() {
            if (Alpine.store('grocery').library.length === 0) {
                Alpine.store('grocery').fetchLibrary();
            }
        },

        get filteredItems() {
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
                const btn = document.getElementById('btn-' + item.id);
                if (btn) {
                    const original = btn.innerHTML;
                    btn.innerHTML = '✅';
                    setTimeout(() => btn.innerHTML = original, 1000);
                }
            }
        },

        async deleteItem(id) {
            if (!await Alpine.store('ui').confirm('Oublier cet article pour toujours ?')) return;
            try {
                const res = await fetch(`${API_URL}/grocery-list/library/${id}`, { method: 'DELETE' });
                if (res.ok) Alpine.store('grocery').fetchLibrary();
            } catch (e) { }
        },

        openAddModal() {
            this.newItem = { name: '', category: 'Divers', default_unit: '' };
            this.editMode = false;
            this.editingId = null;
            this.showAdd = true;
        },

        openEditModal(item) {
            this.newItem = { name: item.name, category: item.category, default_unit: item.default_unit || '' };
            this.editMode = true;
            this.editingId = item.id;
            this.showAdd = true;
        },

        async submitNewItem() {
            if (!this.newItem.name) return;

            if (this.editMode && this.editingId) {
                // Update Logic
                if (await Alpine.store('grocery').updateLibraryItem(this.editingId, this.newItem)) {
                    this.showAdd = false;
                    Alpine.store('ui').notify("Produit mis à jour !");
                    this.newItem = { name: '', category: 'Divers', default_unit: '' };
                }
            } else {
                // Create Logic (Add Manual triggers Smart Save which creates Library Item)
                // Wait, adding manual adds to SHOPPING LIST. 
                // Creating a library item directly? The backend implementation of 'Smart Add' happens on manual add.
                // To just "add to library" without adding to list is not yet implemented in backend strictly, 
                // but we can simulate by adding a manual item if that's the desired flow, OR we just support editing for now.
                // The previous flow was: Add manual item -> Adds to list AND library.
                // So calling addManual is correct for "New Product".
                const toAdd = {
                    name: this.newItem.name,
                    quantity: this.newItem.quantity || 1,
                    unit: this.newItem.default_unit || '',
                    category: this.newItem.category
                };
                if (await Alpine.store('grocery').addManual(toAdd)) {
                    this.showAdd = false;
                    Alpine.store('ui').notify("Produit créé !");
                    this.newItem = { name: '', category: 'Divers', default_unit: '' }; // Reset
                }
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
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(errText || 'Erreur Serveur (Status ' + res.status + ')');
                }
                this.items = await res.json();
            } catch (e) {
                console.error(e);
                Alpine.store('ui').notify("Erreur Technique: " + e.message, 'error');
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
            if (!await Alpine.store('ui').confirm("Cela va vider la liste actuelle et marquer les repas comme 'Achetés'. Continuer ?")) return;
            try {
                const res = await fetch(`${API_URL}/grocery-list/checkout?start=${this.startDate}&end=${this.endDate}`, { method: 'POST' });
                if (res.ok) {
                    Alpine.store('ui').notify("Liste archivée avec succès !");
                    this.generateList();
                } else {
                    const err = await res.text();
                    Alpine.store('ui').notify("Erreur serveur: " + err, 'error');
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
                servings_vegetarian: 0,
                is_mixed: false,
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

            const recipe = Alpine.store('recipes').list.find(r => r.id == this.newItem.recipe_id);
            const isRecipeVeg = recipe ? recipe.is_vegetarian : false;

            let totalServings = parseInt(this.newItem.servings) || 0; // Contains Standard count if mixed, or Total if not
            let vegServings = parseInt(this.newItem.servings_vegetarian) || 0;

            if (this.newItem.is_mixed) {
                // In mixed mode: input 'servings' is treated as Standard count
                // input 'servings_vegetarian' is Veg count
                // Total = Standard + Veg
                const stdCount = totalServings;
                totalServings = stdCount + vegServings;
            } else {
                // Not mixed
                // If the recipe itself is vegetarian, then ALL servings are vegetarian
                if (isRecipeVeg) {
                    vegServings = totalServings;
                } else {
                    vegServings = 0;
                }
            }

            const payload = {
                date: this.selectedDate,
                recipe_id: parseInt(this.newItem.recipe_id),
                servings: totalServings,
                servings_vegetarian: vegServings,
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
        newRecipe: { title: '', description: '', default_servings: 2, is_vegetarian: false, tags: [], ingredients: [], steps: [] },
        newIng: { name: '', quantity: 1, unit: '', variant_mode: 'all' },
        editMode: false,
        editingId: null,

        init() {
            Alpine.store('recipes').fetch();
        },

        openAddModal() {
            this.newRecipe = { title: '', description: '', default_servings: 2, is_vegetarian: false, tags: [], ingredients: [], steps: [] };
            this.newIng = { name: '', quantity: 1, unit: '', variant_mode: 'all' };
            this.editMode = false;
            this.editingId = null;
            this.showModal = true;
        },

        openEditModal(recipe) {
            // Deep copy to avoid mutating store directly
            this.newRecipe = JSON.parse(JSON.stringify(recipe));
            if (!this.newRecipe.steps) this.newRecipe.steps = []; // Ensure steps array exists
            this.newIng = { name: '', quantity: 1, unit: '', variant_mode: 'all' }; // Reset newIng
            this.editMode = true;
            this.editingId = recipe.id;
            this.showModal = true;
        },

        addIngredient() {
            if (this.newIng.name) {
                this.newRecipe.ingredients.push({ ...this.newIng });
                this.newIng = { name: '', quantity: 1, unit: '', variant_mode: 'all' };
            }
        },

        removeIngredient(index) {
            this.newRecipe.ingredients.splice(index, 1);
        },

        addStep() {
            // Push new step with calculated order (though backend handles order mostly, we send order just in case or derived from index)
            this.newRecipe.steps.push({ step_order: this.newRecipe.steps.length + 1, instruction: '' });
        },

        removeStep(index) {
            this.newRecipe.steps.splice(index, 1);
        },

        async submitRecipe() {
            // Normalize steps order before sending
            this.newRecipe.steps.forEach((s, i) => s.step_order = i + 1);

            let success = false;
            if (this.editMode && this.editingId) {
                success = await Alpine.store('recipes').update(this.editingId, this.newRecipe);
            } else {
                success = await Alpine.store('recipes').create(this.newRecipe);
            }

            if (success) {
                this.showModal = false;
                this.newRecipe = { title: '', description: '', default_servings: 2, is_vegetarian: false, tags: [], ingredients: [], steps: [] };
                this.editMode = false;
                this.editingId = null;
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


