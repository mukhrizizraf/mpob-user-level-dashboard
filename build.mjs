// Builds the self-contained User-level studio:
//   node build.mjs   ->   index.html  (served by GitHub Pages)
// Data: data/V3_DASHBOARD_SNAPSHOT.json (copy of the reviewed snapshot the V3 dashboard uses).
// Lottie player: vendor/lottie, the unmodified lottie-web 5.13.0 light build bundled with V3 (MIT).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { lottieIcons } from './src/lottie-icons.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(here, path), 'utf8');
const snapshotPath = 'data/V3_DASHBOARD_SNAPSHOT.json';
const lottieDir = 'vendor/lottie';
const output = 'index.html';

const snapshot = JSON.parse(read(snapshotPath));
const inlineJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const stripExports = source => source.replace(/^export\s+/gm, '');
const lottiePlayer = read(`${lottieDir}/lottie-light-5.13.0.mjs`).replace(/^export \{ lottie as default \};\s*$/m, 'window.lottie = lottie;');
if (!lottiePlayer.includes('window.lottie = lottie;')) throw new Error('Lottie export line not found; the player build changed.');

const html = read('src/index.html')
  .replace('/*__CSS__*/', () => read('src/styles.css'))
  .replace('__SNAPSHOT__', () => inlineJson({ generatedAt: snapshot.generatedAt, status: snapshot.status, queries: snapshot.queries }))
  .replace('__LOTTIE_ICONS__', () => inlineJson(lottieIcons))
  .replace('__LOTTIE_FLOW__', () => inlineJson(JSON.parse(read(`${lottieDir}/fund-flow-arrow.json`))))
  .replace('/*__LOTTIE__*/', () => `(function(){\n${lottiePlayer}\n})();`)
  .replace('/*__MODEL__*/', () => stripExports(read('src/model.js')))
  .replace('/*__APP__*/', () => read('src/app.js'));

for (const token of ['/*__CSS__*/', '__SNAPSHOT__', '__LOTTIE_ICONS__', '__LOTTIE_FLOW__', '/*__LOTTIE__*/', '/*__MODEL__*/', '/*__APP__*/']) {
  if (html.includes(token)) throw new Error(`Unreplaced build token ${token}`);
}
writeFileSync(join(here, output), html);
console.log(`Built ${relative(process.cwd(), join(here, output))} (${(html.length / 1024).toFixed(0)} KB) from snapshot ${snapshot.generatedAt}`);
