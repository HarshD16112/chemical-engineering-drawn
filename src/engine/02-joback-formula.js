  /* ── Joback group contributions, shared by the estimator and T-10 ── */
  get JOB() {
    /* [label, dTc, dPc, dVc, dTb, atoms, cpa, cpb, cpc, cpd, dHv] */
    return {
      ch3: ['\u2013CH\u2083 methyl', 0.0141, -0.0012, 65, 23.58, 4, 19.50, -8.08e-3, 1.53e-4, -9.67e-8, 217],
      ch2: ['\u2013CH\u2082\u2013 methylene', 0.0189, 0, 56, 22.88, 3, -0.909, 9.50e-2, -5.44e-5, 1.19e-8, 619],
      ch: ['>CH\u2013 methine', 0.0164, 0.0020, 41, 21.74, 2, -23.0, 2.04e-1, -2.65e-4, 1.20e-7, 179],
      cq: ['>C< quaternary', 0.0067, 0.0043, 27, 18.25, 1, -66.2, 4.27e-1, -6.41e-4, 3.01e-7, -349],
      cdbl2: ['=CH\u2082 terminal alkene', 0.0113, -0.0028, 56, 18.18, 3, 23.6, -3.81e-2, 1.72e-4, -1.03e-7, 175],
      cdbl1: ['=CH\u2013 alkene', 0.0129, -0.0006, 46, 24.96, 2, -8.00, 1.05e-1, -9.63e-5, 3.56e-8, 546],
      ring_ch2: ['ring \u2013CH\u2082\u2013', 0.0100, 0.0025, 48, 27.15, 3, -6.03, 8.54e-2, -8.00e-6, -1.80e-8, 682],
      ring_ch1: ['ring >CH\u2013', 0.0122, 0.0004, 38, 21.78, 2, -20.5, 1.62e-1, -1.60e-4, 6.24e-8, 240],
      ar_ch: ['aromatic =CH\u2013', 0.0082, 0.0011, 41, 26.73, 2, -2.14, 5.74e-2, -1.64e-6, -1.59e-8, 674],
      ar_c: ['aromatic =C< substituted', 0.0143, 0.0008, 32, 31.01, 1, -8.25, 1.01e-1, -1.42e-4, 6.78e-8, 1220],
      oh: ['\u2013OH alcohol', 0.0741, 0.0112, 28, 92.88, 2, 27.7, -2.11e-2, 1.11e-4, -6.78e-8, 24214],
      ophen: ['\u2013OH phenol', 0.0240, 0.0184, -25, 76.34, 2, -2.81, 1.11e-1, -1.16e-4, 4.94e-8, 40713],
      oether: ['\u2013O\u2013 ether', 0.0168, 0.0015, 18, 22.42, 1, 25.5, -6.32e-2, 1.11e-4, -5.48e-8, 2373],
      cho: ['\u2013CHO aldehyde', 0.0379, 0.0030, 82, 72.24, 3, 31.1, -2.36e-2, 1.85e-4, -1.03e-7, 13115],
      ketone: ['>C=O ketone', 0.0380, 0.0031, 62, 76.75, 2, 33.3, -3.02e-2, 1.85e-4, -1.14e-7, 13519],
      cooh: ['\u2013COOH acid', 0.0791, 0.0077, 89, 169.09, 3, 24.1, 4.27e-2, 8.04e-5, -6.87e-8, 40662],
      coo: ['\u2013COO\u2013 ester', 0.0481, 0.0005, 82, 81.10, 2, 24.5, 4.02e-2, 4.02e-5, -4.52e-8, 12915],
      nh2: ['\u2013NH\u2082 amine', 0.0243, 0.0109, 38, 73.23, 3, 26.9, -4.12e-2, 1.64e-4, -9.76e-8, 12340],
      cn: ['\u2013CN nitrile', 0.0496, -0.0101, 91, 125.66, 2, 36.5, -7.33e-2, 1.84e-4, -1.03e-7, 33297],
      cl: ['\u2013Cl chloride', 0.0105, -0.0049, 58, 38.13, 1, 33.3, -9.63e-3, 4.02e-5, -2.87e-8, 4711],
      f: ['\u2013F fluoride', 0.0111, -0.0057, 27, -0.03, 1, 26.5, -9.13e-2, 1.91e-4, -1.03e-7, 2523],
      no2: ['\u2013NO\u2082 nitro', 0.0437, 0.0064, 91, 152.54, 3, 25.7, 6.91e-2, -1.77e-4, 9.88e-8, 31013]
    };
  }
  /* estimate a full property record from Joback group counts */
  joback(counts, Mw) {
    const J = this.JOB;
    let sTb = 0, sTc = 0, sPc = 0, sVc = 0, nAt = 0, hv = 0, n = 0;
    let a = 0, b = 0, c = 0, d = 0;
    Object.keys(counts).forEach(k => {
      const q = counts[k] || 0; if (!q || !J[k]) return;
      const g = J[k];
      sTc += q * g[1]; sPc += q * g[2]; sVc += q * g[3]; sTb += q * g[4];
      nAt += q * g[5]; a += q * g[6]; b += q * g[7]; c += q * g[8]; d += q * g[9]; hv += q * g[10];
      n += q;
    });
    if (!n) return null;
    const Tb = 198.2 + sTb;
    const Tc = Tb / (0.584 + 0.965 * sTc - sTc * sTc);
    const Pc = 1 / Math.pow(0.113 + 0.0032 * nAt - sPc, 2);
    const Vc = 17.5 + sVc;
    const dHvb = 15300 + hv;
    const Trb = Tb / Tc;
    /* Lee--Kesler acentric factor from the normal boiling point */
    const f0 = t => 5.92714 - 6.09648 / t - 1.28862 * Math.log(t) + 0.169347 * Math.pow(t, 6);
    const f1 = t => 15.2518 - 15.6875 / t - 13.4721 * Math.log(t) + 0.43577 * Math.pow(t, 6);
    /* ln P_r = f0(T_r) + omega f1(T_r); evaluated at the boiling point this
       inverts to give the acentric factor from T_b, T_c and P_c alone. */
    const Pbr = 101.325 / (Pc * 100);
    const omega = Math.max(Math.min((Math.log(Pbr) - f0(Trb)) / f1(Trb), 1.5), -0.3);
    /* Lee--Kesler vapour pressure -- properly curved, so the Antoine fit below
       is determinate rather than degenerate as a Clausius--Clapeyron line is */
    const psat = T => {
      const t = Math.min(Math.max(T / Tc, 0.30), 0.999);
      return Pc * 100 * Math.exp(f0(t) + omega * f1(t));
    };
    /* fit log10 P(mmHg) = A - B/(T degC + C) over the working range */
    const lo = Math.max(0.62 * Tb, 180), hi = Math.min(1.18 * Tb, 0.92 * Tc);
    const pts = [];
    for (let i = 0; i <= 8; i++) { const T = lo + (hi - lo) * i / 8; const p = psat(T); if (p > 1e-4) pts.push([T - 273.15, Math.log10(p / 0.133322)]); }
    let best = { A: 7, B: 1500, Cc: 230, e: 1e30 };
    if (pts.length >= 3) {
      for (let Cc = 60; Cc <= 340; Cc += 0.5) {
        if (pts[0][0] + Cc <= 1) continue;
        let sx = 0, sy = 0;
        const xs = pts.map(p => -1 / (p[0] + Cc));
        pts.forEach((p, i) => { sx += xs[i]; sy += p[1]; });
        const xm = sx / pts.length, ym = sy / pts.length;
        let sxy = 0, sxx = 0;
        pts.forEach((p, i) => { sxy += (xs[i] - xm) * (p[1] - ym); sxx += Math.pow(xs[i] - xm, 2); });
        if (sxx <= 0) continue;
        const B2 = sxy / sxx, A2 = ym - B2 * xm;
        if (!(B2 > 80 && B2 < 9000)) continue;
        let e = 0; pts.forEach((p, i) => { e += Math.pow(A2 + B2 * xs[i] - p[1], 2); });
        if (e < best.e) best = { A: A2, B: B2, Cc: Cc, e: e };
      }
    }
    /* Bondi-style r and q from the estimated critical volume -- screening only */
    return {
      Tb: Tb - 273.15, Tc: Tc, Pc: Pc, Vc: Vc, w: omega, dHvb: dHvb / 1000,
      A: best.A, B: best.B, Cc: best.Cc, fitErr: Math.sqrt(best.e / Math.max(pts.length, 1)),
      r: Vc / 60.0, q: Vc / 55.0, M: Mw || nAt * 8,
      cpa: a - 37.93, cpb: b + 0.210, cpc: c - 3.91e-4, cpd: d + 2.06e-7, nAt: nAt, groups: n
    };
  }
  /* A small but real SMILES reader: builds the connection table, counts
     implicit hydrogens, then classifies every heavy atom into a Joback group. */
  smilesGroups(sm) {
    if (!sm) return null;
    let s = String(sm).trim();
    if (!s || /\s/.test(s)) s = s.split(/\s+/)[0];
    const atoms = [], bonds = [];
    const stack = [], ring = {};
    let prev = -1, order = 1, i = 0, guard = 0;
    const push = (el, arom, chg, hExp) => {
      atoms.push({ el: el, arom: arom, chg: chg || 0, hExp: hExp, nb: [], ord: [] });
      const k = atoms.length - 1;
      if (prev >= 0) { bonds.push([prev, k, order]); atoms[prev].nb.push(k); atoms[prev].ord.push(order); atoms[k].nb.push(prev); atoms[k].ord.push(order); }
      prev = k; order = 1;
      return k;
    };
    while (i < s.length && guard++ < 4000) {
      const ch = s[i];
      if (ch === '(') { stack.push(prev); i++; continue; }
      if (ch === ')') { prev = stack.length ? stack.pop() : prev; i++; continue; }
      if (ch === '-') { order = 1; i++; continue; }
      if (ch === '=') { order = 2; i++; continue; }
      if (ch === '#') { order = 3; i++; continue; }
      if (ch === ':') { order = 1.5; i++; continue; }
      if (ch === '/' || ch === '\\' || ch === '.') { i++; continue; }
      if (/[0-9%]/.test(ch)) {
        let num = ch, j = i + 1;
        if (ch === '%') { num = s.substr(i + 1, 2); j = i + 3; }
        if (prev >= 0) {
          if (ring[num] === undefined) ring[num] = prev;
          else {
            const o = ring[num];
            bonds.push([o, prev, order]);
            atoms[o].nb.push(prev); atoms[o].ord.push(order);
            atoms[prev].nb.push(o); atoms[prev].ord.push(order);
            delete ring[num];
          }
        }
        order = 1; i = j; continue;
      }
      if (ch === '[') {
        const close = s.indexOf(']', i);
        if (close < 0) break;
        const body = s.slice(i + 1, close);
        const em = /([A-Z][a-z]?|[a-z])/.exec(body);
        const el = em ? em[1] : 'C';
        const hm = /H(\d*)/.exec(body);
        const cm = /([+-]+\d*|\d*[+-])/.exec(body.replace(/H\d*/, ''));
        let chg = 0;
        if (cm) { const t = cm[1]; if (/^\++$/.test(t)) chg = t.length; else if (/^-+$/.test(t)) chg = -t.length; else chg = parseInt(t.replace(/([+-])(\d+)/, '$2$1').replace('+', '').replace('-', '-'), 10) || 0; if (t.indexOf('-') >= 0 && chg > 0) chg = -chg; }
        push(el.toUpperCase(), /^[a-z]$/.test(el), chg, hm ? (hm[1] ? parseInt(hm[1], 10) : 1) : 0);
        i = close + 1; continue;
      }
      let el = ch, k = 1;
      if (/^(Cl|Br)$/.test(s.substr(i, 2))) { el = s.substr(i, 2); k = 2; }
      if (!/^[A-Za-z]+$/.test(el)) { i++; continue; }
      push(el.toUpperCase(), /^[bcnops]$/.test(el), 0, null);
      i += k;
    }
    if (!atoms.length) return null;
    /* ring membership: an atom is in a ring if removing it does not disconnect
       its neighbours -- approximated by a depth-limited cycle search */
    const inRing = atoms.map(() => false);
    const adj = atoms.map(a2 => a2.nb.slice());
    const findCycle = (start) => {
      const seen = {}, path = [];
      const walk = (u, parent, depth) => {
        if (depth > 12) return false;
        path.push(u); seen[u] = true;
        for (const w2 of adj[u]) {
          if (w2 === parent) continue;
          if (w2 === start && path.length >= 3) return true;
          if (!seen[w2] && walk(w2, u, depth + 1)) return true;
        }
        path.pop(); return false;
      };
      return walk(start, -1, 0) ? path.slice() : null;
    };
    atoms.forEach((a2, k) => { if (!inRing[k]) { const cyc = findCycle(k); if (cyc) cyc.forEach(u => { inRing[u] = true; }); } });
    /* implicit hydrogens from the standard valences */
    const VAL = { C: 4, N: 3, O: 2, S: 2, P: 3, F: 1, CL: 1, BR: 1, I: 1, B: 3, SI: 4 };
    atoms.forEach((a2, k) => {
      const sum = a2.ord.reduce((p, q) => p + q, 0);
      const val = (VAL[a2.el] || 4) + (a2.el === 'N' && a2.chg > 0 ? 1 : 0);
      a2.heavy = a2.nb.length;
      a2.nH = a2.hExp !== null && a2.hExp !== undefined ? a2.hExp : Math.max(Math.round(val - sum - (a2.arom ? 0.5 : 0) + (a2.arom ? 0.5 : 0)), 0);
      if (a2.hExp === null || a2.hExp === undefined) a2.nH = Math.max(Math.round(val - (a2.arom ? Math.max(sum, a2.nb.length + 0.5) : sum)), 0);
      a2.ring = inRing[k];
      a2.maxOrd = a2.ord.length ? Math.max.apply(null, a2.ord) : 1;
    });
    const counts = {};
    const add = k => { counts[k] = (counts[k] || 0) + 1; };
    const el = k => atoms[k].el;
    const used = atoms.map(() => false);
    /* pass 1: carbonyl-bearing carbons, most specific first */
    atoms.forEach((a2, k) => {
      if (a2.el !== 'C' || used[k]) return;
      const dblO = a2.nb.filter((w2, j) => atoms[w2].el === 'O' && a2.ord[j] >= 2);
      if (!dblO.length) return;
      const sglO = a2.nb.filter((w2, j) => atoms[w2].el === 'O' && a2.ord[j] < 2);
      if (sglO.length) {
        const oh = sglO.filter(w2 => atoms[w2].heavy === 1);
        if (oh.length) { add('cooh'); used[k] = true; used[dblO[0]] = true; used[oh[0]] = true; return; }
        add('coo'); used[k] = true; used[dblO[0]] = true; used[sglO[0]] = true; return;
      }
      if (a2.nH >= 1 || a2.heavy <= 1) { add('cho'); used[k] = true; used[dblO[0]] = true; return; }
      add('ketone'); used[k] = true; used[dblO[0]] = true;
    });
    /* nitrile and nitro */
    atoms.forEach((a2, k) => {
      if (used[k]) return;
      if (a2.el === 'C' && a2.nb.some((w2, j) => atoms[w2].el === 'N' && a2.ord[j] === 3)) {
        const nn = a2.nb.filter((w2, j) => atoms[w2].el === 'N' && a2.ord[j] === 3)[0];
        add('cn'); used[k] = true; used[nn] = true;
      }
    });
    atoms.forEach((a2, k) => {
      if (used[k] || a2.el !== 'N') return;
      const os = a2.nb.filter(w2 => atoms[w2].el === 'O');
      if (os.length >= 2) { add('no2'); used[k] = true; os.slice(0, 2).forEach(w2 => { used[w2] = true; }); }
    });
    /* pass 2: everything else */
    atoms.forEach((a2, k) => {
      if (used[k]) return;
      const e = a2.el;
      if (e === 'C') {
        if (a2.arom) { add(a2.heavy >= 3 ? 'ar_c' : 'ar_ch'); return; }
        if (a2.maxOrd >= 3) { add('cdbl1'); return; }
        if (a2.maxOrd >= 2) { add(a2.nH >= 2 ? 'cdbl2' : 'cdbl1'); return; }
        if (a2.ring) { add(a2.heavy >= 3 ? 'ring_ch1' : 'ring_ch2'); return; }
        if (a2.heavy <= 1) { add('ch3'); return; }
        if (a2.heavy === 2) { add('ch2'); return; }
        if (a2.heavy === 3) { add('ch'); return; }
        add('cq'); return;
      }
      if (e === 'O') {
        if (a2.heavy <= 1) {
          const par = a2.nb[0];
          add(par !== undefined && atoms[par].arom ? 'ophen' : 'oh');
        } else add('oether');
        return;
      }
      if (e === 'N') { add('nh2'); return; }
      if (e === 'CL') { add('cl'); return; }
      if (e === 'F') { add('f'); return; }
    });
    Object.keys(counts).forEach(k => { if (!(counts[k] > 0)) delete counts[k]; });
    return Object.keys(counts).length ? counts : null;
  }
  /* PubChem PUG-REST lookup by CAS number or name — optional, needs a network */
  async pubchem(query) {
    const q = encodeURIComponent(String(query).trim());
    const url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + q +
      '/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,Title/JSON';
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const to = ctl ? setTimeout(() => ctl.abort(), 9000) : null;
    const res = await fetch(url, ctl ? { signal: ctl.signal } : {});
    if (to) clearTimeout(to);
    if (!res.ok) throw new Error('PubChem returned ' + res.status);
    const j = await res.json();
    const p = j && j.PropertyTable && j.PropertyTable.Properties && j.PropertyTable.Properties[0];
    if (!p) throw new Error('no record in the response');
    return { name: p.Title || String(query), formula: p.MolecularFormula || '', M: parseFloat(p.MolecularWeight) || 0, smiles: p.CanonicalSMILES || p.IsomericSMILES || '' };
  }
  /* molecular weight from a formula string, so an offline entry still works */
  mwFromFormula(f) {
    const AW = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998, S: 32.06, Cl: 35.45, Br: 79.904, I: 126.90, Si: 28.085, P: 30.974 };
    let m = 0, ok = false;
    String(f).replace(/([A-Z][a-z]?)(\d*)/g, (all, el, n) => { if (AW[el]) { m += AW[el] * (n ? parseInt(n, 10) : 1); ok = true; } return all; });
    return ok ? m : 0;
  }
  /* rough Joback counts from a molecular formula alone — last resort */
  groupsFromFormula(f) {
    const g = {};
    const get = el => { const m = new RegExp(el + '(\\d*)(?![a-z])').exec(String(f)); return m ? (m[1] ? parseInt(m[1], 10) : 1) : 0; };
    const C = get('C'), H = get('H'), O = get('O'), N = get('N'), Cl = get('Cl');
    if (!C) return null;
    if (O === 1 && H >= 2 * C) { g.oh = 1; }
    else if (O === 1) { g.ketone = 1; }
    else if (O === 2) { g.cooh = 1; }
    if (N) g.nh2 = N;
    if (Cl) g.cl = Cl;
    const ring = H <= C + 1 && C >= 6;
    let left = C - (g.cooh ? 1 : 0) - (g.ketone ? 1 : 0);
    if (ring) { g.ar_ch = Math.min(left, 5); g.ar_c = 1; left -= Math.min(left, 6); }
    if (left > 0) { g.ch3 = Math.min(2, left); left -= Math.min(2, left); if (left > 0) g.ch2 = left; }
    return g;
  }

