  dNewF() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const HT = 'Heat Transfer';
    const sw = (Re, rr) => Re < 2100 ? 64 / Math.max(Re, 1) : 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    return [
      {
        id: 'flatins', num: 'H-07', sec: HT, name: 'Insulation heat loss \u2014 flat surface',
        blurb: 'A wall, a tank side or an oven door. Without the curvature of a pipe the arithmetic is simpler, but the same fight happens: conduction through the blanket against convection and radiation off the face, and the surface film sets where the personnel-protection line falls.',
        howto: 'The falling curve is heat loss, the rising one surface temperature on the same axis. The dashed line is the 60 \u00b0C touch limit \u2014 where the surface curve crosses it is the minimum thickness for personnel protection, which is usually thicker than the economic answer.',
        std: 'ASTM C680 heat-transfer calculation; ISO 12241; surface coefficients from Churchill\u2013Chu',
        eqs: [['q = \\frac{T_{hot} - T_{amb}}{\\frac{x}{k} + \\frac{1}{h_s}}', 'series conduction and surface film, per unit area'], ['h_c = 1.31\\left|T_s - T_a\\right|^{1/3} \\text{ (vertical, still air)},\\qquad h_c = \\frac{Nu\\,k_a}{L}\\text{ (forced)}', 'natural or forced convection at the face'], ['h_r = \\varepsilon\\sigma\\frac{T_s^4 - T_a^4}{T_s - T_a}', 'linearised radiation coefficient'], ['T_s = T_a + \\frac{q}{h_c + h_r}', 'surface temperature — solved iteratively with the film']],
        notes: ['One-dimensional steady conduction; edge and stud losses ignored.', 'Surface emissivity 0.9 for painted or mastic finishes, 0.1\u20130.2 for bright aluminium cladding.', 'Personnel-protection limit taken as 60 \u00b0C on the ASTM C1055 basis.'],
        params: [{ k: 'orient', label: 'Surface', type: 'select', val: 'vert', options: [['vert', 'Vertical wall'], ['up', 'Horizontal, facing up'], ['down', 'Horizontal, facing down']] }, P('Th', 'Hot face temperature', 30, 900, 5, 320, 'T'), P('Ta', 'Ambient temperature', -30, 55, 1, 25, 'T'), P('x', 'Insulation thickness', 5, 400, 1, 75, 'mm'), P('kins', 'Insulation conductivity', 0.02, 0.3, 0.002, 0.045, null, 'W/m\u00b7K'), P('eps', 'Surface emissivity', 0.05, 0.98, 0.01, 0.9, null, '\u2014'), P('vw', 'Wind speed', 0, 15, 0.5, 0, null, 'm/s'), P('Ht', 'Characteristic height', 0.2, 12, 0.1, 2, 'L'), P('A', 'Surface area', 1, 5000, 1, 100, 'A'), P('cost', 'Energy cost', 1, 80, 0.5, 22, null, '\u20ac/MWh')],
        compute: v => {
          const sig = 5.670374e-8;
          const qOf = x => {
            let Ts = (v.Th + v.Ta) / 2, q = 0, hs = 10;
            for (let i = 0; i < 80; i++) {
              const dT = Math.max(Ts - v.Ta, 0.01);
              const cf = v.orient === 'up' ? 1.52 : v.orient === 'down' ? 0.59 : 1.31;
              let hc = cf * Math.pow(dT, 1 / 3);
              if (v.vw > 0.2) hc = Math.max(hc, 4 + 5.6 * Math.pow(v.vw, 0.78) / Math.pow(Math.max(v.Ht, 0.2), 0.22) * 0.55);
              const TsK = Ts + 273.15, TaK = v.Ta + 273.15;
              const hr = v.eps * sig * (Math.pow(TsK, 4) - Math.pow(TaK, 4)) / Math.max(TsK - TaK, 0.01);
              hs = hc + hr;
              const qn = (v.Th - v.Ta) / (x / 1000 / v.kins + 1 / hs);
              q = q + 0.5 * (qn - q);
              Ts = v.Ta + q / hs;
            }
            return { q: q, Ts: Ts, hs: hs };
          };
          const d = qOf(v.x);
          const xmin = (() => { const f = x => qOf(x).Ts - 60; return f(5) < 0 ? 5 : f(400) > 0 ? NaN : self.bis(f, 5, 400, 1e-3); })();
          const bare = (v.Th - v.Ta) * qOf(0.5).hs;
          const loss = d.q * v.A / 1000;
          return {
            qOf: qOf, d: d, xmin: xmin,
            res: [{ l: 'Heat loss per unit area', v: d.q, u: 'W/m\u00b2', d: 1 }, { l: 'Surface temperature', v: d.Ts, u: '', cv: 'T', d: 1 }, { l: 'Touch verdict', s: d.Ts > 60 ? 'above the 60 \u00b0C personnel limit' : 'safe to touch', u: '' }, { l: 'Minimum thickness for 60 \u00b0C', v: xmin, u: '', cv: 'mm', d: 0 }, { l: 'Surface coefficient h_s', v: d.hs, u: '', cv: 'U', d: 2 }, { l: 'Total heat loss', v: loss, u: '', cv: 'W', d: 2 }, { l: 'Bare-surface loss for comparison', v: bare * v.A / 1000, u: '', cv: 'W', d: 1 }, { l: 'Insulation effectiveness', v: (1 - d.q / Math.max(bare, 1e-6)) * 100, u: '%', d: 2 }, { l: 'Annual energy lost', v: loss * 8760 / 1000, u: 'MWh/yr', d: 2 }, { l: 'Annual cost of the loss', v: loss * 8760 / 1000 * v.cost, u: '\u20ac/yr', d: 0 }, { l: 'Saving over bare surface', v: (bare - d.q) * v.A / 1e6 * 8760 * v.cost, u: '\u20ac/yr', d: 0 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const xmax = 300;
          const q0 = r.qOf(5).q;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 5, xmax: xmax, ymin: 0, ymax: q0 * 1.05, ml: 70, mr: 58 });
          g.grid('Insulation thickness  (' + self.cvt(0, 'mm')[1] + ')', 'Heat loss  (W/m\u00b2)', 5, 5, t => self.f(self.cvt(t, 'mm')[0], 0));
          g.title('Thickness against loss and touch temperature');
          const tmaxs = r.qOf(5).Ts;
          g.fn(x => r.qOf(x).q, C.dk, 2.8);
          g.fn(x => r.qOf(x).Ts / tmaxs * q0 * 1.05, C.mid, 2.2, [6, 4]);
          const y60 = 60 / tmaxs * q0 * 1.05;
          g.line([[5, y60], [xmax, y60]], C.warn, 1.5, [5, 4]);
          g.txt('60 \u00b0C touch limit', xmax * 0.99, y60 + q0 * 0.02, C.warn, 'right', 10.5, 'bottom');
          ctx.save(); ctx.fillStyle = C.mid; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(f => ctx.fillText(self.f(self.cvt(tmaxs * f, 'T')[0], 0) + '\u00b0', g.x + g.w + 8, g.Y(q0 * 1.05 * f)));
          ctx.restore();
          g.line([[v.x, 0], [v.x, r.d.q]], C.mut, 1.3, [4, 4]);
          g.dot(v.x, r.d.q, C.acc, 5.5);
          g.txt(self.f(r.d.q, 0) + ' W/m\u00b2', v.x, r.d.q + q0 * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'heat loss' }, { c: C.mid, l: 'surface temp (right)', d: [6, 4] }]);
        }
      },
      {
        id: 'belldel',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const nb = self.rget(r, 'number of baffles') || 0, h = self.rget(r, 'shell-side coefficient') || 0;
  const Re = self.rget(r, 'shell-side reynolds') || 0;
  s.title('Shell with baffles', Math.round(nb) + ' baffles at ' + self.f(self.cvt(v.Lbc, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' \u00b7 cut ' + v.Bc + '%');
  const X = s.x + 58, W = s.w - 200, Y = s.y + 44, H = Math.min(150, s.h - 110);
  s.hvessel(X, Y, W, H, { stroke: C.ink, lw: 1.8, fill: C.bg });
  const nShow = Math.max(1, Math.min(14, Math.round(nb) || 1));
  const cut = self.cl01(v.Bc / 100);
  for (let i = 0; i < nShow; i++) {
    const px = X + W * (i + 1) / (nShow + 1);
    const up = i % 2 === 0;
    if (up) s.L([[px, Y + 2], [px, Y + H * (1 - cut)]], { col: C.acc, lw: 2.4 });
    else s.L([[px, Y + H * cut], [px, Y + H - 2]], { col: C.acc, lw: 2.4 });
  }
  const pts = [[X + 6, Y + H * 0.5]];
  for (let i = 0; i < nShow; i++) { const px = X + W * (i + 1) / (nShow + 1); const yy = i % 2 === 0 ? Y + H * (1 - cut * 0.55) : Y + H * cut * 0.55; pts.push([px - 5, yy]); pts.push([px + 5, yy]); }
  pts.push([X + W - 6, Y + H * 0.5]);
  s.L(pts, { col: C.dk, lw: 2.2, arrow: true });
  for (let i = 0; i < 5; i++) { const yy = Y + 16 + (H - 32) * i / 4; s.L([[X + 8, yy], [X + W - 8, yy]], { col: 'rgba(29,31,32,0.13)', lw: 1.4 }); }
  s.dim(X + W / (nShow + 1), Y + H + 18, X + W * 2 / (nShow + 1), Y + H + 18, self.f(self.cvt(v.Lbc, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
  s.dim(X - 20, Y, X - 20, Y + H, self.f(self.cvt(v.Ds, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
  s.L([[X + 24, Y - 30], [X + 24, Y]], { col: C.dk, lw: 3, arrow: true });
  s.T(self.f(v.W / 1000, 1) + ' t/h', X + 30, Y - 22, { size: 10.5, col: C.dk });
  s.L([[X + W - 24, Y + H], [X + W - 24, Y + H + 30]], { col: C.mid, lw: 3, arrow: true });
  for (let i = 0; i < Math.max(0, Math.round(v.Nss)); i++) { const px = X + W * 0.25 + i * 10; s.L([[px, Y + 6], [px, Y + 14]], { col: C.warn, lw: 2 }); s.L([[px, Y + H - 14], [px, Y + H - 6]], { col: C.warn, lw: 2 }); }
  const px2 = s.x + s.w - 104;
  s.badge(px2, s.y + 4, 'h shell-side', self.f(self.cvt(h, 'U')[0], 0), 0.5 + 0.4 * self.cl01(h / 3000), { w: 104 });
  s.badge(px2, s.y + 48, 'Re shell', self.f(Re, 0), null, { w: 104 });
  s.badge(px2, s.y + 92, 'Sealing strips', Math.round(v.Nss) + ' pairs', null, { w: 104 });
},
        schemNote: 'Baffle count and cut are drawn from the inputs, and the zig-zag is the shell-side path they force. Tighten the spacing and more baffles appear \u2014 the coefficient badge rises with the cross-flow velocity.',
        num: 'H-08', sec: HT, name: 'Shell-side rating \u2014 Bell\u2013Delaware',
        blurb: 'Kern\u2019s method pretends all the shell fluid crosses the bundle. Bell\u2013Delaware admits the truth: some of it leaks through the baffle clearances, some bypasses round the bundle, and the window turn is not cross-flow at all. Five correction factors, and together they can halve the ideal coefficient.',
        howto: 'Both curves move with baffle spacing. Close the baffles and the coefficient climbs but pressure drop climbs faster \u2014 the design sits where the two cross your budget. The J factor breakdown on the right of the results panel says which leak is costing you the most.',
        std: 'Bell (1963) Delaware method as presented in Taborek, HEDH \u00a73.3; TEMA 10th ed. clearances',
        eqs: [['h_s = h_{id}\\,J_cJ_lJ_bJ_sJ_r', 'ideal cross-flow coefficient times the five corrections'], ['h_{id} = j_iC_p\\left(\\frac{\\dot m_s}{S_m}\\right)Pr^{-2/3}\\left(\\frac{\\mu}{\\mu_w}\\right)^{0.14}', 'ideal bank coefficient from the Colburn factor'], ['S_m = L_{bc}\\left[\\left(D_s - D_{otl}\\right) + \\frac{D_{otl} - d_o}{P_t}\\left(P_t - d_o\\right)\\right]', 'cross-flow area at the shell centreline'], ['J_l = 0.44\\left(1 - r_s\\right) + \\left[1 - 0.44\\left(1 - r_s\\right)\\right]e^{-2.2r_{lm}}', 'baffle leakage correction — the biggest single penalty']],
        notes: ['Single-phase shell-side flow, no phase change and no impingement plate.', 'Clearances taken at TEMA standard values from the shell diameter.', 'J_r applies only below Re \u2248 100; above that it is unity.'],
        params: [PF('Ds', 'Shell inside diameter', 150, 2000, 5, 600, 'mm'), P('do', 'Tube outside diameter', 12, 38, 0.5, 19.05, 'mm'), P('Pt', 'Tube pitch', 15, 50, 0.5, 23.8, 'mm'), P('Lbc', 'Central baffle spacing', 50, 1200, 5, 240, 'mm'), P('Bc', 'Baffle cut', 15, 45, 1, 25, null, '% of D_s'), P('W', 'Shell-side flow', 1000, 500000, 500, 60000, null, 'kg/h'), P('rho', 'Density', 400, 1400, 5, 850, 'rho'), P('mu', 'Viscosity', 0.1, 100, 0.1, 2.5, null, 'cP'), P('cp', 'Specific heat', 1, 5, 0.05, 2.1, null, 'kJ/kg\u00b7K'), P('kf', 'Thermal conductivity', 0.05, 0.7, 0.005, 0.12, null, 'W/m\u00b7K'), P('Nss', 'Sealing strip pairs', 0, 6, 1, 2, null, '\u2014')],
        compute: v => {
          const Ds = v.Ds / 1000, do_ = v.do / 1000, Pt = v.Pt / 1000;
          const Dotl = Ds - 0.035;
          const mu = v.mu * 1e-3;
          const smOf = Lbc => Lbc * ((Ds - Dotl) + (Dotl - do_) / Pt * (Pt - do_));
          const Fc = 1 - 2 * (v.Bc / 100);
          const core = Lbc => {
            const Sm = smOf(Lbc);
            const G = (v.W / 3600) / Sm;
            const Re = G * do_ / mu;
            const ji = 0.37 * Math.pow(Math.max(Re, 1), -0.395);
            const Pr = v.cp * 1000 * mu / v.kf;
            const hid = ji * v.cp * 1000 * G * Math.pow(Pr, -2 / 3);
            const Jc = 0.55 + 0.72 * Fc;
            const Ssb = Ds * 0.0016 * (Math.PI - Math.acos(1 - 2 * v.Bc / 100));
            const Stb = Math.PI * do_ * 0.0004 * 200;
            const rs = Ssb / Math.max(Ssb + Stb, 1e-9), rlm = (Ssb + Stb) / Math.max(Sm, 1e-9);
            const Jl = 0.44 * (1 - rs) + (1 - 0.44 * (1 - rs)) * Math.exp(-2.2 * rlm);
            const Fsbp = (Ds - Dotl) * Lbc / Math.max(Sm, 1e-9);
            const Jb = v.Nss >= Math.floor(6 / 2) ? 1 : Math.exp(-1.35 * Fsbp * (1 - Math.pow(2 * v.Nss / 6, 1 / 3)));
            const Js = 1 - 0.05 * (1 - Lbc / 0.3);
            const Jr = Re < 100 ? Math.max(Math.pow(10 / 20, 0.18), 0.4) : 1;
            const h = hid * Jc * Jl * Math.min(Jb, 1) * Math.min(Math.max(Js, 0.7), 1) * Jr;
            const fi = 1.2 * Math.pow(Math.max(Re, 1), -0.19);
            const Nc = Ds * (1 - 2 * v.Bc / 100) / (Pt * 0.866);
            const dPid = 2 * fi * Nc * G * G / v.rho;
            const nb = Math.max(Math.round(2.5 / Lbc), 1);
            const dP = dPid * (nb - 1) * Jl * Math.min(Jb, 1) * 1.35 / 1000;
            return { Sm: Sm, G: G, Re: Re, hid: hid, Jc: Jc, Jl: Jl, Jb: Math.min(Jb, 1), Js: Math.min(Math.max(Js, 0.7), 1), Jr: Jr, h: h, dP: dP, nb: nb, Pr: Pr };
          };
          const d = core(v.Lbc / 1000);
          const kern = d.hid * 0.6;
          return {
            core: core, d: d,
            res: [{ l: 'Cross-flow area S_m', v: d.Sm, u: '', cv: 'A', d: 4 }, { l: 'Shell-side mass flux', v: d.G, u: 'kg/m\u00b2\u00b7s', d: 1 }, { l: 'Shell-side Reynolds number', v: d.Re, u: '\u2014', d: 0 }, { l: 'Prandtl number', v: d.Pr, u: '\u2014', d: 2 }, { l: 'Ideal coefficient h_id', v: d.hid, u: '', cv: 'U', d: 0 }, { l: 'J_c \u2014 baffle window', v: d.Jc, u: '\u2014', d: 4 }, { l: 'J_l \u2014 baffle leakage', v: d.Jl, u: '\u2014', d: 4 }, { l: 'J_b \u2014 bundle bypass', v: d.Jb, u: '\u2014', d: 4 }, { l: 'J_s \u2014 end baffle spacing', v: d.Js, u: '\u2014', d: 4 }, { l: 'J_r \u2014 laminar correction', v: d.Jr, u: '\u2014', d: 4 }, { l: 'Combined correction', v: d.h / Math.max(d.hid, 1e-9), u: '\u2014', d: 4 }, { l: 'Shell-side coefficient h_s', v: d.h, u: '', cv: 'U', d: 0 }, { l: 'Kern estimate for comparison', v: kern, u: '', cv: 'U', d: 0 }, { l: 'Number of baffles', v: d.nb, u: '\u2014', d: 0 }, { l: 'Shell-side pressure drop', v: d.dP, u: 'kPa', d: 1 }, { l: 'Verdict', s: d.Jl < 0.6 ? 'leakage is destroying the coefficient \u2014 tighten clearances or widen the baffles' : d.dP > 70 ? 'pressure drop is high \u2014 open the baffle spacing' : 'a balanced shell-side design', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const lmin = 0.05, lmax = Math.min(v.Ds / 1000, 1);
          let hmax = 0, pmax = 0;
          for (let i = 0; i <= 40; i++) { const L = lmin + (lmax - lmin) * i / 40; const c = r.core(L); hmax = Math.max(hmax, c.h); pmax = Math.max(pmax, c.dP); }
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: lmin * 1000, xmax: lmax * 1000, ymin: 0, ymax: hmax * 1.08, ml: 74, mr: 60 });
          g.grid('Baffle spacing  (' + self.cvt(0, 'mm')[1] + ')', 'Coefficient  (' + self.cvt(0, 'U')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'mm')[0], 0), t => self.f(self.cvt(t, 'U')[0], 0));
          g.title('Baffle spacing \u2014 coefficient against pressure drop');
          g.fn(L => r.core(L / 1000).h, C.dk, 2.8);
          g.fn(L => r.core(L / 1000).dP / Math.max(pmax, 1e-9) * hmax * 1.08, C.acc, 2.2, [6, 4]);
          ctx.save(); ctx.fillStyle = C.acc; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(f => ctx.fillText(self.f(pmax * f, 0) + ' kPa', g.x + g.w + 8, g.Y(hmax * 1.08 * f)));
          ctx.restore();
          g.dot(v.Lbc, r.d.h, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.d.h, 'U')[0], 0), v.Lbc, r.d.h + hmax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'h\u209b' }, { c: C.acc, l: '\u0394P (right)', d: [6, 4] }]);
        }
      },
      {
        id: 'dblpipe',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const nhp = Math.max(1, Math.round(self.rget(r, 'hairpins needed') || 1));
  const L = self.rget(r, 'length required') || 0, U = self.rget(r, 'overall coefficient') || 0;
  const Tc2 = self.rget(r, 'cold outlet temperature');
  const lo = Math.min(v.Tc1, v.Th2), hi = Math.max(v.Th1, Tc2 === undefined ? v.Tc1 : Tc2);
  const tf = T => 0.06 + 0.88 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  s.title('Hairpin bank', nhp + ' hairpin' + (nhp > 1 ? 's' : '') + ' \u00b7 ' + self.f(self.cvt(L, 'L')[0], 1) + ' ' + self.cvt(0, 'L')[1] + ' total');
  const show = Math.min(nhp, 6);
  const X = s.x + 70, W = s.w - 212;
  const top = s.y + 36, avail = s.h - 76;
  const pitch = Math.min(46, avail / Math.max(show, 1));
  for (let i = 0; i < show; i++) {
    const y1 = top + i * pitch + 8, y2 = y1 + pitch * 0.46;
    const u0 = i / show, u1 = (i + 1) / show;
    const ch = T0 => s.temp(tf(v.Th1 + (v.Th2 - v.Th1) * T0));
    s.L([[X, y1], [X + W - 16, y1]], { col: C.ink, lw: 7 });
    s.L([[X, y2], [X + W - 16, y2]], { col: C.ink, lw: 7 });
    s.L([[X, y1], [X + W - 16, y1]], { col: C.bg, lw: 4.6 });
    s.L([[X, y2], [X + W - 16, y2]], { col: C.bg, lw: 4.6 });
    s.L([[X, y1], [X + W - 16, y1]], { col: ch(u0), lw: 2.4 });
    s.L([[X, y2], [X + W - 16, y2]], { col: ch(u1), lw: 2.4 });
    s.L([[X + W - 16, y1], [X + W - 4, y1], [X + W - 4, y2], [X + W - 16, y2]], { col: ch((u0 + u1) / 2), lw: 2.4 });
    s.L([[X + W - 16, y1 - 3.5], [X + W, y1 - 3.5], [X + W, y2 + 3.5], [X + W - 16, y2 + 3.5]], { col: C.ink, lw: 1.3 });
    if (i < show - 1) s.L([[X, y2], [X - 12, y2], [X - 12, y1 + pitch], [X, y1 + pitch]], { col: C.mut, lw: 1.6 });
  }
  if (nhp > show) s.T('+ ' + (nhp - show) + ' more hairpins in series', X + W / 2, top + show * pitch + 16, { align: 'center', size: 11, col: C.acc });
  s.L([[X - 52, top + 8], [X, top + 8]], { col: s.temp(tf(v.Th1)), lw: 3, arrow: true });
  s.T('hot ' + self.f(self.cvt(v.Th1, 'T')[0], 0), X - 52, top - 4, { size: 10.5, col: s.temp(tf(v.Th1)) });
  s.L([[X - 52, top + (show - 1) * pitch + 8 + pitch * 0.46], [X, top + (show - 1) * pitch + 8 + pitch * 0.46]], { col: s.temp(tf(v.Tc1)), lw: 3, arrow: true });
  s.T('cold ' + self.f(self.cvt(v.Tc1, 'T')[0], 0), X - 52, top + (show - 1) * pitch + 8 + pitch * 0.46 + 13, { size: 10.5, col: s.temp(tf(v.Tc1)) });
  const px = s.x + s.w - 96;
  s.badge(px, s.y + 4, 'U overall', self.f(self.cvt(U, 'U')[0], 0), null, { w: 96 });
  s.badge(px, s.y + 48, 'Length', self.f(self.cvt(L, 'L')[0], 1) + ' ' + self.cvt(0, 'L')[1], null, { w: 96 });
  s.badge(px, s.y + 92, 'Hairpins', String(nhp), 0.5 + 0.4 * self.cl01(nhp / 12), { w: 96 });
},
        schemNote: 'One drawn hairpin per hairpin the duty needs, up to six, each shaded by where the stream temperature has reached. Raise the duty or drop U and the bank grows.',
        num: 'H-09', sec: HT, name: 'Double-pipe heat exchanger',
        blurb: 'A pipe inside a pipe \u2014 the exchanger you can build in a workshop and the only one that gives true countercurrent flow with no correction factor. Small duties, high pressures, and viscous or fouling fluids where a shell-and-tube would be a maintenance problem.',
        howto: 'The curves are the overall coefficient and the hairpin length required, both against inner-tube velocity. Coefficient climbs with velocity to the 0.8 power while pressure drop climbs with the square \u2014 the useful window is narrow, and you usually stop at the velocity your pump can afford.',
        std: 'Kern, Process Heat Transfer Ch. 6; Dittus\u2013Boelter and the annulus equivalent-diameter treatment',
        eqs: [['Nu = 0.023\\,Re^{0.8}Pr^{n},\\qquad n = 0.4\\text{ heating},\\ 0.3\\text{ cooling}', 'Dittus–Boelter for both streams'], ['D_e = \\frac{D_i^2 - d_o^2}{d_o}\\ \\text{(heat transfer)},\\qquad D_h = D_i - d_o\\ \\text{(pressure drop)}', 'the annulus needs two different equivalent diameters'], ['\\frac{1}{U_o} = \\frac{1}{h_o} + R_{f,o} + \\frac{d_o\\ln(d_o/d_i)}{2k_w} + \\frac{d_o}{d_i}\\left(\\frac{1}{h_i} + R_{f,i}\\right)', 'overall coefficient on the outside area'], ['L = \\frac{Q}{U_o\\pi d_o\\Delta T_{lm}}', 'length required — divided by the hairpin length gives the count']],
        notes: ['True countercurrent \u2014 no LMTD correction factor is needed.', 'Fully developed turbulent flow assumed; below Re \u2248 10\u2074 the coefficients are optimistic.', 'Fin tubes are not modelled; they are the usual answer when the annulus side is gas.'],
        params: [P('di', 'Inner tube ID', 10, 100, 0.5, 26.6, 'mm'), P('dout', 'Inner tube OD', 12, 110, 0.5, 33.4, 'mm'), P('Di', 'Outer pipe ID', 20, 200, 0.5, 52.5, 'mm'), P('Lhp', 'Hairpin leg length', 1, 12, 0.5, 6, 'L'), P('Wh', 'Hot stream flow', 100, 100000, 100, 8000, null, 'kg/h'), P('Th1', 'Hot inlet', 30, 350, 1, 150, 'T'), P('Th2', 'Hot outlet', 20, 340, 1, 70, 'T'), P('Wc', 'Cold stream flow', 100, 100000, 100, 12000, null, 'kg/h'), P('Tc1', 'Cold inlet', 5, 200, 1, 25, 'T'), P('cph', 'Hot specific heat', 1, 5, 0.05, 2.2, null, 'kJ/kg\u00b7K'), P('cpc', 'Cold specific heat', 1, 5, 0.05, 4.18, null, 'kJ/kg\u00b7K'), P('muh', 'Hot viscosity', 0.1, 200, 0.1, 1.2, null, 'cP'), P('muc', 'Cold viscosity', 0.1, 200, 0.1, 0.8, null, 'cP'), P('kh', 'Hot conductivity', 0.05, 0.7, 0.005, 0.13, null, 'W/m\u00b7K'), P('kc', 'Cold conductivity', 0.05, 0.7, 0.005, 0.62, null, 'W/m\u00b7K'), P('Rf', 'Total fouling resistance', 0, 0.001, 0.00005, 0.00035, null, 'm\u00b2K/W')],
        compute: v => {
          const di = v.di / 1000, dou = Math.max(v.dout / 1000, v.di / 1000 + 0.002), Di = Math.max(v.Di / 1000, dou + 0.004);
          const Ai = Math.PI * di * di / 4, Aann = Math.PI * (Di * Di - dou * dou) / 4;
          const De = (Di * Di - dou * dou) / dou, Dh = Di - dou;
          const Q = v.Wh / 3600 * v.cph * (v.Th1 - v.Th2);
          const Tc2 = v.Tc1 + Q / (v.Wc / 3600 * v.cpc);
          const dt1 = v.Th1 - Tc2, dt2 = v.Th2 - v.Tc1;
          const lmtd = Math.abs(dt1 - dt2) < 1e-6 ? dt1 : (dt1 - dt2) / Math.log(dt1 / dt2);
          const rhoh = 850, rhoc = 995;
          const hIn = vel => { const Re = rhoh * vel * di / (v.muh * 1e-3); const Pr = v.cph * 1000 * v.muh * 1e-3 / v.kh; return 0.023 * Math.pow(Math.max(Re, 1), 0.8) * Math.pow(Pr, 0.3) * v.kh / di; };
          const velIn = (v.Wh / 3600 / rhoh) / Ai;
          const velAn = (v.Wc / 3600 / rhoc) / Aann;
          const ReA = rhoc * velAn * De / (v.muc * 1e-3), PrA = v.cpc * 1000 * v.muc * 1e-3 / v.kc;
          const ho = 0.023 * Math.pow(Math.max(ReA, 1), 0.8) * Math.pow(PrA, 0.4) * v.kc / De;
          const Uof = vel => 1 / (1 / ho + v.Rf + dou * Math.log(dou / di) / (2 * 45) + (dou / di) / hIn(vel));
          const U = Uof(velIn);
          const L = Q * 1000 / (U * Math.PI * dou * Math.max(lmtd, 0.1));
          const nhp = Math.ceil(L / (2 * v.Lhp));
          const Rei = rhoh * velIn * di / (v.muh * 1e-3);
          const fi = sw(Rei, 0.00005), fa = sw(rhoc * velAn * Dh / (v.muc * 1e-3), 0.00005);
          const dPi = fi * (L / di) * rhoh * velIn * velIn / 2 / 1000;
          const dPa = fa * (L / Dh) * rhoc * velAn * velAn / 2 / 1000;
          return {
            Uof: Uof, hIn: hIn, U: U, L: L, velIn: velIn, lmtd: lmtd, Q: Q, ho: ho,
            res: [{ l: 'Duty', v: Q, u: '', cv: 'W', d: 1 }, { l: 'Cold outlet temperature', v: Tc2, u: '', cv: 'T', d: 1 }, { l: 'LMTD (true countercurrent)', v: lmtd, u: '', cv: 'dT', d: 2 }, { l: 'Inner-tube velocity', v: velIn, u: '', cv: 'vel', d: 2 }, { l: 'Inner-tube Reynolds number', v: Rei, u: '\u2014', d: 0 }, { l: 'Inner coefficient h_i', v: hIn(velIn), u: '', cv: 'U', d: 0 }, { l: 'Annulus velocity', v: velAn, u: '', cv: 'vel', d: 2 }, { l: 'Annulus Reynolds number', v: ReA, u: '\u2014', d: 0 }, { l: 'Annulus coefficient h_o', v: ho, u: '', cv: 'U', d: 0 }, { l: 'Heat-transfer equivalent diameter', v: De * 1000, u: '', cv: 'mm', d: 1 }, { l: 'Overall coefficient U_o', v: U, u: '', cv: 'U', d: 1 }, { l: 'Length required', v: L, u: '', cv: 'L', d: 2 }, { l: 'Hairpins needed', v: nhp, u: '\u2014', d: 0 }, { l: 'Outside area', v: Math.PI * dou * L, u: '', cv: 'A', d: 2 }, { l: 'Inner-tube pressure drop', v: dPi, u: 'kPa', d: 1 }, { l: 'Annulus pressure drop', v: dPa, u: 'kPa', d: 1 }, { l: 'Verdict', s: nhp > 8 ? 'too many hairpins \u2014 a shell-and-tube is cheaper here' : Rei < 8000 ? 'inner side is barely turbulent \u2014 the coefficient is optimistic' : 'a sensible double-pipe duty', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const vmax = Math.max(r.velIn * 2.2, 3);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.2, xmax: vmax, ymin: 0, ymax: r.Uof(vmax) * 1.08, ml: 74, mr: 62 });
          g.grid('Inner-tube velocity  (' + self.cvt(0, 'vel')[1] + ')', 'Overall U  (' + self.cvt(0, 'U')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'vel')[0], 1), t => self.f(self.cvt(t, 'U')[0], 0));
          g.title('Velocity buys coefficient \u2014 at a price');
          const Umax = r.Uof(vmax) * 1.08;
          const Lof = vel => r.Q * 1000 / (r.Uof(vel) * Math.PI * (v.dout / 1000) * Math.max(r.lmtd, 0.1));
          const Lmax = Lof(0.2);
          g.fn(vel => r.Uof(vel), C.dk, 2.8);
          g.fn(vel => Lof(vel) / Lmax * Umax, C.mid, 2.2, [6, 4]);
          ctx.save(); ctx.fillStyle = C.mid; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(f => ctx.fillText(self.f(self.cvt(Lmax * f, 'L')[0], 0) + ' ' + self.cvt(0, 'L')[1], g.x + g.w + 8, g.Y(Umax * f)));
          ctx.restore();
          g.dot(r.velIn, r.U, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.U, 'U')[0], 0), r.velIn, r.U + Umax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'U\u2092' }, { c: C.mid, l: 'length (right)', d: [6, 4] }]);
        }
      },
      {
        id: 'agitht', num: 'H-10', sec: HT, name: 'Agitated vessel heat transfer',
        blurb: 'A jacket or an internal coil, with the impeller doing the work the pump would do in an exchanger. The inside film scales with agitator speed to the two-thirds power, so doubling the speed buys about 60% more coefficient \u2014 and eight times the shaft power.',
        howto: 'The rising curve is the process-side film coefficient against agitator speed and the flatter one the overall U, which stops responding once the jacket or the wall becomes the limiting resistance. Where the curves diverge is the point at which more agitation is wasted money.',
        std: 'Chilton, Drew & Jebens (1944) jacket correlation; Oldshue, Fluid Mixing Technology; Perry\u2019s \u00a711 & \u00a718',
        eqs: [['Nu = \\frac{h_iD_T}{k} = 0.74\\,Re^{2/3}Pr^{1/3}\\left(\\frac{\\mu}{\\mu_w}\\right)^{0.14}', 'jacketed wall, turbine impeller'], ['Nu = 0.87\\,Re^{0.62}Pr^{1/3}\\left(\\frac{\\mu}{\\mu_w}\\right)^{0.14}', 'helical coil in the vessel'], ['Re = \\frac{\\rho ND_a^2}{\\mu}', 'impeller Reynolds number'], ['t = \\frac{Mc_p}{UA}\\ln\\frac{T_{med} - T_0}{T_{med} - T_1}', 'batch heating time at constant medium temperature']],
        notes: ['Baffled vessel, single impeller, Newtonian liquid.', 'Wall viscosity correction taken as unity \u2014 apply it for heavy oils and polymer solutions.', 'Jacket-side coefficient entered directly; a half-pipe jacket runs 2\u20133 times a plain annular one.'],
        params: [{ k: 'srv', label: 'Heat-transfer surface', type: 'select', val: 'jacket', options: [['jacket', 'Jacketed wall'], ['coil', 'Helical coil']] }, P('T', 'Vessel diameter', 0.3, 6, 0.05, 1.8, 'L'), P('dt', 'Impeller / tank diameter', 0.2, 0.7, 0.01, 0.35, null, '\u2014'), P('N', 'Agitator speed', 10, 400, 1, 90, null, 'rpm'), P('Z', 'Liquid depth / diameter', 0.5, 2, 0.05, 1, null, '\u2014'), P('rho', 'Liquid density', 600, 1600, 10, 950, 'rho'), P('mu', 'Liquid viscosity', 0.5, 5000, 0.5, 40, null, 'cP'), P('cp', 'Specific heat', 1, 5, 0.05, 2.4, null, 'kJ/kg\u00b7K'), P('kf', 'Thermal conductivity', 0.05, 0.7, 0.005, 0.16, null, 'W/m\u00b7K'), P('hj', 'Jacket-side coefficient', 200, 8000, 50, 2500, null, 'W/m\u00b2K'), P('tw', 'Wall thickness', 3, 40, 0.5, 10, 'mm'), P('kw', 'Wall conductivity', 10, 400, 1, 16, null, 'W/m\u00b7K'), P('Rf', 'Fouling, both sides', 0, 0.001, 0.00005, 0.0003, null, 'm\u00b2K/W'), P('T0', 'Batch start temperature', 0, 150, 1, 20, 'T'), P('T1', 'Batch target temperature', 10, 250, 1, 90, 'T'), P('Tm', 'Medium temperature', 20, 300, 1, 140, 'T')],
        compute: v => {
          const Da = v.dt * v.T, Zl = v.Z * v.T, mu = v.mu * 1e-3;
          const Pr = v.cp * 1000 * mu / v.kf;
          const hiOf = rpm => {
            const Re = v.rho * (rpm / 60) * Da * Da / mu;
            const c = v.srv === 'coil' ? [0.87, 0.62] : [0.74, 2 / 3];
            return c[0] * Math.pow(Math.max(Re, 1), c[1]) * Math.pow(Pr, 1 / 3) * v.kf / v.T;
          };
          const Uof = rpm => 1 / (1 / hiOf(rpm) + v.Rf + v.tw / 1000 / v.kw + 1 / v.hj);
          const hi = hiOf(v.N), U = Uof(v.N);
          const Ajac = Math.PI * v.T * Zl;
          const A = v.srv === 'coil' ? Ajac * 0.55 : Ajac;
          const V = Math.PI / 4 * v.T * v.T * Zl;
          const M = V * v.rho;
          const dr = (v.Tm - v.T0) / Math.max(v.Tm - v.T1, 0.5);
          const t = dr > 1 ? M * v.cp * 1000 / (U * A) * Math.log(dr) / 60 : NaN;
          const Re = v.rho * (v.N / 60) * Da * Da / mu;
          const Q0 = U * A * (v.Tm - v.T0) / 1000;
          return {
            hiOf: hiOf, Uof: Uof, hi: hi, U: U, A: A,
            res: [{ l: 'Impeller diameter', v: Da, u: '', cv: 'L', d: 3 }, { l: 'Impeller Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Prandtl number', v: Pr, u: '\u2014', d: 1 }, { l: 'Process-side coefficient h_i', v: hi, u: '', cv: 'U', d: 0 }, { l: 'Overall coefficient U', v: U, u: '', cv: 'U', d: 1 }, { l: 'Controlling resistance', s: 1 / hi > 1 / v.hj && 1 / hi > v.Rf ? 'process side \u2014 more agitation still helps' : 1 / v.hj > v.Rf ? 'jacket side \u2014 improve the medium flow, not the agitator' : 'fouling \u2014 clean it', u: '' }, { l: 'Heat-transfer area', v: A, u: '', cv: 'A', d: 2 }, { l: 'Batch volume', v: V, u: '', cv: 'V', d: 2 }, { l: 'Batch mass', v: M / 1000, u: 't', d: 2 }, { l: 'Initial duty', v: Q0, u: '', cv: 'W', d: 1 }, { l: 'Heat-up time', v: t, u: 'min', d: 1 }, { l: 'Time at double the speed', v: dr > 1 ? M * v.cp * 1000 / (Uof(v.N * 2) * A) * Math.log(dr) / 60 : NaN, u: 'min', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const nmax = Math.max(v.N * 2.2, 60);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 5, xmax: nmax, ymin: 0, ymax: r.hiOf(nmax) * 1.08, ml: 76 });
          g.grid('Agitator speed  (rpm)', 'Coefficient  (' + self.cvt(0, 'U')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'U')[0], 0));
          g.title('Process film against the overall coefficient');
          g.fn(n => r.hiOf(n), C.dk, 2.8);
          g.fn(n => r.Uof(n), C.acc, 2.6, [6, 4]);
          g.line([[5, v.hj], [nmax, v.hj]], C.mut, 1.3, [3, 3]);
          g.txt('jacket-side ceiling', nmax * 0.99, v.hj * 1.03, C.mut, 'right', 10.5, 'bottom');
          g.line([[v.N, 0], [v.N, r.hi]], C.mut, 1.3, [4, 4]);
          g.dot(v.N, r.hi, C.dk, 5);
          g.dot(v.N, r.U, C.acc, 5.5);
          g.txt('U = ' + self.f(self.cvt(r.U, 'U')[0], 0), v.N, r.U - r.hiOf(nmax) * 0.06, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'h\u1d62 process side' }, { c: C.acc, l: 'overall U', d: [6, 4] }]);
        }
      },
      {
        id: 'condflash', num: 'H-11', sec: HT, name: 'Condensate flash recovery',
        blurb: 'Hot condensate dropped to a lower pressure cannot stay liquid \u2014 part of it boils on the way through the trap. That flash steam is free low-pressure steam if you catch it, and a visible plume off the vent if you do not.',
        howto: 'The curve is flash fraction against flash-vessel pressure for your condensate. It is steepest at the low-pressure end, which is why the first stage of let-down recovers most of the value. The marker shows what your vessel actually makes, and the results turn that into a fuel saving.',
        std: 'IAPWS-IF97 properties; flash calculation per Spirax Sarco / TLV steam engineering practice',
        eqs: [['x = \\frac{h_{f,1} - h_{f,2}}{h_{fg,2}}', 'flash fraction — the enthalpy the liquid cannot hold at the lower pressure'], ['\\dot m_{flash} = x\\,\\dot m_{cond},\\qquad \\dot m_{liq} = (1-x)\\dot m_{cond}', 'the split leaving the flash vessel'], ['D_{vessel} \\geq \\sqrt{\\frac{4\\dot V_g}{\\pi u_{max}}},\\qquad u_{max} = K\\sqrt{\\frac{\\rho_l - \\rho_g}{\\rho_g}}', 'the vessel must still be a separator'], ['\\dot Q_{rec} = \\dot m_{flash}h_{fg,2}', 'energy recovered as usable low-pressure steam']],
        notes: ['Adiabatic flash \u2014 no heat loss between the trap and the vessel.', 'Sub-cooled condensate flashes less; the calculation uses the saturation state at the higher pressure.', 'Souders\u2013Brown K taken as 0.07 m/s for a vertical flash vessel without a mesh pad.'],
        params: [P('P1', 'Condensate pressure (abs)', 1.2, 120, 0.5, 12, null, 'bar a'), P('P2', 'Flash vessel pressure (abs)', 1, 60, 0.1, 2, null, 'bar a'), P('W', 'Condensate rate', 50, 60000, 50, 4000, null, 'kg/h'), P('sub', 'Sub-cooling below saturation', 0, 60, 1, 0, 'dT'), P('eff', 'Boiler efficiency for the credit', 0.6, 0.98, 0.01, 0.85, null, '\u2014'), P('fuel', 'Fuel cost', 5, 120, 1, 35, null, '\u20ac/MWh'), P('hours', 'Operating hours', 1000, 8760, 100, 8000, null, 'h/yr')],
        compute: v => {
          const f = self.if97();
          const P2 = Math.min(v.P2, v.P1 * 0.98);
          const T1 = f.tsat(v.P1 / 10) - 273.15, T2 = f.tsat(P2 / 10) - 273.15;
          const hf1 = f.r1(v.P1 / 10, T1 + 273.15 - 0.01).h - (v.sub * 4.2);
          const l2 = f.r1(P2 / 10, T2 + 273.15 - 0.01), g2 = f.r2(P2 / 10, T2 + 273.15 + 0.01);
          const hfg2 = g2.h - l2.h;
          const xOf = p => {
            const t = f.tsat(p / 10) - 273.15;
            const lf = f.r1(p / 10, t + 273.15 - 0.01), gv = f.r2(p / 10, t + 273.15 + 0.01);
            return Math.max(Math.min((hf1 - lf.h) / (gv.h - lf.h), 1), 0);
          };
          const x = xOf(P2);
          const Wf = x * v.W, Wl = v.W - Wf;
          const rhog = 1 / g2.v, rhol = 1 / l2.v;
          const Vg = Wf / 3600 / rhog;
          const umax = 0.07 * Math.sqrt((rhol - rhog) / rhog);
          const D = Math.sqrt(4 * Vg / (Math.PI * umax));
          const Qrec = Wf / 3600 * hfg2;
          const save = Qrec / 1000 * v.hours * v.fuel / v.eff;
          return {
            xOf: xOf, x: x, P2: P2,
            res: [{ l: 'Condensate saturation temperature', v: T1, u: '', cv: 'T', d: 1 }, { l: 'Flash vessel temperature', v: T2, u: '', cv: 'T', d: 1 }, { l: 'Liquid enthalpy entering', v: hf1, u: '', cv: 'H', d: 1 }, { l: 'Latent heat at flash pressure', v: hfg2, u: '', cv: 'H', d: 1 }, { l: 'Flash fraction', v: x * 100, u: 'wt %', d: 3 }, { l: 'Flash steam produced', v: Wf, u: '', cv: 'M', d: 1 }, { l: 'Condensate remaining', v: Wl, u: '', cv: 'M', d: 1 }, { l: 'Flash steam density', v: rhog, u: '', cv: 'rho', d: 4 }, { l: 'Flash vapour volume', v: Vg * 3600, u: 'm\u00b3/h', d: 1 }, { l: 'Souders\u2013Brown velocity', v: umax, u: '', cv: 'vel', d: 3 }, { l: 'Minimum vessel diameter', v: D * 1000, u: '', cv: 'mm', d: 0 }, { l: 'Energy recovered', v: Qrec, u: '', cv: 'W', d: 1 }, { l: 'Annual fuel saving', v: save, u: '\u20ac/yr', d: 0 }, { l: 'Verdict', s: x < 0.03 ? 'little to recover \u2014 pump the condensate back instead' : x > 0.25 ? 'a large flash \u2014 consider two-stage let-down' : 'a worthwhile single-stage recovery', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const pmax = v.P1 * 0.95;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: pmax, ymin: 0, ymax: Math.max(r.xOf(1) * 105, 1), ml: 70 });
          g.grid('Flash vessel pressure  (bar a)', 'Flash fraction  (%)', 5, 5, null, t => self.f(t, 1));
          g.title('Most of the flash is made in the first let-down');
          g.fn(p => r.xOf(p) * 100, C.dk, 2.8);
          g.line([[r.P2, 0], [r.P2, r.x * 100]], C.mut, 1.3, [4, 4]);
          g.dot(r.P2, r.x * 100, C.acc, 5.5);
          g.txt(self.f(r.x * 100, 2) + '%', r.P2, r.x * 100 + r.xOf(1) * 6, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'flash fraction' }]);
        }
      },
      {
        id: 'desup', num: 'H-12', sec: HT, name: 'Steam desuperheating',
        blurb: 'Superheat is useless to a reboiler \u2014 it transfers heat at a poor coefficient and the exchanger runs dry. Spraying condensate into the line fixes it, and the whole calculation is one enthalpy balance with a minimum-approach rule you must not break.',
        howto: 'The curve is spray water demand against the temperature you are asking for. It steepens as you approach saturation because the last few degrees of superheat carry very little enthalpy; below the 10 K approach line the spray will not evaporate and you are shipping water down the header.',
        std: 'Enthalpy balance on IAPWS-IF97; desuperheater practice per ASME PTC 12.4 and Spirax Sarco guidance',
        eqs: [['\\dot m_w = \\dot m_s\\frac{h_s - h_2}{h_2 - h_w}', 'water needed to bring superheated steam to the target enthalpy'], ['\\dot m_2 = \\dot m_s + \\dot m_w', 'everything sprayed leaves as steam'], ['\\Delta T_{app} = T_2 - T_{sat}\\left(P\\right) \\geq 10\\ \\text{K}', 'the minimum approach that keeps the spray evaporating'], ['\\dot Q = \\dot m_s\\left(h_s - h_2\\right)', 'heat removed from the steam by the spray']],
        notes: ['Constant pressure through the desuperheater; the small friction loss is ignored.', 'Spray water taken as sub-cooled liquid at the stated temperature and the line pressure.', 'Below about 10 K of residual superheat the droplets survive \u2014 use a steam-atomised or venturi type.'],
        params: [P('P', 'Line pressure (abs)', 2, 150, 0.5, 40, null, 'bar a'), P('T1', 'Steam inlet temperature', 150, 600, 1, 420, 'T'), P('T2', 'Target outlet temperature', 100, 550, 1, 300, 'T'), P('Ws', 'Steam flow', 500, 300000, 500, 30000, null, 'kg/h'), P('Tw', 'Spray water temperature', 20, 250, 1, 105, 'T'), P('Pw', 'Spray water pressure (abs)', 3, 200, 1, 60, null, 'bar a')],
        compute: v => {
          const f = self.if97();
          const pM = v.P / 10;
          const Tsat = f.tsat(pM) - 273.15;
          const hw = f.r1(Math.max(v.Pw, v.P) / 10, Math.min(v.Tw, f.tsat(Math.max(v.Pw, v.P) / 10) - 273.15 - 0.5) + 273.15).h;
          const hOf = T => T > Tsat + 0.2 ? f.r2(pM, T + 273.15).h : f.r2(pM, Tsat + 273.15 + 0.2).h;
          const hs = hOf(v.T1);
          const wOf = T2 => { const h2 = hOf(T2); return Math.max(v.Ws * (hs - h2) / Math.max(h2 - hw, 1), 0); };
          const T2 = Math.max(v.T2, Tsat + 0.5);
          const Ww = wOf(T2), h2 = hOf(T2);
          const W2 = v.Ws + Ww;
          const app = T2 - Tsat;
          const Q = v.Ws * (hs - h2) / 3600;
          return {
            wOf: wOf, Ww: Ww, Tsat: Tsat, T2: T2,
            res: [{ l: 'Saturation temperature at line pressure', v: Tsat, u: '', cv: 'T', d: 1 }, { l: 'Inlet superheat', v: v.T1 - Tsat, u: '', cv: 'dT', d: 1 }, { l: 'Residual superheat at target', v: app, u: '', cv: 'dT', d: 1 }, { l: 'Approach verdict', s: app < 3 ? 'saturated \u2014 water will carry over into the header' : app < 10 ? 'below the 10 K minimum \u2014 use a steam-atomised type' : 'safe evaporation margin', u: '' }, { l: 'Inlet steam enthalpy', v: hs, u: '', cv: 'H', d: 1 }, { l: 'Outlet steam enthalpy', v: h2, u: '', cv: 'H', d: 1 }, { l: 'Spray water enthalpy', v: hw, u: '', cv: 'H', d: 1 }, { l: 'Spray water required', v: Ww, u: '', cv: 'M', d: 1 }, { l: 'Water as % of steam', v: Ww / v.Ws * 100, u: '%', d: 2 }, { l: 'Outlet steam flow', v: W2, u: '', cv: 'M', d: 1 }, { l: 'Heat removed from the steam', v: Q, u: '', cv: 'W', d: 1 }, { l: 'Spray water volumetric rate', v: Ww / 1000, u: 'm\u00b3/h', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const tmin = r.Tsat + 0.5, tmax = v.T1 * 0.99;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: tmin, xmax: tmax, ymin: 0, ymax: Math.max(r.wOf(tmin) * 1.08, 1), ml: 78 });
          g.grid('Target outlet temperature  (' + self.cvt(0, 'T')[1] + ')', 'Spray water  (' + self.cvt(0, 'M')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'T')[0], 0), t => self.f(self.cvt(t, 'M')[0], 0));
          g.title('Water demand against the temperature you ask for');
          const ymax = Math.max(r.wOf(tmin) * 1.08, 1);
          g.fill([[tmin, 0], [r.Tsat + 10, 0], [r.Tsat + 10, ymax], [tmin, ymax]], C.soft2);
          g.txt('under 10 K approach', r.Tsat + 10, ymax * 0.07, C.mut, 'right', 10.5);
          g.fn(t => r.wOf(t), C.dk, 2.8);
          g.line([[r.T2, 0], [r.T2, r.Ww]], C.mut, 1.3, [4, 4]);
          g.dot(r.T2, r.Ww, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.Ww, 'M')[0], 0) + ' ' + self.cvt(0, 'M')[1], r.T2, r.Ww + ymax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'spray water' }]);
        }
      }
    ];
  }
