// MPOB Mandate Decision Studio · User level
// Reads the reviewed V3 snapshot embedded at build time and applies the V3 rules in model.js.

const SNAP = JSON.parse(document.getElementById('mpob-snapshot').textContent);
const Q = SNAP.queries;
const A = Q.model_assumptions.rows[0];
const BASE = Q.decision_snapshot.rows[0];
const META = Q.model_registry.rows[0];
const MONTHLY = Q.rq1_monthly.rows;
const COEF = Q.rq1_coefficients.rows;
const coef = key => num(COEF.find(row => row.Variable === key)?.Coefficient);
const diag = prefix => num(Q.rq1_apmbio_diagnostic.rows.find(row => String(row.component).startsWith(prefix))?.rmTonne);
const LATEST_CPO = num(MONTHLY.at(-1).cpoRmT);
const SAVINGS_ANNUAL = num(Q.rq3_financing.rows.find(row => row.Instrument === 'Subsidy savings')?.['Annual revenue (RM mn)']);
const BREAK_EVEN = Q.rq1_breakeven.rows.map(row => ({ brent: num(row['Brent (USD/bbl)']), mops: num(row['MOPS diesel (RM/t)']), cpo: num(row['Break-even CPO (RM/t)']) }));
const BASE_CAPTURE = num(A.savingsCaptureRate);
const SCENARIOS = ['A', 'B', 'C', 'D'];
const CAPTURE_OPTIONS = [...new Set(['9', '60'].flatMap(h => rq2CaptureChoices(Q, h, BASE_CAPTURE)))].sort((a, b) => a - b);
const SEED_MAX = Math.max(...Q.rq2_seed.rows.map(row => num(row['Optimal F0 (RM mn)'])));
const RQ4 = Q.rq4_summary.rows[0];
const REDUCTION_VS_B20 = num(RQ4.vol_b20) === 0 ? 0 : (num(RQ4.vol_b20) - num(RQ4.vol_dual)) / num(RQ4.vol_b20);
const REDUCE_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Latest ingredient prices behind the fitted cost: CPO from the preceding month; methanol and
// glycerol recovered from the fitted terms in rq1_apmbio_diagnostic (term ÷ coefficient).
const INGREDIENTS = {
  cpoLag: num(MONTHLY.at(-2).cpoRmT),
  methanol: Math.round(diag('Methanol') / coef('meoh_rm')),
  glycerol: Math.round(diag('Glycerol') / coef('gly_rm')),
};

const DEFAULTS = {
  mops: num(BASE.mopsRmT), pme: num(BASE.pmeRmT), fund: num(BASE.fundRmMn), bslRate: num(BASE.bslRateRmT),
  capture: BASE_CAPTURE, productionPct: 100, governmentSeed: 100, b30Auth: String(BASE.b30Authorised) === 'true',
  pmeMode: 'latest', ...INGREDIENTS, brent: 100, scenario: 'A', horizon: '60',
};
const S = { ...DEFAULTS, dec: {}, tab: 'obj1', step: { obj1: 0, obj2: 0, obj3: 0, obj4: 0, decision: 0 } };

const pmeNow = () => S.pmeMode === 'formula'
  ? fittedPme(COEF, { cpoLag: S.cpoLag, methanol: S.methanol, glycerol: S.glycerol })
  : S.pme;
const decisionControls = () => ({
  mops: S.mops, pme: pmeNow(), fund: S.fund, bslRate: S.bslRate, capture: S.capture,
  productionPct: S.productionPct, governmentSeed: S.governmentSeed, b30Auth: S.b30Auth, ...S.dec,
});
const funding = c => fundingAmounts({ baseProductionMt: A.annualCpoProductionMt, productionPct: c.productionPct, bslRate: c.bslRate,
  savingsEstimate: SAVINGS_ANNUAL, savingsShare: c.capture, startingMoney: c.governmentSeed });

function compute() {
  const pme = pmeNow();
  const p = policyState({ mops: S.mops, pme, fund: S.fund, b30Auth: S.b30Auth }, A);
  const dc = decisionControls();
  return {
    pme, p, f: funding(S), dc, dp: policyState(dc, A), df: funding(dc),
    be: BREAK_EVEN.find(row => row.brent === S.brent) ?? BREAK_EVEN[0],
    e: selectRq2(Q, S.horizon, S.scenario, S.capture, BASE_CAPTURE),
  };
}

/* ── Icons (24px line) ───────────────────────────────── */
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON = {
  pump: svg('M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M6.5 8h5M14 10h1.5a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3'),
  flask: svg('M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M7.4 14h9.2'),
  scale: svg('M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z'),
  target: svg('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01M21 3l-9 9'),
  flag: svg('M5 21V4M5 4h12l-2.5 4L17 12H5'),
  cycle: svg('M4 12a8 8 0 0 1 14-5.3M20 3.5v4h-4M20 12a8 8 0 0 1-14 5.3M4 20.5v-4h4'),
  drop: svg('M12 3s6.5 6.6 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z'),
  calendar: svg('M4 6h16v15H4zM4 10.5h16M8.5 3v5M15.5 3v5'),
  percent: svg('M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'),
  shield: svg('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5'),
  coins: svg('M12 10c3.9 0 7-1.3 7-3s-3.1-3-7-3-7 1.3-7 3 3.1 3 7 3zM5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5'),
  leaf: svg('M5 19C5 10.5 10.5 5 20 4c-.5 9.5-6 15-15 15zM5 19l8.5-8.5'),
  wallet: svg('M3 7.5h15a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H3V7.5zM3 7.5 14 4l1.6 3.5M16.5 14h.01'),
  bank: svg('M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18'),
  bars: svg('M5 20V11M11 20V5M17 20v-6M3 20h18'),
  stamp: svg('M9 3h6v5l3 3H6l3-3V3zM5 14h14v3H5zM7 21h10'),
  bolt: svg('M13 3 4 14h7l-1 7 9-11h-7l1-7z'),
  check: svg('M5 12.5l4.5 4.5L19 7.5'),
  chev: svg('M9 5l7 7-7 7'),
  chevL: svg('M15 5l-7 7 7 7'),
  palm: svg('M12 21v-9M12 12C9 8 5 8 3 10M12 12c3-4 7-4 9-2M12 12c-1-4-4-7-7-7M12 12c1-4 4-7 7-7M12 12c0-3 0-6 0-8'),
};

/* ── Sliders ─────────────────────────────────────────── */
const SL = {
  mops: { min: 1500, max: 6000, step: 0.01, fmt: v => rmT(v, 2) },
  pme: { min: 1500, max: 6000, step: 0.01, fmt: v => rmT(v, 2) },
  cpoLag: { min: 1000, max: 8000, step: 1, fmt: v => rmT(v) },
  methanol: { min: 500, max: 4000, step: 1, fmt: v => rmT(v) },
  glycerol: { min: 0, max: 6000, step: 1, fmt: v => rmT(v) },
  fund: { min: 0, max: 6000, step: 50, fmt: v => rmMn(v) },
  bslRate: { min: 0, max: 100, step: 1, fmt: v => rmT(v) },
  capture: { min: 0, max: 1, step: 0.01, fmt: v => pct(v, 0), raw: v => String(Math.round(v * 100)), parse: v => v / 100 },
  productionPct: { min: 90, max: 110, step: 1, fmt: v => `${Math.round(v)}%` },
  governmentSeed: { min: 0, max: 1000, step: 25, fmt: v => rmMn(v) },
};
const baseKey = key => key.startsWith('dec.') ? key.slice(4) : key;
const get = key => key.startsWith('dec.') ? decisionControls()[key.slice(4)] : S[key];
const isChanged = key => key.startsWith('dec.') ? Object.hasOwn(S.dec, key.slice(4)) : get(key) !== DEFAULTS[key];
function set(key, value) {
  if (key.startsWith('dec.')) S.dec[key.slice(4)] = value; else S[key] = value;
  refresh();
}
function resetKey(key) {
  if (key.startsWith('dec.')) delete S.dec[key.slice(4)]; else S[key] = DEFAULTS[key];
  refresh();
}
let uid = 0;
function slider(key, label, note = '') {
  const c = SL[baseKey(key)];
  const id = `r${++uid}`;
  return `<div class="control">
    <div class="control-top"><label for="${id}">${label}</label><input class="control-value" data-num="${key}" inputmode="decimal" aria-label="${label}, exact value"></div>
    <input type="range" id="${id}" data-range="${key}" min="${c.min}" max="${c.max}" step="${c.step}">
    <div class="control-meta"><span>${c.fmt(c.min)}</span><button type="button" class="reset" data-reset="${key}">Reset to latest</button><span>${c.fmt(c.max)}</span></div>
    ${note ? `<p class="note">${note}</p>` : ''}
  </div>`;
}

/* ── Output bindings ─────────────────────────────────── */
const T = (n, f) => ({ n, f });
const gapState = g => g > 0 ? 'good' : g < 0 ? 'bad' : 'hold';
const passState = ok => ok ? 'good' : 'bad';
const mandateLabel = m => m === 'B15' ? 'B15' : m;
const mandateTag = m => m === 'B15' ? 'Proposed safeguard only' : m === 'B30' ? 'All three checks pass' : 'Default blend';
const surviveHeadline = e => !e.row ? 'Not tested' : num(e.solvency) >= num(A.solvencyTarget) && num(e.survival6m) >= 0.9 ? 'Passes both tests'
  : num(e.survival6m) >= 0.9 ? 'Passes 6 months, not the full period' : 'Does not pass';
const periodLabel = h => String(h) === '60' ? '5 years' : `${h} months`;
const fiveYearPasses = Q.rq2_scenarios_60m.rows.filter(row => num(row.solvency_prob) >= num(A.solvencyTarget)).length;

const B = {
  // OBJ1
  mops: () => T(S.mops, v => rmT(v, 2)),
  pme: c => T(c.pme, v => rmT(v, 2)),
  pmeSource: () => S.pmeMode === 'formula' ? 'Estimated with the APM-Bio cost formula' : `Latest reviewed cost · ${BASE.period}`,
  pmeLatest: () => S.pmeMode === 'latest',
  pmeFormula: () => S.pmeMode === 'formula',
  gap: c => T(c.p.gap, signedRmT),
  gapState: c => gapState(c.p.gap),
  gapPos: c => Math.max(0, Math.min(100, (c.p.gap + 4500) / 9000 * 100)),
  gapWord: c => c.p.gap > 0 ? 'Savings' : c.p.gap < 0 ? 'Support needed' : 'Equal prices',
  gapSentence: c => c.p.gap > 0 ? `Biodiesel is ${rm(c.p.gap, 2)}/t cheaper than diesel. Blending saves money.`
    : c.p.gap < 0 ? `Biodiesel costs ${rm(-c.p.gap, 2)}/t more than diesel. Support may be needed.` : 'Biodiesel and diesel cost the same.',
  beCpo: c => T(c.be.cpo, v => rmT(v, 1)),
  beSub: c => `Diesel at USD ${c.be.brent}/bbl: ${rmT(c.be.mops, 1)} · Latest CPO: ${rmT(LATEST_CPO, 1)}`,
  beState: c => LATEST_CPO <= c.be.cpo ? 'good' : 'bad',
  beWord: c => LATEST_CPO <= c.be.cpo ? `CPO is ${rm(c.be.cpo - LATEST_CPO, 1)} below break-even` : `CPO is ${rm(LATEST_CPO - c.be.cpo, 1)} above break-even`,
  priceState: c => passState(c.p.pricePass),
  priceWord: c => c.p.pricePass ? 'Pass' : 'Fail',
  // OBJ2
  s6: c => c.e.row ? T(num(c.e.survival6m), v => pct(v, 1)) : '—',
  s6w: c => c.e.row ? num(c.e.survival6m) * 100 : 0,
  s6state: c => passState(num(c.e.survival6m) >= 0.9),
  s6word: c => !c.e.row ? 'Not tested' : num(c.e.survival6m) >= 0.9 ? 'Meets the 90% target' : 'Below the 90% target',
  fullLabel: () => `Lasts the whole ${periodLabel(S.horizon)}`,
  sol: c => c.e.row ? T(num(c.e.solvency), v => pct(v, 1)) : '—',
  solw: c => c.e.row ? num(c.e.solvency) * 100 : 0,
  solstate: c => passState(num(c.e.solvency) >= num(A.solvencyTarget)),
  solword: c => !c.e.row ? 'Not tested' : num(c.e.solvency) >= num(A.solvencyTarget) ? `Meets the ${pct(A.solvencyTarget, 0)} target` : `Below the ${pct(A.solvencyTarget, 0)} target`,
  rq2Head: c => surviveHeadline(c.e),
  rq2State: c => !c.e.row ? 'hold' : surviveHeadline(c.e) === 'Passes both tests' ? 'good' : num(c.e.survival6m) >= 0.9 ? 'hold' : 'bad',
  rq2Sub: () => `${scenarioName(S.scenario)} · ${pct(S.capture, 0)} of savings paid in · ${periodLabel(S.horizon)}`,
  capUntested: c => !c.e.row,
  // OBJ3
  bslRevenue: c => T(c.f.bslRevenue, v => rmMn(v, 1)),
  bslSub: c => `${rmT(S.bslRate)} × ${c.f.productionMt.toFixed(3)} mn t of CPO`,
  production: c => T(c.f.productionMt, v => `${v.toFixed(3)} mn t`),
  paidSavings: c => T(c.f.paidSavings, v => rmMn(v, 1)),
  savingsSub: () => `${pct(S.capture, 0)} of ${rmMn(SAVINGS_ANNUAL, 2)} modelled savings`,
  combined: c => T(c.f.withStartingMoney, v => rmMn(v, 1)),
  combinedSub: c => `${rmMn(c.f.fundingEstimate, 1)} levy + savings, plus ${rmMn(S.governmentSeed)} paid once`,
  fundingEstimate: c => T(c.f.fundingEstimate, v => rmMn(v, 1)),
  stackBsl: c => c.f.bslRevenue,
  stackSav: c => c.f.paidSavings,
  stackSeed: () => S.governmentSeed,
  stackBslT: c => rmMn(c.f.bslRevenue, 0),
  stackSavT: c => rmMn(c.f.paidSavings, 0),
  stackSeedT: () => rmMn(S.governmentSeed, 0),
  // OBJ4
  fundT: () => T(S.fund, v => rmMn(v)),
  fundState: c => passState(c.p.fundSafe),
  fundWord: c => c.p.fundSafe ? 'Pass' : 'Fail',
  fundBar: () => Math.min(100, S.fund / SL.fund.max * 100),
  approvalState: () => passState(S.b30Auth),
  approvalWord: () => S.b30Auth ? 'On' : 'Off',
  mandate: c => mandateLabel(c.p.mandate),
  mandateState: c => c.p.mandate,
  mandateTag: c => mandateTag(c.p.mandate),
  reason: c => c.p.decisionReason,
  gapShort: c => signedRmT(c.p.gap),
  // Decision now
  dGap: c => T(c.dp.gap, signedRmT),
  dGapState: c => gapState(c.dp.gap),
  dPriceState: c => passState(c.dp.pricePass),
  dPriceWord: c => c.dp.pricePass ? 'Pass' : 'Fail',
  dGapShort: c => signedRmT(c.dp.gap),
  dFund: c => T(num(c.dc.fund), v => rmMn(v)),
  dFundState: c => passState(c.dp.fundSafe),
  dFundWord: c => c.dp.fundSafe ? 'Pass' : 'Fail',
  dFundShort: c => rmMn(c.dc.fund),
  dFundBar: c => Math.min(100, num(c.dc.fund) / SL.fund.max * 100),
  dFunding: c => T(c.df.fundingEstimate, v => rmMn(v, 1)),
  dApprovalState: c => passState(c.dc.b30Auth),
  dApprovalWord: c => c.dc.b30Auth ? 'On' : 'Off',
  dMandate: c => mandateLabel(c.dp.mandate),
  dMandateState: c => c.dp.mandate,
  dMandateTag: c => mandateTag(c.dp.mandate),
  dReason: c => c.dp.decisionReason,
  dChecks: c => `${Number(c.dp.pricePass) + Number(c.dp.fundSafe) + Number(Boolean(c.dc.b30Auth))} of 3 checks pass`,
  dChanged: () => Object.keys(S.dec).length > 0,
};
for (const id of SCENARIOS) {
  const pick = () => selectRq2(Q, S.horizon, id, S.capture, BASE_CAPTURE);
  B[`mc_${id}`] = () => pick().row ? num(pick().solvency) * 100 : 0;
  B[`mcs_${id}`] = () => passState(num(pick().solvency) >= num(A.solvencyTarget));
  B[`mcv_${id}`] = () => pick().row ? pct(pick().solvency, 1) : '—';
}
for (const value of CAPTURE_OPTIONS) {
  B[`cap_${Math.round(value * 100)}`] = () => rq2CaptureChoices(Q, S.horizon, BASE_CAPTURE).some(v => Math.abs(v - value) < 1e-8);
}

/* ── Shared fragments ────────────────────────────────── */
const outCard = (label, out, sub = '', state = '') => `<div class="out" ${state ? `data-state-of="${state}"` : ''}>
  <div class="out-label">${label}</div><div class="out-big" data-out="${out}"></div>${sub ? `<div class="out-sub" ${sub.startsWith('@') ? `data-out="${sub.slice(1)}">` : `>${sub}`}</div>` : ''}</div>`;
const light = (label, state, word, small) => `<div class="light" data-state-of="${state}"><span>${label}</span><strong data-out="${word}"></strong><small ${small.startsWith('@') ? `data-out="${small.slice(1)}">` : `>${small}`}</small></div>`;
const verdict = (blend, state, tag, reason) => `<div class="verdict" data-state-of="${state}" data-pop><div class="verdict-icon" data-lottie-of="${state}" aria-hidden="true"></div><div class="verdict-label">Blend for these settings</div>
  <div class="verdict-blend" data-out="${blend}"></div><div class="verdict-note" data-out="${reason}"></div><span class="verdict-tag" data-out="${tag}"></span></div>`;
const formula = () => `PME = ${coef('const').toFixed(2)} + ${coef('cpo_lag1').toFixed(3)} × CPO(last month) + ${coef('meoh_rm').toFixed(3)} × Methanol − ${Math.abs(coef('gly_rm')).toFixed(3)} × Glycerol`;
const fundBar = (bar, state) => `<div class="bar" style="margin-top:22px"><i data-w="${bar}" data-state-of="${state}"></i><em style="left:${(num(A.fundSafetyMultiple) * num(A.rolling12AvgB20DrawdownRmMn)) / SL.fund.max * 100}%"><b>Limit</b></em></div>`;
const fundLimit = `Must be above ${rmMn(num(A.fundSafetyMultiple) * num(A.rolling12AvgB20DrawdownRmMn), 2)} (${num(A.fundSafetyMultiple)} × recent average drawdown of ${rmMn(A.rolling12AvgB20DrawdownRmMn, 2)}).`;

function policyMap() {
  const rows = Q.rq4_map.rows.map(row => ({ cpo: num(row['CPO (RM/t)']), brent: num(row['Brent (USD/bbl)']), mandate: row.Mandate, vg: num(row['VG (RM/t)']) }));
  const brents = [...new Set(rows.map(r => r.brent))].sort((a, b) => a - b);
  const cpos = [...new Set(rows.map(r => r.cpo))].sort((a, b) => a - b);
  return `<div class="map" role="table" aria-label="Price check by CPO and Brent">
    <div class="ax">CPO \\ Brent</div>${brents.map(b => `<div class="ax">USD ${b}</div>`).join('')}
    ${cpos.map(cpo => `<div class="ax">${rm(cpo)}</div>${brents.map(b => { const cell = rows.find(r => r.cpo === cpo && r.brent === b);
      return `<div class="cell ${cell.mandate}">${cell.mandate}<small>${signedRmT(cell.vg)}</small></div>`; }).join('')}`).join('')}
  </div><p class="note">B30 cells pass the price check only. B30 still needs a safe fund and government approval.</p>`;
}

function financingCompare() {
  const rows = Q.rq3_financing.rows.filter(row => row.Instrument !== 'Seed capital (one-off)');
  const max = Math.max(...rows.map(row => num(row['Annual revenue (RM mn)'])));
  const taxBurden = num(rows.find(row => row.Instrument === 'Production tax')?.['Grower burden (RM/t)']);
  const name = { 'Export-point levy': 'Export-point levy', 'BSL (proposed)': 'BSL (proposed)', 'Production tax': 'Production tax', 'Subsidy savings': 'Subsidy savings' };
  return `<div class="compare">
    <div class="compare-row head"><span>Option</span><span>Money raised</span><span>Income swings (lower is steadier)</span><span>Cost to growers</span></div>
    ${rows.map(row => {
      const isRef = String(row.Instrument).startsWith('WPL');
      const revenue = row['Annual revenue (RM mn)'];
      const cv = row['Revenue CV (↓=stable)'];
      const burden = row['Grower burden (RM/t)'];
      const rate = row['Rate (RM/t)'];
      return `<div class="compare-row ${isRef ? 'is-ref' : ''}">
        <b>${isRef ? 'WPL' : name[row.Instrument] ?? row.Instrument}<small>${row['Collection point']}${rate != null ? ` · ${rmT(rate)}` : ''}</small></b>
        <div class="cell"><strong>${revenue == null ? 'Not estimated' : rmMn(revenue, 1)}</strong>${revenue == null ? '' : `<div class="mini"><i style="width:${num(revenue) / max * 100}%"></i></div>`}</div>
        <div class="cell"><strong>${cv == null ? '—' : num(cv).toFixed(3)}</strong><small>${cv == null ? 'Not estimated' : 'CV of income'}</small></div>
        <div class="cell"><strong class="${burden != null && num(burden) < taxBurden ? 'best' : ''}">${burden == null ? '—' : rmT(burden, 2)}</strong><small>${burden == null ? 'Not estimated' : 'per tonne CPO'}</small></div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ── Tabs and steps ──────────────────────────────────── */
const TABS = [
  {
    id: 'obj1', label: 'OBJ1', sub: 'Price', kicker: 'Objective 1',
    title: 'To develop an automatic pricing mechanism for biodiesel (APM-Bio).',
    steps: [
      { icon: 'pump', short: 'To set the diesel price', title: 'To set today’s diesel price', chip: () => rmT(S.mops),
        body: () => `<div>${slider('mops', 'Diesel price (MOPS)')}</div>${outCard('Diesel price', 'mops', `per tonne · latest month ${BASE.period}`)}` },
      { icon: 'flask', short: 'To estimate the biodiesel cost', title: 'To estimate the biodiesel cost', chip: c => rmT(c.pme),
        body: () => `<div>
          <div class="seg" role="group" aria-label="How to set biodiesel cost"><button type="button" data-set="pmeMode" data-val="latest">Latest cost</button><button type="button" data-set="pmeMode" data-val="formula">Build from ingredients</button></div>
          <div data-show="pmeLatest">${slider('pme', 'Biodiesel cost (PME)')}</div>
          <div data-show="pmeFormula">${slider('cpoLag', 'CPO price, last month')}${slider('methanol', 'Methanol price')}${slider('glycerol', 'Glycerol price (by-product)')}<div class="formula">${formula()}</div></div>
        </div>${outCard('Biodiesel cost', 'pme', '@pmeSource')}` },
      { icon: 'scale', short: 'To calculate the viability gap', title: 'To calculate the viability gap', chip: c => signedRmT(c.p.gap), single: true,
        body: () => `<div class="equation">
            <div class="eq-term"><span>Diesel price</span><strong data-out="mops"></strong></div><div class="eq-op">−</div>
            <div class="eq-term"><span>Biodiesel cost</span><strong data-out="pme"></strong></div><div class="eq-op">=</div>
            <div class="eq-term result"><span>Viability gap</span><strong data-out="gap"></strong></div></div>
          <div class="meter" role="img" aria-label="Viability gap position"><span class="zero"><b>VG = 0</b></span><span class="marker" data-l="gapPos"></span></div>
          <div class="meter-labels"><span>← Support needed</span><span>Savings →</span></div>
          <span class="badge" data-state-of="gapState" data-out="gapWord"></span>` },
      { icon: 'target', short: 'To find the break-even CPO price', title: 'To find the break-even CPO price', chip: c => `USD ${c.be.brent} → ${rm(c.be.cpo)}`,
        body: () => `<div><div class="control-top"><label>Brent crude oil (USD per barrel)</label></div>
          <div class="chips">${BREAK_EVEN.map(b => `<button type="button" class="chip" data-set="brent" data-type="num" data-val="${b.brent}">USD ${b.brent}</button>`).join('')}</div>
          <p class="note">Biodiesel breaks even when CPO is at or below this price. Methanol and glycerol stay at their latest values.</p></div>
          <div class="out" data-state-of="beState"><div class="out-label">Break-even CPO price</div><div class="out-big" data-out="beCpo"></div><div class="out-sub" data-out="beSub"></div><span class="badge" data-state-of="beState" data-out="beWord"></span></div>` },
      { icon: 'flag', short: 'To report the price signal', title: 'To report the price signal', chip: c => c.p.gap > 0 ? 'Savings' : c.p.gap < 0 ? 'Support needed' : 'Equal',
        body: () => `${outCard(`APM-Bio price signal · ${BASE.period}`, 'gap', '@gapSentence', 'gapState')}
          <div><div class="lights" style="grid-template-columns:1fr">${light('B30 price check', 'priceState', 'priceWord', 'The gap must be above RM 0/t')}</div>
          <div class="handoff"><div class="handoff-arrow" data-lottie-flow aria-hidden="true"></div><span>This gap feeds the Objective 4 price check and Decision now.</span></div>
          <div class="chips"><button type="button" class="btn btn-primary" data-tab="obj4">Use in Objective 4${ICON.chev}</button><button type="button" class="btn btn-ghost" data-tab="decision">Decision now</button></div></div>` },
    ],
  },
  {
    id: 'obj2', label: 'OBJ2', sub: 'Fund', kicker: 'Objective 2',
    title: 'To evaluate whether a Biodiesel Stabilisation Fund (BSF) can withstand price shocks.',
    steps: [
      { icon: 'cycle', short: 'To see how the fund moves', title: 'To see how the fund moves each month', chip: () => 'Monthly flow', single: true,
        body: () => `<div class="cycle">
          <div class="cyc on" style="--k:var(--s1-ink)"><b>F</b><strong>Opening balance</strong><span>Starts at ${rmMn(A.seedCapitalRmMn)}</span></div><div class="cyc-op">+</div>
          <div class="cyc on" style="--k:var(--s6-ink);animation-delay:1.2s"><b>+</b><strong>Money in</strong><span>Levy and savings</span></div><div class="cyc-op">−</div>
          <div class="cyc on" style="--k:var(--s2-ink);animation-delay:2.4s"><b>−</b><strong>Support paid</strong><span>When biodiesel costs more</span></div><div class="cyc-op">=</div>
          <div class="cyc on" style="--k:var(--s3-ink);animation-delay:3.6s"><b>F′</b><strong>Closing balance</strong><span>Next month’s start</span></div></div>
          <p class="loop-note">Repeated every month across ${num(A.mcPaths).toLocaleString('en-MY')} simulated oil-price paths. The balance cannot fall below RM 0.</p>` },
      { icon: 'drop', short: 'To choose an oil-price case', title: 'To choose an oil-price case', chip: () => scenarioName(S.scenario), single: true,
        body: () => `<div class="choice-grid">${SCENARIOS.map(id => { const s = rq2CaseSettings[id];
          return `<button type="button" class="choice" data-set="scenario" data-val="${id}"><span class="tag">Case ${id}</span><strong>${s.name}</strong><span>${s.jump ? `Brent USD ${s.brentTarget}/bbl after a ${s.jump}% jump` : `Brent USD ${s.brentTarget}/bbl`}</span></button>`; }).join('')}</div>` },
      { icon: 'calendar', short: 'To choose the test period', title: 'To choose the test period', chip: () => periodLabel(S.horizon), single: true,
        body: () => `<div class="choice-grid two">
          <button type="button" class="choice" data-set="horizon" data-val="9"><span class="tag">Short test</span><strong>9 months</strong><span>Includes the 6-month check</span></button>
          <button type="button" class="choice" data-set="horizon" data-val="60"><span class="tag">Long test</span><strong>5 years</strong><span>60 months</span></button></div>` },
      { icon: 'percent', short: 'To choose the savings paid in', title: 'To choose the share of savings paid into the fund', chip: c => `${pct(S.capture, 0)}${c.e.row ? '' : ' · not tested'}`, single: true,
        body: () => `<div class="choice-grid">${CAPTURE_OPTIONS.map(v => `<button type="button" class="choice" data-set="capture" data-type="num" data-val="${v}" data-show="cap_${Math.round(v * 100)}"><span class="tag">Savings share</span><strong>${pct(v, 0)}</strong><span>of savings paid in</span></button>`).join('')}</div>
          <p class="note" data-show="capUntested"><b>This share was not tested for this period.</b> Choose one of the cards above.</p>
          <p class="note">Only the shares tested in the saved runs are shown. The 9-month test used 100% only.</p>` },
      { icon: 'shield', short: 'To read fund survival', title: 'To read whether the fund survives', chip: c => c.e.row ? pct(c.e.solvency, 1) : 'Not tested',
        body: () => `<div>
          <div class="gauge"><div class="gauge-top"><span>Lasts the first 6 months</span><strong data-out="s6"></strong></div><div class="bar"><i data-w="s6w" data-state-of="s6state"></i><em style="left:90%"><b>90%</b></em></div><small data-out="s6word"></small></div>
          <div class="gauge" style="margin-top:28px"><div class="gauge-top"><span data-out="fullLabel"></span><strong data-out="sol"></strong></div><div class="bar"><i data-w="solw" data-state-of="solstate"></i><em style="left:${num(A.solvencyTarget) * 100}%"><b>${pct(A.solvencyTarget, 0)}</b></em></div><small data-out="solword"></small></div>
          <div class="mini-cases">${SCENARIOS.map(id => `<button type="button" class="mini-case" data-set="scenario" data-val="${id}"><div class="col"><i data-h="mc_${id}" data-state-of="mcs_${id}"></i></div><strong data-out="mcv_${id}"></strong><span>${scenarioName(id)}</span></button>`).join('')}</div>
          <p class="note">Chance the fund lasts the whole period, for each oil-price case.</p></div>
          <div class="out" data-state-of="rq2State"><div class="out-label">Answer</div><div class="out-big md" data-out="rq2Head"></div><div class="out-sub" data-out="rq2Sub"></div>
          <p class="note"><b>Starting money:</b> the search stopped at ${rmMn(SEED_MAX)}, the largest amount tested, without finding a safe 5-year amount.</p></div>` },
    ],
  },
  {
    id: 'obj3', label: 'OBJ3', sub: 'Funding', kicker: 'Objective 3',
    title: 'To determine the best sources of funding for the BSF.',
    steps: [
      { icon: 'coins', short: 'To set the levy rate (BSL)', title: 'To set the Biodiesel Stability Levy (BSL) rate', chip: () => rmT(S.bslRate),
        body: () => `<div>${slider('bslRate', 'BSL rate per tonne of CPO')}<div class="chips">${[20, 25, 30].map(v => `<button type="button" class="chip" data-set="bslRate" data-type="num" data-val="${v}">${rmT(v)}</button>`).join('')}</div></div>
          ${outCard('Levy income', 'bslRevenue', '@bslSub')}` },
      { icon: 'palm', short: 'To set CPO production', title: 'To set CPO production', chip: () => `${S.productionPct}%`,
        body: () => `<div>${slider('productionPct', 'CPO production (% of base)', `Base: ${num(A.annualCpoProductionMt).toFixed(3)} mn t (Jan–Apr 2026, not a full year).`)}</div>
          <div class="out"><div class="out-label">CPO production</div><div class="out-big" data-out="production"></div><div class="out-sub">Levy income: <b data-out="bslRevenue"></b></div></div>` },
      { icon: 'wallet', short: 'To choose the savings paid in', title: 'To choose the share of savings paid into the fund', chip: () => pct(S.capture, 0),
        body: () => `<div>${slider('capture', 'Savings paid into the fund')}</div>${outCard('Savings paid in', 'paidSavings', '@savingsSub')}` },
      { icon: 'bank', short: 'To add starting money', title: 'To add one-off starting money', chip: () => rmMn(S.governmentSeed),
        body: () => `<div>${slider('governmentSeed', 'Government starting money (paid once)')}</div>${outCard('Money available', 'combined', '@combinedSub')}` },
      { icon: 'bars', short: 'To compare funding options', title: 'To compare funding options', chip: c => rmMn(c.f.fundingEstimate, 1), single: true,
        body: () => `<div class="out"><div class="out-label">Your funding estimate (levy + savings)</div><div class="out-big md" data-out="fundingEstimate"></div><div class="out-sub">With one-off starting money: <b data-out="combined"></b></div>
            <div class="stack" role="img" aria-label="Funding mix"><i style="background:var(--s1)" data-grow="stackBsl" data-out="stackBslT"></i><i style="background:var(--s6)" data-grow="stackSav" data-out="stackSavT"></i><i style="background:var(--s4)" data-grow="stackSeed" data-out="stackSeedT"></i></div>
            <div class="legend"><span style="--k:var(--s1)">BSL levy</span><span style="--k:var(--s6)">Savings paid in</span><span style="--k:var(--s4)">Starting money (once)</span></div></div>
          <div style="margin-top:22px">${financingCompare()}</div>
          <div class="out" data-state="good" style="margin-top:18px"><div class="out-label">Result</div><div class="out-big md" style="font-size:28px">Export-point levy and BSL cost growers the least.</div>
            <div class="out-sub">Steadier income is not yet shown: their income swings are similar to a production tax. Starting money is paid once, not every year. WPL is a baseline reference only. The table uses the saved RM 25/t comparison.</div></div>` },
    ],
  },
  {
    id: 'obj4', label: 'OBJ4', sub: 'Mandate rule', kicker: 'Objective 4',
    title: 'To develop a dynamic rule for moving between B20 and B30.',
    steps: [
      { icon: 'scale', short: 'To check the price gap', title: 'To check the price gap', chip: c => c.p.pricePass ? 'Pass' : 'Fail',
        body: () => `<div>${slider('mops', 'Diesel price (MOPS)')}<div data-show="pmeLatest">${slider('pme', 'Biodiesel cost (PME)')}</div>
          <p class="note" data-show="pmeFormula">Biodiesel cost comes from the ingredient formula in Objective 1.</p></div>
          <div>${outCard('Viability gap', 'gap', 'Must be above RM 0/t for B30', 'gapState')}<span class="badge" data-state-of="priceState" data-out="priceWord"></span></div>` },
      { icon: 'shield', short: 'To check the fund balance', title: 'To check the fund balance', chip: c => c.p.fundSafe ? 'Pass' : 'Fail',
        body: () => `<div>${slider('fund', 'Fund balance (BSF)')}</div>
          <div class="out" data-state-of="fundState"><div class="out-label">Fund balance</div><div class="out-big" data-out="fundT"></div><div class="out-sub">${fundLimit}</div>${fundBar('fundBar', 'fundState')}<span class="badge" data-state-of="fundState" data-out="fundWord"></span></div>` },
      { icon: 'stamp', short: 'To confirm B30 approval', title: 'To confirm government approval for B30', chip: () => S.b30Auth ? 'On' : 'Off', single: true,
        body: () => `<div class="switch-row"><div><strong>Assume B30 is approved</strong><span>A government decision. This switch only tests the rule.</span></div><button type="button" class="switch" role="switch" data-switch="b30Auth" aria-label="Assume B30 is approved"></button></div>` },
      { icon: 'flag', short: 'To apply the rule', title: 'To apply the B20 / B30 rule', chip: c => mandateLabel(c.p.mandate),
        body: () => `<div class="lights" style="grid-template-columns:1fr">${light('1 · Price gap', 'priceState', 'priceWord', '@gapShort')}${light('2 · Fund balance', 'fundState', 'fundWord', `Above ${rmMn(num(A.fundSafetyMultiple) * num(A.rolling12AvgB20DrawdownRmMn))}`)}${light('3 · B30 approval', 'approvalState', 'approvalWord', 'Government decision')}</div>
          <div>${verdict('mandate', 'mandateState', 'mandateTag', 'reason')}<details class="disclose"><summary>See the price map (CPO × Brent)</summary>${policyMap()}</details></div>` },
      { icon: 'bars', short: 'To compare with fixed blends', title: 'To compare cost swings with fixed blends', chip: () => `−${pct(RQ4.reduction_vs_b30, 1)} vs B30`,
        body: () => { const max = Math.max(num(RQ4.vol_b20), num(RQ4.vol_b30), num(RQ4.vol_dual));
          const bar = (label, v, k) => `<div class="vbar"><strong>${rmMn(v, 1)}</strong><div class="plot"><i style="height:${v / max * 100}%;--k:${k}"></i></div><span>${label}</span></div>`;
          return `<div><div class="out-label">Monthly cost swings (lower is better)</div><div class="vbars">${bar('Fixed B20', num(RQ4.vol_b20), 'var(--b20)')}${bar('Fixed B30', num(RQ4.vol_b30), 'var(--b30)')}${bar('The rule', num(RQ4.vol_dual), 'var(--s5)')}</div></div>
          <div><div class="lights" style="grid-template-columns:1fr">
            <div class="light" data-state="${num(RQ4.reduction_vs_b30) >= 0.25 ? 'good' : 'bad'}"><span>vs fixed B30</span><strong>${pct(RQ4.reduction_vs_b30, 1)} smaller</strong><small>${num(RQ4.reduction_vs_b30) >= 0.25 ? 'Meets' : 'Below'} the 25% target</small></div>
            <div class="light" data-state="${REDUCTION_VS_B20 >= 0.25 ? 'good' : 'bad'}"><span>vs fixed B20</span><strong>${pct(REDUCTION_VS_B20, 1)} smaller</strong><small>${REDUCTION_VS_B20 >= 0.25 ? 'Meets' : 'Below'} the 25% target</small></div></div>
            <p class="note">The rule chose B30 in ${pct(RQ4.b30_months_share, 1)} of past months and switched ${num(RQ4.switches_per_year).toFixed(2)} times a year (${MONTHLY[0].period} to ${MONTHLY.at(-1).period}).</p></div>`; } },
      { icon: 'bolt', short: 'To see what B30 would change', title: 'To see what moving to B30 would change', chip: () => '4 effects', single: true,
        body: () => { const row = p => Q.b30_impact.rows.find(r => String(r.dimension).startsWith(p));
          const fiscal = row('Fiscal'), industry = row('Industry'), green = row('Green'), ops = row('Operations');
          return `<div class="cards4">
            <div class="kcard" style="--k:var(--s2)"><span>Extra government support</span><strong>${rmMn(fiscal?.value)}</strong><small>per year, at the recent average gap</small></div>
            <div class="kcard" style="--k:var(--s4)"><span>Extra CPO used at home</span><strong>${num(industry?.value).toFixed(2)} mn t</strong><small>per year</small></div>
            <div class="kcard" style="--k:var(--s6)"><span>Fossil diesel replaced</span><strong>${num(green?.value).toFixed(2)} bn L</strong><small>per year</small></div>
            <div class="kcard" style="--k:var(--s1)"><span>PME needed vs recent output</span><strong>${num(ops?.value).toFixed(2)}×</strong><small>above 1× means supply is short</small></div></div>`; } },
    ],
  },
  {
    id: 'decision', label: 'Decision now', sub: '', kicker: 'Decision now',
    title: 'To decide this month’s biodiesel blend.',
    steps: [
      { icon: 'scale', short: 'To check prices', title: 'To check this month’s prices', chip: c => signedRmT(c.dp.gap),
        body: () => `<div>${slider('dec.mops', 'Diesel price (MOPS)')}${slider('dec.pme', 'Biodiesel cost (PME)')}</div>
          <div>${outCard('Viability gap', 'dGap', 'Must be above RM 0/t for B30', 'dGapState')}<span class="badge" data-state-of="dPriceState" data-out="dPriceWord"></span></div>` },
      { icon: 'shield', short: 'To check the fund', title: 'To check the fund balance', chip: c => c.dp.fundSafe ? 'Pass' : 'Fail',
        body: () => `<div>${slider('dec.fund', 'Fund balance (BSF)')}
          <details class="disclose"><summary>Money coming in</summary>${slider('dec.bslRate', 'BSL rate')}${slider('dec.capture', 'Savings paid into the fund')}
          <div class="out" style="margin-top:8px"><div class="out-label">Funding estimate</div><div class="out-big md" data-out="dFunding"></div><div class="out-sub">Levy + savings. Does not change the blend.</div></div></details></div>
          <div class="out" data-state-of="dFundState"><div class="out-label">Fund balance</div><div class="out-big" data-out="dFund"></div><div class="out-sub">${fundLimit}</div>${fundBar('dFundBar', 'dFundState')}<span class="badge" data-state-of="dFundState" data-out="dFundWord"></span></div>` },
      { icon: 'stamp', short: 'To confirm B30 approval', title: 'To confirm government approval for B30', chip: c => c.dc.b30Auth ? 'On' : 'Off', single: true,
        body: () => `<div class="switch-row"><div><strong>Assume B30 is approved</strong><span>A government decision. This switch only tests the rule.</span></div><button type="button" class="switch" role="switch" data-switch="dec.b30Auth" aria-label="Assume B30 is approved"></button></div>` },
      { icon: 'flag', short: 'To decide the blend', title: 'To decide the blend', chip: c => mandateLabel(c.dp.mandate), single: true,
        body: () => `<div class="stage-body" style="margin-top:0">
            <div class="lights" style="grid-template-columns:1fr">${light('1 · Price gap', 'dPriceState', 'dPriceWord', '@dGapShort')}${light('2 · Fund balance', 'dFundState', 'dFundWord', '@dFundShort')}${light('3 · B30 approval', 'dApprovalState', 'dApprovalWord', 'Government decision')}</div>
            ${verdict('dMandate', 'dMandateState', 'dMandateTag', 'dReason')}</div>
          <div class="summary4">
            <button type="button" class="sum" data-tab="obj1" style="--k:var(--s1-ink)"><span>OBJ1 · Price</span><strong data-out="dGapShort"></strong><small>Viability gap</small></button>
            <button type="button" class="sum" data-tab="obj2" style="--k:var(--s2-ink)"><span>OBJ2 · Fund</span><strong>${fiveYearPasses} of ${Q.rq2_scenarios_60m.rows.length} cases</strong><small>last 5 years in saved tests</small></button>
            <button type="button" class="sum" data-tab="obj3" style="--k:var(--s3-ink)"><span>OBJ3 · Funding</span><strong data-out="dFunding"></strong><small>Levy + savings</small></button>
            <button type="button" class="sum" data-tab="obj4" style="--k:var(--s4-ink)"><span>OBJ4 · Rule</span><strong data-out="dChecks"></strong><small>B30 needs all three</small></button></div>
          <p class="note" data-show="dChanged"><b>You changed values on this page.</b> <button type="button" class="btn-link" data-reset-all>Reset to the latest values</button></p>` },
    ],
  },
];
const tabById = id => TABS.find(t => t.id === id) ?? TABS[0];

/* ── Rendering ───────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function renderTabs() {
  $('#tabs').innerHTML = `<div class="tabs-track" role="tablist" aria-label="Objectives"><span class="tab-pill" id="tab-pill"></span>${TABS.map(t =>
    `<button type="button" role="tab" class="tab ${t.id === 'decision' ? 'is-decision' : ''}" data-tab="${t.id}" aria-selected="${t.id === S.tab}">${t.label}${t.sub ? `<small>${t.sub}</small>` : ''}</button>`).join('')}</div>`;
  requestAnimationFrame(movePill);
}
function movePill() {
  const active = $(`.tab[data-tab="${S.tab}"]`); const pill = $('#tab-pill');
  if (!active || !pill) return;
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === S.tab)));
  pill.style.left = `${active.offsetLeft}px`; pill.style.width = `${active.offsetWidth}px`;
  pill.classList.toggle('is-decision', S.tab === 'decision');
}

function renderPage() {
  const tab = tabById(S.tab);
  const n = tab.steps.length;
  $('#page').innerHTML = `<div class="page">
    <div class="aurora" aria-hidden="true"><i></i><i></i></div>
    <section class="hero"><div class="hero-kicker">${tab.kicker}</div><h1>${tab.title}</h1><div class="hero-meta">${n} steps. ${tab.id === 'decision' ? 'Changes here stay on this page.' : 'Follow them in order.'}</div></section>
    <div class="flow-wrap"><nav class="flow" aria-label="Steps">${tab.steps.map((s, i) => `<button type="button" class="node c${i + 1}" data-go="${i}" style="--i:${i}">
      <span class="ring"><span class="disc">${ICON[s.icon]}<span class="n">${String(i + 1).padStart(2, '0')}</span></span><span class="check">${ICON.check}</span></span>
      <span class="node-label">Step ${i + 1}</span><span class="node-title">${s.short}</span><span class="node-value" data-chip="${i}"></span></button>`).join('')}</nav></div>
    <div class="stage-shell" id="stage-shell"></div></div>`;
  renderStage(0);
}

function renderStage(dir) {
  const tab = tabById(S.tab);
  const i = S.step[tab.id];
  const step = tab.steps[i];
  const last = i === tab.steps.length - 1;
  const nextTab = TABS[TABS.indexOf(tab) + 1];
  const nextLabel = !last ? `<span>Next</span><small>${tab.steps[i + 1].short}</small>` : nextTab ? `<span>Next</span><small>${nextTab.kicker}</small>` : '<span>Start again</span>';
  const el = document.createElement('section');
  el.className = `stage c${i + 1}`;
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="stage-head"><span class="step-pill">Step ${i + 1} of ${tab.steps.length}</span><h2>${step.title}</h2></div>
    <div class="stage-body ${step.single ? 'single' : ''}">${step.body()}</div>
    <div class="stage-foot"><button type="button" class="btn btn-ghost" data-back ${i === 0 ? 'disabled' : ''}>${ICON.chevL}<span>Back</span></button><button type="button" class="btn btn-primary" data-next>${nextLabel}${ICON.chev}</button></div>`;
  $('#page').style.setProperty('--accent', `var(--s${i + 1})`);
  const shell = $('#stage-shell');
  const old = shell.firstElementChild;
  const enter = () => {
    shell.replaceChildren(el);
    refresh(true);
    playFlows(el);
    if (REDUCE_MOTION) return;
    // Primary: the card glides in from the direction of travel. Secondary: its content follows in a short cascade.
    if (dir) el.animate([{ opacity: 0, transform: `translateX(${dir * 36}px)` }, { opacity: 1, transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
    [...el.querySelectorAll('.stage-body > *')].slice(0, 4).forEach((child, k) => child.animate(
      [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: 90 + k * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  };
  if (old && dir && !REDUCE_MOTION) {
    old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 28}px)` }], { duration: 170, easing: 'ease-in' }).onfinish = enter;
  } else enter();
  $$('.node').forEach((node, k) => {
    node.classList.toggle('is-active', k === i);
    node.classList.toggle('is-done', k < i);
    node.classList.toggle('is-future', k > i);
    if (k === i) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
  });
  const active = $('.node.is-active'); const wrap = $('.flow-wrap');
  if (active && wrap && wrap.scrollWidth > wrap.clientWidth) wrap.scrollTo({ left: active.offsetLeft - wrap.clientWidth / 2 + active.offsetWidth / 2, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
}

function goStep(i) {
  const tab = tabById(S.tab);
  const current = S.step[tab.id];
  if (i === current || i < 0 || i >= tab.steps.length) return;
  S.step[tab.id] = i;
  renderStage(i > current ? 1 : -1);
}
function goTab(id) {
  if (id === S.tab) return;
  S.tab = id;
  try { localStorage.setItem('mpob-user-tab', id); } catch {}
  movePill();
  renderPage();
  window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
}

function tween(el, to, f) {
  const from = el._v;
  el._v = to;
  if (from === undefined || from === to || REDUCE_MOTION) { el.textContent = f(to); return; }
  cancelAnimationFrame(el._raf);
  const t0 = performance.now();
  const tick = t => {
    const k = Math.min(1, (t - t0) / 420);
    el.textContent = f(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) el._raf = requestAnimationFrame(tick); else el.textContent = f(to);
  };
  el._raf = requestAnimationFrame(tick);
}

function refresh(initial = false) {
  const c = compute();
  const tab = tabById(S.tab);
  $$('[data-chip]').forEach(el => { const v = tab.steps[Number(el.dataset.chip)].chip(c); if (el.textContent !== v) el.textContent = v; });
  const root = $('#stage-shell');
  if (!root) return;
  $$('[data-range]', root).forEach(el => {
    const key = el.dataset.range; const cfg = SL[baseKey(key)]; const v = num(get(key));
    if (document.activeElement !== el) el.value = String(v);
    el.style.setProperty('--p', `${(v - cfg.min) / (cfg.max - cfg.min) * 100}%`);
  });
  $$('[data-num]', root).forEach(el => {
    if (document.activeElement === el) return;
    const cfg = SL[baseKey(el.dataset.num)];
    el.value = cfg.fmt(num(get(el.dataset.num)));
  });
  $$('[data-reset]', root).forEach(el => { el.hidden = !isChanged(el.dataset.reset); });
  $$('[data-set]', root).forEach(el => {
    const v = get(el.dataset.set);
    const on = el.dataset.type === 'num' ? Math.abs(num(v) - Number(el.dataset.val)) < 1e-8 : String(v) === el.dataset.val;
    el.setAttribute('aria-pressed', String(on));
  });
  $$('[data-switch]', root).forEach(el => el.setAttribute('aria-checked', String(Boolean(get(el.dataset.switch)))));
  $$('[data-out]', root).forEach(el => {
    const v = B[el.dataset.out](c);
    if (v && typeof v === 'object') { if (initial) el._v = undefined; tween(el, v.n, v.f); }
    else if (el.textContent !== String(v)) el.textContent = v;
  });
  $$('[data-state-of]', root).forEach(el => {
    const v = B[el.dataset.stateOf](c);
    if (el.dataset.state !== v) {
      el.dataset.state = v;
      if (el.hasAttribute('data-pop') && !initial && !REDUCE_MOTION) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    }
  });
  $$('[data-show]', root).forEach(el => { el.hidden = !B[el.dataset.show](c); });
  $$('[data-w]', root).forEach(el => { el.style.width = `${B[el.dataset.w](c)}%`; });
  $$('[data-h]', root).forEach(el => { el.style.height = `${Math.max(3, B[el.dataset.h](c))}%`; });
  $$('[data-l]', root).forEach(el => { el.style.left = `${B[el.dataset.l](c)}%`; });
  $$('[data-grow]', root).forEach(el => { const v = Math.max(0, num(B[el.dataset.grow](c))); el.style.flexGrow = String(v); el.style.flexBasis = '0'; el.hidden = v <= 0; });
  $$('[data-lottie-of]', root).forEach(el => playMark(el, B[el.dataset.lottieOf](c)));
}

/* ── Lottie (offline lottie-web light player) ────────── */
const LOTTIE_ICONS = JSON.parse(document.getElementById('lottie-icons').textContent);
const LOTTIE_FLOW = JSON.parse(document.getElementById('lottie-flow').textContent);
const fresh = data => JSON.parse(JSON.stringify(data)); // the player mutates animation data
function playMark(el, state) {
  if (el._state === state || !window.lottie) return;
  el._state = state;
  el._anim?.destroy();
  el._anim = window.lottie.loadAnimation({ container: el, renderer: 'svg', loop: false, autoplay: !REDUCE_MOTION, animationData: fresh(LOTTIE_ICONS[state] ?? LOTTIE_ICONS.B20) });
  if (REDUCE_MOTION) el._anim.goToAndStop(LOTTIE_ICONS.B20.op - 1, true);
}
function playFlows(root) {
  if (!window.lottie) return;
  $$('[data-lottie-flow]', root).forEach(el => {
    const anim = window.lottie.loadAnimation({ container: el, renderer: 'svg', loop: REDUCE_MOTION ? false : 3, autoplay: !REDUCE_MOTION, animationData: fresh(LOTTIE_FLOW) });
    if (REDUCE_MOTION) anim.goToAndStop(20, true);
  });
}

/* ── Events ──────────────────────────────────────────── */
document.addEventListener('input', event => {
  const el = event.target.closest('[data-range]');
  if (el) set(el.dataset.range, Number(el.value));
});
document.addEventListener('focusin', event => {
  const el = event.target.closest('[data-num]');
  if (!el) return;
  const cfg = SL[baseKey(el.dataset.num)]; const v = num(get(el.dataset.num));
  el.value = cfg.raw ? cfg.raw(v) : String(Math.round(v * 100) / 100);
  el.select();
});
const commitNumber = el => {
  const cfg = SL[baseKey(el.dataset.num)];
  const typed = Number(String(el.value).replace(/[^0-9.\-]/g, ''));
  if (String(el.value).trim() !== '' && Number.isFinite(typed)) {
    const value = cfg.parse ? cfg.parse(typed) : typed;
    set(el.dataset.num, Math.min(cfg.max, Math.max(cfg.min, value)));
  }
  el.blur();
};
document.addEventListener('keydown', event => {
  const num = event.target.closest?.('[data-num]');
  if (num && event.key === 'Enter') { event.preventDefault(); commitNumber(num); return; }
  if (num && event.key === 'Escape') { num.blur(); return; }
  if (event.target.closest('input, textarea, select, [role="tab"]')) return;
  if (event.key === 'ArrowRight') goStep(S.step[S.tab] + 1);
  if (event.key === 'ArrowLeft') goStep(S.step[S.tab] - 1);
});
document.addEventListener('focusout', event => {
  const el = event.target.closest('[data-num]');
  if (el) { commitNumber(el); refresh(); }
});
document.addEventListener('click', event => {
  const t = event.target.closest('button, summary');
  if (!t) return;
  if (t.dataset.tab) return goTab(t.dataset.tab);
  if (t.dataset.go !== undefined) return goStep(Number(t.dataset.go));
  if (t.hasAttribute('data-back')) return goStep(S.step[S.tab] - 1);
  if (t.hasAttribute('data-next')) {
    const tab = tabById(S.tab); const i = S.step[tab.id];
    if (i < tab.steps.length - 1) return goStep(i + 1);
    const nextTab = TABS[TABS.indexOf(tab) + 1];
    if (nextTab) { S.step[nextTab.id] = 0; return goTab(nextTab.id); }
    return goStep(0);
  }
  if (t.dataset.set !== undefined) return set(t.dataset.set, t.dataset.type === 'num' ? Number(t.dataset.val) : t.dataset.val);
  if (t.dataset.switch) return set(t.dataset.switch, !get(t.dataset.switch));
  if (t.dataset.reset) return resetKey(t.dataset.reset);
  if (t.hasAttribute('data-reset-all')) { S.dec = {}; refresh(); }
});
window.addEventListener('resize', movePill);

/* ── Start ───────────────────────────────────────────── */
$('#status').innerHTML = `<i></i><span>${String(META.modelStatus).toLowerCase().replace(/^\w/, ch => ch.toUpperCase())} · data to ${META.dataThroughLabel}</span>`;
try { const saved = localStorage.getItem('mpob-user-tab'); if (TABS.some(t => t.id === saved)) S.tab = saved; } catch {}
renderTabs();
renderPage();
document.fonts?.ready?.then(movePill);
