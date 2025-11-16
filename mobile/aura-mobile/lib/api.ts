// lib/api.ts
const API = "http://192.168.0.102:8000/api".replace(/\/+$/, "");

export async function okJson(res: Response) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const msg = `${res.status} ${res.statusText}${body ? " — " + body : ""}`;
    console.error("API error:", msg);
    throw new Error(msg);
  }
  return res.json();
}

export async function loginApi(email: string, password: string) {
  console.log("POST", `${API}/auth/login`, { email, password });
  return okJson(
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
}
