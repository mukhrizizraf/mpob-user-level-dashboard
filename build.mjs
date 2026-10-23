// Builds the self-contained User-level studio:
//   node build.mjs   ->   ../MPOB_Mandate_Decision_Studio_user_level.html   (inside the project)
//                    ->   index.html                                      (inside the GitHub repo copy)
// Data: the reviewed V3 snapshot, plus the snapshot month's methanol and glycerol inputs from the V3 master
// workbook trace (cell-provenance.json). Inside the project both come straight from V3 and
// data/ingredients.json is refreshed, so a standalone repo copy (with data/ and vendor/) builds identically.
// Lottie player: the unmodified lottie-web 5.13.0 light build bundled with V3 (MIT).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { lottieIcons } from './src/lottie-icons.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const at = path => join(here, path);
const read = path => readFileSync(at(path), 'utf8');

const inProject = existsSync(at('../V3_DASHBOARD_APP'));
const snapshotPath = inProject ? '../../data/V3_DASHBOARD_SNAPSHOT.json' : 'data/V3_DASHBOARD_SNAPSHOT.json';
const lottieDir = inProject ? '../V3_DASHBOARD_APP/src/content/assets/lottie' : 'vendor/lottie';
const provenancePath = '../V3_DASHBOARD_APP/src/content/dashboard/cell-provenance.json';
const output = inProject ? '../MPOB_Mandate_Decision_Studio_user_level.html' : 'index.html';

const snapshotText = read(snapshotPath);
const snapshot = JSON.parse(snapshotText);

// Snapshot-month methanol (E) and glycerol (F) prices from the master workbook, with their cells.
if (inProject) {
  const cells = JSON.parse(read(provenancePath));
  const [period, record] = Object.entries(cells.monthly).at(-1);
  mkdirSync(at('data'), { recursive: true });
  writeFileSync(at('data/ingredients.json'), `${JSON.stringify({
    period, masterFile: cells.masterFile, row: record.row, methanol: record.values.E, glycerol: record.values.F,
    cells: { methanol: `E${record.row}`, glycerol: `F${record.row}` },
  }, null, 2)}\n`);
}
const ingredients = JSON.parse(read('data/ingredients.json'));
if (ingredients.period !== snapshot.queries.decision_snapshot.rows[0].period) throw new Error(`Ingredient month ${ingredients.period} does not match the snapshot month.`);

const inlineJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const stripExports = source => source.replace(/^export\s+/gm, '');
const lottiePlayer = read(`${lottieDir}/lottie-light-5.13.0.mjs`).replace(/^export \{ lottie as default \};\s*$/m, 'window.lottie = lottie;');
if (!lottiePlayer.includes('window.lottie = lottie;')) throw new Error('Lottie export line not found; the player build changed.');

const html = read('src/index.html')
  .replace('/*__CSS__*/', () => `${read('src/styles.css')}\n${read('src/shared.css')}`)
  .replace('__SNAPSHOT__', () => inlineJson({ generatedAt: snapshot.generatedAt, status: snapshot.status, releaseFingerprint: snapshot.releaseFingerprint,
    snapshotSha256: createHash('sha256').update(snapshotText).digest('hex'), builtAt: new Date().toISOString(), queries: snapshot.queries }))
  .replace('__INGREDIENTS__', () => inlineJson(ingredients))
  .replace('__LOTTIE_ICONS__', () => inlineJson(lottieIcons))
  .replace('__LOTTIE_FLOW__', () => inlineJson(JSON.parse(read(`${lottieDir}/fund-flow-arrow.json`))))
  .replace('/*__LOTTIE__*/', () => `(function(){\n${lottiePlayer}\n})();`)
  .replace('/*__MODEL__*/', () => stripExports(read('src/model.js')))
  .replace('/*__MOTION__*/', () => read('src/motion.js'))
  .replace('/*__THEME__*/', () => read('src/theme.js'))
  .replace('/*__APP__*/', () => read('src/app.js'));

for (const token of ['/*__CSS__*/', '__SNAPSHOT__', '__INGREDIENTS__', '__LOTTIE_ICONS__', '__LOTTIE_FLOW__', '/*__LOTTIE__*/', '/*__MODEL__*/', '/*__MOTION__*/', '/*__THEME__*/', '/*__APP__*/']) {
  if (html.includes(token)) throw new Error(`Unreplaced build token ${token}`);
}
writeFileSync(at(output), html);
console.log(`Built ${relative(process.cwd(), at(output))} (${(html.length / 1024).toFixed(0)} KB) from snapshot ${snapshot.generatedAt}`);
