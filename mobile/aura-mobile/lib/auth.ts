// lib/auth.ts
import { loginApi } from "./api";
import { saveToken, getToken, clearToken } from "./storage";

export async function login(email: string, password: string) {
  // Använd vår loginApi som gör POST mot /auth/login
  const res = await loginApi(email, password);

  // backend kan heta token eller access_token – vi stödjer båda
  const token = (res.token || res.access_token) as string;
  if (!token) {
    console.error("Login response missing token:", res);
    throw new Error("No token in response");
  }

  await saveToken(token);
  return res;
}

export { getToken, clearToken };
