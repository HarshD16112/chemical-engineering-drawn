  /* ── plot engine ───────────────────────────────────────── */
  mkG(ctx, o) {
    const A = Object.assign({ ml: 66, mr: 24, mt: 40, mb: 48 }, o);
    A.ml *= 1.13; A.mb *= 1.1; A.mt *= 1.06;
    if (A.w - A.ml - A.mr < 300) { const sc = Math.max(0.42, (A.w - 300) / Math.max(A.ml + A.mr, 1)); A.ml = Math.max(34, A.ml * sc); A.mr = Math.max(10, A.mr * sc); }
    const x = A.x + A.ml, y = A.y + A.mt, w = A.w - A.ml - A.mr, h = A.h - A.mt - A.mb;
    const C = this.C;
    const tx = v => A.xlog ? Math.log10(Math.max(v, 1e-300)) : v;
    const ty = v => A.ylog ? Math.log10(Math.max(v, 1e-300)) : v;
    const x0 = tx(A.xmin), x1 = tx(A.xmax), y0 = ty(A.ymin), y1 = ty(A.ymax);
    const X = v => x + (tx(v) - x0) / (x1 - x0) * w;
    const Y = v => y + h - (ty(v) - y0) / (y1 - y0) * h;
    const g = { ctx: ctx, X: X, Y: Y, x: x, y: y, w: w, h: h, o: A };
    if (this._gs) this._gs.push(g);
    /* ── label collision registry ───────────────────────────
       Everything the plot writes registers the box it occupies; a later
       label tests against that list and steps aside rather than printing
       on top of an earlier one. Each label is also knocked out of the
       artwork behind it so grid lines and curves never run through type. */
    g._occ = []; g._panels = []; g._lbl = [];
    const hit = (r, l) => { const ox = Math.min(r.x1, l.x1) - Math.max(r.x0, l.x0), oy = Math.min(r.y1, l.y1) - Math.max(r.y0, l.y0); return ox > 1.5 && oy > 1.5 ? ox * oy : 0; };
    const cost = r => { let s = 0; for (let i = 0; i < g._occ.length; i++) s += hit(r, g._occ[i]); return s; };
    const inPanel = r => { for (let i = 0; i < g._panels.length; i++) { const p = g._panels[i]; if (r.x0 >= p.x0 - 3 && r.x1 <= p.x1 + 3 && r.y0 >= p.y0 - 3 && r.y1 <= p.y1 + 3) return true; } return false; };
    const rectFor = (s, px, py, align, size, base) => {
      ctx.font = size + 'px Barlow, system-ui, sans-serif';
      const tw = ctx.measureText(String(s)).width, th = size * 1.06;
      const rx = align === 'right' ? px - tw : align === 'center' ? px - tw / 2 : px;
      const ry = base === 'top' ? py : base === 'bottom' ? py - th : py - th / 2;
      return { x0: rx - 2.5, x1: rx + tw + 2.5, y0: ry - 1.5, y1: ry + th + 1.5 };
    };
    g.reserve = r => { g._occ.push(r); };
    /* a backing plate that both paints and reserves its footprint, so text
       an author deliberately puts inside it is never nudged out of it */
    g.panel = (bx, by, bw, bh) => {
      ctx.save();
      ctx.fillStyle = 'rgba(242,242,243,0.93)'; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(29,31,32,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
      ctx.restore();
      const r = { x0: bx, x1: bx + bw, y0: by, y1: by + bh };
      g._panels.push(r); g._occ.push(r);
      return r;
    };
    /* place = clamp into the drawing area, then hunt for a clear line */
    const place = (s, px, py, col, align, size, base) => {
      align = align || 'left'; size = this.TZ(size || 11.5); base = base || 'middle';
      let r = rectFor(s, px, py, align, size, base);
      const L = A.x + 2, R = A.x + A.w - 2, T = A.y + 1, B = A.y + A.h - 1;
      let dx = 0;
      if (r.x1 + dx > R) dx = R - r.x1;
      if (r.x0 + dx < L) dx = L - r.x0;
      r = { x0: r.x0 + dx, x1: r.x1 + dx, y0: r.y0, y1: r.y1 };
      let dy = 0;
      if (!inPanel(r) && cost(r) > 0) {
        const span = size + 3.5, tw = r.x1 - r.x0;
        /* search outward: same line first, then whole lines above and below,
           each tried at the anchor and shifted a label-width to either side */
        const dxs = [0, -(tw + 8), tw + 8, -(tw / 2 + 6), tw / 2 + 6];
        let bestC = cost(r), bdx = 0, bdy = 0, done = false;
        for (let k = 0; k <= 7 && !done; k++) {
          const signs = k ? [-1, 1] : [0];
          for (let si = 0; si < signs.length && !done; si++) {
            const d = signs[si] * k * span;
            for (let q = 0; q < dxs.length; q++) {
              const t = { x0: r.x0 + dxs[q], x1: r.x1 + dxs[q], y0: r.y0 + d, y1: r.y1 + d };
              if (t.y0 < T || t.y1 > B || t.x0 < L || t.x1 > R) continue;
              const c = cost(t);
              if (c < bestC - 0.5) { bestC = c; bdx = dxs[q]; bdy = d; if (c === 0) { done = true; break; } }
            }
          }
        }
        dx += bdx; dy = bdy;
        r = { x0: r.x0 + bdx, x1: r.x1 + bdx, y0: r.y0, y1: r.y1 };
      }
      const rr = { x0: r.x0, x1: r.x1, y0: r.y0 + dy, y1: r.y1 + dy };
      const paint = () => {
        ctx.save();
        if (!inPanel(rr)) { ctx.fillStyle = 'rgba(242,242,243,0.92)'; ctx.fillRect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0); }
        ctx.fillStyle = col || C.ink;
        ctx.font = size + 'px Barlow, system-ui, sans-serif';
        ctx.textAlign = align; ctx.textBaseline = base;
        ctx.fillText(String(s), px + dx, py + dy);
        ctx.restore();
      };
      paint();
      g._occ.push(rr);
      g._lbl.push({ r: rr, paint: paint });
    };
    const lin = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) r.push(a + (b - a) * i / n); return r; };
    const logT = (a, b) => { const r = []; for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) { const v = Math.pow(10, e); if (v >= a * 0.999 && v <= b * 1.001) r.push(v); } return r; };
    const lab = (v, log) => {
      if (log) { const e = Math.round(Math.log10(v)); return e >= 0 && e <= 5 ? String(Math.pow(10, e)) : '10' + String(e).replace(/-/g, '\u207b').replace(/0/g, '\u2070').replace(/1/g, '\u00b9').replace(/2/g, '\u00b2').replace(/3/g, '\u00b3').replace(/4/g, '\u2074').replace(/5/g, '\u2075').replace(/6/g, '\u2076').replace(/7/g, '\u2077').replace(/8/g, '\u2078').replace(/9/g, '\u2079'); }
      const a = Math.abs(v);
      if (a >= 1e5) return v.toExponential(0);
      return a < 1 && a > 0 ? v.toFixed(a < 0.02 ? 3 : 2) : a < 10 ? (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1)) : String(Math.round(v));
    };
    /* Tick text is formatted from the tick SPACING, not from each value, so a
       0–0.0575 axis reads 0.012 / 0.023 / 0.035 instead of rounding three
       different ticks to the same 0.02. */
    const labSet = (arr, log) => {
      if (log) return v => lab(v, true);
      let d = 2;
      if (arr.length > 1) {
        const step = Math.abs(arr[1] - arr[0]);
        if (step > 0) {
          d = Math.max(0, -Math.floor(Math.log10(step)) + 1);
          while (d > 0 && arr.every(v => Math.abs(v - Number(v.toFixed(d - 1))) < step * 1e-3)) d--;
          d = Math.min(d, 8);
        } else d = 0;
      }
      return v => {
        const a = Math.abs(v);
        if (a < Math.pow(10, -d) / 2) return '0';
        if (a >= 1e5) return v.toExponential(1);
        return v.toFixed(d);
      };
    };
    g.grid = (xl, yl, nx, ny, fx, fy) => {
      ctx.save();
      /* the strip above the frame belongs to the title and the legend —
         no data label may be placed into it */
      g._occ.push({ x0: A.x, x1: A.x + A.w, y0: A.y, y1: y - 4, zone: true });
      ctx.lineWidth = 1;
      const xt = A.xlog ? logT(A.xmin, A.xmax) : lin(A.xmin, A.xmax, nx || 5);
      const yt = A.ylog ? logT(A.ymin, A.ymax) : lin(A.ymin, A.ymax, ny || 5);
      const fmtX = fx || labSet(xt, A.xlog), fmtY = fy || labSet(yt, A.ylog);
      if (A.xlog) { ctx.strokeStyle = C.grid2; for (let e = Math.floor(Math.log10(A.xmin)); e <= Math.ceil(Math.log10(A.xmax)); e++) for (let m = 2; m < 10; m++) { const v = m * Math.pow(10, e); if (v > A.xmin && v < A.xmax) { ctx.beginPath(); ctx.moveTo(Math.round(X(v)) + 0.5, y); ctx.lineTo(Math.round(X(v)) + 0.5, y + h); ctx.stroke(); } } }
      if (A.ylog) { ctx.strokeStyle = C.grid2; for (let e = Math.floor(Math.log10(A.ymin)); e <= Math.ceil(Math.log10(A.ymax)); e++) for (let m = 2; m < 10; m++) { const v = m * Math.pow(10, e); if (v > A.ymin && v < A.ymax) { ctx.beginPath(); ctx.moveTo(x, Math.round(Y(v)) + 0.5); ctx.lineTo(x + w, Math.round(Y(v)) + 0.5); ctx.stroke(); } } }
      ctx.strokeStyle = C.grid;
      ctx.font = this.TZ(11) + 'px Barlow, system-ui, sans-serif';
      ctx.fillStyle = C.mut;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      let lastX = -1e9;
      xt.forEach(v => {
        const px = Math.round(X(v)) + 0.5; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
        const s = fmtX(v), tw = ctx.measureText(s).width;
        /* drop a tick number rather than let two of them collide */
        if (px - tw / 2 < lastX + 5) return;
        lastX = px + tw / 2;
        const tx = Math.min(Math.max(px, A.x + tw / 2 + 2), A.x + A.w - tw / 2 - 2);
        ctx.fillText(s, tx, y + h + 7);
        g._occ.push({ x0: tx - tw / 2 - 3, x1: tx + tw / 2 + 3, y0: y + h + 5, y1: y + h + 20 });
      });
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      let lastY = 1e9;
      yt.forEach(v => {
        const py = Math.round(Y(v)) + 0.5; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
        const s = fmtY(v), tw = ctx.measureText(s).width;
        if (py + 6 > lastY - 6) return;
        lastY = py;
        ctx.fillText(s, x - 9, py);
        g._occ.push({ x0: x - 11 - tw, x1: x - 6, y0: py - 7, y1: py + 7 });
      });
      ctx.strokeStyle = 'rgba(29,31,32,0.42)';
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
      [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(p => {
        ctx.strokeStyle = 'rgba(29,31,32,0.5)'; ctx.beginPath();
        ctx.moveTo(p[0] - 4.5, p[1] + 0.5); ctx.lineTo(p[0] + 4.5, p[1] + 0.5);
        ctx.moveTo(p[0] + 0.5, p[1] - 4.5); ctx.lineTo(p[0] + 0.5, p[1] + 4.5); ctx.stroke();
      });
      ctx.fillStyle = C.ink;
      ctx.font = '700 ' + this.TZ(12) + 'px Lato, system-ui, sans-serif';
      if (xl) { const t = xl.toUpperCase(), tw = ctx.measureText(t).width; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x + w / 2, y + h + Math.max(38, A.mb - 12)); g._occ.push({ x0: x + w / 2 - tw / 2 - 4, x1: x + w / 2 + tw / 2 + 4, y0: y + h + 26, y1: y + h + 42 }); }
      if (yl && A.ml >= 44 && ctx.measureText(yl.toUpperCase()).width <= h - 8) { const cx = Math.max(x - A.ml + 13, A.x + 14); ctx.save(); ctx.translate(cx, y + h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(yl.toUpperCase(), 0, 0); ctx.restore(); g._occ.push({ x0: cx - 8, x1: cx + 6, y0: y, y1: y + h }); }
      ctx.restore();
    };
    g.clip = fn => { ctx.save(); ctx.beginPath(); ctx.rect(x - 0.5, y - 0.5, w + 1, h + 1); ctx.clip(); fn(); ctx.restore(); };
    g.line = (pts, col, lw, dash) => {
      if (!pts || pts.length < 2) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 1, y - 1, w + 2, h + 2); ctx.clip();
      ctx.strokeStyle = col || C.acc; ctx.lineWidth = lw || 2; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      let started = false;
      pts.forEach(p => { if (!isFinite(p[0]) || !isFinite(p[1])) { started = false; return; } if (!started) { ctx.moveTo(X(p[0]), Y(p[1])); started = true; } else ctx.lineTo(X(p[0]), Y(p[1])); });
      ctx.stroke(); ctx.restore();
    };
    g.fn = (fun, col, lw, dash, n) => {
      n = n || 260; const pts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const v = A.xlog ? Math.pow(10, x0 + (x1 - x0) * u) : A.xmin + (A.xmax - A.xmin) * u;
        pts.push([v, fun(v)]);
      }
      g.line(pts, col, lw, dash);
    };
    g.fill = (pts, col) => {
      if (!pts || pts.length < 3) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      pts.slice(1).forEach(p => ctx.lineTo(X(p[0]), Y(p[1])));
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    };
    g.dot = (px, py, col, r) => { ctx.save(); ctx.fillStyle = col || C.acc; ctx.beginPath(); ctx.arc(X(px), Y(py), r || 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = C.bg; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); };
    g.cross = (px, py, col, r) => { ctx.save(); ctx.strokeStyle = col || C.ink; ctx.lineWidth = 1.4; r = r || 7; ctx.beginPath(); ctx.moveTo(X(px) - r, Y(py)); ctx.lineTo(X(px) + r, Y(py)); ctx.moveTo(X(px), Y(py) - r); ctx.lineTo(X(px), Y(py) + r); ctx.stroke(); ctx.restore(); };
    g.txt = (s, px, py, col, align, size, base, rot) => {
      if (rot) {
        const fs = this.TZ(Math.max(10.5, size || 11.5));
        ctx.save();
        ctx.font = fs + 'px Barlow, system-ui, sans-serif';
        const tw = ctx.measureText(String(s)).width, th = fs * 1.12;
        ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
        ctx.translate(X(px), Y(py)); ctx.rotate(rot);
        const ox = align === 'right' ? -tw : align === 'center' ? -tw / 2 : 0;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillRect(ox - 3, -th / 2, tw + 6, th);
        ctx.fillStyle = col || C.ink;
        ctx.fillText(String(s), 0, 0); ctx.restore();
        const hx = Math.abs(Math.cos(rot)) * tw / 2 + Math.abs(Math.sin(rot)) * th / 2;
        const hy = Math.abs(Math.sin(rot)) * tw / 2 + Math.abs(Math.cos(rot)) * th / 2;
        g._occ.push({ x0: X(px) - hx, x1: X(px) + hx, y0: Y(py) - hy, y1: Y(py) + hy });
        return;
      }
      const cx = X(px), cy = Y(py);
      if (!isFinite(cx) || !isFinite(cy)) return;
      place(s, cx, cy, col, align, Math.max(10.5, size || 11.5) / 1.0, base);
    };
    g.ptxt = (s, px, py, col, align, size, base) => {
      if (!isFinite(px) || !isFinite(py)) return;
      place(s, px, py, col, align, size, base);
    };
    /* The title and the legend share the strip above the frame, so the title
       records its measured width and the legend budgets around it. */
    g.titleW = 0;
    g.title = s => {
      ctx.save(); ctx.fillStyle = C.ink;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const t = String(s).toUpperCase();
      let fs = this.TZ(13);
      ctx.font = '700 ' + fs + 'px Lato, system-ui, sans-serif';
      while (ctx.measureText(t).width > w && fs > 11) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Lato, system-ui, sans-serif'; }
      g.titleW = Math.min(ctx.measureText(t).width, w);
      const by = Math.max(y - 10, A.y + fs);
      ctx.fillText(t, x, by); ctx.restore();
      g._occ.push({ x0: x - 3, x1: x + g.titleW + 3, y0: by - fs - 2, y1: by + 4 });
    };
    g.legend = items => {
      if (w < 190 || h < 110 || !items || !items.length) return;
      ctx.save();
      ctx.font = this.TZ(11) + 'px Barlow, system-ui, sans-serif'; ctx.textBaseline = 'middle';
      const seg = 20, gap = 18;
      const ws = items.map(i => seg + 6 + ctx.measureText(i.l).width);
      /* wrap against whatever the title leaves free, never a fixed fraction */
      const clear = g.titleW ? g.titleW + 14 : 0;
      const budget = Math.max(w - clear, w * 0.34);
      const rows = [[]]; let cur = 0;
      ws.forEach((iw, k) => { if (cur > 0 && cur + iw + gap > budget) { rows.push([]); cur = 0; } rows[rows.length - 1].push(k); cur += iw + gap; });
      /* if the bottom row would still reach back under the title, lift the
         whole block by one line so nothing is painted twice over */
      const lastTot = rows[rows.length - 1].reduce((s, k) => s + ws[k], 0) + gap * (rows[rows.length - 1].length - 1);
      const lift = (g.titleW && x + w - lastTot < x + clear) ? 15 : 0;
      /* Does the whole block fit in the strip above the frame? If not, move it
         inside the plot on a backing panel rather than dropping entries \u2014 an
         unlabelled curve is worse than a legend sitting over some white space. */
      const topRow = y - 13 - lift - (rows.length - 1) * 17;
      const inside = topRow < A.y + 12;
      const rowTot = row => row.reduce((s, k) => s + ws[k], 0) + gap * (row.length - 1);
      let baseY, baseX = 0;
      if (inside) {
        const blockW = Math.max.apply(null, rows.map(rowTot));
        const blockH = rows.length * 15;
        /* four corners are candidates — take whichever sits on the least type */
        const cands = [
          { bx: x + w - blockW - 24, by: y + 2 },
          { bx: x + 4, by: y + 2 },
          { bx: x + w - blockW - 24, by: y + h - blockH - 8 },
          { bx: x + 4, by: y + h - blockH - 8 }
        ];
        let best = cands[0], bc = Infinity;
        cands.forEach(cd => {
          if (cd.by < y + 1 || cd.bx < x + 1) return;
          const c = cost({ x0: cd.bx, x1: cd.bx + blockW + 18, y0: cd.by, y1: cd.by + blockH + 6 });
          if (c < bc - 0.5) { bc = c; best = cd; }
        });
        baseX = best.bx; baseY = best.by + 12;
        ctx.fillStyle = 'rgba(247,247,245,0.93)';
        ctx.strokeStyle = 'rgba(29,31,32,0.14)'; ctx.lineWidth = 1;
        const bx = best.bx, by = best.by;
        ctx.beginPath(); ctx.rect(bx, by, blockW + 18, blockH + 6); ctx.fill(); ctx.stroke();
        g._panels.push({ x0: bx, x1: bx + blockW + 18, y0: by, y1: by + blockH + 6 });
        g._occ.push({ x0: bx, x1: bx + blockW + 18, y0: by, y1: by + blockH + 6 });
      }
      rows.forEach((row, ri) => {
        const tot = rowTot(row);
        const py = inside ? baseY + ri * 15 : y - 13 - lift - (rows.length - 1 - ri) * 15;
        let px = inside ? baseX + 8 : x + w - tot;
        row.forEach(k => {
          const i = items[k];
          ctx.strokeStyle = i.c; ctx.lineWidth = i.lw || 2; ctx.setLineDash(i.d || []);
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + seg, py); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.fillText(i.l, px + seg + 6, py);
          px += ws[k] + gap;
        });
        if (!inside) g._occ.push({ x0: x + w - tot - 4, x1: x + w + 4, y0: py - 8, y1: py + 8 });
      });
      ctx.restore();
    };
    return g;
  }

