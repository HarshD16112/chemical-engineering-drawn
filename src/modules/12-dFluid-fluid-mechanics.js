  dFluid() {
    const self = this, C = this.C;
    const S = 'Fluid Mechanics';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const colebrook = (Re, rr) => {
      if (Re < 2100) return 64 / Re;
      let f = 0.02;
      for (let i = 0; i < 60; i++) {
        const rt = 1 / Math.sqrt(f);
        const nrt = -2 * Math.log10(rr / 3.7 + 2.51 * rt / Re);
        const nf = 1 / (nrt * nrt);
        if (Math.abs(nf - f) < 1e-12) { f = nf; break; }
        f = nf;
      }
      return f;
    };
    return [
      {
        id: 'moody', num: 'F-01', sec: S, name: 'Moody chart & pipe pressure drop',
        blurb: 'The single most-used chart in process engineering. Friction factor against Reynolds number, one curve per relative roughness, with your line plotted on it \u2014 laminar leg, critical zone, transition band and the flat fully-rough plateau.',
        howto: 'The cross marks your duty. In the laminar leg roughness does nothing and f is simply 64/Re. Past Re \u2248 4000 the curves fan out by roughness; once a curve goes flat you are fully rough and pressure drop scales with velocity squared no matter what the Reynolds number does. If the marker sits in the shaded critical zone between 2100 and 4000, the flow is unpredictable \u2014 resize the line.',
        std: 'Colebrook\u2013White (1939); Moody (1944) Trans. ASME 66, 671. Roughness values per Crane TP-410',
        eqs: [['\\frac{1}{\\sqrt f} = -2\\log_{10}\\left(\\frac{\\epsilon/D}{3.7} + \\frac{2.51}{Re\\sqrt f}\\right)', 'Colebrook–White, solved iteratively'], ['f = \\frac{64}{Re}', 'laminar leg, roughness irrelevant'], ['\\Delta P = f\\,\\frac{L}{D}\\cdot\\frac{\\rho u^2}{2}', 'Darcy–Weisbach pressure drop']],
        notes: ['Darcy friction factor (4\u00d7 the Fanning factor).', 'Fittings entered as an equivalent-length multiple of pipe length.', 'Single-phase, incompressible, fully developed flow.'],
        params: [P('D', 'Internal diameter', 5, 1200, 1, 102.3, 'mm'), P('rough', 'Absolute roughness \u03b5', 0.0005, 3, 0.0005, 0.045, 'mm'), P('Q', 'Volumetric flow', 0.1, 3000, 0.1, 40, 'Q'), P('rho', 'Density', 1, 1600, 1, 998, 'rho'), P('mu', 'Viscosity', 0.005, 2000, 0.005, 1, null, 'cP'), P('L', 'Straight pipe length', 1, 5000, 1, 120, 'L'), P('Le', 'Fittings as \u00d7 pipe length', 0, 3, 0.05, 0.3, null, '\u2014'), P('dz', 'Static elevation rise', -100, 200, 0.5, 0, 'L')],
        compute: v => {
          const D = v.D / 1000, A = Math.PI * D * D / 4;
          const vel = (v.Q / 3600) / A;
          const mu = v.mu / 1000;
          const Re = v.rho * vel * D / mu;
          const rr = v.rough / v.D;
          const f = colebrook(Math.max(Re, 1), rr);
          const Ltot = v.L * (1 + v.Le);
          const dpf = f * Ltot / D * v.rho * vel * vel / 2 / 1000;
          const dps = v.rho * 9.80665 * v.dz / 1000;
          const hd = v.rho * vel * vel / 2 / 1000;
          const regime = Re < 2100 ? 'laminar' : Re < 4000 ? 'critical \u2014 avoid' : rr > 0 && Re > 200 / (rr * Math.sqrt(f)) ? 'fully rough turbulent' : 'transition turbulent';
          return {
            Re: Re, f: f, vel: vel, rr: rr,
            res: [{ l: 'Velocity', v: vel, u: '', cv: 'vel' }, { l: 'Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Relative roughness \u03b5/D', v: rr, u: '\u2014', d: 5 }, { l: 'Darcy friction factor f', v: f, u: '\u2014', d: 5 }, { l: 'Flow regime', s: regime, u: '' }, { l: 'Friction \u0394P', v: dpf, u: '', cv: 'P' }, { l: 'Static \u0394P', v: dps, u: '', cv: 'P' }, { l: 'Total \u0394P', v: dpf + dps, u: '', cv: 'P' }, { l: 'Pressure gradient', v: dpf / Ltot * 1000, u: 'Pa/m', d: 1 }, { l: 'Velocity head \u03c1v\u00b2/2', v: hd, u: '', cv: 'P' }, { l: 'Head loss', v: dpf * 1000 / (v.rho * 9.80665), u: '', cv: 'L' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 600, xmax: 1e8, ymin: 0.008, ymax: 0.1, xlog: true, ylog: true, ml: 66 });
          g.grid('Reynolds number  Re = \u03c1vD/\u03bc', 'Darcy friction factor  f', 5, 5);
          g.title('Moody chart');
          g.fill([[2100, 0.008], [4000, 0.008], [4000, 0.1], [2100, 0.1]], 'rgba(29,31,32,0.055)');
          g.txt('critical', 2900, 0.088, C.mut, 'center', 10.5, 'middle', -Math.PI / 2);
          g.line([[600, 64 / 600], [2100, 64 / 2100]], C.dk, 2.4);
          [0.05, 0.03, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0004, 0.0001, 0.00001].forEach(rr => {
            const pts = [];
            for (let i = 0; i <= 160; i++) { const Re = Math.pow(10, 3.6 + (8 - 3.6) * i / 160); pts.push([Re, colebrook(Re, rr)]); }
            g.line(pts, 'rgba(29,31,32,0.30)', 1.2);
            const fend = colebrook(1e8, rr);
            if (fend > 0.008 && fend < 0.1) g.txt(String(rr), 8.4e7, fend, C.mut, 'right', 10, 'bottom');
          });
          const pts = [];
          for (let i = 0; i <= 160; i++) { const Re = Math.pow(10, 3.6 + (8 - 3.6) * i / 160); pts.push([Re, colebrook(Re, r.rr)]); }
          g.line(pts, C.acc, 2.6);
          if (r.Re >= 600 && r.Re <= 1e8) { g.cross(r.Re, r.f, C.dk, 10); g.dot(r.Re, r.f, C.acc, 4.5); }
          g.txt('smooth', 8.4e7, colebrook(1e8, 1e-6), C.mid, 'right', 10, 'top');
          g.legend([{ c: C.dk, l: 'laminar  64/Re' }, { c: C.acc, l: '\u03b5/D = ' + r.rr.toFixed(5) }, { c: 'rgba(29,31,32,0.30)', l: 'other roughness', lw: 1.2 }]);
        }
      },
      {
        id: 'pump',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Qd = self.rget(r, 'duty flow') || 0, Hd = self.rget(r, 'duty head') || 0;
  const np = self.rget(r, 'npsh available') || 0, nr = self.rget(r, 'npsh required') || 0;
  const eff = self.rget(r, 'efficiency at duty') || 0, Psh = self.rget(r, 'shaft power') || 0;
  const cav = np <= nr, marg = np - nr;
  s.title('Pump & system', self.f(self.cvt(Qd, 'Q')[0], 0) + ' ' + self.cvt(0, 'Q')[1] + ' at ' + self.f(self.cvt(Hd, 'L')[0], 1) + ' ' + self.cvt(0, 'L')[1]);
  const tankW = 96, tx = s.x + 24, ty = s.y + 70, tH = Math.min(110, s.h * 0.34);
  const sump = s.vessel(tx, ty, tankW, tH, { stroke: C.ink, lw: 1.5 });
  s.liquid(sump, tx, ty, tankW, tH, 0.6, C.soft3);
  s.T('suction vessel', tx + tankW / 2, ty - 12, { align: 'center', size: 10, col: C.mut, caps: true });
  s.T(self.f(self.cvt(v.Ps, 'P')[0], 0) + ' ' + self.cvt(0, 'P')[1], tx + tankW / 2, ty + 14, { align: 'center', size: 10.5, col: C.mut });
  const py = ty + tH + 54, pcx = tx + tankW + 96;
  s.L([[tx + tankW / 2, ty + tH], [tx + tankW / 2, py], [pcx - 24, py]], { col: cav ? C.warn : C.acc, lw: 2.4, arrow: true });
  s.pumpSym(pcx, py, 24, { col: cav ? C.warn : C.acc, fill: cav ? 'rgba(140,59,47,0.16)' : C.soft });
  s.T('N/N\u2080 ' + self.f(v.speed, 2), pcx, py - 36, { align: 'center', size: 10.5, col: C.mut });
  const dx = s.x + s.w - 150, dy = s.y + 32, dH = Math.min(110, s.h * 0.34);
  s.L([[pcx + 24, py], [dx + 48, py], [dx + 48, dy + dH]], { col: C.acc, lw: 2.4, arrow: true });
  const dest = s.vessel(dx, dy, 96, dH, { stroke: C.ink, lw: 1.5 });
  s.liquid(dest, dx, dy, 96, dH, 0.45, C.soft3);
  s.T('destination', dx + 48, dy - 12, { align: 'center', size: 10, col: C.mut, caps: true });
  s.dim(dx - 26, py, dx - 26, dy + dH * 0.55, 'H_st ' + self.f(self.cvt(v.Hst, 'L')[0], 1), { col: C.mut });
  s.dim(tx - 14, ty + tH * 0.4, tx - 14, py, 'z_s ' + self.f(self.cvt(v.zs, 'L')[0], 1), { col: C.mut });
  const gx = s.x + 24, gy = s.y + s.h - 52, gw = Math.max(200, s.w * 0.36);
  s.T('NPSH margin', gx, gy - 12, { size: 10, col: C.mut, caps: true });
  const tot = Math.max(np, nr, 1) * 1.15;
  s.R(gx, gy, gw, 14, { stroke: C.mut, lw: 1 });
  s.R(gx + 1, gy + 1, (gw - 2) * self.cl01(np / tot), 12, { stroke: null, fill: C.soft3 });
  s.L([[gx + gw * self.cl01(nr / tot), gy - 5], [gx + gw * self.cl01(nr / tot), gy + 19]], { col: C.warn, lw: 2 });
  s.T('NPSH_a ' + self.f(self.cvt(np, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], gx, gy + 28, { size: 10.5, col: C.acc });
  s.T('NPSH_r ' + self.f(self.cvt(nr, 'L')[0], 2), gx + gw, gy + 28, { size: 10.5, col: C.warn, align: 'right' });
  s.badge(s.x, s.y + 2, 'Efficiency at duty', self.f(eff, 1) + '%', 0.5 - 0.36 * self.cl01(eff / 90), { w: 150 });
  s.badge(s.x + 160, s.y + 2, 'Shaft power', self.f(Psh, 2) + ' kW', 0.5 + 0.4 * self.cl01(Psh / 200), { w: 150 });
  if (cav) s.T('WILL CAVITATE \u2014 margin ' + self.f(marg, 2) + ' m', pcx + 36, py - 30, { size: 12, col: C.warn, bold: true });
},
        schemNote: 'Static lift, suction pressure and the duty point drive the sketch. The pump turns red the moment NPSH available falls to the required value \u2014 the bar underneath shows how much margin is left.',
        num: 'F-02', sa: 0.70, sec: S, name: 'Centrifugal pump & system curve',
        blurb: 'Where the pump curve crosses the system curve is where the pump will actually run \u2014 not where you specified it. Add the NPSH margin and the efficiency island and you have the whole selection argument on one plot.',
        howto: 'The falling curve is the pump, the rising one the system. Their intersection is the duty point; the BEP marker shows how far from best efficiency it sits. Throttle the system (raise its resistance) and the duty slides left up the pump curve \u2014 wasted energy. Trim the speed instead and the pump curve itself drops by the affinity laws. Watch the NPSH pair at the bottom: if available falls within about 1 m of required, the pump will cavitate.',
        std: 'ANSI/HI 9.6.1 & 9.6.3; API 610 12th ed. for NPSH margin and preferred operating region',
        eqs: [['H = s^2H_0 - aQ^2', 'pump curve at speed ratio s'], ['H_{sys} = H_{st} + KQ^2', 'system curve — static head plus friction'], ['\\frac{Q_2}{Q_1} = \\frac{N_2}{N_1},\\quad \\frac{H_2}{H_1} = \\left(\\frac{N_2}{N_1}\\right)^2', 'affinity laws'], ['NPSH_a = \\frac{P_s - P_v}{\\rho g} + z - h_f', 'available suction head']],
        notes: ['Affinity laws: Q \u221d s, H \u221d s\u00b2, P \u221d s\u00b3.', 'Efficiency modelled as a parabola about the BEP flow.', 'API 610 preferred operating region is 70\u2013120% of BEP flow.'],
        params: [P('H0', 'Shutoff head H\u2080', 5, 300, 1, 60, 'L'), P('Qbep', 'BEP flow at full speed', 5, 2000, 5, 120, 'Q'), P('droop', 'Head at BEP / shutoff', 0.4, 0.95, 0.01, 0.72, null, '\u2014'), P('speed', 'Speed ratio  N/N\u2080', 0.5, 1.15, 0.01, 1, null, '\u2014'), P('Hst', 'Static head', -10, 200, 0.5, 22, 'L'), P('Kf', 'System friction at BEP flow', 0, 150, 0.5, 25, 'L'), P('etam', 'Peak efficiency', 0.3, 0.9, 0.01, 0.78, null, '\u2014'), P('Ps', 'Suction vessel pressure', 10, 2000, 5, 101.325, 'P'), P('Pv', 'Vapour pressure', 1, 500, 1, 3.17, 'P'), P('zs', 'Suction static lift (+ flooded)', -8, 15, 0.1, 2, 'L'), P('hfs', 'Suction line loss', 0, 15, 0.1, 0.8, 'L'), P('rho', 'Density', 300, 1600, 1, 998, 'rho')],
        compute: v => {
          const a = v.H0 * (1 - v.droop) / (v.Qbep * v.Qbep);
          const K = v.Kf / (v.Qbep * v.Qbep);
          const s = v.speed;
          const pump = Q => s * s * v.H0 - a * Q * Q;
          const sys = Q => v.Hst + K * Q * Q;
          const Qd = Math.sqrt(Math.max((s * s * v.H0 - v.Hst) / (a + K), 0));
          const Hd = sys(Qd);
          const Qb = v.Qbep * s;
          const eta = Q => Math.max(v.etam * (1 - 0.85 * Math.pow((Q - Qb) / Math.max(Qb, 1e-6), 2)), 0.05);
          const e = eta(Qd);
          const Pw = v.rho * 9.80665 * (Qd / 3600) * Hd / 1000;
          const npsha = (v.Ps - v.Pv) * 1000 / (v.rho * 9.80665) + v.zs - v.hfs;
          const npshr = Q => 0.6 + 3.2 * Math.pow(Q / Math.max(Qb, 1e-6), 2);
          const nr = npshr(Qd);
          const pct = Qd / Math.max(Qb, 1e-9) * 100;
          return {
            pump: pump, sys: sys, Qd: Qd, Hd: Hd, eta: eta, Qb: Qb, npshr: npshr, npsha: npsha,
            res: [{ l: 'Duty flow', v: Qd, u: '', cv: 'Q' }, { l: 'Duty head', v: Hd, u: '', cv: 'L' }, { l: '% of BEP flow', v: pct, u: '%', d: 1 }, { l: 'Operating region', s: pct >= 70 && pct <= 120 ? 'preferred (API 610)' : pct < 70 ? 'low flow \u2014 recirculation risk' : 'high flow \u2014 NPSH risk', u: '' }, { l: 'Efficiency at duty', v: e * 100, u: '%', d: 1 }, { l: 'Hydraulic power', v: Pw, u: 'kW', d: 2 }, { l: 'Shaft power', v: Pw / e, u: 'kW', d: 2 }, { l: 'NPSH available', v: npsha, u: '', cv: 'L' }, { l: 'NPSH required (est.)', v: nr, u: '', cv: 'L' }, { l: 'NPSH margin', v: npsha - nr, u: '', cv: 'L' }, { l: 'Cavitation check', s: npsha - nr > 1 ? 'OK \u2014 margin > 1 m' : npsha > nr ? 'marginal' : 'WILL CAVITATE', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const Qmax = v.Qbep * 1.6;
          const Hmax = Math.max(v.H0, r.Hd) * 1.12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h * 0.66, xmin: 0, xmax: Qmax, ymin: 0, ymax: Hmax, mb: 30, ml: 66 });
          g.grid('', 'Head  (' + self.cvt(0, 'L')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'L')[0], 0));
          g.title('Pump and system curves');
          g.fn(Q => v.H0 - (v.H0 * (1 - v.droop) / (v.Qbep * v.Qbep)) * Q * Q, C.mut, 1.3, [5, 4]);
          g.fn(Q => r.pump(Q), C.dk, 2.6);
          g.fn(Q => r.sys(Q), C.acc, 2.4);
          g.fill([[v.Qbep * 0.7 * v.speed, 0], [v.Qbep * 1.2 * v.speed, 0], [v.Qbep * 1.2 * v.speed, Hmax], [v.Qbep * 0.7 * v.speed, Hmax]], C.soft);
          g.dot(r.Qd, r.Hd, C.acc, 5.5);
          g.cross(r.Qd, r.Hd, C.dk, 10);
          g.txt('duty  ' + self.f(self.cvt(r.Qd, 'Q')[0], 1) + ' ' + self.cvt(r.Qd, 'Q')[1] + '  @  ' + self.f(self.cvt(r.Hd, 'L')[0], 1) + ' ' + self.cvt(0, 'L')[1], r.Qd, r.Hd + Hmax * 0.06, C.ink, 'center', 12);
          g.dot(r.Qb, r.pump(r.Qb), C.mid, 4);
          g.txt('BEP', r.Qb, r.pump(r.Qb) - Hmax * 0.055, C.mid, 'center', 11);
          g.legend([{ c: C.dk, l: 'pump @ ' + (v.speed * 100).toFixed(0) + '% speed' }, { c: C.mut, l: 'pump @ 100%', d: [5, 4], lw: 1.3 }, { c: C.acc, l: 'system' }]);
          const y2 = b.h * 0.66;
          const nmax = Math.max(r.npsha, r.npshr(Qmax)) * 1.15;
          const g2 = self.mkG(ctx, { x: b.x, y: y2, w: b.w, h: b.h - y2, xmin: 0, xmax: Qmax, ymin: 0, ymax: nmax, mt: 18, mb: 44, ml: 66 });
          g2.grid('Flow  (' + self.cvt(0, 'Q')[1] + ')', 'NPSH  (' + self.cvt(0, 'L')[1] + ')', 5, 3, t => self.f(self.cvt(t, 'Q')[0], 0), t => self.f(self.cvt(t, 'L')[0], 1));
          g2.line([[0, r.npsha], [Qmax, r.npsha]], C.acc, 2.2);
          g2.fn(Q => r.npshr(Q), C.dk, 2.2);
          g2.dot(r.Qd, r.npshr(r.Qd), C.dk, 4.5);
          g2.txt('NPSHa', Qmax * 0.02, r.npsha + nmax * 0.07, C.mid, 'left', 11);
          g2.txt('NPSHr', Qmax * 0.72, r.npshr(Qmax * 0.72) + nmax * 0.07, C.ink, 'left', 11);
        }
      },
      {
        id: 'valve',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const h = self.cl01((self.rget(r, 'opening at design flow') || 50) / 100);
  const auth = self.rget(r, 'valve authority') || 0, Cvr = self.rget(r, 'required c') || 0;
  s.title('Control valve at duty', self.f(h * 100, 0) + '% travel \u00b7 authority ' + self.f(auth, 2));
  const bodyW = Math.min(188, s.w * 0.3), X = s.cx - bodyW / 2 - 40, Y = s.cy - 6, bodyH = 76;
  const pipeH = 26;
  s.R(s.x + 10, Y - pipeH / 2, X - s.x - 10, pipeH, { stroke: C.ink, lw: 1.4, fill: C.soft });
  s.R(X + bodyW, Y - pipeH / 2, s.x + s.w - 150 - X - bodyW, pipeH, { stroke: C.ink, lw: 1.4, fill: C.soft });
  s.R(X, Y - bodyH / 2, bodyW, bodyH, { stroke: C.ink, lw: 1.6, fill: C.bg });
  const seatW = bodyW * 0.3, sx = X + bodyW / 2 - seatW / 2;
  s.R(X + 1, Y - 5, sx - X - 1, 10, { stroke: C.ink, lw: 1.3, fill: 'rgba(29,31,32,0.22)' });
  s.R(sx + seatW, Y - 5, X + bodyW - sx - seatW - 1, 10, { stroke: C.ink, lw: 1.3, fill: 'rgba(29,31,32,0.22)' });
  s.T('seat', X + bodyW - 6, Y + 18, { size: 9.5, col: C.mut, align: 'right' });
  const lift = 2 + (bodyH / 2 - 20) * h;
  const plugY = Y - 5 - lift;
  s.L([[sx - 3, plugY - 15], [sx + seatW + 3, plugY - 15], [sx + seatW * 0.78, plugY], [sx + seatW * 0.22, plugY]], { col: C.acc, lw: 1.6, close: true, fill: C.soft3 });
  if (lift > 4) s.R(sx, plugY, seatW, lift, { stroke: null, fill: C.soft });
  s.L([[X + bodyW / 2, plugY - 15], [X + bodyW / 2, Y - bodyH / 2 - 34]], { col: C.ink, lw: 2 });
  s.R(X + bodyW / 2 - 34, Y - bodyH / 2 - 56, 68, 22, { stroke: C.ink, lw: 1.4, fill: C.bg });
  s.T('actuator', X + bodyW / 2, Y - bodyH / 2 - 45, { align: 'center', size: 10, col: C.mut, caps: true });
  s.dim(sx - 18, Y - 5, sx - 18, plugY, self.f(h * 100, 0) + '%', { col: C.acc });
  const fa = 3 + 7 * h;
  for (let i = 0; i < 5; i++) { const px = s.x + 22 + i * 22; s.L([[px, Y], [px + 14, Y]], { col: C.mid, lw: 1 + fa * 0.12, arrow: true, asz: 5 }); }
  s.T('C\u1d65 required ' + self.f(Cvr, 1) + ' of ' + self.f(v.Cvr, 0) + ' rated', X, Y + bodyH / 2 + 22, { size: 10.5, col: C.mut });
  const gx = s.x + s.w - 136, gy = s.y + 6;
  s.badge(gx, gy, 'Travel at design', self.f(h * 100, 0) + '%', h < 0.2 || h > 0.9 ? 0.9 : 0.42, { w: 136 });
  s.badge(gx, gy + 44, 'Authority N', self.f(auth, 3), auth < 0.25 ? 0.9 : 0.4, { w: 136 });
  const tot = v.dPv + v.dPsys, vw = (s.w - 300) * 0;
  const px0 = s.x + 10, pw = Math.max(160, s.w * 0.34), py0 = s.y + s.h - 40;
  s.T('\u0394P split at design flow', px0, py0 - 12, { size: 10, col: C.mut, caps: true });
  s.R(px0, py0, pw, 16, { stroke: C.mut, lw: 1 });
  s.R(px0 + 1, py0 + 1, (pw - 2) * self.cl01(v.dPv / Math.max(tot, 1e-9)), 14, { stroke: null, fill: C.soft3 });
  s.T('valve ' + self.f(v.dPv / Math.max(tot, 1e-9) * 100, 0) + '%', px0 + 5, py0 + 8, { size: 10, col: C.dk });
  s.T('system', px0 + pw - 5, py0 + 8, { size: 10, col: C.mut, align: 'right' });
  if (h < 0.2) s.T('operating too closed', gx, gy + 100, { size: 11.5, col: C.warn, bold: true });
  else if (h > 0.9) s.T('no margin \u2014 open too far', gx, gy + 100, { size: 11.5, col: C.warn, bold: true });
},
        schemNote: 'The plug lifts off the seat by the computed travel at design flow \u2014 oversize the valve and it crouches shut, undersize it and the stem runs out of stroke. The bar is how the pressure drop splits.',
        num: 'F-03', sec: S, name: 'Control valve sizing & characteristic',
        blurb: 'A valve\u2019s inherent characteristic is what the trim was cut to do; its installed characteristic is what the piping lets it do. The gap between the two is valve authority, and it is why an equal-percentage trim is the default in a friction-dominated system.',
        howto: 'The dashed line is the inherent characteristic \u2014 flow against travel with constant pressure drop across the valve. The solid line is what you actually get once the rest of the system takes its share of the head. Low authority pulls the installed curve up hard toward the top left: the valve does all its work in the first third of travel and control gets twitchy. Aim for authority above 0.25 and a design opening between 50 and 80 percent.',
        std: 'ISA-75.01.01 / IEC 60534-2-1 sizing; ISA-75.11.01 for inherent characteristic definitions',
        eqs: [['Q = C_v\\sqrt{\\frac{\\Delta P_v}{G_f}}', 'liquid sizing equation'], ['f(\\ell) = R_v^{\\,\\ell-1}', 'equal-percentage inherent characteristic'], ['N = \\frac{\\Delta P_{v,open}}{\\Delta P_{total}}', 'valve authority sets the installed curve']],
        notes: ['Turbulent, non-flashing, non-choked liquid service.', 'System loss assumed proportional to flow squared.', 'Rated C\u1d65 taken at 100% travel; F_L and piping geometry factors omitted.'],
        params: [{ k: 'ch', label: 'Inherent characteristic', type: 'select', val: 'eq', options: [['eq', 'Equal percentage'], ['lin', 'Linear'], ['qo', 'Quick opening']] }, P('Qd', 'Design flow', 1, 2000, 1, 100, 'Q'), P('dPv', 'Valve \u0394P at design flow', 5, 1000, 1, 100, 'P'), P('dPsys', 'System \u0394P at design flow', 5, 3000, 1, 300, 'P'), P('SG', 'Specific gravity', 0.4, 2, 0.01, 1, null, '\u2014'), P('Cvr', 'Rated C\u1d65 of valve', 1, 800, 1, 90, null, '\u2014'), P('Rng', 'Rangeability R', 10, 100, 5, 50, null, '\u2014')],
        compute: v => {
          const Qgpm = v.Qd * 4.402868, dPpsi = v.dPv * 0.1450377;
          const Cvreq = Qgpm * Math.sqrt(v.SG / dPpsi);
          const auth = v.dPv / (v.dPv + v.dPsys);
          const fr = h => v.ch === 'lin' ? h : v.ch === 'qo' ? Math.sqrt(h) : Math.pow(v.Rng, h - 1);
          const total = v.dPv + v.dPsys;
          const Ksys = v.dPsys / (v.Qd * v.Qd);
          const Kv = h => { const cv = Math.max(v.Cvr * fr(h), 1e-6); return (v.SG / Math.pow(cv / 4.402868, 2)) / 0.1450377; };
          const Qh = h => Math.sqrt(total / (Kv(h) + Ksys));
          const Qmaxh = Qh(1);
          const hdes = self.bis(h => Qh(h) - v.Qd, 0.001, 1, 1e-8);
          return {
            fr: fr, Qh: Qh, Qmax: Qmaxh, hdes: hdes, Cvreq: Cvreq, auth: auth,
            res: [{ l: 'Required C\u1d65 at design', v: Cvreq, u: '\u2014', d: 2 }, { l: 'Rated C\u1d65 / required', v: v.Cvr / Cvreq, u: '\u2014' }, { l: 'Valve authority N', v: auth, u: '\u2014', d: 3 }, { l: 'Authority verdict', s: auth >= 0.5 ? 'excellent' : auth >= 0.25 ? 'acceptable' : 'too low \u2014 undersize the valve', u: '' }, { l: 'Opening at design flow', v: (isFinite(hdes) ? hdes : 1) * 100, u: '% travel', d: 1 }, { l: 'Max flow, valve wide open', v: Qmaxh, u: '', cv: 'Q' }, { l: 'Installed turndown', v: Qmaxh / Math.max(Qh(0.1), 1e-9), u: '\u2014' }, { l: 'Opening verdict', s: !isFinite(hdes) ? 'valve too small' : hdes < 0.2 ? 'operating too closed' : hdes > 0.9 ? 'no margin \u2014 open too far' : 'good control range', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const qmax = Math.max(r.Qmax, v.Qd) * 1.08;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 100, ymin: 0, ymax: qmax, ml: 70 });
          g.grid('Valve travel  (% open)', 'Flow  (' + self.cvt(0, 'Q')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'Q')[0], 0));
          g.title('Inherent vs installed characteristic');
          g.fn(h => r.Qmax * r.fr(h / 100) / r.fr(1), C.mut, 1.8, [6, 4]);
          g.fn(h => r.Qh(Math.max(h / 100, 0.001)), C.dk, 2.6);
          g.line([[0, v.Qd], [100, v.Qd]], C.acc, 1.4, [4, 4]);
          g.txt('design flow', 2, v.Qd + qmax * 0.035, C.mid, 'left', 11);
          if (isFinite(r.hdes)) {
            g.line([[r.hdes * 100, 0], [r.hdes * 100, v.Qd]], C.acc, 1.4, [4, 4]);
            g.dot(r.hdes * 100, v.Qd, C.acc, 5);
            g.txt((r.hdes * 100).toFixed(0) + '% open', r.hdes * 100, v.Qd - qmax * 0.055, C.mid, 'center', 11.5);
          }
          g.fill([[20, 0], [80, 0], [80, qmax], [20, qmax]], C.soft);
          g.legend([{ c: C.dk, l: 'installed' }, { c: C.mut, l: 'inherent', d: [6, 4], lw: 1.8 }]);
          g.ptxt('authority N = ' + r.auth.toFixed(3), g.x + 12, g.y + g.h - 16, C.ink, 'left', 12.5);
        }
      },
      {
        id: 'orifice',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const dp = self.rget(r, 'differential at design') || 0, loss = self.rget(r, 'permanent pressure loss') || 0;
  const Cq = self.rget(r, 'discharge coefficient') || 0;
  s.title('Orifice plate in the line', '\u03b2 ' + self.f(v.beta, 3) + ' \u00b7 bore ' + self.f(self.cvt(v.beta * v.D, 'mm')[0], 1) + ' ' + self.cvt(0, 'mm')[1]);
  const X = s.x + 56, W = s.w - 120, Y = s.y + 38, H = Math.min(126, s.h * 0.4);
  s.R(X, Y, W, H, { stroke: C.ink, lw: 1.8, fill: C.soft });
  const px = X + W * 0.38, bore = H * v.beta;
  s.R(px - 4, Y, 8, (H - bore) / 2, { stroke: C.ink, lw: 1.3, fill: C.bg });
  s.R(px - 4, Y + (H + bore) / 2, 8, (H - bore) / 2, { stroke: C.ink, lw: 1.3, fill: C.bg });
  for (let i = 0; i < 5; i++) {
    const y0 = Y + H * (i + 0.5) / 5;
    const yv = Y + H / 2 + (y0 - (Y + H / 2)) * v.beta * 0.86;
    s.L([[X + 6, y0], [px - 10, y0], [px + 10, yv], [px + W * 0.18, yv], [X + W - 8, y0]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 });
  }
  s.L([[px + W * 0.07, Y + H / 2 - bore * 0.44], [px + W * 0.07, Y + H / 2 + bore * 0.44]], { col: C.acc, lw: 1.2, dash: [3, 3] });
  s.T('vena contracta', px + W * 0.09, Y + H / 2 - bore * 0.44 - 10, { size: 10, col: C.acc });
  s.dim(px - 18, Y + (H - bore) / 2, px - 18, Y + (H + bore) / 2, 'd', { col: C.acc });
  s.dim(X - 20, Y, X - 20, Y + H, 'D ' + self.f(self.cvt(v.D, 'mm')[0], 0), { col: C.mut });
  const gy = Y + H + 86, gh = 58;
  s.T('static pressure along the line', X, gy - gh - 12, { size: 10, col: C.mut, caps: true });
  const prof = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60, xx = X + W * u;
    let pv;
    if (xx < px) pv = 1 - 0.02 * u;
    else if (xx < px + W * 0.07) pv = 0.98 - (xx - px) / (W * 0.07);
    else pv = -0.02 + (1 - loss / Math.max(dp, 1e-9)) * (1 - Math.exp(-(xx - px - W * 0.07) / (W * 0.12))) - (loss / Math.max(dp, 1e-9)) * 0;
    prof.push([xx, gy - gh * self.cl01(pv * 0.9 + 0.08)]);
  }
  s.L([[X, gy], [X + W, gy]], { col: 'rgba(29,31,32,0.2)', lw: 1 });
  s.L(prof, { col: C.dk, lw: 2.2 });
  s.L([[px, gy - gh - 6], [px, gy + 6]], { col: C.acc, lw: 1, dash: [3, 3] });
  s.badge(s.x + 56, s.y + s.h - 38, 'Differential \u0394p', self.f(self.cvt(dp, 'P')[0], 1) + ' ' + self.cvt(0, 'P')[1], null, { w: 150 });
  s.badge(s.x + 218, s.y + s.h - 38, 'Permanent loss', self.f(self.cvt(loss, 'P')[0], 1) + ' ' + self.cvt(0, 'P')[1] + ' (' + self.f(loss / Math.max(dp, 1e-9) * 100, 0) + '%)', 0.5 + 0.44 * self.cl01(loss / Math.max(dp, 1e-9)), { w: 168 });
  s.badge(s.x + 398, s.y + s.h - 38, 'Discharge coefficient', self.f(Cq, 4), null, { w: 148 });
},
        schemNote: 'Bore, jet contraction and the pressure trace are drawn from \u03b2. Open the bore and the differential collapses but so does the permanent loss \u2014 the trade the badges keep score of.',
        num: 'F-04', sec: S, name: 'Orifice plate flow meter',
        blurb: 'Differential pressure across a square-edged orifice, sized to ISO 5167. The beta ratio is the whole design decision: small beta buys signal and loses permanent head, large beta the reverse.',
        howto: 'The curve is the square-law relationship between flow and differential pressure at your chosen beta. Move beta and the curve pivots hard \u2014 the differential at design flow is what your transmitter has to resolve, and the permanent loss is what you pay for it forever. Standard practice keeps beta between 0.2 and 0.75 and the design differential near the top of the transmitter span.',
        std: 'ISO 5167-2:2003 \u2014 Reader-Harris/Gallagher discharge coefficient, corner tappings',
        eqs: [['q_m = \\frac{C}{\\sqrt{1-\\beta^4}}\\cdot\\frac{\\pi}{4}d^2\\sqrt{2\\Delta P\\rho}', 'ISO 5167 mass flow'], ['\\beta = \\frac{d}{D}', 'the whole design decision'], ['\\frac{\\Delta\\omega}{\\Delta P} = \\frac{\\sqrt{1-\\beta^4(1-C^2)}-C\\beta^2}{\\sqrt{1-\\beta^4(1-C^2)}+C\\beta^2}', 'permanent pressure loss fraction']],
        notes: ['Incompressible liquid \u2014 expansibility \u03b5 set to 1.', 'Corner tappings; add tapping terms for flange or D/D\u20442 taps.', 'ISO 5167 validity: Re_D > 5000 and 0.1 \u2264 \u03b2 \u2264 0.75.'],
        params: [P('D', 'Pipe internal diameter', 25, 1000, 1, 102.3, 'mm'), P('beta', 'Beta ratio  d/D', 0.1, 0.75, 0.005, 0.5, null, '\u2014'), P('Q', 'Design flow', 0.5, 3000, 0.5, 40, 'Q'), P('rho', 'Density', 1, 1600, 1, 998, 'rho'), P('mu', 'Viscosity', 0.05, 500, 0.05, 1, null, 'cP')],
        compute: v => {
          const D = v.D / 1000, d = v.beta * D, b4 = Math.pow(v.beta, 4);
          const A2 = Math.PI * d * d / 4, A1 = Math.PI * D * D / 4;
          const vel = (v.Q / 3600) / A1;
          const Re = v.rho * vel * D / (v.mu / 1000);
          const Cd = bt => {
            const R = Math.max(Re, 5000);
            const A = Math.pow(19000 * bt / R, 0.8);
            const M2 = 2 * 0.0 / (1 - bt);
            return 0.5961 + 0.0261 * bt * bt - 0.216 * Math.pow(bt, 8) + 0.000521 * Math.pow(1e6 * bt / R, 0.7) + (0.0188 + 0.0063 * A) * Math.pow(bt, 3.5) * Math.pow(1e6 / R, 0.3);
          };
          const C0 = Cd(v.beta);
          const dpOf = (Q, bt) => {
            const dd = bt * D, a2 = Math.PI * dd * dd / 4, c = Cd(bt);
            const qm = (Q / 3600) * v.rho;
            const den = c / Math.sqrt(1 - Math.pow(bt, 4)) * a2;
            return Math.pow(qm / den, 2) / (2 * v.rho) / 1000;
          };
          const dp = dpOf(v.Q, v.beta);
          const s = Math.sqrt(1 - b4 * (1 - C0 * C0));
          const loss = (s - C0 * v.beta * v.beta) / (s + C0 * v.beta * v.beta) * dp;
          return {
            dpOf: dpOf, dp: dp, Cd: C0, Re: Re,
            res: [{ l: 'Orifice bore d', v: v.beta * v.D, u: '', cv: 'mm', d: 2 }, { l: 'Pipe Reynolds Re_D', v: Re, u: '\u2014', d: 0 }, { l: 'Discharge coefficient C', v: C0, u: '\u2014', d: 4 }, { l: 'Differential at design flow', v: dp, u: '', cv: 'P' }, { l: 'Permanent pressure loss', v: loss, u: '', cv: 'P' }, { l: 'Loss / differential', v: loss / dp * 100, u: '%', d: 1 }, { l: 'Bore velocity', v: (v.Q / 3600) / (Math.PI * Math.pow(v.beta * D, 2) / 4), u: '', cv: 'vel' }, { l: 'ISO 5167 validity', s: Re > 5000 && v.beta >= 0.1 && v.beta <= 0.75 ? 'within standard' : 'outside standard range', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const qmax = v.Q * 1.4;
          const dmax = r.dpOf(qmax, v.beta) * 1.05;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: qmax, ymin: 0, ymax: dmax, ml: 74 });
          g.grid('Flow  (' + self.cvt(0, 'Q')[1] + ')', 'Differential pressure  (' + self.cvt(0, 'P')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'Q')[0], 0), t => self.f(self.cvt(t, 'P')[0], 0));
          g.title('Square-law response \u2014 \u0394p vs flow');
          [0.2, 0.3, 0.4, 0.5, 0.6, 0.7].forEach(bt => {
            if (Math.abs(bt - v.beta) < 0.004) return;
            g.fn(Q => r.dpOf(Q, bt), 'rgba(29,31,32,0.22)', 1.2);
            const yv = r.dpOf(qmax, bt);
            if (yv < dmax && yv > dmax * 0.03) g.txt('\u03b2=' + bt, qmax * 0.985, yv, C.mut, 'right', 10, 'bottom');
          });
          g.fn(Q => r.dpOf(Q, v.beta), C.dk, 2.8);
          g.line([[v.Q, 0], [v.Q, r.dp]], C.acc, 1.3, [4, 4]);
          g.line([[0, r.dp], [v.Q, r.dp]], C.acc, 1.3, [4, 4]);
          g.dot(v.Q, r.dp, C.acc, 5.5);
          g.txt('\u03b2 = ' + v.beta.toFixed(3) + '   C = ' + r.Cd.toFixed(4), v.Q, r.dp + dmax * 0.06, C.ink, 'center', 12);
        }
      }
    ];
  }
  /* ══ HEAT TRANSFER ════════════════════════════════════════ */
