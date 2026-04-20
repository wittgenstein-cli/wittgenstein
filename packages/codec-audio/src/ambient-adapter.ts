import adapter from "./model/ambient-adapter.json" with { type: "json" };

export type AmbientCategory =
  | "silence"
  | "rain"
  | "wind"
  | "city"
  | "forest"
  | "electronic";

interface AdapterModel {
  labels: AmbientCategory[];
  vocabulary: string[];
  centroids: Record<AmbientCategory, number[]>;
}

const model = adapter as AdapterModel;
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "to",
  "of",
  "for",
  "on",
  "in",
  "with",
  "and",
  "or",
  "is",
  "be",
  "this",
  "that",
]);

export function recommendAmbient(text: string): {
  category: AmbientCategory;
  confidence: number;
} {
  const tokens = tokenize(text);
  const features = new Set(tokens);

  let best: AmbientCategory = "silence";
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const label of model.labels) {
    const centroid = model.centroids[label];
    let score = 0;
    for (let i = 0; i < model.vocabulary.length; i += 1) {
      if (features.has(model.vocabulary[i] ?? "")) {
        score += centroid[i] ?? 0;
      }
    }

    if (score > bestScore) {
      best = label;
      bestScore = score;
    }
  }

  const confidence = Math.max(0.15, Math.min(0.99, 0.5 + bestScore / 10));
  return { category: best, confidence };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}
