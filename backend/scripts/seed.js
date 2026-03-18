const CacheService = require('../services/cacheService');
const db = require('../config/database');

const seed = async () => {
    try {
        console.log('🌱 Iniciando seeding completo de Pokémon...');
        
        // Atualmente existem mais de 1000 Pokémon, vamos buscar o total da PokéAPI ou definir um limite alto
        const limit = 1025; // Número aproximado de Pokémon até a Gen 9
        console.log(`🚀 Populando todos os ${limit} Pokémon...`);

        for (let i = 1; i <= limit; i++) {
            try {
                // Verificar se já existe no banco para não repetir a chamada desnecessária
                const [exists] = await db.query('SELECT pokemon_id FROM pokemons WHERE pokemon_id = ?', [i]);
                
                if (exists.length > 0) {
                    process.stdout.write(`\r[${i}/${limit}] Pokémon ID ${i} já está no cache. Pulando...`);
                    continue;
                }

                process.stdout.write(`\r[${i}/${limit}] Buscando Pokémon ID ${i}...`);
                await CacheService.getPokemonById(i);
            } catch (err) {
                console.error(`\n❌ Erro ao buscar Pokémon ID ${i}:`, err.message);
            }
        }

        console.log('\n✅ Seeding completo concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no seeding:', error.message);
        process.exit(1);
    }
};

seed();