// src/api.js
const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/,"");
export const API_ORIGIN = API.replace(/\/api$/,"");

export const setToken = (t) => localStorage.setItem("token", t);
export const getToken = () => localStorage.getItem("token");

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

async function okJson(res) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const msg = `${res.status} ${res.statusText}${body ? " — " + body : ""}`;
    console.error("API error:", msg);
    throw new Error(msg);
  }
  return res.json();
}

/* ---------- Auth ---------- */
export async function registerAccount(email, name, password, timezone) {
  return okJson(await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password, timezone })
  }));
}

export async function login(email, password) {
  return okJson(await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }));
}

/* ---------- Users (token-arg) ---------- */
export async function searchUsers(token, q) {
  const r = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Search failed");
  return r.json();
}

export async function getUser(token, id) {
  const r = await fetch(`${API}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("User not found");
  return r.json();
}

/* ---------- Friends (token-arg) ---------- */
export async function requestFriend(token, id) {
  const r = await fetch(`${API}/friends/${id}/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Request failed");
  return r.json();
}

export async function approveFriend(token, id) {
  const r = await fetch(`${API}/friends/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Approve failed");
  return r.json();
}

export async function declineFriend(token, id) {
  const r = await fetch(`${API}/friends/${id}/decline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Decline failed");
  return r.json();
}

export async function getIncomingRequests(token) {
  const r = await fetch(`${API}/friends/requests/incoming`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Load requests failed");
  return r.json();
}

export async function getFriends(token) {
  const r = await fetch(`${API}/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Load friends failed");
  return r.json();
}

/* ---------- Legacy helpers (localStorage token) ---------- */
/* kept to avoid breaking existing pages like Dashboard/CreatePing */
export async function me() {
  return okJson(await fetch(`${API}/me`, { headers: authHeaders() }));
}
export async function friends() {
  return okJson(await fetch(`${API}/friends`, { headers: authHeaders() }));
}
// NOTE: removed duplicate requestFriend/approveFriend here
export async function createPing(payload) {
  return okJson(await fetch(`${API}/pings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }));
}
export async function inbox() {
  return okJson(await fetch(`${API}/pings/inbox`, { headers: authHeaders() }));
}
export async function respond(pingId, status) {
  return okJson(await fetch(`${API}/pings/${pingId}/respond`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status })
  }));
}

/* ---------- Logout ---------- */
export function logout() {
  localStorage.removeItem("token");
}

/* ---------- Compatibility aliases ---------- */
export { registerAccount as register };


export async function deleteFriend(token, id) {
  const r = await fetch(`${API}/friends/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Delete failed");
  return true;
}

