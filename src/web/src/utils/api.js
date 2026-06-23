// API URL — uses /api prefix for both local dev and Vercel production
export const API_URL = import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:3000`
        : ''
);

/**
 * Flag to prevent multiple simultaneous refresh attempts
 */
let isRefreshing = false;
let refreshPromise = null;

/**
 * Attempt to refresh the access token using the refresh token cookie
 */
async function refreshAccessToken() {
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(async (res) => {
            if (!res.ok) {
                throw new Error('Refresh failed');
            }
            const data = await res.json();
            if (data.accessToken) {
                window.__accessToken = data.accessToken;
            }
            return data.accessToken;
        })
        .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

    return refreshPromise;
}

async function request(endpoint, options = {}) {
    // Ensure endpoint starts with /api
    const apiEndpoint = endpoint.startsWith('/api')
        ? endpoint
        : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const url = `${API_URL}${apiEndpoint}`;

    // Build headers with access token
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Attach access token from memory if available
    if (window.__accessToken) {
        headers['Authorization'] = `Bearer ${window.__accessToken}`;
    }

    let response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
    });

    // If 401 with TOKEN_EXPIRED, attempt refresh and retry once
    if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.code === 'TOKEN_EXPIRED' || !window.__accessToken) {
            try {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    // Retry the original request with new token
                    headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(url, {
                        ...options,
                        credentials: 'include',
                        headers,
                    });
                } else {
                    throw new Error(errorData.error || 'Authentication required');
                }
            } catch (refreshError) {
                // Refresh failed — clear token and throw
                window.__accessToken = null;
                throw new Error('Session expired. Please login again.');
            }
        } else {
            throw new Error(errorData.error || 'Authentication required');
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
}

// Auth API
export const auth = {
    register: (email, password, name) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    login: (email, password) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () =>
        request('/auth/logout', { method: 'POST' }),
    me: () =>
        request('/auth/me'),
};

// Tasks API
export const tasks = {
    getByDate: (date) => request(`/tasks?date=${date}`),
    create: (taskData) =>
        request('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
    update: (id, updates) =>
        request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    delete: (id) =>
        request(`/tasks/${id}`, { method: 'DELETE' }),
};

// Metrics API
export const metrics = {
    getMonthly: () => request('/metrics/monthly'),
    getStreaks: () => request('/metrics/streaks'),
    getAnalytics: () => request('/metrics/analytics'),
};

// Settings API
export const settings = {
    get: () => request('/settings'),
    update: (settingsData) =>
        request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) }),
};

// Time Blocks API
export const timeblocks = {
    list: () => request('/timeblocks'),
    create: (data) =>
        request('/timeblocks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
        request(`/timeblocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) =>
        request(`/timeblocks/${id}`, { method: 'DELETE' }),
};
