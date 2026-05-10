export type GraniteNeedExtraction = {
  confidence: number;
  needs: string[];
  summary: string;
  urgency: "today" | "soon" | "unknown";
};

const GRANITE_MODEL = "granite3.3:2b";
const OLLAMA_GENERATE_URL = "http://127.0.0.1:11434/api/generate";
const VALID_NEEDS = [
  "groceries",
  "hot-meal",
  "urgent",
  "no-id",
  "halal",
  "vegetarian",
  "baby",
  "delivery",
  "student",
  "family",
  "newcomer",
];

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("IBM Granite did not return JSON.");
  }

  return JSON.parse(match[0]) as Partial<GraniteNeedExtraction>;
}

function cleanNeeds(needs: unknown) {
  if (!Array.isArray(needs)) {
    return [];
  }

  return Array.from(new Set(needs.filter((need): need is string => VALID_NEEDS.includes(String(need)))));
}

export async function extractNeedsWithGranite(
  situation: string,
  signal?: AbortSignal,
): Promise<GraniteNeedExtraction> {
  const prompt = `You are IBM Granite helping a food support locator understand a person's situation.

Return only valid JSON with this exact shape:
{
  "needs": ["groceries"],
  "urgency": "today",
  "confidence": 0.82,
  "summary": "Short plain-language summary"
}

Valid needs are: ${VALID_NEEDS.join(", ")}.
Rules:
- Use "urgent" when the person needs help today, now, tonight, or as soon as possible.
- Use "no-id" when they lack ID, documents, proof of address, or paperwork.
- Use "hot-meal" for prepared meals, soup kitchens, dinner, lunch, or eating today.
- Use "groceries" for pantry food, food banks, hampers, staples, or fresh food.
- Use "baby" for formula, diapers, infant, or baby supplies.
- Use "delivery" when they cannot travel or need food brought to them.
- Do not invent needs that are not in the valid list.

Situation:
"""${situation.trim()}"""`;

  const response = await fetch(OLLAMA_GENERATE_URL, {
    body: JSON.stringify({
      model: GRANITE_MODEL,
      options: {
        temperature: 0,
      },
      prompt,
      stream: false,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    throw new Error("IBM Granite local inference is unavailable.");
  }

  const payload = (await response.json()) as { response?: string };
  const parsed = extractJson(payload.response ?? "");
  const urgency =
    parsed.urgency === "today" || parsed.urgency === "soon" || parsed.urgency === "unknown"
      ? parsed.urgency
      : "unknown";
  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;

  return {
    confidence: Math.max(0, Math.min(1, confidence)),
    needs: cleanNeeds(parsed.needs),
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 140) : "",
    urgency,
  };
}

