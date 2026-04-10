import { typeChart, typeColors, typeIcons, fetchTypeData } from './typeChart.js';
import api from './api.js';
import auth from './auth.js';

class TypeWheelPage {
    constructor() {
        this.selectedTypes = [];
        this.currentMode = 'advantages'; // 'advantages', 'weaknesses', 'resistances'
        this.types = Object.keys(typeChart);
        this.isDualType = false;
        
        // Globais locais para cores e ícones (inicialmente do hardcode, atualizadas via API)
        this.colors = { ...typeColors };
        this.icons = { ...typeIcons };
    }

    async init() {
        auth.checkAuthOnLoad();
        
        // 1. Iniciar carregamento de dados (Sem espera artificial para máxima eficiência)
        const dynamicData = await fetchTypeData();
        
        this.colors = dynamicData.colors;
        this.icons = dynamicData.icons;

        this.updateUserDisplay();
        this.setupEventListeners();
        this.renderWheel();
        
        // Initial UI state
        this.updateWheelUI();
        this.updateRelations();
        
        // 2. Finalizar carregamento IMEDIATAMENTE após a renderização
        const loader = document.getElementById('page-loader');
        const content = document.getElementById('main-content');
        
        if (loader) {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none'; // Libera cliques instantaneamente
            setTimeout(() => loader.remove(), 300);
        }
        
        if (content) {
            content.classList.remove('opacity-0');
            content.classList.add('opacity-100');
        }

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
            btn.style.backgroundColor = `${this.colors[type]}15`; // Muito suave
            btn.style.borderColor = `${this.colors[type]}33`;
            btn.dataset.type = type;
            btn.title = type.charAt(0).toUpperCase() + type.slice(1);

            btn.innerHTML = `
                <img src="${this.icons[type]}" alt="${type}" class="w-6 h-6 sm:w-7 sm:h-7 object-contain transition-transform group-hover:rotate-12" />
                
                <!-- Selection Number Badge -->
                <div class="selection-badge absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-coral text-[10px] font-black flex items-center justify-center shadow-lg border border-coral/20 opacity-0 scale-0 transition-all duration-300 z-50"></div>

                <!-- Label HUD -->
                <div class="type-label absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div class="bg-white border border-black/10 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" style="background-color: ${this.colors[type]}"></div>
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
            if (this.selectedTypes.length >= 2) {
                // Remove oldest (index 0)
                this.selectedTypes.shift();
            }
            this.selectedTypes.push(type);
        }

        this.updateWheelUI();
        this.updateRelations();
        
        // Ensure icons are created after dynamic update
        if (window.lucide) lucide.createIcons();
    }

    updateWheelUI() {
        const hasSelection = this.selectedTypes.length > 0;
        const nodes = document.querySelectorAll('.type-node');
        
        nodes.forEach(node => {
            const type = node.dataset.type;
            const selectionIndex = this.selectedTypes.indexOf(type);
            const isSelected = selectionIndex > -1;
            const badge = node.querySelector('.selection-badge');
            const label = node.querySelector('.type-label');
            const icon = node.querySelector('img');
            
            if (isSelected) {
                // Node Highlight - More prominent
                node.classList.add('scale-125', 'z-30', 'shadow-2xl');
                node.style.backgroundColor = this.colors[type];
                node.style.borderColor = 'white';
                node.style.borderWidth = '4px';
                node.style.boxShadow = `0 0 20px ${this.colors[type]}66`;
                node.classList.remove('opacity-40');
                node.classList.add('opacity-100');

                // Badge (Selection Order)
                if (badge) {
                    badge.textContent = selectionIndex + 1;
                    badge.style.opacity = '1';
                    badge.style.transform = 'scale(1)';
                }

                // Persistent Label
                if (label) {
                    label.style.opacity = '1';
                    label.style.bottom = '-3.5rem';
                }
            } else {
                // Node Reset
                node.classList.remove('scale-125', 'z-30', 'shadow-2xl');
                node.style.backgroundColor = `${this.colors[type]}15`;
                node.style.borderColor = `${this.colors[type]}33`;
                node.style.borderWidth = '2px';
                node.style.boxShadow = 'none';
                
                // Dim non-selected only if there is a selection
                if (hasSelection) {
                    node.classList.add('opacity-40');
                    node.classList.remove('opacity-100');
                } else {
                    node.classList.add('opacity-100');
                    node.classList.remove('opacity-40');
                }

                // Badge Reset
                if (badge) {
                    badge.style.opacity = '0';
                    badge.style.transform = 'scale(0)';
                }

                // Persistent Label Reset
                if (label) {
                    label.style.opacity = '0';
                    label.style.bottom = '-2.5rem';
                }
            }
        });

        // Hub update
        this.updateHubDisplay();
    }

    updateHubDisplay() {
        const hub = document.getElementById('central-hub');
        const hubContent = document.getElementById('hub-content');
        const hubIcons = document.getElementById('hub-selected-icons');
        
        if (!hub || !hubContent || !hubIcons) return;

        const span = hubContent.querySelector('span');

        if (this.selectedTypes.length === 0) {
            hub.style.background = 'white';
            hub.style.borderColor = '#f3f4f6';
            if (span) {
                span.textContent = 'Seleção';
                span.className = 'text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-2 block';
            }
            hubIcons.innerHTML = `
                <div class="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center animate-pulse">
                    <i data-lucide="plus" class="w-4 h-4 text-gray-300"></i>
                </div>
            `;
        } else {
            const type1 = this.selectedTypes[0];
            const type2 = this.selectedTypes[1];
            
            if (span) {
                span.textContent = this.selectedTypes.length === 1 ? 'Tipo Único' : 'Tipo Duplo';
                span.className = 'text-[10px] sm:text-xs text-white/90 font-black uppercase tracking-[0.2em] mb-2 block drop-shadow-sm';
            }
            hub.style.borderColor = 'rgba(255,255,255,0.4)';

            if (this.selectedTypes.length === 1) {
                hub.style.background = this.colors[type1];
                hubIcons.innerHTML = `
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 border-white/40 shadow-2xl animate-spring-in bg-white/10 backdrop-blur-sm">
                        <img src="${this.icons[type1]}" alt="${type1}" class="w-10 h-10 object-contain" />
                    </div>
                `;
            } else {
                // 50/50 Diagonal Split
                hub.style.background = `linear-gradient(135deg, ${this.colors[type1]} 50%, ${this.colors[type2]} 50%)`;
                hubIcons.innerHTML = `
                    <div class="relative w-24 h-20 sm:w-32 sm:h-24 flex items-center justify-center animate-spring-in">
                        <div class="absolute left-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white/40 shadow-xl bg-white/10 backdrop-blur-sm z-10" style="background-color: ${this.colors[type1]}">
                            <img src="${this.icons[type1]}" alt="${type1}" class="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        </div>
                        <div class="absolute right-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white/40 shadow-xl bg-white/10 backdrop-blur-sm z-10" style="background-color: ${this.colors[type2]}">
                            <img src="${this.icons[type2]}" alt="${type2}" class="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
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
        if (modeTitle) {
            if (this.currentMode === 'advantages') {
                modeTitle.innerHTML = `<i data-lucide="zap" class="w-5 h-5 text-emerald-500"></i> Eficácia de Ataque`;
            } else if (this.currentMode === 'weaknesses') {
                modeTitle.innerHTML = `<i data-lucide="shield-alert" class="w-5 h-5 text-rose-500"></i> Vulnerabilidades`;
            } else {
                modeTitle.innerHTML = `<i data-lucide="shield-check" class="w-5 h-5 text-blue-500"></i> Resistências e Imunidades`;
            }
        }
        if (window.lucide) lucide.createIcons();
    }

    calculateMultipliers() {
        if (this.selectedTypes.length === 0) return null;

        const multipliers = {};
        this.types.forEach(t => multipliers[t] = 1);

        if (this.currentMode === 'advantages') {
            // Attack: Best multiplier against each target type
            this.types.forEach(defType => {
                let maxMult = 1;
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
            // Defense (Weaknesses and Resistances): Product of multipliers
            this.selectedTypes.forEach(defType => {
                const relations = typeChart[defType];
                relations.double_damage_from.forEach(atkType => multipliers[atkType] *= 2);
                relations.half_damage_from.forEach(atkType => multipliers[atkType] *= 0.5);
                relations.no_damage_from.forEach(atkType => multipliers[atkType] *= 0);
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
            // Attack: Show x2 (and theoretically x4 if we considered dual targets, but here we show what we hit hard)
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1);
        } else if (this.currentMode === 'weaknesses') {
            // Defense: Show x2 and x4
            filtered = Object.entries(multipliers).filter(([_, m]) => m > 1);
        } else {
            // Defense: Show x0.5, x0.25 and x0
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

        // Sort by multiplier (descending for advantages/weaknesses, ascending for resistances)
        if (this.currentMode === 'resistances') {
            filtered.sort((a, b) => a[1] - b[1]);
        } else {
            filtered.sort((a, b) => b[1] - a[1]);
        }

        list.innerHTML = filtered.map(([type, mult]) => `
            <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-black/5 group hover:border-coral/20 transition-all duration-300 animate-fade-in hover:shadow-lg hover:shadow-black/5">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform" style="background-color: ${this.colors[type]}">
                        <img src="${this.icons[type]}" alt="${type}" class="w-7 h-7 object-contain" />
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
        if (mult >= 4) return 'Vulnerabilidade Extrema';
        if (mult >= 2) return this.currentMode === 'advantages' ? 'Super Efetivo' : 'Fraqueza';
        if (mult === 0.5) return 'Resistente';
        if (mult === 0.25) return 'Dupla Resistência';
        if (mult === 0) return 'Imunidade Total';
        return 'Neutro';
    }

    getMultColor(mult) {
        if (this.currentMode === 'advantages') {
            if (mult >= 2) return 'text-emerald-500';
            return 'text-gray-400';
        }
        
        if (mult >= 4) return 'text-rose-600';
        if (mult >= 2) return 'text-rose-500';
        if (mult === 0) return 'text-blue-600';
        if (mult <= 0.25) return 'text-blue-500';
        if (mult <= 0.5) return 'text-blue-400';
        return 'text-gray-800';
    }

    getMultColorHex(mult) {
        if (this.currentMode === 'advantages') {
            if (mult >= 2) return '#10b981'; // emerald-500 (Green)
            return '#9ca3af'; // gray-400
        }

        if (mult >= 4) return '#e11d48'; // rose-600 (Red)
        if (mult >= 2) return '#f43f5e'; // rose-500 (Red)
        if (mult === 0) return '#2563eb'; // blue-600 (Blue for immunity)
        if (mult <= 0.25) return '#3b82f6'; // blue-500
        if (mult <= 0.5) return '#60a5fa'; // blue-400
        return '#1f2937'; // gray-800
    }
}

const typeWheelPage = new TypeWheelPage();
document.addEventListener('DOMContentLoaded', () => typeWheelPage.init());
