const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/requestValidator');

// Validação para o login
const loginValidation = [
    body('email').isEmail().withMessage('Informe um email válido'),
    body('password').notEmpty().withMessage('A senha é obrigatória'),
    validateRequest
];

// Rota POST /api/auth/login
router.post('/login', loginValidation, authController.login);

module.exports = router;
