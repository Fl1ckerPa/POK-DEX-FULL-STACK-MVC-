const app = require('./app');
const config = require('./config/environment');

const PORT = config.server.port;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 URL local: http://localhost:${PORT}`);
});
