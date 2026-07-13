// api/index.js - Agregador de serviços de API
// Depende de: api/http.js + api/modules/*.js (carregados antes via base.html)

const api = {
    users:    _apiUsers,
    auth:     _apiAuth,
    tasks:    _apiTasks,
    finance:  _apiFinance,
    places:   _apiPlaces,
    events:   _apiEvents,
};
