# Chemical Engineering Drawn

**The classical equations of chemical engineering, turned into nomographs you can drag.**

Pull a slider — Reynolds number moves, the friction factor slides down its curve, the pressure drop updates in real time. That's the whole idea. A ChemE textbook you can *poke*.

**▶ Open it in your browser:** https://harshd16112.github.io/chemical-engineering-drawn/

[**Open the tool**](https://harshd16112.github.io/chemical-engineering-drawn/) · [**Browse the modules**](src/modules) · [**How it's built**](src/README.md) · [**Request a tool**](https://github.com/HarshD16112/chemical-engineering-drawn/issues)

---

## Why this exists

Chemical engineers used to read answers off nomographs and log-log charts. Then calculators and process simulators arrived and the charts quietly disappeared from desks — and with them, a lot of the physical intuition that came from *watching* a variable move across a curve.

This project brings the charts back, but interactive. Every module gives you:

- The **governing equation**, typeset properly with KaTeX.
- A **live nomograph or plot** that responds to your inputs.
- A short "**how to read this**" walkthrough — so a first-year student and a working engineer both get something out of it.
- A worked example you can perturb.

The goal isn't to replace Aspen or your steam tables. It's to make the *shape* of the equation obvious.

## Who it's for

- **Undergrads** studying transport, thermodynamics, kinetics, or separations — a way to build intuition before an exam without opening MATLAB.
- **Graduate students & TAs** looking for a visual to drop into a recitation or an office-hours explanation.
- **Practicing engineers** who want a quick sanity check without spinning up a simulator.
- **Anyone prepping for the FE / PE** and tired of static charts.

## What's inside

**135 interactive tools across 24 module groups.** Each area below links straight to its readable source — or jump to the [full tool index](src/README.md#module-index-135-tools).

| Area | Browse the source | A few of the tools |
|---|---|---|
| Fluid mechanics & hydraulics | [`fluid-mechanics`](src/modules/12-dFluid-fluid-mechanics.js) | Moody chart, pump & system curve, control-valve sizing, orifice meter |
| Heat transfer | [`heat-transfer`](src/modules/13-dHeat-heat-transfer.js) | LMTD & correction factor, ε–NTU, Bell–Delaware shell-side rating |
| Separations | [`separations`](src/modules/11-dSep-separations.js) | McCabe–Thiele, flash (Rachford–Rice), absorption, shortcut FUG |
| Multicomponent distillation | [`multicomponent`](src/modules/08-dMulti-multicomponent-distillation.js) | Lewis–Matheson, Wang–Henke, Underwood minimum reflux |
| Reactors & kinetics | [`reactors`](src/modules/05-dReact-reactors-kinetics.js) | CSTR vs PFR (Levenspiel), non-isothermal CSTR, packed-bed catalysis |
| Multiphase reaction eng. | [`multiphase`](src/modules/09-dMphase-multiphase-reaction-engineering.js) | Hatta number, slurry & trickle-bed, shrinking-core |
| Thermodynamics & phase equilibria | [`phase-equilibria`](src/modules/07-dPhase-phase-equilibria-models.js) | NRTL / UNIQUAC VLE, cubic EOS (PR/SRK), LLE, consistency tests |
| Thermophysical data | [`thermophysical-data`](src/modules/14-dThermo-thermophysical-data.js) | Steam tables (IAPWS-IF97), psychrometric chart |
| Equipment design | [`equipment-design`](src/modules/01-dEquip-process-equipment-design.js) | Shell-and-tube layout, API-650 tanks, evaporator trains |
| Process dynamics & control | [`control`](src/modules/06-dCtrl-process-dynamics-control.js) | FOPDT, PID tuning, Bode / Nyquist, cascade, Smith predictor |
| Crystallisation & particles | [`crystallisation`](src/modules/03-dCryst-crystallisation.js) · [`fluidisation`](src/modules/02-dFluidise-fluidisation-packed-beds.js) | MSMPR size distribution, Ergun, Geldart map, cyclones |
| Statistics & data analysis | [`statistics`](src/modules/10-dStat-statistics-data-analysis.js) | Distribution atlas, regression, control charts, factorial DOE |
| Utilities & economics | [`foundations-balances`](src/modules/24-dUtil-foundations-balances.js) | Mass balances, cooling-tower, capital cost, unit converter |
| Compounds & properties | [`compounds`](src/modules/04-dCompound-compounds-properties.js) | CAS lookup, Joback estimation, mixture properties |

Plus nine [expansion sets](src/README.md#module-index-135-tools) (`modules/15`–`23`) that add dozens more across every area. New tools land with each release — the version currently deployed is whatever's on `main`.

## Explore the source

The live app ships as one bundled `Nomograph.html` — perfect for running offline, but too big for GitHub to preview and awkward to read. So the **same application is kept here unpacked and readable**, one file per subject:

```
src/
├─ README.md     ← the map + full index of all 135 tools
├─ document/     ← HTML skeleton: loaders, preview markup, the script frame
├─ styles/       ← design system · fonts · KaTeX · app CSS
├─ engine/       ← shared core: thermo data, units, TeX renderer, plotting, canvas…
├─ modules/      ← one file per subject — the 135 calculators  ◀ start here
└─ data/         ← nomenclature for every symbol
```

Start in [`src/README.md`](src/README.md) for the clickable index, or dive straight into [`src/modules/`](src/modules). Nothing here is a rewrite: `node tools/build.mjs` reassembles `src/` and verifies it reproduces the deployed app **byte-for-byte**, so the readable source can never drift from what's live.

## Under the hood

- **One file, no build step to run it.** The deployed app is a single self-contained `Nomograph.html` — HTML, CSS, JS, KaTeX, and SVG all inlined. No npm, no server; the readable `src/` tree and its build are optional, for reading and contributing.
- **Works offline.** Save the page, open it on a plane, in a lab with no wifi, on a locked-down corporate laptop — it just runs.
- **KaTeX** for equation rendering. **SVG** for every chart, so it stays sharp at any zoom.
- **~2.5 MB** total. Loads instantly on the live URL and clones in seconds.

## Run it locally

No tooling required:

```bash
git clone https://github.com/HarshD16112/chemical-engineering-drawn.git
```

Then double-click `Nomograph.html` — that's it. Any modern browser will do.

## Feedback & ideas

Missing your favorite correlation? Spot a unit that should default to something else? [Open an issue](https://github.com/HarshD16112/chemical-engineering-drawn/issues) — tool suggestions and equation requests are especially welcome.

## License

Released under the [MIT License](LICENSE). Use it in class, fork it, remix it, embed it in your course website — just keep the attribution.
