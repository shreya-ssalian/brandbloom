"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { api, getMe } from "../components/api";

type Row = {
  ruleId: string; type: string; text: string; version: number;
  flagged: number; changesRequested: number; approved: number;
  rejectRate: number; needsAttention: boolean;
};
type Suggestion = { ruleId: string; current: string; suggestion: string; basedOn?: { rejectedSubmissions: number } };

export default function Health() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyId, setBusyId] = useState("");
  const [sug, setSug] = useState<Suggestion | null>(null);
  const [draft, setDraft] = useState("");

  const load = () =>
    api("/api/brandkit/health").then(setRows).catch((e) => setError(e.message));

  useEffect(() => {
    const me = getMe();
    if (!me) { window.location.href = "/login"; return; }
    if (me.role !== "manager") { window.location.href = "/"; return; }
    load();
  }, []);

  async function suggest(ruleId: string) {
    setBusyId(ruleId); setError(""); setInfo(""); setSug(null);
    try {
      const s = await api("/api/brandkit/health/suggest", { ruleId });
      setSug(s); setDraft(s.suggestion);
    } catch (e: any) {
      const m = String(e.message ?? "");
      setError(/503|429|high demand|timeout/i.test(m)
        ? "Google's AI is busy right now. Please click the button again in a few seconds."
        : m);
    }
    setBusyId("");
  }

  async function apply() {
    if (!sug) return;
    setBusyId(sug.ruleId); setError("");
    try {
      const r = await api("/api/brandkit/health/apply", { ruleId: sug.ruleId, text: draft });
      setInfo(`Rule ${sug.ruleId} updated to v${r.version}. Future reviews use the new wording.`);
      setSug(null);
      await load();
    } catch (e: any) {
      const m = String(e.message ?? "");
      setError(/503|429|high demand|timeout/i.test(m)
        ? "Google's AI is busy right now. Please click the button again in a few seconds."
        : m);
    }
    setBusyId("");
  }

  const bar = (pct: number) => (
    <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, width: 100, display: "inline-block", verticalAlign: "middle" }}>
      <div style={{ width: `${pct}%`, background: pct >= 50 ? "#dc2626" : "#0a8f3c", height: 8, borderRadius: 4 }} />
    </div>
  );

  return (
    <main className="bb" style={{ maxWidth: 1100, margin: "0 auto", padding: 16, background: "#f0fff4", minHeight: "100vh" }}>
      <Header />
      <h2>Guideline Health</h2>
      <p style={{ fontSize: 14, color: "#555" }}>
        Shows which rules creators trip over most. When a rule is often flagged and then sent back for changes,
        it may be unclear. Bud can suggest clearer wording, and a manager decides whether to apply it.
        Applying creates a new version of the rule.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {info && <p style={{ color: "#0a6b35" }}>{info}</p>}
      {rows === null && !error && <p>Loading...</p>}
      {rows?.length === 0 && (
        <p>No data yet. Stats appear after creators submit content and a manager approves or requests changes.</p>
      )}

      {sug && (
        <div style={{ background: "#fff", border: "2px solid #0a8f3c", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Suggested wording for {sug.ruleId}</h3>
          {sug.basedOn && (
            <small style={{ color: "#555" }}>Based on {sug.basedOn.rejectedSubmissions} submission(s) sent back for changes.</small>
          )}
          <p style={{ marginBottom: 4 }}><b>Current:</b></p>
          <p style={{ marginTop: 0, background: "#fef2f2", padding: 8, borderRadius: 6 }}>{sug.current}</p>
          <p style={{ marginBottom: 4 }}><b>Suggested (you can edit it):</b></p>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
            style={{ width: "100%", padding: 8, border: "1px solid #cfe9d6", borderRadius: 6 }} />
          <div style={{ marginTop: 8 }}>
            <button disabled={busyId !== "" || draft.trim().length < 5} onClick={apply}>
              {busyId === sug.ruleId ? "Applying..." : "Apply as new version"}
            </button>{" "}
            <button className="secondary" onClick={() => setSug(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {(rows ?? []).map((r) => (
          <div key={r.ruleId} style={{ background: "#fff", border: `1px solid ${r.needsAttention ? "#fca5a5" : "#cfe9d6"}`, borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <strong>{r.ruleId}</strong>
              <small style={{ color: "#666" }}>{r.type} · v{r.version}</small>
              {r.needsAttention && (
                <span style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 600 }}>
                  Needs attention
                </span>
              )}
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>{r.text}</div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 8 }}>
              Flagged {r.flagged} · Changes requested {r.changesRequested} · Approved {r.approved} · Sent-back rate {r.rejectRate}% {bar(r.rejectRate)}
            </div>
            {r.type === "fact" ? (
              <small style={{ color: "#666" }}>Facts are edited directly by managers, not reworded by AI.</small>
            ) : (
              <button disabled={busyId !== ""} onClick={() => suggest(r.ruleId)}>
                {busyId === r.ruleId ? "Bud is thinking..." : "Suggest clearer wording"}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}