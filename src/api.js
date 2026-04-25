// API client para FusionCore backend
const API_URL = import.meta.env.VITE_API_URL || 'https://fusioncore.space';

const getToken = () => localStorage.getItem('fc_access_token');
const getRefreshToken = () => localStorage.getItem('fc_refresh_token');

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  localStorage.setItem('fc_access_token', data.access_token);
  localStorage.setItem('fc_refresh_token', data.refresh_token);
  return data.access_token;
};

const apiFetch = async (path, options = {}) => {
  let token = getToken();
  const makeRequest = (t) => fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...options.headers,
    },
  });

  let res = await makeRequest(token);

  if (res.status === 401 && getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await makeRequest(token);
    } catch {
      localStorage.removeItem('fc_access_token');
      localStorage.removeItem('fc_refresh_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'API Error'), { status: res.status, data });
  return data;
};

export const api = {
  auth: {
    register: (username, email, password) =>
      apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    login: (email, password) =>
      apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    refresh: (refresh_token) =>
      apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  },
  profile: {
    get: () => apiFetch('/api/profile'),
    update: (data) => apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
    reputation: (userId) => apiFetch(`/api/profile/${userId}/reputation`),
    search: (q) => apiFetch(`/api/profile/search?q=${encodeURIComponent(q)}`),
    getById: (id) => apiFetch(`/api/profile/${id}`),
  },
  reputation: {
    event: (action_type, metadata) =>
      apiFetch('/api/reputation/event', { method: 'POST', body: JSON.stringify({ action_type, metadata }) }),
    leaderboard: () => apiFetch('/api/reputation/leaderboard'),
    actions: () => apiFetch('/api/reputation/actions'),
  },
  communities: {
    list: () => apiFetch('/api/communities'),
    create: (data) => apiFetch('/api/communities', { method: 'POST', body: JSON.stringify(data) }),
    join: (id) => apiFetch(`/api/communities/${id}/join`, { method: 'POST' }),
    channels: (id) => apiFetch(`/api/communities/${id}/channels`),
    createChannel: (id, data) =>
      apiFetch(`/api/communities/${id}/channels`, { method: 'POST', body: JSON.stringify(data) }),
  },
  channels: {
    messages: (id, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/api/channels/${id}/messages${qs ? '?' + qs : ''}`);
    },
    sendMessage: (id, content, file_url = null, file_type = null) =>
      apiFetch(`/api/channels/${id}/messages`, { method: 'POST', body: JSON.stringify({ content, file_url, file_type }) }),
    editMessage: (msgId, content) =>
      apiFetch(`/api/messages/${msgId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    deleteMessage: (msgId) =>
      apiFetch(`/api/messages/${msgId}`, { method: 'DELETE' }),
    reactMessage: (msgId, reaction) =>
      apiFetch(`/api/messages/${msgId}/reactions`, { method: 'POST', body: JSON.stringify({ reaction }) }),
  },
  nova: {
    chat: (messages, personality = 'gamer', global_memory = '', custom_instructions = '') =>
      apiFetch('/api/nova/chat', { method: 'POST', body: JSON.stringify({ messages, personality, global_memory, custom_instructions }) }),
    extractMemory: (message, current_memory = '') =>
      apiFetch('/api/nova/extract-memory', { method: 'POST', body: JSON.stringify({ message, current_memory }) }),
  },
  dm: {
    sendRequest: (receiver_id) =>
      apiFetch('/api/dm/request', { method: 'POST', body: JSON.stringify({ receiver_id }) }),
    getRequests: () => apiFetch('/api/dm/requests'),
    respondRequest: (id, action) =>
      apiFetch(`/api/dm/requests/${id}/${action}`, { method: 'POST' }),
    getConversations: () => apiFetch('/api/dm/conversations'),
    getMessages: (userId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/api/dm/${userId}/messages${qs ? '?' + qs : ''}`);
    },
    sendMessage: (userId, content, file_url = null, file_type = null) =>
      apiFetch(`/api/dm/${userId}/messages`, { method: 'POST', body: JSON.stringify({ content, file_url, file_type }) }),
    markRead: (userId) =>
      apiFetch(`/api/dm/${userId}/read`, { method: 'POST' }),
    editMessage: (msgId, content) =>
      apiFetch(`/api/dm/messages/${msgId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
    deleteMessage: (msgId) =>
      apiFetch(`/api/dm/messages/${msgId}`, { method: 'DELETE' }),
    reactMessage: (msgId, reaction) =>
      apiFetch(`/api/dm/messages/${msgId}/reactions`, { method: 'POST', body: JSON.stringify({ reaction }) }),
  },
  friends: {
    getAll: () => apiFetch('/api/friends'),
    getRequests: () => apiFetch('/api/friends/requests'),
    sendRequest: (receiver_id) =>
      apiFetch('/api/friends/request', { method: 'POST', body: JSON.stringify({ receiver_id }) }),
    accept: (id) => apiFetch(`/api/friends/${id}/accept`, { method: 'POST' }),
    reject: (id) => apiFetch(`/api/friends/${id}/reject`, { method: 'POST' }),
    remove: (friendId) => apiFetch(`/api/friends/${friendId}`, { method: 'DELETE' }),
    status: (userId) => apiFetch(`/api/friends/status/${userId}`),
  },
};

export default api;
