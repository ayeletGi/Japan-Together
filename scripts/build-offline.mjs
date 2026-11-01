// Inlines the built JS, CSS, fonts and photos into one HTML file that opens without internet.
// Run after `vite build --base=./` (see `npm run build:artifact`).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const dist = 'dist';
const out = path.join(dist, 'japan-together-offline.html');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const assetTypes = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
function inlineAssets(css) {
  return css.replace(/url\(\.?\/?(?:assets\/)?([^)"']+\.(?:woff2?|jpe?g|webp))\)/g, (_, name) => {
    const bytes = fs.readFileSync(path.join(dist, 'assets', name));
    return `url(data:${assetTypes[path.extname(name)]};base64,${bytes.toString('base64')})`;
  });
}

html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, (_, src) => {
  const js = fs.readFileSync(path.join(dist, src), 'utf8');
  assert.ok(!/<\/script/i.test(js), 'bundle contains </script and cannot be inlined');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/, (_, href) => {
  const css = inlineAssets(fs.readFileSync(path.join(dist, href), 'utf8'));
  return `<style>${css}</style>`;
});
assert.ok(!/(src|href)="\.?\/?assets\//.test(html), 'an asset was left as an external reference');

fs.writeFileSync(out, html);
console.log(`Offline copy: ${out} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
