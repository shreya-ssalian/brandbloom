import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role === "creator") {
    return NextResponse.json({ error: "Only managers and reviewers can decide." }, { status: 403 });
  }

  const { action, comment } = await req.json();
  const c = typeof comment === "string" ? comment.trim() : "";
  if (action !== "approve" && action !== "changes") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action === "changes" && !c) {
    return NextResponse.json({ error: "A comment is required when requesting changes." }, { status: 400 });
  }

  const state = action === "approve" ? "Approved to Bloom" : "Changes requested";
  const { error } = await supabaseAdmin.from("submissions")
    .update({ state, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("submission_events").insert({
    submission_id: id, actor_name: user.name, role: user.role,
    action: action === "approve" ? "Approved" : "Requested changes", comment: c || null,
  });
  return NextResponse.json({ ok: true, state });
}