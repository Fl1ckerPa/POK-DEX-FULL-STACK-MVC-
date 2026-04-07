const API_URL = 'http://localhost:3000/api';

const api = {
    async get(endpoint) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers
            });
            const data = await response.json();
            if (response.status === 401) {
                data.isUnauthorized = true;
            }
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },

    async post(endpoint, data) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.status === 401) {
                result.isUnauthorized = true;
            }
            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },

    async delete(endpoint) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (response.status === 401) {
                data.isUnauthorized = true;
            }
            return data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

export default api;
