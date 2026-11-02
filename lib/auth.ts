import { supabaseAdmin } from "./supabaseAdmin";
import type { Role } from "./types";

export type AuthUser = { id: string; name: string; role: Role };

export async function getUser(req: Request): Promise<AuthUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: p } = await supabaseAdmin
    .from("profiles").select("name, role").eq("id", data.user.id).single();
  if (!p) return null;
  return { id: data.user.id, name: p.name, role: p.role as Role };
}