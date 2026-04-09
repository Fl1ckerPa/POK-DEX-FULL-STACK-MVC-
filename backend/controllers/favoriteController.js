const Favorite = require('../models/Favorite');
const Pokemon = require('../models/Pokemon');

/**
 * Controller para gerenciamento de favoritos.
 */
class FavoriteController {
    /**
     * Lista todos os favoritos do usuário autenticado com dados completos.
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

            // Garantir dados completos e formatados
            const data = favorites.map(pokemon => ({
                ...pokemon,
                id: pokemon.pokemon_id, // Sempre usar ID da PokéAPI para o frontend
                is_favorite: true,
                types: safeParse(pokemon.types_json) || [pokemon.type],
                abilities: safeParse(pokemon.abilities) || [],
                stats: [
                    { name: 'hp', value: pokemon.stats_hp },
                    { name: 'attack', value: pokemon.stats_attack },
                    { name: 'defense', value: pokemon.stats_defense },
                    { name: 'special-attack', value: pokemon.stats_sp_attack },
                    { name: 'special-defense', value: pokemon.stats_sp_defense },
                    { name: 'speed', value: pokemon.stats_speed }
                ]
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
     * Alterna (Adiciona/Remove) um Pokémon aos favoritos.
     * Único endpoint para controle inteligente.
     */
    static async toggle(req, res) {
        try {
            const userId = req.user.id;
            const { pokemonId } = req.body;

            if (!pokemonId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do Pokémon é obrigatório.'
                });
            }

            const { isFavorited } = await Favorite.toggle(userId, pokemonId);

            return res.status(200).json({
                success: true,
                isFavorited,
                message: isFavorited ? 'Pokémon adicionado aos favoritos.' : 'Pokémon removido dos favoritos.'
            });
        } catch (error) {
            console.error('Erro em FavoriteController.toggle:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao alternar favorito.'
            });
        }
    }

    /**
     * Remove um Pokémon específico dos favoritos.
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
