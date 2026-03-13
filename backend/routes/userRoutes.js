const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Exemplo de rotas de usuário protegidas
// router.get('/profile', verifyToken, userController.getProfile);
// router.put('/update', verifyToken, userController.updateUser);

module.exports = router;
