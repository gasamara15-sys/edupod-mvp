// scripts/update-news.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const NEWS_DIR = join(ROOT, "public", "news");
const OUT_PATH = join(ROOT, "public", "news.json");

// YYYY-MM-DD-slug.html → {date, id, slug}
function parseFileName(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.html$/);
  if (!m) return null;
  return { date: m[1], id: m[1] + "-" + m[2], slug: m[2] };
}

// very small helper to pull <title> / meta tags
function pickMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']\\s*/?>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}
function pickTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

function main() {
  if (!existsSync(NEWS_DIR)) {
    mkdirSync(NEWS_DIR, { recursive: true });
  }

  const files = readdirSync(NEWS_DIR).filter(f => f.endsWith(".html"));
  const items = [];

  for (const f of files) {
    const parsed = parseFileName(f);
    if (!parsed) continue;

    const full = join(NEWS_DIR, f);
    const html = readFileSync(full, "utf-8");

    const title = pickTitle(html) || parsed.slug.replace(/-/g, " ");
    const category = (pickMeta(html, "category") || "").split(",").map(s => s.trim()).filter(Boolean);
    const summary = pickMeta(html, "description") || "";

    items.push({
      id: parsed.id,
      date: parsed.date,              // "2025-08-17"
      title,                          // 기사 제목
      categories: category,           // ["과학","기술"]
      summary,                        // 짧은 요약
      link: `/news/${f}`              // 정적 링크
    });
  }

  // 최신순으로 정렬
  items.sort((a, b) => (b.date).localeCompare(a.date));

  const payload = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    items
  };

  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`✓ Generated ${OUT_PATH} with ${items.length} entries`);
}

main();
