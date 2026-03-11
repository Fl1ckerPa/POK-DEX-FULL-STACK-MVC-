class ValidationService {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePassword(password) {
        // Mínimo 6 caracteres
        return password && password.length >= 6;
    }

    static validateUsername(username) {
        // Mínimo 3 caracteres, apenas letras e números
        const re = /^[a-zA-Z0-9]{3,}$/;
        return re.test(username);
    }

    static validateRegisterData(data) {
        const errors = [];

        if (!data.username || !this.validateUsername(data.username)) {
            errors.push('Nome de usuário inválido. Mínimo 3 caracteres alfanuméricos.');
        }

        if (!data.email || !this.validateEmail(data.email)) {
            errors.push('E-mail inválido.');
        }

        if (!data.password || !this.validatePassword(data.password)) {
            errors.push('Senha inválida. Mínimo 6 caracteres.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ValidationService;
