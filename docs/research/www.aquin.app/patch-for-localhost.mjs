/**
 * Rewrites root-relative asset URLs so the saved DOM works when served from localhost.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGIN = "https://www.aquin.app";

let html = readFileSync(join(__dirname, "index.rendered.html"), "utf8");

const pairs = [
  ['href="/', `href="${ORIGIN}/`],
  ['src="/', `src="${ORIGIN}/`],
  ['action="/', `action="${ORIGIN}/`],
  ['url("/', `url("${ORIGIN}/`],
  ["url('/", `url('${ORIGIN}/`],
];

for (const [from, to] of pairs) {
  html = html.split(from).join(to);
}

writeFileSync(join(__dirname, "index.html"), html, "utf8");
console.log("Wrote index.html (asset roots -> " + ORIGIN + ")");
