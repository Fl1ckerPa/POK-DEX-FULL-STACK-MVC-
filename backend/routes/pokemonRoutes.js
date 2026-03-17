const express = require('express');
const router = express.Router();
const PokemonController = require('../controllers/pokemonController');

/**
 * Rotas relacionadas a Pokémon.
 * Prefixo: /api/pokemons
 */

// Endpoint: GET /api/pokemons/:id
// Descrição: Retorna os dados completos de um Pokémon pelo seu ID.
router.get('/:id', PokemonController.getPokemonDetails);

// Endpoint: GET /api/pokemons/id/:id
// Descrição: Busca um Pokémon pelo seu ID (Pokédex number).
router.get('/id/:id', PokemonController.getById);

// Endpoint: GET /api/pokemons/name/:name
// Descrição: Busca um Pokémon pelo seu nome.
router.get('/name/:name', PokemonController.getByName);

module.exports = router;
