import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(user);
}