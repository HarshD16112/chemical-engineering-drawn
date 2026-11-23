  dNewH() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const EQ = 'Process Equipment Design', RX = 'Reactors & Kinetics';
    const fact = n => { let s = 1; for (let i = 2; i <= n; i++) s *= i; return s; };
    return [
      {
        id: 'tankem', num: 'E-06', sec: EQ, name: 'Tank design & emission loss',
        blurb: 'A fixed-roof tank breathes. It exhales when the sun warms the vapour space and again every time it is filled \u2014 two mechanisms, two formulae, and for a volatile product the annual total is measured in tonnes.',
        howto: 'The two bands are standing loss, which depends on the empty space and the weather, and working loss, which depends only on throughput. A tank kept nearly full loses little standing but plenty working; a tank kept nearly empty is the opposite \u2014 the crossover tells you which fix is worth paying for.',
        std: 'US EPA AP-42 \u00a77.1 (fixed-roof tanks); API MPMS Ch. 19.1 evaporative loss measurement',
        eqs: [['L_S = 365\\,V_VW_VK_EK_S', 'standing storage loss, kg/yr'], ['K_E = \\frac{\\Delta T_V}{T_{LA}} + \\frac{\\Delta P_V - \\Delta P_B}{P_A - P_{VA}},\\qquad K_S = \\frac{1}{1 + 0.053P_{VA}H_{VO}}', 'vapour space expansion and the saturation factor'], ['L_W = 0.0010\\,M_VP_{VA}QK_NK_P', 'working loss from throughput, kg/yr'], ['W_V = \\frac{M_VP_{VA}}{RT_{LA}}', 'vapour density in the space above the liquid']],
        notes: ['Fixed-roof, vertical, freely vented tank \u2014 an internal floating roof cuts standing loss by 90%+.', 'Daily temperature and pressure ranges come from the site meteorology; the defaults are temperate.', 'K_P is 0.75 for refined petroleum products in service, 1.0 for crude.'],
        params: [PF('D', 'Tank diameter', 3, 90, 0.5, 20, 'L'), PF('H', 'Shell height', 3, 25, 0.5, 12, 'L'), P('fill', 'Average liquid level', 0.1, 0.95, 0.01, 0.6, null, 'fraction of H'), P('Pva', 'True vapour pressure', 0.1, 100, 0.1, 7, null, 'kPa'), P('MV', 'Vapour molecular weight', 30, 200, 1, 68, null, 'kg/kmol'), P('Tla', 'Average liquid surface temperature', -10, 60, 1, 20, 'T'), P('dTv', 'Daily vapour temperature range', 2, 35, 0.5, 12, 'dT'), P('dPv', 'Daily vapour pressure range', 0.1, 8, 0.1, 1.2, null, 'kPa'), P('dPb', 'Breather vent setting range', 0, 6, 0.1, 0.5, null, 'kPa'), PF('Q', 'Annual throughput', 100, 2000000, 100, 60000, null, 'm\u00b3/yr'), P('Kp', 'Working loss product factor', 0.7, 1, 0.05, 0.75, null, '\u2014'), P('price', 'Product value', 100, 1500, 10, 600, null, '\u20ac/tonne')],
        compute: v => {
          const A = Math.PI * v.D * v.D / 4;
          const Hvo = v.H * (1 - v.fill);
          const Vv = A * Hvo;
          const Tla = v.Tla + 273.15;
          const Wv = v.MV * v.Pva / (8.314 * Tla);
          const Pa = 101.325;
          const Ke = Math.max(v.dTv / Tla + (v.dPv - v.dPb) / Math.max(Pa - v.Pva, 1), 0);
          const Ks = 1 / (1 + 0.053 * v.Pva * Hvo);
          const Ls = 365 * Vv * Wv * Ke * Ks;
          const Vliq = A * v.H * v.fill;
          const N = v.Q / Math.max(Vliq, 1e-6);
          const Kn = N <= 36 ? 1 : (180 + N) / (6 * N);
          const Lw = 0.0010 * v.MV * v.Pva * v.Q * Kn * v.Kp;
          const tot = Ls + Lw;
          const LsOf = q => Ls, LwOf = q => { const n2 = q / Math.max(Vliq, 1e-6); const kn = n2 <= 36 ? 1 : (180 + n2) / (6 * n2); return 0.0010 * v.MV * v.Pva * q * kn * v.Kp; };
          return {
            LsOf: LsOf, LwOf: LwOf, Ls: Ls, Lw: Lw, tot: tot,
            res: [{ l: 'Tank capacity', v: A * v.H, u: '', cv: 'V', d: 1 }, { l: 'Vapour space height', v: Hvo, u: '', cv: 'L', d: 2 }, { l: 'Vapour space volume', v: Vv, u: '', cv: 'V', d: 1 }, { l: 'Vapour density W_V', v: Wv, u: '', cv: 'rho', d: 5 }, { l: 'Expansion factor K_E', v: Ke, u: '\u2014', d: 5 }, { l: 'Saturation factor K_S', v: Ks, u: '\u2014', d: 4 }, { l: 'Annual turnovers', v: N, u: 'per yr', d: 2 }, { l: 'Turnover factor K_N', v: Kn, u: '\u2014', d: 4 }, { l: 'Standing storage loss', v: Ls, u: 'kg/yr', d: 0 }, { l: 'Working loss', v: Lw, u: 'kg/yr', d: 0 }, { l: 'Total emissions', v: tot, u: 'kg/yr', d: 0 }, { l: 'Total emissions', v: tot / 1000, u: 't/yr', d: 3 }, { l: 'Dominant mechanism', s: Ls > Lw ? 'standing loss \u2014 an internal floating roof is the fix' : 'working loss \u2014 vapour recovery on the fill line is the fix', u: '' }, { l: 'Loss as % of throughput', v: tot / Math.max(v.Q * 750, 1e-6) * 100, u: '%', d: 4 }, { l: 'Value of the product lost', v: tot / 1000 * v.price, u: '\u20ac/yr', d: 0 }, { l: 'Saving with an internal floating roof', v: (Ls * 0.95 + Lw * 0.6) / 1000 * v.price, u: '\u20ac/yr', d: 0 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const qmax = v.Q * 2.2;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: qmax, ymin: 0, ymax: (r.Ls + r.LwOf(qmax)) * 1.08 / 1000, ml: 76 });
          g.grid('Annual throughput  (m\u00b3/yr)', 'Emissions  (t/yr)', 5, 5, t => self.f(t / 1000, 0) + 'k', t => self.f(t, 2));
          g.title('Standing loss is fixed \u2014 working loss is not');
          const pts = [], tots = [];
          for (let i = 0; i <= 60; i++) { const q = qmax * i / 60; pts.push([q, r.Ls / 1000]); tots.push([q, (r.Ls + r.LwOf(q)) / 1000]); }
          g.fill([[0, 0]].concat(pts, [[qmax, 0]]), C.soft2);
          g.fill(pts.concat(tots.slice().reverse()), C.soft);
          g.line(pts, C.mid, 2.2, [6, 4]);
          g.line(tots, C.dk, 2.8);
          g.txt('standing', qmax * 0.04, r.Ls / 1000 * 0.5, C.mut, 'left', 11);
          g.txt('working', qmax * 0.5, (r.Ls + r.LwOf(qmax * 0.5) * 0.5) / 1000, C.mut, 'left', 11);
          g.dot(v.Q, r.tot / 1000, C.acc, 5.5);
          g.txt(self.f(r.tot / 1000, 2) + ' t/yr', v.Q, r.tot / 1000 + (r.Ls + r.LwOf(qmax)) / 1000 * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'total' }, { c: C.mid, l: 'standing only', d: [6, 4] }]);
        }
      },
      {
        id: 'nozzle', num: 'E-07', sec: EQ, name: 'Nozzle & manway reinforcement',
        blurb: 'Cutting a hole in a pressure vessel removes metal that was carrying load, and the code makes you put it back within a defined neighbourhood of the opening. Small nozzles pass on the shell thickness alone; somewhere between six and twelve inches, they stop passing.',
        howto: 'The rising line is the area the code requires and the flatter one what the shell and nozzle neck already provide. Where they cross is the largest opening you can make without a reinforcing pad \u2014 move the shell thickness or the nozzle schedule and watch the crossing slide.',
        std: 'ASME BPVC VIII-1 UG-37, UG-40 and UG-45; areas taken on the vessel longitudinal plane',
        eqs: [['A = d\\,t_rF + 2t_nt_rF\\left(1 - f_{r1}\\right)', 'reinforcement area required'], ['A_1 = d\\left(E_1t - Ft_r\\right) - 2t_n\\left(E_1t - Ft_r\\right)\\left(1 - f_{r1}\\right)', 'excess area in the shell'], ['A_2 = 5\\left(t_n - t_{rn}\\right)f_{r2}t \\quad\\text{(smaller of the two limits)}', 'excess area in the nozzle neck'], ['t_r = \\frac{PR}{SE - 0.6P},\\qquad t_{rn} = \\frac{PR_n}{S_nE - 0.6P}', 'the two required thicknesses the areas are measured against']],
        notes: ['Radial nozzle in a cylindrical shell, opening on the longitudinal plane where the requirement is greatest.', 'Weld-leg area A\u2083 taken as two 6 mm fillets; corrosion allowance is deducted before the calculation.', 'UG-45 minimum neck thickness is checked separately and can govern for small nozzles.'],
        params: [PF('D', 'Vessel inside diameter', 300, 6000, 10, 2000, 'mm'), P('t', 'Shell nominal thickness', 5, 120, 0.5, 16, 'mm'), P('Pd', 'Design pressure (gauge)', 1, 200, 0.5, 20, null, 'bar g'), P('S', 'Shell allowable stress', 60, 220, 1, 138, null, 'MPa'), P('Sn', 'Nozzle allowable stress', 60, 220, 1, 118, null, 'MPa'), P('E', 'Shell joint efficiency', 0.7, 1, 0.05, 1, null, '\u2014'), P('dn', 'Nozzle inside diameter', 20, 1000, 5, 250, 'mm'), P('tn', 'Nozzle wall thickness', 3, 60, 0.5, 12.7, 'mm'), P('ca', 'Corrosion allowance', 0, 6, 0.5, 3, 'mm'), P('weld', 'Fillet weld leg', 3, 16, 0.5, 6, 'mm')],
        compute: v => {
          const Pm = v.Pd / 10;
          const R = v.D / 2 + v.ca;
          const t = v.t - v.ca, tn = v.tn - v.ca;
          const tr = Pm * R / (v.S * v.E - 0.6 * Pm);
          const areasOf = d0 => {
            const d = d0 + 2 * v.ca;
            const Rn = d / 2;
            const trn = Pm * Rn / (v.Sn * 1 - 0.6 * Pm);
            const fr1 = Math.min(v.Sn / v.S, 1), fr2 = fr1;
            const Areq = d * tr * 1 + 2 * tn * tr * 1 * (1 - fr1);
            const A1a = d * (v.E * t - tr) - 2 * tn * (v.E * t - tr) * (1 - fr1);
            const A1b = 2 * (t + tn) * (v.E * t - tr) - 2 * tn * (v.E * t - tr) * (1 - fr1);
            const A1 = Math.max(A1a, A1b, 0);
            const h = Math.min(2.5 * t, 2.5 * tn);
            const A2 = Math.max(Math.min(5 * (tn - trn) * fr2 * t, 2 * (tn - trn) * fr2 * (h + 0)), 0);
            const A3 = 2 * (v.weld * v.weld / 2) * fr2;
            return { Areq: Areq, A1: A1, A2: A2, A3: A3, Aav: A1 + A2 + A3, trn: trn, d: d };
          };
          const a = areasOf(v.dn);
          let dmax = NaN;
          if (areasOf(20).Aav >= areasOf(20).Areq) { const f = d => areasOf(d).Aav - areasOf(d).Areq; dmax = f(1000) > 0 ? 1000 : self.bis(f, 20, 1000, 1e-3); }
          const padA = Math.max(a.Areq - a.Aav, 0);
          const padW = padA > 0 ? padA / (2 * Math.max(v.t - v.ca, 1)) : 0;
          const ug45 = Math.max(tr + v.ca, Math.min(a.trn + v.ca, 6 + v.ca));
          return {
            areasOf: areasOf, a: a, dmax: dmax,
            res: [{ l: 'Shell required thickness t_r', v: tr, u: '', cv: 'mm', d: 3 }, { l: 'Nozzle required thickness t_rn', v: a.trn, u: '', cv: 'mm', d: 3 }, { l: 'Corroded shell thickness', v: t, u: '', cv: 'mm', d: 2 }, { l: 'Corroded nozzle thickness', v: tn, u: '', cv: 'mm', d: 2 }, { l: 'Opening diameter, corroded', v: a.d, u: '', cv: 'mm', d: 1 }, { l: 'Area required A', v: a.Areq, u: 'mm\u00b2', d: 0 }, { l: 'Area in the shell A\u2081', v: a.A1, u: 'mm\u00b2', d: 0 }, { l: 'Area in the neck A\u2082', v: a.A2, u: 'mm\u00b2', d: 0 }, { l: 'Weld area A\u2083', v: a.A3, u: 'mm\u00b2', d: 0 }, { l: 'Area available', v: a.Aav, u: 'mm\u00b2', d: 0 }, { l: 'Margin', v: a.Aav - a.Areq, u: 'mm\u00b2', d: 0 }, { l: 'Verdict', s: a.Aav >= a.Areq ? 'adequately reinforced \u2014 no pad needed' : 'under-reinforced \u2014 a pad is required', u: '' }, { l: 'Pad area shortfall', v: padA, u: 'mm\u00b2', d: 0 }, { l: 'Pad width needed (same thickness as shell)', v: padW, u: '', cv: 'mm', d: 1 }, { l: 'Largest unreinforced opening', v: dmax, u: '', cv: 'mm', d: 0 }, { l: 'UG-45 minimum neck thickness', v: ug45, u: '', cv: 'mm', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const dmax2 = Math.max(v.dn * 2, 400);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 20, xmax: dmax2, ymin: 0, ymax: Math.max(r.areasOf(dmax2).Areq, r.areasOf(dmax2).Aav) * 1.08, ml: 78 });
          g.grid('Nozzle inside diameter  (' + self.cvt(0, 'mm')[1] + ')', 'Area  (mm\u00b2)', 5, 5, t => self.f(self.cvt(t, 'mm')[0], 0), t => self.f(t, 0));
          g.title('Where the opening stops reinforcing itself');
          g.fn(d => r.areasOf(d).Areq, C.warn, 2.8);
          g.fn(d => r.areasOf(d).Aav, C.dk, 2.6, [6, 4]);
          if (isFinite(r.dmax) && r.dmax < dmax2) {
            g.line([[r.dmax, 0], [r.dmax, r.areasOf(r.dmax).Areq]], C.mid, 1.4, [4, 4]);
            g.txt('pad needed beyond ' + self.f(self.cvt(r.dmax, 'mm')[0], 0), r.dmax * 1.02, r.areasOf(dmax2).Areq * 0.35, C.mid, 'left', 11);
          }
          g.dot(v.dn, r.a.Areq, C.warn, 5);
          g.dot(v.dn, r.a.Aav, C.acc, 5.5);
          g.legend([{ c: C.warn, l: 'area required' }, { c: C.dk, l: 'area available', d: [6, 4] }]);
        }
      },
      {
        id: 'cyclone',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const D = self.rget(r, 'cyclone body diameter') || v.Dc;
  const Htot = self.rget(r, 'overall height') || D * 4;
  const Vi = self.rget(r, 'inlet velocity') || 0, d50 = self.rget(r, 'cut diameter') || 0;
  const ov = self.rget(r, 'overall mass efficiency') || 0, dP = self.rget(r, 'pressure drop') || 0;
  const G = { stair: [0.5, 0.2, 0.5, 1.5, 4, 0.375], lapple: [0.5, 0.25, 0.5, 2, 4, 0.25], swift: [0.8, 0.35, 0.75, 1.7, 3.7, 0.4] };
  const g = G[v.geom] || G.stair;
  s.title('Cyclone \u00b7 ' + (v.geom === 'lapple' ? 'Lapple' : v.geom === 'swift' ? 'Swift' : 'Stairmand') + (v.n > 1 ? ' \u00d7 ' + v.n : ''), self.f(self.cvt(D * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1] + ' body \u00b7 d\u2085\u2080 ' + self.f(d50, 2) + ' \u03bcm');
  const sc = Math.min((s.h - 76) / g[4], (s.w * 0.3) / 1.5);
  const Dp = sc, cx = s.x + s.w * 0.3, top = s.y + 46;
  const hBody = g[3] * sc, hAll = g[4] * sc, Bp = g[5] * sc, Dep = g[2] * sc;
  s.L([[cx - Dp / 2, top], [cx - Dp / 2, top + hBody], [cx - Bp / 2, top + hAll], [cx + Bp / 2, top + hAll], [cx + Dp / 2, top + hBody], [cx + Dp / 2, top]], { col: C.ink, lw: 1.8, close: true, fill: C.soft });
  s.L([[cx - Dp / 2, top], [cx + Dp / 2, top]], { col: C.ink, lw: 1.8 });
  s.L([[cx - Dp / 2, top + hBody], [cx + Dp / 2, top + hBody]], { col: 'rgba(29,31,32,0.2)', lw: 1, dash: [4, 3] });
  s.R(cx - Dep / 2, top - 34, Dep, 34 + g[0] * sc * 1.1, { stroke: C.ink, lw: 1.5, fill: C.bg });
  s.T('vortex finder', cx + Dep / 2 + 8, top - 20, { size: 10, col: C.mut });
  s.R(cx + Dp / 2, top + 4, g[1] * sc + 24, g[0] * sc, { stroke: C.dk, lw: 1.5, fill: s.temp(0.5, 0.12) });
  s.L([[cx + Dp / 2 + g[1] * sc + 24 + 34, top + 4 + g[0] * sc / 2], [cx + Dp / 2 + g[1] * sc + 26, top + 4 + g[0] * sc / 2]], { col: C.dk, lw: 2.6, arrow: true });
  s.T('dirty gas', cx + Dp / 2 + g[1] * sc + 30, top + 4 + g[0] * sc / 2 - 13, { size: 10.5, col: C.dk });
  s.T(self.f(self.cvt(Vi, 'vel')[0], 1) + ' ' + self.cvt(0, 'vel')[1], cx + Dp / 2 + g[1] * sc + 30, top + 4 + g[0] * sc / 2 + 14, { size: 10, col: Vi > 25 || Vi < 10 ? C.warn : C.mut });
  s.L([[cx, top - 34], [cx, top - 58]], { col: C.mid, lw: 2.6, arrow: true });
  s.T('clean gas', cx + Dep / 2 + 10, top - 50, { size: 10.5, col: C.mid });
  const spin = [];
  for (let i = 0; i <= 90; i++) { const t = i / 90; const rr = (Dp / 2 - 4) * (1 - 0.72 * t); spin.push([cx + Math.cos(t * 9) * rr * (1 - t * 0.25), top + 8 + (hAll - 16) * t]); }
  s.L(spin, { col: C.acc, lw: 1.3 });
  s.L([[cx, top + hAll], [cx, top + hAll + 24]], { col: C.ink, lw: 2.2, arrow: true });
  s.T('dust', cx + 8, top + hAll + 20, { size: 10.5, col: C.ink });
  s.dim(cx - Dp / 2, top + hAll + 36, cx + Dp / 2, top + hAll + 36, 'D ' + self.f(self.cvt(D * 1000, 'mm')[0], 0), { col: C.mut });
  s.dim(cx - Dp / 2 - 24, top, cx - Dp / 2 - 24, top + hAll, self.f(self.cvt(Htot, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], { col: C.mut });
  const bx = s.x + s.w - 166;
  s.badge(bx, s.y + 6, 'Overall efficiency', self.f(ov, 1) + '%', 0.5 - 0.4 * self.cl01(ov / 100), { w: 166 });
  s.badge(bx, s.y + 50, 'Cut size d\u2085\u2080', self.f(d50, 2) + ' \u03bcm', null, { w: 166 });
  s.badge(bx, s.y + 94, 'Pressure drop', self.f(dP, 2) + ' kPa', 0.5 + 0.44 * self.cl01(dP / 2), { w: 166 });
  if (Vi > 25) s.T('inlet above 25 m/s \u2014 erosion', bx, s.y + 148, { size: 11, col: C.warn, bold: true });
  else if (Vi < 10) s.T('inlet below 10 m/s \u2014 poor capture', bx, s.y + 148, { size: 11, col: C.warn, bold: true });
},
        schemNote: 'Body, cone, inlet and vortex finder are drawn at the proportions of the geometry you pick \u2014 switch from Stairmand to Swift and the whole machine changes shape, which is exactly what moves the cut size.',
        num: 'E-08', sec: EQ, name: 'Cyclone sizing & grade efficiency',
        blurb: 'No moving parts, no filter to blind, and a collection curve that falls off a cliff below a few microns. A cyclone is sized by the cut diameter \u2014 the particle it catches half the time \u2014 and everything smaller is somebody else\u2019s problem.',
        howto: 'The S-curve is grade efficiency: read up from any particle size to see what fraction is caught. The marker at 50% is the cut diameter. Squeeze the body and the curve marches left \u2014 finer cut, better collection \u2014 but pressure drop climbs with the square of the inlet velocity.',
        std: 'Lapple (1951) cut-diameter method; Shepherd\u2013Lapple pressure drop; Stairmand high-efficiency geometry',
        eqs: [['d_{50} = \\sqrt{\\frac{9\\mu W}{2\\pi N_eV_i\\left(\\rho_p - \\rho\\right)}}', 'Lapple cut diameter'], ['\\eta_i = \\frac{1}{1 + \\left(d_{50}/d_i\\right)^2}', 'grade efficiency for each size fraction'], ['N_e = \\frac{1}{H}\\left[L_b + \\frac{L_c}{2}\\right]', 'effective number of turns in the body and cone'], ['\\Delta P = \\frac{\\rho V_i^2}{2}N_H,\\qquad N_H = \\frac{16\\,W H}{D_e^2}', 'pressure drop in inlet velocity heads']],
        notes: ['Standard Stairmand or Lapple proportions are applied from the body diameter you set.', 'Efficiency is for dilute loading; above about 10 g/m\u00b3 real collection is better than Lapple predicts.', 'Erosion and re-entrainment are not modelled \u2014 inlet velocity above 25 m/s will eat the body.'],
        params: [{ k: 'geom', label: 'Geometry', type: 'select', val: 'stair', options: [['stair', 'Stairmand high efficiency'], ['lapple', 'Lapple conventional'], ['swift', 'Swift high throughput']] }, P('Dc', 'Body diameter', 0.1, 3, 0.02, 0.6, 'L'), P('n', 'Cyclones in parallel', 1, 20, 1, 1, null, '\u2014'), P('Q', 'Gas flow', 100, 100000, 100, 3000, null, 'm\u00b3/h'), P('rho', 'Gas density', 0.3, 20, 0.05, 1.1, 'rho'), P('mu', 'Gas viscosity', 0.008, 0.05, 0.001, 0.018, null, 'cP'), P('rhop', 'Particle density', 500, 8000, 50, 2200, 'rho'), P('dp', 'Particle size of interest', 0.5, 100, 0.5, 10, null, '\u03bcm'), P('dmean', 'Dust mass-median size', 1, 200, 1, 20, null, '\u03bcm'), P('sg', 'Dust geometric standard deviation', 1.2, 4, 0.05, 2.2, null, '\u2014'), P('load', 'Dust loading', 0.1, 200, 0.1, 5, null, 'g/m\u00b3')],
        compute: v => {
          const GEO = { stair: [0.5, 0.2, 1.5, 2.5, 0.5], lapple: [0.5, 0.25, 2, 2, 0.5], swift: [0.5, 0.275, 1.75, 2, 0.5] };
          const gg = GEO[v.geom] || GEO.stair;
          const D = v.Dc, H = gg[1] * D, W = gg[0] * D * 0.5, Lb = gg[2] * D, Lc = gg[3] * D, De = gg[4] * D;
          const Ain = H * W;
          const Q1 = (v.Q / v.n) / 3600;
          const Vi = Q1 / Ain;
          const Ne = (Lb + Lc / 2) / H;
          const d50 = Math.sqrt(9 * (v.mu * 1e-3) * W / (2 * Math.PI * Ne * Vi * (v.rhop - v.rho))) * 1e6;
          const eta = d => 1 / (1 + Math.pow(d50 / Math.max(d, 1e-6), 2));
          const Nh = 16 * W * H / (De * De);
          const dP = v.rho * Vi * Vi / 2 * Nh / 1000;
          let overall = 0, sum = 0;
          for (let i = 0; i < 60; i++) {
            const d = 0.3 * Math.pow(300 / 0.3, i / 59);
            const z = Math.log(d / v.dmean) / Math.log(v.sg);
            const w = Math.exp(-0.5 * z * z);
            overall += w * eta(d); sum += w;
          }
          overall = overall / Math.max(sum, 1e-9) * 100;
          const outlet = v.load * (1 - overall / 100) * 1000;
          const power = v.Q / 3600 * dP * 1000 / 0.65 / 1000;
          return {
            eta: eta, d50: d50, Vi: Vi,
            res: [{ l: 'Cyclone body diameter', v: D, u: '', cv: 'L', d: 3 }, { l: 'Inlet height \u00d7 width', s: self.f(self.cvt(H * 1000, 'mm')[0], 0) + ' \u00d7 ' + self.f(self.cvt(W * 1000, 'mm')[0], 0) + ' ' + self.cvt(0, 'mm')[1], u: '' }, { l: 'Gas outlet diameter', v: De * 1000, u: '', cv: 'mm', d: 0 }, { l: 'Overall height', v: Lb + Lc, u: '', cv: 'L', d: 2 }, { l: 'Inlet velocity', v: Vi, u: '', cv: 'vel', d: 2 }, { l: 'Velocity verdict', s: Vi > 25 ? 'above 25 m/s \u2014 erosion and re-entrainment' : Vi < 10 ? 'below 10 m/s \u2014 collection will be poor' : 'in the usual 10\u201325 m/s band', u: '' }, { l: 'Effective turns N_e', v: Ne, u: '\u2014', d: 2 }, { l: 'Cut diameter d\u2085\u2080', v: d50, u: '\u03bcm', d: 3 }, { l: 'Efficiency at the size of interest', v: eta(v.dp) * 100, u: '%', d: 2 }, { l: 'Overall mass efficiency', v: overall, u: '%', d: 2 }, { l: 'Outlet dust loading', v: outlet, u: 'mg/m\u00b3', d: 1 }, { l: 'Dust collected', v: v.Q * v.load / 1000 * overall / 100, u: '', cv: 'M', d: 2 }, { l: 'Velocity heads N_H', v: Nh, u: '\u2014', d: 2 }, { l: 'Pressure drop', v: dP, u: 'kPa', d: 3 }, { l: 'Fan power for the drop', v: power, u: '', cv: 'W', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.3, xmax: 200, ymin: 0, ymax: 100, xlog: true, ml: 70 });
          g.grid('Particle diameter  (\u03bcm)', 'Collection efficiency  (%)', 4, 5);
          g.title('Grade efficiency curve');
          g.line([[0.3, 50], [200, 50]], C.mut, 1.2, [3, 3]);
          g.fn(d => r.eta(d) * 100, C.dk, 2.8);
          g.line([[r.d50, 0], [r.d50, 50]], C.acc, 1.5, [4, 4]);
          g.dot(r.d50, 50, C.acc, 5.5);
          g.txt('d\u2085\u2080 = ' + self.f(r.d50, 2) + ' \u03bcm', r.d50 * 1.1, 44, C.acc, 'left', 11.5);
          g.legend([{ c: C.dk, l: 'grade efficiency' }, { c: C.acc, l: 'cut diameter', d: [4, 4] }]);
          g.cross(v.dp, r.eta(v.dp) * 100, C.dk, 9);
          g.txt(self.f(r.eta(v.dp) * 100, 1) + '%', v.dp, r.eta(v.dp) * 100 + 5, C.ink, 'center', 12);
        }
      },
      {
        id: 'rtd', num: 'R-08', sec: RX, name: 'Residence-time distribution',
        blurb: 'Two reactors of the same volume can give completely different conversions, and the tracer curve is what tells them apart. Everything between plug flow and a single stirred tank lives on one axis \u2014 the variance of the exit-age distribution.',
        howto: 'The curves are the exit-age distribution against dimensionless time: a tall narrow peak is nearly plug flow, a decaying exponential is a single stirred tank. Your case is drawn heavy, and the conversion figures underneath show exactly what that spread costs against the plug-flow ideal.',
        std: 'Danckwerts (1953); Levenspiel, Chemical Reaction Engineering 3rd ed. Ch. 11\u201314',
        eqs: [['E(\\theta) = \\frac{N^N\\theta^{N-1}e^{-N\\theta}}{(N-1)!}', 'tanks-in-series exit-age distribution'], ['E(\\theta) = \\frac{1}{2\\sqrt{\\pi\\theta/Pe}}\\exp\\left[-\\frac{(1-\\theta)^2Pe}{4\\theta}\\right]', 'axial dispersion model, open vessel'], ['\\sigma_\\theta^2 = \\frac{1}{N} = \\frac{2}{Pe} + \\frac{8}{Pe^2}', 'the variance links the two models'], ['X = 1 - \\frac{1}{\\left(1 + k\\tau/N\\right)^N}', 'first-order conversion for N tanks in series']],
        notes: ['First-order kinetics \u2014 for other orders the RTD alone does not fix conversion, micromixing matters.', 'The open-vessel dispersion form is used; closed-vessel boundaries give a slightly tighter curve.', 'Dead volume and bypassing show up as a long tail and an early spike respectively, neither of which these models carry.'],
        params: [{ k: 'mode', label: 'Model', type: 'select', val: 'tanks', options: [['tanks', 'Tanks in series'], ['disp', 'Axial dispersion']] }, P('N', 'Number of tanks', 1, 30, 1, 4, null, '\u2014'), P('Pe', 'Peclet number uL/D', 0.2, 200, 0.2, 8, null, '\u2014'), P('tau', 'Mean residence time', 0.5, 300, 0.5, 30, null, 'min'), P('k', 'First-order rate constant', 0.001, 2, 0.001, 0.08, null, 'min\u207b\u00b9')],
        compute: v => {
          const N = Math.max(Math.round(v.N), 1);
          const Etanks = (th, n) => th <= 0 ? 0 : Math.pow(n, n) * Math.pow(th, n - 1) * Math.exp(-n * th) / fact(n - 1);
          const Edisp = (th, pe) => th <= 1e-6 ? 0 : 1 / (2 * Math.sqrt(Math.PI * th / pe)) * Math.exp(-Math.pow(1 - th, 2) * pe / (4 * th));
          const E = th => v.mode === 'disp' ? Edisp(th, v.Pe) : Etanks(th, N);
          const varT = v.mode === 'disp' ? 2 / v.Pe + 8 / (v.Pe * v.Pe) : 1 / N;
          const Neq = v.mode === 'disp' ? 1 / varT : N;
          const kt = v.k * v.tau;
          const Xt = 1 - 1 / Math.pow(1 + kt / N, N);
          const Xpfr = 1 - Math.exp(-kt);
          const Xcstr = kt / (1 + kt);
          const Xd = v.mode === 'disp' ? (() => { const a = Math.sqrt(1 + 4 * kt / v.Pe); return 1 - 4 * a * Math.exp(v.Pe / 2) / (Math.pow(1 + a, 2) * Math.exp(v.Pe * a / 2) - Math.pow(1 - a, 2) * Math.exp(-v.Pe * a / 2)); })() : Xt;
          const X = v.mode === 'disp' ? Xd : Xt;
          let peak = 0, tp = 0;
          for (let i = 1; i <= 400; i++) { const th = i / 100; const e = E(th); if (e > peak) { peak = e; tp = th; } }
          return {
            E: E, Etanks: Etanks, Edisp: Edisp, peak: peak, tp: tp,
            res: [{ l: 'Mean residence time', v: v.tau, u: 'min', d: 2 }, { l: 'Dimensionless variance \u03c3\u00b2', v: varT, u: '\u2014', d: 4 }, { l: 'Equivalent tanks in series', v: Neq, u: '\u2014', d: 2 }, { l: 'Equivalent Peclet number', v: v.mode === 'disp' ? v.Pe : 2 * N, u: '\u2014', d: 2 }, { l: 'Mixing character', s: varT < 0.05 ? 'close to plug flow' : varT < 0.3 ? 'moderate dispersion' : varT < 0.8 ? 'strongly back-mixed' : 'effectively one stirred tank', u: '' }, { l: 'Peak of E(\u03b8)', v: peak, u: '\u2014', d: 3 }, { l: 'Time of the peak', v: tp * v.tau, u: 'min', d: 2 }, { l: 'Damk\u00f6hler number k\u03c4', v: kt, u: '\u2014', d: 3 }, { l: 'Conversion, this reactor', v: X * 100, u: '%', d: 2 }, { l: 'Conversion, plug flow', v: Xpfr * 100, u: '%', d: 2 }, { l: 'Conversion, single CSTR', v: Xcstr * 100, u: '%', d: 2 }, { l: 'Penalty against plug flow', v: (Xpfr - X) * 100, u: 'points', d: 2 }, { l: 'Extra volume to match plug flow', v: (Math.log(1 / (1 - Math.min(Xpfr, 0.999))) / Math.max(v.k, 1e-6) / Math.max(v.tau, 1e-6) - 1) * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 3, ymin: 0, ymax: Math.max(r.peak * 1.15, 1.2), ml: 66 });
          g.grid('Dimensionless time  \u03b8 = t/\u03c4', 'E(\u03b8)', 5, 5, t => self.f(t, 1), t => self.f(t, 1));
          g.title('Exit-age distribution');
          [1, 2, 5, 12].forEach(n => { if (v.mode === 'tanks' && n === Math.round(v.N)) return; g.fn(th => r.Etanks(th, n), 'rgba(29,31,32,0.22)', 1.3); });
          const pts = [];
          for (let i = 0; i <= 300; i++) { const th = 3 * i / 300; pts.push([th, r.E(th)]); }
          g.fill([[0, 0]].concat(pts, [[3, 0]]), C.soft);
          g.line(pts, C.dk, 2.8);
          g.line([[1, 0], [1, Math.max(r.peak * 1.15, 1.2)]], C.mut, 1.2, [4, 4]);
          g.txt('\u03b8 = 1', 1.02, Math.max(r.peak * 1.15, 1.2) * 0.95, C.mut, 'left', 10.5);
          g.dot(r.tp, r.peak, C.acc, 5);
          g.legend([{ c: C.dk, l: v.mode === 'disp' ? 'dispersion model' : Math.round(v.N) + ' tanks' }, { c: 'rgba(29,31,32,0.22)', l: 'N = 1, 2, 5, 12', lw: 1.3 }]);
        }
      },
      {
        id: 'mm', num: 'R-09', sec: RX, name: 'Enzyme kinetics \u2014 Michaelis\u2013Menten',
        blurb: 'A saturating rate law. At low substrate the enzyme behaves first order, at high substrate it is flat out and adding more does nothing, and K_m is the concentration where it is working at half pace. Inhibitors move one of those two numbers, and which one they move identifies the mechanism.',
        howto: 'The heavy curve is the rate with your inhibitor present, the faint one without. A competitive inhibitor slides K_m right but leaves the plateau alone; an uncompetitive one pulls the plateau down and K_m with it. The batch time underneath is the integral of the same curve.',
        std: 'Michaelis & Menten (1913); Briggs\u2013Haldane steady state; Bailey & Ollis, Biochemical Engineering Fundamentals Ch. 3',
        eqs: [['v = \\frac{V_{max}S}{K_m + S}', 'the rate law at steady state'], ['v = \\frac{V_{max}S}{K_m\\left(1 + I/K_{ic}\\right) + S\\left(1 + I/K_{iu}\\right)}', 'general inhibition — the two K values pick the mechanism'], ['\\frac{1}{v} = \\frac{K_m}{V_{max}}\\frac{1}{S} + \\frac{1}{V_{max}}', 'Lineweaver–Burk — the linearisation that reads K_m off an intercept'], ['t = \\frac{K_m\\ln\\left(S_0/S\\right) + \\left(S_0 - S\\right)}{V_{max}}', 'integrated batch time to a target conversion']],
        notes: ['Steady-state (Briggs\u2013Haldane) assumption; enzyme concentration far below substrate.', 'No product inhibition and no enzyme deactivation over the batch.', 'Substrate inhibition (a falling rate at high S) needs a third parameter and is not included.'],
        params: [{ k: 'inh', label: 'Inhibition', type: 'select', val: 'none', options: [['none', 'None'], ['comp', 'Competitive'], ['uncomp', 'Uncompetitive'], ['noncomp', 'Non-competitive']] }, P('Vmax', 'Maximum rate V_max', 0.1, 50, 0.1, 8, null, 'mmol/L\u00b7min'), P('Km', 'Michaelis constant K_m', 0.05, 50, 0.05, 4, null, 'mmol/L'), P('S', 'Substrate concentration', 0.05, 200, 0.05, 6, null, 'mmol/L'), P('I', 'Inhibitor concentration', 0, 50, 0.1, 2, null, 'mmol/L'), P('Ki', 'Inhibition constant K_i', 0.05, 50, 0.05, 3, null, 'mmol/L'), P('S0', 'Batch starting substrate', 1, 500, 1, 100, null, 'mmol/L'), P('conv', 'Target conversion', 0.1, 0.99, 0.01, 0.9, null, '\u2014')],
        compute: v => {
          const a = v.inh === 'comp' || v.inh === 'noncomp' ? 1 + v.I / v.Ki : 1;
          const ap = v.inh === 'uncomp' || v.inh === 'noncomp' ? 1 + v.I / v.Ki : 1;
          const rate = S => v.Vmax * S / (v.Km * a + S * ap);
          const rate0 = S => v.Vmax * S / (v.Km + S);
          const Vapp = v.Vmax / ap, Kapp = v.Km * a / ap;
          const vS = rate(v.S);
          const Sfin = v.S0 * (1 - v.conv);
          const tb = (Kapp * Math.log(v.S0 / Math.max(Sfin, 1e-9)) + (v.S0 - Sfin)) / Math.max(Vapp, 1e-9);
          const tb0 = (v.Km * Math.log(v.S0 / Math.max(Sfin, 1e-9)) + (v.S0 - Sfin)) / v.Vmax;
          const kcat = vS / v.S;
          return {
            rate: rate, rate0: rate0, Vapp: Vapp, Kapp: Kapp, vS: vS,
            res: [{ l: 'Mechanism', s: v.inh === 'none' ? 'uninhibited' : v.inh === 'comp' ? 'competitive \u2014 K_m rises, V_max unchanged' : v.inh === 'uncomp' ? 'uncompetitive \u2014 both fall together' : 'non-competitive \u2014 V_max falls, K_m unchanged', u: '' }, { l: 'Apparent V_max', v: Vapp, u: 'mmol/L\u00b7min', d: 4 }, { l: 'Apparent K_m', v: Kapp, u: 'mmol/L', d: 4 }, { l: 'Rate at this substrate', v: vS, u: 'mmol/L\u00b7min', d: 4 }, { l: 'Rate without inhibitor', v: rate0(v.S), u: 'mmol/L\u00b7min', d: 4 }, { l: 'Fractional activity remaining', v: vS / Math.max(rate0(v.S), 1e-12) * 100, u: '%', d: 2 }, { l: 'Fraction of V_max reached', v: vS / Math.max(Vapp, 1e-12) * 100, u: '%', d: 2 }, { l: 'Operating regime', s: v.S < 0.2 * Kapp ? 'first order in substrate' : v.S > 5 * Kapp ? 'zero order \u2014 the enzyme is saturated' : 'mixed order \u2014 the useful working range', u: '' }, { l: 'Pseudo first-order constant v/S', v: kcat, u: 'min\u207b\u00b9', d: 5 }, { l: 'Substrate at the target conversion', v: Sfin, u: 'mmol/L', d: 3 }, { l: 'Batch time to target', v: tb, u: 'min', d: 2 }, { l: 'Batch time without inhibitor', v: tb0, u: 'min', d: 2 }, { l: 'Time penalty from inhibition', v: (tb / Math.max(tb0, 1e-9) - 1) * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const smax = Math.max(v.S * 3, r.Kapp * 8);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: smax, ymin: 0, ymax: v.Vmax * 1.1, ml: 74 });
          g.grid('Substrate concentration  (mmol/L)', 'Rate  (mmol/L\u00b7min)', 5, 5, t => self.f(t, 1), t => self.f(t, 1));
          g.title('Saturation kinetics');
          g.line([[0, v.Vmax], [smax, v.Vmax]], C.mut, 1.2, [3, 3]);
          g.txt('V\u2098\u2090\u2093', smax * 0.99, v.Vmax * 1.02, C.mut, 'right', 10.5, 'bottom');
          if (v.inh !== 'none') { g.fn(S => r.rate0(S), C.lt, 2, [6, 4]); g.line([[0, r.Vapp], [smax, r.Vapp]], C.mut, 1.1, [3, 3]); }
          g.fn(S => r.rate(S), C.dk, 2.8);
          g.line([[r.Kapp, 0], [r.Kapp, r.Vapp / 2]], C.mid, 1.3, [4, 4]);
          g.line([[0, r.Vapp / 2], [r.Kapp, r.Vapp / 2]], C.mid, 1.3, [4, 4]);
          g.dot(r.Kapp, r.Vapp / 2, C.mid, 4.5);
          g.txt('K\u2098 apparent', r.Kapp * 1.05, r.Vapp * 0.36, C.mid, 'left', 11);
          g.dot(v.S, r.vS, C.acc, 5.5);
          g.txt(self.f(r.vS, 2), v.S, r.vS + v.Vmax * 0.05, C.ink, 'center', 12);
          g.legend(v.inh === 'none' ? [{ c: C.dk, l: 'rate' }] : [{ c: C.dk, l: 'with inhibitor' }, { c: C.lt, l: 'uninhibited', d: [6, 4] }]);
        }
      }
    ];
  }
