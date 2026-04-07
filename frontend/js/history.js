import api from './api.js';
import ui from './ui.js';

const history = {
    async init() {
        console.log('Initializing history page...');
        this.updateUserDisplay();
        
        if (window.lucide) {
            window.lucide.createIcons();
        }

        await this.loadHistory();
    },

    async loadHistory() {
        try {
            const result = await api.get('/history');
            if (result.success) {
                this.render(result.data);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    render(items) {
        const container = document.querySelector('.history-content-area');
        if (!container) return;

        if (!items || items.length === 0) {
            // Keep empty state
            return;
        }

        // Hide empty state
        document.querySelector('.history-empty-state')?.classList.add('hidden');

        // Create grid
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        grid.innerHTML = items.map((item, index) => {
            const date = new Date(item.viewed_at);
            const timeAgo = this.getTimeAgo(date);
            
            return `
                <div class="glass-card p-4 flex items-center gap-4 hover:scale-[1.02] transition-all cursor-pointer" 
                     onclick="location.href='details.html?id=${item.id}'">
                    <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center p-2">
                        <img src="${item.image_url}" alt="${item.name}" class="w-full h-full object-contain">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-gray-800 capitalize truncate">${item.name}</h3>
                        <div class="flex gap-1 mt-1">
                            ${item.types.map(t => `<span class="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase bg-type-${t} text-white">${t}</span>`).join('')}
                        </div>
                        <p class="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            ${timeAgo}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        container.appendChild(grid);
        if (window.lucide) window.lucide.createIcons();
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    },

    updateUserDisplay() {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            const nameEl = document.getElementById('user-name');
            const emailEl = document.getElementById('user-email');
            if (nameEl) nameEl.textContent = user.username || 'Usuário';
            if (emailEl) emailEl.textContent = user.email || 'email@exemplo.com';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => history.init());
