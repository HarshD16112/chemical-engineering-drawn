  dEquip() {
    const self = this, C = this.C;
    const S = 'Process Equipment Design';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const g0 = 9.80665;

    /* TEMA tube-count constants: K1, n1 per layout and pass count (Sinnott) */
    const TC = {
      '30_1': [0.319, 2.142], '30_2': [0.249, 2.207], '30_4': [0.175, 2.285], '30_6': [0.0743, 2.499],
      '45_1': [0.215, 2.207], '45_2': [0.156, 2.291], '45_4': [0.158, 2.263], '45_6': [0.0402, 2.617],
      '90_1': [0.215, 2.207], '90_2': [0.156, 2.291], '90_4': [0.158, 2.263], '90_6': [0.0402, 2.617]
    };
    const PACK = {
      pall50: { n: 'Pall ring 50 mm, metal', Fp: 27, a: 112, e: 0.951, HETP: 0.55 },
      pall25: { n: 'Pall ring 25 mm, metal', Fp: 56, a: 205, e: 0.940, HETP: 0.40 },
      imtp40: { n: 'IMTP 40 mm, metal', Fp: 24, a: 151, e: 0.970, HETP: 0.50 },
      rasch50: { n: 'Raschig ring 50 mm, ceramic', Fp: 65, a: 95, e: 0.740, HETP: 0.90 },
      mellap250: { n: 'Structured 250 m\u00b2/m\u00b3', Fp: 20, a: 250, e: 0.980, HETP: 0.45 },
      mellap500: { n: 'Structured 500 m\u00b2/m\u00b3', Fp: 34, a: 500, e: 0.975, HETP: 0.28 },
      berl25: { n: 'Berl saddle 25 mm, ceramic', Fp: 110, a: 250, e: 0.690, HETP: 0.75 }
    };
    const POPT = Object.keys(PACK).map(k => [k, PACK[k].n]);

    return [
      {
        id: 'stlayout', num: 'G-01', sec: S, name: 'Shell-and-tube mechanical layout',
        blurb: 'An exchanger area is a number; a bundle is a drawing. Turning one into the other means choosing a tube diameter, a length, a pitch and a layout angle, then finding how many tubes actually fit inside a standard shell \u2014 and the answer changes the shell-side velocity, the pressure drop and the price.',
        howto: 'Start from the area you need and watch the shell diameter respond to tube length: a long, thin bundle is always cheaper in steel but costs plot space and pulls harder on the tube-side pressure drop. Then change the layout angle. Triangular pitch packs about 15 % more tubes into the same shell, which is why it is the default \u2014 but it cannot be mechanically cleaned, so any fouling service on the shell side needs the square layout and a bigger shell. The baffle spacing at the bottom is the shell-side designer\u2019s main handle: closer baffles buy heat transfer at the third power of pressure drop.',
        std: 'TEMA 10th ed.; Sinnott & Towler, Chemical Engineering Design, 6th ed., Ch. 19; Kern, Process Heat Transfer, Ch. 7',
        eqs: [['N_t = K_1\\left(\\frac{D_b}{d_o}\\right)^{n_1}', 'bundle diameter from the tube count \u2014 TEMA constants'], ['A = \\pi d_oL N_t', 'the area a bundle actually provides'], ['D_e = \\frac{1.10}{d_o}\\left(p_t^{2} - 0.917d_o^{2}\\right)\\ \\text{(triangular)}', 'shell-side equivalent diameter'], ['A_s = \\frac{(p_t - d_o)D_sl_B}{p_t}', 'shell-side crossflow area from the baffle spacing']],
        notes: ['Bundle-to-shell clearance from the TEMA head type; a pull-through floating head needs the most.',
          'Standard tube sizes and BWG wall thicknesses; the pressure rating is checked against the tube wall, not just the shell.',
          'Tube-side velocity checked against the usual 1\u20132.5 m/s window for water; erosion above 3 m/s.',
          'Sealing strips and pass-partition lanes are not deducted \u2014 add 3\u20135 % to the shell-side bypass allowance.'],
        params: [PF('A', 'Heat transfer area required', 2, 3000, 1, 200, 'A'), SEL('do', 'Tube outside diameter', '19.05', [['15.88', '\u215d in  15.88 mm'], ['19.05', '\u00be in  19.05 mm'], ['25.4', '1 in  25.4 mm'], ['31.75', '1\u00bc in  31.75 mm'], ['38.1', '1\u00bd in  38.1 mm']]), SEL('bwg', 'Tube wall (BWG)', '14', [['18', 'BWG 18  1.24 mm'], ['16', 'BWG 16  1.65 mm'], ['14', 'BWG 14  2.11 mm'], ['12', 'BWG 12  2.77 mm'], ['10', 'BWG 10  3.40 mm']]), P('L', 'Tube length', 1.2, 12, 0.1, 4.88, 'L'), SEL('lay', 'Layout angle', '30', [['30', '30\u00b0 triangular \u2014 most compact'], ['45', '45\u00b0 rotated square'], ['90', '90\u00b0 square \u2014 mechanically cleanable']]), P('ptr', 'Pitch / diameter ratio', 1.2, 1.6, 0.01, 1.25, null, '\u2014'), SEL('np', 'Tube-side passes', '2', [['1', '1 pass'], ['2', '2 passes'], ['4', '4 passes'], ['6', '6 passes']]), SEL('head', 'Head type', 'split', [['fixed', 'Fixed tubesheet'], ['utube', 'U-tube'], ['split', 'Split-ring floating head'], ['pull', 'Pull-through floating head']]), P('lB', 'Baffle spacing / shell diameter', 0.2, 1, 0.01, 0.4, null, '\u2014'), P('cut', 'Baffle cut', 15, 45, 1, 25, null, '%'), P('Qt', 'Tube-side flow', 1, 5000, 1, 150, 'Q'), P('rhot', 'Tube-side density', 400, 1600, 10, 998, 'rho')],
        compute: v => {
          const do_ = parseFloat(v.do) / 1000;
          const tw = { '18': 1.24, '16': 1.65, '14': 2.11, '12': 2.77, '10': 3.40 }[v.bwg] / 1000;
          const di = do_ - 2 * tw;
          const pt = v.ptr * do_;
          const np = parseInt(v.np, 10);
          const Nt = Math.max(Math.round(v.A / (Math.PI * do_ * v.L)), 4);
          const NtPass = Math.round(Nt / np);
          const key = v.lay + '_' + v.np;
          const kc = TC[key] || TC['30_2'];
          const Db = do_ * Math.pow(Nt / kc[0], 1 / kc[1]);
          const clr = { fixed: 0.011, utube: 0.011, split: 0.052, pull: 0.092 }[v.head];
          const Ds = Db + clr + 0.01 * Db;
          const Aact = Math.PI * do_ * v.L * Nt;
          const at = Math.PI * di * di / 4 * NtPass;
          const ut = (v.Qt / 3600) / at;
          const lB = v.lB * Ds;
          const As = (pt - do_) * Ds * lB / pt;
          const De = v.lay === '90' ? 1.27 / do_ * (pt * pt - 0.785 * do_ * do_) : 1.10 / do_ * (pt * pt - 0.917 * do_ * do_);
          const nBaff = Math.max(Math.round(v.L / lB) - 1, 1);
          const LD = v.L / Ds;
          const packDens = Nt * Math.PI * do_ * do_ / 4 / (Math.PI * Ds * Ds / 4) * 100;
          const wt = Nt * Math.PI * (do_ * do_ - di * di) / 4 * v.L * 7850;
          const shellT = 0.008 + Ds * 0.004;
          const rows = ['30', '45', '90'].map(lay => {
            const k2 = TC[lay + '_' + v.np] || TC['30_2'];
            const db = do_ * Math.pow(Nt / k2[0], 1 / k2[1]);
            const ds = db + clr + 0.01 * db;
            const de = lay === '90' ? 1.27 / do_ * (pt * pt - 0.785 * do_ * do_) : 1.10 / do_ * (pt * pt - 0.917 * do_ * do_);
            return [lay + '\u00b0', db.toFixed(4), ds.toFixed(4), (de * 1000).toFixed(2), (v.L / ds).toFixed(2), lay === '90' ? 'yes' : 'no'];
          });
          return {
            Nt: Nt, Ds: Ds, Db: Db, ut: ut, LD: LD, lB: lB, do_: do_, pt: pt, Aact: Aact,
            res: [{ l: 'Tube outside diameter', v: do_ * 1000, u: 'mm', d: 2 }, { l: 'Tube inside diameter', v: di * 1000, u: 'mm', d: 3 }, { l: 'Tube pitch', v: pt * 1000, u: 'mm', d: 2 }, { l: 'Number of tubes', s: String(Nt), u: '' }, { l: 'Tubes per pass', s: String(NtPass), u: '' }, { l: 'Area provided', v: Aact, u: 'm\u00b2', d: 2 }, { l: 'Area over-surface', v: (Aact / v.A - 1) * 100, u: '%', d: 2 }, { l: 'Bundle diameter', v: Db, u: 'm', d: 4 }, { l: 'Shell inside diameter', v: Ds, u: 'm', d: 4 }, { l: 'Bundle-to-shell clearance', v: clr * 1000, u: 'mm', d: 1 }, { l: 'Tube packing density', v: packDens, u: '% of shell area', d: 1 }, { l: 'Length / diameter ratio', v: LD, u: '\u2014', d: 2 }, { l: 'Tube-side flow area per pass', v: at * 1e4, u: 'cm\u00b2', d: 2 }, { l: 'Tube-side velocity', v: ut, u: 'm/s', d: 3 }, { l: 'Baffle spacing', v: lB * 1000, u: 'mm', d: 1 }, { l: 'Number of baffles', s: String(nBaff), u: '' }, { l: 'Shell-side crossflow area', v: As * 1e4, u: 'cm\u00b2', d: 2 }, { l: 'Shell-side equivalent diameter', v: De * 1000, u: 'mm', d: 3 }, { l: 'Tube bundle weight', v: wt, u: 'kg', d: 0 }, { l: 'Estimated shell thickness', v: shellT * 1000, u: 'mm', d: 1 }, { l: 'Velocity check', s: ut < 0.9 ? 'too slow \u2014 fouling and poor heat transfer; reduce the pass count' : ut > 3 ? 'TOO FAST \u2014 erosion risk; add passes or tubes' : ut > 2.5 ? 'high but acceptable for clean water' : 'in the normal 1\u20132.5 m/s window', u: '' }, { l: 'Aspect-ratio check', s: LD < 4 ? 'squat bundle \u2014 poor shell-side distribution, consider longer tubes' : LD > 15 ? 'very long and slender \u2014 check for tube vibration and support spacing' : 'a conventional 5\u201310 aspect ratio', u: '' }, { l: 'Cleanability', s: v.lay === '90' ? 'square pitch \u2014 the shell side can be lanced' : 'triangular pitch \u2014 chemical cleaning only on the shell side', u: '' }],
            table: { title: 'The three layouts at the same tube count', head: ['Layout', 'D_bundle  m', 'D_shell  m', 'D_e  mm', 'L/D', 'cleanable'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -r.Ds / 2 * 1.12, xmax: r.Ds / 2 * 1.12, ymin: -r.Ds / 2 * 1.12, ymax: r.Ds / 2 * 1.12, ml: 56 });
          g.grid('Distance from the shell axis  m', '');
          g.title('Tube layout \u2014 ' + r.Nt + ' tubes on ' + v.lay + '\u00b0 pitch in a ' + (r.Ds * 1000).toFixed(0) + ' mm shell');
          g.clip(() => {
            ctx.save();
            ctx.strokeStyle = C.dk; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(g.X(0), g.Y(0), Math.abs(g.X(r.Ds / 2) - g.X(0)), 0, 7); ctx.stroke();
            ctx.strokeStyle = C.mid; ctx.lineWidth = 1.3; ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.arc(g.X(0), g.Y(0), Math.abs(g.X(r.Db / 2) - g.X(0)), 0, 7); ctx.stroke();
            ctx.setLineDash([]);
            const pt = r.pt, rad = r.Db / 2 - r.do_ / 2;
            const dy = v.lay === '90' ? pt : pt * Math.sqrt(3) / 2;
            const rpx = Math.abs(g.X(r.do_ / 2) - g.X(0));
            let drawn = 0;
            const rows = Math.ceil(rad / dy) + 1;
            for (let j = -rows; j <= rows; j++) {
              const y = j * dy;
              const off = (v.lay === '90' || j % 2 === 0) ? 0 : pt / 2;
              const cols = Math.ceil(rad / pt) + 2;
              for (let i = -cols; i <= cols; i++) {
                const x = i * pt + off;
                if (Math.hypot(x, y) > rad) continue;
                drawn++;
                if (drawn > 1400) break;
                ctx.fillStyle = 'rgba(89,128,166,0.30)'; ctx.strokeStyle = C.acc; ctx.lineWidth = 0.9;
                ctx.beginPath(); ctx.arc(g.X(x), g.Y(y), Math.max(rpx, 1.2), 0, 7); ctx.fill();
                if (rpx > 2.2) ctx.stroke();
              }
            }
            if (parseInt(v.np, 10) > 1) {
              ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.setLineDash([]);
              ctx.beginPath(); ctx.moveTo(g.X(-r.Db / 2), g.Y(0)); ctx.lineTo(g.X(r.Db / 2), g.Y(0)); ctx.stroke();
              if (parseInt(v.np, 10) >= 4) { ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(-r.Db / 2)); ctx.lineTo(g.X(0), g.Y(r.Db / 2)); ctx.stroke(); }
            }
            ctx.restore();
          });
          g.legend([{ c: C.dk, l: 'shell' }, { c: C.mid, l: 'bundle OTL', d: [5, 4] }, { c: C.warn, l: 'pass partitions' }]);
        }
      },
      {
        id: 'traydes', num: 'G-02', sec: S, name: 'Tray column mechanical design',
        blurb: 'A distillation column is a diameter, a tray spacing and a set of hole and weir dimensions, and every one of them is a compromise between capacity and efficiency. The diameter comes from the vapour load at flooding; everything else comes from keeping the froth on the tray and the liquid moving down the downcomer.',
        howto: 'The diameter follows the Souders\u2013Brown capacity factor, so watch what tray spacing does to it: going from 450 to 600 mm buys about 10 % more capacity, which is usually cheaper than a bigger shell. Then check the downcomer. Most trays that fail in service fail there \u2014 the liquid needs three to five seconds of residence time to release its entrained vapour, and a downcomer sized on velocity alone will not give it. The weir height sets the liquid inventory and therefore the efficiency: 50 mm is the usual compromise, low weirs for vacuum service and high weirs where residence time matters.',
        std: 'Sinnott & Towler, 6th ed., Ch. 17; Kister, Distillation Design, Ch. 6\u20138; Fair (1961) flooding correlation',
        eqs: [['u_f = K_1\\sqrt{\\frac{\\rho_L-\\rho_V}{\\rho_V}}', 'Souders\u2013Brown / Fair flooding velocity'], ['F_{LV} = \\frac{L_w}{V_w}\\sqrt{\\frac{\\rho_V}{\\rho_L}}', 'the flow parameter that sets K\u2081'], ['h_w + h_{ow} = h_w + 750\\left(\\frac{L_w}{\\rho_Ll_w}\\right)^{2/3}', 'Francis weir crest over the weir'], ['t_{dc} = \\frac{A_{dc}h_{bc}\\rho_L}{L_w} \\ge 3\\ \\mathrm{s}', 'downcomer residence time \u2014 the usual failure point']],
        notes: ['Sieve trays; the same construction applies to valve trays with a different K\u2081.',
          'Flooding velocity from the Fair correlation with a surface-tension correction to 20 mN/m.',
          'Downcomer area taken as a segmental chord; the module reports the chord length so it can be drawn.',
          'Weeping and entrainment limits are in module S-10 \u2014 this module sizes the hardware, that one checks the operating window.'],
        params: [PF('Vm', 'Vapour mass flow', 100, 500000, 100, 20000, 'M'), PF('Lm', 'Liquid mass flow', 100, 500000, 100, 18000, 'M'), P('rhoV', 'Vapour density', 0.2, 80, 0.1, 2.5, 'rho'), P('rhoL', 'Liquid density', 400, 1400, 5, 780, 'rho'), P('sig', 'Surface tension', 5, 80, 0.5, 20, null, 'mN/m'), P('ts', 'Tray spacing', 250, 900, 10, 500, null, 'mm'), P('flood', 'Design fraction of flooding', 50, 95, 1, 80, null, '%'), P('hw', 'Weir height', 20, 100, 1, 50, null, 'mm'), P('adc', 'Downcomer area', 6, 25, 0.5, 12, null, '% of column area'), P('dh', 'Hole diameter', 2, 25, 0.5, 5, null, 'mm'), P('ah', 'Hole area', 5, 15, 0.5, 10, null, '% of active area'), P('Ntray', 'Number of trays', 5, 150, 1, 30, null, '\u2014'), P('eff', 'Tray efficiency', 30, 95, 1, 70, null, '%')],
        compute: v => {
          const Vw = v.Vm / 3600, Lw = v.Lm / 3600;
          const FLV = (Lw / Vw) * Math.sqrt(v.rhoV / v.rhoL);
          /* Fair K1 as a function of the flow parameter, at the given tray spacing */
          const K1base = ts => {
            const a = Math.log10(Math.max(Math.min(FLV, 1), 0.01));
            const k = 0.0105 + 0.0400 * (ts / 1000) - 0.0025 * 0;
            return Math.max((0.0105 + 0.0400 * ts / 1000) * Math.pow(10, -0.30 * a - 0.14 * a * a) * 1.0, 0.005);
          };
          const K1 = K1base(v.ts) * Math.pow(v.sig / 20, 0.2);
          const uf = K1 * Math.sqrt((v.rhoL - v.rhoV) / v.rhoV);
          const un = uf * v.flood / 100;
          const Qv = Vw / v.rhoV;
          const Anet = Qv / un;
          const Ac = Anet / (1 - v.adc / 100);
          const D = Math.sqrt(4 * Ac / Math.PI);
          const Ad = Ac * v.adc / 100;
          const Aa = Ac - 2 * Ad;
          const Ah = Aa * v.ah / 100;
          /* segmental chord for the downcomer */
          const th = self.bis(t => (t - Math.sin(t)) / (2 * Math.PI) - v.adc / 100, 0.01, 6.2, 1e-9);
          const lw = D * Math.sin(th / 2);
          const how = 750 * Math.pow(Lw / (v.rhoL * lw), 2 / 3);
          const hL = v.hw + how;
          const uh = Qv / Ah;
          const hd = 51 * Math.pow(uh / 0.9, 2) * v.rhoV / v.rhoL;
          const hres = 12500 / v.rhoL;
          const ht = hd + hL + hres;
          const hdc = ht + how + v.hw * 0;
          const bc = hdc / 1000 * 1.5;
          const tdc = Ad * bc * v.rhoL / Lw;
          const udc = (Lw / v.rhoL) / Ad;
          const H = v.Ntray * v.ts / 1000 + 2.4;
          const Nact = Math.ceil(v.Ntray);
          const weep = 0.9 * (25.4 - v.dh) / 25.4;
          const uhMin = weep / Math.sqrt(v.rhoV) * 1 + (0.0292 * 0);
          const nHoles = Math.round(Ah / (Math.PI * Math.pow(v.dh / 1000, 2) / 4));
          const rows = [350, 450, 500, 600, 750].map(ts => {
            const k = K1base(ts) * Math.pow(v.sig / 20, 0.2);
            const u = k * Math.sqrt((v.rhoL - v.rhoV) / v.rhoV) * v.flood / 100;
            const an = Qv / u, ac = an / (1 - v.adc / 100);
            const d = Math.sqrt(4 * ac / Math.PI);
            return [String(ts), k.toFixed(4), u.toFixed(4), d.toFixed(3), (v.Ntray * ts / 1000 + 2.4).toFixed(2), (Math.PI * d * (v.Ntray * ts / 1000 + 2.4) * 0.012 * 7850).toFixed(0)];
          });
          return {
            D: D, Ac: Ac, Ad: Ad, Aa: Aa, lw: lw, th: th, uf: uf, un: un, hL: hL, ht: ht,
            res: [{ l: 'Flow parameter F_LV', v: FLV, u: '\u2014', d: 4 }, { l: 'Capacity factor K\u2081', v: K1, u: 'm/s', d: 5 }, { l: 'Flooding velocity', v: uf, u: 'm/s', d: 4 }, { l: 'Design vapour velocity', v: un, u: 'm/s', d: 4 }, { l: 'Vapour volumetric flow', v: Qv, u: 'm\u00b3/s', d: 4 }, { l: 'Net area required', v: Anet, u: 'm\u00b2', d: 4 }, { l: 'Column cross-sectional area', v: Ac, u: 'm\u00b2', d: 4 }, { l: 'Column diameter', v: D, u: 'm', d: 3 }, { l: 'Downcomer area (each)', v: Ad, u: 'm\u00b2', d: 4 }, { l: 'Active (bubbling) area', v: Aa, u: 'm\u00b2', d: 4 }, { l: 'Weir length', v: lw, u: 'm', d: 3 }, { l: 'Weir length / diameter', v: lw / D, u: '\u2014', d: 3 }, { l: 'Total hole area', v: Ah, u: 'm\u00b2', d: 4 }, { l: 'Number of holes', s: nHoles.toLocaleString(), u: '' }, { l: 'Hole velocity', v: uh, u: 'm/s', d: 3 }, { l: 'Weir crest h_ow', v: how, u: 'mm', d: 2 }, { l: 'Liquid depth on the tray', v: hL, u: 'mm', d: 2 }, { l: 'Dry-tray pressure drop', v: hd, u: 'mm liquid', d: 2 }, { l: 'Total tray pressure drop', v: ht, u: 'mm liquid', d: 2 }, { l: 'Pressure drop per tray', v: ht / 1000 * v.rhoL * g0 / 1000, u: 'kPa', d: 4 }, { l: 'Pressure drop over the column', v: ht / 1000 * v.rhoL * g0 * Nact / 1000, u: 'kPa', d: 3 }, { l: 'Downcomer backup', v: hdc, u: 'mm', d: 1 }, { l: 'Downcomer liquid velocity', v: udc, u: 'm/s', d: 4 }, { l: 'Downcomer residence time', v: tdc, u: 's', d: 3 }, { l: 'Actual trays for ' + v.eff.toFixed(0) + ' % efficiency', s: Math.ceil(Nact / (v.eff / 100)) + ' actual', u: '' }, { l: 'Tangent-to-tangent height', v: H, u: 'm', d: 2 }, { l: 'Height / diameter ratio', v: H / D, u: '\u2014', d: 2 }, { l: 'Downcomer check', s: tdc < 3 ? 'TOO SHORT \u2014 entrained vapour will not release; enlarge the downcomer' : tdc > 8 ? 'generously sized \u2014 you could recover area for bubbling' : 'adequate, 3\u20135 s is the target', u: '' }, { l: 'Downcomer velocity check', s: udc > 0.12 ? 'too fast \u2014 froth will be carried down' : 'acceptable', u: '' }, { l: 'Backup check', s: hdc > 0.5 * v.ts ? 'DOWNCOMER FLOODING \u2014 backup exceeds half the tray spacing' : 'clear of downcomer flooding', u: '' }, { l: 'Slenderness check', s: H / D > 30 ? 'very slender \u2014 wind and vibration will govern the shell; consider two shells' : 'mechanically conventional', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const R = r.D / 2;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -R * 1.15, xmax: R * 1.15, ymin: -R * 1.15, ymax: R * 1.15, ml: 56 });
          g.grid('Distance from the column axis  m', '');
          g.title('Tray layout \u2014 ' + r.D.toFixed(3) + ' m diameter, ' + v.ts.toFixed(0) + ' mm spacing');
          g.clip(() => {
            ctx.save();
            const cx = g.X(0), cy = g.Y(0), rp = Math.abs(g.X(R) - g.X(0));
            ctx.strokeStyle = C.dk; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 7); ctx.stroke();
            /* downcomer chords top and bottom */
            const hchord = R * Math.cos(r.th / 2);
            ctx.fillStyle = 'rgba(29,45,61,0.13)';
            [1, -1].forEach(sgn => {
              ctx.beginPath();
              const a0 = Math.asin(Math.min(hchord / R, 1));
              ctx.arc(cx, cy, rp, sgn > 0 ? -Math.PI / 2 - (Math.PI / 2 - a0) : Math.PI / 2 - a0, sgn > 0 ? -Math.PI / 2 + (Math.PI / 2 - a0) : Math.PI / 2 + a0);
              ctx.closePath(); ctx.fill();
              ctx.strokeStyle = C.mid; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(g.X(-r.lw / 2), g.Y(sgn * hchord)); ctx.lineTo(g.X(r.lw / 2), g.Y(sgn * hchord)); ctx.stroke();
            });
            /* perforated active area */
            const pitch = v.dh / 1000 * Math.sqrt(Math.PI / (2 * Math.sqrt(3) * v.ah / 100));
            const step = Math.max(pitch, R / 34);
            const rpx = Math.max(Math.abs(g.X(v.dh / 2000) - g.X(0)), 0.9);
            let n = 0;
            for (let j = -Math.ceil(hchord / (step * 0.866)); j <= Math.ceil(hchord / (step * 0.866)); j++) {
              const y = j * step * 0.866;
              if (Math.abs(y) > hchord - step * 0.5) continue;
              const off = j % 2 ? step / 2 : 0;
              const xr = Math.sqrt(Math.max(R * R - y * y, 0)) - step * 0.6;
              for (let i = -Math.ceil(xr / step); i <= Math.ceil(xr / step); i++) {
                const x = i * step + off;
                if (Math.abs(x) > xr) continue;
                n++; if (n > 2600) break;
                ctx.fillStyle = 'rgba(89,128,166,0.55)';
                ctx.beginPath(); ctx.arc(g.X(x), g.Y(y), rpx, 0, 7); ctx.fill();
              }
            }
            ctx.restore();
          });
          g.legend([{ c: C.dk, l: 'shell' }, { c: C.mid, l: 'weirs' }, { c: C.acc, l: 'perforated active area' }]);
        }
      },
      {
        id: 'packint', num: 'G-03', sec: S, name: 'Packed column internals & HETP',
        blurb: 'A packed column has no trays to argue about, so its design is entirely about the packing and the things that feed it. The packing factor sets the diameter through the flooding correlation; the HETP sets the height; and the liquid distributor decides whether either number means anything, because a badly distributed bed has no efficiency at all.',
        howto: 'Compare a random packing with a structured one at the same duty. Structured packing gives a much lower HETP and a lower pressure drop, which is why it dominates vacuum service, but it costs several times as much and is intolerant of fouling and of poor distribution. Then look at the bed-depth limit: liquid maldistribution grows down a bed, so every five to ten metres you must stop, collect the liquid and redistribute it. The drip-point density is the number that actually decides whether the column works \u2014 below about 40 points per square metre, no packing achieves its rated HETP.',
        std: 'Sinnott & Towler, 6th ed., Ch. 17; Kister, Distillation Design, Ch. 9; Eckert generalised pressure drop correlation; Strigle, Random Packings and Packed Towers, 2nd ed.',
        eqs: [['\\frac{u_f^{2}F_p}{g}\\left(\\frac{\\rho_V}{\\rho_L-\\rho_V}\\right)\\left(\\frac{\\mu_L}{\\mu_w}\\right)^{0.1} = f(F_{LV})', 'Eckert flooding correlation'], ['Z = N \\times HETP', 'packed height from the theoretical stage count'], ['HETP \\approx \\frac{100}{a}\\ \\text{(m, for structured packing)}', 'the rule of thumb the vendors\u2019 data follow'], ['n_{drip} \\ge 40\\ \\text{points/m}^{2}', 'the distributor criterion that governs real efficiency']],
        notes: ['Eckert correlation with a viscosity correction; the flooding capacity is read at the design pressure drop.',
          'HETP from vendor-typical values scaled by the surface area; expect \u00b125 % against a real test.',
          'Pressure drop from the generalised correlation, in mbar per metre of packing.',
          'Bed depth limited to 20 times the diameter or 6 m for random packing, 10 m for structured.'],
        params: [SEL('pk', 'Packing', 'pall50', POPT), PF('Vm', 'Vapour mass flow', 100, 500000, 100, 15000, 'M'), PF('Lm', 'Liquid mass flow', 100, 500000, 100, 14000, 'M'), P('rhoV', 'Vapour density', 0.1, 60, 0.05, 1.8, 'rho'), P('rhoL', 'Liquid density', 400, 1400, 5, 800, 'rho'), P('muL', 'Liquid viscosity', 0.1, 50, 0.1, 0.5, null, 'cP'), P('flood', 'Design fraction of flooding', 40, 90, 1, 70, null, '%'), P('Ns', 'Theoretical stages required', 2, 80, 1, 20, null, '\u2014'), P('drip', 'Distributor drip points', 20, 200, 5, 60, null, 'per m\u00b2')],
        compute: v => {
          const pk = PACK[v.pk];
          const Vw = v.Vm / 3600, Lw = v.Lm / 3600;
          const FLV = (Lw / Vw) * Math.sqrt(v.rhoV / v.rhoL);
          /* Eckert capacity parameter at flooding, fitted to the published chart */
          const Yf = Math.pow(10, -1.6678 - 1.085 * Math.log10(Math.max(Math.min(FLV, 3), 0.005)) - 0.297 * Math.pow(Math.log10(Math.max(Math.min(FLV, 3), 0.005)), 2));
          const uf = Math.sqrt(Yf * g0 * (v.rhoL - v.rhoV) / (v.rhoV * pk.Fp * 3.2808 * Math.pow(v.muL, 0.1)));
          const un = uf * v.flood / 100;
          const Qv = Vw / v.rhoV;
          const Ac = Qv / un;
          const D = Math.sqrt(4 * Ac / Math.PI);
          const HETP = pk.HETP * (1 + 0.15 * Math.max(v.muL - 0.5, 0) / 5);
          const Z = v.Ns * HETP;
          const zLim = v.pk.indexOf('mellap') >= 0 ? Math.min(10, 20 * D) : Math.min(6, 20 * D);
          const nBeds = Math.max(Math.ceil(Z / zLim), 1);
          /* pressure drop from the generalised correlation at the operating capacity */
          const dpFlood = 0.115 * Math.pow(pk.Fp, 0.7);
          const dpm = dpFlood * Math.pow(v.flood / 100, 2) * 100;
          const dpTot = dpm * Z / 100;
          const Lq = (Lw / v.rhoL) / Ac * 3600;
          const holdup = 0.0169 * Math.pow(Lq / 3600 * 1000 / 1, 0.44) * 0 + Math.min(0.12 * Math.pow(Lq / 30, 0.6), pk.e * 0.5);
          const wetting = Lq / (pk.a);
          const nDrip = Math.round(v.drip * Ac);
          const packVol = Ac * Z;
          const NTU = v.Ns;
          const rows = Object.keys(PACK).map(k => {
            const p = PACK[k];
            const u = Math.sqrt(Yf * g0 * (v.rhoL - v.rhoV) / (v.rhoV * p.Fp * 3.2808 * Math.pow(v.muL, 0.1))) * v.flood / 100;
            const ac = Qv / u, d = Math.sqrt(4 * ac / Math.PI);
            const z = v.Ns * p.HETP;
            return [p.n, String(p.Fp), d.toFixed(3), p.HETP.toFixed(2), z.toFixed(2), (0.115 * Math.pow(p.Fp, 0.7) * Math.pow(v.flood / 100, 2) * 100).toFixed(2), (ac * z).toFixed(2)];
          });
          return {
            D: D, Z: Z, uf: uf, un: un, FLV: FLV, Ac: Ac, pk: pk, dpm: dpm,
            res: [{ l: 'Packing', s: pk.n, u: '' }, { l: 'Packing factor F_p', v: pk.Fp, u: 'm\u207b\u00b9', d: 0 }, { l: 'Specific surface area', v: pk.a, u: 'm\u00b2/m\u00b3', d: 0 }, { l: 'Void fraction', v: pk.e, u: '\u2014', d: 3 }, { l: 'Flow parameter F_LV', v: FLV, u: '\u2014', d: 4 }, { l: 'Flooding velocity', v: uf, u: 'm/s', d: 4 }, { l: 'Design velocity', v: un, u: 'm/s', d: 4 }, { l: 'Column area', v: Ac, u: 'm\u00b2', d: 4 }, { l: 'Column diameter', v: D, u: 'm', d: 3 }, { l: 'HETP', v: HETP, u: 'm', d: 3 }, { l: 'Packed height required', v: Z, u: 'm', d: 3 }, { l: 'Maximum bed depth', v: zLim, u: 'm', d: 2 }, { l: 'Number of beds', s: String(nBeds) + (nBeds > 1 ? ' with redistributors between' : ''), u: '' }, { l: 'Packing volume', v: packVol, u: 'm\u00b3', d: 3 }, { l: 'Pressure drop per metre', v: dpm, u: 'mbar/m', d: 3 }, { l: 'Pressure drop over the packing', v: dpTot * 100, u: 'mbar', d: 2 }, { l: 'Liquid load', v: Lq, u: 'm\u00b3/m\u00b2h', d: 3 }, { l: 'Operating liquid hold-up', v: holdup * 100, u: '% of volume', d: 2 }, { l: 'Wetting rate', v: wetting, u: 'm\u00b3/m\u00b7h', d: 5 }, { l: 'Drip points required', s: nDrip + ' over ' + Ac.toFixed(2) + ' m\u00b2', u: '' }, { l: 'Distributor check', s: v.drip < 40 ? 'TOO FEW \u2014 the bed will not reach its rated HETP; use 60\u2013100 points per m\u00b2' : v.drip > 120 ? 'very fine distribution \u2014 expensive and prone to plugging' : 'adequate distribution', u: '' }, { l: 'Wetting check', s: Lq < 10 ? 'liquid load too low \u2014 the packing will not wet fully; consider a smaller column or recycle' : Lq > 100 ? 'very high liquid load \u2014 check the flooding correlation against vendor data' : 'in the well-behaved liquid-load range', u: '' }, { l: 'Slenderness', s: Z / D > 30 ? 'a very tall, slender column \u2014 wind loading will govern' : 'mechanically conventional', u: '' }, { l: 'Choice comment', s: v.pk.indexOf('mellap') >= 0 ? 'structured packing \u2014 lowest HETP and \u0394P, but intolerant of fouling and of poor distribution' : pk.Fp > 60 ? 'a high packing factor \u2014 cheap and robust, but the column is large' : 'modern random packing \u2014 a good general-purpose choice', u: '' }],
            table: { title: 'Every packing at the same duty', head: ['Packing', 'F_p', 'D  m', 'HETP  m', 'Z  m', '\u0394P  mbar/m', 'volume  m\u00b3'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.005, xmax: 3, ymin: 0.003, ymax: 0.3, xlog: true, ylog: true, ml: 72 });
          g.grid('Flow parameter  F_LV', 'Capacity parameter  Y');
          g.title('Eckert generalised correlation \u2014 flooding and pressure-drop lines');
          const Yf = f => Math.pow(10, -1.6678 - 1.085 * Math.log10(f) - 0.297 * Math.pow(Math.log10(f), 2));
          g.fn(f => Math.min(Yf(f), 0.3), C.dk, 2.8, null, 300);
          [0.7, 0.5, 0.35, 0.2].forEach(fr => { g.fn(f => Math.min(Yf(f) * fr * fr, 0.3), 'rgba(29,31,32,0.16)', 1.4, [6, 3], 200); });
          g.fn(f => Math.min(Yf(f) * Math.pow(v.flood / 100, 2), 0.3), C.acc, 2.4, [4, 3], 300);
          const Ypt = Math.pow(r.un, 2) * r.pk.Fp * 3.2808 * Math.pow(v.muL, 0.1) * v.rhoV / (g0 * (v.rhoL - v.rhoV));
          g.dot(Math.min(Math.max(r.FLV, 0.005), 3), Math.min(Math.max(Ypt, 0.003), 0.3), C.warn, 6);
          g.cross(Math.min(Math.max(r.FLV, 0.005), 3), Math.min(Math.max(Yf(Math.min(Math.max(r.FLV, 0.005), 3)), 0.003), 0.3), C.dk, 8);
          if (g.w > 320) { g.txt('flooding', 0.007, Yf(0.007) * 1.25, C.dk, 'left', 11.5); g.txt('70, 50, 35, 20 % of flooding', 2.6, 0.0042, C.mid, 'right', 11); }
          g.legend([{ c: C.dk, l: 'flooding line' }, { c: C.acc, l: v.flood.toFixed(0) + ' % of flooding', d: [4, 3] }, { c: C.warn, l: 'operating point' }]);
        }
      },
      {
        id: 'apitank', num: 'G-04', sec: S, name: 'Storage tank shell design (API 650)',
        blurb: 'A vertical storage tank is the simplest pressure-containing structure in a plant and the one most often got wrong. The shell thickness is set course by course, because the hydrostatic head falls as you climb, and the bottom course carries everything. Wind and seismic overturning, not the liquid, usually decide whether it needs anchoring.',
        howto: 'Watch the course thicknesses step down the shell \u2014 that staircase is the whole of API 650 one-foot design. Then check the anchorage. An empty tank in a storm is the dangerous case, because there is no liquid weight to resist overturning, and a tank that needs anchors and does not have them will lift its bottom plate. The shell-to-bottom weld is the other place to look: the annular plate must be thick enough to carry the bottom course, and its width comes from the same hydrostatic pressure.',
        std: 'API 650, 13th ed., \u00a75.6 (one-foot method) and \u00a75.11; API 620 for low pressure; Sinnott & Towler Ch. 14',
        eqs: [['t_d = \\frac{4.9D(H - 0.3)G}{S_d} + CA', 'design thickness by the one-foot method, mm'], ['t_t = \\frac{4.9D(H-0.3)}{S_t}', 'hydrostatic test thickness'], ['M_{wind} = \\tfrac{1}{2}\\rho_a u^{2}C_sDH\\cdot\\tfrac{H}{2}', 'overturning moment from wind'], ['\\frac{M_{wind}}{D} < \\frac{W_{shell}}{2} \\Rightarrow \\text{no anchors needed}', 'the API 650 stability criterion']],
        notes: ['One-foot method, valid for tanks up to 60 m diameter; larger tanks use the variable-design-point method.',
          'Allowable stresses: 2/3 of yield for design, 3/4 of yield for the hydrostatic test, per API 650 Table 5-2.',
          'Minimum shell thickness by diameter is enforced: 5 mm below 15 m, 6 mm to 36 m, 8 mm to 60 m, 10 mm above.',
          'Wind pressure from a 3-second gust with a shape coefficient of 0.7 for a cylindrical shell.'],
        params: [PF('D', 'Tank diameter', 3, 100, 0.5, 30, 'L'), PF('H', 'Shell height', 3, 30, 0.5, 14.4, 'L'), P('nc', 'Number of courses', 2, 12, 1, 6, null, '\u2014'), P('SG', 'Product specific gravity', 0.5, 2, 0.01, 0.85, null, '\u2014'), SEL('mat', 'Shell material', 'a36', [['a36', 'A36 \u2014 250 MPa yield'], ['a283c', 'A283 Gr C \u2014 205 MPa'], ['a516_70', 'A516 Gr 70 \u2014 260 MPa'], ['ss304', '304 stainless \u2014 205 MPa']]), P('CA', 'Corrosion allowance', 0, 6, 0.5, 1.5, null, 'mm'), P('wind', 'Design wind speed', 20, 80, 1, 45, null, 'm/s'), P('roof', 'Roof plate thickness', 4, 12, 0.5, 5, null, 'mm'), P('fill', 'Fill level for the wind check', 0, 100, 5, 0, null, '%')],
        compute: v => {
          const MAT = { a36: [250, 'A36'], a283c: [205, 'A283 Gr C'], a516_70: [260, 'A516 Gr 70'], ss304: [205, '304 SS'] }[v.mat];
          const Sy = MAT[0], Sd = Sy * 2 / 3, St = Sy * 3 / 4;
          const nc = Math.round(v.nc), hc = v.H / nc;
          const tmin = v.D < 15 ? 5 : v.D < 36 ? 6 : v.D < 60 ? 8 : 10;
          const courses = [];
          let steel = 0;
          for (let i = 0; i < nc; i++) {
            const hBot = v.H - i * hc;
            const td = 4.9 * v.D * Math.max(hBot - 0.3, 0) * v.SG / Sd + v.CA;
            const tt = 4.9 * v.D * Math.max(hBot - 0.3, 0) / St;
            const t = Math.max(td, tt, tmin);
            const tNom = Math.ceil(t * 2) / 2;
            const w = Math.PI * v.D * hc * tNom / 1000 * 7850;
            steel += w;
            courses.push({ n: i + 1, hBot: hBot, td: td, tt: tt, t: tNom, w: w, gov: td >= tt ? (td >= tmin ? 'design' : 'minimum') : (tt >= tmin ? 'test' : 'minimum') });
          }
          const Vtank = Math.PI * v.D * v.D / 4 * v.H;
          const Wroof = Math.PI * v.D * v.D / 4 * v.roof / 1000 * 7850 * 1.15;
          const Wbot = Math.PI * v.D * v.D / 4 * Math.max(6, tmin) / 1000 * 7850;
          const Wshell = steel;
          const Wtot = Wshell + Wroof + Wbot;
          const Wliq = Vtank * v.fill / 100 * v.SG * 1000;
          const q = 0.613 * v.wind * v.wind;
          const F = q * 0.7 * v.D * v.H;
          const Mw = F * v.H / 2;
          const Mres = (Wshell + Wroof + Wliq) * g0 * v.D / 2;
          const ratio = Mw / Math.max(Mres, 1e-9);
          const annular = Math.max(6, courses[0].t * 0.8);
          const annW = Math.max(0.6, 215 * courses[0].t / Math.sqrt(v.H * 1000 * v.SG) / 1000);
          const rows = courses.map(c => [String(c.n), (c.hBot - hc).toFixed(2) + ' to ' + c.hBot.toFixed(2), c.td.toFixed(2), c.tt.toFixed(2), c.t.toFixed(1), c.gov, c.w.toFixed(0)]);
          return {
            courses: courses, hc: hc, tmin: tmin, ratio: ratio,
            res: [{ l: 'Material', s: MAT[1] + ', yield ' + Sy + ' MPa', u: '' }, { l: 'Design allowable stress', v: Sd, u: 'MPa', d: 1 }, { l: 'Test allowable stress', v: St, u: 'MPa', d: 1 }, { l: 'Nominal capacity', v: Vtank, u: 'm\u00b3', d: 1 }, { l: 'Capacity in barrels', v: Vtank * 6.2898, u: 'bbl', d: 0 }, { l: 'Course height', v: hc, u: 'm', d: 3 }, { l: 'Minimum thickness by diameter', v: tmin, u: 'mm', d: 1 }, { l: 'Bottom course thickness', v: courses[0].t, u: 'mm', d: 1 }, { l: 'Top course thickness', v: courses[nc - 1].t, u: 'mm', d: 1 }, { l: 'Governing case at the bottom', s: courses[0].gov, u: '' }, { l: 'Shell steel weight', v: Wshell, u: 'kg', d: 0 }, { l: 'Roof weight', v: Wroof, u: 'kg', d: 0 }, { l: 'Bottom plate weight', v: Wbot, u: 'kg', d: 0 }, { l: 'Total empty weight', v: Wtot, u: 'kg', d: 0 }, { l: 'Product weight when full', v: Vtank * v.SG * 1000, u: 'kg', d: 0 }, { l: 'Annular plate thickness', v: annular, u: 'mm', d: 1 }, { l: 'Annular plate width', v: annW, u: 'm', d: 3 }, { l: 'Wind pressure', v: q / 1000, u: 'kPa', d: 4 }, { l: 'Wind force on the shell', v: F / 1000, u: 'kN', d: 2 }, { l: 'Overturning moment', v: Mw / 1000, u: 'kN\u00b7m', d: 1 }, { l: 'Resisting moment at ' + v.fill.toFixed(0) + ' % fill', v: Mres / 1000, u: 'kN\u00b7m', d: 1 }, { l: 'Overturning ratio', v: ratio, u: '\u2014', d: 4 }, { l: 'Anchorage', s: ratio > 0.667 ? 'ANCHORS REQUIRED \u2014 the tank would lift in this wind' : ratio > 0.4 ? 'no anchors needed, but the margin is modest' : 'self-anchoring with a comfortable margin', u: '' }, { l: 'Worst case for overturning', s: v.fill > 0 ? 'check again at 0 % fill \u2014 an empty tank has no resisting weight' : 'this is the worst case, empty and windy', u: '' }, { l: 'Design method check', s: v.D > 60 ? 'above 60 m the one-foot method is not permitted \u2014 use the variable-design-point method' : 'the one-foot method applies', u: '' }],
            table: { title: 'Shell courses from the bottom up', head: ['Course', 'elevation  m', 't_design  mm', 't_test  mm', 't_nominal  mm', 'governed by', 'weight  kg'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const tmax = r.courses[0].t * 1.5;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: tmax, ymin: 0, ymax: v.H, ml: 68 });
          g.grid('Plate thickness  mm', 'Elevation above the bottom  m');
          g.title('Shell course thicknesses \u2014 API 650 one-foot method');
          g.line([[r.tmin, 0], [r.tmin, v.H]], C.lt, 1.4, [6, 4]);
          const stair = [], dsg = [], tst = [];
          r.courses.forEach(c => {
            const y0 = c.hBot - r.hc, y1 = c.hBot;
            stair.push([c.t, y0], [c.t, y1]);
          });
          for (let i = 0; i <= 120; i++) {
            const h = v.H * i / 120;
            dsg.push([4.9 * v.D * Math.max(v.H - h - 0.3, 0) * v.SG / (({ a36: 250, a283c: 205, a516_70: 260, ss304: 205 }[v.mat]) * 2 / 3) + v.CA, h]);
            tst.push([4.9 * v.D * Math.max(v.H - h - 0.3, 0) / (({ a36: 250, a283c: 205, a516_70: 260, ss304: 205 }[v.mat]) * 3 / 4), h]);
          }
          g.line(dsg, C.mid, 1.6, [7, 4]);
          g.line(tst, C.lt, 1.6, [3, 3]);
          g.line(stair, C.acc, 3);
          r.courses.forEach(c => g.line([[0, c.hBot], [tmax, c.hBot]], 'rgba(29,31,32,0.10)', 1));
          if (g.w > 320) { g.txt('minimum by diameter', r.tmin, v.H * 0.96, C.mid, 'left', 11); g.txt('continuous design curve', tmax * 0.98, v.H * 0.12, C.mid, 'right', 11); }
          g.legend([{ c: C.acc, l: 'nominal plate' }, { c: C.mid, l: 'design requirement', d: [7, 4] }, { c: C.lt, l: 'test requirement', d: [3, 3] }]);
        }
      },
      {
        id: 'filtdes', num: 'G-05', sec: S, name: 'Plate-and-frame filtration & cake washing',
        blurb: 'Cake filtration is the one unit operation whose rate falls as it proceeds: every kilogram of solid deposited adds resistance, so the flow decays and the cycle has an optimum length. The specific cake resistance measured in a leaf test is what carries into the plant, and washing is what determines whether the product is saleable.',
        howto: 'The t/V against V plot is the whole method: a straight line means the cake is incompressible and the two slopes give the cake and cloth resistances directly. Then find the optimum cycle. Filtering longer always gives more filtrate but at a falling rate, and there comes a point where dumping the cake and starting again beats continuing \u2014 that optimum is where the average rate over the whole cycle peaks, and it is usually much earlier than operators expect. Compressible cakes make it worse: raising the pressure on a compressible cake buys almost nothing.',
        std: 'Ruth (1935); Coulson & Richardson\u2019s Chemical Engineering Vol. 2, 5th ed., Ch. 7; Perry\u2019s, 9th ed., Sec. 18; Wakeman & Tarleton, Solid/Liquid Separation',
        eqs: [['\\frac{dV}{dt} = \\frac{A^{2}\\Delta P}{\\mu\\left(\\alpha cV + A R_m\\right)}', 'the cake filtration equation'], ['\\frac{t}{V} = \\frac{\\mu\\alpha c}{2A^{2}\\Delta P}V + \\frac{\\mu R_m}{A\\Delta P}', 'the linear plot a leaf test produces'], ['\\alpha = \\alpha_0\\Delta P^{\\,n}', 'compressibility \u2014 n = 0 incompressible, n \u2192 1 highly compressible'], ['t_{cycle,opt} = t_{dump}\\ \\text{when}\\ \\frac{dV}{dt}\\Big|_{t_f} = \\frac{V}{t_f + t_{dump}}', 'the optimum cycle condition']],
        notes: ['Constant-pressure filtration; constant-rate and variable-pressure operation follow the same equation integrated differently.',
          'Specific cake resistance corrected for compressibility at the operating pressure.',
          'Wash efficiency from a dispersion model with the stated number of wash displacements.',
          'Cloth resistance normally 10\u2079 to 10\u00b9\u00b9 m\u207b\u00b9 for a new cloth, rising several-fold as it blinds.'],
        params: [PF('A', 'Filter area', 0.1, 500, 0.1, 20, 'A'), P('dP', 'Filtration pressure', 20, 1500, 10, 300, 'P'), P('alpha', 'Specific cake resistance \u00d710\u00b9\u2070', 0.1, 500, 0.1, 20, null, 'm/kg'), P('nc', 'Compressibility index n', 0, 1, 0.01, 0.3, null, '\u2014'), P('conc', 'Slurry solids', 0.5, 40, 0.5, 8, null, '% by mass'), P('mu', 'Filtrate viscosity', 0.2, 100, 0.1, 1, null, 'cP'), P('Rm', 'Cloth resistance \u00d710\u00b9\u2070', 0.01, 100, 0.01, 1, null, 'm\u207b\u00b9'), P('tf', 'Filtration time', 1, 480, 1, 60, null, 'min'), P('tdump', 'Dump and reset time', 1, 240, 1, 25, null, 'min'), P('washV', 'Wash volume', 0, 5, 0.1, 1.5, null, 'cake voids'), P('rhoc', 'Cake solids density', 800, 4000, 10, 2500, 'rho'), P('ecake', 'Cake porosity', 0.25, 0.75, 0.01, 0.45, null, '\u2014')],
        compute: v => {
          const mu = v.mu / 1000, dP = v.dP * 1000;
          const alpha = v.alpha * 1e10 * Math.pow(dP / 1e5, v.nc);
          const Rm = v.Rm * 1e10;
          const c = v.conc / 100 * 1000 / (1 - v.conc / 100 * (1 + v.ecake / (1 - v.ecake) * 0));
          const K = mu * alpha * c / (2 * v.A * v.A * dP);
          const B = mu * Rm / (v.A * dP);
          const Vof = t => (-B + Math.sqrt(B * B + 4 * K * t)) / (2 * K);
          const Vf = Vof(v.tf * 60);
          const rate = 1 / (2 * K * Vf + B);
          const rateAvg = Vf / ((v.tf + v.tdump) * 60);
          /* optimum: maximise V/(t+tdump) */
          const topt = self.bis(t => { const V = Vof(t); return 1 / (2 * K * V + B) - V / (t + v.tdump * 60); }, 1, 1e6, 1e-6);
          const Vopt = Vof(topt);
          const solids = c * Vf;
          const cakeVol = solids / (v.rhoc * (1 - v.ecake));
          const cakeTh = cakeVol / v.A;
          const voids = cakeVol * v.ecake;
          const washVol = voids * v.washV;
          const washT = washVol / Math.max(rate, 1e-12) / 60;
          const Pe = 8;
          const washEff = 1 - Math.exp(-1.4 * v.washV) * (1 + 0.4 * v.washV);
          const cycle = v.tf + v.tdump + washT;
          const cap = Vf / (cycle / 60);
          const capOpt = Vopt / ((topt / 60 + v.tdump + washT) / 60);
          const rows = [5, 15, 30, 60, 120, 240].map(t => {
            const V = Vof(t * 60);
            return [String(t), V.toFixed(4), (V / v.A).toFixed(4), ((t * 60) / V).toFixed(2), (1 / (2 * K * V + B) * 3600).toFixed(3), (V / ((t + v.tdump) * 60) * 3600).toFixed(3)];
          });
          return {
            K: K, B: B, Vof: Vof, Vf: Vf, topt: topt, Vopt: Vopt,
            res: [{ l: 'Specific cake resistance at ' + v.dP.toFixed(0) + ' kPa', v: alpha, u: 'm/kg', d: 4 }, { l: 'Compressibility effect', v: Math.pow(dP / 1e5, v.nc), u: '\u00d7', d: 3 }, { l: 'Solids per unit filtrate c', v: c, u: 'kg/m\u00b3', d: 2 }, { l: 'Slope constant K', v: K, u: 's/m\u2076', d: 5 }, { l: 'Intercept constant B', v: B, u: 's/m\u00b3', d: 4 }, { l: 'Filtrate collected', v: Vf, u: 'm\u00b3', d: 4 }, { l: 'Filtrate per unit area', v: Vf / v.A, u: 'm\u00b3/m\u00b2', d: 4 }, { l: 'Instantaneous rate at the end', v: rate * 3600, u: 'm\u00b3/h', d: 4 }, { l: 'Rate at the start', v: 1 / B * 3600, u: 'm\u00b3/h', d: 3 }, { l: 'Rate decay', v: (1 - rate * B) * 100, u: '%', d: 1 }, { l: 'Dry solids collected', v: solids, u: 'kg', d: 2 }, { l: 'Cake volume', v: cakeVol, u: 'm\u00b3', d: 5 }, { l: 'Cake thickness', v: cakeTh * 1000, u: 'mm', d: 3 }, { l: 'Cake void volume', v: voids, u: 'm\u00b3', d: 5 }, { l: 'Wash liquor required', v: washVol, u: 'm\u00b3', d: 5 }, { l: 'Wash time', v: washT, u: 'min', d: 2 }, { l: 'Wash efficiency', v: washEff * 100, u: '%', d: 2 }, { l: 'Solute left in the cake', v: (1 - washEff) * 100, u: '%', d: 3 }, { l: 'Total cycle time', v: cycle, u: 'min', d: 2 }, { l: 'Average throughput', v: cap, u: 'm\u00b3/h', d: 4 }, { l: 'Optimum filtration time', v: topt / 60, u: 'min', d: 2 }, { l: 'Filtrate at the optimum', v: Vopt, u: 'm\u00b3', d: 4 }, { l: 'Throughput at the optimum', v: capOpt, u: 'm\u00b3/h', d: 4 }, { l: 'Gain available', v: (capOpt / Math.max(cap, 1e-12) - 1) * 100, u: '%', d: 2 }, { l: 'Cycle verdict', s: v.tf > topt / 60 * 1.4 ? 'filtering far too long \u2014 dump at about ' + (topt / 60).toFixed(0) + ' min instead' : v.tf < topt / 60 * 0.6 ? 'cycling too fast \u2014 the dump time is being wasted' : 'close to the optimum cycle', u: '' }, { l: 'Cake thickness check', s: cakeTh * 1000 > 40 ? 'cake thicker than most plate-and-frame chambers allow \u2014 shorten the cycle' : cakeTh * 1000 < 3 ? 'a very thin cake \u2014 discharge will be difficult' : 'a practical cake thickness', u: '' }, { l: 'Compressibility note', s: v.nc > 0.5 ? 'a highly compressible cake \u2014 raising the pressure gains almost nothing; use a filter aid' : 'raising the pressure is worth while here', u: '' }, { l: 'Wash verdict', s: washEff < 0.9 ? 'increase the wash to about ' + Math.min(v.washV * 2, 5).toFixed(1) + ' cake voids, or reslurry and refilter' : 'washing is adequate', u: '' }],
            table: { title: 'Filtration progress and the cycle economics', head: ['t  min', 'V  m\u00b3', 'V/A  m\u00b3/m\u00b2', 't/V  s/m\u00b3', 'rate  m\u00b3/h', 'cycle average  m\u00b3/h'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          const Vmax = r.Vof(Math.max(v.tf * 60, r.topt) * 2.2);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: Vmax, ymin: 0, ymax: (2 * r.K * Vmax + r.B) * 1.15, ml: 74, mb: 18, mt: 32 });
          g.grid('', 't / V   s/m\u00b3');
          g.title('The Ruth plot \u2014 slope gives the cake, intercept gives the cloth');
          g.fn(V => V > 0 ? r.K * V + r.B : r.B, C.acc, 2.8, null, 200);
          g.cross(0, r.B, C.warn, 8);
          g.dot(r.Vf, r.K * r.Vf + r.B, C.dk, 5);
          if (g.w > 300) g.txt('intercept = \u03bcR_m/A\u0394P', Vmax * 0.03, r.B * 1.4 + (2 * r.K * Vmax) * 0.03, C.warn, 'left', 11.5);
          g.legend([{ c: C.acc, l: 't/V against V' }]);
          const tmax = Math.max(v.tf, r.topt / 60) * 2.2;
          let cmax = 0;
          for (let i = 1; i <= 100; i++) { const t = tmax * i / 100; cmax = Math.max(cmax, r.Vof(t * 60) / ((t + v.tdump) * 60) * 3600); }
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: tmax, ymin: 0, ymax: cmax * 1.15, ml: 74, mt: 12, mb: 46 });
          g2.grid('Filtration time  min', 'Cycle-average throughput  m\u00b3/h', 5, 4);
          g2.fn(t => t > 0 ? r.Vof(t * 60) / ((t + v.tdump) * 60) * 3600 : 0, C.dk, 2.8, null, 200);
          g2.line([[r.topt / 60, 0], [r.topt / 60, cmax * 1.15]], C.warn, 1.5, [5, 4]);
          g2.dot(v.tf, r.Vof(v.tf * 60) / ((v.tf + v.tdump) * 60) * 3600, C.acc, 5.5);
          if (g2.w > 300) g2.txt('optimum', r.topt / 60, cmax * 1.05, C.warn, 'center', 11.5);
        }
      },
      {
        id: 'dryer', num: 'G-06', sec: S, name: 'Rotary dryer sizing',
        blurb: 'Drying is heat transfer limited by mass transfer, and the two happen in series along a rotating shell. The constant-rate period is controlled by the air, the falling-rate period by diffusion in the solid, and the length of a dryer is essentially the length needed to get through the falling-rate period \u2014 which is why the critical moisture content matters more than the total.',
        howto: 'Watch the drying curve. The constant-rate section is short and cheap; everything after the critical moisture is slow and expensive, and halving the final moisture roughly doubles the residence time. Then check the gas velocity: too low and the dryer is enormous, too high and the fines blow out of the discharge end. The volumetric heat transfer coefficient is the sizing number that matters, and it is almost entirely a function of gas mass flux, which is why rotary dryers all run near the dusting limit.',
        std: 'Perry\u2019s, 9th ed., Sec. 12; McCormick in Perry\u2019s for U_v; Coulson & Richardson Vol. 2, Ch. 16; Mujumdar, Handbook of Industrial Drying',
        eqs: [['U_va = \\frac{237\\,G^{0.67}}{D}', 'volumetric heat transfer coefficient, W/m\u00b3K'], ['V = \\frac{Q}{U_va\\,\\Delta T_{lm}}', 'dryer volume from the duty'], ['N_t = \\ln\\frac{T_{g1}-T_{s1}}{T_{g2}-T_{s2}}', 'number of transfer units the dryer must provide'], ['\\theta = \\frac{0.23L}{S\\,N^{0.9}D} \\pm \\frac{0.6BLG}{F}', 'Friedman\u2013Marshall residence time']],
        notes: ['Countercurrent rotary dryer, direct-fired; a co-current unit is gentler on heat-sensitive solids and needs more volume.',
          'Volumetric coefficient from the McCormick correlation \u2014 it carries a factor-of-two uncertainty.',
          'Falling-rate period assumed to be diffusion controlled with a linear approach to equilibrium.',
          'The gas mass flux is limited by dusting: about 3.5 kg/m\u00b2s for a fine solid, 5 for granules.'],
        params: [PF('F', 'Wet solids feed', 100, 200000, 100, 5000, 'M'), P('X1', 'Inlet moisture', 2, 200, 0.5, 35, null, '% dry basis'), P('X2', 'Outlet moisture', 0.05, 50, 0.05, 2, null, '% dry basis'), P('Xc', 'Critical moisture', 1, 60, 0.5, 12, null, '% dry basis'), P('Xe', 'Equilibrium moisture', 0, 10, 0.1, 0.5, null, '% dry basis'), P('Tg1', 'Gas inlet temperature', 60, 800, 5, 350, 'T'), P('Tg2', 'Gas outlet temperature', 40, 300, 5, 90, 'T'), P('Ts1', 'Solids inlet temperature', 0, 100, 1, 20, 'T'), P('Ts2', 'Solids outlet temperature', 20, 250, 1, 70, 'T'), P('G', 'Gas mass flux', 0.5, 6, 0.1, 2.5, null, 'kg/m\u00b2s'), P('cps', 'Solids heat capacity', 0.6, 2.5, 0.05, 1.05, null, 'kJ/kg\u00b7K'), P('slope', 'Shell slope', 0, 6, 0.1, 3, null, '%'), P('N', 'Rotational speed', 1, 12, 0.5, 4, null, 'rpm')],
        compute: v => {
          const dry = v.F / (1 + v.X1 / 100);
          const W1 = dry * v.X1 / 100, W2 = dry * v.X2 / 100;
          const evap = W1 - W2;
          const lam = 2450 - 2.3 * (v.Tg2 - 40);
          const Qevap = evap * lam / 3600;
          const Qsens = dry * v.cps * (v.Ts2 - v.Ts1) / 3600 + W2 * 4.18 * (v.Ts2 - v.Ts1) / 3600;
          const Qtot = (Qevap + Qsens) / 0.9;
          const dT1 = v.Tg1 - v.Ts2, dT2 = v.Tg2 - v.Ts1;
          const dTlm = Math.abs(dT1 - dT2) < 1e-6 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);
          const Nt = Math.log(dT1 / dT2);
          const cpg = 1.05;
          const Gair = Qtot * 1000 / (cpg * (v.Tg1 - v.Tg2)) ;
          const A = Gair / v.G;
          const D = Math.sqrt(4 * A / Math.PI);
          const Uva = 237 * Math.pow(v.G, 0.67) / Math.max(D, 0.1);
          const V = Qtot * 1000 / (Uva * dTlm);
          const L = V / A;
          const LD = L / D;
          const hold = 0.08;
          const theta = 0.23 * L / (v.slope / 100 * 100 * Math.pow(v.N, 0.9) * D) * 60 - 0.6 * 0;
          const thetaF = Math.max(0.23 * L / ((v.slope) * Math.pow(v.N, 0.9) * D), 0.1);
          const massHold = hold * V * 800;
          const XcF = v.Xc, Xf = v.X2;
          const tConst = (v.X1 - v.Xc) / Math.max(v.X1 - v.Xe, 1e-6);
          const tFall = Math.log(Math.max((v.Xc - v.Xe) / Math.max(v.X2 - v.Xe, 1e-6), 1.0001));
          const fracFall = tFall / (tConst + tFall);
          const rows = [];
          const Rc = 1;
          for (let i = 0; i <= 8; i++) {
            const X = v.X1 - (v.X1 - v.X2) * i / 8;
            const rate = X > v.Xc ? 1 : Math.max((X - v.Xe) / Math.max(v.Xc - v.Xe, 1e-6), 0.001);
            rows.push([X.toFixed(2), rate.toFixed(4), X > v.Xc ? 'constant rate' : 'falling rate', (dry * (v.X1 - X) / 100).toFixed(1)]);
          }
          return {
            D: D, L: L, V: V, Uva: Uva, dTlm: dTlm, Xc: v.Xc, Xe: v.Xe,
            res: [{ l: 'Bone-dry solids', v: dry, u: 'kg/h', d: 1 }, { l: 'Water evaporated', v: evap, u: 'kg/h', d: 2 }, { l: 'Latent heat used', v: lam, u: 'kJ/kg', d: 1 }, { l: 'Evaporation duty', v: Qevap, u: 'kW', d: 2 }, { l: 'Sensible duty', v: Qsens, u: 'kW', d: 2 }, { l: 'Total heat load (90 % efficient)', v: Qtot, u: 'kW', d: 2 }, { l: 'Air mass flow required', v: Gair, u: 'kg/h', d: 0 }, { l: 'Air / solids ratio', v: Gair / dry, u: 'kg/kg', d: 3 }, { l: 'Log-mean temperature difference', v: dTlm, u: 'K', d: 2 }, { l: 'Transfer units provided', v: Nt, u: '\u2014', d: 3 }, { l: 'Cross-sectional area', v: A, u: 'm\u00b2', d: 4 }, { l: 'Shell diameter', v: D, u: 'm', d: 3 }, { l: 'Volumetric coefficient U_v a', v: Uva, u: 'W/m\u00b3K', d: 1 }, { l: 'Dryer volume', v: V, u: 'm\u00b3', d: 3 }, { l: 'Shell length', v: L, u: 'm', d: 3 }, { l: 'Length / diameter ratio', v: LD, u: '\u2014', d: 2 }, { l: 'Solids hold-up', v: massHold, u: 'kg', d: 0 }, { l: 'Residence time (Friedman\u2013Marshall)', v: thetaF, u: 'min', d: 2 }, { l: 'Peripheral speed', v: Math.PI * D * v.N / 60, u: 'm/s', d: 4 }, { l: 'Fraction of the time in falling rate', v: fracFall * 100, u: '%', d: 1 }, { l: 'Specific evaporation', v: evap / V, u: 'kg/m\u00b3h', d: 2 }, { l: 'Specific heat consumption', v: Qtot * 3600 / Math.max(evap, 1e-9), u: 'kJ/kg water', d: 0 }, { l: 'Thermal efficiency', v: Qevap / Qtot * 100, u: '%', d: 1 }, { l: 'Aspect-ratio check', s: LD < 4 ? 'too short \u2014 rotary dryers run 4 to 10 L/D; increase the length' : LD > 12 ? 'too long \u2014 support and alignment become difficult; use a larger diameter' : 'in the normal 4\u201310 range', u: '' }, { l: 'Dusting check', s: v.G > 4 ? 'gas flux too high \u2014 fines will be carried out; add a cyclone or reduce the flux' : v.G < 1 ? 'very low flux \u2014 the dryer will be uneconomically large' : 'acceptable gas loading', u: '' }, { l: 'Falling-rate warning', s: v.X2 < v.Xe * 1.5 ? 'target moisture is near the equilibrium value \u2014 drying time approaches infinity' : fracFall > 0.7 ? 'most of the dryer is doing falling-rate drying; a two-stage dryer would be smaller' : 'a balanced drying duty', u: '' }],
            table: { title: 'Drying rate through the dryer', head: ['X  % dry basis', 'relative rate', 'period', 'water removed  kg/h'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.X1 * 1.1, ymin: 0, ymax: 1.2, ml: 70 });
          g.grid('Moisture content  X   % dry basis', 'Relative drying rate');
          g.title('Drying-rate curve \u2014 the falling-rate period sets the length');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(v.Xc) - g.x, g.h); ctx.restore(); });
          g.line([[v.Xc, 0], [v.Xc, 1.2]], C.warn, 1.6, [5, 4]);
          g.line([[v.Xe, 0], [v.Xe, 1.2]], C.mid, 1.3, [3, 3]);
          const pts = [];
          for (let i = 0; i <= 200; i++) {
            const X = v.X1 * 1.1 * i / 200;
            pts.push([X, X > v.Xc ? 1 : Math.max((X - v.Xe) / Math.max(v.Xc - v.Xe, 1e-6), 0)]);
          }
          g.line(pts, C.acc, 3);
          g.dot(v.X1, 1, C.dk, 5); g.dot(v.X2, v.X2 > v.Xc ? 1 : Math.max((v.X2 - v.Xe) / Math.max(v.Xc - v.Xe, 1e-6), 0), C.warn, 5.5);
          if (g.w > 320) {
            g.txt('falling rate', v.Xc * 0.5, 1.12, C.mid, 'center', 11.5);
            g.txt('constant rate', (v.Xc + v.X1) / 2, 1.09, C.mid, 'center', 11.5);
            g.txt('X_c', v.Xc, 0.04, C.warn, 'center', 11.5);
            g.txt('X_e', v.Xe, 0.04, C.mid, 'center', 11);
          }
          g.legend([{ c: C.acc, l: 'drying rate' }, { c: C.dk, l: 'inlet' }, { c: C.warn, l: 'outlet' }]);
        }
      },
      {
        id: 'flare', num: 'G-07', sec: S, name: 'Flare & vent stack sizing',
        blurb: 'A flare is the last line of defence, and it is sized for the worst thing the plant can do in one moment. The tip diameter comes from the exit Mach number, the height from the radiation a person at the fence can tolerate, and the flame tilt from the wind \u2014 which is what usually decides the height, because a flame blown sideways puts its radiation somewhere nobody planned for.',
        howto: 'Set the relief load and read the height. The radiation criterion is the binding one: 4.73 kW/m\u00b2 for a few seconds of escape, 1.58 kW/m\u00b2 for continuous exposure at the fence, and the difference between them is often twenty metres of stack. Then add wind and watch the flame tilt: the radiation centre moves downwind and the required height rises. The Mach-number check at the tip is the other constraint \u2014 above about 0.5 the flame becomes unstable and noisy, and above 0.8 it will blow out.',
        std: 'API 521, 7th ed., \u00a77; API 537 for flare tips; Brzustowski & Sommer flame-length correlation; Kent (1964)',
        eqs: [['d_{tip} = \\sqrt{\\frac{4W}{\\pi\\rho u}},\\qquad Ma = \\frac{u}{\\sqrt{kRT/M}}', 'tip diameter from the allowable exit Mach number'], ['K = \\frac{\\tau F Q}{4\\pi D^{2}}', 'radiation received \u2014 D is the distance from the flame centre'], ['L_f = 0.00286\\,Q^{0.478}', 'flame length from the heat release, m and W'], ['\\Delta x = L_f\\sin\\theta,\\quad \\Delta y = L_f\\cos\\theta,\\qquad \\tan\\theta = f(u_{wind}/u_{exit})', 'flame tilt in wind']],
        notes: ['API 521 simple radiation model with a fraction of heat radiated F and an atmospheric transmissivity \u03c4.',
          'Flame centre taken at the midpoint of the tilted flame, which is the API 521 recommendation.',
          'Solar radiation must be added to the calculated flux for the total on a person: about 1 kW/m\u00b2.',
          'Sonic flares (Mach 1 tips) are sized differently and are outside this module.'],
        params: [PF('W', 'Relief load', 100, 2000000, 100, 50000, 'M'), P('M', 'Molar mass', 2, 120, 0.5, 30, null, 'g/mol'), P('T', 'Relief temperature', -50, 400, 5, 60, 'T'), P('LHV', 'Lower heating value', 5000, 60000, 100, 46000, null, 'kJ/kg'), P('Ma', 'Design exit Mach number', 0.05, 0.85, 0.01, 0.5, null, '\u2014'), P('F', 'Fraction of heat radiated', 0.1, 0.4, 0.01, 0.2, null, '\u2014'), P('tau', 'Atmospheric transmissivity', 0.6, 1, 0.01, 0.85, null, '\u2014'), P('Klim', 'Allowable radiation', 1.58, 9.46, 0.01, 4.73, null, 'kW/m\u00b2'), P('R', 'Distance to the observer', 5, 300, 1, 40, 'L'), P('uw', 'Wind speed', 0, 40, 0.5, 8, null, 'm/s'), P('k', 'Ratio of specific heats', 1.05, 1.7, 0.01, 1.25, null, '\u2014')],
        compute: v => {
          const W = v.W / 3600, TK = v.T + 273.15;
          const Rg = 8314 / v.M;
          const sonic = Math.sqrt(v.k * Rg * TK);
          const u = v.Ma * sonic;
          const rho = 101325 * v.M / 1000 / (8.314 * TK);
          const Atip = W / (rho * u);
          const d = Math.sqrt(4 * Atip / Math.PI);
          const dNom = Math.ceil(d * 1000 / 50) * 50;
          const Q = W * v.LHV * 1000;
          const Lf = 0.00286 * Math.pow(Q, 0.478);
          const ratio = v.uw / Math.max(u, 1e-6);
          const tanTh = ratio < 1e-6 ? 0 : Math.min(0.5 + 0.5 * Math.tanh(6 * (ratio - 0.03)), 0.98);
          const th = Math.atan(tanTh * 3);
          const dx = Lf * Math.sin(th) / 2, dy = Lf * Math.cos(th) / 2;
          /* required height so that K at the observer equals the limit */
          const Dreq = Math.sqrt(v.tau * v.F * Q / (4 * Math.PI * v.Klim * 1000));
          const xh = Math.max(v.R - dx, 0);
          const Hreq = Math.max(Math.sqrt(Math.max(Dreq * Dreq - xh * xh, 0)) - dy, 0);
          const Hnom = Math.ceil(Hreq / 3) * 3;
          const Dact = Math.sqrt(Math.pow(v.R - dx, 2) + Math.pow(Hnom + dy, 2));
          const Kact = v.tau * v.F * Q / (4 * Math.PI * Dact * Dact) / 1000;
          const Kground = v.tau * v.F * Q / (4 * Math.PI * (Math.pow(dx, 2) + Math.pow(Hnom + dy, 2))) / 1000;
          const dPtip = 0.5 * rho * u * u * 1.5 / 1000;
          const noise = 17 * Math.log10(W) + 10 * Math.log10(v.LHV / 1000) + 40;
          const rows = [1.58, 3.15, 4.73, 6.31, 9.46].map(K => {
            const Dr = Math.sqrt(v.tau * v.F * Q / (4 * Math.PI * K * 1000));
            const H = Math.max(Math.sqrt(Math.max(Dr * Dr - xh * xh, 0)) - dy, 0);
            const rMin = Dr - dx;
            return [K.toFixed(2), Dr.toFixed(1), H.toFixed(1), rMin.toFixed(1), K === 1.58 ? 'continuous, at the fence' : K === 4.73 ? 'brief exposure, escape possible' : K === 9.46 ? 'instantaneous only' : 'intermediate'];
          });
          return {
            d: d, Lf: Lf, th: th, Hnom: Hnom, dx: dx, dy: dy, Kact: Kact, Q: Q, Dreq: Dreq, xh: xh,
            res: [{ l: 'Relief mass flow', v: W, u: 'kg/s', d: 3 }, { l: 'Sonic velocity at the tip', v: sonic, u: 'm/s', d: 1 }, { l: 'Exit velocity', v: u, u: 'm/s', d: 1 }, { l: 'Gas density at the tip', v: rho, u: 'kg/m\u00b3', d: 4 }, { l: 'Tip flow area', v: Atip, u: 'm\u00b2', d: 5 }, { l: 'Tip diameter required', v: d * 1000, u: 'mm', d: 1 }, { l: 'Next standard tip', v: dNom, u: 'mm', d: 0 }, { l: 'Heat release', v: Q / 1e6, u: 'MW', d: 2 }, { l: 'Flame length', v: Lf, u: 'm', d: 2 }, { l: 'Wind / exit velocity ratio', v: ratio, u: '\u2014', d: 5 }, { l: 'Flame tilt from vertical', v: th * 180 / Math.PI, u: '\u00b0', d: 1 }, { l: 'Horizontal offset of the flame centre', v: dx, u: 'm', d: 2 }, { l: 'Vertical offset of the flame centre', v: dy, u: 'm', d: 2 }, { l: 'Distance needed for ' + v.Klim.toFixed(2) + ' kW/m\u00b2', v: Dreq, u: 'm', d: 2 }, { l: 'Stack height required', v: Hreq, u: 'm', d: 2 }, { l: 'Next standard height', v: Hnom, u: 'm', d: 0 }, { l: 'Radiation at the observer', v: Kact, u: 'kW/m\u00b2', d: 4 }, { l: 'Radiation plus solar', v: Kact + 1, u: 'kW/m\u00b2', d: 4 }, { l: 'Radiation at the stack base', v: Kground, u: 'kW/m\u00b2', d: 4 }, { l: 'Tip pressure drop', v: dPtip, u: 'kPa', d: 3 }, { l: 'Estimated sound level at 30 m', v: noise, u: 'dBA', d: 0 }, { l: 'Mach-number check', s: v.Ma > 0.8 ? 'FLAME BLOW-OFF LIKELY \u2014 reduce the Mach number or use a sonic tip' : v.Ma > 0.5 ? 'high velocity \u2014 expect noise and consider a proprietary tip' : 'stable subsonic flare', u: '' }, { l: 'Radiation check', s: Kact > v.Klim * 1.02 ? 'EXCEEDS the criterion \u2014 raise the stack or move the boundary' : Kact + 1 > v.Klim ? 'the criterion is met only if solar radiation is excluded \u2014 check the basis' : 'within the radiation criterion', u: '' }, { l: 'Height verdict', s: Hnom > 90 ? 'a very tall stack \u2014 consider a ground flare or a wider exclusion zone' : Hnom < 10 ? 'a short stack \u2014 check that no elevated platform is within the radiation circle' : 'a conventional elevated flare', u: '' }, { l: 'Wind effect', s: v.uw > u * 0.05 ? 'the flame is tilting appreciably \u2014 the downwind radiation centre governs the height' : 'nearly vertical flame', u: '' }],
            table: { title: 'API 521 radiation criteria and the stack height each demands', head: ['K  kW/m\u00b2', 'distance  m', 'height  m', 'min. clear radius  m', 'basis'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const xm = Math.max(v.R * 1.35, r.Dreq * 1.1, 30);
          const ym = Math.max(r.Hnom + r.Lf * 1.3, xm * 0.7);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -xm * 0.12, xmax: xm, ymin: 0, ymax: ym, ml: 62 });
          g.grid('Downwind distance from the stack  m', 'Elevation  m');
          g.title('Flare geometry and the radiation circles');
          g.clip(() => {
            ctx.save();
            const cx = g.X(r.dx), cy = g.Y(r.Hnom + r.dy);
            [1.58, 4.73, 9.46].forEach(K => {
              const D = Math.sqrt(v.tau * v.F * r.Q / (4 * Math.PI * K * 1000));
              ctx.strokeStyle = K === v.Klim ? C.warn : 'rgba(29,31,32,0.16)';
              ctx.lineWidth = K === v.Klim ? 2 : 1.2;
              ctx.setLineDash(K === v.Klim ? [] : [5, 4]);
              ctx.beginPath(); ctx.arc(cx, cy, Math.abs(g.X(D) - g.X(0)), 0, 7); ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.strokeStyle = C.dk; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(0)); ctx.lineTo(g.X(0), g.Y(r.Hnom)); ctx.stroke();
            ctx.strokeStyle = C.acc; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(g.X(0), g.Y(r.Hnom));
            ctx.lineTo(g.X(r.Lf * Math.sin(r.th)), g.Y(r.Hnom + r.Lf * Math.cos(r.th))); ctx.stroke();
            ctx.lineCap = 'butt';
            ctx.restore();
          });
          g.dot(r.dx, r.Hnom + r.dy, C.warn, 5);
          g.line([[-xm * 0.12, 0], [xm, 0]], C.dk, 2);
          g.cross(v.R, 1.7, C.dk, 8);
          if (g.w > 320) {
            g.txt('observer', v.R, 4.5, C.dk, 'center', 11.5);
            g.txt(v.Klim.toFixed(2) + ' kW/m\u00b2', r.dx + r.Dreq * 0.7, r.Hnom + r.dy + r.Dreq * 0.7, C.warn, 'left', 11);
            g.txt('H = ' + r.Hnom.toFixed(0) + ' m', 1, r.Hnom * 0.5, C.dk, 'left', 11.5);
          }
          g.legend([{ c: C.acc, l: 'flame' }, { c: C.warn, l: 'design radiation circle' }, { c: 'rgba(29,31,32,0.16)', l: '1.58 and 9.46 kW/m\u00b2', d: [5, 4] }]);
        }
      },
      {
        id: 'evapmulti', num: 'G-08', sec: S, name: 'Multiple-effect evaporator train',
        blurb: 'An evaporator is a device for spending steam, and the only way to spend less is to use the vapour from one effect as the heating medium for the next. Each effect added roughly divides the steam bill and roughly multiplies the capital cost, and the boiling-point elevation of the liquor is what eventually stops you adding more.',
        howto: 'Add effects and watch the steam economy climb while the temperature driving force per effect collapses. The available \u0394T is fixed by the steam and the condenser; every effect shares it, so at five or six effects each one has only a few kelvin to work with and the area becomes enormous. Boiling-point elevation makes it worse because it eats the driving force without contributing anything. The optimum for most duties is three or four effects, and the plot shows exactly where the curves cross.',
        std: 'Perry\u2019s, 9th ed., Sec. 11; Coulson & Richardson Vol. 2, Ch. 14; Billet, Evaporation Technology; Minton, Handbook of Evaporation Technology',
        eqs: [['\\text{economy} \\approx 0.9\\,n_{eff}', 'kilograms evaporated per kilogram of steam'], ['\\sum_{i}\\Delta T_i = T_{steam} - T_{cond} - \\sum_i BPE_i', 'the available driving force, less the elevations'], ['A_i = \\frac{Q_i}{U_i\\Delta T_i},\\qquad \\text{equal areas by convention}', 'each effect sized on its own duty'], ['BPE = 0.512\\,m\\,i\\ \\text{(K, molal)}', 'boiling-point elevation from the dissolved solids']],
        notes: ['Forward feed, which is the usual arrangement and the cheapest when the feed is hot.',
          'Overall coefficients fall down the train because the liquor gets more viscous; the module applies a standard taper.',
          'Boiling-point elevation grows with concentration, so the last effect suffers most.',
          'Vapour recompression is not modelled; a single-stage thermocompressor is worth roughly one extra effect.'],
        params: [PF('F', 'Feed rate', 500, 500000, 100, 20000, 'M'), P('xF', 'Feed solids', 1, 40, 0.5, 8, null, '% by mass'), P('xP', 'Product solids', 5, 75, 0.5, 45, null, '% by mass'), P('n', 'Number of effects', 1, 6, 1, 3, null, '\u2014'), P('Tsteam', 'Steam temperature', 100, 200, 1, 140, 'T'), P('Tcond', 'Condenser temperature', 30, 90, 1, 45, 'T'), P('TF', 'Feed temperature', 15, 140, 1, 80, 'T'), P('U1', 'First-effect coefficient', 800, 3500, 50, 2200, 'U'), P('taper', 'Coefficient taper per effect', 0, 40, 1, 18, null, '%'), P('cpF', 'Feed heat capacity', 2.5, 4.3, 0.05, 3.9, null, 'kJ/kg\u00b7K'), P('bpe', 'Boiling-point elevation at product strength', 0, 25, 0.5, 6, null, 'K'), P('costA', 'Installed cost per unit area', 200, 5000, 50, 1200, null, '$/m\u00b2'), P('costS', 'Steam cost', 5, 60, 0.5, 22, null, '$/t')],
        compute: v => {
          const n = Math.round(v.n);
          const solids = v.F * v.xF / 100;
          const Pr = solids / (v.xP / 100);
          const Etot = v.F - Pr;
          const bpeTot = v.bpe * (n + 1) / 2 * 0.85;
          const dTav = Math.max(v.Tsteam - v.Tcond - bpeTot, 1);
          const Us = [], dTs = [], As = [], Es = [];
          let sumInvU = 0;
          for (let i = 0; i < n; i++) { Us.push(v.U1 * Math.pow(1 - v.taper / 100, i)); sumInvU += 1 / Us[i]; }
          for (let i = 0; i < n; i++) dTs.push(dTav * (1 / Us[i]) / sumInvU);
          const lam = 2300;
          const Eeach = Etot / n;
          let Qtot = 0;
          for (let i = 0; i < n; i++) {
            const Q = Eeach * lam / 3600 + (i === 0 ? v.F * v.cpF * Math.max(v.Tsteam - dTs[0] - v.TF, 0) / 3600 : 0);
            Qtot += Q;
            As.push(Q * 1000 / (Us[i] * dTs[i]));
            Es.push(Eeach);
          }
          const Atot = As.reduce((p, q) => p + q, 0);
          const Aeq = Atot / n;
          const econ = 0.9 * n;
          const steam = Etot / econ;
          const capital = Atot * v.costA;
          const steamCost = steam / 1000 * v.costS * 8000;
          const rows = [];
          for (let N = 1; N <= 6; N++) {
            const bt = v.bpe * (N + 1) / 2 * 0.85;
            const dt = Math.max(v.Tsteam - v.Tcond - bt, 0.5);
            let si = 0; const uu = [];
            for (let i = 0; i < N; i++) { uu.push(v.U1 * Math.pow(1 - v.taper / 100, i)); si += 1 / uu[i]; }
            let a = 0;
            for (let i = 0; i < N; i++) { const dti = dt * (1 / uu[i]) / si; a += (Etot / N * lam / 3600) * 1000 / (uu[i] * dti); }
            const st = Etot / (0.9 * N);
            rows.push([String(N), dt.toFixed(1), (dt / N).toFixed(2), a.toFixed(1), (0.9 * N).toFixed(2), st.toFixed(0), (a * v.costA / 1000).toFixed(0), (st / 1000 * v.costS * 8000 / 1000).toFixed(0), ((a * v.costA / 5 + st / 1000 * v.costS * 8000) / 1000).toFixed(0)]);
          }
          let best = 1, bestC = 1e30;
          rows.forEach(r2 => { const c = parseFloat(r2[8]); if (c < bestC) { bestC = c; best = parseInt(r2[0], 10); } });
          return {
            As: As, dTs: dTs, Us: Us, Atot: Atot, rows: rows, best: best, Etot: Etot,
            res: [{ l: 'Solids in the feed', v: solids, u: 'kg/h', d: 1 }, { l: 'Product rate', v: Pr, u: 'kg/h', d: 1 }, { l: 'Total water evaporated', v: Etot, u: 'kg/h', d: 1 }, { l: 'Concentration ratio', v: v.xP / v.xF, u: '\u00d7', d: 3 }, { l: 'Total boiling-point elevation', v: bpeTot, u: 'K', d: 2 }, { l: 'Available driving force', v: dTav, u: 'K', d: 2 }, { l: 'Driving force per effect (mean)', v: dTav / n, u: 'K', d: 3 }, { l: 'First-effect \u0394T', v: dTs[0], u: 'K', d: 3 }, { l: 'Last-effect \u0394T', v: dTs[n - 1], u: 'K', d: 3 }, { l: 'First-effect coefficient', v: Us[0], u: 'W/m\u00b2K', d: 0 }, { l: 'Last-effect coefficient', v: Us[n - 1], u: 'W/m\u00b2K', d: 0 }, { l: 'Total heat duty', v: Qtot, u: 'kW', d: 1 }, { l: 'Total heat transfer area', v: Atot, u: 'm\u00b2', d: 2 }, { l: 'Area per effect (equal-area design)', v: Aeq, u: 'm\u00b2', d: 2 }, { l: 'Steam economy', v: econ, u: 'kg/kg', d: 3 }, { l: 'Steam consumption', v: steam, u: 'kg/h', d: 1 }, { l: 'Specific steam consumption', v: steam / Etot, u: 'kg/kg water', d: 4 }, { l: 'Installed cost of the exchangers', v: capital, u: '$', d: 0 }, { l: 'Annual steam cost (8000 h)', v: steamCost, u: '$/y', d: 0 }, { l: 'Total annualised cost', v: capital / 5 + steamCost, u: '$/y', d: 0 }, { l: 'Economic optimum', s: best + ' effect(s) \u2014 lowest annualised cost at these prices', u: '' }, { l: 'Driving-force check', s: dTs[n - 1] < 5 ? 'the last effect has almost no driving force \u2014 remove an effect' : dTs[n - 1] < 8 ? 'the last effect is tight; check the boiling-point elevation carefully' : 'every effect has a workable \u0394T', u: '' }, { l: 'Elevation check', s: bpeTot > (v.Tsteam - v.Tcond) * 0.4 ? 'boiling-point elevation is consuming most of the driving force \u2014 fewer effects, or forced circulation' : 'elevation is manageable', u: '' }, { l: 'Recommendation', s: n === best ? 'this is the economic optimum' : n < best ? 'add ' + (best - n) + ' effect(s) \u2014 the steam saving pays for the area' : 'remove ' + (n - best) + ' effect(s) \u2014 the extra area no longer pays for itself', u: '' }],
            table: { title: 'One to six effects at the same duty', head: ['Effects', '\u0394T available  K', '\u0394T each  K', 'area  m\u00b2', 'economy', 'steam  kg/h', 'capital  k$', 'steam  k$/y', 'annualised  k$/y'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          let amax = 0, cmax = 0;
          r.rows.forEach(row => { amax = Math.max(amax, parseFloat(row[3])); cmax = Math.max(cmax, parseFloat(row[8])); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0.6, xmax: 6.4, ymin: 0, ymax: amax * 1.15, ml: 72, mb: 18, mt: 32 });
          g.grid('', 'Total area  m\u00b2', 6, 5);
          g.title('Effects against area and cost \u2014 where adding an effect stops paying');
          g.line(r.rows.map(row => [parseFloat(row[0]), parseFloat(row[3])]), C.acc, 2.8);
          r.rows.forEach(row => g.dot(parseFloat(row[0]), parseFloat(row[3]), C.acc, 4.4));
          g.dot(Math.round(v.n), r.Atot, C.warn, 6);
          g.legend([{ c: C.acc, l: 'heat transfer area' }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0.6, xmax: 6.4, ymin: 0, ymax: cmax * 1.2, ml: 72, mt: 12, mb: 46 });
          g2.grid('Number of effects', 'Annualised cost  k$/y', 6, 4);
          g2.line(r.rows.map(row => [parseFloat(row[0]), parseFloat(row[7])]), C.mid, 1.8, [6, 3]);
          g2.line(r.rows.map(row => [parseFloat(row[0]), parseFloat(row[6]) / 5]), C.lt, 1.8, [3, 3]);
          g2.line(r.rows.map(row => [parseFloat(row[0]), parseFloat(row[8])]), C.dk, 2.8);
          r.rows.forEach(row => g2.dot(parseFloat(row[0]), parseFloat(row[8]), C.dk, 4.2));
          g2.dot(r.best, parseFloat(r.rows[r.best - 1][8]), C.warn, 6);
          g2.legend([{ c: C.dk, l: 'total' }, { c: C.mid, l: 'steam', d: [6, 3] }, { c: C.lt, l: 'capital / 5', d: [3, 3] }]);
        }
      }
    ];
  }

  /* ══ FLUIDISATION & PACKED BEDS ═══════════════════════════ */
