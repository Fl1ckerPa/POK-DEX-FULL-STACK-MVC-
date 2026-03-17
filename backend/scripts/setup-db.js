const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const setupDatabase = async () => {
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    };

    let connection;

    try {
        console.log('🔄 Conectando ao MySQL para criar o banco de dados...');
        connection = await mysql.createConnection(connectionConfig);
        
        console.log('➕ Criando banco de dados pokedex_db se não existir...');
        await connection.query('CREATE DATABASE IF NOT EXISTS pokedex_db');
        await connection.query('USE pokedex_db');

        const schemaPath = path.join(__dirname, '../database/schema.sql');
        console.log(`📄 Lendo schema de: ${schemaPath}`);
        
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Remover comandos CREATE DATABASE e USE do SQL se existirem para evitar conflitos
        schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS pokedex_db;/gi, '');
        schemaSql = schemaSql.replace(/USE pokedex_db;/gi, '');

        console.log('🚀 Executando schema...');
        await connection.query(schemaSql);

        console.log('✅ Banco de dados e tabelas criados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Dica: Verifique se o serviço do MySQL está realmente rodando na porta 3306.');
        }
    } finally {
        if (connection) await connection.end();
    }
};

setupDatabase();