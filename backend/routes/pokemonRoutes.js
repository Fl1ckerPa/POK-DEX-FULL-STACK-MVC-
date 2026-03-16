const express = require('express');
const router = express.Router();
const PokemonController = require('../controllers/pokemonController');

/**
 * Rotas relacionadas a Pokémon.
 * Prefixo: /api/pokemons
 */

// Endpoint: GET /api/pokemons/id/:id
// Descrição: Busca um Pokémon pelo seu ID (Pokédex number).
router.get('/id/:id', PokemonController.getById);

module.exports = router;
