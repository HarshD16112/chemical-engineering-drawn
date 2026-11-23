  dNewE() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const FL = 'Fluid Mechanics';
    const sw = (Re, rr) => Re < 2100 ? 64 / Math.max(Re, 1) : 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    return [
      {
        id: 'pumpcomb',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const par = v.mode === 'par', n = Math.max(1, Math.round(v.n));
  const Qn = self.rget(r, 'duty flow, combination') || 0, Hn = self.rget(r, 'duty head') || 0;
  const per = self.rget(r, 'flow per pump') || 0, Psh = self.rget(r, 'shaft power, total') || 0;
  s.title(par ? n + ' pumps in parallel' : n + ' pumps in series', self.f(self.cvt(Qn, 'Q')[0], 0) + ' ' + self.cvt(0, 'Q')[1] + ' at ' + self.f(self.cvt(Hn, 'L')[0], 1) + ' ' + self.cvt(0, 'L')[1]);
  const X = s.x + 70, W = s.w - 200;
  const cy = Math.min(s.cy, s.y + 106);
  let botY = cy + 40;
  if (par) {
    const pitch = Math.max(48, Math.min(70, (s.h - 110) / n));
    const y0 = cy - (n - 1) * pitch / 2;
    botY = y0 + (n - 1) * pitch + 40;
    s.L([[X - 44, cy], [X - 24, cy]], { col: C.acc, lw: 2.6, arrow: true });
    s.L([[X - 24, y0], [X - 24, y0 + (n - 1) * pitch]], { col: C.acc, lw: 2.2 });
    s.L([[X + W + 24, y0], [X + W + 24, y0 + (n - 1) * pitch]], { col: C.acc, lw: 2.2 });
    s.L([[X + W + 24, cy], [X + W + 54, cy]], { col: C.acc, lw: 2.6, arrow: true });
    for (let i = 0; i < n; i++) {
      const yy = y0 + i * pitch;
      s.L([[X - 24, yy], [X + W / 2 - 24, yy]], { col: C.acc, lw: 2 });
      s.pumpSym(X + W / 2, yy, 21, { col: C.acc });
      s.L([[X + W / 2 + 21, yy], [X + W + 24, yy]], { col: C.acc, lw: 2 });
      s.T(self.f(self.cvt(per, 'Q')[0], 0), X + W / 2 + 26, yy - 11, { size: 10, col: C.mut });
    }
  } else {
    const pitch = Math.min(150, W / n);
    s.L([[X - 50, cy], [X, cy]], { col: C.acc, lw: 2.6, arrow: true });
    for (let i = 0; i < n; i++) {
      const xx = X + pitch * (i + 0.5);
      s.pumpSym(xx, cy, 22, { col: C.acc });
      s.L([[xx + 22, cy], [xx + pitch - 22, cy]], { col: C.acc, lw: 2.2, arrow: i < n - 1 });
      s.T('+' + self.f(self.cvt(Hn / n, 'L')[0], 1), xx, cy + 36, { align: 'center', size: 10, col: C.mut });
    }
    s.L([[X + pitch * n - 22, cy], [X + pitch * n + 36, cy]], { col: C.acc, lw: 2.6, arrow: true });
  }
  s.T(par ? 'flow adds, head is shared' : 'head adds, flow is common', s.cx, Math.min(s.y + s.h - 14, botY + 24), { align: 'center', size: 11, col: C.mut });
  const bx = s.x + s.w - 124;
  s.badge(bx, s.y + 2, 'Combination flow', self.f(self.cvt(Qn, 'Q')[0], 0), null, { w: 124 });
  s.badge(bx, s.y + 46, 'Head', self.f(self.cvt(Hn, 'L')[0], 1), null, { w: 124 });
  s.badge(bx, s.y + 90, 'Total shaft power', self.f(self.cvt(Psh, 'W')[0], 1), 0.5 + 0.4 * self.cl01(Psh / 400), { w: 124 });
},
        schemNote: 'One pump symbol per running machine, piped the way the arrangement actually works \u2014 parallel on a common header, series nose to tail. Change the count and the manifold redraws.',
        num: 'F-10', sec: FL, name: 'Pumps in series & parallel',
        blurb: 'Two pumps never give twice the duty. In parallel they share a head that rises as the system fights back, so the second machine adds far less than the first; in series they stack head but the flow barely moves unless the system curve is steep.',
        howto: 'The thin curve is one pump, the heavy one the combination, and the rising curve is the system. Watch the duty point as you add machines \u2014 on a friction-dominated system parallel pumps saturate quickly, while on a static-head-dominated system series pumps are the ones that do nothing.',
        std: 'Pump combination analysis \u2014 Hydraulic Institute ANSI/HI 1.3; Karassik, Pump Handbook Ch. 2',
        eqs: [['H = H_0 - aQ^2,\\qquad a = \\frac{H_0 - H_r}{Q_r^2}', 'quadratic pump curve through the rated point'], ['H_{par}(Q) = H_0 - a\\left(\\frac{Q}{n}\\right)^2,\\qquad H_{ser}(Q) = n\\left(H_0 - aQ^2\\right)', 'n identical pumps in parallel share the flow; in series they stack the head'], ['H_{sys} = H_{stat} + kQ^2,\\qquad k = \\frac{\\Delta H_{fric}}{Q_r^2}', 'system curve'], ['P_{shaft} = \\frac{\\rho gQH}{\\eta},\\qquad \\eta = \\eta_{max}\\left[2\\frac{Q}{Q_{bep}} - \\left(\\frac{Q}{Q_{bep}}\\right)^2\\right]', 'shaft power and the parabolic efficiency island']],
        notes: ['Identical pumps, identical suction conditions and no interaction between machines.', 'Series operation assumes the second casing can take the combined discharge pressure.', 'NPSH is not checked here \u2014 parallel pumps at low flow are the usual recirculation problem.'],
        params: [{ k: 'mode', label: 'Arrangement', type: 'select', val: 'par', options: [['par', 'Parallel'], ['ser', 'Series']] }, P('n', 'Number of pumps running', 1, 4, 1, 2, null, '\u2014'), P('H0', 'Shut-off head', 10, 300, 1, 62, 'L'), P('Qr', 'Rated flow (one pump)', 5, 3000, 5, 200, 'Q'), P('Hr', 'Rated head (one pump)', 5, 250, 1, 50, 'L'), P('Hstat', 'Static head of the system', 0, 200, 1, 18, 'L'), P('dHf', 'System friction at rated flow', 1, 200, 1, 32, 'L'), P('rho', 'Liquid density', 500, 1600, 10, 1000, 'rho'), P('emax', 'Best efficiency', 0.4, 0.9, 0.01, 0.78, null, '\u2014')],
        compute: v => {
          const a = (v.H0 - v.Hr) / (v.Qr * v.Qr), k = v.dHf / (v.Qr * v.Qr);
          const one = Q => v.H0 - a * Q * Q;
          const comb = (Q, n) => v.mode === 'ser' ? n * one(Q) : one(Q / n);
          const sys = Q => v.Hstat + k * Q * Q;
          const duty = n => { const f = Q => comb(Q, n) - sys(Q); const hi = v.Qr * 8; return f(0) <= 0 ? 0 : self.bis(f, 1e-6, hi, 1e-7); };
          const Qn = duty(v.n), Q1 = duty(1);
          const Hn = sys(Qn);
          const per = v.mode === 'ser' ? Qn : Qn / v.n;
          const eff = Math.max(v.emax * (2 * (per / v.Qr) - Math.pow(per / v.Qr, 2)), 0.05);
          const Pshaft = v.rho * 9.80665 * (Qn / 3600) * Hn / eff / 1000;
          return {
            one: one, comb: comb, sys: sys, Qn: Qn, Hn: Hn, Q1: Q1, duty: duty, a: a,
            res: [{ l: 'Duty flow, combination', v: Qn, u: '', cv: 'Q', d: 1 }, { l: 'Duty head', v: Hn, u: '', cv: 'L', d: 2 }, { l: 'Flow with one pump', v: Q1, u: '', cv: 'Q', d: 1 }, { l: 'Gain over a single pump', v: (Qn / Math.max(Q1, 1e-9) - 1) * 100, u: '%', d: 1 }, { l: 'Flow per pump', v: per, u: '', cv: 'Q', d: 1 }, { l: 'Head per pump', v: v.mode === 'ser' ? Hn / v.n : Hn, u: '', cv: 'L', d: 2 }, { l: 'Flow as % of BEP', v: per / v.Qr * 100, u: '%', d: 1 }, { l: 'Efficiency at duty', v: eff * 100, u: '%', d: 1 }, { l: 'Shaft power, total', v: Pshaft, u: '', cv: 'W', d: 2 }, { l: 'Shaft power per pump', v: Pshaft / v.n, u: '', cv: 'W', d: 2 }, { l: 'Verdict', s: v.mode === 'par' && Qn / Math.max(Q1, 1e-9) < 1.25 ? 'friction-dominated \u2014 parallel pumps buy very little' : v.mode === 'ser' && Qn / Math.max(Q1, 1e-9) < 1.15 ? 'flat system \u2014 series pumps buy very little' : 'the combination is doing useful work', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const qmax = Math.max(r.Qn, r.Q1, v.Qr) * 1.5;
          const hmax = Math.max(v.mode === 'ser' ? v.n * v.H0 : v.H0, r.Hn) * 1.1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: qmax, ymin: 0, ymax: hmax, ml: 72 });
          g.grid('Flow  (' + self.cvt(0, 'Q')[1] + ')', 'Head  (' + self.cvt(0, 'L')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'Q')[0], 0), t => self.f(self.cvt(t, 'L')[0], 0));
          g.title(v.mode === 'ser' ? 'Series operation' : 'Parallel operation');
          g.fn(q => r.one(q), C.lt, 1.8, [6, 4]);
          g.fn(q => r.comb(q, v.n), C.dk, 2.8);
          g.fn(q => r.sys(q), C.mid, 2.2);
          for (let i = 1; i <= v.n; i++) { const q = r.duty(i); g.dot(q, r.sys(q), i === v.n ? C.acc : 'rgba(29,31,32,0.35)', i === v.n ? 6 : 4); }
          g.txt(self.f(self.cvt(r.Qn, 'Q')[0], 0) + ' ' + self.cvt(0, 'Q')[1], r.Qn, r.Hn + hmax * 0.04, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: v.n + ' pump' + (v.n > 1 ? 's' : '') }, { c: C.lt, l: 'one pump', d: [6, 4] }, { c: C.mid, l: 'system' }]);
        }
      },
      {
        id: 'recip', num: 'F-11', sec: FL, name: 'Reciprocating compressor rating',
        blurb: 'A positive-displacement machine sweeps a fixed volume, but it never delivers it. Gas trapped in the clearance volume re-expands on the suction stroke and steals capacity \u2014 and the higher the pressure ratio, the more it steals.',
        howto: 'Each curve is volumetric efficiency against pressure ratio for one clearance setting. Follow yours to the right and watch capacity fall away; where the curve reaches zero the cylinder is simply breathing its own clearance gas. That is why unloader pockets exist \u2014 they move you onto a worse curve on purpose.',
        std: 'API 618 6th ed.; GPSA Engineering Data Book \u00a713 \u2014 reciprocating compressors',
        eqs: [['PD = \\frac{\\pi}{4}D^2LN \\quad\\text{(single acting)},\\qquad PD = \\frac{\\pi}{4}(2D^2 - d_{rod}^2)LN \\quad\\text{(double acting)}', 'piston displacement'], ['VE = 100 - C\\left(r^{1/k}\\frac{Z_s}{Z_d} - 1\\right) - L_v,\\qquad r = \\frac{P_d}{P_s}', 'volumetric efficiency, with a valve-loss allowance'], ['T_d = T_s\\,r^{\\frac{k-1}{k}}', 'adiabatic discharge temperature'], ['W = \\frac{k}{k-1}P_sQ_s\\left(r^{\\frac{k-1}{k}} - 1\\right)\\frac{1}{\\eta_m}', 'gas power on the shaft']],
        notes: ['Clearance is a percentage of swept volume; 8\u201316% is typical for process cylinders.', 'Valve and pulsation losses lumped into a fixed 4% allowance.', 'Rod load is gas load only \u2014 inertia load must be added before comparing with the frame rating.'],
        params: [{ k: 'act', label: 'Cylinder action', type: 'select', val: 'dbl', options: [['dbl', 'Double acting'], ['sgl', 'Single acting']] }, PF('D', 'Cylinder bore', 50, 900, 1, 250, 'mm'), PF('L', 'Stroke', 40, 700, 1, 152, 'mm'), P('N', 'Speed', 100, 1200, 5, 360, null, 'rpm'), P('drod', 'Piston rod diameter', 15, 180, 1, 60, 'mm'), P('Cl', 'Clearance volume', 4, 40, 0.5, 12, null, '% of swept'), P('Ps', 'Suction pressure (abs)', 0.5, 100, 0.5, 6, null, 'bar a'), P('Pd', 'Discharge pressure (abs)', 1, 400, 0.5, 18, null, 'bar a'), P('Ts', 'Suction temperature', -40, 120, 1, 35, 'T'), P('k', 'Heat capacity ratio k', 1.05, 1.7, 0.01, 1.26, null, '\u2014'), P('MW', 'Molecular weight', 2, 100, 0.5, 19, null, 'kg/kmol'), P('Zs', 'Suction Z', 0.7, 1.1, 0.005, 0.98, null, '\u2014'), P('etam', 'Mechanical efficiency', 0.8, 0.98, 0.005, 0.92, null, '\u2014')],
        compute: v => {
          const D = v.D / 1000, L = v.L / 1000, d = v.drod / 1000;
          const area = v.act === 'dbl' ? Math.PI / 4 * (2 * D * D - d * d) : Math.PI / 4 * D * D;
          const PD = area * L * v.N * 60;
          const r = v.Pd / v.Ps, TsK = v.Ts + 273.15;
          const Zd = Math.min(v.Zs + 0.02, 1.05);
          const VEof = (rr, cl) => Math.max(100 - cl * (Math.pow(rr, 1 / v.k) * v.Zs / Zd - 1) - 4, 0);
          const VE = VEof(r, v.Cl);
          const Qs = PD * VE / 100;
          const Std = Qs * (v.Ps * 1e5) * 273.15 / (1.01325e5 * TsK * v.Zs);
          const mdot = Qs * (v.Ps * 1e5) * v.MW / (v.Zs * 8314 * TsK);
          const Td = TsK * Math.pow(r, (v.k - 1) / v.k) - 273.15;
          const W = (v.k / (v.k - 1)) * v.Ps * 1e5 * (Qs / 3600) * (Math.pow(r, (v.k - 1) / v.k) - 1) / v.etam / 1000;
          const Ah = Math.PI / 4 * D * D, Ac = Ah - Math.PI / 4 * d * d;
          const comp = (v.Pd * 1e5 * Ah - v.Ps * 1e5 * Ac) / 1000;
          const tens = (v.Pd * 1e5 * Ac - v.Ps * 1e5 * Ah) / 1000;
          const pspeed = 2 * L * v.N / 60;
          return {
            VEof: VEof, VE: VE, PD: PD, r: r,
            res: [{ l: 'Pressure ratio', v: r, u: '\u2014', d: 3 }, { l: 'Piston displacement', v: PD, u: 'm\u00b3/h', d: 1 }, { l: 'Volumetric efficiency', v: VE, u: '%', d: 2 }, { l: 'Inlet capacity', v: Qs, u: 'm\u00b3/h', d: 1 }, { l: 'Standard flow', v: Std, u: 'Sm\u00b3/h', d: 0 }, { l: 'Mass flow', v: mdot, u: '', cv: 'M', d: 0 }, { l: 'Discharge temperature', v: Td, u: '', cv: 'T', d: 1 }, { l: 'Temperature verdict', s: Td > 150 ? 'above 150 \u00b0C \u2014 split the ratio or intercool' : 'within normal cylinder limits', u: '' }, { l: 'Gas power', v: W, u: '', cv: 'W', d: 2 }, { l: 'Piston speed', v: pspeed, u: 'm/s', d: 2 }, { l: 'Speed verdict', s: pspeed > 4.5 ? 'high \u2014 valve and ring life will suffer' : 'acceptable for a process machine', u: '' }, { l: 'Gas rod load, compression', v: comp, u: 'kN', d: 1 }, { l: 'Gas rod load, tension', v: tens, u: 'kN', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const rmax = Math.max(r.r * 1.6, 5);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: rmax, ymin: 0, ymax: 100, ml: 70 });
          g.grid('Pressure ratio  P\u1d48 / P\u209b', 'Volumetric efficiency  (%)', 5, 5);
          g.title('Clearance eats the capacity');
          [6, v.Cl, 25].forEach((cl, i) => {
            const sel = i === 1;
            g.fn(rr => r.VEof(rr, cl), sel ? C.dk : 'rgba(29,31,32,0.26)', sel ? 2.8 : 1.5, sel ? [] : [6, 4]);
            g.txt(self.f(cl, 0) + '%', rmax * 0.99, r.VEof(rmax, cl) + 2.5, sel ? C.dk : C.mut, 'right', 10.5, 'bottom');
          });
          g.line([[r.r, 0], [r.r, r.VE]], C.mut, 1.3, [4, 4]);
          g.dot(r.r, r.VE, C.acc, 5.5);
          g.txt('VE = ' + self.f(r.VE, 1) + '%', r.r, r.VE + 5, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'your clearance' }, { c: 'rgba(29,31,32,0.26)', l: 'other clearances', d: [6, 4], lw: 1.5 }]);
        }
      },
      {
        id: 'gaspipe', num: 'F-12', sec: FL, name: 'Natural gas pipeline sizing',
        blurb: 'Transmission lines are not sized on the Darcy equation \u2014 they are sized on one of four industry flow equations, and the four disagree by up to 15% on the same pipe. Weymouth is conservative, Panhandle B is optimistic, and which one your contract names matters.',
        howto: 'Each curve is delivery capacity against outlet pressure for your line. The spread between them is the model uncertainty you are carrying; the steep left-hand end is where the line is running out of pressure. Note how little capacity the last few bar of outlet pressure cost \u2014 and how much a bigger diameter buys, since capacity goes as roughly D to the power 2.5.',
        std: 'Menon, Gas Pipeline Hydraulics \u2014 general flow, Weymouth, Panhandle A and B; AGA NB-13 transmission factor',
        eqs: [['Q = 1.1494\\times10^{-3}\\,E\\frac{T_b}{P_b}\\left[\\frac{P_1^2 - e^sP_2^2}{GT_fL_eZf}\\right]^{0.5}D^{2.5}', 'general flow equation — Q in standard m³/day, P in kPa, D in mm, L in km'], ['s = 0.0684\\,G\\frac{H_2 - H_1}{T_fZ},\\qquad L_e = L\\frac{e^s - 1}{s}', 'elevation correction and the equivalent length'], ['F = \\frac{2}{\\sqrt f} = 11.18\\,D^{1/6}', 'Weymouth transmission factor'], ['Q_{PB} = 1.002\\times10^{-2}E\\left(\\frac{T_b}{P_b}\\right)^{1.02}\\left[\\frac{P_1^2 - e^sP_2^2}{G^{0.961}T_fL_eZ}\\right]^{0.51}D^{2.53}', 'Panhandle B — the large-diameter, high-flow correlation']],
        notes: ['Isothermal, steady state, single phase; base conditions 15 \u00b0C and 101.325 kPa.', 'Pipeline efficiency E covers internal condition: 0.95 new and dry, 0.85\u20130.92 in service.', 'Panhandle correlations carry their own implied friction \u2014 do not also apply a roughness.'],
        params: [{ k: 'meth', label: 'Flow equation', type: 'select', val: 'gen', options: [['gen', 'General (Colebrook friction)'], ['wey', 'Weymouth'], ['pa', 'Panhandle A'], ['pb', 'Panhandle B']] }, PF('D', 'Internal diameter', 50, 1500, 1, 500, 'mm'), PF('L', 'Line length', 1, 800, 1, 100, null, 'km'), P('P1', 'Inlet pressure (abs)', 5, 150, 0.5, 70, null, 'bar a'), P('P2', 'Outlet pressure (abs)', 2, 140, 0.5, 50, null, 'bar a'), P('G', 'Gas specific gravity', 0.55, 1, 0.005, 0.6, null, '\u2014'), P('Tf', 'Flowing temperature', -10, 60, 1, 15, 'T'), P('Z', 'Compressibility Z', 0.7, 1, 0.005, 0.88, null, '\u2014'), P('E', 'Pipeline efficiency', 0.7, 1, 0.01, 0.95, null, '\u2014'), P('dH', 'Elevation gain', -1000, 1000, 10, 0, 'L'), P('rough', 'Absolute roughness', 0.005, 0.5, 0.005, 0.018, null, 'mm')],
        compute: v => {
          const Tb = 288.15, Pb = 101.325, TfK = v.Tf + 273.15;
          const s = 0.0684 * v.G * v.dH / (TfK * v.Z);
          const Le = Math.abs(s) < 1e-9 ? v.L : v.L * (Math.exp(s) - 1) / s;
          const p1 = v.P1 * 100, p2k = v.P2 * 100;
          const Qof = (meth, P2) => {
            const p2 = P2 * 100;
            const dp = p1 * p1 - Math.exp(s) * p2 * p2;
            if (dp <= 0) return 0;
            if (meth === 'wey') return 3.7435e-3 * v.E * (Tb / Pb) * Math.pow(dp / (v.G * TfK * Le * v.Z), 0.5) * Math.pow(v.D, 2.667);
            if (meth === 'pa') return 4.5965e-3 * v.E * Math.pow(Tb / Pb, 1.0788) * Math.pow(dp / (Math.pow(v.G, 0.8539) * TfK * Le * v.Z), 0.5394) * Math.pow(v.D, 2.6182);
            if (meth === 'pb') return 1.002e-2 * v.E * Math.pow(Tb / Pb, 1.02) * Math.pow(dp / (Math.pow(v.G, 0.961) * TfK * Le * v.Z), 0.51) * Math.pow(v.D, 2.53);
            let f = 0.01;
            for (let i = 0; i < 40; i++) f = 1 / Math.pow(-2 * Math.log10(v.rough / v.D / 3.7 + 2.51 / (5e6 * Math.sqrt(f))), 2);
            return 1.1494e-3 * v.E * (Tb / Pb) * Math.pow(dp / (v.G * TfK * Le * v.Z * f), 0.5) * Math.pow(v.D, 2.5);
          };
          const Q = Qof(v.meth, v.P2);
          const A = Math.PI * Math.pow(v.D / 1000, 2) / 4;
          const vel = p => Q / 86400 * (Pb / (p * 100)) * (TfK / Tb) * v.Z / A;
          const rhoStd = v.G * 1.225;
          const mdot = Q * rhoStd / 24;
          const erosion = 122 / Math.sqrt(rhoStd * (v.P1 * 100 / Pb) * (Tb / TfK) / v.Z);
          return {
            Qof: Qof, Q: Q,
            res: [{ l: 'Delivery capacity', v: Q / 1e6, u: 'MMSm\u00b3/day', d: 4 }, { l: 'Delivery capacity', v: Q / 24, u: 'Sm\u00b3/h', d: 0 }, { l: 'Delivery capacity', v: Q * 35.3147 / 1e6, u: 'MMSCFD', d: 3 }, { l: 'Mass flow', v: mdot, u: '', cv: 'M', d: 0 }, { l: 'Equivalent length', v: Le, u: 'km', d: 2 }, { l: 'Elevation parameter s', v: s, u: '\u2014', d: 5 }, { l: 'Inlet velocity', v: vel(v.P1), u: '', cv: 'vel', d: 2 }, { l: 'Outlet velocity', v: vel(v.P2), u: '', cv: 'vel', d: 2 }, { l: 'Erosional velocity limit', v: erosion, u: '', cv: 'vel', d: 2 }, { l: 'Velocity verdict', s: vel(v.P2) > erosion ? 'above the API 14E erosional limit' : vel(v.P2) > 20 ? 'high \u2014 noise and vibration risk' : 'acceptable', u: '' }, { l: 'Pressure drop', v: v.P1 - v.P2, u: 'bar', d: 2 }, { l: 'Weymouth capacity for comparison', v: Qof('wey', v.P2) / 1e6, u: 'MMSm\u00b3/day', d: 4 }, { l: 'Panhandle B for comparison', v: Qof('pb', v.P2) / 1e6, u: 'MMSm\u00b3/day', d: 4 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const meths = [['gen', 'general'], ['wey', 'Weymouth'], ['pa', 'Panhandle A'], ['pb', 'Panhandle B']];
          const cols = [C.dk, C.mid, C.lt, C.acc];
          let ymax = 0;
          meths.forEach(m => { ymax = Math.max(ymax, r.Qof(m[0], v.P2 * 0.55) / 1e6); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: v.P2 * 0.5, xmax: v.P1 * 0.99, ymin: 0, ymax: Math.max(ymax * 1.08, 0.01), ml: 78 });
          g.grid('Outlet pressure  (bar a)', 'Capacity  (MMSm\u00b3/day)', 5, 5, null, t => self.f(t, 2));
          g.title('Capacity by flow equation');
          meths.forEach((m, i) => g.fn(p => r.Qof(m[0], p) / 1e6, cols[i], m[0] === v.meth ? 2.8 : 1.5, m[0] === v.meth ? [] : [6, 4]));
          g.dot(v.P2, r.Q / 1e6, C.acc, 5.5);
          g.txt(self.f(r.Q / 1e6, 3), v.P2, r.Q / 1e6 + ymax * 0.05, C.ink, 'center', 12);
          g.legend(meths.map((m, i) => ({ c: cols[i], l: m[1], d: m[0] === v.meth ? [] : [6, 4] })));
        }
      },
      {
        id: 'ro', num: 'F-13', sec: FL, name: 'Restriction orifice',
        blurb: 'A plate that exists to waste pressure. Sized like a meter but used like a valve, and the two failure modes are opposite: on liquid it cavitates, on gas it chokes \u2014 both of which cap what the single plate can do and force you into a multi-stage set.',
        howto: 'The curve is the bore that passes your flow at each downstream pressure. The shaded band is where a single plate cavitates or chokes; if your point falls in it, add stages \u2014 each plate then takes a share of the total drop and the bores come back up into safe territory.',
        std: 'ISO 5167-2 discharge coefficients; API 520 for critical gas flow; cavitation index practice per ISA RP75.23',
        eqs: [['Q = C_dA\\sqrt{\\frac{2\\Delta P}{\\rho\\left(1 - \\beta^4\\right)}},\\qquad \\beta = \\frac{d}{D}', 'incompressible flow through the plate'], ['\\sigma = \\frac{P_1 - P_v}{P_1 - P_2}', 'cavitation index — below about 1.5 the plate will cavitate'], ['\\dot m_{crit} = C_dAP_1\\sqrt{\\frac{kM}{ZRT}\\left(\\frac{2}{k+1}\\right)^{\\frac{k+1}{k-1}}}', 'choked gas flow through a single plate'], ['\\Delta P_{stage} = \\frac{\\Delta P_{total}}{n},\\qquad P_{perm} \\approx \\Delta P\\left(1 - \\beta^{1.9}\\right)', 'multi-stage split and the permanent loss']],
        notes: ['Single-phase, sharp-edged plate, C_d taken as 0.62 for a thin plate and 0.80 for a thick one.', 'Stages must be spaced at least 5 diameters apart or they behave as one plate.', 'Noise is not predicted \u2014 above 4 bar of gas drop across one plate, expect to need acoustic treatment.'],
        params: [{ k: 'svc', label: 'Service', type: 'select', val: 'liq', options: [['liq', 'Liquid'], ['gas', 'Gas or vapour']] }, P('Dpipe', 'Pipe internal diameter', 15, 600, 1, 77.9, 'mm'), P('Q', 'Liquid flow', 0.5, 2000, 0.5, 40, 'Q'), P('W', 'Gas mass flow', 10, 200000, 10, 2000, null, 'kg/h'), P('P1', 'Upstream pressure (abs)', 1, 200, 0.5, 20, null, 'bar a'), P('P2', 'Downstream pressure (abs)', 0.5, 190, 0.5, 6, null, 'bar a'), P('rho', 'Liquid density', 400, 1600, 5, 990, 'rho'), P('Pv', 'Liquid vapour pressure', 0.01, 50, 0.01, 0.25, null, 'bar a'), P('MW', 'Gas molecular weight', 2, 120, 0.5, 28, null, 'kg/kmol'), P('T', 'Temperature', -50, 400, 1, 40, 'T'), P('k', 'Heat capacity ratio k', 1.05, 1.7, 0.01, 1.4, null, '\u2014'), P('n', 'Number of plates', 1, 6, 1, 1, null, '\u2014'), P('Cd', 'Discharge coefficient', 0.55, 0.85, 0.005, 0.62, null, '\u2014')],
        compute: v => {
          const D = v.Dpipe / 1000, Apipe = Math.PI * D * D / 4;
          const dPtot = Math.max(v.P1 - v.P2, 1e-6) * 1e5, dPst = dPtot / v.n;
          const TK = v.T + 273.15, Rs = 8314 / v.MW;
          const bore = P2 => {
            const dP = Math.max(v.P1 - P2, 1e-6) * 1e5 / v.n;
            if (v.svc === 'liq') {
              const Qm = v.Q / 3600;
              let d = D * 0.4;
              for (let i = 0; i < 60; i++) {
                const be = Math.min(d / D, 0.85);
                const A = Qm / (v.Cd * Math.sqrt(2 * dP / (v.rho * (1 - Math.pow(be, 4)))));
                d = Math.sqrt(4 * A / Math.PI);
              }
              return d * 1000;
            }
            const P1s = v.P1 * 1e5 - (v.n - 1) * dP;
            const rho1 = P1s / (Rs * TK);
            const rcrit = Math.pow(2 / (v.k + 1), v.k / (v.k - 1));
            const P2s = P1s - dP;
            const W = v.W / 3600;
            let A;
            if (P2s / P1s <= rcrit) A = W / (v.Cd * P1s * Math.sqrt(v.k / (Rs * TK) * Math.pow(2 / (v.k + 1), (v.k + 1) / (v.k - 1))));
            else A = W / (v.Cd * Math.sqrt(2 * rho1 * P1s * (v.k / (v.k - 1)) * (Math.pow(P2s / P1s, 2 / v.k) - Math.pow(P2s / P1s, (v.k + 1) / v.k))));
            return Math.sqrt(4 * A / Math.PI) * 1000;
          };
          const d = bore(v.P2), beta = d / v.Dpipe;
          const sigma = (v.P1 - v.Pv) / Math.max(v.P1 - v.P2, 1e-6);
          const rcrit = Math.pow(2 / (v.k + 1), v.k / (v.k - 1));
          const choked = v.svc === 'gas' && (v.P2 / v.P1) <= Math.pow(rcrit, 1);
          const vel = v.svc === 'liq' ? (v.Q / 3600) / (Math.PI * Math.pow(d / 1000, 2) / 4) : 0;
          const perm = dPtot * (1 - Math.pow(Math.min(beta, 0.9), 1.9)) / 1e5;
          const res = [{ l: 'Total pressure drop', v: v.P1 - v.P2, u: 'bar', d: 2 }, { l: 'Drop per plate', v: dPst / 1e5, u: 'bar', d: 3 }, { l: 'Bore per plate', v: d, u: '', cv: 'mm', d: 2 }, { l: 'Beta ratio d/D', v: beta, u: '\u2014', d: 4 }, { l: 'Beta verdict', s: beta < 0.15 ? 'very small bore \u2014 plugging risk, add stages' : beta > 0.7 ? 'large bore \u2014 the plate is barely restricting' : 'sensible range', u: '' }, { l: 'Permanent pressure loss', v: perm, u: 'bar', d: 3 }];
          if (v.svc === 'liq') res.push({ l: 'Bore velocity', v: vel, u: '', cv: 'vel', d: 1 }, { l: 'Cavitation index \u03c3', v: sigma, u: '\u2014', d: 3 }, { l: 'Cavitation verdict', s: sigma < 1.2 ? 'flashing \u2014 the plate cannot be used as sized' : sigma < 1.7 ? 'cavitating \u2014 add stages or move the drop downstream' : sigma < 2.5 ? 'incipient cavitation \u2014 acceptable for intermittent duty' : 'no cavitation expected', u: '' }, { l: 'Stages suggested', v: Math.max(Math.ceil((v.P1 - v.Pv) / Math.max(1.7 * (v.P1 - v.P2) / v.n, 1e-6) < 1 ? v.n + 1 : v.n), 1), u: '\u2014', d: 0 });
          else res.push({ l: 'Critical pressure ratio', v: rcrit, u: '\u2014', d: 4 }, { l: 'Actual ratio P\u2082/P\u2081 per plate', v: (v.P1 - dPst / 1e5) / v.P1, u: '\u2014', d: 4 }, { l: 'Flow condition', s: choked ? 'choked at the last plate \u2014 add stages to recover control' : 'subcritical through every plate', u: '' });
          return { bore: bore, d: d, sigma: sigma, res: res };
        },
        draw: (ctx, b, v, r) => {
          const p2min = Math.max(v.P1 * 0.05, 0.3), p2max = v.P1 * 0.95;
          let ymax = 0;
          for (let i = 0; i <= 40; i++) { const p = p2min + (p2max - p2min) * i / 40; ymax = Math.max(ymax, r.bore(p)); }
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: p2min, xmax: p2max, ymin: 0, ymax: Math.min(ymax * 1.1, v.Dpipe * 1.1), ml: 70 });
          g.grid('Downstream pressure  (bar a)', 'Bore per plate  (' + self.cvt(0, 'mm')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'mm')[0], 1));
          g.title(v.n > 1 ? v.n + '-stage restriction set' : 'Single restriction plate');
          const bad = v.svc === 'liq' ? Math.max(v.P1 - (v.P1 - v.Pv) / 1.7, p2min) : v.P1 * Math.pow(2 / (v.k + 1), v.k / (v.k - 1));
          if (v.svc === 'liq') g.fill([[p2min, 0], [bad, 0], [bad, v.Dpipe * 1.1], [p2min, v.Dpipe * 1.1]], C.soft2);
          else g.fill([[p2min, 0], [bad, 0], [bad, v.Dpipe * 1.1], [p2min, v.Dpipe * 1.1]], C.soft2);
          g.txt(v.svc === 'liq' ? 'cavitating' : 'choked', bad, v.Dpipe * 0.06, C.mut, 'right', 11);
          g.line([[p2min, v.Dpipe], [p2max, v.Dpipe]], C.mut, 1.2, [3, 3]);
          g.txt('pipe bore', p2max * 0.99, v.Dpipe * 0.97, C.mut, 'right', 10.5);
          g.fn(p => r.bore(p), C.dk, 2.8);
          g.dot(v.P2, r.d, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.d, 'mm')[0], 1) + ' ' + self.cvt(0, 'mm')[1], v.P2, r.d + v.Dpipe * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'required bore' }]);
        }
      },
      {
        id: 'rota',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Qa = self.rget(r, 'flow at this reading') || 0, corr = self.rget(r, 'density correction') || 1;
  const vel = self.rget(r, 'annular velocity') || 0;
  s.title('Variable-area meter', 'float at ' + self.f(v.read, 0) + '% of scale');
  const Htube = Math.min(s.h - 70, 250), Ytop = s.y + 34, Ybot = Ytop + Htube;
  const sc = Math.min(2.6, (s.w * 0.1) / Math.max(v.D0, 1));
  const tanA = Math.tan(v.taper * Math.PI / 180);
  const dTop = v.D0 + 2 * tanA * v.Lt;
  const cx = s.x + s.w * 0.33;
  const wB = v.D0 * sc * 3.2, wT = dTop * sc * 3.2;
  s.L([[cx - wB / 2, Ybot], [cx - wT / 2, Ytop]], { col: C.ink, lw: 1.8 });
  s.L([[cx + wB / 2, Ybot], [cx + wT / 2, Ytop]], { col: C.ink, lw: 1.8 });
  s.L([[cx - wB / 2, Ybot], [cx + wB / 2, Ybot]], { col: C.ink, lw: 1.8 });
  s.L([[cx - wT / 2, Ytop], [cx + wT / 2, Ytop]], { col: C.ink, lw: 1.8 });
  const u = self.cl01(v.read / 100), fy = Ybot - Htube * u;
  const fw = v.Df * sc * 3.2, fh = Math.max(16, fw * 0.5);
  s.L([[cx - fw / 2, fy + fh * 0.42], [cx + fw / 2, fy + fh * 0.42], [cx + fw / 2, fy - fh * 0.1], [cx, fy - fh * 0.58], [cx - fw / 2, fy - fh * 0.1]], { col: C.acc, lw: 1.5, close: true, fill: C.soft3 });
  for (let i = 0; i <= 10; i++) {
    const yy = Ybot - Htube * i / 10, ww = wB + (wT - wB) * i / 10;
    s.L([[cx + ww / 2 + 2, yy], [cx + ww / 2 + (i % 2 ? 6 : 11), yy]], { col: C.mut, lw: 1 });
    if (i % 2 === 0) s.T(String(i * 10), cx + ww / 2 + 15, yy, { size: 9.5, col: C.mut });
  }
  for (let i = 0; i < 5; i++) { const yy = Ybot - 10 - i * 14; s.L([[cx - wB / 2 + 6, yy], [cx - wB / 2 + 6, yy - 9]], { col: C.mid, lw: 1.2, arrow: true, asz: 4.5 }); }
  s.L([[cx, Ybot + 30], [cx, Ybot + 6]], { col: C.mid, lw: 2.4, arrow: true });
  s.T('flow in', cx + 10, Ybot + 24, { size: 10.5, col: C.mid });
  s.L([[cx, Ytop - 6], [cx, Ytop - 30]], { col: C.mid, lw: 2.4, arrow: true });
  s.T('flow out', cx + 10, Ytop - 24, { size: 10.5, col: C.mid });
  s.dim(cx - wB / 2 - 24, Ybot, cx - wT / 2 - 24, Ytop, self.f(self.cvt(v.Lt, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], { col: C.mut });
  const bx = s.x + s.w - 176;
  s.badge(bx, s.y + 6, 'Flow, your fluid', self.f(self.cvt(Qa, 'Q')[0], 3) + ' ' + self.cvt(0, 'Q')[1], null, { w: 176 });
  s.badge(bx, s.y + 50, 'Density correction', '\u00d7 ' + self.f(corr, 4), null, { w: 176 });
  s.badge(bx, s.y + 94, 'Annular velocity', self.f(self.cvt(vel, 'vel')[0], 2) + ' ' + self.cvt(0, 'vel')[1], null, { w: 176 });
  if (v.read < 20) s.T('below 20% of scale \u2014 accuracy is poor here', bx, s.y + 150, { size: 11, col: C.warn, bold: true });
  else if (v.read > 95) s.T('near the top stop', bx, s.y + 150, { size: 11, col: C.warn, bold: true });
},
        schemNote: 'Tube taper, float size and the reading are all drawn to scale \u2014 the float rides where the scale says. Change fluid density and the correction badge moves even though the float has not.',
        num: 'F-14', sec: FL, name: 'Rotameter sizing & scale correction',
        blurb: 'A variable-area meter reads whatever fluid it was calibrated on. Put a different density through it and the float sits at the wrong height \u2014 the scale is still linear, it is just no longer yours, and the correction is a square root of two density ratios.',
        howto: 'The two curves are flow against float position: the scale as engraved, and what your fluid actually gives. The vertical gap between them at your reading is the correction factor. Denser fluid, float rides lower; lighter fluid, it rides higher and can peg at the top stop.',
        std: 'Variable-area meter theory \u2014 Perry\u2019s 8th ed. \u00a75; ISO 1438 practice for scale correction',
        eqs: [['Q = C_dA_{ann}\\sqrt{\\frac{2gV_f\\left(\\rho_f - \\rho\\right)}{A_f\\rho}}', 'float equilibrium — weight balanced by drag and buoyancy'], ['A_{ann}(h) = \\frac{\\pi}{4}\\left[\\left(D_0 + 2h\\tan\\phi\\right)^2 - D_f^2\\right]', 'annular area opened by the taper at height h'], ['\\frac{Q_{act}}{Q_{ind}} = \\sqrt{\\frac{\\rho_{cal}\\left(\\rho_f - \\rho_{act}\\right)}{\\rho_{act}\\left(\\rho_f - \\rho_{cal}\\right)}}', 'the density correction that turns a reading into a flow']],
        notes: ['Constant discharge coefficient \u2014 fair above Re \u2248 4000 through the annulus, poor for viscous liquids.', 'Viscosity immunity ceiling depends on float shape; a viscosity-immune float is assumed.', 'Gas service must also be corrected for operating pressure and temperature, done here through density.'],
        params: [{ k: 'cal', label: 'Calibration basis', type: 'select', val: 'water', options: [['water', 'Water at 20 \u00b0C (1000 kg/m\u00b3)'], ['air', 'Air at 1 atm, 20 \u00b0C (1.205 kg/m\u00b3)']] }, P('D0', 'Tube bore at the bottom', 5, 120, 0.5, 26, 'mm'), P('taper', 'Tube taper', 0.1, 4, 0.05, 0.8, null, '\u00b0'), P('Lt', 'Scale length', 50, 1500, 10, 250, 'mm'), P('Df', 'Float diameter', 4, 110, 0.5, 25, 'mm'), P('rhof', 'Float material density', 1000, 19000, 50, 7900, 'rho'), P('rho', 'Process fluid density', 0.2, 1600, 0.1, 860, 'rho'), P('Cd', 'Discharge coefficient', 0.5, 0.98, 0.01, 0.72, null, '\u2014'), P('read', 'Scale reading', 5, 100, 1, 70, null, '% of scale')],
        compute: v => {
          const D0 = v.D0 / 1000, Df = v.Df / 1000, Lt = v.Lt / 1000, tn = Math.tan(v.taper * Math.PI / 180);
          const Vf = Math.PI / 6 * Math.pow(Df, 3) * 0.62, Af = Math.PI / 4 * Df * Df;
          const rcal = v.cal === 'air' ? 1.205 : 998;
          const Aann = h => Math.max(Math.PI / 4 * (Math.pow(D0 + 2 * h * tn, 2) - Df * Df), 1e-9);
          const Qof = (h, rho) => Aann(h) * v.Cd * Math.sqrt(2 * 9.80665 * Vf * Math.max(v.rhof - rho, 1) / (Af * rho)) * 3600;
          const h = v.read / 100 * Lt;
          const Qact = Qof(h, v.rho), Qcal = Qof(h, rcal);
          const corr = Math.sqrt(rcal * Math.max(v.rhof - v.rho, 1) / (v.rho * Math.max(v.rhof - rcal, 1)));
          const Qfs = Qof(Lt, v.rho);
          const vel = Qact / 3600 / Aann(h);
          const Re = v.rho * vel * (D0 - Df) / (v.rho > 100 ? 1e-3 : 1.8e-5);
          const dP = Vf * (v.rhof - v.rho) * 9.80665 / Af / 1000;
          return {
            Qof: Qof, Qact: Qact, Qcal: Qcal, Lt: Lt, h: h, Qfs: Qfs,
            res: [{ l: 'Flow at this reading', v: Qact, u: '', cv: 'Q', d: 3 }, { l: 'Flow if it were the calibration fluid', v: Qcal, u: '', cv: 'Q', d: 3 }, { l: 'Density correction factor', v: corr, u: '\u2014', d: 4 }, { l: 'Full-scale flow, your fluid', v: Qfs, u: '', cv: 'Q', d: 3 }, { l: 'Full-scale flow, calibration fluid', v: Qof(v.Lt / 1000, rcal), u: '', cv: 'Q', d: 3 }, { l: 'Reading as % of full scale', v: Qact / Math.max(Qfs, 1e-9) * 100, u: '%', d: 1 }, { l: 'Turndown available', v: Qfs / Math.max(Qof(0.1 * v.Lt / 1000, v.rho), 1e-9), u: ': 1', d: 1 }, { l: 'Float height', v: v.read / 100 * v.Lt, u: '', cv: 'mm', d: 1 }, { l: 'Annular velocity', v: vel, u: '', cv: 'vel', d: 2 }, { l: 'Annulus Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Reading verdict', s: v.read < 20 ? 'below 20% of scale \u2014 accuracy is poor here' : v.read > 95 ? 'near the top stop \u2014 the float will peg' : 'in the reliable part of the scale', u: '' }, { l: 'Permanent pressure loss', v: dP, u: 'kPa', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const ymax = Math.max(r.Qof(r.Lt, v.rho), r.Qof(r.Lt, v.cal === 'air' ? 1.205 : 998)) * 1.08;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 100, ymin: 0, ymax: ymax, ml: 76 });
          g.grid('Float position  (% of scale)', 'Flow  (' + self.cvt(0, 'Q')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'Q')[0], 2));
          g.title('Engraved scale against your fluid');
          const rcal = v.cal === 'air' ? 1.205 : 998;
          g.fn(p => r.Qof(p / 100 * r.Lt, rcal), C.lt, 2.2, [6, 4]);
          g.fn(p => r.Qof(p / 100 * r.Lt, v.rho), C.dk, 2.8);
          g.line([[20, 0], [20, ymax]], C.mut, 1.2, [3, 3]);
          g.txt('20% \u2014 accuracy floor', 21, ymax * 0.06, C.mut, 'left', 10.5);
          g.line([[v.read, 0], [v.read, Math.max(r.Qact, r.Qcal)]], C.mut, 1.3, [4, 4]);
          g.dot(v.read, r.Qact, C.acc, 5.5);
          g.dot(v.read, r.Qcal, C.lt, 4.5);
          g.txt(self.f(self.cvt(r.Qact, 'Q')[0], 2), v.read, r.Qact + ymax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'your fluid' }, { c: C.lt, l: 'as calibrated', d: [6, 4] }]);
        }
      }
    ];
  }
