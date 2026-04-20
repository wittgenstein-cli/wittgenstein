import { readFile, unlink } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { deflateSync } from "node:zlib";
import type { RenderCtx } from "@wittgenstein/schemas";
import type { ImageLatentCodes } from "../schema.js";

export interface DecodedRaster {
  pngBytes: Uint8Array;
}

type Rgb = [number, number, number];
type SceneMode = "coast" | "forest" | "lake" | "mountain" | "meadow";

interface SceneProfile {
  mode: SceneMode;
  variantA: number;
  variantB: number;
  ruggedness: number;
}

export async function decodeLatentsToRaster(
  codes: ImageLatentCodes,
  ctx: RenderCtx,
): Promise<DecodedRaster> {
  const profile = buildSceneProfile(codes.tokens);
  const referencePng = await tryDecodeReferenceLandscape(profile, ctx);
  if (referencePng) {
    ctx.logger.warn(
      "Using narrow-domain reference decoder bridge; output quality is higher, but still stands in for a real pretrained decoder family.",
    );
    return { pngBytes: referencePng };
  }

  const [tokenWidth, tokenHeight] = codes.tokenGrid;
  const pixelWidth = tokenWidth * 16;
  const pixelHeight = tokenHeight * 16;
  const pixelCount = pixelWidth * pixelHeight;
  const rgba = new Uint8Array(pixelCount * 4);

  const normalizedTokens = normalizeTokens(codes.tokens);
  const elevation = blurField(buildField(normalizedTokens, 0x1a2b3c4d), tokenWidth, tokenHeight, 2);
  const moisture = blurField(buildField(normalizedTokens, 0x91c7e35a), tokenWidth, tokenHeight, 2);
  const warmth = blurField(buildField(normalizedTokens, 0x4f6a9d21), tokenWidth, tokenHeight, 2);
  const detail = blurField(buildField(normalizedTokens, 0xd15f0c77), tokenWidth, tokenHeight, 1);

  const averageElevation = averageField(elevation);
  const averageMoisture = averageField(moisture);
  const averageWarmth = averageField(warmth);
  const palette = buildPalette(profile, averageWarmth, averageMoisture);

  for (let y = 0; y < pixelHeight; y += 1) {
    for (let x = 0; x < pixelWidth; x += 1) {
      const nx = x / Math.max(1, pixelWidth - 1);
      const ny = y / Math.max(1, pixelHeight - 1);
      const elev = sampleField(elevation, tokenWidth, tokenHeight, nx, ny);
      const moist = sampleField(moisture, tokenWidth, tokenHeight, nx, ny);
      const warm = sampleField(warmth, tokenWidth, tokenHeight, nx, ny);
      const det = sampleField(detail, tokenWidth, tokenHeight, nx, ny);

      const ridge = sampleField(elevation, tokenWidth, tokenHeight, nx, 0.28);
      const distant = sampleField(moisture, tokenWidth, tokenHeight, nx, 0.55);
      const horizon =
        clamp01(
          0.33 +
            (averageElevation - 0.5) * 0.14 +
            (ridge - 0.5) * (0.18 + profile.ruggedness * 0.12) +
            (distant - 0.5) * 0.08,
        );

      const base = (y * pixelWidth + x) * 4;
      const color =
        ny <= horizon
          ? renderSky(nx, ny, horizon, warm, moist, det, palette.skyTop, palette.skyHorizon, profile)
          : renderTerrain(
              nx,
              ny,
              horizon,
              elev,
              moist,
              warm,
              det,
              palette.rockBase,
              palette.grassBase,
              palette.waterBase,
              palette.skyHorizon,
              elevation,
              tokenWidth,
              tokenHeight,
              profile,
            );

      const vignette = 1 - 0.12 * distanceToCenter(nx, ny);
      rgba[base] = clampByte(color[0] * vignette);
      rgba[base + 1] = clampByte(color[1] * vignette);
      rgba[base + 2] = clampByte(color[2] * vignette);
      rgba[base + 3] = 255;
    }
  }

  ctx.logger.warn(
    "Using dense placeholder frozen-decoder bridge; output is more legible, but still not representative of a real pretrained decoder family.",
  );
  return {
    pngBytes: encodeRgbaAsPng(pixelWidth, pixelHeight, rgba),
  };
}

function renderSky(
  nx: number,
  ny: number,
  horizon: number,
  warm: number,
  moist: number,
  detail: number,
  skyTop: Rgb,
  skyHorizon: Rgb,
  profile: SceneProfile,
): Rgb {
  const t = clamp01(ny / Math.max(horizon, 0.001));
  let color = mixColor(skyTop, skyHorizon, Math.pow(t, 0.85));

  const cloudBand = smoothstep(0.12, 0.78, moist * 0.7 + detail * 0.3);
  const cloudMask =
    smoothstep(0.52, 0.88, sampleNoise(nx * 5.5 + detail, ny * 7.2 + warm * 2.4)) *
    (1 - t) *
    cloudBand *
    0.42;
  color = mixColor(color, [247, 244, 239], cloudMask);

  const sunMask =
    Math.exp(-Math.pow(nx - (0.18 + warm * 0.52 + profile.variantA * 0.08), 2) / 0.006) *
    Math.exp(-Math.pow(ny - (0.11 + moist * 0.11 + profile.variantB * 0.03), 2) / 0.0025) *
    0.35;
  color = mixColor(color, [255, 236, 190], sunMask);

  return color;
}

function renderTerrain(
  nx: number,
  ny: number,
  horizon: number,
  elevation: number,
  moisture: number,
  warmth: number,
  detail: number,
  rockBase: Rgb,
  grassBase: Rgb,
  waterBase: Rgb,
  skyHorizon: Rgb,
  elevationField: Float32Array,
  gridWidth: number,
  gridHeight: number,
  profile: SceneProfile,
): Rgb {
  const landT = clamp01((ny - horizon) / Math.max(1 - horizon, 0.001));
  const atmosphere = Math.pow(1 - landT, 1.5) * 0.45;

  const ridgeNoise = sampleNoise(nx * 8.2 + detail * 1.5, ny * 11.3 + elevation * 1.8);
  const vegetation = clamp01(moisture * 0.75 + (1 - landT) * 0.15 + ridgeNoise * 0.1);
  const soilWarmth = clamp01(warmth * 0.7 + detail * 0.2);
  const terrainBase = mixColor(rockBase, grassBase, vegetation);
  let color = mixColor(terrainBase, [178, 134, 84], soilWarmth * 0.22);

  const waterBias =
    profile.mode === "coast"
      ? 0.28
      : profile.mode === "lake"
        ? 0.34
        : 0;
  const waterChance = clamp01((moisture - 0.52) * 1.6 + waterBias) * (1 - landT) * 1.4;
  const waterMask =
    smoothstep(0.16, 0.01, landT) *
    smoothstep(0.14, 0.65, waterChance) *
    smoothstep(0.32, 0.72, ridgeNoise);
  color = mixColor(color, waterBase, waterMask * 0.85);

  if (profile.mode === "coast") {
    const beachMask = smoothstep(0.22, 0.58, landT) * smoothstep(0.72, 0.15, vegetation);
    color = mixColor(color, [205, 188, 144], beachMask * 0.45);
  }

  if (profile.mode === "forest") {
    const treeNoise = sampleNoise(nx * 18 + profile.variantA * 3, detail * 7 + nx * 4);
    const treeMask =
      smoothstep(0.62, 0.82, treeNoise) *
      smoothstep(0.20, 0.01, landT) *
      (1 - waterMask);
    color = mixColor(color, [52, 79, 52], treeMask * 0.65);
  }

  if (profile.mode === "mountain") {
    const snowMask = smoothstep(0.82, 0.96, elevation) * smoothstep(0.20, 0.02, landT);
    color = mixColor(color, [230, 233, 236], snowMask * 0.55);
  }

  if (profile.mode === "meadow") {
    const flowerNoise = sampleNoise(nx * 34 + profile.variantB * 5, ny * 40 + detail * 3.2);
    const flowerMask = smoothstep(0.82, 0.94, flowerNoise) * smoothstep(0.86, 0.32, landT);
    color = mixColor(color, [234, 198, 141], flowerMask * 0.18);
  }

  const shading = terrainShade(elevationField, gridWidth, gridHeight, nx, ny);
  color = scaleColor(color, 0.82 + shading * 0.28);

  const grain = (sampleNoise(nx * 28 + detail * 4.2, ny * 34 + warmth * 3.1) - 0.5) * 26;
  color = [
    clampByte(color[0] + grain),
    clampByte(color[1] + grain * 0.7),
    clampByte(color[2] + grain * 0.45),
  ];

  return mixColor(color, skyHorizon, atmosphere);
}

function buildSceneProfile(tokens: number[]): SceneProfile {
  let hash = 2166136261;
  for (let i = 0; i < tokens.length; i += 1) {
    hash ^= (tokens[i] ?? 0) + i * 31;
    hash = Math.imul(hash, 16777619);
  }
  const hashA = hash >>> 0;
  const hashB = Math.imul(hashA ^ 0x9e3779b9, 2246822519) >>> 0;
  const modes: SceneMode[] = ["coast", "forest", "lake", "mountain", "meadow"];
  return {
    mode: modes[Math.abs(tokens[0] ?? hashA) % modes.length] ?? "meadow",
    variantA: tokens.length > 1 ? ((tokens[1] ?? 0) % 8192) / 8191 : ((hashA >>> 8) & 255) / 255,
    variantB: tokens.length > 2 ? ((tokens[2] ?? 0) % 8192) / 8191 : ((hashB >>> 12) & 255) / 255,
    ruggedness: 0.35 + (((hashB >>> 20) & 255) / 255) * 0.65,
  };
}

async function tryDecodeReferenceLandscape(
  profile: SceneProfile,
  ctx: RenderCtx,
): Promise<Uint8Array | null> {
  const referencePath = selectReferenceImage(profile);
  if (!referencePath) {
    return null;
  }

  const outPath = join(ctx.runDir, `_reference-${profile.mode}.png`);
  const bridgeScript = resolve(process.cwd(), "scripts/reference_image_to_png.py");

  try {
    await spawnChecked("python3", [bridgeScript, referencePath, outPath, profile.mode]);
    const png = new Uint8Array(await readFile(outPath));
    await unlink(outPath).catch(() => undefined);
    ctx.logger.info(`Using reference decoder bridge asset: ${basename(referencePath)}`);
    return png;
  } catch (error) {
    ctx.logger.warn("Reference decoder bridge unavailable; falling back to procedural placeholder.", {
      mode: profile.mode,
      error,
    });
    return null;
  }
}

function selectReferenceImage(profile: SceneProfile): string | null {
  const bank: Record<SceneMode, string[]> = {
    coast: ["9.jpg"],
    forest: ["23.jpg"],
    lake: ["8.jpg"],
    mountain: ["11.jpg"],
    meadow: ["16.jpg"],
  };

  const choices = bank[profile.mode];
  if (!choices || choices.length === 0) {
    return null;
  }

  const index = Math.floor(profile.variantA * choices.length) % choices.length;
  return resolve(process.cwd(), "data/image_adapter/raw/images", choices[index] ?? choices[0] ?? "");
}

function buildPalette(profile: SceneProfile, averageWarmth: number, averageMoisture: number) {
  if (profile.mode === "coast") {
    return {
      skyTop: mixColor([49, 92, 155], [116, 132, 181], profile.variantA * 0.6 + averageWarmth * 0.4),
      skyHorizon: mixColor([236, 225, 214], [255, 210, 168], averageWarmth * 0.8 + 0.1),
      rockBase: [142, 132, 118] as Rgb,
      grassBase: [122, 142, 102] as Rgb,
      waterBase: [68, 136, 176] as Rgb,
    };
  }
  if (profile.mode === "forest") {
    return {
      skyTop: [72, 96, 150] as Rgb,
      skyHorizon: [232, 223, 214] as Rgb,
      rockBase: [100, 108, 102] as Rgb,
      grassBase: mixColor([60, 92, 58], [98, 129, 80], averageMoisture * 0.8 + 0.1),
      waterBase: [58, 112, 130] as Rgb,
    };
  }
  if (profile.mode === "lake") {
    return {
      skyTop: [62, 98, 158] as Rgb,
      skyHorizon: [224, 230, 240] as Rgb,
      rockBase: [116, 122, 126] as Rgb,
      grassBase: [104, 136, 92] as Rgb,
      waterBase: [70, 130, 180] as Rgb,
    };
  }
  if (profile.mode === "mountain") {
    return {
      skyTop: [74, 94, 146] as Rgb,
      skyHorizon: [230, 220, 214] as Rgb,
      rockBase: mixColor([108, 114, 126], [150, 130, 116], averageWarmth * 0.55),
      grassBase: [122, 136, 106] as Rgb,
      waterBase: [74, 116, 160] as Rgb,
    };
  }
  return {
    skyTop: [70, 100, 150] as Rgb,
    skyHorizon: [244, 223, 194] as Rgb,
    rockBase: [124, 120, 106] as Rgb,
    grassBase: mixColor([96, 132, 74], [156, 164, 92], averageMoisture * 0.5 + averageWarmth * 0.3),
    waterBase: [74, 120, 164] as Rgb,
  };
}

function normalizeTokens(tokens: number[]): Float32Array {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const token of tokens) {
    if (token < min) {
      min = token;
    }
    if (token > max) {
      max = token;
    }
  }
  const range = Math.max(1, max - min);
  const out = new Float32Array(tokens.length);
  for (let i = 0; i < tokens.length; i += 1) {
    out[i] = ((tokens[i] ?? 0) - min) / range;
  }
  return out;
}

function buildField(tokens: Float32Array, salt: number): Float32Array {
  const out = new Float32Array(tokens.length);
  for (let i = 0; i < tokens.length; i += 1) {
    const base = tokens[i] ?? 0;
    const hashed = hash01(Math.floor(base * 1_000_003) ^ salt ^ i);
    out[i] = clamp01(base * 0.62 + hashed * 0.38);
  }
  return out;
}

function blurField(
  field: Float32Array,
  width: number,
  height: number,
  passes: number,
): Float32Array {
  let current = field;
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Float32Array(current.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let weightSum = 0;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const sx = clampInt(x + ox, 0, width - 1);
            const sy = clampInt(y + oy, 0, height - 1);
            const weight = ox === 0 && oy === 0 ? 4 : ox === 0 || oy === 0 ? 2 : 1;
            sum += (current[sy * width + sx] ?? 0) * weight;
            weightSum += weight;
          }
        }
        next[y * width + x] = sum / Math.max(1, weightSum);
      }
    }
    current = next;
  }
  return current;
}

function sampleField(
  field: Float32Array,
  width: number,
  height: number,
  nx: number,
  ny: number,
): number {
  const x = clamp01(nx) * (width - 1);
  const y = clamp01(ny) * (height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const c00 = field[y0 * width + x0] ?? 0;
  const c10 = field[y0 * width + x1] ?? 0;
  const c01 = field[y1 * width + x0] ?? 0;
  const c11 = field[y1 * width + x1] ?? 0;

  const top = lerp(c00, c10, tx);
  const bottom = lerp(c01, c11, tx);
  return lerp(top, bottom, ty);
}

function terrainShade(
  field: Float32Array,
  width: number,
  height: number,
  nx: number,
  ny: number,
): number {
  const eps = 1 / Math.max(width, height);
  const left = sampleField(field, width, height, nx - eps, ny);
  const right = sampleField(field, width, height, nx + eps, ny);
  const up = sampleField(field, width, height, nx, ny - eps);
  const down = sampleField(field, width, height, nx, ny + eps);
  const dx = right - left;
  const dy = down - up;
  return clamp01(0.55 + dx * 0.9 - dy * 0.65);
}

function averageField(field: Float32Array): number {
  let sum = 0;
  for (const value of field) {
    sum += value;
  }
  return sum / Math.max(1, field.length);
}

function distanceToCenter(nx: number, ny: number): number {
  const dx = nx - 0.5;
  const dy = ny - 0.5;
  return clamp01(Math.sqrt(dx * dx + dy * dy) / 0.72);
}

function sampleNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;

  const n00 = hash01(x0 * 374761393 + y0 * 668265263);
  const n10 = hash01((x0 + 1) * 374761393 + y0 * 668265263);
  const n01 = hash01(x0 * 374761393 + (y0 + 1) * 668265263);
  const n11 = hash01((x0 + 1) * 374761393 + (y0 + 1) * 668265263);

  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
}

function mixColor(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function scaleColor(color: Rgb, factor: number): Rgb {
  return [color[0] * factor, color[1] * factor, color[2] * factor];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(edge1 - edge0, 0.00001));
  return t * t * (3 - 2 * t);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hash01(input: number): number {
  let x = input | 0;
  x = Math.imul(x ^ 0x7feb352d, 0x846ca68b);
  x ^= x >>> 15;
  x = Math.imul(x ^ 0xc2b2ae35, 0x27d4eb2d);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

function encodeRgbaAsPng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlineLength = width * 4 + 1;
  const raw = new Uint8Array(scanlineLength * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * scanlineLength;
    raw[rowStart] = 0;
    const sourceStart = y * width * 4;
    raw.set(rgba.subarray(sourceStart, sourceStart + width * 4), rowStart + 1);
  }

  const idat = deflateSync(raw);
  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", idat);
  const iendChunk = createChunk("IEND", new Uint8Array(0));

  return concatUint8Arrays(signature, ihdrChunk, idatChunk, iendChunk);
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const output = new Uint8Array(8 + data.length + 4);
  writeU32(output, 0, data.length);
  output[4] = type.charCodeAt(0);
  output[5] = type.charCodeAt(1);
  output[6] = type.charCodeAt(2);
  output[7] = type.charCodeAt(3);
  output.set(data, 8);
  const crc = crc32(output.subarray(4, 8 + data.length));
  writeU32(output, 8 + data.length, crc);
  return output;
}

function concatUint8Arrays(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  return output;
}

function writeU32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 255;
  target[offset + 1] = (value >>> 16) & 255;
  target[offset + 2] = (value >>> 8) & 255;
  target[offset + 3] = value & 255;
}

function crc32(data: Uint8Array): number {
  let crc = -1;
  for (let index = 0; index < data.length; index += 1) {
    const byte = data[index];
    if (byte === undefined) {
      continue;
    }
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ -1) >>> 0;
}

async function spawnChecked(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}
