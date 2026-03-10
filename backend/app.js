const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota básica de teste
app.get('/', (req, res) => {
    res.json({ message: 'Pokédex Fullstack API está rodando!' });
});

// Futuramente, as rotas serão importadas aqui:
// const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

module.exports = app;
