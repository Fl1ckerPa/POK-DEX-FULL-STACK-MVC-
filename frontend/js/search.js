import api from './api.js';
import ui from './ui.js';
import auth from './auth.js';

const search = {
    selectedTypes: new Set(),
    selectedRegions: new Set(),
    currentLimit: 20,
    currentPage: 1,

    async init() {
        ui.init();
        auth.checkAuthOnLoad();
        this.cacheDOM();
        this.bindEvents();
        this.updateUserDisplay();
        if (window.lucide) lucide.createIcons();
    },

    cacheDOM() {
        this.searchBtn = document.getElementById('search-btn');
        this.typeBtns = document.querySelectorAll('.type-pill-btn');
        this.regionBtns = document.querySelectorAll('.region-pill-btn');
        this.limitBtns = document.querySelectorAll('.limit-btn');
        this.searchInput = document.getElementById('search-input');
        this.userProfileHeader = document.querySelector('.user-profile-header');
        this.loginBtnSidebar = document.getElementById('login-btn-sidebar');
        this.logoutBtnSidebar = document.getElementById('logout-btn-sidebar');
    },

    bindEvents() {
        // Handle Limit Selection
        this.limitBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.limitBtns.forEach(b => {
                    b.classList.remove('bg-white', 'text-coral', 'shadow-sm', 'active');
                    b.classList.add('text-slate-500', 'hover:bg-white/50');
                });
                btn.classList.remove('text-slate-500', 'hover:bg-white/50');
                btn.classList.add('bg-white', 'text-coral', 'shadow-sm', 'active');
                this.currentLimit = parseInt(btn.dataset.limit);
            });
        });

        // Handle Type Pills (Multiple Selection)
        this.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (this.selectedTypes.has(type)) {
                    this.selectedTypes.delete(type);
                    btn.classList.remove('active', 'ring-4', 'ring-coral/20', 'scale-105');
                    btn.classList.add('border-transparent');
                } else {
                    this.selectedTypes.add(type);
                    btn.classList.add('active', 'ring-4', 'ring-coral/20', 'scale-105');
                    btn.classList.remove('border-transparent');
                }
            });
        });

        // Handle Region Pills (Multiple Selection)
        this.regionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const region = btn.dataset.region;
                
                if (region === "") { // Botão "All"
                    this.selectedRegions.clear();
                    this.regionBtns.forEach(b => {
                        b.classList.remove('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                        b.classList.add('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');
                    });
                    btn.classList.remove('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');
                    btn.classList.add('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                } else {
                    const allBtn = Array.from(this.regionBtns).find(b => b.dataset.region === "");
                    allBtn.classList.remove('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                    allBtn.classList.add('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');

                    if (this.selectedRegions.has(region)) {
                        this.selectedRegions.delete(region);
                        btn.classList.remove('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                        btn.classList.add('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');
                        
                        if (this.selectedRegions.size === 0) {
                            allBtn.classList.add('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                            allBtn.classList.remove('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');
                        }
                    } else {
                        this.selectedRegions.add(region);
                        btn.classList.add('bg-coral', 'text-white', 'shadow-lg', 'shadow-coral/30', 'active');
                        btn.classList.remove('bg-slate-100', 'text-slate-500', 'hover:bg-slate-200');
                    }
                }
            });
        });

        this.searchBtn.addEventListener('click', () => this.performSearch(1));

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBtn.click();
        });

        if (this.logoutBtnSidebar) {
            this.logoutBtnSidebar.addEventListener('click', () => {
                auth.logout();
            });
        }
    },

    async performSearch(page = 1) {
        this.currentPage = page;
        ui.showLoading();
        
        let endpoint = `/pokemon?page=${this.currentPage}&limit=${this.currentLimit}`;
        
        const searchQuery = this.searchInput.value.trim();
        if (searchQuery) {
            endpoint += `&search=${encodeURIComponent(searchQuery)}`;
        }

        if (this.selectedRegions.size > 0) {
            const regionsArray = Array.from(this.selectedRegions).map(r => {
                const [start, end] = r.split('-');
                return { start: parseInt(start), end: parseInt(end) };
            });
            endpoint += `&regions=${JSON.stringify(regionsArray)}`;
        }

        if (this.selectedTypes.size > 0) {
            const typesArray = Array.from(this.selectedTypes);
            endpoint += `&types=${JSON.stringify(typesArray)}`;
        }

        try {
            const res = await api.get(endpoint);
            if (res.success) {
                ui.renderPokemonGrid(res.data);
                
                ui.renderPagination(this.currentPage, res.totalPages, (newPage) => {
                    this.performSearch(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                const countHeader = document.querySelector('header h1');
                if (countHeader) {
                    countHeader.innerHTML = `Busca Avançada <span class="ml-2 px-3 py-1 bg-coral/10 text-coral text-xs rounded-full">${res.total} encontrados</span>`;
                }
            }
        } catch (err) {
            ui.showError(err.message);
        }
    },

    updateUserDisplay() {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            const userEmail = document.getElementById('user-email');
            const userName = document.getElementById('user-name');
            if (userEmail) userEmail.innerText = user.email;
            if (userName) userName.innerText = user.username;
            
            if (this.userProfileHeader) this.userProfileHeader.classList.remove('hidden');
            if (this.loginBtnSidebar) this.loginBtnSidebar.classList.add('hidden');
            if (this.logoutBtnSidebar) this.logoutBtnSidebar.classList.remove('hidden');
        } else {
            if (this.userProfileHeader) this.userProfileHeader.classList.add('hidden');
            if (this.loginBtnSidebar) this.loginBtnSidebar.classList.remove('hidden');
            if (this.logoutBtnSidebar) this.logoutBtnSidebar.classList.add('hidden');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => search.init());
