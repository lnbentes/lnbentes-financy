// api/modules/auth.js - Autenticação
// Depende de: api/http.js (_http)

const _apiAuth = {
    login: (username, password) =>
        _http.request('/api/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
    logout: () =>
        _http.request('/api/auth/logout/', { method: 'POST' }),
};
