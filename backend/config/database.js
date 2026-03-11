const mysql = require('mysql2/promise');
const config = require('./environment');

// Configurações do pool de conexões
const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port,
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
