const db = require('../config/database');

/**
 * Modelo para manipulação de Pokémon no banco de dados (cache).
 */
class Pokemon {
    /**
     * Busca um Pokémon pelo seu ID da PokéAPI.
     * @param {number} pokemonId - O ID do Pokémon na PokéAPI.
     * @returns {Promise<Object|null>} O Pokémon encontrado ou null.
     */
    static async findByPokemonId(pokemonId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM pokemons WHERE pokemon_id = ?',
                [pokemonId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error(`Erro ao buscar Pokémon por ID no banco:`, error.message);
            throw error;
        }
    }

    /**
     * Busca um Pokémon pelo seu nome no cache.
     * @param {string} name - O nome do Pokémon.
     * @returns {Promise<Object|null>} O Pokémon encontrado ou null.
     */
    static async findByName(name) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM pokemons WHERE name = ?',
                [name.toLowerCase().trim()]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error(`Erro ao buscar Pokémon por nome no banco:`, error.message);
            throw error;
        }
    }

    /**
     * Salva um Pokémon no cache (banco de dados).
     * @param {Object} pokemonData - Dados formatados do Pokémon.
     * @returns {Promise<number>} O ID do registro inserido.
     */
    static async create(pokemonData) {
        try {
            const {
                id, name, types, height, weight, sprites, stats, abilities
            } = pokemonData;

            const hp = stats.find(s => s.name === 'hp')?.value || 0;
            const attack = stats.find(s => s.name === 'attack')?.value || 0;
            const defense = stats.find(s => s.name === 'defense')?.value || 0;
            const sp_attack = stats.find(s => s.name === 'special-attack')?.value || 0;
            const sp_defense = stats.find(s => s.name === 'special-defense')?.value || 0;
            const speed = stats.find(s => s.name === 'speed')?.value || 0;

            const [result] = await db.query(
                `INSERT INTO pokemons (
                    pokemon_id, name, type, height, weight, image_url, 
                    stats_hp, stats_attack, stats_defense, 
                    stats_sp_attack, stats_sp_defense, stats_speed, 
                    abilities
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, name, types[0], height, weight, sprites.official_artwork,
                    hp, attack, defense, sp_attack, sp_defense, speed,
                    JSON.stringify(abilities)
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error(`Erro ao salvar Pokémon no cache:`, error.message);
            throw error;
        }
    }

    /**
     * Atualiza os dados de um Pokémon no cache.
     * @param {Object} pokemonData - Dados atualizados do Pokémon.
     * @returns {Promise<boolean>} Retorna true se atualizado com sucesso.
     */
    static async update(pokemonData) {
        try {
            const {
                id, name, types, height, weight, sprites, stats, abilities
            } = pokemonData;

            const hp = stats.find(s => s.name === 'hp')?.value || 0;
            const attack = stats.find(s => s.name === 'attack')?.value || 0;
            const defense = stats.find(s => s.name === 'defense')?.value || 0;
            const sp_attack = stats.find(s => s.name === 'special-attack')?.value || 0;
            const sp_defense = stats.find(s => s.name === 'special-defense')?.value || 0;
            const speed = stats.find(s => s.name === 'speed')?.value || 0;

            const [result] = await db.query(
                `UPDATE pokemons SET 
                    name = ?, type = ?, height = ?, weight = ?, image_url = ?, 
                    stats_hp = ?, stats_attack = ?, stats_defense = ?, 
                    stats_sp_attack = ?, stats_sp_defense = ?, stats_speed = ?, 
                    abilities = ?, updated_at = CURRENT_TIMESTAMP
                WHERE pokemon_id = ?`,
                [
                    name, types[0], height, weight, sprites.official_artwork,
                    hp, attack, defense, sp_attack, sp_defense, speed,
                    JSON.stringify(abilities), id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error(`Erro ao atualizar Pokémon no cache:`, error.message);
            throw error;
        }
    }
}

module.exports = Pokemon;
