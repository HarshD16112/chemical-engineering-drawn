  dNewB() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SP = 'Separations', EQ = 'Process Equipment Design', TP = 'Thermophysical Data';
    const PACK = [['pall25', '25 mm metal Pall ring', 56, 0.45], ['pall38', '38 mm metal Pall ring', 40, 0.55], ['pall50', '50 mm metal Pall ring', 27, 0.65], ['imtp40', 'IMTP 40 metal random', 24, 0.6], ['rasch25', '25 mm ceramic Raschig ring', 179, 0.6], ['rasch50', '50 mm ceramic Raschig ring', 65, 0.9], ['plast50', '50 mm plastic Pall ring', 26, 0.7], ['mel250', 'Mellapak 250Y structured', 20, 0.45]];
    return [
      {
        id: 'shortcut',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const N = Math.max(1, Math.round(self.rget(r, 'theoretical stages n') || 10));
  const real = Math.max(1, Math.round(self.rget(r, 'real trays') || N));
  const Nr = Math.max(1, Math.round(self.rget(r, 'rectifying stages') || N / 2));
  const D = self.rget(r, 'distillate rate') || 0, B = self.rget(r, 'bottoms rate') || 0;
  const R = self.rget(r, 'operating reflux') || v.rr, Vb = self.rget(r, 'boil-up') || 0;
  const load = self.cl01(Vb / Math.max(v.F, 1) / 4);
  s.title('Shortcut column \u2014 real trays', real + ' real trays at \u03b7 ' + self.f(v.eff, 2) + ' \u00b7 N ' + self.f(N, 1));
  const X = s.x + 116, colW = Math.max(44, Math.min(84, s.w * 0.12));
  const top = s.y + 46, bot = s.y + s.h - 60;
  const rx = Math.max(X + colW + 46, s.x + s.w - 150);
  const col = s.column(X, top, colW, bot - top, { n: real, feed: Math.max(1, Math.round(Nr / Math.max(N, 1) * real)), max: 26 });
  const cc = s.temp(0.5 - 0.44 * load), hc = s.temp(0.5 + 0.46 * load);
  s.unit(rx + 8, top - 36, 76, 26, 'COND', { col: cc, fill: s.temp(0.5 - 0.44 * load, 0.18), tcol: cc, size: 10.5, tag: 'R = ' + self.f(R, 2) });
  s.unit(rx + 8, bot + 8, 76, 26, 'REBOIL', { col: hc, fill: s.temp(0.5 + 0.46 * load, 0.18), tcol: hc, size: 10.5, tag: 'V ' + self.f(Vb, 0) + ' kmol/h' });
  s.L([[col.cx, top], [col.cx, top - 23], [rx + 8, top - 23]], { col: C.ink, lw: 1.4, arrow: true });
  s.L([[rx + 46, top - 10], [rx + 46, top + 24], [s.x + s.w - 4, top + 24]], { col: C.acc, lw: 1.7, arrow: true });
  s.T('D ' + self.f(D, 1) + ' kmol/h', rx + 48, top + 13, { size: 10.5, col: C.acc });
  s.L([[rx + 30, top + 2], [rx + 30, top + 54], [X + colW, top + 54]], { col: C.acc, lw: 1.5, arrow: true });
  s.plate('L ' + self.f(R * D, 0) + ' kmol/h', (X + colW + rx + 30) / 2, top + 54, { col: C.acc, size: 10 });
  s.L([[col.cx, bot], [col.cx, bot + 21], [rx + 8, bot + 21]], { col: C.ink, lw: 1.4, arrow: true });
  s.L([[rx + 46, bot + 8], [rx + 46, bot - 22], [X + colW, bot - 22]], { col: hc, lw: 1.6, arrow: true });
  s.L([[rx + 84, bot + 21], [s.x + s.w - 4, bot + 21]], { col: C.mid, lw: 1.7, arrow: true });
  s.T('B ' + self.f(B, 1) + ' kmol/h', rx + 86, bot + 10, { size: 10.5, col: C.mid });
  const fy = col.yOf(Math.max(1, Math.round(Nr / Math.max(N, 1) * real)));
  s.L([[X - 62, fy], [X, fy]], { col: C.dk, lw: 1.9, arrow: true });
  s.T('F ' + self.f(v.F, 0) + ' kmol/h', X - 62, fy - 11, { size: 10.5, col: C.dk });
  s.T('q = ' + self.f(v.q, 2), X - 62, fy + 12, { size: 10, col: C.mut });
  s.dim(s.x + 16, top, s.x + 16, fy, Math.round(Nr) + ' rect.', { col: C.mut });
  s.dim(s.x + 16, fy, s.x + 16, bot, Math.max(0, Math.round(N - Nr)) + ' strip.', { col: C.mut });
},
        schemNote: 'The shell carries the real tray count, not the theoretical one \u2014 drop the tray efficiency and the stack lengthens while N stays put. The feed nozzle sits at the Gilliland split between rectifying and stripping sections.',
        num: 'S-07', sec: SP, name: 'Shortcut distillation \u2014 Fenske\u2013Underwood\u2013Gilliland',
        blurb: 'Three correlations that size a column before you draw a single tray. Fenske gives the stages at infinite reflux, Underwood the reflux at infinite stages, and Gilliland interpolates between those two impossible extremes to the column you will actually build.',
        howto: 'Left panel is the Gilliland correlation with your design on it \u2014 push the reflux ratio down toward Rmin and the point slides left into the steep region where a small reflux change costs many trays. Right panel is the same information as stages against reflux: the knee, usually R \u2248 1.15\u20131.3 Rmin, is where capital and energy trade evenly.',
        std: 'Fenske (1932); Underwood (1948); Gilliland (1940); Kirkbride (1944) feed-stage split',
        eqs: [['N_{min} = \\frac{\\ln\\left[\\frac{x_D}{1-x_D}\\cdot\\frac{1-x_B}{x_B}\\right]}{\\ln\\alpha}', 'Fenske — minimum stages at total reflux'], ['\\sum_i\\frac{\\alpha_iz_i}{\\alpha_i-\\theta} = 1-q,\\qquad R_{min}+1 = \\sum_i\\frac{\\alpha_ix_{D,i}}{\\alpha_i-\\theta}', 'Underwood — minimum reflux through the root θ'], ['Y = 1 - \\exp\\left[\\frac{1+54.4X}{11+117.2X}\\cdot\\frac{X-1}{\\sqrt X}\\right],\\quad X = \\frac{R-R_{min}}{R+1},\\; Y = \\frac{N-N_{min}}{N+1}', 'Gilliland correlation']],
        notes: ['Binary or pseudo-binary treatment on the light-key/heavy-key pair.', 'Constant relative volatility \u2014 use the geometric mean of top and bottom values.', 'Gilliland is a correlation of many columns, not a derivation: expect \u00b115% on stages.'],
        params: [P('alpha', 'Relative volatility \u03b1 (LK/HK)', 1.05, 8, 0.05, 2.4, null, '\u2014'), P('zF', 'Feed light key z_F', 0.05, 0.95, 0.01, 0.45, null, 'mol frac'), P('xD', 'Distillate light key x_D', 0.5, 0.999, 0.001, 0.97, null, 'mol frac'), P('xB', 'Bottoms light key x_B', 0.001, 0.5, 0.001, 0.02, null, 'mol frac'), P('q', 'Feed condition q', 0, 1.4, 0.05, 1, null, '\u2014'), P('rr', 'R / R_min', 1.02, 3, 0.01, 1.25, null, '\u2014'), P('F', 'Feed rate', 10, 2000, 5, 100, null, 'kmol/h'), P('eff', 'Overall tray efficiency', 0.4, 1, 0.01, 0.7, null, '\u2014')],
        compute: v => {
          const a = v.alpha;
          const Nmin = Math.log((v.xD / (1 - v.xD)) * ((1 - v.xB) / v.xB)) / Math.log(a);
          const fth = th => a * v.zF / (a - th) + (1 - v.zF) / (1 - th) - (1 - v.q);
          const th = self.bis(fth, 1 + 1e-6, a - 1e-6, 1e-9);
          const Rmin = a * v.xD / (a - th) + (1 - v.xD) / (1 - th) - 1;
          const R = v.rr * Rmin;
          const Nof = Rv => { const X = (Rv - Rmin) / (Rv + 1); if (X <= 0) return Infinity; const Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X))); return (Nmin + Y) / (1 - Y); };
          const Yof = X => 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));
          const N = Nof(R), X = (R - Rmin) / (R + 1), Y = Yof(X);
          const DF = (v.zF - v.xB) / (v.xD - v.xB), D = v.F * DF, B = v.F - D;
          const kb = Math.pow(((1 - v.zF) / v.zF) * Math.pow(v.xB / (1 - v.xD), 2) * (B / D), 0.206);
          const Ns = N / (1 + 1 / kb), Nr = N - Ns;
          return {
            Nof: Nof, Yof: Yof, Nmin: Nmin, Rmin: Rmin, R: R, N: N, X: X, Y: Y,
            res: [{ l: 'Minimum stages N_min', v: Nmin, u: '\u2014', d: 2 }, { l: 'Underwood root \u03b8', v: th, u: '\u2014', d: 4 }, { l: 'Minimum reflux R_min', v: Rmin, u: '\u2014', d: 3 }, { l: 'Operating reflux R', v: R, u: '\u2014', d: 3 }, { l: 'Theoretical stages N', v: N, u: '\u2014', d: 2 }, { l: 'Real trays at efficiency', v: Math.ceil((N - 1) / v.eff), u: '\u2014', d: 0 }, { l: 'Rectifying stages', v: Nr, u: '\u2014', d: 1 }, { l: 'Stripping stages', v: Ns, u: '\u2014', d: 1 }, { l: 'Distillate rate D', v: D, u: 'kmol/h', d: 2 }, { l: 'Bottoms rate B', v: B, u: 'kmol/h', d: 2 }, { l: 'Reflux rate L', v: R * D, u: 'kmol/h', d: 2 }, { l: 'Boil-up V', v: (R + 1) * D, u: 'kmol/h', d: 2 }, { l: 'Vapour per unit feed', v: (R + 1) * D / v.F, u: '\u2014', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const w2 = b.w / 2 - 12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: w2, h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 54 });
          g.grid('X = (R\u2212R\u2098\u1d62\u2099)/(R+1)', 'Y = (N\u2212N\u2098\u1d62\u2099)/(N+1)', 5, 5);
          g.title('Gilliland correlation');
          g.fn(x => x <= 0 ? 1 : r.Yof(x), C.dk, 2.8);
          g.line([[r.X, 0], [r.X, r.Y]], C.mut, 1.2, [4, 4]);
          g.line([[0, r.Y], [r.X, r.Y]], C.mut, 1.2, [4, 4]);
          g.dot(r.X, r.Y, C.acc, 5.5);
          g.txt('your design', Math.min(r.X + 0.03, 0.97), r.Y - 0.05, C.ink, 'left', 11.5);
          const rmax = r.Rmin * 3, nmax = Math.min(r.Nof(r.Rmin * 1.03), r.N * 3.2);
          const g2 = self.mkG(ctx, { x: b.x + b.w / 2 + 12, y: b.y, w: w2, h: b.h, xmin: r.Rmin * 0.9, xmax: rmax, ymin: 0, ymax: nmax, ml: 52 });
          g2.grid('Reflux ratio  R', 'Theoretical stages  N', 5, 5);
          g2.title('Stages against reflux');
          g2.fn(x => Math.min(r.Nof(x), nmax * 1.5), C.dk, 2.8);
          g2.line([[r.Rmin, 0], [r.Rmin, nmax]], C.warn, 1.5, [5, 4]);
          g2.txt('R\u2098\u1d62\u2099', r.Rmin * 1.02, nmax * 0.92, C.warn, 'left', 11);
          g2.line([[r.Rmin * 0.9, r.Nmin], [rmax, r.Nmin]], C.mid, 1.3, [3, 3]);
          g2.txt('N\u2098\u1d62\u2099', rmax * 0.99, r.Nmin + nmax * 0.02, C.mid, 'right', 11, 'bottom');
          g2.dot(r.R, r.N, C.acc, 5.5);
          g2.txt(self.f(r.N, 1) + ' stages', r.R, r.N + nmax * 0.05, C.ink, 'center', 12);
          g2.legend([{ c: C.dk, l: 'Gilliland' }, { c: C.warn, l: 'R\u2098\u1d62\u2099', d: [5, 4] }]);
        }
      },
      {
        id: 'packtower',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Dmm = self.rget(r, 'column diameter') || 1000, Ht = self.rget(r, 'packed height') || 5;
  const HETP = self.rget(r, 'hetp') || 0.5, dP = self.rget(r, 'pressure drop at design') || 0;
  const beds = Math.max(1, Math.min(4, Math.ceil(Ht / 6)));
  s.title('Packed tower', self.f(self.cvt(Dmm, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' \u00d7 ' + self.f(self.cvt(Ht, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1] + ' packed');
  const W = Math.max(60, Math.min(170, 40 + Dmm / 26)), X = s.cx - W / 2;
  const top = s.y + 40, bot = s.y + s.h - 48;
  s.column(X, top, W, bot - top, { packed: true, beds: beds });
  const fl = self.cl01(v.flood);
  s.L([[X + 5, top + 12], [X + W - 5, top + 12]], { col: C.acc, lw: 1.6 });
  for (let i = 0; i < 6; i++) { const px = X + 9 + (W - 18) * i / 5; s.L([[px, top + 12], [px, top + 22]], { col: C.acc, lw: 1.1, arrow: true, asz: 4.5 }); }
  s.T('distributor', X + W + 8, top + 14, { size: 10, col: C.mut });
  s.L([[X - 96, top + 6], [X, top + 6]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('liquid ' + self.f(v.Lq, 0) + ' kg/h', X - 96, top - 5, { size: 10.5, col: C.acc });
  s.L([[X - 96, bot - 8], [X, bot - 8]], { col: C.dk, lw: 2.1, arrow: true });
  s.T('gas ' + self.f(v.G, 0) + ' kg/h', X - 96, bot - 19, { size: 10.5, col: C.dk });
  s.L([[s.cx, top], [s.cx, top - 22]], { col: C.mid, lw: 1.9, arrow: true });
  s.T('treated gas', s.cx + 8, top - 17, { size: 10.5, col: C.mid });
  s.L([[s.cx, bot], [s.cx, bot + 24]], { col: C.acc, lw: 1.9, arrow: true });
  s.T('rich liquid', s.cx + 8, bot + 18, { size: 10.5, col: C.acc });
  s.dim(X + W + 34, top, X + W + 34, bot, self.f(self.cvt(Ht, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], { col: C.mut });
  s.dim(X, bot + 36, X + W, bot + 36, self.f(self.cvt(Dmm, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
  const gx = s.x, gw = 112, gy = s.y + 6;
  s.badge(gx, gy, 'Fraction of flood', self.f(v.flood * 100, 0) + '%', 0.5 + 0.48 * self.cl01((v.flood - 0.5) / 0.4), { w: gw });
  s.badge(gx, gy + 42, 'Beds \u00d7 HETP', beds + ' \u00d7 ' + self.f(self.cvt(HETP, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], null, { w: gw });
  s.badge(gx, gy + 84, '\u0394P over packing', self.f(dP * Ht, 1) + ' mbar', 0.5 + 0.42 * self.cl01((dP - 2) / 8), { w: gw });
  if (v.flood > 0.82) s.T('above 82% of flood \u2014 no margin for upset', s.cx, bot + 56, { align: 'center', size: 11, col: C.warn, bold: true });
},
        schemNote: 'Shell width is drawn to the computed diameter and the bed count follows the packed height, split at six-metre redistribution. The flood badge reddens as the design approaches the flooding velocity.',
        num: 'S-08', sec: SP, name: 'Packed tower sizing & flooding',
        blurb: 'A packed column is sized by the flood point and operated a fixed distance below it. Push the gas rate up and the liquid can no longer drain against it; pressure drop turns vertical and the tower fills. The packing factor is the single number that says where that happens.',
        howto: 'The curve is pressure drop against gas load at your liquid rate, with the flood line across the top and your design point on it. Notice how flat the curve is at 50\u201370% of flood and how sharply it lifts past 80% \u2014 that steepness is why packed towers are designed at 70% and not 90%.',
        std: 'Robbins pressure-drop correlation \u2014 Chem. Eng. Prog. 87(5), 87 (1991); flood criterion per Kister & Gill (1991)',
        eqs: [['\\Delta P = C_3G_f^2\\,10^{C_4L_f} + 0.4\\left(\\frac{L_f}{20000}\\right)^{0.1}\\left[C_3G_f^210^{C_4L_f}\\right]', 'Robbins — dry and irrigated terms'], ['G_f = 986F_s\\sqrt{\\frac{F_{pd}}{20}},\\qquad F_s = u_s\\sqrt{\\rho_g}', 'gas loading factor'], ['\\Delta P_{flood} = 0.115F_p^{0.7},\\qquad D = \\sqrt{\\frac{4\\dot V_g}{\\pi u_{design}}}', 'flood pressure drop and the diameter it fixes']],
        notes: ['Robbins correlation works in imperial internally \u2014 all inputs and outputs are converted for you.', 'Flood \u0394P per Kister & Gill; for Fp < 15 the low-packing-factor liquid term is used.', 'HETP is the vendor value for the selected packing \u2014 a first estimate, not a guarantee.'],
        params: [{ k: 'pack', label: 'Packing', type: 'select', val: 'pall50', options: PACK.map(p => [p[0], p[1]]) }, P('G', 'Gas mass flow', 100, 200000, 100, 12000, null, 'kg/h'), P('Lq', 'Liquid mass flow', 100, 600000, 100, 40000, null, 'kg/h'), P('rhog', 'Gas density', 0.3, 40, 0.05, 1.8, null, 'kg/m\u00b3'), P('rhol', 'Liquid density', 500, 1600, 5, 990, null, 'kg/m\u00b3'), P('mul', 'Liquid viscosity', 0.2, 100, 0.1, 1, null, 'cP'), P('flood', 'Design fraction of flood', 0.4, 0.9, 0.01, 0.7, null, '\u2014'), P('Nst', 'Theoretical stages required', 1, 40, 1, 8, null, '\u2014')],
        compute: v => {
          const pk = PACK.filter(p => p[0] === v.pack)[0] || PACK[2];
          const Fp = pk[2], HETP = pk[3];
          const rhogI = v.rhog * 0.062428, rholI = v.rhol * 0.062428;
          const dPflood = 0.115 * Math.pow(Fp, 0.7);
          const dPof = A => {
            const us = (v.G / 3600 / v.rhog) / A * 3.28084;
            const Lflux = (v.Lq * 2.20462) / (A * 10.7639);
            const Fs = us * Math.sqrt(rhogI);
            const Gf = 986 * Fs * Math.sqrt(Fp / 20);
            const Lf = Fp >= 15 ? Lflux * (62.4 / rholI) * Math.sqrt(Fp / 20) * Math.pow(v.mul, 0.1) : Lflux * (62.4 / rholI) * Math.sqrt(20 / Fp) * Math.pow(v.mul, 0.1);
            const dry = 7.4e-8 * Gf * Gf * Math.pow(10, 2.7e-5 * Lf);
            return dry + 0.4 * Math.pow(Lf / 20000, 0.1) * dry;
          };
          let lo = 0.01, hi = 400;
          for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (dPof(mid) > dPflood) lo = mid; else hi = mid; }
          const Aflood = lo, Ades = Aflood / v.flood;
          const Dd = Math.sqrt(4 * Ades / Math.PI);
          const Vg = v.G / 3600 / v.rhog;
          const uflood = Vg / Aflood, udes = Vg / Ades;
          const dPdes = dPof(Ades) * 0.816;
          const Ltot = v.Nst * HETP;
          const liqflux = (v.Lq / v.rhol) / Ades;
          const FLV = (v.Lq / v.G) * Math.sqrt(v.rhog / v.rhol);
          const Cs = udes * Math.sqrt(v.rhog / (v.rhol - v.rhog));
          return {
            dPof: dPof, Aflood: Aflood, Ades: Ades, dPflood: dPflood * 0.816, Vg: Vg, HETP: HETP, Fp: Fp,
            res: [{ l: 'Packing factor F_p', v: Fp, u: 'ft\u207b\u00b9', d: 0 }, { l: 'Flow parameter F_LV', v: FLV, u: '\u2014', d: 3 }, { l: 'Flooding velocity', v: uflood, u: '', cv: 'vel', d: 3 }, { l: 'Design gas velocity', v: udes, u: '', cv: 'vel', d: 3 }, { l: 'Souders\u2013Brown C_s', v: Cs, u: 'm/s', d: 4 }, { l: 'Column diameter', v: Dd * 1000, u: '', cv: 'mm', d: 0 }, { l: 'Cross-sectional area', v: Ades, u: '', cv: 'A', d: 3 }, { l: 'Gas F-factor', v: udes * Math.sqrt(v.rhog), u: 'Pa^0.5', d: 2 }, { l: 'Liquid irrigation rate', v: liqflux * 3600, u: 'm\u00b3/m\u00b2\u00b7h', d: 1 }, { l: 'Pressure drop at design', v: dPdes, u: 'mbar/m', d: 2 }, { l: 'Flood pressure drop', v: dPflood * 0.816, u: 'mbar/m', d: 2 }, { l: 'HETP (vendor estimate)', v: HETP, u: '', cv: 'L', d: 2 }, { l: 'Packed height', v: Ltot, u: '', cv: 'L', d: 2 }, { l: 'Total \u0394P over packing', v: dPdes * Ltot, u: 'mbar', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.3, xmax: 1.02, ymin: 0, ymax: r.dPflood * 1.25 });
          g.grid('Fraction of flooding velocity', 'Pressure drop  (mbar/m)', 5, 5, t => self.f(t * 100, 0) + '%');
          g.title('Pressure drop and the flood point');
          g.fill([[0.85, 0], [1.02, 0], [1.02, r.dPflood * 1.25], [0.85, r.dPflood * 1.25]], C.soft2);
          g.fn(fr => r.dPof(r.Aflood / Math.max(fr, 0.05)) * 0.816, C.dk, 2.8);
          g.line([[0.3, r.dPflood], [1.02, r.dPflood]], C.warn, 1.6, [5, 4]);
          g.txt('flood \u0394P = ' + self.f(r.dPflood, 1) + ' mbar/m', 0.32, r.dPflood + r.dPflood * 0.03, C.warn, 'left', 11, 'bottom');
          g.txt('do not design here', 1.0, r.dPflood * 0.42, C.mut, 'right', 11);
          const dp = r.dPof(r.Ades) * 0.816;
          g.line([[v.flood, 0], [v.flood, dp]], C.mut, 1.2, [4, 4]);
          g.dot(v.flood, dp, C.acc, 5.5);
          g.txt(self.f(v.flood * 100, 0) + '% of flood', v.flood, dp + r.dPflood * 0.06, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'Robbins \u0394P' }, { c: C.warn, l: 'flood limit', d: [5, 4] }]);
        }
      },
      {
        id: 'vesvol',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b, { padx: 20, top: 40, bot: 12 });
  const Vt = self.rget(r, 'total vessel volume') || 0, Vl = self.rget(r, 'contained liquid') || 0;
  const pctF = self.rget(r, 'vessel filled') || 0, Htot = self.rget(r, 'level range') || v.D;
  const hdep = self.rget(r, 'head depth') || 0, dV = self.rget(r, 'volume per 10') || 0;
  const horiz = v.orient === 'horiz';
  const HEADN = { flat: 'Flat', ellip: 'Ellipsoidal 2:1', fd: 'Torispherical F&D', hemi: 'Hemispherical' };
  const U = self.cvt(0, 'mm')[1], UV = self.cvt(0, 'V')[1];
  const mm = x => self.f(self.cvt(x, 'mm')[0], Math.abs(self.cvt(x, 'mm')[0]) >= 100 ? 0 : 2);
  s.title('Vessel \u00b7 Geometry & Level', self.f(pctF, 1) + '% full \u00b7 ' + self.f(self.cvt(Vl, 'V')[0], 3) + ' ' + UV);
  const frac = self.cl01(v.h / Math.max(Htot, 1));
  const pw = Math.min(214, s.w * 0.30), gap = 30;
  const lx = s.x, lwid = s.w - pw - gap;
  const px0 = s.x + s.w - pw;
  s.T('Elevation', lx, s.y + 4, { size: 10, caps: true, col: C.mut });
  const dz = { x: lx + 76, y: s.y + 40, w: lwid - 96, h: s.h - 150 };
  let X, Yt, Yb, W, hp, pth;
  if (horiz) {
    const sc = Math.min(dz.w / Math.max(v.L + 2 * hdep, 1), dz.h / Math.max(v.D, 1));
    W = v.L * sc; const H = v.D * sc; hp = hdep * sc;
    X = dz.x + hp + (dz.w - W - 2 * hp) / 2; Yt = dz.y + (dz.h - H) / 2; Yb = Yt + H;
    pth = new Path2D();
    pth.moveTo(X, Yt); pth.lineTo(X + W, Yt);
    pth.quadraticCurveTo(X + W + hp * 1.34, Yt, X + W + hp, Yt + H / 2); pth.quadraticCurveTo(X + W + hp * 1.34, Yb, X + W, Yb);
    pth.lineTo(X, Yb);
    pth.quadraticCurveTo(X - hp * 1.34, Yb, X - hp, Yt + H / 2); pth.quadraticCurveTo(X - hp * 1.34, Yt, X, Yt);
    pth.closePath();
    ctx.save(); ctx.clip(pth); ctx.fillStyle = C.soft3; ctx.fillRect(X - hp - 2, Yb - H * frac, W + 2 * hp + 4, H * frac + 2); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.dk; ctx.lineWidth = 1.7; ctx.stroke(pth); ctx.restore();
    if (frac > 0.004 && frac < 0.996) s.inPath(pth, () => s.L([[X - hp - 2, Yb - H * frac], [X + W + hp + 2, Yb - H * frac]], { col: C.acc, lw: 1.4 }));
    s.constr(X - hp - 14, Yt, X + W + hp + 14, Yt, '');
    s.L([[X, Yt - 16], [X, Yb + 16]], { col: C.lt, lw: 1, dash: [6, 4] });
    s.L([[X + W, Yt - 16], [X + W, Yb + 16]], { col: C.lt, lw: 1, dash: [6, 4] });
    s.T('tangent lines', X + W + 6, Yt - 26, { size: 10, col: C.mid, lab: C.mid });
    s.dim(X, Yt - 30, X + W, Yt - 30, mm(v.L) + ' T\u2013T', { col: C.mid, ext: [26, 26] });
    s.dim(X - hp, Yb + 42, X + W + hp, Yb + 42, mm(v.L + 2 * hdep) + ' Overall', { col: C.mid });
    s.dim(X - hp - 26, Yt, X - hp - 26, Yb, mm(v.D) + ' ' + U, { col: C.mid });
    s.lead(X + W * 0.70, Yb - H * frac, X + W * 0.70 + 30, Yt - 44, mm(v.h) + ' Level', { dot: C.acc, align: 'left' });
    s.callout(X + W - 16, Yt + 16, 'A', 10);
  } else {
    const sc = Math.min(dz.h / Math.max(v.L + 2 * hdep, 1), dz.w / Math.max(v.D * 2.1, 1));
    W = v.D * sc; const H = v.L * sc; hp = hdep * sc;
    X = dz.x + (dz.w - W) / 2 - 10; Yt = dz.y + hp + (dz.h - H - 2 * hp) / 2; Yb = Yt + H;
    pth = new Path2D();
    pth.moveTo(X, Yt);
    pth.quadraticCurveTo(X, Yt - hp * 1.34, X + W / 2, Yt - hp); pth.quadraticCurveTo(X + W, Yt - hp * 1.34, X + W, Yt);
    pth.lineTo(X + W, Yb);
    pth.quadraticCurveTo(X + W, Yb + hp * 1.34, X + W / 2, Yb + hp); pth.quadraticCurveTo(X, Yb + hp * 1.34, X, Yb);
    pth.closePath();
    const tot = H + 2 * hp;
    ctx.save(); ctx.clip(pth); ctx.fillStyle = C.soft3; ctx.fillRect(X - 2, Yb + hp - tot * frac, W + 4, tot * frac + 2); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.dk; ctx.lineWidth = 1.7; ctx.stroke(pth); ctx.restore();
    if (frac > 0.004 && frac < 0.996) s.L([[X, Yb + hp - tot * frac], [X + W, Yb + hp - tot * frac]], { col: C.acc, lw: 1.4 });
    s.constr(X - 22, Yt, X + W + 56, Yt, 'Top Tangent Line');
    s.constr(X - 22, Yb, X + W + 56, Yb, 'Bottom Tangent Line');
    s.dim(X - 30, Yt, X - 30, Yb, mm(v.L) + ' T\u2013T', { col: C.mid, off: 0 });
    s.dim(X - 64, Yt - hp, X - 64, Yb + hp, '', { col: C.mid });
    s.plate(mm(v.L + 2 * hdep) + ' Overall', X - 64, Yt + (Yb - Yt) * 0.28, { col: C.ink, lab: C.mid, size: 10.5, align: 'center' });
    s.dim(X, Yt - hp - 20, X + W, Yt - hp - 20, mm(v.D) + ' ID', { col: C.mid, ext: [14, 14] });
    s.lead(X + W * 0.72, Yb + hp - tot * frac, X + W + 44, Yb + hp - tot * frac - 26, mm(v.h) + ' Level', { dot: C.acc });
    s.callout(X + W + 26, Yt - hp - 2, 'A', 10);
    s.L([[X + W / 2 + W * 0.18, Yt - hp * 0.72], [X + W + 16, Yt - hp - 2]], { col: C.mid, lw: 1 });
  }
  /* right column */
  const d1 = s.sub(px0, s.y + 26, pw, 104, 'Detail A \u00b7 ' + (HEADN[v.head] || 'Head'));
  const hw = Math.min(pw * 0.60, 128), hh = Math.max(16, hw * (hdep / Math.max(v.D, 1)));
  const hx = px0 + (pw - hw) / 2, hy = d1.y + 54;
  s.L([[hx - 14, hy], [hx + hw + 14, hy]], { col: C.lt, lw: 1, dash: [6, 4] });
  ctx.save(); ctx.strokeStyle = C.dk; ctx.lineWidth = 1.7; ctx.beginPath();
  ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx, hy - hh * 1.34, hx + hw / 2, hy - hh); ctx.quadraticCurveTo(hx + hw, hy - hh * 1.34, hx + hw, hy); ctx.stroke(); ctx.restore();
  s.L([[hx, hy], [hx, hy + 18]], { col: C.dk, lw: 1.7 });
  s.L([[hx + hw, hy], [hx + hw, hy + 18]], { col: C.dk, lw: 1.7 });
  s.dim(hx + hw + 20, hy, hx + hw + 20, hy - hh, mm(hdep) + ' Depth', { col: C.mid });
  s.T('tangent line', hx - 14, hy + 15, { size: 10, col: C.mid, lab: C.mid });
  const d2y = d1.y + 128;
  s.sub(px0, d2y, pw, 110, 'Plan \u00b7 Section');
  const rr = Math.min(46, pw * 0.3), pcx = px0 + rr + 10, pcy = d2y + rr + 26;
  s.circ(pcx, pcy, rr, { stroke: C.dk, lw: 1.6 });
  if (horiz) {
    const yl = pcy + rr - 2 * rr * frac;
    ctx.save(); ctx.beginPath(); ctx.arc(pcx, pcy, rr, 0, 7); ctx.clip();
    ctx.fillStyle = C.soft3; ctx.fillRect(pcx - rr, yl, rr * 2, rr * 2); ctx.restore();
    s.L([[pcx - rr, yl], [pcx + rr, yl]], { col: C.acc, lw: 1.4 });
  } else { s.circ(pcx, pcy, rr - 3, { fill: C.soft3, stroke: 'rgba(0,0,0,0)' }); }
  s.L([[pcx - rr - 7, pcy], [pcx + rr + 7, pcy]], { col: C.lt, lw: 1, dash: [5, 3] });
  s.L([[pcx, pcy - rr - 7], [pcx, pcy + rr + 7]], { col: C.lt, lw: 1, dash: [5, 3] });
  s.rich(mm(v.D) + ' ' + U, pcx + rr + 14, pcy - 9, { size: 10.5, col: C.ink });
  s.rich(self.f(pctF, 1) + '% wetted', pcx, pcy + rr + 14, { size: 10.5, col: C.acc, align: 'center' });
  const cTop = s.y + s.h - 52 - 2 * (s.chipH + 6);
  s.chips(lx, cTop, 'Orientation', ['Horizontal', 'Vertical'], horiz ? 0 : 1);
  s.chips(lx, cTop + s.chipH + 6, 'Heads', ['Flat', '2:1', 'F&D', 'Hemi'], ['flat', 'ellip', 'fd', 'hemi'].indexOf(v.head));
  /* left read-outs */
  s.badge(lx, s.y + s.h - 40, 'Contained volume', self.f(self.cvt(Vl, 'V')[0], 3) + ' ' + UV, null, { w: 150 });
  s.badge(lx + 160, s.y + s.h - 40, 'Per 10 mm here', self.f(self.cvt(dV, 'V')[0], 4) + ' ' + UV, null, { w: 150 });
  s.badge(lx + 320, s.y + s.h - 40, 'Slenderness L/D', self.f(v.L / v.D, 2), null, { w: 136 });
},
        schemNote: 'Drawn as a dimensioned elevation: tangent lines, T\u2013T and overall lengths, the head detail at its true depth and a plan section showing the wetted area. Everything moves with the inputs \u2014 which is why the volume per 10 mm changes so much near the heads.',
        num: 'E-01', sa: 0.66, sec: EQ, name: 'Vessel volume & level',
        blurb: 'The strapping table every level instrument needs. Partial volume against level for a vessel with dished ends is not linear anywhere \u2014 the heads make the bottom and top of the range behave completely differently from the middle.',
        howto: 'The curve is contained volume against level; the dashed lines mark the head tangent lines. On a horizontal vessel the middle of the range is where a centimetre of level means the most volume; on a vertical one the shell section is a straight line and only the heads curve. Read the slope, not the reading, when you are choosing instrument range.',
        std: 'Exact geometric integration; head proportions per ASME VIII-1 UG-32 (2:1 ellipsoidal, hemispherical, torispherical F&D)',
        eqs: [['V_{shell} = L\\left[R^2\\cos^{-1}\\frac{R-h}{R} - (R-h)\\sqrt{2Rh-h^2}\\right]', 'horizontal shell — circular segment × length'], ['V_{head} = 2\\int_0^a A_{seg}\\left(r(x), h-(R-r)\\right)dx,\\quad r(x) = R\\sqrt{1-\\left(\\frac{x}{a}\\right)^2}', 'dished heads by integration along the axis'], ['V_{vert} = \\int_0^{h}\\pi\\rho(z)^2dz,\\qquad \\rho(z) = R\\sqrt{1-\\left(\\frac{a-z}{a}\\right)^2}', 'vertical vessel — stacked discs through the bottom head']],
        notes: ['2:1 ellipsoidal depth a = D/4; hemispherical a = D/2; F&D approximated as an ellipsoid of depth 0.169D.', 'Level measured from the lowest point of the vessel, including the bottom head.', 'Nozzle and internal volumes not deducted.'],
        params: [{ k: 'orient', label: 'Orientation', type: 'select', val: 'horiz', options: [['horiz', 'Horizontal'], ['vert', 'Vertical']] }, { k: 'head', label: 'Head type', type: 'select', val: 'ellip', options: [['flat', 'Flat'], ['ellip', '2:1 ellipsoidal'], ['fd', 'Torispherical F&D'], ['hemi', 'Hemispherical']] }, P('D', 'Inside diameter', 300, 6000, 10, 2000, 'mm'), P('L', 'Tangent-to-tangent length', 300, 30000, 50, 5000, 'mm'), P('h', 'Liquid level', 0, 30000, 10, 900, 'mm')],
        compute: v => {
          const R = v.D / 2000, L = v.L / 1000;
          const af = { flat: 0, ellip: 0.25, fd: 0.169, hemi: 0.5 }[v.head];
          const a = af * v.D / 1000;
          const seg = (r, d) => { if (d <= 0) return 0; if (d >= 2 * r) return Math.PI * r * r; return r * r * Math.acos((r - d) / r) - (r - d) * Math.sqrt(Math.max(2 * r * d - d * d, 0)); };
          const Vof = hm => {
            const h = Math.max(hm / 1000, 0);
            if (v.orient === 'horiz') {
              const hc = Math.min(h, 2 * R);
              let Vs = L * seg(R, hc), Vh = 0;
              if (a > 0) { const n = 80; for (let i = 0; i < n; i++) { const x = a * (i + 0.5) / n, rr = R * Math.sqrt(Math.max(1 - (x / a) * (x / a), 0)); Vh += seg(rr, hc - (R - rr)) * (a / n); } Vh *= 2; }
              return Vs + Vh;
            }
            let V = 0;
            const hb = Math.min(h, a);
            if (a > 0 && hb > 0) { const n = 60; for (let i = 0; i < n; i++) { const z = hb * (i + 0.5) / n, rr = R * Math.sqrt(Math.max(1 - Math.pow((a - z) / a, 2), 0)); V += Math.PI * rr * rr * (hb / n); } }
            const hs = Math.min(Math.max(h - a, 0), L);
            V += Math.PI * R * R * hs;
            const ht = Math.min(Math.max(h - a - L, 0), a);
            if (a > 0 && ht > 0) { const n = 60; for (let i = 0; i < n; i++) { const z = ht * (i + 0.5) / n, rr = R * Math.sqrt(Math.max(1 - Math.pow(z / a, 2), 0)); V += Math.PI * rr * rr * (ht / n); } }
            return V;
          };
          const Htot = v.orient === 'horiz' ? 2 * R * 1000 : (L + 2 * a) * 1000;
          const Vtot = Vof(Htot), Vl = Vof(Math.min(v.h, Htot));
          const dV = (Vof(Math.min(v.h, Htot) + 10) - Vof(Math.max(Math.min(v.h, Htot) - 10, 0))) / 2;
          const headV = v.orient === 'horiz' ? Vtot - L * Math.PI * R * R : Vtot - Math.PI * R * R * L;
          return {
            Vof: Vof, Vtot: Vtot, Htot: Htot, a: a * 1000, L: L * 1000,
            res: [{ l: 'Total vessel volume', v: Vtot, u: '', cv: 'V', d: 3 }, { l: 'Contained liquid volume', v: Vl, u: '', cv: 'V', d: 3 }, { l: 'Vessel filled', v: Vl / Vtot * 100, u: '%', d: 1 }, { l: 'Level range (full height)', v: Htot, u: '', cv: 'mm', d: 0 }, { l: 'Level as % of range', v: Math.min(v.h, Htot) / Htot * 100, u: '%', d: 1 }, { l: 'Volume per 10 mm at this level', v: dV, u: '', cv: 'V', d: 4 }, { l: 'Both heads together', v: headV, u: '', cv: 'V', d: 3 }, { l: 'Head depth (each)', v: a * 1000, u: '', cv: 'mm', d: 0 }, { l: 'Shell volume', v: Vtot - headV, u: '', cv: 'V', d: 3 }, { l: 'Slenderness L/D', v: v.L / v.D, u: '\u2014', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: r.Htot, ymin: 0, ymax: r.Vtot * 1.04, ml: 74 });
          g.grid('Level  (' + self.cvt(0, 'mm')[1] + ')', 'Contained volume  (' + self.cvt(0, 'V')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'mm')[0], 0), t => self.f(self.cvt(t, 'V')[0], 1));
          g.title('Strapping curve \u2014 volume against level');
          const pts = [];
          for (let i = 0; i <= 120; i++) { const hm = r.Htot * i / 120; pts.push([hm, r.Vof(hm)]); }
          g.fill([[0, 0]].concat(pts, [[r.Htot, 0]]), C.soft);
          g.line(pts, C.dk, 2.8);
          if (v.orient === 'vert' && r.a > 0) {
            [r.a, r.a + r.L].forEach((z, i) => { g.line([[z, 0], [z, r.Vtot * 1.04]], C.mut, 1.2, [4, 4]); g.txt(i === 0 ? 'bottom tangent' : 'top tangent', z, r.Vtot * (i === 0 ? 0.9 : 0.78), C.mut, 'center', 10.5); });
          }
          const hl = Math.min(v.h, r.Htot);
          g.line([[hl, 0], [hl, r.Vof(hl)]], C.acc, 1.4, [4, 4]);
          g.line([[0, r.Vof(hl)], [hl, r.Vof(hl)]], C.acc, 1.4, [4, 4]);
          g.dot(hl, r.Vof(hl), C.acc, 5.5);
          g.txt(self.f(self.cvt(r.Vof(hl), 'V')[0], 2) + ' ' + self.cvt(0, 'V')[1], hl, r.Vof(hl) + r.Vtot * 0.04, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: v.orient === 'horiz' ? 'horizontal vessel' : 'vertical vessel' }]);
        }
      },
      {
        id: 'vesthick', num: 'E-02', sec: EQ, name: 'Pressure vessel thickness & MAWP',
        blurb: 'Wall thickness by ASME VIII Division 1. Four geometries, four formulae, and a clear message in the numbers: a sphere or a hemisphere needs half the wall of a cylinder at the same pressure, which is why the expensive heads go on the cheap shells.',
        howto: 'Each line is required thickness against design pressure for one geometry; your design sits on the cylindrical line. Read across at your pressure to see what each head type would cost you in plate, then add corrosion allowance and round up to the next plate \u2014 the results panel does both.',
        std: 'ASME BPVC VIII-1: UG-27 (shells), UG-32 (formed heads), UG-98 (MAWP)',
        eqs: [['t_{cyl} = \\frac{PR}{SE - 0.6P},\\qquad t_{sph} = \\frac{PR}{2SE - 0.2P}', 'UG-27 — circumferential stress governs the cylinder'], ['t_{ell} = \\frac{PD}{2SE - 0.2P},\\qquad t_{FD} = \\frac{0.885PL_c}{SE - 0.1P}', 'UG-32 formed heads — 2:1 ellipsoidal and torispherical F&D'], ['MAWP = \\frac{SEt}{R + 0.6t}', 'the pressure the finished wall will actually hold']],
        notes: ['S is the allowable stress at design temperature \u2014 from ASME II-D, not the yield strength.', 'E is the joint efficiency: 1.0 fully radiographed, 0.85 spot, 0.70 none.', 'Thickness excludes forming thinning; external pressure and stiffening rings are a separate calculation.'],
        params: [P('D', 'Inside diameter', 200, 6000, 10, 1500, 'mm'), P('Pd', 'Design pressure (gauge)', 0.5, 200, 0.5, 10, null, 'bar g'), P('S', 'Allowable stress S', 40, 220, 1, 138, null, 'MPa'), P('E', 'Joint efficiency E', 0.6, 1, 0.05, 1, null, '\u2014'), P('CA', 'Corrosion allowance', 0, 12, 0.5, 3, null, 'mm'), P('tact', 'Actual plate thickness', 3, 120, 0.5, 12, null, 'mm'), P('L', 'Tangent-to-tangent length', 300, 20000, 100, 4000, 'mm'), P('rho', 'Steel density', 7000, 8200, 10, 7850, null, 'kg/m\u00b3')],
        compute: v => {
          const R = v.D / 2, Pm = v.Pd / 10, SE = v.S * v.E;
          const tc = Pm * R / (SE - 0.6 * Pm), tsp = Pm * R / (2 * SE - 0.2 * Pm);
          const tel = Pm * v.D / (2 * SE - 0.2 * Pm), tfd = 0.885 * Pm * v.D / (SE - 0.1 * Pm);
          const tof = (Pb, kind) => { const p = Pb / 10; return kind === 'cyl' ? p * R / (SE - 0.6 * p) : kind === 'sph' ? p * R / (2 * SE - 0.2 * p) : kind === 'ell' ? p * v.D / (2 * SE - 0.2 * p) : 0.885 * p * v.D / (SE - 0.1 * p); };
          const tavail = Math.max(v.tact - v.CA, 0.1);
          const mawp = SE * tavail / (R + 0.6 * tavail) * 10;
          const mawpH = 2 * SE * tavail / (v.D / 1 + 0.2 * tavail) * 10;
          const shellW = Math.PI * (v.D / 1000 + v.tact / 1000) * (v.L / 1000) * (v.tact / 1000) * v.rho;
          const headW = 2 * 1.084 * Math.PI * Math.pow(v.D / 2000, 2) * (v.tact / 1000) * v.rho;
          const std = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 36, 40, 45, 50, 60, 70, 80, 90, 100];
          const need = tc + v.CA;
          const pick = std.filter(s => s >= need)[0] || Math.ceil(need);
          return {
            tof: tof, tc: tc, mawp: mawp,
            res: [{ l: 'Cylindrical shell t', v: tc, u: '', cv: 'mm', d: 2 }, { l: 'Spherical shell t', v: tsp, u: '', cv: 'mm', d: 2 }, { l: '2:1 ellipsoidal head t', v: tel, u: '', cv: 'mm', d: 2 }, { l: 'Torispherical F&D head t', v: tfd, u: '', cv: 'mm', d: 2 }, { l: 'Shell t plus corrosion', v: need, u: '', cv: 'mm', d: 2 }, { l: 'Next standard plate', v: pick, u: '', cv: 'mm', d: 1 }, { l: 'Thickness available (as-built)', v: tavail, u: '', cv: 'mm', d: 2 }, { l: 'MAWP \u2014 shell', v: mawp, u: 'bar g', d: 2 }, { l: 'MAWP \u2014 2:1 head', v: mawpH, u: 'bar g', d: 2 }, { l: 'Margin over design pressure', v: (mawp / v.Pd - 1) * 100, u: '%', d: 1 }, { l: 'Shell weight', v: shellW, u: 'kg', d: 0 }, { l: 'Both heads weight', v: headW, u: 'kg', d: 0 }, { l: 'Total shell + heads', v: shellW + headW, u: 'kg', d: 0 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const pmax = Math.max(v.Pd * 1.8, 5);
          const tmax = r.tof(pmax, 'fd') * 1.06;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: pmax, ymin: 0, ymax: tmax, ml: 70 });
          g.grid('Design pressure  (bar g)', 'Required thickness  (' + self.cvt(0, 'mm')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'mm')[0], 1));
          g.title('Required thickness by geometry');
          const set = [['fd', C.lt, 'F&D head'], ['cyl', C.dk, 'cylindrical shell'], ['ell', C.acc, '2:1 ellipsoidal head'], ['sph', C.mid, 'sphere / hemi head']];
          set.forEach(s => g.fn(p => r.tof(p, s[0]), s[1], s[0] === 'cyl' ? 3 : 2));
          g.line([[v.Pd, 0], [v.Pd, tmax]], C.mut, 1.2, [4, 4]);
          g.dot(v.Pd, r.tc, C.dk, 5.5);
          g.line([[0, v.tact], [pmax, v.tact]], C.warn, 1.4, [6, 4]);
          g.txt('plate ' + self.f(self.cvt(v.tact, 'mm')[0], 1) + ' ' + self.cvt(0, 'mm')[1], pmax * 0.99, v.tact + tmax * 0.02, C.warn, 'right', 10.5, 'bottom');
          g.line([[r.mawp, 0], [r.mawp, tmax]], C.warn, 1.2, [3, 3]);
          g.txt('MAWP', r.mawp - pmax * 0.01, tmax * 0.9, C.warn, 'right', 10.5);
          g.legend(set.map(s => ({ c: s[1], l: s[2] })));
        }
      },
      {
        id: 'sep',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const D = r.D || 1, L = r.Ltot || 1, horiz = v.orient === 'horiz';
  const gov = String(self.rget(r, 'governing constraint') || '');
  s.title(horiz ? 'Horizontal separator' : 'Vertical knockout drum', self.f(self.cvt(D * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' \u00d7 ' + self.f(L / D, 2) + ' L/D \u00b7 ' + gov);
  const avW = s.w - 200, avH = s.h - 96;
  if (horiz) {
    const sc = Math.min(avW / Math.max(L, 0.1), avH / Math.max(D, 0.1));
    const W = L * sc, H = D * sc, X = s.x + 62, Y = s.cy - H / 2 + 8;
    const pth = s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
    s.liquid(pth, X - H * 0.3, Y, W + H * 0.6, H, 0.5, C.soft3);
    s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
    s.L([[X + W * 0.72, Y + 3], [X + W * 0.72, Y + H * 0.42]], { col: C.mut, lw: 1, dash: [3, 3] });
    s.R(X + W * 0.68, Y + 4, W * 0.16, 9, { stroke: C.acc, lw: 1.1, dash: [3, 2] });
    s.T('mist pad', X + W * 0.76, Y + 22, { size: 10, col: C.acc });
    s.L([[X - 44, Y + H * 0.4], [X + 6, Y + H * 0.4]], { col: C.dk, lw: 2.6, arrow: true });
    s.T('feed', X - 44, Y + H * 0.4 - 12, { size: 10.5, col: C.dk });
    s.L([[X + W * 0.76, Y], [X + W * 0.76, Y - 32]], { col: C.mid, lw: 2.4, arrow: true });
    s.T('vapour', X + W * 0.78, Y - 26, { size: 10.5, col: C.mid });
    s.L([[X + W - 12, Y + H], [X + W - 12, Y + H + 32]], { col: C.acc, lw: 2.4, arrow: true });
    s.T('liquid', X + W - 10, Y + H + 26, { size: 10.5, col: C.acc });
    s.dim(X, Y + H + 48, X + W, Y + H + 48, self.f(self.cvt(L * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
    s.dim(X - 20, Y, X - 20, Y + H, self.f(self.cvt(D * 1000, 'mm')[0], 0), { col: C.mut });
  } else {
    const sc = Math.min(avH / Math.max(L, 0.1), avW / Math.max(D * 2.4, 0.1));
    const W = D * sc, H = L * sc, X = s.x + s.w * 0.32 - W / 2, Y = s.y + 40;
    const hold = self.cl01((self.rget(r, 'liquid height') || 0) / 1000 / Math.max(L, 0.1));
    const pth = s.vessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
    s.liquid(pth, X, Y, W, H, Math.max(0.08, hold), C.soft3);
    s.vessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
    s.R(X + 4, Y + H * 0.1, W - 8, 10, { stroke: C.acc, lw: 1.1, dash: [3, 2] });
    s.T('mist pad', X + W + 8, Y + H * 0.1 + 5, { size: 10, col: C.acc });
    s.L([[X - 76, Y + H * 0.42], [X, Y + H * 0.42]], { col: C.dk, lw: 2.6, arrow: true });
    s.T('feed', X - 76, Y + H * 0.42 - 12, { size: 10.5, col: C.dk });
    s.L([[X + W / 2, Y], [X + W / 2, Y - 30]], { col: C.mid, lw: 2.4, arrow: true });
    s.T('vapour', X + W / 2 + 8, Y - 24, { size: 10.5, col: C.mid });
    s.L([[X + W / 2, Y + H], [X + W / 2, Y + H + 30]], { col: C.acc, lw: 2.4, arrow: true });
    s.T('liquid', X + W / 2 + 8, Y + H + 24, { size: 10.5, col: C.acc });
    s.dim(X - 40, Y, X - 40, Y + H, self.f(self.cvt(L * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
    s.dim(X, Y + H + 44, X + W, Y + H + 44, self.f(self.cvt(D * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
  }
  const bx = s.x + s.w - 172;
  s.badge(bx, s.y + 6, 'Selected diameter', self.f(self.cvt(D * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], null, { w: 172 });
  s.badge(bx, s.y + 50, 'Governing constraint', gov, null, { w: 172 });
  s.badge(bx, s.y + 94, 'Holdup + surge', self.f(v.thold + v.tsurge, 1) + ' min', null, { w: 172 });
},
        schemNote: 'The drum is drawn at its sized diameter and length with the mist pad and nozzles in place. Push the holdup time up and the vessel stretches; raise K and the vapour space, not the liquid, sets the bore.',
        num: 'E-03', sec: EQ, name: 'Vapour\u2013liquid separator sizing',
        blurb: 'A knockout drum is two problems in one shell: the vapour must slow down enough for droplets to fall out, and the liquid must sit long enough for the level controller and the pump downstream. One of the two always sets the size \u2014 and it is worth knowing which.',
        howto: 'The rising curve is the diameter the vapour needs at each K value; the flat one is the diameter the liquid holdup needs. Whichever is higher governs, and their crossing is the point where the drum is balanced. A mist eliminator lets you move right along the K axis \u2014 that is what you are buying.',
        std: 'Souders\u2013Brown (1934); GPSA Engineering Data Book 14th ed. \u00a77; API 12J',
        eqs: [['u_{max} = K\\sqrt{\\frac{\\rho_l - \\rho_g}{\\rho_g}}', 'Souders–Brown terminal velocity'], ['A_{vap} = \\frac{\\dot V_g}{u_{max}},\\qquad D = \\sqrt{\\frac{4A}{\\pi f_{vap}}}', 'vapour area sets the diameter'], ['V_{liq} = \\dot V_l(t_{hold} + t_{surge}),\\qquad L = \\frac{V_{liq}}{f_{liq}A}', 'holdup and surge set the length']],
        notes: ['K = 0.107 m/s bare vertical drum; 0.10\u20130.12 with a mesh pad; halve it for vacuum or foaming service.', 'Horizontal drums sized at 50% liquid level with a 1.25 velocity credit.', 'Vertical height adds inlet, disengagement and mist-pad allowances per GPSA.'],
        params: [{ k: 'orient', label: 'Orientation', type: 'select', val: 'vert', options: [['vert', 'Vertical knockout drum'], ['horiz', 'Horizontal separator']] }, P('Wg', 'Vapour mass flow', 10, 200000, 10, 8000, null, 'kg/h'), P('rhog', 'Vapour density', 0.2, 60, 0.05, 2.4, null, 'kg/m\u00b3'), P('Ql', 'Liquid volumetric flow', 0.1, 500, 0.1, 15, 'Q'), P('rhol', 'Liquid density', 400, 1600, 5, 850, null, 'kg/m\u00b3'), P('K', 'Souders\u2013Brown K', 0.02, 0.16, 0.005, 0.107, null, 'm/s'), P('thold', 'Holdup time', 1, 30, 0.5, 5, null, 'min'), P('tsurge', 'Surge time', 0, 20, 0.5, 2, null, 'min'), P('ld', 'Target L/D', 2, 6, 0.1, 3, null, '\u2014')],
        compute: v => {
          const Vg = v.Wg / 3600 / v.rhog, Vl = v.Ql / 3600;
          const horiz = v.orient === 'horiz';
          const uOf = K => (horiz ? 1.25 * K : K) * Math.sqrt((v.rhol - v.rhog) / v.rhog);
          const fvap = horiz ? 0.5 : 1;
          const Dvap = K => Math.sqrt(4 * (Vg / uOf(K)) / (Math.PI * fvap));
          const Vliq = Vl * (v.thold + v.tsurge) * 60;
          const Dliq = horiz ? Math.pow(4 * Vliq / (Math.PI * 0.5 * v.ld), 1 / 3) : 0;
          const D = Math.max(Dvap(v.K), Dliq);
          const A = Math.PI * D * D / 4;
          const u = uOf(v.K);
          let Ltot, hold;
          if (horiz) { Ltot = Vliq / (0.5 * A); hold = Ltot; }
          else { hold = Vliq / A; Ltot = hold + 0.3 + 0.3 + Math.max(0.9, 0.6 * D) + 0.15; }
          const res = [{ l: 'Vapour volumetric flow', v: Vg * 3600, u: '', cv: 'Q', d: 1 }, { l: 'Allowable velocity u_max', v: u, u: '', cv: 'vel', d: 3 }, { l: 'Actual vapour velocity', v: Vg / (fvap * A), u: '', cv: 'vel', d: 3 }, { l: 'Diameter from vapour', v: Dvap(v.K) * 1000, u: '', cv: 'mm', d: 0 }];
          if (horiz) res.push({ l: 'Diameter from liquid holdup', v: Dliq * 1000, u: '', cv: 'mm', d: 0 });
          res.push({ l: 'Selected diameter', v: D * 1000, u: '', cv: 'mm', d: 0 }, { l: 'Governing constraint', s: Dvap(v.K) >= Dliq ? 'vapour capacity' : 'liquid holdup', u: '' }, { l: 'Holdup + surge volume', v: Vliq, u: '', cv: 'V', d: 3 }, { l: horiz ? 'Vessel length T\u2013T' : 'Liquid height', v: (horiz ? Ltot : hold) * 1000, u: '', cv: 'mm', d: 0 });
          if (!horiz) res.push({ l: 'Total vessel height', v: Ltot * 1000, u: '', cv: 'mm', d: 0 });
          res.push({ l: 'L/D ratio', v: Ltot / D, u: '\u2014', d: 2 }, { l: 'Vessel volume', v: Math.PI * D * D / 4 * Ltot, u: '', cv: 'V', d: 2 }, { l: 'Vapour residence time', v: (fvap * A * Ltot) / Vg, u: 's', d: 1 });
          const Lof = K => { const Dk = Math.max(Dvap(K), Dliq), Ak = Math.PI * Dk * Dk / 4; return horiz ? Vliq / (0.5 * Ak) : Vliq / Ak + 0.75 + Math.max(0.9, 0.6 * Dk); };
          return { Dvap: Dvap, Dliq: Dliq, D: D, Ltot: Ltot, Lof: Lof, res: res };
        },
        draw: (ctx, b, v, r) => {
          const kmin = 0.02, kmax = 0.16;
          const dmax = Math.max(r.Dvap(kmin), r.Dliq, r.D) * 1.06;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: kmin, xmax: kmax, ymin: 0, ymax: dmax, ml: 72, mr: 66 });
          g.grid('Souders\u2013Brown K  (m/s)', 'Required diameter  (' + self.cvt(0, 'mm')[1] + ')', 5, 5, t => self.f(t, 3), t => self.f(self.cvt(t * 1000, 'mm')[0], 0));
          g.title(v.orient === 'horiz' ? 'Horizontal separator \u2014 what governs the diameter' : 'Vertical drum \u2014 what governs the diameter');
          g.fn(k => r.Dvap(k), C.dk, 2.8);
          if (r.Dliq > 0) { g.line([[kmin, r.Dliq], [kmax, r.Dliq]], C.acc, 2.2, [7, 4]); g.txt('liquid holdup floor', kmax * 0.99, r.Dliq + dmax * 0.02, C.acc, 'right', 10.5, 'bottom'); }
          g.fill([[kmin, 0], [kmax, 0], [kmax, Math.max(r.Dliq, 0)], [kmin, Math.max(r.Dliq, 0)]], C.soft);
          g.line([[v.K, 0], [v.K, r.D]], C.mut, 1.2, [4, 4]);
          g.dot(v.K, r.D, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.D * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' \u00d7 ' + self.f(r.Ltot / r.D, 1) + ' L/D', v.K, r.D + dmax * 0.04, C.ink, 'center', 12);
          const lmax = Math.max(r.Lof(kmin), r.Ltot) * 1.12, lsc = dmax / lmax;
          g.fn(k => r.Lof(k) * lsc, C.mid, 2.2, [7, 4]);
          g.dot(v.K, r.Ltot * lsc, C.mid, 5);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          const st = Math.max(0.5, Math.round(lmax / 5 * 2) / 2);
          for (let L = 0; L <= lmax; L += st) { const py = g.Y(L * lsc); if (py >= g.y && py <= g.y + g.h) ctx.fillText(self.f(self.cvt(L, 'L')[0], 1), g.x + g.w + 10, py); }
          ctx.save(); ctx.translate(g.x + g.w + 48, g.y + g.h / 2); ctx.rotate(Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(((v.orient === 'horiz' ? 'Vessel length  (' : 'Vessel height  (') + self.cvt(0, 'L')[1] + ')').toUpperCase(), 0, 0); ctx.restore();
          ctx.restore();
          g.legend([{ c: C.dk, l: 'vapour capacity' }].concat(r.Dliq > 0 ? [{ c: C.acc, l: 'liquid holdup', d: [7, 4] }] : [], [{ c: C.mid, l: v.orient === 'horiz' ? 'length' : 'height', d: [7, 4] }]));
        }
      },
      {
        id: 'gasz', num: 'T-03', sec: TP, name: 'Natural gas compressibility & viscosity',
        blurb: 'Everything downstream of a gas measurement depends on Z. Pseudo-critical properties from specific gravity, sour-gas correction, then the Dranchuk\u2013Abou-Kassem equation solved for the compressibility factor \u2014 and Lee\u2013Gonzalez\u2013Eakin for viscosity on the same basis.',
        howto: 'The curves are Z against pressure at three temperatures, the Standing\u2013Katz shape: Z dips as pressure rises, bottoms out around 3\u20134 reduced pressure, then climbs past unity. Your point sits on the middle curve. Note how much flatter the hot curve is \u2014 that is why gas metering is far more forgiving downstream of a heater.',
        std: 'Sutton (1985) pseudo-criticals; Wichert\u2013Aziz (1972) sour correction; Dranchuk\u2013Abou-Kassem (1975); Lee\u2013Gonzalez\u2013Eakin (1966)',
        eqs: [['T_{pc} = 169.2 + 349.5\\gamma_g - 74.0\\gamma_g^{2}', 'Sutton pseudo-critical temperature (°R)'], ['P_{pc} = 756.8 - 131.0\\gamma_g - 3.6\\gamma_g^{2}', 'Sutton pseudo-critical pressure (psia)'], ['\\epsilon = 120(A^{0.9} - A^{1.6}) + 15(B^{0.5} - B^4)', 'Wichert–Aziz correction for CO₂ and H₂S'], ['Z = 1 + B_1\\rho_r + B_2\\rho_r^2 - A_9B_3\\rho_r^5 + A_{10}(1 + A_{11}\\rho_r^2)\\frac{\\rho_r^2}{T_{pr}^3}e^{-A_{11}\\rho_r^2},\\qquad \\rho_r = \\frac{0.27P_{pr}}{ZT_{pr}}', 'Dranchuk–Abou-Kassem — the two relations iterated together for Z']],
        notes: ['Valid for 0.2 \u2264 P_pr \u2264 30 and 1.0 < T_pr \u2264 3.0 \u2014 the usual pipeline envelope.', 'Sour correction applied before reduction; above 20% acid gas use an EOS instead.', 'Lee\u2013Gonzalez\u2013Eakin viscosity is fitted for hydrocarbon gases, not for high N\u2082 or CO\u2082.'],
        params: [P('sg', 'Gas specific gravity', 0.55, 1.2, 0.005, 0.65, null, '\u2014'), P('Pb', 'Pressure (abs)', 1, 400, 1, 60, null, 'bar a'), P('T', 'Temperature', -20, 200, 1, 40, 'T'), P('yN2', 'Nitrogen', 0, 20, 0.1, 0, null, 'mol %'), P('yCO2', 'Carbon dioxide', 0, 30, 0.1, 2, null, 'mol %'), P('yH2S', 'Hydrogen sulphide', 0, 30, 0.1, 0, null, 'mol %')],
        compute: v => {
          const A = [0.3265, -1.07, -0.5339, 0.01569, -0.05165, 0.5475, -0.7361, 0.1844, 0.1056, 0.6134, 0.721];
          const yc = v.yCO2 / 100, yh = v.yH2S / 100, yn = v.yN2 / 100;
          const sgHC = Math.max((v.sg - (yn * 0.9672 + yc * 1.5195 + yh * 1.1765)) / Math.max(1 - yn - yc - yh, 0.05), 0.55);
          let Tpc = 169.2 + 349.5 * sgHC - 74 * sgHC * sgHC;
          let Ppc = 756.8 - 131 * sgHC - 3.6 * sgHC * sgHC;
          const AA = yc + yh, BB = yh;
          const eps = AA > 0 ? 120 * (Math.pow(AA, 0.9) - Math.pow(AA, 1.6)) + 15 * (Math.sqrt(BB) - Math.pow(BB, 4)) : 0;
          const TpcC = Tpc - eps;
          const PpcC = Ppc * TpcC / (Tpc + BB * (1 - BB) * eps);
          const Zof = (barA, degC) => {
            const Ppr = (barA * 14.5038) / PpcC, Tpr = ((degC + 273.15) * 1.8) / TpcC;
            let Z = 1;
            for (let i = 0; i < 200; i++) {
              const rr = 0.27 * Ppr / (Z * Tpr);
              const Zn = 1 + (A[0] + A[1] / Tpr + A[2] / Math.pow(Tpr, 3) + A[3] / Math.pow(Tpr, 4) + A[4] / Math.pow(Tpr, 5)) * rr
                + (A[5] + A[6] / Tpr + A[7] / (Tpr * Tpr)) * rr * rr
                - A[8] * (A[6] / Tpr + A[7] / (Tpr * Tpr)) * Math.pow(rr, 5)
                + A[9] * (1 + A[10] * rr * rr) * (rr * rr / Math.pow(Tpr, 3)) * Math.exp(-A[10] * rr * rr);
              Z = Z + 0.55 * (Zn - Z);
              if (Math.abs(Zn - Z) < 1e-10) break;
            }
            return { Z: Z, Ppr: Ppr, Tpr: Tpr, rr: 0.27 * Ppr / (Z * Tpr) };
          };
          const d = Zof(v.Pb, v.T);
          const MW = v.sg * 28.9647;
          const rho = v.Pb * 1e5 * MW / (d.Z * 8314 * (v.T + 273.15));
          const TR = (v.T + 273.15) * 1.8;
          const rhoG = rho / 1000;
          const K = (9.379 + 0.01607 * MW) * Math.pow(TR, 1.5) / (209.2 + 19.26 * MW + TR);
          const X = 3.448 + 986.4 / TR + 0.01009 * MW;
          const Y = 2.447 - 0.2224 * X;
          const mu = 1e-4 * K * Math.exp(X * Math.pow(rhoG, Y));
          const Bg = 0.0283 * d.Z * (v.T + 273.15) / 288.15 * (1.013 / v.Pb);
          return {
            Zof: Zof, Z: d.Z,
            res: [{ l: 'Compressibility factor Z', v: d.Z, u: '\u2014', d: 4 }, { l: 'Molecular weight', v: MW, u: 'kg/kmol', d: 2 }, { l: 'Pseudo-critical T (corrected)', v: TpcC / 1.8 - 273.15, u: '', cv: 'T', d: 1 }, { l: 'Pseudo-critical P (corrected)', v: PpcC / 14.5038, u: 'bar a', d: 2 }, { l: 'Wichert\u2013Aziz \u03b5', v: eps / 1.8, u: 'K', d: 2 }, { l: 'Reduced pressure P_pr', v: d.Ppr, u: '\u2014', d: 3 }, { l: 'Reduced temperature T_pr', v: d.Tpr, u: '\u2014', d: 3 }, { l: 'Reduced density \u03c1_r', v: d.rr, u: '\u2014', d: 4 }, { l: 'Gas density', v: rho, u: '', cv: 'rho', d: 3 }, { l: 'Viscosity (Lee\u2013Gonzalez\u2013Eakin)', v: mu * 1000, u: '\u03bcPa\u00b7s', d: 2 }, { l: 'Viscosity', v: mu, u: 'cP', d: 5 }, { l: 'Formation volume factor B_g', v: Bg, u: 'm\u00b3/Sm\u00b3', d: 5 }, { l: 'Expansion ratio to standard', v: 1 / Math.max(Bg, 1e-9), u: 'Sm\u00b3/m\u00b3', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const pmax = Math.max(v.Pb * 1.6, 120);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: pmax, ymin: 0.55, ymax: 1.25, ml: 62 });
          g.grid('Pressure  (bar a)', 'Compressibility factor  Z', 5, 5, null, t => self.f(t, 2));
          g.title('Compressibility against pressure');
          g.line([[0, 1], [pmax, 1]], C.mut, 1.2, [3, 3]);
          g.txt('ideal gas', pmax * 0.99, 1.006, C.mut, 'right', 10.5, 'bottom');
          const temps = [Math.max(v.T - 40, -15), v.T, v.T + 60];
          const cols = [C.lt, C.dk, C.acc];
          temps.forEach((T, i) => {
            g.fn(p => r.Zof(Math.max(p, 0.5), T).Z, cols[i], i === 1 ? 3 : 1.8, i === 1 ? [] : [6, 4]);
            g.txt(self.f(self.cvt(T, 'T')[0], 0) + '\u00b0', pmax * 0.995, r.Zof(pmax, T).Z + 0.012, cols[i], 'right', 10.5, 'bottom');
          });
          g.line([[v.Pb, 0.55], [v.Pb, r.Z]], C.mut, 1.2, [4, 4]);
          g.dot(v.Pb, r.Z, C.acc, 5.5);
          g.txt('Z = ' + self.f(r.Z, 4), v.Pb, r.Z - 0.035, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'your temperature' }, { c: C.lt, l: 'colder', d: [6, 4] }, { c: C.acc, l: 'hotter', d: [6, 4] }]);
        }
      }
    ];
  }
