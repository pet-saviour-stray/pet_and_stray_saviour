// Thin fetch wrapper around the backend REST API.
const API_BASE = '/api';
const TOKEN_KEY = 'pss_token';

const Api = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  async request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = Api.getToken();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  },

  get: (path, opts) => Api.request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => Api.request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => Api.request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => Api.request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => Api.request(path, { ...opts, method: 'DELETE' }),

  // Multipart image upload (admin only).
  async uploadImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${API_BASE}/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Api.getToken()}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  },
};

window.Api = Api;
