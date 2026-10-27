import { NextResponse } from "next/server";
import { brandKit } from "@/data/brandkit";

export const maxDuration = 30;

type Finding = {
  ruleId: string;
  ruleText: string;
  quote: string;
  issue: string;
  severity: "minor" | "serious" | "unverified";
  replacement?: string;
  source: "code" | "ai";
};

// Every rule the guardian is allowed to cite. No ID here, no finding.
const rules: Record<string, string> = {};
brandKit.voice.rules.forEach((r) => (rules[r.id] = r.rule));
brandKit.terminology.forEach(
  (t) => (rules[t.id] = `Use "${t.use}" instead of ${t.avoid.map((a) => `"${a}"`).join(", ")}. ${t.note}`)
);
brandKit.approvedFacts.forEach((f) => (rules[f.id] = `Approved fact: ${f.fact}`));
rules[brandKit.claimsPolicy.id] = brandKit.claimsPolicy.rule;
rules[brandKit.accessibility.id] = brandKit.accessibility.rule;

function codeChecks(text: string): Finding[] {
  const out: Finding[] = [];

  for (const t of brandKit.terminology) {
    for (const bad of t.avoid) {
      const re = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const m = text.match(re);
      if (m) {
        out.push({
          ruleId: t.id, ruleText: rules[t.id], quote: m[0],
          issue: `"${m[0]}" is not approved wording.`,
          severity: "minor", replacement: t.use, source: "code",
        });
      }
    }
  }

  const hype = ["revolutionary", "miracle", "game-changing", "game changing"];
  for (const h of hype) {
    const m = text.match(new RegExp(h, "i"));
    if (m) {
      out.push({
        ruleId: "V1", ruleText: rules["V1"], quote: m[0],
        issue: `"${m[0]}" is a hype word and does not match our warm, honest voice.`,
        severity: "minor", source: "code",
      });
    }
  }

  const caps = text.match(/\b[A-Z]{4,}\b/g);
  if (caps) {
    out.push({
      ruleId: "V2", ruleText: rules["V2"], quote: caps[0],
      issue: `ALL CAPS emphasis ("${caps[0]}") is not allowed.`,
      severity: "minor",
      replacement: caps[0].charAt(0) + caps[0].slice(1).toLowerCase(),
      source: "code",
    });
  }
  if ((text.match(/!/g) || []).length > 1) {
    out.push({
      ruleId: "V2", ruleText: rules["V2"], quote: "!",
      issue: "More than one exclamation mark in the post.",
      severity: "minor", source: "code",
    });
  }
  const stat = text.match(/\b\d[\d,.]*\+?\s*(happy\s+)?(customers|users|reviews|people|clients|stores)\b/i);
  if (stat) {
    const num = stat[0].match(/\d[\d,.]*/)![0];
    const supported = brandKit.approvedFacts.some((f) => f.fact.includes(num));
    if (!supported) {
      out.push({
        ruleId: "C1", ruleText: rules["C1"], quote: stat[0],
        issue: `"${stat[0]}" is a statistic with no approved source. It is marked Unverified and needs human review.`,
        severity: "unverified", source: "code",
      });
    }
  }

  const stat = text.match(/\b\d[\d,.]*\+?\s*(happy\s+)?(customers|users|reviews|people|clients|stores)\b/i);
  if (stat) {
    const num = stat[0].match(/\d[\d,.]*/)![0];
    const supported = brandKit.approvedFacts.some((f) => f.fact.includes(num));
    if (!supported) {
      out.push({
        ruleId: "C1", ruleText: rules["C1"], quote: stat[0],
        issue: `"${stat[0]}" is a statistic with no approved source. It is marked Unverified and needs human review.`,
        severity: "unverified", source: "code",
      });
    }
  }
  
  const claim = text.match(/(number one|number 1|#1|\bbest\b|\bcures?\b|guaranteed)/i);
  if (claim) {
    out.push({
      ruleId: "C1", ruleText: rules["C1"], quote: claim[0],
      issue: `"${claim[0]}" is a claim with no approved source. It is marked Unverified and needs human review.`,
      severity: "unverified", source: "code",
    });
  }
  return out;
}

async function callGemini(prompt: string, key: string) {
  const models = [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(Boolean) as string[];
  let lastErr = "no model configured";
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let res: Response;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            signal: AbortSignal.timeout(12000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
            }),
          }
        );
      } catch {
        lastErr = `timeout or network error (${model})`;
        break; // skip to the fallback model
      }
      if (res.ok) return await res.json();
      const detail = await res.text();
      lastErr = `${res.status}: ${detail.slice(0, 200)}`;
      if (res.status !== 503 && res.status !== 429) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`AI service error ${lastErr}`);
}

async function aiChecks(text: string): Promise<Finding[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  const prompt = `You are Bud, a brand-review assistant for ${brandKit.company}.
Review the CONTENT using ONLY the BRAND KIT below.

STRICT RULES:
- Report an issue ONLY if it breaks a rule or contradicts/is unsupported by an approved fact in the brand kit.
- Every issue MUST cite a ruleId that exists in the brand kit (V1-V3, T1-T3, F1-F5, C1, A1).
- "quote" MUST be copied exactly from the CONTENT.
- If the content states a number or fact that is NOT in the approved facts, use severity "unverified". If it contradicts an approved fact, use "serious".
- Tone problems use severity "minor".
- "replacement" is a rewrite of the quoted text that keeps the writer's meaning.
- If there are no issues, return [].
- Return ONLY a JSON array of objects: {"ruleId","quote","issue","severity","replacement"}.

BRAND KIT:
${JSON.stringify(brandKit)}

CONTENT:
"""${text}"""`;

  const data = await callGemini(prompt, key);
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  let parsed: any[] = [];
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed)) return [];

  // NO SOURCE, NO FLAG: keep only findings with a real rule and a real quote
  return parsed
    .filter((f) => f && rules[f.ruleId] && typeof f.quote === "string" && text.includes(f.quote))
    .map((f) => ({
      ruleId: f.ruleId,
      ruleText: rules[f.ruleId],
      quote: f.quote,
      issue: String(f.issue ?? ""),
      severity: (["minor", "serious", "unverified"].includes(f.severity) ? f.severity : "minor") as Finding["severity"],
      replacement: f.replacement ? String(f.replacement) : undefined,
      source: "ai" as const,
    }));
}

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Please provide some text to review." }, { status: 400 });
  }

  const found = codeChecks(text);
  let aiNote = "";
  try {
    const ai = await aiChecks(text);
    for (const f of ai) {
      const dup = found.some((c) => c.quote.toLowerCase() === f.quote.toLowerCase() && c.ruleId === f.ruleId);
      if (!dup) found.push(f);
    }
  } catch (e: any) {
    aiNote = `The AI check was unavailable (${e?.message}${e?.cause ? " - " + (e.cause.code || e.cause.message) : ""}). Only rule-based checks ran.`;
  }

  const status = found.some((f) => f.severity !== "minor")
    ? "Needs Care"
    : found.length > 0
    ? "Needs Pruning"
    : "Healthy Growth";

  return NextResponse.json({ status, findings: found, note: aiNote });
}