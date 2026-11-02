"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { api, getMe } from "../components/api";

type Finding = { ruleId: string; quote: string; issue: string; severity: string };
type Sub = {
  id: string; title: string; lane: "fast" | "review" | "escalate"; riskScore: number;
  state: string; findings: Finding[];
};
const LANES: { key: Sub["lane"]; label: string }[] = [
  { key: "escalate", label: "Escalate" },
  { key: "review", label: "Needs review" },
  { key: "fast", label: "Fast lane" },
];

export default function Queue() {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [comment, setComment] = useState<Record<string, string>>({});
  const [canDecide, setCanDecide] = useState(false);

  const load = () => api("/api/submissions").then(setSubs).catch((e) => setError(e.message));
  useEffect(() => {
    setCanDecide(["manager", "reviewer"].includes(getMe()?.role ?? ""));
    load();
  }, []);

  async function decide(id: string, action: "approve" | "changes") {
    setBusyId(id); setError("");
    try {
      await api(`/api/submissions/${id}/decision`, { action, comment: comment[id] ?? "" });
      await load();
    } catch (e: any) { setError(e.message); }
    setBusyId("");
  }

  return (
    <main className="bb" style={{ maxWidth: 1100, margin: "0 auto", padding: 16, background: "#f0fff4", minHeight: "100vh" }}>
      <Header />
      <h2>Approval queue</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {subs === null && !error && <p>Loading...</p>}
      {subs?.length === 0 && <p>Nothing submitted yet.</p>}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {LANES.map((lane) => {
          const items = (subs ?? []).filter((s) => s.lane === lane.key);
          return (
            <section key={lane.key}>
              <h3>{lane.label} ({items.length})</h3>
              {items.length === 0 && <small>Empty</small>}
              {items.map((s) => {
                const unverified = s.findings.some((f) => f.severity === "unverified");
                return (
                  <div key={s.id} style={{ background: "#fff", border: "1px solid #cfe9d6", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    <strong>{s.title}</strong>
                    <div style={{ margin: "6px 0", fontSize: 14 }}>
                      Risk {s.riskScore} · {s.findings.length} finding{s.findings.length === 1 ? "" : "s"}
                      {unverified && (
                        <span style={{ background: "#fde68a", color: "#7a4b00", borderRadius: 4, padding: "1px 6px", marginLeft: 8, fontSize: 12 }}>
                          Unverified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#555" }}>{s.state}</div>
                    {canDecide && s.state === "Pending review" && (
                      <div style={{ marginTop: 8 }}>
                        <input placeholder="Comment (optional)" value={comment[s.id] ?? ""}
                          onChange={(e) => setComment((c) => ({ ...c, [s.id]: e.target.value }))}
                          style={{ width: "100%", padding: 6, marginBottom: 6 }} />
                        <button disabled={busyId === s.id} onClick={() => decide(s.id, "approve")}>Approve</button>{" "}
                        <button className="secondary" disabled={busyId === s.id} onClick={() => decide(s.id, "changes")}>Request changes</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </main>
  );
}