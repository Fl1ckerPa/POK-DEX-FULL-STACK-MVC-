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
            const uId = Number(userId);
            const pId = Number(pokemonId);
            
            const [result] = await db.execute(
                'INSERT INTO favorites (user_id, pokemon_id) VALUES (?, ?)',
                [uId, pId]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return null; // Já é favorito
            }
            console.error('Erro em Favorite.add:', error);
            throw error;
        }
    }

    /**
     * Remove um Pokémon dos favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     */
    static async remove(userId, pokemonId) {
        try {
            const uId = Number(userId);
            const pId = Number(pokemonId);
            
            const [result] = await db.execute(
                'DELETE FROM favorites WHERE user_id = ? AND pokemon_id = ?',
                [uId, pId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro em Favorite.remove:', error);
            throw error;
        }
    }

    /**
     * Alterna o estado de favorito de um Pokémon.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     * @returns {Promise<Object>} - { isFavorited: boolean }
     */
    static async toggle(userId, pokemonId) {
        const uId = Number(userId);
        const pId = Number(pokemonId);
        
        const isFavorited = await this.isFavorite(uId, pId);
        
        if (isFavorited) {
            await this.remove(uId, pId);
            return { isFavorited: false };
        } else {
            await this.add(uId, pId);
            return { isFavorited: true };
        }
    }

    /**
     * Lista todos os favoritos de um usuário com dados completos do cache.
     * @param {number} userId - ID do usuário.
     */
    static async findByUserId(userId) {
        try {
            const uId = Number(userId);
            // Usar LEFT JOIN para garantir que retornamos o favorito mesmo se não estiver no cache
            const [rows] = await db.execute(`
                SELECT 
                    f.pokemon_id as fav_pokemon_id,
                    p.* 
                FROM favorites f
                LEFT JOIN pokemons p ON f.pokemon_id = p.pokemon_id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
            `, [uId]);
            return rows;
        } catch (error) {
            console.error('Erro em Favorite.findByUserId:', error);
            throw error;
        }
    }

    /**
     * Remove todos os favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     */
    static async clearAll(userId) {
        try {
            const uId = Number(userId);
            const [result] = await db.execute(
                'DELETE FROM favorites WHERE user_id = ?',
                [uId]
            );
            return result.affectedRows >= 0;
        } catch (error) {
            console.error('Erro em Favorite.clearAll:', error);
            throw error;
        }
    }

    /**
     * Retorna apenas os IDs dos Pokémon favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     */
    static async getFavoritePokemonIds(userId) {
        try {
            const uId = Number(userId);
            const [rows] = await db.execute(
                'SELECT pokemon_id FROM favorites WHERE user_id = ?',
                [uId]
            );
            return rows.map(row => row.pokemon_id);
        } catch (error) {
            console.error('Erro em Favorite.getFavoritePokemonIds:', error);
            throw error;
        }
    }

    /**
     * Verifica se um Pokémon é favorito de um usuário.
     * @param {number} userId - ID do usuário.
     * @param {number} pokemonId - ID da PokéAPI do Pokémon.
     */
    static async isFavorite(userId, pokemonId) {
        try {
            const uId = Number(userId);
            const pId = Number(pokemonId);
            
            const [rows] = await db.execute(
                'SELECT id FROM favorites WHERE user_id = ? AND pokemon_id = ?',
                [uId, pId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Erro em Favorite.isFavorite:', error);
            throw error;
        }
    }
}

module.exports = Favorite;
