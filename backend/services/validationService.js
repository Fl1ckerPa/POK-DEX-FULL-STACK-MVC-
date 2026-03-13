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
     * Valida senha (mínimo 6 caracteres)
     * @param {string} password 
     * @returns {boolean}
     */
    static validatePassword(password) {
        return typeof password === 'string' && password.length >= 6;
    }

    /**
     * Valida username (mínimo 3 caracteres, alfanumérico)
     * @param {string} username 
     * @returns {boolean}
     */
    static validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        return typeof username === 'string' && usernameRegex.test(username);
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
            errors.push('O nome de usuário deve ter pelo menos 3 caracteres e conter apenas letras, números ou underscore.');
        }

        if (!this.validateEmail(email)) {
            errors.push('O e-mail informado é inválido.');
        }

        if (!this.validatePassword(password)) {
            errors.push('A senha deve ter pelo menos 6 caracteres.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ValidationService;
