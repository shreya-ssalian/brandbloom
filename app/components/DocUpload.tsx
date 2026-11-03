"use client";
import { useState } from "react";
import { api, getToken } from "./api";

type Finding = {
  ruleId: string; ruleText: string; quote: string; issue: string;
  severity: "minor" | "serious" | "unverified"; replacement?: string; source: "code" | "ai";
};
type Sec = { title: string; text: string; status?: string; findings?: Finding[]; error?: string };

const sevCls = {
  minor: "bg-yellow-100 text-yellow-800",
  serious: "bg-red-100 text-red-800",
  unverified: "bg-gray-200 text-gray-800",
};

export default function DocUpload({ onSubmitted }: { onSubmitted: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [sections, setSections] = useState<Sec[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function reviewOne(s: Sec): Promise<Sec> {
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: s.text }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Review failed");
      return { ...s, status: d.status, findings: d.findings, error: undefined };
    } catch (e: any) {
      return { ...s, error: e.message };
    }
  }

  async function analyse() {
    if (!file) return;
    setBusy(true); setError(""); setDone(""); setSections([]);
    try {
      setProgress("Reading the file...");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not read the file");
      setFilename(d.filename);

      let secs: Sec[] = d.sections;
      setSections(secs);
      // review 3 sections at a time
      for (let i = 0; i < secs.length; i += 3) {
        setProgress(`Bud is reviewing sections ${i + 1} to ${Math.min(i + 3, secs.length)} of ${secs.length}...`);
        const batch = await Promise.all(secs.slice(i, i + 3).map(reviewOne));
        secs = [...secs.slice(0, i), ...batch, ...secs.slice(i + 3)];
        setSections(secs);
      }
    } catch (e: any) { setError(e.message); }
    setProgress(""); setBusy(false);
  }

  async function retryFailed() {
    setBusy(true); setError("");
    let secs = sections;
    for (let i = 0; i < secs.length; i++) {
      if (secs[i].error) {
        setProgress(`Retrying section ${i + 1}...`);
        const r = await reviewOne(secs[i]);
        secs = [...secs.slice(0, i), r, ...secs.slice(i + 1)];
        setSections(secs);
      }
    }
    setProgress(""); setBusy(false);
  }

  const allFindings = sections.flatMap((s) => (s.findings ?? []).map((f) => ({ ...f, section: s.title })));
  const failed = sections.some((s) => s.error);
  const reviewed = sections.length > 0 && sections.every((s) => s.findings);
  const overall = allFindings.some((f) => f.severity !== "minor")
    ? "Needs Care" : allFindings.length ? "Needs Pruning" : "Healthy Growth";

  async function submit() {
    setSubmitting(true); setError("");
    try {
      await api("/api/submissions", {
        kind: "document",
        title: filename,
        text: sections.map((s) => s.text).join("\n\n"),
        findings: allFindings,
        reviewStatus: overall,
        sections: sections.map(({ title, text, findings }) => ({ title, text, findings })),
      });
      setDone(`"${filename}" was submitted for approval.`);
      setSections([]); setFile(null); setFilename("");
      onSubmitted();
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  }

  return (
    <section className="mt-8 rounded border bg-white p-5 text-gray-900">
      <h2 className="text-xl font-bold text-green-800">Document check</h2>
      <p className="mt-1 text-sm text-gray-600">
        Upload a DOCX or PDF (max 4 MB, about 12,000 characters). Bud reviews it section by section.
        AI findings are suggestions only, and a human approves the document.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input type="file" accept=".docx,.pdf" disabled={busy}
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDone(""); }} />
        <button onClick={analyse} disabled={!file || busy}
          className="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? "Working..." : "Review document"}
        </button>
      </div>
      {progress && <p className="mt-2 text-sm text-gray-600">{progress}</p>}
      {error && <p className="mt-2 text-red-700">{error}</p>}
      {done && <p className="mt-2 text-green-800">{done}</p>}

      {sections.length > 0 && (
        <div className="mt-4 space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="rounded border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm">{s.title}</b>
                {s.status && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs">{s.status}</span>}
                {!s.status && !s.error && <span className="text-xs text-gray-500">waiting...</span>}
              </div>
              {s.error && <p className="mt-1 text-sm text-red-700">Review failed: {s.error}</p>}
              {s.findings?.length === 0 && <p className="mt-1 text-sm text-gray-600">No issues found.</p>}
              <ul className="mt-2 space-y-2">
                {(s.findings ?? []).map((f, j) => (
                  <li key={j} className="rounded bg-green-50 p-2 text-sm">
                    <span className={`mr-2 rounded px-2 py-0.5 text-xs font-semibold ${sevCls[f.severity]}`}>{f.severity.toUpperCase()}</span>
                    “{f.quote}”: {f.issue} <span className="text-gray-600">[{f.ruleId}]</span>
                    {f.replacement && <div className="mt-1">Suggested: <span className="text-green-700">{f.replacement}</span></div>}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {failed && !busy && (
            <button onClick={retryFailed} className="rounded border border-green-700 px-4 py-2 text-green-800">
              Retry failed sections
            </button>
          )}
          {reviewed && !failed && (
            <button onClick={submit} disabled={submitting}
              className="rounded bg-green-900 px-5 py-2 font-semibold text-white disabled:opacity-50">
              {submitting ? "Submitting..." : `Submit document for approval (${allFindings.length} finding${allFindings.length === 1 ? "" : "s"})`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}