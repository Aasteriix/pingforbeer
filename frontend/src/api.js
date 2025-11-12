const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/,"");
export const API_ORIGIN = API.replace(/\/api$/,""); // <-- add this

export const setToken = (t) => localStorage.setItem("token", t);
export const getToken = () => localStorage.getItem("token");

function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` };
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

export async function me(){ return okJson(await fetch(`${API}/me`, { headers: authHeaders() })); }
export async function friends(){ return okJson(await fetch(`${API}/friends`, { headers: authHeaders() })); }
export async function requestFriend(id){ return okJson(await fetch(`${API}/friends/${id}/request`, { method:"POST", headers: authHeaders() })); }
export async function approveFriend(id){ return okJson(await fetch(`${API}/friends/${id}/approve`, { method:"POST", headers: authHeaders() })); }
export async function createPing(payload){
  return okJson(await fetch(`${API}/pings`, { method:"POST", headers: authHeaders(), body: JSON.stringify(payload) }));
}
export async function inbox(){ return okJson(await fetch(`${API}/pings/inbox`, { headers: authHeaders() })); }
export async function respond(pingId,status){
  return okJson(await fetch(`${API}/pings/${pingId}/respond`, { method:"POST", headers: authHeaders(), body: JSON.stringify({ status }) }));
}
