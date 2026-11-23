  dMphase() {
    const self = this, C = this.C;
    const S = 'Multiphase Reaction Engineering';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const Rg = 8.314;

    /* van Krevelen–Hoftijzer enhancement factor */
    const enhance = (Ha, Ei) => {
      if (!isFinite(Ei) || Ei <= 1.0001) return 1;
      const f = E => {
        const arg = Ha * Math.sqrt(Math.max((Ei - E) / (Ei - 1), 0));
        return (arg < 1e-6 ? 1 : arg / Math.tanh(arg)) - E;
      };
      if (f(1.0000001) < 0) return 1;
      return self.bis(f, 1.0000001, Ei - 1e-9, 1e-10);
    };
    const regime = Ha => Ha < 0.02 ? 'very slow \u2014 bulk-liquid reaction' : Ha < 0.3 ? 'slow \u2014 reaction in the bulk, transport-limited supply' : Ha < 3 ? 'intermediate \u2014 reaction in film and bulk' : 'fast \u2014 reaction completed inside the film';

    return [
      {
        id: 'hatta', num: 'X-01', sec: S, name: 'Hatta number & the enhancement factor',
        blurb: 'A gas absorbing into a liquid where it reacts does not obey the physical mass-transfer coefficient. The Hatta number compares how fast the reaction consumes the dissolved gas with how fast diffusion can carry it across the film; when reaction wins, the concentration gradient steepens and absorption is enhanced, sometimes by two orders of magnitude.',
        howto: 'The family of curves is the classic van Krevelen\u2013Hoftijzer chart. Below Ha \u2248 0.3 you are on the E = 1 floor and the reactor is a contactor with a stirred tank bolted on \u2014 hold-up matters, area does not. Above Ha \u2248 3 you are on the E = Ha diagonal, all the reaction happens in a film microns thick, and interfacial area is everything. The ceiling on each curve is the instantaneous limit, set by how fast the liquid reactant can diffuse to meet the gas.',
        std: 'Hatta (1932); van Krevelen & Hoftijzer, Rec. Trav. Chim. 67 (1948) 563; Danckwerts, Gas\u2013Liquid Reactions (1970); Levenspiel, Ch. 23',
        eqs: [['Ha = \\frac{\\sqrt{k_2C_{B,L}D_A}}{k_L}', 'reaction rate against diffusion rate in the film'], ['E = \\frac{Ha}{\\tanh Ha}', 'pseudo-first-order enhancement (excess B)'], ['E_i = 1 + \\frac{D_BC_{B,L}}{bD_AC_{A,i}}', 'instantaneous limit \u2014 set by supply of B'], ['\\frac{Ha\\sqrt{(E_i-E)/(E_i-1)}}{\\tanh\\!\\left[Ha\\sqrt{(E_i-E)/(E_i-1)}\\right]} = E', 'van Krevelen\u2013Hoftijzer implicit solution']],
        notes: ['Second-order irreversible reaction A(g) + bB(l) \u2192 products, film theory.', 'Interfacial gas concentration from Henry\u2019s law at the stated partial pressure.', 'Liquid-side control assumed \u2014 gas-film resistance neglected.', 'E is bounded above by E_i and below by 1.'],
        params: [P('k2', 'Second-order rate constant k\u2082', 0.01, 1e6, 0.01, 500, null, 'm\u00b3/kmol\u00b7s'), P('CB', 'Bulk liquid reactant C_B', 0.01, 10, 0.01, 1, null, 'kmol/m\u00b3'), P('DA', 'Diffusivity of A \u00d710\u207b\u2079', 0.2, 10, 0.05, 2, null, 'm\u00b2/s'), P('DB', 'Diffusivity of B \u00d710\u207b\u2079', 0.2, 10, 0.05, 1.5, null, 'm\u00b2/s'), P('kL', 'Physical k_L \u00d710\u207b\u2074', 0.1, 20, 0.05, 1, null, 'm/s'), P('a', 'Interfacial area a', 10, 3000, 10, 200, null, 'm\u00b2/m\u00b3'), P('pA', 'Partial pressure of A', 1, 3000, 1, 101, 'P'), P('He', 'Henry constant H', 1, 20000, 1, 2000, null, 'kPa\u00b7m\u00b3/kmol'), P('bst', 'Stoichiometric coefficient b', 0.5, 4, 0.5, 1, null, '\u2014'), P('eL', 'Liquid hold-up \u03b5_L', 0.05, 0.98, 0.01, 0.8, null, '\u2014')],
        compute: v => {
          const DA = v.DA * 1e-9, DB = v.DB * 1e-9, kL = v.kL * 1e-4;
          const CAi = v.pA / v.He;
          const Ha = Math.sqrt(v.k2 * v.CB * DA) / kL;
          const Ei = 1 + (DB * v.CB) / (v.bst * DA * CAi);
          const E = enhance(Ha, Ei);
          const Epfo = Ha < 1e-6 ? 1 : Ha / Math.tanh(Ha);
          const NA = E * kL * v.a * CAi;
          const NAphys = kL * v.a * CAi;
          const rBulk = v.k2 * CAi * v.CB * v.eL;
          const filmFrac = NA / Math.max(NA + rBulk, 1e-30);
          const dFilm = DA / kL;
          const rxnDepth = dFilm / Math.max(Ha, 1e-9);
          const ctrl = Ha > 3 && E > 0.8 * Ei ? 'instantaneous \u2014 B supply limits, area and B concentration control' : Ha > 3 ? 'fast reaction in the film \u2014 maximise interfacial area' : Ha < 0.3 ? 'slow \u2014 maximise liquid hold-up, not area' : 'intermediate \u2014 both area and hold-up matter';
          return {
            Ha: Ha, Ei: Ei, E: E,
            res: [{ l: 'Interfacial concentration C_A,i', v: CAi, u: 'kmol/m\u00b3', d: 5 }, { l: 'Hatta number Ha', v: Ha, u: '\u2014', d: 4 }, { l: 'Instantaneous limit E_i', v: Ei, u: '\u2014', d: 3 }, { l: 'Enhancement factor E', v: E, u: '\u2014', d: 4 }, { l: 'Pseudo-first-order E', v: Epfo, u: '\u2014', d: 4 }, { l: 'Depletion of B in the film', s: E < 0.9 * Epfo ? 'significant \u2014 E is below the pseudo-first-order value' : 'negligible', u: '' }, { l: 'Film thickness \u03b4 = D_A/k_L', v: dFilm * 1e6, u: '\u00b5m', d: 3 }, { l: 'Reaction penetration depth', v: rxnDepth * 1e6, u: '\u00b5m', d: 4 }, { l: 'Absorption rate with reaction', v: NA, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Physical absorption rate', v: NAphys, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Rate multiplied by', v: NA / NAphys, u: '\u00d7', d: 3 }, { l: 'Regime', s: regime(Ha), u: '' }, { l: 'Design lever', s: ctrl, u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.01, xmax: 300, ymin: 0.8, ymax: 400, xlog: true, ylog: true, ml: 62 });
          g.grid('Hatta number  Ha', 'Enhancement factor  E');
          g.title('van Krevelen\u2013Hoftijzer enhancement chart');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(0.3) - g.x, g.h); ctx.fillStyle = C.soft2; ctx.fillRect(g.X(3), g.y, g.x + g.w - g.X(3), g.h); ctx.restore(); });
          g.line([[0.01, 1], [300, 1]], 'rgba(29,31,32,0.25)', 1.2);
          g.fn(h => Math.min(h, 400), C.lt, 1.4, [6, 4]);
          [2, 5, 10, 30, 100, 300].forEach(ei => { g.fn(h => Math.min(enhance(h, ei), 400), 'rgba(29,31,32,0.16)', 1.4); });
          g.fn(h => Math.min(enhance(h, r.Ei), 400), C.acc, 2.8);
          g.dot(Math.min(Math.max(r.Ha, 0.01), 300), Math.min(Math.max(r.E, 0.8), 400), C.warn, 5.5);
          g.cross(Math.min(Math.max(r.Ha, 0.01), 300), Math.min(Math.max(r.E, 0.8), 400), C.warn, 9);
          if (g.w > 300) {
            g.txt('slow', 0.014, 250, C.mid, 'left', 11.5);
            g.txt('fast', 200, 1.1, C.mid, 'right', 11.5);
            g.txt('E = Ha', 40, 60, C.mid, 'left', 11.5);
            g.txt('E_i = ' + r.Ei.toPrecision(3), 0.014, Math.min(r.Ei * 1.25, 320), C.acc, 'left', 11.5);
          }
          g.legend([{ c: C.acc, l: 'your E_i' }, { c: 'rgba(29,31,32,0.16)', l: 'E_i = 2, 5, 10, 30, 100, 300' }, { c: C.lt, l: 'E = Ha', d: [6, 4] }]);
        }
      },
      {
        id: 'filmreg', num: 'X-02', sec: S, name: 'Gas\u2013liquid regimes & film concentration profiles',
        blurb: 'Everything the Hatta number tells you in one number, drawn as the concentration profile it implies. In the slow regime A crosses the film untouched and reacts in the bulk; in the fast regime it never reaches the bulk at all; in the instantaneous regime A and B annihilate each other on a plane inside the film whose position is set by their relative diffusion fluxes.',
        howto: 'Move the rate constant across four decades and watch the reaction plane emerge, march to the interface, and finally leave the liquid film entirely as gas-side resistance takes over. The bulk concentration of A \u2014 the value at the right edge \u2014 is the single most useful diagnostic: if it is near saturation your reactor is kinetics-limited, and if it is zero you are buying interfacial area.',
        std: 'Danckwerts, Gas\u2013Liquid Reactions, Ch. 3; Doraiswamy & Sharma, Heterogeneous Reactions Vol. 2; Westerterp, van Swaaij & Beenackers, Ch. 6',
        eqs: [['D_A\\frac{d^2C_A}{dz^2} = k_2C_AC_B', 'the film equation \u2014 diffusion against reaction'], ['C_A(z) = C_{A,i}\\frac{\\sinh\\!\\left[Ha(1-z/\\delta)\\right] + (C_{A,L}/C_{A,i})\\sinh(Ha\\,z/\\delta)}{\\sinh Ha}', 'pseudo-first-order profile'], ['\\frac{z^*}{\\delta} = \\frac{1}{1+D_BC_{B,L}/(bD_AC_{A,i})}', 'reaction plane position, instantaneous regime'], ['C_{A,L} = \\frac{C_{A,i}}{\\cosh Ha}\\ \\text{(no bulk reaction)}', 'how much A survives the film']],
        notes: ['Film theory with a stagnant layer of thickness \u03b4 = D_A/k_L.', 'Pseudo-first-order profile used when B depletion is small; a reaction plane is drawn when E approaches E_i.', 'Distance normalised by film thickness; the bulk liquid lies to the right of z/\u03b4 = 1.'],
        params: [P('k2', 'Rate constant k\u2082', 0.001, 1e6, 0.001, 100, null, 'm\u00b3/kmol\u00b7s'), P('CB', 'Bulk C_B', 0.01, 10, 0.01, 2, null, 'kmol/m\u00b3'), P('DA', 'Diffusivity D_A \u00d710\u207b\u2079', 0.2, 10, 0.05, 2, null, 'm\u00b2/s'), P('DB', 'Diffusivity D_B \u00d710\u207b\u2079', 0.2, 10, 0.05, 1.5, null, 'm\u00b2/s'), P('kL', 'Liquid k_L \u00d710\u207b\u2074', 0.1, 20, 0.05, 1, null, 'm/s'), P('kg', 'Gas k_G a', 0.001, 10, 0.001, 1, null, 'kmol/m\u00b3\u00b7s\u00b7kPa'), P('pA', 'Partial pressure of A', 1, 3000, 1, 101, 'P'), P('He', 'Henry constant H', 1, 20000, 1, 2000, null, 'kPa\u00b7m\u00b3/kmol'), P('bst', 'Stoichiometry b', 0.5, 4, 0.5, 1, null, '\u2014')],
        compute: v => {
          const DA = v.DA * 1e-9, DB = v.DB * 1e-9, kL = v.kL * 1e-4;
          const CAi = v.pA / v.He;
          const Ha = Math.sqrt(v.k2 * v.CB * DA) / kL;
          const Ei = 1 + (DB * v.CB) / (v.bst * DA * CAi);
          const E = enhance(Ha, Ei);
          const inst = E > 0.92 * Ei && Ha > 3;
          const zstar = 1 / (1 + DB * v.CB / (v.bst * DA * CAi));
          const CAL = Ha < 1e-6 ? CAi : CAi / Math.cosh(Ha);
          const profA = zz => {
            if (inst) return zz >= zstar ? 0 : CAi * (1 - zz / zstar);
            if (Ha < 1e-4) return CAi * (1 - zz) + CAL * zz;
            return CAi * (Math.sinh(Ha * (1 - zz)) + (CAL / CAi) * Math.sinh(Ha * zz)) / Math.sinh(Ha);
          };
          const profB = zz => {
            if (inst) return zz <= zstar ? 0 : v.CB * (zz - zstar) / (1 - zstar);
            const drop = Math.min(0.9, (E - 1) / Math.max(Ei - 1, 1e-9));
            return v.CB * (1 - drop * (1 - zz));
          };
          const kgRes = 1 / (v.kg * v.He) , klRes = 1 / (E * kL * 200);
          const gasFrac = kgRes / (kgRes + klRes) * 100;
          return {
            profA: profA, profB: profB, CAi: CAi, Ha: Ha, E: E, Ei: Ei, inst: inst, zstar: zstar, CAL: CAL,
            res: [{ l: 'Interfacial C_A,i', v: CAi, u: 'kmol/m\u00b3', d: 5 }, { l: 'Hatta number Ha', v: Ha, u: '\u2014', d: 4 }, { l: 'Enhancement E', v: E, u: '\u2014', d: 4 }, { l: 'Instantaneous limit E_i', v: Ei, u: '\u2014', d: 3 }, { l: 'E / E_i', v: E / Ei, u: '\u2014', d: 4 }, { l: 'Reaction plane at z/\u03b4', s: inst ? zstar.toFixed(4) : 'no discrete plane', u: '' }, { l: 'Bulk liquid C_A,L', v: inst ? 0 : CAL, u: 'kmol/m\u00b3', d: 6 }, { l: 'C_A,L / C_A,i', v: inst ? 0 : CAL / CAi, u: '\u2014', d: 5 }, { l: 'Film thickness \u03b4', v: DA / kL * 1e6, u: '\u00b5m', d: 3 }, { l: 'Regime', s: inst ? 'instantaneous \u2014 reaction plane inside the film' : regime(Ha), u: '' }, { l: 'Gas-film share of resistance', v: gasFrac, u: '%', d: 1 }, { l: 'Controlling resistance', s: gasFrac > 60 ? 'gas film \u2014 raise gas velocity or pressure' : gasFrac > 25 ? 'both films matter' : 'liquid film \u2014 raise area or reactant concentration', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const cmax = Math.max(r.CAi, v.CB) * 1.15;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1.35, ymin: 0, ymax: cmax, ml: 66 });
          g.grid('Distance into the liquid film  z / \u03b4', 'Concentration  kmol/m\u00b3', 5, 5);
          g.title('Film concentration profiles \u2014 ' + (r.inst ? 'instantaneous' : regime(r.Ha).split(' \u2014 ')[0]));
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.X(1), g.y, g.x + g.w - g.X(1), g.h); ctx.restore(); });
          g.line([[1, 0], [1, cmax]], 'rgba(29,31,32,0.3)', 1.3);
          g.line([[0, 0], [0, cmax]], 'rgba(29,31,32,0.3)', 1.6);
          const pa = [], pb = [];
          for (let i = 0; i <= 200; i++) { const z = i / 200; pa.push([z, Math.max(r.profA(z), 0)]); pb.push([z, Math.max(r.profB(z), 0)]); }
          pa.push([1.35, Math.max(r.inst ? 0 : r.CAL, 0)]);
          pb.push([1.35, v.CB]);
          g.line(pb, C.dk, 2.6, [7, 4]);
          g.line(pa, C.acc, 2.8);
          if (r.inst) { g.line([[r.zstar, 0], [r.zstar, cmax]], C.warn, 1.6, [4, 4]); if (g.w > 300) g.txt('reaction plane', r.zstar, cmax * 0.9, C.warn, 'center', 11.5); }
          if (g.w > 300) { g.txt('interface', 0.02, cmax * 0.05, C.mut, 'left', 11); g.txt('bulk liquid', 1.33, cmax * 0.05, C.mut, 'right', 11); }
          g.legend([{ c: C.acc, l: 'C_A \u2014 dissolved gas' }, { c: C.dk, l: 'C_B \u2014 liquid reactant', d: [7, 4] }]);
        }
      },
      {
        id: 'damk', num: 'X-03', sec: S, name: 'Damk\u00f6hler analysis \u2014 reaction against transport',
        blurb: 'Four dimensionless groups carry the same name and answer four different questions: how fast is reaction against convection, against external diffusion, against internal diffusion, and against heat removal. Getting a reactor wrong almost always means having mis-identified which of the four is the large one.',
        howto: 'Da\u2081 is the conversion group \u2014 read it directly off the plot. Da\u2082 is the film group; above about 1 the external surface concentration is far below the bulk, the observed order drifts to one and the observed activation energy collapses to the diffusion value. Da\u2083 is the Thiele modulus squared and governs the pellet interior. Da\u2074 is thermal: above about 1 the pellet or the reactor cannot shed heat fast enough and runaway is possible.',
        std: 'Damk\u00f6hler (1936); Levenspiel, Chemical Reaction Engineering, Ch. 18; Fogler, Elements of Chemical Reaction Engineering, 5th ed., Ch. 14\u201315',
        eqs: [['Da_I = k C_0^{n-1}\\tau', 'reaction rate against bulk convection \u2014 sets conversion'], ['Da_{II} = \\frac{kC_0^{n-1}}{k_ca_v}', 'reaction against external mass transfer'], ['Da_{III} = \\phi^2 = \\frac{kC_0^{n-1}L^2}{D_e}', 'reaction against internal diffusion \u2014 the Thiele modulus squared'], ['Da_{IV} = \\frac{(-\\Delta H_r)kC_0^nL}{hT_0}', 'heat generation against heat removal']],
        notes: ['First- or second-order irreversible reaction, isothermal unless the thermal group says otherwise.', 'External surface concentration solved from the film balance, so the observed rate includes both resistances.', 'Effectiveness factor for a slab, \u03b7 = tanh\u03c6/\u03c6, extended to the sphere where selected.', 'Observed activation energy estimated by differencing the overall rate at \u00b110 K.'],
        params: [P('k', 'Rate constant k', 1e-4, 1e4, 1e-4, 1, null, 's\u207b\u00b9 or m\u00b3/kmol\u00b7s'), SEL('ord', 'Reaction order', '1', [['1', 'First order'], ['2', 'Second order']]), SEL('geo', 'Pellet geometry', 'sph', [['slab', 'Slab'], ['sph', 'Sphere']]), P('C0', 'Bulk concentration C\u2080', 0.001, 20, 0.001, 1, null, 'kmol/m\u00b3'), P('tau', 'Residence time \u03c4', 0.1, 3600, 0.1, 60, null, 's'), P('kc', 'Film coefficient k_c \u00d710\u207b\u00b3', 0.01, 100, 0.01, 5, null, 'm/s'), P('av', 'External area a_v', 10, 5000, 10, 600, null, 'm\u00b2/m\u00b3'), P('L', 'Characteristic length L', 0.05, 20, 0.01, 1, null, 'mm'), P('De', 'Effective diffusivity \u00d710\u207b\u2077', 0.05, 100, 0.05, 3, null, 'm\u00b2/s'), P('dH', 'Heat of reaction \u2212\u0394H_r', 0, 500, 1, 120, null, 'kJ/mol'), P('hf', 'Heat transfer coefficient h', 5, 2000, 5, 200, null, 'W/m\u00b2K'), P('T', 'Temperature', 20, 700, 5, 250, 'T'), P('Ea', 'Activation energy E_a', 20, 300, 1, 100, null, 'kJ/mol')],
        compute: v => {
          const n = v.ord === '2' ? 2 : 1, L = v.L / 1000, De = v.De * 1e-7, kc = v.kc * 1e-3, TK = v.T + 273.15;
          const kap = v.k * Math.pow(v.C0, n - 1);
          const Da1 = kap * v.tau;
          const Da2 = kap / (kc * v.av);
          const phi = L * Math.sqrt(kap / De);
          const Da3 = phi * phi;
          const eta = v.geo === 'sph' ? (phi < 0.01 ? 1 - phi * phi / 15 : (3 / (phi * phi)) * (3 * phi / Math.tanh(3 * phi) - 1)) : (phi < 1e-4 ? 1 : Math.tanh(phi) / phi);
          /* external: solve kc av (C0 - Cs) = eta k Cs^n */
          const Cs = self.bis(c => kc * v.av * (v.C0 - c) - eta * v.k * Math.pow(Math.max(c, 0), n), 1e-12, v.C0, 1e-14);
          const CsC0 = Cs / v.C0;
          const rObs = eta * v.k * Math.pow(Cs, n);
          const rInt = v.k * Math.pow(v.C0, n);
          const etaOv = rObs / rInt;
          const Da4 = v.dH * 1000 * rObs * L / Math.max(v.hf * TK, 1e-9);
          const dT = v.dH * 1000 * De * v.C0 / 0.2;
          const rateAt = T2 => {
            const kk = v.k * Math.exp(-v.Ea * 1000 / Rg * (1 / (T2 + 273.15) - 1 / TK));
            const ka = kk * Math.pow(v.C0, n - 1);
            const ph = L * Math.sqrt(ka / De);
            const et = v.geo === 'sph' ? (ph < 0.01 ? 1 : (3 / (ph * ph)) * (3 * ph / Math.tanh(3 * ph) - 1)) : (ph < 1e-4 ? 1 : Math.tanh(ph) / ph);
            const cs = self.bis(c => kc * v.av * (v.C0 - c) - et * kk * Math.pow(Math.max(c, 0), n), 1e-12, v.C0, 1e-14);
            return et * kk * Math.pow(cs, n);
          };
          const EaObs = Rg * Math.log(rateAt(v.T + 15) / rateAt(v.T - 15)) / (1 / (TK - 15) - 1 / (TK + 15)) / 1000;
          const X = n === 1 ? 1 - Math.exp(-etaOv * Da1) : (etaOv * Da1) / (1 + etaOv * Da1);
          const ctrl = Da2 > 1 ? 'external mass transfer' : Da3 > 4 ? 'internal (pore) diffusion' : Da3 > 0.4 ? 'mixed kinetics and pore diffusion' : 'intrinsic kinetics';
          return {
            Da1: Da1, Da2: Da2, Da3: Da3, eta: eta, etaOv: etaOv, n: n,
            res: [{ l: 'Da\u2081 \u2014 reaction / convection', v: Da1, u: '\u2014', d: 4 }, { l: 'Da\u2082 \u2014 reaction / film transport', v: Da2, u: '\u2014', d: 4 }, { l: 'Thiele modulus \u03c6', v: phi, u: '\u2014', d: 4 }, { l: 'Da\u2083 = \u03c6\u00b2 \u2014 reaction / pore diffusion', v: Da3, u: '\u2014', d: 4 }, { l: 'Da\u2084 \u2014 heat generation / removal', v: Da4, u: '\u2014', d: 4 }, { l: 'Internal effectiveness \u03b7', v: eta, u: '\u2014', d: 4 }, { l: 'Surface / bulk C_s/C\u2080', v: CsC0, u: '\u2014', d: 4 }, { l: 'Overall effectiveness \u03a9', v: etaOv, u: '\u2014', d: 4 }, { l: 'Observed rate', v: rObs, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Intrinsic rate at C\u2080', v: rInt, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Conversion at \u03c4', v: X * 100, u: '%', d: 2 }, { l: 'Prater \u0394T_max', v: dT, u: 'K', d: 2 }, { l: 'Observed E_a', v: EaObs, u: 'kJ/mol', d: 1 }, { l: 'E_a,obs / E_a,true', v: EaObs / v.Ea, u: '\u2014', d: 3 }, { l: 'Controlling resistance', s: ctrl, u: '' }, { l: 'Thermal stability', s: Da4 > 1 ? 'runaway possible \u2014 improve heat removal' : Da4 > 0.3 ? 'marginal \u2014 check hot-spot temperature' : 'stable', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.01, xmax: 100, ymin: 0.005, ymax: 1.3, xlog: true, ylog: true, ml: 62 });
          g.grid('Damk\u00f6hler number  Da', 'Effectiveness  \u03a9   /   Conversion  X');
          g.title('Transport regimes \u2014 operating point against the asymptotes');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(0.4) - g.x, g.h); ctx.fillStyle = C.soft2; ctx.fillRect(g.X(4), g.y, g.x + g.w - g.X(4), g.h); ctx.restore(); });
          g.fn(d => { const ph = Math.sqrt(d); return Math.min(v.geo === 'sph' ? (ph < 0.01 ? 1 : (3 / (ph * ph)) * (3 * ph / Math.tanh(3 * ph) - 1)) : Math.tanh(ph) / ph, 1.3); }, C.dk, 2.6);
          g.fn(d => Math.min(1 / (1 + d), 1.3), C.mid, 2, [7, 4]);
          g.fn(d => Math.min(r.n === 1 ? 1 - Math.exp(-d) : d / (1 + d), 1.3), C.lt, 2, [3, 3]);
          g.dot(Math.min(Math.max(r.Da3, 0.01), 100), Math.min(Math.max(r.eta, 0.005), 1.3), C.dk, 5);
          g.dot(Math.min(Math.max(r.Da2, 0.01), 100), Math.min(Math.max(1 / (1 + r.Da2), 0.005), 1.3), C.mid, 5);
          g.cross(Math.min(Math.max(r.Da1, 0.01), 100), Math.min(Math.max(r.n === 1 ? 1 - Math.exp(-r.etaOv * r.Da1) : r.etaOv * r.Da1 / (1 + r.etaOv * r.Da1), 0.005), 1.3), C.warn, 9);
          if (g.w > 300) { g.txt('kinetic control', 0.013, 0.008, C.mid, 'left', 11.5); g.txt('transport control', 80, 0.008, C.mid, 'right', 11.5); }
          g.legend([{ c: C.dk, l: '\u03b7 vs Da\u2083' }, { c: C.mid, l: 'C_s/C\u2080 vs Da\u2082', d: [7, 4] }, { c: C.lt, l: 'X vs Da\u2081', d: [3, 3] }]);
        }
      },
      {
        id: 'slurry', num: 'X-04', sec: S, name: 'Slurry reactor \u2014 resistances in series',
        blurb: 'A gas dissolving into a liquid, crossing to a suspended catalyst particle, diffusing into its pores and reacting: four resistances in series, and the plant only ever measures their sum. The Satterfield plot separates them, and it does so with an experiment any laboratory can run \u2014 vary the catalyst loading and plot the reciprocal rate.',
        howto: 'Read the intercept and the slope. The intercept is everything that does not scale with catalyst \u2014 the gas film and the bubble-to-liquid step \u2014 and no amount of extra catalyst will remove it. The slope carries the particle resistances. If the intercept dominates, buy a better sparger; if the slope dominates, buy smaller particles or more of them. The bar breakdown below shows the same information as percentages at your current loading.',
        std: 'Satterfield, Mass Transfer in Heterogeneous Catalysis (1970); Ramachandran & Chaudhari, Three-Phase Catalytic Reactors; Levenspiel, Ch. 24',
        eqs: [['\\frac{1}{r_{obs}} = \\frac{1}{k_ga_b} + \\frac{H}{k_La_b} + \\frac{H}{k_ca_p} + \\frac{H}{\\eta k_vm}', 'resistances add in series'], ['\\frac{1}{r_{obs}} = \\underbrace{\\left(\\frac{1}{k_ga_b}+\\frac{H}{k_La_b}\\right)}_{\\text{intercept}} + \\underbrace{\\left(\\frac{H}{k_ca_p^{*}}+\\frac{H}{\\eta k_v^{*}}\\right)}_{\\text{slope}}\\frac{1}{m}', 'the Satterfield plot'], ['a_p = \\frac{6m}{\\rho_pd_p}', 'external particle area from the loading'], ['\\eta = \\frac{3}{\\phi^2}\\left(\\frac{\\phi}{\\tanh\\phi}-1\\right)', 'pellet effectiveness']],
        notes: ['First-order in dissolved gas, catalyst fully wetted and uniformly suspended.', 'Gas-side coefficient expressed per unit reactor volume; Henry constant converts to a liquid-phase driving force.', 'The plot sweeps catalyst loading from a tenth to five times the stated value.'],
        params: [P('pA', 'Gas partial pressure', 10, 8000, 10, 1000, 'P'), P('He', 'Henry constant H', 10, 50000, 10, 5000, null, 'kPa\u00b7m\u00b3/kmol'), P('kga', 'Gas film k_G a_b', 0.001, 20, 0.001, 2, null, 'kmol/m\u00b3\u00b7s\u00b7kPa'), P('kla', 'Liquid film k_L a_b', 0.001, 2, 0.001, 0.1, null, 's\u207b\u00b9'), P('kc', 'Particle k_c \u00d710\u207b\u2074', 0.1, 50, 0.1, 5, null, 'm/s'), P('m', 'Catalyst loading', 0.5, 200, 0.5, 20, null, 'kg/m\u00b3'), P('dp', 'Particle diameter', 5, 5000, 5, 60, null, '\u00b5m'), P('rhop', 'Particle density', 500, 4000, 10, 1300, null, 'kg/m\u00b3'), P('kv', 'Intrinsic rate constant k_v', 0.001, 100, 0.001, 2, null, 'm\u00b3/kg\u00b7s'), P('De', 'Effective diffusivity \u00d710\u207b\u2079', 0.05, 50, 0.05, 5, null, 'm\u00b2/s')],
        compute: v => {
          const dp = v.dp * 1e-6, De = v.De * 1e-9, kc = v.kc * 1e-4;
          const CAi = v.pA / v.He;
          const resAt = m => {
            const ap = 6 * m / (v.rhop * dp);
            const phi = (dp / 6) * Math.sqrt(v.kv * v.rhop / De);
            const eta = phi < 0.01 ? 1 : (3 / (phi * phi)) * (phi / Math.tanh(phi) - 1);
            const Rg2 = 1 / (v.kga * v.He), Rl = 1 / v.kla, Rc = 1 / (kc * ap), Rk = 1 / (eta * v.kv * m);
            const Rt = Rg2 + Rl + Rc + Rk;
            return { Rg: Rg2, Rl: Rl, Rc: Rc, Rk: Rk, Rt: Rt, r: CAi / Rt, eta: eta, phi: phi, ap: ap };
          };
          const A = resAt(v.m);
          const curve = [];
          for (let i = 1; i <= 120; i++) { const m = v.m * 0.1 + (v.m * 5 - v.m * 0.1) * i / 120; const q = resAt(m); curve.push([1 / m, 1 / q.r]); }
          const pct = x => x / A.Rt * 100;
          const worst = [['Gas film', A.Rg], ['Bubble\u2013liquid', A.Rl], ['Liquid\u2013particle', A.Rc], ['Pore + kinetics', A.Rk]].sort((p, q) => q[1] - p[1])[0];
          return {
            A: A, curve: curve, CAi: CAi,
            res: [{ l: 'Saturation concentration C*', v: CAi, u: 'kmol/m\u00b3', d: 6 }, { l: 'External particle area a_p', v: A.ap, u: 'm\u00b2/m\u00b3', d: 1 }, { l: 'Thiele modulus \u03c6', v: A.phi, u: '\u2014', d: 4 }, { l: 'Pellet effectiveness \u03b7', v: A.eta, u: '\u2014', d: 4 }, { l: 'Gas-film resistance', v: pct(A.Rg), u: '%', d: 1 }, { l: 'Bubble\u2013liquid resistance', v: pct(A.Rl), u: '%', d: 1 }, { l: 'Liquid\u2013particle resistance', v: pct(A.Rc), u: '%', d: 1 }, { l: 'Pore + kinetic resistance', v: pct(A.Rk), u: '%', d: 1 }, { l: 'Total resistance', v: A.Rt, u: 's', d: 3 }, { l: 'Observed rate', v: A.r, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Rate if transport were free', v: CAi / A.Rk, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Fraction of intrinsic rate realised', v: A.Rk / A.Rt * 100, u: '%', d: 1 }, { l: 'Controlling step', s: worst[0] + ' \u2014 ' + pct(worst[1]).toFixed(0) + ' % of the total', u: '' }, { l: 'Action', s: worst[0] === 'Pore + kinetics' ? 'add catalyst or raise temperature' : worst[0] === 'Liquid\u2013particle' ? 'reduce particle size or raise agitation' : 'improve gas dispersion \u2014 sparger, impeller, pressure', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let ymax = 0, ymin = 1e30; r.curve.forEach(p => { ymax = Math.max(ymax, p[1]); ymin = Math.min(ymin, p[1]); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1 / (v.m * 0.1) * 1.05, ymin: 0, ymax: ymax * 1.1, ml: 70 });
          g.grid('1 / catalyst loading   m\u00b3/kg', '1 / observed rate   m\u00b3\u00b7s/kmol');
          g.title('Satterfield plot \u2014 separating the resistances');
          const inter = (r.A.Rg + r.A.Rl) / r.CAi;
          g.line([[0, inter], [1 / (v.m * 0.1) * 1.05, inter]], C.lt, 1.4, [6, 4]);
          g.fill([[0, 0], [1 / (v.m * 0.1) * 1.05, 0], [1 / (v.m * 0.1) * 1.05, inter], [0, inter]], C.soft);
          g.line(r.curve, C.acc, 2.8);
          g.dot(1 / v.m, 1 / r.A.r, C.warn, 5.5);
          if (g.w > 300) { g.txt('intercept \u2014 gas-side resistance', 0.02 / v.m, inter * 0.45, C.mid, 'left', 11.5); g.txt('slope \u2014 particle resistances', 1 / (v.m * 0.35), (inter + ymax) / 2, C.mid, 'left', 11.5); }
          g.legend([{ c: C.acc, l: '1/r against 1/m' }, { c: C.lt, l: 'gas-side intercept', d: [6, 4] }]);
        }
      },
      {
        id: 'trickle', num: 'X-05', sec: S, name: 'Trickle-bed reactor \u2014 wetting & effectiveness',
        blurb: 'Gas and liquid flowing downward together over a fixed catalyst bed. At industrial liquid rates the catalyst is not fully wetted, and a partially wetted pellet can react faster or slower than a fully wetted one depending on which reactant is limiting \u2014 a genuine trap in hydrotreater scale-up.',
        howto: 'Trace the conversion against liquid velocity. In a gas-limited reaction, dry patches help: gas reaches the catalyst directly and the rate rises as wetting falls, which is why laboratory reactors run wet can under-predict the plant. In a liquid-limited reaction the opposite holds and dry catalyst is dead catalyst. The regime map at the bottom tells you which hydrodynamic regime you are in \u2014 above the transition the bed pulses and the correlations here no longer apply.',
        std: 'Satterfield, AIChE J. 21 (1975) 209; Al-Dahhan & Dudukovic (1995); Ramachandran & Chaudhari, Ch. 6; Gianetto & Specchia (1992)',
        eqs: [['f_w = 1.617\\,Re_L^{0.146}Ga_L^{-0.071}', 'El-Hisnawi wetting efficiency correlation'], ['\\eta_{CE} = f_w\\eta_{wet} + (1-f_w)\\eta_{dry}', 'contacting effectiveness \u2014 the two pellet populations'], ['Ga_L = \\frac{d_p^3\\rho_L^2 g}{\\mu_L^2}', 'Galileo number \u2014 gravity against viscosity'], ['\\frac{\\Delta P}{L} = \\text{Ergun} \\times \\left(\\frac{\\varepsilon}{\\varepsilon-\\beta_L}\\right)^{\\!3}', 'two-phase pressure drop with liquid hold-up']],
        notes: ['El-Hisnawi wetting correlation, valid for the trickle regime only.', 'Gas-limited pellets react at the intrinsic rate on the dry fraction; liquid-limited pellets do not react there at all.', 'Dynamic hold-up from the Specchia\u2013Baldi correlation.', 'Trickle-to-pulse transition from the Charpentier\u2013Favier chart, approximated here.'],
        params: [P('uL', 'Liquid superficial velocity', 0.05, 30, 0.05, 3, null, 'mm/s'), P('uG', 'Gas superficial velocity', 1, 500, 1, 60, null, 'mm/s'), P('dp', 'Particle diameter', 0.5, 10, 0.1, 2, null, 'mm'), P('eb', 'Bed voidage \u03b5', 0.3, 0.55, 0.01, 0.4, null, '\u2014'), P('rhoL', 'Liquid density', 500, 1200, 10, 800, 'rho'), P('muL', 'Liquid viscosity', 0.2, 50, 0.1, 1, null, 'cP'), P('L', 'Bed length', 0.2, 20, 0.1, 5, 'L'), SEL('lim', 'Limiting reactant', 'gas', [['gas', 'Gas-limited (hydrogen)'], ['liq', 'Liquid-limited']]), P('kv', 'Rate constant k_v', 0.001, 20, 0.001, 0.5, null, 's\u207b\u00b9'), P('De', 'Effective diffusivity \u00d710\u207b\u2079', 0.1, 50, 0.1, 5, null, 'm\u00b2/s')],
        compute: v => {
          const uL = v.uL / 1000, uG = v.uG / 1000, dp = v.dp / 1000, mu = v.muL / 1000, De = v.De * 1e-9;
          const ReL = v.rhoL * uL * dp / mu;
          const GaL = Math.pow(dp, 3) * v.rhoL * v.rhoL * 9.81 / (mu * mu);
          let fw = 1.617 * Math.pow(Math.max(ReL, 1e-6), 0.146) * Math.pow(GaL, -0.071);
          fw = Math.min(Math.max(fw, 0.05), 1);
          const betaL = Math.min(0.4 * Math.pow(ReL, 0.55) * Math.pow(GaL, -0.42) * 3, v.eb * 0.85);
          const phi = (dp / 6) * Math.sqrt(v.kv / De);
          const eta = phi < 0.01 ? 1 : (3 / (phi * phi)) * (phi / Math.tanh(phi) - 1);
          const etaDry = v.lim === 'gas' ? Math.min(eta * 1.6, 1) : 0;
          const etaCE = fw * eta + (1 - fw) * etaDry;
          const tau = v.L * v.eb / Math.max(uL, 1e-9);
          const X = 1 - Math.exp(-etaCE * v.kv * tau);
          const Xfull = 1 - Math.exp(-eta * v.kv * tau);
          const ReG = 1.2 * uG * dp / 1.8e-5;
          const pulse = uL * v.rhoL > 12 && uG > 0.15;
          const curve = [];
          for (let i = 1; i <= 120; i++) {
            const u = 0.05e-3 + (30e-3 - 0.05e-3) * i / 120;
            const re = v.rhoL * u * dp / mu;
            let f2 = Math.min(Math.max(1.617 * Math.pow(Math.max(re, 1e-6), 0.146) * Math.pow(GaL, -0.071), 0.05), 1);
            const ec = f2 * eta + (1 - f2) * etaDry;
            const t2 = v.L * v.eb / u;
            curve.push([u * 1000, (1 - Math.exp(-ec * v.kv * t2)) * 100, f2 * 100]);
          }
          const ergun = (150 * mu * uL * Math.pow(1 - v.eb, 2) / (dp * dp * Math.pow(v.eb, 3)) + 1.75 * v.rhoL * uL * uL * (1 - v.eb) / (dp * Math.pow(v.eb, 3))) * v.L;
          const dp2 = ergun * Math.pow(v.eb / Math.max(v.eb - betaL, 1e-3), 3) / 1000;
          return {
            curve: curve, fw: fw, X: X,
            res: [{ l: 'Liquid Reynolds Re_L', v: ReL, u: '\u2014', d: 3 }, { l: 'Galileo number Ga_L', v: GaL, u: '\u2014', d: 0 }, { l: 'Wetting efficiency f_w', v: fw, u: '\u2014', d: 4 }, { l: 'Dynamic liquid hold-up \u03b2_L', v: betaL, u: '\u2014', d: 4 }, { l: 'Liquid residence time \u03c4', v: tau, u: 's', d: 2 }, { l: 'Thiele modulus \u03c6', v: phi, u: '\u2014', d: 4 }, { l: 'Wetted pellet \u03b7', v: eta, u: '\u2014', d: 4 }, { l: 'Dry pellet \u03b7', v: etaDry, u: '\u2014', d: 4 }, { l: 'Contacting effectiveness \u03b7_CE', v: etaCE, u: '\u2014', d: 4 }, { l: 'Conversion (partial wetting)', v: X * 100, u: '%', d: 2 }, { l: 'Conversion if fully wetted', v: Xfull * 100, u: '%', d: 2 }, { l: 'Wetting penalty / bonus', v: (X - Xfull) * 100, u: '% points', d: 2 }, { l: 'Two-phase \u0394P', v: dp2, u: 'kPa', d: 3 }, { l: 'Hydrodynamic regime', s: pulse ? 'pulsing \u2014 outside the trickle correlations' : ReL < 1 ? 'low-interaction trickle \u2014 partial wetting likely severe' : 'trickle flow', u: '' }, { l: 'Scale-up warning', s: fw < 0.7 ? 'incomplete wetting \u2014 laboratory data will mislead' : 'wetting close to complete', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 30, ymin: 0, ymax: 105, ml: 62, mr: 34 });
          g.grid('Liquid superficial velocity  mm/s', 'Conversion  %   /   wetting  %');
          g.title('Partial wetting \u2014 ' + (v.lim === 'gas' ? 'gas-limited reaction' : 'liquid-limited reaction'));
          g.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2, [7, 4]);
          g.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.8);
          g.line([[0, 100], [30, 100]], 'rgba(29,31,32,0.18)', 1.1);
          g.dot(v.uL, r.X * 100, C.warn, 5.5);
          g.dot(v.uL, r.fw * 100, C.dk, 4);
          g.legend([{ c: C.acc, l: 'conversion' }, { c: C.dk, l: 'wetting efficiency', d: [7, 4] }]);
        }
      },
      {
        id: 'bubcol', num: 'X-06', sec: S, name: 'Bubble column \u2014 hold-up, k_La and conversion',
        blurb: 'The simplest multiphase reactor there is: a tube, a sparger and no moving parts. Its performance is entirely a matter of how much gas it holds and how much interfacial area that gas presents, and both change character abruptly when the homogeneous bubbly flow gives way to churn-turbulent flow.',
        howto: 'Watch the hold-up curve bend at the regime transition. Below it the bubbles are uniform and hold-up rises almost linearly with gas velocity; above it large bubbles form, rise fast, and carry gas through without contributing much area, so hold-up flattens and k_La stops improving. That flattening is the practical ceiling on a bubble column, and it is why the alternative above it is a stirred tank or a loop reactor.',
        std: 'Akita & Yoshida, IECR Proc. Des. Dev. 12 (1973) 76; Deckwer, Bubble Column Reactors (1992); Shah et al., AIChE J. 28 (1982) 353',
        eqs: [['\\frac{\\varepsilon_G}{(1-\\varepsilon_G)^4} = 0.20\\,Bo^{1/8}Ga^{1/12}Fr', 'Akita\u2013Yoshida hold-up correlation'], ['k_La = 0.6\\,D_L^{0.5}\\nu^{-0.12}\\sigma^{-0.62}d_c^{0.17}g^{0.93}\\varepsilon_G^{1.1}', 'Akita\u2013Yoshida volumetric coefficient'], ['a = \\frac{6\\varepsilon_G}{d_b}', 'interfacial area from hold-up and bubble size'], ['X = 1-\\exp\\!\\left(-\\frac{k_La\\,\\tau}{1+k_La/(k\\varepsilon_L)}\\right)', 'conversion with transport and reaction in series']],
        notes: ['Akita\u2013Yoshida correlations, developed for air\u2013water and organic liquids in columns of 0.15\u20130.6 m.', 'Regime transition taken at the gas velocity where the hold-up curve inflects, typically 0.03\u20130.05 m/s.', 'Liquid phase treated as well mixed, gas phase as plug flow.', 'Sauter mean bubble diameter is an input, not predicted.'],
        params: [P('uG', 'Superficial gas velocity', 2, 300, 1, 40, null, 'mm/s'), P('dc', 'Column diameter', 0.1, 5, 0.05, 0.5, 'L'), P('Hc', 'Dispersion height', 0.5, 30, 0.1, 4, 'L'), P('rhoL', 'Liquid density', 600, 1400, 10, 1000, 'rho'), P('muL', 'Liquid viscosity', 0.3, 100, 0.1, 1, null, 'cP'), P('sig', 'Surface tension', 15, 80, 0.5, 72, null, 'mN/m'), P('DL', 'Diffusivity \u00d710\u207b\u2079', 0.2, 10, 0.05, 2, null, 'm\u00b2/s'), P('db', 'Sauter bubble diameter', 0.5, 15, 0.1, 4, null, 'mm'), P('kr', 'First-order rate constant', 0.001, 20, 0.001, 0.2, null, 's\u207b\u00b9'), P('He', 'Henry constant', 10, 50000, 10, 5000, null, 'kPa\u00b7m\u00b3/kmol'), P('pA', 'Partial pressure', 10, 5000, 10, 101, 'P')],
        compute: v => {
          const uG = v.uG / 1000, mu = v.muL / 1000, sig = v.sig / 1000, DL = v.DL * 1e-9, db = v.db / 1000;
          const g0 = 9.81, nu = mu / v.rhoL;
          const Bo = g0 * v.dc * v.dc * v.rhoL / sig;
          const Ga = g0 * Math.pow(v.dc, 3) / (nu * nu);
          const Fr = uG / Math.sqrt(g0 * v.dc);
          const rhs = 0.20 * Math.pow(Bo, 1 / 8) * Math.pow(Ga, 1 / 12) * Fr;
          const eg = self.bis(e => e / Math.pow(1 - e, 4) - rhs, 1e-6, 0.85, 1e-10);
          const kla = 0.6 * Math.pow(DL, 0.5) * Math.pow(nu, -0.12) * Math.pow(sig / v.rhoL, -0.62) * Math.pow(v.dc, 0.17) * Math.pow(g0, 0.93) * Math.pow(eg, 1.1);
          const a = 6 * eg / db;
          const kL = kla / Math.max(a, 1e-9);
          const eL = 1 - eg;
          const tau = v.Hc * eL / Math.max(uG * 0 + 1e-9, 1e-9);
          const tauG = v.Hc * eg / uG;
          const CAs = v.pA / v.He;
          const Rtot = 1 / kla + 1 / (v.kr * eL);
          const rate = CAs / Rtot;
          const X = 1 - Math.exp(-Math.min(tauG / Rtot, 40));
          const utrans = 0.04;
          const churn = uG > utrans;
          const curve = [];
          for (let i = 1; i <= 140; i++) {
            const u = 0.002 + (0.3 - 0.002) * i / 140;
            const fr = u / Math.sqrt(g0 * v.dc);
            const rr = 0.20 * Math.pow(Bo, 1 / 8) * Math.pow(Ga, 1 / 12) * fr;
            const e = self.bis(x => x / Math.pow(1 - x, 4) - rr, 1e-6, 0.9, 1e-9);
            const kk = 0.6 * Math.pow(DL, 0.5) * Math.pow(nu, -0.12) * Math.pow(sig / v.rhoL, -0.62) * Math.pow(v.dc, 0.17) * Math.pow(g0, 0.93) * Math.pow(e, 1.1);
            curve.push([u * 1000, e, kk]);
          }
          return {
            curve: curve, eg: eg, kla: kla, churn: churn,
            res: [{ l: 'Bond number Bo', v: Bo, u: '\u2014', d: 1 }, { l: 'Galileo number Ga', v: Ga, u: '\u2014', d: 0 }, { l: 'Froude number Fr', v: Fr, u: '\u2014', d: 5 }, { l: 'Gas hold-up \u03b5_G', v: eg, u: '\u2014', d: 4 }, { l: 'Liquid hold-up \u03b5_L', v: eL, u: '\u2014', d: 4 }, { l: 'Interfacial area a', v: a, u: 'm\u00b2/m\u00b3', d: 1 }, { l: 'Volumetric coefficient k_La', v: kla, u: 's\u207b\u00b9', d: 5 }, { l: 'Film coefficient k_L', v: kL * 1000, u: 'mm/s', d: 4 }, { l: 'Gas residence time', v: tauG, u: 's', d: 2 }, { l: 'Saturation C*', v: CAs, u: 'kmol/m\u00b3', d: 6 }, { l: 'Transport share of resistance', v: (1 / kla) / Rtot * 100, u: '%', d: 1 }, { l: 'Volumetric rate', v: rate, u: 'kmol/m\u00b3\u00b7s', d: 6 }, { l: 'Gas conversion', v: X * 100, u: '%', d: 2 }, { l: 'Flow regime', s: churn ? 'churn-turbulent \u2014 large bubbles bypass' : 'homogeneous bubbly \u2014 uniform bubbles', u: '' }, { l: 'Limiting step', s: (1 / kla) / Rtot > 0.6 ? 'gas\u2013liquid mass transfer' : (1 / kla) / Rtot < 0.25 ? 'chemical reaction' : 'both, comparably', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.54;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 300, ymin: 0, ymax: Math.max(0.45, r.eg * 1.4), ml: 64, mb: 18, mt: 32 });
          g.grid('', 'Gas hold-up  \u03b5_G');
          g.title('Bubble column hydrodynamics');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.X(40), g.y, g.x + g.w - g.X(40), g.h); ctx.restore(); });
          g.line([[40, 0], [40, 1]], C.warn, 1.4, [5, 4]);
          g.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.8);
          g.dot(v.uG, r.eg, C.warn, 5);
          if (g.w > 300) g.txt('churn-turbulent', 300 * 0.98, Math.max(0.45, r.eg * 1.4) * 0.08, C.mid, 'right', 11.5);
          let km = 0; r.curve.forEach(p => km = Math.max(km, p[2]));
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 300, ymin: 0, ymax: km * 1.15, ml: 64, mt: 12, mb: 46 });
          g2.grid('Superficial gas velocity  mm/s', 'k_La  s\u207b\u00b9', 5, 4);
          g2.line([[40, 0], [40, km * 2]], C.warn, 1.4, [5, 4]);
          g2.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2.8);
          g2.dot(v.uG, r.kla, C.warn, 5);
        }
      },
      {
        id: 'shrink', num: 'X-07', sec: S, name: 'Shrinking-core model \u2014 gas\u2013solid non-catalytic',
        blurb: 'Ore roasting, coal combustion, sorbent sulphation, catalyst regeneration: a solid particle consumed from the outside in, with an unreacted core retreating behind a growing shell of product. Three steps can control \u2014 film transport, ash diffusion, surface reaction \u2014 and each gives a different and easily distinguishable conversion-against-time curve.',
        howto: 'Compare the three curves. Film control is linear in conversion; reaction control is linear in the shrinking core radius; ash-layer control is the slow one that flattens badly at high conversion, which is why sulphation of a limestone particle never quite finishes. The particle-size dependence is the cleanest experimental discriminator: complete conversion time goes as d for film control, d\u00b2 for ash control and d for reaction control \u2014 measure it and you know your mechanism.',
        std: 'Yagi & Kunii (1955); Levenspiel, Chemical Reaction Engineering, 3rd ed., Ch. 25; Szekely, Evans & Sohn, Gas\u2013Solid Reactions',
        eqs: [['\\text{film: } \\frac{t}{\\tau} = X,\\qquad \\tau = \\frac{\\rho_BR}{3bk_gC_{Ag}}', 'gas-film control'], ['\\text{ash: } \\frac{t}{\\tau} = 1-3(1-X)^{2/3}+2(1-X),\\quad \\tau = \\frac{\\rho_BR^2}{6bD_eC_{Ag}}', 'ash-layer diffusion control'], ['\\text{reaction: } \\frac{t}{\\tau} = 1-(1-X)^{1/3},\\quad \\tau = \\frac{\\rho_BR}{bk_sC_{Ag}}', 'surface-reaction control'], ['t = t_{film} + t_{ash} + t_{rxn}', 'the three resistances add for a shrinking core']],
        notes: ['Spherical particle of constant overall size; the ash layer stays in place.', 'First-order in gas-phase reactant at the reaction front.', 'Isothermal particle; strongly exothermic systems need the thermal shrinking-core form.', 'Molar density of the solid reactant \u03c1_B expressed per unit particle volume.'],
        params: [P('R', 'Particle radius', 0.05, 20, 0.05, 2, null, 'mm'), P('CAg', 'Gas concentration C_Ag', 0.001, 5, 0.001, 0.05, null, 'kmol/m\u00b3'), P('rhoB', 'Solid molar density \u03c1_B', 1, 100, 0.5, 25, null, 'kmol/m\u00b3'), P('bst', 'Stoichiometry b', 0.5, 4, 0.5, 1, null, '\u2014'), P('kg', 'Gas-film coefficient k_g', 0.001, 2, 0.001, 0.05, null, 'm/s'), P('De', 'Ash diffusivity \u00d710\u207b\u2076', 0.01, 100, 0.01, 1, null, 'm\u00b2/s'), P('ks', 'Surface rate constant k_s', 1e-5, 1, 1e-5, 0.005, null, 'm/s')],
        compute: v => {
          const R = v.R / 1000, De = v.De * 1e-6;
          const tf = v.rhoB * R / (3 * v.bst * v.kg * v.CAg);
          const ta = v.rhoB * R * R / (6 * v.bst * De * v.CAg);
          const ts = v.rhoB * R / (v.bst * v.ks * v.CAg);
          const tTot = tf + ta + ts;
          const tOf = X => tf * X + ta * (1 - 3 * Math.pow(1 - X, 2 / 3) + 2 * (1 - X)) + ts * (1 - Math.pow(1 - X, 1 / 3));
          const Xof = t => { if (t <= 0) return 0; if (t >= tTot) return 1; return self.bis(x => tOf(x) - t, 0, 1, 1e-10); };
          const pct = x => x / tTot * 100;
          const ctrl = [['Gas film', tf], ['Ash diffusion', ta], ['Surface reaction', ts]].sort((p, q) => q[1] - p[1])[0];
          const rows = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99].map(X => [
            (X * 100).toFixed(0) + ' %', (tf * X).toPrecision(4), (ta * (1 - 3 * Math.pow(1 - X, 2 / 3) + 2 * (1 - X))).toPrecision(4), (ts * (1 - Math.pow(1 - X, 1 / 3))).toPrecision(4), tOf(X).toPrecision(4), (tOf(X) / 60).toPrecision(4)
          ]);
          return {
            tf: tf, ta: ta, ts: ts, tTot: tTot, Xof: Xof, tOf: tOf,
            res: [{ l: 'Film-control time \u03c4_film', v: tf, u: 's', d: 3 }, { l: 'Ash-control time \u03c4_ash', v: ta, u: 's', d: 3 }, { l: 'Reaction-control time \u03c4_rxn', v: ts, u: 's', d: 3 }, { l: 'Total time for complete conversion', v: tTot, u: 's', d: 3 }, { l: 'Total time in minutes', v: tTot / 60, u: 'min', d: 3 }, { l: 'Film share', v: pct(tf), u: '%', d: 1 }, { l: 'Ash share', v: pct(ta), u: '%', d: 1 }, { l: 'Reaction share', v: pct(ts), u: '%', d: 1 }, { l: 'Time to 50 % conversion', v: tOf(0.5), u: 's', d: 3 }, { l: 'Time to 90 % conversion', v: tOf(0.9), u: 's', d: 3 }, { l: 'Time from 90 % to 99 %', v: tOf(0.99) - tOf(0.9), u: 's', d: 3 }, { l: 'Controlling step', s: ctrl[0] + ' \u2014 ' + pct(ctrl[1]).toFixed(0) + ' % of the total', u: '' }, { l: 'Size dependence of \u03c4', s: ctrl[0] === 'Ash diffusion' ? '\u03c4 \u221d R\u00b2 \u2014 halving the particle quarters the time' : '\u03c4 \u221d R \u2014 linear in particle size', u: '' }],
            table: { title: 'Time to reach each conversion, split by mechanism', head: ['Conversion', 't_film  s', 't_ash  s', 't_rxn  s', 'total  s', 'total  min'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const tmax = r.tTot * 1.05;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.02, ml: 62 });
          g.grid('Time  s', 'Conversion  X');
          g.title('Shrinking core \u2014 the three controlling mechanisms');
          g.line([[0, 1], [tmax, 1]], 'rgba(29,31,32,0.2)', 1.1, [5, 4]);
          const mk = (fn, tt, col, dash, lw) => { const pts = []; for (let i = 0; i <= 200; i++) { const X = i / 200; pts.push([fn(X) * tt, X]); } g.line(pts, col, lw || 1.8, dash); };
          mk(X => X, r.tf, C.lt, [4, 3]);
          mk(X => 1 - 3 * Math.pow(1 - X, 2 / 3) + 2 * (1 - X), r.ta, C.mid, [7, 4]);
          mk(X => 1 - Math.pow(1 - X, 1 / 3), r.ts, C.dk, [2, 3]);
          const comb = []; for (let i = 0; i <= 240; i++) { const X = i / 240; comb.push([r.tOf(X), X]); }
          g.line(comb, C.acc, 2.8);
          [0.5, 0.9].forEach(X => g.dot(r.tOf(X), X, C.warn, 4.5));
          g.legend([{ c: C.acc, l: 'all three in series' }, { c: C.lt, l: 'film only', d: [4, 3] }, { c: C.mid, l: 'ash only', d: [7, 4] }, { c: C.dk, l: 'reaction only', d: [2, 3] }]);
        }
      },
      {
        id: 'fluidbed',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const umf = self.rget(r, 'minimum fluidisation') || 0, Lf = self.rget(r, 'expanded bed height') || v.Lmf;
  const dlt = self.rget(r, 'bubble fraction') || 0, X = self.rget(r, 'conversion \u2014 fluidised') || 0;
  const ratio = v.u0 / Math.max(umf / 1000, 1e-9);
  const fixed = ratio < 1;
  s.title(fixed ? 'Fixed bed \u2014 not yet fluidised' : 'Fluidised bed', 'u\u2080/u_mf ' + self.f(ratio, 2) + ' \u00b7 bed ' + self.f(Lf, 2) + ' m');
  const W = Math.min(210, s.w * 0.34), Xc = s.x + s.w * 0.33 - W / 2;
  const bot = s.y + s.h - 56, top = s.y + 36, Htot = bot - top;
  const sc = Htot / Math.max(Lf * 1.5, v.Lmf * 1.8);
  const bedH = Math.min(Htot - 10, Lf * sc);
  s.R(Xc, top, W, Htot, { stroke: C.ink, lw: 1.8 });
  s.R(Xc + 1, bot - bedH, W - 2, bedH, { stroke: null, fill: fixed ? 'rgba(29,31,32,0.10)' : C.soft });
  s.L([[Xc + 1, bot - bedH], [Xc + W - 1, bot - bedH]], { col: C.acc, lw: 1.6, dash: fixed ? [] : [5, 4] });
  s.clipR(Xc + 1, bot - bedH, W - 2, bedH, () => {
    if (fixed) { for (let yy = bot - 6; yy > bot - bedH; yy -= 9) for (let xx = Xc + 7; xx < Xc + W - 5; xx += 10) s.circ(xx + ((Math.round(yy) % 18) ? 4 : 0), yy, 2.6, { stroke: 'rgba(29,31,32,0.4)', lw: 0.8 }); }
    else {
      const br = Math.max(4, Math.min(W * 0.3, v.db * sc * 0.5));
      for (let i = 0; i < 16; i++) {
        const xx = Xc + 10 + ((i * 53) % Math.max(W - 20, 10));
        const yy = bot - 8 - ((i * 71) % Math.max(bedH - 12, 10));
        s.circ(xx, yy, br * (0.6 + (i % 4) * 0.16), { stroke: C.acc, lw: 1.2, fill: C.soft });
      }
      for (let yy = bot - 5; yy > bot - bedH; yy -= 11) for (let xx = Xc + 6; xx < Xc + W - 4; xx += 11) s.circ(xx, yy, 1.5, { stroke: 'rgba(29,31,32,0.26)', lw: 0.7 });
    }
  });
  s.R(Xc, top, W, Htot, { stroke: C.ink, lw: 1.8 });
  s.L([[Xc, bot], [Xc + W, bot]], { col: C.ink, lw: 3 });
  for (let i = 0; i < 11; i++) { const xx = Xc + 8 + (W - 16) * i / 10; s.L([[xx, bot + 22], [xx, bot + 2]], { col: C.mid, lw: 1.2, arrow: true, asz: 4.5 }); }
  s.T('distributor', Xc + W / 2, bot + 34, { align: 'center', size: 10, col: C.mut, caps: true });
  s.T('u\u2080 ' + self.f(v.u0, 2) + ' m/s', Xc + W / 2, bot + 48, { align: 'center', size: 10.5, col: C.mid });
  s.T('freeboard', Xc + W / 2, (top + bot - bedH) / 2, { align: 'center', size: 10.5, col: C.mut, caps: true });
  s.dim(Xc + W + 26, bot, Xc + W + 26, bot - bedH, self.f(Lf, 2) + ' m', { col: C.acc });
  s.dim(Xc - 22, bot, Xc - 22, bot - v.Lmf * sc, 'L_mf ' + self.f(v.Lmf, 2), { col: C.mut });
  const bx = s.x + s.w - 158;
  s.badge(bx, s.y + 6, 'u\u2080 / u_mf', self.f(ratio, 2) + (fixed ? ' \u2014 fixed' : ''), fixed ? 0.9 : 0.5 - 0.3 * self.cl01((ratio - 1) / 10), { w: 158 });
  s.badge(bx, s.y + 50, 'Bubble fraction \u03b4', self.f(dlt, 3), null, { w: 158 });
  s.badge(bx, s.y + 94, 'Conversion', self.f(X, 1) + '%', 0.5 - 0.34 * self.cl01(X / 100), { w: 158 });
},
        schemNote: 'Below minimum fluidisation the bed is drawn as a static packing; above it the bed expands, bubbles appear at the size you set, and the expanded height is dimensioned against L_mf.',
        num: 'X-08', sec: S, name: 'Fluidised bed \u2014 Kunii\u2013Levenspiel two-phase model',
        blurb: 'A fluidised bed is not a plug-flow reactor with good heat transfer; it is a bed of dense emulsion pierced by bubbles that carry most of the gas through in near-plug-flow with almost no contact with the solid. The Kunii\u2013Levenspiel model puts numbers on that bypass, and the numbers are sobering.',
        howto: 'Compare the two conversion figures. At industrial gas velocities a fluidised bed routinely delivers less than half the conversion a plug-flow reactor of the same volume and catalyst would give, entirely because of bubble bypass. Reducing bubble size \u2014 by internals, by baffles, by operating closer to minimum fluidisation \u2014 is the only lever that matters, and the plot shows exactly how much it buys.',
        std: 'Kunii & Levenspiel, Fluidization Engineering, 2nd ed., Ch. 12; Levenspiel, Chemical Reaction Engineering, Ch. 20; Wen & Yu (1966) for u_mf',
        eqs: [['u_b = u_0 - u_{mf} + 0.711\\sqrt{gd_b}', 'bubble rise velocity in a bubbling bed'], ['K_{bc} = 4.5\\frac{u_{mf}}{d_b} + 5.85\\frac{D^{1/2}g^{1/4}}{d_b^{5/4}}', 'bubble-to-cloud interchange'], ['K_{ce} = 6.77\\left(\\frac{D\\varepsilon_{mf}u_b}{d_b^3}\\right)^{1/2}', 'cloud-to-emulsion interchange'], ['K_f = \\gamma_b + \\cfrac{1}{\\cfrac{1}{K_{bc}/k} + \\cfrac{1}{\\gamma_c + \\cfrac{1}{1/(K_{ce}/k)+1/\\gamma_e}}}', 'overall rate group \u2014 resistances in series and parallel']],
        notes: ['Wen\u2013Yu correlation for minimum fluidisation velocity; Archimedes number from the particle and gas properties.', 'Bubble diameter is an input \u2014 in practice it grows with height and must be averaged.', 'First-order reaction on the catalyst, isothermal bed.', 'Model breaks down in the slugging and turbulent regimes.'],
        params: [P('dp', 'Particle diameter', 20, 2000, 5, 100, null, '\u00b5m'), P('rhos', 'Particle density', 800, 5000, 20, 1500, null, 'kg/m\u00b3'), P('rhog', 'Gas density', 0.2, 30, 0.1, 1.2, null, 'kg/m\u00b3'), P('mug', 'Gas viscosity', 0.005, 0.1, 0.001, 0.018, null, 'cP'), P('u0', 'Superficial gas velocity', 0.01, 3, 0.01, 0.3, null, 'm/s'), P('db', 'Mean bubble diameter', 0.005, 0.6, 0.005, 0.1, null, 'm'), P('Lmf', 'Bed height at u_mf', 0.1, 10, 0.05, 1, 'L'), P('emf', 'Voidage at u_mf', 0.35, 0.6, 0.01, 0.45, null, '\u2014'), P('kr', 'Rate constant k (per volume solid)', 0.01, 200, 0.01, 5, null, 's\u207b\u00b9'), P('Dg', 'Gas diffusivity \u00d710\u207b\u2075', 0.5, 100, 0.5, 20, null, 'm\u00b2/s')],
        compute: v => {
          const dp = v.dp * 1e-6, mu = v.mug * 1e-3, D = v.Dg * 1e-5, g0 = 9.81;
          const Ar = Math.pow(dp, 3) * v.rhog * (v.rhos - v.rhog) * g0 / (mu * mu);
          const Remf = Math.sqrt(1135.7 + 0.0408 * Ar) - 33.7;
          const umf = Remf * mu / (v.rhog * dp);
          const ub = v.u0 - umf + 0.711 * Math.sqrt(g0 * v.db);
          const dlt = Math.min(Math.max((v.u0 - umf) / Math.max(ub, 1e-9), 0), 0.6);
          const L = v.Lmf * (1 - v.emf) / Math.max(1 - v.emf - dlt * 0 - (1 - v.emf) * 0 + 1e-12, 1e-9);
          const Lf = v.Lmf / Math.max(1 - dlt, 0.05);
          const gb = 0.005, gc = (1 - v.emf) * (3 * (umf / v.emf) / Math.max(ub - umf / v.emf, 1e-9) + 0.4);
          const ge = (1 - v.emf) * (1 - dlt) / Math.max(dlt, 1e-6) - gb - gc;
          const geP = Math.max(ge, 0.01);
          const Kbc = 4.5 * (umf / v.db) + 5.85 * Math.pow(D, 0.5) * Math.pow(g0, 0.25) / Math.pow(v.db, 1.25);
          const Kce = 6.77 * Math.sqrt(D * v.emf * ub / Math.pow(v.db, 3));
          const k = v.kr;
          const inner = geP + 1 / (1 / (Kce / k) + 1 / geP) * 0 + 0;
          const term3 = 1 / (1 / (Kce / k) + 1 / geP);
          const term2 = 1 / (1 / (Kbc / k) + 1 / (gc + term3));
          const Kf = gb + term2;
          const tauB = Lf / Math.max(ub, 1e-9);
          const KfT = Kf * k * Lf / Math.max(v.u0, 1e-9);
          const X = 1 - Math.exp(-Math.min(KfT, 40));
          const Xpfr = 1 - Math.exp(-Math.min(k * (1 - v.emf) * v.Lmf / Math.max(v.u0, 1e-9), 40));
          const Xcstr = (k * (1 - v.emf) * v.Lmf / v.u0) / (1 + k * (1 - v.emf) * v.Lmf / v.u0);
          const curve = [];
          for (let i = 1; i <= 120; i++) {
            const d2 = 0.005 + (0.6 - 0.005) * i / 120;
            const ub2 = v.u0 - umf + 0.711 * Math.sqrt(g0 * d2);
            const dl2 = Math.min(Math.max((v.u0 - umf) / ub2, 0), 0.6);
            const gc2 = (1 - v.emf) * (3 * (umf / v.emf) / Math.max(ub2 - umf / v.emf, 1e-9) + 0.4);
            const ge2 = Math.max((1 - v.emf) * (1 - dl2) / Math.max(dl2, 1e-6) - gb - gc2, 0.01);
            const kbc = 4.5 * (umf / d2) + 5.85 * Math.pow(D, 0.5) * Math.pow(g0, 0.25) / Math.pow(d2, 1.25);
            const kce = 6.77 * Math.sqrt(D * v.emf * ub2 / Math.pow(d2, 3));
            const t3 = 1 / (1 / (kce / k) + 1 / ge2);
            const t2 = 1 / (1 / (kbc / k) + 1 / (gc2 + t3));
            const kf = gb + t2;
            const lf = v.Lmf / Math.max(1 - dl2, 0.05);
            curve.push([d2, (1 - Math.exp(-Math.min(kf * k * lf / v.u0, 40))) * 100]);
          }
          return {
            curve: curve, X: X, Xpfr: Xpfr,
            res: [{ l: 'Archimedes number Ar', v: Ar, u: '\u2014', d: 1 }, { l: 'Minimum fluidisation u_mf', v: umf * 1000, u: 'mm/s', d: 3 }, { l: 'u\u2080 / u_mf', v: v.u0 / umf, u: '\u2014', d: 2 }, { l: 'Bubble rise velocity u_b', v: ub, u: 'm/s', d: 4 }, { l: 'Bubble fraction \u03b4', v: dlt, u: '\u2014', d: 4 }, { l: 'Expanded bed height', v: Lf, u: 'm', d: 3 }, { l: 'Bubble\u2013cloud K_bc', v: Kbc, u: 's\u207b\u00b9', d: 3 }, { l: 'Cloud\u2013emulsion K_ce', v: Kce, u: 's\u207b\u00b9', d: 3 }, { l: 'Cloud volume ratio \u03b3_c', v: gc, u: '\u2014', d: 4 }, { l: 'Emulsion volume ratio \u03b3_e', v: geP, u: '\u2014', d: 3 }, { l: 'Overall rate group K_f', v: Kf, u: '\u2014', d: 4 }, { l: 'Gas residence time in bubbles', v: tauB, u: 's', d: 4 }, { l: 'Conversion \u2014 fluidised bed', v: X * 100, u: '%', d: 2 }, { l: 'Conversion \u2014 plug flow', v: Xpfr * 100, u: '%', d: 2 }, { l: 'Conversion \u2014 perfect mixing', v: Xcstr * 100, u: '%', d: 2 }, { l: 'Bypass penalty', v: (Xpfr - X) * 100, u: '% points', d: 2 }, { l: 'Regime', s: v.u0 < umf ? 'fixed bed \u2014 below minimum fluidisation' : v.db > 0.6 * 1 ? 'slugging likely' : v.u0 / umf > 30 ? 'turbulent \u2014 model outside its range' : 'bubbling fluidisation', u: '' }, { l: 'Design lever', s: Kf < 1 ? 'severe bubble bypass \u2014 add internals to break the bubbles' : 'contacting acceptable', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 0.6, ymin: 0, ymax: 105, ml: 62 });
          g.grid('Mean bubble diameter  m', 'Conversion  %');
          g.title('Bubble bypass \u2014 fluidised bed against plug flow');
          g.line([[0, r.Xpfr * 100], [0.6, r.Xpfr * 100]], C.dk, 1.8, [7, 4]);
          g.line(r.curve, C.acc, 2.8);
          g.dot(v.db, r.X * 100, C.warn, 5.5);
          if (g.w > 300) g.txt('plug flow ceiling', 0.58, r.Xpfr * 100 + 4, C.dk, 'right', 11.5);
          g.legend([{ c: C.acc, l: 'Kunii\u2013Levenspiel' }, { c: C.dk, l: 'plug flow', d: [7, 4] }]);
        }
      }
    ];
  }

  /* ══ STATISTICS & DATA ANALYSIS ═══════════════════════════ */
