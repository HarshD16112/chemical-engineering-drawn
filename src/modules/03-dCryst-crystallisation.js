  dCryst() {
    const self = this, C = this.C;
    const S = 'Crystallisation';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const Rg = 8.314;

    /* solubility, g anhydrous solute per 100 g water, fitted c = a + bT + cT² */
    const SOL = {
      kno3: { n: 'Potassium nitrate  KNO\u2083', a: 13.3, b: 0.574, c: 0.0182, M: 101.10, Mh: 101.10, rho: 2110, dHc: 34.9, sh: 'anhydrous', lim: 100 },
      kcl: { n: 'Potassium chloride  KCl', a: 28.0, b: 0.284, c: 0.00047, M: 74.55, Mh: 74.55, rho: 1988, dHc: 17.2, sh: 'anhydrous', lim: 100 },
      nacl: { n: 'Sodium chloride  NaCl', a: 35.6, b: 0.0665, c: 0.00018, M: 58.44, Mh: 58.44, rho: 2165, dHc: 3.9, sh: 'anhydrous', lim: 100 },
      na2so4: { n: 'Sodium sulphate  Na\u2082SO\u2084\u00b710H\u2082O', a: 4.9, b: 0.86, c: 0.038, M: 142.04, Mh: 322.19, rho: 1464, dHc: 78.5, sh: 'decahydrate', lim: 32.4 },
      sucrose: { n: 'Sucrose', a: 179.0, b: 1.62, c: 0.0292, M: 342.30, Mh: 342.30, rho: 1587, dHc: 8.0, sh: 'anhydrous', lim: 100 },
      cuso4: { n: 'Copper sulphate  CuSO\u2084\u00b75H\u2082O', a: 14.3, b: 0.283, c: 0.0102, M: 159.61, Mh: 249.69, rho: 2286, dHc: 47.4, sh: 'pentahydrate', lim: 100 },
      mgso4: { n: 'Magnesium sulphate  MgSO\u2084\u00b77H\u2082O', a: 22.0, b: 0.585, c: 0.0068, M: 120.37, Mh: 246.48, rho: 1680, dHc: 56.0, sh: 'heptahydrate', lim: 48.2 },
      adipic: { n: 'Adipic acid', a: 0.9, b: 0.115, c: 0.0135, M: 146.14, Mh: 146.14, rho: 1360, dHc: 33.5, sh: 'anhydrous', lim: 100 },
      paracetamol: { n: 'Paracetamol (in water)', a: 0.85, b: 0.043, c: 0.0021, M: 151.16, Mh: 151.16, rho: 1293, dHc: 27.1, sh: 'anhydrous', lim: 100 }
    };
    const SOPT = Object.keys(SOL).map(k => [k, SOL[k].n]);
    const cstar = (s, T) => Math.max(s.a + s.b * Math.min(T, s.lim) + s.c * Math.min(T, s.lim) * Math.min(T, s.lim), 0.01);

    /* moments of the MSMPR distribution: n(L) = n0 exp(-L/GT) */
    const msmpr = (n0, G, tau) => {
      const Gt = G * tau;
      const m = k => n0 * Math.pow(Gt, k + 1) * (k === 0 ? 1 : k === 1 ? 1 : k === 2 ? 2 : k === 3 ? 6 : 24);
      return { m0: m(0), m1: m(1), m2: m(2), m3: m(3), Gt: Gt, Ld: 3 * Gt, Lm: 3.67 * Gt };
    };

    return [
      {
        id: 'solub', num: 'Y-01', sec: S, name: 'Solubility, supersaturation & cooling yield',
        blurb: 'Crystallisation begins and ends with one curve. The solubility line says how much solute a solvent will hold at each temperature; everything above it is the driving force, and the vertical distance between the feed point and the discharge point is the yield. Cooling, evaporating and adding an antisolvent are three different ways of crossing the same line.',
        howto: 'Set the feed concentration and the discharge temperature and read the yield. Then watch what evaporation does: removing solvent moves the operating point up and right on the plot, so a little evaporation buys more yield than a lot of cooling for a salt whose solubility barely changes with temperature \u2014 sodium chloride is the standard example, and potassium nitrate the opposite. If the salt crystallises as a hydrate, note how much of the yield is water of crystallisation; the mother liquor concentrates faster than a naive balance predicts.',
        std: 'Mullin, Crystallization, 4th ed., Ch. 3 & 7; Perry\u2019s Chemical Engineers\u2019 Handbook, 9th ed., Sec. 18; Myerson, Handbook of Industrial Crystallization',
        eqs: [['y = \\frac{R\\,W_0(c_0 - c_1(1 - E/W_0))}{1 - c_1(R-1)}', 'yield of hydrated crystals, R = M_h/M'], ['\\sigma = \\frac{c - c^*}{c^*},\\qquad S = \\frac{c}{c^*}', 'relative supersaturation and supersaturation ratio'], ['\\frac{d\\ln c^*}{d(1/T)} = -\\frac{\\Delta H_{cryst}}{R}', 'van\u2019t Hoff \u2014 the slope of the solubility curve'], ['q = y\\,\\Delta H_{cryst} + W_0c_p\\Delta T', 'heat to remove: crystallisation plus sensible']],
        notes: ['Solubility fitted as a quadratic in temperature over the usual working range; the transition temperature of a hydrate is respected as a ceiling.', 'Mother liquor assumed saturated at the discharge temperature \u2014 the ideal case; a real crystalliser leaves 1\u20135 % supersaturation behind.', 'Yield expressed as hydrated crystals, which is what the centrifuge sees.', 'Evaporation taken as water removed, no solute carry-over.'],
        params: [SEL('sys', 'Solute', 'kno3', SOPT), P('W0', 'Feed solvent (water)', 100, 100000, 100, 1000, null, 'kg'), P('c0', 'Feed concentration', 1, 400, 0.5, 60, null, 'g/100 g water'), P('T0', 'Feed temperature', 0, 100, 1, 70, 'T'), P('T1', 'Discharge temperature', -10, 95, 1, 20, 'T'), P('Ev', 'Solvent evaporated', 0, 60, 0.5, 0, null, '% of feed water'), P('cp', 'Solution heat capacity', 1.5, 4.5, 0.05, 3.4, null, 'kJ/kg\u00b7K')],
        compute: v => {
          const s = SOL[v.sys];
          const c0s = cstar(s, v.T0), c1s = cstar(s, v.T1);
          const R = s.Mh / s.M;
          const E = v.W0 * v.Ev / 100;
          const c0 = v.c0 / 100, c1 = c1s / 100;
          /* yield of hydrate from the water balance on the mother liquor */
          const y = R * v.W0 * (c0 - c1 * (1 - E / v.W0)) / Math.max(1 - c1 * (R - 1), 1e-9);
          const yAnh = y / R;
          const S0 = v.c0 / c0s, sigma0 = S0 - 1;
          const Tsatf = self.bis(T => cstar(s, T) - v.c0, -30, Math.min(120, s.lim + 30), 1e-7);
          const mother = v.W0 - E - (y - yAnh);
          const mlSolute = v.W0 * c0 - yAnh;
          const qCryst = Math.max(y, 0) * s.dHc * 1000 / s.Mh;
          const qSens = v.W0 * (1 + c0) * v.cp * (v.T0 - v.T1);
          const magma = Math.max(y, 0) / Math.max(v.W0 - E + v.W0 * c0, 1e-9) * 1000;
          const recov = Math.max(yAnh, 0) / Math.max(v.W0 * c0, 1e-9) * 100;
          const feedSat = v.c0 > c0s;
          return {
            s: s, c0s: c0s, c1s: c1s, Tsatf: Tsatf, y: y,
            res: [{ l: 'Solute', s: s.n, u: '' }, { l: 'Crystallising phase', s: s.sh, u: '' }, { l: 'Hydrate factor M_h/M', v: R, u: '\u2014', d: 4 }, { l: 'Solubility at the feed temperature', v: c0s, u: 'g/100 g', d: 2 }, { l: 'Solubility at discharge', v: c1s, u: 'g/100 g', d: 2 }, { l: 'Saturation temperature of the feed', v: Tsatf, u: '\u00b0C', d: 2 }, { l: 'Feed state', s: feedSat ? 'already supersaturated \u2014 S = ' + S0.toFixed(3) : 'undersaturated by ' + (v.T0 - Tsatf).toFixed(1) + ' K', u: '' }, { l: 'Solvent evaporated', v: E, u: 'kg', d: 2 }, { l: 'Yield of ' + s.sh + ' crystals', v: y, u: 'kg', d: 2 }, { l: 'Yield as anhydrous solute', v: yAnh, u: 'kg', d: 2 }, { l: 'Water of crystallisation removed', v: y - yAnh, u: 'kg', d: 2 }, { l: 'Mother liquor water', v: mother, u: 'kg', d: 2 }, { l: 'Solute left in the liquor', v: mlSolute, u: 'kg', d: 2 }, { l: 'Recovery of the dissolved solute', v: recov, u: '%', d: 2 }, { l: 'Magma density', v: magma, u: 'g/L', d: 1 }, { l: 'Heat of crystallisation released', v: qCryst, u: 'kJ', d: 0 }, { l: 'Sensible heat to remove', v: qSens, u: 'kJ', d: 0 }, { l: 'Total cooling duty', v: qCryst + qSens, u: 'kJ', d: 0 }, { l: 'Verdict', s: y <= 0 ? 'no crystals \u2014 the operating point never crosses the solubility line' : recov > 85 ? 'high recovery; check that the magma is still pumpable' : magma > 350 ? 'magma too dense \u2014 dilute or stage the crystalliser' : 'workable operating point', u: '' }, { l: 'Better lever here', s: (cstar(s, v.T0) - cstar(s, v.T1)) / Math.max(cstar(s, v.T0), 1e-9) < 0.15 ? 'cooling achieves little \u2014 this salt needs evaporative crystallisation' : 'cooling is effective for this salt', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const s = r.s;
          const hi = Math.max(cstar(s, Math.min(95, s.lim)), v.c0) * 1.25;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -10, xmax: 100, ymin: 0, ymax: hi, ml: 70 });
          g.grid('Temperature  \u00b0C', 'Concentration  g / 100 g water');
          g.title('Solubility diagram \u2014 the operating path');
          const sol = []; for (let i = 0; i <= 160; i++) { const T = -10 + 110 * i / 160; sol.push([T, cstar(s, T)]); }
          g.fill(sol.concat([[100, hi], [-10, hi]]), C.soft);
          const msz = []; for (let i = 0; i <= 160; i++) { const T = -10 + 110 * i / 160; msz.push([T, cstar(s, T) * 1.12]); }
          g.line(msz, C.mid, 1.5, [5, 4]);
          g.line(sol, C.dk, 2.8);
          if (s.lim < 95) g.line([[s.lim, 0], [s.lim, hi]], C.warn, 1.3, [3, 3]);
          const cEv = v.c0 / Math.max(1 - v.Ev / 100, 1e-6);
          g.line([[v.T0, v.c0], [v.T0, cEv]], C.acc, 2.4);
          g.line([[v.T0, cEv], [v.T1, Math.max(r.c1s, 0)]], C.acc, 2.8);
          g.dot(v.T0, v.c0, C.acc, 5);
          g.dot(v.T1, r.c1s, C.warn, 5.5);
          if (g.w > 320) {
            g.txt('supersaturated', 92, hi * 0.9, C.mid, 'right', 11.5);
            g.txt('metastable limit', 4, cstar(s, 4) * 1.2, C.mid, 'left', 11);
            g.txt('feed', v.T0, v.c0 - hi * 0.05, C.acc, 'center', 11.5);
            g.txt('discharge', v.T1, r.c1s - hi * 0.05, C.warn, 'center', 11.5);
            if (s.lim < 95) g.txt('hydrate transition', s.lim, hi * 0.06, C.warn, 'center', 11);
          }
          g.legend([{ c: C.dk, l: 'solubility' }, { c: C.mid, l: 'metastable limit', d: [5, 4] }, { c: C.acc, l: 'operating path' }]);
        }
      },
      {
        id: 'mszw', num: 'Y-02', sec: S, name: 'Metastable zone & nucleation kinetics',
        blurb: 'A supersaturated solution does not crystallise the instant it crosses the solubility line. There is a band above it where nothing happens for a while \u2014 the metastable zone \u2014 and the width of that band, together with how fast nuclei appear beyond it, decides whether you get a few large crystals or a fog of fines.',
        howto: 'Slow the cooling rate and watch the metastable zone narrow: nucleation needs both supersaturation and time, so a fast cool overshoots deeper before anything appears and then nucleates catastrophically. That is the whole argument for controlled cooling profiles. Seeding is the other lever \u2014 the seeded curve is drawn for comparison, and it shows why nearly every industrial batch crystalliser is seeded rather than left to find its own nuclei.',
        std: 'N\u00fdvlt (1968) J. Cryst. Growth 3\u20134, 377; Mullin, Crystallization, Ch. 5; Kashchiev & van Rosmalen (2003)',
        eqs: [['J = A\\exp\\!\\left[-\\frac{16\\pi\\gamma^{3}v^{2}}{3k^{3}T^{3}(\\ln S)^{2}}\\right]', 'classical primary nucleation rate'], ['B_0 = k_b\\,\\sigma^{b}M_T^{j}', 'secondary (contact) nucleation \u2014 what industrial crystallisers actually see'], ['\\log \\Delta T_{max} = \\frac{1-m}{m}\\log\\!\\left(\\frac{dc^*}{dT}\\right) + \\frac{1}{m}\\log\\!\\left(\\frac{k_r}{k_n}\\right) + \\frac{1}{m}\\log R_c', 'N\u00fdvlt \u2014 metastable width against cooling rate'], ['L_c^{*} = \\frac{2\\gamma v}{kT\\ln S}', 'critical nucleus size']],
        notes: ['Primary nucleation from classical theory with an interfacial tension you set; the pre-exponential is the conventional 10\u00b3\u2070 per m\u00b3 s.', 'Secondary nucleation uses a power law in relative supersaturation and magma density \u2014 the industrial correlation.', 'N\u00fdvlt exponent m near 2\u20134 for most inorganic salts.', 'The seeded curve assumes seeds large enough that growth alone consumes the supersaturation.'],
        params: [P('T', 'Temperature', 0, 100, 1, 30, 'T'), P('gam', 'Interfacial tension \u03b3', 0.5, 60, 0.5, 8, null, 'mJ/m\u00b2'), P('vm', 'Molecular volume', 20, 400, 5, 55, null, '\u00c5\u00b3'), P('S', 'Supersaturation ratio S', 1.005, 3, 0.005, 1.15, null, '\u2014'), P('kb', 'Secondary nucleation coefficient k_b', 1e5, 1e14, 1e5, 1e9, null, '\u2014'), P('bex', 'Supersaturation exponent b', 0.5, 4, 0.05, 2, null, '\u2014'), P('jex', 'Magma exponent j', 0, 2, 0.05, 1, null, '\u2014'), P('MT', 'Magma density M_T', 5, 600, 5, 200, null, 'g/L'), P('Rc', 'Cooling rate', 0.05, 40, 0.05, 5, null, 'K/h'), P('mex', 'N\u00fdvlt exponent m', 1.2, 6, 0.05, 3, null, '\u2014'), P('kn', 'N\u00fdvlt constant', 0.1, 100, 0.1, 8, null, '\u2014')],
        compute: v => {
          const kB = 1.380649e-23, TK = v.T + 273.15;
          const gam = v.gam / 1000, vm = v.vm * 1e-30;
          const lnS = Math.log(v.S);
          const Jof = S => {
            const l = Math.log(Math.max(S, 1.0000001));
            const ex = 16 * Math.PI * Math.pow(gam, 3) * vm * vm / (3 * Math.pow(kB * TK, 3) * l * l);
            return 1e30 * Math.exp(-ex);
          };
          const J = Jof(v.S);
          const Lcrit = 2 * gam * vm / (kB * TK * Math.max(lnS, 1e-9));
          const sigma = v.S - 1;
          const B0 = v.kb * Math.pow(sigma, v.bex) * Math.pow(v.MT, v.jex);
          const dTmax = Math.pow(v.Rc / Math.max(v.kn, 1e-9), 1 / v.mex);
          /* the supersaturation at which primary nucleation becomes detectable, J = 1 per m³ s */
          const Scrit = self.bis(S => Math.log10(Math.max(Jof(S), 1e-300)) - 0, 1.0001, 20, 1e-9);
          const nMol = Math.PI / 6 * Math.pow(2 * Lcrit, 3) / vm;
          const domin = B0 > J ? 'secondary \u2014 crystal\u2013impeller and crystal\u2013crystal contacts' : 'primary \u2014 spontaneous nucleation from solution';
          return {
            Jof: Jof, J: J, Scrit: Scrit, dTmax: dTmax,
            res: [{ l: 'Supersaturation ratio S', v: v.S, u: '\u2014', d: 4 }, { l: 'Relative supersaturation \u03c3', v: sigma, u: '\u2014', d: 5 }, { l: 'Critical nucleus radius', v: Lcrit * 1e9, u: 'nm', d: 4 }, { l: 'Molecules in a critical nucleus', v: nMol, u: '\u2014', d: 1 }, { l: 'Primary nucleation rate J', v: J, u: 'm\u207b\u00b3s\u207b\u00b9', d: 4 }, { l: 'S for detectable primary nucleation', v: Scrit, u: '\u2014', d: 4 }, { l: 'Metastable width in S', v: Scrit - 1, u: '\u2014', d: 4 }, { l: 'Secondary nucleation rate B\u2080', v: B0, u: 'm\u207b\u00b3s\u207b\u00b9', d: 4 }, { l: 'Dominant mechanism', s: domin, u: '' }, { l: 'B\u2080 / J ratio', v: B0 / Math.max(J, 1e-300), u: '\u2014', d: 3 }, { l: 'N\u00fdvlt metastable width \u0394T_max', v: dTmax, u: 'K', d: 3 }, { l: 'Width at a tenth the cooling rate', v: Math.pow(v.Rc / 10 / Math.max(v.kn, 1e-9), 1 / v.mex), u: 'K', d: 3 }, { l: 'Time spent in the zone', v: dTmax / Math.max(v.Rc, 1e-9) * 60, u: 'min', d: 2 }, { l: 'Operating position', s: v.S > Scrit ? 'beyond the metastable limit \u2014 a nucleation burst is coming' : v.S > 1 + 0.6 * (Scrit - 1) ? 'in the upper metastable zone \u2014 seed now' : 'safely metastable \u2014 growth without new nuclei', u: '' }, { l: 'Product expectation', s: v.S > Scrit ? 'fines and a wide distribution' : sigma < 0.02 ? 'few, large, well-formed crystals but a long batch' : 'controllable growth \u2014 the usual operating window', u: '' }, { l: 'Recommendation', s: v.S > Scrit ? 'slow the cooling to about ' + (v.kn * Math.pow(0.6 * (Scrit - 1) * 20, v.mex)).toPrecision(2) + ' K/h, or seed' : 'hold this supersaturation and let the seeds grow', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: Math.max(2, r.Scrit * 1.45), ymin: 1e-6, ymax: 1e18, ylog: true, ml: 68 });
          g.grid('Supersaturation ratio  S', 'Nucleation rate  m\u207b\u00b3 s\u207b\u00b9');
          g.title('Nucleation rate and the metastable zone');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(r.Scrit) - g.x, g.h); ctx.restore(); });
          g.line([[1, 1], [Math.max(2, r.Scrit * 1.45), 1]], C.lt, 1.3, [6, 4]);
          g.line([[r.Scrit, 1e-6], [r.Scrit, 1e18]], C.warn, 1.6, [5, 4]);
          g.fn(S => { const y = r.Jof(S); return y > 1e-7 ? Math.min(y, 1e18) : NaN; }, C.acc, 2.8, null, 400);
          const B = S => v.kb * Math.pow(Math.max(S - 1, 1e-9), v.bex) * Math.pow(v.MT, v.jex);
          g.fn(S => Math.min(B(S), 1e18), C.dk, 2.4, [7, 4], 300);
          g.dot(v.S, Math.min(Math.max(r.J, 1e-6), 1e18), C.acc, 5);
          g.dot(v.S, Math.min(B(v.S), 1e18), C.dk, 5);
          if (g.w > 320) { g.txt('metastable \u2014 nothing happens yet', 1.02, 3e15, C.mid, 'left', 11.5); g.txt('J = 1', 1.02, 2.5, C.mut, 'left', 11); }
          g.legend([{ c: C.acc, l: 'primary nucleation' }, { c: C.dk, l: 'secondary nucleation', d: [7, 4] }, { c: C.warn, l: 'metastable limit', d: [5, 4] }]);
        }
      },
      {
        id: 'popbal', num: 'Y-03', sec: S, name: 'Population balance \u2014 MSMPR crystal size distribution',
        blurb: 'The population balance is to crystallisation what the mass balance is to everything else. For a mixed-suspension, mixed-product-removal crystalliser at steady state it collapses to something remarkable: the number density falls exponentially with size, and the whole distribution is set by two numbers, the growth rate and the residence time.',
        howto: 'The straight line on the semi-log plot is the signature of an MSMPR crystalliser; its slope is \u22121/G\u03c4 and its intercept is the nucleation density. Real data curve away from it at both ends \u2014 upward at small sizes because of size-dependent growth, downward at large sizes because of breakage and classified removal. The dominant size is exactly 3G\u03c4, which is the most useful design result in the whole subject: to double the product size, double the residence time or the growth rate, and nothing else will do it.',
        std: 'Randolph & Larson, Theory of Particulate Processes, 2nd ed., Ch. 3\u20134; Mullin, Crystallization, Ch. 9; Bransom, Dunning & Millard (1949)',
        eqs: [['\\frac{\\partial n}{\\partial t} + G\\frac{\\partial n}{\\partial L} + \\frac{n}{\\tau} = 0', 'the population balance for an MSMPR crystalliser'], ['n(L) = n^{0}\\exp\\!\\left(-\\frac{L}{G\\tau}\\right)', 'steady-state solution \u2014 a straight line on log n against L'], ['L_{dom} = 3G\\tau,\\qquad L_{50} = 3.67G\\tau', 'dominant and mass-median sizes'], ['M_T = 6k_v\\rho_c n^{0}(G\\tau)^{4}', 'magma density from the third moment'], ['CV = \\frac{\\sigma_{mass}}{L_{50}} = 0.5', 'coefficient of variation \u2014 always 50 % for a true MSMPR']],
        notes: ['Perfectly mixed suspension, no classification, no breakage, size-independent growth \u2014 the four MSMPR assumptions.', 'Volume shape factor k_v = 0.52 for a rounded crystal, \u03c0/6 = 0.524 for a sphere, 1.0 for a cube.', 'Moments computed analytically from the exponential distribution.', 'Nucleation density n\u2070 = B\u2080/G, so the intercept and the slope together give both kinetic rates.'],
        params: [P('G', 'Growth rate G', 0.05, 200, 0.05, 10, null, '\u00b5m/min'), P('tau', 'Residence time \u03c4', 5, 600, 5, 60, null, 'min'), P('B0', 'Nucleation rate B\u2080', 1e4, 1e13, 1e4, 1e9, null, 'm\u207b\u00b3s\u207b\u00b9'), P('kv', 'Volume shape factor k_v', 0.1, 1.2, 0.01, 0.52, null, '\u2014'), P('rhoc', 'Crystal density', 800, 3500, 10, 2110, 'rho'), P('V', 'Crystalliser volume', 0.1, 200, 0.1, 10, 'V'), P('Lmax', 'Plot to size', 100, 5000, 50, 1500, null, '\u00b5m')],
        compute: v => {
          const G = v.G * 1e-6 / 60, tau = v.tau * 60;
          const n0 = v.B0 / G;
          const Gt = G * tau;
          const m = msmpr(n0, G, tau);
          const MT = 6 * v.kv * v.rhoc * n0 * Math.pow(Gt, 4);
          const Ldom = 3 * Gt * 1e6, L50 = 3.67 * Gt * 1e6;
          const prod = MT * v.V / tau * 3600;
          const nTot = m.m0 * v.V;
          const Lbar = m.m1 / m.m0 * 1e6;
          const cum = L => 1 - Math.exp(-L) * (1 + L + L * L / 2 + L * L * L / 6);
          const frac = (a, b2) => cum(b2 / (Gt * 1e6)) - cum(a / (Gt * 1e6));
          const fines = cum(100 / (Gt * 1e6)) * 100;
          const rows = [50, 100, 200, 300, 500, 700, 1000, 1500, 2000].map(L => [
            String(L), (n0 * Math.exp(-L * 1e-6 / Gt) * 1e-12).toPrecision(4), (cum(L / (Gt * 1e6)) * 100).toFixed(3), (Math.exp(-L * 1e-6 / Gt) * 100).toFixed(3)
          ]);
          return {
            n0: n0, Gt: Gt, Ldom: Ldom, L50: L50, MT: MT,
            res: [{ l: 'Growth rate G', v: G * 1e9, u: 'nm/s', d: 3 }, { l: 'Characteristic size G\u03c4', v: Gt * 1e6, u: '\u00b5m', d: 3 }, { l: 'Nucleation density n\u2070', v: n0, u: 'm\u207b\u2074', d: 4 }, { l: 'Dominant size 3G\u03c4', v: Ldom, u: '\u00b5m', d: 2 }, { l: 'Mass-median size 3.67G\u03c4', v: L50, u: '\u00b5m', d: 2 }, { l: 'Number-mean size', v: Lbar, u: '\u00b5m', d: 2 }, { l: 'Coefficient of variation', v: 50, u: '%', d: 0 }, { l: 'Zeroth moment m\u2080', v: m.m0, u: 'm\u207b\u00b3', d: 4 }, { l: 'Total crystal surface', v: 2 * v.kv * m.m2 * 6 / (2 * v.kv) * 0 + 6 * v.kv / 1 * m.m2, u: 'm\u00b2/m\u00b3', d: 2 }, { l: 'Third moment m\u2083', v: m.m3, u: '\u2014', d: 5 }, { l: 'Magma density M_T', v: MT, u: 'kg/m\u00b3', d: 3 }, { l: 'Crystals per m\u00b3 of magma', v: m.m0, u: '\u2014', d: 3 }, { l: 'Production rate', v: prod, u: 'kg/h', d: 2 }, { l: 'Mass below 100 \u00b5m (fines)', v: fines, u: '%', d: 3 }, { l: 'Mass between 200 and 800 \u00b5m', v: frac(200, 800) * 100, u: '%', d: 2 }, { l: 'Product quality', s: Ldom < 100 ? 'far too fine \u2014 filtration and washing will be the bottleneck' : Ldom > 1200 ? 'coarse \u2014 check for occlusion of mother liquor' : 'a good industrial size range', u: '' }, { l: 'Magma check', s: MT > 400 ? 'too dense to circulate \u2014 lower the residence time or dilute' : MT < 30 ? 'dilute magma \u2014 the crystalliser is oversized' : 'workable suspension density', u: '' }, { l: 'To coarsen the product', s: 'double \u03c4 to ' + (v.tau * 2).toFixed(0) + ' min, or raise G by raising supersaturation \u2014 both give ' + (Ldom * 2).toFixed(0) + ' \u00b5m only if the other is held', u: '' }],
            table: { title: 'The distribution, size by size', head: ['L  \u00b5m', 'n(L)  \u00d710\u00b9\u00b2 m\u207b\u2074', 'cumulative mass %', 'number above L  %'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: v.Lmax, ymin: Math.max(r.n0 * 1e-7, 1e2), ymax: r.n0 * 2.2, ylog: true, ml: 70, mb: 18, mt: 32 });
          g.grid('', 'Number density  n(L)  m\u207b\u2074');
          g.title('MSMPR population density \u2014 a straight line by construction');
          g.fn(L => { const y = r.n0 * Math.exp(-L * 1e-6 / r.Gt); return y > Math.max(r.n0 * 1e-7, 1e2) ? y : NaN; }, C.acc, 2.8, null, 300);
          g.dot(0, r.n0, C.warn, 5);
          g.line([[r.Ldom, Math.max(r.n0 * 1e-7, 1e2)], [r.Ldom, r.n0 * 2.2]], C.mid, 1.4, [5, 4]);
          if (g.w > 300) { g.txt('n\u2070 = B\u2080/G', v.Lmax * 0.02, r.n0 * 1.35, C.warn, 'left', 11.5); g.txt('L_dom = 3G\u03c4', r.Ldom, Math.max(r.n0 * 1e-7, 1e2) * 4, C.mid, 'left', 11.5); }
          g.legend([{ c: C.acc, l: 'slope = \u22121/G\u03c4' }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: v.Lmax, ymin: 0, ymax: 105, ml: 70, mt: 12, mb: 46 });
          g2.grid('Crystal size  L  \u00b5m', 'Cumulative mass  %', 5, 4);
          const cum = L => { const x = L * 1e-6 / r.Gt; return (1 - Math.exp(-x) * (1 + x + x * x / 2 + x * x * x / 6)) * 100; };
          g2.line([[0, 50], [v.Lmax, 50]], C.lt, 1.2, [6, 4]);
          g2.fn(cum, C.dk, 2.8, null, 300);
          g2.dot(r.L50, 50, C.warn, 5);
        }
      },
      {
        id: 'crystkin', num: 'Y-04', sec: S, name: 'Growth & nucleation kinetics from CSD data',
        blurb: 'The reverse of the population balance: given a measured size distribution from a running crystalliser, recover the growth and nucleation rates. Because the MSMPR solution is a straight line, the regression is a straight-line fit, and the two kinetic parameters come out of the slope and the intercept. Repeat at several supersaturations and the power-law exponents follow.',
        howto: 'The kinetic order g in the growth law is what tells you the mechanism: g near 1 means diffusion control at the crystal face, g near 2 means surface integration is limiting, and anything above 2.5 usually means the data are contaminated by nucleation. The relative kinetic order b/g is what matters for design \u2014 above about 2 the crystalliser is nucleation-dominated and cannot be made to produce large crystals by raising supersaturation, only by raising residence time.',
        std: 'Randolph & Larson, Ch. 5; Garside & Shah, IECR Proc. Des. Dev. 19 (1980) 509; Mullin, Ch. 6',
        eqs: [['\\ln n = \\ln n^{0} - \\frac{L}{G\\tau}', 'the regression line \u2014 slope and intercept give G and n\u2070'], ['G = k_g\\sigma^{g},\\qquad B_0 = k_b\\sigma^{b}M_T^{j}', 'the two kinetic power laws'], ['B_0 = n^{0}G \\Rightarrow \\frac{B_0}{G} = n^0', 'nucleation and growth are coupled through the intercept'], ['i = \\frac{b}{g}\\ \\text{(relative kinetic order)}', 'the single number that decides crystalliser behaviour']],
        notes: ['Synthetic sieve data generated from the stated true kinetics with log-normal counting scatter, seeded for reproducibility.', 'Regression is ordinary least squares on ln n against L, which is what a laboratory would do.', 'Only the sizes above the fines cut are fitted \u2014 including the fines biases the intercept badly, and the module shows by how much.'],
        params: [P('kg', 'True growth coefficient k_g', 0.5, 500, 0.5, 60, null, '\u00b5m/min'), P('gex', 'True growth order g', 0.5, 3, 0.05, 1.5, null, '\u2014'), P('kb', 'True nucleation coefficient k_b', 1e5, 1e14, 1e5, 5e10, null, '\u2014'), P('bex', 'True nucleation order b', 0.5, 5, 0.05, 2.5, null, '\u2014'), P('sig', 'Relative supersaturation \u03c3', 0.005, 0.5, 0.005, 0.05, null, '\u2014'), P('tau', 'Residence time \u03c4', 5, 400, 5, 60, null, 'min'), P('MT', 'Magma density M_T', 10, 600, 5, 200, null, 'g/L'), P('noise', 'Counting scatter', 0, 40, 0.5, 8, null, '%'), P('cut', 'Fines cut \u2014 fit above', 0, 400, 10, 100, null, '\u00b5m'), P('seed', 'Random seed', 1, 60, 1, 13, null, '\u2014')],
        compute: v => {
          const Gt = v.kg * Math.pow(v.sig, v.gex);
          const G = Gt * 1e-6 / 60, tau = v.tau * 60;
          const B0 = v.kb * Math.pow(v.sig, v.bex) * Math.pow(v.MT, 1);
          const n0 = B0 / G;
          let sd = v.seed * 9301 + 49297;
          const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 - 0.5; };
          const sieve = [45, 63, 90, 125, 180, 250, 355, 500, 710, 1000, 1400];
          const pts = sieve.map(L => {
            const nn = n0 * Math.exp(-L * 1e-6 / (G * tau));
            const fines = L < 120 ? 1 + 2.2 * Math.exp(-L / 60) : 1;
            return { L: L, n: nn * fines * Math.exp(rnd() * v.noise / 50) };
          });
          const fit = arr => {
            const n = arr.length;
            let sx = 0, sy = 0; arr.forEach(p => { sx += p.L; sy += Math.log(p.n); });
            const xb = sx / n, yb = sy / n;
            let sxy = 0, sxx = 0, syy = 0;
            arr.forEach(p => { sxy += (p.L - xb) * (Math.log(p.n) - yb); sxx += Math.pow(p.L - xb, 2); syy += Math.pow(Math.log(p.n) - yb, 2); });
            const sl = sxy / sxx, ic = yb - sl * xb;
            let sse = 0; arr.forEach(p => sse += Math.pow(Math.log(p.n) - (ic + sl * p.L), 2));
            return { sl: sl, ic: ic, r2: 1 - sse / syy, Gt: -1 / sl, n0: Math.exp(ic) };
          };
          const A = fit(pts.filter(p => p.L >= v.cut));
          const B = fit(pts);
          const Gfit = A.Gt * 1e-6 / tau, GfitUm = Gfit * 1e6 * 60;
          const n0fit = A.n0, B0fit = n0fit * Gfit;
          const i = v.bex / v.gex;
          const err = (a, b2) => (a - b2) / b2 * 100;
          const rows = pts.map(p => [String(p.L), (p.n * 1e-12).toPrecision(4), Math.log(p.n).toFixed(4), (A.ic + A.sl * p.L).toFixed(4), (Math.log(p.n) - (A.ic + A.sl * p.L)).toFixed(4), p.L >= v.cut ? 'fitted' : 'excluded']);
          return {
            pts: pts, A: A, B: B, n0: n0,
            res: [{ l: 'True growth rate G', v: Gt, u: '\u00b5m/min', d: 4 }, { l: 'Fitted growth rate G', v: GfitUm, u: '\u00b5m/min', d: 4 }, { l: 'Growth-rate error', v: err(GfitUm, Gt), u: '%', d: 2 }, { l: 'True n\u2070', v: n0, u: 'm\u207b\u2074', d: 4 }, { l: 'Fitted n\u2070', v: n0fit, u: 'm\u207b\u2074', d: 4 }, { l: 'Intercept error', v: err(n0fit, n0), u: '%', d: 2 }, { l: 'True nucleation rate B\u2080', v: B0, u: 'm\u207b\u00b3s\u207b\u00b9', d: 4 }, { l: 'Fitted B\u2080 = n\u2070G', v: B0fit, u: 'm\u207b\u00b3s\u207b\u00b9', d: 4 }, { l: 'Regression R\u00b2 (above the cut)', v: A.r2, u: '\u2014', d: 5 }, { l: 'Regression R\u00b2 (all points)', v: B.r2, u: '\u2014', d: 5 }, { l: 'n\u2070 if the fines are included', v: B.n0, u: 'm\u207b\u2074', d: 4 }, { l: 'Bias from including the fines', v: err(B.n0, n0), u: '%', d: 1 }, { l: 'Dominant size from the fit', v: 3 * A.Gt, u: '\u00b5m', d: 1 }, { l: 'Growth order g', v: v.gex, u: '\u2014', d: 3 }, { l: 'Nucleation order b', v: v.bex, u: '\u2014', d: 3 }, { l: 'Relative kinetic order b/g', v: i, u: '\u2014', d: 3 }, { l: 'Growth mechanism', s: v.gex < 1.2 ? 'diffusion controlled \u2014 agitation will help' : v.gex < 2.2 ? 'surface integration controlled \u2014 agitation will not help' : 'order too high \u2014 suspect nucleation contaminating the data', u: '' }, { l: 'Crystalliser character', s: i > 2 ? 'nucleation dominated \u2014 raising supersaturation makes the product finer, not coarser' : i > 1 ? 'balanced \u2014 supersaturation and residence time both work' : 'growth dominated \u2014 raise supersaturation for a coarser product', u: '' }, { l: 'Data quality', s: A.r2 > 0.99 ? 'clean MSMPR behaviour' : A.r2 > 0.95 ? 'acceptable \u2014 some curvature present' : 'not MSMPR \u2014 check for classification or breakage', u: '' }],
            table: { title: 'Sieve data and the regression residuals', head: ['L  \u00b5m', 'n  \u00d710\u00b9\u00b2 m\u207b\u2074', 'ln n', 'fitted', 'residual', 'status'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          let lo = 1e30, hi = 0; r.pts.forEach(p => { lo = Math.min(lo, p.n); hi = Math.max(hi, p.n); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1500, ymin: lo * 0.3, ymax: Math.max(hi, r.A.n0) * 3, ylog: true, ml: 70 });
          g.grid('Crystal size  L  \u00b5m', 'Population density  n(L)  m\u207b\u2074');
          g.title('Recovering the kinetics from a sieve analysis');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(v.cut) - g.x, g.h); ctx.restore(); });
          g.line([[0, Math.exp(r.B.ic)], [1500, Math.exp(r.B.ic + r.B.sl * 1500)]], C.mid, 1.6, [7, 4]);
          g.line([[0, Math.exp(r.A.ic)], [1500, Math.exp(r.A.ic + r.A.sl * 1500)]], C.acc, 2.6);
          r.pts.forEach(p => g.dot(p.L, p.n, p.L >= v.cut ? C.dk : C.mut, p.L >= v.cut ? 4.6 : 3.4));
          g.cross(0, r.A.n0, C.warn, 8);
          if (g.w > 320) { g.txt('fines excluded', v.cut * 0.5, lo * 0.5, C.mid, 'center', 11); g.txt('n\u2070', 20, r.A.n0 * 1.6, C.warn, 'left', 12); }
          g.legend([{ c: C.acc, l: 'fit above the cut' }, { c: C.mid, l: 'all points \u2014 biased', d: [7, 4] }]);
        }
      },
      {
        id: 'batchcryst', num: 'Y-05', sec: S, name: 'Batch cooling profile & controlled supersaturation',
        blurb: 'A batch crystalliser cooled at a constant rate does the wrong thing: the surface area of the growing seed bed rises through the batch, so a constant cooling rate leaves the early supersaturation far too high and the late supersaturation far too low. The cure is a cooling curve shaped to hold supersaturation constant, and it is dramatically non-linear.',
        howto: 'Compare the two profiles. Natural cooling and linear cooling both spike the supersaturation in the first tenth of the batch \u2014 exactly when the seed area is smallest \u2014 and that spike is where unwanted nuclei come from. The controlled profile barely cools at all at first, then accelerates. The seed loading is the other lever: more seed means more area, which means the same growth rate consumes supersaturation faster and the batch can be cooled quicker.',
        std: 'Mullin & N\u00fdvlt, Chem. Eng. Sci. 26 (1971) 369; Jones & Mullin (1974); Myerson, Handbook of Industrial Crystallization, Ch. 4',
        eqs: [['\\frac{dc}{dt} = -3k_g\\sigma^{g}\\frac{M_s}{\\rho_ck_vL_s^{3}}k_aL_s^{2}\\rho_c', 'desupersaturation by growth on the seed bed'], ['T(t) = T_0 - \\Delta T\\left(\\frac{t}{t_b}\\right)^{3}', 'cubic approximation to the controlled profile'], ['\\frac{L(t)}{L_s} = \\left(1 + \\frac{M_g}{M_s}\\right)^{1/3}', 'seed growth ratio \u2014 the size amplification'], ['A(t) = A_s\\left(\\frac{L}{L_s}\\right)^{2}', 'area grows as the two-thirds power of mass']],
        notes: ['Seeded batch with size-independent growth and no nucleation; the supersaturation trace shows when that assumption fails.', 'Solubility from the same quadratic fits as Y-01.', 'Shape factors: k_v = 0.52 volume, k_a = 3.1 area \u2014 rounded crystals.', 'The cubic profile is the standard industrial approximation to the exact controlled-supersaturation curve.'],
        params: [SEL('sys', 'Solute', 'kno3', SOPT), SEL('mode', 'Cooling policy', 'cubic', [['linear', 'Linear \u2014 constant cooling rate'], ['nat', 'Natural cooling \u2014 exponential'], ['cubic', 'Controlled \u2014 cubic profile']]), P('T0', 'Start temperature', 20, 95, 1, 60, 'T'), P('T1', 'End temperature', -5, 80, 1, 20, 'T'), P('tb', 'Batch time', 0.5, 24, 0.25, 6, null, 'h'), P('W0', 'Solvent charge', 100, 50000, 100, 1000, null, 'kg'), P('seedM', 'Seed loading', 0.05, 10, 0.05, 1, null, '% of expected yield'), P('seedL', 'Seed size', 20, 500, 5, 100, null, '\u00b5m'), P('kg', 'Growth coefficient k_g', 1, 500, 1, 60, null, '\u00b5m/min'), P('gex', 'Growth order g', 0.8, 3, 0.05, 1.5, null, '\u2014'), P('rhoc', 'Crystal density', 800, 3500, 10, 2110, 'rho')],
        compute: v => {
          const s = SOL[v.sys];
          const kv = 0.52, ka = 3.1;
          const c0 = cstar(s, v.T0), c1 = cstar(s, v.T1);
          const yieldExp = v.W0 * (c0 - c1) / 100;
          const Ms = yieldExp * v.seedM / 100;
          const Ls = v.seedL * 1e-6;
          const nSeed = Ms / (kv * v.rhoc * Math.pow(Ls, 3));
          const Tof = t => {
            const f = Math.min(Math.max(t / v.tb, 0), 1);
            if (v.mode === 'linear') return v.T0 - (v.T0 - v.T1) * f;
            if (v.mode === 'nat') return v.T1 + (v.T0 - v.T1) * Math.exp(-3.2 * f);
            return v.T0 - (v.T0 - v.T1) * Math.pow(f, 3);
          };
          const N = 900, dt = v.tb * 3600 / N;
          let c = c0, L = Ls, Mg = 0;
          const tr = [[0, 0, v.T0, Ls * 1e6]];
          let smax = 0, tmax = 0;
          for (let i = 1; i <= N; i++) {
            const t = i * v.tb / N, T = Tof(t);
            const ce = cstar(s, T);
            const sig = Math.max((c - ce) / ce, 0);
            smax = Math.max(smax, sig); if (sig === smax) tmax = t;
            const G = v.kg * Math.pow(sig, v.gex) * 1e-6 / 60;
            const A = nSeed * ka * L * L;
            const dM = 3 * v.rhoc * kv * nSeed * L * L * G * dt;
            Mg += dM;
            L = Math.pow(Math.pow(Ls, 3) + Mg / (nSeed * kv * v.rhoc), 1 / 3);
            c = Math.max(c - dM / v.W0 * 100, ce * 0.999);
            tr.push([t, sig, T, L * 1e6]);
          }
          const Lfinal = L * 1e6, amp = Lfinal / v.seedL;
          const yieldGot = Mg;
          const conv = yieldGot / Math.max(yieldExp, 1e-9) * 100;
          const sigEnd = tr[tr.length - 1][1];
          const nucRisk = smax > 0.12 ? 'high' : smax > 0.05 ? 'moderate' : 'low';
          return {
            tr: tr, smax: smax, s: s,
            res: [{ l: 'Solubility at the start', v: c0, u: 'g/100 g', d: 2 }, { l: 'Solubility at the end', v: c1, u: 'g/100 g', d: 2 }, { l: 'Expected yield', v: yieldExp, u: 'kg', d: 2 }, { l: 'Seed charge', v: Ms, u: 'kg', d: 4 }, { l: 'Number of seeds', v: nSeed, u: '\u2014', d: 4 }, { l: 'Initial seed area', v: nSeed * ka * Ls * Ls, u: 'm\u00b2', d: 3 }, { l: 'Final crystal size', v: Lfinal, u: '\u00b5m', d: 1 }, { l: 'Size amplification', v: amp, u: '\u00d7', d: 3 }, { l: 'Final crystal area', v: nSeed * ka * Math.pow(Lfinal * 1e-6, 2), u: 'm\u00b2', d: 2 }, { l: 'Mass grown onto the seed', v: yieldGot, u: 'kg', d: 2 }, { l: 'Fraction of the yield achieved', v: conv, u: '%', d: 2 }, { l: 'Peak supersaturation \u03c3', v: smax, u: '\u2014', d: 4 }, { l: 'Peak occurs at', v: tmax, u: 'h', d: 3 }, { l: 'Supersaturation left at the end', v: sigEnd, u: '\u2014', d: 5 }, { l: 'Secondary nucleation risk', s: nucRisk + ' \u2014 peak \u03c3 = ' + smax.toFixed(3), u: '' }, { l: 'Cooling policy', s: v.mode === 'cubic' ? 'controlled cubic \u2014 supersaturation held down early' : v.mode === 'linear' ? 'linear \u2014 spikes early, starves late' : 'natural \u2014 the worst case, spikes hardest', u: '' }, { l: 'Recommendation', s: smax > 0.12 ? 'raise the seed loading to about ' + Math.min(v.seedM * 3, 10).toFixed(1) + ' % or lengthen the batch' : conv < 90 ? 'batch is too short \u2014 supersaturation is left unconsumed' : 'a well-balanced batch', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: v.tb, ymin: 0, ymax: Math.max(r.smax * 1.3, 0.05), ml: 70, mb: 18, mt: 32 });
          g.grid('', 'Relative supersaturation  \u03c3');
          g.title('Supersaturation through the batch');
          g.fill([[0, 0.12], [v.tb, 0.12], [v.tb, Math.max(r.smax * 1.3, 0.05)], [0, Math.max(r.smax * 1.3, 0.05)]], C.soft);
          g.line([[0, 0.12], [v.tb, 0.12]], C.warn, 1.4, [5, 4]);
          g.line(r.tr.map(p => [p[0], p[1]]), C.acc, 2.8);
          if (g.w > 300) g.txt('nucleation risk above here', v.tb * 0.97, 0.128, C.warn, 'right', 11);
          g.legend([{ c: C.acc, l: '\u03c3(t)' }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: v.tb, ymin: Math.min(v.T1, v.T0) - 4, ymax: Math.max(v.T0, v.T1) + 4, ml: 70, mt: 12, mb: 46 });
          g2.grid('Time  h', 'Temperature  \u00b0C', 5, 4);
          const mk = mode => { const p = []; for (let i = 0; i <= 120; i++) { const t = v.tb * i / 120, f = t / v.tb; p.push([t, mode === 'linear' ? v.T0 - (v.T0 - v.T1) * f : mode === 'nat' ? v.T1 + (v.T0 - v.T1) * Math.exp(-3.2 * f) : v.T0 - (v.T0 - v.T1) * Math.pow(f, 3)]); } return p; };
          g2.line(mk('linear'), 'rgba(29,31,32,0.18)', 1.4, [4, 3]);
          g2.line(mk('nat'), 'rgba(29,31,32,0.18)', 1.4, [7, 4]);
          g2.line(mk(v.mode), C.dk, 2.8);
          g2.legend([{ c: C.dk, l: 'selected policy' }, { c: 'rgba(29,31,32,0.18)', l: 'the other two' }]);
        }
      },
      {
        id: 'evapcryst', num: 'Y-06', sec: S, name: 'Evaporative & antisolvent crystallisation',
        blurb: 'For a salt whose solubility hardly moves with temperature, cooling is useless and you must remove solvent instead \u2014 or add a second solvent in which the solute will not dissolve. The two routes have opposite economics: evaporation costs energy, antisolvent costs solvent recovery and dilutes the product.',
        howto: 'Sweep the antisolvent ratio and watch the yield rise while the magma dilutes. The crossover is the design question: evaporation concentrates the magma and gives a dense, easily filtered slurry, while antisolvent addition gives a thin slurry and a large downstream distillation. The steam economy figure makes the evaporative case concrete \u2014 a single effect needs about 1.1 kg of steam per kilogram of water removed, and every extra effect roughly divides that.',
        std: 'Perry\u2019s, 9th ed., Sec. 11 & 18; Mullin, Ch. 8; Nagy, Fujiwara & Braatz on antisolvent control (2008)',
        eqs: [['y = \\frac{R\\,W_0(c_0 - c_1(1 - E/W_0))}{1 - c_1(R-1)}', 'evaporative yield \u2014 E is the solvent removed'], ['c^{*}_{mix} = c^{*}_{w}\\exp(-k_{as}\\,x_{as})', 'solubility collapse with antisolvent fraction'], ['\\text{steam economy} = \\frac{\\text{water evaporated}}{\\text{steam used}} \\approx 0.9\\,n_{eff}', 'multiple-effect economy'], ['\\sigma = \\frac{c - c^{*}_{mix}}{c^{*}_{mix}}', 'the driving force either route creates']],
        notes: ['Antisolvent effect modelled as an exponential collapse of solubility with antisolvent mass fraction \u2014 the usual empirical form for an aqueous\u2013organic pair.', 'Evaporation assumed to occur at the boiling point of the solution, with a boiling-point elevation from the dissolved solute.', 'Steam economy 0.9 per effect; latent heat taken at the effect pressure.', 'Mother liquor saturated at the final condition.'],
        params: [SEL('sys', 'Solute', 'nacl', SOPT), P('W0', 'Feed water', 100, 100000, 100, 1000, null, 'kg'), P('c0', 'Feed concentration', 1, 400, 0.5, 30, null, 'g/100 g water'), P('T', 'Operating temperature', 10, 120, 1, 60, 'T'), P('Ev', 'Water evaporated', 0, 80, 0.5, 25, null, '% of feed water'), P('xas', 'Antisolvent added', 0, 80, 0.5, 0, null, '% of feed water'), P('kas', 'Antisolvent potency k_as', 0.5, 12, 0.1, 4, null, '\u2014'), P('neff', 'Number of effects', 1, 6, 1, 3, null, '\u2014'), P('lam', 'Latent heat of the solvent', 1800, 2600, 10, 2260, null, 'kJ/kg')],
        compute: v => {
          const s = SOL[v.sys];
          const R = s.Mh / s.M;
          const cw = cstar(s, v.T);
          const xas = v.xas / 100;
          const cmix = cw * Math.exp(-v.kas * xas / (1 + xas));
          const E = v.W0 * v.Ev / 100;
          const c0 = v.c0 / 100, c1 = cmix / 100;
          const y = R * v.W0 * (c0 - c1 * (1 - E / v.W0)) / Math.max(1 - c1 * (R - 1), 1e-9);
          const yAnh = y / R;
          const recov = Math.max(yAnh, 0) / Math.max(v.W0 * c0, 1e-9) * 100;
          const solvent = v.W0 - E + v.W0 * xas;
          const magma = Math.max(y, 0) / Math.max(solvent + v.W0 * c0 - yAnh, 1e-9) * 1000;
          const steam = E / Math.max(0.9 * v.neff, 0.1);
          const duty = steam * v.lam / 3600;
          const bpe = 0.51 * (v.c0 / (s.M / 1000)) / 1000 * 0;
          const asRecovery = v.W0 * xas;
          const cool = (cstar(s, Math.max(v.T - 40, 0)) - cw) / Math.max(cw, 1e-9) * -100;
          const curve = [];
          for (let i = 0; i <= 120; i++) {
            const x = 0.8 * i / 120;
            const cm = cw * Math.exp(-v.kas * x / (1 + x));
            const yy = R * v.W0 * (c0 - cm / 100 * (1 - E / v.W0)) / Math.max(1 - cm / 100 * (R - 1), 1e-9);
            const sv = v.W0 - E + v.W0 * x;
            curve.push([x * 100, Math.max(yy, 0), Math.max(yy, 0) / Math.max(sv + v.W0 * c0 - yy / R, 1e-9) * 1000, cm]);
          }
          return {
            curve: curve, cw: cw, cmix: cmix, y: y,
            res: [{ l: 'Solute', s: s.n, u: '' }, { l: 'Solubility in water alone', v: cw, u: 'g/100 g', d: 3 }, { l: 'Solubility with antisolvent', v: cmix, u: 'g/100 g', d: 3 }, { l: 'Solubility collapse', v: (1 - cmix / cw) * 100, u: '%', d: 2 }, { l: 'Cooling this salt 40 K would give', v: cool, u: '% solubility change', d: 1 }, { l: 'Route indicated', s: cool < 20 ? 'evaporative or antisolvent \u2014 cooling achieves too little' : 'cooling is viable; compare with Y-01', u: '' }, { l: 'Water evaporated', v: E, u: 'kg', d: 2 }, { l: 'Antisolvent added', v: asRecovery, u: 'kg', d: 2 }, { l: 'Yield of ' + s.sh, v: y, u: 'kg', d: 2 }, { l: 'Yield as anhydrous', v: yAnh, u: 'kg', d: 2 }, { l: 'Recovery', v: recov, u: '%', d: 2 }, { l: 'Magma density', v: magma, u: 'g/L', d: 1 }, { l: 'Steam required', v: steam, u: 'kg', d: 1 }, { l: 'Steam economy', v: E / Math.max(steam, 1e-9), u: 'kg/kg', d: 3 }, { l: 'Evaporator duty', v: duty, u: 'kWh', d: 2 }, { l: 'Antisolvent to recover downstream', v: asRecovery, u: 'kg', d: 1 }, { l: 'Filtration outlook', s: magma > 350 ? 'dense magma \u2014 filters well but may not pump' : magma < 60 ? 'thin slurry \u2014 the filter will be large for the tonnage' : 'good slurry density for a filter or centrifuge', u: '' }, { l: 'Economic comparison', s: v.xas > 5 && asRecovery > E ? 'the antisolvent recovery column will dominate the cost \u2014 favour evaporation' : E > 0 ? 'evaporation with ' + v.neff + ' effect(s) is the cheaper route here' : 'no solvent removed \u2014 nothing crystallises without cooling', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          let ymax = 0; r.curve.forEach(p => ymax = Math.max(ymax, p[1]));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 80, ymin: 0, ymax: Math.max(ymax * 1.15, 1), ml: 72, mb: 18, mt: 32 });
          g.grid('', 'Yield  kg');
          g.title('Antisolvent addition at ' + v.Ev.toFixed(0) + ' % evaporation');
          g.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.8);
          g.dot(v.xas, Math.max(r.y, 0), C.warn, 5.5);
          g.legend([{ c: C.acc, l: 'yield' }]);
          let mmax = 0; r.curve.forEach(p => mmax = Math.max(mmax, p[2]));
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 80, ymin: 0, ymax: Math.max(mmax * 1.15, 50), ml: 72, mt: 12, mb: 46 });
          g2.grid('Antisolvent added  % of feed water', 'Magma density  g/L', 5, 4);
          g2.fill([[0, 350], [80, 350], [80, Math.max(mmax * 1.15, 50)], [0, Math.max(mmax * 1.15, 50)]], C.soft);
          g2.line([[0, 350], [80, 350]], C.warn, 1.3, [5, 4]);
          g2.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2.8);
          if (g2.w > 300) g2.txt('too dense to pump', 78, 366, C.warn, 'right', 11);
        }
      },
      {
        id: 'crystsize', num: 'Y-07', sec: S, name: 'Crystalliser sizing, scale-up & fines destruction',
        blurb: 'Turning kinetics into a vessel. The residence time sets the size, the magma density sets the volume, and the circulation rate has to be enough to keep the largest crystal in suspension without shattering the rest against the impeller. Fines destruction and product classification are the two devices that break the MSMPR straitjacket and let you choose the size distribution.',
        howto: 'Set the product size you want and read back the residence time and volume you need \u2014 that is the design direction. Then turn on fines destruction and watch the dominant size grow: dissolving everything below the cut recycles that mass onto the surviving crystals, which is the only way to get a coarse product out of a fast-nucleating system. The tip speed check is the one that catches scale-up failures: hold it below about 8 m/s or secondary nucleation from impeller contact will undo everything.',
        std: 'Randolph & Larson, Ch. 8\u20139; Mersmann, Crystallization Technology Handbook, 2nd ed., Ch. 5; Bennett, in Perry\u2019s Sec. 18',
        eqs: [['V = \\frac{\\dot m_{prod}\\,\\tau}{M_T}', 'crystalliser volume from production rate and magma density'], ['\\tau = \\frac{L_{dom}}{3G}', 'residence time from the target size'], ['R = 1 + \\frac{\\text{fines dissolved}}{\\text{product}} \\Rightarrow L_{dom}' , 'fines destruction ratio raises the dominant size'], ['u_{tip} = \\pi N D_i \\le 8\\ \\mathrm{m/s}', 'the practical limit on impeller tip speed']],
        notes: ['MSMPR base case, modified by an R-factor for fines destruction and a Z-factor for classified product removal.', 'Zwietering correlation for the just-suspended speed, with a settling velocity from Stokes corrected for the intermediate regime.', 'Power draw from the impeller power number and the magma density.', 'Volumes above 200 m\u00b3 are usually split into two crystallisers in series; the module flags it.'],
        params: [P('prod', 'Production rate', 0.05, 100, 0.05, 5, null, 't/h'), P('Ldom', 'Target dominant size', 100, 3000, 25, 800, null, '\u00b5m'), P('G', 'Growth rate G', 0.5, 100, 0.5, 10, null, '\u00b5m/min'), P('MT', 'Magma density M_T', 50, 600, 5, 250, null, 'g/L'), P('rhoc', 'Crystal density', 800, 3500, 10, 2110, 'rho'), P('rhoL', 'Liquor density', 900, 1600, 10, 1250, 'rho'), P('muL', 'Liquor viscosity', 0.3, 20, 0.1, 1.2, null, 'cP'), P('Rf', 'Fines destruction ratio R', 1, 8, 0.1, 1, null, '\u2014'), P('Lcut', 'Fines cut size', 20, 400, 5, 120, null, '\u00b5m'), P('DiT', 'Impeller / tank diameter', 0.2, 0.6, 0.01, 0.35, null, '\u2014'), P('Np', 'Power number', 0.3, 6, 0.1, 1.3, null, '\u2014')],
        compute: v => {
          const G = v.G * 1e-6 / 60;
          const tauBase = v.Ldom * 1e-6 / (3 * G);
          const tau = tauBase / Math.pow(v.Rf, 1 / 4);
          const mdot = v.prod * 1000 / 3600;
          const V = mdot * tau / v.MT;
          const D = Math.pow(4 * V / Math.PI, 1 / 3);
          const H = D;
          const Di = v.DiT * D;
          const dp = v.Ldom * 1e-6;
          const mu = v.muL / 1000;
          let ut = 9.81 * dp * dp * (v.rhoc - v.rhoL) / (18 * mu);
          for (let i = 0; i < 40; i++) {
            const Re = v.rhoL * ut * dp / mu;
            const Cd = Re < 0.3 ? 24 / Math.max(Re, 1e-6) : Re < 1000 ? 24 / Re * (1 + 0.15 * Math.pow(Re, 0.687)) : 0.44;
            ut = Math.sqrt(4 * 9.81 * dp * (v.rhoc - v.rhoL) / (3 * Cd * v.rhoL));
          }
          const X = v.MT / Math.max(v.rhoL, 1) * 100;
          const nu = mu / v.rhoL;
          const Njs = 0.6 * Math.pow(nu, 0.1) * Math.pow(dp, 0.2) * Math.pow(9.81 * (v.rhoc - v.rhoL) / v.rhoL, 0.45) * Math.pow(X, 0.13) / Math.pow(Di, 0.85);
          const utip = Math.PI * Njs * Di;
          const rhoM = v.rhoL * (1 - v.MT / 1000 / v.rhoc * 0) + v.MT * (1 - v.rhoL / v.rhoc) / 1;
          const Pw = v.Np * rhoM * Math.pow(Njs, 3) * Math.pow(Di, 5);
          const eps = Pw / (V * rhoM);
          const LdomOut = 3 * G * tau * Math.pow(v.Rf, 1 / 4) * 1e6;
          const finesMass = 1 - Math.exp(-v.Lcut * 1e-6 / (G * tau)) * (1 + v.Lcut * 1e-6 / (G * tau) + Math.pow(v.Lcut * 1e-6 / (G * tau), 2) / 2 + Math.pow(v.Lcut * 1e-6 / (G * tau), 3) / 6);
          const rows = [1, 1.5, 2, 3, 4, 6].map(R => {
            const t2 = tauBase / Math.pow(R, 1 / 4);
            const V2 = mdot * t2 / v.MT;
            return [R.toFixed(1), (t2 / 60).toFixed(1), V2.toFixed(2), (3 * G * t2 * Math.pow(R, 1 / 4) * 1e6).toFixed(0), (mdot * 3600 / 1000).toFixed(2)];
          });
          return {
            V: V, tau: tau, Njs: Njs, utip: utip, ut: ut, D: D,
            res: [{ l: 'Required residence time', v: tau / 60, u: 'min', d: 2 }, { l: 'Residence time in hours', v: tau / 3600, u: 'h', d: 3 }, { l: 'Crystalliser volume', v: V, u: 'm\u00b3', d: 3 }, { l: 'Vessel diameter (H = D)', v: D, u: 'm', d: 3 }, { l: 'Impeller diameter', v: Di, u: 'm', d: 3 }, { l: 'Achieved dominant size', v: LdomOut, u: '\u00b5m', d: 1 }, { l: 'Mass median size', v: LdomOut * 3.67 / 3, u: '\u00b5m', d: 1 }, { l: 'Terminal settling velocity', v: ut * 1000, u: 'mm/s', d: 2 }, { l: 'Just-suspended speed N_js', v: Njs * 60, u: 'rpm', d: 1 }, { l: 'Impeller tip speed', v: utip, u: 'm/s', d: 3 }, { l: 'Agitator power', v: Pw / 1000, u: 'kW', d: 3 }, { l: 'Specific power input', v: eps, u: 'W/kg', d: 3 }, { l: 'Fines below the cut', v: finesMass * 100, u: '% of mass', d: 2 }, { l: 'Fines dissolution duty', v: mdot * finesMass * (v.Rf - 1) * 3.6, u: 't/h recycled', d: 3 }, { l: 'Tip-speed check', s: utip > 8 ? 'TOO FAST \u2014 impeller contact will nucleate; use a larger, slower impeller' : utip > 6 ? 'marginal \u2014 acceptable for a robust crystal' : 'safe for crystal integrity', u: '' }, { l: 'Specific power check', s: eps > 1.2 ? 'high \u2014 attrition likely' : eps < 0.15 ? 'too gentle \u2014 settling and fouling' : 'in the normal 0.2\u20131 W/kg band', u: '' }, { l: 'Volume check', s: V > 200 ? 'split into two crystallisers in series' : V < 0.5 ? 'small enough to consider a batch unit instead' : 'a single continuous vessel is appropriate', u: '' }, { l: 'Fines destruction verdict', s: v.Rf > 1.5 ? 'destroying fines has coarsened the product by ' + ((Math.pow(v.Rf, 1 / 4) - 1) * 100).toFixed(0) + ' % at the same volume' : 'no fines destruction \u2014 the product is pure MSMPR', u: '' }],
            table: { title: 'Fines destruction trade-off at fixed production', head: ['R factor', '\u03c4  min', 'V  m\u00b3', 'L_dom  \u00b5m', 'product  t/h'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 2500, ymin: 0.05, ymax: 500, ylog: true, ml: 70 });
          g.grid('Dominant crystal size  \u00b5m', 'Crystalliser volume  m\u00b3');
          g.title('Volume against product size at ' + v.prod.toFixed(2) + ' t/h');
          const G = v.G * 1e-6 / 60, mdot = v.prod * 1000 / 3600;
          [1, 2, 4].forEach(R => {
            const p = [];
            for (let i = 1; i <= 140; i++) {
              const L = 2500 * i / 140;
              const t = L * 1e-6 / (3 * G) / Math.pow(R, 1 / 4);
              const V2 = mdot * t / v.MT;
              if (V2 > 0.05 && V2 < 500) p.push([L, V2]);
            }
            g.line(p, R === Math.round(v.Rf) ? C.acc : 'rgba(29,31,32,0.16)', R === Math.round(v.Rf) ? 2.8 : 1.4, R === Math.round(v.Rf) ? null : [6, 3]);
          });
          const pMain = [];
          for (let i = 1; i <= 140; i++) { const L = 2500 * i / 140; const t = L * 1e-6 / (3 * G) / Math.pow(v.Rf, 1 / 4); const V2 = mdot * t / v.MT; if (V2 > 0.05 && V2 < 500) pMain.push([L, V2]); }
          g.line(pMain, C.acc, 2.8);
          g.line([[0, 200], [2500, 200]], C.warn, 1.3, [5, 4]);
          g.dot(v.Ldom, Math.min(Math.max(r.V, 0.05), 500), C.warn, 5.5);
          if (g.w > 320) { g.txt('split into two vessels above here', 2450, 235, C.warn, 'right', 11); g.txt('R = 1, 2, 4', 60, 0.09, C.mid, 'left', 11.5); }
          g.legend([{ c: C.acc, l: 'R = ' + v.Rf.toFixed(1) }, { c: 'rgba(29,31,32,0.16)', l: 'other fines-destruction ratios', d: [6, 3] }]);
        }
      }
    ];
  }

  /* ══ COMPOUNDS & PROPERTIES ═══════════════════════════════ */
