"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, getMe } from "../components/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go(e: string, p: string) {
    setBusy(true); setError("");
    try {
      await login(e, p);
      router.push(getMe()?.role === "manager" ? "/queue" : "/");
    } catch (err: any) { setError(err.message); }
    setBusy(false);
  }

  const demo = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";
    return (
    <main className="bb" style={{ minHeight: "100vh", background: "#f0fff4", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", border: "1px solid #cfe9d6", borderRadius: 12, padding: 24 }}>
        <h1 style={{ margin: 0 }}>🌱 BrandBloom</h1>
        <p style={{ color: "#555", marginTop: 4 }}>Grow consistently. Publish confidently.</p>
        <p style={{ fontSize: 14 }}>How to try it: click a demo button, or sign in with your account.</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 10 }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 10 }} />
        <button disabled={busy} onClick={() => go(email, password)} style={{ width: "100%" }}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <hr style={{ margin: "16px 0", border: 0, borderTop: "1px solid #cfe9d6" }} />
        <button className="secondary" disabled={busy} onClick={() => go("creator@example.com", demo)} style={{ width: "100%", marginBottom: 8 }}>
          Try as Creator
        </button>
        <button className="secondary" disabled={busy} onClick={() => go("manager@example.com", demo)} style={{ width: "100%" }}>
          Try as Manager
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </div>
    </main>
  );
}