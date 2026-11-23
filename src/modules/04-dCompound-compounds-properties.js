  dCompound() {
    const self = this, C = this.C;
    const S = 'Compounds & Properties';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const TXT = (k, label, val, ph) => ({ k: k, label: label, val: val, type: 'text', placeholder: ph });
    const ACT = (k, label, btn, act) => ({ k: k, label: label, val: 0, type: 'action', btn: btn, act: act });
    const Rg = 8.314;
    const Psat = (c, TC) => Math.pow(10, c.A - c.B / (TC + c.Cc)) * 0.133322;
    const Tsat = (c, Pk) => c.B / (c.A - Math.log10(Pk / 0.133322)) - c.Cc;

    /* the estimator state lives on the component so every module sees it */
    const look = () => self._look || null;
    const setLook = o => { self._look = o; self.forceUpdate(); };

    const runLookup = async (v, online) => {
      const qy = String(v.query || '').trim();
      if (!qy) { setLook({ msg: 'Type a CAS number, a name, or a formula first.', bad: true }); return; }
      /* 1 — is it already in the library, by key, name or CAS? */
      const L = self.lib();
      const hit = Object.keys(L).filter(k => k === self.slug(qy) || L[k].cas === qy || String(L[k].n).toLowerCase() === qy.toLowerCase())[0];
      if (hit) { setLook({ msg: 'Already in the library as "' + L[hit].n + '" \u2014 reference data, no estimate needed.', key: hit, rec: L[hit], exact: true }); return; }
      let name = qy, formula = '', smiles = '', M = 0, via = '';
      if (online) {
        setLook({ msg: 'Querying PubChem for "' + qy + '" \u2026', busy: true });
        try {
          const r = await self.pubchem(qy);
          name = r.name; formula = r.formula; smiles = r.smiles; M = r.M; via = 'PubChem PUG-REST';
        } catch (e) {
          setLook({ msg: 'PubChem unreachable (' + String(e.message || e).slice(0, 60) + '). Use the offline route below \u2014 type a formula or SMILES into the identifier field, or enter Joback group counts in T-10.', bad: true });
          return;
        }
      } else {
        /* offline: treat the identifier as a formula or a SMILES string */
        if (/^[A-Z][A-Za-z0-9]*$/.test(qy) && /\d/.test(qy)) { formula = qy; via = 'formula, entered by hand'; }
        else { smiles = qy; via = 'SMILES, entered by hand'; }
        M = self.mwFromFormula(formula || '') || 0;
      }
      let counts = smiles ? self.smilesGroups(smiles) : null;
      let route = counts ? 'SMILES \u2192 Joback groups' : '';
      if (!counts && formula) { counts = self.groupsFromFormula(formula); route = 'formula \u2192 Joback groups (coarse)'; }
      if (!counts) { setLook({ msg: 'Could not resolve a structure for "' + qy + '". Enter the Joback group counts directly in T-10 and add the result from there.', bad: true }); return; }
      if (!M && formula) M = self.mwFromFormula(formula);
      const est = self.joback(counts, M);
      if (!est) { setLook({ msg: 'The group count came out empty \u2014 check the identifier.', bad: true }); return; }
      setLook({
        msg: 'Estimated from ' + route + '.', name: name, formula: formula, smiles: smiles,
        cas: /^\d{2,7}-\d{2}-\d$/.test(qy) ? qy : '', via: via, counts: counts,
        rec: {
          n: name, cas: /^\d{2,7}-\d{2}-\d$/.test(qy) ? qy : '', f: formula,
          A: est.A, B: est.B, Cc: est.Cc, r: est.r, q: est.q, Tc: est.Tc, Pc: est.Pc,
          w: est.w, M: est.M || M, rho: 850, src: 'estimated \u2014 Joback'
        },
        est: est
      });
    };

    return [
      {
        id: 'complib', num: 'P-01', sec: S, name: 'Compound library \u2014 CAS lookup & property estimation',
        blurb: 'Every module that names a chemical reads its properties from one shared library. Twenty-six compounds come with measured constants; anything else you add by CAS number, name, formula or SMILES, and the group-contribution estimator fills in what a design calculation needs. Added compounds appear in every picker in the tool and survive a reload.',
        howto: 'Type a CAS number or a name and press the PubChem button \u2014 it fetches the formula and structure, reads the Joback groups off the structure, and estimates the boiling point, critical constants, acentric factor and an Antoine fit. With no network, type a molecular formula or a SMILES string instead and press the offline button; the same estimator runs on what you typed. Check the estimate against the reference compounds on the plot before you trust it: group methods are good to a few kelvin on T_b and perhaps 5 % on T_c, and much worse for hydrogen-bonded liquids.',
        std: 'Joback & Reid, Chem. Eng. Comm. 57 (1987) 233; Poling, Prausnitz & O\u2019Connell, The Properties of Gases and Liquids, 5th ed., Ch. 2 & 7; PubChem PUG-REST (NCBI)',
        eqs: [['T_b = 198.2 + \\sum_i n_i\\,\\Delta T_{b,i}', 'Joback normal boiling point'], ['T_c = T_b\\left[0.584 + 0.965\\sum n_i\\Delta T_{c,i} - \\left(\\sum n_i\\Delta T_{c,i}\\right)^{2}\\right]^{-1}', 'critical temperature'], ['P_c = \\left[0.113 + 0.0032\\,n_A - \\sum n_i\\Delta P_{c,i}\\right]^{-2}', 'critical pressure, n_A = number of atoms'], ['\\omega = \\frac{\\ln P_{br} - 5.92714 + 6.09648/T_{br} + 1.28862\\ln T_{br} - 0.169347T_{br}^{6}}{15.2518 - 15.6875/T_{br} - 13.4721\\ln T_{br} + 0.43577T_{br}^{6}}', 'Lee\u2013Kesler acentric factor from T_b'], ['\\log_{10}P^{sat} = A - \\frac{B}{T+C}', 'Antoine constants regressed from the estimated curve']],
        notes: ['The network call is optional. Nothing in this tool requires it \u2014 every other module works from the library and the offline estimator.', 'PubChem supplies identity only (name, formula, structure); all thermophysical numbers are estimated here, never fetched.', 'Group methods assume no strong association. For alcohols, acids, amines and water the estimated T_b can be out by ten kelvin or more \u2014 the flag in the results says when to distrust it.', 'UNIQUAC r and q are derived from the estimated critical volume, which is adequate for screening but not for regressing VLE data.', 'Added compounds are stored in this browser only.'],
        params: [
          TXT('query', 'CAS number, name, formula or SMILES', '108-88-3', 'e.g. 108-88-3, toluene, C7H8, CCO'),
          ACT('go', 'Identify and estimate', 'LOOK UP VIA PUBCHEM  \u2192', v => runLookup(v, true)),
          ACT('off', 'No network available', 'ESTIMATE OFFLINE FROM WHAT I TYPED', v => runLookup(v, false)),
          ACT('add', 'Commit to the shared library', 'ADD TO LIBRARY  +', v => {
            const lk = look();
            if (!lk || !lk.rec) { setLook({ msg: 'Nothing to add \u2014 run an identification first.', bad: true }); return; }
            if (lk.exact) { setLook(Object.assign({}, lk, { msg: 'That compound is already in the library.' })); return; }
            const key = self.slug(lk.rec.n || v.query);
            self.addCmp(key, lk.rec);
            setLook(Object.assign({}, lk, { msg: 'Added as "' + lk.rec.n + '". It is now in every compound picker in the tool.', added: true }));
          }),
          SEL('show', 'Compare against', 'toluene', () => self.cmpOpts()),
          SEL('del', 'Remove an added compound', '\u2014', () => {
            const base = self.BASE, L = self.lib();
            const own = Object.keys(L).filter(k => !base[k]);
            return [['\u2014', own.length ? 'select one to remove\u2026' : 'nothing added yet']].concat(own.map(k => [k, L[k].n]));
          }),
          ACT('rm', 'Delete', 'REMOVE THE SELECTED COMPOUND', v => { if (v.del && v.del !== '\u2014') self.delCmp(v.del); }),
          P('Tplot', 'Plot temperature', -50, 400, 5, 100, 'T')
        ],
        compute: v => {
          const lk = look();
          const ref = self.cmp(v.show);
          const L = self.lib(), base = self.BASE;
          const own = Object.keys(L).filter(k => !base[k]);
          const res = [];
          res.push({ l: 'Library size', s: Object.keys(base).length + ' reference + ' + own.length + ' added', u: '' });
          res.push({ l: 'Network status', s: lk && lk.busy ? 'query in flight\u2026' : 'a lookup is optional \u2014 nothing here needs it', u: '' });
          res.push({ l: 'Last action', s: lk ? lk.msg : 'nothing yet \u2014 type an identifier and press a button', u: '' });
          if (lk && lk.rec && !lk.exact) {
            const e = lk.rec;
            res.push({ l: 'Identified as', s: e.n + (e.f ? '  (' + e.f + ')' : ''), u: '' });
            if (lk.smiles) res.push({ l: 'Structure', s: lk.smiles.slice(0, 30), u: '' });
            if (e.cas) res.push({ l: 'CAS number', s: e.cas, u: '' });
            res.push({ l: 'Source of identity', s: lk.via || '\u2014', u: '' });
            res.push({ l: 'Groups found', s: Object.keys(lk.counts || {}).map(k => (lk.counts[k] > 1 ? lk.counts[k] + '\u00d7 ' : '') + (self.JOB[k] ? self.JOB[k][0] : k)).join(', ') || '\u2014', u: '' });
            res.push({ l: 'Molecular weight', v: e.M, u: 'g/mol', d: 3 });
            res.push({ l: 'Normal boiling point', v: Tsat(e, 101.325), u: '\u00b0C', d: 2 });
            res.push({ l: 'Critical temperature', v: e.Tc - 273.15, u: '\u00b0C', d: 1 });
            res.push({ l: 'Critical pressure', v: e.Pc, u: 'bar', d: 2 });
            res.push({ l: 'Acentric factor \u03c9', v: e.w, u: '\u2014', d: 4 });
            res.push({ l: 'Antoine A / B / C', s: e.A.toFixed(4) + ' / ' + e.B.toFixed(1) + ' / ' + e.Cc.toFixed(1), u: '' });
            res.push({ l: 'Vapour pressure at ' + v.Tplot.toFixed(0) + ' \u00b0C', v: Psat(e, v.Tplot), u: 'kPa', d: 4 });
            res.push({ l: 'UNIQUAC r / q (estimated)', s: e.r.toFixed(3) + ' / ' + e.q.toFixed(3), u: '' });
            const assoc = /oh|cooh|nh2|ophen/.test(Object.keys(lk.counts || {}).join(' '));
            res.push({ l: 'Reliability', s: assoc ? 'hydrogen bonding present \u2014 T_b may be out by 10 K or more, treat as screening only' : (lk.counts && Object.keys(lk.counts).length <= 4 ? 'simple molecule \u2014 the estimate should be within a few per cent' : 'moderate confidence \u2014 check T_b against a handbook'), u: '' });
            res.push({ l: 'Next step', s: lk.added ? 'available in every compound picker' : 'press ADD TO LIBRARY to make it available everywhere', u: '' });
          }
          res.push({ l: 'Comparison compound', s: ref.n, u: '' });
          res.push({ l: 'Its boiling point', v: Tsat(ref, 101.325), u: '\u00b0C', d: 2 });
          res.push({ l: 'Its P_sat at ' + v.Tplot.toFixed(0) + ' \u00b0C', v: Psat(ref, v.Tplot), u: 'kPa', d: 4 });
          const rows = Object.keys(L).map(k => {
            const c = L[k];
            let tb = NaN; try { tb = Tsat(c, 101.325); } catch (e) { }
            return [c.n, c.cas || '\u2014', c.f || '\u2014', (c.M || 0).toFixed(2), isFinite(tb) ? tb.toFixed(1) : '\u2014', (c.Tc - 273.15).toFixed(1), c.Pc.toFixed(1), (c.w || 0).toFixed(3), c.src || 'reference'];
          });
          return {
            lk: lk, ref: ref, res: res,
            table: { title: 'The shared library \u2014 every picker in the tool reads this', head: ['Compound', 'CAS', 'formula', 'M  g/mol', 'T_b  \u00b0C', 'T_c  \u00b0C', 'P_c  bar', '\u03c9', 'source'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1 / (400 + 273.15), xmax: 1 / (-40 + 273.15), ymin: 0.05, ymax: 5000, ylog: true, ml: 68 });
          g.grid('1000 / T   K\u207b\u00b9', 'Vapour pressure  kPa', 5, 5, x => (x * 1000).toFixed(2));
          g.title('Vapour pressure \u2014 the estimate against the reference set');
          g.line([[1 / 673.15, 101.325], [1 / 233.15, 101.325]], C.lt, 1.3, [6, 4]);
          const curve = c => { const p = []; for (let i = 0; i <= 160; i++) { const T = -40 + 440 * i / 160; const y = Psat(c, T); if (y > 0.02 && y < 8000) p.push([1 / (T + 273.15), y]); } return p; };
          const base = self.BASE;
          Object.keys(base).forEach(k => { g.line(curve(base[k]), 'rgba(29,31,32,0.10)', 1.1); });
          g.line(curve(r.ref), C.dk, 2.2, [7, 4]);
          if (r.lk && r.lk.rec && !r.lk.exact) {
            g.line(curve(r.lk.rec), C.acc, 3);
            const tb = Tsat(r.lk.rec, 101.325);
            if (tb > -40 && tb < 400) g.cross(1 / (tb + 273.15), 101.325, C.warn, 8);
          }
          g.dot(1 / (v.Tplot + 273.15), Psat(r.ref, v.Tplot), C.dk, 4.5);
          if (g.w > 300) g.txt('1 atm', 1 / 253.15, 130, C.mut, 'right', 11);
          g.legend([{ c: C.acc, l: 'the compound you identified' }, { c: C.dk, l: r.ref.n, d: [7, 4] }, { c: 'rgba(29,31,32,0.10)', l: 'reference library' }]);
        }
      },
      {
        id: 'cmpcompare', num: 'P-02', sec: S, name: 'Compound comparison & mixture properties',
        blurb: 'Two compounds from the library, side by side, with the derived quantities a designer reaches for first: relative volatility at the temperature of interest, the ideal K-values, the mixture molar mass and the Kay\u2019s-rule pseudocritical point that a cubic equation of state needs.',
        howto: 'Pick a light and a heavy component and sweep the temperature. Where the relative volatility falls below about 1.2 the separation stops being a distillation problem and starts being an extraction or crystallisation problem \u2014 that threshold is the single most useful number on the page. The pseudocritical point tells you when the vapour phase stops being ideal: if the reduced pressure exceeds 0.3 the K-values here are no longer trustworthy and you need Q-04.',
        std: 'Poling, Prausnitz & O\u2019Connell, Ch. 5; Kay (1936) pseudocritical rule; Smith, Van Ness & Abbott, Ch. 10',
        eqs: [['\\alpha_{12} = \\frac{P_1^{sat}(T)}{P_2^{sat}(T)}', 'ideal relative volatility'], ['K_i = \\frac{P_i^{sat}}{P}', 'Raoult K-value'], ['T_{cm} = \\sum y_iT_{ci},\\qquad P_{cm} = \\sum y_iP_{ci}', 'Kay\u2019s pseudocritical rule'], ['M_m = \\sum y_iM_i', 'mixture molar mass']],
        notes: ['Ideal vapour and ideal liquid \u2014 non-ideality is in Q-01 to Q-03.', 'Antoine constants used outside their fitted range are extrapolated; the reliability line flags it.', 'Any compound added in P-01 appears in both pickers.'],
        params: [SEL('a', 'Light component', 'benzene', () => self.cmpOpts()), SEL('bb', 'Heavy component', 'toluene', () => self.cmpOpts()), P('T', 'Temperature', -40, 350, 1, 90, 'T'), P('Pt', 'System pressure', 5, 3000, 1, 101.3, 'P'), P('ya', 'Mole fraction of the light component', 0, 1, 0.01, 0.5, null, '\u2014')],
        compute: v => {
          const a = self.cmp(v.a), b2 = self.cmp(v.bb);
          const pa = Psat(a, v.T), pb = Psat(b2, v.T);
          const al = pa / pb;
          const Ka = pa / v.Pt, Kb = pb / v.Pt;
          const Tba = Tsat(a, v.Pt), Tbb = Tsat(b2, v.Pt);
          const Mm = v.ya * a.M + (1 - v.ya) * b2.M;
          const Tcm = v.ya * a.Tc + (1 - v.ya) * b2.Tc;
          const Pcm = v.ya * a.Pc + (1 - v.ya) * b2.Pc;
          const wm = v.ya * a.w + (1 - v.ya) * b2.w;
          const Prm = v.Pt / (Pcm * 100), Trm = (v.T + 273.15) / Tcm;
          const bub = self.bis(T => v.ya * Psat(a, T) + (1 - v.ya) * Psat(b2, T) - v.Pt, -120, 500, 1e-7);
          const dew = self.bis(T => v.ya / Psat(a, T) + (1 - v.ya) / Psat(b2, T) - 1 / v.Pt, -120, 500, 1e-7);
          const Nmin = Math.log(0.99 / 0.01 * (0.99 / 0.01)) / Math.log(Math.max(al, 1.0001));
          return {
            a: a, b2: b2, al: al,
            res: [{ l: 'Light component', s: a.n + (a.src === 'reference' ? '' : '  (estimated)'), u: '' }, { l: 'Heavy component', s: b2.n + (b2.src === 'reference' ? '' : '  (estimated)'), u: '' }, { l: 'P_sat of the light one', v: pa, u: 'kPa', d: 4 }, { l: 'P_sat of the heavy one', v: pb, u: 'kPa', d: 4 }, { l: 'Relative volatility \u03b1', v: al, u: '\u2014', d: 4 }, { l: 'K-value of the light one', v: Ka, u: '\u2014', d: 4 }, { l: 'K-value of the heavy one', v: Kb, u: '\u2014', d: 4 }, { l: 'Boiling point of the light one', v: Tba, u: '\u00b0C', d: 2 }, { l: 'Boiling point of the heavy one', v: Tbb, u: '\u00b0C', d: 2 }, { l: 'Boiling-point gap', v: Tbb - Tba, u: 'K', d: 2 }, { l: 'Bubble temperature of the mixture', v: bub, u: '\u00b0C', d: 2 }, { l: 'Dew temperature of the mixture', v: dew, u: '\u00b0C', d: 2 }, { l: 'Mixture molar mass', v: Mm, u: 'g/mol', d: 3 }, { l: 'Pseudocritical T (Kay)', v: Tcm - 273.15, u: '\u00b0C', d: 1 }, { l: 'Pseudocritical P (Kay)', v: Pcm, u: 'bar', d: 2 }, { l: 'Mixture \u03c9', v: wm, u: '\u2014', d: 4 }, { l: 'Reduced pressure P_r', v: Prm, u: '\u2014', d: 4 }, { l: 'Minimum stages for 99/99 split', v: Nmin, u: '\u2014', d: 1 }, { l: 'Separation difficulty', s: al > 2 ? 'easy \u2014 a short column will do' : al > 1.3 ? 'ordinary distillation' : al > 1.05 ? 'difficult \u2014 many stages and high reflux' : 'not a distillation problem; consider extraction or crystallisation', u: '' }, { l: 'Ideal-vapour assumption', s: Prm > 0.3 ? 'invalid \u2014 use a cubic equation of state (Q-04)' : 'acceptable', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.56;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: -40, xmax: 350, ymin: 0.05, ymax: 5000, ylog: true, ml: 66, mb: 18, mt: 32 });
          g.grid('', 'Vapour pressure  kPa');
          g.title('Two compounds from the library \u2014 ' + r.a.n + ' over ' + r.b2.n);
          g.line([[-40, 101.325], [350, 101.325]], C.lt, 1.3, [6, 4]);
          g.fn(T => { const y = Psat(r.a, T); return y > 0.05 && y < 5000 ? y : NaN; }, C.acc, 2.8, null, 300);
          g.fn(T => { const y = Psat(r.b2, T); return y > 0.05 && y < 5000 ? y : NaN; }, C.dk, 2.8, [7, 4], 300);
          g.line([[v.T, 0.05], [v.T, 5000]], 'rgba(29,31,32,0.2)', 1.1, [4, 4]);
          g.legend([{ c: C.acc, l: r.a.n }, { c: C.dk, l: r.b2.n, d: [7, 4] }]);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: -40, xmax: 350, ymin: 0.8, ymax: Math.max(6, r.al * 1.6), ml: 66, mt: 12, mb: 46 });
          g2.grid('Temperature  \u00b0C', 'Relative volatility \u03b1', 5, 4);
          g2.fill([[-40, 0.8], [350, 0.8], [350, 1.2], [-40, 1.2]], C.soft);
          g2.line([[-40, 1], [350, 1]], 'rgba(29,31,32,0.28)', 1.2);
          g2.fn(T => { const x = Psat(r.a, T) / Psat(r.b2, T); return isFinite(x) ? Math.min(x, Math.max(6, r.al * 1.6)) : NaN; }, C.mid, 2.6, null, 300);
          g2.dot(v.T, Math.min(r.al, Math.max(6, r.al * 1.6)), C.warn, 5);
          if (g2.w > 300) g2.txt('below 1.2 \u2014 distillation stops paying', 340, 0.92, C.mid, 'right', 11);
        }
      }
    ];
  }

  /* ══ REACTORS & KINETICS ══════════════════════════════════ */
