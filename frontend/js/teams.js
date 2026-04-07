import api from './api.js';
import ui from './ui.js';

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

    let teams = [];
    let allPokemon = []; // Cache para a lista completa
    let currentSlots = Array(6).fill(null);
    let editingTeamId = null;
    let searchTimeout;

    // Initialize slots UI
    function initSlotsUI() {
        if (!slotsContainer) return;
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
                            <button class="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors remove-slot-btn" data-index="${index}">
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
                                    <button class="text-gray-400 hover:text-red-500 remove-move-btn" data-slot-index="${index}" data-move-index="${mIdx}">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                            `).join('')}
                            ${(slot.moves || []).length < 4 ? `
                                <div class="relative col-span-2">
                                    <input type="text" 
                                           placeholder="Adicionar movimento..." 
                                           class="w-full px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-[10px] focus:outline-none focus:border-coral move-search-input"
                                           data-index="${index}">
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
                                       class="slot-search-input" data-index="${index}">
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
        if (dragSrcIndex !== null && dragSrcIndex !== targetIndex) {
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
    async function handleMoveSearch(event, slotIndex) {
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
                    <button class="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 capitalize move-result-item"
                            data-slot-index="${slotIndex}" data-move-name="${m.move.name}">
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
    }

    function addMove(slotIndex, moveName) {
        if (!currentSlots[slotIndex].moves) currentSlots[slotIndex].moves = [];
        if (currentSlots[slotIndex].moves.includes(moveName)) return;
        
        currentSlots[slotIndex].moves.push(moveName);
        initSlotsUI();
    }

    function removeMove(slotIndex, moveIndex) {
        currentSlots[slotIndex].moves.splice(moveIndex, 1);
        initSlotsUI();
    }

    function updateFilledCount() {
        const filled = currentSlots.filter(s => s !== null).length;
        if (filledCountSpan) filledCountSpan.textContent = filled;
    }

    // Modal Logic
    function openCreateModal(team = null) {
        if (createModal) createModal.classList.remove('hidden');
        if (team) {
            editingTeamId = team.id;
            teamNameInput.value = team.name;
            currentSlots = Array(6).fill(null);
            team.slots.forEach(s => {
                currentSlots[s.slot_index] = { ...s };
            });
            if (saveTeamBtn) saveTeamBtn.textContent = 'Atualizar Time';
        } else {
            editingTeamId = null;
            if (teamNameInput) teamNameInput.value = '';
            currentSlots = Array(6).fill(null);
            if (saveTeamBtn) saveTeamBtn.textContent = 'Criar Time';
        }
        initSlotsUI();
    }

    function closeCreateModal() {
        if (createModal) createModal.classList.add('hidden');
    }

    function removeSlot(index) {
        currentSlots[index] = null;
        initSlotsUI();
    }

    async function handleSlotSearch(event, index) {
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
                                data-index="${index}" data-name="${p.name}" data-id="${id}">
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
    }

    function selectPokemon(index, name, id) {
        // Check for duplicates
        if (currentSlots.some((s, idx) => s && s.pokemon_id === id && idx !== index)) {
            ui.showNotification('Este Pokémon já está no time!', 'error');
            return;
        }

        currentSlots[index] = {
            pokemon_id: id,
            pokemon_name: name,
            pokemon_image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            moves: []
        };
        initSlotsUI();
    }

    async function handleCreateTeam() {
        const name = teamNameInput.value.trim();
        const filledSlots = currentSlots
            .map((s, i) => s ? { ...s, slot_index: i } : null)
            .filter(s => s !== null);

        if (!name) {
            ui.showNotification('Nome do time é obrigatório', 'error');
            return;
        }
        if (filledSlots.length === 0) {
            ui.showNotification('Adicione pelo menos um Pokémon', 'error');
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
                ui.showNotification(res.message, 'success');
                closeCreateModal();
                loadTeams();
            } else {
                ui.showNotification(res.message, 'error');
            }
        } catch (error) {
            ui.showNotification(editingTeamId ? 'Erro ao atualizar time' : 'Erro ao criar time', 'error');
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
        if (teamsSubtitle) teamsSubtitle.textContent = `${teams.length} ${teams.length === 1 ? 'time criado' : 'times criados'}`;
        
        if (teams.length === 0) {
            if (teamsEmpty) teamsEmpty.classList.remove('hidden');
            if (teamsList) teamsList.innerHTML = '';
            return;
        }

        if (teamsEmpty) teamsEmpty.classList.add('hidden');
        if (teamsList) {
            teamsList.innerHTML = teams.map(team => `
                <div class="glass-card rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-4 opacity-0 animate-fade-slide-up">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-quicksand font-bold text-xl text-gray-800 dark:text-gray-100">${team.name}</h3>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">${team.slots.length}/6 slots</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="p-2 text-gray-400 hover:text-coral transition-colors edit-team-btn" data-id="${team.id}">
                                <i data-lucide="edit-3" class="w-5 h-5"></i>
                            </button>
                            <button class="p-2 text-gray-300 hover:text-red-500 transition-colors delete-team-btn" data-id="${team.id}">
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
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function editTeam(id) {
        const team = teams.find(t => t.id === id);
        if (team) openCreateModal(team);
    }

    async function deleteTeam(id) {
        if (!confirm('Tem certeza que deseja excluir este time?')) return;

        try {
            const res = await api.delete(`/teams/${id}`);
            if (res.success) {
                ui.showNotification(res.message, 'success');
                loadTeams();
            } else {
                ui.showNotification(res.message, 'error');
            }
        } catch (error) {
            ui.showNotification('Erro ao excluir time', 'error');
        }
    }

    function bindStaticEvents() {
        if (openModalBtn) openModalBtn.addEventListener('click', () => openCreateModal());
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeCreateModal());
        if (modalBackdrop) modalBackdrop.addEventListener('click', () => closeCreateModal());
        if (saveTeamBtn) saveTeamBtn.addEventListener('click', () => handleCreateTeam());

        // Event delegation for slots container
        if (slotsContainer) {
            slotsContainer.addEventListener('click', (e) => {
                const removeSlotBtn = e.target.closest('.remove-slot-btn');
                if (removeSlotBtn) {
                    const index = parseInt(removeSlotBtn.dataset.index);
                    removeSlot(index);
                    return;
                }

                const removeMoveBtn = e.target.closest('.remove-move-btn');
                if (removeMoveBtn) {
                    const slotIndex = parseInt(removeMoveBtn.dataset.slotIndex);
                    const moveIndex = parseInt(removeMoveBtn.dataset.moveIndex);
                    removeMove(slotIndex, moveIndex);
                    return;
                }

                const moveResultItem = e.target.closest('.move-result-item');
                if (moveResultItem) {
                    const slotIndex = parseInt(moveResultItem.dataset.slotIndex);
                    const moveName = moveResultItem.dataset.moveName;
                    addMove(slotIndex, moveName);
                    return;
                }

                const searchResultItem = e.target.closest('.search-result-item');
                if (searchResultItem) {
                    const index = parseInt(searchResultItem.dataset.index);
                    const name = searchResultItem.dataset.name;
                    const id = parseInt(searchResultItem.dataset.id);
                    selectPokemon(index, name, id);
                    return;
                }
            });

            slotsContainer.addEventListener('input', (e) => {
                const moveSearchInput = e.target.closest('.move-search-input');
                if (moveSearchInput) {
                    const slotIndex = parseInt(moveSearchInput.dataset.index);
                    handleMoveSearch(e, slotIndex);
                    return;
                }

                const slotSearchInput = e.target.closest('.slot-search-input');
                if (slotSearchInput) {
                    const index = parseInt(slotSearchInput.dataset.index);
                    handleSlotSearch(e, index);
                    return;
                }
            });
        }

        // Event delegation for teams list
        if (teamsList) {
            teamsList.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-team-btn');
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    editTeam(id);
                    return;
                }

                const deleteBtn = e.target.closest('.delete-team-btn');
                if (deleteBtn) {
                    const id = deleteBtn.dataset.id;
                    deleteTeam(id);
                    return;
                }
            });
        }
    }

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

    // Initial load
    async function start() {
        bindStaticEvents();
        await preloadPokemon();
        await loadTeams();
    }

    start();
});
