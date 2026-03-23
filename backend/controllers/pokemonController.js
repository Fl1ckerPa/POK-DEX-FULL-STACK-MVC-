const CacheService = require('../services/cacheService');
const Pokemon = require('../models/Pokemon');
const Favorite = require('../models/Favorite');

/**
 * Controller responsável por lidar com requisições relacionadas a Pokémon.
 */
class PokemonController {
    /**
     * Lista todos os Pokémon com paginação e busca.
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search || '';
            const userId = req.user?.id;

            const { data, total, totalPages } = await Pokemon.findAll(page, limit, search);

            // Se o usuário estiver logado, marcar os favoritos
            if (userId) {
                const favoriteIds = await Favorite.getFavoritePokemonIds(userId);
                data.forEach(p => {
                    p.is_favorite = favoriteIds.includes(p.pokemon_id || p.id);
                });
            }

            return res.status(200).json({
                success: true,
                data,
                total,
                totalPages,
                page,
                limit
            });
        } catch (error) {
            console.error('Erro em PokemonController.list:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao listar Pokémon.'
            });
        }
    }
    /**
     * Busca os detalhes completos de um Pokémon pelo seu ID.
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async getPokemonDetails(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            // 1. Validar ID recebido na requisição
            if (!id || isNaN(id) || parseInt(id) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do Pokémon inválido. Forneça um número positivo.'
                });
            }

            const pokemonId = parseInt(id);

            // 2. Consultar Pokémon (cache -> PokéAPI)
            const pokemon = await CacheService.getPokemonById(pokemonId);

            // 3. Se o usuário estiver logado, verificar se é favorito
            if (userId) {
                const isFavorite = await Favorite.isFavorite(userId, pokemon.id);
                pokemon.is_favorite = isFavorite;
            }

            // 4. Retornar dados completos do Pokémon e status apropriados
            return res.status(200).json({
                success: true,
                data: pokemon
            });

        } catch (error) {
            console.error(`Erro em PokemonController.getPokemonDetails:`, error.message);

            // 4. Tratamento de erro para ID inexistente (lançado pelo CacheService/PokeApiService)
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            // 5. Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar detalhes do Pokémon.'
            });
        }
    }

    /**
     * Busca um Pokémon pelo seu ID (Pokédex number).
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            // 1. Validar ID recebido na requisição
            if (!id || isNaN(id) || parseInt(id) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do Pokémon inválido. Forneça um número positivo.'
                });
            }

            const pokemonId = parseInt(id);

            // 2. Consultar Pokémon no cache (através do model Pokemon)
            const pokemon = await Pokemon.findByPokemonId(pokemonId);

            if (!pokemon) {
                return res.status(404).json({
                    success: false,
                    message: `Pokémon ID ${pokemonId} não encontrado no sistema.`
                });
            }

            // 3. Se o usuário estiver logado, marcar se é favorito
            if (userId) {
                pokemon.is_favorite = await Favorite.isFavorite(userId, pokemon.id);
            }

            return res.status(200).json({
                success: true,
                data: pokemon
            });
        } catch (error) {
            console.error(`Erro em PokemonController.getById:`, error.message);

            // 4. Tratamento de erro para ID inexistente (lançado pelo CacheService/PokeApiService)
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            // 5. Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar Pokémon.'
            });
        }
    }

    /**
     * Busca um Pokémon pelo seu nome.
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async getByName(req, res) {
        try {
            const { name } = req.params;

            // 1. Validar nome recebido na requisição
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome do Pokémon é obrigatório.'
                });
            }

            // 2. Consultar Pokémon (cache -> PokéAPI)
            const pokemon = await CacheService.getPokemonByName(name);

            // 3. Retornar dados e status apropriados
            return res.status(200).json({
                success: true,
                data: pokemon
            });

        } catch (error) {
            console.error(`Erro em PokemonController.getByName:`, error.message);

            // 4. Tratamento de erro para nome inexistente
            if (error.message.includes('não encontrado')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            // 5. Outros erros
            return res.status(500).json({
                success: false,
                message: 'Erro interno ao buscar Pokémon.'
            });
        }
    }
}

module.exports = PokemonController;
