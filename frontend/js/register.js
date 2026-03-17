import auth from './auth.js';

const registerForm = document.getElementById('register-form');
const btnRegister = document.querySelector('.auth-button');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloquear botão para evitar múltiplos cliques
        btnRegister.disabled = true;
        const originalText = btnRegister.textContent;
        btnRegister.textContent = 'Processando...';
        
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Limpar mensagens de erro
        clearErrors();

        // Validação local de nome de usuário
        if (username.length < 3) {
            showError('username-error', 'O nome deve ter pelo menos 3 caracteres.', usernameInput);
            resetButton(originalText);
            return;
        }

        // Validação local de força da senha
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (password.length < 8 || !hasUpperCase || !hasSpecialChar) {
            showError('password-error', 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um caractere especial.', passwordInput);
            resetButton(originalText);
            return;
        }
        
        try {
            const result = await auth.register(username, email, password);
            
            if (result.success) {
                // Sucesso
                btnRegister.textContent = 'Sucesso!';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                handleErrors(result);
                resetButton(originalText);
            }
        } catch (error) {
            console.error('Erro ao realizar cadastro:', error);
            alert('Ocorreu um erro ao conectar com o servidor. Tente novamente mais tarde.');
            resetButton(originalText);
        }
    });
}

function clearErrors() {
    const errorDivs = document.querySelectorAll('[id$="-error"]');
    const inputs = document.querySelectorAll('input');
    
    errorDivs.forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
    
    inputs.forEach(input => {
        input.classList.remove('border-red-500', 'ring-red-500/10');
    });
}

function showError(id, message, inputElement) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
    }
    if (inputElement) {
        inputElement.classList.add('border-red-500', 'ring-4', 'ring-red-500/10');
        inputElement.focus();
    }
}

function resetButton(text) {
    btnRegister.disabled = false;
    btnRegister.textContent = text;
}

function handleErrors(result) {
    if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach(error => {
            const errorMsg = error.toLowerCase();
            if (errorMsg.includes('usuário')) {
                showError('username-error', error, document.getElementById('username'));
            } else if (errorMsg.includes('e-mail') || errorMsg.includes('email')) {
                showError('email-error', error, document.getElementById('email'));
            } else if (errorMsg.includes('senha')) {
                showError('password-error', error, document.getElementById('password'));
            } else {
                alert(error);
            }
        });
    } else if (result.message) {
        const message = result.message.toLowerCase();
        if (message.includes('e-mail') || message.includes('email')) {
            showError('email-error', result.message, document.getElementById('email'));
        } else if (message.includes('usuário')) {
            showError('username-error', result.message, document.getElementById('username'));
        } else {
            alert(result.message);
        }
    } else {
        alert('Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    }
}
