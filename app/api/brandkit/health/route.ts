import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can view guideline health." }, { status: 403 });
  }

  const [subsRes, rulesRes] = await Promise.all([
    supabaseAdmin.from("submissions").select("findings, state"),
    supabaseAdmin.from("rules").select("rule_id, type, text, version").eq("status", "approved"),
  ]);
  if (subsRes.error) return NextResponse.json({ error: subsRes.error.message }, { status: 500 });

  const stats: Record<string, { flagged: number; changesRequested: number; approved: number }> = {};
  for (const s of subsRes.data ?? []) {
    const ids = new Set((Array.isArray(s.findings) ? s.findings : []).map((f: any) => f.ruleId));
    const state = String(s.state ?? "");
    for (const id of ids) {
      if (!stats[id]) stats[id] = { flagged: 0, changesRequested: 0, approved: 0 };
      stats[id].flagged++;
      if (/changes requested|rejected/i.test(state)) stats[id].changesRequested++;
      else if (/approved/i.test(state)) stats[id].approved++;
    }
  }

  const out = (rulesRes.data ?? [])
    .map((r) => {
      const st = stats[r.rule_id] ?? { flagged: 0, changesRequested: 0, approved: 0 };
      const decided = st.changesRequested + st.approved;
      const rejectRate = decided ? Math.round((100 * st.changesRequested) / decided) : 0;
      return {
        ruleId: r.rule_id, type: r.type, text: r.text, version: r.version,
        flagged: st.flagged, changesRequested: st.changesRequested, approved: st.approved,
        rejectRate, needsAttention: decided >= 1 && rejectRate >= 50,
      };
    })
    .filter((r) => r.flagged > 0)
    .sort((a, b) => b.rejectRate - a.rejectRate || b.flagged - a.flagged);

  return NextResponse.json(out);
}