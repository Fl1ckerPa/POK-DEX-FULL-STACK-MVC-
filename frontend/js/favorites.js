import api from './api.js';
import ui from './ui.js';

/**
 * Favorites Module - Handles the favorites page logic
 */
const favorites = {
    // State
    items: [],

    /**
     * Initialize the favorites page
     */
    async init() {
        console.log('Initializing favorites page...');
        
        // Update user display immediately from localStorage
        this.updateUserDisplay();
        
        // Initialize Lucide icons immediately for static elements (sidebar, etc.)
        if (window.lucide) {
            window.lucide.createIcons();
        }

        this.setupEventListeners();
        await this.loadFavorites();
    },

    /**
     * Load favorites from the API
     */
    async loadFavorites() {
        try {
            const result = await api.get('/favorites');
            
            if (result.success) {
                this.items = result.data;
                this.render();
            } else {
                console.error('Failed to load favorites:', result.message);
                // If not authenticated, the API middleware should handle it,
                // but we can also handle it here if needed.
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    },

    /**
     * Render the favorites grid or empty state
     */
    render() {
        const grid = document.getElementById('pokemon-grid');
        const emptyState = document.getElementById('empty-state');
        const countElement = document.getElementById('favorites-count');
        const clearBtn = document.getElementById('clear-favorites-btn');

        // Update count
        const count = this.items.length;
        countElement.textContent = `${count} ${count === 1 ? 'Pokémon' : 'Pokémon'} na sua coleção`;

        if (count === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
            // Re-initialize Lucide icons for the empty state
            if (window.lucide) window.lucide.createIcons();
        } else {
            grid.classList.remove('hidden');
            emptyState.classList.add('hidden');
            if (clearBtn) clearBtn.classList.remove('hidden');
            ui.renderPokemonGrid(this.items);
        }
    },

    /**
     * Setup event listeners for the page
     */
    setupEventListeners() {
        // Handle favorite button clicks in the grid
        const grid = document.getElementById('pokemon-grid');
        if (grid) {
            grid.addEventListener('click', async (e) => {
                const favoriteBtn = e.target.closest('.favorite-btn');
                if (favoriteBtn) {
                    e.stopPropagation();
                    const pokemonId = favoriteBtn.dataset.id;
                    await this.removeFavorite(pokemonId, favoriteBtn.closest('.glass-card'));
                }
            });
        }

        // Handle clear favorites button
        const clearBtn = document.getElementById('clear-favorites-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja remover todos os seus favoritos?')) {
                    await this.clearAllFavorites();
                }
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }
    },

    /**
     * Clear all favorites from the API
     */
    async clearAllFavorites() {
        try {
            const result = await api.delete('/favorites/clear');
            
            if (result.success) {
                // Add animation to all cards
                const cards = document.querySelectorAll('.glass-card');
                cards.forEach(card => card.classList.add('animate-scale-down'));
                
                // Wait for animation to finish
                setTimeout(() => {
                    this.items = [];
                    this.render();
                    ui.showNotification('Todos os favoritos foram removidos!', 'info');
                }, 300);
            } else {
                console.error('Failed to clear favorites:', result.message);
                ui.showNotification(result.message || 'Erro ao limpar favoritos', 'error');
            }
        } catch (error) {
            console.error('Error clearing favorites:', error);
            ui.showNotification('Erro ao conectar com o servidor', 'error');
        }
    },

    /**
     * Remove a Pokémon from favorites
     * @param {string} pokemonId - The external ID of the Pokémon
     * @param {HTMLElement} cardElement - The card element to animate and remove
     */
    async removeFavorite(pokemonId, cardElement) {
        try {
            const result = await api.delete(`/favorites/${pokemonId}`);
            
            if (result.success) {
                // Add removal animation
                cardElement.classList.add('animate-scale-down');
                
                // Wait for animation to finish
                setTimeout(() => {
                    // Remove from local state
                    this.items = this.items.filter(item => item.id != pokemonId);
                    
                    // Remove from DOM
                    cardElement.remove();
                    
                    // Update UI (count and empty state)
                    this.updateUIAfterRemoval();
                    
                    ui.showNotification('Pokémon removido dos favoritos!', 'info');
                }, 300); // Match animation duration in CSS
            } else {
                console.error('Failed to remove favorite:', result.message);
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    },

    /**
     * Update the UI after a favorite is removed from the DOM
     */
    updateUIAfterRemoval() {
        const countElement = document.getElementById('favorites-count');
        const grid = document.getElementById('pokemon-grid');
        const emptyState = document.getElementById('empty-state');
        
        const count = this.items.length;
        countElement.textContent = `${count} ${count === 1 ? 'Pokémon' : 'Pokémon'} na sua coleção`;
        
        if (count === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            // Re-initialize Lucide icons for the empty state
            if (window.lucide) window.lucide.createIcons();
        }
    },

    /**
     * Update the user display in the top bar
     */
    updateUserDisplay() {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            const nameEl = document.getElementById('user-name');
            const emailEl = document.getElementById('user-email');
            
            if (nameEl) nameEl.textContent = user.username || 'Usuário';
            if (emailEl) emailEl.textContent = user.email || 'email@exemplo.com';
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    favorites.init();
});

export default favorites;
