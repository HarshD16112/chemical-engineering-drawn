# Chemical Engineering Drawn

**The classical equations of chemical engineering, turned into nomographs you can drag.**

Pull a slider — Reynolds number moves, the friction factor slides down its curve, the pressure drop updates in real time. That's the whole idea. A ChemE textbook you can *poke*.

**▶ Open it in your browser:** https://harshd16112.github.io/chemical-engineering-drawn/

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

A growing library of interactive modules across the core chem-eng canon:

| Area | Sample tools |
|---|---|
| **Fluid mechanics** | Reynolds number, Bernoulli, Darcy friction factor, Ergun equation (packed beds), pump sizing |
| **Heat transfer** | Nusselt / Prandtl correlations, heat-exchanger sizing |
| **Mass transfer** | Sherwood correlations, absorption |
| **Thermodynamics** | Peng–Robinson, Raoult's & Henry's laws, Antoine vapor pressure, Clausius–Clapeyron, compressibility, steam properties |
| **Reaction engineering** | Arrhenius, PFR and CSTR design equations |
| **Separations** | McCabe–Thiele, flash calculations, azeotropes |
| **Psychrometrics** | Humidity, dew point, wet-bulb relationships |

New tools land with each release — the version currently deployed is whatever's on `main`.

## Under the hood

- **One file, no build step.** The entire app is a single self-contained `Nomograph.html` — HTML, CSS, JS, KaTeX, and SVG all inlined. No npm, no bundler, no server.
- **Works offline.** Save the page, open it on a plane, in a lab with no wifi, on a locked-down corporate laptop — it just runs.
- **KaTeX** for equation rendering. **SVG** for every chart, so it stays sharp at any zoom.
- **~2.4 MB** total. Loads instantly on the live URL and clones in seconds.

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
