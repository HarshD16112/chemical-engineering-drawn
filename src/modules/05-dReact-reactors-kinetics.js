  dReact() {
    const self = this, C = this.C;
    const S = 'Reactors & Kinetics';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    return [
      {
        id: 'rev', num: 'R-01', sec: S, name: 'Reversible reaction A \u21cc B',
        blurb: 'A single first-order reversible reaction in a constant-volume batch reactor. The approach to equilibrium is exponential and its rate is set by the sum of the two rate constants, not by either one alone.',
        howto: 'Both curves relax onto the dashed equilibrium lines. Raising either constant steepens the approach; only their ratio moves where the curves land. Note that a slow reverse step still fixes the same equilibrium composition \u2014 it just takes longer to get there.',
        std: 'Classical batch kinetics \u2014 Levenspiel, Chemical Reaction Engineering, 3rd ed., Ch. 3',
        eqs: [['C_A(t) = C_A^{eq} + (C_{A0} - C_A^{eq})\\,e^{-(k_1+k_2)t}', 'exponential relaxation at rate k₁ + k₂'], ['K = \\frac{k_1}{k_2} = \\frac{C_B^{eq}}{C_A^{eq}}', 'the ratio alone fixes the endpoint'], ['X_{eq} = \\frac{K}{1+K}', 'maximum attainable conversion']],
        notes: ['Constant volume, isothermal, ideal mixing.', 'Both steps elementary and first order.', 'Relaxation time constant \u03c4 = 1/(k\u2081+k\u2082).'],
        params: [P('Ca0', 'Initial A concentration', 0.1, 5, 0.05, 1, null, 'mol/L'), P('k1', 'Forward rate constant k\u2081', 0.01, 2, 0.01, 0.3, null, 'min\u207b\u00b9'), P('k2', 'Reverse rate constant k\u2082', 0.005, 2, 0.005, 0.1, null, 'min\u207b\u00b9'), P('tmax', 'Time window', 2, 80, 1, 25, null, 'min')],
        compute: v => {
          const K = v.k1 / v.k2, Xe = K / (1 + K), Cae = v.Ca0 / (1 + K), kt = v.k1 + v.k2;
          return {
            K: K, Xe: Xe, Cae: Cae, kt: kt,
            res: [{ l: 'Equilibrium constant K', v: K, u: '\u2014' }, { l: 'Equilibrium conversion', v: Xe * 100, u: '%', d: 1 }, { l: 'C\u2090 at equilibrium', v: Cae, u: 'mol/L' }, { l: 'C\u1d47 at equilibrium', v: v.Ca0 - Cae, u: 'mol/L' }, { l: 'Time constant 1/(k\u2081+k\u2082)', v: 1 / kt, u: 'min' }, { l: 'Time to 95% of X\u1d49', v: Math.log(20) / kt, u: 'min' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: 0, ymax: v.Ca0 * 1.05 });
          g.grid('Time  t  (min)', 'Concentration  (mol/L)', 5, 5);
          g.title('Approach to equilibrium');
          const ca = t => r.Cae + (v.Ca0 - r.Cae) * Math.exp(-r.kt * t);
          g.fn(t => ca(t), C.dk, 2.4);
          g.fn(t => v.Ca0 - ca(t), C.acc, 2.4);
          g.line([[0, r.Cae], [v.tmax, r.Cae]], C.mut, 1, [4, 4]);
          g.line([[0, v.Ca0 - r.Cae], [v.tmax, v.Ca0 - r.Cae]], C.mut, 1, [4, 4]);
          const t95 = Math.min(Math.log(20) / r.kt, v.tmax);
          g.line([[t95, 0], [t95, ca(t95)]], C.lt, 1.2, [3, 3]);
          g.txt('95% of X\u1d49', t95, v.Ca0 * 0.06, C.mid, 'left', 11);
          g.legend([{ c: C.dk, l: 'C\u2090  reactant' }, { c: C.acc, l: 'C\u1d47  product' }, { c: C.mut, l: 'equilibrium', d: [4, 4], lw: 1 }]);
        }
      },
      {
        id: 'series', num: 'R-02', sec: S, name: 'Series reactions A \u2192 B \u2192 C',
        blurb: 'The classic intermediate-yield problem. B is made from A and destroyed to C, so its concentration passes through a maximum \u2014 the batch time that must be hit if B is the product you sell.',
        howto: 'The vertical marker is the optimum batch time. Push k\u2082 up and the peak shrinks and moves earlier; push k\u2081 up and the peak moves earlier but grows. When k\u2082 \u226b k\u2081 the intermediate never accumulates and the reactor behaves as if A went straight to C.',
        std: 'Denbigh series kinetics \u2014 Fogler, Elements of Chemical Reaction Engineering, Ch. 8',
        eqs: [['\\frac{C_B}{C_{A0}} = \\frac{k_1}{k_2-k_1}\\left(e^{-k_1t} - e^{-k_2t}\\right)', 'intermediate passes through a maximum'], ['t_{opt} = \\frac{\\ln(k_2/k_1)}{k_2-k_1}', 'batch time at peak B'], ['\\frac{C_{B,max}}{C_{A0}} = \\left(\\frac{k_1}{k_2}\\right)^{k_2/(k_2-k_1)}', 'peak yield depends only on k₂/k₁']],
        notes: ['Both steps irreversible and first order.', 'Constant volume, isothermal batch.', 'C\u1d9c obtained by difference from the total balance.'],
        params: [P('Ca0', 'Initial A concentration', 0.1, 5, 0.05, 1, null, 'mol/L'), P('k1', 'k\u2081  (A \u2192 B)', 0.01, 2, 0.01, 0.4, null, 'min\u207b\u00b9'), P('k2', 'k\u2082  (B \u2192 C)', 0.01, 2, 0.01, 0.15, null, 'min\u207b\u00b9'), P('tmax', 'Time window', 2, 80, 1, 25, null, 'min')],
        compute: v => {
          const eq = Math.abs(v.k1 - v.k2) < 1e-9;
          const topt = eq ? 1 / v.k1 : Math.log(v.k2 / v.k1) / (v.k2 - v.k1);
          const cb = t => eq ? v.Ca0 * v.k1 * t * Math.exp(-v.k1 * t) : v.Ca0 * v.k1 / (v.k2 - v.k1) * (Math.exp(-v.k1 * t) - Math.exp(-v.k2 * t));
          const cbm = cb(topt);
          return {
            topt: topt, cb: cb, cbm: cbm,
            res: [{ l: 'Optimum batch time', v: topt, u: 'min' }, { l: 'Maximum C\u1d47', v: cbm, u: 'mol/L' }, { l: 'Max yield of B', v: cbm / v.Ca0 * 100, u: '%', d: 1 }, { l: 'Conversion of A at t_opt', v: (1 - Math.exp(-v.k1 * topt)) * 100, u: '%', d: 1 }, { l: 'Rate ratio k\u2082/k\u2081', v: v.k2 / v.k1, u: '\u2014' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: 0, ymax: v.Ca0 * 1.05 });
          g.grid('Time  t  (min)', 'Concentration  (mol/L)', 5, 5);
          g.title('Intermediate yield in series kinetics');
          g.fn(t => v.Ca0 * Math.exp(-v.k1 * t), C.dk, 2.2);
          g.fn(t => r.cb(t), C.acc, 2.6);
          g.fn(t => v.Ca0 - v.Ca0 * Math.exp(-v.k1 * t) - r.cb(t), C.lt, 2.2);
          if (r.topt < v.tmax) {
            g.line([[r.topt, 0], [r.topt, r.cbm]], C.mid, 1.3, [4, 3]);
            g.dot(r.topt, r.cbm, C.acc, 5);
            g.txt('t\u2092\u209a\u209c = ' + r.topt.toFixed(2) + ' min', r.topt, r.cbm + v.Ca0 * 0.05, C.mid, 'center', 11.5);
          }
          g.legend([{ c: C.dk, l: 'A  reactant' }, { c: C.acc, l: 'B  intermediate' }, { c: C.lt, l: 'C  final product' }]);
        }
      },
      {
        id: 'parallel', num: 'R-03', sec: S, name: 'Parallel reactions & selectivity',
        blurb: 'Desired and undesired products competing for the same reactant. Because each path has its own order in A, the reactant concentration you choose to operate at decides which product wins.',
        howto: 'Left panel: how the three species evolve. Right panel: instantaneous selectivity against conversion. If the desired order is the higher one, selectivity falls as A is consumed \u2014 favour a batch or plug-flow reactor kept at high C\u2090. If it is the lower one, selectivity climbs, and a CSTR held at low C\u2090 is the better vessel.',
        std: 'Selectivity analysis \u2014 Fogler, Ch. 8; Levenspiel Ch. 7',
        eqs: [['-r_A = k_DC_A^{\\alpha} + k_UC_A^{\\beta}', 'both paths draw on the same reactant'], ['S_{D/U} = \\frac{r_D}{r_U} = \\frac{k_D}{k_U}C_A^{\\alpha-\\beta}', 'instantaneous selectivity'], ['\\tilde S = \\frac{N_D}{N_U}', 'overall selectivity, integrated over the batch']],
        notes: ['Isothermal constant-volume batch, integrated by RK4.', 'Selectivity here is instantaneous, not overall.', '\u03b1\u2081 > \u03b1\u2082 favours high C\u2090; \u03b1\u2081 < \u03b1\u2082 favours low C\u2090.'],
        params: [P('Ca0', 'Initial A concentration', 0.2, 5, 0.05, 2, null, 'mol/L'), P('k1', 'k\u2081  desired', 0.01, 2, 0.01, 0.25, null, 'L/mol\u00b7min'), P('k2', 'k\u2082  undesired', 0.01, 2, 0.01, 0.3, null, 'L/mol\u00b7min'), P('a1', 'Order \u03b1\u2081 (desired)', 0.5, 3, 0.1, 2, null, '\u2014'), P('a2', 'Order \u03b1\u2082 (undesired)', 0.5, 3, 0.1, 1, null, '\u2014'), P('tmax', 'Time window', 2, 100, 1, 30, null, 'min')],
        compute: v => {
          const f = (t, y) => { const ca = Math.max(y[0], 0); const rd = v.k1 * Math.pow(ca, v.a1), ru = v.k2 * Math.pow(ca, v.a2); return [-(rd + ru), rd, ru]; };
          const sol = self.rk4(f, [v.Ca0, 0, 0], 0, v.tmax, 400);
          const last = sol[sol.length - 1][1];
          const X = 1 - last[0] / v.Ca0;
          const S0 = v.k1 / v.k2 * Math.pow(v.Ca0, v.a1 - v.a2);
          const Sf = v.k1 / v.k2 * Math.pow(Math.max(last[0], 1e-9), v.a1 - v.a2);
          return {
            sol: sol,
            res: [{ l: 'Final conversion of A', v: X * 100, u: '%', d: 1 }, { l: 'Desired product D', v: last[1], u: 'mol/L' }, { l: 'Undesired product U', v: last[2], u: 'mol/L' }, { l: 'Overall selectivity D/U', v: last[1] / Math.max(last[2], 1e-12), u: '\u2014' }, { l: 'Instantaneous S at C\u2090\u2080', v: S0, u: '\u2014' }, { l: 'Instantaneous S at exit', v: Sf, u: '\u2014' }, { l: 'Yield of D on A fed', v: last[1] / v.Ca0 * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const gw = (b.w - 26) / 2;
          const g1 = self.mkG(ctx, { x: 0, y: 0, w: gw, h: b.h, xmin: 0, xmax: v.tmax, ymin: 0, ymax: v.Ca0 * 1.05, mr: 12 });
          g1.grid('Time  (min)', 'Concentration  (mol/L)', 5, 5);
          g1.title('Species profiles');
          g1.line(r.sol.map(s => [s[0], s[1][0]]), C.dk, 2.2);
          g1.line(r.sol.map(s => [s[0], s[1][1]]), C.acc, 2.6);
          g1.line(r.sol.map(s => [s[0], s[1][2]]), C.lt, 2.2);
          g1.legend([{ c: C.dk, l: 'A' }, { c: C.acc, l: 'D  desired' }, { c: C.lt, l: 'U  undesired' }]);
          const Sfn = ca => v.k1 / v.k2 * Math.pow(Math.max(ca, 1e-9), v.a1 - v.a2);
          let smax = 0;
          for (let i = 0; i <= 100; i++) smax = Math.max(smax, Sfn(v.Ca0 * (1 - i / 100 * 0.995)));
          const g2 = self.mkG(ctx, { x: gw + 26, y: 0, w: gw, h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: Math.min(smax * 1.1, 50), ml: 54, mr: 14 });
          g2.grid('Conversion of A', 'Instantaneous selectivity  S\u1d05/\u1d1c', 5, 5);
          g2.title('Selectivity vs conversion');
          g2.fn(X => Sfn(v.Ca0 * (1 - X)), C.acc, 2.6);
          g2.line([[0, 1], [1, 1]], C.mut, 1, [4, 4]);
          g2.txt('S = 1', 0.02, 1.06, C.mut, 'left', 11);
        }
      },
      {
        id: 'levenspiel',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Vp = self.rget(r, 'pfr volume') || 1, Vc = self.rget(r, 'cstr volume') || 1;
  const rat = Vc / Math.max(Vp, 1e-9);
  s.title('Same duty, two reactors', 'CSTR / PFR volume ratio ' + self.f(rat, 2));
  const big = Math.max(Vp, Vc), Hmax = Math.min(s.h - 96, 200);
  const cW = Math.max(60, 150 * Math.sqrt(self.cl01(Vc / big) * 0.85 + 0.15));
  const cH = Math.max(60, Hmax * (Vc / big > 0.15 ? Math.sqrt(Vc / big) : 0.4));
  const cx = s.x + s.w * 0.26, cy = s.y + 52;
  const pth = s.vessel(cx - cW / 2, cy, cW, cH, { stroke: C.acc, lw: 1.8, fill: C.soft });
  s.liquid(pth, cx - cW / 2, cy, cW, cH, 0.86, C.soft3);
  s.impeller(cx, cy - 24, cy + cH * 0.6, cW * 0.45, { col: C.acc });
  s.T('CSTR', cx, cy + cH + 18, { align: 'center', size: 12, col: C.ink, bold: true, caps: true });
  s.T(self.f(Vc, 1) + ' L', cx, cy + cH + 34, { align: 'center', size: 11, col: C.acc });
  s.L([[cx - cW / 2 - 44, cy + cH * 0.2], [cx - cW / 2, cy + cH * 0.2]], { col: C.mid, lw: 2.2, arrow: true });
  s.L([[cx, cy + cH], [cx, cy + cH + 4]], { col: C.mid, lw: 2.2 });
  const px = s.x + s.w * 0.68, tubeL = Math.min(s.w * 0.34, 230);
  const tubeD = Math.max(14, 54 * Math.sqrt(self.cl01(Vp / big) * 0.85 + 0.15));
  const ty = cy + cH / 2 - tubeD / 2;
  s.R(px - tubeL / 2, ty, tubeL, tubeD, { stroke: C.dk, lw: 1.8, fill: C.soft });
  for (let i = 0; i < 9; i++) { const xx = px - tubeL / 2 + tubeL * (i + 0.5) / 9; s.L([[xx - 7, ty + tubeD / 2], [xx + 7, ty + tubeD / 2]], { col: C.dk, lw: 1.2, arrow: true, asz: 5 }); }
  s.T('PFR', px, ty + tubeD + 26, { align: 'center', size: 12, col: C.ink, bold: true, caps: true });
  s.T(self.f(Vp, 1) + ' L', px, ty + tubeD + 42, { align: 'center', size: 11, col: C.dk });
  s.L([[px - tubeL / 2 - 40, ty + tubeD / 2], [px - tubeL / 2, ty + tubeD / 2]], { col: C.mid, lw: 2.2, arrow: true });
  s.L([[px + tubeL / 2, ty + tubeD / 2], [px + tubeL / 2 + 40, ty + tubeD / 2]], { col: C.mid, lw: 2.2, arrow: true });
  s.T('X = ' + self.f(v.X * 100, 0) + '%', px + tubeL / 2 + 42, ty + tubeD / 2 - 14, { size: 10.5, col: C.mid, align: 'right' });
  s.T('X = ' + self.f(v.X * 100, 0) + '%', cx + cW / 2 + 8, cy + cH - 6, { size: 10.5, col: C.mid });
  s.badge(s.x, s.y + 2, 'Extra volume for back-mixing', self.f((rat - 1) * 100, 0) + '%', 0.5 + 0.44 * self.cl01((rat - 1) / 4), { w: 206 });
},
        schemNote: 'Both vessels are drawn to the volume each one actually needs for the same conversion \u2014 the CSTR swells as order and conversion rise, while the plug-flow tube stays slim.',
        num: 'R-04', sec: S, name: 'CSTR vs PFR sizing \u2014 Levenspiel plot',
        blurb: 'Reactor volume read as an area. Plotting F\u2090\u2080/(\u2212r\u2090) against conversion turns the design equations into geometry: the plug-flow volume is the area under the curve, the stirred-tank volume the rectangle drawn to the exit conversion.',
        howto: 'The shaded area is the PFR volume; the outlined rectangle is the CSTR volume for the same duty. For normal kinetics the rectangle always exceeds the area \u2014 that gap is the price of back-mixing. Drive the order negative or autocatalytic and the curve develops a minimum, at which point the CSTR can be the smaller vessel.',
        std: 'Graphical design equations \u2014 Levenspiel Ch. 5; Fogler Ch. 2',
        eqs: [['V_{PFR} = F_{A0}\\int_0^X\\frac{dX}{-r_A}', 'area under the curve'], ['V_{CSTR} = \\frac{F_{A0}X}{(-r_A)_{exit}}', 'rectangle to the exit point'], ['C_A = C_{A0}\\,\\frac{1-X}{1+\\varepsilon X}', 'mole change in the gas phase']],
        notes: ['Isothermal, single reaction, negligible pressure drop.', '\u03b5 = y\u2090\u2080\u03b4 accounts for mole change in gas phase; set 0 for liquids.', 'Space time \u03c4 = V/v\u2080 reported for both vessels.'],
        params: [P('Ca0', 'Feed concentration C\u2090\u2080', 0.05, 5, 0.05, 1, null, 'mol/L'), P('v0', 'Volumetric feed rate', 0.5, 100, 0.5, 10, null, 'L/s'), P('k', 'Rate constant k', 0.01, 3, 0.01, 0.3, null, 'mixed'), P('n', 'Reaction order n', 0, 3, 0.1, 1, null, '\u2014'), P('eps', 'Expansion factor \u03b5', -0.5, 2, 0.05, 0, null, '\u2014'), P('X', 'Target conversion', 0.05, 0.95, 0.01, 0.8, null, '\u2014')],
        compute: v => {
          const Fa0 = v.Ca0 * v.v0;
          const rate = X => { const ca = v.Ca0 * (1 - X) / (1 + v.eps * X); return v.k * Math.pow(Math.max(ca, 1e-12), v.n); };
          const y = X => Fa0 / rate(X);
          const Vp = self.simp(y, 0, v.X, 400);
          const Vc = Fa0 * v.X / rate(v.X);
          return {
            y: y, Vp: Vp, Vc: Vc, Fa0: Fa0,
            res: [{ l: 'Molar feed F\u2090\u2080', v: Fa0, u: 'mol/s' }, { l: 'PFR volume', v: Vp, u: 'L' }, { l: 'CSTR volume', v: Vc, u: 'L' }, { l: 'Volume ratio CSTR/PFR', v: Vc / Vp, u: '\u2014' }, { l: 'PFR space time \u03c4', v: Vp / v.v0, u: 's' }, { l: 'CSTR space time \u03c4', v: Vc / v.v0, u: 's' }, { l: 'Exit rate \u2212r\u2090', v: rate(v.X), u: 'mol/L\u00b7s' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const xtop = Math.min(0.98, v.X + (1 - v.X) * 0.35);
          let ymax = 0;
          for (let i = 0; i <= 100; i++) ymax = Math.max(ymax, r.y(xtop * i / 100));
          ymax = ymax * 1.1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: xtop, ymin: 0, ymax: ymax });
          g.grid('Conversion  X', 'F\u2090\u2080 / (\u2212r\u2090)   (L)', 5, 5);
          g.title('Levenspiel plot \u2014 volume as area');
          const rect = [[0, 0], [v.X, 0], [v.X, r.y(v.X)], [0, r.y(v.X)]];
          g.fill(rect, C.soft);
          const area = [[0, 0]];
          for (let i = 0; i <= 120; i++) area.push([v.X * i / 120, r.y(v.X * i / 120)]);
          area.push([v.X, 0]);
          g.fill(area, C.soft2);
          g.line(rect.concat([[0, 0]]), C.acc, 1.6, [6, 4]);
          g.fn(X => r.y(X), C.dk, 2.6);
          g.dot(v.X, r.y(v.X), C.dk, 5);
          g.txt('V\u1d18\ua730\u0280', v.X * 0.45, r.y(v.X * 0.45) * 0.42, '#fff', 'center', 12.5);
          g.txt('CSTR rectangle', v.X, r.y(v.X) * 1.04, C.mid, 'right', 11.5, 'bottom');
          g.legend([{ c: C.dk, l: 'F\u2090\u2080/(\u2212r\u2090)' }, { c: C.acc, l: 'CSTR', d: [6, 4] }]);
        }
      },
      {
        id: 'multiplicity',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const ss = (r.ss || []).slice(0, 3);
  const R = 8.314, k0 = Math.pow(10, v.k0);
  s.title('CSTR with cooling', ss.length + ' steady state' + (ss.length === 1 ? '' : 's') + ' at \u03c4 ' + self.f(v.tau, 0) + ' s');
  const n = Math.max(1, ss.length);
  const pitch = Math.min(s.w / n, 230), W = Math.min(116, pitch - 56), H = Math.min(132, s.h - 130);
  const Tlo = Math.min.apply(null, ss.concat([v.T0, v.Ta])), Thi = Math.max.apply(null, ss.concat([v.T0 + 40]));
  ss.forEach((T, i) => {
    const kk = k0 * Math.exp(-v.E * 1000 / (R * T));
    const X = v.tau * kk / (1 + v.tau * kk);
    const dG = 1e5, stable = true;
    const cx = s.x + pitch * (i + 0.5), Y = s.y + 48;
    const tfr = 0.12 + 0.82 * self.cl01((T - Tlo) / Math.max(Thi - Tlo, 1));
    s.R(cx - W / 2 - 13, Y + 12, 13, H - 10, { stroke: s.temp(0.2), lw: 1.3, fill: s.temp(0.2, 0.22) });
    s.R(cx + W / 2, Y + 12, 13, H - 10, { stroke: s.temp(0.2), lw: 1.3, fill: s.temp(0.2, 0.22) });
    const pth = s.vessel(cx - W / 2, Y, W, H, { stroke: s.temp(tfr), lw: 2, fill: s.temp(tfr, 0.2) });
    s.impeller(cx, Y - 22, Y + H * 0.62, W * 0.44, { col: C.acc });
    s.plate(self.f(T, 0) + ' K', cx, Y + H * 0.34, { align: 'center', size: 13, col: s.temp(tfr) });
    s.plate('X ' + self.f(X * 100, 0) + '%', cx, Y + H * 0.34 + 18, { align: 'center', size: 11.5, col: C.ink });
    s.T(ss.length === 3 ? (i === 0 ? 'extinguished' : i === 1 ? 'unstable' : 'ignited') : 'operating point', cx, Y + H + 18, { align: 'center', size: 10.5, col: ss.length === 3 && i === 1 ? C.warn : C.mut, caps: true });
    s.L([[cx - W / 2 - 13 - 26, Y + 24], [cx - W / 2 - 13, Y + 24]], { col: s.temp(0.2), lw: 2, arrow: true });
    s.L([[cx - W / 2 - 30, Y - 14], [cx - W / 2 - 30, Y + 6], [cx - W / 2, Y + 6]], { col: C.mid, lw: 1.8, arrow: true });
    s.L([[cx, Y + H], [cx, Y + H + 6]], { col: C.mid, lw: 1.8 });
  });
  s.T('coolant at ' + self.f(v.Ta, 0) + ' K \u00b7 \u03ba ' + self.f(v.kap, 1), s.x, s.y + s.h - 12, { size: 10.5, col: C.mut });
  if (ss.length === 3) s.T('three solutions \u2014 the middle one cannot be held', s.x + s.w, s.y + s.h - 12, { size: 11, col: C.warn, bold: true, align: 'right' });
},
        schemNote: 'One vessel per steady state the heat balance admits, each tinted by its own temperature and carrying its conversion. Turn the cooling down and the extinguished and unstable branches disappear into one ignited reactor.',
        num: 'R-05', sec: S, name: 'Non-isothermal CSTR \u2014 steady-state multiplicity',
        blurb: 'Heat generated by reaction plotted against heat removed by the coolant and the feed. Where the S-shaped generation curve crosses the removal line the reactor can sit at steady state \u2014 sometimes at three temperatures at once.',
        howto: 'Slide the coolant temperature and watch the straight removal line translate across the sigmoid. Three crossings means three steady states: the outer two are stable, the middle one is not. Keep sliding and one of the outer intersections vanishes \u2014 the reactor ignites or blows out, which is exactly the runaway an operator must design against.',
        std: 'van Heerden analysis \u2014 Fogler Ch. 12; Aris, Elementary Chemical Reactor Analysis',
        eqs: [['Q_g = (-\\Delta H_r)F_{A0}X(T)', 'heat generated by reaction'], ['Q_r = UA(T-T_c) + F_{A0}C_p(T-T_0)', 'heat removed by coolant and feed'], ['X(T) = \\frac{\\tau k(T)}{1+\\tau k(T)},\\quad k = k_0e^{-E_a/RT}', 'CSTR conversion at temperature T']],
        notes: ['First-order liquid-phase reaction, constant density and C_p.', 'Steady states located by scanning for sign changes in G\u2212R.', 'Slope criterion dG/dT > dR/dT marks the unstable branch.'],
        params: [P('tau', 'Space time \u03c4', 0.5, 200, 0.5, 20, null, 's'), P('k0', 'log\u2081\u2080 k\u2080', 4, 16, 0.1, 10, null, '\u2014'), P('E', 'Activation energy E', 20, 150, 1, 75, null, 'kJ/mol'), P('dH', 'Heat of reaction \u2212\u0394H', 10, 400, 5, 60, null, 'kJ/mol'), P('Cp', 'Feed heat capacity C_p\u2080', 20, 400, 5, 180, null, 'J/mol\u00b7K'), P('T0', 'Feed temperature T\u2080', 250, 400, 1, 300, 'T'), P('Ta', 'Coolant temperature T\u2090', 250, 420, 1, 300, 'T'), P('kap', 'Cooling capacity \u03ba', 0, 8, 0.1, 1.5, null, '\u2014')],
        compute: v => {
          const R = 8.314, k0 = Math.pow(10, v.k0);
          const G = T => v.dH * 1000 * (v.tau * k0 * Math.exp(-v.E * 1000 / (R * T))) / (1 + v.tau * k0 * Math.exp(-v.E * 1000 / (R * T)));
          const Tc = (v.T0 + v.kap * v.Ta) / (1 + v.kap);
          const Rm = T => v.Cp * (1 + v.kap) * (T - Tc);
          const Tad = v.dH * 1000 / (v.Cp * (1 + v.kap));
          const Tlo = Tc - 40, Thi = Tc + 1.15 * Tad;
          const dT = (Thi - Tlo) / 1400;
          const ss = [];
          let prev = G(Tlo) - Rm(Tlo);
          for (let T = Tlo + dT; T <= Thi; T += dT) {
            const cu = G(T) - Rm(T);
            if (prev * cu <= 0 && isFinite(cu)) { const Tr = self.bis(t => G(t) - Rm(t), T - dT, T, 1e-7); if (isFinite(Tr)) ss.push(Tr); }
            prev = cu;
          }
          const res = [{ l: 'Steady states found', v: ss.length, u: '\u2014', d: 0 }, { l: 'Effective coolant T_c', v: Tc, u: 'K', d: 1 }, { l: 'Adiabatic rise \u0394T_ad', v: Tad, u: 'K', d: 1 }];
          ss.forEach((T, i) => {
            const kk = k0 * Math.exp(-v.E * 1000 / (R * T)), X = v.tau * kk / (1 + v.tau * kk);
            const dG = (G(T + 0.5) - G(T - 0.5)) / 1, dR = v.Cp * (1 + v.kap);
            res.push({ l: 'SS' + (i + 1) + ' T \u2014 ' + (dG < dR ? 'stable' : 'unstable'), v: T, u: 'K', d: 1 });
            res.push({ l: 'SS' + (i + 1) + ' conversion', v: X * 100, u: '%', d: 1 });
          });
          return { G: G, Rm: Rm, ss: ss, Tc: Tc, Tlo: Tlo, Thi: Thi, res: res };
        },
        draw: (ctx, b, v, r) => {
          const Tmin = r.Tlo, Tmax = r.Thi;
          let ymax = Math.max(r.G(Tmax), r.Rm(Tmax)) * 1.08;
          const mag = Math.pow(10, Math.floor(Math.log10(ymax)) - 1);
          ymax = Math.ceil(ymax / (5 * mag)) * 5 * mag;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: Math.round(Tmin), xmax: Math.round(Tmax), ymin: 0, ymax: ymax, ml: 78 });
          g.grid('Reactor temperature  T  (K)', 'Heat rate  (J per mol A fed)', 6, 5);
          g.title('van Heerden diagram \u2014 generation vs removal');
          g.fn(T => r.G(T), C.dk, 2.6);
          g.fn(T => r.Rm(T), C.acc, 2.2);
          r.ss.forEach((T, i) => {
            const dG = (r.G(T + 0.5) - r.G(T - 0.5)), dR = v.Cp * (1 + v.kap);
            const stable = dG < dR;
            g.dot(T, r.G(T), stable ? C.dk : C.bg, 5.5);
            if (!stable) { ctx.save(); ctx.strokeStyle = C.dk; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(g.X(T), g.Y(r.G(T)), 5.5, 0, 7); ctx.stroke(); ctx.restore(); }
            g.txt(T.toFixed(0) + ' K', T, r.G(T) + ymax * 0.045, C.mid, 'center', 11);
          });
          g.legend([{ c: C.dk, l: 'G(T)  generated' }, { c: C.acc, l: 'R(T)  removed' }]);
          g.ptxt('\u25cf stable   \u25cb unstable', g.x + 10, g.y + g.h - 14, C.mut, 'left', 11);
        }
      },
      {
        id: 'catalytic',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const eta = self.rget(r, 'effectiveness factor') || 1, phi = self.rget(r, 'thiele modulus') || 0;
  const Xe = self.rget(r, 'exit conversion') || 0, dP = self.rget(r, 'pressure drop') || 0;
  const Lb = self.rget(r, 'bed length') || 1;
  s.title('Packed tube', self.f(self.cvt(v.Dt, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' \u00d7 ' + self.f(self.cvt(Lb, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1] + ' of catalyst');
  const W = Math.max(56, Math.min(150, 34 + v.Dt / 8)), X = s.x + s.w * 0.3 - W / 2;
  const top = s.y + 40, bot = s.y + s.h - 52, H = bot - top;
  s.R(X, top, W, H, { stroke: C.ink, lw: 1.8 });
  const gr = ctx.createLinearGradient(0, top, 0, bot);
  gr.addColorStop(0, s.temp(0.42, 0.1)); gr.addColorStop(1, s.temp(0.42 + 0.4 * self.cl01(Xe / 100), 0.3));
  s.clipR(X + 1, top + 1, W - 2, H - 2, () => { ctx.fillStyle = gr; ctx.fillRect(X, top, W, H); });
  const pr = Math.max(2.4, Math.min(9, v.dp * 1.4));
  s.clipR(X + 2, top + 2, W - 4, H - 4, () => {
    let row = 0;
    for (let yy = top + pr + 2; yy < bot - pr; yy += pr * 1.85, row++) {
      for (let xx = X + pr + 2 + (row % 2 ? pr : 0); xx < X + W - pr; xx += pr * 2.05) {
        s.circ(xx, yy, pr, { stroke: 'rgba(29,31,32,0.42)', lw: 0.9, fill: 'rgba(29,31,32,0.05)' });
      }
    }
  });
  s.R(X, top, W, H, { stroke: C.ink, lw: 1.8 });
  s.L([[X + W / 2, top - 30], [X + W / 2, top]], { col: C.mid, lw: 2.6, arrow: true });
  s.T('F\u2090\u2080 ' + self.f(v.Fa0, 1) + ' mol/s', X + W / 2 + 8, top - 24, { size: 10.5, col: C.mid });
  s.T(self.f(self.cvt(v.P0, 'P')[0], 0) + ' ' + self.cvt(0, 'P')[1], X + W / 2 + 8, top - 10, { size: 10, col: C.mut });
  s.L([[X + W / 2, bot], [X + W / 2, bot + 30]], { col: s.temp(0.5 + 0.4 * self.cl01(Xe / 100)), lw: 2.6, arrow: true });
  s.T('X ' + self.f(Xe, 1) + '%', X + W / 2 + 8, bot + 24, { size: 11, col: C.ink, bold: true });
  s.dim(X + W + 26, top, X + W + 26, bot, self.f(self.cvt(Lb, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], { col: C.mut });
  const cx = s.x + s.w * 0.72, cy = s.y + 92, rr = Math.min(50, s.h * 0.17);
  s.circ(cx, cy, rr, { stroke: C.ink, lw: 1.6, fill: C.bg });
  const shell = Math.max(0.06, Math.min(1, eta));
  s.circ(cx, cy, rr * (1 - shell * 0.92), { stroke: 'rgba(29,31,32,0.3)', lw: 1, dash: [3, 3] });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.arc(cx, cy, rr * (1 - shell * 0.92), 0, 7, true);
  ctx.fillStyle = C.soft3; ctx.fill(); ctx.restore();
  s.T('pellet \u00b7 \u03b7 ' + self.f(eta, 3), cx, cy + rr + 16, { align: 'center', size: 11, col: C.ink });
  s.T('active shell', cx, cy + rr + 31, { align: 'center', size: 10, col: C.acc });
  s.T(self.f(self.cvt(v.dp, 'mm')[0], 1) + ' ' + self.cvt(0, 'mm')[1] + ' pellet', cx, cy - rr - 12, { align: 'center', size: 10.5, col: C.mut });
  s.badge(s.x + s.w - 150, s.y + s.h - 96, 'Thiele modulus \u03c6', self.f(phi, 2) + (phi > 4 ? ' \u2014 diffusion' : phi < 0.4 ? ' \u2014 kinetic' : ''), 0.5 + 0.44 * self.cl01((phi - 0.4) / 6), { w: 150 });
  s.badge(s.x + s.w - 150, s.y + s.h - 52, 'Pressure drop', self.f(self.cvt(dP, 'P')[0], 1) + ' ' + self.cvt(0, 'P')[1], 0.5 + 0.44 * self.cl01(dP / v.P0 / 0.3), { w: 150 });
},
        schemNote: 'Bed length, tube bore and pellet size are drawn to scale, and the colour deepens down the bed with conversion. The pellet on the right shades only the shell the reactant actually reaches \u2014 that shell is \u03b7.',
        num: 'R-06', sec: S, name: 'Catalytic packed bed \u2014 diffusion & pressure drop',
        blurb: 'A fixed bed where two things fight the reaction at once: pore diffusion inside the pellet, and pressure drop along the bed. The Thiele modulus sets how much of the pellet is actually working; the Ergun equation sets how fast the driving pressure decays.',
        howto: 'The rising curve is conversion, the falling one relative pressure. Increase pellet diameter and the effectiveness factor drops \u2014 less catalyst utilised \u2014 but pressure drop eases. Shrink the pellet and you recover the intrinsic rate at the cost of head. The best bed is where those two curves stop trading against each other.',
        std: 'Ergun (1952); Thiele (1939); Fogler Ch. 5 & 15; Froment & Bischoff Ch. 3',
        eqs: [['\\phi = R_p\\sqrt{k/D_e},\\quad \\eta = \\frac{3}{\\phi}\\left(\\coth\\phi - \\frac{1}{\\phi}\\right)', 'spherical pellet effectiveness'], ['\\frac{dX}{dW} = \\frac{\\eta k\'C_{A0}\\,p\\,(1-X)}{F_{A0}(1+\\varepsilon X)}', 'bed material balance'], ['\\frac{dp}{dW} = -\\frac{\\alpha(1+\\varepsilon X)}{2p},\\quad p = P/P_0', 'Ergun pressure drop']],
        notes: ['Isothermal, plug flow, first-order intrinsic kinetics.', 'Spherical pellets, equimolar counter-diffusion in pores.', '\u03b1 evaluated from the Ergun equation at inlet conditions.'],
        params: [P('dp', 'Pellet diameter', 0.5, 12, 0.1, 4, 'mm'), P('k', 'Intrinsic rate constant k', 0.5, 200, 0.5, 30, null, 's\u207b\u00b9'), P('De', 'Effective diffusivity \u00d710\u207b\u2077', 0.2, 40, 0.2, 5, null, 'm\u00b2/s'), P('W', 'Catalyst mass', 50, 5000, 25, 800, null, 'kg'), P('void', 'Bed voidage \u03b5_b', 0.3, 0.6, 0.01, 0.45, null, '\u2014'), P('G', 'Superficial mass flux', 0.2, 20, 0.1, 4, null, 'kg/m\u00b2s'), P('Dt', 'Tube diameter', 25, 1500, 5, 300, 'mm'), P('rhog', 'Gas density at inlet', 0.2, 40, 0.1, 3, 'rho'), P('mu', 'Gas viscosity', 0.005, 0.1, 0.001, 0.018, null, 'cP'), P('P0', 'Inlet pressure', 100, 5000, 25, 1000, 'P'), P('Fa0', 'Molar feed F\u2090\u2080', 0.1, 50, 0.1, 5, null, 'mol/s'), P('eps', 'Expansion factor \u03b5', -0.5, 2, 0.05, 0, null, '\u2014')],
        compute: v => {
          const Rp = v.dp / 2000, De = v.De * 1e-7;
          const phi = Rp * Math.sqrt(v.k / De);
          const eta = phi < 1e-6 ? 1 : (3 / phi) * (1 / Math.tanh(phi) - 1 / phi);
          const dpm = v.dp / 1000, mu = v.mu / 1000, Ac = Math.PI * Math.pow(v.Dt / 1000, 2) / 4;
          const eb = v.void, rhoc = 1200;
          const b0 = (v.G * (1 - eb) / (v.rhog * dpm * Math.pow(eb, 3))) * (150 * (1 - eb) * mu / dpm + 1.75 * v.G);
          const alpha = 2 * b0 / (Ac * rhoc * (1 - eb) * v.P0 * 1000);
          const Ca0 = v.P0 * 1000 / (8.314 * 500) * 0.2;
          const kp = eta * v.k / (rhoc * (1 - eb)) * 1000;
          const f = (W, y) => {
            const X = Math.min(y[0], 0.9999), p = Math.max(y[1], 1e-4);
            return [kp * Ca0 * p * (1 - X) / (v.Fa0 * (1 + v.eps * X)), -alpha * (1 + v.eps * X) / (2 * p)];
          };
          const sol = self.rk4(f, [0, 1], 0, v.W, 300);
          const last = sol[sol.length - 1][1];
          const ReP = v.G * dpm / (mu * (1 - eb));
          return {
            sol: sol, phi: phi, eta: eta,
            res: [{ l: 'Thiele modulus \u03c6', v: phi, u: '\u2014' }, { l: 'Effectiveness factor \u03b7', v: eta, u: '\u2014', d: 3 }, { l: 'Regime', s: phi < 0.4 ? 'kinetic control' : phi > 4 ? 'diffusion limited' : 'transition', u: '' }, { l: 'Particle Reynolds Re_p', v: ReP, u: '\u2014', d: 0 }, { l: 'Exit conversion', v: Math.min(last[0], 1) * 100, u: '%', d: 1 }, { l: 'Exit pressure ratio P/P\u2080', v: last[1], u: '\u2014', d: 3 }, { l: 'Pressure drop', v: v.P0 * (1 - last[1]), u: '', cv: 'P' }, { l: 'Bed length', v: v.W / (1200 * (1 - v.void) * Math.PI * Math.pow(v.Dt / 1000, 2) / 4), u: '', cv: 'L' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.W, ymin: 0, ymax: 1.02, mr: 60 });
          g.grid('Catalyst mass  W  (kg)', 'Conversion  X   /   P/P\u2080', 5, 5);
          g.title('Bed profile \u2014 conversion and pressure');
          g.line(r.sol.map(s => [s[0], Math.min(s[1][0], 1)]), C.dk, 2.6);
          g.line(r.sol.map(s => [s[0], s[1][1]]), C.acc, 2.2, [7, 4]);
          const last = r.sol[r.sol.length - 1][1];
          g.dot(v.W, Math.min(last[0], 1), C.dk, 5);
          g.dot(v.W, last[1], C.acc, 5);
          g.legend([{ c: C.dk, l: 'conversion  X' }, { c: C.acc, l: 'pressure  P/P\u2080', d: [7, 4] }]);
          const bx = g.x + 12, by = g.y + g.h - 44;
          g.panel(bx, by, 176, 34);
          g.ptxt('\u03c6 = ' + r.phi.toFixed(2) + '     \u03b7 = ' + r.eta.toFixed(3), bx + 10, by + 12, C.ink, 'left', 12);
          g.ptxt(r.phi < 0.4 ? 'kinetic control' : r.phi > 4 ? 'strong pore-diffusion limit' : 'transition regime', bx + 10, by + 25, C.mid, 'left', 11);
        }
      },
      {
        id: 'transport', num: 'R-07', sec: S, name: 'Transport limitations \u2014 criteria screen',
        blurb: 'Whether a measured rate is the intrinsic rate. Every packed-bed kinetics measurement carries three layers of transport resistance \u2014 the bed, the film around the pellet, the pores inside it \u2014 and each has a published criterion that says how much of the rate it is hiding. This screens all of them at once and tells you which experiment to run next.',
        howto: 'The curve is the effectiveness factor against Thiele modulus; the cross is your pellet. Anywhere left of \u03c6 \u2248 0.4 the whole pellet is working and the measured rate is intrinsic. Right of \u03c6 \u2248 4 you are on the \u03b7 = 3/\u03c6 asymptote and measuring diffusion, not chemistry \u2014 the apparent activation energy has halved. The table below is the full criteria set: shrink the particle to fix intraparticle failures, raise the flow to fix film ones, lengthen the bed to fix plug-flow ones.',
        std: 'Weisz & Prater (1954); Mears (1971); Carberry (1976); Anderson (1963); Wakao & Funazkri (1978); EUROKIN transport criteria protocol',
        eqs: [['\\Phi_{WP} = \\frac{r_v R_p^2}{D_eC_s}', 'Weisz\u2013Prater \u2014 observed rate against pore diffusion'], ['\\phi = R_p\\sqrt{k_v/D_e},\\quad \\eta = \\frac{3}{\\phi^2}\\left(\\frac{\\phi}{\\tanh\\phi}-1\\right)', 'Thiele modulus and spherical effectiveness'], ['Ca = \\frac{r_vR_p}{3k_fC_b},\\quad Sh = 2 + 1.1Re^{0.6}Sc^{1/3}', 'Carberry number from the film coefficient'], ['M_m = \\frac{r_{v,b}R_p}{nk_fC_b},\\quad M_h = \\frac{|\\Delta H_r|r_{v,b}R_pE_a}{h_fRT^2}', 'Mears interphase mass and heat criteria'], ['\\Delta T_{max} = \\frac{(-\\Delta H_r)D_eC_s}{\\lambda_p}', 'Prater temperature rise inside the pellet'], ['\\frac{L}{d_p} > 20\\ln\\frac{1}{1-X},\\quad \\frac{D_r}{d_p} \\geq 10', 'reactor-level plug-flow and wall criteria']],
        notes: ['First-order intrinsic kinetics, spherical pellet, n = 1 in the Mears criterion.', 'Film coefficients from Sh = 2 + 1.1Re\u2070\u00b7\u2076Sc\u00b9\u141f\u00b3 and the Nusselt analogue at Pr = 0.72.', 'Carrier gas treated as ideal at the stated molar mass; viscosity and diffusivities are inputs.', 'Axial dispersion taken as D_ax = \u00bd u_i d_p; bed pressure drop from Ergun.', 'Pellet conductivity \u03bb_p defaults to 0.2 W/m\u00b7K, typical of a porous oxide support.'],
        params: [P('dp', 'Particle diameter', 0.02, 3, 0.01, 0.3, 'mm'), P('T', 'Temperature', 50, 750, 5, 550, 'T'), P('Pb', 'Pressure', 0.5, 30, 0.1, 1, null, 'bar'), P('yA', 'Reactant mole fraction', 0.01, 1, 0.01, 0.25, null, '\u2014'), P('robs', 'Observed rate \u00d710\u207b\u2075', 0.05, 500, 0.05, 5, null, 'mol/g\u00b7s'), P('De', 'Effective diffusivity \u00d710\u207b\u2077', 0.1, 60, 0.1, 3, null, 'm\u00b2/s'), P('Dm', 'Molecular diffusivity \u00d710\u207b\u2075', 0.1, 60, 0.1, 2, null, 'm\u00b2/s'), P('rhop', 'Pellet density', 400, 3000, 10, 1450, null, 'kg/m\u00b3'), P('Ea', 'Activation energy', 20, 350, 1, 127, null, 'kJ/mol'), P('dH', 'Heat of reaction \u0394H_r', -400, 400, 5, 124, null, 'kJ/mol'), P('lamp', 'Pellet conductivity \u03bb_p', 0.05, 2, 0.01, 0.2, null, 'W/m\u00b7K'), P('Q', 'Feed flow (STP)', 1, 500, 1, 60, null, 'mL/min'), P('Dr', 'Reactor inner diameter', 2, 60, 0.5, 10, null, 'mm'), P('Lbed', 'Catalyst bed length', 5, 400, 1, 55, null, 'mm'), P('eb', 'Bed void fraction', 0.3, 0.6, 0.01, 0.42, null, '\u2014'), P('X', 'Observed conversion', 0.01, 0.6, 0.01, 0.1, null, '\u2014'), P('mu', 'Gas viscosity', 0.005, 0.12, 0.001, 0.03, null, 'cP')],
        compute: v => {
          const Rg = 8.314, TK = v.T + 273.15, Pa = v.Pb * 1e5;
          const dp = v.dp / 1000, Rp = dp / 2;
          const mu = v.mu / 1000, MW = 30e-3;
          const rho = Pa * MW / (Rg * TK);
          const Cb = v.yA * Pa / (Rg * TK);
          const rObs = v.robs * 1e-5;
          const rv = rObs * v.rhop * 1000;
          const rhob = v.rhop * (1 - v.eb), rvb = rObs * rhob * 1000;
          const De = v.De * 1e-7, Dm = v.Dm * 1e-5;
          const Ac = Math.PI * Math.pow(v.Dr / 1000, 2) / 4;
          const us = (v.Q * 1e-6 / 60) * (101325 / Pa) * (TK / 273.15) / Ac;
          const Re = rho * us * dp / mu, Sc = mu / (rho * Dm), Pr = 0.72;
          const cp = 1100, lamf = cp * mu / Pr;
          const Sh = 2 + 1.1 * Math.pow(Re, 0.6) * Math.pow(Sc, 1 / 3);
          const Nu = 2 + 1.1 * Math.pow(Re, 0.6) * Math.pow(Pr, 1 / 3);
          const kf = Sh * Dm / dp, hf = Nu * lamf / dp;
          const etaS = p => p < 0.01 ? 1 - p * p / 15 : (3 / (p * p)) * (p / Math.tanh(p) - 1);
          const WP = rv * Rp * Rp / (De * Cb);
          const kv = rv / Math.max(Cb, 1e-12);
          const phi = Rp * Math.sqrt(kv / De);
          const eta = etaS(phi);
          const Ca = rv * (Rp / 3) / (kf * Cb);
          const dHj = Math.abs(v.dH) * 1000, Ea = v.Ea * 1000;
          const Mm = rvb * Rp / (kf * Cb);
          const Mh = dHj * rvb * Rp * Ea / (hf * TK * TK * Rg);
          const And = dHj * rv * Rp * Rp * Ea / (v.lamp * TK * TK * Rg);
          const dTmax = dHj * De * Cb / v.lamp;
          const L = v.Lbed / 1000;
          const Ldp = L / dp, Ldpc = 20 * Math.log(1 / Math.max(1 - v.X, 1e-6));
          const Ddp = (v.Dr / 1000) / dp;
          const Dax = 0.5 * (us / v.eb) * dp, Bo = us * L / Dax;
          const dPf = ((150 * mu * us * Math.pow(1 - v.eb, 2) / (dp * dp * Math.pow(v.eb, 3))) + (1.75 * rho * us * us * (1 - v.eb) / (dp * Math.pow(v.eb, 3)))) * L / Pa * 100;
          const fmt = x => !isFinite(x) ? '\u2014' : Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(2) : x.toPrecision(3);
          const rows = [
            ['Bed', 'Plug flow  L/d\u209a', Ldp, '> ' + Ldpc.toFixed(1), Ldp > Ldpc],
            ['Bed', 'Wall effect  D_r/d\u209a', Ddp, '\u2265 10', Ddp >= 10],
            ['Bed', 'Axial dispersion  Bo', Bo, '> ' + Ldpc.toFixed(1), Bo > Ldpc],
            ['Bed', 'Pressure drop', dPf, '\u2264 20 %', dPf <= 20],
            ['Film', 'Carberry  Ca', Ca, '< 0.05', Ca < 0.05],
            ['Film', 'Mears mass  M_m', Mm, '< 0.15', Mm < 0.15],
            ['Film', 'Mears heat  M_h', Mh, '< 0.15', Mh < 0.15],
            ['Pellet', 'Weisz\u2013Prater  \u03a6_WP', WP, '< 1.0', WP < 1],
            ['Pellet', 'Thiele modulus  \u03c6', phi, '< 0.9', phi < 0.9],
            ['Pellet', 'Effectiveness  \u03b7', eta, '> 0.95', eta > 0.95],
            ['Pellet', 'Anderson heat', And, '< 0.75', And < 0.75],
            ['Pellet', 'Prater \u0394T_max', dTmax, '< 5 K', dTmax < 5]
          ];
          const nPass = rows.filter(r2 => r2[4]).length;
          const worst = rows.filter(r2 => !r2[4]);
          const fix = !worst.length ? 'all criteria satisfied \u2014 rate is intrinsic'
            : worst[0][0] === 'Pellet' ? 'crush the catalyst \u2014 vary d\u209a and look for a rate change'
              : worst[0][0] === 'Film' ? 'raise the flow at constant W/F \u2014 Koros\u2013Nowak or flow-rate test'
                : 'lengthen the bed or reduce d\u209a \u2014 restore plug flow';
          return {
            phi: phi, eta: eta, etaS: etaS, nPass: nPass, nTot: rows.length,
            res: [{ l: 'Thiele modulus \u03c6', v: phi, u: '\u2014', d: 3 }, { l: 'Effectiveness factor \u03b7', v: eta, u: '\u2014', d: 3 }, { l: 'Weisz\u2013Prater \u03a6_WP', v: WP, u: '\u2014', d: 3 }, { l: 'Regime', s: phi < 0.4 ? 'intrinsic kinetics' : phi > 4 ? 'pore-diffusion limited' : 'transition', u: '' }, { l: 'Apparent order in E_a', s: phi > 4 ? 'E_a,app \u2248 E_a/2' : 'E_a,app \u2248 E_a', u: '' }, { l: 'Particle Reynolds Re\u209a', v: Re, u: '\u2014', d: 2 }, { l: 'Sherwood Sh', v: Sh, u: '\u2014', d: 2 }, { l: 'Film coefficient k_f', v: kf, u: 'm/s', d: 3 }, { l: 'Carberry Ca', v: Ca, u: '\u2014', d: 4 }, { l: 'Prater \u0394T_max', v: dTmax, u: 'K', d: 2 }, { l: 'Bed \u0394P', v: dPf, u: '% of P', d: 2 }, { l: 'Criteria passed', s: nPass + ' of ' + rows.length, u: '' }, { l: 'Next experiment', s: fix, u: '' }],
            table: {
              title: 'Transport criteria \u2014 bed, film and pellet',
              head: ['Level', 'Criterion', 'Value', 'Limit', ''],
              rows: rows.map(r2 => [r2[0], r2[1], fmt(r2[2]), r2[3], r2[4] ? 'pass' : 'FAIL'])
            }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.01, xmax: 100, ymin: 0.01, ymax: 1.4, xlog: true, ylog: true, ml: 62, mr: 30 });
          g.grid('Thiele modulus  \u03c6', 'Effectiveness  \u03b7');
          g.title('Effectiveness factor \u2014 operating point');
          g.clip(() => {
            ctx.save();
            ctx.fillStyle = C.soft;
            ctx.fillRect(g.x, g.y, g.X(0.4) - g.x, g.h);
            ctx.fillStyle = C.soft2;
            ctx.fillRect(g.X(4), g.y, g.x + g.w - g.X(4), g.h);
            ctx.restore();
          });
          g.line([[0.4, 0.01], [0.4, 1.4]], 'rgba(29,31,32,0.22)', 1.1, [4, 4]);
          g.line([[4, 0.01], [4, 1.4]], 'rgba(29,31,32,0.22)', 1.1, [4, 4]);
          g.fn(p => Math.min(3 / p, 1.4), C.lt, 1.8, [7, 4]);
          g.fn(p => r.etaS(p), C.dk, 2.8);
          g.cross(r.phi, Math.max(Math.min(r.eta, 1.4), 0.01), C.acc, 9);
          g.dot(r.phi, Math.max(Math.min(r.eta, 1.4), 0.01), C.acc, 4);
          if (g.w > 300) {
            g.txt('intrinsic', 0.013, 0.016, C.mid, 'left', 11.5);
            g.txt('transition', 1.1, 0.016, C.mut, 'center', 11.5);
            g.txt('pore-diffusion limited', 78, 0.016, C.mid, 'right', 11.5);
            g.txt('\u03b7 = 3/\u03c6', 30, 0.16, C.mid, 'left', 11.5);
          }
          const bw = 188, bh = 50, bx = g.x + 12, by = g.y + g.h - bh - 30;
          g.panel(bx, by, bw, bh);
          g.ptxt('\u03c6 = ' + r.phi.toPrecision(3) + '     \u03b7 = ' + r.eta.toFixed(3), bx + 10, by + 15, C.ink, 'left', 12.5);
          g.ptxt(r.nPass + ' of ' + r.nTot + ' criteria pass', bx + 10, by + 34, r.nPass === r.nTot ? C.mid : C.warn, 'left', 12);
        }
      }
    ];
  }

  /* ══ PROCESS DYNAMICS & CONTROL ═══════════════════════════ */
