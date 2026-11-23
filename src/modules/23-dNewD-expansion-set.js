  dNewD() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const TP = 'Thermophysical Data';
    const COMM = {
      crude: ['Crude oil', 613.9723, 0],
      gasoline: ['Gasoline & light products', 346.4228, 0.4388],
      jet: ['Jet fuel, kerosene, diesel', 594.5418, 0],
      fuel: ['Fuel oil & residue', 186.9696, 0.4862],
      lube: ['Lubricating oil', 0, 0.6278]
    };
    const BANDS = [[4, 12, 'Bitumen / residue'], [12, 22, 'Heavy crude & fuel oil'], [22, 31, 'Medium crude'], [31, 40, 'Light crude & diesel'], [40, 50, 'Kerosene / jet'], [50, 70, 'Gasoline & naphtha']];
    const rho15 = api => 999.016 * 141.5 / (131.5 + api);
    return [
      {
        id: 'apigrav', num: 'T-04', sec: TP, name: 'Degree API gravity & petroleum liquid properties',
        blurb: 'The oil industry measures density backwards: a bigger number means a lighter liquid, and the whole scale is anchored to water at 60 \u00b0F. Every custody transfer, every barrel-to-tonne conversion and every crude price differential runs through this one number \u2014 and through the volume correction that puts a warm tank back on the standard basis.',
        howto: 'Left is the API scale itself, with the product bands drawn on it \u2014 note how compressed the heavy end is, so a degree of API means far more to a residue than to a naphtha. Right is what temperature does: volume grows about 0.07% per \u00b0C for a light product, which is why a tanker measured hot and sold cold is an argument waiting to happen.',
        std: 'API MPMS Ch. 11.1 / ASTM D1250 volume correction; ASTM D287 & D1298 gravity; UOP 375 characterisation factor',
        eqs: [['\\gamma_{60} = \\frac{141.5}{131.5 + {}^{\\circ}API},\\qquad {}^{\\circ}API = \\frac{141.5}{\\gamma_{60}} - 131.5', 'the API scale and its inverse'], ['\\rho_{15} = 999.016\\,\\gamma_{60}', 'density at the standard reference temperature'], ['\\alpha_{60} = \\frac{K_0 + K_1\\rho_{15}}{\\rho_{15}^2},\\qquad VCF = e^{-\\alpha_{60}\\Delta T\\left(1 + 0.8\\alpha_{60}\\Delta T\\right)}', 'thermal expansion coefficient and the volume correction factor'], ['K_{UOP} = \\frac{\\sqrt[3]{T_B}}{\\gamma_{60}}', 'Watson characterisation factor — T_B is the mean average boiling point in °R'], ['HHV = 17887 + 57.5\\,{}^{\\circ}API - 102.2\\,S', 'gross heating value in Btu/lb, with sulphur S in wt %']],
        notes: ['\u00b0API is defined at 60 \u00b0F; the metric expansion tables are based at 15 \u00b0C \u2014 the 0.56 K offset is neglected here, worth about 0.4 kg/m\u00b3.', 'Volume correction is the 1980 API table set; pressure correction (CPL) is not applied.', 'Heating value correlation is for petroleum fuels, not for oxygenates or biodiesel.'],
        params: [{ k: 'com', label: 'Commodity group', type: 'select', val: 'crude', options: Object.keys(COMM).map(k => [k, COMM[k][0]]) }, P('api', 'Gravity', 4, 75, 0.1, 34, null, '\u00b0API'), P('T', 'Observed temperature', -10, 120, 0.5, 30, 'T'), P('S', 'Sulphur content', 0, 5, 0.01, 1.2, null, 'wt %'), P('Tb', 'Mean average boiling point', 50, 550, 5, 260, 'T'), P('vol', 'Observed volume', 1, 20000, 1, 1000, null, 'm\u00b3')],
        compute: v => {
          const cm = COMM[v.com] || COMM.crude, K0 = cm[1], K1 = cm[2];
          const sg = 141.5 / (131.5 + v.api), r15 = rho15(v.api);
          const a60 = (K0 + K1 * r15) / (r15 * r15);
          const vcfOf = T => { const dT = T - 15; return Math.exp(-a60 * dT * (1 + 0.8 * a60 * dT)); };
          const rhoOf = T => r15 * vcfOf(T);
          const vcf = vcfOf(v.T), rhoT = rhoOf(v.T);
          const apiT = 141.5 / (rhoT / 999.016) - 131.5;
          const Vstd = v.vol * vcf;
          const mass = Vstd * r15 / 1000;
          const K = Math.pow(1.8 * (v.Tb + 273.15), 1 / 3) / sg;
          const hhv = 17887 + 57.5 * v.api - 102.2 * v.S;
          const band = BANDS.filter(b => v.api >= b[0] && v.api < b[1])[0];
          return {
            rhoOf: rhoOf, vcfOf: vcfOf, r15: r15, vcf: vcf, rhoT: rhoT,
            res: [{ l: 'Specific gravity 60/60 \u00b0F', v: sg, u: '\u2014', d: 4 }, { l: 'Density at 15 \u00b0C', v: r15, u: '', cv: 'rho', d: 2 }, { l: 'Density at observed T', v: rhoT, u: '', cv: 'rho', d: 2 }, { l: 'Apparent gravity at observed T', v: apiT, u: '\u00b0API', d: 2 }, { l: 'Product band', s: band ? band[2] : v.api >= 70 ? 'Condensate / LPG range' : 'Extra-heavy / bitumen', u: '' }, { l: 'Expansion coefficient \u03b1\u2086\u2080', v: a60 * 1e6, u: '\u00d710\u207b\u2076 /\u00b0C', d: 1 }, { l: 'Volume correction factor', v: vcf, u: '\u2014', d: 5 }, { l: 'Volume at 15 \u00b0C', v: Vstd, u: '', cv: 'V', d: 2 }, { l: 'Shrinkage from observed', v: (1 - vcf) * 100, u: '%', d: 3 }, { l: 'Mass of the parcel', v: mass, u: 't', d: 3 }, { l: 'Barrels per tonne', v: 6.28981 / sg, u: 'bbl/t', d: 3 }, { l: 'Tonnes per 1000 barrels', v: 1000 * sg / 6.28981, u: 't', d: 2 }, { l: 'Watson factor K_UOP', v: K, u: '\u2014', d: 3 }, { l: 'Character from K', s: K > 12.5 ? 'paraffinic' : K > 11.5 ? 'intermediate / mixed base' : K > 10.5 ? 'naphthenic' : 'aromatic', u: '' }, { l: 'Gross heating value', v: hhv, u: 'Btu/lb', d: 0 }, { l: 'Gross heating value', v: hhv * 0.0023244, u: 'MJ/kg', d: 3 }, { l: 'Energy in the parcel', v: mass * hhv * 0.0023244 / 1000, u: 'GJ \u00d7 10\u00b3', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const w2 = b.w / 2 - 12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: w2, h: b.h, xmin: 4, xmax: 75, ymin: 650, ymax: 1060, ml: 62 });
          g.grid('Gravity  (\u00b0API)', 'Density at 15 \u00b0C  (' + self.cvt(0, 'rho')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'rho')[0], 0));
          g.title('The API scale');
          BANDS.forEach((bd, k) => {
            if (k % 2 === 0) g.fill([[bd[0], 650], [bd[1], 650], [bd[1], 1060], [bd[0], 1060]], C.soft);
            g.txt(bd[2], (bd[0] + bd[1]) / 2, 1052, C.mid, 'right', 11, 'middle', -Math.PI / 2);
          });
          g.line([[4, 999.016], [75, 999.016]], C.mut, 1.2, [3, 3]);
          g.txt('water', 74, 1004, C.mut, 'right', 10.5, 'bottom');
          g.fn(a => rho15(a), C.dk, 2.8);
          g.line([[v.api, 650], [v.api, r.r15]], C.mut, 1.3, [4, 4]);
          g.dot(v.api, r.r15, C.acc, 5.5);
          g.txt(self.f(v.api, 1) + '\u00b0API', v.api, r.r15 + 16, C.ink, 'center', 12);
          const tmin = -10, tmax = 120;
          const g2 = self.mkG(ctx, { x: b.x + b.w / 2 + 12, y: b.y, w: w2, h: b.h, xmin: tmin, xmax: tmax, ymin: r.rhoOf(tmax) * 0.995, ymax: r.rhoOf(tmin) * 1.005, ml: 66 });
          g2.grid('Temperature  (' + self.cvt(0, 'T')[1] + ')', 'Density  (' + self.cvt(0, 'rho')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'T')[0], 0), t => self.f(self.cvt(t, 'rho')[0], 0));
          g2.title('Volume correction with temperature');
          g2.fn(T => r.rhoOf(T), C.dk, 2.8);
          g2.line([[15, r.rhoOf(tmax) * 0.995], [15, r.r15]], C.mid, 1.3, [4, 4]);
          g2.txt('standard 15 \u00b0C', 15.8, r.rhoOf(tmax) * 0.998, C.mid, 'left', 10.5);
          g2.dot(v.T, r.rhoT, C.acc, 5.5);
          g2.txt('VCF = ' + self.f(r.vcf, 5), v.T, r.rhoT + (r.rhoOf(tmin) - r.rhoOf(tmax)) * 0.05, C.ink, 'center', 12);
          g2.legend([{ c: C.dk, l: 'density' }, { c: C.mid, l: 'standard basis', d: [4, 4] }]);
        }
      },
      {
        id: 'blend', num: 'T-05', sec: TP, name: 'Fuel & residue blending properties',
        blurb: 'Almost nothing about a blend is the average of its parts. Density blends on volume, sulphur on mass, and viscosity on neither \u2014 it collapses along a double-logarithmic index, which is why a small splash of cutter stock does most of the work and the last few percent buy almost nothing.',
        howto: 'The curve is the real blend viscosity by the Refutas index; the straight line is what simple averaging would predict. The gap between them is the whole reason blending is done on indices. Slide the cutter fraction to the spec line and read the answer off the x-axis \u2014 then notice how flat the curve has already gone.',
        std: 'Refutas viscosity blending index (Maples, Petroleum Refinery Process Economics); API 14E flash-point index; ISO 8217 marine fuel grades',
        eqs: [['VBI_i = 14.534\\ln\\left[\\ln(\\nu_i + 0.8)\\right] + 10.975', 'Refutas viscosity blending index for each component'], ['VBI_{mix} = \\sum_i w_iVBI_i', 'the indices blend on mass fraction'], ['\\nu_{mix} = \\exp\\left[\\exp\\left(\\frac{VBI_{mix} - 10.975}{14.534}\\right)\\right] - 0.8', 'inverted back to centistokes'], ['\\rho_{mix} = \\sum_i v_i\\rho_i,\\qquad S_{mix} = \\sum_i w_iS_i', 'density blends on volume, sulphur on mass'], ['\\log_{10}BI_i = \\frac{2414}{T_{f,i} + 230.556} - 6.1188', 'flash point converted to its own blending index'], ['T_{f,mix} = \\frac{2414}{\\log_{10}BI_{mix} + 6.1188} - 230.556', 'indices blended on volume, then inverted back to a temperature']],
        notes: ['Two-component blend; the same index arithmetic extends to any number of streams.', 'Refutas is quoted at a single reference temperature \u2014 both viscosities must be at the same one.', 'Blends of incompatible streams can drop asphaltenes; no stability check is implied here.'],
        params: [P('vB', 'Cutter stock in blend', 0, 100, 0.5, 20, null, 'vol %'), P('apiA', 'Base stock gravity', 2, 40, 0.1, 11, null, '\u00b0API'), P('nuA', 'Base stock viscosity at 50 \u00b0C', 20, 20000, 10, 4000, null, 'cSt'), P('sA', 'Base stock sulphur', 0, 5, 0.01, 3.2, null, 'wt %'), P('fA', 'Base stock flash point', 60, 250, 1, 120, 'T'), P('apiB', 'Cutter gravity', 20, 70, 0.1, 38, null, '\u00b0API'), P('nuB', 'Cutter viscosity at 50 \u00b0C', 0.5, 200, 0.5, 3, null, 'cSt'), P('sB', 'Cutter sulphur', 0, 2, 0.005, 0.1, null, 'wt %'), P('fB', 'Cutter flash point', 40, 200, 1, 70, 'T'), P('spec', 'Viscosity specification', 10, 700, 5, 380, null, 'cSt')],
        compute: v => {
          const rA = rho15(v.apiA), rB = rho15(v.apiB);
          const VBI = nu => 14.534 * Math.log(Math.log(Math.max(nu, 0.3) + 0.8)) + 10.975;
          const unVBI = x => Math.exp(Math.exp((x - 10.975) / 14.534)) - 0.8;
          const BI = Tf => Math.pow(10, 2414 / (Tf + 230.556) - 6.1188);
          const mix = fB => {
            const vb = fB / 100, va = 1 - vb;
            const rho = va * rA + vb * rB;
            const wb = vb * rB / rho, wa = 1 - wb;
            const nu = unVBI(wa * VBI(v.nuA) + wb * VBI(v.nuB));
            const s = wa * v.sA + wb * v.sB;
            const bi = va * BI(v.fA) + vb * BI(v.fB);
            const tf = 2414 / (Math.log10(bi) + 6.1188) - 230.556;
            const api = 141.5 / (rho / 999.016) - 131.5;
            const hhv = wa * (17887 + 57.5 * v.apiA - 102.2 * v.sA) + wb * (17887 + 57.5 * v.apiB - 102.2 * v.sB);
            return { rho: rho, api: api, nu: nu, s: s, tf: tf, wa: wa, wb: wb, hhv: hhv };
          };
          const lin = fB => (1 - fB / 100) * v.nuA + (fB / 100) * v.nuB;
          const m = mix(v.vB);
          let need = NaN;
          if ((mix(0).nu - v.spec) * (mix(100).nu - v.spec) < 0) need = self.bis(f => mix(f).nu - v.spec, 0, 100, 1e-6);
          return {
            mix: mix, lin: lin, m: m, need: need,
            res: [{ l: 'Blend density at 15 \u00b0C', v: m.rho, u: '', cv: 'rho', d: 2 }, { l: 'Blend gravity', v: m.api, u: '\u00b0API', d: 2 }, { l: 'Blend viscosity at 50 \u00b0C', v: m.nu, u: 'cSt', d: 2 }, { l: 'Linear-average viscosity (wrong)', v: lin(v.vB), u: 'cSt', d: 1 }, { l: 'Error if blended linearly', v: (lin(v.vB) / Math.max(m.nu, 1e-9) - 1) * 100, u: '%', d: 0 }, { l: 'Blend sulphur', v: m.s, u: 'wt %', d: 4 }, { l: 'Blend flash point', v: m.tf, u: '', cv: 'T', d: 1 }, { l: 'Flash verdict', s: m.tf < 60 ? 'below the 60 \u00b0C marine minimum' : 'meets the 60 \u00b0C minimum', u: '' }, { l: 'Mass fraction base stock', v: m.wa, u: '\u2014', d: 4 }, { l: 'Mass fraction cutter', v: m.wb, u: '\u2014', d: 4 }, { l: 'Gross heating value', v: m.hhv * 0.0023244, u: 'MJ/kg', d: 3 }, { l: 'Cutter needed for the spec', v: need, u: 'vol %', d: 2 }, { l: 'Grade at this viscosity', s: m.nu <= 30 ? 'distillate range (DMA/DMB)' : m.nu <= 80 ? 'RMD 80' : m.nu <= 180 ? 'RME 180' : m.nu <= 380 ? 'RMG 380' : m.nu <= 700 ? 'RMK 700' : 'above ISO 8217 grades', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const ylo = Math.max(Math.min(r.mix(100).nu, v.spec) * 0.5, 0.4), yhi = Math.max(r.mix(0).nu, v.spec) * 1.6;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 100, ymin: ylo, ymax: yhi, ylog: true, ml: 72 });
          g.grid('Cutter stock in the blend  (vol %)', 'Blend viscosity at 50 \u00b0C  (cSt)', 5, 4);
          g.title('Viscosity does not average');
          g.line([[0, v.spec], [100, v.spec]], C.warn, 1.6, [5, 4]);
          g.txt('specification  ' + self.f(v.spec, 0) + ' cSt', 99, v.spec * 1.1, C.warn, 'right', 11, 'bottom');
          g.fn(f => r.lin(f), C.lt, 2, [6, 4]);
          g.fn(f => r.mix(f).nu, C.dk, 2.8);
          if (isFinite(r.need)) {
            g.line([[r.need, ylo], [r.need, v.spec]], C.mid, 1.3, [4, 4]);
            g.dot(r.need, v.spec, C.mid, 5);
            g.txt(self.f(r.need, 1) + '% on spec', r.need, v.spec * 0.78, C.mid, 'center', 11.5);
          }
          g.dot(v.vB, r.m.nu, C.acc, 5.5);
          g.txt(self.f(r.m.nu, 1) + ' cSt', v.vB, r.m.nu * 1.18, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'Refutas index blend' }, { c: C.lt, l: 'linear average', d: [6, 4] }, { c: C.warn, l: 'spec', d: [5, 4] }]);
        }
      }
    ];
  }
