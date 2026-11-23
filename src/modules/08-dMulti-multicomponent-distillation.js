  dMulti() {
    const self = this, C = this.C;
    const S = 'Multicomponent Distillation';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const Rg = 8.314;
    const NAMES = ['A \u2014 lightest', 'B \u2014 light key', 'C \u2014 heavy key', 'D \u2014 heaviest'];

    /* feed assembly: four components, normalised */
    const feed = v => {
      const z = [v.zA, v.zB, v.zC, v.zD], a = [v.aA, v.aB, v.aC, v.aD];
      const s = z.reduce((p, q) => p + q, 0) || 1;
      return { z: z.map(q => q / s), a: a, lk: 1, hk: 2 };
    };
    /* bubble-point temperature from the reference Clausius–Clapeyron K */
    const mkT = v => {
      const TbK = v.Tb + 273.15, C2 = v.dHv * 1000 / Rg;
      return {
        K: T => Math.exp(C2 * (1 / TbK - 1 / (T + 273.15))),
        Tof: Kv => 1 / (1 / TbK - Math.log(Kv) / C2) - 273.15
      };
    };
    const bubT = (x, a, tf) => { let s = 0; for (let i = 0; i < x.length; i++) s += a[i] * x[i]; return tf.Tof(1 / Math.max(s, 1e-12)); };
    const yFromX = (x, a) => { const s = x.reduce((p, q, i) => p + q * a[i], 0); return x.map((q, i) => q * a[i] / s); };
    const xFromY = (y, a) => { const s = y.reduce((p, q, i) => p + q / a[i], 0); return y.map((q, i) => (q / a[i]) / s); };

    /* Fenske / Underwood / Gilliland core, shared by several modules */
    const fug = (f, rLK, rHK, R, q) => {
      const z = f.z, a = f.a, lk = f.lk, hk = f.hk;
      const alk = a[lk] / a[hk];
      const dLK = z[lk] * rLK, bLK = z[lk] - dLK;
      const bHK = z[hk] * rHK, dHK = z[hk] - bHK;
      const Nmin = Math.log((dLK / bLK) * (bHK / dHK)) / Math.log(alk);
      /* Hengstebeck–Geddes distribution of the non-keys */
      const Cc = Nmin, Aa = Math.log10(dHK / bHK) - Cc * Math.log10(a[hk] / a[hk]);
      const db = a.map(ai => Math.pow(10, Aa + Cc * Math.log10(ai / a[hk])));
      const d = z.map((zi, i) => zi * db[i] / (1 + db[i]));
      const b = z.map((zi, i) => zi - d[i]);
      const D = d.reduce((p, x) => p + x, 0), B = 1 - D;
      const xD = d.map(x => x / Math.max(D, 1e-12)), xB = b.map(x => x / Math.max(B, 1e-12));
      /* Underwood roots between adjacent volatilities */
      const g = th => a.reduce((p, ai, i) => p + ai * z[i] / (ai - th), 0) - (1 - q);
      const sorted = a.slice().sort((p, r2) => r2 - p);
      const roots = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const hi = sorted[i] - 1e-7, lo = sorted[i + 1] + 1e-7;
        if (lo >= hi) continue;
        const r2 = self.bis(g, lo, hi, 1e-11);
        if (isFinite(r2)) roots.push(r2);
      }
      const thKey = roots.filter(t => t < a[lk] && t > a[hk]);
      const th = thKey.length ? thKey[0] : (roots.length ? roots[0] : NaN);
      const Rmin = a.reduce((p, ai, i) => p + ai * xD[i] / (ai - th), 0) - 1;
      const X = (R - Rmin) / (R + 1);
      const Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));
      const N = (Y + Nmin) / (1 - Y);
      const NrNs = Math.pow((z[hk] / z[lk]) * Math.pow(xB[lk] / xD[hk], 2) * (B / D), 0.206);
      const Nr = N * NrNs / (1 + NrNs);
      return { Nmin: Nmin, d: d, b: b, D: D, B: B, xD: xD, xB: xB, db: db, roots: roots, th: th, Rmin: Rmin, X: X, Y: Y, N: N, Nfeed: N - Nr, Nr: Nr, alk: alk, Aa: Aa, Cc: Cc };
    };

    const FP = [P('zA', 'Feed z_A', 0, 1, 0.01, 0.15, null, '\u2014'), P('zB', 'Feed z_B (light key)', 0, 1, 0.01, 0.35, null, '\u2014'), P('zC', 'Feed z_C (heavy key)', 0, 1, 0.01, 0.35, null, '\u2014'), P('zD', 'Feed z_D', 0, 1, 0.01, 0.15, null, '\u2014'), P('aA', 'Volatility \u03b1_A', 1, 12, 0.05, 4, null, '\u2014'), P('aB', 'Volatility \u03b1_B', 1, 8, 0.05, 2.4, null, '\u2014'), P('aC', 'Volatility \u03b1_C (reference)', 1, 1, 0.01, 1, null, '\u2014'), P('aD', 'Volatility \u03b1_D', 0.05, 1, 0.01, 0.45, null, '\u2014')];

    return [
      {
        id: 'sorel', num: 'M-01', sec: S, name: 'Sorel & Lewis plate-to-plate design',
        blurb: 'Before McCabe and Thiele found the graphical shortcut, Sorel solved distillation the honest way: a mass balance and an energy balance on every plate, integrated down the column. Lewis showed that if the two components have equal molar latent heats the energy balances collapse and the flows become constant. This runs both and shows what the assumption costs.',
        howto: 'With the latent-heat ratio at 1.0 the two constructions coincide exactly \u2014 that is Lewis\u2019s theorem. Push the ratio away from 1 and the Sorel operating line curves: vapour flow changes from plate to plate because condensing a mole of the heavy component releases more heat than a mole of the light one. For close-boiling hydrocarbons the error is under a stage; for water\u2013alcohol systems it is several, which is why rigorous energy balances were never really optional.',
        std: 'Sorel (1893); Lewis, Ind. Eng. Chem. 14 (1922) 492; King, Separation Processes, 2nd ed., Ch. 8; Treybal, Mass-Transfer Operations, 3rd ed., Ch. 9',
        eqs: [['V_{n+1}y_{n+1} = L_nx_n + Dx_D', 'component balance across the rectifying envelope'], ['V_{n+1}H_{n+1} = L_nh_n + Dh_D + Q_C', 'enthalpy balance \u2014 what Lewis discarded'], ['V_{n+1}\\bar\\lambda_{n+1} = V_n\\bar\\lambda_n,\\quad \\bar\\lambda = y\\lambda_1 + (1-y)\\lambda_2', 'constant heat flow approximation to Sorel'], ['\\lambda_1 = \\lambda_2 \\Rightarrow L_n = L,\\ V_n = V', 'the Lewis constant-molal-overflow result']],
        notes: ['Binary, constant relative volatility, total condenser, partial reboiler.', 'Sorel flows updated by the constant-heat-flow rule; enthalpies referenced to saturated liquid.', 'Stepping stops at 200 stages if the specification is unreachable.', 'Feed introduced at the optimum plate \u2014 the one that first crosses the q-line.'],
        params: [P('alp', 'Relative volatility \u03b1', 1.05, 8, 0.05, 2.4, null, '\u2014'), P('xF', 'Feed composition x_F', 0.05, 0.95, 0.01, 0.45, null, '\u2014'), P('xD', 'Distillate x_D', 0.5, 0.999, 0.005, 0.95, null, '\u2014'), P('xB', 'Bottoms x_B', 0.001, 0.4, 0.005, 0.04, null, '\u2014'), P('R', 'Reflux ratio R', 0.2, 15, 0.05, 2, null, '\u2014'), P('q', 'Feed quality q', -0.5, 1.5, 0.05, 1, null, '\u2014'), P('lr', 'Latent heat ratio \u03bb\u2081/\u03bb\u2082', 0.4, 2.5, 0.01, 1, null, '\u2014')],
        compute: v => {
          const al = v.alp;
          const yeq = x => al * x / (1 + (al - 1) * x);
          const xeq = y => y / (al - (al - 1) * y);
          const D = (v.xF - v.xB) / (v.xD - v.xB), B = 1 - D;
          const step = sorel => {
            const stages = [];
            let V = (v.R + 1) * D, L = v.R * D;
            let x = v.xD, y = v.xD, n = 0, feedStage = 0, inStrip = false;
            const Vb = V - (1 - v.q) * 1, Lb = L + v.q * 1;
            const lam = yy => sorel ? (yy * v.lr + (1 - yy) * 1) : 1;
            let lamPrev = lam(v.xD);
            while (n < 200) {
              x = xeq(y);
              stages.push([x, y, n + 1, inStrip]);
              if (x <= v.xB) break;
              n++;
              if (!inStrip) {
                const xq = (v.q === 1) ? v.xF : null;
                const yOpTop = (L * x + D * v.xD) / V;
                const yStrip = ((Lb) * x - B * v.xB) / Vb;
                if (yStrip <= yOpTop) { inStrip = true; feedStage = n; }
              }
              let yn;
              if (!inStrip) {
                if (sorel) { const lc = lam(y); V = V * lamPrev / lc; lamPrev = lc; L = V - D; }
                yn = (L * x + D * v.xD) / V;
              } else {
                let Vs = Vb, Ls = Lb;
                if (sorel) { const lc = lam(y); Vs = Vb * lam(v.xB) / lc; Ls = Vs + B; }
                yn = (Ls * x - B * v.xB) / Vs;
              }
              if (!isFinite(yn) || yn <= 0) break;
              y = Math.min(yn, 0.9999);
            }
            return { stages: stages, N: stages.length, feed: feedStage || stages.length };
          };
          const A = step(false), Bq = step(true);
          const alkm = Math.log((v.xD / (1 - v.xD)) * ((1 - v.xB) / v.xB)) / Math.log(al);
          const th = self.bis(t => al * v.xF / (al - t) + 1 * (1 - v.xF) / (1 - t) - (1 - v.q), 1.0000001, al - 1e-7, 1e-11);
          const Rmin = al * v.xD / (al - th) + (1 - v.xD) / (1 - th) - 1;
          return {
            A: A, B: Bq, yeq: yeq, D: D,
            res: [{ l: 'Distillate rate D / F', v: D, u: '\u2014', d: 4 }, { l: 'Bottoms rate B / F', v: B, u: '\u2014', d: 4 }, { l: 'Minimum stages (Fenske)', v: alkm, u: '\u2014', d: 2 }, { l: 'Minimum reflux (Underwood)', v: Rmin, u: '\u2014', d: 3 }, { l: 'R / R_min', v: v.R / Rmin, u: '\u2014', d: 3 }, { l: 'Lewis (CMO) stages', s: String(A.N), u: '' }, { l: 'Lewis feed stage', s: String(A.feed), u: '' }, { l: 'Sorel (energy balance) stages', s: String(Bq.N), u: '' }, { l: 'Sorel feed stage', s: String(Bq.feed), u: '' }, { l: 'Stage difference', s: (Bq.N - A.N > 0 ? '+' : '') + (Bq.N - A.N) + ' stages', u: '' }, { l: 'CMO assumption', s: Math.abs(v.lr - 1) < 0.05 ? 'exact \u2014 equal latent heats' : Math.abs(Bq.N - A.N) <= 1 ? 'acceptable \u2014 within one stage' : 'not acceptable \u2014 use rigorous enthalpy balances', u: '' }, { l: 'Vapour flow change (Sorel)', v: (v.lr - 1) * 100, u: '% top to bottom', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 62 });
          g.grid('Liquid mole fraction  x', 'Vapour mole fraction  y');
          g.title('Plate-to-plate construction \u2014 Lewis against Sorel');
          g.line([[0, 0], [1, 1]], 'rgba(29,31,32,0.28)', 1.2, [5, 4]);
          g.fn(x => r.yeq(x), C.dk, 2.4);
          const stair = (st, col, lw, dash) => {
            const pts = [];
            st.forEach(s => { pts.push([s[1], s[1]]); pts.push([s[0], s[1]]); });
            g.line(pts, col, lw, dash);
          };
          stair(r.B.stages, C.mid, 1.6, [6, 3]);
          stair(r.A.stages, C.acc, 2, null);
          g.cross(v.xD, v.xD, C.dk, 7); g.cross(v.xB, v.xB, C.dk, 7);
          g.line([[v.xF, 0], [v.xF, r.yeq(v.xF)]], 'rgba(29,31,32,0.16)', 1.1, [4, 4]);
          g.legend([{ c: C.dk, l: 'equilibrium' }, { c: C.acc, l: 'Lewis \u2014 ' + r.A.N + ' stages' }, { c: C.mid, l: 'Sorel \u2014 ' + r.B.N + ' stages', d: [6, 3] }]);
        }
      },
      {
        id: 'lewmat', num: 'M-02', sec: S, name: 'Lewis\u2013Matheson method',
        blurb: 'The classical way to design a multicomponent column: assume how the non-key components distribute, then integrate the stage equations down from the condenser and up from the reboiler until the two profiles meet at the feed. Where they fail to meet tells you the assumed distribution was wrong, and you go round again.',
        howto: 'The key ratio plot is the convergence diagnostic. Both profiles are straight-ish lines on a log scale; the feed stage is where they cross. If they never cross, the reflux is below minimum for this separation. Change the non-key volatilities and watch how little the key profiles move \u2014 that insensitivity is what makes the method work, and it is also why shortcut methods based on the keys alone do so well.',
        std: 'Lewis & Matheson, Ind. Eng. Chem. 24 (1932) 494; King, Separation Processes, Ch. 9; Seader, Henley & Roper, Separation Process Principles, 4th ed., Ch. 10',
        eqs: [['y_{i,n+1} = \\frac{L}{V}x_{i,n} + \\frac{D}{V}x_{i,D}', 'rectifying operating equation, component by component'], ['x_{i,m+1} = \\frac{\\bar V}{\\bar L}y_{i,m} + \\frac{B}{\\bar L}x_{i,B}', 'stripping operating equation, integrated upward'], ['x_{i} = \\frac{y_i/\\alpha_i}{\\sum_j y_j/\\alpha_j}', 'equilibrium stage with constant relative volatility'], ['\\left(\\frac{x_{LK}}{x_{HK}}\\right)_{rect} = \\left(\\frac{x_{LK}}{x_{HK}}\\right)_{strip}', 'the matching condition at the feed plate']],
        notes: ['Constant relative volatility referenced to the heavy key; constant molal overflow.', 'Non-key distributions initialised from the Hengstebeck\u2013Geddes correlation at N_min.', 'Total condenser and partial reboiler.', 'Integration truncated at 120 stages per section.'],
        params: FP.concat([P('rLK', 'Light-key recovery in distillate', 0.5, 0.999, 0.001, 0.98, null, '\u2014'), P('rHK', 'Heavy-key recovery in bottoms', 0.5, 0.999, 0.001, 0.98, null, '\u2014'), P('R', 'Reflux ratio R', 0.3, 20, 0.05, 3, null, '\u2014'), P('q', 'Feed quality q', -0.5, 1.5, 0.05, 1, null, '\u2014')]),
        compute: v => {
          const f = feed(v), a = f.a, z = f.z;
          const s = fug(f, v.rLK, v.rHK, v.R, v.q);
          const D = s.D, B = s.B, L = v.R * D, V = (v.R + 1) * D;
          const Lb = L + v.q * 1, Vb = Lb - B;
          const rect = [], strip = [];
          let y = s.xD.slice();
          for (let n = 0; n < 120; n++) {
            const x = xFromY(y, a);
            rect.push({ n: n + 1, x: x.slice(), r: x[f.lk] / Math.max(x[f.hk], 1e-14) });
            const yn = x.map((xi, i) => (L * xi + D * s.xD[i]) / V);
            const sm = yn.reduce((p, q2) => p + q2, 0);
            y = yn.map(q2 => q2 / sm);
            if (x[f.lk] / Math.max(x[f.hk], 1e-14) < z[f.lk] / Math.max(z[f.hk], 1e-14) * 0.2) break;
          }
          let x2 = s.xB.slice();
          for (let m = 0; m < 120; m++) {
            const yv = yFromX(x2, a);
            strip.push({ m: m + 1, x: x2.slice(), r: x2[f.lk] / Math.max(x2[f.hk], 1e-14) });
            const xn = yv.map((yi, i) => (Vb * yi + B * s.xB[i]) / Lb);
            const sm = xn.reduce((p, q2) => p + q2, 0);
            x2 = xn.map(q2 => q2 / sm);
            if (x2[f.lk] / Math.max(x2[f.hk], 1e-14) > z[f.lk] / Math.max(z[f.hk], 1e-14) * 5) break;
          }
          /* match: find where the rectifying ratio (counted from top) meets the stripping ratio (counted from bottom) */
          let Nr = rect.length, Ns = strip.length, matched = false;
          for (let i = 0; i < rect.length && !matched; i++) {
            for (let j = strip.length - 1; j >= 0; j--) {
              if (rect[i].r <= strip[j].r) { Nr = i + 1; Ns = j + 1; matched = true; break; }
            }
          }
          const Ntot = Nr + Ns;
          const rows = NAMES.map((nm, i) => [nm, z[i].toFixed(4), a[i].toFixed(3), s.d[i].toFixed(5), s.b[i].toFixed(5), s.xD[i].toFixed(5), s.xB[i].toFixed(5), (s.d[i] / Math.max(z[i], 1e-12) * 100).toFixed(2) + ' %']);
          return {
            rect: rect, strip: strip, Nr: Nr, Ns: Ns, s: s, f: f,
            res: [{ l: 'Distillate D / F', v: D, u: '\u2014', d: 4 }, { l: 'Bottoms B / F', v: B, u: '\u2014', d: 4 }, { l: 'Minimum stages N_min', v: s.Nmin, u: '\u2014', d: 2 }, { l: 'Minimum reflux R_min', v: s.Rmin, u: '\u2014', d: 3 }, { l: 'R / R_min', v: v.R / s.Rmin, u: '\u2014', d: 3 }, { l: 'Rectifying stages', s: String(Nr), u: '' }, { l: 'Stripping stages', s: String(Ns), u: '' }, { l: 'Total theoretical stages', s: matched ? String(Ntot) : 'no match \u2014 raise R', u: '' }, { l: 'Feed stage from top', s: String(Nr), u: '' }, { l: 'Gilliland check on N', v: s.N, u: '\u2014', d: 2 }, { l: 'Distillate LK purity', v: s.xD[f.lk] * 100, u: '%', d: 3 }, { l: 'Bottoms HK purity', v: s.xB[f.hk] * 100, u: '%', d: 3 }, { l: 'Convergence', s: matched ? 'profiles meet at the feed plate' : 'profiles do not meet \u2014 reflux below minimum', u: '' }],
            table: { title: 'Component material balance from the assumed distribution', head: ['Component', 'z_i', '\u03b1_i', 'd_i / F', 'b_i / F', 'x_D', 'x_B', 'recovery overhead'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const rmax = Math.max.apply(null, r.strip.map(p => p.r).concat([10]));
          const rmin = Math.min.apply(null, r.rect.map(p => p.r).concat([0.01]));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: Math.max(r.Nr + r.Ns + 2, 10), ymin: Math.max(rmin * 0.4, 1e-4), ymax: rmax * 2.5, ylog: true, ml: 66 });
          g.grid('Stage number from the top', 'x_LK / x_HK');
          g.title('Lewis\u2013Matheson profiles \u2014 matching at the feed plate');
          g.line(r.rect.map((p, i) => [i + 1, p.r]), C.acc, 2.6);
          const off = r.Nr + r.Ns;
          g.line(r.strip.map((p, i) => [off - i, p.r]), C.dk, 2.6, [7, 4]);
          g.line([[r.Nr, 1e-6], [r.Nr, 1e6]], C.warn, 1.4, [5, 4]);
          if (g.w > 300) g.txt('feed plate', r.Nr, rmax * 1.6, C.warn, 'center', 11.5);
          g.legend([{ c: C.acc, l: 'from the condenser' }, { c: C.dk, l: 'from the reboiler', d: [7, 4] }]);
        }
      },
      {
        id: 'thgeddes', num: 'M-03', sec: S, name: 'Thiele\u2013Geddes & the \u03b8-method',
        blurb: 'Lewis\u2013Matheson fixes the products and finds the stages; Thiele\u2013Geddes fixes the stages and finds the products. That reversal is what made rating calculations possible, and Lyster\u2019s \u03b8-method is the correction that forces the computed component splits to satisfy the overall balance at every iteration.',
        howto: 'The uncorrected distribution from the stage calculation never closes the balance on the first pass \u2014 the sum of the computed distillate flows misses the specified D. The \u03b8-method multiplies every d/b ratio by one number and solves for it; the monotonic function makes that solve trivial, which is why the method converged reliably on 1950s hardware. Watch \u03b8 move away from 1 as you push the reflux towards minimum: that is the measure of how badly the first pass missed.',
        std: 'Thiele & Geddes, Ind. Eng. Chem. 25 (1933) 289; Lyster et al., Petroleum Refiner 38 (1959); Holland, Fundamentals of Multicomponent Distillation, Ch. 2',
        eqs: [['\\left(\\frac{d_i}{b_i}\\right)_{co} = \\theta\\left(\\frac{d_i}{b_i}\\right)_{ca}', 'the \u03b8 correction applied to every component'], ['g(\\theta) = \\sum_i \\frac{z_i(d_i/b_i)_{ca}\\theta}{1+(d_i/b_i)_{ca}\\theta} - D = 0', 'one monotonic equation in one unknown'], ['\\log\\frac{d_i}{b_i} = A + C\\log\\alpha_i', 'Hengstebeck\u2013Geddes form of the first pass'], ['x_{i,D} = \\frac{d_i}{D},\\qquad x_{i,B} = \\frac{b_i}{B}', 'products recovered from the corrected split']],
        notes: ['First-pass ratios generated from a Hengstebeck\u2013Geddes line anchored on the two keys at the actual stage count.', '\u03b8 solved by bisection on the monotonic balance function.', 'Constant relative volatility and constant molal overflow.', 'A \u03b8 far from unity signals that the assumed stage count and reflux are inconsistent with the specified split.'],
        params: FP.concat([P('N', 'Total theoretical stages', 4, 90, 1, 22, null, '\u2014'), P('Nf', 'Feed stage from the top', 2, 80, 1, 11, null, '\u2014'), P('R', 'Reflux ratio R', 0.3, 20, 0.05, 3, null, '\u2014'), P('Dspec', 'Specified distillate D / F', 0.05, 0.95, 0.005, 0.5, null, '\u2014'), P('q', 'Feed quality q', -0.5, 1.5, 0.05, 1, null, '\u2014')]),
        compute: v => {
          const f = feed(v), a = f.a, z = f.z;
          /* first pass: Hengstebeck–Geddes line through the keys at the available stage count */
          const Neff = Math.max(v.N - 1, 1);
          const Cc = Neff * 0.72;
          const dbCa = a.map(ai => Math.pow(ai / a[f.hk], Cc));
          const norm = 1;
          const gth = th => z.reduce((p, zi, i) => p + zi * dbCa[i] * th / (1 + dbCa[i] * th), 0) - v.Dspec;
          const th = self.bis(gth, 1e-9, 1e9, 1e-12);
          const dbCo = dbCa.map(x => x * th);
          const d = z.map((zi, i) => zi * dbCo[i] / (1 + dbCo[i]));
          const b = z.map((zi, i) => zi - d[i]);
          const D = d.reduce((p, x) => p + x, 0), B = 1 - D;
          const xD = d.map(x => x / Math.max(D, 1e-12)), xB = b.map(x => x / Math.max(B, 1e-12));
          const d0 = z.map((zi, i) => zi * dbCa[i] / (1 + dbCa[i]));
          const D0 = d0.reduce((p, x) => p + x, 0);
          const rows = NAMES.map((nm, i) => [nm, z[i].toFixed(4), a[i].toFixed(3), dbCa[i].toPrecision(4), dbCo[i].toPrecision(4), d[i].toFixed(5), b[i].toFixed(5), xD[i].toFixed(5)]);
          const s = fug(f, Math.min(d[f.lk] / Math.max(z[f.lk], 1e-9), 0.999), Math.min(b[f.hk] / Math.max(z[f.hk], 1e-9), 0.999), v.R, v.q);
          return {
            dbCa: dbCa, dbCo: dbCo, th: th, a: a, xD: xD, xB: xB, f: f,
            res: [{ l: 'Uncorrected \u03a3d_i', v: D0, u: '\u2014', d: 5 }, { l: 'Specified D / F', v: v.Dspec, u: '\u2014', d: 5 }, { l: 'First-pass balance error', v: (D0 - v.Dspec) / v.Dspec * 100, u: '%', d: 2 }, { l: 'Converged \u03b8', v: th, u: '\u2014', d: 5 }, { l: 'Corrected \u03a3d_i', v: D, u: '\u2014', d: 5 }, { l: 'Bottoms B / F', v: B, u: '\u2014', d: 5 }, { l: 'Light-key recovery overhead', v: d[f.lk] / z[f.lk] * 100, u: '%', d: 3 }, { l: 'Heavy-key recovery in bottoms', v: b[f.hk] / z[f.hk] * 100, u: '%', d: 3 }, { l: 'Distillate LK mole fraction', v: xD[f.lk], u: '\u2014', d: 5 }, { l: 'Bottoms HK mole fraction', v: xB[f.hk], u: '\u2014', d: 5 }, { l: 'Implied N_min', v: s.Nmin, u: '\u2014', d: 2 }, { l: 'Implied R_min', v: s.Rmin, u: '\u2014', d: 3 }, { l: 'Consistency', s: Math.abs(Math.log10(th)) < 0.3 ? 'stage count and split are consistent' : th > 1 ? 'column has more separating power than the split needs' : 'split is beyond what this stage count can deliver', u: '' }],
            table: { title: '\u03b8-method correction, component by component', head: ['Component', 'z_i', '\u03b1_i', '(d/b) first pass', '(d/b) corrected', 'd_i / F', 'b_i / F', 'x_D'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const alo = Math.min.apply(null, r.a) * 0.7, ahi = Math.max.apply(null, r.a) * 1.4;
          const vals = r.dbCa.concat(r.dbCo).filter(x => isFinite(x) && x > 0);
          const lo = Math.min.apply(null, vals) / 8, hi = Math.max.apply(null, vals) * 8;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: alo, xmax: ahi, ymin: Math.max(lo, 1e-8), ymax: hi, xlog: true, ylog: true, ml: 66 });
          g.grid('Relative volatility  \u03b1_i', 'd_i / b_i');
          g.title('Hengstebeck\u2013Geddes line and the \u03b8 correction');
          g.line([[alo, 1], [ahi, 1]], 'rgba(29,31,32,0.22)', 1.1, [5, 4]);
          const line = arr => { const pts = r.a.map((ai, i) => [ai, arr[i]]).sort((p, q) => p[0] - q[0]); return pts; };
          g.line(line(r.dbCa), C.mid, 1.8, [7, 4]);
          g.line(line(r.dbCo), C.acc, 2.6);
          r.a.forEach((ai, i) => { g.dot(ai, r.dbCo[i], C.acc, 5); g.cross(ai, r.dbCa[i], C.mid, 6); });
          if (g.w > 300) { r.a.forEach((ai, i) => g.txt(['A', 'B', 'C', 'D'][i], ai, r.dbCo[i] * 3, C.dk, 'center', 11.5)); }
          g.legend([{ c: C.mid, l: 'first pass', d: [7, 4] }, { c: C.acc, l: '\u03b8-corrected  (\u03b8 = ' + r.th.toPrecision(3) + ')' }]);
        }
      },
      {
        id: 'wanghenke', num: 'M-04', sec: S, name: 'Wang\u2013Henke matrix (bubble-point) method',
        blurb: 'The modern rigorous solution: write the MESH equations for every stage and every component, notice that the material balances form a tridiagonal matrix for each component, and solve them all at once. The temperature profile follows from a bubble-point calculation on each stage, and the whole thing is iterated to convergence.',
        howto: 'The composition profiles are the real output \u2014 they show where each component actually lives in the column, which no shortcut method can tell you. Look for the pinch: a region where the profiles go flat is a section doing no separation, and moving the feed stage will usually fix it. The temperature profile should be monotonic; a kink means the feed is badly placed or badly conditioned.',
        std: 'Wang & Henke, Hydrocarbon Processing 45 (1966) 155; Seader, Henley & Roper, Ch. 10; Henley & Seader, Equilibrium-Stage Separation Operations, Ch. 15',
        eqs: [['A_jx_{i,j-1} + B_jx_{i,j} + C_jx_{i,j+1} = D_j', 'tridiagonal component balance, solved by the Thomas algorithm'], ['B_j = -\\left[V_{j+1} + \\sum_{m}(F_m - W_m) - V_1 + V_jK_{i,j}\\right]', 'the diagonal coefficient'], ['\\sum_i K_{i,j}x_{i,j} = 1', 'bubble point on every stage \u2014 gives the temperature'], ['K_i = \\alpha_i K_{ref}(T),\\quad K_{ref} = \\exp\\!\\left[\\frac{\\Delta H_v}{R}\\!\\left(\\frac{1}{T_b}-\\frac{1}{T}\\right)\\right]', 'K-value model used here']],
        notes: ['Constant molal overflow used for the flow profile; the bubble-point loop provides temperatures.', 'K-values as \u03b1_i times a Clausius\u2013Clapeyron reference \u2014 the reference boils at T_b with K = 1.', 'Stage 1 is a total condenser, stage N a partial reboiler.', 'Twenty outer iterations, which is ample for constant-\u03b1 systems.'],
        params: FP.concat([P('N', 'Total stages including reboiler', 5, 60, 1, 20, null, '\u2014'), P('Nf', 'Feed stage from the top', 2, 55, 1, 10, null, '\u2014'), P('R', 'Reflux ratio R', 0.3, 20, 0.05, 3, null, '\u2014'), P('Dspec', 'Distillate D / F', 0.05, 0.95, 0.005, 0.5, null, '\u2014'), P('q', 'Feed quality q', 0, 1, 0.05, 1, null, '\u2014'), P('Tb', 'Reference boiling point', -50, 300, 1, 80, 'T'), P('dHv', 'Reference \u0394H_vap', 15, 60, 0.5, 32, null, 'kJ/mol')]),
        compute: v => {
          const f = feed(v), a = f.a, z = f.z, nc = 4;
          const tf = mkT(v);
          const N = Math.round(v.N), Nf = Math.min(Math.max(Math.round(v.Nf), 2), N - 1);
          const D = v.Dspec, B = 1 - D, L = v.R * D, V = (v.R + 1) * D;
          const Lb = L + v.q * 1, Vb = V - (1 - v.q) * 1;
          const Lj = [], Vj = [];
          for (let j = 1; j <= N; j++) { if (j < Nf) { Lj[j] = L; Vj[j] = V; } else { Lj[j] = Lb; Vj[j] = Vb; } }
          Vj[1] = 0; Lj[N] = B;
          let T = []; for (let j = 1; j <= N; j++) T[j] = v.Tb - 25 + 55 * (j - 1) / (N - 1);
          let X = [];
          for (let j = 1; j <= N; j++) X[j] = z.slice();
          for (let it = 0; it < 22; it++) {
            const Knew = [];
            for (let j = 1; j <= N; j++) Knew[j] = a.map(ai => ai * tf.K(T[j]));
            for (let i = 0; i < nc; i++) {
              const A2 = [], B2 = [], C2 = [], Dv = [];
              for (let j = 1; j <= N; j++) {
                A2[j] = j > 1 ? Lj[j - 1] : 0;
                let sumF = j >= Nf ? 1 : 0;
                B2[j] = -(Lj[j] + Vj[j] * Knew[j][i]);
                C2[j] = j < N ? Vj[j + 1] * Knew[j + 1][i] : 0;
                Dv[j] = (j === Nf) ? -z[i] : 0;
              }
              /* Thomas algorithm */
              const cp = [], dp = [];
              cp[1] = C2[1] / B2[1]; dp[1] = Dv[1] / B2[1];
              for (let j = 2; j <= N; j++) { const m = B2[j] - A2[j] * cp[j - 1]; cp[j] = C2[j] / m; dp[j] = (Dv[j] - A2[j] * dp[j - 1]) / m; }
              const xs = []; xs[N] = dp[N];
              for (let j = N - 1; j >= 1; j--) xs[j] = dp[j] - cp[j] * xs[j + 1];
              for (let j = 1; j <= N; j++) X[j][i] = Math.max(xs[j], 0);
            }
            for (let j = 1; j <= N; j++) { const s = X[j].reduce((p, q) => p + q, 0) || 1; X[j] = X[j].map(q => q / s); T[j] = bubT(X[j], a, tf); }
          }
          const xD = X[1], xB = X[N];
          const rows = [];
          for (let j = 1; j <= N; j++) { if (N <= 14 || j === 1 || j === N || j === Nf || j % Math.ceil(N / 10) === 0) rows.push([String(j) + (j === 1 ? ' (cond)' : j === N ? ' (reb)' : j === Nf ? ' (feed)' : ''), T[j].toFixed(2), X[j][0].toFixed(5), X[j][1].toFixed(5), X[j][2].toFixed(5), X[j][3].toFixed(5)]); }
          const dLK = D * xD[f.lk], recLK = dLK / Math.max(z[f.lk], 1e-12);
          const bHK = B * xB[f.hk], recHK = bHK / Math.max(z[f.hk], 1e-12);
          return {
            X: X, T: T, N: N, Nf: Nf, f: f,
            res: [{ l: 'Stages solved', s: String(N) + ' (feed at ' + Nf + ')', u: '' }, { l: 'Condenser temperature', v: T[1], u: '\u00b0C', d: 2 }, { l: 'Feed-stage temperature', v: T[Nf], u: '\u00b0C', d: 2 }, { l: 'Reboiler temperature', v: T[N], u: '\u00b0C', d: 2 }, { l: 'Column \u0394T', v: T[N] - T[1], u: 'K', d: 2 }, { l: 'Distillate x_LK', v: xD[f.lk], u: '\u2014', d: 5 }, { l: 'Distillate x_HK', v: xD[f.hk], u: '\u2014', d: 5 }, { l: 'Bottoms x_LK', v: xB[f.lk], u: '\u2014', d: 5 }, { l: 'Bottoms x_HK', v: xB[f.hk], u: '\u2014', d: 5 }, { l: 'Light-key recovery overhead', v: recLK * 100, u: '%', d: 2 }, { l: 'Heavy-key recovery in bottoms', v: recHK * 100, u: '%', d: 2 }, { l: 'Separation quality', s: recLK > 0.95 && recHK > 0.95 ? 'sharp split achieved' : recLK > 0.8 && recHK > 0.8 ? 'moderate split \u2014 add stages or reflux' : 'poor split \u2014 the column is under-specified', u: '' }],
            table: { title: 'Converged liquid composition and temperature profile', head: ['Stage', 'T  \u00b0C', 'x_A', 'x_B (LK)', 'x_C (HK)', 'x_D'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.62;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 1, xmax: r.N, ymin: 1e-5, ymax: 1.4, ylog: true, ml: 64, mb: 20, mt: 32 });
          g.grid('', 'Liquid mole fraction');
          g.title('Converged composition profiles');
          const cols = [C.lt, C.acc, C.dk, C.mid];
          for (let i = 0; i < 4; i++) {
            const pts = []; for (let j = 1; j <= r.N; j++) pts.push([j, Math.max(r.X[j][i], 1e-5)]);
            g.line(pts, cols[i], i === 1 || i === 2 ? 2.8 : 1.8, i === 1 || i === 2 ? null : [6, 3]);
          }
          g.line([[r.Nf, 1e-5], [r.Nf, 1.4]], 'rgba(29,31,32,0.2)', 1.2, [4, 4]);
          g.legend([{ c: C.lt, l: 'A', d: [6, 3] }, { c: C.acc, l: 'B (LK)' }, { c: C.dk, l: 'C (HK)' }, { c: C.mid, l: 'D', d: [6, 3] }]);
          let tlo = 1e9, thi = -1e9; for (let j = 1; j <= r.N; j++) { tlo = Math.min(tlo, r.T[j]); thi = Math.max(thi, r.T[j]); }
          const pad = Math.max(1, (thi - tlo) * 0.12);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 1, xmax: r.N, ymin: tlo - pad, ymax: thi + pad, ml: 64, mt: 12, mb: 44 });
          g2.grid('Stage number from the top', 'T  \u00b0C', 5, 4);
          const tp = []; for (let j = 1; j <= r.N; j++) tp.push([j, r.T[j]]);
          g2.line(tp, C.warn, 2.4);
          g2.line([[r.Nf, tlo - pad], [r.Nf, thi + pad]], 'rgba(29,31,32,0.2)', 1.2, [4, 4]);
        }
      },
      {
        id: 'hengste', num: 'M-05', sec: S, name: 'Hengstebeck\u2013Geddes non-key distribution',
        blurb: 'A design fixes the split of two components; the other components go where thermodynamics sends them. The Hengstebeck\u2013Geddes correlation says that on a log\u2013log plot of component split against relative volatility, every component falls on the straight line through the two keys \u2014 an observation that turns a multicomponent problem into a ruler-and-pencil exercise.',
        howto: 'Set the key recoveries and read the non-keys off the line. Components far outside the key volatilities are effectively non-distributing: they go almost entirely one way, and calling them so is a safe design assumption. Components between the keys distribute, and those are the ones that need a rigorous check. The Fenske line drawn at total reflux is the theoretical basis \u2014 the slope is exactly N_min.',
        std: 'Hengstebeck, Distillation: Principles and Design Procedures (1961); Geddes, AIChE J. 4 (1958) 389; Sinnott & Towler, Chemical Engineering Design, 6th ed., Ch. 11',
        eqs: [['\\log\\frac{d_i}{b_i} = A + C\\log\\alpha_i', 'the correlation \u2014 a straight line through the keys'], ['N_{min} = \\frac{\\log\\left[(d_{LK}/b_{LK})(b_{HK}/d_{HK})\\right]}{\\log\\alpha_{LK,HK}}', 'Fenske \u2014 slope of the total-reflux line'], ['\\frac{d_i}{b_i} = \\alpha_i^{N_{min}}\\frac{d_{HK}}{b_{HK}}', 'Fenske applied to a non-key'], ['d_i = z_iF\\frac{(d_i/b_i)}{1+(d_i/b_i)}', 'recovering the component flows']],
        notes: ['Constant relative volatility referenced to the heavy key.', 'The correlation is exact at total reflux and an approximation at finite reflux; the slope is usually taken between 0.6 N_min and N_min.', 'Components with d/b outside 10\u207b\u00b3 to 10\u00b3 are treated as non-distributing.'],
        params: FP.concat([P('rLK', 'Light-key recovery in distillate', 0.5, 0.9999, 0.001, 0.98, null, '\u2014'), P('rHK', 'Heavy-key recovery in bottoms', 0.5, 0.9999, 0.001, 0.98, null, '\u2014'), P('slope', 'Slope factor \u00d7 N_min', 0.4, 1.2, 0.01, 1, null, '\u2014')]),
        compute: v => {
          const f = feed(v), a = f.a, z = f.z;
          const dLK = z[f.lk] * v.rLK, bLK = z[f.lk] - dLK;
          const bHK = z[f.hk] * v.rHK, dHK = z[f.hk] - bHK;
          const alk = a[f.lk] / a[f.hk];
          const Nmin = Math.log((dLK / bLK) * (bHK / dHK)) / Math.log(alk);
          const Cc = Nmin * v.slope;
          const Aa = Math.log10(dHK / bHK);
          const db = a.map(ai => Math.pow(10, Aa + Cc * Math.log10(ai / a[f.hk])));
          const d = z.map((zi, i) => zi * db[i] / (1 + db[i]));
          const b = z.map((zi, i) => zi - d[i]);
          const D = d.reduce((p, x) => p + x, 0), B = 1 - D;
          const xD = d.map(x => x / Math.max(D, 1e-12)), xB = b.map(x => x / Math.max(B, 1e-12));
          const cls = i => db[i] > 1e3 ? 'non-distributing \u2014 overhead' : db[i] < 1e-3 ? 'non-distributing \u2014 bottoms' : 'distributes';
          const rows = NAMES.map((nm, i) => [nm, a[i].toFixed(3), z[i].toFixed(4), db[i].toPrecision(4), d[i].toFixed(5), b[i].toFixed(5), (d[i] / Math.max(z[i], 1e-12) * 100).toFixed(2) + ' %', cls(i)]);
          return {
            a: a, db: db, Nmin: Nmin, Cc: Cc, Aa: Aa, f: f,
            res: [{ l: 'Key relative volatility \u03b1_LK,HK', v: alk, u: '\u2014', d: 4 }, { l: 'Minimum stages N_min (Fenske)', v: Nmin, u: '\u2014', d: 3 }, { l: 'Correlation slope C', v: Cc, u: '\u2014', d: 3 }, { l: 'Correlation intercept A', v: Aa, u: '\u2014', d: 4 }, { l: 'Distillate D / F', v: D, u: '\u2014', d: 5 }, { l: 'Bottoms B / F', v: B, u: '\u2014', d: 5 }, { l: 'x_D light key', v: xD[f.lk], u: '\u2014', d: 5 }, { l: 'x_D heavy key', v: xD[f.hk], u: '\u2014', d: 5 }, { l: 'x_B light key', v: xB[f.lk], u: '\u2014', d: 5 }, { l: 'x_B heavy key', v: xB[f.hk], u: '\u2014', d: 5 }, { l: 'Lightest component overhead', v: d[0] / Math.max(z[0], 1e-12) * 100, u: '%', d: 3 }, { l: 'Heaviest component in bottoms', v: b[3] / Math.max(z[3], 1e-12) * 100, u: '%', d: 3 }, { l: 'Distributing components', s: String(a.filter((_, i) => db[i] <= 1e3 && db[i] >= 1e-3).length) + ' of 4', u: '' }],
            table: { title: 'Component distribution from the correlation', head: ['Component', '\u03b1_i', 'z_i', 'd_i/b_i', 'd_i / F', 'b_i / F', 'recovery overhead', 'classification'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const alo = Math.min.apply(null, r.a) * 0.6, ahi = Math.max.apply(null, r.a) * 1.8;
          const vals = r.db.filter(x => isFinite(x) && x > 0);
          const lo = Math.max(Math.min.apply(null, vals) / 20, 1e-9), hi = Math.max.apply(null, vals) * 20;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: alo, xmax: ahi, ymin: lo, ymax: hi, xlog: true, ylog: true, ml: 66 });
          g.grid('Relative volatility  \u03b1_i', 'd_i / b_i');
          g.title('Hengstebeck\u2013Geddes distribution line');
          g.line([[alo, 1], [ahi, 1]], 'rgba(29,31,32,0.22)', 1.1, [5, 4]);
          g.fill([[alo, 1e3], [ahi, 1e3], [ahi, hi], [alo, hi]], C.soft);
          g.fill([[alo, lo], [ahi, lo], [ahi, 1e-3], [alo, 1e-3]], C.soft);
          const line = [];
          for (let i = 0; i <= 60; i++) { const al = alo * Math.pow(ahi / alo, i / 60); line.push([al, Math.pow(10, r.Aa + r.Cc * Math.log10(al / r.a[r.f.hk]))]); }
          g.line(line, C.acc, 2.6);
          const fen = [];
          for (let i = 0; i <= 60; i++) { const al = alo * Math.pow(ahi / alo, i / 60); fen.push([al, Math.pow(10, r.Aa + r.Nmin * Math.log10(al / r.a[r.f.hk]))]); }
          g.line(fen, C.mid, 1.6, [7, 4]);
          r.a.forEach((ai, i) => { g.dot(ai, Math.min(Math.max(r.db[i], lo), hi), C.dk, 5.5); });
          r.a.forEach((ai, i) => { if (g.w > 300) g.txt(['A', 'B (LK)', 'C (HK)', 'D'][i], ai, Math.min(Math.max(r.db[i], lo), hi) * 4, C.dk, 'center', 11.5); });
          g.legend([{ c: C.acc, l: 'design slope' }, { c: C.mid, l: 'Fenske (N_min)', d: [7, 4] }]);
        }
      },
      {
        id: 'underw', num: 'M-06', sec: S, name: 'Underwood minimum reflux \u2014 multicomponent',
        blurb: 'Underwood\u2019s two equations remain the only closed-form answer to minimum reflux for a real multicomponent feed. The first has as many roots as there are components; only the ones lying between the key volatilities matter, and each distributing component adds one more root and one more term to the second equation.',
        howto: 'The root plot shows where the roots live \u2014 one in each interval between adjacent volatilities. Change the feed quality and watch every root move: q enters the first equation directly, which is why a subcooled feed lowers the minimum reflux and a vapour feed raises it. If a component between the keys distributes, you need its root too; using only the key root then under-predicts R_min, which is a common and expensive mistake.',
        std: 'Underwood, Chem. Eng. Prog. 44 (1948) 603; Gilliland, Ind. Eng. Chem. 32 (1940) 1220; Kirkbride, Petroleum Refiner 23 (1944) 321; Seader et al., Ch. 9',
        eqs: [['\\sum_i \\frac{\\alpha_iz_i}{\\alpha_i-\\theta} = 1-q', 'first Underwood equation \u2014 solved for the roots \u03b8'], ['R_{min}+1 = \\sum_i \\frac{\\alpha_ix_{i,D}}{\\alpha_i-\\theta}', 'second equation, evaluated at each valid root'], ['\\frac{N-N_{min}}{N+1} = 1-\\exp\\!\\left[\\frac{1+54.4X}{11+117.2X}\\cdot\\frac{X-1}{\\sqrt X}\\right]', 'Gilliland correlation, X = (R\u2212R_min)/(R+1)'], ['\\frac{N_R}{N_S} = \\left[\\frac{z_{HK}}{z_{LK}}\\left(\\frac{x_{LK,B}}{x_{HK,D}}\\right)^{\\!2}\\frac{B}{D}\\right]^{0.206}', 'Kirkbride feed-stage location']],
        notes: ['Constant relative volatility, constant molal overflow, class 1 separation (no distributing non-keys) unless the roots say otherwise.', 'Roots bracketed between adjacent volatilities and found by bisection.', 'Non-key distribution taken from Hengstebeck\u2013Geddes at N_min.', 'Gilliland is a correlation of rigorous results, good to about \u00b17 % in N.'],
        params: FP.concat([P('rLK', 'Light-key recovery in distillate', 0.5, 0.9999, 0.001, 0.98, null, '\u2014'), P('rHK', 'Heavy-key recovery in bottoms', 0.5, 0.9999, 0.001, 0.98, null, '\u2014'), P('R', 'Actual reflux ratio R', 0.3, 20, 0.05, 2.5, null, '\u2014'), P('q', 'Feed quality q', -0.5, 1.5, 0.05, 1, null, '\u2014')]),
        compute: v => {
          const f = feed(v), a = f.a, z = f.z;
          const s = fug(f, v.rLK, v.rHK, v.R, v.q);
          const g = th => a.reduce((p, ai, i) => p + ai * z[i] / (ai - th), 0) - (1 - v.q);
          const rowsR = s.roots.map((th, i) => {
            const Rm = a.reduce((p, ai, j) => p + ai * s.xD[j] / (ai - th), 0) - 1;
            const valid = th < a[f.lk] && th > a[f.hk];
            return ['\u03b8' + (i + 1), th.toFixed(6), Rm.toPrecision(5), valid ? 'between the keys \u2014 use it' : 'outside the key pair'];
          });
          const stages = Math.ceil(s.N), feedS = Math.ceil(s.Nfeed);
          return {
            s: s, g: g, a: a,
            res: [{ l: 'Number of Underwood roots', s: String(s.roots.length), u: '' }, { l: 'Root between the keys \u03b8', v: s.th, u: '\u2014', d: 6 }, { l: 'Minimum reflux R_min', v: s.Rmin, u: '\u2014', d: 4 }, { l: 'Minimum stages N_min', v: s.Nmin, u: '\u2014', d: 3 }, { l: 'Actual R / R_min', v: v.R / s.Rmin, u: '\u2014', d: 3 }, { l: 'Gilliland X', v: s.X, u: '\u2014', d: 4 }, { l: 'Gilliland Y', v: s.Y, u: '\u2014', d: 4 }, { l: 'Theoretical stages N', v: s.N, u: '\u2014', d: 2 }, { l: 'Rounded stage count', s: String(stages) + ' theoretical', u: '' }, { l: 'Feed stage from the top', s: String(feedS), u: '' }, { l: 'Distillate D / F', v: s.D, u: '\u2014', d: 5 }, { l: 'Distillate LK purity', v: s.xD[f.lk] * 100, u: '%', d: 3 }, { l: 'Bottoms HK purity', v: s.xB[f.hk] * 100, u: '%', d: 3 }, { l: 'Design comment', s: v.R / s.Rmin < 1.05 ? 'too close to minimum \u2014 the column becomes infinitely tall' : v.R / s.Rmin > 1.6 ? 'reflux is generous \u2014 trading energy for stages' : 'in the economic band, 1.1\u20131.5 \u00d7 R_min', u: '' }],
            table: { title: 'Underwood roots and the reflux each implies', head: ['Root', '\u03b8', 'R_min from this root', 'status'], rows: rowsR }
          };
        },
        draw: (ctx, b, v, r) => {
          const alo = Math.min.apply(null, r.a) * 0.85, ahi = Math.max.apply(null, r.a) * 1.05;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: alo, xmax: ahi, ymin: -12, ymax: 12, ml: 62 });
          g.grid('\u03b8', '\u03a3 \u03b1_i z_i / (\u03b1_i \u2212 \u03b8)  \u2212  (1 \u2212 q)');
          g.title('First Underwood equation \u2014 one root per interval');
          g.line([[alo, 0], [ahi, 0]], 'rgba(29,31,32,0.3)', 1.3);
          r.a.forEach(ai => g.line([[ai, -12], [ai, 12]], 'rgba(29,31,32,0.14)', 1.1, [4, 4]));
          const sorted = r.a.slice().sort((p, q) => p - q);
          for (let k = 0; k < sorted.length; k++) {
            const lo = k === 0 ? alo : sorted[k - 1] + 1e-4, hi = sorted[k] - 1e-4;
            if (hi <= lo) continue;
            const pts = [];
            for (let i = 0; i <= 200; i++) { const th = lo + (hi - lo) * i / 200; const y = r.g(th); if (Math.abs(y) < 40) pts.push([th, y]); else pts.push([th, NaN]); }
            g.line(pts, C.acc, 2.2);
          }
          r.s.roots.forEach(th => g.dot(th, 0, C.warn, 5));
          if (isFinite(r.s.th)) g.cross(r.s.th, 0, C.dk, 9);
          if (g.w > 320) r.a.forEach((ai, i) => g.txt('\u03b1' + ['A', 'B', 'C', 'D'][i], ai, 10.5, C.mut, 'center', 11));
          g.legend([{ c: C.acc, l: 'f(\u03b8)' }, { c: C.warn, l: 'roots' }]);
        }
      }
    ];
  }

  /* ══ MULTIPHASE REACTION ENGINEERING ══════════════════════ */
