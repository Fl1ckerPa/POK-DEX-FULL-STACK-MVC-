import api from './api.js';
import ui from './ui.js';

const pokemon = {
    currentPage: 1,
    limit: 20,
    searchQuery: '',
    isLoading: false,

    /**
     * Initialize the dashboard
     */
    async init() {
        console.log('Pokemon module initialized');
        this.setupEventListeners();
        
        // Listen for favorite events from UI
        document.addEventListener('toggleFavorite', async (e) => {
            const { id } = e.detail;
            await this.handleToggleFavorite(id);
        });

        // Check for pokemonId in URL
        const params = new URLSearchParams(window.location.search);
        const pokemonId = params.get('pokemonId');
        if (pokemonId) {
            ui.showPokemonDetails(pokemonId);
        }

        await this.fetchAndRender();
    },

    /**
     * Handle favoriting a pokemon
     */
    async handleToggleFavorite(pokemonId) {
        try {
            // First check if it's already a favorite to decide whether to add or remove
            // In a real app, we might have an is_favorite property on the pokemon object
            // For now, we'll try to add it. If the API returns success, it was added.
            // If we wanted to toggle, we'd need to know the current state.
            
            // For the dashboard, we'll implement the "Add" logic when clicking the heart
            const result = await api.post('/favorites', { pokemonId });
            
            if (result.success) {
                ui.showNotification('Pokémon adicionado aos favoritos!', 'success');
                // Optionally re-render to update the heart icon state
                this.fetchAndRender();
            } else {
                // If it's already a favorite, the controller might return an error or we can try to remove it
                // Let's try to remove it if the add fails (simple toggle logic)
                const removeResult = await api.delete(`/favorites/${pokemonId}`);
                if (removeResult.success) {
                    ui.showNotification('Pokémon removido dos favoritos!', 'info');
                    this.fetchAndRender();
                } else {
                    ui.showNotification(result.message || 'Erro ao atualizar favoritos', 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            ui.showNotification('Erro ao conectar com o servidor', 'error');
        }
    },

    /**
     * Setup event listeners for search and other interactions
     */
    setupEventListeners() {
        const grid = document.getElementById('pokemon-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const favBtn = e.target.closest('.favorite-btn');
                if (favBtn) {
                    e.stopPropagation();
                    const id = favBtn.dataset.id;
                    this.handleToggleFavorite(id);
                }
            });
        }

        const searchInput = document.getElementById('pokemon-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.currentPage = 1; // Reset to first page on search
                    this.fetchAndRender();
                }, 500);
            });
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.querySelector('aside');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
                sidebar.classList.toggle('flex');
                sidebar.classList.toggle('fixed');
                sidebar.classList.toggle('z-50');
                sidebar.classList.toggle('w-full');
            });
        }
    },

    /**
     * Fetch Pokémon from API and render the UI
     */
    async fetchAndRender() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        ui.showLoading();

        try {
            let endpoint = `/pokemon?page=${this.currentPage}&limit=${this.limit}`;
            if (this.searchQuery) {
                endpoint += `&search=${encodeURIComponent(this.searchQuery)}`;
            }

            const response = await api.get(endpoint);
            
            if (response.success) {
                const { data, total, totalPages } = response;
                
                ui.renderPokemonGrid(data);
                ui.updateResultCount(total);
                ui.renderPagination(this.currentPage, totalPages, (page) => {
                    this.currentPage = page;
                    this.fetchAndRender();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            } else {
                throw new Error(response.message || 'Erro ao carregar Pokémon');
            }
        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            ui.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }
};

export default pokemon;