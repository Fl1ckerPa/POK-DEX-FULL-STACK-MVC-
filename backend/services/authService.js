const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

class AuthService {
    static async login(email, password) {
        try {
            // 1. Buscar usuário pelo email
            const user = await User.findByEmail(email);

            if (!user) {
                return { success: false, message: 'Credenciais inválidas' };
            }

            // 2. Comparar senhas usando bcrypt
            const isPasswordValid = await User.comparePassword(password, user.password);

            if (!isPasswordValid) {
                return { success: false, message: 'Credenciais inválidas' };
            }

            // 3. Gerar token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email },
                config.auth.jwtSecret,
                { expiresIn: config.auth.jwtExpiration }
            );

            // 4. Retornar token e dados básicos do usuário
            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };

        } catch (error) {
            console.error('Erro no AuthService.login:', error);
            throw error;
        }
    }
}

module.exports = AuthService;
