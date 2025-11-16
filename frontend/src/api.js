// lib/api.ts
const API = (
  process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export const API_ORIGIN = API.replace(/\/api$/, "");

export async function okJson(res: Response) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const msg = `${res.status} ${res.statusText}${body ? " — " + body : ""}`;
    console.error("API error:", msg);
    throw new Error(msg);
  }
  return res.json();
}

/* ---------- Auth ---------- */

export async function loginApi(email: string, password: string) {
  return okJson(
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function registerAccount(
  email: string,
  name: string,
  password: string,
  timezone: string
) {
  return okJson(
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, timezone }),
    })
  );
}

/* ---------- Token-based helpers (mobile) ---------- */

export async function searchUsers(token: string, q: string) {
  const r = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Search failed");
  return r.json();
}

export async function getUser(token: string, id: string | number) {
  const r = await fetch(`${API}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("User not found");
  return r.json();
}

export async function requestFriend(token: string, id: string | number) {
  const r = await fetch(`${API}/friends/${id}/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Request failed");
  return r.json();
}

export async function approveFriend(token: string, id: string | number) {
  const r = await fetch(`${API}/friends/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Approve failed");
  return r.json();
}

export async function declineFriend(token: string, id: string | number) {
  const r = await fetch(`${API}/friends/${id}/decline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Decline failed");
  return r.json();
}

export async function getIncomingRequests(token: string) {
  const r = await fetch(`${API}/friends/requests/incoming`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Load requests failed");
  return r.json();
}

export async function getFriends(token: string) {
  const r = await fetch(`${API}/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Load friends failed");
  return r.json();
}

export async function deleteFriend(token: string, id: string | number) {
  const r = await fetch(`${API}/friends/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Delete failed");
  return true;
}

export async function me(token: string) {
  const r = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return okJson(r);
}

export async function inbox(token: string) {
  const r = await fetch(`${API}/pings/inbox`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return okJson(r);
}

export async function createPing(token: string, payload: any) {
  const r = await fetch(`${API}/pings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return okJson(r);
}

export async function respond(token: string, pingId: string | number, status: string) {
  const r = await fetch(`${API}/pings/${pingId}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return okJson(r);
}
