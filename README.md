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
| Home | To decide, each month, whether Malaysia's biodiesel blend stays at B20 or moves to B30. |
| OBJ1 · Price | To develop an automatic pricing mechanism for biodiesel (APM-Bio). |
| OBJ2 · Shock test | To evaluate whether a Biodiesel Stabilisation Fund (BSF) can withstand price shocks. |
| OBJ3 · Money sources | To determine the best sources of funding for the BSF. |
| OBJ4 · Mandate rule | To develop a dynamic rule for moving between B20 and B30. |
| Decision now | To decide the biodiesel blend for the chosen prices and fund. |

## Using it

- **Home** opens first and is one thing only: *Malaysia's biodiesel journey*, one long camera move through an oil palm
  fruit bunch drawn in light. The scene stays pinned while you scroll (or swipe, on a phone) and opens through a drop-shaped
  keyhole: the bunch lets its fruit go (B5 2011, B7 2014, B10 2019), rings gather and the B20 ring fills one fifth with palm gold,
  a flower opens for B30 and its three checks, its petals scatter (the fund), and an iris gathers around the four inputs. Six
  screens of words take turns, each with buttons that open the step it describes; the last one carries the MPOB and UKM marks as
  sponsors. Tap a chapter in the bar to jump to it, or press **Play** to run it without scrolling; any touch, wheel or key hands
  control back. Under Reduce motion it becomes one still picture and a column of words. All artwork is drawn in code; years are
  when each blend was introduced (the roll-out was phased). The objectives live in the tabs.
- **The living hive** is the moving background of every objective and the Decision page: a swarm of glowing particles over a
  honeycomb and fog, turning as a slow spiral vortex in the colour of the step on show. Under the step cards it **writes the step
  in hand** ("Set diesel price"); pick another step and the words scatter and the swarm writes the next ones from left to right, readable in about half a second. Scroll down and the
  words break up into the background. Move the pointer through it or tap open ground to stir it. The pause button in the top bar
  stops it on every page.
- **Each step box shows a moving picture of its step**: the diesel pump, palm fruit beside the biodiesel flask, a balance
  weighing diesel against biodiesel, the break-even crossing, the signal flag, the fund tank, the BSL coin, the B30 stamp, the
  B15/B20/B30 ladder and the blended drop. Drawn in code on a ground in the step colour, reflected on a glossy floor. The step in
  hand is lifted and brightest, steps done keep their colour and a tick, steps ahead are washed out.
- **Tabs** sit at the top, as pills; on a phone they get their own row under the brand and scroll sideways.
- **Move between steps** with the step cards, the Next and Back buttons, the arrow keys, or by **swiping the step card** left or right.
- **Type an exact value** in the box beside a slider and press Enter. Text that is not a number, or a value outside the slider's range,
  is rejected with a message and changes nothing. Escape cancels.
- **Your scenario.** When you change a value, the top bar shows "Your scenario" and the results say which values changed.
  *Restore snapshot* puts every value back to the reviewed snapshot. On Decision now, *Use the objective settings* clears only the
  values set on that page.
- **Appearance.** The round button at the top right offers six looks: Classic (follows the device, light or dark), Classic dark (always dark), Bloom, Tonal, Citrus and Mono. Each changes the shapes of the step rings and icons, the icon strokes, buttons, chips, sliders, switches, tabs and type,
  not only the colours. Bloom, Tonal and Citrus are each their own world: Bloom is a blush-to-lilac sky with frosted glass cards,
  pastel-bright steps and bouncy motion; Tonal is oat paper with moss, terracotta and ochre steps, serif headings, leaf-shaped
  cards and slow calm motion; Citrus is warm white with a halftone dot screen, bold black outlines, hard shadows and quick snappy
  motion. The hive behind the pages takes each look's ground colours. Saved on your device only.
- **Sound.** Quiet cues made live in the browser (no sound files), in two families: touches get dry clicks (a crisp click on a
  step box, Back or Next; a softer one on choices, chips and switches; light detent ticks while a slider moves), and events get
  soft notes from one warm scale with a small room echo (two glass notes when a page opens, a pop as a step card lands, a short
  chord when the B20/B30/B15 verdict changes, a shimmer for a new look; on Home, notes climbing with the Slide to start knob,
  bells at each chapter and kalimba notes while the camera moves). Nothing plays while nothing moves. Sound wakes on the first tap; turn it off with the
  round mute button at the bottom right of every page, or the Sound switch in the Appearance menu (`src/sound.js`).
- **Slide to start.** Home opens with a "Slide to start the journey" control: slide or tap the knob and the journey plays by
  itself; scrolling or swiping still works. If a visitor stops part-way, a small "carry on" hint appears (`src/guide.js`).
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

The hive (`src/home.js`, canvas) runs one animation loop for the whole app; it rests while the page is hidden or the journey
fills the screen, and is a still picture under *Reduce motion*. The step pictures (`src/art.js`, inline SVG) each
move on their own (a drip, swaying fronds, a waving flag, falling coins, a flipping calendar), tilt and shift in layers under the
pointer, and a light sweeps across the step in hand. Five follow the live numbers: the balance tips by the price gap, the flag
turns green or amber, the shield turns red when the fund is short, the B30 stamp comes down when approval is on, and the ladder,
the drop and the savings jar move to the blend and the savings share. They rest while the row is off screen and stand still under
*Reduce motion*. The Mirror Hall (`src/hall.js`) stays in the build but neither level mounts it any more.
The step cards arrive through `src/morph.js`: when an objective or Decision now opens, the cards of the page being left break
into dust in their colours, the dust spirals into a vortex over the step row, and the new cards spin out of it, fly up in an arc
and drop into their places with a small bounce before handing over to the real cards. This happens once per page per visit: going back to an objective already seen, the cards stay still and the page just folds in. The hive and its writing are untouched.
The flying cards are copies in a fixed layer, so the real buttons stay usable; under *Reduce motion* the cards simply appear.
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
| `src/theme.js` | Shared look selector (six looks) |
| `src/home.js` | Shared: the biodiesel journey on Home (one long camera move, sponsor marks) and the living hive behind every page, which writes the step in hand |
| `src/hall.js` | Shared: the Mirror Hall step cards (marbled liquid and reflections, WebGL) |
| `brand/` | Sponsor logos `mpob.svg` and `ukm.png`, embedded small on the journey's last screen at build time. The MPOB and UKM logos are the trademarks of the Malaysian Palm Oil Board and Universiti Kebangsaan Malaysia, shown only to credit their support of this study. |
| `src/art.js` | Shared: step pictures: a moving drawing of each step in its box, five of them following the live numbers (brings its own CSS) |
| `src/sound.js` | Shared: quiet Web Audio cues (clicks, slider ticks, page notes, card pops, verdict chords, look shimmer, journey bells and kalimba notes) the mute button and the Sound switch |
| `src/guide.js` | Shared: Slide to start the journey on Home, and the carry-on hint |
| `src/morph.js` | Shared: step morph: old cards turn to dust, new cards spin out of a vortex, fly and drop into place (brings its own CSS) |
| `src/app.js` | Tabs, steps, live bindings, input handling |
| `src/lottie-icons.mjs` | Project-authored Lottie result marks (B30 check, B20 hold, B15 caution) |
| `data/` | Research snapshot (simulated) and the snapshot month's ingredient inputs |
| `vendor/lottie/` | lottie-web 5.13.0 light player, MIT licence (Bodymovin) |
| `reference/v3/` | V3 rule files, used only by the parity tests |
| `build.mjs`, `test.mjs`, `shoot.mjs` | Build, tests, browser check |

## Design rules to keep

- Every objective and Decision tab opens with one 36px objective statement starting with "To ...", then the same row of picture steps.
  Home is the journey only, with few words; its objective statement is kept for screen readers.
- Every step title starts with "To ...". Step colours follow the same order on every tab.
- One idea per step: one control group, one live result. Detail belongs in the Developer level.
