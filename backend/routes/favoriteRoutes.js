const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Rotas para gerenciamento de favoritos.
 * Todas as rotas são protegidas por JWT.
 */

// Middleware de autenticação global para favoritos
router.use(verifyToken);

// GET /api/favorites - Lista favoritos do usuário
router.get('/', FavoriteController.list);

// POST /api/favorites/toggle - Alterna estado (Adiciona/Remove)
router.post('/toggle', FavoriteController.toggle);

// DELETE /api/favorites/:pokemonId - Remove favorito específico
router.delete('/:pokemonId', FavoriteController.remove);

// DELETE /api/favorites - Limpa todos os favoritos do usuário
router.delete('/', FavoriteController.clearAll);

// Rota de compatibilidade (mantida se necessário por versões anteriores do frontend)
router.post('/', FavoriteController.toggle);
router.delete('/clear', FavoriteController.clearAll);

module.exports = router;
