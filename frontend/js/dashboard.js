import newsService from './newsService.js';
import auth from './auth.js';
import ui from './ui.js';

const BASE_URL = "https://pokeapi.co/api/v2";
const ARTWORK_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const tagColors = { 
    Destaque: "bg-yellow-500/20 text-yellow-600", 
    Explorar: "bg-blue-500/20 text-blue-600", 
    Novidade: "bg-green-500/20 text-green-600", 
    Dica:     "bg-purple-500/20 text-purple-600", 
    Batalha:  "bg-red-500/20 text-red-600", 
};

class Dashboard {
    constructor() {
        this.dailyPokemon = null;
        this.highlights = [];
        this.news = [];
    }

    async init() {
        auth.checkAuthOnLoad();
        this.updateUserDisplay();
        this.setupEventListeners();
        this.renderSkeletons();
        await this.loadData();
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => auth.logout());

        // Mobile menu toggle
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

    renderSkeletons() {
        const highlightsGrid = document.getElementById('highlights-grid');
        const newsGrid = document.getElementById('news-grid');

        if (highlightsGrid) {
            highlightsGrid.innerHTML = Array(5).fill(0).map((_, i) => `
                <div class="animate-pulse bg-gray-200 rounded-2xl ${i === 0 ? 'col-span-2 row-span-2 h-[400px]' : 'h-48'}"></div>
            `).join('');
        }

        if (newsGrid) {
            newsGrid.innerHTML = Array(6).fill(0).map(() => `
                <div class="animate-pulse bg-gray-200 rounded-2xl h-64"></div>
            `).join('');
        }
    }

    async loadData() {
        try {
            const [homeData, newsData] = await Promise.all([
                this.fetchHomeData(),
                newsService.fetchPokemonNews(6)
            ]);

            this.dailyPokemon = homeData.daily;
            this.highlights = homeData.newsItems;
            this.news = newsData;

            this.renderHero();
            this.renderHighlights();
            this.renderNews();
            this.renderDailySection();
            
            if (window.lucide) lucide.createIcons();
        } catch (error) {
            console.error("Erro ao carregar dados da Dashboard:", error);
        }
    }

    // Pokémon do Dia — determinístico pela data 
    getDailyPokemonId() { 
        const today = new Date(); 
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(); 
        return (seed % 1010) + 1; 
    } 

    // Gera IDs aleatórios excluindo um específico 
    getRandomIds(count, exclude) { 
        const ids = new Set(); 
        let attempts = 0; 
        while (ids.size < count && attempts < 100) { 
            const id = Math.floor(Math.random() * 1010) + 1; 
            if (id !== exclude) ids.add(id); 
            attempts++; 
        } 
        return Array.from(ids); 
    } 

    async fetchPokemonBasic(id) { 
        const res = await fetch(`${BASE_URL}/pokemon/${id}`); 
        const data = await res.json(); 
        return { 
            id: data.id, 
            name: data.name, 
            image: `${ARTWORK_URL}/${data.id}.png`, 
            types: data.types.map(t => t.type.name), 
        }; 
    } 

    async fetchFlavorText(id) { 
        try { 
            const res = await fetch(`${BASE_URL}/pokemon-species/${id}`); 
            const data = await res.json(); 
            const entry = data.flavor_text_entries?.find(e => e.language.name === "en"); 
            return entry?.flavor_text?.replace(/[\n\f\r]/g, " ") || "A mysterious Pokémon."; 
        } catch { return "A mysterious Pokémon."; } 
    } 

    async fetchHomeData() { 
        const dailyId = this.getDailyPokemonId(); 
        const spotlightIds = this.getRandomIds(4, dailyId); 
        const [daily, dailyFlavor, ...spotlights] = await Promise.all([ 
            this.fetchPokemonBasic(dailyId), 
            this.fetchFlavorText(dailyId), 
            ...spotlightIds.map(id => this.fetchPokemonBasic(id)), 
        ]); 

        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

        return { 
            daily, dailyFlavor, 
            newsItems: [ 
                { id: "daily", title: `Pokémon do Dia: ${capitalize(daily.name)}`, description: dailyFlavor, image: daily.image, tag: "Destaque", pokemonId: daily.id, types: daily.types }, 
                { id: "spotlight-1", title: `Descubra ${capitalize(spotlights[0].name)}`, description: `Um Pokémon do tipo ${spotlights[0].types.join(" / ")} com habilidades surpreendentes.`, image: spotlights[0].image, tag: "Explorar", pokemonId: spotlights[0].id, types: spotlights[0].types }, 
                { id: "spotlight-2", title: `Spotlight: ${capitalize(spotlights[1].name)}`, description: `Conheça mais sobre este Pokémon do tipo ${spotlights[1].types.join(" / ")}.`, image: spotlights[1].image, tag: "Novidade", pokemonId: spotlights[1].id, types: spotlights[1].types }, 
                { id: "tip-types", title: "Dica: Domine as Vantagens de Tipo", description: "Saber as fraquezas e resistências é essencial. Use a Roda de Tipos!", image: `${ARTWORK_URL}/6.png`, tag: "Dica" }, 
                { id: "spotlight-3", title: `Batalha: ${capitalize(spotlights[2].name)} vs ${capitalize(spotlights[3].name)}`, description: "Quem venceria? Compare os stats!", image: spotlights[2].image, tag: "Batalha", pokemonId: spotlights[2].id, types: spotlights[2].types }, 
            ], 
        }; 
    }

    renderHero() {
        const heroContainer = document.getElementById('hero-banner');
        if (!heroContainer || !this.dailyPokemon) return;

        heroContainer.innerHTML = `
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-400/20 via-red-400/5 to-transparent border border-red-400/10 p-8 h-full"> 
                <div class="relative z-10 max-w-2xl"> 
                    <div class="flex items-center gap-2 mb-3"> 
                        <div class="h-10 w-10 rounded-2xl bg-red-400 flex items-center justify-center shadow-lg shadow-red-400/20"> 
                            <i data-lucide="zap" class="h-6 w-6 text-white"></i>
                        </div> 
                        <h1 class="font-quicksand text-3xl font-bold text-gray-800">Pokédex</h1> 
                    </div> 
                    <p class="font-inter text-gray-500 text-base leading-relaxed"> 
                        Sua Pokédex completa e interativa! Explore todos os Pokémon, descubra habilidades, 
                        cadeias evolutivas, movimentos e muito mais. Monte times estratégicos, salve seus 
                        favoritos e domine as vantagens de tipo com a Roda Interativa. 
                    </p> 
                </div> 
                <img src="${this.dailyPokemon.image}" class="absolute right-4 top-1/2 -translate-y-1/2 w-64 h-64 opacity-15 pointer-events-none select-none drop-shadow-2xl" /> 
            </div>
        `;
    }

    renderHighlights() {
        const container = document.getElementById('highlights-grid');
        if (!container) return;

        container.innerHTML = this.highlights.map((item, i) => `
            <div class="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:border-red-400/30 transition-all shadow-sm hover:shadow-xl ${i === 0 ? 'col-span-2 row-span-2' : ''}">
                <div class="relative ${i === 0 ? 'h-56' : 'h-32'} overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                    <img src="${item.image}" class="h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    <span class="absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${tagColors[item.tag]}">
                        ${item.tag}
                    </span>
                </div>
                <div class="p-4">
                    <h3 class="font-quicksand font-bold ${i === 0 ? 'text-lg' : 'text-sm'} text-gray-800 mb-1 group-hover:text-red-400 transition-colors">
                        ${item.title}
                    </h3>
                    <p class="text-xs text-gray-500 line-clamp-2">${item.description}</p>
                </div>
                ${item.pokemonId ? `<button onclick="window.location.href='advanced-search.html?id=${item.pokemonId}'" class="absolute inset-0 z-10 opacity-0"></button>` : ''}
            </div>
        `).join('');
    }

    renderNews() {
        const container = document.getElementById('news-grid');
        if (!container) return;

        container.innerHTML = this.news.map(item => `
            <button onclick="window.open('${item.url}', '_blank')" class="text-left w-full rounded-2xl bg-white border border-gray-200 hover:border-red-400/30 overflow-hidden group transition-all shadow-sm hover:shadow-xl"> 
                <div class="relative h-36 bg-gradient-to-br from-gray-50 to-transparent flex items-center justify-center overflow-hidden"> 
                    <img src="${item.imageUrl}" class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'"/> 
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-400/10 backdrop-blur-sm"> 
                        ${item.source} 
                    </span> 
                </div> 
                <div class="p-4"> 
                    <h3 class="font-quicksand font-bold text-sm text-gray-800 mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">${item.title}</h3> 
                    <p class="text-xs text-gray-500 line-clamp-2 mb-2">${item.description}</p> 
                    <div class="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter"> 
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        <span>${newsService.timeAgo(item.publishedAt)}</span> 
                    </div> 
                </div> 
            </button>
        `).join('');
    }

    renderDailySection() {
        const container = document.getElementById('daily-pokemon-section');
        if (!container || !this.dailyPokemon) return;

        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

        container.innerHTML = `
            <div class="rounded-3xl bg-gradient-to-r from-red-400/10 via-white to-white border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm"> 
                <div class="shrink-0 group cursor-pointer" onclick="window.location.href='advanced-search.html?id=${this.dailyPokemon.id}'"> 
                    <img src="${this.dailyPokemon.image}" class="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" /> 
                </div> 
                <div class="text-center sm:text-left flex-1"> 
                    <div class="flex items-center gap-2 justify-center sm:justify-start mb-1"> 
                        <i data-lucide="sparkles" class="w-4 h-4 text-yellow-400"></i>
                        <span class="text-xs font-bold text-yellow-500 uppercase tracking-wider">Pokémon do Dia</span> 
                    </div> 
                    <h3 class="font-quicksand text-2xl font-bold text-gray-800 capitalize">${this.dailyPokemon.name}</h3> 
                    <div class="flex gap-1 mt-1 justify-center sm:justify-start"> 
                        ${this.dailyPokemon.types.map(t => `
                            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-white shadow-sm" style="background-color: var(--type-${t}, #ccc)">${t}</span>
                        `).join('')}
                    </div> 
                    <p class="text-sm text-gray-500 mt-2 max-w-md line-clamp-2 italic">"${this.highlights[0].description}"</p> 
                    <a href="advanced-search.html?id=${this.dailyPokemon.id}" class="inline-block mt-3 px-6 py-2.5 rounded-xl bg-red-400 text-white font-quicksand font-bold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-400/20"> 
                        Ver Detalhes 
                    </a> 
                </div> 
            </div>
        `;
    }
}

const dashboard = new Dashboard();
document.addEventListener('DOMContentLoaded', () => dashboard.init());
