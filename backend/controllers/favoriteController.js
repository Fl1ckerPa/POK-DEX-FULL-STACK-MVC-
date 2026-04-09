const Favorite = require('../models/Favorite');
const Pokemon = require('../models/Pokemon');
const CacheService = require('../services/cacheService');

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

            // Processar favoritos e buscar dados faltantes se necessário
            const data = await Promise.all(favorites.map(async (fav) => {
                let pokemon = fav;

                // Se p.* for nulo (devido ao LEFT JOIN), precisamos buscar os dados
                if (!fav.name) {
                    try {
                        console.log(`🔍 Buscando dados faltantes para favorito ID ${fav.fav_pokemon_id}...`);
                        pokemon = await CacheService.getPokemonById(fav.fav_pokemon_id);
                    } catch (err) {
                        console.error(`Erro ao buscar dados faltantes para Pokémon ${fav.fav_pokemon_id}:`, err.message);
                        return { id: fav.fav_pokemon_id, is_error: true };
                    }
                }

                return {
                    ...pokemon,
                    id: pokemon.pokemon_id || pokemon.id, // Sempre usar ID da PokéAPI para o frontend
                    is_favorite: true,
                    types: safeParse(pokemon.types_json) || pokemon.types || [pokemon.type],
                    abilities: safeParse(pokemon.abilities) || pokemon.abilities || [],
                    stats: pokemon.stats || [
                        { name: 'hp', value: pokemon.stats_hp },
                        { name: 'attack', value: pokemon.stats_attack },
                        { name: 'defense', value: pokemon.stats_defense },
                        { name: 'special-attack', value: pokemon.stats_sp_attack },
                        { name: 'special-defense', value: pokemon.stats_sp_defense },
                        { name: 'speed', value: pokemon.stats_speed }
                    ]
                };
            }));

            // Filtrar itens com erro
            const filteredData = data.filter(item => !item.is_error);

            return res.status(200).json({
                success: true,
                data: filteredData
            });
        } catch (error) {
            console.error('Erro em FavoriteController.list:', error);
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

            const pId = parseInt(pokemonId);

            // Tentar garantir que o Pokémon esteja no cache de forma assíncrona
            // mas sem travar o toggle se falhar o cache
            CacheService.getPokemonById(pId).catch(err => {
                console.warn(`Aviso: Falha ao cachear Pokémon ${pId} durante toggle:`, err.message);
            });

            const { isFavorited } = await Favorite.toggle(userId, pId);

            return res.status(200).json({
                success: true,
                isFavorited,
                message: isFavorited ? 'Pokémon adicionado aos favoritos.' : 'Pokémon removido dos favoritos.'
            });
        } catch (error) {
            console.error('Erro em FavoriteController.toggle:', error);
            return res.status(500).json({
                success: false,
                message: `Erro ao alternar favorito: ${error.message}`
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

            const removed = await Favorite.remove(userId, parseInt(pokemonId));

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
            console.error('Erro em FavoriteController.remove:', error);
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
            console.error('Erro em FavoriteController.clearAll:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao limpar favoritos.'
            });
        }
    }
}

module.exports = FavoriteController;
