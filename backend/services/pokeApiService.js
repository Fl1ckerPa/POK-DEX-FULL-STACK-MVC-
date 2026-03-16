const { POKEAPI_BASE_URL } = require('../config/constants');

/**
 * Serviço responsável por consumir dados da PokéAPI.
 */
class PokeApiService {
    /**
     * Obtém um Pokémon pelo ID.
     * @param {number|string} id - O ID do Pokémon.
     * @returns {Promise<Object>} Os dados do Pokémon formatados.
     * @throws {Error} Se o Pokémon não for encontrado ou houver erro na API.
     */
    static async getById(id) {
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Pokémon com ID ${id} não encontrado.`);
                }
                throw new Error(`Erro ao buscar Pokémon por ID: ${response.statusText}`);
            }

            const data = await response.json();
            return this._formatPokemonData(data);
        } catch (error) {
            console.error(`Erro em PokeApiService.getById(${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Obtém um Pokémon pelo nome.
     * @param {string} name - O nome do Pokémon.
     * @returns {Promise<Object>} Os dados do Pokémon formatados.
     * @throws {Error} Se o Pokémon não for encontrado ou houver erro na API.
     */
    static async getByName(name) {
        try {
            const lowerName = name.toLowerCase().trim();
            const response = await fetch(`${POKEAPI_BASE_URL}/${lowerName}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Pokémon com nome '${name}' não encontrado.`);
                }
                throw new Error(`Erro ao buscar Pokémon por nome: ${response.statusText}`);
            }

            const data = await response.json();
            return this._formatPokemonData(data);
        } catch (error) {
            console.error(`Erro em PokeApiService.getByName('${name}'):`, error.message);
            throw error;
        }
    }

    /**
     * Formata os dados brutos da PokéAPI para o padrão do sistema.
     * @param {Object} data - Dados brutos da API.
     * @returns {Object} Dados padronizados (id, name, types, height, weight, stats, abilities, sprites).
     * @private
     */
    static _formatPokemonData(data) {
        return {
            id: data.id,
            name: data.name,
            height: data.height,
            weight: data.weight,
            base_experience: data.base_experience,
            sprites: {
                front_default: data.sprites.front_default,
                back_default: data.sprites.back_default,
                official_artwork: data.sprites.other?.['official-artwork']?.front_default || null
            },
            types: data.types.map(t => t.type.name),
            abilities: data.abilities.map(a => a.ability.name),
            stats: data.stats.map(s => ({
                name: s.stat.name,
                value: s.base_stat
            }))
        };
    }
}

module.exports = PokeApiService;
