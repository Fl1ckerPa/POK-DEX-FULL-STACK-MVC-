const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const teamsRoutes = require('./routes/teamsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const typeRoutes = require('./routes/typeRoutes');

// Rota básica de teste
app.get('/', (req, res) => {
    res.json({ message: 'Pokédex Fullstack API está rodando!' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/types', typeRoutes);

module.exports = app;
