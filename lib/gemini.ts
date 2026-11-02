export async function callGemini(prompt: string, key: string, timeoutMs = 12000) {
  const models = [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(Boolean) as string[];
  let lastErr = "no model configured";
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let res: Response;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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
      } catch {
        lastErr = `timeout or network error (${model})`;
        break;
      }
      if (res.ok) return await res.json();
      const detail = await res.text();
      lastErr = `${res.status}: ${detail.slice(0, 200)}`;
      if (res.status !== 503 && res.status !== 429) break;
      await new Promise((r) => setTimeout(r, 1500));
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