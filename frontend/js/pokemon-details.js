import auth from '../js/auth.js';
import ui from '../js/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    const user = auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        // Redirect to dashboard with the panel open (optional)
        // or just show it here on a blurred background
        // For consistency with the "slide-in" requirement, 
        // we'll redirect to dashboard with a query param
        window.location.href = `dashboard.html?pokemonId=${id}`;
    } else {
        window.location.href = 'dashboard.html';
    }
});
