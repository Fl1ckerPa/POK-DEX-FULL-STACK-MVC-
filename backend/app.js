const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Importar rotas
const authRoutes = require('./routes/authRoutes');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar rotas
app.use('/api/auth', authRoutes);

// Rota básica de teste
app.get('/', (req, res) => {
    res.json({ message: 'Pokédex Fullstack API está rodando!' });
});

module.exports = app;
