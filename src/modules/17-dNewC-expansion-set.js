  dNewC() {
    const self = this, C = this.C;
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const sw = (Re, rr) => Re < 2100 ? 64 / Math.max(Re, 1) : 0.25 / Math.pow(Math.log10(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    const FL = 'Fluid Mechanics', HT = 'Heat Transfer', SP = 'Separations', EQ = 'Process Equipment Design';
    const G0 = 9.80665;
    const IMP = {
      rushton: ['Rushton 6-blade disc turbine', 5.0, 71, 0.75, 4.1],
      pbt: ['45\u00b0 pitched-blade turbine, 4 blade', 1.27, 45, 0.79, 5.8],
      hydro: ['High-efficiency hydrofoil', 0.33, 40, 0.55, 6.4],
      anchor: ['Anchor / close-clearance', 0.35, 300, 0.30, 12]
    };
    const API526 = [['D', 71], ['E', 126], ['F', 198], ['G', 325], ['H', 506], ['J', 830], ['K', 1186], ['L', 1841], ['M', 2323], ['N', 2800], ['P', 4116], ['Q', 7129], ['R', 10322], ['T', 16774]];
    return [
      {
        id: 'twophase', num: 'F-09', sec: FL, name: 'Two-phase flow \u2014 Beggs & Brill',
        blurb: 'Gas and liquid sharing one pipe do not travel at the same speed, so the liquid piles up: the fraction of the pipe it occupies is larger than the fraction of the flow it carries. Beggs & Brill fixes the flow pattern first, then the holdup, then corrects both for how steeply the line runs.',
        howto: 'Left is the horizontal-flow regime map with your duty on it \u2014 crossing a boundary changes which holdup correlation applies, and the gradient can step visibly. Right splits the gradient into friction and hydrostatic: on any line with real elevation the hydrostatic term dominates at low gas rates, which is why a well or a riser dies from liquid loading rather than from friction.',
        std: 'Beggs & Brill, J. Pet. Tech. 25(5), 607 (1973); inclination correction per Payne et al. (1979) practice',
        eqs: [['\\lambda_L = \\frac{v_{sl}}{v_{sl}+v_{sg}},\\qquad N_{Fr} = \\frac{v_m^2}{gD},\\qquad N_{LV} = v_{sl}\\left(\\frac{\\rho_L}{g\\sigma}\\right)^{0.25}', 'no-slip holdup and the two governing groups'], ['H_L(0) = \\frac{a\\lambda_L^{\\,b}}{N_{Fr}^{\\,c}},\\qquad H_L(\\theta) = H_L(0)\\,\\psi', 'holdup from the regime coefficients, corrected for inclination'], ['\\psi = 1 + C\\left[\\sin(1.8\\theta) - \\tfrac{1}{3}\\sin^3(1.8\\theta)\\right]', 'inclination factor'], ['\\left(\\frac{dP}{dL}\\right) = \\frac{f_{tp}\\rho_{ns}v_m^2}{2D} + \\rho_s g\\sin\\theta,\\qquad \\rho_s = \\rho_LH_L + \\rho_g(1-H_L)', 'friction plus hydrostatic gradient']],
        notes: ['Holdup is floored at the no-slip value and capped at 1, as the method requires.', 'Gas properties taken at the inlet \u2014 for long lines march the calculation in segments.', 'Acceleration handled through the E\u2096 term; it only matters near the outlet of a low-pressure line.'],
        params: [P('D', 'Internal diameter', 25, 600, 1, 154.1, 'mm'), P('L', 'Pipe length', 10, 10000, 10, 200, 'L'), P('theta', 'Inclination from horizontal', -90, 90, 1, 0, null, '\u00b0'), P('QL', 'Liquid rate', 0.5, 500, 0.5, 40, 'Q'), P('Qg', 'Gas rate at conditions', 1, 4000, 1, 300, null, 'm\u00b3/h'), P('rhoL', 'Liquid density', 400, 1400, 5, 850, 'rho'), P('rhog', 'Gas density', 0.5, 200, 0.5, 12, 'rho'), P('muL', 'Liquid viscosity', 0.2, 500, 0.1, 3, null, 'cP'), P('mug', 'Gas viscosity', 0.005, 0.05, 0.001, 0.013, null, 'cP'), P('sigma', 'Surface tension', 5, 75, 0.5, 25, null, 'mN/m'), P('P1', 'Inlet pressure (abs)', 1, 200, 0.5, 20, null, 'bar a')],
        compute: v => {
          const D = v.D / 1000, A = Math.PI * D * D / 4, thr = v.theta * Math.PI / 180;
          const co = { seg: [0.98, 0.4846, 0.0868], int: [0.845, 0.5351, 0.0173], dis: [1.065, 0.5824, 0.0609] };
          const NAME = { seg: 'Segregated \u2014 stratified / annular', int: 'Intermittent \u2014 slug / plug', dis: 'Distributed \u2014 bubble / mist', tra: 'Transition' };
          const calc = Qg => {
            const vsl = (v.QL / 3600) / A, vsg = (Qg / 3600) / A, vm = vsl + vsg;
            const lam = Math.min(Math.max(vsl / Math.max(vm, 1e-12), 1e-6), 1);
            const NFr = vm * vm / (G0 * D);
            const NLV = vsl * Math.pow(v.rhoL / (G0 * v.sigma / 1000), 0.25);
            const L1 = 316 * Math.pow(lam, 0.302), L2 = 0.0009252 * Math.pow(lam, -2.4684), L3 = 0.10 * Math.pow(lam, -1.4516), L4 = 0.5 * Math.pow(lam, -6.738);
            let reg;
            if ((lam < 0.01 && NFr < L1) || (lam >= 0.01 && NFr < L2)) reg = 'seg';
            else if (lam >= 0.01 && NFr >= L2 && NFr <= L3) reg = 'tra';
            else if ((lam >= 0.01 && lam < 0.4 && NFr > L3 && NFr <= L1) || (lam >= 0.4 && NFr > L3 && NFr <= L4)) reg = 'int';
            else reg = 'dis';
            const base = k => Math.min(Math.max(co[k][0] * Math.pow(lam, co[k][1]) / Math.pow(NFr, co[k][2]), lam), 1);
            const psi = (k, h0) => {
              let Cc = 0;
              if (v.theta >= 0) {
                if (k === 'seg') Cc = (1 - lam) * Math.log(0.011 * Math.pow(lam, -3.768) * Math.pow(NLV, 3.539) * Math.pow(NFr, -1.614));
                else if (k === 'int') Cc = (1 - lam) * Math.log(2.96 * Math.pow(lam, 0.305) * Math.pow(NLV, -0.4473) * Math.pow(NFr, 0.0978));
              } else Cc = (1 - lam) * Math.log(4.70 * Math.pow(lam, -0.3692) * Math.pow(NLV, 0.1244) * Math.pow(NFr, -0.5056));
              if (!isFinite(Cc) || Cc < 0) Cc = 0;
              const s = Math.sin(1.8 * thr);
              return h0 * (1 + Cc * (s - 0.333 * s * s * s));
            };
            let HL;
            if (reg === 'tra') { const AA = (L3 - NFr) / Math.max(L3 - L2, 1e-12); HL = AA * psi('seg', base('seg')) + (1 - AA) * psi('int', base('int')); }
            else HL = psi(reg, base(reg));
            HL = Math.min(Math.max(HL, lam), 1);
            const rhon = v.rhoL * lam + v.rhog * (1 - lam);
            const mun = v.muL * lam + v.mug * (1 - lam);
            const Ren = rhon * vm * D / (mun * 1e-3);
            const fn = Ren > 10 ? Math.pow(2 * Math.log10(Ren / (4.5223 * Math.log10(Ren) - 3.8215)), -2) : 64 / Math.max(Ren, 1);
            const yy = lam / Math.max(HL * HL, 1e-9);
            let Sx;
            if (yy > 1 && yy < 1.2) Sx = Math.log(2.2 * yy - 1.2);
            else { const ly = Math.log(Math.max(yy, 1e-9)); Sx = ly / (-0.0523 + 3.182 * ly - 0.8725 * ly * ly + 0.01853 * Math.pow(ly, 4)); }
            if (!isFinite(Sx)) Sx = 0;
            const ftp = fn * Math.exp(Math.min(Sx, 6));
            const rhos = v.rhoL * HL + v.rhog * (1 - HL);
            const dPf = ftp * rhon * vm * vm / (2 * D);
            const dPe = rhos * G0 * Math.sin(thr);
            const Ek = Math.min(vm * vsg * rhos / (v.P1 * 1e5), 0.85);
            return { vsl: vsl, vsg: vsg, vm: vm, lam: lam, NFr: NFr, NLV: NLV, reg: reg, HL: HL, rhon: rhon, rhos: rhos, Ren: Ren, fn: fn, ftp: ftp, dPf: dPf, dPe: dPe, Ek: Ek, tot: (dPf + dPe) / (1 - Ek), L: [L1, L2, L3, L4], name: NAME[reg] };
          };
          const d = calc(v.Qg);
          const dPtot = d.tot * v.L / 1000;
          return {
            calc: calc, d: d,
            res: [{ l: 'Flow regime', s: d.name, u: '' }, { l: 'Superficial liquid velocity', v: d.vsl, u: '', cv: 'vel', d: 3 }, { l: 'Superficial gas velocity', v: d.vsg, u: '', cv: 'vel', d: 2 }, { l: 'Mixture velocity v_m', v: d.vm, u: '', cv: 'vel', d: 2 }, { l: 'No-slip holdup \u03bb_L', v: d.lam, u: '\u2014', d: 4 }, { l: 'Liquid holdup H_L', v: d.HL, u: '\u2014', d: 4 }, { l: 'Slip ratio H_L/\u03bb_L', v: d.HL / d.lam, u: '\u2014', d: 3 }, { l: 'Froude number N_Fr', v: d.NFr, u: '\u2014', d: 3 }, { l: 'Liquid velocity number N_LV', v: d.NLV, u: '\u2014', d: 3 }, { l: 'No-slip density', v: d.rhon, u: '', cv: 'rho', d: 1 }, { l: 'Slip (in-situ) density', v: d.rhos, u: '', cv: 'rho', d: 1 }, { l: 'No-slip Reynolds number', v: d.Ren, u: '\u2014', d: 0 }, { l: 'Two-phase friction factor', v: d.ftp, u: '\u2014', d: 4 }, { l: 'Friction gradient', v: d.dPf / 1000, u: 'kPa/m', d: 4 }, { l: 'Hydrostatic gradient', v: d.dPe / 1000, u: 'kPa/m', d: 4 }, { l: 'Total gradient', v: d.tot / 1000, u: 'kPa/m', d: 4 }, { l: 'Pressure drop over line', v: dPtot, u: 'kPa', d: 1 }, (v.P1 - dPtot / 100 > 0.2 ? { l: 'Outlet pressure', v: v.P1 - dPtot / 100, u: 'bar a', d: 3 } : { l: 'Outlet pressure', s: 'not achievable \u2014 the drop exceeds the inlet pressure, so shorten the line, open it up or raise P\u2081', u: '' }), { l: 'Liquid inventory in line', v: d.HL * Math.PI * Math.pow(v.D / 1000, 2) / 4 * v.L, u: '', cv: 'V', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const w2 = b.w / 2 - 12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: w2, h: b.h, xmin: 0.001, xmax: 1, ymin: 0.01, ymax: 1000, xlog: true, ylog: true, ml: 56 });
          g.grid('No-slip holdup  \u03bb\u029f', 'Froude number  N\ua730\u1d63', 4, 4);
          g.title('Horizontal flow regime map');
          g.fn(l => 316 * Math.pow(l, 0.302), C.dk, 2);
          g.fn(l => 0.0009252 * Math.pow(l, -2.4684), C.mid, 1.8, [6, 4]);
          g.fn(l => 0.10 * Math.pow(l, -1.4516), C.mid, 1.8, [2, 3]);
          g.fn(l => l >= 0.4 ? 0.5 * Math.pow(l, -6.738) : NaN, C.lt, 1.8, [6, 4]);
          g.txt('DISTRIBUTED', 0.0025, 400, C.mut, 'left', 10.5);
          g.txt('INTERMITTENT', 0.06, 8, C.mut, 'left', 10.5);
          g.txt('SEGREGATED', 0.0025, 0.06, C.mut, 'left', 10.5);
          g.cross(r.d.lam, r.d.NFr, C.acc, 9);
          g.dot(r.d.lam, r.d.NFr, C.acc, 5);
          const qmax = v.Qg * 2.4;
          let ymx = 0, ymn = 0;
          for (let i = 1; i <= 60; i++) { const c = r.calc(qmax * i / 60); ymx = Math.max(ymx, c.tot / 1000, c.dPf / 1000, c.dPe / 1000); ymn = Math.min(ymn, c.tot / 1000, c.dPe / 1000); }
          const g2 = self.mkG(ctx, { x: b.x + b.w / 2 + 12, y: b.y, w: w2, h: b.h, xmin: 0, xmax: qmax, ymin: Math.min(ymn * 1.1, 0), ymax: Math.max(ymx * 1.12, 1e-4), ml: 66 });
          g2.grid('Gas rate  (m\u00b3/h)', 'Gradient  (kPa/m)', 5, 5, null, t => self.f(t, 3));
          g2.title('Where the pressure goes');
          if (ymn < 0) g2.line([[0, 0], [qmax, 0]], C.mut, 1.2, [3, 3]);
          g2.fn(q => r.calc(Math.max(q, 1)).dPe / 1000, C.lt, 2, [6, 4]);
          g2.fn(q => r.calc(Math.max(q, 1)).dPf / 1000, C.mid, 2, [2, 3]);
          g2.fn(q => r.calc(Math.max(q, 1)).tot / 1000, C.dk, 2.8);
          g2.dot(v.Qg, r.d.tot / 1000, C.acc, 5.5);
          g2.txt('duty', v.Qg, r.d.tot / 1000 + (g2.o.ymax - g2.o.ymin) * 0.035, C.ink, 'center', 12);
          g2.legend([{ c: C.dk, l: 'total' }, { c: C.mid, l: 'friction', d: [2, 3] }, { c: C.lt, l: 'hydrostatic', d: [6, 4] }]);
        }
      },
      {
        id: 'batchdist',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const xD = self.rget(r, 'instantaneous x_d') || 0, xav = self.rget(r, 'average x_d') || 0;
  const Dk = self.rget(r, 'distillate collected') || 0, Bk = self.rget(r, 'residue left') || v.B0;
  const N = Math.max(0, Math.round(v.N));
  s.title('Batch still', N + ' stages above the pot \u00b7 ' + self.f(v.fd * 100, 0) + '% distilled');
  const colW = Math.max(42, Math.min(72, s.w * 0.1)), X = s.x + s.w * 0.30 - colW / 2;
  const potW = colW * 2.3, potH = Math.min(96, s.h * 0.3);
  const bot = s.y + s.h - 42, potTop = bot - potH;
  const top = s.y + 36;
  if (N > 0) s.column(X, top, colW, potTop - top - 6, { n: N, max: 14 });
  else { s.L([[X + colW / 2 - 7, top + 20], [X + colW / 2 - 7, potTop - 6]], { col: C.ink, lw: 1.5 }); s.L([[X + colW / 2 + 7, top + 20], [X + colW / 2 + 7, potTop - 6]], { col: C.ink, lw: 1.5 }); }
  const pX = X + colW / 2 - potW / 2;
  const pot = s.vessel(pX, potTop, potW, potH, { stroke: C.ink, lw: 1.6 });
  s.liquid(pot, pX, potTop, potW, potH, 0.12 + 0.76 * (1 - v.fd), C.soft3);
  s.T('still pot', pX + potW / 2, bot + 14, { align: 'center', size: 10, col: C.mut });
  const hot = s.temp(0.58 + 0.38 * self.cl01(v.V / 200));
  s.L([[pX - 54, bot - 12], [pX, bot - 12]], { col: hot, lw: 2.4, arrow: true });
  s.T('heat  V ' + self.f(v.V, 0), pX - 54, bot - 23, { size: 10.5, col: hot });
  const cx = X + colW / 2, rx = Math.max(cx + 90, s.x + s.w - 150);
  const cc = s.temp(0.32);
  s.L([[cx, top], [cx, top - 20], [rx + 8, top - 20]], { col: C.ink, lw: 1.4, arrow: true });
  s.unit(rx + 8, top - 33, 76, 26, 'COND', { col: cc, fill: s.temp(0.32, 0.18), tcol: cc, size: 10.5 });
  s.L([[rx + 46, top - 7], [rx + 46, top + 16]], { col: cc, lw: 1.5 });
  s.L([[rx + 46, top + 16], [rx + 18, top + 16], [rx + 18, top + 34], [X + colW, top + 34]], { col: C.acc, lw: 1.4, arrow: true });
  s.plate('R = ' + self.f(v.R, 2), (X + colW + rx + 18) / 2, top + 34, { col: C.acc, size: 10 });
  s.L([[rx + 46, top + 16], [rx + 74, top + 16], [rx + 74, top + 54]], { col: C.acc, lw: 1.4, arrow: true });
  const recW = 90, recH = Math.min(92, s.h * 0.3), recX = rx + 74 - recW / 2, recY = top + 58;
  const rec = s.vessel(recX, recY, recW, recH, { stroke: C.ink, lw: 1.4 });
  s.liquid(rec, recX, recY, recW, recH, self.cl01(Dk / Math.max(v.B0 * 0.9, 1e-9)), C.soft3);
  s.T('receiver', recX + recW / 2, recY + recH + 13, { align: 'center', size: 10, col: C.mut });
  s.T(self.f(Dk, 1) + ' kmol', recX + recW / 2, recY + recH + 26, { align: 'center', size: 10.5, col: C.acc });
  s.T('x\u0304_D ' + self.f(xav, 3), recX + recW / 2, recY + recH + 39, { align: 'center', size: 10.5, col: C.ink });
  s.badge(s.x, s.y + 2, 'In the pot', self.f(Bk, 1) + ' kmol', null, { w: 104 });
  s.badge(s.x, s.y + 44, 'x_D right now', self.f(xD, 3), 0.5 + 0.44 * self.cl01((0.6 - xD) / 0.5), { w: 104 });
},
        schemNote: 'The pot drains and the receiver fills as the cut fraction advances; the stage stack above the pot follows the theoretical-stage input. Instantaneous distillate purity reddens as it fades through the cut.',
        num: 'S-09', sec: SP, name: 'Batch distillation \u2014 Rayleigh',
        blurb: 'A batch still is a column whose feed keeps getting worse. As the light component leaves, everything left behind is heavier, so the distillate purity falls the whole time you are collecting it \u2014 and the average in the receiver is always poorer than the first drop.',
        howto: 'Three curves against the fraction already distilled: what is coming over right now, what has accumulated in the receiver, and what is left in the still. The gap between the top two is the whole argument for cutting the batch early. Add stages or reflux and the instantaneous curve flattens \u2014 that is what buys you a long, flat cut.',
        std: 'Rayleigh (1902) differential distillation; constant-reflux batch rectification stepped stage by stage \u2014 Treybal Ch. 9',
        eqs: [['\\ln\\frac{B_0}{B} = \\int_{x_B}^{x_0}\\frac{dx}{x_D(x) - x}', 'the Rayleigh equation'], ['y^* = \\frac{\\alpha x}{1 + (\\alpha-1)x}', 'constant relative volatility'], ['y_{n+1} = \\frac{R}{R+1}x_n + \\frac{x_D}{R+1}', 'operating line — stepped down N stages to find the still composition'], ['\\bar x_D = \\frac{B_0x_0 - Bx_B}{B_0 - B}', 'average composition in the receiver']],
        notes: ['Constant molal overflow, negligible column and condenser holdup.', 'Zero stages means a simple differential still \u2014 one equilibrium stage, no reflux.', 'Constant reflux ratio; the constant-distillate policy needs a rising R and is not modelled here.'],
        params: [P('alpha', 'Relative volatility \u03b1', 1.1, 8, 0.05, 2.5, null, '\u2014'), P('x0', 'Initial still composition x\u2080', 0.05, 0.95, 0.01, 0.4, null, 'mol frac'), P('N', 'Theoretical stages above still', 0, 12, 1, 3, null, '\u2014'), P('R', 'Reflux ratio', 0, 20, 0.25, 3, null, '\u2014'), P('B0', 'Charge to the still', 5, 2000, 5, 100, null, 'kmol'), P('V', 'Boil-up rate', 5, 500, 1, 40, null, 'kmol/h'), P('fd', 'Fraction distilled at cut', 0.05, 0.9, 0.01, 0.4, null, '\u2014')],
        compute: v => {
          const a = v.alpha, N = Math.round(v.N);
          const eq = x => a * x / (1 + (a - 1) * x);
          const inv = y => y / (a - (a - 1) * y);
          const xDof = xB => {
            if (N < 1) return eq(xB);
            const stillOf = xD => { let y = xD, x = xD; for (let i = 0; i < N; i++) { x = inv(y); y = Math.min(v.R / (v.R + 1) * x + xD / (v.R + 1), 1); } return x; };
            const f = xD => stillOf(xD) - xB;
            const hi = 1 - 1e-9;
            if (f(hi) <= 0) return hi;
            return self.bis(f, Math.min(xB + 1e-9, hi), hi, 1e-10);
          };
          const n = 160, xmin = Math.max(0.004, v.x0 * 0.03);
          const xs = [], curve = [];
          let acc = 0, prev = null;
          for (let i = 0; i <= n; i++) {
            const x = v.x0 - (v.x0 - xmin) * i / n;
            const xD = Math.min(Math.max(xDof(x), x + 1e-9), 1);
            const ig = 1 / (xD - x);
            if (prev) acc += (prev[1] + ig) / 2 * (prev[0] - x);
            prev = [x, ig];
            const BB = Math.exp(-acc), Fd = 1 - BB;
            const xav = Fd > 1e-9 ? (v.x0 - BB * x) / Fd : xD;
            xs.push({ x: x, xD: xD, Fd: Fd, xav: Math.min(xav, 1) });
            curve.push([Fd, xD]);
          }
          const at = fd => {
            for (let i = 1; i < xs.length; i++) if (xs[i].Fd >= fd) { const p = xs[i - 1], q = xs[i], t = (fd - p.Fd) / Math.max(q.Fd - p.Fd, 1e-12); return { x: p.x + t * (q.x - p.x), xD: p.xD + t * (q.xD - p.xD), xav: p.xav + t * (q.xav - p.xav) }; }
            return xs[xs.length - 1];
          };
          const fdmax = xs[xs.length - 1].Fd;
          const fd = Math.min(v.fd, fdmax * 0.995);
          const s = at(fd);
          const Dk = v.B0 * fd, Bk = v.B0 - Dk;
          const time = Dk * (v.R + 1) / v.V;
          return {
            xs: xs, fdmax: fdmax, fd: fd, s: s, xD0: xs[0].xD,
            res: [{ l: 'Distillate composition at start', v: xs[0].xD, u: 'mol frac', d: 4 }, { l: 'Instantaneous x_D at the cut', v: s.xD, u: 'mol frac', d: 4 }, { l: 'Average x_D in the receiver', v: s.xav, u: 'mol frac', d: 4 }, { l: 'Still composition x_B at the cut', v: s.x, u: 'mol frac', d: 4 }, { l: 'Distillate collected', v: Dk, u: 'kmol', d: 2 }, { l: 'Residue left in the still', v: Bk, u: 'kmol', d: 2 }, { l: 'Light-key recovery', v: Dk * s.xav / (v.B0 * v.x0) * 100, u: '%', d: 2 }, { l: 'Purity fade over the cut', v: (xs[0].xD - s.xD) * 100, u: 'mol %', d: 2 }, { l: 'Vapour raised', v: Dk * (v.R + 1), u: 'kmol', d: 1 }, { l: 'Batch time at boil-up', v: time, u: 'h', d: 2 }, { l: 'Reboiler duty basis', s: 'D\u00b7(R+1) at ' + self.f(v.V, 0) + ' kmol/h boil-up', u: '' }, { l: 'Maximum practical cut', v: fdmax * 100, u: '%', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const xmax = Math.min(r.fdmax, 0.98);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: xmax, ymin: 0, ymax: 1, ml: 70 });
          g.grid('Fraction of the charge distilled', 'Mole fraction light key', 5, 5, t => self.f(t * 100, 0) + '%', t => self.f(t, 2));
          g.title('Purity through the batch');
          g.line(r.xs.map(p => [p.Fd, p.xD]), C.dk, 2.8);
          g.line(r.xs.map(p => [p.Fd, p.xav]), C.acc, 2.2, [7, 4]);
          g.line(r.xs.map(p => [p.Fd, p.x]), C.mid, 2.2, [2, 3]);
          g.line([[0, v.x0], [xmax, v.x0]], C.mut, 1.2, [3, 3]);
          g.txt('charge x\u2080', xmax * 0.99, v.x0 + 0.018, C.mut, 'right', 10.5, 'bottom');
          g.line([[r.fd, 0], [r.fd, 1]], C.warn, 1.6, [5, 4]);
          g.dot(r.fd, r.s.xD, C.dk, 5);
          g.dot(r.fd, r.s.xav, C.acc, 5);
          g.txt('cut', r.fd, 0.035, C.warn, 'center', 11.5);
          g.legend([{ c: C.dk, l: 'instantaneous x\u1d05' }, { c: C.acc, l: 'accumulated average', d: [7, 4] }, { c: C.mid, l: 'still x\u0299', d: [2, 3] }]);
        }
      },
      {
        id: 'thermo', num: 'H-06', sec: HT, name: 'Vertical thermosyphon reboiler',
        blurb: 'A reboiler with no pump. Vapour generated in the tubes makes the riser lighter than the liquid leg feeding it, and that density difference drives the whole circulation \u2014 which means the flow is not something you set, it is something the loop settles at.',
        howto: 'The falling curve is the driving head the density difference can produce; the rising one is what the loop costs to push that flow around. They cross at the circulation the reboiler will actually run at. Push the duty up and the crossing slides left: less circulation, higher exit quality, and eventually dryout.',
        std: 'Circulation balance after Kern, Process Heat Transfer Ch. 15; homogeneous two-phase model; Fair (1960) design practice',
        eqs: [['\\Delta P_{drive} = \\rho_Lg z_{liq} - g\\int_0^L\\rho_{tp}\\,dz', 'liquid leg minus the lighter two-phase column'], ['\\frac{1}{\\rho_{tp}} = \\frac{x}{\\rho_g} + \\frac{1-x}{\\rho_L},\\qquad x(z) = x_{out}\\frac{z}{L}', 'homogeneous density with uniform heat input'], ['\\Delta P_{loss} = \\left(K_{in} + \\phi^2f\\frac{L}{D} + K_{out}\\right)\\frac{G^2}{2\\rho} + G^2\\left(\\frac{1}{\\rho_{out}} - \\frac{1}{\\rho_L}\\right)', 'entry, friction, exit and acceleration'], ['CR = \\frac{\\dot m_{circ}}{\\dot m_{vap}} = \\frac{1}{x_{out}}', 'circulation ratio is the inverse of exit quality']],
        notes: ['Homogeneous flow \u2014 no slip between phases. Real slip raises the driving head slightly.', 'Uniform heat flux along the tube; sensible preheat zone at the bottom is ignored.', 'Circulation ratios below about 4 (exit quality above 25%) risk dryout in the top of the tube.'],
        params: [P('Lt', 'Tube length', 1.5, 8, 0.1, 4, 'L'), P('di', 'Tube internal diameter', 12, 60, 0.5, 21.2, 'mm'), P('nt', 'Number of tubes', 10, 2000, 5, 300, null, '\u2014'), P('Q', 'Reboiler duty', 50, 20000, 50, 2500, null, 'kW'), P('lam', 'Latent heat', 100, 2500, 10, 320, null, 'kJ/kg'), P('rhoL', 'Liquid density', 300, 1200, 5, 620, 'rho'), P('rhog', 'Vapour density', 0.3, 60, 0.1, 8, 'rho'), P('muL', 'Liquid viscosity', 0.05, 5, 0.01, 0.25, null, 'cP'), P('zl', 'Liquid level / tube length', 0.5, 1.15, 0.01, 1, null, '\u2014'), P('Kd', 'Downcomer & inlet loss K', 0.5, 6, 0.1, 1.5, null, '\u2014')],
        compute: v => {
          const L = v.Lt, D = v.di / 1000, At = Math.PI * D * D / 4 * v.nt;
          const Wv = v.Q / v.lam;
          const rtp = x => 1 / (x / v.rhog + (1 - x) / v.rhoL);
          const headTP = xo => { let s = 0; const n = 48; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 0.5 : 1) * rtp(xo * i / n); return s / n * G0 * L; };
          const drive = W => { const xo = Math.min(Wv / W, 1); return v.rhoL * G0 * (v.zl * L) - headTP(xo); };
          const loss = W => {
            const G = W / At, xo = Math.min(Wv / W, 1);
            const Re = G * D / (v.muL * 1e-3), f = sw(Re, 0.00005);
            const phi = 1 + (xo / 2) * (v.rhoL / v.rhog - 1);
            const fric = f * (L / D) * G * G / (2 * v.rhoL) * phi;
            const inl = v.Kd * G * G / (2 * v.rhoL);
            const exi = 1.0 * G * G / (2 * rtp(xo));
            const acc = G * G * (1 / rtp(xo) - 1 / v.rhoL);
            return fric + inl + exi + acc;
          };
          const bal = W => drive(W) - loss(W);
          let Wop = NaN;
          const lo = Wv * 1.05, hi = Wv * 400;
          if (bal(lo) > 0) Wop = self.bis(bal, lo, hi, 1e-6);
          const W = isFinite(Wop) ? Wop : Wv * 1.05;
          const CR = W / Wv, xo = 1 / CR, G = W / At;
          const flux = v.Q * 1000 / (Math.PI * D * L * v.nt);
          const Re = G * D / (v.muL * 1e-3);
          const fluxmax = 0.44 * Math.pow(L / D, -0.25) * v.lam * 1000 * Math.sqrt(v.rhog) * Math.pow(9.80665 * v.rhog * (v.rhoL - v.rhog) * 0.02, 0.25) / 1e4;
          return {
            drive: drive, loss: loss, Wv: Wv, W: W, CR: CR, ok: isFinite(Wop),
            res: [{ l: 'Vapour generated', v: Wv * 3.6, u: '', cv: 'M', d: 1 }, { l: 'Circulation rate', v: W * 3.6, u: '', cv: 'M', d: 0 }, { l: 'Circulation ratio CR', v: CR, u: '\u2014', d: 2 }, { l: 'Exit vapour quality', v: xo * 100, u: 'wt %', d: 2 }, { l: 'Verdict', s: !isFinite(Wop) ? 'loop will not circulate \u2014 raise the level or shorten the tubes' : CR < 4 ? 'CR below 4 \u2014 dryout risk at the tube exit' : CR > 40 ? 'very high circulation \u2014 duty is small for this bundle' : 'healthy circulation', u: '' }, { l: 'Mass flux G', v: G, u: 'kg/m\u00b2\u00b7s', d: 1 }, { l: 'Inlet liquid velocity', v: G / v.rhoL, u: '', cv: 'vel', d: 2 }, { l: 'Exit two-phase velocity', v: G * (xo / v.rhog + (1 - xo) / v.rhoL), u: '', cv: 'vel', d: 2 }, { l: 'Tube Reynolds number (liquid)', v: Re, u: '\u2014', d: 0 }, { l: 'Driving head available', v: drive(W) / 1000, u: 'kPa', d: 3 }, { l: 'Static head of liquid leg', v: v.rhoL * G0 * v.zl * L / 1000, u: 'kPa', d: 3 }, { l: 'Heat flux', v: flux / 1000, u: 'kW/m\u00b2', d: 2 }, { l: 'Critical flux estimate', v: fluxmax, u: 'kW/m\u00b2', d: 1 }, { l: 'Flux as % of critical', v: flux / 1000 / Math.max(fluxmax, 1e-6) * 100, u: '%', d: 1 }, { l: 'Heat transfer area', v: Math.PI * D * L * v.nt, u: '', cv: 'A', d: 1 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const crmax = Math.max(r.CR * 2.2, 12);
          const Wof = cr => r.Wv * cr;
          let ymax = 0;
          for (let i = 1; i <= 60; i++) { const cr = 1.05 + (crmax - 1.05) * i / 60; ymax = Math.max(ymax, r.loss(Wof(cr)) / 1000, r.drive(Wof(cr)) / 1000); }
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1.05, xmax: crmax, ymin: 0, ymax: Math.max(ymax * 1.1, 0.5), ml: 74 });
          g.grid('Circulation ratio  CR', 'Head  (kPa)', 5, 5, null, t => self.f(t, 2));
          g.title('Where the loop settles');
          g.fn(cr => r.drive(Wof(cr)) / 1000, C.dk, 2.8);
          g.fn(cr => r.loss(Wof(cr)) / 1000, C.acc, 2.6, [7, 4]);
          g.fill([[1.05, 0], [4, 0], [4, ymax * 1.1], [1.05, ymax * 1.1]], C.soft2);
          g.txt('dryout risk', 4, ymax * 1.02, C.mut, 'right', 10.5);
          if (r.ok) {
            g.line([[r.CR, 0], [r.CR, r.drive(r.W) / 1000]], C.mut, 1.3, [4, 4]);
            g.dot(r.CR, r.drive(r.W) / 1000, C.acc, 6);
            g.txt('CR = ' + self.f(r.CR, 1) + '  \u00b7  x = ' + self.f(100 / r.CR, 1) + '%', r.CR, r.drive(r.W) / 1000 + ymax * 0.05, C.ink, 'center', 12);
          }
          g.legend([{ c: C.dk, l: 'driving head' }, { c: C.acc, l: 'circuit loss', d: [7, 4] }]);
        }
      },
      {
        id: 'agitation',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const Dimp = self.rget(r, 'impeller diameter') || v.T * v.dt;
  const Pw = self.rget(r, 'shaft power') || 0, PV = self.rget(r, 'specific power') || 0;
  const tip = self.rget(r, 'tip speed') || 0, Njs = self.rget(r, 'just-suspended speed') || 0;
  const cls = String(self.rget(r, 'duty class') || '');
  const settle = v.X > 0 && Njs > 0 && v.N < Njs;
  s.title('Agitated vessel', 'D/T ' + self.f(v.dt, 2) + ' \u00b7 Z/T ' + self.f(v.zt, 2) + ' \u00b7 ' + self.f(v.N, 0) + ' rpm');
  const Hm = v.zt * v.T, Dm = v.T;
  const sc = Math.min((s.h - 86) / Math.max(Hm + 0.12 * Dm, 0.1), (s.w * 0.46) / Math.max(Dm, 0.1));
  const Wt = Dm * sc, Ht = Hm * sc;
  const cx = s.x + s.w * 0.32, Y = s.y + 44;
  const pth = s.vessel(cx - Wt / 2, Y, Wt, Ht + Wt * 0.12, { stroke: C.ink, lw: 1.8 });
  s.liquid(pth, cx - Wt / 2, Y, Wt, Ht + Wt * 0.12, 0.92, C.soft3);
  s.vessel(cx - Wt / 2, Y, Wt, Ht + Wt * 0.12, { stroke: C.ink, lw: 1.8 });
  [-1, 1].forEach(sg => s.R(cx + sg * Wt * 0.42 - 3, Y + Wt * 0.1, 6, Ht * 0.86, { stroke: C.mut, lw: 1, fill: C.bg }));
  s.T('4 baffles', cx - Wt / 2 - 12, Y + Ht * 0.18, { size: 10, col: C.mut, align: 'right' });
  const Dp = Dimp * sc, iy = Y + Ht * 0.74;
  s.L([[cx, Y - 30], [cx, iy]], { col: C.ink, lw: 2.4 });
  s.R(cx - 18, Y - 52, 36, 22, { stroke: C.ink, lw: 1.4, fill: C.bg });
  s.T('M', cx, Y - 41, { align: 'center', size: 11, col: C.ink, bold: true });
  const ax = v.imp.indexOf('pbt') >= 0 || v.imp.indexOf('hydro') >= 0 || v.imp.indexOf('prop') >= 0 || v.imp.indexOf('axial') >= 0;
  if (v.imp.indexOf('rush') >= 0 || v.imp.indexOf('rdt') >= 0 || v.imp.indexOf('disc') >= 0) {
    s.L([[cx - Dp / 2, iy], [cx + Dp / 2, iy]], { col: C.acc, lw: 2.6 });
    for (let i = -2; i <= 2; i++) { if (!i) continue; s.R(cx + i * Dp * 0.2 - 3, iy - 8, 6, 16, { stroke: C.acc, lw: 1.4, fill: C.soft }); }
  } else if (ax) {
    s.L([[cx - Dp / 2, iy + 6], [cx - 6, iy - 4]], { col: C.acc, lw: 3.4, cap: 'round' });
    s.L([[cx + 6, iy + 4], [cx + Dp / 2, iy - 6]], { col: C.acc, lw: 3.4, cap: 'round' });
  } else {
    s.L([[cx - Dp / 2, iy], [cx + Dp / 2, iy]], { col: C.acc, lw: 3.4, cap: 'round' });
    s.L([[cx - Dp / 2, iy - 7], [cx - Dp / 2, iy + 7]], { col: C.acc, lw: 2.4 });
    s.L([[cx + Dp / 2, iy - 7], [cx + Dp / 2, iy + 7]], { col: C.acc, lw: 2.4 });
  }
  if (ax) { s.L([[cx, iy + 14], [cx, Y + Ht * 0.95]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); s.L([[cx - Wt * 0.34, Y + Ht * 0.9], [cx - Wt * 0.34, Y + Ht * 0.2]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); s.L([[cx + Wt * 0.34, Y + Ht * 0.9], [cx + Wt * 0.34, Y + Ht * 0.2]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); }
  else { s.L([[cx + Dp / 2 + 4, iy], [cx + Wt * 0.34, iy]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); s.L([[cx - Dp / 2 - 4, iy], [cx - Wt * 0.34, iy]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); s.L([[cx + Wt * 0.34, iy - 6], [cx + Wt * 0.34, Y + Ht * 0.25]], { col: C.mid, lw: 1.3, arrow: true, asz: 5 }); }
  if (v.X > 0) { const bedH = Math.max(3, Ht * 0.1 * self.cl01(v.X / 60) * (settle ? 2.4 : 0.5)); s.R(cx - Wt * 0.44, Y + Ht + Wt * 0.12 - bedH, Wt * 0.88, bedH, { stroke: null, fill: settle ? 'rgba(140,59,47,0.4)' : 'rgba(29,31,32,0.18)' }); }
  s.dim(cx - Wt / 2, Y + Ht + Wt * 0.12 + 28, cx + Wt / 2, Y + Ht + Wt * 0.12 + 28, 'T ' + self.f(self.cvt(v.T, 'L')[0], 2) + ' ' + self.cvt(0, 'L')[1], { col: C.mut });
  s.dim(cx - Dp / 2, iy + 26, cx + Dp / 2, iy + 26, 'D ' + self.f(self.cvt(Dimp, 'L')[0], 2), { col: C.acc });
  const bx = s.x + s.w - 176;
  s.badge(bx, s.y + 6, 'Shaft power', self.f(self.cvt(Pw, 'W')[0], 2) + ' ' + self.cvt(0, 'W')[1], 0.5 + 0.42 * self.cl01(Pw / 60), { w: 176 });
  s.badge(bx, s.y + 50, 'Specific power P/V', self.f(PV, 0) + ' W/m\u00b3', 0.5 + 0.42 * self.cl01(PV / 1200), { w: 176 });
  s.badge(bx, s.y + 94, 'Tip speed', self.f(self.cvt(tip, 'vel')[0], 2) + ' ' + self.cvt(0, 'vel')[1], null, { w: 176 });
  s.T(cls, bx, s.y + 148, { size: 11, col: C.mut });
  if (settle) s.T('below N_js ' + self.f(Njs, 0) + ' rpm \u2014 solids settle', bx, s.y + 166, { size: 11, col: C.warn, bold: true });
},
        schemNote: 'Tank, liquid level and impeller are drawn to the ratios you set, and the blade shape follows the impeller type \u2014 axial units push a loop down the shaft, radial ones throw outward. Drop below N_js and a settled layer appears.',
        num: 'E-04', sa: 0.72, sec: EQ, name: 'Agitation \u2014 power, blend time & suspension',
        blurb: 'Three questions about one impeller: how much power it draws, how long it takes to make the tank uniform, and how fast it must turn to keep solids off the floor. They pull in different directions \u2014 the speed that just suspends is rarely the speed that blends quickly.',
        howto: 'Left is the power curve for this impeller family: laminar on the falling leg, turbulent where it flattens, and your duty marked. Right is what that means in the tank \u2014 power climbing as the cube of speed while blend time falls only linearly, with the just-suspended speed drawn in. Below that line the solids are on the floor no matter what the power meter says.',
        std: 'Rushton et al. (1950) power curves; Grenville blend-time correlation (Chem. Eng. Res. Des. 1992); Zwietering (1958) just-suspended speed',
        eqs: [['P = N_p\\rho N^3D^5,\\qquad Re = \\frac{\\rho ND^2}{\\mu}', 'power draw and impeller Reynolds number'], ['N\\theta_{95} = \\frac{5.20}{N_p^{1/3}}\\left(\\frac{T}{D}\\right)^2', 'Grenville turbulent blend time'], ['N_{js} = S\\,\\nu^{0.1}d_p^{0.2}\\left(\\frac{g\\Delta\\rho}{\\rho_L}\\right)^{0.45}\\frac{X^{0.13}}{D^{0.85}}', 'Zwietering just-suspended speed'], ['Q_p = N_qND^3,\\qquad \\text{turnovers} = \\frac{Q_p}{V}', 'pumping capacity and tank turnover rate']],
        notes: ['Baffled tank, four baffles at T/12; unbaffled vessels swirl and draw far less power.', 'Blend time correlation is turbulent (Re > 10\u2074) \u2014 below that it lengthens sharply.', 'Zwietering S is quoted for D/T = 1/3 and off-bottom clearance T/4; it rises as clearance rises.'],
        params: [{ k: 'imp', label: 'Impeller', type: 'select', val: 'pbt', options: Object.keys(IMP).map(k => [k, IMP[k][0]]) }, P('T', 'Tank diameter', 0.3, 8, 0.05, 2.4, 'L'), P('dt', 'Impeller / tank diameter D/T', 0.2, 0.7, 0.01, 0.35, null, '\u2014'), P('zt', 'Liquid level / tank diameter Z/T', 0.5, 2, 0.05, 1, null, '\u2014'), P('N', 'Impeller speed', 5, 600, 1, 125, null, 'rpm'), P('rho', 'Liquid density', 500, 1600, 10, 1000, 'rho'), P('mu', 'Liquid viscosity', 0.5, 20000, 0.5, 5, null, 'cP'), P('dp', 'Particle diameter', 20, 3000, 10, 250, null, '\u03bcm'), P('rhos', 'Particle density', 800, 6000, 20, 2600, 'rho'), P('X', 'Solids loading', 0, 60, 0.5, 15, null, 'wt %')],
        compute: v => {
          const im = IMP[v.imp], Npt = im[1], Kp = im[2], Nq = im[3], Sz = im[4];
          const D = v.dt * v.T, Nr = v.N / 60, Z = v.zt * v.T;
          const Npof = Re => Kp / Math.max(Re, 1e-6) + Npt;
          const Reof = Nrps => v.rho * Nrps * D * D / (v.mu * 1e-3);
          const Re = Reof(Nr), Np = Npof(Re);
          const Pof = Nrps => Npof(Reof(Nrps)) * v.rho * Math.pow(Nrps, 3) * Math.pow(D, 5);
          const Pw = Pof(Nr);
          const V = Math.PI / 4 * v.T * v.T * Z;
          const th = Nrps => (5.20 / Math.pow(Npt, 1 / 3)) * Math.pow(v.T / D, 2) / Nrps;
          const nu = v.mu * 1e-3 / v.rho;
          const Xr = v.X > 0 ? v.X / Math.max(100 - v.X, 1e-6) * 100 : 0;
          const Njs = v.X > 0 ? Sz * Math.pow(nu, 0.1) * Math.pow(v.dp * 1e-6, 0.2) * Math.pow(G0 * Math.max(v.rhos - v.rho, 1) / v.rho, 0.45) * Math.pow(Xr, 0.13) / Math.pow(D, 0.85) : 0;
          const tip = Math.PI * Nr * D;
          const Qp = Nq * Nr * Math.pow(D, 3);
          return {
            Npof: Npof, Reof: Reof, Pof: Pof, th: th, Njs: Njs, Re: Re, Pw: Pw, D: D,
            res: [{ l: 'Impeller diameter', v: D, u: '', cv: 'L', d: 3 }, { l: 'Impeller Reynolds number', v: Re, u: '\u2014', d: 0 }, { l: 'Regime', s: Re > 1e4 ? 'fully turbulent' : Re > 10 ? 'transitional \u2014 correlations soften' : 'laminar', u: '' }, { l: 'Power number N_p', v: Np, u: '\u2014', d: 3 }, { l: 'Shaft power', v: Pw / 1000, u: '', cv: 'W', d: 3 }, { l: 'Liquid volume', v: V, u: '', cv: 'V', d: 2 }, { l: 'Specific power P/V', v: Pw / V, u: 'W/m\u00b3', d: 0 }, { l: 'Duty class', s: Pw / V < 50 ? 'gentle blending' : Pw / V < 250 ? 'general blending / heat transfer' : Pw / V < 800 ? 'solids suspension duty' : 'gas dispersion / hard duty', u: '' }, { l: 'Tip speed', v: tip, u: '', cv: 'vel', d: 2 }, { l: 'Blend time \u03b8\u2089\u2085', v: th(Nr), u: 's', d: 1 }, { l: 'Pumping capacity Q_p', v: Qp * 3600, u: '', cv: 'Q', d: 1 }, { l: 'Tank turnovers', v: Qp * 60 / V, u: 'per min', d: 2 }, { l: 'Just-suspended speed N_js', v: Njs * 60, u: 'rpm', d: 1 }, { l: 'Speed as multiple of N_js', v: Njs > 0 ? Nr / Njs : NaN, u: '\u2014', d: 2 }, { l: 'Power at N_js', v: Njs > 0 ? Pof(Njs) / 1000 : NaN, u: '', cv: 'W', d: 3 }, { l: 'Suspension verdict', s: v.X <= 0 ? 'no solids specified' : Nr < Njs ? 'below N_js \u2014 solids will settle' : Nr > 1.6 * Njs ? 'well above N_js \u2014 power being spent on nothing' : 'suspended with a sensible margin', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const w2 = b.w / 2 - 12;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: w2, h: b.h, xmin: 1, xmax: 1e6, ymin: 0.1, ymax: 100, xlog: true, ylog: true, ml: 52 });
          g.grid('Impeller Reynolds number', 'Power number  N\u209a', 4, 4);
          g.title('Power curve');
          Object.keys(IMP).forEach(k => {
            const o = IMP[k], sel = k === v.imp;
            g.fn(Re => o[2] / Re + o[1], sel ? C.dk : 'rgba(29,31,32,0.20)', sel ? 2.8 : 1.4);
          });
          g.line([[1e4, 0.1], [1e4, 100]], C.mut, 1.2, [4, 4]);
          g.txt('turbulent \u2192', 1.4e4, 0.14, C.mut, 'left', 10.5);
          g.cross(r.Re, r.Npof(r.Re), C.acc, 9);
          g.dot(r.Re, r.Npof(r.Re), C.acc, 5);
          const nmax = Math.max(v.N * 1.8, r.Njs * 60 * 1.4, 20), nmin = nmax * 0.3;
          let pmax = r.Pof(nmax / 60) / 1000;
          const g2 = self.mkG(ctx, { x: b.x + b.w / 2 + 12, y: b.y, w: w2, h: b.h, xmin: nmin, xmax: nmax, ymin: 0, ymax: pmax * 1.08, ml: 62, mr: 58 });
          g2.grid('Impeller speed  (rpm)', 'Shaft power  (' + self.cvt(0, 'W')[1] + ')', 5, 5, null, t => self.f(self.cvt(t, 'W')[0], 1));
          g2.title('Power & blend time');
          const thmax = r.th(nmin / 60);
          g2.fn(n => r.Pof(n / 60) / 1000, C.dk, 2.8);
          g2.fn(n => r.th(n / 60) / thmax * pmax * 1.08, C.mid, 2.2, [6, 4]);
          ctx.save();
          ctx.fillStyle = C.mid; ctx.font = '12.5px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          [0.25, 0.5, 0.75, 1].forEach(fr => ctx.fillText(self.f(thmax * fr, 0) + ' s', g2.x + g2.w + 8, g2.Y(pmax * 1.08 * fr)));
          ctx.restore();
          if (r.Njs > 0) {
            g2.line([[r.Njs * 60, 0], [r.Njs * 60, pmax * 1.08]], C.warn, 1.6, [5, 4]);
            g2.txt('N\u2c7c\u209b', r.Njs * 60, pmax * 1.02, C.warn, 'right', 11);
          }
          g2.dot(v.N, r.Pw / 1000, C.acc, 5.5);
          g2.legend([{ c: C.dk, l: 'power' }, { c: C.mid, l: 'blend time', d: [6, 4] }]);
        }
      },
      {
        id: 'relief',
        schem: (ctx, b, v, r) => {
  const s = self.mkS(ctx, b);
  const A = self.rget(r, 'required orifice area') || 0;
  const pick = String(self.rget(r, 'selected api 526') || '');
  const dor = self.rget(r, 'selected orifice diameter') || 0;
  const crit = String(self.rget(r, 'flow condition') || '');
  const spare = self.rget(r, 'spare capacity') || 0;
  const P1 = self.rget(r, 'relieving pressure') || 0;
  s.title('Relief valve on the vessel', pick || 'no single valve fits');
  const W = Math.min(150, s.w * 0.24), X = s.x + s.w * 0.28 - W / 2;
  const Y = s.y + 108, H = Math.min(s.h - 170, 130);
  const pf = self.cl01(v.Pset / 60);
  const pth = s.vessel(X, Y, W, H, { stroke: s.temp(0.5 + 0.4 * pf), lw: 1.9, fill: s.temp(0.5 + 0.4 * pf, 0.12) });
  if (v.svc === 'liq') s.liquid(pth, X, Y, W, H, 0.6, C.soft3);
  s.T(self.f(v.Pset, 1) + ' barg set', X + W / 2, Y + H * 0.56, { align: 'center', size: 12, col: s.temp(0.5 + 0.4 * pf), bold: true });
  s.T(v.svc === 'liq' ? 'liquid' : v.svc === 'stm' ? 'steam' : 'vapour', X + W / 2, Y + H * 0.56 + 17, { align: 'center', size: 10.5, col: C.mut, caps: true });
  const nx = X + W * 0.5, ny = Y - 6;
  s.L([[nx, ny], [nx, ny - 22]], { col: C.ink, lw: 8 });
  s.L([[nx, ny], [nx, ny - 22]], { col: C.bg, lw: 5 });
  const bodyY = ny - 60;
  s.L([[nx - 17, ny - 22], [nx + 17, ny - 22], [nx + 17, bodyY + 10], [nx - 17, bodyY + 10]], { col: C.acc, lw: 1.6, close: true, fill: C.soft });
  s.L([[nx - 23, bodyY - 16], [nx + 23, bodyY - 16], [nx + 23, bodyY + 10], [nx - 23, bodyY + 10]], { col: C.acc, lw: 1.6, close: true, fill: C.bg });
  s.L([[nx, bodyY - 16], [nx, bodyY - 34]], { col: C.ink, lw: 2 });
  for (let i = 0; i < 5; i++) s.L([[nx - 9, bodyY - 20 - i * 4], [nx + 9, bodyY - 22 - i * 4]], { col: C.ink, lw: 1.3 });
  s.R(nx - 13, bodyY - 42, 26, 9, { stroke: C.ink, lw: 1.3, fill: C.bg });
  s.L([[nx + 23, bodyY - 3], [nx + 86, bodyY - 3]], { col: C.mid, lw: 3.2, arrow: true });
  s.T('to flare / atmosphere', nx + 26, bodyY - 15, { size: 10.5, col: C.mid });
  s.T(self.f(v.Pb, 1) + ' barg backpressure', nx + 26, bodyY + 10, { size: 10, col: C.mut });
  s.T('PSV', nx - 30, bodyY - 3, { size: 11, col: C.acc, bold: true, align: 'right', caps: true });
  const ox = s.x + s.w - 196, oy = s.y + s.h - 108;
  const sc = 46 / Math.sqrt(Math.max(A, 1));
  const rr = Math.min(42, Math.sqrt(Math.max(A, 1) / Math.PI) * sc);
  s.T('orifice, to scale', ox + 46, oy - 54, { align: 'center', size: 10, col: C.mut, caps: true });
  s.circ(ox + 46, oy, Math.max(rr, 3), { stroke: C.acc, lw: 1.8, fill: C.soft3 });
  s.T(self.f(A, 1) + ' mm\u00b2', ox + 46, oy + Math.max(rr, 3) + 16, { align: 'center', size: 11, col: C.ink });
  s.T('d ' + self.f(self.cvt(dor, 'mm')[0], 1) + ' ' + self.cvt(0, 'mm')[1], ox + 46, oy + Math.max(rr, 3) + 31, { align: 'center', size: 10.5, col: C.acc });
  s.badge(s.x + s.w - 196, s.y + 6, 'Relieving pressure', self.f(P1, 2) + ' bar a', 0.5 + 0.4 * pf, { w: 196 });
  s.badge(s.x + s.w - 196, s.y + 50, 'Flow condition', crit, null, { w: 196 });
  if (isFinite(spare)) s.T('spare capacity on the selection ' + self.f(spare, 1) + '%', s.x, s.y + s.h - 14, { size: 10.5, col: spare < 0 ? C.warn : C.mut });
},
        schemNote: 'The valve sits on its nozzle with the orifice drawn to the computed area \u2014 step the set pressure or the load and the bore grows until the next API 526 letter is needed.',
        num: 'E-05', sec: EQ, name: 'Relief valve orifice sizing (API 520)',
        blurb: 'The last line of defence, and the one calculation with a legally required answer. Work out the area the relieving case needs, then round up to the next lettered orifice \u2014 because API 526 only makes fourteen of them and you are buying one of those, not the number you computed.',
        howto: 'The sloping line is required area against relieving load; the horizontal lines are the standard orifices. Read across from your load to find the first letter above the line \u2014 that is the valve you buy, and the vertical distance to it is the spare capacity you get for free. Watch what happens to the line when backpressure pushes the flow subcritical.',
        std: 'API Std 520 Part I, 10th ed. (sizing) and API Std 526 (lettered orifice areas)',
        eqs: [['A = \\frac{W}{CK_dP_1K_bK_c}\\sqrt{\\frac{TZ}{M}}', 'critical vapour flow — area in mm², W in kg/h, P₁ in kPa abs'], ['C = 0.03948\\sqrt{k\\left(\\frac{2}{k+1}\\right)^{\\frac{k+1}{k-1}}},\\qquad P_{cf} = P_1\\left(\\frac{2}{k+1}\\right)^{\\frac{k}{k-1}}', 'gas constant and the critical-flow pressure'], ['A = \\frac{11.78\\,Q}{K_dK_wK_cK_v}\\sqrt{\\frac{G}{P_1-P_2}}', 'liquid service — Q in L/min'], ['A = \\frac{190.4\\,W}{P_1K_dK_bK_cK_NK_{SH}}', 'saturated and superheated steam']],
        notes: ['Relieving pressure = set \u00d7 (1 + overpressure) + atmospheric; 10% is the standard non-fire case, 21% for fire.', 'K_d = 0.975 for a certified vapour valve, 0.65 for liquid, 0.62 for a rupture disc alone.', 'Backpressure correction K_b applies to conventional valves only \u2014 a balanced bellows or pilot valve changes the curve.'],
        params: [{ k: 'svc', label: 'Service', type: 'select', val: 'vap', options: [['vap', 'Vapour or gas'], ['liq', 'Liquid'], ['stm', 'Steam']] }, P('W', 'Relieving load (vapour / steam)', 100, 500000, 100, 25000, null, 'kg/h'), P('Ql', 'Relieving load (liquid)', 10, 20000, 10, 1500, null, 'L/min'), P('Pset', 'Set pressure', 0.5, 200, 0.5, 15, null, 'barg'), P('ovp', 'Overpressure', 10, 21, 1, 10, null, '%'), P('Pb', 'Total backpressure', 0, 60, 0.5, 1, null, 'barg'), P('MW', 'Molecular weight', 2, 200, 0.5, 44, null, 'kg/kmol'), P('T', 'Relieving temperature', -50, 600, 5, 150, 'T'), P('k', 'Heat capacity ratio k', 1.05, 1.7, 0.01, 1.15, null, '\u2014'), P('Z', 'Compressibility Z', 0.5, 1.2, 0.01, 0.95, null, '\u2014'), P('SG', 'Liquid specific gravity', 0.4, 2, 0.01, 0.85, null, '\u2014'), P('Kd', 'Discharge coefficient K_d', 0.6, 0.99, 0.005, 0.975, null, '\u2014')],
        compute: v => {
          const Patm = 101.325;
          const P1 = v.Pset * 100 * (1 + v.ovp / 100) + Patm;
          const P2 = v.Pb * 100 + Patm;
          const k = v.k, TK = v.T + 273.15;
          const Cg = 0.03948 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
          const Pcf = P1 * Math.pow(2 / (k + 1), k / (k - 1));
          const crit = P2 <= Pcf;
          const rp = Math.min(P2 / P1, 0.999);
          const F2 = Math.sqrt((k / (k - 1)) * Math.pow(rp, 2 / k) * ((1 - Math.pow(rp, (k - 1) / k)) / (1 - rp)));
          const Kb = crit || v.svc !== 'vap' ? 1 : Math.max(Math.min(F2 / Math.sqrt((k / (k - 1)) * Math.pow(Pcf / P1, 2 / k) * ((1 - Math.pow(Pcf / P1, (k - 1) / k)) / (1 - Pcf / P1))), 1), 0.4);
          const KN = P1 > 10339 ? (0.02764 * P1 - 1000) / (0.03324 * P1 - 1061) : 1;
          const Kw = v.svc === 'liq' && v.Pb > 0 ? Math.max(0.97 - 0.6 * (P2 - Patm) / (v.Pset * 100), 0.6) : 1;
          const Aof = load => {
            if (v.svc === 'liq') return 11.78 * load / (v.Kd * Kw) * Math.sqrt(v.SG / Math.max(P1 - P2, 1));
            if (v.svc === 'stm') return 190.4 * load / (P1 * v.Kd * KN);
            if (crit) return load / (Cg * v.Kd * P1 * Kb) * Math.sqrt(TK * v.Z / v.MW);
            return 17.9 * load / (F2 * v.Kd) * Math.sqrt(TK * v.Z / (v.MW * P1 * Math.max(P1 - P2, 1)));
          };
          const load = v.svc === 'liq' ? v.Ql : v.W;
          const A = Aof(load);
          let pick = null;
          for (let i = 0; i < API526.length; i++) if (API526[i][1] >= A) { pick = API526[i]; break; }
          const dor = pick ? Math.sqrt(4 * pick[1] / Math.PI) : NaN;
          return {
            Aof: Aof, A: A, pick: pick, load: load, crit: crit,
            res: [{ l: 'Relieving pressure P\u2081', v: P1 / 100, u: 'bar a', d: 3 }, { l: 'Total backpressure', v: P2 / 100, u: 'bar a', d: 3 }, { l: 'Backpressure as % of set', v: (P2 - Patm) / (v.Pset * 100) * 100, u: '%', d: 1 }, { l: 'Flow condition', s: v.svc === 'liq' ? 'liquid \u2014 incompressible' : crit ? 'critical (choked) flow' : 'subcritical \u2014 backpressure is limiting', u: '' }, { l: 'Critical flow pressure P_cf', v: Pcf / 100, u: 'bar a', d: 3 }, { l: 'Coefficient C', v: Cg, u: '\u2014', d: 5 }, { l: 'Backpressure factor K_b', v: Kb, u: '\u2014', d: 4 }, { l: 'Superheat / KN factor', v: v.svc === 'stm' ? KN : 1, u: '\u2014', d: 4 }, { l: 'Required orifice area', v: A, u: 'mm\u00b2', d: 1 }, { l: 'Selected API 526 orifice', s: pick ? pick[0] + '  (' + pick[1] + ' mm\u00b2)' : 'above T \u2014 use multiple valves', u: '' }, { l: 'Selected orifice diameter', v: dor, u: '', cv: 'mm', d: 2 }, { l: 'Spare capacity on selection', v: pick ? (pick[1] / A - 1) * 100 : NaN, u: '%', d: 1 }, { l: 'Capacity of selected valve', v: pick ? load * pick[1] / A : NaN, u: v.svc === 'liq' ? 'L/min' : 'kg/h', d: 0 }],
            table: {
              title: 'API 526 lettered orifices \u2014 load each one covers',
              head: ['Letter', 'Area  mm\u00b2', 'Bore  mm', v.svc === 'liq' ? 'Capacity  L/min' : 'Capacity  kg/h', ''],
              rows: API526.map(o => [o[0], String(o[1]), (Math.sqrt(4 * o[1] / Math.PI)).toFixed(1), self.f(load * o[1] / A, 0), pick && o[0] === pick[0] ? 'selected' : o[1] < A ? 'too small' : ''])
            }
          };
        },
        draw: (ctx, b, v, r) => {
          const lmax = r.load * 2.6;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: lmax, ymin: 40, ymax: 20000, ylog: true, ml: 66, mr: 40 });
          g.grid('Relieving load  (' + (v.svc === 'liq' ? 'L/min' : 'kg/h') + ')', 'Orifice area  (mm\u00b2)', 5, 4);
          g.title('Required area against the standard orifices');
          API526.forEach(o => {
            const sel = r.pick && o[0] === r.pick[0];
            g.line([[0, o[1]], [lmax, o[1]]], sel ? C.acc : 'rgba(29,31,32,0.16)', sel ? 1.8 : 1);
            g.txt(o[0], lmax * 1.008, o[1], sel ? C.acc : C.mut, 'left', sel ? 11.5 : 10.5);
          });
          g.fn(l => Math.max(r.Aof(l), 40), C.dk, 2.8);
          g.line([[r.load, 40], [r.load, r.A]], C.mut, 1.3, [4, 4]);
          g.dot(r.load, r.A, C.acc, 5.5);
          g.txt(self.f(r.A, 0) + ' mm\u00b2', r.load, r.A * 1.16, C.ink, 'center', 12);
          g.legend([{ c: C.dk, l: 'required area' }, { c: C.acc, l: r.pick ? 'orifice ' + r.pick[0] : 'no standard fit' }]);
        }
      }
    ];
  }
