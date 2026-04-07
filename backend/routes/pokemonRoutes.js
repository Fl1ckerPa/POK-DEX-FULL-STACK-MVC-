const express = require('express');
const router = express.Router();
const PokemonController = require('../controllers/pokemonController');
const { verifyToken, optionalVerifyToken } = require('../middleware/authMiddleware');

/**
 * Rotas relacionadas a Pokémon.
 * Prefixo: /api/pokemon
 */

// Endpoint: GET /api/pokemon
// Descrição: Lista todos os Pokémon com paginação e busca.
router.get('/', optionalVerifyToken, PokemonController.list);

// Endpoint: GET /api/pokemon/:id
// Descrição: Retorna os dados completos de um Pokémon pelo seu ID.
router.get('/:id', optionalVerifyToken, PokemonController.getPokemonDetails);

// Endpoint: GET /api/pokemons/id/:id
// Descrição: Busca um Pokémon pelo seu ID (Pokédex number).
router.get('/id/:id', optionalVerifyToken, PokemonController.getById);

// Endpoint: GET /api/pokemons/name/:name
// Descrição: Busca um Pokémon pelo seu nome.
router.get('/name/:name', PokemonController.getByName);

module.exports = router;
