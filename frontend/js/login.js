import auth from './auth.js';

// Initialize Lucide icons
if (window.lucide) {
    lucide.createIcons();
}

// Password visibility toggle
const passwordInput = document.getElementById('password');
const toggleButton = document.getElementById('toggle-password');

if (passwordInput && toggleButton) {
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // Update icon
        const iconName = type === 'password' ? 'eye' : 'eye-off';
        toggleButton.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        if (window.lucide) {
            lucide.createIcons();
        }
        
        toggleButton.setAttribute('aria-label', type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
    });
}

// Form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const email = emailInput.value;
        const password = passwordInput.value;
        
        try {
            const result = await auth.login(email, password);
            if (result.success) {
                window.location.href = 'dashboard.html';
            } else {
                alert(result.message || 'Erro ao fazer login');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Erro de conexão com o servidor');
        }
    });
}