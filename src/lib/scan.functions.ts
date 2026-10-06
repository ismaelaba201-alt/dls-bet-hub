import { createServerFn } from "@tanstack/react-start";

type Fx = { home: string; away: string; time: string };
type Score = { home: string; away: string; homeScore: number; awayScore: number };

const validate = (d: { image: string }) => {
  if (!d?.image?.startsWith("data:image/")) throw new Error("Invalid image");
  if (d.image.length > 14_000_000) throw new Error("Image too large");
  return d;
};

async function readImage<T>(image: string, prompt: string, itemProps: Record<string, unknown>): Promise<{ items: T[]; error?: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { items: [], error: "Scanner is not configured." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema", name: "items", strict: true,
          schema: {
            type: "object", additionalProperties: false, required: ["items"],
            properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: Object.keys(itemProps), properties: itemProps } } },
          },
        },
      },
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: image }] }],
    }),
  });
  if (!res.ok) {
    const msg = res.status === 429 ? "Too many scans right now, try again shortly." : res.status === 402 ? "AI credits are used up. Add credits to keep scanning." : `Scan failed (${res.status}).`;
    return { items: [], error: msg };
  }
  const json: any = await res.json();
  const text = json.output_text ?? json.output?.flatMap((o: any) => o.content ?? []).find((c: any) => c.type === "output_text")?.text;
  if (!text) return { items: [], error: "Nothing could be read from this image." };
  try { return { items: JSON.parse(text).items ?? [] }; } catch { return { items: [], error: "Could not read the scan result." }; }
}

export const scanFixtures = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<{ fixtures: Fx[]; error?: string | undefined }> => {
    const r = await readImage<Fx>(data.image, "Read this football matchday schedule screenshot. Extract every fixture: home team, away team, and match time/date exactly as shown (empty string if absent). Use full club names.", { home: { type: "string" }, away: { type: "string" }, time: { type: "string" } });
    return { fixtures: r.items, error: r.error };
  });

export const scanResults = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<{ scores: Score[]; error?: string | undefined }> => {
    const r = await readImage<Score>(data.image, "Read this screenshot of completed football matches. Extract every finished match: home team, away team, and the final full-time goals for each. Use full club names. Return an empty list if no final scores are visible.", { home: { type: "string" }, away: { type: "string" }, homeScore: { type: "integer" }, awayScore: { type: "integer" } });
    return { scores: r.items, error: r.error };
  });
