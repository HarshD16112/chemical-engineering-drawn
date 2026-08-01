# Chemical Engineering Drawn

Quick chemical engineering concepts, **visualized as interactive nomographs**.

**▶ Live app: https://harshd16112.github.io/chemical-engineering-drawn/**

A single, self-contained web page for exploring core chemical engineering
relationships by moving sliders and watching the nomograph respond — no install,
no dependencies, nothing to download. Open the link and use it in your browser.

## Features

- **Interactive nomographs** — drag the input sliders and read results straight
  off the chart.
- **Governing equations** rendered cleanly with [KaTeX](https://katex.org/), so
  you can see the math behind each visualization.
- **Per-concept sections** — Overview, Governing equations, "How to read this,"
  Inputs, and Results for each module.
- **Worked examples / presets** to anchor each concept in a concrete case.
- **100% self-contained** — the entire app is one HTML file with everything
  inlined. It works offline and needs no build step or server.

## Run it locally

No tooling required — just open the file in any modern browser:

```bash
git clone https://github.com/HarshD16112/chemical-engineering-drawn.git
```

Then double-click `Nomograph.html` (or open it from your browser's File menu).

## How it's hosted

The site is served via GitHub Pages from the `main` branch. `index.html` is a
small redirect to `Nomograph.html`, which contains the full application.

## License

Released under the [MIT License](LICENSE) — free to use, share, and adapt with
attribution.
