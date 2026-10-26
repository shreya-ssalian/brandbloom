"use client";
import { useState } from "react";

type Finding = {
  ruleId: string; ruleText: string; quote: string; issue: string;
  severity: "minor" | "serious" | "unverified"; replacement?: string; source: "code" | "ai";
};

const samples = [
  "Our REVOLUTIONARY vegan-friendly snacks are the number one choice in India!! Over 10,000 happy customers.",
  "We're proud to be certified organic. Our packaging is 80% recycled material, and you can taste the difference.",
  "Green Leaf's miracle granola cures bad mornings. Guaranteed results!",
];

const label: Record<string, { name: string; cls: string }> = {
  "Healthy Growth": { name: "Healthy Growth", cls: "bg-green-100 text-green-800" },
  "Needs Pruning": { name: "Needs Pruning", cls: "bg-yellow-100 text-yellow-800" },
  "Needs Care": { name: "Needs Care", cls: "bg-orange-100 text-orange-800" },
};
const sevCls = {
  minor: "bg-yellow-100 text-yellow-800",
  serious: "bg-red-100 text-red-800",
  unverified: "bg-gray-200 text-gray-800",
};

export default function Home() {
  const [text, setText] = useState(samples[0]);
  const [original, setOriginal] = useState("");
  const [status, setStatus] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decisions, setDecisions] = useState<Record<number, "accepted" | "rejected">>({});
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function review() {
    setLoading(true); setError(""); setNote(""); setDecisions({});
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setOriginal(text); setStatus(data.status); setFindings(data.findings); setNote(data.note || "");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  function decide(i: number, d: "accepted" | "rejected") {
    const f = findings[i];
    if (d === "accepted" && f.replacement) setText((t) => t.replace(f.quote, f.replacement!));
    setDecisions((x) => ({ ...x, [i]: d }));
  }

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-green-800">🌱 BrandBloom</h1>
        <p className="text-green-700">Grow consistently. Publish confidently.</p>
        <p className="mt-1 text-sm text-gray-600">
          Brand kit loaded: <b>GreenLeaf Organics</b> (sample). Paste a caption or pick a sample, then click Review.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {samples.map((s, i) => (
            <button key={i} onClick={() => setText(s)}
              className="rounded border border-green-700 px-3 py-1 text-sm text-green-800 hover:bg-green-100">
              Sample {i + 1}
            </button>
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
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 font-semibold ${label[status].cls}`}>{label[status].name}</span>
              <span className="text-sm text-gray-600">
                Automated check complete. Human approval is still required.
              </span>
            </div>
            {note && <p className="mt-2 text-sm text-gray-600">{note}</p>}
            {findings.length === 0 && <p className="mt-3">No issues found.</p>}

            <ul className="mt-3 space-y-3">
              {findings.map((f, i) => (
                <li key={i} className="rounded border bg-white p-4 text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${sevCls[f.severity]}`}>
                      {f.severity === "unverified" ? "UNVERIFIED" : f.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{f.source === "ai" ? "Found by AI" : "Found by rule check"}</span>
                  </div>
                  <p className="mt-2"><b>Text:</b> “{f.quote}”</p>
                  <p>{f.issue}</p>
                  <p className="mt-2 rounded bg-green-50 p-2 text-sm">
                    <b>Source ({f.ruleId}):</b> {f.ruleText}
                  </p>
                  {f.replacement && (
                    <p className="mt-2 text-sm">
                      <b>Suggested fix:</b> <s className="text-red-700">{f.quote}</s> → <span className="text-green-700">{f.replacement}</span>
                    </p>
                  )}
                  {f.severity === "unverified" && (
                    <p className="mt-2 text-sm text-gray-700">No approved source supports this. A human must decide.</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {decisions[i] ? (
                      <span className="text-sm font-semibold">{decisions[i] === "accepted" ? "✅ Accepted" : "❌ Rejected"}</span>
                    ) : (
                      <>
                        {f.replacement && (
                          <button onClick={() => decide(i, "accepted")} className="rounded bg-green-700 px-3 py-1 text-sm text-white">Accept fix</button>
                        )}
                        <button onClick={() => decide(i, "rejected")} className="rounded border px-3 py-1 text-sm">
                          {f.replacement ? "Reject" : "Dismiss"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}