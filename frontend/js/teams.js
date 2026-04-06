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
    let editingTeamId = null;

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
            slotDiv.className = 'slot-item flex flex-col gap-2 p-4 rounded-2xl bg-gray-50/50 border border-black/5 dark:border-white/5 transition-all';
            slotDiv.draggable = !!slot;
            slotDiv.dataset.index = index;

            if (slot) {
                slotDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="slot-number-circle">${index + 1}</div>
                        <div class="flex-1 flex items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-black/5">
                            <img src="${slot.pokemon_image}" class="w-8 h-8 object-contain" alt="${slot.pokemon_name}">
                            <span class="ml-3 text-sm font-bold capitalize text-gray-800 dark:text-gray-100">${slot.pokemon_name}</span>
                            <span class="ml-auto text-xs text-gray-400 font-medium">#${String(slot.pokemon_id).padStart(3, '0')}</span>
                            <button class="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors" onclick="window.removeSlot(${index})">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Move Selection -->
                    <div class="ml-12 space-y-2">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Movimentos (Máx 4)</p>
                        <div class="grid grid-cols-2 gap-2">
                            ${(slot.moves || []).map((move, mIdx) => `
                                <div class="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-black/5 text-[10px] font-bold text-gray-600 dark:text-gray-300 capitalize">
                                    <span>${move.replace(/-/g, ' ')}</span>
                                    <button onclick="window.removeMove(${index}, ${mIdx})" class="text-gray-400 hover:text-red-500">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            `).join('')}
                            ${(slot.moves || []).length < 4 ? `
                                <div class="relative col-span-2">
                                    <input type="text" 
                                           placeholder="Adicionar movimento..." 
                                           class="w-full px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-[10px] focus:outline-none focus:border-coral"
                                           oninput="window.handleMoveSearch(event, ${index})">
                                    <div class="move-results hidden absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-black/5 rounded-xl shadow-xl max-h-40 overflow-y-auto"></div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                slotDiv.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="slot-number-circle">${index + 1}</div>
                        <div class="slot-search-container flex-1">
                            <div class="slot-search-input-wrapper">
                                <i data-lucide="search" class="w-4 h-4"></i>
                                <input type="text" placeholder="Buscar Pokémon..." 
                                       oninput="window.handleSlotSearch(event, ${index})">
                            </div>
                            <div class="search-results hidden"></div>
                        </div>
                    </div>
                `;
            }

            // Drag & Drop events
            slotDiv.addEventListener('dragstart', handleDragStart);
            slotDiv.addEventListener('dragover', handleDragOver);
            slotDiv.addEventListener('drop', handleDrop);
            slotDiv.addEventListener('dragend', handleDragEnd);

            slotsContainer.appendChild(slotDiv);
        });
        
        if (window.lucide) window.lucide.createIcons();
        updateFilledCount();
    }

    // Drag & Drop logic
    let dragSrcIndex = null;
    function handleDragStart(e) {
        if (!this.draggable) return;
        dragSrcIndex = this.dataset.index;
        this.classList.add('opacity-50', 'scale-95');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        e.stopPropagation();
        const targetIndex = this.dataset.index;
        if (dragSrcIndex !== targetIndex) {
            const temp = currentSlots[dragSrcIndex];
            currentSlots[dragSrcIndex] = currentSlots[targetIndex];
            currentSlots[targetIndex] = temp;
            initSlotsUI();
        }
        return false;
    }

    function handleDragEnd() {
        this.classList.remove('opacity-50', 'scale-95');
    }

    // Move search logic
    window.handleMoveSearch = async (event, slotIndex) => {
        const query = event.target.value.toLowerCase().trim();
        const resultsDiv = event.target.nextElementSibling;
        const pokemonId = currentSlots[slotIndex].pokemon_id;

        if (query.length < 2) {
            resultsDiv.classList.add('hidden');
            return;
        }

        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const data = await res.json();
            const filtered = data.moves
                .filter(m => m.move.name.includes(query))
                .slice(0, 10);

            if (filtered.length > 0) {
                resultsDiv.innerHTML = filtered.map(m => `
                    <button class="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 capitalize"
                            onclick="window.addMove(${slotIndex}, '${m.move.name}')">
                        ${m.move.name.replace(/-/g, ' ')}
                    </button>
                `).join('');
                resultsDiv.classList.remove('hidden');
            } else {
                resultsDiv.classList.add('hidden');
            }
        } catch (error) {
            console.error('Erro ao buscar movimentos:', error);
        }
    };

    window.addMove = (slotIndex, moveName) => {
        if (!currentSlots[slotIndex].moves) currentSlots[slotIndex].moves = [];
        if (currentSlots[slotIndex].moves.includes(moveName)) return;
        
        currentSlots[slotIndex].moves.push(moveName);
        initSlotsUI();
    };

    window.removeMove = (slotIndex, moveIndex) => {
        currentSlots[slotIndex].moves.splice(moveIndex, 1);
        initSlotsUI();
    };

    function updateFilledCount() {
        const filled = currentSlots.filter(s => s !== null).length;
        filledCountSpan.textContent = filled;
    }

    // Modal Logic
    function openCreateModal(team = null) {
        createModal.classList.remove('hidden');
        if (team) {
            editingTeamId = team.id;
            teamNameInput.value = team.name;
            currentSlots = Array(6).fill(null);
            team.slots.forEach(s => {
                currentSlots[s.slot_index] = { ...s };
            });
            saveTeamBtn.textContent = 'Atualizar Time';
        } else {
            editingTeamId = null;
            teamNameInput.value = '';
            currentSlots = Array(6).fill(null);
            saveTeamBtn.textContent = 'Criar Time';
        }
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
        if (currentSlots.some((s, idx) => s && s.pokemon_id === id && idx !== index)) {
            showToast('Este Pokémon já está no time!', 'error');
            return;
        }

        currentSlots[index] = {
            pokemon_id: id,
            pokemon_name: name,
            pokemon_image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            moves: []
        };
        initSlotsUI();
    };

    async function handleCreateTeam() {
        const name = teamNameInput.value.trim();
        const filledSlots = currentSlots
            .map((s, i) => s ? { ...s, slot_index: i } : null)
            .filter(s => s !== null);

        if (!name) {
            showToast('Nome do time é obrigatório', 'error');
            return;
        }
        if (filledSlots.length === 0) {
            showToast('Adicione pelo menos um Pokémon', 'error');
            return;
        }

        try {
            let res;
            if (editingTeamId) {
                res = await api.put(`/teams/${editingTeamId}`, { name, slots: filledSlots });
            } else {
                res = await api.post('/teams', { name, slots: filledSlots });
            }

            if (res.success) {
                showToast(res.message, 'success');
                closeCreateModal();
                loadTeams();
            } else {
                showToast(res.message, 'error');
            }
        } catch (error) {
            showToast(editingTeamId ? 'Erro ao atualizar time' : 'Erro ao criar time', 'error');
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
                    <div class="flex items-center gap-2">
                        <button class="p-2 text-gray-400 hover:text-coral transition-colors" onclick="window.editTeam('${team.id}')">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                        <button class="p-2 text-gray-300 hover:text-red-500 transition-colors" onclick="window.deleteTeam('${team.id}')">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    ${team.slots.map(slot => `
                        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-black/5 dark:border-white/5 space-y-2">
                            <div class="flex items-center gap-2">
                                <img src="${slot.pokemon_image}" class="h-10 w-10 object-contain" alt="${slot.pokemon_name}">
                                <span class="text-[10px] font-bold capitalize text-gray-800 dark:text-gray-100 truncate">${slot.pokemon_name}</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                                ${(slot.moves || []).map(move => `
                                    <span class="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-[8px] font-bold text-gray-400 border border-black/5 capitalize truncate">
                                        ${move.replace(/-/g, ' ')}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    ${Array(6 - team.slots.length).fill(0).map(() => `
                        <div class="h-12 w-full rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-200">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    window.editTeam = (id) => {
        const team = teams.find(t => t.id === id);
        if (team) openCreateModal(team);
    };

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
