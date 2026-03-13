import api from './api.js';

const auth = {
    async login(email, password) {
        try {
            const data = await api.post('/auth/login', { email, password });
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message || 'Erro ao realizar login' };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    async checkAuthOnLoad() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.handleUnauthenticated();
            return;
        }

        if (this.isTokenExpired(token)) {
            console.warn('Token expirado.');
            this.logout();
            return;
        }

        try {
            // Verificar token com o backend
            const data = await api.get('/auth/me');
            
            if (!data.success) {
                console.warn('Token inválido no backend.');
                this.logout();
            } else {
                console.log('Usuário autenticado:', data.user);
                // Atualizar dados do usuário no localStorage por precaução
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            // Em caso de erro de rede, podemos decidir se mantemos o usuário ou não.
            // Por segurança, se não conseguir validar, redirecionamos.
            // this.logout();
        }
    },

    isTokenExpired(token) {
        if (!token) return true;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const { exp } = JSON.parse(jsonPayload);
            
            // exp está em segundos, Date.now() em milisegundos
            return (Date.now() >= exp * 1000);
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            return true;
        }
    },

    handleUnauthenticated() {
        const publicPages = ['/login.html', '/register.html', '/index.html', '/'];
        const currentPage = window.location.pathname;
        
        // Se estiver em uma página protegida e não estiver logado, redireciona
        if (!publicPages.includes(currentPage) && !currentPage.endsWith('index.html') && !currentPage.endsWith('login.html') && !currentPage.endsWith('register.html')) {
            window.location.href = '/login.html';
        }
    }
};

export default auth;
