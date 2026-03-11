const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Rota de registro: POST /api/auth/register
router.post('/register', AuthController.register);

module.exports = router;
