"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { api, getMe } from "../components/api";

type Rule = { id: string; type: string; text: string; status: string; version?: number };

const norm = (r: any): Rule => ({
  id: r.ruleId ?? r.rule_id ?? r.id,
  type: r.type ?? "",
  text: r.text ?? "",
  status: r.status ?? "",
  version: r.version,
});

export default function BrandRoots() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [guidelines, setGuidelines] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [extracting, setExtracting] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = () =>
    api("/api/brandkit")
      .then((d) => setRules((d as any[]).map(norm)))
      .catch((e) => setError(e.message));

  useEffect(() => {
    const me = getMe();
    if (!me) { window.location.href = "/login"; return; }
    if (me.role !== "manager") { window.location.href = "/"; return; }
    load();
  }, []);

  async function extract() {
    setExtracting(true); setError(""); setInfo("");
    try {
      const added = await api("/api/brandkit/extract", { text: guidelines });
      setInfo(`Bud found ${(added as any[]).length} proposed rules. Review them below.`);
      setGuidelines("");
      await load();
    } catch (e: any) { setError(e.message); }
    setExtracting(false);
  }

  async function act(ids: string[], action: "approve" | "reject") {
    setBusyId(ids.length === 1 ? ids[0] : "all"); setError(""); setInfo("");
    try {
      const texts: Record<string, string> = {};
      ids.forEach((id) => { if (edits[id]) texts[id] = edits[id]; });
      await api("/api/brandkit/approve", { ids, action, texts });
      await load();
    } catch (e: any) { setError(e.message); }
    setBusyId("");
  }

  const proposed = (rules ?? []).filter((r) => r.status === "proposed");
  const approved = (rules ?? []).filter((r) => r.status === "approved");

  return (
    <main className="bb-page">
      <Header />
      <h2>Brand Roots</h2>
      <p className="bb-lead">
        Paste your brand guidelines and Bud proposes rules. Nothing is used in reviews until a person approves it.
        Only approved rules are used when content is checked.
      </p>

      <div className="bb-card">
        <label htmlFor="guidelines" className="bb-label">Brand guidelines</label>
        <textarea id="guidelines" className="bb-input" rows={6} value={guidelines}
          onChange={(e) => setGuidelines(e.target.value)}
          placeholder="Paste your guidelines here (20 to 15,000 characters)" />
        <div className="bb-actions">
          <button className="bb-btn" disabled={extracting || guidelines.trim().length < 20} onClick={extract}>
            {extracting ? "Bud is reading... (up to 30 seconds)" : "Extract rules"}
          </button>
          <span className="bb-muted">{guidelines.length.toLocaleString()} / 15,000 characters</span>
        </div>
      </div>

      {error && <p className="bb-error" role="alert" style={{ marginTop: 16 }}>{error}</p>}
      {info && <p className="bb-ok" style={{ marginTop: 16 }}>{info}</p>}
      {rules === null && !error && <p className="bb-muted">Loading rules...</p>}

      <div className="bb-two">
        <section>
          <h3>Proposed by Bud ({proposed.length})</h3>
          {proposed.length > 1 && (
            <div className="bb-actions" style={{ marginBottom: 12 }}>
              <button className="bb-btn" disabled={busyId !== ""} onClick={() => act(proposed.map((r) => r.id), "approve")}>
                Approve all
              </button>
            </div>
          )}
          {proposed.length === 0 && <p className="bb-empty">Nothing waiting. Paste guidelines above to get proposed rules.</p>}
          {proposed.map((r) => (
            <div key={r.id} className="bb-card bb-rule" data-type={r.type}>
              <div className="bb-rule__head">
                <span className="bb-badge bb-badge--muted">{r.type}</span>
                <span className="bb-muted">{r.id}</span>
              </div>
              <textarea className="bb-input" rows={3} value={edits[r.id] ?? r.text} aria-label={`Rule ${r.id} text`}
                onChange={(e) => setEdits((x) => ({ ...x, [r.id]: e.target.value }))} />
              <div className="bb-actions">
                <button className="bb-btn" disabled={busyId !== ""} onClick={() => act([r.id], "approve")}>Approve</button>
                <button className="bb-btn bb-btn--quiet" disabled={busyId !== ""} onClick={() => act([r.id], "reject")}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Approved rules ({approved.length})</h3>
          {approved.length === 0 && rules !== null && <p className="bb-empty">No approved rules yet.</p>}
          {approved.map((r) => (
            <div key={r.id} className="bb-card bb-rule" data-type={r.type}>
              <div className="bb-rule__head">
                <span className="bb-badge bb-badge--muted">{r.type}</span>
                <span className="bb-muted">{r.id}{r.version ? ` · v${r.version}` : ""}</span>
              </div>
              <div style={{ lineHeight: 1.5 }}>{r.text}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}