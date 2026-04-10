const db = require('../config/database');

/**
 * Modelo para manipulação de tipos Pokémon no banco de dados.
 */
class PokemonType {
    /**
     * Busca todos os tipos Pokémon cadastrados.
     * @returns {Promise<Array>} Lista de tipos com nome, cor e caminho do ícone.
     */
    static async findAll() {
        try {
            const [rows] = await db.query(
                'SELECT name, color, icon_path as icon FROM pokemon_types ORDER BY name ASC'
            );
            return rows;
        } catch (error) {
            console.error('Erro ao buscar tipos no banco:', error.message);
            throw error;
        }
    }

    /**
     * Busca um tipo específico pelo nome.
     * @param {string} name - Nome do tipo.
     * @returns {Promise<Object|null>} Dados do tipo ou null.
     */
    static async findByName(name) {
        try {
            const [rows] = await db.query(
                'SELECT name, color, icon_path as icon FROM pokemon_types WHERE name = ?',
                [name.toLowerCase().trim()]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error(`Erro ao buscar tipo "${name}" no banco:`, error.message);
            throw error;
        }
    }
}

module.exports = PokemonType;
