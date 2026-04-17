const { POKEAPI_BASE_URL } = require('../config/constants');

/**
 * Serviço responsável por consumir dados da PokéAPI.
 */
class PokeApiService {
    /**
     * Obtém um Pokémon pelo ID, incluindo dados da espécie.
     * @param {number|string} id - O ID do Pokémon.
     * @returns {Promise<Object>} Os dados do Pokémon formatados.
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
            
            // Buscar dados da espécie para flavor text e variedades
            let speciesData = null;
            try {
                // Se for um ID de forma especial (> 10000), precisamos do ID da espécie base
                const speciesUrl = data.species.url;
                const speciesResponse = await fetch(speciesUrl);
                if (speciesResponse.ok) {
                    speciesData = await speciesResponse.json();
                }
            } catch (err) {
                console.warn(`Aviso: Não foi possível buscar espécie para Pokémon ${id}`);
            }

            return this._formatPokemonData(data, speciesData);
        } catch (error) {
            console.error(`Erro em PokeApiService.getById(${id}):`, error.message);
            throw error;
        }
    }

    /**
     * Obtém um Pokémon pelo nome, incluindo dados da espécie.
     * @param {string} name - O nome do Pokémon.
     * @returns {Promise<Object>} Os dados do Pokémon formatados.
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

            // Buscar dados da espécie
            let speciesData = null;
            try {
                const speciesUrl = data.species.url;
                const speciesResponse = await fetch(speciesUrl);
                if (speciesResponse.ok) {
                    speciesData = await speciesResponse.json();
                }
            } catch (err) {
                console.warn(`Aviso: Não foi possível buscar espécie para Pokémon ${name}`);
            }

            return this._formatPokemonData(data, speciesData);
        } catch (error) {
            console.error(`Erro em PokeApiService.getByName('${name}'):`, error.message);
            throw error;
        }
    }

    /**
     * Formata os dados brutos da PokéAPI para o padrão do sistema.
     * @param {Object} data - Dados brutos do Pokémon.
     * @param {Object} speciesData - Dados brutos da espécie (opcional).
     * @returns {Object} Dados padronizados.
     * @private
     */
    static _formatPokemonData(data, speciesData = null) {
        const flavorTextEntry = speciesData?.flavor_text_entries?.find(e => e.language.name === 'en');
        const flavorText = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f]/g, ' ') : '';
        
        const varieties = speciesData?.varieties?.map(v => ({
            name: v.pokemon.name,
            is_default: v.is_default,
            id: parseInt(v.pokemon.url.split('/').filter(Boolean).pop())
        })) || [];

        return {
            id: data.id,
            name: data.name,
            height: data.height,
            weight: data.weight,
            base_experience: data.base_experience,
            flavor_text: flavorText,
            varieties: varieties,
            sprites: {
                front_default: data.sprites.front_default,
                back_default: data.sprites.back_default,
                front_shiny: data.sprites.front_shiny,
                back_shiny: data.sprites.back_shiny,
                official_artwork: data.sprites.other?.['official-artwork']?.front_default || null,
                official_artwork_shiny: data.sprites.other?.['official-artwork']?.front_shiny || data.sprites.other?.home?.front_shiny || null
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
