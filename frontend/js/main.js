import auth from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado...');
    
    // Verificar autenticação ao carregar a página
    auth.checkAuthOnLoad();

    // Atualizar UI com base no estado de autenticação
    updateAuthUI();

    // Outras inicializações globais podem vir aqui
});

function updateAuthUI() {
    const token = localStorage.getItem('token');
    
    // IDs dos links no index.html
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const logoutLink = document.getElementById('logout-link');

    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline';
        if (logoutLink) {
            logoutLink.style.display = 'inline';
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (registerLink) registerLink.style.display = 'inline';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}
