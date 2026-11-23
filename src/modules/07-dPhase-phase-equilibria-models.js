  dPhase() {
    const self = this, C = this.C;
    const S = 'Phase Equilibria & Models';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const Rg = 8.314;

    /* pure-component data comes from the shared library in P-01, so any
       compound the user adds by CAS number is immediately usable here. */
    const PURE = self.lib();
    const SYS = {
      ew: { l: 'Ethanol (1) / Water (2)', a: 'ethanol', b: 'water', g12: -1200, g21: 6000, al: 0.30, u12: -350, u21: 1250 },
      mw: { l: 'Methanol (1) / Water (2)', a: 'methanol', b: 'water', g12: -800, g21: 2900, al: 0.30, u12: -200, u21: 900 },
      bt: { l: 'Benzene (1) / Toluene (2)', a: 'benzene', b: 'toluene', g12: 60, g21: -30, al: 0.30, u12: 20, u21: -10 },
      ac: { l: 'Acetone (1) / Chloroform (2)', a: 'acetone', b: 'chloroform', g12: -2600, g21: -1400, al: 0.30, u12: -900, u21: -500 },
      ah: { l: 'Acetone (1) / n-Hexane (2)', a: 'acetone', b: 'nhexane', g12: 3100, g21: 4200, al: 0.30, u12: 900, u21: 1400 },
      iw: { l: '2-Propanol (1) / Water (2)', a: 'ipa', b: 'water', g12: -600, g21: 6400, al: 0.30, u12: -250, u21: 1500 },
      mb: { l: 'Methanol (1) / Benzene (2)', a: 'methanol', b: 'benzene', g12: 3900, g21: 4700, al: 0.47, u12: 1200, u21: 1600 }
    };
    const SYSOPT = Object.keys(SYS).map(k => [k, SYS[k].l]);
    const Psat = (c, TC) => Math.pow(10, c.A - c.B / (TC + c.Cc)) * 0.133322;  /* kPa */
    const Tsat = (c, PkPa) => c.B / (c.A - Math.log10(PkPa / 0.133322)) - c.Cc;

    /* activity-coefficient models — all return [γ1, γ2] */
    const GAM = {
      marg2: (x1, p) => { const x2 = 1 - x1, A = p.A12 / (Rg * p.T); return [Math.exp(A * x2 * x2), Math.exp(A * x1 * x1)]; },
      marg3: (x1, p) => { const x2 = 1 - x1, a = p.A12 / (Rg * p.T), b = p.A21 / (Rg * p.T); return [Math.exp((a + 2 * (b - a) * x1) * x2 * x2), Math.exp((b + 2 * (a - b) * x2) * x1 * x1)]; },
      vanlaar: (x1, p) => {
        const x2 = 1 - x1, A = p.A12 / (Rg * p.T), B = p.A21 / (Rg * p.T);
        if (Math.abs(A) < 1e-9 || Math.abs(B) < 1e-9) return [1, 1];
        return [Math.exp(A / Math.pow(1 + (A * x1) / (B * x2), 2)), Math.exp(B / Math.pow(1 + (B * x2) / (A * x1), 2))];
      },
      wilson: (x1, p) => {
        const x2 = 1 - x1, L12 = Math.exp(-p.A12 / (Rg * p.T)), L21 = Math.exp(-p.A21 / (Rg * p.T));
        const d1 = x1 + L12 * x2, d2 = x2 + L21 * x1, t = L12 / d1 - L21 / d2;
        return [Math.exp(-Math.log(d1) + x2 * t), Math.exp(-Math.log(d2) - x1 * t)];
      },
      nrtl: (x1, p) => {
        const x2 = 1 - x1, t12 = p.A12 / (Rg * p.T), t21 = p.A21 / (Rg * p.T);
        const G12 = Math.exp(-p.al * t12), G21 = Math.exp(-p.al * t21);
        const d1 = x1 + x2 * G21, d2 = x2 + x1 * G12;
        return [Math.exp(x2 * x2 * (t21 * Math.pow(G21 / d1, 2) + t12 * G12 / (d2 * d2))),
        Math.exp(x1 * x1 * (t12 * Math.pow(G12 / d2, 2) + t21 * G21 / (d1 * d1)))];
      },
      uniquac: (x1, p) => {
        const x2 = 1 - x1, z = 10, r1 = p.r1, r2 = p.r2, q1 = p.q1, q2 = p.q2;
        if (x1 <= 0) x1 = 1e-9; if (x2 <= 0) x2 = 1e-9;
        const rs = r1 * x1 + r2 * x2, qs = q1 * x1 + q2 * x2;
        const f1 = r1 * x1 / rs, f2 = r2 * x2 / rs, th1 = q1 * x1 / qs, th2 = q2 * x2 / qs;
        const l1 = (z / 2) * (r1 - q1) - (r1 - 1), l2 = (z / 2) * (r2 - q2) - (r2 - 1);
        const lc1 = Math.log(f1 / x1) + (z / 2) * q1 * Math.log(th1 / f1) + l1 - (f1 / x1) * (x1 * l1 + x2 * l2);
        const lc2 = Math.log(f2 / x2) + (z / 2) * q2 * Math.log(th2 / f2) + l2 - (f2 / x2) * (x1 * l1 + x2 * l2);
        const t12 = Math.exp(-p.A12 / (Rg * p.T)), t21 = Math.exp(-p.A21 / (Rg * p.T));
        const s1 = th1 + th2 * t21, s2 = th2 + th1 * t12;
        const lr1 = q1 * (1 - Math.log(s1) - th1 / s1 - th2 * t12 / s2);
        const lr2 = q2 * (1 - Math.log(s2) - th2 / s2 - th1 * t21 / s1);
        return [Math.exp(lc1 + lr1), Math.exp(lc2 + lr2)];
      }
    };
    const MODOPT = [['marg2', 'Two-suffix Margules'], ['marg3', 'Three-suffix Margules'], ['vanlaar', 'van Laar'], ['wilson', 'Wilson'], ['nrtl', 'NRTL'], ['uniquac', 'UNIQUAC']];

    /* bubble temperature at fixed P for a binary with model γ */
    const bubbleT = (x1, P0, ca, cb, mk) => {
      const f = T => { const p = mk(T); const g = GAM[p.model](x1, p); return x1 * g[0] * Psat(ca, T) + (1 - x1) * g[1] * Psat(cb, T) - P0; };
      const lo = Math.min(Tsat(ca, P0), Tsat(cb, P0)) - 80, hi = Math.max(Tsat(ca, P0), Tsat(cb, P0)) + 60;
      return self.bis(f, lo, hi, 1e-7);
    };

    /* cubic EOS */
    const EOS = { vdw: 'van der Waals', rk: 'Redlich\u2013Kwong', srk: 'Soave\u2013Redlich\u2013Kwong', pr: 'Peng\u2013Robinson' };
    const EOSOPT = Object.keys(EOS).map(k => [k, EOS[k]]);
    const eosAB = (kind, T, Pk, Tc, PcBar, w) => {
      const Pc = PcBar * 100, Tr = T / Tc;
      let a, b, u, ww;
      if (kind === 'vdw') { a = 27 * Rg * Rg * Tc * Tc / (64 * Pc); b = Rg * Tc / (8 * Pc); u = 0; ww = 0; }
      else if (kind === 'rk') { a = 0.42748 * Rg * Rg * Math.pow(Tc, 2.5) / Pc / Math.sqrt(T); b = 0.08664 * Rg * Tc / Pc; u = 1; ww = 0; }
      else if (kind === 'srk') { const m = 0.480 + 1.574 * w - 0.176 * w * w; const al = Math.pow(1 + m * (1 - Math.sqrt(Tr)), 2); a = 0.42748 * Rg * Rg * Tc * Tc / Pc * al; b = 0.08664 * Rg * Tc / Pc; u = 1; ww = 0; }
      else { const m = 0.37464 + 1.54226 * w - 0.26992 * w * w; const al = Math.pow(1 + m * (1 - Math.sqrt(Tr)), 2); a = 0.45724 * Rg * Rg * Tc * Tc / Pc * al; b = 0.07780 * Rg * Tc / Pc; u = 2; ww = -1; }
      return { a: a, b: b, u: u, w: ww, A: a * Pk / Math.pow(Rg * T, 2), B: b * Pk / (Rg * T) };
    };
    const cubicRoots = (c2, c1, c0) => {
      const p = c1 - c2 * c2 / 3, q = 2 * c2 * c2 * c2 / 27 - c2 * c1 / 3 + c0;
      const D = q * q / 4 + p * p * p / 27, out = [];
      if (D > 0) { const s = Math.cbrt(-q / 2 + Math.sqrt(D)) + Math.cbrt(-q / 2 - Math.sqrt(D)); out.push(s - c2 / 3); }
      else { const rr = Math.sqrt(-p * p * p / 27), ph = Math.acos(Math.max(-1, Math.min(1, -q / (2 * rr)))); const m = 2 * Math.cbrt(rr); for (let k = 0; k < 3; k++) out.push(m * Math.cos((ph + 2 * Math.PI * k) / 3) - c2 / 3); }
      return out.filter(z => isFinite(z)).sort((a, b) => a - b);
    };
    const eosZ = (kind, T, Pk, Tc, Pc, w) => {
      const e = eosAB(kind, T, Pk, Tc, Pc, w), A = e.A, B = e.B, u = e.u, ww = e.w;
      const c2 = -(1 + B - u * B), c1 = A + ww * B * B - u * B - u * B * B, c0 = -(A * B + ww * B * B + ww * B * B * B);
      return { roots: cubicRoots(c2, c1, c0).filter(z => z > B * 1.000001), A: A, B: B, e: e };
    };
    const lnPhi = (kind, Z, A, B) => {
      if (Z <= B) return NaN;
      if (kind === 'vdw') return Z - 1 - Math.log(Z - B) - A / Z;
      if (kind === 'pr') { const s = Math.SQRT2; return Z - 1 - Math.log(Z - B) - A / (2 * s * B) * Math.log((Z + (1 + s) * B) / (Z + (1 - s) * B)); }
      return Z - 1 - Math.log(Z - B) - (A / B) * Math.log(1 + B / Z);
    };

    return [
      {
        id: 'actmod', num: 'Q-01', sec: S, name: 'Activity coefficient models compared',
        blurb: 'Six correlations for the same physical thing \u2014 how much a liquid mixture departs from Raoult\u2019s law. Margules and van Laar are curve fits with no structure; Wilson and NRTL come from local-composition theory; UNIQUAC adds a size-and-shape term that lets it extrapolate. They agree in the middle and diverge at infinite dilution, which is exactly where design calculations live.',
        howto: 'Watch the two \u03b3\u221e values as you change model at fixed interaction energies \u2014 that spread is the modelling uncertainty in your column. Wilson cannot predict liquid\u2013liquid splitting no matter what you feed it; NRTL and UNIQUAC can, and the \u03b1 parameter is what switches NRTL between the two behaviours. The excess Gibbs energy curve at the bottom is the common parent of all six: every model is just a different closed form for G\u1d31.',
        std: 'Prausnitz, Lichtenthaler & de Azevedo, Molecular Thermodynamics of Fluid-Phase Equilibria, 3rd ed., Ch. 6; Renon & Prausnitz (1968); Abrams & Prausnitz (1975)',
        eqs: [['\\ln\\gamma_1 = x_2^2\\left[\\tau_{21}\\!\\left(\\frac{G_{21}}{x_1+x_2G_{21}}\\right)^{\\!2} + \\frac{\\tau_{12}G_{12}}{(x_2+x_1G_{12})^2}\\right]', 'NRTL, with G_ij = exp(\u2212\u03b1\u03c4_ij)'], ['\\ln\\gamma_i = \\ln\\gamma_i^C + \\ln\\gamma_i^R', 'UNIQUAC \u2014 combinatorial (size) plus residual (energy)'], ['\\ln\\gamma_1 = -\\ln(x_1+\\Lambda_{12}x_2) + x_2\\!\\left[\\frac{\\Lambda_{12}}{x_1+\\Lambda_{12}x_2}-\\frac{\\Lambda_{21}}{x_2+\\Lambda_{21}x_1}\\right]', 'Wilson'], ['\\frac{G^E}{RT} = x_1\\ln\\gamma_1 + x_2\\ln\\gamma_2', 'excess Gibbs energy \u2014 the common parent'], ['\\gamma_1^\\infty = \\lim_{x_1\\to 0}\\gamma_1', 'infinite-dilution limit \u2014 where models disagree most']],
        notes: ['Interaction parameters entered as energies in J/mol; \u03c4 = \u0394g/RT for NRTL, \u039b = exp(\u2212\u03bb/RT) for Wilson.', 'Two-suffix Margules uses A\u2081\u2082 only \u2014 a symmetric mixture.', 'UNIQUAC r and q taken from the selected system\u2019s components.', 'A negative G\u1d31 means the unlike pair is more strongly bound than the like pairs.'],
        params: [SEL('sys', 'System (sets r, q)', 'ew', SYSOPT), SEL('model', 'Model', 'nrtl', MODOPT), P('A12', 'Interaction A\u2081\u2082', -6000, 9000, 25, -1200, null, 'J/mol'), P('A21', 'Interaction A\u2082\u2081', -6000, 9000, 25, 6000, null, 'J/mol'), P('al', 'NRTL non-randomness \u03b1', 0.1, 0.6, 0.01, 0.3, null, '\u2014'), P('T', 'Temperature', 20, 200, 1, 78, 'T')],
        compute: v => {
          const sy = SYS[v.sys], ca = PURE[sy.a], cb = PURE[sy.b], TK = v.T + 273.15;
          const p = { A12: v.A12, A21: v.A21, al: v.al, T: TK, r1: ca.r, r2: cb.r, q1: ca.q, q2: cb.q, model: v.model };
          const g = x => GAM[v.model](x, p);
          const gE = x => { const gg = g(x); return x * Math.log(gg[0]) + (1 - x) * Math.log(gg[1]); };
          const g1inf = g(1e-6)[0], g2inf = g(1 - 1e-6)[1];
          let gEmax = 0, xmax = 0.5;
          for (let i = 1; i < 100; i++) { const x = i / 100, e = gE(x); if (Math.abs(e) > Math.abs(gEmax)) { gEmax = e; xmax = x; } }
          const alpha12 = x => { const gg = g(x); return gg[0] * Psat(ca, v.T) / (gg[1] * Psat(cb, v.T)); };
          const a0 = alpha12(1e-4), a1 = alpha12(1 - 1e-4);
          const azeo = (a0 - 1) * (a1 - 1) < 0;
          const rows = MODOPT.map(m => {
            const pp = Object.assign({}, p, { model: m[0] });
            const f = x => GAM[m[0]](x, pp);
            const i1 = f(1e-6)[0], i2 = f(1 - 1e-6)[1];
            const gm = f(0.5);
            return [m[1], i1.toPrecision(4), i2.toPrecision(4), gm[0].toFixed(3), gm[1].toFixed(3), (0.5 * Math.log(gm[0]) + 0.5 * Math.log(gm[1])).toFixed(4)];
          });
          return {
            g: g, gE: gE, ca: ca, cb: cb,
            res: [{ l: 'Model', s: MODOPT.filter(m => m[0] === v.model)[0][1], u: '' }, { l: '\u03b3\u2081 at infinite dilution', v: g1inf, u: '\u2014', d: 4 }, { l: '\u03b3\u2082 at infinite dilution', v: g2inf, u: '\u2014', d: 4 }, { l: '\u03b3\u2081 at x\u2081 = 0.5', v: g(0.5)[0], u: '\u2014', d: 4 }, { l: '\u03b3\u2082 at x\u2081 = 0.5', v: g(0.5)[1], u: '\u2014', d: 4 }, { l: 'Maximum G\u1d31/RT', v: gEmax, u: '\u2014', d: 4 }, { l: 'at composition x\u2081', v: xmax, u: '\u2014', d: 2 }, { l: 'Deviation type', s: gEmax > 0.02 ? 'positive \u2014 like pairs favoured' : gEmax < -0.02 ? 'negative \u2014 unlike pairs favoured' : 'near ideal', u: '' }, { l: 'Relative volatility at x\u21920', v: a0, u: '\u2014', d: 3 }, { l: 'Relative volatility at x\u21921', v: a1, u: '\u2014', d: 3 }, { l: 'Azeotrope predicted?', s: azeo ? (gEmax > 0 ? 'yes \u2014 minimum boiling' : 'yes \u2014 maximum boiling') : 'no \u2014 \u03b1 stays on one side of 1', u: '' }],
            table: { title: 'All six models at the same interaction energies, ' + v.T.toFixed(0) + ' \u00b0C', head: ['Model', '\u03b3\u2081\u221e', '\u03b3\u2082\u221e', '\u03b3\u2081(0.5)', '\u03b3\u2082(0.5)', 'G\u1d31/RT (0.5)'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.62;
          let gmax = 1.2; for (let i = 1; i < 100; i++) { const gg = r.g(i / 100); gmax = Math.max(gmax, gg[0], gg[1]); }
          gmax = Math.min(gmax * 1.12, 60);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 1, ymin: 0, ymax: gmax, ml: 62, mb: 20, mt: 32 });
          g.grid('', 'Activity coefficient \u03b3');
          g.title('Activity coefficients \u2014 ' + MODOPT.filter(m => m[0] === v.model)[0][1]);
          g.line([[0, 1], [1, 1]], 'rgba(29,31,32,0.22)', 1.1, [5, 4]);
          g.fn(x => Math.min(r.g(x)[0], gmax), C.acc, 2.8, null, 240);
          g.fn(x => Math.min(r.g(x)[1], gmax), C.dk, 2.8, [7, 4], 240);
          g.legend([{ c: C.acc, l: '\u03b3\u2081' }, { c: C.dk, l: '\u03b3\u2082', d: [7, 4] }]);
          let lo = 0, hi = 0; for (let i = 1; i < 100; i++) { const e = r.gE(i / 100); lo = Math.min(lo, e); hi = Math.max(hi, e); }
          const pad = Math.max(0.05, (hi - lo) * 0.2);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 1, ymin: lo - pad, ymax: hi + pad, ml: 62, mt: 12, mb: 44 });
          g2.grid('Liquid mole fraction  x\u2081', 'G\u1d31/RT', 5, 4);
          g2.line([[0, 0], [1, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g2.fn(x => r.gE(x), C.mid, 2.4, null, 200);
        }
      },
      {
        id: 'nrtlvle', num: 'Q-02', sec: S, name: 'NRTL binary VLE \u2014 T\u2013x\u2013y and azeotropes',
        blurb: 'The workhorse model of industrial VLE, drawn as the diagram a column designer actually uses. Two energy parameters and a non-randomness factor generate the whole bubble and dew envelope from pure-component vapour pressures, and locate any azeotrope to a fraction of a mole percent.',
        howto: 'Ethanol\u2013water at atmospheric pressure should put the azeotrope near x\u2081 = 0.89 and 78.2 \u00b0C \u2014 check it, then drop the pressure and watch the azeotrope move towards pure ethanol. That pressure sensitivity is the entire basis of pressure-swing distillation. Switch to acetone\u2013chloroform for the opposite case: a maximum-boiling azeotrope from negative deviations.',
        std: 'Renon & Prausnitz, AIChE J. 14 (1968) 135; Gmehling & Onken, Vapor\u2013Liquid Equilibrium Data Collection; Antoine constants from Reid, Prausnitz & Poling',
        eqs: [['y_iP = x_i\\gamma_i P_i^{sat}(T)', 'modified Raoult\u2019s law \u2014 low pressure'], ['\\tau_{ij} = \\frac{\\Delta g_{ij}}{RT},\\quad G_{ij} = \\exp(-\\alpha\\tau_{ij})', 'NRTL parameters'], ['\\sum_i x_i\\gamma_iP_i^{sat}(T) = P', 'bubble-point equation solved for T at each x'], ['\\alpha_{12} = \\frac{\\gamma_1P_1^{sat}}{\\gamma_2P_2^{sat}} = 1', 'azeotrope condition']],
        notes: ['Vapour phase ideal \u2014 valid to a few bar for these systems.', 'Antoine equation in mmHg and \u00b0C, converted internally.', '\u03b1 = 0.30 suits most non-associating pairs; 0.47 for alcohols with hydrocarbons; 0.20 for partially miscible systems.', 'Recommended parameters for each system are listed in the table.'],
        params: [SEL('sys', 'Binary system', 'ew', SYSOPT), P('Pt', 'Column pressure', 5, 800, 1, 101.3, 'P'), P('g12', 'NRTL \u0394g\u2081\u2082', -6000, 9000, 25, -1200, null, 'J/mol'), P('g21', 'NRTL \u0394g\u2082\u2081', -6000, 9000, 25, 6000, null, 'J/mol'), P('al', 'Non-randomness \u03b1', 0.1, 0.6, 0.01, 0.3, null, '\u2014')],
        compute: v => {
          const sy = SYS[v.sys], ca = PURE[sy.a], cb = PURE[sy.b];
          const mk = T => ({ A12: v.g12, A21: v.g21, al: v.al, T: T + 273.15, model: 'nrtl' });
          const curve = [];
          for (let i = 0; i <= 120; i++) {
            const x = i / 120, T = bubbleT(x, v.Pt, ca, cb, mk);
            const gg = GAM.nrtl(x, mk(T));
            const y = x * gg[0] * Psat(ca, T) / v.Pt;
            curve.push([x, Math.min(Math.max(y, 0), 1), T]);
          }
          const fAz = x => { const T = bubbleT(x, v.Pt, ca, cb, mk); const gg = GAM.nrtl(x, mk(T)); return x * gg[0] * Psat(ca, T) / v.Pt - x; };
          let xaz = NaN;
          for (let i = 1; i < 60; i++) { const a = 0.005 + 0.99 * (i - 1) / 59, b2 = 0.005 + 0.99 * i / 59; if (fAz(a) * fAz(b2) < 0) { xaz = self.bis(fAz, a, b2, 1e-9); break; } }
          const Taz = isFinite(xaz) ? bubbleT(xaz, v.Pt, ca, cb, mk) : NaN;
          const T1 = Tsat(ca, v.Pt), T2 = Tsat(cb, v.Pt);
          const alph = x => { const T = bubbleT(x, v.Pt, ca, cb, mk); const gg = GAM.nrtl(x, mk(T)); return gg[0] * Psat(ca, T) / (gg[1] * Psat(cb, T)); };
          const rec = sy;
          return {
            curve: curve, xaz: xaz, Taz: Taz, T1: T1, T2: T2, ca: ca, cb: cb,
            res: [{ l: 'Light component', s: ca.n, u: '' }, { l: 'Heavy component', s: cb.n, u: '' }, { l: 'Boiling point of (1)', v: T1, u: '\u00b0C', d: 2 }, { l: 'Boiling point of (2)', v: T2, u: '\u00b0C', d: 2 }, { l: '\u03c4\u2081\u2082 at bubble T', v: v.g12 / (Rg * (T1 + 273.15)), u: '\u2014', d: 3 }, { l: '\u03c4\u2082\u2081 at bubble T', v: v.g21 / (Rg * (T1 + 273.15)), u: '\u2014', d: 3 }, { l: 'Relative volatility at x\u21920', v: alph(1e-3), u: '\u2014', d: 3 }, { l: 'Relative volatility at x\u21921', v: alph(1 - 1e-3), u: '\u2014', d: 3 }, { l: 'Azeotrope composition x\u2081', s: isFinite(xaz) ? xaz.toFixed(4) : 'none', u: '' }, { l: 'Azeotrope temperature', v: Taz, u: '\u00b0C', d: 2 }, { l: 'Azeotrope type', s: !isFinite(xaz) ? 'zeotropic \u2014 ordinary distillation works' : Taz < Math.min(T1, T2) ? 'minimum boiling' : 'maximum boiling', u: '' }, { l: 'Design consequence', s: !isFinite(xaz) ? 'single column reaches any purity' : 'purity beyond the azeotrope needs pressure swing, entrainer or membrane', u: '' }],
            table: { title: 'Recommended parameters for the built-in systems', head: ['System', '\u0394g\u2081\u2082  J/mol', '\u0394g\u2082\u2081  J/mol', '\u03b1', '\u0394u\u2081\u2082  J/mol', '\u0394u\u2082\u2081  J/mol'], rows: Object.keys(SYS).map(k => [SYS[k].l, String(SYS[k].g12), String(SYS[k].g21), SYS[k].al.toFixed(2), String(SYS[k].u12), String(SYS[k].u21)]) }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.6;
          let tlo = 1e9, thi = -1e9; r.curve.forEach(p => { tlo = Math.min(tlo, p[2]); thi = Math.max(thi, p[2]); });
          const pad = Math.max(1.5, (thi - tlo) * 0.12);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 1, ymin: tlo - pad, ymax: thi + pad, ml: 62, mb: 20, mt: 32 });
          g.grid('', 'Temperature  \u00b0C');
          g.title('T\u2013x\u2013y at ' + v.Pt.toFixed(1) + ' kPa \u2014 ' + r.ca.n + ' / ' + r.cb.n);
          g.line(r.curve.map(p => [p[0], p[2]]), C.acc, 2.8);
          g.line(r.curve.map(p => [p[1], p[2]]), C.dk, 2.8, [7, 4]);
          if (isFinite(r.xaz)) { g.line([[r.xaz, tlo - pad], [r.xaz, r.Taz]], 'rgba(29,31,32,0.2)', 1, [4, 4]); g.dot(r.xaz, r.Taz, C.warn, 5); }
          g.legend([{ c: C.acc, l: 'bubble  x' }, { c: C.dk, l: 'dew  y', d: [7, 4] }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 62, mt: 12, mb: 44 });
          g2.grid('Liquid mole fraction  x\u2081', 'y\u2081', 5, 4);
          g2.line([[0, 0], [1, 1]], 'rgba(29,31,32,0.28)', 1.2, [5, 4]);
          g2.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.6);
          if (isFinite(r.xaz)) g2.dot(r.xaz, r.xaz, C.warn, 5);
        }
      },
      {
        id: 'uniqvle', num: 'Q-03', sec: S, name: 'UNIQUAC binary VLE \u2014 size, shape and energy',
        blurb: 'UNIQUAC splits non-ideality into a combinatorial part that depends only on molecular size and surface area, and a residual part that carries the interaction energies. The split is what lets it handle mixtures of very different molecules \u2014 a polymer in a solvent, or water in a long-chain alcohol \u2014 where a purely energetic model fails.',
        howto: 'Set both \u0394u to zero: the residual term vanishes and what remains is the athermal, entropy-only prediction from r and q alone. For ethanol\u2013water that already gives \u03b3\u2081\u221e above 1, purely from size mismatch. Then add energy and watch the residual term take over. Compare the diagram with the NRTL one in Q-02 at parameters fitted to the same data \u2014 they will agree in the middle and differ at the dilute ends.',
        std: 'Abrams & Prausnitz, AIChE J. 21 (1975) 116; Anderson & Prausnitz (1978); Poling, Prausnitz & O\u2019Connell, Ch. 8',
        eqs: [['\\ln\\gamma_i^C = \\ln\\frac{\\Phi_i}{x_i} + \\frac{z}{2}q_i\\ln\\frac{\\theta_i}{\\Phi_i} + l_i - \\frac{\\Phi_i}{x_i}\\sum_j x_jl_j', 'combinatorial \u2014 size and shape only'], ['\\ln\\gamma_1^R = q_1\\left[1-\\ln(\\theta_1+\\theta_2\\tau_{21}) - \\frac{\\theta_1}{\\theta_1+\\theta_2\\tau_{21}} - \\frac{\\theta_2\\tau_{12}}{\\theta_2+\\theta_1\\tau_{12}}\\right]', 'residual \u2014 interaction energies'], ['\\tau_{ij} = \\exp\\!\\left(-\\frac{\\Delta u_{ij}}{RT}\\right)', 'Boltzmann factor of the exchange energy'], ['\\Phi_i = \\frac{r_ix_i}{\\sum r_jx_j},\\quad \\theta_i = \\frac{q_ix_i}{\\sum q_jx_j}', 'segment and area fractions']],
        notes: ['Coordination number z fixed at 10, the conventional value.', 'r and q are van der Waals volume and area parameters from the Bondi group tables.', 'UNIFAC predicts \u0394u from group contributions when no data exist \u2014 the same residual expression is used.', 'Vapour phase ideal.'],
        params: [SEL('sys', 'Binary system', 'ew', SYSOPT), P('Pt', 'Column pressure', 5, 800, 1, 101.3, 'P'), P('u12', 'UNIQUAC \u0394u\u2081\u2082', -3000, 6000, 25, -350, null, 'J/mol'), P('u21', 'UNIQUAC \u0394u\u2082\u2081', -3000, 6000, 25, 1250, null, 'J/mol')],
        compute: v => {
          const sy = SYS[v.sys], ca = PURE[sy.a], cb = PURE[sy.b];
          const mk = T => ({ A12: v.u12, A21: v.u21, T: T + 273.15, r1: ca.r, r2: cb.r, q1: ca.q, q2: cb.q, model: 'uniquac' });
          const mkC = T => ({ A12: 0, A21: 0, T: T + 273.15, r1: ca.r, r2: cb.r, q1: ca.q, q2: cb.q, model: 'uniquac' });
          const curve = [];
          for (let i = 0; i <= 120; i++) {
            const x = Math.min(Math.max(i / 120, 1e-6), 1 - 1e-6);
            const T = bubbleT(x, v.Pt, ca, cb, mk);
            const gg = GAM.uniquac(x, mk(T));
            curve.push([x, Math.min(Math.max(x * gg[0] * Psat(ca, T) / v.Pt, 0), 1), T]);
          }
          const fAz = x => { const T = bubbleT(x, v.Pt, ca, cb, mk); const gg = GAM.uniquac(x, mk(T)); return x * gg[0] * Psat(ca, T) / v.Pt - x; };
          let xaz = NaN;
          for (let i = 1; i < 60; i++) { const a = 0.005 + 0.99 * (i - 1) / 59, b2 = 0.005 + 0.99 * i / 59; if (fAz(a) * fAz(b2) < 0) { xaz = self.bis(fAz, a, b2, 1e-9); break; } }
          const Taz = isFinite(xaz) ? bubbleT(xaz, v.Pt, ca, cb, mk) : NaN;
          const T1 = Tsat(ca, v.Pt), T2 = Tsat(cb, v.Pt), Tm = (T1 + T2) / 2;
          const full = GAM.uniquac(1e-6, mk(Tm)), comb = GAM.uniquac(1e-6, mkC(Tm));
          const full2 = GAM.uniquac(1 - 1e-6, mk(Tm)), comb2 = GAM.uniquac(1 - 1e-6, mkC(Tm));
          return {
            curve: curve, xaz: xaz, Taz: Taz, ca: ca, cb: cb,
            res: [{ l: 'r\u2081 / q\u2081', s: ca.r.toFixed(4) + ' / ' + ca.q.toFixed(3), u: '' }, { l: 'r\u2082 / q\u2082', s: cb.r.toFixed(4) + ' / ' + cb.q.toFixed(3), u: '' }, { l: 'Size ratio r\u2081/r\u2082', v: ca.r / cb.r, u: '\u2014', d: 3 }, { l: '\u03c4\u2081\u2082 at ' + Tm.toFixed(0) + ' \u00b0C', v: Math.exp(-v.u12 / (Rg * (Tm + 273.15))), u: '\u2014', d: 4 }, { l: '\u03c4\u2082\u2081 at ' + Tm.toFixed(0) + ' \u00b0C', v: Math.exp(-v.u21 / (Rg * (Tm + 273.15))), u: '\u2014', d: 4 }, { l: '\u03b3\u2081\u221e \u2014 combinatorial only', v: comb[0], u: '\u2014', d: 4 }, { l: '\u03b3\u2081\u221e \u2014 full model', v: full[0], u: '\u2014', d: 4 }, { l: '\u03b3\u2082\u221e \u2014 combinatorial only', v: comb2[1], u: '\u2014', d: 4 }, { l: '\u03b3\u2082\u221e \u2014 full model', v: full2[1], u: '\u2014', d: 4 }, { l: 'Residual contribution to \u03b3\u2081\u221e', v: full[0] / comb[0], u: '\u00d7', d: 3 }, { l: 'Azeotrope composition x\u2081', s: isFinite(xaz) ? xaz.toFixed(4) : 'none', u: '' }, { l: 'Azeotrope temperature', v: Taz, u: '\u00b0C', d: 2 }],
            table: { title: 'UNIQUAC pure-component parameters', head: ['Component', 'r (volume)', 'q (area)', 'q/r', 'T_c  K', '\u03c9'], rows: Object.keys(PURE).map(k => [PURE[k].n, PURE[k].r.toFixed(4), PURE[k].q.toFixed(3), (PURE[k].q / PURE[k].r).toFixed(3), PURE[k].Tc.toFixed(1), PURE[k].w.toFixed(4)]) }
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.6;
          let tlo = 1e9, thi = -1e9; r.curve.forEach(p => { tlo = Math.min(tlo, p[2]); thi = Math.max(thi, p[2]); });
          const pad = Math.max(1.5, (thi - tlo) * 0.12);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 1, ymin: tlo - pad, ymax: thi + pad, ml: 62, mb: 20, mt: 32 });
          g.grid('', 'Temperature  \u00b0C');
          g.title('UNIQUAC T\u2013x\u2013y at ' + v.Pt.toFixed(1) + ' kPa');
          g.line(r.curve.map(p => [p[0], p[2]]), C.acc, 2.8);
          g.line(r.curve.map(p => [p[1], p[2]]), C.dk, 2.8, [7, 4]);
          if (isFinite(r.xaz)) g.dot(r.xaz, r.Taz, C.warn, 5);
          g.legend([{ c: C.acc, l: 'bubble' }, { c: C.dk, l: 'dew', d: [7, 4] }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 62, mt: 12, mb: 44 });
          g2.grid('Liquid mole fraction  x\u2081', 'y\u2081', 5, 4);
          g2.line([[0, 0], [1, 1]], 'rgba(29,31,32,0.28)', 1.2, [5, 4]);
          g2.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.6);
          if (isFinite(r.xaz)) g2.dot(r.xaz, r.xaz, C.warn, 5);
        }
      },
      {
        id: 'cubiceos', num: 'Q-04', sec: S, name: 'Cubic equations of state \u2014 vdW, RK, SRK, PR',
        blurb: 'Four generations of the same idea: a repulsive volume term and an attractive pressure term, arranged so the algebra stays cubic in volume. The differences are in the attraction term\u2019s temperature dependence, and they show up as a factor-of-two error in liquid density if you pick the wrong one.',
        howto: 'Below the critical temperature the isotherm has three roots; the smallest is the liquid, the largest the vapour, and the middle one is mechanically unstable and has no physical meaning. Above T_c there is one root and the distinction disappears. Compare Peng\u2013Robinson with van der Waals on the same fluid: vdW gets Z_c = 0.375 for everything, PR gets 0.307, and real hydrocarbons sit near 0.27 \u2014 which is why PR is the refinery standard.',
        std: 'Soave, Chem. Eng. Sci. 27 (1972) 1197; Peng & Robinson, IECR Fund. 15 (1976) 59; Poling, Prausnitz & O\u2019Connell, Ch. 4',
        eqs: [['P = \\frac{RT}{V-b} - \\frac{a\\,\\alpha(T)}{V^2+ubV+wb^2}', 'the general cubic \u2014 u, w select the family'], ['Z^3 - (1+B-uB)Z^2 + (A+wB^2-uB-uB^2)Z - (AB+wB^2+wB^3) = 0', 'in compressibility form'], ['\\alpha(T) = \\left[1+m(1-\\sqrt{T_r})\\right]^2,\\quad m = f(\\omega)', 'Soave alpha function \u2014 the key improvement'], ['A = \\frac{aP}{R^2T^2},\\qquad B = \\frac{bP}{RT}', 'dimensionless groups']],
        notes: ['Pure component only; mixing rules are not applied here.', 'u = 0, w = 0 for van der Waals; u = 1, w = 0 for RK and SRK; u = 2, w = \u22121 for Peng\u2013Robinson.', 'Roots below b are rejected as unphysical.', 'Critical compressibility is a fixed property of each equation, independent of fluid.'],
        params: [SEL('cmp', 'Component', 'benzene', () => self.cmpOpts()), SEL('eos', 'Equation of state', 'pr', EOSOPT), P('T', 'Temperature', -50, 500, 1, 100, 'T'), P('Pk', 'Pressure', 10, 20000, 10, 300, 'P')],
        compute: v => {
          const c = PURE[v.cmp], TK = v.T + 273.15;
          const z = eosZ(v.eos, TK, v.Pk, c.Tc, c.Pc, c.w);
          const roots = z.roots;
          const Zv = roots.length ? roots[roots.length - 1] : NaN, Zl = roots.length ? roots[0] : NaN;
          const Vv = Zv * Rg * TK / v.Pk, Vl = Zl * Rg * TK / v.Pk;
          const Tr = TK / c.Tc, Pr = v.Pk / (c.Pc * 100);
          const Zc = { vdw: 0.375, rk: 1 / 3, srk: 1 / 3, pr: 0.30740 }[v.eos];
          const phiV = Math.exp(lnPhi(v.eos, Zv, z.A, z.B)), phiL = Math.exp(lnPhi(v.eos, Zl, z.A, z.B));
          const two = roots.length >= 3;
          const Pvap = Psat(c, v.T);
          const isoP = V => { const e = z.e; return Rg * TK / (V - e.b) - e.a / (V * V + e.u * e.b * V + e.w * e.b * e.b); };
          const rows = EOSOPT.map(k => {
            const zz = eosZ(k[0], TK, v.Pk, c.Tc, c.Pc, c.w);
            const rz = zz.roots;
            const zv = rz.length ? rz[rz.length - 1] : NaN, zl = rz.length ? rz[0] : NaN;
            return [k[1], zz.A.toFixed(5), zz.B.toFixed(5), isFinite(zv) ? zv.toFixed(5) : '\u2014', rz.length >= 3 ? zl.toFixed(5) : '\u2014', isFinite(zv) ? (c.M / (zv * Rg * TK / v.Pk) ).toFixed(2) : '\u2014'];
          });
          return {
            z: z, isoP: isoP, Zv: Zv, Zl: Zl, two: two, c: c, TK: TK,
            res: [{ l: 'Reduced temperature T_r', v: Tr, u: '\u2014', d: 4 }, { l: 'Reduced pressure P_r', v: Pr, u: '\u2014', d: 4 }, { l: 'Dimensionless A', v: z.A, u: '\u2014', d: 5 }, { l: 'Dimensionless B', v: z.B, u: '\u2014', d: 5 }, { l: 'Number of real roots', s: String(roots.length), u: '' }, { l: 'Vapour Z', v: Zv, u: '\u2014', d: 5 }, { l: 'Liquid Z', v: two ? Zl : NaN, u: '\u2014', d: 5 }, { l: 'Vapour molar volume', v: Vv * 1000, u: 'L/mol', d: 5 }, { l: 'Liquid molar volume', v: two ? Vl * 1000 : NaN, u: 'L/mol', d: 5 }, { l: 'Vapour density', v: c.M / (Vv * 1000), u: 'kg/m\u00b3', d: 3 }, { l: 'Liquid density', v: two ? c.M / (Vl * 1000) : NaN, u: 'kg/m\u00b3', d: 1 }, { l: 'Fugacity coefficient \u03d5 (vap)', v: phiV, u: '\u2014', d: 5 }, { l: 'Fugacity coefficient \u03d5 (liq)', v: two ? phiL : NaN, u: '\u2014', d: 5 }, { l: 'Antoine P_sat here', v: Pvap, u: 'kPa', d: 3 }, { l: 'Phase', s: Tr > 1 ? 'supercritical' : !two ? (v.Pk < Pvap ? 'vapour' : 'liquid') : (Math.abs(phiV - phiL) / Math.max(phiV, 1e-9) < 0.02 ? 'two-phase \u2014 at saturation' : v.Pk < Pvap ? 'vapour root is stable' : 'liquid root is stable'), u: '' }, { l: 'Equation Z_c', v: Zc, u: '\u2014', d: 5 }],
            table: { title: 'The four equations at ' + v.T.toFixed(0) + ' \u00b0C and ' + v.Pk.toFixed(0) + ' kPa', head: ['Equation', 'A', 'B', 'Z (vapour)', 'Z (liquid)', '\u03c1_v  kg/m\u00b3'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const bb = r.z.e.b;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: bb * 1.05, xmax: bb * 400, ymin: Math.max(v.Pk * 0.02, 1), ymax: v.Pk * 30, xlog: true, ylog: true, ml: 66 });
          g.grid('Molar volume  m\u00b3/mol', 'Pressure  kPa');
          g.title('Isotherms \u2014 ' + r.c.n + ', ' + EOS[v.eos]);
          g.line([[bb * 1.05, v.Pk], [bb * 400, v.Pk]], C.lt, 1.3, [6, 4]);
          [0.75, 0.85, 0.95, 1.0, 1.15].forEach(tr => {
            const T2 = tr * r.c.Tc;
            const e2 = eosAB(v.eos, T2, v.Pk, r.c.Tc, r.c.Pc, r.c.w);
            g.fn(V => { const p = Rg * T2 / (V - e2.b) - e2.a / (V * V + e2.u * e2.b * V + e2.w * e2.b * e2.b); return p > 0 ? p : NaN; }, tr === 1 ? C.dk : 'rgba(29,31,32,0.16)', tr === 1 ? 1.8 : 1.2, tr === 1 ? [5, 4] : null, 400);
          });
          g.fn(V => { const p = r.isoP(V); return p > 0 ? p : NaN; }, C.acc, 2.8, null, 500);
          if (isFinite(r.Zv)) g.dot(r.Zv * Rg * r.TK / v.Pk, v.Pk, C.acc, 5);
          if (r.two) g.dot(r.Zl * Rg * r.TK / v.Pk, v.Pk, C.warn, 5);
          g.legend([{ c: C.acc, l: 'T = ' + v.T.toFixed(0) + ' \u00b0C' }, { c: C.dk, l: 'critical isotherm', d: [5, 4] }, { c: C.lt, l: 'operating P', d: [6, 4] }]);
        }
      },
      {
        id: 'depart', num: 'Q-05', sec: S, name: 'Fugacity & departure functions',
        blurb: 'The bridge from an equation of state to an energy balance. Enthalpy and entropy of a real fluid are the ideal-gas values plus a departure computed by integrating the equation of state; fugacity coefficient is the same integral for the Gibbs energy. Compressor duties and flash enthalpies stand or fall on these numbers.',
        howto: 'Sweep pressure at fixed temperature and watch the departure grow \u2014 near the critical point it is a large fraction of the total enthalpy, which is why shortcut compressor calculations fail there. The fugacity coefficient tells you the same story in equilibrium terms: at \u03d5 near 1 an ideal-gas K-value is fine; at \u03d5 = 0.6 it is out by 40 %.',
        std: 'Smith, Van Ness & Abbott, Introduction to Chemical Engineering Thermodynamics, 8th ed., Ch. 6 & 11; Poling et al., Ch. 5',
        eqs: [['\\ln\\phi = Z - 1 - \\ln(Z-B) - \\frac{A}{2\\sqrt2 B}\\ln\\frac{Z+(1+\\sqrt2)B}{Z+(1-\\sqrt2)B}', 'Peng\u2013Robinson fugacity coefficient'], ['\\frac{H^R}{RT} = Z - 1 + \\frac{T\\frac{da}{dT}-a}{bRT}\\,I', 'residual enthalpy'], ['\\frac{S^R}{R} = \\ln(Z-B) + \\frac{1}{bR}\\frac{da}{dT}\\,I', 'residual entropy'], ['f = \\phi P,\\qquad \\mu - \\mu^{ig} = RT\\ln\\phi', 'fugacity and the chemical-potential departure']],
        notes: ['da/dT evaluated numerically by central difference on the alpha function.', 'I = ln(1+B/Z) for SRK, and the Peng\u2013Robinson logarithmic group otherwise.', 'Ideal-gas reference is the same species at the same temperature and 1 bar.', 'Residual properties are per mole.'],
        params: [SEL('cmp', 'Component', 'methanol', () => self.cmpOpts()), SEL('eos', 'Equation of state', 'pr', [['srk', 'Soave\u2013Redlich\u2013Kwong'], ['pr', 'Peng\u2013Robinson']]), P('T', 'Temperature', -50, 500, 1, 200, 'T'), P('Pk', 'Pressure', 10, 15000, 10, 2000, 'P')],
        compute: v => {
          const c = PURE[v.cmp], TK = v.T + 273.15;
          const dep = (T, Pk) => {
            const z = eosZ(v.eos, T, Pk, c.Tc, c.Pc, c.w);
            if (!z.roots.length) return null;
            const Z = z.roots[z.roots.length - 1], e = z.e, A = z.A, B = z.B;
            const h = 0.5;
            const ap = eosAB(v.eos, T + h, Pk, c.Tc, c.Pc, c.w).a, am = eosAB(v.eos, T - h, Pk, c.Tc, c.Pc, c.w).a;
            const dadT = (ap - am) / (2 * h);
            const I = v.eos === 'pr' ? (1 / (2 * Math.SQRT2)) * Math.log((Z + (1 + Math.SQRT2) * B) / (Z + (1 - Math.SQRT2) * B)) : Math.log(1 + B / Z);
            const HR = Rg * T * (Z - 1) + (T * dadT - e.a) / e.b * I;
            const SR = Rg * Math.log(Z - B) + dadT / e.b * I;
            return { Z: Z, A: A, B: B, phi: Math.exp(lnPhi(v.eos, Z, A, B)), HR: HR, SR: SR, dadT: dadT, GR: Rg * T * lnPhi(v.eos, Z, A, B) };
          };
          const d = dep(TK, v.Pk);
          const curve = [];
          for (let i = 1; i <= 160; i++) { const Pk = 10 + (Math.min(v.Pk * 2.2, 15000) - 10) * i / 160; const dd = dep(TK, Pk); if (dd) curve.push([Pk, dd.phi, dd.HR / 1000, dd.SR]); }
          const Tr = TK / c.Tc;
          return {
            d: d, curve: curve, c: c,
            res: d ? [{ l: 'Reduced temperature T_r', v: Tr, u: '\u2014', d: 4 }, { l: 'Compressibility Z', v: d.Z, u: '\u2014', d: 5 }, { l: 'Fugacity coefficient \u03d5', v: d.phi, u: '\u2014', d: 5 }, { l: 'Fugacity f = \u03d5P', v: d.phi * v.Pk, u: 'kPa', d: 2 }, { l: 'Residual enthalpy H\u1d3f', v: d.HR / 1000, u: 'kJ/mol', d: 4 }, { l: 'Residual entropy S\u1d3f', v: d.SR, u: 'J/mol\u00b7K', d: 4 }, { l: 'Residual Gibbs G\u1d3f', v: d.GR / 1000, u: 'kJ/mol', d: 4 }, { l: 'H\u1d3f per unit mass', v: d.HR / c.M, u: 'kJ/kg', d: 2 }, { l: 'da/dT', v: d.dadT, u: 'Pa\u00b7m\u2076/mol\u00b2K', d: 6 }, { l: 'Departure significance', s: Math.abs(d.phi - 1) < 0.03 ? 'near ideal \u2014 ideal-gas shortcuts acceptable' : Math.abs(d.phi - 1) < 0.15 ? 'moderate \u2014 include the departure' : 'large \u2014 ideal-gas assumptions will fail', u: '' }] : [{ l: 'No real root', s: 'adjust T or P', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.5;
          const pmax = r.curve.length ? r.curve[r.curve.length - 1][0] : v.Pk;
          let plo = 1, phi2 = 1.05; r.curve.forEach(p => { plo = Math.min(plo, p[1]); phi2 = Math.max(phi2, p[1]); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: pmax, ymin: Math.max(0, plo * 0.92), ymax: phi2 * 1.04, ml: 66, mb: 18, mt: 32 });
          g.grid('', 'Fugacity coefficient \u03d5');
          g.title('Departure from ideality \u2014 ' + r.c.n + ' at ' + v.T.toFixed(0) + ' \u00b0C');
          g.line([[0, 1], [pmax, 1]], 'rgba(29,31,32,0.25)', 1.1, [5, 4]);
          g.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.6);
          if (r.d) g.dot(v.Pk, r.d.phi, C.acc, 5);
          let hlo = 0, hhi = 0; r.curve.forEach(p => { hlo = Math.min(hlo, p[2]); hhi = Math.max(hhi, p[2]); });
          const pad = Math.max(0.5, (hhi - hlo) * 0.15);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: pmax, ymin: hlo - pad, ymax: hhi + pad, ml: 66, mt: 14, mb: 46 });
          g2.grid('Pressure  kPa', 'H\u1d3f  kJ/mol', 5, 4);
          g2.line([[0, 0], [pmax, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g2.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2.6);
          if (r.d) g2.dot(v.Pk, r.d.HR / 1000, C.dk, 5);
        }
      },
      {
        id: 'lle', num: 'Q-06', sec: S, name: 'Liquid\u2013liquid equilibrium & the miscibility gap',
        blurb: 'When the excess Gibbs energy of mixing is large and positive, the single-phase curve develops two minima and the mixture splits. The binodal points are found by the common-tangent construction, and everything about extraction \u2014 tie lines, solvent capacity, the plait point \u2014 follows from it.',
        howto: 'Raise the interaction energies until \u0394G_mix loses its single minimum. The two tangent points are the compositions of the coexisting phases; the inflections between them are the spinodal, inside which the mixture is unstable to any fluctuation and separates spontaneously. Between binodal and spinodal it is metastable and needs a nucleus. Cool the system and the gap widens \u2014 the upper critical solution temperature is where it closes.',
        std: 'Prausnitz et al., Ch. 6; Sorensen & Arlt, Liquid\u2013Liquid Equilibrium Data Collection; Walas, Phase Equilibria in Chemical Engineering, Ch. 6',
        eqs: [['\\frac{\\Delta G_{mix}}{RT} = x_1\\ln(x_1\\gamma_1) + x_2\\ln(x_2\\gamma_2)', 'Gibbs energy of mixing'], ['(x_1\\gamma_1)^\\alpha = (x_1\\gamma_1)^\\beta,\\quad (x_2\\gamma_2)^\\alpha = (x_2\\gamma_2)^\\beta', 'isoactivity \u2014 the equilibrium condition'], ['\\frac{\\partial^2 \\Delta G_{mix}}{\\partial x_1^2} = 0', 'spinodal \u2014 limit of metastability'], ['K_D = \\frac{x_1^\\beta}{x_1^\\alpha}', 'distribution coefficient for extraction']],
        notes: ['NRTL used throughout; \u03b1 near 0.2 is the usual choice for partially miscible pairs.', 'Binodal located by solving the two isoactivity equations on a composition grid.', 'A single minimum means the pair is fully miscible at this temperature.', 'Binary only \u2014 ternary extraction diagrams are in module S-06.'],
        params: [P('g12', 'NRTL \u0394g\u2081\u2082', 0, 14000, 50, 5200, null, 'J/mol'), P('g21', 'NRTL \u0394g\u2082\u2081', 0, 14000, 50, 5600, null, 'J/mol'), P('al', 'Non-randomness \u03b1', 0.1, 0.6, 0.01, 0.2, null, '\u2014'), P('T', 'Temperature', 0, 200, 1, 25, 'T')],
        compute: v => {
          const TK = v.T + 273.15;
          const p = { A12: v.g12, A21: v.g21, al: v.al, T: TK, model: 'nrtl' };
          const act = x => { const g = GAM.nrtl(x, p); return [x * g[0], (1 - x) * g[1]]; };
          const dG = x => { if (x <= 0 || x >= 1) return 0; const a = act(x); return x * Math.log(a[0]) + (1 - x) * Math.log(a[1]); };
          const d2 = x => { const h = 1e-4; return (dG(x + h) - 2 * dG(x) + dG(x - h)) / (h * h); };
          let sp1 = NaN, sp2 = NaN;
          for (let i = 2; i < 998; i++) { const a = i / 1000, b2 = (i + 1) / 1000; if (d2(a) * d2(b2) < 0) { if (!isFinite(sp1)) sp1 = self.bis(d2, a, b2, 1e-8); else sp2 = self.bis(d2, a, b2, 1e-8); } }
          const split = isFinite(sp1) && isFinite(sp2);
          let xa = NaN, xb = NaN;
          if (split) {
            /* common tangent: minimise over pairs bracketing the spinodal */
            let best = 1e30;
            for (let i = 1; i < 200; i++) {
              const A = sp1 * i / 200;
              const f = X => (act(X)[0] - act(A)[0]);
              let B2 = NaN;
              for (let j = 1; j < 200; j++) { const u1 = sp2 + (1 - sp2) * (j - 1) / 200, u2 = sp2 + (1 - sp2) * j / 200; if (f(u1) * f(u2) < 0) { B2 = self.bis(f, u1, u2, 1e-10); break; } }
              if (!isFinite(B2)) continue;
              const err = Math.abs(act(A)[1] - act(B2)[1]);
              if (err < best) { best = err; xa = A; xb = B2; }
            }
          }
          const gap = split && isFinite(xa) ? xb - xa : 0;
          const KD = split && isFinite(xa) ? xb / Math.max(xa, 1e-12) : NaN;
          return {
            dG: dG, xa: xa, xb: xb, sp1: sp1, sp2: sp2, split: split, act: act,
            res: [{ l: 'Phase behaviour', s: split ? 'two liquid phases' : 'completely miscible', u: '' }, { l: '\u03c4\u2081\u2082', v: v.g12 / (Rg * TK), u: '\u2014', d: 3 }, { l: '\u03c4\u2082\u2081', v: v.g21 / (Rg * TK), u: '\u2014', d: 3 }, { l: '\u03b3\u2081 at infinite dilution', v: GAM.nrtl(1e-6, p)[0], u: '\u2014', d: 3 }, { l: '\u03b3\u2082 at infinite dilution', v: GAM.nrtl(1 - 1e-6, p)[1], u: '\u2014', d: 3 }, { l: 'Binodal \u2014 phase \u03b1, x\u2081', v: xa, u: '\u2014', d: 4 }, { l: 'Binodal \u2014 phase \u03b2, x\u2081', v: xb, u: '\u2014', d: 4 }, { l: 'Miscibility gap width', v: gap, u: 'mole fraction', d: 4 }, { l: 'Spinodal \u2014 lower', v: sp1, u: '\u2014', d: 4 }, { l: 'Spinodal \u2014 upper', v: sp2, u: '\u2014', d: 4 }, { l: 'Metastable band (left)', v: isFinite(xa) ? sp1 - xa : NaN, u: '\u2014', d: 4 }, { l: 'Distribution coefficient K_D', v: KD, u: '\u2014', d: 3 }, { l: 'Extraction reading', s: !split ? 'no solvent pair here' : KD > 20 ? 'strong split \u2014 good solvent selectivity' : 'weak split \u2014 many stages needed', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let lo = 0, hi = 0.02;
          for (let i = 1; i < 200; i++) { const e = r.dG(i / 200); lo = Math.min(lo, e); hi = Math.max(hi, e); }
          const pad = Math.max(0.02, (hi - lo) * 0.2);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1, ymin: lo - pad, ymax: hi + pad, ml: 66 });
          g.grid('Mole fraction  x\u2081', '\u0394G_mix / RT');
          g.title('Gibbs energy of mixing \u2014 common tangent construction');
          g.line([[0, 0], [1, 0]], 'rgba(29,31,32,0.22)', 1.1);
          if (r.split && isFinite(r.xa)) {
            g.fill([[r.xa, lo - pad], [r.xb, lo - pad], [r.xb, hi + pad], [r.xa, hi + pad]], C.soft);
            g.fill([[r.sp1, lo - pad], [r.sp2, lo - pad], [r.sp2, hi + pad], [r.sp1, hi + pad]], C.soft2);
            g.line([[r.xa, r.dG(r.xa)], [r.xb, r.dG(r.xb)]], C.warn, 1.8, [7, 4]);
            g.dot(r.xa, r.dG(r.xa), C.warn, 5); g.dot(r.xb, r.dG(r.xb), C.warn, 5);
            g.cross(r.sp1, r.dG(r.sp1), C.mid, 6); g.cross(r.sp2, r.dG(r.sp2), C.mid, 6);
          }
          g.fn(x => r.dG(x), C.acc, 2.8, null, 400);
          if (g.w > 320 && r.split) { g.txt('binodal', r.xa, hi + pad * 0.4, C.warn, 'center', 11.5); g.txt('spinodal \u2014 unstable', (r.sp1 + r.sp2) / 2, hi + pad * 0.4, C.mid, 'center', 11.5); }
          g.legend([{ c: C.acc, l: '\u0394G_mix/RT' }, { c: C.warn, l: 'common tangent', d: [7, 4] }]);
        }
      },
      {
        id: 'vappres', num: 'Q-07', sec: S, name: 'Vapour pressure correlations',
        blurb: 'Everything in low-pressure phase equilibrium multiplies a vapour pressure, so an error here propagates straight into K-values and stage counts. Antoine, Clausius\u2013Clapeyron and the Riedel\u2013corresponding-states form are compared over the same range, with the enthalpy of vaporisation recovered from the slope.',
        howto: 'The Clausius\u2013Clapeyron line is straight on a ln P against 1/T plot; the real curve is not, and the gap is where Antoine\u2019s third constant earns its place. Extrapolate beyond the fitted range and Antoine goes badly wrong \u2014 note where the curves separate. The heat of vaporisation read off the local slope should fall as temperature rises and vanish at the critical point; a correlation that does not do that cannot be trusted near T_c.',
        std: 'Poling, Prausnitz & O\u2019Connell, The Properties of Gases and Liquids, 5th ed., Ch. 7; Reid et al. Antoine constants',
        eqs: [['\\log_{10}P^{sat} = A - \\frac{B}{T+C}', 'Antoine \u2014 mmHg and \u00b0C in these constants'], ['\\ln P^{sat} = -\\frac{\\Delta H_{vap}}{R}\\frac{1}{T} + \\text{const}', 'Clausius\u2013Clapeyron \u2014 constant \u0394H'], ['\\Delta H_{vap} = \\frac{2.303\\,R\\,B\\,T^2}{(T+C-273.15)^2}', 'from the local Antoine slope'], ['\\frac{\\Delta H_{vap}}{\\Delta H_{vap,b}} = \\left(\\frac{1-T_r}{1-T_{rb}}\\right)^{0.38}', 'Watson correlation for extrapolation']],
        notes: ['Antoine constants valid roughly from the melting point to about T_r = 0.85.', 'Clausius\u2013Clapeyron anchored to the normal boiling point with the Antoine \u0394H there.', 'Trouton\u2019s rule (\u0394S_vap \u2248 88 J/mol\u00b7K) shown as a sanity check \u2014 associating liquids exceed it.'],
        params: [SEL('cmp', 'Component', 'water', () => self.cmpOpts()), P('T', 'Temperature', -50, 350, 1, 80, 'T'), P('Tlo', 'Plot lower limit', -80, 200, 5, 0, 'T'), P('Thi', 'Plot upper limit', 20, 450, 5, 200, 'T')],
        compute: v => {
          const c = PURE[v.cmp];
          const Ps = T => Psat(c, T);
          const Tb = Tsat(c, 101.325);
          const dHv = T => 2.303 * Rg * c.B * Math.pow(T + 273.15, 2) / Math.pow(T + c.Cc, 2);
          const dHb = dHv(Tb);
          const ccP = T => 101.325 * Math.exp(-dHb / Rg * (1 / (T + 273.15) - 1 / (Tb + 273.15)));
          const Tr = (v.T + 273.15) / c.Tc, Trb = (Tb + 273.15) / c.Tc;
          const watson = dHb * Math.pow((1 - Tr) / (1 - Trb), 0.38);
          const trouton = dHb / (Tb + 273.15);
          const rows = [];
          for (let i = 0; i <= 8; i++) {
            const T = v.Tlo + (v.Thi - v.Tlo) * i / 8;
            rows.push([T.toFixed(1), Ps(T).toPrecision(4), ccP(T).toPrecision(4), ((ccP(T) / Ps(T) - 1) * 100).toFixed(1) + ' %', (dHv(T) / 1000).toFixed(2), (((T + 273.15) / c.Tc)).toFixed(3)]);
          }
          return {
            Ps: Ps, ccP: ccP, c: c, Tb: Tb,
            res: [{ l: 'Component', s: c.n, u: '' }, { l: 'Vapour pressure at T', v: Ps(v.T), u: 'kPa', d: 4 }, { l: 'Normal boiling point', v: Tb, u: '\u00b0C', d: 2 }, { l: 'Critical temperature', v: c.Tc - 273.15, u: '\u00b0C', d: 1 }, { l: 'Reduced temperature T_r', v: Tr, u: '\u2014', d: 4 }, { l: '\u0394H_vap at T (Antoine slope)', v: dHv(v.T) / 1000, u: 'kJ/mol', d: 3 }, { l: '\u0394H_vap at T (Watson)', v: watson / 1000, u: 'kJ/mol', d: 3 }, { l: '\u0394H_vap at normal b.p.', v: dHb / 1000, u: 'kJ/mol', d: 3 }, { l: 'Per unit mass at b.p.', v: dHb / c.M, u: 'kJ/kg', d: 1 }, { l: 'Trouton \u0394S_vap', v: trouton, u: 'J/mol\u00b7K', d: 2 }, { l: 'Association', s: trouton > 100 ? 'strongly associating \u2014 hydrogen bonded' : trouton > 92 ? 'mildly associating' : 'normal liquid \u2014 Trouton holds', u: '' }, { l: 'Clausius\u2013Clapeyron error at T', v: (ccP(v.T) / Ps(v.T) - 1) * 100, u: '%', d: 2 }, { l: 'Extrapolation warning', s: Tr > 0.85 ? 'beyond the reliable Antoine range' : 'within range', u: '' }],
            table: { title: 'Antoine against Clausius\u2013Clapeyron across the plotted range', head: ['T  \u00b0C', 'Antoine  kPa', 'C\u2013C  kPa', 'error', '\u0394H_vap  kJ/mol', 'T_r'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const lo = Math.min(v.Tlo, v.Thi - 10), hi = Math.max(v.Thi, v.Tlo + 10);
          let pmin = 1e9, pmax = -1e9;
          for (let i = 0; i <= 60; i++) { const T = lo + (hi - lo) * i / 60; const p = r.Ps(T); if (p > 0) { pmin = Math.min(pmin, p); pmax = Math.max(pmax, p); } }
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1 / (hi + 273.15), xmax: 1 / (lo + 273.15), ymin: Math.max(pmin * 0.4, 1e-3), ymax: pmax * 3, ylog: true, ml: 66 });
          g.grid('1 / T   K\u207b\u00b9', 'Vapour pressure  kPa', 5, 5, x => (x * 1000).toFixed(2));
          g.title('Vapour pressure of ' + r.c.n);
          g.line([[1 / (hi + 273.15), 101.325], [1 / (lo + 273.15), 101.325]], C.lt, 1.3, [6, 4]);
          const pts = [], cc = [];
          for (let i = 0; i <= 240; i++) { const T = lo + (hi - lo) * i / 240; pts.push([1 / (T + 273.15), r.Ps(T)]); cc.push([1 / (T + 273.15), r.ccP(T)]); }
          g.line(cc, C.mid, 1.8, [7, 4]);
          g.line(pts, C.acc, 2.8);
          g.dot(1 / (v.T + 273.15), r.Ps(v.T), C.acc, 5);
          if (r.Tb > lo && r.Tb < hi) g.cross(1 / (r.Tb + 273.15), 101.325, C.dk, 7);
          g.legend([{ c: C.acc, l: 'Antoine' }, { c: C.mid, l: 'Clausius\u2013Clapeyron', d: [7, 4] }, { c: C.lt, l: '1 atm', d: [6, 4] }]);
        }
      },
      {
        id: 'consist', num: 'Q-08', sec: S, name: 'Thermodynamic consistency tests',
        blurb: 'The Gibbs\u2013Duhem equation constrains any set of activity coefficients: they cannot vary independently. Data that violate it are wrong, and the area and point tests are how a regression is defended. This generates data from a model, adds a systematic bias, and shows what each test detects.',
        howto: 'With no bias the areas above and below the axis cancel and the Herington index is near zero. Add a bias to one component only \u2014 the classic effect of a mis-calibrated analyser \u2014 and the area test lights up immediately. The Van Ness point test is stricter: it fits the pressure and looks at the residual in y, and it catches errors the area test integrates away.',
        std: 'Herington, J. Inst. Petrol. 37 (1951) 457; Van Ness, Byer & Gibbs, AIChE J. 19 (1973) 238; Wisniak (1993); Gmehling & Onken evaluation criteria',
        eqs: [['\\sum_i x_i\\,d\\ln\\gamma_i = 0\\quad (T,P\\ \\text{const})', 'Gibbs\u2013Duhem'], ['\\int_0^1 \\ln\\frac{\\gamma_1}{\\gamma_2}\\,dx_1 = 0', 'Redlich\u2013Kister area test'], ['D = 100\\frac{|A^+ - A^-|}{A^+ + A^-},\\quad J = 150\\frac{T_{max}-T_{min}}{T_{min}}', 'Herington indices \u2014 pass if D \u2212 J < 10'], ['\\overline{|\\Delta y|} = \\frac{1}{n}\\sum|y_i^{exp}-y_i^{calc}| < 0.01', 'Van Ness point test']],
        notes: ['Reference data generated from the NRTL model at the stated parameters.', 'Bias applied as a multiplicative error on \u03b3\u2081 across the whole composition range.', 'The Herington J correction accounts for the non-isothermal nature of isobaric data.', 'Point-test residuals are computed against a Barker fit of the biased data.'],
        params: [SEL('sys', 'Binary system', 'ew', SYSOPT), P('g12', 'NRTL \u0394g\u2081\u2082', -6000, 9000, 25, -1200, null, 'J/mol'), P('g21', 'NRTL \u0394g\u2082\u2081', -6000, 9000, 25, 6000, null, 'J/mol'), P('al', 'Non-randomness \u03b1', 0.1, 0.6, 0.01, 0.3, null, '\u2014'), P('bias', 'Systematic bias on \u03b3\u2081', -25, 25, 0.5, 0, null, '%'), P('noise', 'Random scatter', 0, 8, 0.1, 0, null, '%'), P('seed', 'Random seed', 1, 40, 1, 3, null, '\u2014'), P('Pt', 'Pressure', 20, 400, 1, 101.3, 'P')],
        compute: v => {
          const sy = SYS[v.sys], ca = PURE[sy.a], cb = PURE[sy.b];
          const mk = T => ({ A12: v.g12, A21: v.g21, al: v.al, T: T + 273.15, model: 'nrtl' });
          let s = v.seed * 7919 + 104729;
          const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
          const pts = [];
          let Tmin = 1e9, Tmax = -1e9;
          for (let i = 1; i < 60; i++) {
            const x = i / 60, T = bubbleT(x, v.Pt, ca, cb, mk);
            const g = GAM.nrtl(x, mk(T));
            const g1 = g[0] * (1 + v.bias / 100) * (1 + rnd() * v.noise / 50);
            const g2 = g[1] * (1 + rnd() * v.noise / 50);
            pts.push([x, Math.log(g1 / g2), T, g1, g2]);
            Tmin = Math.min(Tmin, T); Tmax = Math.max(Tmax, T);
          }
          let Ap = 0, Am = 0;
          for (let i = 1; i < pts.length; i++) {
            const dx = pts[i][0] - pts[i - 1][0], av = (pts[i][1] + pts[i - 1][1]) / 2;
            if (av > 0) Ap += av * dx; else Am += -av * dx;
          }
          const D = 100 * Math.abs(Ap - Am) / Math.max(Ap + Am, 1e-12);
          const J = 150 * (Tmax - Tmin) / (Tmin + 273.15);
          const DJ = D - J;
          let dy = 0;
          pts.forEach(p => {
            const g = GAM.nrtl(p[0], mk(p[2]));
            const yb = p[0] * p[3] * Psat(ca, p[2]) / v.Pt;
            const yc = p[0] * g[0] * Psat(ca, p[2]) / v.Pt;
            dy += Math.abs(yb - yc);
          });
          dy /= pts.length;
          const pass = DJ < 10, ptPass = dy < 0.01;
          return {
            pts: pts, Ap: Ap, Am: Am,
            res: [{ l: 'Positive area A\u207a', v: Ap, u: '\u2014', d: 5 }, { l: 'Negative area A\u207b', v: Am, u: '\u2014', d: 5 }, { l: 'Net area', v: Ap - Am, u: '\u2014', d: 5 }, { l: 'Herington D', v: D, u: '\u2014', d: 2 }, { l: 'Herington J', v: J, u: '\u2014', d: 2 }, { l: 'D \u2212 J', v: DJ, u: '\u2014', d: 2 }, { l: 'Area test', s: pass ? 'PASS \u2014 D \u2212 J < 10' : 'FAIL \u2014 data thermodynamically inconsistent', u: '' }, { l: 'Mean |\u0394y| (point test)', v: dy, u: '\u2014', d: 5 }, { l: 'Van Ness point test', s: ptPass ? 'PASS \u2014 mean |\u0394y| < 0.01' : 'FAIL \u2014 residuals too large', u: '' }, { l: 'Boiling range \u0394T', v: Tmax - Tmin, u: 'K', d: 2 }, { l: 'Diagnosis', s: !pass && Math.abs(v.bias) > 5 ? 'systematic bias detected \u2014 check the analyser calibration' : !ptPass ? 'scatter dominates \u2014 repeat the measurements' : 'data acceptable for regression', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let lo = 0, hi = 0; r.pts.forEach(p => { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
          const pad = Math.max(0.1, (hi - lo) * 0.2);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1, ymin: lo - pad, ymax: hi + pad, ml: 66 });
          g.grid('Liquid mole fraction  x\u2081', 'ln (\u03b3\u2081 / \u03b3\u2082)');
          g.title('Redlich\u2013Kister area test');
          const zero = [];
          for (let i = 0; i <= 1; i++) zero.push([i, 0]);
          const pos = r.pts.filter(p => p[1] > 0), neg = r.pts.filter(p => p[1] < 0);
          if (pos.length > 1) g.fill([[pos[0][0], 0]].concat(pos.map(p => [p[0], p[1]])).concat([[pos[pos.length - 1][0], 0]]), C.soft);
          if (neg.length > 1) g.fill([[neg[0][0], 0]].concat(neg.map(p => [p[0], p[1]])).concat([[neg[neg.length - 1][0], 0]]), C.soft2);
          g.line(zero, 'rgba(29,31,32,0.3)', 1.3);
          g.line(r.pts.map(p => [p[0], p[1]]), C.acc, 2.6);
          r.pts.forEach((p, i) => { if (i % 4 === 0) g.dot(p[0], p[1], C.dk, 2.6); });
          if (g.w > 300) { g.txt('A\u207a = ' + r.Ap.toFixed(4), 0.04, hi + pad * 0.45, C.mid, 'left', 12); g.txt('A\u207b = ' + r.Am.toFixed(4), 0.04, lo - pad * 0.45, C.mid, 'left', 12); }
          g.legend([{ c: C.acc, l: 'ln(\u03b3\u2081/\u03b3\u2082)' }]);
        }
      }
    ];
  }

  /* ══ MULTICOMPONENT DISTILLATION ══════════════════════════ */
