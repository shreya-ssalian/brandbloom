import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { toRule } from "@/lib/rules";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let q = supabaseAdmin.from("rules").select("*");
  if (user.role !== "manager") q = q.eq("status", "approved");
  const { data, error } = await q.order("created_at").order("rule_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toRule));
}