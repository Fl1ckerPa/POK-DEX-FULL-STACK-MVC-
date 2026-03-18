/**
 * UI Service - Handles all UI rendering and updates
 */

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

        // Initialize Lucide icons for the new cards
        if (window.lucide) lucide.createIcons();
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
            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 text-gray-700 border border-black/5">
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
            <button class="absolute top-4 right-4 p-2 rounded-xl bg-white/80 text-gray-400 hover:text-coral opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm border border-black/5 favorite-btn z-20" data-id="${pokemon.id}">
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
            window.location.href = `dashmon-details.html?id=${pokemon.id}`;
        });

        return template;
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