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
    } catch (e: any) { setError(e.message); }
    setBusyId("");
  }

  const meterCls = (n: number) => (n >= 50 ? "bb-meter--hot" : n >= 25 ? "bb-meter--warm" : "");

  return (
    <main className="bb-page">
      <Header />
      <h2>Guideline Health</h2>
      <p className="bb-lead">
        See which rules creators trip over most. When a rule is often flagged and then sent back for changes, it may be unclear.
        Bud can suggest clearer wording, and a manager decides whether to apply it. Applying creates a new version of the rule.
      </p>

      {error && <p className="bb-error" role="alert">{error}</p>}
      {info && <p className="bb-ok">{info}</p>}
      {rows === null && !error && <p className="bb-muted">Loading...</p>}
      {rows?.length === 0 && (
        <p className="bb-empty">No data yet. Stats appear once creators submit content and a manager approves it or requests changes.</p>
      )}

      {sug && (
        <div className="bb-suggest">
          <h3>Suggested wording for {sug.ruleId}</h3>
          {sug.basedOn && (
            <p className="bb-muted" style={{ margin: "0 0 10px" }}>
              Based on {sug.basedOn.rejectedSubmissions} submission(s) sent back for changes.
            </p>
          )}
          <b>Current</b>
          <p className="bb-old">{sug.current}</p>
          <label htmlFor="draft" className="bb-label">Suggested (you can edit it)</label>
          <textarea id="draft" className="bb-input" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="bb-actions">
            <button className="bb-btn" disabled={busyId !== "" || draft.trim().length < 5} onClick={apply}>
              {busyId === sug.ruleId ? "Applying..." : "Apply as new version"}
            </button>
            <button className="bb-btn bb-btn--quiet" onClick={() => setSug(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bb-two" style={{ marginTop: 0 }}>
        {(rows ?? []).map((r) => (
          <div key={r.ruleId} className="bb-card bb-rule" data-type={r.type}
            style={r.needsAttention ? { borderColor: "#e9b4a2", borderLeftColor: "var(--burnt)" } : undefined}>
            <div className="bb-rule__head">
              <strong>{r.ruleId}</strong>
              <span className="bb-badge bb-badge--muted">{r.type}</span>
              <span className="bb-muted">v{r.version}</span>
              {r.needsAttention && <span className="bb-badge bb-badge--danger">Needs attention</span>}
            </div>
            <div style={{ lineHeight: 1.5 }}>{r.text}</div>
            <div className="bb-stats">
              <div><b>{r.flagged}</b><span>flagged</span></div>
              <div><b>{r.changesRequested}</b><span>sent back</span></div>
              <div><b>{r.approved}</b><span>approved</span></div>
              <div>
                <b>{r.rejectRate}%</b>
                <span className={`bb-meter ${meterCls(r.rejectRate)}`} style={{ width: 80 }} aria-hidden="true">
                  <i style={{ width: `${r.rejectRate}%` }} />
                </span>
              </div>
            </div>
            {r.type === "fact" ? (
              <p className="bb-muted" style={{ margin: 0, fontSize: ".88rem" }}>Facts are edited directly by managers, not reworded by AI.</p>
            ) : (
              <button className="bb-btn bb-btn--quiet" disabled={busyId !== ""} onClick={() => suggest(r.ruleId)}>
                {busyId === r.ruleId ? "Bud is thinking..." : "Suggest clearer wording"}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}