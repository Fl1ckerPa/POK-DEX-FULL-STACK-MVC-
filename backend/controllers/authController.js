const AuthService = require('../services/authService');
const ValidationService = require('../services/validationService');

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // 1. Validar dados
            const validation = ValidationService.validateRegistration({ username, email, password });
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors: validation.errors
                });
            }

            // 2. Tentar registrar usuário via service
            const result = await AuthService.register({ username, email, password });

            if (!result.success) {
                return res.status(409).json({
                    success: false,
                    message: result.message
                });
            }

            // 3. Retornar resposta de sucesso
            return res.status(201).json({
                success: true,
                message: result.message,
                user: result.user
            });

        } catch (error) {
            console.error('Erro no controller register:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao processar registro'
            });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            const result = await AuthService.login(email, password);

            if (!result.success) {
                return res.status(401).json({ message: result.message });
            }

            return res.json({
                message: 'Login realizado com sucesso',
                token: result.token,
                user: result.user
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
};

module.exports = authController;
