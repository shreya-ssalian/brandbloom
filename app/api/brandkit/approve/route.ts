import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { toRule } from "@/lib/rules";

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can approve rules." }, { status: 403 });
  }

  const { ids, action, texts } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No rules selected." }, { status: 400 });
  }

  if (action === "reject") {
    await supabaseAdmin.from("rules").delete().in("rule_id", ids).eq("status", "proposed");
    return NextResponse.json({ ok: true });
  }

  for (const id of ids) {
    const edited = texts && typeof texts[id] === "string" ? texts[id].trim() : "";
    if (edited.length > 400) {
      return NextResponse.json({ error: "A rule is too long (max 400 characters)." }, { status: 400 });
    }
    await supabaseAdmin.from("rules")
      .update({ status: "approved", ...(edited ? { text: edited } : {}) })
      .eq("rule_id", id);
  }
  const { data } = await supabaseAdmin.from("rules").select("*").in("rule_id", ids);
  return NextResponse.json((data ?? []).map(toRule));
}