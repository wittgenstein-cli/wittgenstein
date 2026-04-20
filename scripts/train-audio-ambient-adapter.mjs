import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TRAINING_PATH = resolve(
  ROOT,
  "packages/codec-audio/src/model/training-data.json",
);
const OUTPUT_PATH = resolve(
  ROOT,
  "packages/codec-audio/src/model/ambient-adapter.json",
);

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

const examples = JSON.parse(await readFile(TRAINING_PATH, "utf8"));
const labels = [...new Set(examples.map((example) => example.ambient))].sort();
const tokenized = examples.map((example) => ({
  ...example,
  tokens: tokenize(example.text),
}));
const vocabulary = [...new Set(tokenized.flatMap((example) => example.tokens))].sort();
const centroids = Object.fromEntries(
  labels.map((label) => {
    const rows = tokenized.filter((example) => example.ambient === label);
    const vector = vocabulary.map((token) => {
      const hits = rows.filter((row) => row.tokens.includes(token)).length;
      return Number((hits / Math.max(1, rows.length)).toFixed(4));
    });
    return [label, vector];
  }),
);

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(
  OUTPUT_PATH,
  JSON.stringify(
    {
      labels,
      vocabulary,
      centroids,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      ok: true,
      labels,
      vocabSize: vocabulary.length,
      outputPath: OUTPUT_PATH,
    },
    null,
    2,
  ),
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}
