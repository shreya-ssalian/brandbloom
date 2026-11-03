import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const maxDuration = 30;
const MAX_FILE = 4 * 1024 * 1024; // Vercel's request limit is about 4.5 MB
const MAX_CHARS = 12000;          // keeps the review fast for a demo
const CHUNK = 1500;

function splitSections(text: string) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  // break very long paragraphs (typical for PDFs) at sentence ends
  const units = paras.flatMap((p) =>
    p.length > CHUNK ? p.split(/(?<=[.!?])\s+/).map((s) => s.slice(0, 4000)) : [p]
  );
  const out: string[] = [];
  let cur = "";
  for (const u of units) {
    if (cur && (cur + "\n" + u).length > CHUNK) { out.push(cur); cur = u; }
    else cur = cur ? cur + "\n" + u : u;
  }
  if (cur) out.push(cur);
  return out.map((t, i) => ({
    title: `Section ${i + 1}: ${t.split("\n")[0].slice(0, 50)}`,
    text: t,
  }));
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 413 });

  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  let text = "";
  try {
    if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else if (name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      text = (await extractText(pdf, { mergePages: true })).text;
    } else {
      return NextResponse.json({ error: "Only .docx and .pdf files are supported." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not read that file. Is it a valid DOCX or PDF?" }, { status: 422 });
  }

  text = text.trim();
  if (text.length < 20) {
    return NextResponse.json({ error: "No readable text found. Scanned PDFs and image-only files are not supported." }, { status: 422 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `This document has ${text.length.toLocaleString()} characters. The limit is ${MAX_CHARS.toLocaleString()}. Please upload a shorter file.` }, { status: 413 });
  }
  return NextResponse.json({ filename: file.name, sections: splitSections(text) });
}