// api/http.js - Camada de infraestrutura HTTP com suporte a CSRF

const _http = {
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    },

    async request(url, options = {}) {
        const csrfToken = this.getCookie('csrftoken');
        const merged = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                ...(options.headers || {}),
            },
        };

        const response = await fetch(url, merged);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.detail || 'API Error');
        }
        return data;
    },
};
