/**
 * UI Service - Handles all UI rendering and updates
 */
import api from './api.js';

const ui = {
    /**
     * Render the Pokémon grid with glass-style cards
     * @param {Array} pokemons - List of Pokémon objects
     */
    renderPokemonGrid(pokemons) {
        const grid = document.getElementById('pokemon-grid');
        if (!grid) return;

        grid.innerHTML = '';
        
        if (!pokemons || pokemons.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <i data-lucide="search-x" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-xl font-quicksand font-bold text-gray-800">Nenhum Pokémon encontrado</h3>
                    <p class="text-gray-500">Tente buscar por outro nome ou ID.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        pokemons.forEach((pokemon, index) => {
            const card = this.createPokemonCard(pokemon, index);
            grid.appendChild(card);
        });

        // Setup global listener for favorites on this grid (delegated)
        if (!grid.dataset.favListener) {
            grid.addEventListener('click', async (e) => {
                const favBtn = e.target.closest('.favorite-btn');
                if (favBtn) {
                    e.stopPropagation();
                    const id = favBtn.dataset.id;
                    await this.toggleFavorite(id, favBtn);
                }
            });
            grid.dataset.favListener = 'true';
        }

        // Initialize Lucide icons for the new cards
        if (window.lucide) lucide.createIcons();
    },

    /**
     * Alterna o estado de favorito de um Pokémon
     * @param {number|string} id - ID do Pokémon
     * @param {HTMLElement} btn - Elemento do botão
     */
    async toggleFavorite(id, btn) {
        try {
            const response = await api.post('/favorites', { pokemonId: id });
            const icon = btn.querySelector('i');
            
            if (response.success) {
                // Adicionado
                icon.classList.add('fill-coral', 'text-coral');
                btn.classList.add('opacity-100', 'shadow-md');
                this.showNotification('Adicionado aos favoritos!', 'success');
            } else {
                // Se falhou ao adicionar, tenta remover (toggle)
                const deleteRes = await api.delete(`/favorites/${id}`);
                if (deleteRes.success) {
                    icon.classList.remove('fill-coral', 'text-coral');
                    btn.classList.remove('opacity-100', 'shadow-md');
                    this.showNotification('Removido dos favoritos!', 'info');
                } else {
                    this.showNotification(response.message || 'Erro ao atualizar favoritos', 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showNotification('Faça login para favoritar Pokémon', 'error');
        }
    },

    /**
     * Create an individual Pokémon card (Glass style)
     * @param {Object} pokemon - Pokémon data
     * @param {number} index - Index for animation delay
     */
    createPokemonCard(pokemon, index) {
        const template = document.createElement('div');
        const delay = index * 30; // 30ms stagger delay
        
        template.className = `group glass-card rounded-3xl p-5 flex flex-col items-center relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 animate-fade-slide-up cursor-pointer overflow-hidden`;
        template.style.animationDelay = `${delay}ms`;
        
        // Format ID (e.g., 1 -> #001)
        const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;
        
        // Type badges
        const types = pokemon.types || [];
        const typeBadges = types.map(type => `
            <span class="type-badge type-badge-sm bg-type-${type}">
                ${type}
            </span>
        `).join('');

        // Use high-quality official artwork with loading optimization
        const imageUrl = pokemon.image_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

        template.innerHTML = `
            <!-- ID Badge -->
            <span class="absolute top-4 left-5 text-xs font-bold text-gray-400/80 font-mono tracking-tight">
                ${formattedId}
            </span>

            <!-- Favorite Button -->
            <button class="absolute top-4 right-4 p-2 rounded-xl bg-white/80 text-gray-400 hover:text-coral ${pokemon.is_favorite ? 'opacity-100 shadow-md' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 shadow-sm border border-black/5 favorite-btn z-20" data-id="${pokemon.id}">
                <i data-lucide="heart" class="w-5 h-5 ${pokemon.is_favorite ? 'fill-coral text-coral' : ''}"></i>
            </button>

            <!-- Image Container with Skeleton Placeholder -->
            <div class="relative w-28 h-28 mb-4 flex items-center justify-center">
                <div class="absolute inset-0 bg-gradient-to-br from-coral/5 to-transparent rounded-full blur-2xl group-hover:from-coral/10 transition-colors"></div>
                
                <!-- Skeleton/Placeholder while loading -->
                <div class="image-skeleton absolute inset-0 bg-gray-100/50 rounded-full animate-pulse flex items-center justify-center">
                     <i data-lucide="image" class="w-8 h-8 text-gray-200"></i>
                </div>

                <img 
                    src="${imageUrl}" 
                    alt="${pokemon.name}" 
                    class="w-full h-full object-contain relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-500 opacity-0"
                    loading="lazy"
                    onload="this.classList.remove('opacity-0'); this.previousElementSibling.remove();"
                >
            </div>

            <!-- Info -->
            <div class="text-center w-full space-y-3 relative z-10">
                <h3 class="font-quicksand font-bold text-lg text-gray-800 capitalize truncate w-full px-2">
                    ${pokemon.name}
                </h3>
                
                <div class="flex flex-wrap justify-center gap-1.5">
                    ${typeBadges}
                </div>
            </div>
        `;

        // Add click event for details
        template.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) return;
            this.showPokemonDetails(pokemon.id);
        });

        return template;
    },

    /**
     * Show Pokémon details in a slide-in panel
     * @param {number} pokemonId - ID of the Pokémon to show
     */
    async showPokemonDetails(pokemonId) {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById('pokemon-detail-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pokemon-detail-overlay';
            overlay.className = 'detail-panel-overlay animate-fade-in';
            document.body.appendChild(overlay);
        }

        // Show loading state in panel
        overlay.innerHTML = `
            <div class="detail-panel animate-spring-in p-8 flex flex-col items-center justify-center">
                <button class="absolute top-6 right-6 p-2 rounded-xl hover:bg-black/5 transition-all close-btn">
                    <i data-lucide="x" class="w-6 h-6 text-gray-400"></i>
                </button>
                <div class="w-16 h-16 border-4 border-coral/20 border-t-coral rounded-full animate-spin"></div>
                <p class="mt-4 text-gray-500 font-medium">Carregando dados...</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();

        // Close logic
        const closePanel = () => {
            const panel = overlay.querySelector('.detail-panel');
            panel.classList.replace('animate-spring-in', 'animate-slide-out');
            overlay.classList.replace('animate-fade-in', 'animate-fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.close-btn')) {
                closePanel();
            }
        });

        try {
            // Fetch Pokémon data
            const result = await api.get(`/pokemon/${pokemonId}`);

            if (!result.success) throw new Error(result.message);

            const pokemon = result.data;
            this.renderDetailPanel(overlay, pokemon, closePanel);
        } catch (error) {
            console.error('Error fetching pokemon details:', error);
            overlay.innerHTML = `
                <div class="detail-panel animate-spring-in p-8 flex flex-col items-center justify-center text-center">
                    <button class="absolute top-6 right-6 p-2 rounded-xl hover:bg-black/5 transition-all close-btn">
                        <i data-lucide="x" class="w-6 h-6 text-gray-400"></i>
                    </button>
                    <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-400">
                        <i data-lucide="alert-circle" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-xl font-quicksand font-bold text-gray-800">Erro ao carregar</h3>
                    <p class="text-gray-500 mb-6">${error.message || 'Não foi possível carregar os detalhes do Pokémon.'}</p>
                    <button class="px-6 py-2 bg-coral text-white rounded-xl font-bold hover:shadow-lg transition-all close-btn">
                        Fechar
                    </button>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    },

    /**
     * Render the content of the detail panel
     * @param {HTMLElement} overlay - Overlay container
     * @param {Object} pokemon - Pokémon data
     * @param {Function} closeFn - Function to close the panel
     */
    renderDetailPanel(overlay, pokemon, closeFn) {
        const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;
        const imageUrl = pokemon.sprites?.official_artwork || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
        
        // Colors for stats
        const statColors = {
            'hp': 'var(--hp-color)',
            'attack': 'var(--attack-color)',
            'defense': 'var(--defense-color)',
            'special-attack': 'var(--sp-atk-color)',
            'special-defense': 'var(--sp-def-color)',
            'speed': 'var(--speed-color)'
        };

        const statLabels = {
            'hp': 'HP',
            'attack': 'Ataque',
            'defense': 'Defesa',
            'special-attack': 'Sp. Atk',
            'special-defense': 'Sp. Def',
            'speed': 'Velocidade'
        };

        overlay.innerHTML = `
            <div class="detail-panel animate-spring-in flex flex-col">
                <!-- Header -->
                <div class="sticky top-0 z-10 p-6 flex items-center justify-between bg-white/80 backdrop-blur-md">
                    <span class="text-lg font-mono font-bold text-gray-400">${formattedId}</span>
                    <button class="p-2 rounded-xl hover:bg-black/5 transition-all close-btn">
                        <i data-lucide="x" class="w-6 h-6 text-gray-600"></i>
                    </button>
                </div>

                <!-- Content -->
                <div class="px-8 pb-12 space-y-8">
                    <!-- Image & Name -->
                    <div class="flex flex-col items-center space-y-4">
                        <div class="relative w-48 h-48 flex items-center justify-center">
                            <div class="absolute inset-0 bg-gradient-to-br from-coral/10 to-transparent rounded-full blur-2xl"></div>
                            <div class="absolute inset-4 bg-gray-50 rounded-full border border-black/5 shadow-inner"></div>
                            <img src="${imageUrl}" alt="${pokemon.name}" class="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-float">
                        </div>
                        
                        <div class="text-center space-y-2">
                            <h2 class="text-3xl font-quicksand font-bold text-gray-800 capitalize">${pokemon.name}</h2>
                            <div class="flex justify-center gap-2">
                                ${pokemon.types.map(type => `
                                    <span class="type-badge type-badge-md bg-type-${type}">${type}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Flavor Text -->
                        ${pokemon.flavor_text ? `
                            <p class="text-center italic text-gray-500 text-sm leading-relaxed px-4 max-w-md">
                                "${pokemon.flavor_text}"
                            </p>
                        ` : ''}

                        <!-- Varieties Selector -->
                        ${pokemon.varieties && pokemon.varieties.length > 1 ? `
                            <div class="w-full space-y-3">
                                <h4 class="font-quicksand font-bold text-gray-800 text-center">Formas & Variedades</h4>
                                <div class="flex flex-wrap justify-center gap-2">
                                    ${pokemon.varieties.map(v => `
                                        <button 
                                            class="variety-btn px-4 py-2 rounded-xl text-xs font-bold border transition-all 
                                                   ${v.name === pokemon.name 
                                                     ? 'bg-coral text-white border-coral shadow-md' 
                                                     : 'bg-white text-gray-500 border-black/5 hover:bg-black/5'}"
                                            data-id="${v.id}"
                                        >
                                            ${v.name.replace(pokemon.name + '-', '').replace('-', ' ') || 'Normal'}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Stats Grid (Height/Weight) -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="glass-card rounded-2xl p-4 text-center">
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Altura</p>
                            <p class="text-xl font-bold text-gray-800">${pokemon.height / 10} m</p>
                        </div>
                        <div class="glass-card rounded-2xl p-4 text-center">
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peso</p>
                            <p class="text-xl font-bold text-gray-800">${pokemon.weight / 10} kg</p>
                        </div>
                    </div>

                    <!-- Abilities -->
                    <div class="space-y-3">
                        <h4 class="font-quicksand font-bold text-gray-800">Habilidades</h4>
                        <div class="flex flex-wrap gap-2">
                            ${pokemon.abilities.map(ability => `
                                <span class="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 capitalize">
                                    ${ability}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Base Stats -->
                    <div class="space-y-4">
                        <h4 class="font-quicksand font-bold text-gray-800">Estatísticas Base</h4>
                        <div class="space-y-4">
                            ${pokemon.stats.map(stat => {
                                const color = statColors[stat.name] || 'var(--coral)';
                                const label = statLabels[stat.name] || stat.name;
                                const percentage = Math.min(100, (stat.value / 255) * 100);
                                return `
                                    <div class="space-y-1.5">
                                        <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                                            <span class="text-gray-500">${label}</span>
                                            <span class="text-gray-800">${stat.value}</span>
                                        </div>
                                        <div class="progress-bar-bg">
                                            <div class="progress-bar-fill" style="width: 0%; background-color: ${color}" data-width="${percentage}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="grid grid-cols-2 gap-4 pt-4">
                        <button class="btn-action ${pokemon.is_favorite ? 'bg-coral text-white shadow-coral/20' : 'bg-gray-100 text-gray-600 hover:bg-coral hover:text-white'} shadow-lg hover:scale-[1.02]" id="favorite-detail-btn">
                            <i data-lucide="heart" class="w-5 h-5 ${pokemon.is_favorite ? 'fill-white' : ''}"></i>
                            <span>${pokemon.is_favorite ? 'Favoritado' : 'Favoritar'}</span>
                        </button>
                        <button class="btn-action bg-teal text-white shadow-lg shadow-teal/20 hover:scale-[1.02]" id="add-team-detail-btn">
                            <i data-lucide="plus" class="w-5 h-5"></i>
                            <span>No Time</span>
                        </button>
                    </div>

                    <!-- Ver Detalhes Completos Button -->
                    <a href="details.html?id=${pokemon.id}" 
                       class="block w-full text-center rounded-2xl h-12 leading-[3rem] 
                              font-quicksand font-bold border border-gray-200 
                              text-gray-800 
                              hover:bg-gray-100 transition-colors mt-2"> 
                      Ver Detalhes Completos 
                    </a>

                    <!-- Navigation -->
                    <div class="flex items-center justify-between pt-8 border-t border-black/5">
                        <button class="flex items-center gap-2 text-gray-500 hover:text-coral transition-colors font-bold nav-prev" data-id="${pokemon.id - 1}">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            Anterior
                        </button>
                        <button class="flex items-center gap-2 text-gray-500 hover:text-coral transition-colors font-bold nav-next" data-id="${pokemon.id + 1}">
                            Próximo
                            <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();

        // Animate progress bars
        setTimeout(() => {
            overlay.querySelectorAll('.progress-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);

        // Varieties switching logic
        overlay.querySelectorAll('.variety-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.showPokemonDetails(id);
            });
        });

        // Add event listeners for navigation
        overlay.querySelector('.nav-prev').addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            if (id > 0) this.showPokemonDetails(id);
        });
        overlay.querySelector('.nav-next').addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.showPokemonDetails(id);
        });

        // Favorite button logic
        const favBtn = overlay.querySelector('#favorite-detail-btn');
        favBtn.addEventListener('click', async () => {
            console.log('Favoriting pokemon', pokemon.id);
            try {
                const result = await api.post('/favorites', { pokemonId: pokemon.id });
                if (result.success) {
                    this.showNotification(`${pokemon.name} adicionado aos favoritos!`, 'success');
                    favBtn.querySelector('i').classList.add('fill-white');
                } else {
                    const removeResult = await api.delete(`/favorites/${pokemon.id}`);
                    if (removeResult.success) {
                        this.showNotification(`${pokemon.name} removido dos favoritos!`, 'info');
                        favBtn.querySelector('i').classList.remove('fill-white');
                    } else {
                        this.showNotification(result.message || 'Erro ao atualizar favoritos', 'error');
                    }
                }
                if (window.lucide) lucide.createIcons();
            } catch (error) {
                console.error('Error toggling favorite:', error);
            }
        });

        // Add to team button logic
        const teamBtn = overlay.querySelector('#add-team-detail-btn');
        teamBtn.addEventListener('click', () => {
            console.log('Adding to team', pokemon.id);
            this.showNotification(`${pokemon.name} adicionado à sua equipe!`, 'success');
            document.dispatchEvent(new CustomEvent('addToTeam', { detail: { id: pokemon.id } }));
        });
    },

    /**
     * Render pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     * @param {Function} onPageChange - Callback function when page changes
     */
    renderPagination(currentPage, totalPages, onPageChange) {
        const container = document.getElementById('pagination');
        if (!container) return;

        container.innerHTML = '';
        
        if (totalPages <= 1) return;

        // Helper to create button
        const createBtn = (page, label, isActive = false, isDisabled = false, title = '') => {
            const btn = document.createElement('button');
            btn.className = `
                min-w-[40px] h-10 px-2 flex items-center justify-center rounded-xl font-bold transition-all
                ${isActive ? 'bg-coral text-white shadow-lg shadow-coral/20' : 'bg-white border border-black/5 text-gray-600 hover:bg-black/5'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `;
            btn.innerHTML = label;
            if (title) btn.title = title;
            if (!isDisabled && !isActive) {
                btn.onclick = () => onPageChange(page);
            }
            return btn;
        };

        // First Page Button
        container.appendChild(createBtn(1, '<i data-lucide="chevrons-left" class="w-5 h-5"></i>', false, currentPage === 1, 'Primeira Página'));

        // Prev Button
        container.appendChild(createBtn(currentPage - 1, '<i data-lucide="chevron-left" class="w-5 h-5"></i>', false, currentPage === 1, 'Anterior'));

        // Logic for displaying limited page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i > 0) {
                container.appendChild(createBtn(i, i, i === currentPage));
            }
        }

        // Next Button
        container.appendChild(createBtn(currentPage + 1, '<i data-lucide="chevron-right" class="w-5 h-5"></i>', false, currentPage === totalPages, 'Próxima'));

        // Last Page Button
        container.appendChild(createBtn(totalPages, '<i data-lucide="chevrons-right" class="w-5 h-5"></i>', false, currentPage === totalPages, 'Última Página'));

        if (window.lucide) lucide.createIcons();
    },

    /**
     * Update result count display
     * @param {number} count - Total results
     */
    updateResultCount(count) {
        const countEl = document.getElementById('result-count');
        if (countEl) countEl.innerText = count;
    },

    /**
     * Show loading skeleton
     */
    showLoading() {
        const grid = document.getElementById('pokemon-grid');
        if (!grid) return;

        grid.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            grid.innerHTML += `
                <div class="glass-card rounded-3xl p-5 h-64 animate-pulse flex flex-col items-center">
                    <div class="w-24 h-24 bg-gray-200/50 rounded-full mb-4"></div>
                    <div class="w-3/4 h-6 bg-gray-200/50 rounded-lg mb-2"></div>
                    <div class="flex gap-2">
                        <div class="w-12 h-4 bg-gray-200/50 rounded-full"></div>
                        <div class="w-12 h-4 bg-gray-200/50 rounded-full"></div>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type of notification (success, error, info)
     */
    showNotification(message, type = 'success') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        // Standardize: success and info use dark layout (bg-gray-800)
        const bgColor = type === 'error' ? 'bg-red-500' : 'bg-gray-800';
        
        toast.className = `${bgColor} text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-spring-in pointer-events-auto cursor-pointer`;
        
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
        
        toast.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span class="font-bold text-sm">${message}</span>
        `;
        
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        const removeToast = () => {
            toast.classList.replace('animate-spring-in', 'animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        };

        toast.onclick = removeToast;
        setTimeout(removeToast, 4000);
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const grid = document.getElementById('pokemon-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
                    <i data-lucide="alert-circle" class="w-10 h-10"></i>
                </div>
                <h3 class="text-xl font-quicksand font-bold text-gray-800">Ops! Algo deu errado</h3>
                <p class="text-gray-500">${message}</p>
                <button onclick="location.reload()" class="mt-6 px-6 py-2 bg-coral text-white rounded-xl font-bold hover:bg-coral-hover transition-colors">
                    Tentar novamente
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
};

export default ui;