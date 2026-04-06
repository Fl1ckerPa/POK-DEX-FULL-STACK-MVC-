import api from './api.js';
import ui from './ui.js';

const pokemon = {
    currentPage: 1,
    limit: 20,
    searchQuery: '',
    startId: null,
    endId: null,
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

    async toggleFavorite(id, btn) {
        // Redireciona para o serviço UI centralizado
        await ui.toggleFavorite(id, btn);
    },

    /**
     * Setup event listeners for search and other interactions
     */
    setupEventListeners() {
        // A lógica de favoritos agora é tratada centralizadamente no ui.renderPokemonGrid
        // Mas podemos manter ouvintes específicos de layout aqui se necessário

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

        // Region tabs
        const regionTabs = document.querySelectorAll('.region-tab');
        regionTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                regionTabs.forEach(t => {
                    t.classList.remove('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/20', 'active');
                    t.classList.add('bg-white', 'border', 'border-black/5', 'text-gray-500', 'hover:bg-black/5');
                });
                tab.classList.remove('bg-white', 'border', 'border-black/5', 'text-gray-500', 'hover:bg-black/5');
                tab.classList.add('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/20', 'active');

                // Update filters
                this.startId = tab.dataset.start || null;
                this.endId = tab.dataset.end || null;
                this.currentPage = 1;
                this.fetchAndRender();
            });
        });

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
            if (this.startId && this.endId) {
                endpoint += `&startId=${this.startId}&endId=${this.endId}`;
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