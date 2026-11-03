"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMe, logout, type Me } from "./api";

export default function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const path = usePathname();

  useEffect(() => {
    const m = getMe();
    if (!m) { window.location.href = "/login"; return; }
    setMe(m);
  }, []);

  const links =
    me?.role === "creator"
      ? [{ href: "/", label: "My content" }]
      : me
      ? [
          { href: "/queue", label: "Queue" },
          ...(me.role === "manager"
            ? [{ href: "/brand-roots", label: "Brand Roots" }, { href: "/health", label: "Guideline Health" }]
            : []),
        ]
      : [];

  return (
    <header className="bb-header">
      <Link href={me?.role === "creator" ? "/" : "/queue"} className="bb-brand">
        <span className="bb-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19c0-7 4-12 14-13 0 9-5 14-12 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19c3-4 6-7 10-9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span>
          <strong>BrandBloom</strong>
          <small>How to try it: log out, then log in as Creator or Manager.</small>
        </span>
      </Link>
      <nav className="bb-nav" aria-label="Main">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="bb-link" aria-current={path === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        {me && <span className="bb-role">{me.role}</span>}
        <button className="bb-btn bb-btn--quiet" onClick={logout}>Log out</button>
      </nav>
    </header>
  );
}