module.exports = {
    testEnvironment: 'node',
    rootDir: '../', // Define a raiz do projeto um nível acima
    moduleDirectories: ['node_modules', 'backend/node_modules'], // Onde encontrar os módulos
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    forceExit: true, // Força o encerramento após os testes, útil para processos abertos como conexões de DB
    clearMocks: true
};
