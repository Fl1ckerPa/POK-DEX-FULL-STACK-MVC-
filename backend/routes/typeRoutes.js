const express = require('express');
const router = express.Router();
const PokemonTypeController = require('../controllers/pokemonTypeController');

/**
 * @route   GET /api/types
 * @desc    Listar todos os tipos Pokémon (nome, cor, ícone)
 * @access  Public
 */
router.get('/', PokemonTypeController.list);

/**
 * @route   GET /api/types/:name
 * @desc    Buscar um tipo específico pelo nome
 * @access  Public
 */
router.get('/:name', PokemonTypeController.getByName);

module.exports = router;
