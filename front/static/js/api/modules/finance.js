// api/modules/finance.js - Financeiro (transações, contas, categorias)
// Depende de: api/http.js (_http)

const _apiFinance = {
    transactions: {
        list: (params = {}) => {
            const query = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
                )
            ).toString();
            return _http.request(`/api/transactions/${query ? '?' + query : ''}`);
        },
        create: (data)      => _http.request('/api/transactions/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data)  => _http.request(`/api/transactions/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
        patch:  (id, data)  => _http.request(`/api/transactions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id)        => _http.request(`/api/transactions/${id}/`, { method: 'DELETE' }),
        summary: (params = {}) => {
            const query = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
                )
            ).toString();
            return _http.request(`/api/transactions/summary/${query ? '?' + query : ''}`);
        },
        export: (params = {}) => {
            const query = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
                )
            ).toString();
            return `/api/transactions/export/${query ? '?' + query : ''}`;
        },
        import: async (formData) => {
            const response = await fetch('/api/transactions/import/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': _http.getCookie('csrftoken') },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.detail || 'Erro na importação');
            return data;
        },
        importJson: (payload) => _http.request('/api/transactions/import/', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
        bulkDelete: (body) => _http.request('/api/transactions/bulk-delete/', {
            method: 'DELETE',
            body: JSON.stringify(body),
        }),
    },

    accounts: {
        list:   ()          => _http.request('/api/accounts/'),
        create: (data)      => _http.request('/api/accounts/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data)  => _http.request(`/api/accounts/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)        => _http.request(`/api/accounts/${id}/`, { method: 'DELETE' }),
    },

    categories: {
        list:   ()          => _http.request('/api/categories/'),
        create: (data)      => _http.request('/api/categories/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data)  => _http.request(`/api/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id)        => _http.request(`/api/categories/${id}/`, { method: 'DELETE' }),
    },
};
