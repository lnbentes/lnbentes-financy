// api/modules/users.js - Usuários
// Depende de: api/http.js (_http)

const _apiUsers = {
    list: () => _http.request('/api/users/'),
};
