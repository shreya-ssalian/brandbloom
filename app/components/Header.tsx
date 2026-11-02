"use client";
import { useEffect, useState } from "react";
import { getMe, logout, type Me } from "./api";

export default function Header() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    const m = getMe();
    if (!m) { window.location.href = "/login"; return; }
    setMe(m);
  }, []);
  const link = { color: "#0a6b35", marginRight: 14, textDecoration: "none", fontWeight: 600 } as const;
  return (
    <header style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h1 style={{ margin: 0, color: "#0a6b35" }}>🌱 BrandBloom</h1>
        <small>How to try it: switch accounts with Logout, then log in as Creator or Manager.</small>
      </div>
      <nav>
        <a href="/queue" style={link}>Queue</a>
        {me?.role === "manager" && <a href="/brand-roots" style={link}>Brand Roots</a>}
        {me?.role === "manager" && <a href="/health" style={link}>Guideline Health</a>}
        <span style={{ marginRight: 10 }}>{me?.role}</span>
        <button onClick={logout}>Log out</button>
      </nav>
    </header>
  );
}