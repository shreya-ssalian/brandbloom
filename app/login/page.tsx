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
    <main className="bb-login">
      <section className="bb-login__hero">
        <span className="bb-mark" style={{ width: 48, height: 48 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19c0-7 4-12 14-13 0 9-5 14-12 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19c3-4 6-7 10-9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <h1>Grow consistently. Publish confidently.</h1>
        <p>BrandBloom checks your content against your brand rules before it goes out.</p>
        <ul>
          <li>Every finding points to the brand rule behind it.</li>
          <li>Claims with no approved source are marked Unverified.</li>
          <li>A person approves everything. The AI only suggests.</li>
        </ul>
      </section>

      <section className="bb-login__panel">
        <h2>Try BrandBloom</h2>
        <p className="bb-lead">How to try it: pick a role below, or sign in with your own account. Use Log out to switch roles.</p>

        <button className="bb-role-btn" disabled={busy} onClick={() => go("creator@example.com", demo)}>
          <strong>Try as Creator</strong>
          <span>Write content, get Bud's review and submit it for approval.</span>
        </button>
        <button className="bb-role-btn bb-role-btn--manager" disabled={busy} onClick={() => go("manager@example.com", demo)}>
          <strong>Try as Manager</strong>
          <span>Review the queue, set the brand rules and check guideline health.</span>
        </button>

        <div
          style={{
            marginTop: 14, marginBottom: 14, padding: 12,
            border: "1px solid #B8D8C6", borderRadius: 8,
            background: "#EAF6EF", color: "#1F4D3A", fontSize: 14, lineHeight: 1.6,
          }}
        >
          <strong>Demo accounts for judges</strong> (sample data only)
          <div>Creator: creator@example.com</div>
          <div>Manager: manager@example.com</div>
          <div>Password: {demo || "(set NEXT_PUBLIC_DEMO_PASSWORD)"}</div>
          <div style={{ marginTop: 4 }}>
            Or click a "Try as" button above to sign in with one click.
          </div>
        </div>

        <input className="bb-input" placeholder="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 8 }} />
        <input className="bb-input" placeholder="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 10 }} />
        <button className="bb-btn" disabled={busy} onClick={() => go(email, password)} style={{ width: "100%" }}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
        {error && <p className="bb-error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      </section>
    </main>
  );
}