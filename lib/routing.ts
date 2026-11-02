import type { Finding, Lane } from "./types";

export function withConfidence(findings: Finding[]): Finding[] {
  return findings.map((f) => ({
    ...f,
    confidence: f.confidence ?? (f.source === "code" ? "high" : "medium"),
  }));
}

export function routeFindings(findings: Finding[]): { lane: Lane; riskScore: number } {
  let score = 0;
  for (const f of findings) {
    const base = f.severity === "serious" ? 40 : f.severity === "unverified" ? 30 : 5;
    score += f.confidence === "medium" ? Math.round(base * 1.3) : base;
  }
  const riskScore = Math.min(100, score);

  const hasHigh = findings.some((f) => f.severity === "serious" || f.severity === "unverified");
  const hasAiMinor = findings.some((f) => f.severity === "minor" && f.confidence === "medium");

  let lane: Lane = "fast";
  if (hasHigh) lane = "escalate";
  else if (hasAiMinor || findings.length > 4) lane = "review";
  return { lane, riskScore };
}