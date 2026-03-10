const mysql = require('mysql2/promise');
require('dotenv').config();

// Configurações do pool de conexões
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pokedex_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testar conexão inicial
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
        connection.release();
    } catch (err) {
        console.error('❌ Erro ao conectar ao banco de dados:');
        console.error('Mensagem:', err.message);
        console.error('Código:', err.code);
        console.error('Dica: Verifique se o MySQL está rodando e se as credenciais no .env estão corretas.');
    }
};

testConnection();

module.exports = pool;
