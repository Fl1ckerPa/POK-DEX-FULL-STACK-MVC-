/**
 * UI Service - Handles all UI rendering and updates
 */
import api from './api.js';

const ui = {
    /**
     * Mostra o overlay de carregamento padronizado
     */
    showLoading() {
        let loader = document.getElementById('loading-overlay');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-overlay';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <p class="loader-text">Carregando</p>
            `;
            document.body.appendChild(loader);
        }
        loader.style.opacity = '1';
        loader.style.display = 'flex';
        loader.style.pointerEvents = 'all';
    },

    /**
     * Esconde o overlay de carregamento padronizado
     */
    hideLoading() {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 400);
        }
    },

    /**
     * Inicializa ouvintes globais de UI
     */
    init() {
        // Escuta mudanças de favoritos para manter a consistência visual em todos os cards
        document.addEventListener('favoriteChanged', (e) => {
            const { id, isFavorited } = e.detail;
            this.updatePokemonCardState(id, isFavorited);
        });
    },

    /**
     * Atualiza o estado visual de todos os cards e botões de um Pokémon específico
     * @param {number|string} id - ID do Pokémon
     * @param {boolean} isFavorited - Novo estado de favorito
     */
    updatePokemonCardState(id, isFavorited) {
        // Atualiza cards na grade
        const favBtns = document.querySelectorAll(`.favorite-btn[data-id="${id}"]`);
        favBtns.forEach(btn => {
            const icon = btn.querySelector('i, svg');
            if (!icon) return;

            if (isFavorited) {
                icon.classList.add('fill-coral', 'text-coral');
                btn.classList.add('opacity-100', 'shadow-md');
                btn.dataset.favorited = 'true';
            } else {
                icon.classList.remove('fill-coral', 'text-coral');
                btn.classList.remove('opacity-100', 'shadow-md');
                btn.dataset.favorited = 'false';
            }
        });

        // Também atualiza o botão no painel de detalhes (se estiver aberto e for o mesmo Pokémon)
        const detailFavBtn = document.getElementById('favorite-detail-btn');
        if (detailFavBtn && detailFavBtn.dataset.id == id) {
            const icon = detailFavBtn.querySelector('i, svg');
            const span = detailFavBtn.querySelector('span');
            
            if (isFavorited) {
                if (icon) icon.classList.add('fill-white');
                detailFavBtn.classList.remove('bg-gray-100', 'text-gray-600');
                detailFavBtn.classList.add('bg-coral', 'text-white', 'shadow-coral/20');
                if (span) span.textContent = 'Favoritado';
                detailFavBtn.dataset.favorited = 'true';
            } else {
                if (icon) icon.classList.remove('fill-white', 'bg-coral', 'text-white', 'shadow-coral/20');
                detailFavBtn.classList.add('bg-gray-100', 'text-gray-600');
                if (span) span.textContent = 'Favoritar';
                detailFavBtn.dataset.favorited = 'false';
            }
        }
        
        if (window.lucide) lucide.createIcons();
    },

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

        // Hide loading
        this.hideLoading();
    },

    /**
     * Alterna o estado de favorito de um Pokémon de forma otimista (tempo real)
     * @param {number|string} id - ID do Pokémon
     * @param {HTMLElement} btn - Elemento do botão que foi clicado
     */
    async toggleFavorite(id, btn) {
        // Se o botão tem a classe de preenchimento ou o dataset favorited
        const isFavorited = btn.dataset.favorited === 'true';
        
        // Estado otimista: muda a cor do ícone imediatamente em todos os lugares
        this.updatePokemonCardState(id, !isFavorited);

        try {
            // Chamada unificada para o novo endpoint /toggle
            const response = await api.post('/favorites/toggle', { pokemonId: id });

            if (response.isUnauthorized) {
                // Reverte o estado otimista
                this.updatePokemonCardState(id, isFavorited);
                this.showNotification('Faça login para favoritar Pokémon', 'error');
                return;
            }

            if (response.success) {
                // Sincroniza o estado real vindo do servidor (embora deva ser o mesmo do otimista)
                this.updatePokemonCardState(id, response.isFavorited);
                
                this.showNotification(
                    response.isFavorited ? 'Adicionado aos favoritos!' : 'Pokémon removido dos favoritos!', 
                    'success'
                );
                
                // Dispara um evento para outros módulos (como favorites.js) saberem que mudou
                document.dispatchEvent(new CustomEvent('favoriteChanged', { 
                    detail: { id, isFavorited: response.isFavorited } 
                }));
            } else {
                // Reverte o estado otimista em caso de erro lógico
                this.updatePokemonCardState(id, isFavorited);
                this.showNotification(response.message || 'Erro ao atualizar favoritos', 'error');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Reverte o estado otimista em caso de erro de rede
            this.updatePokemonCardState(id, isFavorited);
            this.showNotification('Erro de conexão com o servidor', 'error');
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
            <button class="absolute top-4 right-4 p-2 rounded-xl bg-white/80 text-gray-400 hover:text-coral ${pokemon.is_favorite ? 'opacity-100 shadow-md' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 shadow-sm border border-black/5 favorite-btn z-20" 
                    data-id="${pokemon.id}" 
                    data-favorited="${pokemon.is_favorite ? 'true' : 'false'}">
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
                        <div class="relative w-56 h-56 flex items-center justify-center bg-gray-100/50 rounded-full">
                            <div class="absolute inset-0 bg-gradient-to-br from-coral/10 to-transparent rounded-full blur-2xl z-0"></div>
                            <img src="${imageUrl}" alt="${pokemon.name}" id="pokemon-main-image" 
                                 class="w-48 h-48 object-contain relative z-10 drop-shadow-2xl transition-all duration-300">
                            
                            <!-- Shiny Toggle Button (Overlay) -->
                            <button id="toggle-shiny-btn" 
                                    class="absolute top-1 right-1 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 transition-all duration-300 shadow-sm hover:border-gray-400 active:scale-90 group"
                                    title="Ver sprite shiny">
                                <i data-lucide="sparkles" class="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors"></i>
                            </button>
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
                        <button class="btn-action ${pokemon.is_favorite ? 'bg-coral text-white shadow-coral/20' : 'bg-gray-100 text-gray-600 hover:bg-coral hover:text-white'} shadow-lg hover:scale-[1.02]" 
                                id="favorite-detail-btn" 
                                data-id="${pokemon.id}"
                                data-favorited="${pokemon.is_favorite ? 'true' : 'false'}">
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
            await this.toggleFavorite(pokemon.id, favBtn);
        });

        // Add to team button logic
        const teamBtn = overlay.querySelector('#add-team-detail-btn');
        teamBtn.addEventListener('click', () => {
            console.log('Adding to team', pokemon.id);
            this.showNotification(`${pokemon.name} adicionado à sua equipe!`, 'success');
            document.dispatchEvent(new CustomEvent('addToTeam', { detail: { id: pokemon.id } }));
        });

        // Shiny Toggle Logic
        const shinyBtn = overlay.querySelector('#toggle-shiny-btn');
        const mainImage = overlay.querySelector('#pokemon-main-image');
        let isShiny = false;

        if (shinyBtn && mainImage) {
            shinyBtn.addEventListener('click', () => {
                isShiny = !isShiny;
                
                // 1. Forçar visibilidade e resetar transformações problemáticas
                mainImage.style.opacity = '0.5'; // Opacidade parcial durante a troca para indicar carregamento
                
                const shinyUrl = pokemon.sprites?.official_artwork_shiny || 
                                 pokemon.sprites?.front_shiny || 
                                 `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokemon.id}.png` ||
                                 `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;
                
                const normalUrl = pokemon.sprites?.official_artwork || 
                                  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
                
                const targetUrl = isShiny ? shinyUrl : normalUrl;

                // Troca imediata do SRC
                mainImage.src = targetUrl;
                mainImage.alt = isShiny ? `${pokemon.name} shiny` : pokemon.name;

                // Quando a imagem carregar (ou se já estiver no cache do navegador)
                mainImage.onload = () => {
                    mainImage.style.opacity = '1';
                    mainImage.style.transform = 'scale(1)';
                };

                // Fallback de segurança: garantir que a opacidade volte para 1 após um tempo
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                    mainImage.style.transform = 'scale(1)';
                }, 500);

                if (isShiny) {
                    shinyBtn.classList.remove('bg-white/80', 'border-gray-200');
                    shinyBtn.classList.add('bg-amber-500', 'border-amber-400', 'shadow-[0_0_12px_rgba(245,158,11,0.5)]');
                    const icon = shinyBtn.querySelector('i');
                    icon.classList.remove('text-gray-400');
                    icon.classList.add('text-white', 'animate-pulse');
                    shinyBtn.title = "Ver sprite normal";
                } else {
                    shinyBtn.classList.remove('bg-amber-500', 'border-amber-400', 'shadow-[0_0_12px_rgba(245,158,11,0.5)]');
                    shinyBtn.classList.add('bg-white/80', 'border-gray-200');
                    const icon = shinyBtn.querySelector('i');
                    icon.classList.remove('text-white', 'animate-pulse');
                    icon.classList.add('text-gray-400');
                    shinyBtn.title = "Ver sprite shiny";
                }
            });
        }
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
                btn.addEventListener('click', () => onPageChange(page));
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
     * Show loading skeleton in the grid
     */
    showGridLoading() {
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

        toast.addEventListener('click', removeToast);
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
                <button class="mt-6 px-6 py-2 bg-coral text-white rounded-xl font-bold hover:bg-coral-hover transition-colors reload-btn">
                    Tentar novamente
                </button>
            </div>
        `;
        
        const reloadBtn = grid.querySelector('.reload-btn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => location.reload());
        }

        if (window.lucide) lucide.createIcons();
    }
};

export default ui;