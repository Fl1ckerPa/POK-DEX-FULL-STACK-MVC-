import { typeChart, typeColors, typeIcons } from './typeChart.js';

class TypeWheel {
    constructor() {
        this.selectedTypes = [];
        this.currentMode = 'advantages'; // 'advantages', 'weaknesses', 'immunities'
        this.isOpen = false;
        this.types = Object.keys(typeChart);
    }

    init() {
        this.createWheelButton();
        this.setupEventListeners();
    }

    createWheelButton() {
        const nav = document.querySelector('nav .flex.items-center.gap-4') || document.body;
        const btn = document.createElement('button');
        btn.id = 'open-type-wheel';
        btn.className = 'flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all border border-white/10 shadow-lg group';
        btn.innerHTML = `
            <i data-lucide="radius" class="w-5 h-5 text-coral group-hover:rotate-90 transition-transform duration-500"></i>
            <span class="font-bold text-sm">Roda de Tipos</span>
        `;
        
        // Inserir antes do perfil ou no final
        if (nav.firstChild) {
            nav.insertBefore(btn, nav.firstChild);
        } else {
            nav.appendChild(btn);
        }

        btn.addEventListener('click', () => this.open());
        if (window.lucide) lucide.createIcons();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.renderModal();
        this.renderWheel();
        this.updateRelations();
    }

    close() {
        const modal = document.getElementById('type-wheel-modal');
        if (modal) {
            modal.classList.replace('animate-fade-in', 'animate-fade-out');
            modal.querySelector('.modal-content').classList.replace('animate-spring-in', 'animate-slide-out');
            setTimeout(() => {
                modal.remove();
                this.isOpen = false;
                this.selectedTypes = [];
            }, 300);
        }
    }

    renderModal() {
        const modal = document.createElement('div');
        modal.id = 'type-wheel-modal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in';
        
        modal.innerHTML = `
            <div class="modal-content relative w-full max-w-5xl aspect-video bg-slate-900 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-spring-in">
                <!-- Close Button -->
                <button class="absolute top-6 right-6 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all close-wheel">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>

                <!-- Left: Wheel Section -->
                <div class="flex-1 relative flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-950">
                    <div id="wheel-container" class="relative w-[400px] h-[400px]">
                        <!-- Central Hub -->
                        <div class="absolute inset-0 m-auto w-32 h-32 bg-slate-800 rounded-full border-4 border-white/10 shadow-[0_0_50px_rgba(255,107,107,0.2)] flex flex-col items-center justify-center z-20 overflow-hidden">
                            <div id="hub-content" class="text-center">
                                <span class="text-xs text-slate-400 font-bold uppercase tracking-widest">Selecione</span>
                                <div class="flex gap-1 justify-center mt-1" id="hub-selected-icons"></div>
                            </div>
                        </div>
                        
                        <!-- Types Circle -->
                        <div id="types-circle" class="absolute inset-0 transition-transform duration-700 ease-out"></div>
                    </div>
                </div>

                <!-- Right: Info Section -->
                <div class="w-full md:w-[400px] bg-slate-800/50 border-l border-white/5 p-8 flex flex-col">
                    <h2 class="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <span class="w-2 h-8 bg-coral rounded-full"></span>
                        RELAÇÕES DE DANO
                    </h2>

                    <!-- Mode Selector -->
                    <div class="flex bg-slate-950/50 p-1 rounded-2xl mb-8 border border-white/5">
                        <button data-mode="advantages" class="flex-1 py-3 rounded-xl text-xs font-black transition-all ${this.currentMode === 'advantages' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">VANTAGENS</button>
                        <button data-mode="weaknesses" class="flex-1 py-3 rounded-xl text-xs font-black transition-all ${this.currentMode === 'weaknesses' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">FRAQUEZAS</button>
                        <button data-mode="immunities" class="flex-1 py-3 rounded-xl text-xs font-black transition-all ${this.currentMode === 'immunities' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">IMUNIDADE</button>
                    </div>

                    <!-- Relations List -->
                    <div id="relations-list" class="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        <div class="text-center py-12 text-slate-500 italic">
                            Selecione até 2 tipos na roda para ver as interações de dano
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                        <div class="flex flex-col items-center p-2 rounded-xl bg-white/5">
                            <span class="text-[10px] text-slate-500 font-bold uppercase">Extremo</span>
                            <span class="text-lg font-black text-emerald-400">x4</span>
                        </div>
                        <div class="flex flex-col items-center p-2 rounded-xl bg-white/5">
                            <span class="text-[10px] text-slate-500 font-bold uppercase">Super</span>
                            <span class="text-lg font-black text-emerald-500">x2</span>
                        </div>
                        <div class="flex flex-col items-center p-2 rounded-xl bg-white/5">
                            <span class="text-[10px] text-slate-500 font-bold uppercase">Imune</span>
                            <span class="text-lg font-black text-slate-400">x0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.close-wheel')) this.close();
        });

        modal.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentMode = btn.dataset.mode;
                this.updateModeUI();
                this.updateRelations();
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    renderWheel() {
        const circle = document.getElementById('types-circle');
        const radius = 160;
        const center = 200;

        this.types.forEach((type, i) => {
            const angle = (i / this.types.length) * (2 * Math.PI) - (Math.PI / 2);
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const btn = document.createElement('button');
            btn.className = `absolute w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-125 hover:z-30 group type-node`;
            btn.style.left = `${x - 24}px`;
            btn.style.top = `${y - 24}px`;
            btn.style.backgroundColor = `${typeColors[type]}33`;
            btn.style.borderColor = `${typeColors[type]}66`;
            btn.dataset.type = type;
            btn.title = type.charAt(0).toUpperCase() + type.slice(1);

            btn.innerHTML = `
                <i data-lucide="${typeIcons[type]}" class="w-5 h-5 transition-transform" style="color: ${typeColors[type]}"></i>
                <span class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-slate-950 px-2 py-1 rounded shadow-xl">
                    ${type}
                </span>
            `;

            btn.addEventListener('click', () => this.toggleType(type));
            circle.appendChild(btn);
        });

        if (window.lucide) lucide.createIcons();
    }

    toggleType(type) {
        const index = this.selectedTypes.indexOf(type);
        if (index > -1) {
            this.selectedTypes.splice(index, 1);
        } else {
            if (this.selectedTypes.length >= 2) this.selectedTypes.shift();
            this.selectedTypes.push(type);
        }

        this.updateWheelUI();
        this.updateRelations();
    }

    updateWheelUI() {
        document.querySelectorAll('.type-node').forEach(node => {
            const type = node.dataset.type;
            const isSelected = this.selectedTypes.includes(type);
            
            if (isSelected) {
                node.classList.add('scale-125', 'z-30', 'border-white', 'shadow-[0_0_20px_rgba(255,255,255,0.3)]');
                node.style.backgroundColor = typeColors[type];
                node.querySelector('i').style.color = 'white';
            } else {
                node.classList.remove('scale-125', 'z-30', 'border-white', 'shadow-[0_0_20px_rgba(255,255,255,0.3)]');
                node.style.backgroundColor = `${typeColors[type]}33`;
                node.querySelector('i').style.color = typeColors[type];
            }
        });

        // Hub update
        const hubContent = document.getElementById('hub-content');
        const hubIcons = document.getElementById('hub-selected-icons');
        
        if (this.selectedTypes.length === 0) {
            hubContent.querySelector('span').textContent = 'Selecione';
            hubIcons.innerHTML = '';
        } else {
            hubContent.querySelector('span').textContent = this.selectedTypes.length === 1 ? 'Tipo Único' : 'Tipo Duplo';
            hubIcons.innerHTML = this.selectedTypes.map(t => `
                <div class="w-8 h-8 rounded-full flex items-center justify-center border border-white/20" style="background-color: ${typeColors[t]}">
                    <i data-lucide="${typeIcons[t]}" class="w-4 h-4 text-white"></i>
                </div>
            `).join('');
            if (window.lucide) lucide.createIcons();
        }
    }

    updateModeUI() {
        const btns = document.querySelectorAll('[data-mode]');
        btns.forEach(btn => {
            const mode = btn.dataset.mode;
            const isActive = this.currentMode === mode;
            
            btn.className = `flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                isActive 
                ? (mode === 'advantages' ? 'bg-emerald-500 text-white' : mode === 'weaknesses' ? 'bg-rose-500 text-white' : 'bg-slate-600 text-white')
                : 'text-slate-400 hover:text-white'
            }`;
        });
    }

    calculateMultipliers() {
        if (this.selectedTypes.length === 0) return null;

        const multipliers = {};
        this.types.forEach(t => multipliers[t] = 1);

        if (this.currentMode === 'weaknesses') {
            // Dano RECEBIDO (Fraquezas)
            this.selectedTypes.forEach(defType => {
                const relations = typeChart[defType];
                relations.double_damage_from.forEach(atkType => multipliers[atkType] *= 2);
                relations.half_damage_from.forEach(atkType => multipliers[atkType] *= 0.5);
                relations.no_damage_from.forEach(atkType => multipliers[atkType] *= 0);
            });
        } else if (this.currentMode === 'advantages') {
            // Dano CAUSADO (Vantagens)
            // Para dano causado, tratamos como se atacasse com qualquer um dos dois tipos
            // mas mostramos o melhor multiplicador para cada tipo defensor
            this.types.forEach(defType => {
                let maxMult = 0;
                this.selectedTypes.forEach(atkType => {
                    const relations = typeChart[atkType];
                    let currentMult = 1;
                    if (relations.double_damage_to.includes(defType)) currentMult = 2;
                    if (relations.half_damage_to.includes(defType)) currentMult = 0.5;
                    if (relations.no_damage_to.includes(defType)) currentMult = 0;
                    maxMult = Math.max(maxMult, currentMult);
                });
                multipliers[defType] = maxMult;
            });
        } else {
            // Imunidades (Dano x0 recebido ou causado conforme o modo)
            this.types.forEach(otherType => {
                let isImmune = false;
                this.selectedTypes.forEach(myType => {
                    if (typeChart[myType].no_damage_from.includes(otherType) || 
                        typeChart[otherType].no_damage_to.includes(myType)) {
                        isImmune = true;
                    }
                });
                multipliers[otherType] = isImmune ? 0 : 1;
            });
        }

        return multipliers;
    }

    updateRelations() {
        const list = document.getElementById('relations-list');
        const multipliers = this.calculateMultipliers();

        if (!multipliers) {
            list.innerHTML = `<div class="text-center py-12 text-slate-500 italic">Selecione até 2 tipos na roda para ver as interações de dano</div>`;
            return;
        }

        let filtered = [];
        if (this.currentMode === 'advantages') {
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1);
        } else if (this.currentMode === 'weaknesses') {
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1 || m < 1);
        } else {
            filtered = Object.entries(multipliers).filter(([_, m]) => m === 0);
        }

        if (filtered.length === 0) {
            list.innerHTML = `<div class="text-center py-12 text-slate-500">Nenhuma relação encontrada para este modo.</div>`;
            return;
        }

        // Ordenar por multiplicador (descendente)
        filtered.sort((a, b) => b[1] - a[1]);

        list.innerHTML = filtered.map(([type, mult]) => `
            <div class="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style="background-color: ${typeColors[type]}">
                        <i data-lucide="${typeIcons[type]}" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <span class="text-sm font-black text-white uppercase tracking-wider">${type}</span>
                        <p class="text-[10px] text-slate-500 font-bold uppercase">${this.getMultLabel(mult)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xl font-black ${this.getMultColor(mult)}">x${mult}</span>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    getMultLabel(mult) {
        if (mult === 4) return 'Dano Extremo';
        if (mult === 2) return 'Super Efetivo';
        if (mult === 0.5) return 'Resistente';
        if (mult === 0.25) return 'Dupla Resistência';
        if (mult === 0) return 'Imunidade Total';
        return 'Neutro';
    }

    getMultColor(mult) {
        if (mult >= 4) return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]';
        if (mult >= 2) return 'text-emerald-500';
        if (mult === 0) return 'text-slate-400';
        if (mult <= 0.25) return 'text-rose-400';
        if (mult <= 0.5) return 'text-rose-500';
        return 'text-white';
    }
}

export default new TypeWheel();
