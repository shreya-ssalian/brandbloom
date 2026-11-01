export type Role = "creator" | "manager" | "reviewer";
export type Severity = "minor" | "serious" | "unverified";
export type Decision = "accepted" | "rejected";
export type Lane = "fast" | "review" | "escalate";
export type SubState = "Pending review" | "Changes requested" | "Approved to Bloom";

export type Finding = {
  ruleId: string; ruleText: string; quote: string; issue: string;
  severity: Severity; replacement?: string; source: "code" | "ai";
  confidence: "high" | "medium"; section?: string; decision?: Decision;
};
export type HistoryEvent = { time: string; actor: string; role: Role; action: string; comment?: string };
export type Submission = {
  id: string; kind: "text" | "document" | "image"; title: string; version: number;
  text: string; sections?: { heading: string; text: string }[]; imageUrl?: string;
  reviewStatus: string; findings: Finding[]; state: SubState;
  lane: Lane; riskScore: number; createdBy: string; history: HistoryEvent[];
};
export type Rule = {
  id: string; type: "voice" | "terminology" | "fact" | "claims" | "accessibility";
  text: string; status: "proposed" | "approved"; version: number;
};
export type RuleHealth = {
  ruleId: string; text: string; count: number; rejected: number; accepted: number; suggestion?: string;
};