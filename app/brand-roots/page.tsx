"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { api, getMe } from "../components/api";

type Rule = { id: string; type: string; text: string; status: string; version?: number };

// Accepts different field names from toRule so a naming difference doesn't break the page
const norm = (r: any): Rule => ({
  id: r.ruleId ?? r.rule_id ?? r.id,
  type: r.type ?? "",
  text: r.text ?? "",
  status: r.status ?? "",
  version: r.version,
});

const typeColor: Record<string, string> = {
  voice: "#dbeafe", terminology: "#ede9fe", fact: "#dcfce7", claims: "#fee2e2", accessibility: "#fef3c7",
};

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

  const badge = (t: string) => (
    <span style={{ background: typeColor[t] ?? "#eee", borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 600 }}>
      {t}
    </span>
  );

  return (
    <main className="bb" style={{ maxWidth: 1100, margin: "0 auto", padding: 16, background: "#f0fff4", minHeight: "100vh" }}>
      <Header />
      <h2>Brand Roots</h2>
      <p style={{ fontSize: 14, color: "#555" }}>
        Paste your brand guidelines. Bud proposes rules, and nothing is used for reviews until a human approves it.
        Only approved rules are used when content is checked.
      </p>

      <div style={{ background: "#fff", border: "1px solid #cfe9d6", borderRadius: 8, padding: 12, marginBottom: 20 }}>
        <textarea
          value={guidelines} onChange={(e) => setGuidelines(e.target.value)} rows={6}
          placeholder="Paste brand guidelines text here (20 to 15,000 characters)"
          style={{ width: "100%", padding: 8, border: "1px solid #cfe9d6", borderRadius: 8 }}
        />
        <button disabled={extracting || guidelines.trim().length < 20} onClick={extract} style={{ marginTop: 8 }}>
          {extracting ? "Bud is reading... (up to 30 seconds)" : "Extract rules"}
        </button>
        <small style={{ marginLeft: 10, color: "#555" }}>{guidelines.length} / 15,000</small>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {info && <p style={{ color: "#0a6b35" }}>{info}</p>}
      {rules === null && !error && <p>Loading...</p>}

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <section>
          <h3>Proposed by Bud ({proposed.length})</h3>
          {proposed.length > 1 && (
            <button disabled={busyId !== ""} onClick={() => act(proposed.map((r) => r.id), "approve")} style={{ marginBottom: 10 }}>
              Approve all
            </button>
          )}
          {proposed.length === 0 && <small>Nothing waiting. Paste guidelines above to propose rules.</small>}
          {proposed.map((r) => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #cfe9d6", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ marginBottom: 6 }}>{badge(r.type)} <small style={{ color: "#666" }}>{r.id}</small></div>
              <textarea
                value={edits[r.id] ?? r.text} rows={3}
                onChange={(e) => setEdits((x) => ({ ...x, [r.id]: e.target.value }))}
                style={{ width: "100%", padding: 6, border: "1px solid #cfe9d6", borderRadius: 6 }}
              />
              <div style={{ marginTop: 6 }}>
                <button disabled={busyId !== ""} onClick={() => act([r.id], "approve")}>Approve</button>{" "}
                <button className="secondary" disabled={busyId !== ""} onClick={() => act([r.id], "reject")}>Reject</button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h3>Approved rules ({approved.length})</h3>
          {approved.length === 0 && <small>No approved rules yet.</small>}
          {approved.map((r) => (
            <div key={r.id} style={{ background: "#fff", border: "1px solid #cfe9d6", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ marginBottom: 4 }}>
                {badge(r.type)} <small style={{ color: "#666" }}>{r.id}{r.version ? ` · v${r.version}` : ""}</small>
              </div>
              <div style={{ fontSize: 14 }}>{r.text}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}