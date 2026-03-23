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
            // Primeiro buscar o ID local do pokemon
            const [pokemons] = await db.execute('SELECT id FROM pokemons WHERE pokemon_id = ?', [pokemonId]);
            if (pokemons.length === 0) return null;
            
            const localId = pokemons[0].id;
            const [result] = await db.execute(
                'INSERT INTO favorites (user_id, pokemon_id) VALUES (?, ?)',
                [userId, localId]
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
        // Primeiro buscar o ID local do pokemon
        const [pokemons] = await db.execute('SELECT id FROM pokemons WHERE pokemon_id = ?', [pokemonId]);
        if (pokemons.length === 0) return false;

        const localId = pokemons[0].id;
        const [result] = await db.execute(
            'DELETE FROM favorites WHERE user_id = ? AND pokemon_id = ?',
            [userId, localId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Lista todos os favoritos de um usuário.
     * @param {number} userId - ID do usuário.
     */
    static async findByUserId(userId) {
        const [rows] = await db.execute(`
            SELECT p.* 
            FROM pokemons p
            JOIN favorites f ON p.id = f.pokemon_id
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
            'SELECT p.pokemon_id FROM pokemons p JOIN favorites f ON p.id = f.pokemon_id WHERE f.user_id = ?',
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
            'SELECT f.id FROM favorites f JOIN pokemons p ON f.pokemon_id = p.id WHERE f.user_id = ? AND p.pokemon_id = ?',
            [userId, pokemonId]
        );
        return rows.length > 0;
    }
}

module.exports = Favorite;
