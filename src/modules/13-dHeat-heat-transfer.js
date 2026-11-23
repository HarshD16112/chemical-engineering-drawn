  dHeat() {
    const self = this, C = this.C;
    const S = 'Heat Transfer';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    return [
      {
        id: 'lmtd',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const A = self.rget(r, 'required area') || 0, F = self.rget(r, 'correction factor') || 1;
  const lm = self.rget(r, 'lmtd') || 0, cross = v.Tc2 >= v.Th1 || v.Tc1 >= v.Th2;
  const co = v.arr === 'co', sh = v.arr === 'sh12';
  const lo = Math.min(v.Tc1, v.Th2, v.Tc2, v.Th1), hi = Math.max(v.Th1, v.Tc2, v.Tc1, v.Th2);
  const tf = T => 0.08 + 0.84 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  s.title(sh ? '1 shell / 2 tube passes' : co ? 'Co-current exchanger' : 'Countercurrent exchanger', 'A ' + self.f(self.cvt(A, 'A')[0], 1) + ' ' + self.cvt(0, 'A')[1] + ' \u00b7 F ' + self.f(F, 3));
  const X = s.x + 96, W = s.w - 210, Y = s.y + 54, H = Math.max(140, Math.min(s.h - 96, 240));
  s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
  s.T('shell \u2014 hot side', X + W / 2, Y - 12, { align: 'center', size: 10, col: C.mut, caps: true });
  const grd = ctx.createLinearGradient(X, 0, X + W, 0);
  grd.addColorStop(0, s.temp(tf(v.Th1), 0.22)); grd.addColorStop(1, s.temp(tf(v.Th2), 0.22));
  s.clipR(X, Y, W, H, () => { ctx.fillStyle = grd; ctx.fillRect(X, Y, W, H); });
  s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
  if (sh) {
    const y1 = Y + H * 0.34, y2 = Y + H * 0.66;
    s.L([[X - 44, y1], [X + W - 22, y1]], { col: s.temp(tf(v.Tc1)), lw: 3 });
    s.L([[X + W - 22, y1], [X + W - 14, (y1 + y2) / 2], [X + W - 22, y2]], { col: s.temp(tf((v.Tc1 + v.Tc2) / 2)), lw: 3 });
    s.L([[X + W - 22, y2], [X - 44, y2]], { col: s.temp(tf(v.Tc2)), lw: 3, arrow: true });
    s.T('t\u2081 ' + self.f(self.cvt(v.Tc1, 'T')[0], 0), X - 46, y1 - 12, { size: 10.5, col: s.temp(tf(v.Tc1)) });
    s.T('t\u2082 ' + self.f(self.cvt(v.Tc2, 'T')[0], 0), X - 46, y2 + 13, { size: 10.5, col: s.temp(tf(v.Tc2)) });
  } else {
    const yt = Y + H / 2;
    const a = co ? [X - 46, yt] : [X + W + 46, yt], bb = co ? [X + W + 46, yt] : [X - 46, yt];
    s.L([[a[0], yt], [bb[0], yt]], { col: s.temp(tf((v.Tc1 + v.Tc2) / 2)), lw: 3.4, arrow: true });
    s.T('t\u2081 ' + self.f(self.cvt(v.Tc1, 'T')[0], 0), a[0], yt - 13, { size: 10.5, col: s.temp(tf(v.Tc1)), align: co ? 'left' : 'right' });
    s.T('t\u2082 ' + self.f(self.cvt(v.Tc2, 'T')[0], 0), bb[0], yt - 13, { size: 10.5, col: s.temp(tf(v.Tc2)), align: co ? 'right' : 'left' });
    s.T('tubes \u2014 cold side', (X + W / 2), yt + 15, { align: 'center', size: 10, col: C.mut, caps: true });
  }
  s.L([[X + W * 0.14, Y - 34], [X + W * 0.14, Y]], { col: s.temp(tf(v.Th1)), lw: 3.4, arrow: true });
  s.T('T\u2081 ' + self.f(self.cvt(v.Th1, 'T')[0], 0), X + W * 0.14 + 7, Y - 28, { size: 10.5, col: s.temp(tf(v.Th1)) });
  s.L([[X + W * 0.86, Y + H], [X + W * 0.86, Y + H + 34]], { col: s.temp(tf(v.Th2)), lw: 3.4, arrow: true });
  s.T('T\u2082 ' + self.f(self.cvt(v.Th2, 'T')[0], 0), X + W * 0.86 + 7, Y + H + 28, { size: 10.5, col: s.temp(tf(v.Th2)) });
  for (let i = 0; i < 7; i++) { const px = X + W * (0.1 + 0.8 * i / 6); s.L([[px, Y + 8], [px, Y + H - 8]], { col: 'rgba(29,31,32,0.16)', lw: 1 }); }
  s.badge(s.x, s.y + 6, 'LMTD', self.f(self.cvt(lm, 'dT')[0], 1) + ' ' + self.cvt(0, 'dT')[1], null, { w: 88 });
  s.badge(s.x, s.y + 48, 'F factor', self.f(F, 3), F < 0.75 ? 0.9 : 0.4, { w: 88 });
  s.badge(s.x + s.w - 104, s.y + 6, 'Area', self.f(self.cvt(A, 'A')[0], 1), null, { w: 104 });
  s.badge(s.x + s.w - 104, s.y + 48, 'Duty', self.f(v.Q, 0) + ' kW', 0.5 + 0.4 * self.cl01(v.Q / 8000), { w: 104 });
  if (cross) s.T('temperature cross \u2014 this arrangement cannot do it', s.cx, Y + H + 58, { align: 'center', size: 11.5, col: C.warn, bold: true });
},
        schemNote: 'Nozzle colours are the real stream temperatures and the shell carries the hot-side gradient. Switch arrangement and the tube routing changes with it; a temperature cross is called out on the drawing.',
        num: 'H-01', sec: S, name: 'LMTD, correction factor & area',
        blurb: 'Sizing by driving force. The two temperature profiles down the exchanger give the log-mean difference; the F factor then penalises you for the fact that a shell-and-tube unit is not truly countercurrent.',
        howto: 'Watch the gap between the two profiles \u2014 that gap is the driving force, and its log-mean is what sets the area. Push the outlets toward each other and the gap collapses: area goes to infinity for the last few degrees. If the profiles cross in a co-current arrangement the duty is simply impossible. When F drops below about 0.8 the 1\u20132 shell is being asked to do too much and you should add shells in series.',
        std: 'TEMA 10th ed.; Bowman, Mueller & Nagle (1940) F-factor charts; Kern, Process Heat Transfer',
        eqs: [['\\Delta T_{lm} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)}', 'log-mean driving force'], ['Q = UAF\\Delta T_{lm}', 'the sizing equation'], ['F = \\frac{\\sqrt{R^2+1}\\;\\ln\\frac{1-P}{1-PR}}{(R-1)\\ln\\frac{2-P(R+1-\\sqrt{R^2+1})}{2-P(R+1+\\sqrt{R^2+1})}}', 'correction factor, one shell pass'], ['\\frac{1}{U_o} = \\frac{d_o}{d_ih_i} + R_f + \\frac{d_o\\ln(d_o/d_i)}{2\\lambda_w} + \\frac{1}{h_o}', 'overall coefficient on the outside area']],
        notes: ['Constant U and constant specific heats; no phase change.', 'R = (T\u2081\u2212T\u2082)/(t\u2082\u2212t\u2081), P = (t\u2082\u2212t\u2081)/(T\u2081\u2212t\u2081).', 'F < 0.75 is generally rejected \u2014 split into multiple shells.'],
        params: [{ k: 'arr', label: 'Arrangement', type: 'select', val: 'ctr', options: [['ctr', 'Pure countercurrent'], ['co', 'Co-current'], ['sh12', '1 shell pass / 2 tube passes']] }, P('Th1', 'Hot inlet  T\u2081', 20, 400, 1, 150, 'T'), P('Th2', 'Hot outlet  T\u2082', 10, 380, 1, 70, 'T'), P('Tc1', 'Cold inlet  t\u2081', 0, 300, 1, 25, 'T'), P('Tc2', 'Cold outlet  t\u2082', 5, 350, 1, 90, 'T'), P('Q', 'Duty', 5, 20000, 5, 1200, null, 'kW'), P('U', 'Overall coefficient U', 20, 3000, 10, 600, 'U')],
        compute: v => {
          const co = v.arr === 'co';
          const d1 = co ? v.Th1 - v.Tc1 : v.Th1 - v.Tc2;
          const d2 = co ? v.Th2 - v.Tc2 : v.Th2 - v.Tc1;
          const lmtd = Math.abs(d1 - d2) < 1e-6 ? d1 : (d1 - d2) / Math.log(d1 / d2);
          let F = 1;
          if (v.arr === 'sh12') {
            const R = (v.Th1 - v.Th2) / (v.Tc2 - v.Tc1), Pp = (v.Tc2 - v.Tc1) / (v.Th1 - v.Tc1);
            if (Math.abs(R - 1) < 1e-6) {
              const den = 2 * Pp / (1 - Pp);
              F = Math.sqrt(2) * den / Math.log((2 / Pp - 1 + Math.sqrt(2)) / (2 / Pp - 1 - Math.sqrt(2)));
              F = (Pp * Math.sqrt(2) / (1 - Pp)) / Math.log((2 / Pp - 1 + Math.sqrt(2)) / (2 / Pp - 1 - Math.sqrt(2)));
            } else {
              const s = Math.sqrt(R * R + 1);
              const num = s * Math.log((1 - Pp) / (1 - Pp * R));
              const den = (R - 1) * Math.log((2 - Pp * (R + 1 - s)) / (2 - Pp * (R + 1 + s)));
              F = num / den;
            }
          }
          const A = v.Q * 1000 / (v.U * F * lmtd);
          const cross = lmtd <= 0 || !isFinite(lmtd);
          return {
            lmtd: lmtd, F: F, A: A, co: co,
            res: [{ l: '\u0394T at hot end', v: d1, u: '', cv: 'dT', d: 2 }, { l: '\u0394T at cold end', v: d2, u: '', cv: 'dT', d: 2 }, { l: 'LMTD', v: lmtd, u: '', cv: 'dT', d: 2 }, { l: 'Correction factor F', v: F, u: '\u2014', d: 4 }, { l: 'Effective \u0394T = F\u00b7LMTD', v: F * lmtd, u: '', cv: 'dT', d: 2 }, { l: 'Required area', v: A, u: '', cv: 'A' }, { l: 'UA', v: v.U * A / 1000, u: 'kW/K', d: 2 }, { l: 'Hot stream W\u00b7Cp', v: v.Q / (v.Th1 - v.Th2), u: 'kW/K', d: 2 }, { l: 'Cold stream W\u00b7Cp', v: v.Q / (v.Tc2 - v.Tc1), u: 'kW/K', d: 2 }, { l: 'Verdict', s: cross ? 'temperature cross \u2014 impossible' : F < 0.75 ? 'F too low \u2014 use more shells' : 'acceptable', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const tmin = Math.min(v.Tc1, v.Tc2, v.Th1, v.Th2) - 8, tmax = Math.max(v.Th1, v.Th2, v.Tc2) + 8;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1, ymin: tmin, ymax: tmax, ml: 72 });
          g.grid('Fractional area from hot inlet', 'Temperature  (' + self.cvt(0, 'T')[1] + ')', 5, 6, t => (t * 100).toFixed(0) + '%', t => self.f(self.cvt(t, 'T')[0], 0));
          g.title('Temperature profile \u2014 ' + (v.arr === 'co' ? 'co-current' : v.arr === 'ctr' ? 'countercurrent' : '1\u20132 shell & tube'));
          const hot = f => v.Th1 + (v.Th2 - v.Th1) * f;
          const cold = f => r.co ? v.Tc1 + (v.Tc2 - v.Tc1) * f : v.Tc2 + (v.Tc1 - v.Tc2) * f;
          g.fn(f => hot(f), C.dk, 2.8);
          g.fn(f => cold(f), C.acc, 2.8);
          for (let i = 1; i < 12; i++) {
            const f = i / 12;
            g.line([[f, cold(f)], [f, hot(f)]], 'rgba(29,31,32,0.16)', 1);
          }
          g.txt('hot stream', 0.5, hot(0.5) + (tmax - tmin) * 0.035, C.dk, 'center', 11.5);
          g.txt('cold stream', 0.5, cold(0.5) - (tmax - tmin) * 0.04, C.mid, 'center', 11.5);
          g.legend([{ c: C.dk, l: 'hot' }, { c: C.acc, l: 'cold' }, { c: 'rgba(29,31,32,0.16)', l: 'driving force', lw: 1 }]);
          g.ptxt('LMTD = ' + self.f(self.cvt(r.lmtd, 'dT')[0], 2) + ' ' + self.cvt(0, 'dT')[1] + '    F = ' + r.F.toFixed(3) + '    A = ' + self.f(self.cvt(r.A, 'A')[0], 1) + ' ' + self.cvt(0, 'A')[1], g.x + 12, g.y + g.h - 16, C.ink, 'left', 12.5);
        }
      },
      {
        id: 'ntu',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const e = self.rget(r, 'effectiveness') || 0, N = self.rget(r, 'ntu') || 0, Q = self.rget(r, 'actual duty') || 0;
  const Tho = self.rget(r, 'hot outlet'), Tco = self.rget(r, 'cold outlet');
  const lo = Math.min(v.Tci, Tco || v.Tci), hi = Math.max(v.Thi, Tho || v.Thi);
  const tf = T => 0.08 + 0.84 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  const names = { ctr: 'Counterflow', par: 'Parallel flow', sh12: '1 shell / 2 tube passes', cross: 'Crossflow, both unmixed' };
  s.title(names[v.cfg] || 'Exchanger', 'NTU ' + self.f(N, 2) + ' \u00b7 \u03b5 ' + self.f(e, 3));
  const X = s.x + 90, W = s.w - 200, Y = s.y + 52, H = Math.max(132, Math.min(s.h - 94, 232));
  s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8, fill: C.bg });
  const grd = ctx.createLinearGradient(X, 0, X + W, 0);
  grd.addColorStop(0, s.temp(tf(v.Thi), 0.24)); grd.addColorStop(1, s.temp(tf(Tho === undefined ? v.Thi : Tho), 0.24));
  s.clipR(X, Y, W, H, () => { ctx.fillStyle = grd; ctx.fillRect(X, Y, W, H); });
  s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
  const yt = Y + H / 2;
  if (v.cfg === 'sh12') {
    const y1 = Y + H * 0.33, y2 = Y + H * 0.67;
    s.L([[X - 42, y1], [X + W - 20, y1], [X + W - 12, yt], [X + W - 20, y2], [X - 42, y2]], { col: s.temp(tf(v.Tci)), lw: 3, arrow: true });
  } else if (v.cfg === 'cross') {
    s.L([[s.cx, Y - 34], [s.cx, Y + H + 34]], { col: s.temp(tf(v.Tci)), lw: 3.4, arrow: true });
    s.T('cold crossflow', s.cx + 8, Y + H + 28, { size: 10.5, col: s.temp(tf(Tco === undefined ? v.Tci : Tco)) });
  } else if (v.cfg === 'par') {
    s.L([[X - 42, yt], [X + W + 42, yt]], { col: s.temp(tf(v.Tci)), lw: 3.4, arrow: true });
  } else {
    s.L([[X + W + 42, yt], [X - 42, yt]], { col: s.temp(tf(v.Tci)), lw: 3.4, arrow: true });
  }
  if (v.cfg !== 'cross') { s.T('t_in ' + self.f(self.cvt(v.Tci, 'T')[0], 0), v.cfg === 'par' ? X - 44 : X + W + 44, yt - 13, { size: 10.5, col: s.temp(tf(v.Tci)), align: 'left' }); s.T('t_out ' + self.f(self.cvt(Tco === undefined ? v.Tci : Tco, 'T')[0], 0), v.cfg === 'par' ? X + W + 44 : X - 44, yt + 14, { size: 10.5, col: s.temp(tf(Tco === undefined ? v.Tci : Tco)), align: 'right' }); }
  s.L([[X + W * 0.15, Y - 32], [X + W * 0.15, Y]], { col: s.temp(tf(v.Thi)), lw: 3.4, arrow: true });
  s.T('T_in ' + self.f(self.cvt(v.Thi, 'T')[0], 0), X + W * 0.15 + 7, Y - 26, { size: 10.5, col: s.temp(tf(v.Thi)) });
  s.L([[X + W * 0.85, Y + H], [X + W * 0.85, Y + H + 32]], { col: s.temp(tf(Tho === undefined ? v.Thi : Tho)), lw: 3.4, arrow: true });
  s.T('T_out ' + self.f(self.cvt(Tho === undefined ? v.Thi : Tho, 'T')[0], 0), X + W * 0.85 + 7, Y + H + 26, { size: 10.5, col: s.temp(tf(Tho === undefined ? v.Thi : Tho)) });
  const bx = s.x, bw = 80, by = Y - 6, bh = H + 12;
  s.R(bx, by, bw * 0.34, bh, { stroke: C.mut, lw: 1 });
  s.R(bx + 1, by + bh * (1 - self.cl01(e)), bw * 0.34 - 1, bh * self.cl01(e), { stroke: null, fill: C.soft3 });
  s.T('\u03b5', bx + bw * 0.17, by - 10, { align: 'center', size: 11, col: C.mut });
  s.T(self.f(e * 100, 1) + '%', bx + bw * 0.17, by + bh + 12, { align: 'center', size: 10.5, col: C.acc });
  s.badge(s.x + s.w - 100, s.y + 6, 'Duty Q', self.f(Q, 0) + ' kW', 0.5 + 0.42 * self.cl01(Q / 4000), { w: 100 });
  s.badge(s.x + s.w - 100, s.y + 48, 'NTU', self.f(N, 2), null, { w: 100 });
},
        schemNote: 'The shell gradient runs from the hot inlet colour to the computed hot outlet, and the cold stream is routed to match the configuration. The left bar is effectiveness \u2014 watch it saturate as NTU grows.',
        num: 'H-02', sec: S, name: 'Effectiveness\u2013NTU',
        blurb: 'The rating method: given the hardware you already have, what will it actually do? Effectiveness against NTU, one curve per capacity-rate ratio, with the diminishing returns of extra area laid bare.',
        howto: 'Every curve flattens. Below NTU \u2248 1 extra area buys effectiveness almost one for one; past NTU \u2248 3 you are buying very little for a lot of steel. The family spread shows the penalty of balanced flows \u2014 at C\u1d63 = 1 the exchanger is hardest to push toward complete recovery, while a condensing or evaporating stream (C\u1d63 = 0) reaches high effectiveness with modest area.',
        std: 'Kays & London, Compact Heat Exchangers, 3rd ed.; Incropera Ch. 11',
        eqs: [['\\varepsilon = \\frac{Q}{Q_{max}} = \\frac{Q}{C_{min}(T_{h,in}-T_{c,in})}', 'effectiveness'], ['NTU = \\frac{UA}{C_{min}},\\quad C_r = \\frac{C_{min}}{C_{max}}', 'the two governing groups'], ['\\varepsilon = \\frac{1-e^{-NTU(1-C_r)}}{1-C_re^{-NTU(1-C_r)}}', 'counterflow relation']],
        notes: ['Constant properties and constant U over the surface.', 'C\u1d63 = 0 corresponds to boiling or condensing on one side.', 'Crossflow relation is the Kays\u2013London both-fluids-unmixed correlation.'],
        params: [{ k: 'cfg', label: 'Configuration', type: 'select', val: 'ctr', options: [['ctr', 'Counterflow'], ['par', 'Parallel flow'], ['sh12', '1 shell / 2 tube passes'], ['cross', 'Crossflow, both unmixed']] }, P('UA', 'UA', 0.5, 500, 0.5, 40, null, 'kW/K'), P('Cmin', 'C_min = (m\u0307c_p)_min', 0.5, 200, 0.5, 20, null, 'kW/K'), P('Cr', 'Capacity ratio  C_r', 0, 1, 0.01, 0.6, null, '\u2014'), P('Thi', 'Hot inlet temperature', 20, 500, 1, 180, 'T'), P('Tci', 'Cold inlet temperature', -20, 300, 1, 30, 'T')],
        compute: v => {
          const eps = (N, cr, cfg) => {
            if (N <= 0) return 0;
            if (cfg === 'par') return cr === 0 ? 1 - Math.exp(-N) : (1 - Math.exp(-N * (1 + cr))) / (1 + cr);
            if (cfg === 'cross') return cr === 0 ? 1 - Math.exp(-N) : 1 - Math.exp(Math.pow(N, 0.22) / cr * (Math.exp(-cr * Math.pow(N, 0.78)) - 1));
            if (cfg === 'sh12') {
              const s = Math.sqrt(1 + cr * cr);
              const e = Math.exp(-N * s);
              return 2 / (1 + cr + s * (1 + e) / (1 - e));
            }
            if (cr === 0) return 1 - Math.exp(-N);
            if (Math.abs(cr - 1) < 1e-9) return N / (1 + N);
            const x = Math.exp(-N * (1 - cr));
            return (1 - x) / (1 - cr * x);
          };
          const N = v.UA / v.Cmin;
          const e = eps(N, v.Cr, v.cfg);
          const dT = v.Thi - v.Tci;
          const Q = e * v.Cmin * dT;
          const Cmax = v.Cr > 0 ? v.Cmin / v.Cr : Infinity;
          return {
            eps: eps, N: N, e: e,
            res: [{ l: 'NTU', v: N, u: '\u2014', d: 3 }, { l: 'Effectiveness \u03b5', v: e, u: '\u2014', d: 4 }, { l: 'Maximum possible duty', v: v.Cmin * dT, u: 'kW', d: 1 }, { l: 'Actual duty Q', v: Q, u: 'kW', d: 1 }, { l: 'Hot outlet', v: v.Cr > 0 && v.Cmin / v.Cr >= v.Cmin ? v.Thi - Q / Cmax : v.Thi - Q / v.Cmin, u: '', cv: 'T', d: 2 }, { l: 'Cold outlet', v: v.Tci + Q / v.Cmin, u: '', cv: 'T', d: 2 }, { l: 'LMTD equivalent', v: Q / (v.UA), u: '', cv: 'dT', d: 2 }, { l: 'Marginal \u03b5 per +10% area', v: (eps(N * 1.1, v.Cr, v.cfg) - e) * 100, u: 'pts', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 6, ymin: 0, ymax: 1, ml: 62 });
          g.grid('NTU = UA / C\u2098\u1d62\u2099', 'Effectiveness  \u03b5', 6, 5);
          g.title('Effectiveness \u2014 ' + (v.cfg === 'ctr' ? 'counterflow' : v.cfg === 'par' ? 'parallel flow' : v.cfg === 'sh12' ? '1\u20132 shell & tube' : 'crossflow, unmixed'));
          [0, 0.25, 0.5, 0.75, 1].forEach(cr => {
            const near = Math.abs(cr - v.Cr) < 0.02;
            g.fn(N => r.eps(N, cr, v.cfg), near ? C.acc : 'rgba(29,31,32,0.28)', near ? 2.8 : 1.3);
            const ye = r.eps(6, cr, v.cfg);
            g.txt('C\u1d63 = ' + cr, 5.92, ye, near ? C.mid : C.mut, 'right', 10.5, 'bottom');
          });
          if (Math.abs(v.Cr - 0) > 0.02 && [0.25, 0.5, 0.75, 1].every(c => Math.abs(c - v.Cr) > 0.02)) g.fn(N => r.eps(N, v.Cr, v.cfg), C.acc, 2.8);
          g.cross(Math.min(r.N, 6), r.e, C.dk, 10);
          g.dot(Math.min(r.N, 6), r.e, C.acc, 5);
          g.txt('NTU = ' + r.N.toFixed(2) + ',  \u03b5 = ' + r.e.toFixed(3), Math.min(r.N, 6), r.e - 0.06, C.ink, 'center', 12);
          g.legend([{ c: C.acc, l: 'your C\u1d63 = ' + v.Cr.toFixed(2) }, { c: 'rgba(29,31,32,0.28)', l: 'other ratios', lw: 1.3 }]);
        }
      },
      {
        id: 'insul',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Ts = self.rget(r, 'surface temperature'), q = self.rget(r, 'heat loss') || 0;
  const bare = self.rget(r, 'bare pipe loss') || q, saved = self.rget(r, 'heat saved') || 0;
  const rp = v.Dp / 2, ro = rp + v.t;
  const maxR = Math.min(s.h * 0.42, s.w * 0.22);
  const sc = maxR / Math.max(ro, 1);
  const cx = s.x + s.w * 0.32, cy = s.cy + 6;
  const tfp = self.cl01((v.Tp - v.Ta) / 400) * 0.5 + 0.5;
  const tfs = self.cl01(((Ts === undefined ? v.Ta : Ts) - v.Ta) / 120) * 0.45 + 0.5;
  s.title('Pipe cross-section', self.f(self.cvt(v.Dp, 'mm')[0], 0) + ' + ' + self.f(self.cvt(v.t, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' lagging');
  const steps = 26;
  for (let i = steps; i >= 1; i--) {
    const rr = rp * sc + (ro - rp) * sc * i / steps;
    const u = i / steps;
    s.circ(cx, cy, rr, { fill: s.temp(tfs + (tfp - tfs) * (1 - u), 1), stroke: 'rgba(0,0,0,0)' , lw: 0.5});
  }
  s.circ(cx, cy, ro * sc, { stroke: C.ink, lw: 1.6 });
  s.circ(cx, cy, rp * sc, { fill: s.temp(tfp), stroke: C.ink, lw: 1.6 });
  s.circ(cx, cy, Math.max(rp * sc - 4, 2), { fill: s.temp(tfp, 0.5), stroke: 'rgba(29,31,32,0.35)', lw: 1 });
  s.T(self.f(self.cvt(v.Tp, 'T')[0], 0) + '\u00b0', cx, cy, { align: 'center', size: 12, col: '#fff', bold: true });
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + 0.26, L = 10 + 26 * self.cl01(q / Math.max(bare, 1));
    s.L([[cx + Math.cos(a) * (ro * sc + 4), cy + Math.sin(a) * (ro * sc + 4)], [cx + Math.cos(a) * (ro * sc + 4 + L), cy + Math.sin(a) * (ro * sc + 4 + L)]], { col: s.temp(tfs), lw: 1.4, arrow: true, asz: 5 });
  }
  s.dim(cx, cy - rp * sc, cx, cy - ro * sc, self.f(self.cvt(v.t, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.ink });
  const px = s.x + s.w - 196;
  s.badge(px, s.y + 4, 'Heat loss', self.f(self.cvt(q, 'Wm')[0], 1) + ' ' + self.cvt(0, 'Wm')[1], 0.5 + 0.45 * self.cl01(q / Math.max(bare, 1)), { w: 190 });
  s.badge(px, s.y + 48, 'Surface temperature', self.f(self.cvt(Ts === undefined ? v.Ta : Ts, 'T')[0], 1) + ' ' + self.cvt(0, 'T')[1], tfs, { w: 190 });
  s.badge(px, s.y + 92, 'Bare-pipe loss avoided', self.f(saved, 1) + '%', 0.5 - 0.4 * self.cl01(saved / 100), { w: 190 });
  if (Ts !== undefined && Ts > 60) s.T('surface above 60 \u00b0C \u2014 not touch-safe', px, s.y + 150, { size: 11.5, col: C.warn, bold: true });
  else s.T('surface is touch-safe', px, s.y + 150, { size: 11.5, col: C.acc, bold: true });
},
        schemNote: 'The lagging is drawn to scale around the pipe and shaded from the process temperature at the bore to the computed skin temperature at the outside. Arrow length is heat loss relative to the bare pipe.',
        num: 'H-03', sec: S, name: 'Pipe insulation heat loss',
        blurb: 'Heat loss and surface temperature for an insulated horizontal pipe, with the outer film solved iteratively from natural or forced convection plus radiation. The personnel-protection limit and the economic thickness fall out of the same curve.',
        howto: 'The falling curve is heat loss, the rising one surface temperature scaled to the same axis. Both flatten \u2014 the first 25 mm of insulation does most of the work and everything after that is diminishing returns, which is exactly why economic thickness tables stop where they do. The dashed line at 60\u00a0\u00b0C is the usual personnel-protection limit; wherever the surface curve crosses it is your minimum thickness for a touchable pipe.',
        std: 'ASTM C680 heat-loss method; ASTM C1055 personnel protection; ISO 12241 surface coefficients',
        eqs: [['Q = \\frac{2\\pi L(T_i-T_a)}{\\frac{\\ln(r_2/r_1)}{\\lambda_{ins}} + \\frac{1}{r_2h_o}}', 'series resistance through insulation and outer film'], ['h_o = h_c(T_s) + h_r(T_s)', 'outer film solved iteratively on surface temperature'], ['h_r = \\epsilon\\sigma(T_s^2+T_a^2)(T_s+T_a)', 'radiation linearised about the surface']],
        notes: ['Horizontal cylinder; natural convection below 0.2 m/s wind, forced above.', 'Pipe-wall and inside-film resistances neglected.', 'Surface temperature converged by successive substitution.'],
        params: [P('Dp', 'Pipe outside diameter', 15, 1200, 1, 114.3, 'mm'), P('t', 'Insulation thickness', 10, 300, 1, 50, 'mm'), P('Tp', 'Process temperature', 20, 600, 1, 250, 'T'), P('Ta', 'Ambient temperature', -40, 55, 1, 20, 'T'), P('k', 'Insulation conductivity', 0.02, 0.3, 0.001, 0.045, 'kt'), P('em', 'Surface emissivity', 0.05, 0.98, 0.01, 0.2, null, '\u2014'), P('wind', 'Wind speed', 0, 20, 0.5, 3, null, 'm/s')],
        compute: v => {
          const sig = 5.670374e-8;
          const solve = th => {
            const r1 = v.Dp / 2000, r2 = r1 + th / 1000;
            if (th <= 0) {
              let Ts = v.Tp;
              const hc = v.wind > 0.2 ? 10.45 - v.wind + 10 * Math.sqrt(v.wind) : 1.32 * Math.pow(Math.max(Ts - v.Ta, 0.1) / (2 * r1), 0.25);
              const hr = v.em * sig * (Math.pow(Ts + 273.15, 4) - Math.pow(v.Ta + 273.15, 4)) / Math.max(Ts - v.Ta, 0.01);
              return { q: (hc + hr) * 2 * Math.PI * r1 * (Ts - v.Ta), Ts: Ts, h: hc + hr };
            }
            let Ts = (v.Tp + v.Ta) / 2, q = 0, h = 0;
            for (let i = 0; i < 120; i++) {
              const dTs = Math.max(Ts - v.Ta, 0.01);
              const hc = v.wind > 0.2 ? 10.45 - v.wind + 10 * Math.sqrt(v.wind) : 1.32 * Math.pow(dTs / (2 * r2), 0.25);
              const hr = v.em * sig * (Math.pow(Ts + 273.15, 4) - Math.pow(v.Ta + 273.15, 4)) / dTs;
              h = hc + hr;
              const Rc = Math.log(r2 / r1) / (2 * Math.PI * v.k), Ro = 1 / (h * 2 * Math.PI * r2);
              q = (v.Tp - v.Ta) / (Rc + Ro);
              const Tn = v.Ta + q * Ro;
              if (Math.abs(Tn - Ts) < 1e-7) { Ts = Tn; break; }
              Ts = Ts + 0.6 * (Tn - Ts);
            }
            return { q: q, Ts: Ts, h: h };
          };
          const cur = solve(v.t), bare = solve(0);
          const rcrit = v.k / (cur.h || 1) * 1000;
          let tmin = null;
          for (let th = 0; th <= 300; th += 1) { if (solve(th).Ts <= 60) { tmin = th; break; } }
          return {
            solve: solve, cur: cur, bare: bare,
            res: [{ l: 'Heat loss', v: cur.q, u: '', cv: 'Wm', d: 2 }, { l: 'Surface temperature', v: cur.Ts, u: '', cv: 'T', d: 1 }, { l: 'Outer film coefficient h_o', v: cur.h, u: '', cv: 'U', d: 2 }, { l: 'Bare pipe loss', v: bare.q, u: '', cv: 'Wm', d: 1 }, { l: 'Heat saved', v: (1 - cur.q / bare.q) * 100, u: '%', d: 1 }, { l: 'Insulation outer diameter', v: v.Dp + 2 * v.t, u: '', cv: 'mm', d: 0 }, { l: 'Critical radius k/h', v: rcrit, u: '', cv: 'mm', d: 1 }, { l: 'Touch-safe (\u2264 60\u00a0\u00b0C) from', s: tmin === null ? 'not reached below 300 mm' : tmin + ' mm', u: '' }, { l: 'Annual loss per 100 m', v: cur.q * 100 * 8760 / 1e6, u: 'GJ/yr', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const th0 = 10;
          const qmax = Math.max(r.solve(th0).q, r.cur.q) * 1.06;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: th0, xmax: 300, ymin: 0, ymax: qmax, ml: 74, mr: 70 });
          g.grid('Insulation thickness  (' + self.cvt(0, 'mm')[1] + ')', 'Heat loss  (' + self.cvt(0, 'Wm')[1] + ')', 6, 5, t => self.f(self.cvt(t, 'mm')[0], self.state.us ? 1 : 0), t => self.f(self.cvt(t, 'Wm')[0], 0));
          g.title('Heat loss and surface temperature vs thickness');
          const cache = [];
          for (let th = th0; th <= 300; th += 5) cache.push([th, r.solve(th)]);
          g.line(cache.map(c => [c[0], c[1].q]), C.dk, 2.8);
          const tscale = qmax / Math.max(v.Tp, 100);
          g.line(cache.map(c => [c[0], c[1].Ts * tscale]), C.acc, 2.4, [7, 4]);
          g.line([[th0, 60 * tscale], [300, 60 * tscale]], C.mut, 1.2, [3, 3]);
          g.txt('60 \u00b0C touch limit', 296, 60 * tscale + qmax * 0.03, C.mut, 'right', 10.5);
          g.dot(v.t, r.cur.q, C.dk, 5);
          g.dot(v.t, r.cur.Ts * tscale, C.acc, 5);
          g.line([[v.t, 0], [v.t, qmax]], 'rgba(29,31,32,0.18)', 1.2, [4, 4]);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          for (let T = 0; T <= v.Tp; T += Math.max(50, Math.round(v.Tp / 5 / 50) * 50)) { const py = g.Y(T * tscale); if (py >= g.y && py <= g.y + g.h) ctx.fillText(self.f(self.cvt(T, 'T')[0], 0), g.x + g.w + 10, py); }
          ctx.save(); ctx.translate(g.x + g.w + 52, g.y + g.h / 2); ctx.rotate(Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(('Surface temperature  (' + self.cvt(0, 'T')[1] + ')').toUpperCase(), 0, 0); ctx.restore();
          ctx.restore();
          g.legend([{ c: C.dk, l: 'heat loss' }, { c: C.acc, l: 'surface temp', d: [7, 4] }]);
        }
      }
    ];
  }
  /* ══ THERMOPHYSICAL DATA ══════════════════════════════════ */
  if97() {
    if (this._if) return this._if;
    const R = 0.461526;
    const n4 = [1167.0521452767, -724213.16703206, -17.073846940092, 12020.824702470, -3232555.0322333, 14.915108613530, -4823.2657361591, 405113.40542057, -0.23855557567849, 650.17534844798];
    const I1 = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29, 30, 31, 32];
    const J1 = [-2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11, -6, -29, -31, -38, -39, -40, -41];
    const N1 = [0.14632971213167, -0.84548187169114, -3.756360367204, 3.3855169168385, -0.95791963387872, 0.15772038513228, -0.016616417199501, 8.1214629983568e-4, 2.8319080123804e-4, -6.0706301565874e-4, -0.018990068218419, -0.032529748770505, -0.021841717175414, -5.283835796993e-5, -4.7184321073267e-4, -3.0001780793026e-4, 4.7661393906987e-5, -4.4141845330846e-6, -7.2694996297594e-16, -3.1679644845054e-5, -2.8270797985312e-6, -8.5205128120103e-10, -2.24252819080e-6, -6.5171222895601e-7, -1.4341729937924e-13, -4.0516996860117e-7, -1.2734301741641e-9, -1.7424871230634e-10, -6.8762131295531e-19, 1.4478307828521e-20, 2.6335781662795e-23, -1.1947622640071e-23, 1.8228094581404e-24, -9.3537087292458e-26];
    const J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3];
    const N0 = [-9.6927686500217, 10.086655968018, -0.005608791128302, 0.071452738081455, -0.40710498223928, 1.4240819171444, -4.383951131945, -0.28408632460772, 0.021268463753307];
    const I2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10, 16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24];
    const J2 = [0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4, 10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58];
    const N2 = [-0.0017731742473213, -0.017834862292358, -0.045996013696365, -0.057581259083432, -0.05032527872793, -3.3032641670203e-5, -1.8948987516315e-4, -0.0039392777243355, -0.043797295650573, -2.6674547914087e-5, 2.0481737692309e-8, 4.3870667284435e-7, -3.227767723857e-5, -0.0015033924542148, -0.040668253562649, -7.8847309559367e-10, 1.2790717852285e-8, 4.8225372718507e-7, 2.2922076337661e-6, -1.6714766451061e-11, -0.0021171472321355, -23.895741934104, -5.905956432427e-18, -1.2621808899101e-6, -0.038946842435739, 1.1256211360459e-11, -8.2311340897998, 1.9809712802088e-8, 1.0406965210174e-19, -1.0234747095929e-13, -1.0018179379511e-9, -8.0882908646985e-11, 0.10693031879409, -0.33662250574171, 8.9185845355421e-25, 3.0629316876232e-13, -4.2002467698208e-6, -5.9056029685639e-26, 3.7826947613457e-6, -1.276860893468e-15, 7.3087610595061e-29, 5.5414715350778e-17, -9.436970724121e-7];
    const psat = TK => {
      const th = TK + n4[8] / (TK - n4[9]);
      const A = th * th + n4[0] * th + n4[1], B = n4[2] * th * th + n4[3] * th + n4[4], Cc = n4[5] * th * th + n4[6] * th + n4[7];
      return Math.pow(2 * Cc / (-B + Math.sqrt(B * B - 4 * A * Cc)), 4);
    };
    const tsat = p => {
      const be = Math.pow(p, 0.25);
      const E = be * be + n4[2] * be + n4[5], F = n4[0] * be * be + n4[3] * be + n4[6], G = n4[1] * be * be + n4[4] * be + n4[7];
      const D = 2 * G / (-F - Math.sqrt(F * F - 4 * E * G));
      return (n4[9] + D - Math.sqrt(Math.pow(n4[9] + D, 2) - 4 * (n4[8] + n4[9] * D))) / 2;
    };
    const r1 = (p, TK) => {
      const pi = p / 16.53, tau = 1386 / TK;
      let g = 0, gp = 0, gt = 0;
      for (let i = 0; i < 34; i++) {
        const a = Math.pow(7.1 - pi, I1[i]), c = Math.pow(tau - 1.222, J1[i]);
        g += N1[i] * a * c;
        gp += -N1[i] * I1[i] * Math.pow(7.1 - pi, I1[i] - 1) * c;
        gt += N1[i] * a * J1[i] * Math.pow(tau - 1.222, J1[i] - 1);
      }
      const v = R * TK * pi * gp / (p * 1000);
      const h = R * TK * tau * gt;
      const s = R * (tau * gt - g);
      return { v: v, h: h, s: s, u: h - p * 1000 * v, T: TK - 273.15, p: p };
    };
    const r2 = (p, TK) => {
      const pi = p, tau = 540 / TK;
      let g0 = Math.log(pi), g0t = 0;
      for (let i = 0; i < 9; i++) { g0 += N0[i] * Math.pow(tau, J0[i]); g0t += N0[i] * J0[i] * Math.pow(tau, J0[i] - 1); }
      let gr = 0, grp = 0, grt = 0;
      for (let i = 0; i < 43; i++) {
        const a = Math.pow(pi, I2[i]), c = Math.pow(tau - 0.5, J2[i]);
        gr += N2[i] * a * c;
        grp += N2[i] * I2[i] * Math.pow(pi, I2[i] - 1) * c;
        grt += N2[i] * a * J2[i] * Math.pow(tau - 0.5, J2[i] - 1);
      }
      const v = R * TK * pi * (1 / pi + grp) / (p * 1000);
      const h = R * TK * tau * (g0t + grt);
      const s = R * (tau * (g0t + grt) - (g0 + gr));
      return { v: v, h: h, s: s, u: h - p * 1000 * v, T: TK - 273.15, p: p };
    };
    this._if = { psat: psat, tsat: tsat, r1: r1, r2: r2 };
    return this._if;
  }

