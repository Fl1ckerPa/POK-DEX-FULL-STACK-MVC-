const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const verifyToken = (req, res, next) => {
    // 1. Verificar header Authorization
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token não fornecido. Acesso negado.' 
        });
    }

    // 2. Extrair token (Bearer token)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Formato de token inválido. Use Bearer <token>.' 
        });
    }

    try {
        // 3. Validar token
        const decoded = jwt.verify(token, config.auth.jwtSecret);

        // 4. Anexar userId ao request (conforme solicitado na checklist)
        req.userId = decoded.id;
        req.user = decoded; // Mantém também o objeto decoded completo por conveniência

        next();
    } catch (error) {
        console.error('Erro na validação do token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expirado. Por favor, faça login novamente.' 
            });
        }

        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido ou acesso não autorizado.' 
        });
    }
};

const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        req.userId = decoded.id;
        req.user = decoded;
        next();
    } catch (error) {
        // Se o token for inválido ou expirado, apenas prossegue sem o usuário
        next();
    }
};

module.exports = { verifyToken, optionalVerifyToken };
