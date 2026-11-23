  dNewI() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const FL = 'Fluid Mechanics', TP = 'Thermophysical Data';
    const sw = (Re, rr) => Re < 2100 ? 64 / Math.max(Re, 1) : 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    /* [label, dTc, dPc, dVc, dTb, atoms, cpa, cpb, cpc, cpd] — Joback & Reid (1987) */
    const JB = {
      ch3: ['\u2013CH\u2083 methyl', 0.0141, -0.0012, 65, 23.58, 4, 19.50, -8.08e-3, 1.53e-4, -9.67e-8],
      ch2: ['\u2013CH\u2082\u2013 methylene', 0.0189, 0, 56, 22.88, 3, -0.909, 9.50e-2, -5.44e-5, 1.19e-8],
      ch: ['>CH\u2013 methine', 0.0164, 0.0020, 41, 21.74, 2, -23.0, 2.04e-1, -2.65e-4, 1.20e-7],
      cq: ['>C< quaternary carbon', 0.0067, 0.0043, 27, 18.25, 1, -66.2, 4.27e-1, -6.41e-4, 3.01e-7],
      cdbl: ['=CH\u2082 alkene carbon', 0.0113, -0.0028, 56, 18.18, 3, 23.6, -3.81e-2, 1.72e-4, -1.03e-7],
      ring_ch2: ['ring \u2013CH\u2082\u2013', 0.0100, 0.0025, 48, 27.15, 3, -6.03, 8.54e-2, -8.00e-6, -1.80e-8],
      ring_ch: ['aromatic =CH\u2013', 0.0082, 0.0011, 41, 26.73, 2, -2.14, 5.74e-2, -1.64e-6, -1.59e-8],
      ring_c: ['aromatic =C< substituted', 0.0143, 0.0008, 32, 31.01, 1, -8.25, 1.01e-1, -1.42e-4, 6.78e-8],
      oh: ['\u2013OH alcohol', 0.0741, 0.0112, 28, 92.88, 2, 27.7, -2.11e-2, 1.11e-4, -6.78e-8],
      ophen: ['\u2013OH phenol', 0.0240, 0.0184, -25, 76.34, 2, -2.81, 1.11e-1, -1.16e-4, 4.94e-8],
      oether: ['\u2013O\u2013 ether, non-ring', 0.0168, 0.0015, 18, 22.42, 1, 25.5, -6.32e-2, 1.11e-4, -5.48e-8],
      cho: ['\u2013CHO aldehyde', 0.0379, 0.0030, 82, 72.24, 3, 31.1, -2.36e-2, 1.85e-4, -1.03e-7]
    };
    const JKEYS = Object.keys(JB);
    return [
      {
        id: 'network', num: 'F-15', sec: FL, name: 'Hydraulic network engine \u2014 Hardy Cross',
        blurb: 'Once pipes form a loop there is no arithmetic answer: flow divides itself so that every closed circuit balances at zero head, and only iteration finds the split. Hardy Cross solved it in 1936 with a hand method that is still what every network solver is doing underneath.',
        howto: 'Watch the correction column collapse as the loops balance \u2014 that is the whole algorithm. The plot is the residual against iteration on a log axis; a straight fall means clean convergence, a plateau means the network is ill-conditioned and usually has one nearly-closed branch fighting the rest.',
        std: 'Hardy Cross (1936), Univ. Illinois Bull. 286; Darcy\u2013Weisbach with Swamee\u2013Jain friction',
        eqs: [['\\sum_{loop}h_f = 0,\\qquad \\sum_{node}Q_{in} = \\sum_{node}Q_{out}', 'the two conservation laws a network must satisfy'], ['h_f = KQ^n,\\qquad K = \\frac{8fL}{\\pi^2gD^5},\\qquad n = 2', 'each pipe reduced to one resistance coefficient'], ['\\Delta Q = -\\frac{\\sum KQ\\left|Q\\right|^{n-1}}{n\\sum K\\left|Q\\right|^{n-1}}', 'the Hardy Cross loop correction'], ['Q_i^{(k+1)} = Q_i^{(k)} + \\Delta Q_{loop}', 'applied to every pipe in the loop, then repeated']],
        notes: ['Two-loop, five-pipe network \u2014 the classic textbook topology, solved live.', 'Friction factor recomputed each iteration from the current flow, so K is not frozen.', 'Minor losses folded into an equivalent length multiplier on each pipe.'],
        params: [PF('Qin', 'Inflow at node A', 10, 5000, 10, 400, 'Q'), PF('D1', 'Pipe 1 diameter (A\u2013B)', 25, 900, 5, 250, 'mm'), PF('D2', 'Pipe 2 diameter (B\u2013C)', 25, 900, 5, 150, 'mm'), PF('D3', 'Pipe 3 diameter (A\u2013C)', 25, 900, 5, 200, 'mm'), PF('D4', 'Pipe 4 diameter (C\u2013D)', 25, 900, 5, 200, 'mm'), PF('D5', 'Pipe 5 diameter (B\u2013D)', 25, 900, 5, 150, 'mm'), P('L1', 'Pipe 1 length', 10, 5000, 10, 300, 'L'), P('L2', 'Pipe 2 length', 10, 5000, 10, 250, 'L'), P('L3', 'Pipe 3 length', 10, 5000, 10, 400, 'L'), P('L4', 'Pipe 4 length', 10, 5000, 10, 300, 'L'), P('L5', 'Pipe 5 length', 10, 5000, 10, 350, 'L'), P('demD', 'Demand at node D', 0, 5000, 10, 250, 'Q'), P('rough', 'Absolute roughness', 0.005, 3, 0.005, 0.045, null, 'mm'), P('rho', 'Density', 500, 1400, 5, 998, 'rho'), P('mu', 'Viscosity', 0.1, 200, 0.1, 1, null, 'cP'), P('mlf', 'Minor-loss allowance', 0, 60, 1, 15, null, '% of L')]
        ,
        compute: v => {
          const D = [v.D1, v.D2, v.D3, v.D4, v.D5].map(x => x / 1000);
          const L = [v.L1, v.L2, v.L3, v.L4, v.L5].map(x => x * (1 + v.mlf / 100));
          const loops = [[[0, 1], [1, 1], [2, -1]], [[1, -1], [4, 1], [3, -1]]];
          const Kof = (i, Q) => {
            const A = Math.PI * D[i] * D[i] / 4;
            const vel = Math.abs(Q) / 3600 / A;
            const Re = v.rho * vel * D[i] / (v.mu * 1e-3);
            const f = sw(Math.max(Re, 1), v.rough / 1000 / D[i]);
            return 8 * f * L[i] / (Math.PI * Math.PI * 9.80665 * Math.pow(D[i], 5)) / (3600 * 3600);
          };
          const demC = Math.max(v.Qin - v.demD, 0);
          let Q = [v.Qin * 0.6, v.Qin * 0.25, v.Qin * 0.4, v.demD * 0.6, v.demD * 0.4];
          const hist = [];
          for (let it = 0; it < 60; it++) {
            let worst = 0;
            loops.forEach(loop => {
              let num = 0, den = 0;
              loop.forEach(pr => {
                const i = pr[0], sgn = pr[1];
                const q = Q[i] * sgn, K = Kof(i, Q[i]);
                num += K * q * Math.abs(q);
                den += 2 * K * Math.abs(q);
              });
              const dQ = den > 1e-12 ? -num / den : 0;
              worst = Math.max(worst, Math.abs(num));
              loop.forEach(pr => { Q[pr[0]] += dQ * pr[1]; });
            });
            Q[0] = Math.max(Math.min(Q[0], v.Qin), 0);
            Q[2] = v.Qin - Q[0];
            Q[1] = Math.max(Math.min(Q[1], Q[0]), -Q[2]);
            Q[4] = Q[0] - Q[1];
            Q[3] = v.demD - Q[4];
            hist.push(Math.max(worst, 1e-14));
          }
          const names = ['A\u2013B', 'B\u2013C', 'A\u2013C', 'C\u2013D', 'B\u2013D'];
          const rows = names.map((nm, i) => {
            const A = Math.PI * D[i] * D[i] / 4;
            const vel = Math.abs(Q[i]) / 3600 / A;
            const Re = v.rho * vel * D[i] / (v.mu * 1e-3);
            const hf = Kof(i, Q[i]) * Q[i] * Math.abs(Q[i]);
            return [nm, self.f(self.cvt(D[i] * 1000, 'mm')[0], 0), self.f(self.cvt(Math.abs(Q[i]), 'Q')[0], 1) + (Q[i] < 0 ? '  (rev)' : ''), self.f(self.cvt(vel, 'vel')[0], 2), self.f(Re, 0), self.f(self.cvt(Math.abs(hf), 'L')[0], 3)];
          });
          const loopErr = loops.map(loop => loop.reduce((s, pr) => s + Kof(pr[0], Q[pr[0]]) * Q[pr[0]] * Math.abs(Q[pr[0]]) * pr[1], 0));
          const hAB = Kof(0, Q[0]) * Q[0] * Math.abs(Q[0]);
          const hAC = Kof(2, Q[2]) * Q[2] * Math.abs(Q[2]);
          const hBD = Kof(4, Q[4]) * Q[4] * Math.abs(Q[4]);
          let conv = 60;
          for (let i = 0; i < hist.length; i++) if (hist[i] < 1e-8) { conv = i + 1; break; }
          return {
            hist: hist, Q: Q,
            res: [{ l: 'Inflow at A', v: v.Qin, u: '', cv: 'Q', d: 1 }, { l: 'Demand at C', v: demC, u: '', cv: 'Q', d: 1 }, { l: 'Demand at D', v: v.demD, u: '', cv: 'Q', d: 1 }, { l: 'Flow in A\u2013B', v: Q[0], u: '', cv: 'Q', d: 2 }, { l: 'Flow in B\u2013C', v: Q[1], u: '', cv: 'Q', d: 2 }, { l: 'Flow in A\u2013C', v: Q[2], u: '', cv: 'Q', d: 2 }, { l: 'Flow in C\u2013D', v: Q[3], u: '', cv: 'Q', d: 2 }, { l: 'Flow in B\u2013D', v: Q[4], u: '', cv: 'Q', d: 2 }, { l: 'Head loss A\u2013B', v: Math.abs(hAB), u: '', cv: 'L', d: 3 }, { l: 'Head loss A\u2013C', v: Math.abs(hAC), u: '', cv: 'L', d: 3 }, { l: 'Head loss A to D', v: Math.abs(hAB) + Math.abs(hBD), u: '', cv: 'L', d: 3 }, { l: 'Loop 1 closure error', v: loopErr[0], u: 'm', d: 8 }, { l: 'Loop 2 closure error', v: loopErr[1], u: 'm', d: 8 }, { l: 'Iterations to converge', v: conv, u: '\u2014', d: 0 }, { l: 'Convergence', s: hist[hist.length - 1] < 1e-8 ? 'converged \u2014 both loops balance' : 'slow convergence \u2014 check for a nearly-closed branch', u: '' }, { l: 'Reversed pipes', v: Q.filter(q => q < 0).length, u: '\u2014', d: 0 }],
            table: { title: 'Converged pipe schedule', head: ['Pipe', 'Diameter', 'Flow', 'Velocity', 'Reynolds', 'Head loss'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: r.hist.length, ymin: 1e-12, ymax: Math.max(r.hist[0] * 4, 1e-6), ylog: true, ml: 72 });
          g.grid('Iteration', 'Loop closure residual  (m)', 5, 4, t => self.f(t, 0));
          g.title('Hardy Cross convergence');
          g.line(r.hist.map((h, i) => [i + 1, Math.max(h, 1e-12)]), C.dk, 2.6);
          g.line([[1, 1e-8], [r.hist.length, 1e-8]], C.warn, 1.5, [5, 4]);
          g.txt('tolerance', r.hist.length * 0.99, 1.6e-8, C.warn, 'right', 10.5, 'bottom');
          r.hist.forEach((h, i) => { if (i % 4 === 0 && i < 25) g.dot(i + 1, Math.max(h, 1e-12), C.acc, 3.2); });
          g.legend([{ c: C.dk, l: 'residual' }, { c: C.warn, l: 'tolerance', d: [5, 4] }]);
        }
      },
      {
        id: 'joback', num: 'T-10', sec: TP, name: 'Property estimation \u2014 Joback groups',
        blurb: 'When a compound has no data, you build its properties out of the pieces it is made of. Count the functional groups, add their contributions, and out come the critical constants, the boiling point and the heat capacity \u2014 accurate to a few percent for hydrocarbons and rather worse for anything hydrogen-bonded.',
        howto: 'The curve is the estimated ideal-gas heat capacity across temperature, with the critical point and boiling point marked on the results. Add or remove a group and everything moves at once \u2014 that coupling is exactly why group contribution works and why one wrong count spoils every property.',
        std: 'Joback & Reid (1987), Chem. Eng. Comm. 57, 233; Reid, Prausnitz & Poling, Properties of Gases & Liquids 5th ed. \u00a72',
        eqs: [['T_b = 198.2 + \\sum_kN_k\\left(tbk\\right)', 'normal boiling point, K'], ['T_c = T_b\\left[0.584 + 0.965\\sum N_k\\left(tck\\right) - \\left(\\sum N_k\\left(tck\\right)\\right)^2\\right]^{-1}', 'critical temperature'], ['P_c = \\left[0.113 + 0.0032N_A - \\sum N_k\\left(pck\\right)\\right]^{-2},\\qquad V_c = 17.5 + \\sum N_k\\left(vck\\right)', 'critical pressure in bar and volume in cm³/mol'], ['c_p^{\\,ig} = \\left(\\sum N_ka - 37.93\\right) + \\left(\\sum N_kb + 0.210\\right)T + \\left(\\sum N_kc - 3.91\\times10^{-4}\\right)T^2', 'ideal-gas heat capacity, J/mol·K']],
        notes: ['First-order groups only \u2014 no correction for proximity effects or isomerism.', 'Errors run about 1% on T_b for hydrocarbons, 3\u20135% on T_c, and much worse for polyfunctional or hydrogen-bonding molecules.', 'Group counts must describe a real, valence-satisfied molecule; the method will happily estimate nonsense otherwise.'],
        params: JKEYS.map(k => P(k, JB[k][0], 0, 12, 1, k === 'ch3' ? 2 : k === 'ch2' ? 4 : 0, null, 'count')).concat([P('T', 'Temperature for c_p', -50, 800, 5, 100, 'T'), P('MW', 'Molecular weight (if known)', 0, 500, 0.1, 86.18, null, 'kg/kmol')]),
        compute: v => {
          const keys = JKEYS;
          const N = k => Math.max(Math.round(v[k] || 0), 0);
          const sum = i => keys.reduce((s, k) => s + N(k) * JB[k][i], 0);
          const n = keys.reduce((s, k) => s + N(k), 0);
          const NA = sum(5);
          const a = sum(6), bq = sum(7), cq = sum(8), dq = sum(9);
          const Tb = 198.2 + sum(4);
          const sumTc = sum(1), sumPc = sum(2);
          const Tc = Tb / (0.584 + 0.965 * sumTc - sumTc * sumTc);
          const Pc = 1 / Math.pow(0.113 + 0.0032 * NA - sumPc, 2);
          const Vc = 17.5 + sum(3);
          const A = a - 37.93, B = bq + 0.210, Cc = cq - 3.91e-4, Dd = dq + 2.06e-7;
          const cpOf = T => { const K = T + 273.15; return A + B * K + Cc * K * K + Dd * K * K * K; };
          const cp = cpOf(v.T);
          const Tr = (v.T + 273.15) / Math.max(Tc, 1);
          const om = 3 / 7 * (Math.log10(Math.max(Pc, 0.01) / 1.01325)) / (Tc / Math.max(Tb, 1) - 1) - 1;
          const Zc = 0.291 - 0.08 * om;
          const MW = v.MW > 0 ? v.MW : NaN;
          const valid = n > 0 && isFinite(Tc) && Tc > Tb;
          return {
            cpOf: cpOf, Tc: Tc, Tb: Tb, cp: cp,
            res: [{ l: 'Groups counted', v: n, u: '\u2014', d: 0 }, { l: 'Estimate valid', s: valid ? 'yes \u2014 the group set is self-consistent' : 'no \u2014 add groups until T_c exceeds T_b', u: '' }, { l: 'Normal boiling point T_b', v: Tb - 273.15, u: '', cv: 'T', d: 1 }, { l: 'Critical temperature T_c', v: Tc - 273.15, u: '', cv: 'T', d: 1 }, { l: 'Critical pressure P_c', v: Pc, u: 'bar', d: 2 }, { l: 'Critical volume V_c', v: Vc, u: 'cm\u00b3/mol', d: 1 }, { l: 'Critical compressibility Z_c', v: Zc, u: '\u2014', d: 4 }, { l: 'Acentric factor \u03c9', v: om, u: '\u2014', d: 4 }, { l: 'Reduced temperature T_r', v: Tr, u: '\u2014', d: 4 }, { l: 'State at this temperature', s: v.T + 273.15 > Tc ? 'supercritical' : v.T + 273.15 > Tb ? 'vapour at one atmosphere' : 'liquid at one atmosphere', u: '' }, { l: 'Ideal-gas c_p', v: cp, u: 'J/mol\u00b7K', d: 2 }, { l: 'Ideal-gas c_p (mass basis)', v: isFinite(MW) ? cp / MW : NaN, u: 'kJ/kg\u00b7K', d: 4 }, { l: 'c_p at 25 \u00b0C', v: cpOf(25), u: 'J/mol\u00b7K', d: 2 }, { l: 'Heat capacity ratio estimate', v: cp / Math.max(cp - 8.314, 0.1), u: '\u2014', d: 4 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const tmin = -50, tmax = 800;
          const lo = Math.min(r.cpOf(tmin), r.cpOf(tmax)), hi = Math.max(r.cpOf(tmin), r.cpOf(tmax));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: tmin, xmax: tmax, ymin: Math.max(lo * 0.9, 0), ymax: hi * 1.08, ml: 76 });
          g.grid('Temperature  (' + self.cvt(0, 'T')[1] + ')', 'Ideal-gas c\u209a  (J/mol\u00b7K)', 5, 5, t => self.f(self.cvt(t, 'T')[0], 0), t => self.f(t, 0));
          g.title('Estimated heat capacity from the group set');
          g.fn(T => r.cpOf(T), C.dk, 2.8);
          if (isFinite(r.Tb)) { const tb = r.Tb - 273.15; if (tb > tmin && tb < tmax) { g.line([[tb, Math.max(lo * 0.9, 0)], [tb, hi * 1.08]], C.mid, 1.4, [4, 4]); g.txt('T\u1d47', tb, hi * 1.03, C.mid, 'center', 11); } }
          if (isFinite(r.Tc)) { const tc = r.Tc - 273.15; if (tc > tmin && tc < tmax) { g.line([[tc, Math.max(lo * 0.9, 0)], [tc, hi * 1.08]], C.warn, 1.5, [5, 4]); g.txt('T\ua700', tc, hi * 1.03, C.warn, 'center', 11); } }
          g.dot(v.T, r.cp, C.acc, 5.5);
          g.txt(self.f(r.cp, 1), v.T, r.cp + (hi - lo) * 0.06, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'c\u209a estimate' }, { c: C.mid, l: 'boiling point', d: [4, 4] }, { c: C.warn, l: 'critical point', d: [5, 4] }]);
        }
      }
    ];
  }
