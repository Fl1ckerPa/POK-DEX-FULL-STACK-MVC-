import { typeChart, typeColors, typeIcons } from './typeChart.js';
import api from './api.js';
import auth from './auth.js';

class TypeWheelPage {
    constructor() {
        this.selectedTypes = [];
        this.currentMode = 'advantages'; // 'advantages', 'weaknesses', 'immunities'
        this.types = Object.keys(typeChart);
        this.isDualType = false;
    }

    async init() {
        auth.checkAuthOnLoad();
        this.updateUserDisplay();
        this.setupEventListeners();
        this.renderWheel();
        this.updateRelations();
        
        if (window.lucide) lucide.createIcons();
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentMode = btn.dataset.mode;
                this.updateModeUI();
                this.updateRelations();
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => auth.logout());
        }

        // Mobile menu
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                const sidebar = document.querySelector('aside');
                sidebar.classList.toggle('hidden');
                sidebar.classList.toggle('flex');
                sidebar.classList.toggle('fixed');
                sidebar.classList.toggle('inset-0');
                sidebar.classList.toggle('z-[100]');
            });
        }
    }

    updateUserDisplay() {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            const userEmail = document.getElementById('user-email');
            const userName = document.getElementById('user-name');
            if (userEmail) userEmail.innerText = user.email;
            if (userName) userName.innerText = user.username;
            
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.classList.remove('hidden');
        }
    }

    renderWheel() {
        const circle = document.getElementById('types-circle');
        const wheelContainer = document.getElementById('wheel-container');
        if (!circle || !wheelContainer) return;

        // Dynamic radius based on container size
        const containerWidth = wheelContainer.offsetWidth;
        const radius = (containerWidth / 2) - 40;
        const center = containerWidth / 2;

        this.types.forEach((type, i) => {
            const angle = (i / this.types.length) * (2 * Math.PI) - (Math.PI / 2);
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);

            const btn = document.createElement('button');
            btn.className = `absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-black/5 flex items-center justify-center transition-all duration-500 hover:scale-125 hover:z-30 group type-node shadow-sm overflow-visible`;
            btn.style.left = `${x - (containerWidth <= 400 ? 24 : 28)}px`;
            btn.style.top = `${y - (containerWidth <= 400 ? 24 : 28)}px`;
            btn.style.backgroundColor = `${typeColors[type]}15`; // Muito suave
            btn.style.borderColor = `${typeColors[type]}33`;
            btn.dataset.type = type;
            btn.title = type.charAt(0).toUpperCase() + type.slice(1);

            btn.innerHTML = `
                <i data-lucide="${typeIcons[type]}" class="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-12" style="color: ${typeColors[type]}"></i>
                
                <!-- Selection Number Badge -->
                <div class="selection-badge absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-coral text-[10px] font-black flex items-center justify-center shadow-lg border border-coral/20 opacity-0 scale-0 transition-all duration-300 z-50"></div>

                <!-- Label HUD -->
                <div class="type-label absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div class="bg-white border border-black/10 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" style="background-color: ${typeColors[type]}"></div>
                        <span class="text-[10px] font-black uppercase text-gray-800 tracking-widest">${type}</span>
                    </div>
                </div>

                <!-- Active Glow -->
                <div class="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 transition-opacity bg-black/5"></div>
                
                <!-- Relation Ring (Inner) -->
                <div class="relation-ring absolute inset-0 rounded-full border-2 border-transparent transition-all duration-500 scale-90"></div>
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
        const hasSelection = this.selectedTypes.length > 0;

        document.querySelectorAll('.type-node').forEach(node => {
            const type = node.dataset.type;
            const selectionIndex = this.selectedTypes.indexOf(type);
            const isSelected = selectionIndex > -1;
            const badge = node.querySelector('.selection-badge');
            const label = node.querySelector('.type-label');
            
            if (isSelected) {
                // Node Highlight
                node.classList.add('scale-125', 'z-30', 'border-coral', 'shadow-2xl', 'shadow-coral/40', 'opacity-100');
                node.classList.remove('opacity-40');
                node.style.backgroundColor = typeColors[type];
                node.querySelector('i').style.color = 'white';
                node.style.borderWidth = '4px';

                // Badge (Selection Order)
                if (badge) {
                    badge.textContent = selectionIndex + 1;
                    badge.classList.remove('opacity-0', 'scale-0');
                    badge.classList.add('opacity-100', 'scale-100');
                }

                // Persistent Label
                if (label) {
                    label.classList.add('opacity-100', '-bottom-12');
                    label.classList.remove('opacity-0', '-bottom-10');
                }
            } else {
                // Node Reset
                node.classList.remove('scale-125', 'z-30', 'border-coral', 'shadow-2xl', 'shadow-coral/40');
                node.style.backgroundColor = `${typeColors[type]}15`;
                node.querySelector('i').style.color = typeColors[type];
                node.style.borderWidth = '2px';
                
                // Dim non-selected
                if (hasSelection) {
                    node.classList.add('opacity-40');
                    node.classList.remove('opacity-100');
                } else {
                    node.classList.add('opacity-100');
                    node.classList.remove('opacity-40');
                }

                // Badge Reset
                if (badge) {
                    badge.classList.add('opacity-0', 'scale-0');
                    badge.classList.remove('opacity-100', 'scale-100');
                }

                // Persistent Label Reset
                if (label) {
                    label.classList.remove('opacity-100', '-bottom-12');
                    label.classList.add('opacity-0', '-bottom-10');
                }
            }
        });

        // Hub update
        const hub = document.getElementById('central-hub');
        const hubContent = document.getElementById('hub-content');
        const hubIcons = document.getElementById('hub-selected-icons');
        
        if (this.selectedTypes.length === 0) {
            hub.style.background = 'white';
            hub.style.borderColor = '#f3f4f6'; // gray-100
            hubContent.querySelector('span').textContent = 'Seleção';
            hubContent.querySelector('span').classList.replace('text-white/70', 'text-gray-400');
            hubIcons.innerHTML = `
                <div class="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center animate-pulse">
                    <i data-lucide="plus" class="w-4 h-4 text-gray-300"></i>
                </div>
            `;
        } else {
            const type1 = this.selectedTypes[0];
            const type2 = this.selectedTypes[1];
            
            hubContent.querySelector('span').textContent = this.selectedTypes.length === 1 ? 'Tipo Único' : 'Tipo Duplo';
            hubContent.querySelector('span').classList.replace('text-gray-400', 'text-white/70');
            hub.style.borderColor = 'rgba(255,255,255,0.2)';

            if (this.selectedTypes.length === 1) {
                hub.style.background = typeColors[type1];
                hubIcons.innerHTML = `
                    <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 border-white/20 shadow-2xl animate-spring-in">
                        <i data-lucide="${typeIcons[type1]}" class="w-6 h-6 sm:w-8 sm:h-8 text-white"></i>
                    </div>
                `;
            } else {
                // 50/50 Split
                hub.style.background = `linear-gradient(to bottom, ${typeColors[type1]} 50%, ${typeColors[type2]} 50%)`;
                hubIcons.innerHTML = `
                    <div class="flex flex-col gap-2 animate-spring-in">
                        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg" style="background-color: ${typeColors[type1]}">
                            <i data-lucide="${typeIcons[type1]}" class="w-5 h-5 sm:w-6 sm:h-6 text-white"></i>
                        </div>
                        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg" style="background-color: ${typeColors[type2]}">
                            <i data-lucide="${typeIcons[type2]}" class="w-5 h-5 sm:w-6 sm:h-6 text-white"></i>
                        </div>
                    </div>
                `;
            }
        }
        if (window.lucide) lucide.createIcons();
    }

    updateModeUI() {
        const btns = document.querySelectorAll('[data-mode]');
        const modeTitle = document.getElementById('mode-title');
        
        btns.forEach(btn => {
            const mode = btn.dataset.mode;
            const isActive = this.currentMode === mode;
            
            btn.className = `flex-1 py-3.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 mode-btn ${
                isActive 
                ? (mode === 'advantages' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : mode === 'weaknesses' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20')
                : 'text-gray-400 hover:text-gray-600'
            }`;
        });

        // Update Title and Icon
        if (this.currentMode === 'advantages') {
            modeTitle.innerHTML = `<i data-lucide="zap" class="w-5 h-5 text-emerald-500"></i> Eficácia de Ataque`;
        } else if (this.currentMode === 'weaknesses') {
            modeTitle.innerHTML = `<i data-lucide="shield-alert" class="w-5 h-5 text-rose-500"></i> Vulnerabilidades`;
        } else {
            modeTitle.innerHTML = `<i data-lucide="shield-check" class="w-5 h-5 text-blue-500"></i> Resistências e Imunidades`;
        }
        if (window.lucide) lucide.createIcons();
    }

    calculateMultipliers() {
        if (this.selectedTypes.length === 0) return null;

        const multipliers = {};
        this.types.forEach(t => multipliers[t] = 1);

        if (this.currentMode === 'weaknesses') {
            this.selectedTypes.forEach(defType => {
                const relations = typeChart[defType];
                relations.double_damage_from.forEach(atkType => multipliers[atkType] *= 2);
                relations.half_damage_from.forEach(atkType => multipliers[atkType] *= 0.5);
                relations.no_damage_from.forEach(atkType => multipliers[atkType] *= 0);
            });
        } else if (this.currentMode === 'advantages') {
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
        
        // Reset all relation rings on the wheel
        document.querySelectorAll('.relation-ring').forEach(ring => {
            ring.classList.replace('scale-110', 'scale-90');
            ring.style.borderColor = 'transparent';
        });

        if (!multipliers) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 animate-pulse">
                        <i data-lucide="mouse-pointer-2" class="w-8 h-8"></i>
                    </div>
                    <p class="text-gray-400 font-medium max-w-[200px]">Selecione até 2 tipos na roda para analisar interações.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        let filtered = [];
        if (this.currentMode === 'advantages') {
            // Dano que EU CAUSO (Ataque)
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1);
        } else if (this.currentMode === 'weaknesses') {
            // Dano que EU RECEBO (Vulnerabilidades)
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1);
        } else {
            // Dano que EU RECEBO (Resistências e Imunidades)
            filtered = Object.entries(multipliers).filter(([_, m]) => m < 1);
        }

        // Highlight relation rings on the wheel
        filtered.forEach(([type, mult]) => {
            const node = document.querySelector(`.type-node[data-type="${type}"]`);
            if (node) {
                const ring = node.querySelector('.relation-ring');
                if (ring) {
                    ring.classList.replace('scale-90', 'scale-110');
                    ring.style.borderColor = this.getMultColorHex(mult);
                    node.classList.remove('opacity-40');
                    node.classList.add('opacity-100');
                }
            }
        });

        if (filtered.length === 0) {
            list.innerHTML = `<div class="text-center py-20 text-gray-400 font-medium">Nenhuma relação crítica detectada.</div>`;
            return;
        }

        filtered.sort((a, b) => b[1] - a[1]);

        list.innerHTML = filtered.map(([type, mult]) => `
            <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-black/5 group hover:border-coral/20 transition-all duration-300 animate-fade-in hover:shadow-lg hover:shadow-black/5">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform" style="background-color: ${typeColors[type]}">
                        <i data-lucide="${typeIcons[type]}" class="w-6 h-6 text-white"></i>
                    </div>
                    <div>
                        <span class="text-sm font-black text-gray-800 uppercase tracking-widest">${type}</span>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">${this.getMultLabel(mult)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="px-3 py-1.5 rounded-lg bg-white border border-black/5 shadow-sm">
                        <span class="text-xl font-black ${this.getMultColor(mult)}">x${mult}</span>
                    </div>
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
        if (mult >= 4) return 'text-emerald-600';
        if (mult >= 2) return 'text-emerald-500';
        if (mult === 0) return 'text-gray-400';
        if (mult <= 0.25) return 'text-blue-600';
        if (mult <= 0.5) return 'text-blue-500';
        return 'text-gray-800';
    }

    getMultColorHex(mult) {
        if (mult >= 4) return '#059669'; // emerald-600
        if (mult >= 2) return '#10b981'; // emerald-500
        if (mult === 0) return '#9ca3af'; // gray-400
        if (mult <= 0.25) return '#2563eb'; // blue-600
        if (mult <= 0.5) return '#3b82f6'; // blue-500
        return '#1f2937'; // gray-800
    }
}

const typeWheelPage = new TypeWheelPage();
document.addEventListener('DOMContentLoaded', () => typeWheelPage.init());
