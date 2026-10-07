const KNOWN: Record<string, string> = { "real madrid": "RM", chelsea: "CFC", "manchester city": "MCI", "manchester united": "MUN", liverpool: "LIV", arsenal: "ARS", barcelona: "FCB", "bayern munich": "FCB", psg: "PSG", juventus: "JUV", tottenham: "TOT" };

export function teamInitials(name: string): string {
  const key = name.trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  const words = name.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter((w) => w && !/^(fc|cf|afc|sc|ac|the)$/i.test(w));
  if (!words.length) return "?";
  return (words.length === 1 ? words[0]!.slice(0, 3) : words.slice(0, 3).map((w) => w[0]).join("")).toUpperCase();
}

// Stable "club colour" derived from the name.
export function teamColor(name: string): string {
  let h = 0;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `oklch(0.45 0.15 ${h % 360})`;
}

export function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (v: number) => String(v).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export const isExpired = (closesAt: string | null | undefined, now = Date.now()) => !!closesAt && Date.parse(closesAt) <= now;
