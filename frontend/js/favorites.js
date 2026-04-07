import api from './api.js';
import ui from './ui.js';
import auth from './auth.js';

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
        
        // Inicializa serviços globais de UI
        ui.init();
        
        // Verificar autenticação ao carregar a página
        auth.checkAuthOnLoad();
        
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
            ui.showLoading();
            const result = await api.get('/favorites');
            
            if (result.success) {
                this.items = result.data;
                this.render();
            } else {
                console.error('Failed to load favorites:', result.message);
                if (result.isUnauthorized) {
                    ui.showNotification('Sessão expirada. Faça login novamente.', 'error');
                    auth.logout();
                }
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            ui.showError('Erro ao carregar seus favoritos. Tente novamente mais tarde.');
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

        if (!grid || !emptyState || !countElement) return;

        // Update count
        const count = this.items.length;
        countElement.textContent = `${count} ${count === 1 ? 'Pokémon' : 'Pokémon'} na sua coleção`;

        if (count === 0) {
            grid.classList.add('hidden');
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
            // Re-initialize Lucide icons for the empty state
            if (window.lucide) window.lucide.createIcons();
        } else {
            grid.classList.remove('hidden');
            emptyState.classList.add('hidden');
            if (clearBtn) clearBtn.classList.remove('hidden');
            
            // Garantir que os itens tenham a propriedade is_favorite para a UI renderizar o coração vermelho
            const itemsToRender = this.items.map(item => ({
                ...item,
                is_favorite: true
            }));
            
            ui.renderPokemonGrid(itemsToRender);
        }
    },

    /**
     * Setup event listeners for the page
     */
    setupEventListeners() {
        // Escuta mudanças globais de favoritos
        document.addEventListener('favoriteChanged', (e) => {
            const { id, isFavorited } = e.detail;
            
            // Se o item foi removido dos favoritos e estamos na página de favoritos, remova-o da grade
            if (!isFavorited) {
                const card = document.querySelector(`.favorite-btn[data-id="${id}"]`)?.closest('.glass-card');
                if (card) {
                    card.classList.add('animate-scale-down');
                    setTimeout(() => {
                        card.remove();
                        this.items = this.items.filter(item => item.id != id);
                        this.updateUIAfterRemoval();
                    }, 300);
                }
            }
        });

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
                auth.logout();
            });
        }

        // Mobile menu toggle
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.querySelector('aside');
        if (mobileBtn && sidebar) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
                sidebar.classList.toggle('flex');
                sidebar.classList.toggle('fixed');
                sidebar.classList.toggle('z-50');
                sidebar.classList.toggle('w-full');
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
     * Update the UI after a favorite is removed from the DOM
     */
    updateUIAfterRemoval() {
        const countElement = document.getElementById('favorites-count');
        const grid = document.getElementById('pokemon-grid');
        const emptyState = document.getElementById('empty-state');
        const clearBtn = document.getElementById('clear-favorites-btn');
        
        const count = this.items.length;
        if (countElement) countElement.textContent = `${count} ${count === 1 ? 'Pokémon' : 'Pokémon'} na sua coleção`;
        
        if (count === 0) {
            if (grid) grid.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
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
            const userDisplay = document.getElementById('user-display');
            
            if (nameEl) nameEl.textContent = user.username || 'Usuário';
            if (emailEl) emailEl.textContent = user.email || 'email@exemplo.com';
            if (userDisplay) userDisplay.classList.remove('hidden');
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    favorites.init();
});

export default favorites;
