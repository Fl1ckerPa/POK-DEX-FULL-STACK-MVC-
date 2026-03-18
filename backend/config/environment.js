const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiration: process.env.JWT_EXPIRATION || '24h'
    },
    server: {
        port: process.env.PORT || 3000
    }
};

// Verificação simples de variáveis obrigatórias
if (!config.auth.jwtSecret && process.env.NODE_ENV === 'production') {
    console.error('❌ ERRO: JWT_SECRET não definido no ambiente de produção!');
    process.exit(1);
}

module.exports = config;
