const Favorite = require('../models/Favorite');
const Pokemon = require('../models/Pokemon');

/**
 * Controller para gerenciamento de favoritos.
 */
class FavoriteController {
    /**
     * Lista todos os favoritos do usuário autenticado.
     */
    static async list(req, res) {
        try {
            const userId = req.user.id;
            const favorites = await Favorite.findByUserId(userId);

            // Helper to safely parse JSON or return original if already object
            const safeParse = (data) => {
                if (!data) return null;
                if (typeof data === 'object') return data;
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return null;
                }
            };

            // Adicionar is_favorite: true para cada pokémon na lista
            // E garantir que o ID retornado seja o pokemon_id (Pokédex ID)
            const data = favorites.map(pokemon => ({
                ...pokemon,
                id: pokemon.pokemon_id, // Usar o ID da Pokédex para o frontend
                is_favorite: true,
                types: safeParse(pokemon.types_json) || [pokemon.type],
                abilities: safeParse(pokemon.abilities) || []
            }));

            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Erro em FavoriteController.list:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao listar favoritos.'
            });
        }
    }

    /**
     * Adiciona um Pokémon aos favoritos.
     */
    static async add(req, res) {
        try {
            const userId = req.user.id;
            const { pokemonId } = req.body;

            if (!pokemonId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do Pokémon é obrigatório.'
                });
            }

            const result = await Favorite.add(userId, pokemonId);

            if (!result) {
                return res.status(400).json({
                    success: false,
                    message: 'Não foi possível adicionar aos favoritos. Verifique se o Pokémon existe no cache.'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Pokémon adicionado aos favoritos.'
            });
        } catch (error) {
            console.error('Erro em FavoriteController.add:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao adicionar favorito.'
            });
        }
    }

    /**
     * Remove um Pokémon dos favoritos.
     */
    static async remove(req, res) {
        try {
            const userId = req.user.id;
            const { pokemonId } = req.params;

            const removed = await Favorite.remove(userId, pokemonId);

            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Pokémon não está nos favoritos ou não encontrado.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Pokémon removido dos favoritos.'
            });
        } catch (error) {
            console.error('Erro em FavoriteController.remove:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao remover favorito.'
            });
        }
    }

    /**
     * Remove todos os favoritos do usuário autenticado.
     */
    static async clearAll(req, res) {
        try {
            const userId = req.user.id;
            await Favorite.clearAll(userId);

            return res.status(200).json({
                success: true,
                message: 'Todos os favoritos foram removidos.'
            });
        } catch (error) {
            console.error('Erro em FavoriteController.clearAll:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao limpar favoritos.'
            });
        }
    }
}

module.exports = FavoriteController;
