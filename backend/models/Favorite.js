const db = require('../config/database');

/**
 * Modelo para manipulação de favoritos no banco de dados.
 */
class Favorite {
    /**
     * Adiciona um Pokémon aos favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     */
    static async add(userId, pokemonId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO favorites (user_id, pokemon_id) VALUES (?, ?)',
                [userId, pokemonId]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return null; // Já é favorito
            }
            throw error;
        }
    }

    /**
     * Remove um Pokémon dos favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     */
    static async remove(userId, pokemonId) {
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE user_id = ? AND pokemon_id = ?',
            [userId, pokemonId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Alterna o estado de favorito de um Pokémon.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     * @returns {Promise<Object>} - { isFavorited: boolean }
     */
    static async toggle(userId, pokemonId) {
        const isFavorited = await this.isFavorite(userId, pokemonId);
        
        if (isFavorited) {
            await this.remove(userId, pokemonId);
            return { isFavorited: false };
        } else {
            await this.add(userId, pokemonId);
            return { isFavorited: true };
        }
    }

    /**
     * Lista todos os favoritos de um usuário com dados completos do cache.
     * @param {number} userId - ID do usuário.
     */
    static async findByUserId(userId) {
        const [rows] = await db.execute(`
            SELECT p.* 
            FROM pokemons p
            JOIN favorites f ON p.pokemon_id = f.pokemon_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);
        return rows;
    }

    /**
     * Remove todos os favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     */
    static async clearAll(userId) {
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows >= 0;
    }

    /**
     * Retorna apenas os IDs dos Pokémon favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     */
    static async getFavoritePokemonIds(userId) {
        const [rows] = await db.execute(
            'SELECT pokemon_id FROM favorites WHERE user_id = ?',
            [userId]
        );
        return rows.map(row => row.pokemon_id);
    }

    /**
     * Verifica se um Pokémon é favorito de um usuário.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     */
    static async isFavorite(userId, pokemonId) {
        const [rows] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND pokemon_id = ?',
            [userId, pokemonId]
        );
        return rows.length > 0;
    }
}

module.exports = Favorite;
