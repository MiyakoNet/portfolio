// ビルドスクリプト: 環境変数から config.js を生成し、
// minify 済みのファイルを dist/ に書き出す（Vercel は dist を配信する）
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = __dirname;
const dist = path.join(root, "dist");

// ===== 1. 設定の組み立て（.env / 環境変数 / デフォルト） =====
const config = {
  SITE_URL: "https://miyako.net",
  TWITTER_URL: "https://x.com/MiyakoNet",
  GITHUB_URL: "https://github.com/MiyakoNet",
  TELEGRAM_URL: "https://t.me/miyako",
  CONTACT_EMAIL: "contact@miyako.net",
  NICO_URL: "https://nicovideodl.jp",
  PORTFOLIO_REPO_URL: "https://github.com/MiyakoNet/portfolio",
};

const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) config[m[1]] = m[2];
  }
}
for (const key of Object.keys(config)) {
  if (process.env[key]) config[key] = process.env[key];
}

const configJs = "window.SITE_CONFIG = " + JSON.stringify(config, null, 2) + ";\n";

// ===== 2. dist を作り直す（掴まっている場合は少し待って再試行） =====
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    fs.rmSync(dist, { recursive: true, force: true });
    break;
  } catch (e) {
    if (attempt === 4) {
      console.warn("dist の削除に失敗。既存ファイルを上書きして続行します");
    } else {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
}
fs.mkdirSync(path.join(dist, "js"), { recursive: true });

// config.js はローカル開発用にルートへ出力（dist では下記の通り HTML にインライン化）
fs.writeFileSync(path.join(root, "config.js"), configJs);

// ===== 3. index.html（CSS をインライン化 + minify JS 参照 + config をインライン化） =====
const css = fs.readFileSync(path.join(root, "css", "miyako.css"), "utf8");
const minCss = esbuild.transformSync(css, { loader: "css", minify: true }).code;

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
// レンダリングブロックを無くすため、CSS は外部ファイルにせず <style> で埋め込む
html = html.replace(
  '<link rel="stylesheet" href="css/miyako.css">',
  "<style>" + minCss + "</style>"
);
html = html.replaceAll("js/main.js", "js/main.min.js");
// config.js へのリクエストを省くため、設定をインラインで埋め込む
html = html.replaceAll(
  '<script src="config.js"></script>',
  "<script>window.SITE_CONFIG = " + JSON.stringify(config) + ";</script>"
);
fs.writeFileSync(path.join(dist, "index.html"), html);

// ===== 4. JS を minify（defer 付きなのでレンダリングブロックにはならない） =====
const js = fs.readFileSync(path.join(root, "js", "main.js"), "utf8");
fs.writeFileSync(
  path.join(dist, "js", "main.min.js"),
  esbuild.transformSync(js, { minify: true }).code
);

// ===== 5. その他の静的ファイルをコピー =====
const staticFiles = [
  "favicon.ico",
  "icon.png",
  "icon.webp",
  "nicovideodl1.webp",
  "nicovideodl2.webp",
  "nicovideodl3.webp",
  "robots.txt",
  "sitemap.xml",
];
for (const f of staticFiles) {
  fs.copyFileSync(path.join(root, f), path.join(dist, f));
}

console.log("dist/ generated");
