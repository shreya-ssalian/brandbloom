import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can approve rule changes." }, { status: 403 });
  }

  const { ruleId, text } = await req.json();
  if (typeof text !== "string" || text.trim().length < 5 || text.length > 400) {
    return NextResponse.json({ error: "Rule text must be 5 to 400 characters." }, { status: 400 });
  }

  const { data: rule } = await supabaseAdmin
    .from("rules").select("rule_id, type, version").eq("rule_id", ruleId).eq("status", "approved").maybeSingle();
  if (!rule) return NextResponse.json({ error: "Rule not found." }, { status: 404 });
  if (rule.type === "fact") {
    return NextResponse.json({ error: "Approved facts cannot be changed here." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("rules").update({ text: text.trim(), version: rule.version + 1 }).eq("rule_id", ruleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ruleId, version: rule.version + 1 });
}