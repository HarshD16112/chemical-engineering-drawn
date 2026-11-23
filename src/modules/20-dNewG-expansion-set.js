  dNewG() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const SP = 'Separations', TP = 'Thermophysical Data';
    const GAS = {
      o2: ['Oxygen', 1700, 1500], n2: ['Nitrogen', 1600, 1300], co2: ['Carbon dioxide', 29, 2400], h2s: ['Hydrogen sulphide', 9.8, 2100],
      ch4: ['Methane', 1400, 1600], h2: ['Hydrogen', 1300, 500], co: ['Carbon monoxide', 1100, 1300], nh3: ['Ammonia', 0.017, 4100], so2: ['Sulphur dioxide', 0.81, 2900]
    };
    const CMP = {
      n2: ['Nitrogen', 28.013, 1.040, 1.400, 0.0178, 0.0259], o2: ['Oxygen', 31.999, 0.918, 1.395, 0.0205, 0.0263],
      co2: ['Carbon dioxide', 44.01, 0.844, 1.289, 0.0149, 0.0166], ch4: ['Methane', 16.043, 2.226, 1.304, 0.0110, 0.0332],
      c2h6: ['Ethane', 30.07, 1.744, 1.187, 0.0094, 0.0208], c3h8: ['Propane', 44.097, 1.669, 1.131, 0.0082, 0.0177],
      h2: ['Hydrogen', 2.016, 14.32, 1.405, 0.0088, 0.1805], h2o: ['Water vapour', 18.015, 1.864, 1.329, 0.0097, 0.0184],
      co: ['Carbon monoxide', 28.01, 1.040, 1.400, 0.0175, 0.0250], h2s: ['Hydrogen sulphide', 34.081, 1.003, 1.320, 0.0126, 0.0134]
    };
    return [
      {
        id: 'tray',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const pct = r.pct || 0, how = self.rget(r, 'weir crest') || 0, hl = self.rget(r, 'clear liquid') || 0;
  const hdc = self.rget(r, 'downcomer backup') || 0, ht = self.rget(r, 'total tray pressure drop') || 0;
  const weep = String(self.rget(r, 'weeping check') || '').indexOf('no weeping') < 0;
  s.title('Tray cross-section', self.f(pct, 0) + '% of flood \u00b7 backup ' + self.f(hdc, 0) + ' of ' + self.f(v.ts, 0) + ' mm');
  const X = s.x + 62, W = s.w - 218;
  const yU = s.y + 34, yD = Math.min(s.y + s.h - 40, yU + Math.min(s.h - 90, 230));
  const sc = (yD - yU) / Math.max(v.ts, 1);
  const dcW = Math.max(28, Math.min(58, W * 0.1));
  const loadF = 0.5 + 0.5 * self.cl01((pct - 45) / 55);
  const froth = Math.min((yD - yU) * 0.92, hl / 0.55 * sc);
  s.clipR(X - 2, yU - 2, W + 4, yD - yU + 4, () => {
    s.R(X + dcW, yD - froth, W - dcW * 2, froth, { stroke: null, fill: s.temp(loadF, 0.22) });
    for (let i = 0; i < 46; i++) {
      const px = X + dcW + 6 + ((i * 37) % Math.max(W - dcW * 2 - 12, 10));
      const py = yD - 4 - ((i * 23) % Math.max(froth - 4, 6));
      s.circ(px, py, 1.8 + (i % 3) * 0.7, { stroke: s.temp(loadF), lw: 0.8 });
    }
  });
  s.R(X + dcW, yD - hl * sc, W - dcW * 2, hl * sc, { stroke: null, fill: C.soft3 });
  s.L([[X + dcW, yD], [X + W - dcW, yD]], { col: C.ink, lw: 2.4 });
  s.L([[X + dcW, yU], [X + W - dcW, yU]], { col: C.ink, lw: 2.4 });
  for (let i = 0; i < 16; i++) { const px = X + dcW + 10 + (W - dcW * 2 - 20) * i / 15; s.L([[px, yD - 1], [px, yD - 11 - 7 * loadF]], { col: s.temp(loadF), lw: 1.2, arrow: true, asz: 4.5 }); }
  s.L([[X + dcW, yU], [X + dcW, yU + (yD - yU) * 0.82]], { col: C.ink, lw: 1.8 });
  s.L([[X + W - dcW, yD], [X + W - dcW, yD - v.hw * sc]], { col: C.acc, lw: 2.6 });
  s.L([[X + W - dcW, yU], [X + W - dcW, yU + (yD - yU) * 0.82]], { col: C.ink, lw: 1.8 });
  const bk = Math.min(hdc * sc, yD - yU);
  s.R(X + W - dcW + 1, yD - bk, dcW - 1, bk, { stroke: null, fill: hdc > v.ts * 0.5 ? s.temp(0.95, 0.4) : C.soft3 });
  s.L([[X + W - dcW + 1, yD - bk], [X + W - 1, yD - bk]], { col: hdc > v.ts * 0.5 ? C.warn : C.acc, lw: 1.5 });
  s.L([[X + W, yU], [X + W, yD]], { col: C.ink, lw: 2 });
  s.L([[X, yU], [X, yD]], { col: C.ink, lw: 2 });
  s.dim(X - 26, yU, X - 26, yD, self.f(v.ts, 0) + ' mm', { col: C.mut });
  s.plate('weir h_w ' + self.f(v.hw, 0) + ' mm', X + W - dcW - 7, yD - Math.max(v.hw * sc, 10) - 26, { size: 10, col: C.acc, lab: C.mid, align: 'right' });
  s.R(X + 1, yD - Math.min(hdc * sc * 0.55, yD - yU), dcW - 1, Math.min(hdc * sc * 0.55, yD - yU), { stroke: null, fill: C.soft });
  s.T('from the tray above', X + dcW + 8, yU + 20, { size: 9.5, col: C.mut });
  s.T('to the tray below', X + W - 3, yD + 14, { size: 9.5, col: C.mut, align: 'right' });
  s.T('vapour space', X + W / 2, (yU + yD) / 2, { size: 11, col: C.mut, align: 'center', caps: true });
  s.T(self.f(hdc, 0) + ' mm', X + W + 7, yD - bk, { size: 10.5, col: hdc > v.ts * 0.5 ? C.warn : C.mid });
  s.plate('clear liquid ' + self.f(hl, 0) + ' mm', X + dcW + 76, yD - Math.max(hl * sc, 10) - 14, { size: 10, col: C.ink, lab: C.mid, align: 'center' });
  s.badge(s.x + s.w - 142, s.y + 2, 'Percent of flood', self.f(pct, 0) + '%', 0.5 + 0.5 * self.cl01((pct - 45) / 55), { w: 142 });
  s.badge(s.x + s.w - 142, s.y + 46, 'Tray \u0394P', self.f(ht, 0) + ' mm liquid', null, { w: 142 });
  s.badge(s.x + s.w - 142, s.y + 90, 'Downcomer backup', self.f(hdc, 0) + ' mm', hdc > v.ts * 0.5 ? 0.95 : 0.42, { w: 142 });
  if (weep) s.T('weeping \u2014 liquid rains through the holes', X + dcW + 8, yU + 12, { size: 11, col: C.warn, bold: true });
  if (hdc > v.ts * 0.5) s.T('downcomer flood', X + W - dcW - 6, yU + 12, { size: 11, col: C.warn, bold: true, align: 'right' });
},
        schemNote: 'One tray deck with its weir, downcomer and froth drawn to the hydraulic numbers. Froth reddens as the tray approaches flood, the downcomer liquid rises with backup, and weeping or downcomer flood are called out on the drawing.',
        num: 'S-10', sec: SP, name: 'Tray hydraulics & the operating window',
        blurb: 'A tray works inside a box drawn by four failures: too little vapour and it weeps, too much and it floods, too much liquid and the downcomer backs up, too little and the weir runs dry. Everything a column can actually do lives inside that box.',
        howto: 'The window is drawn in vapour load against liquid load with your design point inside it. Push the vapour up and you march toward the flood ceiling; drop it and you fall through the weep floor. The distance to the nearest wall is your turndown \u2014 anything under about 2:1 will not survive a plant trip.',
        std: 'Fair (1961) flooding correlation; Glitsch/Koch tray design manuals; Perry\u2019s 8th ed. \u00a714',
        eqs: [['C_{sb} = u_v\\sqrt{\\frac{\\rho_g}{\\rho_l - \\rho_g}}\\left(\\frac{20}{\\sigma}\\right)^{0.2}', 'Fair capacity parameter at flood'], ['h_{ow} = 750\\left(\\frac{Q_l}{L_w}\\right)^{2/3}', 'Francis weir crest, mm of clear liquid'], ['h_d = 51\\left(\\frac{u_h}{C_v}\\right)^2\\frac{\\rho_g}{\\rho_l}', 'dry-tray pressure drop across the holes'], ['h_{dc} = h_t + h_w + h_{ow} + h_{da}', 'downcomer backup — must stay below half the tray spacing']],
        notes: ['Sieve tray, single pass, no downcomer inlet weir.', 'Flooding computed on the net area (tower area less one downcomer).', 'Weeping criterion is the Fair h_d + h_\u03c3 against h_w + h_ow balance.'],
        params: [PF('D', 'Tower diameter', 0.4, 8, 0.05, 2, 'L'), P('ts', 'Tray spacing', 300, 900, 25, 610, 'mm'), P('Wv', 'Vapour rate', 500, 400000, 500, 25000, null, 'kg/h'), P('Wl', 'Liquid rate', 500, 800000, 500, 60000, null, 'kg/h'), P('rhog', 'Vapour density', 0.3, 60, 0.1, 3.2, 'rho'), P('rhol', 'Liquid density', 400, 1400, 5, 780, 'rho'), P('sig', 'Surface tension', 3, 75, 0.5, 18, null, 'mN/m'), P('hw', 'Weir height', 20, 100, 1, 50, 'mm'), P('lw', 'Weir length / diameter', 0.5, 0.85, 0.01, 0.72, null, '\u2014'), P('ah', 'Hole area / active area', 0.04, 0.18, 0.005, 0.1, null, '\u2014'), P('dh', 'Hole diameter', 3, 25, 0.5, 12.7, 'mm'), P('dcf', 'Downcomer area / tower area', 0.05, 0.25, 0.005, 0.1, null, '\u2014')],
        compute: v => {
          const At = Math.PI * v.D * v.D / 4;
          const Adc = v.dcf * At, An = At - Adc, Aa = At - 2 * Adc, Ah = v.ah * Aa;
          const Lw = v.lw * v.D;
          const Qg = (v.Wv / 3600) / v.rhog, Ql = (v.Wl / 3600) / v.rhol;
          const Flv = (v.Wl / v.Wv) * Math.sqrt(v.rhog / v.rhol);
          const csbOf = flv => { const x = Math.log10(Math.max(Math.min(flv, 2), 0.01)); return Math.max(0.0105 + 0.0182 * (v.ts / 1000) + (0.0035 - 0.0025 * x) * Math.pow(v.ts / 1000, 0.5) * Math.pow(10, -0.32 * x) * 6, 0.02); };
          const Csb = csbOf(Flv) * Math.pow(20 / v.sig, 0.2);
          const uflood = Csb * Math.sqrt((v.rhol - v.rhog) / v.rhog);
          const un = Qg / An;
          const pct = un / uflood * 100;
          const uh = Qg / Ah;
          const hd = 51 * Math.pow(uh / 0.75, 2) * v.rhog / v.rhol;
          const how = 750 * Math.pow(Ql / Lw, 2 / 3);
          const hsig = 409 * (v.sig / 1000) / (v.rhol * v.dh / 1000) * 1000;
          const hl = 0.6 * (v.hw + how);
          const ht = hd + hl;
          const hda = 165.2 * Math.pow(Ql / (Lw * 0.038), 2);
          const hdc = ht + v.hw + how + hda;
          const weepOK = hd + hsig > v.hw + how;
          const bu = hdc / v.ts * 100;
          const res = [{ l: 'Tower area', v: At, u: '', cv: 'A', d: 3 }, { l: 'Net area for vapour', v: An, u: '', cv: 'A', d: 3 }, { l: 'Active (bubbling) area', v: Aa, u: '', cv: 'A', d: 3 }, { l: 'Flow parameter F_LV', v: Flv, u: '\u2014', d: 4 }, { l: 'Capacity parameter C_sb', v: Csb, u: 'm/s', d: 4 }, { l: 'Flooding velocity', v: uflood, u: '', cv: 'vel', d: 3 }, { l: 'Actual net velocity', v: un, u: '', cv: 'vel', d: 3 }, { l: 'Percent of flood', v: pct, u: '%', d: 1 }, { l: 'Flood verdict', s: pct > 85 ? 'above 85% \u2014 the tray will flood on any upset' : pct < 45 ? 'lightly loaded \u2014 check the weep margin' : 'in the normal design band', u: '' }, { l: 'Hole velocity', v: uh, u: '', cv: 'vel', d: 2 }, { l: 'Dry-tray head h_d', v: hd, u: '', cv: 'mm', d: 1 }, { l: 'Weir crest h_ow', v: how, u: '', cv: 'mm', d: 1 }, { l: 'Clear liquid on the tray', v: hl, u: '', cv: 'mm', d: 1 }, { l: 'Total tray pressure drop', v: ht, u: '', cv: 'mm', d: 1 }, { l: 'Tray \u0394P', v: ht / 1000 * v.rhol * 9.80665 / 1000, u: 'kPa', d: 3 }, { l: 'Weeping check', s: weepOK ? 'no weeping \u2014 hole velocity holds the liquid up' : 'weeping \u2014 raise the vapour rate or blank some holes', u: '' }, { l: 'Downcomer backup', v: hdc, u: '', cv: 'mm', d: 1 }, { l: 'Backup as % of tray spacing', v: bu, u: '%', d: 1 }, { l: 'Downcomer verdict', s: bu > 50 ? 'above half the tray spacing \u2014 downcomer flood' : 'downcomer has margin', u: '' }, { l: 'Turndown to the weep point', v: weepOK ? un / Math.max(un * Math.sqrt(Math.max((v.hw + how - hsig), 1) / Math.max(hd, 1e-6)), 1e-6) : 1, u: ': 1', d: 2 }];
          return { csbOf: csbOf, Flv: Flv, un: un, uflood: uflood, pct: pct, res: res, Aa: Aa, An: An, Ah: Ah, Lw: Lw, hw: v.hw, hsig: hsig, rhog: v.rhog, rhol: v.rhol };
        },
        draw: (ctx, b, v, r) => {
          const qlmax = Math.max((v.Wl / 3600) / v.rhol * 2.2, 0.01);
          const qgmax = Math.max((v.Wv / 3600) / v.rhog * 1.8, 0.1);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: qlmax * 3600, ymin: 0, ymax: qgmax, ml: 74 });
          g.grid('Liquid load  (m\u00b3/h)', 'Vapour load  (m\u00b3/s)', 5, 5, t => self.f(t, 0), t => self.f(t, 2));
          g.title('The tray operating window');
          const floodOf = ql => { const wl = ql / 3600 * r.rhol * 3600; return r.An * r.csbOf((wl / Math.max(v.Wv, 1)) * Math.sqrt(r.rhog / r.rhol)) * Math.pow(20 / v.sig, 0.2) * Math.sqrt((r.rhol - r.rhog) / r.rhog); };
          const weepOf = ql => {
            const how = 750 * Math.pow((ql / 3600) / r.Lw, 2 / 3);
            const hdreq = Math.max(v.hw + how - r.hsig, 1);
            const uh = 0.75 * Math.sqrt(hdreq / 51 * r.rhol / r.rhog);
            return uh * r.Ah;
          };
          const pts = [], wpts = [];
          for (let i = 0; i <= 60; i++) { const ql = qlmax * 3600 * (i / 60) + 0.5; pts.push([ql, floodOf(ql)]); wpts.push([ql, weepOf(ql)]); }
          g.fill(pts.concat(wpts.slice().reverse()), C.soft);
          g.line(pts, C.warn, 2.4);
          g.line(wpts, C.mid, 2.2, [6, 4]);
          g.line([[qlmax * 3600 * 0.92, 0], [qlmax * 3600 * 0.92, qgmax]], C.lt, 1.8, [3, 3]);
          g.txt('downcomer limit', qlmax * 3600 * 0.9, qgmax * 0.12, C.mid, 'right', 10.5);
          g.txt('flood', qlmax * 3600 * 0.04, floodOf(qlmax * 3600 * 0.04) * 1.03, C.warn, 'left', 11, 'bottom');
          g.txt('weep', qlmax * 3600 * 0.04, weepOf(qlmax * 3600 * 0.04) * 0.9, C.mid, 'left', 11);
          g.cross((v.Wl / 3600) / v.rhol * 3600, (v.Wv / 3600) / v.rhog, C.dk, 10);
          g.dot((v.Wl / 3600) / v.rhol * 3600, (v.Wv / 3600) / v.rhog, C.acc, 5.5);
          g.txt(self.f(r.pct, 0) + '% of flood', (v.Wl / 3600) / v.rhol * 3600, (v.Wv / 3600) / v.rhog + qgmax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.warn, l: 'flood ceiling' }, { c: C.mid, l: 'weep floor', d: [6, 4] }]);
        }
      },
      {
        id: 'henry', num: 'S-11', sec: SP, name: 'Henry\u2019s law & gas solubility',
        blurb: 'How much gas a liquid will hold, and how fast that changes with temperature. Every stripper, every deaerator and every dissolved-oxygen specification is this one line \u2014 and the van \u2019t Hoff slope is why hot water holds almost nothing.',
        howto: 'Each curve is solubility against temperature at your partial pressure, one per gas, with yours drawn heavy. The spread across three orders of magnitude is the whole story of gas treating: CO\u2082 and H\u2082S dissolve, methane and nitrogen barely do, and everything falls as the water warms.',
        std: 'Sander (2015) compilation of Henry\u2019s law constants; van \u2019t Hoff temperature dependence',
        eqs: [['p_i = H_ix_i \\quad\\text{or}\\quad c_i = \\frac{p_i}{H^{cp}}', 'Henry’s law in either the pressure or the concentration form'], ['H(T) = H^{\\circ}\\exp\\left[-\\frac{\\Delta_{sol}H}{R}\\left(\\frac{1}{T} - \\frac{1}{298.15}\\right)\\right]', 'van ’t Hoff temperature correction'], ['x_i = \\frac{p_i}{H_i},\\qquad c_i = \\frac{x_i\\rho_wM_i}{M_w}\\times10^6\\ \\text{ppm}', 'mole fraction to a mass concentration'], ['S = \\frac{L}{mV},\\qquad m = \\frac{H}{P}', 'the equilibrium slope that a stripper or absorber design needs']],
        notes: ['Dilute aqueous solutions and ideal gas phase \u2014 valid to a few bar of partial pressure.', 'Chemically reacting systems (CO\u2082 in amine, NH\u2083 in water) hold far more than physical solubility predicts.', 'Salting-out in brines reduces solubility; no Setschenow correction is applied.'],
        params: [{ k: 'gas', label: 'Gas', type: 'select', val: 'o2', options: Object.keys(GAS).map(k => [k, GAS[k][0]]) }, P('T', 'Water temperature', 0, 95, 1, 25, 'T'), P('Pt', 'Total pressure (abs)', 0.5, 100, 0.5, 1.013, null, 'bar a'), P('y', 'Gas mole fraction in the vapour', 0.001, 1, 0.001, 0.21, null, '\u2014'), P('MWg', 'Gas molecular weight', 2, 100, 0.1, 32, null, 'kg/kmol'), P('L', 'Liquid rate (for the stripper check)', 1, 5000, 1, 100, null, 'kmol/h'), P('V', 'Gas rate (for the stripper check)', 1, 5000, 1, 30, null, 'kmol/h')],
        compute: v => {
          const gs = GAS[v.gas] || GAS.o2;
          const H25 = gs[1], B = gs[2];
          const Hof = (T, h25, bb) => h25 * Math.exp(bb * (1 / (T + 273.15) - 1 / 298.15)) * 1;
          const HT = H25 * Math.exp(-B * (1 / (v.T + 273.15) - 1 / 298.15)) * 1;
          const Hbar = HT;
          const pi = v.Pt * v.y;
          const x = pi / Math.max(Hbar, 1e-12);
          const ppm = x * 1e6 * v.MWg / 18.015;
          const mgL = ppm * (1 - 0.0002 * v.T);
          const m = Hbar / v.Pt;
          const S = m * v.V / v.L;
          const solOf = (T, key) => {
            const g2 = GAS[key];
            const H = g2[1] * Math.exp(-g2[2] * (1 / (T + 273.15) - 1 / 298.15));
            return pi / H * 1e6 * v.MWg / 18.015;
          };
          return {
            solOf: solOf, ppm: ppm, HT: Hbar, m: m,
            res: [{ l: 'Gas', s: gs[0], u: '' }, { l: 'Partial pressure', v: pi, u: 'bar', d: 5 }, { l: 'Henry constant at 25 \u00b0C', v: H25, u: 'bar', d: 1 }, { l: 'Henry constant at your temperature', v: Hbar, u: 'bar', d: 1 }, { l: 'Enthalpy of solution term', v: B, u: 'K', d: 0 }, { l: 'Liquid mole fraction x', v: x, u: '\u2014', d: 8 }, { l: 'Dissolved concentration', v: ppm, u: 'mg/kg', d: 4 }, { l: 'Dissolved concentration', v: mgL, u: 'mg/L', d: 4 }, { l: 'Equilibrium slope m = H/P', v: m, u: '\u2014', d: 2 }, { l: 'Stripping factor S = mV/L', v: S, u: '\u2014', d: 3 }, { l: 'Stripper verdict', s: S < 1 ? 'S below 1 \u2014 stripping will stall whatever the stage count' : S > 3 ? 'comfortable stripping factor' : 'workable but stage-hungry', u: '' }, { l: 'Solubility change per 10 K', v: (solOf(v.T + 10, v.gas) / Math.max(ppm, 1e-12) - 1) * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const keys = ['co2', 'o2', 'n2', 'ch4'];
          if (keys.indexOf(v.gas) < 0) keys.unshift(v.gas);
          const cols = [C.acc, C.dk, C.mid, C.lt, C.warn];
          let ymax = 0, ymin = 1e12;
          keys.forEach(k => { for (let T = 0; T <= 95; T += 5) { const s = r.solOf(T, k); if (s > 0) { ymax = Math.max(ymax, s); ymin = Math.min(ymin, s); } } });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 95, ymin: Math.max(ymin * 0.7, 1e-4), ymax: ymax * 1.4, ylog: true, ml: 72 });
          g.grid('Water temperature  (' + self.cvt(0, 'T')[1] + ')', 'Solubility  (mg/kg)', 5, 4, t => self.f(self.cvt(t, 'T')[0], 0));
          g.title('Solubility falls as the water warms');
          keys.forEach((k, i) => {
            const sel = k === v.gas;
            g.fn(T => r.solOf(T, k), sel ? C.dk : 'rgba(29,31,32,0.28)', sel ? 2.8 : 1.5, sel ? [] : [6, 4]);
            g.txt(GAS[k][0], 94, r.solOf(95, k), sel ? C.dk : C.mut, 'right', 10.5, 'bottom');
          });
          g.dot(v.T, r.ppm, C.acc, 5.5);
          g.txt(self.f(r.ppm, 3) + ' mg/kg', v.T, r.ppm * 1.25, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: GAS[v.gas][0] }, { c: 'rgba(29,31,32,0.28)', l: 'other gases', d: [6, 4], lw: 1.5 }]);
        }
      },
      {
        id: 'gasmix', num: 'T-06', sec: TP, name: 'Gas mixture properties',
        blurb: 'Nine components, one stream, and four different mixing rules. Molecular weight and heat capacity mix on mole and mass fraction; viscosity and conductivity do not, and using a mole-fraction average for those is one of the most common quiet errors in a heat-transfer calculation.',
        howto: 'The curves are mixture heat capacity and the ratio k against temperature. Watch what a few percent of hydrogen does to conductivity, or what CO\u2082 does to k \u2014 both change compressor and exchanger answers far more than the mole fraction suggests.',
        std: 'Wilke (1950) viscosity mixing rule; Wassiljewa\u2013Mason\u2013Saxena conductivity; NASA/JANAF c_p polynomials',
        eqs: [['M_{mix} = \\sum_iy_iM_i,\\qquad w_i = \\frac{y_iM_i}{M_{mix}}', 'mole to mass fraction'], ['c_{p,mix} = \\sum_iw_ic_{p,i},\\qquad k_{ratio} = \\frac{c_{p,mix}}{c_{p,mix} - R/M_{mix}}', 'mass-weighted heat capacity and the ideal-gas ratio'], ['\\mu_{mix} = \\sum_i\\frac{y_i\\mu_i}{\\sum_jy_j\\phi_{ij}},\\qquad \\phi_{ij} = \\frac{\\left[1 + \\left(\\mu_i/\\mu_j\\right)^{1/2}\\left(M_j/M_i\\right)^{1/4}\\right]^2}{\\sqrt{8\\left(1 + M_i/M_j\\right)}}', 'Wilke — viscosity does not mix linearly'], ['\\lambda_{mix} = \\sum_i\\frac{y_i\\lambda_i}{\\sum_jy_j\\phi_{ij}}', 'the same interaction form for thermal conductivity']],
        notes: ['Ideal-gas basis \u2014 apply a compressibility factor above about 10 bar.', 'Component properties are quoted at 25 \u00b0C and scaled with temperature by kinetic-theory exponents.', 'Condensable components (water) are treated as permanent gases; check the dew point yourself.'],
        params: [P('T', 'Temperature', -50, 600, 5, 60, 'T'), P('Pb', 'Pressure (abs)', 0.5, 100, 0.5, 5, null, 'bar a'), P('ch4', 'Methane', 0, 100, 0.5, 80, null, 'mol %'), P('c2h6', 'Ethane', 0, 100, 0.5, 8, null, 'mol %'), P('c3h8', 'Propane', 0, 100, 0.5, 3, null, 'mol %'), P('co2', 'Carbon dioxide', 0, 100, 0.5, 4, null, 'mol %'), P('n2', 'Nitrogen', 0, 100, 0.5, 5, null, 'mol %'), P('h2', 'Hydrogen', 0, 100, 0.5, 0, null, 'mol %'), P('h2s', 'Hydrogen sulphide', 0, 100, 0.5, 0, null, 'mol %'), P('h2o', 'Water vapour', 0, 100, 0.5, 0, null, 'mol %'), P('o2', 'Oxygen', 0, 100, 0.5, 0, null, 'mol %')],
        compute: v => {
          const keys = ['ch4', 'c2h6', 'c3h8', 'co2', 'n2', 'h2', 'h2s', 'h2o', 'o2'];
          const raw = keys.map(k => Math.max(v[k], 0));
          const tot = raw.reduce((a, b2) => a + b2, 0) || 1;
          const y = raw.map(q => q / tot);
          const MW = keys.reduce((s, k, i) => s + y[i] * CMP[k][1], 0);
          const w = keys.map((k, i) => y[i] * CMP[k][1] / MW);
          const TK = v.T + 273.15;
          const muOf = (k, T) => CMP[k][4] * 1e-3 * Math.pow((T + 273.15) / 298.15, 0.7);
          const laOf = (k, T) => CMP[k][5] * Math.pow((T + 273.15) / 298.15, 0.9);
          const cpOf = (k, T) => CMP[k][2] * (1 + 0.00035 * (T - 25) * (CMP[k][1] < 20 ? 0.4 : 1.6));
          const wilke = (T, prop) => {
            const val = keys.map(k => prop === 'mu' ? muOf(k, T) : laOf(k, T));
            let s = 0;
            for (let i = 0; i < keys.length; i++) {
              if (y[i] < 1e-9) continue;
              let den = 0;
              for (let j = 0; j < keys.length; j++) {
                if (y[j] < 1e-9) continue;
                const Mi = CMP[keys[i]][1], Mj = CMP[keys[j]][1];
                const phi = Math.pow(1 + Math.sqrt(val[i] / val[j]) * Math.pow(Mj / Mi, 0.25), 2) / Math.sqrt(8 * (1 + Mi / Mj));
                den += y[j] * phi;
              }
              s += y[i] * val[i] / den;
            }
            return s;
          };
          const cpOfT = T => keys.reduce((s, k, i) => s + w[i] * cpOf(k, T), 0);
          const cp = cpOfT(v.T);
          const Rm = 8.314 / MW;
          const kr = cp / Math.max(cp - Rm, 0.01);
          const mu = wilke(v.T, 'mu');
          const la = wilke(v.T, 'la');
          const rho = v.Pb * 1e5 * MW / (8314 * TK);
          const sg = MW / 28.9647;
          const Pr = cp * 1000 * mu / la;
          const lin = keys.reduce((s, k, i) => s + y[i] * muOf(k, v.T), 0);
          return {
            cpOfT: cpOfT, wilke: wilke, cp: cp, mu: mu, la: la, kr: kr,
            res: [{ l: 'Mixture molecular weight', v: MW, u: 'kg/kmol', d: 3 }, { l: 'Specific gravity to air', v: sg, u: '\u2014', d: 4 }, { l: 'Density at conditions', v: rho, u: '', cv: 'rho', d: 4 }, { l: 'Specific gas constant R/M', v: Rm, u: 'kJ/kg\u00b7K', d: 4 }, { l: 'Heat capacity c_p', v: cp, u: 'kJ/kg\u00b7K', d: 4 }, { l: 'Molar heat capacity', v: cp * MW, u: 'kJ/kmol\u00b7K', d: 3 }, { l: 'Heat capacity ratio k', v: kr, u: '\u2014', d: 4 }, { l: 'Viscosity (Wilke)', v: mu * 1000, u: 'cP', d: 5 }, { l: 'Viscosity if mole-averaged', v: lin * 1000, u: 'cP', d: 5 }, { l: 'Error from averaging', v: (lin / Math.max(mu, 1e-12) - 1) * 100, u: '%', d: 2 }, { l: 'Thermal conductivity', v: la, u: '', cv: 'kt', d: 5 }, { l: 'Prandtl number', v: Pr, u: '\u2014', d: 4 }, { l: 'Sonic velocity', v: Math.sqrt(kr * 8314 / MW * TK), u: '', cv: 'vel', d: 1 }, { l: 'Components summed', v: tot, u: 'mol %', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const tmin = -50, tmax = 500;
          const cmax = r.cpOfT(tmax) * 1.1, cmin = r.cpOfT(tmin) * 0.9;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: tmin, xmax: tmax, ymin: cmin, ymax: cmax, ml: 76, mr: 58 });
          g.grid('Temperature  (' + self.cvt(0, 'T')[1] + ')', 'c\u209a  (kJ/kg\u00b7K)', 5, 5, t => self.f(self.cvt(t, 'T')[0], 0), t => self.f(t, 2));
          g.title('Mixture heat capacity and viscosity');
          g.fn(T => r.cpOfT(T), C.dk, 2.8);
          const mumax = r.wilke(tmax, 'mu') * 1000;
          g.fn(T => cmin + (r.wilke(T, 'mu') * 1000) / mumax * (cmax - cmin), C.acc, 2.2, [6, 4]);
          ctx.save(); ctx.fillStyle = C.acc; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(f2 => ctx.fillText(self.f(mumax * f2, 4), g.x + g.w + 8, g.Y(cmin + (cmax - cmin) * f2)));
          ctx.restore();
          g.dot(v.T, r.cp, C.acc, 5.5);
          g.txt(self.f(r.cp, 3) + ' kJ/kg\u00b7K', v.T, r.cp + (cmax - cmin) * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'c\u209a' }, { c: C.acc, l: 'viscosity, cP (right)', d: [6, 4] }]);
        }
      },
      {
        id: 'amine', num: 'T-07', sec: TP, name: 'Solvent circulation & sizing \u2014 amine treating',
        blurb: 'A gas sweetening unit is sized by one number: how much acid gas each mole of amine will carry. Push the rich loading up and the circulation rate falls, the reboiler shrinks and the corrosion engineer starts objecting \u2014 the whole design is that argument.',
        howto: 'The curve is circulation rate against rich loading, with the reboiler duty riding on it. It falls hard at first then flattens, and the vertical line is the corrosion limit for your solvent \u2014 designing to the right of it is how carbon-steel amine plants fail.',
        std: 'GPSA Engineering Data Book \u00a721 \u2014 hydrocarbon treating; Kohl & Nielsen, Gas Purification 5th ed.',
        eqs: [['\\dot n_{acid} = \\dot n_{gas}\\left(y_{CO_2} + y_{H_2S}\\right)_{in} - \\dot n_{gas}\\left(y_{CO_2} + y_{H_2S}\\right)_{out}', 'acid gas the solvent must carry'], ['L_{amine} = \\frac{\\dot n_{acid}}{\\alpha_{rich} - \\alpha_{lean}}', 'circulation on a mole-of-amine basis'], ['Q_{reb} = q_{spec}L_{vol},\\qquad q_{spec} \\approx 110{-}140\\ \\text{kJ per litre of solution}', 'reboiler duty scales with circulation, not with acid gas'], ['\\dot Q_{cond} \\approx 0.4\\,Q_{reb},\\qquad \\dot Q_{lean/rich} = L c_p\\Delta T_{approach}', 'the rest of the heat train follows from the same rate']],
        notes: ['Physical circulation only \u2014 no kinetic limit on CO\u2082 pickup, which matters for MDEA.', 'Rich loading limits: 0.45 mol/mol for MEA, 0.50 for DEA, 0.55 for MDEA in carbon steel.', 'Reboiler duty is a per-volume rule of thumb; a real design comes from a rate-based model.'],
        params: [{ k: 'sol', label: 'Solvent', type: 'select', val: 'mdea', options: [['mea', 'MEA \u2014 monoethanolamine'], ['dea', 'DEA \u2014 diethanolamine'], ['mdea', 'MDEA \u2014 methyldiethanolamine']] }, PF('Qg', 'Sour gas rate', 0.1, 50, 0.1, 5, null, 'MMSm\u00b3/day'), P('co2in', 'CO\u2082 in the feed', 0, 25, 0.05, 4, null, 'mol %'), P('h2sin', 'H\u2082S in the feed', 0, 20, 0.01, 0.5, null, 'mol %'), P('co2out', 'CO\u2082 specification', 0, 5, 0.01, 0.2, null, 'mol %'), P('h2sout', 'H\u2082S specification', 0, 1, 0.0005, 0.0004, null, 'mol %'), P('conc', 'Amine concentration', 15, 55, 0.5, 45, null, 'wt %'), P('alean', 'Lean loading', 0.005, 0.2, 0.005, 0.01, null, 'mol/mol'), P('arich', 'Rich loading', 0.15, 0.7, 0.005, 0.45, null, 'mol/mol'), P('qspec', 'Reboiler duty per volume', 80, 200, 5, 120, null, 'kJ/L')],
        compute: v => {
          const SOL = { mea: ['MEA', 61.08, 0.45, 1.012], dea: ['DEA', 105.14, 0.50, 1.095], mdea: ['MDEA', 119.16, 0.55, 1.042] };
          const s = SOL[v.sol] || SOL.mdea;
          const nGas = v.Qg * 1e6 / 24 / 22.414;
          const acid = nGas * ((v.co2in - v.co2out) + (v.h2sin - v.h2sout)) / 100;
          const Lof = ar => {
            const nAmine = acid / Math.max(ar - v.alean, 1e-6);
            const mAmine = nAmine * s[1];
            const mSol = mAmine / (v.conc / 100);
            return { nAmine: nAmine, mSol: mSol, vol: mSol / (s[3] * 1000) };
          };
          const d = Lof(v.arich);
          const Qreb = d.vol * 1000 * v.qspec / 3600;
          const spent = acid * 22.414;
          const stripSteam = Qreb * 3600 / 2100;
          return {
            Lof: Lof, d: d, Qreb: Qreb, amax: s[2], sname: s[0],
            res: [{ l: 'Solvent', s: s[0] + ' at ' + self.f(v.conc, 0) + ' wt %', u: '' }, { l: 'Gas molar rate', v: nGas, u: 'kmol/h', d: 1 }, { l: 'Acid gas removed', v: acid, u: 'kmol/h', d: 3 }, { l: 'Acid gas removed', v: spent / 1000, u: 'kSm\u00b3/h', d: 4 }, { l: 'Net loading swing', v: v.arich - v.alean, u: 'mol/mol', d: 4 }, { l: 'Loading verdict', s: v.arich > s[2] ? 'above the carbon-steel limit for ' + s[0] + ' \u2014 corrosion risk' : 'within the accepted rich-loading limit', u: '' }, { l: 'Amine circulation, molar', v: d.nAmine, u: 'kmol/h', d: 1 }, { l: 'Solution circulation, mass', v: d.mSol, u: '', cv: 'M', d: 0 }, { l: 'Solution circulation, volume', v: d.vol, u: '', cv: 'Q', d: 2 }, { l: 'Circulation per unit acid gas', v: d.vol / Math.max(acid, 1e-9), u: 'm\u00b3/kmol', d: 3 }, { l: 'Reboiler duty', v: Qreb, u: '', cv: 'W', d: 0 }, { l: 'Stripping steam at 2100 kJ/kg', v: stripSteam, u: '', cv: 'M', d: 0 }, { l: 'Reflux condenser duty', v: Qreb * 0.4, u: '', cv: 'W', d: 0 }, { l: 'Lean/rich exchanger duty', v: d.mSol / 3600 * 3.6 * 45, u: '', cv: 'W', d: 0 }, { l: 'Rich pump power at 8 bar', v: d.vol / 3600 * 8e5 / 0.7 / 1000, u: '', cv: 'W', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const amin = Math.max(v.alean + 0.05, 0.15), amax = 0.7;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: amin, xmax: amax, ymin: 0, ymax: r.Lof(amin).vol * 1.08, ml: 78, mr: 60 });
          g.grid('Rich loading  (mol acid / mol amine)', 'Circulation  (' + self.cvt(0, 'Q')[1] + ')', 5, 5, t => self.f(t, 2), t => self.f(self.cvt(t, 'Q')[0], 0));
          g.title('Circulation and reboiler duty against rich loading');
          const vmax = r.Lof(amin).vol * 1.08;
          g.fn(a => r.Lof(a).vol, C.dk, 2.8);
          const qmax = r.Lof(amin).vol * 1000 * v.qspec / 3600;
          g.fn(a => r.Lof(a).vol * 1000 * v.qspec / 3600 / qmax * vmax, C.mid, 2.2, [6, 4]);
          ctx.save(); ctx.fillStyle = C.mid; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(f2 => ctx.fillText(self.f(self.cvt(qmax * f2, 'W')[0], 0), g.x + g.w + 8, g.Y(vmax * f2)));
          ctx.restore();
          g.fill([[r.amax, 0], [amax, 0], [amax, vmax], [r.amax, vmax]], C.soft2);
          g.line([[r.amax, 0], [r.amax, vmax]], C.warn, 1.6, [5, 4]);
          g.txt('corrosion limit', r.amax + 0.005, vmax * 0.9, C.warn, 'left', 11);
          g.dot(v.arich, r.d.vol, C.acc, 5.5);
          g.txt(self.f(self.cvt(r.d.vol, 'Q')[0], 1) + ' ' + self.cvt(0, 'Q')[1], v.arich, r.d.vol + vmax * 0.05, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'circulation' }, { c: C.mid, l: 'reboiler duty (right)', d: [6, 4] }]);
        }
      },
      {
        id: 'assay', num: 'T-08', sec: TP, name: 'Crude assay & TBP cuts',
        blurb: 'A barrel of crude is worth what its cuts are worth. The true-boiling-point curve is the only honest statement of what is in it, and moving a cut point by ten degrees moves yield from one product into another \u2014 which is the whole of refinery planning in one graph.',
        howto: 'The S-curve is cumulative yield against boiling point; the shaded bands are your cuts. Drag a cut point and watch volume move between the neighbouring products, with each cut\u2019s gravity following its mid-boiling point through the Watson factor.',
        std: 'ASTM D2892 TBP distillation; Watson\u2013Nelson characterisation factor; Riazi\u2013Daubert property correlations',
        eqs: [['V(T) = \\frac{100}{1 + e^{-\\left(T - T_{50}\\right)/\\beta}}', 'the assay yield curve, fitted through the 50% point'], ['K_{UOP} = \\frac{\\sqrt[3]{T_B}}{\\gamma},\\qquad \\gamma_{cut} = \\frac{\\sqrt[3]{T_{B,cut}}}{K_{UOP}}', 'Watson factor held constant across the barrel gives each cut its gravity'], ['{}^{\\circ}API = \\frac{141.5}{\\gamma} - 131.5', 'gravity of each cut'], ['Y_{cut} = V\\left(T_{end}\\right) - V\\left(T_{start}\\right)', 'volumetric yield between two cut points']],
        notes: ['A single logistic fit stands in for the measured TBP curve \u2014 replace T\u2085\u2080 and the spread with the real assay when you have one.', 'Constant Watson factor across the barrel is an approximation; real crudes drift by 0.2\u20130.4.', 'No shift between TBP and ASTM D86 is applied.'],
        params: [P('api', 'Whole-crude gravity', 8, 50, 0.1, 32, null, '\u00b0API'), P('T50', 'TBP 50% point', 150, 550, 5, 340, 'T'), P('beta', 'Curve spread', 40, 200, 5, 115, 'dT'), P('s', 'Sulphur in the crude', 0, 5, 0.01, 1.4, null, 'wt %'), P('c1', 'Naphtha end point', 60, 220, 5, 180, 'T'), P('c2', 'Kerosene end point', 180, 300, 5, 250, 'T'), P('c3', 'Diesel end point', 250, 400, 5, 360, 'T'), P('c4', 'Vacuum gas oil end point', 380, 620, 5, 540, 'T'), PF('rate', 'Crude charge', 1000, 400000, 100, 100000, null, 'bbl/day')],
        compute: v => {
          const V = T => 100 / (1 + Math.exp(-(T - v.T50) / v.beta));
          const sg = 141.5 / (131.5 + v.api);
          const K = Math.pow(1.8 * (v.T50 + 273.15), 1 / 3) / sg;
          const cuts = [['Light ends & LPG', -40, 30], ['Naphtha', 30, v.c1], ['Kerosene / jet', v.c1, v.c2], ['Diesel', v.c2, v.c3], ['Vacuum gas oil', v.c3, v.c4], ['Vacuum residue', v.c4, 900]];
          const rows = cuts.map(c => {
            const y = Math.max(V(c[2]) - V(c[1]), 0);
            const Tb = (Math.max(c[1], 20) + Math.min(c[2], 700)) / 2;
            const g2 = Math.min(Math.max(Math.pow(1.8 * (Tb + 273.15), 1 / 3) / K, 0.55), 1.1);
            const api = 141.5 / g2 - 131.5;
            return [c[0], self.f(y, 2), self.f(api, 1), self.f(g2 * 999.016, 1), self.f(y / 100 * v.rate, 0)];
          });
          const light = Math.max(V(v.c1) - V(-40), 0);
          const mid = Math.max(V(v.c3) - V(v.c1), 0);
          const resid = Math.max(100 - V(v.c4), 0);
          return {
            V: V, K: K,
            res: [{ l: 'Specific gravity of the crude', v: sg, u: '\u2014', d: 4 }, { l: 'Watson factor K_UOP', v: K, u: '\u2014', d: 3 }, { l: 'Crude character', s: K > 12.1 ? 'paraffinic \u2014 good distillate barrel' : K > 11.5 ? 'intermediate base' : 'naphthenic / aromatic \u2014 residue-heavy', u: '' }, { l: 'Light ends + naphtha yield', v: light, u: 'vol %', d: 2 }, { l: 'Middle distillate yield', v: mid, u: 'vol %', d: 2 }, { l: 'Vacuum gas oil yield', v: Math.max(V(v.c4) - V(v.c3), 0), u: 'vol %', d: 2 }, { l: 'Vacuum residue yield', v: resid, u: 'vol %', d: 2 }, { l: 'Distillate-to-residue ratio', v: (100 - resid) / Math.max(resid, 1e-6), u: ': 1', d: 2 }, { l: 'Naphtha production', v: light / 100 * v.rate, u: 'bbl/day', d: 0 }, { l: 'Middle distillate production', v: mid / 100 * v.rate, u: 'bbl/day', d: 0 }, { l: 'Residue production', v: resid / 100 * v.rate, u: 'bbl/day', d: 0 }, { l: 'Sulphur classification', s: v.s < 0.5 ? 'sweet' : v.s < 1.5 ? 'intermediate' : 'sour \u2014 hydrotreating capacity governs', u: '' }],
            table: { title: 'Cut yields and properties', head: ['Cut', 'Yield  vol %', 'Gravity  \u00b0API', 'Density  kg/m\u00b3', 'bbl/day'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -20, xmax: 700, ymin: 0, ymax: 100, ml: 70 });
          g.grid('True boiling point  (' + self.cvt(0, 'T')[1] + ')', 'Cumulative yield  (vol %)', 5, 5, t => self.f(self.cvt(t, 'T')[0], 0));
          g.title('The assay curve and where you cut it');
          const cps = [30, v.c1, v.c2, v.c3, v.c4];
          cps.forEach((t, i) => {
            if (i % 2 === 0) { const t2 = cps[i + 1] !== undefined ? cps[i + 1] : 700; g.fill([[t, 0], [t2, 0], [t2, 100], [t, 100]], C.soft); }
            g.line([[t, 0], [t, r.V(t)]], C.mut, 1.2, [4, 4]);
          });
          g.fn(T => r.V(T), C.dk, 2.8);
          const labs = [['naphtha', (30 + v.c1) / 2], ['kero', (v.c1 + v.c2) / 2], ['diesel', (v.c2 + v.c3) / 2], ['VGO', (v.c3 + v.c4) / 2], ['residue', (v.c4 + 700) / 2]];
          labs.forEach(l => g.txt(l[0], l[1], 4, C.mut, 'center', 10.5));
          cps.forEach(t => g.dot(t, r.V(t), C.acc, 4.5));
          g.legend([{ c: C.dk, l: 'TBP yield curve' }]);
        }
      },
      {
        id: 'octane', num: 'T-09', sec: TP, name: 'Octane & cetane blending',
        blurb: 'Octane does not average. Blend two streams and the result usually falls short of the volumetric mean, except where an oxygenate is involved and it overshoots \u2014 which is why every refinery keeps an interaction term and why the last octane number is always the expensive one.',
        howto: 'The curve is pool octane against the fraction of the high-octane component, with the linear blend shown for contrast and the specification drawn across. The gap between the curves is the blending bonus or penalty; where the real curve crosses the spec is the fraction you actually have to buy.',
        std: 'ASTM D2699/D2700 octane; blending octane numbers per Gary & Handwerk, Petroleum Refining 5th ed.; ASTM D613 cetane',
        eqs: [['RON_{mix} = \\sum_iv_iRON_i + \\sum_i\\sum_{j>i}k_{ij}v_iv_j', 'volumetric blend plus a pairwise interaction term'], ['AKI = \\frac{RON + MON}{2},\\qquad S = RON - MON', 'the pump number and the sensitivity'], ['RVP_{mix}^{1.25} = \\sum_iv_iRVP_i^{1.25}', 'vapour pressure blends on its own index'], ['CI_{mix} = \\sum_iv_iCI_i,\\qquad CN \\approx CI\\ \\text{for straight-run diesel blends}', 'cetane blends close to linearly on volume']],
        notes: ['Blending octane numbers, not clear octane numbers \u2014 they differ most for aromatics and oxygenates.', 'Ethanol interaction taken as the classic positive synergy with paraffinic bases; it turns negative against high-aromatic bases.', 'RVP index exponent 1.25 is the Chevron form; some refiners use 1.0 for narrow blends.'],
        params: [{ k: 'fuel', label: 'Product', type: 'select', val: 'gaso', options: [['gaso', 'Gasoline \u2014 octane'], ['dies', 'Diesel \u2014 cetane']] }, P('vB', 'High-quality component', 0, 100, 0.5, 12, null, 'vol %'), P('ronA', 'Base stock RON', 60, 105, 0.1, 88, null, '\u2014'), P('monA', 'Base stock MON', 55, 100, 0.1, 79, null, '\u2014'), P('ronB', 'Blend component RON', 70, 130, 0.1, 120, null, '\u2014'), P('monB', 'Blend component MON', 65, 120, 0.1, 100, null, '\u2014'), P('kij', 'Interaction coefficient', -20, 40, 0.5, 12, null, '\u2014'), P('rvpA', 'Base stock RVP', 20, 90, 0.5, 55, null, 'kPa'), P('rvpB', 'Component RVP', 5, 150, 0.5, 125, null, 'kPa'), P('cnA', 'Base diesel cetane', 30, 55, 0.1, 44, null, '\u2014'), P('cnB', 'Improver blend cetane', 40, 100, 0.5, 74, null, '\u2014'), P('spec', 'Specification', 85, 100, 0.1, 95, null, 'RON or CN'), P('rvpspec', 'RVP specification', 45, 100, 0.5, 60, null, 'kPa')],
        compute: v => {
          const isG = v.fuel === 'gaso';
          const ronOf = f => { const vb = f / 100, va = 1 - vb; return va * v.ronA + vb * v.ronB + v.kij * va * vb; };
          const monOf = f => { const vb = f / 100, va = 1 - vb; return va * v.monA + vb * v.monB + v.kij * 0.6 * va * vb; };
          const cnOf = f => { const vb = f / 100; return (1 - vb) * v.cnA + vb * v.cnB; };
          const qOf = f => isG ? ronOf(f) : cnOf(f);
          const linOf = f => isG ? (1 - f / 100) * v.ronA + f / 100 * v.ronB : cnOf(f);
          const rvpOf = f => Math.pow((1 - f / 100) * Math.pow(v.rvpA, 1.25) + f / 100 * Math.pow(v.rvpB, 1.25), 1 / 1.25);
          const q = qOf(v.vB), ron = ronOf(v.vB), mon = monOf(v.vB), rvp = rvpOf(v.vB);
          let need = NaN;
          if ((qOf(0) - v.spec) * (qOf(100) - v.spec) < 0) need = self.bis(f => qOf(f) - v.spec, 0, 100, 1e-6);
          const res = isG
            ? [{ l: 'Pool RON', v: ron, u: '\u2014', d: 3 }, { l: 'Pool MON', v: mon, u: '\u2014', d: 3 }, { l: 'Anti-knock index (R+M)/2', v: (ron + mon) / 2, u: '\u2014', d: 3 }, { l: 'Sensitivity RON \u2212 MON', v: ron - mon, u: '\u2014', d: 3 }, { l: 'Linear blend RON', v: linOf(v.vB), u: '\u2014', d: 3 }, { l: 'Blending bonus', v: ron - linOf(v.vB), u: 'RON', d: 3 }, { l: 'Pool RVP', v: rvp, u: 'kPa', d: 2 }, { l: 'RVP verdict', s: rvp > v.rvpspec ? 'over the volatility specification \u2014 the blend needs butane pulled out' : 'within the volatility specification', u: '' }, { l: 'Octane specification', v: v.spec, u: '\u2014', d: 1 }, { l: 'Margin to specification', v: ron - v.spec, u: 'RON', d: 3 }, { l: 'Component needed for the spec', v: need, u: 'vol %', d: 2 }, { l: 'Verdict', s: ron >= v.spec ? 'on grade' : 'off grade \u2014 add ' + (isFinite(need) ? self.f(need, 1) + '% component' : 'a higher-octane stream'), u: '' }]
            : [{ l: 'Pool cetane number', v: q, u: '\u2014', d: 3 }, { l: 'Base stock cetane', v: v.cnA, u: '\u2014', d: 1 }, { l: 'Improver blend cetane', v: v.cnB, u: '\u2014', d: 1 }, { l: 'Cetane specification', v: v.spec, u: '\u2014', d: 1 }, { l: 'Margin to specification', v: q - v.spec, u: '\u2014', d: 3 }, { l: 'Component needed for the spec', v: need, u: 'vol %', d: 2 }, { l: 'Verdict', s: q >= v.spec ? 'on grade' : 'off grade \u2014 more improver or a lighter cut', u: '' }];
          return { qOf: qOf, linOf: linOf, q: q, need: need, isG: isG, res: res };
        },
        draw: (ctx, b, v, r) => {
          const lo = Math.min(r.qOf(0), r.qOf(100), v.spec) - 2, hi = Math.max(r.qOf(0), r.qOf(100), v.spec) + 2;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 100, ymin: lo, ymax: hi, ml: 72 });
          g.grid('High-quality component  (vol %)', r.isG ? 'Pool RON' : 'Pool cetane number', 5, 5, null, t => self.f(t, 1));
          g.title(r.isG ? 'Octane blends with a bonus' : 'Cetane blends close to linearly');
          g.line([[0, v.spec], [100, v.spec]], C.warn, 1.6, [5, 4]);
          g.txt('specification', 99, v.spec + (hi - lo) * 0.02, C.warn, 'right', 11, 'bottom');
          g.fn(f => r.linOf(f), C.lt, 2, [6, 4]);
          g.fn(f => r.qOf(f), C.dk, 2.8);
          if (isFinite(r.need)) { g.line([[r.need, lo], [r.need, v.spec]], C.mid, 1.3, [4, 4]); g.dot(r.need, v.spec, C.mid, 5); g.txt(self.f(r.need, 1) + '% on spec', r.need, v.spec - (hi - lo) * 0.05, C.mid, 'center', 11.5); }
          g.dot(v.vB, r.q, C.acc, 5.5);
          g.txt(self.f(r.q, 2), v.vB, r.q + (hi - lo) * 0.04, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'real blend' }, { c: C.lt, l: 'linear average', d: [6, 4] }]);
        }
      }
    ];
  }
