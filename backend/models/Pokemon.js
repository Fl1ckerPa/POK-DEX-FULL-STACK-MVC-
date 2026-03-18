const db = require('../config/database');

/**
 * Modelo para manipulação de Pokémon no banco de dados (cache).
 */
class Pokemon {
    /**
     * Busca todos os Pokémon com paginação e busca opcional.
     * @param {number} page - Número da página.
     * @param {number} limit - Limite de resultados por página.
     * @param {string} search - Termo de busca (nome ou ID).
     * @returns {Promise<Object>} Um objeto contendo a lista de Pokémon e o total.
     */
    static async findAll(page = 1, limit = 20, search = '') {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM pokemons';
            let countQuery = 'SELECT COUNT(*) as total FROM pokemons';
            const params = [];
            const countParams = [];

            if (search) {
                const isIdSearch = !isNaN(search) && search.trim() !== '';
                if (isIdSearch) {
                    query += ' WHERE pokemon_id = ?';
                    countQuery += ' WHERE pokemon_id = ?';
                    params.push(parseInt(search));
                    countParams.push(parseInt(search));
                } else {
                    const searchStr = `%${search}%`;
                    query += ' WHERE name LIKE ?';
                    countQuery += ' WHERE name LIKE ?';
                    params.push(searchStr);
                    countParams.push(searchStr);
                }
            }

            query += ' ORDER BY pokemon_id ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [rows] = await db.query(query, params);
            const [countResult] = await db.query(countQuery, countParams);

            // Helper to safely parse JSON or return original if already object
            const safeParse = (data) => {
                if (!data) return null;
                if (typeof data === 'object') return data;
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.error('JSON Parse error:', e.message, data);
                    return null;
                }
            };

            // Parse JSON fields
            const formattedRows = rows.map(row => ({
                ...row,
                id: row.pokemon_id,
                types: safeParse(row.types_json) || [row.type],
                abilities: safeParse(row.abilities) || []
            }));

            return {
                data: formattedRows,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error(`Erro ao buscar lista de Pokémon no banco:`, error.message);
            throw error;
        }
    }

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
                id, name, types, height, weight, base_experience, sprites, stats, abilities
            } = pokemonData;

            const hp = stats.find(s => s.name === 'hp')?.value || 0;
            const attack = stats.find(s => s.name === 'attack')?.value || 0;
            const defense = stats.find(s => s.name === 'defense')?.value || 0;
            const sp_attack = stats.find(s => s.name === 'special-attack')?.value || 0;
            const sp_defense = stats.find(s => s.name === 'special-defense')?.value || 0;
            const speed = stats.find(s => s.name === 'speed')?.value || 0;

            const [result] = await db.query(
                `INSERT INTO pokemons (
                    pokemon_id, name, type, height, weight, base_experience,
                    image_url, front_default_url, back_default_url,
                    stats_hp, stats_attack, stats_defense, 
                    stats_sp_attack, stats_sp_defense, stats_speed, 
                    abilities, types_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, name, types[0], height, weight, base_experience,
                    sprites.official_artwork, sprites.front_default, sprites.back_default,
                    hp, attack, defense, sp_attack, sp_defense, speed,
                    JSON.stringify(abilities), JSON.stringify(types)
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
                id, name, types, height, weight, base_experience, sprites, stats, abilities
            } = pokemonData;

            const hp = stats.find(s => s.name === 'hp')?.value || 0;
            const attack = stats.find(s => s.name === 'attack')?.value || 0;
            const defense = stats.find(s => s.name === 'defense')?.value || 0;
            const sp_attack = stats.find(s => s.name === 'special-attack')?.value || 0;
            const sp_defense = stats.find(s => s.name === 'special-defense')?.value || 0;
            const speed = stats.find(s => s.name === 'speed')?.value || 0;

            const [result] = await db.query(
                `UPDATE pokemons SET 
                    name = ?, type = ?, height = ?, weight = ?, base_experience = ?,
                    image_url = ?, front_default_url = ?, back_default_url = ?,
                    stats_hp = ?, stats_attack = ?, stats_defense = ?, 
                    stats_sp_attack = ?, stats_sp_defense = ?, stats_speed = ?, 
                    abilities = ?, types_json = ?, updated_at = CURRENT_TIMESTAMP
                WHERE pokemon_id = ?`,
                [
                    name, types[0], height, weight, base_experience,
                    sprites.official_artwork, sprites.front_default, sprites.back_default,
                    hp, attack, defense, sp_attack, sp_defense, speed,
                    JSON.stringify(abilities), JSON.stringify(types), id
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