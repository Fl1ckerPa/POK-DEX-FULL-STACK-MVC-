const AuthService = require('../services/authService');

const authController = {
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
