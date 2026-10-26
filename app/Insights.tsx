"use client";
import { brandKit } from "@/data/brandkit";

type Sub = any;

export function makeSeed(): Sub[] {
  const when = new Date().toLocaleString();
  const rule = (id: string) =>
    id === "V1" ? brandKit.voice.rules[0].rule :
    id === "V2" ? brandKit.voice.rules[1].rule :
    id === "T1" ? "Use \"plant-based\" instead of \"vegan-friendly\", \"100% vegan\". Our products are labelled plant-based." :
    brandKit.claimsPolicy.rule;
  const f = (ruleId: string, quote: string, severity: string, decision?: string) => ({
    ruleId, ruleText: rule(ruleId), quote, issue: "Sample finding", severity, source: "code", decision,
  });
  const mk = (n: number, text: string, state: string, findings: any[], versions = 1) => ({
    id: `seed-${n}`, version: versions, text: `[Sample] ${text}`, reviewStatus: "Needs Care",
    findings, state,
    history: [{ time: when, actor: "Creator", action: "Submitted (sample data)" }],
  });
  return [
    mk(1, "Our revolutionary granola is the best!", "Approved to Bloom",
      [f("V1", "revolutionary", "minor", "rejected"), f("C1", "best", "unverified", "accepted")], 2),
    mk(2, "A miracle snack for busy mornings!!", "Changes requested",
      [f("V1", "miracle", "minor", "rejected"), f("V2", "!", "minor", "rejected")]),
    mk(3, "Try our game-changing vegan-friendly bars", "Approved to Bloom",
      [f("V1", "game-changing", "minor", "rejected"), f("T1", "vegan-friendly", "minor", "accepted")], 2),
    mk(4, "Number one in India, guaranteed results", "Pending review",
      [f("C1", "number one", "unverified"), f("C1", "guaranteed", "unverified")]),
    mk(5, "Our HEALTHY snacks cure hunger!", "Changes requested",
      [f("V2", "HEALTHY", "minor", "accepted"), f("C1", "cure", "unverified")]),
  ];
}

export default function Insights({ subs, onSeed, onClear }: { subs: Sub[]; onSeed: () => void; onClear: () => void }) {
  const rows: Record<string, { id: string; text: string; count: number; rejected: number; accepted: number; open: number }> = {};
  let total = 0, unverified = 0;
  for (const s of subs) {
    for (const f of s.findings) {
      total++;
      if (f.severity === "unverified") unverified++;
      const r = (rows[f.ruleId] ||= { id: f.ruleId, text: f.ruleText, count: 0, rejected: 0, accepted: 0, open: 0 });
      r.count++;
      if (f.decision === "rejected") r.rejected++;
      else if (f.decision === "accepted") r.accepted++;
      else r.open++;
    }
  }
  const list = Object.values(rows).sort((a, b) => b.count - a.count);
  const max = list[0]?.count || 1;
  const approved = subs.filter((s) => s.state === "Approved to Bloom").length;
  const revised = subs.filter((s) => s.version > 1).length;
  const health = list.filter((r) => r.rejected >= 2 && r.rejected / r.count >= 0.5);

  const Stat = ({ n, l }: { n: number | string; l: string }) => (
    <div className="rounded border bg-white p-3 text-center text-gray-900">
      <div className="text-2xl font-bold text-green-800">{n}</div>
      <div className="text-xs text-gray-600">{l}</div>
    </div>
  );

  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-green-800">Growth Insights</h2>
      <p className="text-sm text-gray-600">Built from every submission and decision in this workspace.</p>
      <div className="mt-2 flex gap-2">
        <button onClick={onSeed} className="rounded border border-green-700 px-3 py-1 text-sm text-green-800">Load sample history</button>
        <button onClick={onClear} className="rounded border px-3 py-1 text-sm">Clear all data</button>
      </div>

      {subs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-700">No data yet. Submit content as a Creator, or click “Load sample history”.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat n={subs.length} l="Submissions" />
            <Stat n={total} l="Findings raised" />
            <Stat n={`${approved}/${subs.length}`} l="Approved to Bloom" />
            <Stat n={unverified} l="Unverified claims" />
          </div>
          <p className="mt-2 text-xs text-gray-600">{revised} submission(s) needed a revision after review.</p>

          <h3 className="mt-6 font-bold text-green-800">Most frequent violations</h3>
          <ul className="mt-2 space-y-2">
            {list.map((r) => (
              <li key={r.id} className="rounded border bg-white p-3 text-gray-900">
                <div className="flex justify-between text-sm"><b>{r.id}</b><span>{r.count} finding(s)</span></div>
                <div className="mt-1 h-2 rounded bg-green-100"><div className="h-2 rounded bg-green-600" style={{ width: `${(r.count / max) * 100}%` }} /></div>
                <p className="mt-1 text-xs text-gray-600">{r.text}</p>
                <p className="mt-1 text-xs">✅ {r.accepted} accepted · ❌ {r.rejected} rejected · ⚠️ {r.open} open</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 font-bold text-green-800">Guideline Health</h3>
          {health.length === 0 ? (
            <p className="mt-2 text-sm text-gray-700">No rules are being overridden often. No action needed.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {health.map((r) => (
                <li key={r.id} className="rounded border border-orange-300 bg-orange-50 p-3 text-gray-900">
                  <b>Review rule {r.id}</b>: creators rejected {r.rejected} of {r.count} findings.
                  <p className="mt-1 text-xs text-gray-700">{r.text}</p>
                  <p className="mt-1 text-xs">This may mean the rule is unclear, outdated, or too strict. A brand manager should review it. This is a signal, not proof.</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}