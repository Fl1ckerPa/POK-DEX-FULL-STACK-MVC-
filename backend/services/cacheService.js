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
                console.log(`✅ Pokémon ID ${id} encontrado no cache.`);
                return this._formatCachedToApiResponse(cachedPokemon);
            }

            // 2. Caso não exista no cache, consultar PokéAPI
            console.log(`🔍 Pokémon ID ${id} não encontrado no cache. Consultando PokéAPI...`);
            const pokemonData = await PokeApiService.getById(id);

            // 3. Salvar no cache para futuras consultas
            await Pokemon.create(pokemonData);
            console.log(`💾 Pokémon ID ${id} salvo no cache.`);

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
                console.log(`✅ Pokémon '${lowerName}' encontrado no cache.`);
                return this._formatCachedToApiResponse(cachedPokemon);
            }

            // 2. Caso não exista no cache, consultar PokéAPI
            console.log(`🔍 Pokémon '${lowerName}' não encontrado no cache. Consultando PokéAPI...`);
            const pokemonData = await PokeApiService.getByName(lowerName);

            // 3. Verificar se já existe por ID (evitar conflito de Unique Key se buscado por ID antes)
            const alreadyCached = await Pokemon.findByPokemonId(pokemonData.id);
            if (!alreadyCached) {
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
            type: cached.type,
            image_url: cached.image_url,
            stats: {
                hp: cached.stats_hp,
                attack: cached.stats_attack,
                defense: cached.stats_defense,
                sp_attack: cached.stats_sp_attack,
                sp_defense: cached.stats_sp_defense,
                speed: cached.stats_speed
            },
            abilities: typeof cached.abilities === 'string' ? JSON.parse(cached.abilities) : cached.abilities
        };
    }
}

module.exports = CacheService;
