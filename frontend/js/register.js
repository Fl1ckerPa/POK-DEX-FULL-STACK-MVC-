import auth from './auth.js';

const registerForm = document.getElementById('register-form');
const btnRegister = document.getElementById('btn-register');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloquear botão para evitar múltiplos cliques
        btnRegister.disabled = true;
        btnRegister.textContent = 'Processando...';
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Limpar mensagens de erro
        const errorDivs = [
            'username-error', 
            'email-error', 
            'password-error', 
            'confirm-password-error'
        ];
        errorDivs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
        });

        // Validação local de nome de usuário
        if (username.length < 3) {
            showError('username-error', 'O nome deve ter pelo menos 3 caracteres.');
            resetButton();
            return;
        }

        // Validação local de confirmação de senha
        if (password !== confirmPassword) {
            showError('confirm-password-error', 'As senhas não coincidem.');
            resetButton();
            return;
        }

        // Validação local de força da senha
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (password.length < 8 || !hasUpperCase || !hasSpecialChar) {
            showError('password-error', 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um caractere especial.');
            resetButton();
            return;
        }
        
        try {
            const result = await auth.register(username, email, password);
            
            if (result.success) {
                alert('Cadastro realizado com sucesso! Redirecionando para o login...');
                window.location.href = 'login.html';
            } else {
                handleErrors(result);
                resetButton();
            }
        } catch (error) {
            console.error('Erro ao realizar cadastro:', error);
            alert('Ocorreu um erro ao conectar com o servidor. Tente novamente mais tarde.');
            resetButton();
        }
    });
}

function handleErrors(result) {
    if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach(error => {
            const errorMsg = error.toLowerCase();
            if (errorMsg.includes('usuário')) {
                showError('username-error', error);
            } else if (errorMsg.includes('e-mail') || errorMsg.includes('email')) {
                showError('email-error', error);
            } else if (errorMsg.includes('senha')) {
                showError('password-error', error);
            } else {
                alert(error);
            }
        });
    } else if (result.message) {
        const message = result.message.toLowerCase();
        if (message.includes('e-mail') || message.includes('email')) {
            showError('email-error', result.message);
        } else if (message.includes('usuário')) {
            showError('username-error', result.message);
        } else {
            alert(result.message);
        }
    } else {
        alert('Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    }
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function resetButton() {
    if (btnRegister) {
        btnRegister.disabled = false;
        btnRegister.textContent = 'Cadastrar';
    }
}
