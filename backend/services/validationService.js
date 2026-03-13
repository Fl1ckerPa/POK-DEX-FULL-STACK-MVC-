class ValidationService {
    /**
     * Valida formato de email
     * @param {string} email 
     * @returns {boolean}
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida senha (mínimo 8 caracteres, uma maiúscula e um caractere especial)
     * @param {string} password 
     * @returns {boolean}
     */
    static validatePassword(password) {
        if (typeof password !== 'string' || password.length < 8) return false;
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpperCase && hasSpecialChar;
    }

    /**
     * Valida username (mínimo 3 caracteres, permite espaços para nome completo)
     * @param {string} username 
     * @returns {boolean}
     */
    static validateUsername(username) {
        // Remove espaços do início e fim para contar apenas caracteres válidos
        const trimmedUsername = typeof username === 'string' ? username.trim() : '';
        return trimmedUsername.length >= 3;
    }

    /**
     * Valida dados de registro
     * @param {object} data 
     * @returns {object} { isValid, errors }
     */
    static validateRegistration(data) {
        const errors = [];
        const { username, email, password } = data;

        if (!this.validateUsername(username)) {
            errors.push('O nome de usuário deve ter pelo menos 3 caracteres.');
        }

        if (!this.validateEmail(email)) {
            errors.push('O e-mail informado é inválido.');
        }

        if (!this.validatePassword(password)) {
            errors.push('A senha deve ter pelo menos 8 caracteres, incluir pelo menos uma letra maiúscula e um caractere especial.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ValidationService;
