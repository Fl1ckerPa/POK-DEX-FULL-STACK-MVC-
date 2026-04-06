const Pokemon = require('../models/Pokemon');
const PokeApiService = require('./pokeApiService');

/**
 * Serviço responsável por gerenciar o cache de Pokémon no banco de dados.
 */
class CacheService {
    /**
     * Busca um Pokémon pelo ID, verificando o cache primeiro e consultando a PokéAPI se necessário.
     * @param {number|string} id - O ID do Pokémon na PokéAPI.
     * @returns {Promise<Object>} O Pokémon encontrado (do cache ou da API).
     * @throws {Error} Se o Pokémon não for encontrado.
     */
    static async getPokemonById(id) {
        try {
            // 1. Consultar Pokémon no banco de dados (cache)
            const cachedPokemon = await Pokemon.findByPokemonId(id);

            if (cachedPokemon) {
                // Verificar política de atualização (7 dias)
                if (!this._isCacheExpired(cachedPokemon.updated_at)) {
                    console.log(`✅ Pokémon ID ${id} encontrado no cache.`);
                    return this._formatCachedToApiResponse(cachedPokemon);
                }
                console.log(`🔄 Cache expirado para Pokémon ID ${id}. Atualizando...`);
            }

            // 2. Caso não exista no cache ou esteja expirado, consultar PokéAPI
            console.log(`🔍 Buscando Pokémon ID ${id} na PokéAPI...`);
            const pokemonData = await PokeApiService.getById(id);

            // 3. Salvar ou atualizar no cache
            if (cachedPokemon) {
                await Pokemon.update(pokemonData);
                console.log(`💾 Pokémon ID ${id} atualizado no cache.`);
            } else {
                await Pokemon.create(pokemonData);
                console.log(`💾 Pokémon ID ${id} salvo no cache.`);
            }

            return pokemonData;
        } catch (error) {
            console.error(`Erro em CacheService.getPokemonById(${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Busca um Pokémon pelo nome, verificando o cache primeiro e consultando a PokéAPI se necessário.
     * @param {string} name - O nome do Pokémon.
     * @returns {Promise<Object>} O Pokémon encontrado (do cache ou da API).
     * @throws {Error} Se o Pokémon não for encontrado.
     */
    static async getPokemonByName(name) {
        try {
            const lowerName = name.toLowerCase().trim();

            // 1. Consultar Pokémon no banco de dados (cache)
            const cachedPokemon = await Pokemon.findByName(lowerName);

            if (cachedPokemon) {
                // Verificar política de atualização (7 dias)
                if (!this._isCacheExpired(cachedPokemon.updated_at)) {
                    console.log(`✅ Pokémon '${lowerName}' encontrado no cache.`);
                    return this._formatCachedToApiResponse(cachedPokemon);
                }
                console.log(`🔄 Cache expirado para Pokémon '${lowerName}'. Atualizando...`);
            }

            // 2. Caso não exista no cache ou esteja expirado, consultar PokéAPI
            console.log(`🔍 Buscando Pokémon '${lowerName}' na PokéAPI...`);
            const pokemonData = await PokeApiService.getByName(lowerName);

            // 3. Salvar ou atualizar no cache
            const alreadyCached = cachedPokemon || await Pokemon.findByPokemonId(pokemonData.id);
            
            if (alreadyCached) {
                await Pokemon.update(pokemonData);
                console.log(`💾 Pokémon '${lowerName}' (ID ${pokemonData.id}) atualizado no cache.`);
            } else {
                await Pokemon.create(pokemonData);
                console.log(`💾 Pokémon '${lowerName}' (ID ${pokemonData.id}) salvo no cache.`);
            }

            return pokemonData;
        } catch (error) {
            console.error(`Erro em CacheService.getPokemonByName('${name}'):`, error.message);
            throw error;
        }
    }

    /**
     * Verifica se o cache expirou (mais de 7 dias).
     * @param {Date|string} updatedAt - Data da última atualização.
     * @returns {boolean}
     * @private
     */
    static _isCacheExpired(updatedAt) {
        if (!updatedAt) return true;
        
        const lastUpdate = new Date(updatedAt);
        const now = new Date();
        const diffInDays = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        
        return diffInDays > 7;
    }

    /**
     * Formata os dados vindos do banco para o formato esperado pela API.
     * @param {Object} cached - Dados do Pokémon vindos do banco.
     * @returns {Object} Dados formatados.
     * @private
     */
    static _formatCachedToApiResponse(cached) {
        return {
            id: cached.pokemon_id,
            name: cached.name,
            height: cached.height,
            weight: cached.weight,
            base_experience: cached.base_experience,
            flavor_text: cached.flavor_text || '',
            varieties: typeof cached.varieties_json === 'string' ? JSON.parse(cached.varieties_json) : (cached.varieties_json || []),
            sprites: {
                front_default: cached.front_default_url,
                back_default: cached.back_default_url,
                official_artwork: cached.image_url
            },
            types: cached.types_json ? (typeof cached.types_json === 'string' ? JSON.parse(cached.types_json) : cached.types_json) : [cached.type],
            abilities: typeof cached.abilities === 'string' ? JSON.parse(cached.abilities) : cached.abilities,
            stats: [
                { name: 'hp', value: cached.stats_hp },
                { name: 'attack', value: cached.stats_attack },
                { name: 'defense', value: cached.stats_defense },
                { name: 'special-attack', value: cached.stats_sp_attack },
                { name: 'special-defense', value: cached.stats_sp_defense },
                { name: 'speed', value: cached.stats_speed }
            ]
        };
    }
}

module.exports = CacheService;
