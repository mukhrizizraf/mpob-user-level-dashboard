# Mandate Decision Studio · User level

### ▶ [Open the dashboard](https://mukhrizizraf.github.io/mpob-user-level-dashboard/)

**https://mukhrizizraf.github.io/mpob-user-level-dashboard/** works in any browser, on a phone, tablet or computer.
Companion: the [Developer level](https://mukhrizizraf.github.io/mpob-developer-level-dashboard/), which has the evidence behind every step.

A step-by-step app for MPOB / MOF staff to decide each month whether Malaysia's biodiesel mandate stays at B20 or moves to B30.
Part of the MPOB-UKM Endowment Chair Research Grant 2026, Topic 3: a sustainable self-funding framework for the national biodiesel mandate.

> **All values are simulated placeholders, not official MPOB figures.** The controls explore saved research results; they do
> not rerun the research models. B15 is a proposed safeguard only. The Windfall Profit Levy (WPL) is a baseline reference only,
> never a recommended funding source.

## Tabs

| Tab | Objective |
|---|---|
| OBJ1 · Price | To develop an automatic pricing mechanism for biodiesel (APM-Bio). |
| OBJ2 · Shock test | To evaluate whether a Biodiesel Stabilisation Fund (BSF) can withstand price shocks. |
| OBJ3 · Money sources | To determine the best sources of funding for the BSF. |
| OBJ4 · Mandate rule | To develop a dynamic rule for moving between B20 and B30. |
| Decision now | To decide the biodiesel blend for the chosen prices and fund. |

## Using it

- **Move between steps** with the numbered rings, the Next and Back buttons, the arrow keys, or by **swiping the step card** left or right.
- **Type an exact value** in the box beside a slider and press Enter. Text that is not a number, or a value outside the slider's range,
  is rejected with a message and changes nothing. Escape cancels.
- **Your scenario.** When you change a value, the top bar shows "Your scenario" and the results say which values changed.
  *Restore snapshot* puts every value back to the reviewed snapshot. On Decision now, *Use the objective settings* clears only the
  values set on that page.
- **Appearance.** The round button at the top right opens the theme selector: Automatic, Light and Dark, plus finishes inspired by
  iPhone (Starlight, Midnight, Natural Titanium, Desert, Ultramarine) and iPad (Sky Blue, Blush, Space Grey). Saved on your device only.
- **Share a place.** The address ends in `#obj2-5` style anchors, so a link opens on the same tab and step. Values reset on reload.
- **Print decision summary** (Decision now, step 4) prints the inputs, their sources, the rule checks, the blend and the caveats.

## Review fixes (October 2026)

Implements the code review in `07_Codex_Analysis/code review .md`: input drafts that never change silently (CR01), Decision
overrides only after a real edit (CR02), reset buttons that do what they say (CR03), snapshot and scenario labelling at every width
(CR04), funding parts labelled by period and never called "money available" (CR05), phone-friendly comparisons (CR06),
WCAG 4.5:1 colour pairs in every theme (CR08), caveats beside the headline results (CR09), Lottie clean-up (CR10), a real tablist
with arrow keys and focus handling (CR11), "Not tested" kept apart from zero and failure (CR12), a visible saved-run badge (CR18),
calm motion that follows the reduced-motion setting live (CR19, CR20), a snapshot check at start-up (A02) and a print record (A03).

## Motion

`src/motion.js` is a small spring engine (no library). Every animation starts from what is on screen, carries velocity and can be
interrupted: tabs fold away like a foldable phone's hinge, step cards follow your finger and keep its momentum, the selection pill
stretches toward the tab you pick, and the verdict settles when the blend changes. Numbers are written at once; only containers move.
With *Reduce motion* turned on in the device settings, everything becomes a short cross-fade.

## Same data, same rules as the V3 research dashboard

- Data: the reviewed V3 snapshot (`V3_DASHBOARD_SNAPSHOT.json`), embedded at build time, and `data/ingredients.json`, the
  snapshot month's methanol and glycerol inputs from the master workbook (cells E201 and F201).
- Rules: `src/model.js` copies V3's calculation rules line for line, and `test.mjs` proves both give identical results.

## Rebuild

Needs Node 20 or later. No `npm install`. Inside the project the scripts read V3 directly and write
`../MPOB_Mandate_Decision_Studio_user_level.html`; in this repository they use `data/`, `vendor/` and `reference/v3/` and write `index.html`.

```sh
npm run build            # or: node build.mjs
npm test                 # rules match V3; snapshot check; page embeds the same snapshot; nothing loads from the network
npm run shoot -- shots   # optional: headless Chrome/Edge walk-through + the review's acceptance checks (SCHEME=dark for dark mode)
```

## Files

| Path | Role |
|---|---|
| `index.html` | The built app (generated; do not edit by hand) |
| `src/index.html` | Page shell with build placeholders |
| `src/styles.css` | Design tokens (light + dark), the ring-step infographic, controls |
| `src/shared.css` | Shared with the Developer level: mobile baseline, review fixes, motion hooks, themes, print |
| `src/model.js` | V3 calculation rules and number formats |
| `src/motion.js` | Shared spring engine, swipe gesture, CSS spring curves |
| `src/theme.js` | Shared theme selector |
| `src/app.js` | Tabs, steps, live bindings, input handling |
| `src/lottie-icons.mjs` | Project-authored Lottie result marks (B30 check, B20 hold, B15 caution) |
| `data/` | Research snapshot (simulated) and the snapshot month's ingredient inputs |
| `vendor/lottie/` | lottie-web 5.13.0 light player, MIT licence (Bodymovin) |
| `reference/v3/` | V3 rule files, used only by the parity tests |
| `build.mjs`, `test.mjs`, `shoot.mjs` | Build, tests, browser check |

## Design rules to keep

- Every tab: one 36px objective statement starting with "To ...", then the same ring-step infographic.
- Every step title starts with "To ...". Step colours follow the same order on every tab.
- One idea per step: one control group, one live result. Detail belongs in the Developer level.
