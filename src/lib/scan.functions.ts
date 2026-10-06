import { createServerFn } from "@tanstack/react-start";

type Out = { fixtures: Array<{ home: string; away: string; time: string }>; error?: string };

export const scanFixtures = createServerFn({ method: "POST" })
  .inputValidator((d: { image: string }) => {
    if (!d?.image?.startsWith("data:image/")) throw new Error("Invalid image");
    if (d.image.length > 14_000_000) throw new Error("Image too large");
    return d;
  })
  .handler(async ({ data }): Promise<Out> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { fixtures: [], error: "Scanner is not configured." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        text: {
          format: {
            type: "json_schema", name: "fixtures", strict: true,
            schema: {
              type: "object", additionalProperties: false, required: ["fixtures"],
              properties: { fixtures: { type: "array", items: { type: "object", additionalProperties: false, required: ["home", "away", "time"], properties: { home: { type: "string" }, away: { type: "string" }, time: { type: "string" } } } } },
            },
          },
        },
        input: [{ role: "user", content: [
          { type: "input_text", text: "Read this football matchday schedule screenshot. Extract every fixture: home team, away team, and match time/date exactly as shown (empty string if absent). Use full club names." },
          { type: "input_image", image_url: data.image },
        ] }],
      }),
    });
    if (!res.ok) {
      const msg = res.status === 429 ? "Too many scans right now, try again shortly." : res.status === 402 ? "AI credits are used up. Add credits to keep scanning." : `Scan failed (${res.status}).`;
      return { fixtures: [], error: msg };
    }
    const json: any = await res.json();
    const text = json.output_text ?? json.output?.flatMap((o: any) => o.content ?? []).find((c: any) => c.type === "output_text")?.text;
    if (!text) return { fixtures: [], error: "No fixtures could be read from this image." };
    try { return { fixtures: JSON.parse(text).fixtures ?? [] }; } catch { return { fixtures: [], error: "Could not read the scan result." }; }
  });
