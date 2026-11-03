export async function callGemini(prompt: string, keyRaw: string, timeoutMs = 12000) {
  const key = keyRaw.trim().replace(/^["']|["']$/g, "");
  const models = [
    process.env.GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODEL,
    process.env.GEMINI_FALLBACK_MODEL_2,
  ]
    .map((m) => m?.trim())
    .filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

  let lastErr = "no model configured";
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let res: Response;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            signal: AbortSignal.timeout(timeoutMs),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
            }),
          }
        );
      } catch (e: any) {
        lastErr = `${e?.name ?? "Error"}: ${String(e?.message ?? e).slice(0, 120)} (${model})`;
        if (e?.name === "TimeoutError" && attempt === 0) continue;
        break;
      }
      if (res.ok) return await res.json();
      const detail = await res.text();
      lastErr = `${res.status} (${model}): ${detail.slice(0, 200)}`;
      if (res.status !== 503 && res.status !== 429) break; // real errors: move to the next model
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // wait 1.5s, 3s, 4.5s
    }
  }
  throw new Error(`AI service error ${lastErr}`);
}

export function parseJsonArray(data: any): any[] {
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}