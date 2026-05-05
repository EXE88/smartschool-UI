const config = window.SMARTSCHOOL_CONFIG || {};
const API_BASE_URL = (config.apiBaseUrl || "http://127.0.0.1:8000").replace(/\/$/, "");
const ACCESS_KEY = "smartschool_access_token";
const REFRESH_KEY = "smartschool_refresh_token";

export function hasToken() {
  return Boolean(localStorage.getItem(ACCESS_KEY));
}

export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function setTokens(data) {
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
}

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function errorMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : JSON.stringify(value)}`)
    .join(" | ") || fallback;
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) return false;
  const data = await response.json();
  localStorage.setItem(ACCESS_KEY, data.access);
  return true;
}

export async function request(path, options = {}, retry = true) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (response.status === 401 && retry && await refreshAccessToken()) {
    return request(path, options, false);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(data, `HTTP ${response.status}`));
  return data;
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(data, "ورود ناموفق بود"));
  setTokens(data);
  return data;
}

export const api = {
  account: () => request(`/api/accounts/me/?limit=${config.dashboardLimit ?? 0}`),
  createScore: (payload) => request("/api/scores/", { method: "POST", body: JSON.stringify(payload) }),
  updateScore: (id, payload) => request(`/api/scores/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteScore: (id) => request(`/api/scores/${id}/`, { method: "DELETE" }),
  createHomework: (payload) => request("/api/homeworks/", { method: "POST", body: JSON.stringify(payload) }),
  updateHomework: (id, payload) => request(`/api/homeworks/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteHomework: (id) => request(`/api/homeworks/${id}/`, { method: "DELETE" }),
  createAttendance: (payload) => request("/api/attendances/", { method: "POST", body: JSON.stringify(payload) }),
  deleteAttendance: (id) => request(`/api/attendances/${id}/`, { method: "DELETE" }),
  createComment: (payload) => request("/api/comments/", { method: "POST", body: JSON.stringify(payload) }),
  updateComment: (id, payload) => request(`/api/comments/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteComment: (id) => request(`/api/comments/${id}/`, { method: "DELETE" }),
};
