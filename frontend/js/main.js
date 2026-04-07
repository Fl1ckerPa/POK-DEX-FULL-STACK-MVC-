import auth from './auth.js';
import pokemon from './pokemon.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App inicializado...');
    
    // Initialize Lucide icons immediately for static elements
    if (window.lucide) {
        lucide.createIcons();
    }

    // Verificar autenticação ao carregar a página
    auth.checkAuthOnLoad();

    // Atualizar UI com base no estado de autenticação
    updateAuthUI();

    // Lógica para o dashboard
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    // Update user display info if elements exist
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (userInfo) userInfo.innerText = `Olá, ${user.username || user.email}!`;
        if (userName) userName.innerText = user.username || 'Treinador';
        if (userEmail) userEmail.innerText = user.email;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Initialize Pokémon grid if on dashboard and grid exists
    const grid = document.getElementById('pokemon-grid');
    if (grid) {
        pokemon.init();
    }
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
