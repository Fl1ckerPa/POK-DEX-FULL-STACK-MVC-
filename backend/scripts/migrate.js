const db = require('../config/database');

const migrate = async () => {
    try {
        console.log('🔄 Iniciando migração para garantir consistência de dados...');
        
        const [columns] = await db.query('SHOW COLUMNS FROM pokemons');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('base_experience')) {
            console.log('➕ Adicionando coluna base_experience...');
            await db.query('ALTER TABLE pokemons ADD COLUMN base_experience INT AFTER weight');
        }

        if (!columnNames.includes('front_default_url')) {
            console.log('➕ Adicionando coluna front_default_url...');
            await db.query('ALTER TABLE pokemons ADD COLUMN front_default_url VARCHAR(255) AFTER image_url');
        }

        if (!columnNames.includes('back_default_url')) {
            console.log('➕ Adicionando coluna back_default_url...');
            await db.query('ALTER TABLE pokemons ADD COLUMN back_default_url VARCHAR(255) AFTER front_default_url');
        }

        if (!columnNames.includes('types_json')) {
            console.log('➕ Adicionando coluna types_json...');
            await db.query('ALTER TABLE pokemons ADD COLUMN types_json JSON AFTER abilities');
        }

        if (!columnNames.includes('updated_at')) {
            console.log('➕ Adicionando coluna updated_at...');
            await db.query('ALTER TABLE pokemons ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        }

        if (!columnNames.includes('flavor_text')) {
            console.log('➕ Adicionando coluna flavor_text...');
            await db.query('ALTER TABLE pokemons ADD COLUMN flavor_text TEXT AFTER types_json');
        }

        if (!columnNames.includes('varieties_json')) {
            console.log('➕ Adicionando coluna varieties_json...');
            await db.query('ALTER TABLE pokemons ADD COLUMN varieties_json JSON AFTER flavor_text');
        }

        console.log('🔄 Verificando tabela team_slot_moves...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS team_slot_moves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slot_id INT NOT NULL,
                move_name VARCHAR(100) NOT NULL,
                FOREIGN KEY (slot_id) REFERENCES team_slots(id) ON DELETE CASCADE
            )
        `);

        console.log('🔄 Ajustando tipos de dados para height e weight...');
        await db.query('ALTER TABLE pokemons MODIFY COLUMN height DECIMAL(10,2)');
        await db.query('ALTER TABLE pokemons MODIFY COLUMN weight DECIMAL(10,2)');

        console.log('🔄 Corrigindo tabela de favoritos para suportar IDs da PokéAPI...');
        try {
            // Tentar remover a constraint antiga se ela existir
            // O nome padrão costuma ser favorites_ibfk_2, mas vamos tentar de forma genérica
            const [constraints] = await db.query(`
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = 'favorites' 
                AND COLUMN_NAME = 'pokemon_id' 
                AND REFERENCED_TABLE_NAME = 'pokemons'
            `);

            for (const c of constraints) {
                console.log(`➖ Removendo constraint ${c.CONSTRAINT_NAME}...`);
                await db.query(`ALTER TABLE favorites DROP FOREIGN KEY ${c.CONSTRAINT_NAME}`);
            }

            // Agora vamos migrar os dados: converter de internal ID para PokéAPI ID
            // Apenas se ainda houver IDs que batem com pokemons.id e não com pokemons.pokemon_id
            console.log('🔄 Migrando dados de favoritos (ID interno -> PokéAPI ID)...');
            await db.query(`
                UPDATE favorites f
                JOIN pokemons p ON f.pokemon_id = p.id
                SET f.pokemon_id = p.pokemon_id
                WHERE p.id != p.pokemon_id
            `);
            
            console.log('✅ Tabela de favoritos atualizada!');
        } catch (err) {
            console.warn('Aviso ao atualizar favoritos:', err.message);
        }
        
        console.log('✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        process.exit(1);
    }
};

migrate();