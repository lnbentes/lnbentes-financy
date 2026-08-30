/**
 * Cliente HTTP unificado para o Portal Administrativo
 */
function getCookie(name) {
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
}

const AdminAPI = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const config = {
            credentials: 'include',
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            if (response.status === 204) {
                return null;
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorMsg = data.error || data.detail || (typeof data === 'string' ? data : 'Erro na requisição');
                throw new Error(errorMsg);
            }
            return data;
        } catch (err) {
            throw err;
        }
    },

    // ── Autenticação ──────────────────────────────────────────
    auth: {
        async login(username, password) {
            return AdminAPI.request('/api/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
        },
        async logout() {
            return AdminAPI.request('/api/auth/logout/', { method: 'POST' });
        },
        async currentUser() {
            const users = await AdminAPI.request('/api/users/');
            const list = Array.isArray(users) ? users : (users.results || []);
            return list.length > 0 ? list[0] : null;
        }
    },

    // ── Estatísticas e Banco de Dados ─────────────────────────
    system: {
        async getStats() {
            return AdminAPI.request('/api/admin/stats/');
        },
        async runDbMaintenance() {
            return AdminAPI.request('/api/admin/db-maintenance/', { method: 'POST' });
        },
        getBackupUrl() {
            return '/api/admin/db-backup/';
        }
    },

    // ── Gestão de Usuários ────────────────────────────────────
    users: {
        async list() {
            const res = await AdminAPI.request('/api/users/');
            return Array.isArray(res) ? res : (res.results || []);
        },
        async create(data) {
            return AdminAPI.request('/api/users/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        async update(id, data) {
            return AdminAPI.request(`/api/users/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },
        async delete(id) {
            return AdminAPI.request(`/api/users/${id}/`, { method: 'DELETE' });
        },
        async toggleActive(id) {
            return AdminAPI.request(`/api/users/${id}/toggle-active/`, { method: 'POST' });
        },
        async toggleStaff(id) {
            return AdminAPI.request(`/api/users/${id}/toggle-staff/`, { method: 'POST' });
        },
        async resetPassword(id, password) {
            return AdminAPI.request(`/api/users/${id}/reset-password/`, {
                method: 'POST',
                body: JSON.stringify({ password })
            });
        }
    },

    // ── Pedidos de Cadastro ───────────────────────────────────
    registrationRequests: {
        async list() {
            const res = await AdminAPI.request('/api/registration-requests/');
            return Array.isArray(res) ? res : (res.results || []);
        },
        async approve(id) {
            return AdminAPI.request(`/api/registration-requests/${id}/approve/`, { method: 'POST' });
        },
        async reject(id) {
            return AdminAPI.request(`/api/registration-requests/${id}/reject/`, { method: 'POST' });
        }
    },

    // ── Finanças da Família ──────────────────────────────────
    familyFinance: {
        async getStats(year, month) {
            let url = '/api/admin/family-finance/';
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            if (month) params.append('month', month);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            return AdminAPI.request(url);
        }
    },

    // ── Notificações ──────────────────────────────────────────
    notifications: {
        async list() {
            const res = await AdminAPI.request('/api/notifications/');
            return Array.isArray(res) ? res : (res.results || []);
        },
        async markAsRead(id) {
            return AdminAPI.request(`/api/notifications/${id}/mark_read/`, { method: 'POST' });
        },
        async markAllAsRead() {
            return AdminAPI.request('/api/notifications/mark_all_read/', { method: 'POST' });
        }
    }
};
