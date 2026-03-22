/**
 * P3-72: SSG prerender script.
 * Generates static HTML for SEO-critical pages at build time.
 * Run after `vite build`: node prerender.mjs
 */
import fs from "fs";
import path from "path";

const DIST = path.resolve("dist");
const INDEX = path.join(DIST, "index.html");

// Routes to prerender as static HTML copies
const ROUTES = ["/privacy", "/terms", "/location-terms", "/cost-simulator"];

if (!fs.existsSync(INDEX)) {
  console.error("dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

const html = fs.readFileSync(INDEX, "utf-8");

for (const route of ROUTES) {
  const dir = path.join(DIST, route);
  fs.mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, "index.html");

  // Inject route-specific meta if needed; for now, copy the SPA shell
  // so crawlers get a valid HTML page that hydrates on load
  fs.writeFileSync(outFile, html, "utf-8");
  console.log(`  Prerendered: ${route}/index.html`);
}

console.log(`SSG complete: ${ROUTES.length} pages prerendered.`);
