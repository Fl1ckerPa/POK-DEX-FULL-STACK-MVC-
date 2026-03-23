const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/authMiddleware');

// Todas as rotas de favoritos exigem autenticação
router.use(verifyToken);

router.get('/', FavoriteController.list);
router.post('/', FavoriteController.add);
router.delete('/clear', FavoriteController.clearAll);
router.delete('/:pokemonId', FavoriteController.remove);

module.exports = router;
