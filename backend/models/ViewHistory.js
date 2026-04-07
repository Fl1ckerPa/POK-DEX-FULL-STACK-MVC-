const db = require('../config/database');

class ViewHistory {
    /**
     * Adiciona um Pokémon ao histórico de visualização do usuário
     */
    static async add(userId, pokemonId) {
        try {
            // Primeiro buscar o ID local do pokemon
            const [pokemons] = await db.execute('SELECT id FROM pokemons WHERE pokemon_id = ?', [pokemonId]);
            if (pokemons.length === 0) return;

            const localId = pokemons[0].id;

            // Inserir no histórico (permite duplicatas cronológicas)
            await db.execute(
                'INSERT INTO view_history (user_id, pokemon_id) VALUES (?, ?)',
                [userId, localId]
            );
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    /**
     * Busca os últimos 20 Pokémon visualizados pelo usuário
     */
    static async findByUserId(userId, limit = 20) {
        // mysql2 exige que o LIMIT seja passado como número ou que a query seja montada de forma diferente
        // em alguns ambientes de configuração de prepared statements.
        const [rows] = await db.query(`
            SELECT p.*, v.viewed_at 
            FROM pokemons p
            JOIN view_history v ON p.id = v.pokemon_id
            WHERE v.user_id = ?
            ORDER BY v.viewed_at DESC
            LIMIT ?
        `, [userId, limit]);
        
        // Helper to safely parse JSON
        const safeParse = (data) => {
            if (!data) return null;
            if (typeof data === 'object') return data;
            try { return JSON.parse(data); } catch (e) { return null; }
        };

        return rows.map(row => ({
            ...row,
            id: row.pokemon_id,
            types: safeParse(row.types_json) || [row.type],
            abilities: safeParse(row.abilities) || []
        }));
    }
}

module.exports = ViewHistory;
