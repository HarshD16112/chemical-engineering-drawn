  /* ── equipment schematic kit ────────────────── */
  rget(r, frag) {
    const a = (r && r.res) || [], q = String(frag).toLowerCase();
    for (let i = 0; i < a.length; i++) if (String(a[i].l).toLowerCase().indexOf(q) >= 0) return a[i].v !== undefined ? a[i].v : a[i].s;
    return undefined;
  }
  cl01(x) { return Math.max(0, Math.min(1, isFinite(x) ? x : 0.5)); }
  tcol(f, a) {
    const st = [[0, 38, 92, 158], [0.38, 122, 164, 203], [0.5, 152, 152, 156], [0.68, 206, 146, 62], [1, 178, 58, 36]];
    f = this.cl01(f);
    let rgb = [178, 58, 36];
    for (let i = 1; i < st.length; i++) {
      if (f <= st[i][0]) { const p = st[i - 1], n = st[i], t = (f - p[0]) / ((n[0] - p[0]) || 1); rgb = [0, 1, 2].map(k => Math.round(p[k + 1] + (n[k + 1] - p[k + 1]) * t)); break; }
    }
    return a === undefined ? 'rgb(' + rgb.join(',') + ')' : 'rgba(' + rgb.join(',') + ',' + a + ')';
  }
  mkS(ctx, b, o) {
    const C = this.C, self = this;
    const A = Object.assign({ padx: 18, top: 36, bot: 16 }, o);
    const x = b.x + A.padx, y = b.y + A.top, w = b.w - 2 * A.padx, h = b.h - A.top - A.bot;
    const s = { ctx: ctx, x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2, C: C, b: b };
    s.temp = (f, a) => self.tcol(f, a);
    s.title = (t, sub) => {
      const R = b.x + b.w - A.padx;
      ctx.save();
      ctx.fillStyle = C.ink; ctx.font = '700 ' + this.TZ(13.5) + 'px Barlow, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(t), b.x + A.padx, b.y + 19);
      ctx.font = '400 ' + this.TZ(10.5) + 'px Barlow, system-ui, sans-serif'; ctx.fillStyle = C.mid; ctx.textAlign = 'right';
      ctx.fillText('Not To Scale', R, b.y + 19);
      const nw = ctx.measureText('Not To Scale').width;
      ctx.restore();
      if (sub) s.rich(sub, R - nw - 16, b.y + 14, { size: 11.5, align: 'right', col: C.ink, lab: C.mut });
      s.L([[b.x + A.padx, b.y + 27.5], [R, b.y + 27.5]], { col: C.div, lw: 1 });
    };
    s.R = (X, Y, W, H, k) => {
      k = k || {}; ctx.save();
      if (k.fill) { ctx.fillStyle = k.fill; ctx.fillRect(X, Y, W, H); }
      if (k.stroke !== null) { ctx.strokeStyle = k.stroke || C.ink; ctx.lineWidth = k.lw || 1.2; ctx.setLineDash(k.dash || []); ctx.strokeRect(X + 0.5, Y + 0.5, W, H); }
      ctx.restore();
    };
    s.arrow = (X, Y, ang, sz, col) => {
      sz = sz || 7; ctx.save(); ctx.translate(X, Y); ctx.rotate(ang);
      ctx.fillStyle = col || C.ink; ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-sz, sz * 0.34); ctx.lineTo(-sz * 0.82, 0); ctx.lineTo(-sz, -sz * 0.34); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    s.L = (pts, k) => {
      k = k || {}; if (!pts || pts.length < 2) return; ctx.save();
      ctx.strokeStyle = k.col || C.ink; ctx.lineWidth = k.lw || 1.3; ctx.setLineDash(k.dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = k.cap || 'butt';
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (k.close) ctx.closePath();
      if (k.fill) { ctx.fillStyle = k.fill; ctx.fill(); }
      ctx.stroke(); ctx.restore();
      const n = pts.length;
      if (k.arrow) { const p = pts[n - 2], q = pts[n - 1]; s.arrow(q[0], q[1], Math.atan2(q[1] - p[1], q[0] - p[0]), k.asz || 7, k.col || C.ink); }
      if (k.mid) {
        let bi = 1, bl = -1;
        for (let i = 1; i < n; i++) { const d = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); if (d > bl) { bl = d; bi = i; } }
        const p = pts[bi - 1], q = pts[bi];
        s.arrow((p[0] + q[0]) / 2 + (q[0] - p[0]) * 0.08, (p[1] + q[1]) / 2 + (q[1] - p[1]) * 0.08, Math.atan2(q[1] - p[1], q[0] - p[0]), k.asz || 7, k.col || C.ink);
      }
    };
    s.rich = (t, X, Y, k) => {
      k = k || {};
      const size = this.TZ(k.size || 10.5), al = k.align || 'left';
      const parts = String(t).split(/(\s+)/).filter(p => p !== '');
      const isNum = p => /[0-9]/.test(p) && !/^[A-Za-z]{3,}$/.test(p);
      const fnt = p => (isNum(p) ? '700 ' : '400 ') + size + 'px Barlow, system-ui, sans-serif';
      ctx.save();
      let total = 0;
      parts.forEach(p => { ctx.font = fnt(p); total += ctx.measureText(p).width; });
      let px = al === 'center' ? X - total / 2 : al === 'right' ? X - total : X;
      ctx.textBaseline = k.base || 'middle'; ctx.textAlign = 'left';
      parts.forEach(p => { ctx.font = fnt(p); ctx.fillStyle = isNum(p) ? (k.col || C.ink) : (k.lab || C.mut); ctx.fillText(p, px, Y); px += ctx.measureText(p).width; });
      ctx.restore();
      return total;
    };
    s.measure = (t, size) => {
      const parts = String(t).split(/(\s+)/).filter(p => p !== '');
      const isNum = p => /[0-9]/.test(p) && !/^[A-Za-z]{3,}$/.test(p);
      ctx.save(); let total = 0;
      const sz = this.TZ(size || 10.5);
      parts.forEach(p => { ctx.font = (isNum(p) ? '700 ' : '400 ') + sz + 'px Barlow, system-ui, sans-serif'; total += ctx.measureText(p).width; });
      ctx.restore(); return total;
    };
    s.T = (t, X, Y, k) => {
      k = k || {};
      if (!k.caps && !k.rot && !k.bold) { s.rich(t, X, Y, { size: k.size, align: k.align, base: k.base, col: k.col, lab: k.lab || C.mut }); return; }
      ctx.save();
      ctx.fillStyle = k.col || C.ink;
      ctx.font = (k.bold ? '700 ' : k.caps ? '500 ' : '400 ') + this.TZ(Math.max(10, k.size || 11)) + 'px Barlow, system-ui, sans-serif';
      if (k.caps && ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.07em';
      ctx.textAlign = k.align || 'left'; ctx.textBaseline = k.base || 'middle';
      const txt = k.caps ? String(t).toUpperCase() : String(t);
      if (k.rot) { ctx.translate(X, Y); ctx.rotate(k.rot); ctx.fillText(txt, 0, 0); } else ctx.fillText(txt, X, Y);
      ctx.restore();
    };
    s.plate = (t, X, Y, k) => {
      k = k || {}; ctx.save();
      const sz = k.size || 10.5;
      const tw = s.measure(t, sz), ph = this.TZ(sz) + 7, al = k.align || 'center';
      let px = al === 'center' ? X - tw / 2 - 5 : al === 'right' ? X - tw - 10 : X;
      ctx.fillStyle = k.bg || 'rgba(255,255,255,0.95)';
      ctx.fillRect(px, Y - ph / 2, tw + 10, ph);
      if (k.box) { ctx.strokeStyle = k.box; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, Y - ph / 2 + 0.5, tw + 10, ph); }
      ctx.restore();
      s.rich(t, px + 5, Y + 0.5, { size: sz, col: k.col || C.ink, lab: k.lab || C.mut });
    };
    s.circ = (cx, cy, rr, k) => { k = k || {}; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); if (k.fill) { ctx.fillStyle = k.fill; ctx.fill(); } ctx.strokeStyle = k.stroke || C.ink; ctx.lineWidth = k.lw || 1.3; ctx.setLineDash(k.dash || []); ctx.stroke(); ctx.restore(); };
    s.clipR = (X, Y, W, H, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, H); ctx.clip(); fn(); ctx.restore(); };
    s.dim = (x1, y1, x2, y2, t, k) => {
      k = k || {};
      const col = k.col || C.mid, ang = Math.atan2(y2 - y1, x2 - x1);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const len = Math.hypot(x2 - x1, y2 - y1);
      s.L([[x1, y1], [x2, y2]], { col: col, lw: 1 });
      [[x1, y1], [x2, y2]].forEach(p => s.L([[p[0] - nx * 4, p[1] - ny * 4], [p[0] + nx * 4, p[1] + ny * 4]], { col: col, lw: 1 }));
      if (len > 24) { s.arrow(x1, y1, ang + Math.PI, 6, col); s.arrow(x2, y2, ang, 6, col); }
      if (k.ext) { k.ext.forEach((e, i) => { const p = i ? [x2, y2] : [x1, y1]; s.L([[p[0], p[1]], [p[0] + nx * e, p[1] + ny * e]], { col: C.lt, lw: 1 }); }); }
      if (t) s.plate(t, (x1 + x2) / 2 + nx * (k.off || 0), (y1 + y2) / 2 + ny * (k.off || 0), { col: k.tcol || C.ink, lab: col, size: k.size || 10.5, align: 'center' });
    };
    s.lead = (fx, fy, tx, ty, t, k) => {
      k = k || {}; const col = k.col || C.mid;
      const al = k.align || (tx < fx ? 'right' : 'left');
      s.L([[fx, fy], [tx, ty]], { col: col, lw: 1 });
      s.circ(fx, fy, 2.6, { fill: k.dot || C.acc, stroke: k.dot || C.acc, lw: 0.5 });
      s.rich(t, tx + (al === 'right' ? -5 : 5), ty, { size: k.size || 10.5, align: al, col: k.tcol || C.ink, lab: col });
    };
    s.callout = (cx, cy, letter, rr) => {
      rr = rr || 11;
      s.circ(cx, cy, rr, { stroke: C.mid, lw: 1.2 });
      s.T(letter, cx + rr + 6, cy, { size: 11, col: C.mid, bold: true });
    };
    s.constr = (x1, y1, x2, y2, label) => {
      s.L([[x1, y1], [x2, y2]], { col: C.lt, lw: 1, dash: [6, 4] });
      if (label) s.T(label, x2 + 7, y2, { size: 10, col: C.mid, lab: C.mid });
    };
    s.sub = (X, Y, W, H, title) => {
      if (title) s.T(title, X, Y - 10, { size: 11, col: C.ink, bold: true });
      return { x: X, y: Y, w: W, h: H, cx: X + W / 2, cy: Y + H / 2 };
    };
    s.chipH = this.TZ(10.5) + 9;
    s.chips = (X, Y, label, opts, sel) => {
      const ch = s.chipH, R0 = s.x + s.w - 6;
      s.rich(label, X, Y + ch / 2, { size: 10.5, col: C.ink, lab: C.mut });
      let px = X + s.measure(label, 10.5) + 10, py = Y;
      opts.forEach((o, i) => {
        const w = s.measure(o, 10.5) + 18;
        /* a row that would run off the frame drops to the next line rather
           than painting a clipped chip at the edge */
        if (px > X && px + w > R0) { px = X; py += ch + 5; }
        s.R(px, py, w, ch, { stroke: i === sel ? C.acc : C.div, lw: 1, fill: i === sel ? C.acc : '#fff' });
        s.T(o, px + w / 2, py + ch / 2, { size: 10.5, col: i === sel ? '#fff' : C.mut, align: 'center', bold: true });
        px += w + 6;
      });
      s.chipBottom = py + ch;
      return px;
    };
    s.vessel = (X, Y, W, H, k) => {
      k = k || {};
      const hd = k.head === 0 ? 0 : Math.min(W * 0.26, H * 0.2);
      const p = new Path2D();
      p.moveTo(X, Y + hd); p.quadraticCurveTo(X, Y, X + W / 2, Y); p.quadraticCurveTo(X + W, Y, X + W, Y + hd);
      p.lineTo(X + W, Y + H - hd); p.quadraticCurveTo(X + W, Y + H, X + W / 2, Y + H); p.quadraticCurveTo(X, Y + H, X, Y + H - hd);
      p.closePath();
      ctx.save(); if (k.fill) { ctx.fillStyle = k.fill; ctx.fill(p); }
      ctx.strokeStyle = k.stroke || C.ink; ctx.lineWidth = k.lw || 1.4; ctx.stroke(p); ctx.restore();
      return p;
    };
    s.hvessel = (X, Y, W, H, k) => {
      k = k || {};
      const hd = k.head === 0 ? 0 : Math.min(H * 0.3, W * 0.16);
      const p = new Path2D();
      p.moveTo(X + hd, Y); p.quadraticCurveTo(X, Y, X, Y + H / 2); p.quadraticCurveTo(X, Y + H, X + hd, Y + H);
      p.lineTo(X + W - hd, Y + H); p.quadraticCurveTo(X + W, Y + H, X + W, Y + H / 2); p.quadraticCurveTo(X + W, Y, X + W - hd, Y);
      p.closePath();
      ctx.save(); if (k.fill) { ctx.fillStyle = k.fill; ctx.fill(p); }
      ctx.strokeStyle = k.stroke || C.ink; ctx.lineWidth = k.lw || 1.4; ctx.stroke(p); ctx.restore();
      return p;
    };
    s.inPath = (p, fn) => { ctx.save(); ctx.clip(p); fn(); ctx.restore(); };
    s.liquid = (p, X, Y, W, H, frac, col) => {
      frac = self.cl01(frac);
      s.inPath(p, () => { ctx.fillStyle = col || C.soft3; ctx.fillRect(X - 2, Y + H * (1 - frac), W + 4, H * frac + 2); });
      if (frac > 0.004 && frac < 0.996) s.L([[X - 1, Y + H * (1 - frac)], [X + W + 1, Y + H * (1 - frac)]], { col: C.acc, lw: 1.3 });
    };
    s.unit = (X, Y, W, H, label, k) => {
      k = k || {};
      s.R(X, Y, W, H, { stroke: k.col || C.ink, lw: k.lw || 1.4, fill: k.fill });
      if (label) s.T(label, X + W / 2, Y + H / 2, { align: 'center', caps: true, size: k.size || 11, col: C.ink, bold: true });
      if (k.tag) s.T(k.tag, X + W / 2, Y - 9, { align: 'center', size: 10.5, col: C.mut });
      if (k.sub) s.T(k.sub, X + W / 2, Y + H + 10, { align: 'center', size: 10.5, col: k.subcol || C.mut });
      return { x: X, y: Y, w: W, h: H, cx: X + W / 2, cy: Y + H / 2, r: X + W, b: Y + H };
    };
    s.coil = (X, Y, W, H, n, k) => {
      k = k || {}; const pts = []; n = n || 4;
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([X + W * t, Y + (i % 2 ? H : 0)]); }
      s.L(pts, { col: k.col || C.ink, lw: k.lw || 1.6 });
    };
    s.column = (X, Y, W, H, k) => {
      k = k || {};
      const n = Math.max(1, Math.round(k.n || 1));
      const o = { X: X, Y: Y, W: W, H: H, bot: Y + H, cx: X + W / 2, n: n };
      o.yOf = i => Y + H * (Math.max(0.5, Math.min(n - 0.5, i - 0.5))) / n;
      if (k.packed) {
        const beds = Math.max(1, k.beds || 1), gap = Math.min(22, H * 0.09);
        const bh = (H - gap * (beds + 1)) / beds;
        for (let j = 0; j < beds; j++) {
          const by = Y + gap * (j + 1) + bh * j;
          s.R(X + 2, by, W - 4, bh, { stroke: C.acc, lw: 1, fill: C.soft });
          s.clipR(X + 2, by, W - 4, bh, () => {
            ctx.save(); ctx.strokeStyle = 'rgba(29,31,32,0.30)'; ctx.lineWidth = 0.9;
            for (let q = -bh; q < W + bh; q += 7) { ctx.beginPath(); ctx.moveTo(X + q, by + bh); ctx.lineTo(X + q + bh, by); ctx.stroke(); }
            ctx.restore();
          });
        }
      } else {
        const show = Math.min(n, k.max || 22);
        for (let i = 0; i < show; i++) {
          const ty = Y + H * (i + 0.5) / show;
          const isF = k.feed && Math.round((k.feed - 0.5) * show / n - 0.5) === i;
          const cc = isF ? C.acc : C.mid, lw = isF ? 2.4 : 1.2;
          if (i % 2 === 0) s.L([[X + 2, ty], [X + W * 0.80, ty]], { col: cc, lw: lw });
          else s.L([[X + W * 0.20, ty], [X + W - 2, ty]], { col: cc, lw: lw });
        }
        if (n > show) s.plate('… ' + n + ' stages', X + W / 2, Y + H * 0.5, { col: C.acc, size: 10.5 });
      }
      s.R(X, Y, W, H, { stroke: C.ink, lw: 1.6 });
      return o;
    };
    s.pumpSym = (cx, cy, rr, k) => {
      k = k || {};
      s.circ(cx, cy, rr, { fill: k.fill || C.soft, stroke: k.col || C.acc, lw: 1.5 });
      ctx.save(); ctx.fillStyle = k.col || C.acc; ctx.beginPath();
      ctx.moveTo(cx - rr * 0.42, cy - rr * 0.52); ctx.lineTo(cx + rr * 0.62, cy); ctx.lineTo(cx - rr * 0.42, cy + rr * 0.52); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    s.valveSym = (cx, cy, rr, k) => {
      k = k || {}; const col = k.col || C.ink;
      s.L([[cx - rr, cy - rr * 0.85], [cx - rr, cy + rr * 0.85], [cx + rr, cy - rr * 0.85], [cx + rr, cy + rr * 0.85]], { col: col, lw: 1.4, close: true, fill: k.fill });
      if (k.act !== false) { s.L([[cx, cy], [cx, cy - rr * 2]], { col: col, lw: 1.1 }); s.R(cx - rr * 0.9, cy - rr * 2.75, rr * 1.8, rr * 0.8, { stroke: col, lw: 1.1, fill: C.bg }); }
    };
    s.fanSym = (cx, cy, rr, k) => {
      k = k || {}; const col = k.col || C.acc;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 2 + (k.ang || 0.3));
        ctx.fillStyle = k.fill || C.soft; ctx.strokeStyle = col; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(rr * 0.55, 0, rr * 0.45, rr * 0.19, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      s.circ(cx, cy, rr * 0.16, { fill: col, stroke: col });
    };
    s.impeller = (cx, ytop, ybot, D, k) => {
      k = k || {}; const col = k.col || C.acc;
      s.L([[cx, ytop], [cx, ybot]], { col: C.ink, lw: 2 });
      s.R(cx - 11, ytop - 13, 22, 12, { stroke: C.ink, lw: 1.2, fill: C.bg });
      const ky = k.type === 'axial' ? -3 : 0;
      s.L([[cx - D / 2, ybot + ky], [cx + D / 2, ybot - ky]], { col: col, lw: 3.2, cap: 'round' });
      s.L([[cx - D / 2, ybot - 5], [cx - D / 2, ybot + 5]], { col: col, lw: 2.4 });
      s.L([[cx + D / 2, ybot - 5], [cx + D / 2, ybot + 5]], { col: col, lw: 2.4 });
    };
    s.badge = (X, Y, label, value, frac, k) => {
      k = k || {};
      const hot = frac !== null && frac !== undefined;
      const col = hot ? self.tcol(frac) : C.ink;
      const H = k.h || 34;
      ctx.save();
      ctx.font = '500 ' + self.TZ(9) + 'px Barlow, system-ui, sans-serif';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.07em';
      const lw2 = ctx.measureText(String(label).toUpperCase()).width;
      ctx.restore();
      const W = Math.max(k.w || 112, lw2 + 20, s.measure(value, 12.5) + 20);
      /* a box widened by the type scale is pulled back inside the frame
         rather than being allowed to run off the right edge */
      if (X + W > s.x + s.w - 5) X = Math.max(s.x, s.x + s.w - 5 - W);
      s.R(X, Y, W, H, { stroke: C.div, lw: 1, fill: '#fff' });
      s.L([[X + 1, Y + 1], [X + 1, Y + H]], { col: hot ? col : C.acc, lw: 2.4 });
      s.T(label, X + 10, Y + 11, { size: 9, caps: true, col: C.mut });
      s.rich(value, X + 10, Y + 24, { size: 12.5, col: col, lab: C.mid });
      return { r: X + W, b: Y + H };
    };
    return s;
  }

