import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = "https://www.aquin.app/";
const outDir = __dirname + "/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
const html = await page.content();
await page.screenshot({ path: join(__dirname, "screenshot.png"), fullPage: true });
await browser.close();

writeFileSync(join(__dirname, "index.rendered.html"), html, "utf8");
console.log("Wrote index.rendered.html and screenshot.png");
