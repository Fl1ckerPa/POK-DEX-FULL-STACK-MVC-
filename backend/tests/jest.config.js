module.exports = {
    testEnvironment: 'node',
    rootDir: '../', // Agora aponta para a pasta backend/
    moduleDirectories: ['node_modules'],
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true
};