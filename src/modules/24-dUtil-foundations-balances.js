  dUtil() {
    const self = this, C = this.C;
    const S = 'Foundations & Balances';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const EQP = {
      pump: ['Centrifugal pump (incl. motor)', 'kW driver', 10, 9800, 0.55, 3.3, 'Turton'],
      hx: ['Shell & tube exchanger', 'm\u00b2 area', 100, 32000, 0.62, 3.2, 'Turton'],
      vessel: ['Vertical pressure vessel', 'm\u00b3 volume', 10, 14000, 0.62, 4.1, 'Turton'],
      tank: ['Atmospheric storage tank', 'm\u00b3 volume', 100, 9000, 0.55, 1.6, 'API 650'],
      column: ['Distillation column shell', 'm\u00b3 volume', 20, 17000, 0.62, 4.1, 'Turton'],
      tray: ['Sieve trays (per m\u00b2 area)', 'm\u00b2 tray area', 1, 700, 0.86, 1.4, 'Turton'],
      compressor: ['Centrifugal compressor', 'kW driver', 250, 42000, 0.67, 2.7, 'Turton'],
      fan: ['Centrifugal fan', 'm\u00b3/s', 2, 8500, 0.68, 2.6, 'Turton'],
      reactor: ['Jacketed agitated reactor', 'm\u00b3 volume', 5, 32000, 0.54, 4.0, 'Turton'],
      filter: ['Plate & frame filter', 'm\u00b2 area', 5, 27000, 0.58, 1.7, 'Turton'],
      dryer: ['Rotary dryer', 'm\u00b2 area', 10, 27000, 0.45, 1.9, 'Turton'],
      cooltower: ['Cooling tower, induced draught', 'm\u00b3/h water', 100, 1900, 0.60, 1.8, 'Turton']
    };
    const MATF = [['cs', 'Carbon steel', 1], ['ss', 'Stainless 304', 1.8], ['ss316', 'Stainless 316', 2.1], ['ni', 'Nickel alloy', 3.6], ['ti', 'Titanium', 5.4]];
    const UNITS = {
      length: ['Length', [['m', 'metre', 1], ['mm', 'millimetre', 0.001], ['cm', 'centimetre', 0.01], ['km', 'kilometre', 1000], ['in', 'inch', 0.0254], ['ft', 'foot', 0.3048], ['yd', 'yard', 0.9144], ['mi', 'mile', 1609.344]]],
      mass: ['Mass', [['kg', 'kilogram', 1], ['g', 'gram', 0.001], ['t', 'tonne', 1000], ['lb', 'pound', 0.45359237], ['oz', 'ounce', 0.0283495], ['ton', 'short ton', 907.18474]]],
      pressure: ['Pressure', [['Pa', 'pascal', 1], ['kPa', 'kilopascal', 1000], ['bar', 'bar', 1e5], ['barg', 'bar gauge \u2192 abs', 1e5], ['atm', 'atmosphere', 101325], ['psi', 'psi', 6894.757], ['mmHg', 'mmHg (torr)', 133.322], ['mH2O', 'metre water', 9806.65], ['inH2O', 'inch water', 249.089]]],
      volume: ['Volume', [['m3', 'cubic metre', 1], ['L', 'litre', 0.001], ['ft3', 'cubic foot', 0.0283168], ['galUS', 'US gallon', 0.00378541], ['galUK', 'imperial gallon', 0.00454609], ['bbl', 'oil barrel', 0.158987]]],
      flow: ['Volumetric flow', [['m3s', 'm\u00b3/s', 1], ['m3h', 'm\u00b3/h', 1 / 3600], ['Ls', 'L/s', 0.001], ['Lmin', 'L/min', 1 / 60000], ['gpm', 'US gpm', 6.30902e-5], ['MMSCFD', 'MMSCFD (std)', 0.32774], ['cfm', 'ft\u00b3/min', 4.71947e-4]]],
      power: ['Power', [['W', 'watt', 1], ['kW', 'kilowatt', 1000], ['MW', 'megawatt', 1e6], ['hp', 'horsepower', 745.6999], ['Btuh', 'Btu/h', 0.2930711], ['MMBtuh', 'MMBtu/h', 293071.1], ['TR', 'ton refrigeration', 3516.853]]],
      energy: ['Energy', [['J', 'joule', 1], ['kJ', 'kilojoule', 1000], ['MJ', 'megajoule', 1e6], ['kWh', 'kilowatt-hour', 3.6e6], ['cal', 'calorie', 4.184], ['kcal', 'kilocalorie', 4184], ['Btu', 'Btu', 1055.056], ['therm', 'therm', 1.055056e8]]],
      viscosity: ['Dynamic viscosity', [['Pas', 'Pa\u00b7s', 1], ['cP', 'centipoise', 0.001], ['P', 'poise', 0.1], ['lbfts', 'lb/ft\u00b7s', 1.488164]]],
      conductivity: ['Thermal conductivity', [['WmK', 'W/m\u00b7K', 1], ['BtuhftF', 'Btu/h\u00b7ft\u00b7\u00b0F', 1.730735], ['kcalhmC', 'kcal/h\u00b7m\u00b7\u00b0C', 1.163]]],
      htc: ['Heat transfer coefficient', [['Wm2K', 'W/m\u00b2\u00b7K', 1], ['Btuhft2F', 'Btu/h\u00b7ft\u00b2\u00b7\u00b0F', 5.678263], ['kcalhm2C', 'kcal/h\u00b7m\u00b2\u00b7\u00b0C', 1.163]]],
      density: ['Density', [['kgm3', 'kg/m\u00b3', 1], ['gcm3', 'g/cm\u00b3', 1000], ['lbft3', 'lb/ft\u00b3', 16.01846], ['lbgal', 'lb/US gal', 119.8264]]]
    };
    return [
      {
        id: 'cooling',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const E = self.rget(r, 'evaporation e') || 0, Dr = self.rget(r, 'drift d') || 0;
  const B = self.rget(r, 'blowdown b') || 0, Mk = self.rget(r, 'makeup m') || 0;
  const duty = self.rget(r, 'heat duty') || 0, app = self.rget(r, 'approach') || 0, rng = self.rget(r, 'cooling range') || 0;
  const tf = T => 0.3 + 0.6 * self.cl01((T - v.Twb) / 25);
  s.title('Cooling tower', 'range ' + self.f(self.cvt(rng, 'dT')[0], 1) + ' \u00b7 approach ' + self.f(self.cvt(app, 'dT')[0], 1) + ' ' + self.cvt(0, 'dT')[1]);
  const H = Math.max(180, Math.min(s.h - 116, 290));
  const W = Math.min(s.w * 0.42, H * 1.35), X = s.x + s.w * 0.34 - W / 2;
  const top = s.y + 54;
  s.R(X, top, W, H, { stroke: C.ink, lw: 1.8 });
  s.fanSym(X + W / 2, top - 20, 26, { col: C.acc });
  s.L([[X, top], [X + W * 0.3, top - 18]], { col: C.ink, lw: 1.4 });
  s.L([[X + W, top], [X + W * 0.7, top - 18]], { col: C.ink, lw: 1.4 });
  s.L([[X + 4, top + 20], [X + W - 4, top + 20]], { col: C.mut, lw: 1.2, dash: [4, 3] });
  s.T('drift eliminators', X + W / 2, top + 30, { align: 'center', size: 9.5, col: C.mut });
  s.L([[X + 6, top + 44], [X + W - 6, top + 44]], { col: s.temp(tf(v.Thot)), lw: 1.6 });
  for (let i = 0; i < 9; i++) { const px = X + 12 + (W - 24) * i / 8; s.L([[px, top + 44], [px, top + 56]], { col: s.temp(tf(v.Thot)), lw: 1.1, arrow: true, asz: 4 }); }
  const fillTop = top + 62, fillH = H - 100;
  s.R(X + 6, fillTop, W - 12, fillH, { stroke: C.acc, lw: 1, fill: C.soft });
  s.clipR(X + 6, fillTop, W - 12, fillH, () => { for (let q = -fillH; q < W + fillH; q += 9) { s.L([[X + q, fillTop + fillH], [X + q + fillH, fillTop]], { col: 'rgba(89,128,166,0.4)', lw: 0.9 }); } });
  s.T('fill', X + W / 2, fillTop + fillH / 2, { align: 'center', size: 11, col: C.ink, caps: true, bold: true });
  const bas = top + H - 30;
  s.R(X - 10, bas, W + 20, 30, { stroke: C.ink, lw: 1.6 });
  s.R(X - 9, bas + 9, W + 18, 20, { stroke: null, fill: s.temp(tf(v.Tcold), 0.45) });
  s.T('basin', X + W / 2, bas + 19, { align: 'center', size: 10, col: C.ink, caps: true });
  for (let i = 0; i < 4; i++) { s.L([[X - 48, fillTop + fillH * (i + 0.5) / 4], [X - 6, fillTop + fillH * (i + 0.5) / 4]], { col: s.temp(0.3), lw: 1.4, arrow: true, asz: 5 }); s.L([[X + W + 48, fillTop + fillH * (i + 0.5) / 4], [X + W + 6, fillTop + fillH * (i + 0.5) / 4]], { col: s.temp(0.3), lw: 1.4, arrow: true, asz: 5 }); }
  s.T('air in', X - 48, fillTop - 12, { size: 10.5, col: s.temp(0.3) });
  s.L([[s.x + 10, top + 50], [X + 6, top + 50]], { col: s.temp(tf(v.Thot)), lw: 3.2, arrow: true });
  s.T('hot ' + self.f(self.cvt(v.Thot, 'T')[0], 1) + ' ' + self.cvt(0, 'T')[1], s.x + 10, top + 38, { size: 10.5, col: s.temp(tf(v.Thot)) });
  s.L([[X - 10, bas + 20], [s.x + 10, bas + 20]], { col: s.temp(tf(v.Tcold)), lw: 3.2, arrow: true });
  s.T('cold ' + self.f(self.cvt(v.Tcold, 'T')[0], 1) + ' ' + self.cvt(0, 'T')[1], s.x + 10, bas + 36, { size: 10.5, col: s.temp(tf(v.Tcold)) });
  const lw = q => 1.2 + 4 * self.cl01(q / Math.max(Mk, 1e-6));
  s.L([[X + W / 2 + 36, top - 44], [X + W / 2 + 36, top - 62]], { col: C.mid, lw: lw(E), arrow: true });
  s.T('evaporation ' + self.f(self.cvt(E, 'Q')[0], 2), X + W / 2 + 44, top - 56, { size: 10.5, col: C.mid });
  s.L([[X + W / 2 - 36, top - 44], [X + W / 2 - 36, top - 62]], { col: C.lt, lw: lw(Dr), arrow: true });
  s.T('drift', X + W / 2 - 44, top - 56, { size: 10.5, col: C.mid, align: 'right' });
  s.L([[X + W + 10, bas + 20], [X + W + 56, bas + 20]], { col: C.warn, lw: lw(B), arrow: true });
  s.T('blowdown ' + self.f(self.cvt(B, 'Q')[0], 2), X + W + 58, bas + 20, { size: 10.5, col: C.warn });
  s.L([[X + W + 56, bas + 8], [X + W + 12, bas + 8]], { col: C.acc, lw: lw(Mk), arrow: true });
  s.T('makeup ' + self.f(self.cvt(Mk, 'Q')[0], 2), X + W + 58, bas + 8, { size: 10.5, col: C.acc });
  s.badge(s.x, s.y + s.h - 44, 'Duty rejected', self.f(duty, 0) + ' kW', 0.5 + 0.4 * self.cl01(duty / 40000), { w: 138 });
  s.badge(s.x + 148, s.y + s.h - 44, 'Cycles of concentration', self.f(v.coc, 1), null, { w: 160 });
},
        schemNote: 'Water colours are the real supply and return temperatures, and the evaporation, drift, blowdown and makeup lines thicken with their flows. Tighten the cycles of concentration and watch blowdown and makeup swell together.',
        num: 'U-01', sec: S, name: 'Cooling tower water balance',
        blurb: 'Evaporation, drift, blowdown and makeup, all driven by one lever: cycles of concentration. Push cycles up and makeup falls sharply at first, then barely moves \u2014 while the risk of scaling climbs the whole way.',
        howto: 'The steep part of the makeup curve is between two and four cycles; beyond about six the water saving is negligible and you are simply concentrating hardness against the tubes. Notice that evaporation never changes with cycles \u2014 it is set purely by the heat load. Only blowdown responds, which is why cycles are a chemical-treatment decision, not a thermal one.',
        std: 'Cooling Technology Institute ATC-105; Perry\u2019s \u00a712; drift per current CTI/EPA practice (0.001\u20130.005%)',
        eqs: [['E = \\frac{Q}{\\rho\\,h_{fg}}', 'evaporation from the tower duty'], ['C = \\frac{M}{B+D}', 'cycles of concentration'], ['B = \\frac{E}{C-1} - D,\\quad M = E+B+D', 'blowdown and makeup follow from cycles']],
        notes: ['Latent heat taken at the average water temperature.', 'Fraction of duty removed by evaporation is adjustable \u2014 the remainder leaves as sensible heat.', 'Approach = cold water temperature minus ambient wet bulb; below 3 K is not economic.'],
        params: [P('m', 'Circulating water rate', 50, 20000, 25, 2000, 'Q'), P('Thot', 'Hot return temperature', 25, 65, 0.5, 42, 'T'), P('Tcold', 'Cold supply temperature', 15, 50, 0.5, 32, 'T'), P('Twb', 'Ambient wet bulb', 5, 35, 0.5, 27, 'T'), P('coc', 'Cycles of concentration', 1.5, 10, 0.1, 4, null, '\u2014'), P('drift', 'Drift loss', 0, 0.05, 0.001, 0.005, null, '% of circ'), P('fev', 'Duty removed by evaporation', 0.6, 1, 0.01, 1, null, 'fraction')],
        compute: v => {
          const range = v.Thot - v.Tcold, approach = v.Tcold - v.Twb;
          const Tav = (v.Thot + v.Tcold) / 2;
          const lam = 2500.8 - 2.36 * Tav;
          const mdot = v.m * 1000;
          const E = v.fev * mdot * 4.186 * range / lam;
          const D = v.drift / 100 * mdot;
          const B = Math.max(E / (v.coc - 1) - D, 0);
          const M = E + D + B;
          const duty = mdot * 4.186 * range / 3600;
          const mk = c => { const b = Math.max(E / (c - 1) - D, 0); return E + D + b; };
          return {
            E: E, D: D, B: B, M: M, mk: mk,
            res: [{ l: 'Cooling range', v: range, u: '', cv: 'dT', d: 1 }, { l: 'Approach to wet bulb', v: approach, u: '', cv: 'dT', d: 1 }, { l: 'Approach verdict', s: approach < 3 ? 'too tight \u2014 tower will be huge' : approach > 10 ? 'loose \u2014 tower undersized cheaply' : 'typical design range', u: '' }, { l: 'Heat duty rejected', v: duty, u: 'kW', d: 0 }, { l: 'Evaporation E', v: E / 1000, u: '', cv: 'Q', d: 2 }, { l: 'Evaporation as % of circ', v: E / mdot * 100, u: '%', d: 3 }, { l: 'Drift D', v: D / 1000, u: '', cv: 'Q', d: 3 }, { l: 'Blowdown B', v: B / 1000, u: '', cv: 'Q', d: 3 }, { l: 'Makeup M', v: M / 1000, u: '', cv: 'Q', d: 2 }, { l: 'Makeup as % of circ', v: M / mdot * 100, u: '%', d: 3 }, { l: 'Annual makeup', v: M / 1000 * 8760, u: 'm\u00b3/yr', d: 0 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const ymax = r.mk(1.5) / 1000 * 1.05;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1.5, xmax: 10, ymin: 0, ymax: ymax, ml: 78 });
          g.grid('Cycles of concentration', 'Water rate  (' + self.cvt(0, 'Q')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'Q')[0], 1));
          g.title('Water balance vs cycles of concentration');
          g.fn(c => r.mk(c) / 1000, C.dk, 2.8);
          g.fn(c => Math.max(r.E / (c - 1) - r.D, 0) / 1000, C.acc, 2.2, [7, 4]);
          g.line([[1.5, r.E / 1000], [10, r.E / 1000]], C.mut, 1.4, [3, 3]);
          g.txt('evaporation \u2014 fixed by the heat load', 9.8, r.E / 1000 + ymax * 0.03, C.mut, 'right', 11);
          g.line([[v.coc, 0], [v.coc, r.M / 1000]], 'rgba(29,31,32,0.2)', 1.2, [4, 4]);
          g.dot(v.coc, r.M / 1000, C.dk, 5.5);
          g.dot(v.coc, r.B / 1000, C.acc, 4.5);
          g.txt('makeup ' + self.f(self.cvt(r.M / 1000, 'Q')[0], 1) + ' ' + self.cvt(0, 'Q')[1], v.coc, r.M / 1000 + ymax * 0.05, C.ink, 'center', 12);
          g.fill([[1.5, 0], [3, 0], [3, ymax], [1.5, ymax]], 'rgba(29,31,32,0.04)');
          g.legend([{ c: C.dk, l: 'makeup  M' }, { c: C.acc, l: 'blowdown  B', d: [7, 4] }, { c: C.mut, l: 'evaporation  E', d: [3, 3], lw: 1.4 }]);
        }
      },
      {
        id: 'massbal',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const rec = self.rget(r, 'recycle flow') || 0, pur = self.rget(r, 'purge flow') || 0;
  const prod = self.rget(r, 'product rate') || 0, thru = self.rget(r, 'reactor throughput') || v.F;
  const Xo = self.rget(r, 'overall conversion') || 0, yI = self.rget(r, 'inert in recycle') || 0;
  s.title('Recycle loop', 'overall X ' + self.f(Xo, 1) + '% on ' + self.f(v.xpass * 100, 0) + '% per pass');
  const lw = q => 1.4 + 5.2 * self.cl01(q / Math.max(thru, 1e-6));
  const by = s.y + 58, bh = 62;
  const w1 = Math.min(118, s.w * 0.2), gap = Math.min(78, s.w * 0.1);
  const x1 = s.x + 76;
  const rea = s.unit(x1, by, w1, bh, 'REACTOR', { col: C.acc, fill: C.soft, tag: self.f(thru, 0) + ' kmol/h in' });
  const x2 = x1 + w1 + gap;
  const sepu = s.unit(x2, by, w1, bh, 'SEPARATOR', { col: C.ink, size: 10 });
  s.L([[s.x + 10, by + bh / 2], [x1, by + bh / 2]], { col: C.dk, lw: lw(v.F), arrow: true });
  s.T('fresh feed ' + self.f(v.F, 0), s.x + 10, by + bh / 2 - 14, { size: 10.5, col: C.dk });
  s.T('inert ' + self.f(v.yI * 100, 1) + '%', s.x + 10, by + bh / 2 + 15, { size: 10, col: C.mut });
  s.L([[rea.r, by + bh / 2], [x2, by + bh / 2]], { col: C.mid, lw: lw(thru), arrow: true });
  s.L([[sepu.r, by + bh / 2], [s.x + s.w - 90, by + bh / 2]], { col: C.acc, lw: lw(prod), arrow: true });
  s.T('product ' + self.f(prod, 1), s.x + s.w - 88, by + bh / 2 - 14, { size: 10.5, col: C.acc });
  const ry = by + bh + 58;
  s.L([[x2 + w1 * 0.5, by + bh], [x2 + w1 * 0.5, ry], [x1 + w1 * 0.4, ry], [x1 + w1 * 0.4, by + bh]], { col: C.mid, lw: lw(rec), arrow: true });
  s.plate('recycle ' + self.f(rec, 1) + ' kmol/h \u00b7 inert ' + self.f(yI, 1) + '%', (x1 + x2 + w1 * 0.9) / 2, ry, { col: C.mid, size: 10.5 });
  const pvx = x2 + w1 * 0.5 + (s.x + s.w - 60 - x2 - w1 * 0.5) * 0.55;
  s.L([[x2 + w1 * 0.5, ry], [pvx, ry]], { col: C.warn, lw: lw(pur) });
  s.valveSym(pvx, ry, 8, { col: C.warn, act: false });
  s.L([[pvx + 8, ry], [s.x + s.w - 20, ry]], { col: C.warn, lw: lw(pur), arrow: true });
  s.T('purge ' + self.f(pur, 2), s.x + s.w - 20, ry - 14, { size: 10.5, col: C.warn, align: 'right' });
  s.T(self.f(v.alpha * 100, 1) + '% of recycle', s.x + s.w - 20, ry + 15, { size: 10, col: C.mut, align: 'right' });
  s.badge(s.x, s.y + s.h - 44, 'Reactant lost in purge', self.f(self.rget(r, 'reactant loss as') || 0, 2) + '% of feed', 0.5 + 0.44 * self.cl01((self.rget(r, 'reactant loss as') || 0) / 20), { w: 178 });
  s.badge(s.x + 188, s.y + s.h - 44, 'Recycle ratio R/F', self.f(rec / Math.max(v.F, 1e-9), 2), 0.5 + 0.36 * self.cl01(rec / Math.max(v.F, 1e-9) / 12), { w: 162 });
},
        schemNote: 'Line thickness is flow. Shrink the purge and the recycle line fattens as inerts build up; open it and the reactant loss badge reddens \u2014 the whole trade in one picture.',
        num: 'U-02', sec: S, name: 'Recycle & purge mass balance',
        blurb: 'A reactor with an unconverted-reactant recycle and an inert in the feed. The purge is the only way the inert leaves, so the smaller the purge, the higher the inert concentration circulating \u2014 and the bigger every piece of equipment in the loop.',
        howto: 'Both curves are plotted against purge fraction. Inert concentration blows up hyperbolically as purge goes to zero, while overall conversion falls as purge rises \u2014 you are throwing away good reactant with the inert. The economic optimum is where the equipment saving from a smaller recycle stops paying for the reactant lost in the purge, usually a few percent purge.',
        std: 'Steady-state component balances \u2014 Felder & Rousseau Ch. 4; Douglas, Conceptual Design Ch. 5',
        eqs: [['\\text{in} - \\text{out} + \\text{generation} = 0', 'steady-state component balance'], ['y_I = \\frac{Fz_I}{P_{purge}}', 'inert leaves only in the purge'], ['X_{ov} = \\frac{X_{pass}}{1-(1-\\alpha)(1-X_{pass})}', 'recycle multiplies single-pass conversion']],
        notes: ['Separator removes product completely; recycle carries unconverted A and all inert.', 'Purge is a split of the recycle, same composition.', 'Steady state \u2014 no accumulation anywhere in the loop.'],
        params: [P('F', 'Fresh feed rate', 10, 2000, 5, 100, null, 'kmol/h'), P('yI', 'Inert in fresh feed', 0.001, 0.2, 0.001, 0.02, null, 'mol frac'), P('xpass', 'Single-pass conversion', 0.05, 0.95, 0.01, 0.3, null, '\u2014'), P('alpha', 'Purge fraction of recycle', 0.005, 0.5, 0.005, 0.05, null, '\u2014')],
        compute: v => {
          const calc = al => {
            const Fa = v.F * (1 - v.yI), Fi = v.F * v.yI;
            const Xo = v.xpass / (1 - (1 - al) * (1 - v.xpass));
            const Ptot = Fi / al;
            const yIp = Fi / (Fi + Fa * (1 - v.xpass) / v.xpass * al / 1);
            const Rtot = Ptot * (1 - al) / al;
            const Ap = Fa * (1 - v.xpass) / (1 - (1 - al) * (1 - v.xpass));
            const purgeA = Ap * al, recycA = Ap * (1 - al);
            const purgeTot = purgeA + Fi;
            const yI2 = Fi / Math.max(purgeTot, 1e-9);
            const recyc = recycA + Fi * (1 - al) / al;
            return { Xo: Xo, yI: yI2, purge: purgeTot, recyc: recyc, lossA: purgeA, prod: Fa - purgeA };
          };
          const c = calc(v.alpha);
          return {
            calc: calc, c: c,
            res: [{ l: 'Overall conversion', v: c.Xo * 100, u: '%', d: 2 }, { l: 'Single-pass conversion', v: v.xpass * 100, u: '%', d: 1 }, { l: 'Recycle flow', v: c.recyc, u: 'kmol/h', d: 2 }, { l: 'Recycle ratio R/F', v: c.recyc / v.F, u: '\u2014' }, { l: 'Purge flow', v: c.purge, u: 'kmol/h', d: 3 }, { l: 'Inert in recycle / purge', v: c.yI * 100, u: '%', d: 2 }, { l: 'Reactant lost in purge', v: c.lossA, u: 'kmol/h', d: 3 }, { l: 'Reactant loss as % of feed', v: c.lossA / (v.F * (1 - v.yI)) * 100, u: '%', d: 2 }, { l: 'Product rate', v: c.prod, u: 'kmol/h', d: 2 }, { l: 'Reactor throughput', v: v.F + c.recyc, u: 'kmol/h', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          let ymax = 0;
          for (let a = 0.005; a <= 0.5; a += 0.005) ymax = Math.max(ymax, r.calc(a).yI);
          ymax = Math.min(ymax * 1.08, 1);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.005, xmax: 0.5, ymin: 0, ymax: ymax, ml: 68, mr: 72 });
          g.grid('Purge fraction of recycle  \u03b1', 'Inert mole fraction in loop', 5, 5, t => (t * 100).toFixed(0) + '%', t => (t * 100).toFixed(0) + '%');
          g.title('Inert build-up and conversion vs purge');
          g.fn(a => r.calc(a).yI, C.dk, 2.8);
          g.fn(a => r.calc(a).Xo * ymax, C.acc, 2.4, [7, 4]);
          g.line([[v.alpha, 0], [v.alpha, ymax]], 'rgba(29,31,32,0.2)', 1.2, [4, 4]);
          g.dot(v.alpha, r.c.yI, C.dk, 5.5);
          g.dot(v.alpha, r.c.Xo * ymax, C.acc, 5);
          g.txt(( r.c.yI * 100).toFixed(1) + '% inert', v.alpha, r.c.yI + ymax * 0.05, C.ink, 'center', 12);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          for (let p = 0; p <= 1.0001; p += 0.2) { const py = g.Y(p * ymax); ctx.fillText((p * 100).toFixed(0) + '%', g.x + g.w + 10, py); }
          ctx.save(); ctx.translate(g.x + g.w + 52, g.y + g.h / 2); ctx.rotate(Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('OVERALL CONVERSION', 0, 0); ctx.restore();
          ctx.restore();
          g.legend([{ c: C.dk, l: 'inert in loop' }, { c: C.acc, l: 'overall conversion', d: [7, 4] }]);
        }
      },
      {
        id: 'costing', num: 'U-03', sec: S, name: 'Equipment cost & capital estimate',
        blurb: 'Order-of-magnitude capital cost by the six-tenths rule, escalated on CEPCI and factored up to an installed and then a total plant figure. Straight lines on log\u2013log paper \u2014 which is exactly why the exponent matters more than the base price.',
        howto: 'The line is cost against capacity for the selected equipment; its slope is the scaling exponent. Anything below 1 means economy of scale \u2014 doubling capacity costs far less than double, which is the whole argument for single large trains. The marker is your duty. The bare-module and total-plant figures apply Guthrie-style factors, so treat them as a Class 5 estimate: \u221230% to +50% at best.',
        std: 'Turton et al., Analysis Synthesis & Design, 5th ed.; Guthrie module factors; CEPCI escalation',
        eqs: [['C_2 = C_1\\left(\\frac{A_2}{A_1}\\right)^n', 'six-tenths rule, n typically 0.5–0.7'], ['C_{now} = C_{base}\\cdot\\frac{CEPCI_{now}}{CEPCI_{base}}', 'index escalation'], ['C_{BM} = C_p^0F_{BM}F_MF_P', 'bare-module installed cost']],
        notes: ['Base costs are indicative carbon-steel, ambient-pressure purchased costs at CEPCI 800.', 'Lang factor converts total bare-module cost to total plant capital.', 'Class 5 study estimate \u2014 do not use for sanction.'],
        params: [{ k: 'type', label: 'Equipment', type: 'select', val: 'hx', options: Object.keys(EQP).map(k => [k, EQP[k][0]]) }, P('cap', 'Capacity', 0.5, 2000, 0.5, 100, null, 'see note'), P('mat', 'Material factor', 1, 6, 0.1, 1, null, '\u00d7'), P('pres', 'Pressure factor', 1, 4, 0.05, 1, null, '\u00d7'), P('cepci', 'Current CEPCI index', 500, 1200, 1, 800, null, '\u2014'), P('lang', 'Lang factor (total plant)', 2, 6, 0.1, 4.7, null, '\u2014'), P('n', 'Number of units', 1, 20, 1, 1, null, '\u2014')],
        compute: v => {
          const e = EQP[v.type] || EQP.hx;
          const baseCap = e[2] ? 100 : 100;
          const Cbase = e[3], nexp = e[4], fbm = e[5];
          const esc = v.cepci / 800;
          const cost = cap => Cbase * Math.pow(cap / 100, nexp) * esc;
          const Cp = cost(v.cap);
          const Cbm = Cp * fbm * v.mat * v.pres;
          const tot = Cbm * v.n;
          return {
            cost: cost, Cp: Cp, e: e,
            res: [{ l: 'Capacity basis', s: e[1], u: '' }, { l: 'Scaling exponent n', v: nexp, u: '\u2014', d: 2 }, { l: 'Purchased cost (each)', v: Cp, u: 'USD', d: 0 }, { l: 'Bare-module factor', v: fbm, u: '\u2014', d: 2 }, { l: 'Installed cost (each)', v: Cbm, u: 'USD', d: 0 }, { l: 'Number of units', v: v.n, u: '\u2014', d: 0 }, { l: 'Total installed cost', v: tot, u: 'USD', d: 0 }, { l: 'Total plant capital (Lang)', v: Cp * v.n * v.lang * v.mat * v.pres, u: 'USD', d: 0 }, { l: 'Cost per unit capacity', v: Cbm / Math.max(v.cap, 1e-6), u: 'USD per unit', d: 0 }, { l: 'Estimate class', s: 'AACE Class 5  (\u221230% / +50%)', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: 2000, ymin: Math.max(r.cost(1) * 0.6, 100), ymax: r.cost(2000) * 1.6, xlog: true, ylog: true, ml: 82 });
          g.grid('Capacity  (' + r.e[1] + ')', 'Purchased cost  (USD)', 5, 5, null, t => t >= 1e6 ? (t / 1e6) + 'M' : t >= 1000 ? (t / 1000) + 'k' : String(t));
          g.title('Cost\u2013capacity relation \u2014 ' + r.e[0]);
          [0.5, 0.6, 0.7].forEach(nn => {
            if (Math.abs(nn - r.e[4]) < 0.02) return;
            g.fn(cap => r.e[3] * Math.pow(cap / 100, nn) * (v.cepci / 800), 'rgba(29,31,32,0.2)', 1.1, [5, 3]);
          });
          g.fn(cap => r.cost(cap), C.dk, 2.8);
          g.line([[v.cap, r.cost(1) * 0.6], [v.cap, r.Cp]], 'rgba(29,31,32,0.2)', 1.2, [4, 4]);
          g.cross(v.cap, r.Cp, C.dk, 10);
          g.dot(v.cap, r.Cp, C.acc, 5.5);
          g.txt('$' + Math.round(r.Cp).toLocaleString(), v.cap, r.Cp * 1.35, C.ink, 'center', 12.5);
          g.ptxt('n = ' + r.e[4].toFixed(2) + '   source: ' + r.e[6] + '   CEPCI ' + v.cepci, g.x + 12, g.y + g.h - 16, C.mut, 'left', 11.5);
        }
      },
      {
        id: 'units', num: 'U-04', sec: S, name: 'Unit converter',
        blurb: 'The conversions a process engineer reaches for, grouped by quantity, with the whole family shown at once rather than one answer at a time.',
        howto: 'Pick a quantity and a unit, type the value, and read every equivalent off the table. Gauge-to-absolute conversions on the pressure list assume a standard atmosphere of 101.325 kPa.',
        std: 'SI definitions per BIPM SI Brochure 9th ed.; imperial factors per NIST SP 811',
        chart: false,
        eqs: [['value_SI = value \u00d7 factor_from', 'convert into the base unit'], ['value_to = value_SI / factor_to', 'convert out to the target unit']],
        notes: ['All factors are exact where the definition is exact (inch, pound, Btu\u2081\u2085).', 'MMSCFD assumes 15.56 \u00b0C and 101.325 kPa.', 'Gauge pressures offset by one standard atmosphere.'],
        params: [{ k: 'cat', label: 'Quantity', type: 'select', val: 'pressure', options: Object.keys(UNITS).map(k => [k, UNITS[k][0]]) }, P('val', 'Value', -1e6, 1e6, 0.0001, 1, null, 'input'), { k: 'from', label: 'From unit', type: 'select', val: 'bar', options: vv => (UNITS[vv.cat] || UNITS.pressure)[1].map(u => [u[0], u[1]]) }],
        compute: v => {
          const cat = UNITS[v.cat] ? v.cat : 'pressure';
          const list = UNITS[cat][1];
          let from = list.filter(u => u[0] === v.from)[0];
          if (!from) from = list[0];
          let si = v.val * from[2];
          if (from[0] === 'barg') si = (v.val + 1.01325) * 1e5;
          return {
            res: [{ l: 'Quantity', s: UNITS[cat][0], u: '' }, { l: 'Input', s: v.val + ' ' + from[1], u: '' }, { l: 'In SI base unit', v: si, u: list[0][1], d: 6 }],
            table: {
              title: 'All equivalents',
              head: ['Unit', 'Symbol', 'Value', 'Factor to SI'],
              rows: list.map(u => [u[1], u[0], self.f(u[0] === 'barg' ? si / 1e5 - 1.01325 : si / u[2], 6), String(u[2])])
            }
          };
        }
      }
    ];
  }
}




