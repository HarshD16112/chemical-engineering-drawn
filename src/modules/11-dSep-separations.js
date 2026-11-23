  dSep() {
    const self = this, C = this.C;
    const S = 'Separations';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const yeq = (x, a) => a * x / (1 + (a - 1) * x);
    const ANT = {
      benzene: { n: 'Benzene', A: 6.90565, B: 1211.033, C: 220.79 },
      toluene: { n: 'Toluene', A: 6.95464, B: 1344.8, C: 219.482 },
      methanol: { n: 'Methanol', A: 8.0724, B: 1574.99, C: 238.87 },
      water: { n: 'Water', A: 8.07131, B: 1730.63, C: 233.426 },
      ethanol: { n: 'Ethanol', A: 8.20417, B: 1642.89, C: 230.3 },
      acetone: { n: 'Acetone', A: 7.11714, B: 1210.595, C: 229.664 },
      hexane: { n: 'n-Hexane', A: 6.87601, B: 1171.17, C: 224.41 },
      heptane: { n: 'n-Heptane', A: 6.89385, B: 1264.37, C: 216.64 }
    };
    const psat = (c, T) => Math.pow(10, c.A - c.B / (T + c.C)) * 0.1333224;
    const PAIRS = [['bt', 'Benzene / Toluene (near-ideal)', 'benzene', 'toluene', 0, 0], ['mw', 'Methanol / Water', 'methanol', 'water', 0.78, 0.48], ['ew', 'Ethanol / Water (azeotropic)', 'ethanol', 'water', 1.6798, 0.9227], ['aw', 'Acetone / Water', 'acetone', 'water', 2.05, 1.68], ['hh', 'n-Hexane / n-Heptane (ideal)', 'hexane', 'heptane', 0, 0]];
    return [
      {
        id: 'vle', num: 'S-01', sec: S, name: 'Vapour\u2013liquid equilibrium',
        blurb: 'The boiling diagram every distillation rests on. Ideal mixtures give a smooth lens and an x\u2013y curve that never touches the diagonal; non-ideal ones bulge, and where the curve crosses the diagonal the mixture azeotropes and ordinary distillation stops working.',
        howto: 'Left: the T\u2013x\u2013y lens \u2014 lower curve is bubble point, upper is dew point, and a horizontal tie line at any temperature reads off the liquid and vapour in equilibrium. Right: the same information as y against x. Where the x\u2013y curve touches the 45\u00b0 diagonal there is an azeotrope and no number of trays will separate past it.',
        std: 'Modified Raoult\u2019s law with van Laar activity coefficients; Antoine constants from DIPPR/NIST',
        eqs: [['y_i = \\frac{\\gamma_ix_iP_i^{sat}}{P}', 'modified Raoult’s law'], ['\\ln\\gamma_1 = A_{12}\\left(\\frac{A_{21}x_2}{A_{12}x_1 + A_{21}x_2}\\right)^2', 'van Laar activity coefficient'], ['\\log_{10}P^{sat} = A - \\frac{B}{C+T}', 'Antoine vapour pressure'], ['\\alpha_{12} = \\frac{y_1/x_1}{y_2/x_2}', 'relative volatility']],
        notes: ['Vapour phase treated as ideal gas (low pressure).', 'Bubble temperature solved by bisection at each x\u2081.', 'Set both van Laar constants to zero for an ideal solution.'],
        params: [{ k: 'pair', label: 'Binary system', type: 'select', val: 'ew', options: PAIRS.map(p => [p[0], p[1]]) }, P('P', 'System pressure', 10, 500, 5, 101.325, 'P'), P('A12', 'van Laar A\u2081\u2082', 0, 3, 0.01, 1.6798, null, '\u2014'), P('A21', 'van Laar A\u2082\u2081', 0, 3, 0.01, 0.9227, null, '\u2014'), P('z', 'Feed composition z\u2081', 0.01, 0.99, 0.01, 0.4, null, 'mol frac')],
        compute: v => {
          const pr = PAIRS.filter(p => p[0] === v.pair)[0] || PAIRS[0];
          const c1 = ANT[pr[2]], c2 = ANT[pr[3]];
          const gam = (x1, A, B) => {
            const x2 = 1 - x1;
            if (A === 0 && B === 0) return [1, 1];
            const d1 = A * x1 + B * x2;
            if (d1 <= 0) return [1, 1];
            return [Math.exp(A * Math.pow(B * x2 / d1, 2)), Math.exp(B * Math.pow(A * x1 / d1, 2))];
          };
          const bubT = x1 => {
            const fn = T => { const g = gam(x1, v.A12, v.A21); return g[0] * x1 * psat(c1, T) + g[1] * (1 - x1) * psat(c2, T) - v.P; };
            return self.bis(fn, -30, 400, 1e-6);
          };
          const yOf = x1 => { const T = bubT(x1); const g = gam(x1, v.A12, v.A21); return [g[0] * x1 * psat(c1, T) / v.P, T]; };
          const curve = [];
          for (let i = 0; i <= 120; i++) { const x = i / 120; const r = yOf(x); curve.push([x, r[0], r[1]]); }
          let az = null;
          for (let i = 1; i < curve.length; i++) { const a = curve[i - 1][1] - curve[i - 1][0], bq = curve[i][1] - curve[i][0]; if (a * bq < 0 && curve[i][0] > 0.02 && curve[i][0] < 0.98) az = curve[i][0]; }
          const zr = yOf(v.z);
          const alpha = (zr[0] / v.z) / ((1 - zr[0]) / (1 - v.z));
          const dewT = y1 => self.bis(T => { const g = gam(y1, 0, 0); return y1 * v.P / psat(c1, T) + (1 - y1) * v.P / psat(c2, T) - 1; }, -30, 400, 1e-6);
          return {
            curve: curve, c1: c1, c2: c2, az: az, pr: pr,
            res: [{ l: 'Light key', s: c1.n, u: '' }, { l: 'Heavy key', s: c2.n, u: '' }, { l: 'Bubble point of feed', v: zr[1], u: '', cv: 'T', d: 2 }, { l: 'Vapour in equilibrium y\u2081', v: zr[0], u: 'mol frac', d: 4 }, { l: 'Relative volatility \u03b1 at z', v: alpha, u: '\u2014' }, { l: 'Boiling pt. light (pure)', v: bubT(1), u: '', cv: 'T', d: 2 }, { l: 'Boiling pt. heavy (pure)', v: bubT(0), u: '', cv: 'T', d: 2 }, { l: 'Azeotrope', s: az ? 'x\u2081 = ' + az.toFixed(3) : 'none in range', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const gw = (b.w - 30) / 2;
          let tmin = 1e9, tmax = -1e9;
          r.curve.forEach(p => { if (isFinite(p[2])) { tmin = Math.min(tmin, p[2]); tmax = Math.max(tmax, p[2]); } });
          const pad = (tmax - tmin) * 0.12 + 1;
          const tt = t => self.cvt(t, 'T')[0];
          const g1 = self.mkG(ctx, { x: 0, y: 0, w: gw, h: b.h, xmin: 0, xmax: 1, ymin: tmin - pad, ymax: tmax + pad, mr: 14, ml: 60 });
          g1.grid('x\u2081 , y\u2081   mole fraction ' + r.c1.n.toLowerCase(), 'Temperature  (' + self.cvt(0, 'T')[1] + ')', 5, 5, null, t => tt(t).toFixed(0));
          g1.title('T\u2013x\u2013y at ' + self.f(self.cvt(v.P, 'P')[0], 1) + ' ' + self.cvt(v.P, 'P')[1]);
          g1.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2.4);
          g1.line(r.curve.map(p => [p[1], p[2]]), C.acc, 2.4);
          const zr = r.curve[Math.round(v.z * 120)];
          if (zr) { g1.line([[0, zr[2]], [1, zr[2]]], C.mut, 1, [4, 4]); g1.dot(v.z, zr[2], C.dk, 4.5); g1.dot(zr[1], zr[2], C.acc, 4.5); }
          g1.legend([{ c: C.dk, l: 'bubble  (liquid)' }, { c: C.acc, l: 'dew  (vapour)' }]);
          const g2 = self.mkG(ctx, { x: gw + 30, y: 0, w: gw, h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 54, mr: 14 });
          g2.grid('x\u2081   liquid mole fraction', 'y\u2081   vapour mole fraction', 5, 5);
          g2.title('x\u2013y equilibrium');
          g2.line([[0, 0], [1, 1]], C.mut, 1.2);
          g2.line(r.curve.map(p => [p[0], p[1]]), C.dk, 2.6);
          if (r.az) { g2.dot(r.az, r.az, C.acc, 5.5); g2.txt('azeotrope  x = ' + r.az.toFixed(3), r.az, r.az - 0.055, C.mid, 'center', 11.5); }
          g2.dot(v.z, r.curve[Math.round(v.z * 120)][1], C.acc, 4.5);
        }
      },
      {
        id: 'mccabe',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const N = Math.max(1, Math.round(r.N || 1)), fd = Math.max(1, Math.min(N, Math.round(r.feed || 1)));
  const DF = self.cl01((v.zF - v.xB) / (v.xD - v.xB)), VF = (v.R + 1) * DF, load = self.cl01(VF / 4);
  s.title('Distillation Column \u00b7 Stages & Duties', N + ' stages \u00b7 feed at ' + fd + ' \u00b7 V/F ' + self.f(VF, 2));
  const X = s.x + 132, colW = Math.max(44, Math.min(84, s.w * 0.12));
  const top = s.y + 46, bot = s.y + s.h - 60;
  const rx = Math.max(X + colW + 46, s.x + s.w - 150);
  const col = s.column(X, top, colW, bot - top, { n: N, feed: fd });
  const cc = s.temp(0.5 - 0.44 * load), hc = s.temp(0.5 + 0.46 * load);
  s.unit(rx + 8, top - 36, 76, 26, 'COND', { col: cc, fill: s.temp(0.5 - 0.44 * load, 0.18), tcol: cc, size: 10.5, tag: 'Q\u2096 \u221d V = ' + self.f(VF, 2) + '\u00d7F' });
  s.hvessel(rx, top + 12, 92, 30, { stroke: C.ink, lw: 1.4, fill: C.soft });
  s.T('reflux drum', rx + 46, top + 54, { align: 'center', size: 10, col: C.mut });
  s.unit(rx + 8, bot + 8, 76, 26, 'REBOIL', { col: hc, fill: s.temp(0.5 + 0.46 * load, 0.18), tcol: hc, size: 10.5, tag: 'Q\u1d63 \u221d V = ' + self.f(VF, 2) + '\u00d7F' });
  s.L([[col.cx, top], [col.cx, top - 23], [rx + 8, top - 23]], { col: C.ink, lw: 1.4, arrow: true });
  s.L([[rx + 46, top - 10], [rx + 46, top + 12]], { col: cc, lw: 1.5, arrow: true });
  s.L([[rx + 92, top + 27], [s.x + s.w - 4, top + 27]], { col: C.acc, lw: 1.7, arrow: true });
  s.T('D \u00b7 x_D ' + self.f(v.xD, 3), rx + 94, top + 15, { size: 10.5, col: C.acc });
  s.L([[rx + 22, top + 42], [rx + 22, top + 66], [X + colW, top + 66]], { col: C.acc, lw: 1.5, arrow: true });
  s.plate('L = R\u00b7D \u00b7 R ' + self.f(v.R, 2), (X + colW + rx + 22) / 2, top + 66, { col: C.acc, size: 10 });
  s.L([[col.cx, bot], [col.cx, bot + 21], [rx + 8, bot + 21]], { col: C.ink, lw: 1.4, arrow: true });
  s.L([[rx + 46, bot + 8], [rx + 46, bot - 22], [X + colW, bot - 22]], { col: hc, lw: 1.6, arrow: true });
  s.plate('boil-up V', (X + colW + rx + 46) / 2, bot - 22, { col: hc, size: 10 });
  s.L([[rx + 84, bot + 21], [s.x + s.w - 4, bot + 21]], { col: C.mid, lw: 1.7, arrow: true });
  s.T('B \u00b7 x_B ' + self.f(v.xB, 3), rx + 86, bot + 10, { size: 10.5, col: C.mid });
  const fy = col.yOf(fd);
  s.L([[X - 62, fy], [X, fy]], { col: C.dk, lw: 1.9, arrow: true });
  s.T('F \u00b7 z_F ' + self.f(v.zF, 2), X - 62, fy - 11, { size: 10.5, col: C.dk });
  s.T('q = ' + self.f(v.q, 2), X - 62, fy + 12, { size: 10, col: C.mut });
  s.dim(X - 26, top, X - 26, fy, '', { col: C.mid });
  s.plate('rectifying', X - 26, (top + fy) / 2, { col: C.mid, lab: C.mid, size: 10, align: 'center' });
  s.dim(X - 26, fy, X - 26, bot, '', { col: C.mid });
  s.plate('stripping', X - 26, (fy + bot) / 2, { col: C.mid, lab: C.mid, size: 10, align: 'center' });
  s.constr(X - 28, top, X + colW + 24, top, 'Top Tangent Line');
  s.constr(X - 28, bot, X + colW + 24, bot, 'Bottom Tangent Line');
},
        schemNote: 'Tray count, feed position and duties are live. Cut the reflux and the staircase \u2014 and this tray stack \u2014 grows; the condenser cools toward blue and the reboiler heats toward red as the boil-up V/F climbs.',
        num: 'S-02', sec: S, name: 'McCabe\u2013Thiele distillation',
        blurb: 'The staircase that sizes a distillation column. Two operating lines and an equilibrium curve; step between them and each tread is one ideal stage. Everything a column designer argues about \u2014 reflux, feed quality, product purity \u2014 shows up as a change in the geometry.',
        howto: 'Step from the distillate composition down to the bottoms: each horizontal-plus-vertical pair is one theoretical stage, and the step that straddles the q-line intersection is the feed stage. Cut the reflux and the operating lines swing up toward the curve \u2014 the steps get shallow and the count explodes. At minimum reflux the lines touch the curve and you need infinite stages.',
        std: 'McCabe & Thiele (1925); constant molal overflow. Ind. Eng. Chem. 17, 605',
        eqs: [['y = \\frac{R}{R+1}x + \\frac{x_D}{R+1}', 'rectifying operating line'], ['y = \\frac{\\bar L}{\\bar V}x - \\frac{Bx_B}{\\bar V}', 'stripping operating line'], ['y = \\frac{q}{q-1}x - \\frac{z_F}{q-1}', 'q-line through the feed'], ['N_{min} = \\frac{\\ln\\left[\\frac{x_D}{1-x_D}\\cdot\\frac{1-x_B}{x_B}\\right]}{\\ln\\alpha}', 'Fenske minimum stages']],
        notes: ['Constant molal overflow; equal molar latent heats.', 'Total condenser and partial reboiler (reboiler counts as one stage).', 'Murphree efficiency applied uniformly to every tray.'],
        params: [P('alpha', 'Relative volatility \u03b1', 1.05, 6, 0.05, 2.4, null, '\u2014'), P('zF', 'Feed composition z_F', 0.05, 0.95, 0.01, 0.45, null, 'mol frac'), P('xD', 'Distillate x_D', 0.5, 0.999, 0.005, 0.95, null, 'mol frac'), P('xB', 'Bottoms x_B', 0.001, 0.45, 0.005, 0.05, null, 'mol frac'), P('R', 'Reflux ratio R', 0.1, 12, 0.05, 1.8, null, '\u2014'), P('q', 'Feed quality q', -0.5, 1.8, 0.05, 1, null, '\u2014'), P('eff', 'Murphree efficiency', 0.3, 1, 0.01, 1, null, '\u2014')],
        compute: v => {
          const a = v.alpha, eqy = x => yeq(x, a), eqx = y => y / (a - (a - 1) * y);
          const rol = x => v.R / (v.R + 1) * x + v.xD / (v.R + 1);
          let xi, yi;
          if (Math.abs(v.q - 1) < 1e-6) { xi = v.zF; yi = rol(xi); }
          else { xi = (v.zF / (1 - v.q) + v.xD / (v.R + 1)) / (v.q / (v.q - 1) + v.R / (v.R + 1)); xi = (v.xD / (v.R + 1) + v.zF / (v.q - 1)) / (v.q / (v.q - 1) - v.R / (v.R + 1)); yi = rol(xi); }
          const sol = x => (yi - v.xB) / (xi - v.xB) * (x - v.xB) + v.xB;
          let xq = v.zF, yq;
          if (Math.abs(v.q - 1) < 1e-6) { xq = v.zF; yq = eqy(v.zF); } else { xq = self.bis(x => (v.q / (v.q - 1) * x - v.zF / (v.q - 1)) - eqy(x), 0.0001, 0.9999, 1e-9); yq = eqy(xq); }
          const Rmin = isFinite(xq) ? (v.xD - yq) / (yq - xq) : NaN;
          /* Step from the distillate down. If a tread ever fails to advance
             the liquid composition the operating line has met the curve —
             the column is pinched and the stage count is infinite, not 200. */
          const steps = [];
          let x = v.xD, y = v.xD, n = 0, feed = 0, pinch = false;
          for (let i = 0; i < 120; i++) {
            const xs = eqx(y);
            const xn = x - v.eff * (x - xs);
            if (!(xn < x - 1e-9)) { pinch = true; break; }
            steps.push([[x, y], [xn, y]]);
            n++;
            if (xn <= v.xB) { x = xn; break; }
            const yn = xn > xi ? rol(xn) : sol(xn);
            if (xn > xi) feed = n + 1;
            steps.push([[xn, y], [xn, yn]]);
            x = xn; y = yn;
            if (i === 119) pinch = true;
          }
          if (pinch) { n = Infinity; feed = Infinity; }
          const opRat = isFinite(Rmin) && Rmin > 0 ? v.R / Rmin : NaN;
          const Nmin = Math.log((v.xD / (1 - v.xD)) * ((1 - v.xB) / v.xB)) / Math.log(a);
          return {
            steps: steps, eqy: eqy, rol: rol, sol: sol, xi: xi, yi: yi, N: n, feed: feed, Rmin: Rmin, pinch: pinch,
            res: [{ l: 'Theoretical stages (incl. reboiler)', v: n, u: '\u2014', d: 0 }, { l: 'Feed stage from top', v: feed, u: '\u2014', d: 0 }, { l: 'Minimum reflux R_min', v: Rmin, u: '\u2014' }, { l: 'R / R_min', v: opRat, u: '\u2014' }, { l: 'Minimum stages (Fenske)', v: Nmin, u: '\u2014' }, { l: 'Rectifying slope L/V', v: v.R / (v.R + 1), u: '\u2014' }, { l: 'Stripping slope', v: (yi - v.xB) / (xi - v.xB), u: '\u2014' }, { l: 'Distillate / feed  D/F', v: (v.zF - v.xB) / (v.xD - v.xB), u: '\u2014' }]
          };
        },
        sq: 1.06,
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x + Math.max(0, (b.w - Math.min(b.w, b.h * 1.06)) / 2), y: b.y, w: Math.min(b.w, b.h * 1.06), h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
          g.grid('x   liquid mole fraction (light key)', 'y   vapour mole fraction', 10, 10);
          g.title('McCabe\u2013Thiele construction');
          g.line([[0, 0], [1, 1]], C.mut, 1.2);
          g.fn(x => r.eqy(x), C.dk, 2.6);
          g.line([[v.xD, v.xD], [r.xi, r.yi]], C.acc, 2, [0]);
          g.line([[r.xi, r.yi], [v.xB, v.xB]], C.mid, 2);
          g.line([[v.zF, v.zF], [r.xi, r.yi]], C.lt, 1.6, [6, 4]);
          g.clip(() => {
            ctx.strokeStyle = 'rgba(29,31,32,0.75)'; ctx.lineWidth = 1.3; ctx.beginPath();
            r.steps.forEach(s => { ctx.moveTo(g.X(s[0][0]), g.Y(s[0][1])); ctx.lineTo(g.X(s[1][0]), g.Y(s[1][1])); });
            ctx.stroke();
          });
          [[v.xD, 'x_D'], [v.zF, 'z_F'], [v.xB, 'x_B']].forEach(p => {
            g.line([[p[0], 0], [p[0], 0.028]], C.ink, 1.4);
            g.txt(p[1], p[0], -0.045, C.ink, 'center', 11.5);
          });
          g.dot(r.xi, r.yi, C.acc, 4.5);
          g.legend([{ c: C.dk, l: 'equilibrium' }, { c: C.acc, l: 'rectifying' }, { c: C.mid, l: 'stripping' }, { c: C.lt, l: 'q-line', d: [6, 4] }]);
          const bx = g.x + g.w - 138, by = g.y + g.h - 52;
          g.panel(bx, by, 126, 40);
          g.ptxt(r.pinch ? 'below R_min' : r.N + ' ideal stages', bx + 10, by + 14, r.pinch ? C.warn : C.ink, 'left', 13);
          g.ptxt(r.pinch ? 'staircase pinches' : 'feed at stage ' + r.feed, bx + 10, by + 28, C.mid, 'left', 11.5);
        }
      },
      {
        id: 'stripping',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const S = self.rget(r, 'stripping factor') || v.m * v.V / Math.max(v.L, 1e-9);
  const Nid = self.rget(r, 'ideal stages required');
  const N = Math.max(1, Math.min(40, Math.round(isFinite(Nid) && Nid > 0 ? Math.ceil(Nid) : 8)));
  const ok = isFinite(Nid) && Nid > 0 && S > 0.2;
  const load = self.cl01(v.V / 250);
  s.title('Stripping column', ok ? N + ' stages \u00b7 S = ' + self.f(S, 2) : 'infeasible duty \u2014 S = ' + self.f(S, 2));
  const colW = Math.max(52, Math.min(96, s.w * 0.14)), X = s.cx - colW / 2;
  const top = s.y + 42, bot = s.y + s.h - 46;
  const col = s.column(X, top, colW, bot - top, { n: N, max: 20 });
  const hc = s.temp(0.52 + 0.4 * load);
  s.L([[X - 108, top + 22], [X, top + 22]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('rich liquid  L ' + self.f(v.L, 0), X - 108, top + 10, { size: 10.5, col: C.acc });
  s.T('x_in ' + self.f(v.xin, 4), X - 108, top + 33, { size: 10, col: C.mut });
  s.L([[col.cx, top], [col.cx, top - 24]], { col: C.dk, lw: 1.9, arrow: true });
  s.T('loaded gas  y_out', col.cx + 8, top - 19, { size: 10.5, col: C.dk });
  s.L([[col.cx, bot], [col.cx, bot + 30]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('stripped liquid  x_out ' + self.f(v.xout, 4), col.cx + 10, bot + 26, { size: 10.5, col: C.acc });
  s.L([[X - 100, bot - 14], [X, bot - 14]], { col: hc, lw: 2.2, arrow: true });
  s.T('steam / gas  V ' + self.f(v.V, 0), X - 100, bot - 25, { size: 10.5, col: hc });
  s.T('y_in ' + self.f(v.yin, 4), X - 100, bot - 3, { size: 10, col: C.mut });
  s.badge(s.x, s.y + 4, 'Stripping factor S', self.f(S, 2) + (S < 1 ? '  \u2014 stalls' : ''), S < 1 ? 1 : 0.5 - 0.34 * self.cl01((S - 1) / 4), { w: 132 });
  s.badge(s.x + s.w - 132, s.y + 4, 'Steam load V', self.f(v.V, 0) + ' kmol/h', 0.52 + 0.4 * load, { w: 132 });
  if (!ok) { s.T('target below the entering-gas equilibrium \u2014 no stage count reaches it', s.cx, bot + 40, { align: 'center', size: 11, col: C.warn, bold: true }); }
},
        schemNote: 'Stage count follows Kremser; the steam line warms toward red as V rises. When S falls below 1 the column is marked infeasible \u2014 no amount of packing or trays will reach the target.',
        num: 'S-03', sec: S, name: 'Stripping column',
        blurb: 'Steam or inert gas pulling a volatile solute out of a liquid. The same staircase as distillation, but the operating line now sits below the equilibrium line and the stripping factor S = mV/L decides whether the job is easy or hopeless.',
        howto: 'The staircase is stepped from the rich liquid at the top to the stripped liquid at the bottom. With S below 1 the two lines converge and the stage count runs away \u2014 you are trying to strip with too little gas. Above about S = 1.4 each extra stage buys progressively less, which is why practical strippers sit in the 1.2\u20132.0 band.',
        std: 'Kremser (1930); Souders\u2013Brown. Treybal, Mass-Transfer Operations, Ch. 8',
        eqs: [['S = \\frac{mV}{L}', 'stripping factor'], ['N = \\frac{\\ln\\left[\\frac{x_{in}-y_{in}/m}{x_{out}-y_{in}/m}\\left(1-\\frac{1}{S}\\right)+\\frac{1}{S}\\right]}{\\ln S}', 'Kremser equation'], ['y = \\frac{L}{V}(x - x_{out}) + y_{in}', 'operating line, lean gas entering the base']],
        notes: ['Dilute system: L and V constant through the column.', 'Linear equilibrium y* = mx.', 'Ideal stages \u2014 divide by overall efficiency for real trays.'],
        params: [P('m', 'Equilibrium slope m = y*/x', 0.2, 8, 0.05, 2, null, '\u2014'), P('L', 'Liquid rate L', 10, 500, 5, 100, null, 'kmol/h'), P('V', 'Gas / steam rate V', 5, 400, 5, 70, null, 'kmol/h'), P('xin', 'Inlet liquid x_in', 0.005, 0.2, 0.001, 0.05, null, 'mol frac'), P('xout', 'Target outlet x_out', 0.0002, 0.05, 0.0002, 0.005, null, 'mol frac'), P('yin', 'Inlet gas y_in', 0, 0.05, 0.0005, 0, null, 'mol frac')],
        compute: v => {
          const Sf = v.m * v.V / v.L;
          const xeq = v.yin / v.m;                       /* liquid in equilibrium with the entering gas */
          const reachable0 = v.xout > xeq + 1e-12 && v.xin > v.xout;
          let N;
          if (!reachable0) N = Infinity;
          else if (Math.abs(Sf - 1) < 1e-6) N = (v.xin - v.xout) / (v.xout - xeq);
          else { const arg = ((v.xin - xeq) / (v.xout - xeq)) * (1 - 1 / Sf) + 1 / Sf; N = arg > 0 ? Math.log(arg) / Math.log(Sf) : Infinity; }
          if (!(N > 0)) N = Infinity;                    /* never report a negative stage count */
          const yout = v.yin + v.L / v.V * (v.xin - v.xout);
          const reachable = reachable0 && yout < v.m * v.xin;   /* the operating line must stay below equilibrium */
          const Vmin = v.m * v.xin > v.yin ? v.L * (v.xin - v.xout) / (v.m * v.xin - v.yin) : Infinity;
          /* Staircase from the top operating point (x_in, y_out): horizontally
             LEFT to the equilibrium line, then DOWN to the operating line.
             If the duty is unreachable the balance puts y_out above equilibrium,
             so start at the pinch instead of drawing nothing at all. */
          const steps = [];
          const slope = v.L / v.V, opY = xx => v.yin + slope * (xx - v.xout);
          let xStart = v.xin;
          if (opY(v.xin) >= v.m * v.xin) {                /* infeasible duty \u2014 start at the crossing so the pinch is visible */
            const xc = Math.abs(v.m - slope) > 1e-12 ? (v.yin - slope * v.xout) / (v.m - slope) : v.xout;
            xStart = Math.max(v.xout, Math.min(v.xin, xc * 0.999));
          }
          let x = xStart, y = opY(xStart), n = 0;
          for (let i = 0; i < 60; i++) {
            const xe = y / v.m;
            if (!(xe < x - 1e-14)) break;                /* pinched against equilibrium */
            steps.push([[x, y], [xe, y]]);
            n++;
            if (xe <= v.xout) break;
            const yn = v.yin + v.L / v.V * (xe - v.xout);
            steps.push([[xe, y], [xe, Math.max(yn, v.yin)]]);
            x = xe; y = Math.max(yn, v.yin);
          }
          return {
            Sf: Sf, N: N, yout: yout, steps: steps, nstep: n, reachable: reachable,
            res: [{ l: 'Stripping factor S', v: Sf, u: '\u2014' }, { l: 'Ideal stages required', v: N, u: '\u2014', d: 2 }, { l: 'Round up to', v: Math.ceil(N), u: 'stages', d: 0 }, { l: 'Stages on the diagram', v: n, u: '\u2014', d: 0 }, { l: 'Outlet gas y_out', v: yout, u: 'mol frac', d: 5 }, { l: 'Solute removed', v: (1 - v.xout / v.xin) * 100, u: '%', d: 2 }, { l: 'Minimum gas rate V_min', v: Vmin, u: 'kmol/h' }, { l: 'V / V_min', v: v.V / Vmin, u: '\u2014' }, { l: 'L/V ratio', v: v.L / v.V, u: '\u2014' }, { l: 'Feasibility', s: reachable ? 'target above the entering-gas equilibrium \u2014 reachable' : 'x_out is at or below y_in/m \u2014 unreachable with this gas', u: '' }]
          };
        },
        sq: 1.1,
        draw: (ctx, b, v, r) => {
          const xm = v.xin * 1.15, ym = Math.max(r.yout, v.m * v.xin) * 1.12;
          const g = self.mkG(ctx, { x: b.x + Math.max(0, (b.w - Math.min(b.w, b.h * 1.1)) / 2), y: b.y, w: Math.min(b.w, b.h * 1.1), h: b.h, xmin: 0, xmax: xm, ymin: 0, ymax: ym, ml: 74 });
          g.grid('x   solute in liquid  (mol frac)', 'y   solute in gas  (mol frac)', 5, 5);
          g.title('Stripping \u2014 ' + (r.reachable ? r.nstep + ' ideal stages stepped' : 'target unreachable with this gas rate'));
          g.fn(x => v.m * x, C.dk, 2.4);
          g.line([[v.xout, v.yin], [v.xin, r.yout]], C.acc, 2.2);
          g.clip(() => { ctx.strokeStyle = 'rgba(29,31,32,0.75)'; ctx.lineWidth = 1.3; ctx.beginPath(); r.steps.forEach(s => { ctx.moveTo(g.X(s[0][0]), g.Y(s[0][1])); ctx.lineTo(g.X(s[1][0]), g.Y(s[1][1])); }); ctx.stroke(); });
          g.dot(v.xin, r.yout, C.acc, 4.5); g.dot(v.xout, v.yin, C.acc, 4.5);
          g.txt('rich in', v.xin, r.yout + ym * 0.035, C.mid, 'right', 11);
          g.txt('stripped out', v.xout, v.yin + ym * 0.035, C.mid, 'left', 11);
          g.legend([{ c: C.dk, l: 'equilibrium  y* = mx' }, { c: C.acc, l: 'operating line' }]);
          g.ptxt('S = ' + r.Sf.toFixed(2) + (isFinite(r.N) ? '   \u2192   N = ' + r.N.toFixed(2) + ' ideal stages' : '   \u2192   N \u2192 \u221e  (pinched)'), g.x + 12, g.y + g.h - 16, r.reachable ? C.ink : C.warn, 'left', 12.5);
        }
      },
      {
        id: 'absorption',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const A = self.rget(r, 'absorption factor') || v.L / Math.max(v.m * v.V, 1e-9);
  const Nid = self.rget(r, 'ideal stages required');
  const N = Math.max(1, Math.min(40, Math.round(isFinite(Nid) && Nid > 0 ? Math.ceil(Nid) : 8)));
  const ok = isFinite(Nid) && Nid > 0 && A > 0.25;
  s.title('Absorber', ok ? N + ' stages \u00b7 A = ' + self.f(A, 2) : 'infeasible duty \u2014 A = ' + self.f(A, 2));
  const colW = Math.max(52, Math.min(96, s.w * 0.14)), X = s.cx - colW / 2;
  const top = s.y + 42, bot = s.y + s.h - 46;
  const col = s.column(X, top, colW, bot - top, { n: N, max: 20 });
  s.L([[X - 104, top + 14], [X, top + 14]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('lean solvent  L ' + self.f(v.L, 0), X - 104, top + 3, { size: 10.5, col: C.acc });
  s.T('x_in ' + self.f(v.xin, 4), X - 104, top + 25, { size: 10, col: C.mut });
  s.L([[X - 104, bot - 14], [X, bot - 14]], { col: C.dk, lw: 2.1, arrow: true });
  s.T('feed gas  V ' + self.f(v.V, 0), X - 104, bot - 25, { size: 10.5, col: C.dk });
  s.T('y_in ' + self.f(v.yin, 4), X - 104, bot - 3, { size: 10, col: C.mut });
  s.L([[col.cx, top], [col.cx, top - 24]], { col: C.mid, lw: 1.9, arrow: true });
  s.T('treated gas  y_out ' + self.f(v.yout, 4), col.cx + 8, top - 19, { size: 10.5, col: C.mid });
  s.L([[col.cx, bot], [col.cx, bot + 26]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('rich solvent  x_out', col.cx + 8, bot + 20, { size: 10.5, col: C.acc });
  s.badge(s.x, s.y + 4, 'Absorption factor A', self.f(A, 2) + (A < 1 ? '  \u2014 lean on solvent' : ''), A < 1 ? 0.92 : 0.5 - 0.34 * self.cl01((A - 1) / 3), { w: 150 });
  s.badge(s.x + s.w - 132, s.y + 4, 'Operating L/V', self.f(v.L / Math.max(v.V, 1e-9), 2), null, { w: 132 });
  if (!ok) s.T('y_out is at or below m\u00b7x_in \u2014 unreachable with this solvent', s.cx, bot + 40, { align: 'center', size: 11, col: C.warn, bold: true });
},
        schemNote: 'The stage stack is the Kremser answer rounded up. Raise the solvent rate and A rises, the stack shortens; let A fall under 1 and the absorber is flagged \u2014 the lean end pinches whatever the height.',
        num: 'S-04', sec: S, name: 'Gas absorption',
        blurb: 'The mirror image of stripping: a lean solvent washing a solute out of a gas. The absorption factor A = L/mV is the single number that says whether the column will work, and the L/V you pick sets how close to the equilibrium pinch you dare operate.',
        howto: 'The operating line now sits above the equilibrium line and the staircase climbs from the lean end. Reduce the solvent rate and the line rotates down until it touches equilibrium at the rich end \u2014 that pinch is the minimum solvent rate, and real columns run at 1.2 to 1.5 times it.',
        std: 'Kremser\u2013Souders\u2013Brown; Treybal Ch. 8, Perry\u2019s 8th ed. \u00a714',
        eqs: [['A = \\frac{L}{mV}', 'absorption factor'], ['N = \\frac{\\ln\\left[\\frac{y_{in}-mx_{in}}{y_{out}-mx_{in}}\\left(1-\\frac{1}{A}\\right)+\\frac{1}{A}\\right]}{\\ln A}', 'Kremser equation'], ['\\left(\\frac{L}{V}\\right)_{min} = \\frac{y_{in}-y_{out}}{y_{in}/m - x_{in}}', 'operating line touching equilibrium']],
        notes: ['Dilute solute; mole-ratio effects neglected.', 'Isothermal absorption \u2014 heat of solution ignored.', 'For A \u2248 1 the Kremser expression reduces to N = (y_in\u2212y_out)/(y_out\u2212mx_in).'],
        params: [P('m', 'Equilibrium slope m = y*/x', 0.2, 10, 0.05, 1.5, null, '\u2014'), P('L', 'Solvent rate L', 10, 800, 5, 150, null, 'kmol/h'), P('V', 'Gas rate V', 10, 500, 5, 100, null, 'kmol/h'), P('yin', 'Inlet gas y_in', 0.005, 0.2, 0.001, 0.06, null, 'mol frac'), P('yout', 'Target outlet y_out', 0.0002, 0.05, 0.0002, 0.004, null, 'mol frac'), P('xin', 'Lean solvent x_in', 0, 0.03, 0.0002, 0, null, 'mol frac')],
        compute: v => {
          const A = v.L / (v.m * v.V);
          const yeqin = v.m * v.xin;                     /* gas in equilibrium with the lean solvent */
          const reachable0 = v.yout > yeqin + 1e-12 && v.yin > v.yout;
          let N;
          if (!reachable0) N = Infinity;
          else if (Math.abs(A - 1) < 1e-6) N = (v.yin - v.yout) / (v.yout - yeqin);
          else { const arg = ((v.yin - yeqin) / (v.yout - yeqin)) * (1 - 1 / A) + 1 / A; N = arg > 0 ? Math.log(arg) / Math.log(A) : Infinity; }
          if (!(N > 0)) N = Infinity;
          const xout = v.xin + v.V / v.L * (v.yin - v.yout);
          const reachable = reachable0 && v.yin > v.m * xout;
          const LVmin = v.yin / v.m > v.xin ? (v.yin - v.yout) / (v.yin / v.m - v.xin) : Infinity;
          /* Staircase from the lean end (x_in, y_out): horizontally RIGHT to the
             equilibrium line, then UP to the operating line, until y reaches y_in.
             If y_out sits below the lean-solvent equilibrium the spec is
             unreachable — start at the pinch so the runaway is visible. */
          const steps = [];
          const slopeA = v.L / v.V, opYa = xx => v.yout + slopeA * (xx - v.xin);
          let xStartA = v.xin;
          if (opYa(v.xin) <= v.m * v.xin) {               /* infeasible \u2014 start at the crossing */
            const xc = Math.abs(v.m - slopeA) > 1e-12 ? (v.yout - slopeA * v.xin) / (v.m - slopeA) : v.xin;
            xStartA = Math.min(xout, Math.max(v.xin, xc * 1.001));
          }
          let x = xStartA, y = opYa(xStartA), n = 0;
          for (let i = 0; i < 60; i++) {
            const xe = y / v.m;
            if (!(xe > x + 1e-14)) break;                /* pinched against equilibrium */
            steps.push([[x, y], [xe, y]]);
            n++;
            const yn = v.yout + v.L / v.V * (xe - v.xin);
            if (yn >= v.yin) { steps.push([[xe, y], [xe, v.yin]]); break; }
            steps.push([[xe, y], [xe, yn]]);
            x = xe; y = yn;
          }
          return {
            A: A, N: N, xout: xout, steps: steps, nstep: n, reachable: reachable,
            res: [{ l: 'Absorption factor A', v: A, u: '\u2014' }, { l: 'Ideal stages required', v: N, u: '\u2014', d: 2 }, { l: 'Round up to', v: Math.ceil(N), u: 'stages', d: 0 }, { l: 'Stages on the diagram', v: n, u: '\u2014', d: 0 }, { l: 'Rich solvent x_out', v: xout, u: 'mol frac', d: 5 }, { l: 'Solute recovery', v: (1 - v.yout / v.yin) * 100, u: '%', d: 2 }, { l: 'Operating L/V', v: v.L / v.V, u: '\u2014' }, { l: 'Minimum L/V', v: LVmin, u: '\u2014' }, { l: '(L/V)/(L/V)_min', v: (v.L / v.V) / LVmin, u: '\u2014' }, { l: 'Feasibility', s: reachable ? 'target above the lean-solvent equilibrium \u2014 reachable' : 'y_out is at or below m\u00b7x_in \u2014 unreachable with this solvent', u: '' }]
          };
        },
        sq: 1.1,
        draw: (ctx, b, v, r) => {
          const xm = Math.max(r.xout, v.yin / v.m) * 1.15, ym = v.yin * 1.15;
          const g = self.mkG(ctx, { x: b.x + Math.max(0, (b.w - Math.min(b.w, b.h * 1.1)) / 2), y: b.y, w: Math.min(b.w, b.h * 1.1), h: b.h, xmin: 0, xmax: xm, ymin: 0, ymax: ym, ml: 74 });
          g.grid('x   solute in liquid  (mol frac)', 'y   solute in gas  (mol frac)', 5, 5);
          g.title('Absorption \u2014 ' + (r.reachable ? r.nstep + ' ideal stages stepped' : 'target unreachable with this solvent'));
          g.fn(x => v.m * x, C.dk, 2.4);
          g.line([[v.xin, v.yout], [r.xout, v.yin]], C.acc, 2.2);
          const xpinch = v.yin / v.m;
          g.line([[v.xin, v.yout], [xpinch, v.yin]], C.lt, 1.4, [6, 4]);
          g.clip(() => { ctx.strokeStyle = 'rgba(29,31,32,0.75)'; ctx.lineWidth = 1.3; ctx.beginPath(); r.steps.forEach(s => { ctx.moveTo(g.X(s[0][0]), g.Y(s[0][1])); ctx.lineTo(g.X(s[1][0]), g.Y(s[1][1])); }); ctx.stroke(); });
          g.dot(r.xout, v.yin, C.acc, 4.5); g.dot(v.xin, v.yout, C.acc, 4.5);
          g.legend([{ c: C.dk, l: 'equilibrium  y* = mx' }, { c: C.acc, l: 'operating line' }, { c: C.lt, l: 'minimum solvent', d: [6, 4] }]);
          g.ptxt('A = ' + r.A.toFixed(2) + (isFinite(r.N) ? '   \u2192   N = ' + r.N.toFixed(2) + ' ideal stages' : '   \u2192   N \u2192 \u221e  (pinched)'), g.x + 12, g.y + g.h - 16, r.reachable ? C.ink : C.warn, 'left', 12.5);
        }
      },
      {
        id: 'flash',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const p = self.cl01(self.rget(r, 'vapour fraction') || 0);
  const Tf = self.cl01((v.T - 20) / 180);
  s.title('Flash drum', 'V/F ' + self.f(p, 3) + ' \u00b7 ' + self.f(self.cvt(v.T, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1] + ' \u00b7 ' + self.f(self.cvt(v.P, 'P')[0], 0) + ' ' + self.cvt(0, 'P')[1]);
  const W = Math.max(90, Math.min(150, s.w * 0.2)), X = s.cx - W / 2;
  const top = s.y + 34, H = s.h - 76;
  const pth = s.vessel(X, top, W, H, { stroke: s.temp(Tf), lw: 1.8, fill: s.temp(Tf, 0.08) });
  s.liquid(pth, X, top, W, H, 0.08 + 0.62 * (1 - p), C.soft3);
  s.L([[X + 7, top + H * 0.2], [X + W - 7, top + H * 0.2]], { col: C.mut, lw: 1, dash: [3, 3] });
  s.T('demister', X + W - 10, top + H * 0.2 - 9, { size: 9.5, col: C.mut, align: 'right' });
  s.L([[s.x + 10, s.cy], [X - 46, s.cy]], { col: C.dk, lw: 2, arrow: false });
  s.valveSym(X - 32, s.cy, 9, { col: C.acc, fill: C.soft });
  s.L([[X - 22, s.cy], [X, s.cy]], { col: s.temp(Tf), lw: 2, arrow: true });
  s.T('feed', s.x + 10, s.cy - 12, { size: 10.5, col: C.dk });
  s.T('let-down', X - 32, s.cy + 22, { size: 9.5, col: C.mut, align: 'center' });
  s.L([[s.cx, top], [s.cx, top - 22], [s.x + s.w - 30, top - 22]], { col: s.temp(0.5 + 0.4 * p), lw: 2, arrow: true });
  s.T('vapour  ' + self.f(p * 100, 1) + '%', s.x + s.w - 30, top - 33, { size: 10.5, col: s.temp(0.5 + 0.4 * p), align: 'right' });
  s.L([[s.cx, top + H], [s.cx, top + H + 22], [s.x + s.w - 30, top + H + 22]], { col: C.acc, lw: 2, arrow: true });
  s.T('liquid  ' + self.f((1 - p) * 100, 1) + '%', s.x + s.w - 30, top + H + 33, { size: 10.5, col: C.acc, align: 'right' });
  const bh = H * 0.8, bx = X - 52;
  s.R(bx, top + H * 0.1, 16, bh, { stroke: C.mut, lw: 1 });
  s.R(bx + 1, top + H * 0.1 + bh * (1 - p), 14, bh * p, { stroke: null, fill: s.temp(0.5 + 0.4 * p, 0.55) });
  s.T('V', bx + 8, top + H * 0.1 - 9, { size: 10, col: C.mut, align: 'center' });
  s.T('L', bx + 8, top + H * 0.9 + 11, { size: 10, col: C.mut, align: 'center' });
  if (p <= 0.0005) s.plate('all liquid \u2014 below the bubble point', s.cx, top + H + 44, { col: C.warn, size: 11 });
  else if (p >= 0.9995) s.plate('all vapour \u2014 above the dew point', s.cx, top + H + 44, { col: C.warn, size: 11 });
},
        schemNote: 'Vessel tint tracks the flash temperature and the level tracks the liquid fraction. Push past the dew point and the drum empties; drop below the bubble point and it fills \u2014 both are called out on the sketch.',
        num: 'S-05', sec: S, name: 'Isothermal flash \u2014 Rachford\u2013Rice',
        blurb: 'A multicomponent feed dropped across a valve into a drum. Solving one nonlinear equation in the vapour fraction gives the split, and sweeping temperature traces the whole flash curve between bubble and dew point.',
        howto: 'The curve is vapour fraction against temperature at fixed pressure; the marker is your operating point. Below the bubble point the drum runs liquid full, above the dew point everything is vapour, and the useful design window is the steep section between. The table underneath gives the phase compositions and K-values at the marked condition.',
        std: 'Rachford & Rice (1952), Trans. AIME 195; K-values from Raoult\u2019s law with Antoine vapour pressures',
        eqs: [['\\sum_i\\frac{z_i(K_i-1)}{1+\\beta(K_i-1)} = 0', 'Rachford–Rice objective in vapour fraction β'], ['x_i = \\frac{z_i}{1+\\beta(K_i-1)},\\quad y_i = K_ix_i', 'phase compositions once β is known'], ['K_i = \\frac{P_i^{sat}(T)}{P}', 'ideal K-values from Antoine']],
        notes: ['Ideal solution and ideal gas \u2014 valid for low pressure hydrocarbon or solvent mixtures.', 'Feed composition normalised automatically.', 'Objective solved by bisection on \u03c8 \u2208 (0,1).'],
        params: [P('T', 'Flash temperature', 20, 200, 1, 95, 'T'), P('P', 'Flash pressure', 20, 500, 5, 101.325, 'P'), P('z1', 'Acetone in feed', 0, 1, 0.01, 0.25, null, 'mol'), P('z2', 'Benzene in feed', 0, 1, 0.01, 0.3, null, 'mol'), P('z3', 'Toluene in feed', 0, 1, 0.01, 0.3, null, 'mol'), P('z4', 'n-Heptane in feed', 0, 1, 0.01, 0.15, null, 'mol')],
        compute: v => {
          const cs = [ANT.acetone, ANT.benzene, ANT.toluene, ANT.heptane];
          const zr = [v.z1, v.z2, v.z3, v.z4];
          const tot = zr.reduce((a, b) => a + b, 0) || 1;
          const z = zr.map(q => q / tot);
          const Kf = T => cs.map(c => psat(c, T) / v.P);
          const psi = T => {
            const K = Kf(T);
            const f = p => K.reduce((s, k, i) => s + z[i] * (k - 1) / (1 + p * (k - 1)), 0);
            if (f(0) <= 0) return 0;
            if (f(1) >= 0) return 1;
            return self.bis(f, 0, 1, 1e-12);
          };
          const p = psi(v.T), K = Kf(v.T);
          const x = z.map((zi, i) => zi / (1 + p * (K[i] - 1)));
          const y = x.map((xi, i) => xi * K[i]);
          const Tb = self.bis(T => cs.reduce((s, c, i) => s + z[i] * psat(c, T), 0) - v.P, -20, 400, 1e-8);
          const Td = self.bis(T => cs.reduce((s, c, i) => s + z[i] * v.P / psat(c, T), 0) - 1, -20, 400, 1e-8);
          return {
            psi: psi, p: p, Tb: Tb, Td: Td,
            res: [{ l: 'Vapour fraction V/F', v: p, u: '\u2014', d: 4 }, { l: 'Liquid fraction L/F', v: 1 - p, u: '\u2014', d: 4 }, { l: 'Bubble point at P', v: Tb, u: '', cv: 'T', d: 2 }, { l: 'Dew point at P', v: Td, u: '', cv: 'T', d: 2 }, { l: 'Phase state', s: p <= 0 ? 'subcooled liquid' : p >= 1 ? 'superheated vapour' : 'two-phase', u: '' }],
            table: {
              title: 'Phase split at the marked condition',
              head: ['Component', 'z\u1d62', 'K\u1d62', 'x\u1d62 (liquid)', 'y\u1d62 (vapour)'],
              rows: cs.map((c, i) => [c.n, z[i].toFixed(4), K[i].toFixed(3), x[i].toFixed(4), y[i].toFixed(4)])
            }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: Math.max(r.Tb - 25, -20), xmax: r.Td + 25, ymin: 0, ymax: 1.02 });
          g.grid('Flash temperature  (' + self.cvt(0, 'T')[1] + ')', 'Vapour fraction  V/F', 6, 5, t => self.cvt(t, 'T')[0].toFixed(0));
          g.title('Flash curve at ' + self.f(self.cvt(v.P, 'P')[0], 1) + ' ' + self.cvt(v.P, 'P')[1]);
          g.fn(T => r.psi(T), C.dk, 2.6, null, 200);
          g.line([[r.Tb, 0], [r.Tb, 1.02]], C.mut, 1.2, [4, 4]);
          g.line([[r.Td, 0], [r.Td, 1.02]], C.mut, 1.2, [4, 4]);
          g.txt('bubble', r.Tb, 0.94, C.mid, 'right', 11);
          g.txt('dew', r.Td, 0.94, C.mid, 'left', 11);
          g.cross(v.T, r.p, C.acc, 9);
          g.dot(v.T, r.p, C.acc, 4.5);
          g.txt('V/F = ' + r.p.toFixed(3), v.T, Math.min(r.p + 0.07, 0.97), C.mid, 'center', 12);
        }
      },
      {
        id: 'extraction', num: 'S-06', sec: S, name: 'Countercurrent liquid\u2013liquid extraction',
        blurb: 'Immiscible solvent stripping a solute out of a feed stream, stage by stage. With a constant distribution coefficient the whole cascade collapses to one extraction factor \u2014 and to a staircase that looks like McCabe\u2013Thiele turned on its side.',
        howto: 'The staircase steps between the operating line (slope F/S) and the straight equilibrium line y = Kx. Raise the solvent-to-feed ratio and the operating line flattens, the steps get bigger, and fewer stages are needed \u2014 at the cost of more solvent to recover downstream. Extraction factor below 1 means no realistic number of stages will hit the target.',
        std: 'Kremser cascade for immiscible solvents \u2014 Treybal Ch. 10; Perry\u2019s \u00a715',
        eqs: [['E = \\frac{KS}{F}', 'extraction factor'], ['\\frac{x_N}{x_0} = \\frac{E-1}{E^{N+1}-1}', 'Kremser cascade, straight equilibrium line'], ['y = \\frac{F}{S}(x_0-x) + y_S', 'operating line of slope F/S']],
        notes: ['Carrier and solvent completely immiscible; rates constant.', 'Linear equilibrium y = Kx on a solute-free ratio basis.', 'Stage efficiency of 70\u201380% is typical for mixer-settlers.'],
        params: [P('K', 'Distribution coefficient K', 0.2, 20, 0.1, 3, null, '\u2014'), P('F', 'Feed rate F', 10, 500, 5, 100, null, 'kg/h'), P('Sv', 'Solvent rate S', 5, 500, 5, 60, null, 'kg/h'), P('xF', 'Feed solute x_F', 0.005, 0.3, 0.005, 0.1, null, 'mass ratio'), P('N', 'Number of ideal stages', 1, 12, 1, 4, null, 'stages'), P('ys', 'Solute in fresh solvent', 0, 0.05, 0.001, 0, null, 'mass ratio')],
        compute: v => {
          const E = v.K * v.Sv / v.F;
          const N = Math.round(v.N);
          const ratio = Math.abs(E - 1) < 1e-9 ? 1 / (N + 1) : (E - 1) / (Math.pow(E, N + 1) - 1);
          const xN = v.xF * ratio;
          const y1 = v.ys + v.F / v.Sv * (v.xF - xN);
          /* Staircase from the feed end (x_F, y\u2081): horizontally to the equilibrium
             line y = Kx, then down to the operating line. Stop if it pinches. */
          const steps = [];
          let x = v.xF, y = y1, n = 0;
          for (let i = 0; i < N; i++) {
            const xe = y / v.K;
            if (!(xe < x - 1e-15) || xe < 0) break;
            steps.push([[x, y], [xe, y]]);
            n++;
            const yn = Math.max(v.ys, v.ys + v.F / v.Sv * (xe - xN));
            steps.push([[xe, y], [xe, yn]]);
            x = xe; y = yn;
          }
          return {
            E: E, xN: xN, y1: y1, steps: steps, nstep: n,
            res: [{ l: 'Extraction factor E', v: E, u: '\u2014' }, { l: 'Raffinate x_N', v: xN, u: 'mass ratio', d: 5 }, { l: 'Solute recovery', v: (1 - xN / v.xF) * 100, u: '%', d: 2 }, { l: 'Extract y\u2081', v: y1, u: 'mass ratio', d: 5 }, { l: 'Stages drawn before pinch', v: n, u: '\u2014', d: 0 }, { l: 'Solvent / feed ratio', v: v.Sv / v.F, u: '\u2014' }, { l: 'Concentration factor y\u2081/x_F', v: y1 / v.xF, u: '\u2014' }, { l: 'Single-stage recovery', v: (1 - 1 / (1 + E)) * 100, u: '%', d: 1 }]
          };
        },
        sq: 1.1,
        draw: (ctx, b, v, r) => {
          const xm = v.xF * 1.12, ym = Math.max(r.y1, v.K * v.xF) * 1.12;
          const g = self.mkG(ctx, { x: b.x + Math.max(0, (b.w - Math.min(b.w, b.h * 1.1)) / 2), y: b.y, w: Math.min(b.w, b.h * 1.1), h: b.h, xmin: 0, xmax: xm, ymin: 0, ymax: ym, ml: 76 });
          g.grid('x   solute in raffinate', 'y   solute in extract', 5, 5);
          g.title('Countercurrent cascade \u2014 ' + r.nstep + ' of ' + Math.round(v.N) + ' ideal stages drawn');
          g.fn(x => v.K * x, C.dk, 2.4);
          g.line([[r.xN, v.ys], [v.xF, r.y1]], C.acc, 2.2);
          g.clip(() => { ctx.strokeStyle = 'rgba(29,31,32,0.75)'; ctx.lineWidth = 1.3; ctx.beginPath(); r.steps.forEach(s => { ctx.moveTo(g.X(s[0][0]), g.Y(s[0][1])); ctx.lineTo(g.X(s[1][0]), g.Y(s[1][1])); }); ctx.stroke(); });
          g.legend([{ c: C.dk, l: 'equilibrium  y = Kx' }, { c: C.acc, l: 'operating line' }]);
          const bw = 150, bh = 36, bx = g.x + g.w - bw - 10, by = g.y + g.h - bh - 10;
          g.panel(bx, by, bw, bh);
          g.ptxt('E = ' + r.E.toFixed(2), bx + 10, by + 12, C.ink, 'left', 12.5);
          g.ptxt('recovery = ' + ((1 - r.xN / v.xF) * 100).toFixed(1) + ' %', bx + 10, by + 26, C.mid, 'left', 11.5);
          g.dot(v.xF, r.y1, C.acc, 4.5); g.dot(r.xN, v.ys, C.acc, 4.5);
          g.txt('feed in / extract out', v.xF, r.y1 + ym * 0.04, C.mid, 'right', 11);
          g.txt('raffinate out', r.xN, v.ys + ym * 0.04, C.mid, 'left', 11);
        }
      }
    ];
  }

  /* ══ FLUID MECHANICS ══════════════════════════════════════ */
