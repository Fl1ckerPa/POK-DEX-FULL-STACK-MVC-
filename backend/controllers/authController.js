const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ValidationService = require('../services/validationService');

class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Validação
            const validation = ValidationService.validateRegisterData({ username, email, password });
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Erro na validação dos dados',
                    errors: validation.errors
                });
            }

            // Verificar se o usuário já existe
            const existingUserByEmail = await User.findByEmail(email);
            if (existingUserByEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'E-mail já está em uso.'
                });
            }

            const existingUserByUsername = await User.findByUsername(username);
            if (existingUserByUsername) {
                return res.status(409).json({
                    success: false,
                    message: 'Nome de usuário já está em uso.'
                });
            }

            // Hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Criar usuário
            const userId = await User.create({
                username,
                email,
                password: hashedPassword
            });

            return res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso!',
                data: {
                    id: userId,
                    username,
                    email
                }
            });

        } catch (error) {
            console.error('Erro no registro de usuário:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor ao registrar usuário.'
            });
        }
    }
}

module.exports = AuthController;
