const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/requestValidator');
const { verifyToken } = require('../middleware/authMiddleware');

// Validação para o login
const loginValidation = [
    body('email').isEmail().withMessage('Informe um email válido'),
    body('password').notEmpty().withMessage('A senha é obrigatória'),
    validateRequest
];

// Rota POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// Rota protegida de exemplo: GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;
