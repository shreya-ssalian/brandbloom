const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Me = { id: string; email?: string; name?: string; role: "creator" | "manager" | "reviewer" };

export const getToken = () =>
  typeof window === "undefined" ? "" : localStorage.getItem("bb_token") ?? "";
export const getMe = (): Me | null => {
  try { return JSON.parse(localStorage.getItem("bb_me") ?? "null"); } catch { return null; }
};
export function logout() {
  localStorage.removeItem("bb_token");
  localStorage.removeItem("bb_me");
  window.location.href = "/login";
}

export async function api(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${getToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(); throw new Error("Session expired. Please sign in again."); }
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export async function login(email: string, password: string): Promise<Me> {
  const res = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error_description ?? d.msg ?? "Login failed");
  localStorage.setItem("bb_token", d.access_token);
  const me = await api("/api/me");
  localStorage.setItem("bb_me", JSON.stringify(me));
  return me;
}