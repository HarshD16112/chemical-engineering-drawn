  dFluidise() {
    const self = this, C = this.C;
    const S = 'Fluidisation & Packed Beds';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const PF = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit, free: true });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });
    const g0 = 9.80665;

    /* Ergun: viscous (Blake–Kozeny) plus inertial (Burke–Plummer) */
    const ergun = (u, dp, eb, rho, mu, phi) => {
      const dpe = dp * (phi || 1);
      const visc = 150 * mu * u * Math.pow(1 - eb, 2) / (Math.pow(dpe, 2) * Math.pow(eb, 3));
      const inert = 1.75 * rho * u * u * (1 - eb) / (dpe * Math.pow(eb, 3));
      return { visc: visc, inert: inert, tot: visc + inert };
    };
    const umf = (dp, eb, rhos, rho, mu, phi) => {
      const dpe = dp * (phi || 1);
      const a = 1.75 * rho * (1 - eb) / (dpe * Math.pow(eb, 3));
      const b = 150 * mu * Math.pow(1 - eb, 2) / (Math.pow(dpe, 2) * Math.pow(eb, 3));
      const c = -(1 - eb) * (rhos - rho) * g0;
      return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    };
    const umfWY = (dp, rhos, rho, mu) => {
      const Ar = Math.pow(dp, 3) * rho * (rhos - rho) * g0 / (mu * mu);
      const Re = Math.sqrt(1135.7 + 0.0408 * Ar) - 33.7;
      return { u: Re * mu / (rho * dp), Ar: Ar, Re: Re };
    };
    const ut = (dp, rhos, rho, mu) => {
      let u = g0 * dp * dp * (rhos - rho) / (18 * mu), Cd = 0, Re = 0;
      for (let i = 0; i < 60; i++) {
        Re = rho * u * dp / mu;
        Cd = Re < 0.3 ? 24 / Math.max(Re, 1e-9) : Re < 1000 ? (24 / Re) * (1 + 0.15 * Math.pow(Re, 0.687)) : 0.44;
        u = Math.sqrt(4 * g0 * dp * (rhos - rho) / (3 * Cd * rho));
      }
      return { u: u, Re: Re, Cd: Cd };
    };
    const geldart = (dp, drho) => {
      const d = dp * 1e6;
      if (d < 30 || (d < 100 && drho > 1000 && d < 20 + 30)) return 'C';
      if (d < 20) return 'C';
      if (d < 90 && drho < 2500) return 'A';
      if (d < 100) return 'A';
      if (d < 600 && drho < 3500) return 'B';
      if (d >= 600) return 'D';
      return 'B';
    };
    const GD = {
      C: ['C \u2014 cohesive', 'Will not fluidise cleanly: channels and plugs. Needs a stirrer, a vibrator or agglomeration into group A.'],
      A: ['A \u2014 aeratable', 'Expands appreciably before bubbling, holds a deaerating bed, and keeps good gas\u2013solid contact. The FCC catalyst group.'],
      B: ['B \u2014 sand-like', 'Bubbles from u_mf with almost no expansion; bubbles grow with height and coalesce. The commonest industrial group.'],
      D: ['D \u2014 spoutable', 'Large, dense particles. Bubbles rise slower than the interstitial gas, so a spouted bed is usually better than a fluidised one.']
    };
    const SHAPES = [['1', 'Spheres  \u03c6 = 1.00'], ['0.87', 'Rounded sand  \u03c6 = 0.87'], ['0.8', 'Crushed solids  \u03c6 = 0.80'], ['0.65', 'Flake / cylinder  \u03c6 = 0.65'], ['0.55', 'Raschig ring  \u03c6 = 0.55']];

    return [
      {
        id: 'ergun', num: 'Z-01', sec: S, name: 'Ergun equation & packed-bed pressure drop',
        blurb: 'Two mechanisms fight for control of the pressure drop through a packed bed: viscous drag along the channel walls, which scales with velocity, and inertial loss at every constriction, which scales with velocity squared. Ergun simply added them, and the resulting equation has held for seventy years across four decades of Reynolds number.',
        howto: 'Watch the two contributions cross over. Below a particle Reynolds number of about 10 the bed is entirely viscous and the pressure drop is linear in velocity \u2014 that is the Blake\u2013Kozeny limit, and it is where a laboratory permeability measurement lives. Above about 1000 the inertial term owns everything and the drop goes as velocity squared, which is the Burke\u2013Plummer limit. Then move the voidage: because it enters as (1\u2212\u03b5)\u00b2/\u03b5\u00b3, a change from 0.40 to 0.35 nearly doubles the pressure drop. That sensitivity is why loading a reactor badly ruins it.',
        std: 'Ergun, Chem. Eng. Prog. 48 (1952) 89; Bird, Stewart & Lightfoot, Transport Phenomena, 2nd ed., §6.4; Perry\u2019s, 9th ed., Sec. 6',
        eqs: [['\\frac{\\Delta P}{L} = \\underbrace{\\frac{150\\mu u(1-\\varepsilon)^{2}}{(\\phi d_p)^{2}\\varepsilon^{3}}}_{\\text{viscous}} + \\underbrace{\\frac{1.75\\rho u^{2}(1-\\varepsilon)}{\\phi d_p\\,\\varepsilon^{3}}}_{\\text{inertial}}', 'the Ergun equation'], ['Re_p = \\frac{\\rho u\\,\\phi d_p}{\\mu(1-\\varepsilon)}', 'particle Reynolds number on the modified basis'], ['f_p = \\frac{\\Delta P}{L}\\frac{\\phi d_p\\varepsilon^{3}}{\\rho u^{2}(1-\\varepsilon)} = \\frac{150}{Re_p} + 1.75', 'the friction factor form \u2014 one curve for every bed'], ['\\text{Blake\u2013Kozeny } Re_p<10,\\qquad \\text{Burke\u2013Plummer } Re_p>1000', 'the two asymptotes']],
        notes: ['Superficial velocity throughout \u2014 the velocity the empty tower would see.', 'Sphericity \u03c6 multiplies the particle diameter, so a Raschig ring behaves like a much smaller sphere.', 'Valid for a bed deep enough that wall effects are negligible, roughly D/d_p above 10; the wall correction is reported when it is not.', 'For a fluidised bed the pressure drop stops rising at u_mf \u2014 that is module Z-02.'],
        params: [PF('u', 'Superficial velocity', 0.001, 10, 0.001, 0.3, null, 'm/s'), PF('dp', 'Particle diameter', 0.02, 50, 0.01, 3, null, 'mm'), SEL('phi', 'Particle shape', '0.87', SHAPES), P('eb', 'Bed voidage \u03b5', 0.25, 0.75, 0.005, 0.40, null, '\u2014'), P('L', 'Bed depth', 0.05, 30, 0.05, 2, 'L'), P('Dt', 'Vessel diameter', 0.02, 8, 0.01, 1, 'L'), P('rho', 'Fluid density', 0.1, 1500, 0.1, 1.2, 'rho'), P('mu', 'Fluid viscosity', 0.005, 500, 0.005, 0.018, null, 'cP'), P('rhos', 'Particle density', 300, 8000, 10, 1500, 'rho')],
        compute: v => {
          const dp = v.dp / 1000, mu = v.mu / 1000, phi = parseFloat(v.phi);
          const e = ergun(v.u, dp, v.eb, v.rho, mu, phi);
          const Rep = v.rho * v.u * phi * dp / (mu * (1 - v.eb));
          const RepS = v.rho * v.u * dp / mu;
          const fp = e.tot * phi * dp * Math.pow(v.eb, 3) / (v.rho * v.u * v.u * (1 - v.eb));
          const dP = e.tot * v.L;
          const A = Math.PI * v.Dt * v.Dt / 4;
          const Q = v.u * A * 3600;
          const M = Q * v.rho;
          const av = 6 * (1 - v.eb) / (phi * dp);
          const Dd = v.Dt / dp;
          const wallM = 1 + 2 / (3 * Dd * (1 - v.eb));
          const umfv = umf(dp, v.eb, v.rhos, v.rho, mu, phi);
          const dPmf = (1 - v.eb) * (v.rhos - v.rho) * g0 * v.L;
          const pow = dP * v.u * A / 1000;
          const regime = Rep < 10 ? 'viscous \u2014 Blake\u2013Kozeny, \u0394P \u221d u' : Rep < 1000 ? 'transitional \u2014 both terms matter' : 'inertial \u2014 Burke\u2013Plummer, \u0394P \u221d u\u00b2';
          const rows = [0.01, 0.03, 0.1, 0.3, 1, 3].map(f => {
            const uu = v.u * f;
            const ee = ergun(uu, dp, v.eb, v.rho, mu, phi);
            return [uu.toPrecision(3), (v.rho * uu * phi * dp / (mu * (1 - v.eb))).toPrecision(4), (ee.visc * v.L / 1000).toPrecision(4), (ee.inert * v.L / 1000).toPrecision(4), (ee.tot * v.L / 1000).toPrecision(4), (ee.visc / ee.tot * 100).toFixed(1) + ' %'];
          });
          return {
            e: e, dp: dp, phi: phi, mu: mu, umfv: umfv, dPmf: dPmf,
            res: [{ l: 'Particle Reynolds number Re_p', v: Rep, u: '\u2014', d: 4 }, { l: 'Simple Re on d_p', v: RepS, u: '\u2014', d: 4 }, { l: 'Flow regime', s: regime, u: '' }, { l: 'Viscous term', v: e.visc / 1000, u: 'kPa/m', d: 5 }, { l: 'Inertial term', v: e.inert / 1000, u: 'kPa/m', d: 5 }, { l: 'Viscous share', v: e.visc / e.tot * 100, u: '%', d: 2 }, { l: 'Pressure gradient', v: e.tot / 1000, u: 'kPa/m', d: 5 }, { l: 'Pressure drop over the bed', v: dP / 1000, u: 'kPa', d: 4 }, { l: 'Equivalent liquid head', v: dP / (998 * g0), u: 'm water', d: 4 }, { l: 'Ergun friction factor f_p', v: fp, u: '\u2014', d: 4 }, { l: 'Volumetric flow', v: Q, u: 'm\u00b3/h', d: 2 }, { l: 'Mass flow', v: M, u: 'kg/h', d: 1 }, { l: 'Specific surface a_v', v: av, u: 'm\u00b2/m\u00b3', d: 1 }, { l: 'Bed / particle diameter ratio', v: Dd, u: '\u2014', d: 1 }, { l: 'Wall-effect correction', s: Dd < 10 ? 'significant \u2014 multiply \u0394P by about ' + wallM.toFixed(3) : 'negligible', u: '' }, { l: 'Blower power at 100 % efficiency', v: pow, u: 'kW', d: 4 }, { l: 'Minimum fluidisation velocity', v: umfv, u: 'm/s', d: 5 }, { l: 'Fully fluidised \u0394P would be', v: dPmf / 1000, u: 'kPa', d: 4 }, { l: 'Bed state', s: v.u >= umfv ? 'FLUIDISED \u2014 the Ergun result no longer applies above u_mf; see Z-02' : 'packed \u2014 ' + (v.u / umfv * 100).toFixed(1) + ' % of u_mf', u: '' }],
            table: { title: 'The two terms across the velocity range', head: ['u  m/s', 'Re_p', 'viscous  kPa', 'inertial  kPa', 'total  kPa', 'viscous share'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0.1, xmax: 1e5, ymin: 1, ymax: 1e4, xlog: true, ylog: true, ml: 68 });
          g.grid('Modified Reynolds number  Re_p', 'Friction factor  f_p');
          g.title('Ergun friction factor \u2014 one curve for every packed bed');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(10) - g.x, g.h); ctx.fillStyle = C.soft2; ctx.fillRect(g.X(1000), g.y, g.x + g.w - g.X(1000), g.h); ctx.restore(); });
          g.fn(Re => Math.min(150 / Re, 1e4), C.mid, 1.6, [6, 4], 200);
          g.line([[0.1, 1.75], [1e5, 1.75]], C.mid, 1.6, [3, 3]);
          g.fn(Re => Math.min(150 / Re + 1.75, 1e4), C.acc, 3, null, 300);
          const dpp = v.dp / 1000, phi = parseFloat(v.phi);
          const Rep = v.rho * v.u * phi * dpp / (v.mu / 1000 * (1 - v.eb));
          g.dot(Math.min(Math.max(Rep, 0.1), 1e5), Math.min(150 / Math.max(Rep, 1e-3) + 1.75, 1e4), C.warn, 5.5);
          if (g.w > 320) {
            g.txt('Blake\u2013Kozeny  150/Re', 0.14, 1.4e3, C.mid, 'left', 11.5);
            g.txt('Burke\u2013Plummer  1.75', 7e4, 2.6, C.mid, 'right', 11.5);
            g.txt('viscous', 0.14, 1.4, C.mut, 'left', 11);
            g.txt('inertial', 7e4, 1.4e3, C.mut, 'right', 11);
          }
          g.legend([{ c: C.acc, l: 'Ergun' }, { c: C.mid, l: 'asymptotes', d: [6, 4] }]);
        }
      },
      {
        id: 'umf', num: 'Z-02', sec: S, name: 'Minimum fluidisation & bed expansion',
        blurb: 'Raise the gas velocity through a packed bed and the pressure drop climbs along the Ergun line until it equals the buoyant weight of the solids. At that instant the bed unlocks: the particles are supported by the gas, the pressure drop stops rising, and everything above is fluidisation. That single crossing point governs the design of every fluidised bed ever built.',
        howto: 'The plot is the classic pressure-drop against velocity diagram, and the flat plateau after u_mf is the physical statement that a fluidised bed weighs what it weighs. Change the particle size: u_mf goes as the square of diameter in the fine, viscous regime and as the square root in the coarse, inertial regime, which is why fine powders fluidise at millimetres per second and gravel needs metres per second. The operating window \u2014 u_mf to u_t \u2014 narrows sharply for large particles, and that ratio is what decides whether a fluidised bed is even possible.',
        std: 'Wen & Yu, AIChE J. 12 (1966) 610; Kunii & Levenspiel, Fluidization Engineering, 2nd ed., Ch. 3; Richardson & Zaki (1954) for expansion',
        eqs: [['\\frac{\\Delta P}{L} = (1-\\varepsilon_{mf})(\\rho_s-\\rho)g', 'at and above minimum fluidisation the bed carries its own weight'], ['Ar = \\frac{d_p^{3}\\rho(\\rho_s-\\rho)g}{\\mu^{2}},\\qquad Re_{mf} = \\sqrt{1135.7 + 0.0408Ar} - 33.7', 'Wen\u2013Yu correlation'], ['\\frac{u}{u_t} = \\varepsilon^{n},\\qquad n \\approx \\frac{4.8 + 2.4\\times0.043Ar^{0.57}}{1 + 0.043Ar^{0.57}}', 'Richardson\u2013Zaki expansion index'], ['\\frac{L}{L_{mf}} = \\frac{1-\\varepsilon_{mf}}{1-\\varepsilon}', 'bed height from the expanded voidage']],
        notes: ['Two routes to u_mf are shown: solving the Ergun equation at the incipient voidage, and the Wen\u2013Yu correlation. They agree within about 20 % for spheres and diverge for irregular solids.',
          'The Richardson\u2013Zaki expansion applies cleanly to liquid fluidisation; for gases most of the excess flow goes into bubbles rather than expansion, so the curve is an upper bound.',
          'The pressure-drop overshoot at the transition, from interlocking of the settled bed, is drawn but is not predicted by either equation.',
          'Terminal velocity from a drag correlation valid to Re = 2\u00d710\u2075.'],
        params: [PF('dp', 'Particle diameter', 0.01, 20, 0.005, 0.5, null, 'mm'), SEL('phi', 'Particle shape', '0.87', SHAPES), P('emf', 'Voidage at minimum fluidisation', 0.35, 0.65, 0.005, 0.45, null, '\u2014'), P('rhos', 'Particle density', 300, 8000, 10, 2500, 'rho'), P('rho', 'Fluid density', 0.1, 1500, 0.1, 1.2, 'rho'), P('mu', 'Fluid viscosity', 0.005, 500, 0.005, 0.018, null, 'cP'), P('Lmf', 'Bed depth at u_mf', 0.05, 20, 0.05, 1, 'L'), P('Dt', 'Vessel diameter', 0.05, 10, 0.05, 1, 'L'), P('u', 'Operating velocity', 0.0005, 5, 0.0005, 0.05, null, 'm/s')],
        compute: v => {
          const dp = v.dp / 1000, mu = v.mu / 1000, phi = parseFloat(v.phi);
          const uE = umf(dp, v.emf, v.rhos, v.rho, mu, phi);
          const wy = umfWY(dp, v.rhos, v.rho, mu);
          const t = ut(dp, v.rhos, v.rho, mu);
          const dPmf = (1 - v.emf) * (v.rhos - v.rho) * g0 * v.Lmf;
          const Remf = v.rho * uE * dp / mu;
          const n = (4.8 + 2.4 * 0.043 * Math.pow(wy.Ar, 0.57)) / (1 + 0.043 * Math.pow(wy.Ar, 0.57));
          const eOp = v.u > uE ? Math.min(Math.pow(Math.min(v.u / t.u, 0.999), 1 / n), 0.92) : v.emf;
          const Lop = v.Lmf * (1 - v.emf) / Math.max(1 - Math.max(eOp, v.emf), 1e-6);
          const ratio = t.u / uE;
          const A = Math.PI * v.Dt * v.Dt / 4;
          const gel = geldart(dp, v.rhos - v.rho);
          const dPop = v.u < uE ? ergun(v.u, dp, v.emf, v.rho, mu, phi).tot * v.Lmf : dPmf;
          const mass = (1 - v.emf) * v.rhos * v.Lmf * A;
          const rows = [0.05, 0.1, 0.25, 0.5, 1, 2, 5].map(d => {
            const dd = d / 1000;
            const ue = umf(dd, v.emf, v.rhos, v.rho, mu, phi);
            const w2 = umfWY(dd, v.rhos, v.rho, mu);
            const tt = ut(dd, v.rhos, v.rho, mu);
            return [d.toFixed(2), (ue * 1000).toPrecision(4), (w2.u * 1000).toPrecision(4), (tt.u * 1000).toPrecision(4), (tt.u / ue).toFixed(1), geldart(dd, v.rhos - v.rho)];
          });
          return {
            uE: uE, wy: wy, t: t, dPmf: dPmf, eOp: eOp, dp: dp, phi: phi, mu: mu,
            res: [{ l: 'Archimedes number Ar', v: wy.Ar, u: '\u2014', d: 2 }, { l: 'u_mf from the Ergun equation', v: uE * 1000, u: 'mm/s', d: 4 }, { l: 'u_mf from Wen\u2013Yu', v: wy.u * 1000, u: 'mm/s', d: 4 }, { l: 'Disagreement between the two', v: (wy.u / uE - 1) * 100, u: '%', d: 1 }, { l: 'Re at minimum fluidisation', v: Remf, u: '\u2014', d: 4 }, { l: 'Pressure drop at u_mf', v: dPmf / 1000, u: 'kPa', d: 4 }, { l: 'Bed mass', v: mass, u: 'kg', d: 1 }, { l: 'Terminal velocity u_t', v: t.u, u: 'm/s', d: 4 }, { l: 'Drag coefficient at u_t', v: t.Cd, u: '\u2014', d: 4 }, { l: 'Operating window u_t/u_mf', v: ratio, u: '\u2014', d: 1 }, { l: 'Richardson\u2013Zaki index n', v: n, u: '\u2014', d: 3 }, { l: 'u / u_mf', v: v.u / uE, u: '\u2014', d: 3 }, { l: 'Expanded voidage', v: eOp, u: '\u2014', d: 4 }, { l: 'Expanded bed height', v: Lop, u: 'm', d: 4 }, { l: 'Expansion', v: (Lop / v.Lmf - 1) * 100, u: '%', d: 2 }, { l: 'Pressure drop at the operating point', v: dPop / 1000, u: 'kPa', d: 4 }, { l: 'Geldart group', s: GD[gel][0], u: '' }, { l: 'Bed state', s: v.u < uE ? 'packed \u2014 below minimum fluidisation' : v.u > t.u ? 'PARTICLES ENTRAINED \u2014 above the terminal velocity, the bed will blow out' : v.u / uE > 20 ? 'turbulent / fast fluidisation' : 'bubbling fluidisation', u: '' }, { l: 'Window verdict', s: ratio < 10 ? 'narrow window \u2014 hard to operate without carry-over; consider a spouted bed' : ratio > 100 ? 'very wide window \u2014 easy to fluidise, easy to entrain fines' : 'a comfortable operating window', u: '' }],
            table: { title: 'Particle size against the three characteristic velocities', head: ['d_p  mm', 'u_mf Ergun  mm/s', 'u_mf Wen\u2013Yu  mm/s', 'u_t  mm/s', 'u_t/u_mf', 'Geldart'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const umax = Math.max(r.t.u * 1.6, v.u * 1.4, r.uE * 8);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: r.uE / 60, xmax: umax, ymin: r.dPmf / 1000 / 60, ymax: r.dPmf / 1000 * 3, xlog: true, ylog: true, ml: 70 });
          g.grid('Superficial velocity  m/s', 'Pressure drop  kPa');
          g.title('Pressure drop against velocity \u2014 the fluidisation transition');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.X(r.uE), g.y, g.X(Math.min(r.t.u, umax)) - g.X(r.uE), g.h); ctx.restore(); });
          const pk = [];
          for (let i = 0; i <= 200; i++) {
            const u = (r.uE / 60) * Math.pow(umax / (r.uE / 60), i / 200);
            if (u > r.uE) break;
            pk.push([u, ergun(u, r.dp, v.emf, v.rho, r.mu, r.phi).tot * v.Lmf / 1000]);
          }
          g.line(pk, C.acc, 2.8);
          g.line([[r.uE, r.dPmf / 1000], [umax, r.dPmf / 1000]], C.acc, 2.8);
          g.line([[r.uE, r.dPmf / 1000 / 60], [r.uE, r.dPmf / 1000 * 3]], C.warn, 1.5, [5, 4]);
          if (r.t.u < umax) g.line([[r.t.u, r.dPmf / 1000 / 60], [r.t.u, r.dPmf / 1000 * 3]], C.dk, 1.5, [3, 3]);
          g.line([[r.uE * 0.85, r.dPmf / 1000], [r.uE * 1.05, r.dPmf / 1000 * 1.12], [r.uE * 1.4, r.dPmf / 1000]], C.mid, 1.5, [2, 3]);
          g.dot(v.u, Math.min(Math.max(v.u < r.uE ? ergun(v.u, r.dp, v.emf, v.rho, r.mu, r.phi).tot * v.Lmf / 1000 : r.dPmf / 1000, r.dPmf / 1000 / 60), r.dPmf / 1000 * 3), C.warn, 5.5);
          if (g.w > 320) {
            g.txt('u_mf', r.uE, r.dPmf / 1000 / 40, C.warn, 'center', 11.5);
            if (r.t.u < umax) g.txt('u_t', r.t.u, r.dPmf / 1000 / 40, C.dk, 'center', 11.5);
            g.txt('packed', r.uE / 20, r.dPmf / 1000 * 2, C.mut, 'left', 11);
            g.txt('fluidised \u2014 constant \u0394P', r.uE * 1.5, r.dPmf / 1000 * 1.5, C.mid, 'left', 11.5);
          }
          g.legend([{ c: C.acc, l: '\u0394P(u)' }, { c: C.mid, l: 'interlocking overshoot', d: [2, 3] }]);
        }
      },
      {
        id: 'geldart', num: 'Z-03', sec: S, name: 'Geldart classification & regime map',
        blurb: 'Geldart noticed in 1973 that all fluidising powders fall into four groups by size and density alone, and that the group predicts the behaviour completely: whether the bed expands before bubbling, whether bubbles slug, whether the powder channels instead of fluidising. It is the single most useful chart in solids handling.',
        howto: 'Place your powder on the map and read the group. Then look at what the group implies: group A holds a deaerating bed and gives excellent contacting, which is why fluid catalytic cracking uses it; group B bubbles immediately and vigorously, which is what you want for heat transfer and not for gas\u2013solid contact; group C simply will not fluidise without mechanical help; group D wants a spouted bed. If your powder sits near a boundary, expect its behaviour to change with temperature, because gas density and viscosity both move the boundaries.',
        std: 'Geldart, Powder Technology 7 (1973) 285; Geldart, Gas Fluidization Technology (1986); Grace (1986) regime map',
        eqs: [['\\text{A/B boundary: } d_p(\\rho_s-\\rho) \\approx 225\\ \\mathrm{\\mu m\\,g/cm^{3}}', 'aeratable to sand-like'], ['\\text{B/D boundary: } d_p \\approx 600\\ \\mathrm{\\mu m}', 'sand-like to spoutable'], ['u_{ms} = 100\\,d_p\\ \\ \\text{(group A minimum bubbling)}', 'the velocity where a group A bed starts to bubble'], ['\\frac{u_{mb}}{u_{mf}} = \\frac{2300\\rho^{0.126}\\mu^{0.523}\\exp(0.716F_{45})}{d_p^{0.8}g^{0.934}(\\rho_s-\\rho)^{0.934}}', 'Abrahamsen\u2013Geldart bubbling ratio']],
        notes: ['Boundaries drawn for ambient air; at high temperature or pressure the whole map shifts and a group B powder can become group A.',
          'The fines fraction below 45 \u00b5m strongly extends the group A behaviour \u2014 that is the F\u2084\u2085 term.',
          'Slugging is predicted from the ratio of bubble to vessel diameter, which is why a laboratory column slugs when the plant does not.',
          'The Grace regime map on the second axis places the operating point among bubbling, turbulent and fast fluidisation.'],
        params: [PF('dp', 'Mean particle diameter', 10, 5000, 5, 120, null, '\u00b5m'), P('rhos', 'Particle density', 300, 8000, 10, 1500, 'rho'), P('rho', 'Gas density', 0.1, 60, 0.05, 1.2, 'rho'), P('mu', 'Gas viscosity', 0.005, 0.1, 0.001, 0.018, null, 'cP'), P('F45', 'Fines below 45 \u00b5m', 0, 60, 1, 15, null, '%'), P('u', 'Operating velocity', 0.001, 8, 0.001, 0.2, null, 'm/s'), P('Dt', 'Vessel diameter', 0.05, 10, 0.05, 1, 'L'), P('Lmf', 'Bed depth', 0.1, 20, 0.1, 2, 'L')],
        compute: v => {
          const dp = v.dp * 1e-6, mu = v.mu / 1000, drho = v.rhos - v.rho;
          const wy = umfWY(dp, v.rhos, v.rho, mu);
          const uE = umf(dp, 0.45, v.rhos, v.rho, mu, 1);
          const t = ut(dp, v.rhos, v.rho, mu);
          const gel = geldart(dp, drho);
          const umb = 2300 * Math.pow(v.rho, 0.126) * Math.pow(mu, 0.523) * Math.exp(0.716 * v.F45 / 100) /
            (Math.pow(v.dp * 1e-6 * 1e6 * 1e-6, 0.8) * 0 + Math.pow(dp, 0.8) * Math.pow(g0, 0.934) * Math.pow(drho, 0.934));
          const ratio = Math.max(umb / wy.u, 1);
          const dbMax = 0.54 / Math.pow(g0, 0.2) * Math.pow(Math.max(v.u - wy.u, 1e-4), 0.4) * Math.pow(v.Lmf + 4 * Math.sqrt(Math.PI * v.Dt * v.Dt / 4 / 60), 0.8);
          const slug = dbMax > 0.6 * v.Dt;
          const Uc = 3 * Math.sqrt(dp * 1e3) * 0 + 0.7 * Math.pow(wy.Ar, 0.35) * mu / (v.rho * dp);
          const regime = v.u < wy.u ? 'fixed bed' : v.u < umb && gel === 'A' ? 'expanded, not yet bubbling' : slug ? 'slugging \u2014 bubbles span the vessel' : v.u > t.u * 2 ? 'fast fluidisation / transport' : v.u > Uc ? 'turbulent fluidisation' : 'bubbling fluidisation';
          const Dd = v.Dt / dp;
          return {
            dp: dp, gel: gel, wy: wy, t: t, drho: drho,
            res: [{ l: 'Geldart group', s: GD[gel][0], u: '' }, { l: 'What that means', s: GD[gel][1], u: '' }, { l: 'd_p(\u03c1_s\u2212\u03c1) group index', v: v.dp * drho / 1000, u: '\u00b5m\u00b7g/cm\u00b3', d: 1 }, { l: 'Archimedes number', v: wy.Ar, u: '\u2014', d: 3 }, { l: 'Minimum fluidisation u_mf', v: wy.u * 1000, u: 'mm/s', d: 4 }, { l: 'Minimum bubbling u_mb', v: umb * 1000, u: 'mm/s', d: 4 }, { l: 'u_mb / u_mf', v: ratio, u: '\u2014', d: 3 }, { l: 'Expansion before bubbling', s: ratio > 1.3 ? 'yes \u2014 typical group A behaviour, ' + ((ratio - 1) * 100).toFixed(0) + ' % expansion available' : 'no \u2014 bubbles form at u_mf', u: '' }, { l: 'Terminal velocity u_t', v: t.u, u: 'm/s', d: 4 }, { l: 'Turbulent transition U_c', v: Uc, u: 'm/s', d: 4 }, { l: 'u / u_mf', v: v.u / wy.u, u: '\u2014', d: 2 }, { l: 'Maximum bubble diameter', v: dbMax, u: 'm', d: 4 }, { l: 'Bubble / vessel ratio', v: dbMax / v.Dt, u: '\u2014', d: 3 }, { l: 'Slugging?', s: slug ? 'YES \u2014 use a wider vessel or internals' : 'no', u: '' }, { l: 'Operating regime', s: regime, u: '' }, { l: 'Fines effect', s: v.F45 > 20 ? 'the fines are extending group A behaviour \u2014 good contacting, but expect carry-over' : v.F45 < 5 ? 'few fines \u2014 the bed will bubble vigorously' : 'a normal fines content', u: '' }, { l: 'Design note', s: gel === 'C' ? 'will not fluidise \u2014 granulate it, or use a mechanically stirred bed' : gel === 'D' ? 'consider a spouted bed; gas passes through bubbles slower than the interstitial gas' : gel === 'A' ? 'ideal for catalytic reaction \u2014 fine bubbles, good gas\u2013solid contact' : 'ideal for heat transfer and drying; contacting is mediocre because bubbles bypass', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 10, xmax: 5000, ymin: 0.05, ymax: 8, xlog: true, ylog: true, ml: 70 });
          g.grid('Mean particle diameter  \u00b5m', '\u03c1_s \u2212 \u03c1   g/cm\u00b3');
          g.title('Geldart powder classification map');
          const ab = d => Math.max(225 / d, 0.05);
          const cd = d => Math.max(1000 / Math.pow(d, 1.28) * 6, 0.05);
          const zone = (pts, col) => g.fill(pts, col);
          const A = [], Bz = [], Cz = [], Dz = [];
          for (let i = 0; i <= 120; i++) {
            const d = 10 * Math.pow(500, i / 120);
            A.push([d, ab(d)]);
          }
          g.clip(() => {
            ctx.save();
            ctx.fillStyle = C.soft; ctx.fillRect(g.X(600), g.y, g.x + g.w - g.X(600), g.h);
            ctx.restore();
          });
          const cB = []; for (let i = 0; i <= 120; i++) { const d = 10 * Math.pow(500, i / 120); cB.push([d, cd(d)]); }
          g.fill(cB.concat([[5000, 8], [10, 8]]), C.soft2);
          g.line(A, C.dk, 2);
          g.line(cB, C.mid, 2, [6, 4]);
          g.line([[600, 0.05], [600, 8]], C.dk, 2);
          g.line([[20, 0.05], [20, 8]], C.mid, 1.4, [3, 3]);
          if (g.w > 320) {
            g.txt('C  cohesive', 13, 4.5, C.mid, 'left', 12.5);
            g.txt('A  aeratable', 40, 0.35, C.dk, 'left', 12.5);
            g.txt('B  sand-like', 200, 3.2, C.dk, 'left', 12.5);
            g.txt('D  spoutable', 1400, 3.2, C.dk, 'left', 12.5);
          }
          g.dot(Math.min(Math.max(v.dp, 10), 5000), Math.min(Math.max(r.drho / 1000, 0.05), 8), C.warn, 6.5);
          g.cross(Math.min(Math.max(v.dp, 10), 5000), Math.min(Math.max(r.drho / 1000, 0.05), 8), C.warn, 11);
          g.legend([{ c: C.warn, l: 'your powder \u2014 group ' + r.gel }, { c: C.dk, l: 'A/B and B/D boundaries' }, { c: C.mid, l: 'C boundary', d: [6, 4] }]);
        }
      },
      {
        id: 'entrain', num: 'Z-04', sec: S, name: 'Entrainment, TDH & cyclone recovery',
        blurb: 'Above a fluidised bed the gas carries solids upward, and the flux falls with height as the coarser particles fall back. Beyond a certain height \u2014 the transport disengaging height \u2014 nothing more falls back and whatever is still airborne leaves the vessel. Getting the freeboard wrong is the commonest reason a fluid bed loses its inventory.',
        howto: 'Set the freeboard and read the carry-over. Below the TDH the entrainment falls steeply with every extra metre of vessel, so freeboard is cheap; above it, extra height buys nothing and the only remedy is a cyclone. The elutriation constants tell you which size fraction is actually leaving: anything with a terminal velocity below the gas velocity will eventually go, so the fines inventory of a fluid bed is set by the balance between what attrition makes and what the cyclone returns.',
        std: 'Zenz & Weil, AIChE J. 4 (1958) 472; Geldart, Gas Fluidization Technology, Ch. 6; Kunii & Levenspiel, Ch. 7',
        eqs: [['TDH \\approx 0.85\\,u_0^{1.2}\\left(7.33 - 1.2\\log u_0\\right)', 'Zenz\u2013Weil transport disengaging height, u\u2080 in m/s'], ['G_s(h) = G_s^{\\infty} + \\left(G_s^{0} - G_s^{\\infty}\\right)e^{-ah}', 'entrainment flux decays with height above the bed'], ['\\kappa_i^{*} = \\text{elutriation constant of size } i,\\qquad E_i = \\kappa_i^{*}A x_i', 'the flux of each size fraction leaving'], ['\\eta_{cyc} = \\frac{1}{1+(d_{50}/d_p)^{2}}', 'cyclone grade efficiency']],
        notes: ['Entrainment correlations carry a factor-of-three uncertainty even at their best; treat the numbers as a sizing basis, not a guarantee.',
          'The decay constant a is taken as 4/u\u2080 for group A and B powders, the usual industrial default.',
          'Cyclone cut size from the standard Lapple/Stairmand geometry \u2014 detailed sizing is module E-08.',
          'Attrition is not predicted here; the fines make-up rate is a plant measurement.'],
        params: [P('u', 'Superficial gas velocity', 0.05, 5, 0.01, 0.6, null, 'm/s'), P('Dt', 'Vessel diameter', 0.2, 12, 0.1, 3, 'L'), P('Hfb', 'Freeboard above the bed', 0.2, 30, 0.1, 4, 'L'), PF('dpf', 'Fines size', 5, 300, 1, 40, null, '\u00b5m'), PF('dpc', 'Coarse size', 100, 3000, 10, 500, null, '\u00b5m'), P('xf', 'Fines in the bed', 0.5, 60, 0.5, 12, null, '% by mass'), P('rhos', 'Particle density', 300, 8000, 10, 1500, 'rho'), P('rho', 'Gas density', 0.1, 60, 0.05, 1.2, 'rho'), P('mu', 'Gas viscosity', 0.005, 0.1, 0.001, 0.018, null, 'cP'), P('d50', 'Cyclone cut size d\u2085\u2080', 2, 60, 0.5, 10, null, '\u00b5m'), P('Mbed', 'Bed inventory', 100, 500000, 100, 20000, null, 'kg')],
        compute: v => {
          const mu = v.mu / 1000, A = Math.PI * v.Dt * v.Dt / 4;
          const dpf = v.dpf * 1e-6, dpc = v.dpc * 1e-6;
          const tf = ut(dpf, v.rhos, v.rho, mu), tc = ut(dpc, v.rhos, v.rho, mu);
          const TDH = 0.85 * Math.pow(v.u, 1.2) * (7.33 - 1.2 * Math.log10(v.u));
          const a = 4 / v.u;
          /* saturation carrying capacity from the Zenz correlation family */
          const kInf = f => {
            const t = ut(f, v.rhos, v.rho, mu).u;
            if (v.u <= t) return 0;
            const x = (v.u - t) / v.u;
            return 23.7 * v.rho * v.u * Math.exp(-5.4 * t / v.u);
          };
          const Ef = kInf(dpf) * v.xf / 100, Ec = kInf(dpc) * (1 - v.xf / 100);
          const G0 = (Ef + Ec) * 3;
          const Ginf = Ef + Ec;
          const Gh = Ginf + (G0 - Ginf) * Math.exp(-a * v.Hfb);
          const carry = Gh * A * 3600;
          const carryTDH = Ginf * A * 3600;
          const etaF = 1 / (1 + Math.pow(v.d50 / v.dpf, 2));
          const etaC = 1 / (1 + Math.pow(v.d50 / v.dpc, 2));
          const lossF = Ef * A * 3600 * (1 - etaF), lossC = Ec * A * 3600 * (1 - etaC);
          const loss = lossF + lossC;
          const halfLife = v.Mbed / Math.max(loss, 1e-9);
          const rows = [0.5, 1, 2, 4, 8, 16].map(h => {
            const gh = Ginf + (G0 - Ginf) * Math.exp(-a * h);
            return [h.toFixed(1), (gh * 1000).toPrecision(4), (gh * A * 3600).toPrecision(4), (h / TDH).toFixed(3), h >= TDH ? 'above TDH \u2014 no further benefit' : 'below TDH'];
          });
          return {
            TDH: TDH, Ginf: Ginf, G0: G0, a: a, A: A, tf: tf, tc: tc,
            res: [{ l: 'Fines terminal velocity', v: tf.u, u: 'm/s', d: 4 }, { l: 'Coarse terminal velocity', v: tc.u, u: 'm/s', d: 4 }, { l: 'Fines entrained?', s: v.u > tf.u ? 'yes \u2014 gas velocity exceeds u_t by ' + (v.u / tf.u).toFixed(1) + '\u00d7' : 'no \u2014 they stay in the bed', u: '' }, { l: 'Coarse entrained?', s: v.u > tc.u ? 'yes \u2014 the whole bed is being transported' : 'no', u: '' }, { l: 'Transport disengaging height', v: TDH, u: 'm', d: 3 }, { l: 'Freeboard provided', v: v.Hfb, u: 'm', d: 2 }, { l: 'Freeboard / TDH', v: v.Hfb / TDH, u: '\u2014', d: 3 }, { l: 'Decay constant a', v: a, u: 'm\u207b\u00b9', d: 3 }, { l: 'Flux at the bed surface', v: G0 * 1000, u: 'g/m\u00b2s', d: 3 }, { l: 'Saturation flux above TDH', v: Ginf * 1000, u: 'g/m\u00b2s', d: 3 }, { l: 'Flux at the exit', v: Gh * 1000, u: 'g/m\u00b2s', d: 3 }, { l: 'Solids leaving the vessel', v: carry, u: 'kg/h', d: 2 }, { l: 'If the freeboard were TDH', v: carryTDH, u: 'kg/h', d: 2 }, { l: 'Cyclone efficiency on the fines', v: etaF * 100, u: '%', d: 2 }, { l: 'Cyclone efficiency on the coarse', v: etaC * 100, u: '%', d: 2 }, { l: 'Net loss past the cyclone', v: loss, u: 'kg/h', d: 3 }, { l: 'Inventory turnover time', v: halfLife, u: 'h', d: 1 }, { l: 'Freeboard verdict', s: v.Hfb < 0.6 * TDH ? 'far too short \u2014 carry-over is ' + (Gh / Ginf).toFixed(1) + '\u00d7 the saturation value' : v.Hfb > 1.5 * TDH ? 'more freeboard than useful \u2014 the extra height is wasted steel' : 'well matched to the TDH', u: '' }, { l: 'Loss verdict', s: loss / v.Mbed * 24 > 0.1 ? 'losing more than 10 % of the inventory a day \u2014 add a second cyclone stage' : 'acceptable solids loss', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const hmax = Math.max(v.Hfb * 1.4, r.TDH * 1.8);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: hmax, ymin: 0, ymax: Math.max(r.G0 * 1100, 1), ml: 72 });
          g.grid('Height above the bed surface  m', 'Entrainment flux  g/m\u00b2s');
          g.title('Entrainment decay and the transport disengaging height');
          g.clip(() => { ctx.save(); ctx.fillStyle = C.soft; ctx.fillRect(g.x, g.y, g.X(r.TDH) - g.x, g.h); ctx.restore(); });
          g.line([[0, r.Ginf * 1000], [hmax, r.Ginf * 1000]], C.lt, 1.4, [6, 4]);
          g.line([[r.TDH, 0], [r.TDH, r.G0 * 1100]], C.warn, 1.6, [5, 4]);
          g.fn(h => (r.Ginf + (r.G0 - r.Ginf) * Math.exp(-r.a * h)) * 1000, C.acc, 2.8, null, 300);
          g.dot(v.Hfb, (r.Ginf + (r.G0 - r.Ginf) * Math.exp(-r.a * v.Hfb)) * 1000, C.warn, 5.5);
          if (g.w > 320) { g.txt('TDH', r.TDH, r.G0 * 1050, C.warn, 'center', 11.5); g.txt('saturation carrying capacity', hmax * 0.98, r.Ginf * 1000 + r.G0 * 40, C.mid, 'right', 11); g.txt('coarse still falling back', r.TDH * 0.5, r.G0 * 500, C.mid, 'center', 11); }
          g.legend([{ c: C.acc, l: 'flux' }, { c: C.lt, l: 'saturation value', d: [6, 4] }]);
        }
      },
      {
        id: 'catfb', num: 'Z-05', sec: S, name: 'Catalytic fixed bed against fluidised bed',
        blurb: 'The same reaction, the same catalyst, the same volume, run two ways. A fixed bed gives plug flow and the best possible conversion but pays for it in pressure drop and cannot control temperature; a fluidised bed is nearly isothermal and shrugs off a pressure drop but loses conversion to bubble bypass. Almost every industrial catalytic process has made this choice explicitly.',
        howto: 'Sweep the gas velocity. The fixed-bed conversion falls only because the residence time falls, while its pressure drop climbs as the square of velocity \u2014 that is what limits a fixed bed. The fluidised bed holds a constant pressure drop but its conversion is capped by the bubble bypass, and beyond a certain velocity no amount of catalyst helps. Where the two conversion curves cross is where the fixed bed stops being worth its pressure drop, and the temperature-rise figure is usually what settles the argument.',
        std: 'Levenspiel, Chemical Reaction Engineering, 3rd ed., Ch. 20 & 22; Kunii & Levenspiel, Ch. 12; Froment, Bischoff & De Wilde, Ch. 11 & 13',
        eqs: [['\\text{fixed bed: } X = 1-\\exp\\!\\left(-\\frac{\\eta k(1-\\varepsilon)L}{u}\\right)', 'plug flow with the pellet effectiveness factor'], ['\\text{fluidised: } X = 1-\\exp\\!\\left(-K_f\\frac{k(1-\\varepsilon_{mf})L_f}{u}\\right)', 'the Kunii\u2013Levenspiel contacting factor caps the conversion'], ['\\frac{\\Delta P}{L}\\Big|_{fixed} = \\text{Ergun},\\qquad \\frac{\\Delta P}{L}\\Big|_{fluid} = (1-\\varepsilon_{mf})(\\rho_s-\\rho)g', 'the pressure-drop contrast'], ['\\Delta T_{ad} = \\frac{(-\\Delta H_r)C_{A0}X}{\\rho c_p}', 'adiabatic temperature rise \u2014 what a fixed bed cannot shed']],
        notes: ['First-order reaction on the catalyst, isothermal comparison; the adiabatic rise is reported to show what a fixed bed would actually do.',
          'Pellet effectiveness from a spherical Thiele modulus, so the fixed bed is penalised for its larger pellets and the fluid bed rewarded for its powder.',
          'Fluid-bed contacting from the Kunii\u2013Levenspiel two-phase model with a mean bubble diameter you set.',
          'Catalyst mass held equal between the two cases, which is the only fair basis for the comparison.'],
        params: [P('kv', 'Rate constant per volume of catalyst', 0.01, 500, 0.01, 20, null, 's\u207b\u00b9'), P('u', 'Superficial velocity', 0.02, 4, 0.01, 0.4, null, 'm/s'), P('L', 'Bed depth', 0.2, 15, 0.1, 3, 'L'), PF('dpFix', 'Fixed-bed pellet size', 1, 30, 0.5, 5, null, 'mm'), PF('dpFlu', 'Fluid-bed particle size', 20, 500, 5, 80, null, '\u00b5m'), P('db', 'Mean bubble diameter', 0.01, 0.6, 0.005, 0.08, null, 'm'), P('De', 'Effective pellet diffusivity \u00d710\u207b\u2077', 0.1, 100, 0.1, 5, null, 'm\u00b2/s'), P('eb', 'Fixed-bed voidage', 0.3, 0.55, 0.01, 0.4, null, '\u2014'), P('emf', 'Fluid-bed voidage at u_mf', 0.4, 0.6, 0.01, 0.5, null, '\u2014'), P('rhos', 'Particle density', 500, 4000, 10, 1200, 'rho'), P('rho', 'Gas density', 0.2, 40, 0.1, 1.2, 'rho'), P('mu', 'Gas viscosity', 0.008, 0.06, 0.001, 0.02, null, 'cP'), P('Dg', 'Gas diffusivity \u00d710\u207b\u2075', 0.5, 100, 0.5, 20, null, 'm\u00b2/s'), P('dH', 'Heat of reaction \u2212\u0394H', 0, 400, 5, 120, null, 'kJ/mol'), P('CA0', 'Feed concentration', 0.01, 5, 0.01, 0.5, null, 'kmol/m\u00b3'), P('cp', 'Gas heat capacity', 0.8, 3, 0.05, 1.1, null, 'kJ/kg\u00b7K')],
        compute: v => {
          const mu = v.mu / 1000, De = v.De * 1e-7, Dg = v.Dg * 1e-5;
          const dFix = v.dpFix / 1000, dFlu = v.dpFlu * 1e-6;
          const phiF = (dFix / 6) * Math.sqrt(v.kv / De);
          const etaF = phiF < 0.01 ? 1 : (3 / (phiF * phiF)) * (phiF / Math.tanh(phiF) - 1);
          const phiP = (dFlu / 6) * Math.sqrt(v.kv / De);
          const etaP = phiP < 0.01 ? 1 : (3 / (phiP * phiP)) * (phiP / Math.tanh(phiP) - 1);
          const Xfix = u => 1 - Math.exp(-Math.min(etaF * v.kv * (1 - v.eb) * v.L / u, 40));
          const wy = umfWY(dFlu, v.rhos, v.rho, mu);
          const umfv = wy.u;
          const Kfof = u => {
            const ub = Math.max(u - umfv + 0.711 * Math.sqrt(g0 * v.db), 1e-6);
            const dlt = Math.min(Math.max((u - umfv) / ub, 0), 0.6);
            const gb = 0.005;
            const gc = (1 - v.emf) * (3 * (umfv / v.emf) / Math.max(ub - umfv / v.emf, 1e-9) + 0.4);
            const ge = Math.max((1 - v.emf) * (1 - dlt) / Math.max(dlt, 1e-6) - gb - gc, 0.01);
            const k = v.kv * etaP;
            const Kbc = 4.5 * (umfv / v.db) + 5.85 * Math.pow(Dg, 0.5) * Math.pow(g0, 0.25) / Math.pow(v.db, 1.25);
            const Kce = 6.77 * Math.sqrt(Dg * v.emf * ub / Math.pow(v.db, 3));
            const t3 = 1 / (1 / (Kce / k) + 1 / ge);
            const t2 = 1 / (1 / (Kbc / k) + 1 / (gc + t3));
            return { Kf: gb + t2, dlt: dlt, ub: ub, k: k };
          };
          const Xflu = u => { const q = Kfof(u); const Lf = v.L / Math.max(1 - q.dlt, 0.05); return 1 - Math.exp(-Math.min(q.Kf * q.k * Lf / u, 40)); };
          const XF = Xfix(v.u), XB = Xflu(v.u);
          const eFix = ergun(v.u, dFix, v.eb, v.rho, mu, 0.87);
          const dPfix = eFix.tot * v.L;
          const dPflu = (1 - v.emf) * (v.rhos - v.rho) * g0 * v.L;
          const dTad = v.dH * 1000 * v.CA0 / (v.rho * v.cp) ;
          const q = Kfof(v.u);
          const curve = [];
          for (let i = 1; i <= 120; i++) {
            const u = 0.02 + (4 - 0.02) * i / 120;
            curve.push([u, Xfix(u) * 100, Xflu(u) * 100, ergun(u, dFix, v.eb, v.rho, mu, 0.87).tot * v.L / 1000, dPflu / 1000]);
          }
          let cross = NaN;
          for (let i = 1; i < curve.length; i++) { if ((curve[i][1] - curve[i][2]) * (curve[i - 1][1] - curve[i - 1][2]) < 0) { cross = curve[i][0]; break; } }
          return {
            curve: curve, XF: XF, XB: XB, dPfix: dPfix, dPflu: dPflu, cross: cross,
            res: [{ l: 'Fixed-bed Thiele modulus', v: phiF, u: '\u2014', d: 4 }, { l: 'Fixed-bed effectiveness \u03b7', v: etaF, u: '\u2014', d: 4 }, { l: 'Fluid-bed Thiele modulus', v: phiP, u: '\u2014', d: 5 }, { l: 'Fluid-bed effectiveness \u03b7', v: etaP, u: '\u2014', d: 4 }, { l: 'Pellet diffusion penalty', s: etaF < 0.5 ? 'severe \u2014 the fixed bed uses only ' + (etaF * 100).toFixed(0) + ' % of its catalyst' : 'modest', u: '' }, { l: 'Minimum fluidisation velocity', v: umfv * 1000, u: 'mm/s', d: 3 }, { l: 'u / u_mf in the fluid bed', v: v.u / umfv, u: '\u2014', d: 1 }, { l: 'Bubble fraction \u03b4', v: q.dlt, u: '\u2014', d: 4 }, { l: 'Contacting factor K_f', v: q.Kf, u: '\u2014', d: 4 }, { l: 'Fixed-bed conversion', v: XF * 100, u: '%', d: 2 }, { l: 'Fluidised-bed conversion', v: XB * 100, u: '%', d: 2 }, { l: 'Conversion penalty of fluidising', v: (XF - XB) * 100, u: '% points', d: 2 }, { l: 'Fixed-bed pressure drop', v: dPfix / 1000, u: 'kPa', d: 3 }, { l: 'Fluidised-bed pressure drop', v: dPflu / 1000, u: 'kPa', d: 3 }, { l: 'Pressure-drop ratio', v: dPfix / dPflu, u: '\u2014', d: 3 }, { l: 'Adiabatic temperature rise at full conversion', v: dTad, u: 'K', d: 1 }, { l: 'Crossover velocity', s: isFinite(cross) ? cross.toFixed(3) + ' m/s \u2014 beyond this the fluidised bed converts more' : 'none \u2014 the fixed bed converts more at every velocity', u: '' }, { l: 'Thermal verdict', s: dTad > 150 ? 'a fixed bed cannot hold this exotherm \u2014 fluidise, or use a multitubular reactor' : dTad > 50 ? 'a fixed bed needs cooling tubes' : 'either reactor can handle the heat', u: '' }, { l: 'Recommendation', s: dTad > 150 ? 'fluidised bed \u2014 isothermal operation is worth the conversion penalty' : dPfix / dPflu > 3 ? 'fluidised bed \u2014 the fixed-bed pressure drop is the dominant cost' : etaF < 0.4 ? 'fluidised bed \u2014 the fixed bed wastes most of its catalyst' : 'fixed bed \u2014 better conversion, manageable pressure drop', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.56;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: 4, ymin: 0, ymax: 105, ml: 68, mb: 18, mt: 32 });
          g.grid('', 'Conversion  %');
          g.title('Fixed bed against fluidised bed \u2014 same catalyst, same volume');
          g.line(r.curve.map(p => [p[0], p[1]]), C.acc, 2.8);
          g.line(r.curve.map(p => [p[0], p[2]]), C.dk, 2.8, [7, 4]);
          if (isFinite(r.cross)) g.line([[r.cross, 0], [r.cross, 105]], C.warn, 1.4, [4, 4]);
          g.dot(v.u, r.XF * 100, C.acc, 5); g.dot(v.u, r.XB * 100, C.dk, 5);
          g.legend([{ c: C.acc, l: 'fixed bed' }, { c: C.dk, l: 'fluidised bed', d: [7, 4] }]);
          let pmax = 0; r.curve.forEach(p => pmax = Math.max(pmax, p[3]));
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: 4, ymin: 0, ymax: Math.max(pmax * 1.1, r.dPflu / 1000 * 2), ml: 68, mt: 12, mb: 46 });
          g2.grid('Superficial velocity  m/s', 'Pressure drop  kPa', 5, 4);
          g2.line(r.curve.map(p => [p[0], p[3]]), C.acc, 2.6);
          g2.line([[0, r.dPflu / 1000], [4, r.dPflu / 1000]], C.dk, 2.6, [7, 4]);
          g2.dot(v.u, r.dPfix / 1000, C.warn, 5);
        }
      },
      {
        id: 'noncat', num: 'Z-06', sec: S, name: 'Non-catalytic fluidised bed \u2014 roasting & combustion',
        blurb: 'When the solid is the reactant rather than the catalyst, the bed has a size distribution that changes as it reacts, and the conversion of the bed is not the conversion of any single particle. Yagi and Kunii solved it by averaging the shrinking-core result over the exit-age distribution of a perfectly mixed bed, and the answer is startling: a well-mixed fluid bed always leaves some unreacted solid behind.',
        howto: 'The conversion-against-residence-time curve is far flatter than a single particle would suggest, and that is entirely the fault of perfect mixing: some particles short-circuit to the outlet after a few seconds. Staging the bed fixes it \u2014 the curve for two and three stages in series is drawn for comparison, and two stages typically buys more than doubling the residence time of one. The elutriation term is the other loss: fine particles leave before they have reacted, and for a shrinking particle they leave exactly when they are most nearly converted.',
        std: 'Yagi & Kunii, Chem. Eng. Sci. 16 (1961) 364 & 380; Kunii & Levenspiel, Fluidization Engineering, Ch. 14; Levenspiel, Ch. 25 & 26',
        eqs: [['1 - \\bar X_B = \\int_0^{\\infty}\\left[1-X_B(t)\\right]E(t)\\,dt', 'average over the exit-age distribution'], ['E(t) = \\frac{1}{\\bar t}e^{-t/\\bar t}', 'perfect mixing \u2014 the source of the loss'], ['1-\\bar X_B = \\frac{\\tau}{\\bar t}\\left[1 - \\frac{\\tau}{4\\bar t} + \\frac{\\tau^{2}}{20\\bar t^{2}} - \\dots\\right]', 'Yagi\u2013Kunii series for reaction control'], ['\\bar X_{B,N} \\ \\text{from } N \\text{ stages in series}', 'staging recovers most of the loss']],
        notes: ['Shrinking-core particles under reaction control; ash-layer control gives an even flatter curve.',
          'Perfect mixing of the solids, plug flow of the gas \u2014 the standard fluid-bed idealisation.',
          'Elutriation removes particles at a rate proportional to the fines fraction, so unconverted fines leave with the gas.',
          'The single-particle time \u03c4 comes from module X-07; enter it directly here.'],
        params: [P('tauP', 'Time for complete conversion of one particle', 1, 600, 1, 60, null, 'min'), P('tbar', 'Mean solids residence time', 1, 600, 1, 90, null, 'min'), P('N', 'Stages in series', 1, 5, 1, 1, null, '\u2014'), SEL('ctrl', 'Controlling step', 'rxn', [['rxn', 'Surface reaction control'], ['ash', 'Ash-layer diffusion control'], ['film', 'Gas-film control']]), P('elut', 'Elutriation rate', 0, 30, 0.5, 3, null, '% of feed per pass'), P('feed', 'Solids feed rate', 0.1, 200, 0.1, 10, null, 't/h'), P('conv', 'Target conversion', 50, 99.9, 0.1, 95, null, '%')],
        compute: v => {
          const XB = t => {
            const x = t / v.tauP;
            if (x >= 1) return 1;
            if (v.ctrl === 'film') return x;
            if (v.ctrl === 'rxn') return 1 - Math.pow(1 - x, 3);
            /* ash control: invert 1-3(1-X)^{2/3}+2(1-X) = x */
            return self.bis(X => 1 - 3 * Math.pow(1 - X, 2 / 3) + 2 * (1 - X) - x, 0, 1, 1e-9);
          };
          /* single well-mixed stage: average (1-XB) over the exponential RTD */
          const unconv = tb => {
            const n = 900, tmax = Math.min(v.tauP, tb * 12);
            let s = 0;
            for (let i = 0; i <= n; i++) {
              const t = tmax * i / n, w = (i === 0 || i === n) ? 0.5 : 1;
              s += (1 - XB(t)) * Math.exp(-t / tb) / tb * (tmax / n) * w;
            }
            return s;
          };
          /* N equal stages: solids leaving stage k feed stage k+1, approximated by
             convolving the age distributions — the Erlang RTD of N tanks */
          const unconvN = (tb, N) => {
            const tsi = tb / N;
            const n = 1200, tmax = Math.min(v.tauP, tb * 14);
            let s = 0;
            for (let i = 0; i <= n; i++) {
              const t = tmax * i / n, w = (i === 0 || i === n) ? 0.5 : 1;
              const E = Math.pow(t, N - 1) * Math.exp(-t / tsi) / (Math.pow(tsi, N) * (N === 1 ? 1 : N === 2 ? 1 : N === 3 ? 2 : N === 4 ? 6 : 24));
              s += (1 - XB(t)) * E * (tmax / n) * w;
            }
            return s;
          };
          const un1 = unconv(v.tbar), unN = unconvN(v.tbar, Math.round(v.N));
          const X1 = 1 - un1, XN = 1 - unN;
          const Xplug = XB(v.tbar);
          const elutLoss = v.elut / 100;
          const Xnet = XN * (1 - elutLoss) + elutLoss * XB(v.tbar * 0.35);
          /* residence time needed for the target */
          const need = self.bis(tb => (1 - unconvN(tb, Math.round(v.N))) - v.conv / 100, 1, 100000, 1e-4);
          const rows = [1, 2, 3, 4, 5].map(N => {
            const un = unconvN(v.tbar, N);
            let tb = NaN; try { tb = self.bis(t => (1 - unconvN(t, N)) - v.conv / 100, 1, 100000, 1e-3); } catch (e) { }
            return [String(N), ((1 - un) * 100).toFixed(3), isFinite(tb) ? tb.toFixed(1) : 'unreachable', isFinite(tb) ? (tb / v.tbar).toFixed(2) : '\u2014', isFinite(tb) ? (v.feed * tb / 60).toFixed(2) : '\u2014'];
          });
          return {
            XB: XB, unconvN: unconvN, X1: X1, XN: XN, Xplug: Xplug,
            res: [{ l: 'Controlling step', s: v.ctrl === 'rxn' ? 'surface reaction' : v.ctrl === 'ash' ? 'ash-layer diffusion' : 'gas film', u: '' }, { l: 'Single-particle conversion time \u03c4', v: v.tauP, u: 'min', d: 1 }, { l: 'Mean solids residence time', v: v.tbar, u: 'min', d: 1 }, { l: 't\u0304 / \u03c4', v: v.tbar / v.tauP, u: '\u2014', d: 3 }, { l: 'Conversion of a single particle at t\u0304', v: Xplug * 100, u: '%', d: 3 }, { l: 'Bed conversion \u2014 one well-mixed stage', v: X1 * 100, u: '%', d: 3 }, { l: 'Mixing penalty', v: (Xplug - X1) * 100, u: '% points', d: 2 }, { l: 'Bed conversion \u2014 ' + Math.round(v.N) + ' stage(s)', v: XN * 100, u: '%', d: 3 }, { l: 'Gain from staging', v: (XN - X1) * 100, u: '% points', d: 2 }, { l: 'Unconverted solid leaving', v: (1 - XN) * 100, u: '%', d: 3 }, { l: 'Elutriated fraction', v: v.elut, u: '%', d: 1 }, { l: 'Net conversion including elutriation', v: Xnet * 100, u: '%', d: 3 }, { l: 'Residence time for the target', v: need, u: 'min', d: 1 }, { l: 'Bed inventory required', v: v.feed * need / 60, u: 't', d: 3 }, { l: 'Extra time the target costs', v: need - v.tbar, u: 'min', d: 1 }, { l: 'Feasibility', s: !isFinite(need) || need > 100000 ? 'target unreachable with this many stages \u2014 add another' : need > 8 * v.tauP ? 'reachable but the inventory is enormous \u2014 stage the bed' : 'a practical design', u: '' }, { l: 'Why staging helps', s: 'perfect mixing lets some particles short-circuit; ' + Math.round(v.N) + ' stage(s) narrows the age distribution', u: '' }, { l: 'Elutriation note', s: v.elut > 10 ? 'heavy carry-over of nearly-reacted fines \u2014 recycle the cyclone catch to the bed' : 'elutriation is a minor loss here', u: '' }],
            table: { title: 'Staging against residence time for ' + v.conv.toFixed(1) + ' % conversion', head: ['Stages', 'X at t\u0304  %', 't\u0304 needed  min', '\u00d7 present t\u0304', 'inventory  t'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const tmax = Math.max(v.tbar * 3, v.tauP * 2.5);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 105, ml: 68 });
          g.grid('Mean solids residence time  min', 'Bed conversion  %');
          g.title('Perfect mixing against staging \u2014 non-catalytic fluid bed');
          g.line([[0, v.conv], [tmax, v.conv]], C.warn, 1.4, [6, 4]);
          g.fn(t => r.XB(t) * 100, C.lt, 1.8, [3, 3], 200);
          [1, 2, 3].forEach(N => {
            const pts = [];
            for (let i = 1; i <= 90; i++) { const t = tmax * i / 90; pts.push([t, (1 - r.unconvN(t, N)) * 100]); }
            g.line(pts, N === Math.round(v.N) ? C.acc : 'rgba(29,31,32,0.16)', N === Math.round(v.N) ? 2.8 : 1.4, N === Math.round(v.N) ? null : [6, 3]);
          });
          g.dot(v.tbar, r.XN * 100, C.warn, 5.5);
          if (g.w > 320) { g.txt('single particle (plug flow)', tmax * 0.98, r.XB(tmax * 0.9) * 100 - 6, C.lt, 'right', 11); g.txt('N = 1, 2, 3', tmax * 0.06, 20, C.mid, 'left', 11.5); }
          g.legend([{ c: C.acc, l: Math.round(v.N) + ' stage(s)' }, { c: 'rgba(29,31,32,0.16)', l: 'other stage counts', d: [6, 3] }, { c: C.lt, l: 'no mixing loss', d: [3, 3] }]);
        }
      }
    ];
  }

  /* ══ CRYSTALLISATION ══════════════════════════════════════ */
