  dNewA() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const sw = (Re, rr) => Re < 2100 ? 64 / Math.max(Re, 1) : 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    const FL = 'Fluid Mechanics', HT = 'Heat Transfer';
    return [
      {
        id: 'gasflow', num: 'F-05', sec: FL, name: 'Compressible gas flow in a pipe',
        blurb: 'Long gas lines cannot be sized on liquid pressure drop. As the gas expands it accelerates, so the gradient steepens down the pipe \u2014 and there is a flow beyond which the outlet simply chokes at sonic velocity, whatever the downstream pressure does.',
        howto: 'The curve is outlet pressure against mass flow for your line. Where it turns down to the vertical dashed line the outlet has gone sonic and no valve downstream can pull more through. Keep the outlet Mach number below about 0.3 or the last few metres of pipe do most of the pressure dropping.',
        std: 'Isothermal compressible flow equation \u2014 Crane TP-410 (2013); Perry\u2019s 8th ed. \u00a76',
        eqs: [['P_1^2 - P_2^2 = G^2R_sT\\left[f\\frac{L}{D} + 2\\ln\\frac{P_1}{P_2}\\right]', 'isothermal flow with wall friction'], ['G = \\frac{\\dot m}{A},\\quad Ma_2 = \\frac{G}{\\rho_2c},\\quad c = \\sqrt{\\gamma R_sT}', 'mass flux, outlet Mach number, sonic velocity'], ['R_s = \\frac{8314}{M_w},\\quad \\rho = \\frac{P}{R_sT}', 'ideal-gas specific constant and density']],
        notes: ['Isothermal \u2014 the right model for long uninsulated lines; short runs are closer to adiabatic.', 'Ideal gas, Z = 1. Divide density by Z above about 30 bar.', 'Fittings entered as a fraction of the straight length.'],
        params: [P('D', 'Internal diameter', 25, 900, 1, 154.1, 'mm'), P('L', 'Pipe length', 10, 20000, 10, 500, 'L'), P('P1', 'Inlet pressure (abs)', 1, 150, 0.5, 10, null, 'bar a'), P('T', 'Gas temperature', -20, 400, 1, 40, 'T'), P('MW', 'Molecular weight', 2, 120, 0.5, 19, null, 'kg/kmol'), P('gam', 'Heat capacity ratio k', 1.05, 1.7, 0.01, 1.3, null, '\u2014'), P('mu', 'Gas viscosity', 0.005, 0.05, 0.001, 0.012, null, 'cP'), P('m', 'Mass flow', 100, 300000, 100, 20000, null, 'kg/h'), P('rough', 'Absolute roughness \u03b5', 0.005, 3, 0.005, 0.045, null, 'mm'), P('Le', 'Fittings as fraction of L', 0, 3, 0.05, 0.2, null, '\u2014')],
        compute: v => {
          const D = v.D / 1000, A = Math.PI * D * D / 4, Rs = 8314 / v.MW, TK = v.T + 273.15;
          const P1 = v.P1 * 1e5, Lt = v.L * (1 + v.Le), c = Math.sqrt(v.gam * Rs * TK);
          const P2of = mdot => {
            const G = (mdot / 3600) / A;
            if (G <= 0) return P1;
            const Re = G * D / (v.mu * 1e-3), f = sw(Re, v.rough / v.D);
            const F = p2 => P1 * P1 - p2 * p2 - G * G * Rs * TK * (f * Lt / D + 2 * Math.log(P1 / Math.max(p2, 1)));
            const lim = G * Rs * TK / c;
            if (lim >= P1 || F(lim) <= 0) return NaN;
            return self.bis(F, lim, P1 * 0.999999, 1);
          };
          const P2 = P2of(v.m), G = (v.m / 3600) / A;
          const Re = G * D / (v.mu * 1e-3), f = sw(Re, v.rough / v.D);
          const rho1 = P1 / (Rs * TK), rho2 = P2 / (Rs * TK);
          let lo = 1, hi = 2e6;
          for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (isFinite(P2of(mid))) lo = mid; else hi = mid; }
          return {
            P2of: P2of, P2: P2, mchoke: lo, c: c,
            res: [{ l: 'Mass flux G', v: G, u: 'kg/m\u00b2\u00b7s', d: 1 }, { l: 'Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Friction factor f', v: f, u: '\u2014', d: 4 }, { l: 'Outlet pressure', v: P2 / 1e5, u: 'bar a', d: 3 }, { l: 'Pressure drop', v: (P1 - P2) / 1e5, u: 'bar', d: 3 }, { l: 'Inlet velocity', v: G / rho1, u: 'm/s', d: 1 }, { l: 'Outlet velocity', v: G / rho2, u: 'm/s', d: 1 }, { l: 'Outlet Mach number', v: G / rho2 / c, u: '\u2014', d: 3 }, { l: 'Sonic velocity', v: c, u: 'm/s', d: 0 }, { l: 'Choke flow', v: lo, u: 'kg/h', d: 0 }, { l: 'Flow as % of choke', v: v.m / lo * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const mmax = Math.max(v.m, r.mchoke) * 1.12, pmax = v.P1 * 1.06;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: mmax, ymin: 0, ymax: pmax });
          g.grid('Mass flow  (kg/h)', 'Outlet pressure  (bar a)', 5, 5);
          g.title('Outlet pressure and the choke limit');
          g.fill([[r.mchoke, 0], [mmax, 0], [mmax, pmax], [r.mchoke, pmax]], C.soft2);
          g.fn(m => r.P2of(m) / 1e5, C.dk, 2.8);
          g.line([[r.mchoke, 0], [r.mchoke, pmax]], C.warn, 1.6, [5, 4]);
          g.txt('choked \u2014 sonic outlet', r.mchoke * 0.97, pmax * 0.42, C.warn, 'right', 11);
          g.line([[0, v.P1], [mmax, v.P1]], C.mut, 1.2, [3, 3]);
          g.txt('inlet pressure', mmax * 0.02, v.P1 * 1.004, C.mut, 'left', 10.5, 'bottom');
          if (isFinite(r.P2)) { g.dot(v.m, r.P2 / 1e5, C.acc, 5.5); g.txt('duty', v.m, r.P2 / 1e5 + pmax * 0.028, C.ink, 'center', 12); }
          g.legend([{ c: C.dk, l: 'outlet pressure' }, { c: C.warn, l: 'choke flow', d: [5, 4] }]);
        }
      },
      {
        id: 'nonnewt', num: 'F-06', sec: FL, name: 'Non-Newtonian pipe flow',
        blurb: 'Slurries, polymer solutions and pastes do not have a viscosity \u2014 they have a curve. A power-law fluid shear-thins as you push it harder; a Bingham plastic refuses to move at all until the wall stress beats its yield stress, and then slides down the pipe with a solid plug in the middle.',
        howto: 'Left panel is the velocity profile across the pipe: the flatter and blunter it is, the further from Newtonian you are, and a Bingham fluid shows a literal flat-topped plug. Right panel is pressure drop against flow, with the Newtonian line for the same consistency as reference \u2014 the gap between them is what shear-thinning buys you.',
        std: 'Metzner\u2013Reed (1955) generalised Reynolds number; Dodge\u2013Metzner (1959); Buckingham\u2013Reiner equation',
        eqs: [['\\tau = K\\dot\\gamma^{\\,n},\\qquad \\tau = \\tau_0 + \\mu_p\\dot\\gamma', 'power-law model (left) and Bingham-plastic model (right)'], ['Re_{MR} = \\frac{\\rho V^{2-n}D^n}{K\\left(\\frac{3n+1}{4n}\\right)^n8^{n-1}}', 'Metzner–Reed generalised Reynolds number'], ['V = \\frac{R\\tau_w}{4\\mu_p}\\left[1 - \\frac{4}{3}\\frac{\\tau_0}{\\tau_w} + \\frac{1}{3}\\left(\\frac{\\tau_0}{\\tau_w}\\right)^4\\right]', 'Buckingham–Reiner — Bingham laminar flow']],
        notes: ['Laminar solutions are exact; turbulent power-law uses Dodge\u2013Metzner.', 'Turbulent Bingham flow approximated with the plastic viscosity as Newtonian.', 'Isothermal, time-independent rheology, no slip at the wall.'],
        params: [{ k: 'model', label: 'Rheological model', type: 'select', val: 'power', options: [['power', 'Power law (Ostwald\u2013de Waele)'], ['bing', 'Bingham plastic']] }, P('D', 'Internal diameter', 10, 600, 1, 102.3, 'mm'), P('L', 'Pipe length', 1, 2000, 1, 100, 'L'), P('Q', 'Volumetric flow', 0.5, 800, 0.5, 30, 'Q'), P('rho', 'Density', 700, 2200, 10, 1200, null, 'kg/m\u00b3'), P('K', 'Consistency index K', 0.01, 50, 0.01, 1.2, null, 'Pa\u00b7s\u207f'), P('n', 'Flow behaviour index n', 0.2, 1.4, 0.01, 0.6, null, '\u2014'), P('tau0', 'Yield stress \u03c4\u2080', 0, 200, 0.5, 20, null, 'Pa'), P('mup', 'Plastic viscosity \u03bc_p', 0.001, 5, 0.001, 0.05, null, 'Pa\u00b7s')],
        compute: v => {
          const D = v.D / 1000, R = D / 2, A = Math.PI * R * R, Vel = (v.Q / 3600) / A, n = v.n;
          const pw = v.model === 'power';
          const RePL = Vel > 0 ? v.rho * Math.pow(Vel, 2 - n) * Math.pow(D, n) / (v.K * Math.pow((3 * n + 1) / (4 * n), n) * Math.pow(8, n - 1)) : 0;
          const dm = () => { let fF = 0.005; for (let i = 0; i < 60; i++) { const rhs = (4 / Math.pow(n, 0.75)) * Math.log10(Math.max(RePL * Math.pow(fF, 1 - n / 2), 1.01)) - 0.4 / Math.pow(n, 1.2); fF = 1 / (rhs * rhs); } return 4 * fF; };
          const tauW = pw ? null : (() => { const F = tw => (R * tw / (4 * v.mup)) * (1 - (4 / 3) * (v.tau0 / tw) + (1 / 3) * Math.pow(v.tau0 / tw, 4)) - Vel; return self.bis(F, v.tau0 * 1.000001 + 1e-9, v.tau0 * 1e4 + 1e6, 1e-6); })();
          const ReB = v.rho * Vel * D / v.mup, He = v.rho * D * D * v.tau0 / (v.mup * v.mup);
          let dP, fD, regime;
          if (pw) { fD = RePL < 2100 ? 64 / Math.max(RePL, 1e-6) : dm(); dP = fD * (v.L / D) * v.rho * Vel * Vel / 2 / 1000; regime = RePL < 2100 ? 'laminar' : 'turbulent (Dodge\u2013Metzner)'; }
          else if (ReB < 2100) { dP = 4 * tauW * v.L / D / 1000; fD = 2 * dP * 1000 * D / (v.L * v.rho * Vel * Vel); regime = 'laminar (Buckingham)'; }
          else { fD = sw(ReB, 0.00005); dP = fD * (v.L / D) * v.rho * Vel * Vel / 2 / 1000; regime = 'turbulent \u2014 plastic viscosity basis'; }
          const muN = pw ? v.K * Math.pow(8 * Vel / D, n - 1) : v.mup;
          const ReN = v.rho * Vel * D / muN;
          const dPN = sw(ReN, 0.00005) * (v.L / D) * v.rho * Vel * Vel / 2 / 1000;
          const prof = rr => {
            const rl = Math.abs(rr) * R;
            if (pw) return Vel * ((3 * n + 1) / (n + 1)) * (1 - Math.pow(rl / R, (n + 1) / n));
            const rp = Math.min(v.tau0 / tauW * R, R);
            const u = q => (tauW / (2 * v.mup * R)) * (R * R - q * q) - (v.tau0 / v.mup) * (R - q);
            return rl <= rp ? u(rp) : u(rl);
          };
          const dPof = Q => {
            const V2 = (Q / 3600) / A;
            if (V2 <= 0) return 0;
            if (pw) { const Re2 = v.rho * Math.pow(V2, 2 - n) * Math.pow(D, n) / (v.K * Math.pow((3 * n + 1) / (4 * n), n) * Math.pow(8, n - 1)); const f2 = Re2 < 2100 ? 64 / Re2 : (() => { let fF = 0.005; for (let i = 0; i < 50; i++) { const rhs = (4 / Math.pow(n, 0.75)) * Math.log10(Math.max(Re2 * Math.pow(fF, 1 - n / 2), 1.01)) - 0.4 / Math.pow(n, 1.2); fF = 1 / (rhs * rhs); } return 4 * fF; })(); return f2 * (v.L / D) * v.rho * V2 * V2 / 2 / 1000; }
            const tw = self.bis(t => (R * t / (4 * v.mup)) * (1 - (4 / 3) * (v.tau0 / t) + (1 / 3) * Math.pow(v.tau0 / t, 4)) - V2, v.tau0 * 1.000001 + 1e-9, v.tau0 * 1e4 + 1e6, 1e-6);
            const Re2 = v.rho * V2 * D / v.mup;
            return Re2 < 2100 ? 4 * tw * v.L / D / 1000 : sw(Re2, 0.00005) * (v.L / D) * v.rho * V2 * V2 / 2 / 1000;
          };
          const res = [{ l: 'Mean velocity', v: Vel, u: '', cv: 'vel', d: 2 }, { l: 'Pressure drop', v: dP, u: 'kPa', d: 2 }, { l: 'Newtonian equivalent \u0394P', v: dPN, u: 'kPa', d: 2 }, { l: 'Wall shear stress \u03c4_w', v: pw ? fD * v.rho * Vel * Vel / 8 : tauW, u: 'Pa', d: 2 }, { l: 'Friction factor f', v: fD, u: '\u2014', d: 4 }, { l: 'Centreline velocity', v: prof(0), u: 'm/s', d: 2 }];
          if (pw) res.push({ l: 'Re (Metzner\u2013Reed)', v: RePL, u: '\u2014', d: 0 }, { l: 'Apparent viscosity at wall', v: muN * 1000, u: 'cP', d: 1 });
          else res.push({ l: 'Re (plastic viscosity)', v: ReB, u: '\u2014', d: 0 }, { l: 'Hedstr\u00f6m number', v: He, u: '\u2014', d: 0 }, { l: 'Plug radius / R', v: Math.min(v.tau0 / tauW, 1), u: '\u2014', d: 3 });
          res.push({ l: 'Flow regime', s: regime, u: '' });
          const dPNof = Q => { const V2 = (Q / 3600) / A; if (V2 <= 0) return 0; const Re2 = v.rho * V2 * D / muN; return sw(Re2, 0.00005) * (v.L / D) * v.rho * V2 * V2 / 2 / 1000; };
          return { prof: prof, dPof: dPof, dPNof: dPNof, dP: dP, dPN: dPN, Vel: Vel, res: res };
        },
        draw: (ctx, b, v, r) => {
          const w2 = b.w / 2 - 12;
          const umax = Math.max(r.prof(0), 1e-9) * 1.12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: w2, h: b.h, xmin: 0, xmax: umax, ymin: -1, ymax: 1, ml: 54 });
          g.grid('Velocity  (m/s)', 'Radial position  r/R', 4, 4);
          g.title('Velocity profile');
          const pts = [];
          for (let i = -60; i <= 60; i++) pts.push([r.prof(i / 60), i / 60]);
          g.fill([[0, -1]].concat(pts, [[0, 1]]), C.soft);
          g.line(pts, C.dk, 2.6);
          g.line([[r.Vel, -1], [r.Vel, 1]], C.mid, 1.4, [5, 4]);
          g.txt('mean V', r.Vel + umax * 0.02, 0.86, C.mid, 'left', 10.5);
          const qmax = v.Q * 1.9;
          const g2 = self.mkG(ctx, { x: b.x + b.w / 2 + 12, y: b.y, w: w2, h: b.h, xmin: 0, xmax: qmax, ymin: 0, ymax: Math.max(r.dPof(qmax), r.dPNof(qmax), r.dP) * 1.08, ml: 58 });
          g2.grid('Flow  (' + self.cvt(0, 'Q')[1] + ')', 'Pressure drop  (kPa)', 4, 5, t => self.f(self.cvt(t, 'Q')[0], 0));
          g2.title('Pressure drop vs flow');
          g2.fn(q => r.dPof(q), C.dk, 2.6);
          g2.fn(q => r.dPNof(q), C.lt, 2, [6, 4]);
          g2.dot(v.Q, r.dP, C.acc, 5.5);
          g2.legend([{ c: C.dk, l: 'model' }, { c: C.lt, l: 'Newtonian', d: [6, 4] }]);
        }
      },
      {
        id: 'fittings', num: 'F-07', sec: FL, name: 'Pipe fittings & equivalent length (3K)',
        blurb: 'Every bend, tee and valve costs pressure, and on a short run inside a plant the fittings usually cost more than the pipe. The 3K method makes that explicit: each fitting\u2019s K depends on Reynolds number and on the size of the fitting, so a 2-inch elbow is not a scaled-up 12-inch elbow.',
        howto: 'The lower band is straight-pipe friction, the upper band the fittings on top of it \u2014 read the gap at your design flow to see which one you are actually paying for. Because both scale with V\u00b2 the split does not change with flow; it changes with diameter, so if fittings dominate, the fix is a bigger line, not a smoother one.',
        std: 'Hooper 3K method \u2014 Chem. Eng. 88(17), 96 (1981); Darby, Chem. Eng. 108(4), 127 (2001)',
        eqs: [['K = \\frac{K_1}{Re} + K_\\infty\\left(1 + \\frac{K_d}{D_{in}^{0.3}}\\right)', 'Hooper 3K resistance coefficient'], ['\\Delta P = \\left(f\\frac{L}{D} + \\sum K\\right)\\frac{\\rho V^2}{2}', 'straight pipe plus fittings'], ['L_{eq} = \\frac{\\sum K\\,D}{f}', 'the same losses expressed as equivalent length']],
        notes: ['D_in is the nominal fitting size in inches \u2014 the 3K size correction.', 'Entrance and exit losses (K = 0.5 and 1.0) included as standard.', 'Turbulent, single-phase, incompressible flow.'],
        params: [P('D', 'Internal diameter', 15, 600, 1, 102.3, 'mm'), P('L', 'Straight length', 1, 2000, 1, 60, 'L'), P('Q', 'Volumetric flow', 0.5, 2000, 0.5, 40, 'Q'), P('rho', 'Density', 500, 1600, 10, 998, null, 'kg/m\u00b3'), P('mu', 'Viscosity', 0.1, 500, 0.1, 1, null, 'cP'), P('rough', 'Absolute roughness \u03b5', 0.005, 3, 0.005, 0.045, null, 'mm'), P('n90', '90\u00b0 elbows (long radius)', 0, 40, 1, 8, null, 'off'), P('n45', '45\u00b0 elbows', 0, 40, 1, 2, null, 'off'), P('ntt', 'Tees, run-through', 0, 20, 1, 2, null, 'off'), P('ntb', 'Tees, branch flow', 0, 20, 1, 1, null, 'off'), P('ngt', 'Gate valves', 0, 20, 1, 2, null, 'off'), P('ngl', 'Globe valves', 0, 20, 1, 1, null, 'off'), P('nck', 'Swing check valves', 0, 20, 1, 1, null, 'off')],
        compute: v => {
          const D = v.D / 1000, A = Math.PI * D * D / 4, Din = Math.max(v.D / 25.4, 0.5);
          const Vel = (v.Q / 3600) / A, Re = v.rho * Vel * D / (v.mu / 1000);
          const K3 = [['90\u00b0 elbow, long radius', 800, 0.071, 4.2, v.n90], ['45\u00b0 elbow', 500, 0.071, 4.2, v.n45], ['Tee, run-through', 200, 0.091, 4.0, v.ntt], ['Tee, branch flow', 500, 0.274, 4.0, v.ntb], ['Gate valve, open', 300, 0.037, 3.9, v.ngt], ['Globe valve, open', 1500, 1.7, 3.6, v.ngl], ['Swing check valve', 1500, 0.46, 4.0, v.nck]];
          const Kof = (K1, Ki, Kd) => K1 / Math.max(Re, 1) + Ki * (1 + Kd / Math.pow(Din, 0.3));
          let Ksum = 1.5;
          const parts = [];
          K3.forEach(it => { const k = Kof(it[1], it[2], it[3]) * it[4]; Ksum += k; if (it[4] > 0) parts.push({ l: it[0] + '  \u00d7' + it[4], v: k, u: '\u2014', d: 3 }); });
          const f = sw(Re, v.rough / v.D);
          const hd = v.rho * Vel * Vel / 2 / 1000;
          const dPpipe = f * (v.L / D) * hd, dPfit = Ksum * hd;
          const dPof = Q => { const V2 = (Q / 3600) / A, Re2 = v.rho * V2 * D / (v.mu / 1000); return { p: sw(Re2, v.rough / v.D) * (v.L / D) * v.rho * V2 * V2 / 2 / 1000, k: Ksum * v.rho * V2 * V2 / 2 / 1000 }; };
          return {
            dPof: dPof, dPpipe: dPpipe, dPfit: dPfit,
            res: [{ l: 'Velocity', v: Vel, u: '', cv: 'vel', d: 2 }, { l: 'Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Friction factor f', v: f, u: '\u2014', d: 4 }, { l: 'Velocity head \u03c1V\u00b2/2', v: hd, u: 'kPa', d: 3 }, { l: '\u03a3K including entry/exit', v: Ksum, u: '\u2014', d: 2 }, { l: 'Equivalent length of fittings', v: Ksum * D / f, u: '', cv: 'L', d: 1 }, { l: '\u0394P straight pipe', v: dPpipe, u: 'kPa', d: 2 }, { l: '\u0394P fittings', v: dPfit, u: 'kPa', d: 2 }, { l: 'Total \u0394P', v: dPpipe + dPfit, u: 'kPa', d: 2 }, { l: 'Fittings share of total', v: dPfit / (dPpipe + dPfit) * 100, u: '%', d: 1 }].concat(parts)
          };
        },
        draw: (ctx, b, v, r) => {
          const qmax = v.Q * 1.8, top = r.dPof(qmax);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: qmax, ymin: 0, ymax: (top.p + top.k) * 1.08 });
          g.grid('Flow  (' + self.cvt(0, 'Q')[1] + ')', 'Pressure drop  (kPa)', 5, 5, t => self.f(self.cvt(t, 'Q')[0], 0));
          g.title('Where the pressure goes');
          const pipe = [], tot = [];
          for (let i = 0; i <= 80; i++) { const q = qmax * i / 80, d = r.dPof(q); pipe.push([q, d.p]); tot.push([q, d.p + d.k]); }
          g.fill([[0, 0]].concat(pipe, [[qmax, 0]]), C.soft2);
          g.fill(pipe.concat(tot.slice().reverse()), C.soft);
          g.line(pipe, C.mid, 2.2);
          g.line(tot, C.dk, 2.8);
          const d0 = r.dPof(v.Q);
          g.line([[v.Q, 0], [v.Q, d0.p + d0.k]], C.mut, 1.2, [4, 4]);
          g.dot(v.Q, d0.p + d0.k, C.acc, 5.5);
          g.txt('straight pipe', qmax * 0.5, r.dPof(qmax * 0.5).p * 0.45, C.mid, 'center', 11.5);
          g.txt('fittings', qmax * 0.5, r.dPof(qmax * 0.5).p + r.dPof(qmax * 0.5).k * 0.45, C.ink, 'center', 11.5);
          g.legend([{ c: C.dk, l: 'total' }, { c: C.mid, l: 'pipe only' }]);
        }
      },
      {
        id: 'comppwr',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const W = self.rget(r, 'shaft power') || 0, T2 = self.rget(r, 'discharge temperature');
  const rc = self.rget(r, 'ratio per stage') || 1, n = Math.max(1, Math.round(v.N));
  const hot = T2 !== undefined && T2 > v.Tlim;
  const lo = v.T1, hi = Math.max(T2 === undefined ? v.T1 : T2, v.Tlim);
  const tf = T => 0.3 + 0.68 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  s.title(n + '-stage compression', 'ratio ' + self.f(rc, 2) + '/stage \u00b7 ' + self.f(W, 0) + ' kW shaft');
  const X = s.x + 60, Wt = s.w - 212, pitch = Wt / n, cy = Math.min(s.cy - 10, s.y + 104);
  s.L([[s.x + 6, cy], [X, cy]], { col: s.temp(tf(v.T1)), lw: 2.8, arrow: true });
  s.T(self.f(self.cvt(v.P1, 'Pb')[0], 2) + ' bar \u00b7 ' + self.f(self.cvt(v.T1, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], s.x + 6, cy - 14, { size: 10.5, col: s.temp(tf(v.T1)) });
  for (let i = 0; i < n; i++) {
    const xx = X + pitch * i, u = (i + 1) / n;
    const Ts = v.T1 + ((T2 === undefined ? v.T1 : T2) - v.T1) * (i + 1) / n;
    const cc = s.temp(tf(Ts));
    s.L([[xx + 8, cy - 26], [xx + 8, cy + 26], [xx + pitch - 44, cy + 15], [xx + pitch - 44, cy - 15]], { col: C.ink, lw: 1.6, close: true, fill: s.temp(tf(Ts), 0.2) });
    s.T('S' + (i + 1), xx + 24, cy, { size: 11, col: C.ink, bold: true });
    if (i < n - 1) {
      const icx = xx + pitch - 22;
      s.L([[xx + pitch - 44, cy], [icx - 14, cy]], { col: cc, lw: 2.4 });
      s.unit(icx - 14, cy - 15, 30, 30, '', { col: s.temp(0.22), fill: s.temp(0.22, 0.2) });
      s.coil(icx - 10, cy - 8, 22, 16, 4, { col: s.temp(0.22), lw: 1.3 });
      s.L([[icx + 16, cy], [xx + pitch + 8, cy]], { col: s.temp(0.3), lw: 2.4, arrow: true });
      s.T('intercool', icx + 1, cy + 28, { align: 'center', size: 9.5, col: C.mut });
    } else {
      s.L([[xx + pitch - 44, cy], [s.x + s.w - 152, cy]], { col: cc, lw: 2.8, arrow: true });
    }
  }
  s.T(self.f(self.cvt(v.P2, 'Pb')[0], 2) + ' bar \u00b7 ' + self.f(self.cvt(T2 === undefined ? v.T1 : T2, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], s.x + s.w - 152, cy + 26, { size: 10.5, col: hot ? C.warn : s.temp(tf(T2 === undefined ? v.T1 : T2)), align: 'right' });
  const bx = s.x + s.w - 134;
  s.badge(bx, s.y + 4, 'Shaft power', self.f(W, 1) + ' kW', 0.5 + 0.44 * self.cl01(W / 4000), { w: 134 });
  s.badge(bx, s.y + 48, 'Discharge T', self.f(self.cvt(T2 === undefined ? v.T1 : T2, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], tf(T2 === undefined ? v.T1 : T2), { w: 134 });
  s.badge(bx, s.y + 92, 'Limit', self.f(self.cvt(v.Tlim, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], null, { w: 134 });
  if (hot) s.T('discharge above the temperature limit \u2014 add a stage', s.cx - 20, Math.min(s.y + s.h - 18, cy + 58), { align: 'center', size: 11.5, col: C.warn, bold: true });
},
        schemNote: 'One casing per stage with an intercooler between each pair; casing tint is the gas temperature leaving it. Exceed the discharge limit and the train is flagged \u2014 adding a stage cools it back down.',
        num: 'F-08', sec: FL, name: 'Compressor, blower & fan power',
        blurb: 'Shaft power for a machine that compresses gas, and the discharge temperature that comes with it. Splitting the ratio across stages with intercooling cuts both \u2014 which is why nobody compresses ten to one in a single wheel.',
        howto: 'Each curve is power against overall pressure ratio for a number of stages; the dashed curve is single-stage discharge temperature on the right-hand scale. Where it crosses the material limit you have to add a stage, and the power you save doing that is the vertical gap between the curves.',
        std: 'Polytropic compression \u2014 GPSA Engineering Data Book 14th ed. \u00a713; ASME PTC 10',
        eqs: [['\\frac{n-1}{n} = \\frac{k-1}{k\\,\\eta_p}', 'polytropic exponent from efficiency'], ['H_p = ZR_sT_1\\frac{n}{n-1}\\left[r_c^{\\frac{n-1}{n}} - 1\\right]', 'polytropic head per stage'], ['W = \\frac{\\dot mH_pN}{\\eta_p},\\quad T_2 = T_1r_c^{\\frac{n-1}{n}}', 'shaft power and discharge temperature']],
        notes: ['Equal pressure ratio per stage with intercooling back to suction temperature.', 'Compressibility Z applied as a constant average.', 'Mechanical losses not included \u2014 add 1\u20133% for gearboxes and seals.'],
        params: [P('m', 'Mass flow', 10, 200000, 10, 5000, null, 'kg/h'), P('P1', 'Suction pressure (abs)', 0.2, 60, 0.05, 1.013, null, 'bar a'), P('P2', 'Discharge pressure (abs)', 0.5, 400, 0.5, 8, null, 'bar a'), P('T1', 'Suction temperature', -50, 250, 1, 30, 'T'), P('MW', 'Molecular weight', 2, 120, 0.5, 29, null, 'kg/kmol'), P('k', 'Heat capacity ratio k', 1.05, 1.7, 0.01, 1.4, null, '\u2014'), P('Z', 'Compressibility Z', 0.6, 1.2, 0.01, 1, null, '\u2014'), P('etap', 'Polytropic efficiency', 0.5, 0.88, 0.01, 0.75, null, '\u2014'), P('N', 'Number of stages', 1, 4, 1, 2, null, '\u2014'), P('Tlim', 'Discharge temperature limit', 80, 250, 5, 150, 'T')],
        compute: v => {
          const Rs = 8314 / v.MW, T1 = v.T1 + 273.15, rt = v.P2 / v.P1, mdot = v.m / 3600;
          const nn = 1 / (1 - (v.k - 1) / (v.k * v.etap));
          const ex = (nn - 1) / nn;
          const Wof = (ratio, N) => { const rc = Math.pow(ratio, 1 / N); const Hp = v.Z * Rs * T1 * (nn / (nn - 1)) * (Math.pow(rc, ex) - 1); return mdot * Hp * N / v.etap / 1000; };
          const T2of = (ratio, N) => T1 * Math.pow(Math.pow(ratio, 1 / N), ex) - 273.15;
          const rc = Math.pow(rt, 1 / v.N);
          const W = Wof(rt, v.N), T2 = T2of(rt, v.N);
          const rho1 = v.P1 * 1e5 / (v.Z * Rs * T1);
          const Wiso = mdot * v.Z * Rs * T1 * Math.log(rt) / 1000;
          return {
            Wof: Wof, T2of: T2of, nn: nn,
            res: [{ l: 'Overall pressure ratio', v: rt, u: '\u2014', d: 3 }, { l: 'Ratio per stage', v: rc, u: '\u2014', d: 3 }, { l: 'Polytropic exponent n', v: nn, u: '\u2014', d: 3 }, { l: 'Inlet volumetric flow', v: mdot / rho1 * 3600, u: '', cv: 'Q', d: 1 }, { l: 'Inlet density', v: rho1, u: 'kg/m\u00b3', d: 3 }, { l: 'Polytropic head per stage', v: v.Z * Rs * T1 * (nn / (nn - 1)) * (Math.pow(rc, ex) - 1) / 9.80665, u: 'm', d: 0 }, { l: 'Shaft power', v: W, u: 'kW', d: 1 }, { l: 'Isothermal power (ideal)', v: Wiso, u: 'kW', d: 1 }, { l: 'Discharge temperature', v: T2, u: '', cv: 'T', d: 1 }, { l: 'Single-stage discharge T', v: T2of(rt, 1), u: '', cv: 'T', d: 1 }, { l: 'Specific power', v: W / (v.m / 1000), u: 'kW\u00b7h/t', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const rmax = Math.max(v.P2 / v.P1, 3) * 1.25;
          const wmax = r.Wof(rmax, 1) * 1.05;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: rmax, ymin: 0, ymax: wmax, mr: 68 });
          g.grid('Overall pressure ratio  P\u2082/P\u2081', 'Shaft power  (kW)', 5, 5);
          g.title('Power and discharge temperature vs pressure ratio');
          const cols = [C.dk, C.acc, C.mid, C.lt];
          [1, 2, 3, 4].forEach((N, i) => { g.fn(x => r.Wof(x, N), cols[i], N === v.N ? 3 : 1.6); g.txt(N + (N === 1 ? ' stage' : ' stages'), rmax * 0.995, r.Wof(rmax, N), cols[i], 'right', 10.5, 'bottom'); });
          const tmax = Math.max(r.T2of(rmax, 1), v.Tlim) * 1.1;
          const tsc = wmax / tmax;
          g.fn(x => r.T2of(x, 1) * tsc, C.warn, 2, [7, 4]);
          g.line([[1, v.Tlim * tsc], [rmax, v.Tlim * tsc]], C.warn, 1.2, [3, 3]);
          g.txt('discharge temperature limit', rmax * 0.99, v.Tlim * tsc + wmax * 0.02, C.warn, 'right', 10.5, 'bottom');
          g.dot(v.P2 / v.P1, r.Wof(v.P2 / v.P1, v.N), C.acc, 5.5);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          for (let T = 0; T <= tmax; T += Math.max(50, Math.round(tmax / 5 / 50) * 50)) { const py = g.Y(T * tsc); if (py >= g.y && py <= g.y + g.h) ctx.fillText(self.f(self.cvt(T, 'T')[0], 0), g.x + g.w + 10, py); }
          ctx.save(); ctx.translate(g.x + g.w + 50, g.y + g.h / 2); ctx.rotate(Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(('Discharge temperature  (' + self.cvt(0, 'T')[1] + ')').toUpperCase(), 0, 0); ctx.restore();
          ctx.restore();
          g.legend([{ c: C.dk, l: 'power by stage count' }, { c: C.warn, l: 'single-stage T\u2082', d: [7, 4] }]);
        }
      },
      {
        id: 'aircool',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Tao = self.rget(r, 'air outlet temperature'), Wf = self.rget(r, 'fan shaft power') || 0;
  const face = self.rget(r, 'bundle face area') || 0, Af = self.rget(r, 'total finned surface') || 0;
  const lo = Math.min(v.Tai, v.Tho), hi = Math.max(v.Thi, Tao === undefined ? v.Tai : Tao);
  const tf = T => 0.06 + 0.88 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  s.title('Air-cooled bundle', v.rows + ' rows \u00b7 face ' + self.f(self.cvt(face, 'A')[0], 1) + ' ' + self.cvt(0, 'A')[1]);
  const X = s.x + 92, W = Math.min(s.w - 220, 380), Y = s.y + 34, rowGap = 15;
  const H = v.rows * rowGap + 14;
  s.R(X, Y, W, H, { stroke: C.ink, lw: 1.6, fill: C.bg });
  for (let i = 0; i < v.rows; i++) {
    const yy = Y + 10 + i * rowGap;
    const u = v.rows === 1 ? 0 : i / (v.rows - 1);
    const tc = s.temp(tf(v.Thi + (v.Tho - v.Thi) * u));
    s.L([[X + 4, yy], [X + W - 4, yy]], { col: tc, lw: 3.4 });
    for (let j = 0; j < 30; j++) { const px = X + 8 + (W - 16) * j / 29; s.L([[px, yy - 4.5], [px, yy + 4.5]], { col: tc, lw: 0.8 }); }
  }
  s.L([[X - 50, Y + 10], [X, Y + 10]], { col: s.temp(tf(v.Thi)), lw: 3.4, arrow: true });
  s.T(self.f(self.cvt(v.Thi, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X - 50, Y - 2, { size: 10.5, col: s.temp(tf(v.Thi)) });
  s.L([[X + W, Y + H - 10], [X + W + 50, Y + H - 10]], { col: s.temp(tf(v.Tho)), lw: 3.4, arrow: true });
  s.T(self.f(self.cvt(v.Tho, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X + W + 50, Y + H - 22, { size: 10.5, col: s.temp(tf(v.Tho)), align: 'right' });
  const fy = Y + H + 86;
  s.fanSym(X + W * 0.3, fy, 30, { col: C.acc });
  s.fanSym(X + W * 0.7, fy, 30, { col: C.acc });
  s.L([[X, Y + H + 40], [X + W, Y + H + 40]], { col: 'rgba(29,31,32,0.3)', lw: 1, dash: [5, 4] });
  s.L([[X - 6, fy + 36], [X - 6, Y + H + 42], [X, Y + H + 42]], { col: C.mut, lw: 1.2 });
  s.L([[X + W + 6, fy + 36], [X + W + 6, Y + H + 42], [X + W, Y + H + 42]], { col: C.mut, lw: 1.2 });
  for (let j = 0; j < 9; j++) {
    const px = X + 14 + (W - 28) * j / 8;
    s.L([[px, fy + 44], [px, Y + H + 4]], { col: s.temp(tf(v.Tai)), lw: 1.3, arrow: true, asz: 5 });
    s.L([[px, Y - 6], [px, Y - 30]], { col: s.temp(tf(Tao === undefined ? v.Tai : Tao)), lw: 1.3, arrow: true, asz: 5 });
  }
  s.T('air in ' + self.f(self.cvt(v.Tai, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X + W / 2, fy + 54, { align: 'center', size: 10.5, col: s.temp(tf(v.Tai)) });
  s.T('air out ' + self.f(self.cvt(Tao === undefined ? v.Tai : Tao, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X + W / 2, Y - 38, { align: 'center', size: 10.5, col: s.temp(tf(Tao === undefined ? v.Tai : Tao)) });
  const px2 = s.x + s.w - 132;
  s.badge(px2, s.y + 4, 'Fan shaft power', self.f(Wf, 1) + ' kW', 0.5 + 0.44 * self.cl01(Wf / 200), { w: 132 });
  s.badge(px2, s.y + 48, 'Finned surface', self.f(self.cvt(Af, 'A')[0], 0) + ' ' + self.cvt(0, 'A')[1], null, { w: 132 });
  s.badge(px2, s.y + 92, 'Face velocity', self.f(v.vface, 1) + ' m/s', 0.5 + 0.4 * self.cl01((v.vface - 2) / 2.5), { w: 132 });
},
        schemNote: 'Row count, air colour and fan symbols are live. Add rows and the bundle deepens; raise the air rise and the exit arrows redden while the fan power badge climbs.',
        num: 'H-04', sec: HT, name: 'Air-cooled heat exchanger sizing',
        blurb: 'A fin-fan has two knobs and they pull against each other: heat more air and you need less of it but the driving force collapses, so the bundle grows. Cool with a small air rise and the bundle shrinks while the fans get very expensive.',
        howto: 'Sweep the air temperature rise and watch the two curves cross purposes \u2014 surface falls steeply at first, fan power climbs as the cube of air flow. The design usually sits where the surface curve has flattened but fan power has not yet run away, typically an air rise of 15\u201325 K.',
        std: 'Air-cooled exchangers \u2014 API 661 7th ed.; GPSA Data Book \u00a710; \u03b5\u2013NTU crossflow relations',
        eqs: [['\\dot m_{air} = \\frac{Q}{c_{p,air}\\Delta T_{air}}', 'air rate set by the temperature rise'], ['\\varepsilon = 1 - \\exp\\left[\\frac{N^{0.22}}{C_r}\\left(e^{-C_rN^{0.78}} - 1\\right)\\right]', 'crossflow, both fluids unmixed'], ['A = \\frac{N\\,C_{min}}{U},\\qquad W_{fan} = \\frac{\\Delta P_{air}\\dot V_{air}}{\\eta_{fan}}', 'surface from NTU, fan power from bundle resistance']],
        notes: ['U is on the bare-tube basis \u2014 multiply by the fin-area ratio for total surface.', 'Air pressure drop taken as 45 Pa per tube row at design face velocity.', 'Sea-level air; derate density for altitude and summer design temperature.'],
        params: [P('Q', 'Duty', 50, 60000, 50, 3000, null, 'kW'), P('Thi', 'Process inlet temperature', 40, 400, 1, 140, 'T'), P('Tho', 'Process outlet temperature', 30, 350, 1, 60, 'T'), P('Tai', 'Air inlet (design ambient)', -10, 55, 1, 38, 'T'), P('dTa', 'Air temperature rise', 5, 45, 1, 20, 'dT'), P('U', 'U (bare-tube basis)', 100, 900, 10, 450, null, 'W/m\u00b2\u00b7K'), P('vface', 'Face velocity', 1, 4.5, 0.1, 2.6, null, 'm/s'), P('rows', 'Tube rows', 2, 8, 1, 4, null, '\u2014'), P('etaf', 'Fan & drive efficiency', 0.4, 0.85, 0.01, 0.65, null, '\u2014'), P('finr', 'Fin / bare area ratio', 8, 25, 0.5, 16, null, '\u2014')],
        compute: v => {
          const cpa = 1005, Q = v.Q * 1000;
          const rhoa = 101325 / (287 * (v.Tai + 273.15));
          const eps = (N, cr) => cr < 1e-6 ? 1 - Math.exp(-N) : 1 - Math.exp(Math.pow(N, 0.22) / cr * (Math.exp(-cr * Math.pow(N, 0.78)) - 1));
          const size = dTa => {
            const ma = Q / (cpa * dTa), Cc = ma * cpa;
            const Ch = Q / Math.max(v.Thi - v.Tho, 0.1);
            const Cmin = Math.min(Ch, Cc), Cmax = Math.max(Ch, Cc), cr = Cmin / Cmax;
            const e = Q / (Cmin * Math.max(v.Thi - v.Tai, 0.1));
            let N = NaN;
            if (e < 0.999) { let lo = 0.01, hi = 30; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (eps(mid, cr) < e) lo = mid; else hi = mid; } N = lo; }
            const A = N * Cmin / v.U;
            const V = ma / rhoa;
            const face = V / v.vface;
            const dP = v.rows * 45 * Math.pow(v.vface / 2.6, 1.8);
            return { A: A, N: N, e: e, ma: ma, V: V, face: face, dP: dP, W: dP * V / v.etaf / 1000, cr: cr };
          };
          const d = size(v.dTa);
          const Tao = v.Tai + v.dTa;
          const dt1 = v.Thi - Tao, dt2 = v.Tho - v.Tai;
          const lmtd = Math.abs(dt1 - dt2) < 1e-6 ? dt1 : (dt1 - dt2) / Math.log(dt1 / dt2);
          return {
            size: size, d: d,
            res: [{ l: 'Air mass flow', v: d.ma * 3600, u: 'kg/h', d: 0 }, { l: 'Air volumetric flow', v: d.V * 3600, u: '', cv: 'Q', d: 0 }, { l: 'Air outlet temperature', v: Tao, u: '', cv: 'T', d: 1 }, { l: 'Counterflow LMTD', v: lmtd, u: '', cv: 'dT', d: 1 }, { l: 'Effectiveness \u03b5', v: d.e, u: '\u2014', d: 3 }, { l: 'NTU required', v: d.N, u: '\u2014', d: 2 }, { l: 'Capacity ratio C_r', v: d.cr, u: '\u2014', d: 3 }, { l: 'Bare-tube surface', v: d.A, u: '', cv: 'A', d: 1 }, { l: 'Total finned surface', v: d.A * v.finr, u: '', cv: 'A', d: 0 }, { l: 'Bundle face area', v: d.face, u: '', cv: 'A', d: 2 }, { l: 'Air-side \u0394P', v: d.dP, u: 'Pa', d: 0 }, { l: 'Fan shaft power', v: d.W, u: 'kW', d: 1 }, { l: 'Fan power as % of duty', v: d.W / v.Q * 100, u: '%', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const dmin = 5, dmax = 45;
          let amax = 0, wmax = 0;
          for (let d = dmin; d <= dmax; d += 1) { const s = r.size(d); if (isFinite(s.A)) amax = Math.max(amax, s.A); wmax = Math.max(wmax, s.W); }
          amax = Math.min(amax, r.d.A * 4) * 1.06;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: dmin, xmax: dmax, ymin: 0, ymax: amax, mr: 66 });
          g.grid('Air temperature rise  (' + self.cvt(0, 'dT')[1] + ')', 'Bare-tube surface  (' + self.cvt(0, 'A')[1] + ')', 5, 5, t => self.f(self.cvt(t, 'dT')[0], 0), t => self.f(self.cvt(t, 'A')[0], 0));
          g.title('Surface and fan power against air rise');
          g.fn(d => { const s = r.size(d); return isFinite(s.A) ? s.A : NaN; }, C.dk, 2.8);
          const wsc = amax / (wmax * 1.1);
          g.fn(d => r.size(d).W * wsc, C.acc, 2.4, [7, 4]);
          g.line([[v.dTa, 0], [v.dTa, amax]], C.mut, 1.2, [4, 4]);
          g.dot(v.dTa, r.d.A, C.dk, 5);
          g.dot(v.dTa, r.d.W * wsc, C.acc, 5);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          const wstep = Math.max(1, Math.round(wmax * 1.1 / 5));
          for (let W = 0; W <= wmax * 1.1; W += wstep) { const py = g.Y(W * wsc); if (py >= g.y && py <= g.y + g.h) ctx.fillText(self.f(W, 0), g.x + g.w + 10, py); }
          ctx.save(); ctx.translate(g.x + g.w + 48, g.y + g.h / 2); ctx.rotate(Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('FAN POWER  (KW)', 0, 0); ctx.restore();
          ctx.restore();
          g.legend([{ c: C.dk, l: 'surface' }, { c: C.acc, l: 'fan power', d: [7, 4] }]);
        }
      },
      {
        id: 'batchht',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const heat = v.mode === 'heat';
  const tN = self.rget(r, 'time \u2014 non-isothermal') || 0, Qa = self.rget(r, 'average duty') || 0;
  const lo = Math.min(v.T0, v.Tt, v.Tm), hi = Math.max(v.T0, v.Tt, v.Tm);
  const tf = T => 0.06 + 0.88 * self.cl01((T - lo) / Math.max(hi - lo, 1));
  s.title(heat ? 'Jacketed vessel \u2014 heating' : 'Jacketed vessel \u2014 cooling', self.f(tN, 1) + ' min to ' + self.f(self.cvt(v.Tt, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1]);
  const W = Math.min(190, s.w * 0.3), X = s.cx - W / 2 - 30, Y = s.y + 44, H = Math.min(188, s.h - 92);
  const jc = s.temp(tf(v.Tm));
  s.R(X - 16, Y + 10, 16, H - 6, { stroke: jc, lw: 1.5, fill: s.temp(tf(v.Tm), 0.26) });
  s.R(X + W, Y + 10, 16, H - 6, { stroke: jc, lw: 1.5, fill: s.temp(tf(v.Tm), 0.26) });
  const pth = s.vessel(X, Y, W, H, { stroke: C.ink, lw: 1.8 });
  s.liquid(pth, X, Y, W, H, 0.74, s.temp(tf(v.Tt), 0.3));
  s.impeller(X + W / 2, Y - 26, Y + H * 0.66, W * 0.42, { col: C.acc });
  s.plate('batch ' + self.f(v.M, 0) + ' kg', X + W / 2, Y + H * 0.42, { align: 'center', size: 11, col: C.ink });
  s.plate(self.f(self.cvt(v.T0, 'T')[0], 0) + ' \u2192 ' + self.f(self.cvt(v.Tt, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X + W / 2, Y + H * 0.42 + 18, { align: 'center', size: 11.5, col: s.temp(tf(v.Tt)) });
  s.L([[X - 74, Y + 22], [X - 16, Y + 22]], { col: jc, lw: 2.6, arrow: true });
  s.T((heat ? 'steam ' : 'water ') + self.f(self.cvt(v.Tm, 'T')[0], 0) + ' ' + self.cvt(0, 'T')[1], X - 74, Y + 10, { size: 10.5, col: jc });
  s.L([[X + W + 16, Y + H - 2], [X + W + 74, Y + H - 2]], { col: s.temp(tf((v.Tm + v.Tt) / 2)), lw: 2.6, arrow: true });
  s.T(heat ? 'condensate' : 'return', X + W + 74, Y + H - 14, { size: 10.5, col: C.mut, align: 'right' });
  s.T('jacket', X - 8, Y + H + 16, { align: 'center', size: 10, col: C.mut, caps: true });
  const px = s.x + s.w - 148;
  s.badge(px, s.y + 6, 'Batch time', self.f(tN, 1) + ' min', null, { w: 148 });
  s.badge(px, s.y + 50, 'Average duty', self.f(Qa, 0) + ' kW', heat ? 0.5 + 0.44 * self.cl01(Qa / 400) : 0.5 - 0.44 * self.cl01(Qa / 400), { w: 148 });
  s.badge(px, s.y + 94, 'Driving force', self.f(self.cvt(Math.abs(v.Tm - v.T0), 'dT')[0], 0) + ' ' + self.cvt(0, 'dT')[1] + ' at start', null, { w: 148 });
},
        schemNote: 'Jacket colour follows the medium temperature and the batch colour follows the target \u2014 switch to cooling and both swing blue. Agitator, nozzles and duty badges update with every input.',
        num: 'H-05', sec: HT, name: 'Batch vessel heating & cooling time',
        blurb: 'How long a jacketed batch takes to reach temperature. With steam the medium stays at one temperature and the answer is a clean exponential; with cooling water the medium heats up as it passes through the jacket, and the same UA buys you noticeably less.',
        howto: 'Both curves start at the initial batch temperature and asymptote to the medium temperature \u2014 the target line shows where each one crosses. The gap between them is the penalty for a non-isothermal medium: raise the coolant flow and the two converge, because a fast-moving coolant barely heats up.',
        std: 'Unsteady-state batch heat transfer \u2014 Kern, Process Heat Transfer Ch. 18; Perry\u2019s 8th ed. \u00a711',
        eqs: [['t = \\frac{Mc_p}{UA}\\ln\\frac{T_1 - T_0}{T_1 - T}', 'isothermal medium — condensing steam'], ['t = \\frac{Mc_p}{Wc}\\cdot\\frac{K_1}{K_1-1}\\ln\\frac{T_0 - t_1}{T - t_1},\\quad K_1 = e^{\\frac{UA}{Wc}}', 'non-isothermal medium — single-pass coil or jacket'], ['UA = \\frac{1}{\\frac{1}{h_i} + \\frac{x}{\\lambda} + \\frac{1}{h_o}}A', 'the coefficient that sets the whole timescale']],
        notes: ['Perfectly mixed batch, constant UA and specific heats.', 'No heat of reaction, evaporation or ambient loss.', 'Coil fouling and jacket baffling both act through UA \u2014 halve it and the time doubles.'],
        params: [{ k: 'mode', label: 'Duty', type: 'select', val: 'heat', options: [['heat', 'Heating \u2014 steam jacket'], ['cool', 'Cooling \u2014 water jacket']] }, P('M', 'Batch mass', 100, 60000, 100, 8000, null, 'kg'), P('cp', 'Batch specific heat', 1, 5, 0.05, 3.2, null, 'kJ/kg\u00b7K'), P('T0', 'Initial batch temperature', -10, 200, 1, 20, 'T'), P('Tt', 'Target batch temperature', -10, 250, 1, 85, 'T'), P('Tm', 'Medium inlet temperature', -20, 250, 1, 150, 'T'), P('UA', 'UA', 0.5, 200, 0.5, 12, null, 'kW/K'), P('W', 'Medium flow', 100, 200000, 100, 20000, null, 'kg/h'), P('cm', 'Medium specific heat', 1, 5, 0.05, 4.18, null, 'kJ/kg\u00b7K')],
        compute: v => {
          const Mcp = v.M * v.cp, Wc = (v.W / 3600) * v.cm;
          const K1 = Math.exp(v.UA / Wc);
          const Tiso = t => v.Tm - (v.Tm - v.T0) * Math.exp(-v.UA * t * 60 / Mcp);
          const kf = (K1 - 1) / K1;
          const Tni = t => v.Tm - (v.Tm - v.T0) * Math.exp(-Wc * kf * t * 60 / Mcp);
          const tof = (Tfun, Tt) => { const lo = 0, hi = 1e5; let a = lo, bb = hi; const s = Math.sign(v.Tm - v.T0); if (s * (Tt - v.T0) <= 0 || s * (Tt - v.Tm) >= 0) return NaN; for (let i = 0; i < 90; i++) { const mid = (a + bb) / 2; if (s * (Tfun(mid) - Tt) < 0) a = mid; else bb = mid; } return a; };
          const tI = tof(Tiso, v.Tt), tN = tof(Tni, v.Tt);
          const dtLM = Math.abs(v.Tm - v.T0) > Math.abs(v.Tm - v.Tt) ? ((v.Tm - v.T0) - (v.Tm - v.Tt)) / Math.log((v.Tm - v.T0) / (v.Tm - v.Tt)) : NaN;
          const Qavg = Mcp * Math.abs(v.Tt - v.T0) / Math.max(tI * 60, 1e-6);
          return {
            Tiso: Tiso, Tni: Tni, tI: tI, tN: tN, K1: K1,
            res: [{ l: 'Time \u2014 isothermal medium', v: tI, u: 'min', d: 1 }, { l: 'Time \u2014 non-isothermal medium', v: tN, u: 'min', d: 1 }, { l: 'Penalty for medium heat-up', v: (tN / tI - 1) * 100, u: '%', d: 1 }, { l: 'Batch thermal mass Mc_p', v: Mcp, u: 'kJ/K', d: 0 }, { l: 'Medium capacity rate Wc', v: Wc, u: 'kW/K', d: 2 }, { l: 'K\u2081 = exp(UA/Wc)', v: K1, u: '\u2014', d: 3 }, { l: 'Medium outlet at start', v: v.Tm - (v.Tm - v.T0) * kf, u: '', cv: 'T', d: 1 }, { l: 'Mean driving force', v: dtLM, u: '', cv: 'dT', d: 1 }, { l: 'Average duty', v: Qavg, u: 'kW', d: 1 }, { l: 'Peak duty at start', v: v.UA * Math.abs(v.Tm - v.T0), u: 'kW', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const tmax = Math.max(isFinite(r.tN) ? r.tN : 0, isFinite(r.tI) ? r.tI : 0) * 1.7 || 60;
          const lo = Math.min(v.T0, v.Tt, v.Tm), hi = Math.max(v.T0, v.Tt, v.Tm);
          const pad = (hi - lo) * 0.1 + 1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: tmax, ymin: lo - pad, ymax: hi + pad });
          g.grid('Time  (min)', 'Batch temperature  (' + self.cvt(0, 'T')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'T')[0], 0));
          g.title('Approach to temperature');
          g.line([[0, v.Tm], [tmax, v.Tm]], C.mut, 1.3, [4, 4]);
          g.txt('medium ' + self.f(self.cvt(v.Tm, 'T')[0], 0) + '\u00b0', tmax * 0.99, v.Tm + pad * 0.12, C.mut, 'right', 10.5, 'bottom');
          g.line([[0, v.Tt], [tmax, v.Tt]], C.soft3, 1.4, [6, 4]);
          g.txt('target', tmax * 0.99, v.Tt + pad * 0.12, C.mid, 'right', 10.5, 'bottom');
          g.fn(t => r.Tiso(t), C.dk, 2.8);
          g.fn(t => r.Tni(t), C.acc, 2.4, [7, 4]);
          if (isFinite(r.tI)) { g.line([[r.tI, lo - pad], [r.tI, v.Tt]], C.dk, 1.1, [3, 3]); g.dot(r.tI, v.Tt, C.dk, 5); g.txt(self.f(r.tI, 0) + ' min', r.tI, v.Tt - pad * 0.5, C.dk, 'center', 11.5); }
          if (isFinite(r.tN)) { g.line([[r.tN, lo - pad], [r.tN, v.Tt]], C.acc, 1.1, [3, 3]); g.dot(r.tN, v.Tt, C.acc, 5); g.txt(self.f(r.tN, 0) + ' min', r.tN, v.Tt + pad * 0.28, C.acc, 'center', 11.5); }
          g.legend([{ c: C.dk, l: 'isothermal medium' }, { c: C.acc, l: 'non-isothermal medium', d: [7, 4] }]);
        }
      }
    ];
  }
