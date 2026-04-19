/**
 * Reads apps/wittgenstein-kimi/witt.jpeg (creates a simple placeholder if missing),
 * renders ASCII-art style raster via SVG → PNG, writes ascii-art-60x30.png (60×30 cell grid).
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const inputPath = join(appRoot, "witt.jpeg");
const outputPath = join(appRoot, "ascii-art-60x30.png");

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <circle cx="160" cy="160" r="108" fill="#c96442" opacity="0.92"/>
  <circle cx="160" cy="160" r="52" fill="#faf9f5"/>
  <path fill="#30302e" d="M118 118h24l18 48 18-48h24L178 210h-28l-32-92z"/>
</svg>`;

/** Dark → light (background is ivory; dark regions get dense glyphs). */
const RAMP =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

/** Fixed sampling grid: 60 columns × 30 rows → ascii-art-60x30.png */
const ASCII_COLS = 60;
const ROW_TARGET = 30;

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @returns {Promise<Buffer|import('sharp').Sharp>} */
async function openInputSharp() {
  if (existsSync(inputPath)) return sharp(inputPath);
  console.warn(
    `[generate-ascii-logo] Missing ${inputPath}; using in-memory placeholder (add witt.jpeg beside this script and re-run).`,
  );
  const buf = await sharp(Buffer.from(PLACEHOLDER_SVG)).jpeg({ quality: 92 }).toBuffer();
  return sharp(buf);
}

function buildAsciiLines(data, width, height) {
  const lines = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const v = data[y * width + x] / 255;
      const idx = Math.min(RAMP.length - 1, Math.floor((1 - v) * (RAMP.length - 1)));
      row += RAMP[idx];
    }
    lines.push(row);
  }
  return lines;
}

function linesToSvg(lines) {
  const fontSize = lines.length >= 28 ? 6 : lines.length >= 20 ? 8 : 13;
  const lineHeight = Math.round(fontSize * 1.22);
  const padX = 14;
  const padTop = 14;
  const maxLen = Math.max(...lines.map((l) => l.length));
  const svgW = Math.ceil(padX * 2 + maxLen * fontSize * 0.62);
  const svgH = padTop + lines.length * lineHeight + 12;
  const baselineY = padTop + fontSize * 0.88;

  const tspans = lines
    .map((line, i) => {
      if (i === 0) return `<tspan x="${padX}">${escapeXml(line)}</tspan>`;
      return `<tspan x="${padX}" dy="${lineHeight}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect width="100%" height="100%" fill="#faf9f5"/>
  <text xml:space="preserve" x="${padX}" y="${baselineY}" font-family="Courier New, Courier, ui-monospace, monospace" font-size="${fontSize}" fill="#141413" letter-spacing="0">${tspans}</text>
</svg>`;
}

async function main() {
  const { data, info } = await (await openInputSharp())
    .resize({
      width: ASCII_COLS,
      height: ROW_TARGET,
      fit: "cover",
      position: "centre",
    })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const lines = buildAsciiLines(data, width, height);
  const svg = linesToSvg(lines);

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .resize(60, 30, { kernel: sharp.kernel.nearest })
    .toFile(outputPath);

  console.log(`[generate-ascii-logo] Wrote ${outputPath} (${width}×${height} cells → PNG)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
