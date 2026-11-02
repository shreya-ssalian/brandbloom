import type { Submission } from "./types";

export function toSubmission(row: any, events: any[]): Submission {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title ?? "",
    version: row.version,
    text: row.text ?? "",
    sections: row.sections ?? undefined,
    imageUrl: row.image_url ?? undefined,
    reviewStatus: row.review_status ?? "",
    findings: row.findings ?? [],
    state: row.state,
    lane: row.lane,
    riskScore: row.risk_score,
    createdBy: row.created_by,
    history: events.map((e) => ({
      time: new Date(e.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      actor: e.actor_name,
      role: e.role,
      action: e.action,
      comment: e.comment ?? undefined,
    })),
  };
}