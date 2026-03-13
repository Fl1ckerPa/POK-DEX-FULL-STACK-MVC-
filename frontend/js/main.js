import auth from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado...');
    
    // Verificar autenticação ao carregar a página
    auth.checkAuthOnLoad();

    // Outras inicializações globais podem vir aqui
});
