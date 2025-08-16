// scripts/update-news.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const NEWS_DIR = path.join(__dirname, "..", "public", "news");
const OUT_FILE = path.join(__dirname, "..", "public", "news.json");

// 뉴스 HTML에서 메타 추출
function parseHtmlMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "";
  const categoryRaw =
    (html.match(
      /<meta\s+name=["']category["']\s+content=["']([^"']*)["']/i
    ) || [])[1] || "";
  const description =
    (html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
    ) || [])[1] || "";
  const categories = categoryRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { title, categories, summary: description };
}

function toISODate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// 1) 폴더 순회
const files = fs
  .readdirSync(NEWS_DIR)
  .filter((f) => /\.html?$/i.test(f))
  .sort(); // 이름순

const items = [];

for (const name of files) {
  const full = path.join(NEWS_DIR, name);
  const html = fs.readFileSync(full, "utf-8");

  // 파일명에서 날짜 추출: YYYY-MM-DD-*.html
  const dateFromName = (name.match(/^(\d{4}-\d{2}-\d{2})-/) || [])[1] || null;
  // 못찾으면 파일 수정일로
  const stat = fs.statSync(full);
  const date = dateFromName || toISODate(stat.mtime);

  const { title, categories, summary } = parseHtmlMeta(html);

  items.push({
    id: name.replace(/\.html?$/i, ""),     // 예: 2025-08-16-holiday-debate
    date,                                   // 예: 2025-08-16
    title: title || name,                   // 타이틀 없으면 파일명
    categories,
    summary,
    link: `/news/${name}`
  });
}

// 최신순 정렬
items.sort((a, b) => b.date.localeCompare(a.date));

// 출력 JSON
const payload = {
  generatedAt: new Date().toISOString(),
  count: items.length,
  items
};

fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), "utf-8");
console.log(`✅ Generated ${OUT_FILE} (${items.length} items)`);
