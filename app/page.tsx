"use client";
import { useEffect, useState } from "react";
import ImageCheck from "./ImageCheck";
import Insights, { makeSeed } from "./Insights";

type Finding = {
  ruleId: string; ruleText: string; quote: string; issue: string;
  severity: "minor" | "serious" | "unverified"; replacement?: string; source: "code" | "ai";
};
type Decision = "accepted" | "rejected";
type Event = { time: string; actor: string; action: string; comment?: string };
type Submission = {
  id: string; version: number; text: string; reviewStatus: string;
  findings: (Finding & { decision?: Decision })[];
  state: "Pending review" | "Changes requested" | "Approved to Bloom";
  history: Event[];
};

const samples = [
  "Our REVOLUTIONARY vegan-friendly snacks are the number one choice in India!! Over 10,000 happy customers.",
  "We're proud to be certified organic. Our packaging is 80% recycled material, and you can taste the difference.",
  "Green Leaf's miracle granola cures bad mornings. Guaranteed results!",
];
const label: Record<string, string> = {
  "Healthy Growth": "bg-green-100 text-green-800",
  "Needs Pruning": "bg-yellow-100 text-yellow-800",
  "Needs Care": "bg-orange-100 text-orange-800",
};
const sevCls = {
  minor: "bg-yellow-100 text-yellow-800",
  serious: "bg-red-100 text-red-800",
  unverified: "bg-gray-200 text-gray-800",
};
const stateCls = {
  "Pending review": "bg-blue-100 text-blue-800",
  "Changes requested": "bg-orange-100 text-orange-800",
  "Approved to Bloom": "bg-green-200 text-green-900",
};
const stateNote = {
  "Pending review": "Human review required",
  "Changes requested": "Creator must revise",
  "Approved to Bloom": "Approved by a human reviewer",
};

export default function Home() {
  const [role, setRole] = useState<"creator" | "manager" | "insights">("creator");
  const [text, setText] = useState(samples[0]);
  const [status, setStatus] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("brandbloom-subs");
      if (raw) setSubs(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("brandbloom-subs", JSON.stringify(subs)); } catch {}
  }, [subs, loaded]);

  const now = () => new Date().toLocaleString();

  async function review() {
    setLoading(true); setError(""); setNote(""); setDecisions({});
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setStatus(data.status); setFindings(data.findings); setNote(data.note || "");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  function decide(i: number, d: Decision) {
    const f = findings[i];
    if (d === "accepted" && f.replacement) setText((t) => t.replace(f.quote, f.replacement!));
    setDecisions((x) => ({ ...x, [i]: d }));
  }

  function submitForApproval() {
    const snapshot = findings.map((f, i) => ({ ...f, decision: decisions[i] }));
    if (editingId) {
      setSubs((all) => all.map((s) => s.id === editingId ? {
        ...s, version: s.version + 1, text, reviewStatus: status, findings: snapshot,
        state: "Pending review",
        history: [...s.history, { time: now(), actor: "Creator", action: `Submitted revision v${s.version + 1}` }],
      } : s));
    } else {
      const s: Submission = {
        id: String(Date.now()), version: 1, text, reviewStatus: status, findings: snapshot,
        state: "Pending review",
        history: [{ time: now(), actor: "Creator", action: "Submitted v1 for approval" }],
      };
      setSubs((all) => [s, ...all]);
    }
    setEditingId(null); setStatus(""); setFindings([]); setDecisions({});
  }

  function managerAct(id: string, action: "approve" | "changes") {
    const c = (comments[id] || "").trim();
    if (action === "changes" && !c) { alert("Please add a comment explaining what to change."); return; }
    setSubs((all) => all.map((s) => s.id === id ? {
      ...s,
      state: action === "approve" ? "Approved to Bloom" : "Changes requested",
      history: [...s.history, {
        time: now(), actor: "Manager",
        action: action === "approve" ? "Approved" : "Requested changes", comment: c || undefined,
      }],
    } : s));
    setComments((x) => ({ ...x, [id]: "" }));
  }

  function revise(s: Submission) {
    setEditingId(s.id); setText(s.text); setStatus(""); setFindings([]); setDecisions({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const History = ({ s }: { s: Submission }) => (
    <ul className="mt-2 space-y-1 border-l-2 border-green-300 pl-3 text-xs text-gray-700">
      {s.history.map((h, i) => (
        <li key={i}><b>{h.actor}</b>: {h.action} <span className="text-gray-500">({h.time})</span>
          {h.comment && <div className="italic">“{h.comment}”</div>}
        </li>
      ))}
    </ul>
  );

  const open = (s: Submission) => s.findings.filter((f) => !f.decision).length;

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-800">🌱 BrandBloom</h1>
            <p className="text-green-700">Grow consistently. Publish confidently.</p>
          </div>
          <div className="rounded border bg-white p-1 text-sm">
            <span className="px-2 text-gray-500">Demo role:</span>
            {(["creator", "manager", "insights"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`rounded px-3 py-1 capitalize ${role === r ? "bg-green-700 text-white" : "text-green-800"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Brand kit loaded: <b>GreenLeaf Organics</b> (sample). AI findings are suggestions only. A human makes every final decision.
        </p>

        {role === "creator" && (
          <>
            {editingId && <p className="mt-3 rounded bg-orange-100 p-2 text-sm text-orange-900">Editing a submission after requested changes. Review again, then resubmit.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {samples.map((s, i) => (
                <button key={i} onClick={() => setText(s)}
                  className="rounded border border-green-700 px-3 py-1 text-sm text-green-800 hover:bg-green-100">Sample {i + 1}</button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
              className="mt-3 w-full rounded border p-3 text-gray-900" />
            <button onClick={review} disabled={loading}
              className="mt-2 rounded bg-green-700 px-5 py-2 font-semibold text-white disabled:opacity-50">
              {loading ? "Bud is reviewing..." : "Review with Bud"}
            </button>
            {error && <p className="mt-2 text-red-700">{error}</p>}

            {status && (
              <section className="mt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 font-semibold ${label[status]}`}>{status}</span>
                  <span className="text-sm text-gray-600">Automated check complete. Human approval is still required.</span>
                </div>
                {note && <p className="mt-2 text-sm text-gray-600">{note}</p>}
                {findings.length === 0 && <p className="mt-3">No issues found.</p>}
                <ul className="mt-3 space-y-3">
                  {findings.map((f, i) => (
                    <li key={i} className="rounded border bg-white p-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${sevCls[f.severity]}`}>{f.severity.toUpperCase()}</span>
                        <span className="text-xs text-gray-500">{f.source === "ai" ? "Found by AI" : "Found by rule check"}</span>
                      </div>
                      <p className="mt-2"><b>Text:</b> “{f.quote}”</p>
                      <p>{f.issue}</p>
                      <p className="mt-2 rounded bg-green-50 p-2 text-sm"><b>Source ({f.ruleId}):</b> {f.ruleText}</p>
                      {f.replacement && (
                        <p className="mt-2 text-sm"><b>Suggested fix:</b> <s className="text-red-700">{f.quote}</s> → <span className="text-green-700">{f.replacement}</span></p>
                      )}
                      {f.severity === "unverified" && <p className="mt-2 text-sm text-gray-700">No approved source supports this. A human must decide.</p>}
                      <div className="mt-3 flex gap-2">
                        {decisions[i] ? (
                          <span className="text-sm font-semibold">{decisions[i] === "accepted" ? "✅ Accepted" : "❌ Rejected"}</span>
                        ) : (
                          <>
                            {f.replacement && <button onClick={() => decide(i, "accepted")} className="rounded bg-green-700 px-3 py-1 text-sm text-white">Accept fix</button>}
                            <button onClick={() => decide(i, "rejected")} className="rounded border px-3 py-1 text-sm">{f.replacement ? "Reject" : "Dismiss"}</button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <button onClick={submitForApproval}
                  className="mt-4 rounded bg-green-900 px-5 py-2 font-semibold text-white">
                  {editingId ? "Resubmit for approval" : "Submit for approval"}
                </button>
              </section>
            )}

            <ImageCheck />

            <h2 className="mt-10 text-xl font-bold text-green-800">Your submissions</h2>
            {subs.length === 0 && <p className="mt-2 text-sm text-gray-600">Nothing submitted yet.</p>}
            <ul className="mt-2 space-y-3">
              {subs.map((s) => (
                <li key={s.id} className="rounded border bg-white p-4 text-gray-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${stateCls[s.state]}`}>{s.state}</span>
                    <span className="text-xs text-gray-600">{stateNote[s.state]} · v{s.version}</span>
                  </div>
                  <p className="mt-2 text-sm">{s.text}</p>
                  <History s={s} />
                  {s.state === "Changes requested" && (
                    <button onClick={() => revise(s)} className="mt-3 rounded bg-green-700 px-3 py-1 text-sm text-white">Revise this content</button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {role === "manager" && (
          <>
            <h2 className="mt-6 text-xl font-bold text-green-800">Approval queue</h2>
            {subs.length === 0 && <p className="mt-2 text-sm text-gray-600">No submissions yet. Switch to Creator, review some content, and submit it.</p>}
            <ul className="mt-2 space-y-3">
              {subs.map((s) => (
                <li key={s.id} className="rounded border bg-white p-4 text-gray-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${stateCls[s.state]}`}>{s.state}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${label[s.reviewStatus] || ""}`}>Bud: {s.reviewStatus}</span>
                    <span className="text-xs text-gray-600">v{s.version}</span>
                  </div>
                  <p className="mt-2">{s.text}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {s.findings.length} findings · {open(s)} not resolved by the creator ·{" "}
                    {s.findings.filter((f) => f.severity === "unverified").length} unverified claim(s)
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {s.findings.map((f, i) => (
                      <li key={i} className="rounded bg-green-50 p-2">
                        <b>{f.severity.toUpperCase()}</b> “{f.quote}”: {f.issue} <span className="text-gray-600">[{f.ruleId}]</span>{" "}
                        <b>{f.decision === "accepted" ? "✅ fix accepted" : f.decision === "rejected" ? "❌ rejected" : "⚠️ open"}</b>
                      </li>
                    ))}
                  </ul>
                  <History s={s} />
                  {s.state === "Pending review" && (
                    <div className="mt-3">
                      <textarea value={comments[s.id] || ""} onChange={(e) => setComments((x) => ({ ...x, [s.id]: e.target.value }))}
                        placeholder="Add a comment (required when requesting changes)" rows={2}
                        className="w-full rounded border p-2 text-sm" />
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => managerAct(s.id, "approve")} className="rounded bg-green-700 px-3 py-1 text-sm text-white">Approve</button>
                        <button onClick={() => managerAct(s.id, "changes")} className="rounded border border-orange-600 px-3 py-1 text-sm text-orange-800">Request changes</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {role === "insights" && (
          <Insights
            subs={subs}
            onSeed={() => setSubs((all) => [...makeSeed(), ...all.filter((s) => !String(s.id).startsWith("seed-"))])}
            onClear={() => setSubs([])}
          />
        )}
      </div>
    </main>
  );
}