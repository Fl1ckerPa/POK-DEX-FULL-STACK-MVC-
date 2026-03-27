import api from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const teamsList = document.querySelector('.teams-list');
    const teamsEmpty = document.querySelector('.teams-empty');
    const teamsSubtitle = document.querySelector('.teams-subtitle');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createModal = document.getElementById('create-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const teamNameInput = document.getElementById('team-name-input');
    const saveTeamBtn = document.getElementById('save-team-btn');
    const slotsContainer = document.querySelector('.slots-container');
    const filledCountSpan = document.querySelector('.filled-count');
    const toastContainer = document.getElementById('toast-container');

    let teams = [];
    let allPokemon = []; // Cache para a lista completa
    let currentSlots = Array(6).fill(null);

    // Pré-carregar lista de Pokémon para busca rápida
    async function preloadPokemon() {
        try {
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
            const data = await response.json();
            allPokemon = data.results;
        } catch (error) {
            console.error('Erro ao carregar lista de Pokémon:', error);
        }
    }
    preloadPokemon();

    // Initialize slots UI
    function initSlotsUI() {
        slotsContainer.innerHTML = '';
        currentSlots.forEach((slot, index) => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'slot-item flex items-center gap-4';
            
            if (slot) {
                slotDiv.innerHTML = `
                    <div class="slot-number-circle">${index + 1}</div>
                    <div class="slot-search-input-wrapper flex-1">
                        <img src="${slot.pokemon_image}" class="w-8 h-8 object-contain" alt="${slot.pokemon_name}">
                        <span class="ml-3 text-sm font-bold capitalize text-gray-800">${slot.pokemon_name}</span>
                        <span class="ml-auto text-xs text-gray-400 font-medium">#${String(slot.pokemon_id).padStart(3, '0')}</span>
                        <button class="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors" onclick="window.removeSlot(${index})">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            } else {
                slotDiv.innerHTML = `
                    <div class="slot-number-circle">${index + 1}</div>
                    <div class="slot-search-container">
                        <div class="slot-search-input-wrapper">
                            <i data-lucide="search" class="w-4 h-4"></i>
                            <input type="text" placeholder="Buscar Pokémon..." 
                                   oninput="window.handleSlotSearch(event, ${index})">
                        </div>
                        <div class="search-results hidden"></div>
                    </div>
                `;
            }
            slotsContainer.appendChild(slotDiv);
        });
        
        if (window.lucide) window.lucide.createIcons();
        updateFilledCount();
    }

    function updateFilledCount() {
        const filled = currentSlots.filter(s => s !== null).length;
        filledCountSpan.textContent = filled;
    }

    // Modal Logic
    function openCreateModal() {
        createModal.classList.remove('hidden');
        teamNameInput.value = '';
        currentSlots = Array(6).fill(null);
        initSlotsUI();
    }

    function closeCreateModal() {
        createModal.classList.add('hidden');
    }

    // Attach to window for inline onclicks (though better to use listeners)
    window.removeSlot = (index) => {
        currentSlots[index] = null;
        initSlotsUI();
    };

    let searchTimeout;
    window.handleSlotSearch = async (event, index) => {
        const query = event.target.value.toLowerCase().trim();
        const container = event.target.closest('.slot-search-container');
        const resultsDiv = container.querySelector('.search-results');

        if (query.length < 1) {
            resultsDiv.classList.add('hidden');
            return;
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // Filtrar da lista local (mais rápido)
            const filtered = allPokemon
                .filter(p => p.name.includes(query))
                .slice(0, 8);

            if (filtered.length > 0) {
                resultsDiv.innerHTML = filtered.map(p => {
                    const id = p.url.split('/').filter(Boolean).pop();
                    return `
                        <button class="search-result-item"
                                onclick="window.selectPokemon(${index}, '${p.name}', ${id})">
                            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${p.name}">
                            <span class="pokemon-name">${p.name}</span>
                            <span class="pokemon-id">#${String(id).padStart(3, '0')}</span>
                        </button>
                    `;
                }).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.classList.add('hidden');
            }
        }, 300);
    };

    window.selectPokemon = (index, name, id) => {
        // Check for duplicates
        if (currentSlots.some(s => s && s.pokemon_id === id)) {
            showToast('Este Pokémon já está no time!', 'error');
            return;
        }

        currentSlots[index] = {
            pokemon_id: id,
            pokemon_name: name,
            pokemon_image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        };
        initSlotsUI();
    };

    async function handleCreateTeam() {
        const name = teamNameInput.value.trim();
        const filledSlots = currentSlots.filter(s => s !== null);

        if (!name) {
            showToast('Nome do time é obrigatório', 'error');
            return;
        }
        if (filledSlots.length === 0) {
            showToast('Adicione pelo menos um Pokémon', 'error');
            return;
        }

        try {
            const res = await api.post('/teams', { 
                name, 
                slots: filledSlots.map((s, i) => ({ ...s, slot_index: i })) 
            });

            if (res.success) {
                showToast(res.message, 'success');
                closeCreateModal();
                loadTeams();
            } else {
                showToast(res.message, 'error');
            }
        } catch (error) {
            showToast('Erro ao criar time', 'error');
        }
    }

    // Load and Render Teams
    async function loadTeams() {
        try {
            const res = await api.get('/teams');
            if (res.success) {
                teams = res.data;
                renderTeams();
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    function renderTeams() {
        teamsSubtitle.textContent = `${teams.length} ${teams.length === 1 ? 'time criado' : 'times criados'}`;
        
        if (teams.length === 0) {
            teamsEmpty.classList.remove('hidden');
            teamsList.innerHTML = '';
            return;
        }

        teamsEmpty.classList.add('hidden');
        teamsList.innerHTML = teams.map(team => `
            <div class="glass-card rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-4 opacity-0 animate-fade-slide-up">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-quicksand font-bold text-xl text-gray-800 dark:text-gray-100">${team.name}</h3>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">${team.slots.length}/6 slots</p>
                    </div>
                    <button class="p-2 text-gray-300 hover:text-red-500 transition-colors" onclick="window.deleteTeam('${team.id}')">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="flex items-center gap-2 overflow-x-auto pb-2">
                    ${team.slots.map(slot => `
                        <div class="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-1 border border-black/5 dark:border-white/5" title="${slot.pokemon_name}">
                            <img src="${slot.pokemon_image}" class="h-10 w-10 object-contain" alt="${slot.pokemon_name}">
                        </div>
                    `).join('')}
                    ${Array(6 - team.slots.length).fill(0).map(() => `
                        <div class="h-12 w-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-200">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    window.deleteTeam = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este time?')) return;

        try {
            const res = await api.delete(`/teams/${id}`);
            if (res.success) {
                showToast(res.message, 'success');
                loadTeams();
            } else {
                showToast(res.message, 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir time', 'error');
        }
    };

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-in flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
            type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`;
        
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        toast.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span class="font-bold text-sm">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        if (window.lucide) window.lucide.createIcons({ node: toast });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Event Listeners
    openModalBtn.addEventListener('click', openCreateModal);
    closeModalBtn.addEventListener('click', closeCreateModal);
    modalBackdrop.addEventListener('click', closeCreateModal);
    saveTeamBtn.addEventListener('click', handleCreateTeam);

    // Initial load
    loadTeams();
});
