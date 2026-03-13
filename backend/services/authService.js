const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const bcrypt = require('bcryptjs');

class AuthService {
    static async register(userData) {
        try {
            const { username, email, password } = userData;

            // 1. Verificar se o e-mail já existe
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return { success: false, message: 'Este e-mail já está em uso' };
            }

            // 2. Verificar se o username já existe
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return { success: false, message: 'Este nome de usuário já está em uso' };
            }

            // 3. Gerar hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 4. Inserir no banco
            const userId = await User.create({
                username,
                email,
                password: hashedPassword
            });

            return {
                success: true,
                message: 'Usuário registrado com sucesso',
                user: {
                    id: userId,
                    username,
                    email
                }
            };

        } catch (error) {
            console.error('Erro no AuthService.register:', error);
            throw error;
        }
    }

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
