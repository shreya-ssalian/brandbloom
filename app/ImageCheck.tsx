"use client";
import { useState } from "react";
import { brandKit } from "@/data/brandkit";

type Item = { id: string; level: "minor" | "serious" | "unverified"; title: string; detail: string; rule: string };

const hexToRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
];
const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: string, b: string) => {
  const l1 = lum(hexToRgb(a)), l2 = lum(hexToRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const sevCls = {
  minor: "bg-yellow-100 text-yellow-800",
  serious: "bg-red-100 text-red-800",
  unverified: "bg-gray-200 text-gray-800",
};

export default function ImageCheck() {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [fg, setFg] = useState("#777777");
  const [bg, setBg] = useState("#FFFFFF");
  const [items, setItems] = useState<Item[] | null>(null);
  const [onPalette, setOnPalette] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const palette = brandKit.visual.palette;
  const paletteText = palette.map((p) => `${p.name} ${p.hex}`).join(", ");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSrc(URL.createObjectURL(f));
    setItems(null); setOnPalette(null);
  }

  function run() {
    setBusy(true);
    const out: Item[] = [];

    // 1. Alt text (accessibility rule A1)
    const words = alt.trim().split(/\s+/).filter(Boolean).length;
    if (words === 0) {
      out.push({ id: "A1", level: "serious", title: "Alt text is missing",
        detail: "Screen readers cannot describe this image. Add a short description of what it shows.",
        rule: brandKit.accessibility.rule });
    } else if (words < 3) {
      out.push({ id: "A1", level: "minor", title: "Alt text is very short",
        detail: `"${alt.trim()}" is only ${words} word(s). Describe what the image shows and why it matters.`,
        rule: brandKit.accessibility.rule });
    }

    // 2. Contrast ratio (accessibility rule A1)
    const ratio = contrast(fg, bg);
    if (ratio < brandKit.visual.minContrastRatio) {
      out.push({ id: "A1", level: "serious", title: `Low text contrast (${ratio.toFixed(2)}:1)`,
        detail: `Text colour ${fg} on ${bg} is below the required ${brandKit.visual.minContrastRatio}:1. Use a darker text colour or a lighter background.`,
        rule: brandKit.accessibility.rule });
    }

    // 3. Logo (cannot be verified by simple code: be honest)
    out.push({ id: "L1", level: "unverified", title: "Logo placement needs human review",
      detail: "Automatic logo detection is not built yet. A reviewer should confirm the logo position and that it is not stretched or recoloured.",
      rule: brandKit.visual.logoRule });

    // 4. Palette match
    if (!src) {
      setItems(out); setBusy(false); return;
    }
    const img = new Image();
    img.onload = () => {
      const size = 48;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const pal = palette.map((p) => hexToRgb(p.hex));
      let coloured = 0, close = 0;
      for (let i = 0; i < data.length; i += 4) {
        const px = [data[i], data[i + 1], data[i + 2]];
        const spread = Math.max(...px) - Math.min(...px);
        if (spread < 25) continue; // ignore white, black and grey
        coloured++;
        if (Math.min(...pal.map((p) => dist(px, p))) < 80) close++;
      }
      const share = coloured ? close / coloured : 1;
      setOnPalette(Math.round(share * 100));
      if (coloured > 0 && share < 0.4) {
        out.push({ id: "P1", level: "minor", title: `Only ${Math.round(share * 100)}% of the image colours are close to the brand palette`,
          detail: "Colours may be off-brand. Check the image against the approved palette.",
          rule: `Use the approved palette: ${paletteText}.` });
      }
      setItems(out); setBusy(false);
    };
    img.onerror = () => { setItems(out); setBusy(false); };
    img.src = src;
  }

  return (
    <section className="mt-10 rounded border bg-white p-4 text-gray-900">
      <h2 className="text-xl font-bold text-green-800">Image and accessibility check</h2>
      <p className="mt-1 text-sm text-gray-600">
        Upload an image and describe it. Palette, contrast and alt text are checked with exact rules, not AI.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {palette.map((p) => (
          <span key={p.hex} className="flex items-center gap-1 rounded border px-2 py-1">
            <span className="inline-block h-4 w-4 rounded" style={{ background: p.hex }} /> {p.name} {p.hex}
          </span>
        ))}
      </div>
      <input type="file" accept="image/*" onChange={onFile} className="mt-3 block text-sm" />
      {src && <img src={src} alt={alt || "Uploaded preview"} className="mt-3 max-h-48 rounded border" />}
      <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text (describe the image)"
        className="mt-3 w-full rounded border p-2 text-sm" />
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">Text colour <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></label>
        <label className="flex items-center gap-2">Background <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
        <span className="text-gray-600">Contrast: <b>{contrast(fg, bg).toFixed(2)}:1</b> (needs {brandKit.visual.minContrastRatio}:1)</span>
      </div>
      <button onClick={run} disabled={busy} className="mt-3 rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {busy ? "Checking..." : "Check image"}
      </button>

      {items && (
        <ul className="mt-4 space-y-3">
          {onPalette !== null && <li className="text-sm text-gray-700">Palette match: {onPalette}% of coloured pixels are close to the brand palette.</li>}
          {items.length === 0 && <li>No issues found.</li>}
          {items.map((it, i) => (
            <li key={i} className="rounded border p-3">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${sevCls[it.level]}`}>{it.level.toUpperCase()}</span>
              <span className="ml-2 text-xs text-gray-500">Found by rule check</span>
              <p className="mt-2 font-semibold">{it.title}</p>
              <p className="text-sm">{it.detail}</p>
              <p className="mt-2 rounded bg-green-50 p-2 text-sm"><b>Source ({it.id}):</b> {it.rule}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}