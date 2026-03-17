const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const AUTH_URL = API_URL.replace(/\/api$/, "/api/auth");

function getSessionToken() {
  return localStorage.getItem("tof-session-token") || "";
}

export async function api(path, options = {}) {
  const token = getSessionToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-demo-user": localStorage.getItem("tof-demo-user") || "demo-user",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function authApi(path, options = {}) {
  const token = getSessionToken();
  const response = await fetch(`${AUTH_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function setSessionToken(token) {
  if (token) {
    localStorage.setItem("tof-session-token", token);
  } else {
    localStorage.removeItem("tof-session-token");
  }
}

export function getAuthUrl() {
  return `${AUTH_URL}/discord`;
}

export { API_URL };
