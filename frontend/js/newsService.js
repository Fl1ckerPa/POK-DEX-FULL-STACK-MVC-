const CACHE_KEY = "pokemon_news_cache";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const RSS_FEEDS = [
  "https://pokemonblog.com/feed/",
  "https://www.pokemon.com/us/pokemon-news/rss"
];
const RSS2JSON_API = "https://api.rss2json.com/v1/api.json";
const BASE_URL = "https://pokeapi.co/api/v2";
const ARTWORK_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

/**
 * Serviço para gerenciamento de notícias Pokémon.
 */
const newsService = {
    // Verificar cache no localStorage
    getCachedNews() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > CACHE_TTL) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return entry.data;
        } catch { return null; }
    },

    setCachedNews(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {} // localStorage cheio — ignora
    },

    // Buscar RSS via proxy
    async fetchFromRss(feedUrl) {
        try {
            const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(feedUrl)}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            if (data.status !== "ok" || !data.items) return [];
            return data.items.map((item, idx) => ({
                id: `rss-${btoa(item.link || item.title).slice(0, 16)}-${idx}`,
                title: item.title || "Pokémon News",
                description: this.stripHtml(item.description || "").slice(0, 200),
                content: item.content || item.description || "",
                imageUrl: item.thumbnail || item.enclosure?.link || this.extractImage(item.content || "", idx),
                source: data.feed?.title || new URL(feedUrl).hostname,
                url: item.link || feedUrl,
                publishedAt: item.pubDate || new Date().toISOString(),
            }));
        } catch (err) {
            console.error(`Erro ao buscar RSS de ${feedUrl}:`, err);
            return [];
        }
    },

    // Fallback — gera "notícias" via PokéAPI
    async fetchFallbackNews() {
        const ids = Array.from({ length: 6 }, (_, i) => ((Date.now() + i * 137) % 898) + 1);
        const results = await Promise.allSettled(ids.map(async (id) => {
            const [pokRes, specRes] = await Promise.all([
                fetch(`${BASE_URL}/pokemon/${id}`),
                fetch(`${BASE_URL}/pokemon-species/${id}`),
            ]);
            const [pok, spec] = await Promise.all([pokRes.json(), specRes.json()]);
            const flavor = spec.flavor_text_entries?.find(e => e.language.name === "en");
            return {
                id: `fallback-${id}`,
                title: `Descubra ${this.capitalize(pok.name)}!`,
                description: flavor?.flavor_text?.replace(/[\n\f\r]/g, " ") || "Um Pokémon incrível.",
                imageUrl: `${ARTWORK_URL}/${id}.png`,
                source: "PokéAPI",
                url: `/pokemon/${id}`,
                publishedAt: new Date().toISOString(),
            };
        }));
        return results.filter(r => r.status === "fulfilled").map(r => r.value);
    },

    // Função principal — cache → RSS → fallback
    async fetchPokemonNews(limit = 10) {
        const cached = this.getCachedNews();
        if (cached?.length > 0) return cached.slice(0, limit);
        
        try {
            const feedResults = await Promise.allSettled(RSS_FEEDS.map(url => this.fetchFromRss(url)));
            const allNews = feedResults.filter(r => r.status === "fulfilled").flatMap(r => r.value);
            const unique = this.deduplicateByUrl(allNews).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, limit);
            
            if (unique.length > 0) { 
                this.setCachedNews(unique); 
                return unique; 
            }
        } catch (err) {
            console.error("Erro ao buscar notícias RSS, usando fallback:", err);
        }
        
        const fallback = await this.fetchFallbackNews();
        if (fallback.length > 0) this.setCachedNews(fallback);
        return fallback.slice(0, limit);
    },

    stripHtml(html) { 
        return html?.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim() || ""; 
    },

    deduplicateByUrl(items) { 
        const seen = new Set(); 
        return items.filter(item => { 
            if (seen.has(item.url)) return false; 
            seen.add(item.url); 
            return true; 
        }); 
    },

    extractImage(content, idx) {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        return imgMatch ? imgMatch[1] : `${ARTWORK_URL}/${(idx % 151) + 1}.png`;
    },

    capitalize(str) { 
        return str.charAt(0).toUpperCase() + str.slice(1); 
    },

    timeAgo(dateStr) { 
        const diff = Date.now() - new Date(dateStr).getTime(); 
        const mins = Math.floor(diff / 60000); 
        if (mins < 60) return `${mins}m atrás`; 
        const hours = Math.floor(mins / 60); 
        if (hours < 24) return `${hours}h atrás`; 
        return `${Math.floor(hours / 24)}d atrás`; 
    }
};

export default newsService;
