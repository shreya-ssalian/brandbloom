import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { routeFindings, withConfidence } from "@/lib/routing";
import { toSubmission } from "@/lib/submissions";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let q = supabaseAdmin.from("submissions").select("*");
  if (user.role === "creator") q = q.eq("created_by", user.id);
  const { data: rows, error } = await q.order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (rows ?? []).map((r) => r.id);
  const { data: events } = ids.length
    ? await supabaseAdmin.from("submission_events").select("*").in("submission_id", ids).order("created_at")
    : { data: [] as any[] };

  const out = (rows ?? []).map((r) =>
    toSubmission(r, (events ?? []).filter((e) => e.submission_id === r.id))
  );
  return NextResponse.json(out);
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const { submissionId, title, text, findings, reviewStatus, kind, sections, imageUrl } = body;
  if (!text || typeof text !== "string" || text.length > 20000) {
    return NextResponse.json({ error: "Text is required (max 20,000 characters)." }, { status: 400 });
  }

  const checked = withConfidence(Array.isArray(findings) ? findings : []);
  const { lane, riskScore } = routeFindings(checked);

  if (submissionId) {
    const { data: existing } = await supabaseAdmin.from("submissions").select("*").eq("id", submissionId).single();
    if (!existing || existing.created_by !== user.id) {
      return NextResponse.json({ error: "Not your submission." }, { status: 403 });
    }
    const version = existing.version + 1;
    await supabaseAdmin.from("submissions").update({
      text, findings: checked, review_status: reviewStatus ?? "", lane, risk_score: riskScore,
      state: "Pending review", version, sections: sections ?? existing.sections,
      image_url: imageUrl ?? existing.image_url, updated_at: new Date().toISOString(),
    }).eq("id", submissionId);
    await supabaseAdmin.from("submission_events").insert({
      submission_id: submissionId, actor_name: user.name, role: user.role, action: `Submitted revision v${version}`,
    });
    return NextResponse.json({ id: submissionId, version, lane, riskScore });
  }

  const { data: row, error } = await supabaseAdmin.from("submissions").insert({
    kind: kind ?? "text", title: title || text.slice(0, 60), text, findings: checked,
    review_status: reviewStatus ?? "", lane, risk_score: riskScore, created_by: user.id,
    sections: sections ?? null, image_url: imageUrl ?? null,
  }).select().single();
  if (error || !row) return NextResponse.json({ error: error?.message ?? "Could not save." }, { status: 500 });

  await supabaseAdmin.from("submission_events").insert({
    submission_id: row.id, actor_name: user.name, role: user.role, action: "Submitted v1 for approval",
  });
  return NextResponse.json({ id: row.id, version: 1, lane, riskScore });
}