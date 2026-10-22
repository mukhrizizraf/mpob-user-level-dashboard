# Mandate Decision Studio · User level

A step-by-step app for MPOB / MOF staff to decide each month whether Malaysia's biodiesel mandate stays at B20 or moves to B30.
Part of the MPOB-UKM Endowment Chair Research Grant 2026, Topic 3: a sustainable self-funding framework for the national biodiesel mandate.

**Open the app:** `index.html` (one self-contained file, works offline). If GitHub Pages is on, it is served at
`https://mukhrizizraf.github.io/MPOB-USER-LEVEL-DASHBOARD/`.

> **All values are simulated placeholders, not official MPOB figures.** The controls explore saved research results; they do
> not rerun the research models. B15 is a proposed safeguard only. The Windfall Profit Levy (WPL) is a baseline reference only,
> never a recommended funding source.

## Tabs

| Tab | Objective |
|---|---|
| OBJ1 | To develop an automatic pricing mechanism for biodiesel (APM-Bio). |
| OBJ2 | To evaluate whether a Biodiesel Stabilisation Fund (BSF) can withstand price shocks. |
| OBJ3 | To determine the best sources of funding for the BSF. |
| OBJ4 | To develop a dynamic rule for moving between B20 and B30. |
| Decision now | To decide this month's biodiesel blend. |

## Same data, same rules as the V3 research dashboard

- Data: `data/V3_DASHBOARD_SNAPSHOT.json`, a copy of the reviewed snapshot the V3 dashboard uses, embedded at build time.
- Rules: `src/model.js` copies V3's calculation rules line for line. `reference/v3/` holds V3's own rule files, and
  `test.mjs` proves both give identical results.

## Rebuild

Needs Node 20 or later. No `npm install`.

```sh
npm run build    # writes index.html
npm test         # rules match V3; page embeds the same snapshot; nothing loads from the network
npm run shoot -- shots   # optional: headless Chrome/Edge walk-through, screenshots + interaction checks
```

When the snapshot changes, copy the new `V3_DASHBOARD_SNAPSHOT.json` into `data/`, then build, test and commit.

## Files

| Path | Role |
|---|---|
| `index.html` | The built app (generated; do not edit by hand) |
| `src/index.html` | Page shell with build placeholders |
| `src/styles.css` | Design tokens (light + dark), the ring-step infographic, controls |
| `src/model.js` | V3 calculation rules and number formats |
| `src/app.js` | Tabs, steps, live bindings, motion |
| `src/lottie-icons.mjs` | Project-authored Lottie result marks (B30 check, B20 hold, B15 caution) |
| `data/` | Research snapshot (simulated) |
| `vendor/lottie/` | lottie-web 5.13.0 light player, MIT licence (Bodymovin) |
| `reference/v3/` | V3 rule files, used only by the parity tests |
| `build.mjs`, `test.mjs`, `shoot.mjs` | Build, tests, browser check |
