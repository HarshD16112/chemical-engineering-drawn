  /* ── canvas lifecycle ──────────────────────────────────── */
  componentDidMount() {
    window.__NOMO = this;
    this.attach(); this.redraw();
    window.addEventListener('resize', this._r = () => {
      const w = window.innerWidth;
      if (Math.abs(w - (this.state.vw || 0)) > 1) this.setState({ vw: w });
      this.redraw();
    });
    if (window.innerWidth !== this.state.vw) this.setState({ vw: window.innerWidth });
    if (!window.katex) {
      let n = 0;
      this._kt = setInterval(() => { n++; if (window.katex) { clearInterval(this._kt); this._texC = {}; this.forceUpdate(); } else if (n > 60) clearInterval(this._kt); }, 250);
    }
  }
  componentDidUpdate() { this.attach(); this.redraw(); }
  /* Pointer and key events fire far faster than the screen refreshes; collapse
     every request inside a frame into a single pair of canvas draws. */
  redraw() {
    if (this._raf) return;
    this._raf = 1;
    const run = () => {
      if (!this._raf) return;
      this._raf = 0; clearTimeout(this._rt); cancelAnimationFrame(this._rf);
      this.draw(); this.drawS();
    };
    this._rf = requestAnimationFrame(run);
    this._rt = setTimeout(run, 48);
  }
  componentWillUnmount() { window.removeEventListener('resize', this._r); if (this._ro) this._ro.disconnect(); if (this._ro2) this._ro2.disconnect(); if (this._kt) clearInterval(this._kt); this._raf = 0; cancelAnimationFrame(this._rf); clearTimeout(this._rt); clearTimeout(this._ft); }
  attach() {
    const c = this.canvasRef.current;
    if (c && c !== this._c) {
      this._c = c;
      if (this._ro) this._ro.disconnect();
      if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this.redraw()); this._ro.observe(c.parentNode); }
    }
    const c2 = this.schemRef.current;
    if (c2 && c2 !== this._c2) {
      this._c2 = c2;
      if (this._ro2) this._ro2.disconnect();
      if (window.ResizeObserver) { this._ro2 = new ResizeObserver(() => this.redraw()); this._ro2.observe(c2.parentNode); }
    }
  }
  draw() {
    const c = this.canvasRef.current;
    if (!c || this.state.home) return;
    const m = this.cur();
    if (!m || !m.draw) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth || 900;
    /* Staircase constructions are read as squares, so the canvas takes their
       aspect instead of letting the plot shrink inside a letterbox frame. */
    const Ht = m.sq
      ? Math.round(Math.max(360, Math.min(900, W / m.sq)))
      : Math.round(Math.max(400, Math.min(700, W * 0.68)));
    if (Math.abs((parseFloat(c.style.height) || 0) - Ht) > 0.5) c.style.height = Ht + 'px';
    const H = c.clientHeight || Ht;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const v = this.vals(m);
    this._gs = [];
    let r = {};
    try { r = m.compute(v) || {}; } catch (e) { r = {}; }
    try { m.draw(ctx, { x: 0, y: 0, w: W, h: H }, v, r, this); } catch (e) {
      ctx.fillStyle = this.C.mut; ctx.font = '13px Barlow, sans-serif'; ctx.fillText('Plot unavailable for this input combination.', 20, 30);
    }
  }

  drawS() {
    const c = this.schemRef.current;
    if (!c || this.state.home) return;
    const m = this.cur();
    if (!m || !m.schem) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth || 700;
    const Ht0 = Math.round(Math.max(330, Math.min(680, W * (m.sa || 0.56))));
    const fit = this._fitS;
    const Ht = Math.round(Ht0 * (fit && fit.id === m.id && Math.abs(fit.w - W) < 30 ? fit.f : 1));
    if (Math.abs((parseFloat(c.style.height) || 0) - Ht) > 0.5) c.style.height = Ht + 'px';
    this.fitS(m, W, Ht0);
    const H = c.clientHeight || Ht;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const v = this.vals(m);
    let r = {};
    try { r = m.compute(v) || {}; } catch (e) { r = {}; }
    try { m.schem(ctx, { x: 0, y: 0, w: W, h: H }, v, r, this); } catch (e) {
      ctx.fillStyle = this.C.mut; ctx.font = '13px Barlow, sans-serif'; ctx.fillText('Schematic unavailable for this input combination.', 20, 30);
    }
  }

  /* Several equipment sketches are drawn at a fixed scale and leave a band of
     empty paper beneath them. Render one off-screen, find where the ink
     actually stops, and crop the frame to it. Debounced, so a slider drag
     never makes the frame jump. */
  fitS(m, W, Ht0) {
    clearTimeout(this._ft);
    this._ft = setTimeout(() => {
      try {
        const oc = this._ocs || (this._ocs = document.createElement('canvas'));
        const Wi = Math.max(1, Math.round(W));
        const o = oc.getContext('2d', { willReadFrequently: true });
        const v = this.vals(m);
        let r = {}; try { r = m.compute(v) || {}; } catch (e) { r = {}; }
        const probe = Hp => {
          oc.width = Wi; oc.height = Hp;
          o.fillStyle = '#ffffff'; o.fillRect(0, 0, Wi, Hp);
          m.schem(o, { x: 0, y: 0, w: Wi, h: Hp }, v, r, this);
          const d = o.getImageData(0, 0, Wi, Hp).data;
          let top = -1, bot = -1, gap = 0, run = 0;
          for (let y = 0; y < Hp; y += 2) {
            let ink = false;
            for (let x = 0; x < Wi; x += 3) { const i = (y * Wi + x) * 4; if (d[i] < 244 || d[i + 1] < 244 || d[i + 2] < 244) { ink = true; break; } }
            if (ink) { if (top < 0) top = y; bot = y; if (run > gap) gap = run; run = 0; }
            else if (top >= 0) run += 2;
          }
          return [top, bot, gap];
        };
        /* Squeeze out slack at the foot of the drawing AND the largest blank
           band inside it (a sketch whose readouts are pinned to the bottom edge
           leaves its gap in the middle, not under everything). Re-probe after
           each squeeze: parts that scale with the frame move as it shrinks, so
           the loop settles on a height where nothing is left floating. */
        const floor = Math.round(Ht0 * 0.34);
        let H = Ht0, bestH = Ht0, bestScore = -1, lastSpan = 0;
        for (let it = 0; it < 5; it++) {
          const a = probe(H);
          if (a[0] < 0 || a[0] >= 56 || a[1] <= 0) break;
          const span = a[1] - a[0], voidH = Math.max(0, a[2] - 30);
          /* density of real drawing per pixel of frame — the thing to maximise */
          const score = (span - voidH) / H;
          if (score > bestScore + 0.008) { bestScore = score; bestH = H; }
          /* the drawing itself started shrinking with the frame: stop here */
          if (lastSpan && span < lastSpan * 0.93) break;
          lastSpan = span;
          const slack = Math.max(0, H - a[1] - 16) + voidH;
          if (slack < 14 || H - slack < floor) break;
          H -= slack;
        }
        const f = Math.max(0.34, Math.min(1, bestH / Ht0));
        const p = this._fitS;
        if (!p || p.id !== m.id || Math.abs(p.w - W) >= 30 || Math.abs(p.f - f) > 0.03) {
          this._fitS = { id: m.id, w: W, f: f };
          this.redraw();
        }
      } catch (e) { /* leave the frame at its nominal height */ }
    }, 200);
  }

