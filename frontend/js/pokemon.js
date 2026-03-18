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
        
        // Check for pokemonId in URL
        const params = new URLSearchParams(window.location.search);
        const pokemonId = params.get('pokemonId');
        if (pokemonId) {
            ui.showPokemonDetails(pokemonId);
        }

        await this.fetchAndRender();
    },

    /**
     * Setup event listeners for search and other interactions
     */
    setupEventListeners() {
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