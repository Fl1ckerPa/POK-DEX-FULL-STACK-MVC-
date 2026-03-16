const request = require('supertest');
const app = require('../backend/app'); // Ajuste o caminho para o seu app Express principal
const db = require('../backend/config/database');

// Descreve o conjunto de testes para a rota de Pokémon
describe('GET /api/pokemons/id/:id', () => {

    // Limpa o cache de Pokémon antes de cada teste para garantir isolamento
    beforeEach(async () => {
        await db.query('DELETE FROM pokemons');
    });

    // Fecha a conexão com o banco após todos os testes
    afterAll(async () => {
        await db.end();
    });

    test('deve retornar 200 e os dados do Pokémon (da API)', async () => {
        const response = await request(app)
            .get('/api/pokemons/id/1') // Bulbasaur
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(1);
        expect(response.body.data.name).toBe('bulbasaur');
    });

    test('deve retornar 200 e os dados do Pokémon (do cache)', async () => {
        // 1. Primeira chamada para popular o cache
        await request(app).get('/api/pokemons/id/4'); // Charmander

        // 2. Segunda chamada, que deve vir do cache
        const response = await request(app)
            .get('/api/pokemons/id/4')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(4);
        expect(response.body.data.name).toBe('charmander');
        // Aqui, poderíamos adicionar um mock para garantir que a API externa não foi chamada na segunda vez
    });

    test('deve retornar 404 para um Pokémon inexistente', async () => {
        const response = await request(app)
            .get('/api/pokemons/id/999999')
            .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('não encontrado');
    });

    test('deve retornar 400 para um ID inválido', async () => {
        const response = await request(app)
            .get('/api/pokemons/id/invalid')
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('inválido');
    });
});
