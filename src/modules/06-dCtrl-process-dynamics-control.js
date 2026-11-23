  dCtrl() {
    const self = this, C = this.C;
    const S = 'Process Dynamics & Control';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });

    /* closed-loop simulator: FOPDT process, ideal PID, optional load step */
    const sim = o => {
      const n = 1600, dt = o.tmax / n;
      const nd = Math.max(0, Math.round((o.th || 0) / dt));
      const buf = []; for (let i = 0; i <= nd; i++) buf.push(0);
      let y = 0, I = 0, yprev = 0, iae = 0, ise = 0, itae = 0, ymax = -1e30, ymin = 1e30, u = 0;
      const yp = [[0, 0]], up = [[0, 0]];
      const umax = o.umax || 1e6;
      for (let i = 1; i <= n; i++) {
        const t = i * dt;
        const sp = t >= (o.tsp !== undefined ? o.tsp : 0) ? (o.sp || 0) : 0;
        const d = t >= (o.td !== undefined ? o.td : 1e30) ? (o.dist || 0) : 0;
        const e = sp - y;
        const dydt = (y - yprev) / dt;
        if (o.tI > 0) I += e * dt;
        u = o.Kc * (e + (o.tI > 0 ? I / o.tI : 0) - (o.tD || 0) * dydt);
        if (u > umax) { u = umax; if (o.tI > 0) I -= e * dt; }
        if (u < -umax) { u = -umax; if (o.tI > 0) I -= e * dt; }
        buf.push(u);
        const ud = buf[buf.length - 1 - nd];
        yprev = y;
        if (o.integrating) y = y + dt * (o.Kp * ud + (o.Kd !== undefined ? o.Kd : 1) * d);
        else y = y + dt * (-y + o.Kp * ud + (o.Kd !== undefined ? o.Kd : 1) * d) / o.tau;
        iae += Math.abs(e) * dt; ise += e * e * dt; itae += t * Math.abs(e) * dt;
        if (y > ymax) ymax = y; if (y < ymin) ymin = y;
        yp.push([t, y]); up.push([t, u]);
      }
      return { y: yp, u: up, iae: iae, ise: ise, itae: itae, ymax: ymax, ymin: ymin, yend: y, dt: dt };
    };

    /* tuning correlations from an FOPDT model */
    const tune = (Kp, tau, th, method, form, lam) => {
      const R = th / tau, K = Kp;
      let Kc = 1, tI = 0, tD = 0;
      if (method === 'zn') {
        if (form === 'P') { Kc = tau / (K * th); }
        else if (form === 'PI') { Kc = 0.9 * tau / (K * th); tI = 3.33 * th; }
        else { Kc = 1.2 * tau / (K * th); tI = 2 * th; tD = 0.5 * th; }
      } else if (method === 'cc') {
        if (form === 'P') { Kc = (1 / K) * (1 / R) * (1 + R / 3); }
        else if (form === 'PI') { Kc = (1 / K) * (1 / R) * (0.9 + R / 12); tI = th * (30 + 3 * R) / (9 + 20 * R); }
        else { Kc = (1 / K) * (1 / R) * (4 / 3 + R / 4); tI = th * (32 + 6 * R) / (13 + 8 * R); tD = th * 4 / (11 + 2 * R); }
      } else if (method === 'imc') {
        const lc = Math.max(lam, 0.1 * th, 0.05 * tau);
        if (form === 'PI') { Kc = tau / (K * (lc + th)); tI = tau; }
        else if (form === 'P') { Kc = tau / (K * (lc + th)); }
        else { Kc = (tau + th / 2) / (K * (lc + th / 2)); tI = tau + th / 2; tD = tau * th / (2 * tau + th); }
      } else if (method === 'itae') {
        if (form === 'PI') { Kc = (0.586 / K) * Math.pow(R, -0.916); tI = tau / (1.03 - 0.165 * R); }
        else { Kc = (0.965 / K) * Math.pow(R, -0.85); tI = tau / (0.796 - 0.147 * R); tD = 0.308 * tau * Math.pow(R, 0.929); }
      } else if (method === 'tl') {
        const Ku = Math.PI / (K * Math.sin(Math.PI * th / (2 * tau + 2 * th) * 0 + 1e-9) || 1);
        const w = self.bis(x => -x * th - Math.atan(x * tau) + Math.PI, 1e-4, 500 / Math.max(th, 1e-3), 1e-9);
        const K2 = Math.abs(K) / Math.sqrt(1 + Math.pow(w * tau, 2));
        const Kuu = 1 / K2, Pu = 2 * Math.PI / w;
        if (form === 'PI') { Kc = Kuu / 3.2; tI = 2.2 * Pu; }
        else { Kc = Kuu / 2.2; tI = 2.2 * Pu; tD = Pu / 6.3; }
      }
      return { Kc: Kc, tI: tI, tD: tD };
    };
    const ultimate = (Kp, tau, th) => {
      const w = self.bis(x => Math.PI - x * th - Math.atan(x * tau), 1e-5, 400 / Math.max(th, 1e-4), 1e-11);
      const ar = Math.abs(Kp) / Math.sqrt(1 + Math.pow(w * tau, 2));
      return { wu: w, Ku: 1 / ar, Pu: 2 * Math.PI / w };
    };
    const TMETH = [['zn', 'Ziegler\u2013Nichols (open loop)'], ['cc', 'Cohen\u2013Coon'], ['imc', 'IMC / lambda tuning'], ['itae', 'ITAE (set-point)'], ['tl', 'Tyreus\u2013Luyben']];
    const TFORM = [['P', 'P only'], ['PI', 'PI'], ['PID', 'PID']];

    return [
      {
        id: 'fopdt', num: 'C-01', sec: S, name: 'First-order plus dead time \u2014 the process model',
        blurb: 'Almost every self-regulating loop in a plant is fitted, for tuning purposes, to three numbers: a steady-state gain, a time constant and a dead time. This module builds that model and shows the step response it predicts, together with the tangent construction that reads the parameters back off a chart recorder trace.',
        howto: 'Move the dead time and watch the controllability ratio \u03b8/\u03c4 at the right. Below 0.1 the loop is easy and almost any tuning works; above 1 the dead time dominates and no feedback controller can do much \u2014 that is when you reach for feedforward or a Smith predictor. The dashed tangent at the inflection is the classical reaction-curve construction: where it crosses zero gives \u03b8, where it crosses the final value gives \u03b8 + \u03c4.',
        std: 'Seborg, Edgar, Mellichamp & Doyle, Process Dynamics and Control, 4th ed., Ch. 5 & 7',
        eqs: [['G_p(s) = \\frac{K_p e^{-\\theta s}}{\\tau s + 1}', 'the transfer function every tuning rule assumes'], ['y(t) = K_p M\\left(1 - e^{-(t-\\theta)/\\tau}\\right),\\quad t \\ge \\theta', 'step response of magnitude M'], ['\\left.\\frac{dy}{dt}\\right|_{t=\\theta^+} = \\frac{K_pM}{\\tau}', 'initial slope \u2014 the reaction rate of the curve'], ['\\frac{\\theta}{\\tau} < 0.1 \\ \\text{easy},\\quad > 1 \\ \\text{dead-time dominant}', 'controllability ratio']],
        notes: ['Linear, time-invariant, single input\u2013single output.', 'Dead time is pure transport delay, not a lag approximation.', 'At t = \u03b8 + \u03c4 the response has reached 63.2 % of its final change.'],
        params: [P('Kp', 'Process gain K\u209a', -5, 5, 0.05, 2, null, '%/%'), P('tau', 'Time constant \u03c4', 0.5, 40, 0.5, 8, null, 'min'), P('th', 'Dead time \u03b8', 0, 25, 0.1, 2, null, 'min'), P('M', 'Step magnitude M', 0.5, 20, 0.5, 5, null, '%'), P('tmax', 'Time window', 5, 200, 5, 60, null, 'min')],
        compute: v => {
          const dy = v.Kp * v.M, R = v.th / Math.max(v.tau, 1e-9);
          const grade = R < 0.1 ? 'easy \u2014 tight control achievable' : R < 0.3 ? 'straightforward feedback' : R < 1 ? 'moderate \u2014 detune, expect overshoot' : 'dead-time dominant \u2014 use feedforward or a Smith predictor';
          const u = ultimate(v.Kp, v.tau, v.th);
          return {
            dy: dy, R: R,
            res: [{ l: 'Final change \u0394y', v: dy, u: '%', d: 3 }, { l: 'Initial slope', v: dy / v.tau, u: '%/min', d: 4 }, { l: 't at 63.2 % (\u03b8+\u03c4)', v: v.th + v.tau, u: 'min', d: 2 }, { l: 't at 95 %', v: v.th + 3 * v.tau, u: 'min', d: 2 }, { l: 't at 98 %', v: v.th + 3.912 * v.tau, u: 'min', d: 2 }, { l: 'Controllability \u03b8/\u03c4', v: R, u: '\u2014', d: 3 }, { l: 'Loop difficulty', s: grade, u: '' }, { l: 'Ultimate gain K\u1d64', v: u.Ku, u: '\u2014', d: 3 }, { l: 'Ultimate period P\u1d64', v: u.Pu, u: 'min', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const lo = Math.min(0, r.dy) * 1.25 - 0.1, hi = Math.max(0, r.dy) * 1.25 + 0.1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: lo, ymax: hi, ml: 66 });
          g.grid('Time  min', 'Response  %');
          g.title('Open-loop step response');
          g.line([[0, r.dy], [v.tmax, r.dy]], C.lt, 1.2, [6, 4]);
          g.line([[0, 0.632 * r.dy], [v.th + v.tau, 0.632 * r.dy]], 'rgba(29,31,32,0.18)', 1, [3, 3]);
          g.line([[v.th, lo], [v.th, hi]], 'rgba(29,31,32,0.2)', 1, [4, 4]);
          g.line([[v.th, 0], [v.th + v.tau, r.dy]], C.mid, 1.5, [7, 4]);
          g.fn(t => t <= v.th ? 0 : r.dy * (1 - Math.exp(-(t - v.th) / v.tau)), C.acc, 2.8, null, 400);
          g.dot(v.th + v.tau, 0.632 * r.dy, C.dk, 4.5);
          if (g.w > 300) {
            g.txt('\u03b8', v.th, lo + 0.06 * (hi - lo), C.mut, 'center', 12);
            g.txt('63.2 %', v.tmax * 0.02, 0.632 * r.dy, C.mut, 'left', 11);
            g.txt('tangent \u2192 \u03b8 + \u03c4', v.th + v.tau, r.dy * 0.5, C.mid, 'left', 11);
          }
          g.legend([{ c: C.acc, l: 'y(t)' }, { c: C.mid, l: 'reaction-curve tangent', d: [7, 4] }]);
        }
      },
      {
        id: 'sord', num: 'C-02', sec: S, name: 'Second-order dynamics & damping',
        blurb: 'Two lags in series, or one lag with an inertial element, give a second-order response whose whole character is set by a single number \u2014 the damping ratio. Overshoot, decay ratio, ringing period and settling time all follow from \u03b6 alone; the time constant only sets the clock.',
        howto: 'Sweep \u03b6 through 1. Above it the response is sluggish but monotonic; below it every quarter turn of \u03b6 buys speed at the price of overshoot. \u03b6 = 0.707 is the usual compromise \u2014 about 4 % overshoot and the fastest settling. The quarter-amplitude decay that Ziegler\u2013Nichols aims at corresponds to \u03b6 \u2248 0.215, which most modern practice considers too lively.',
        std: 'Seborg et al., Process Dynamics and Control, 4th ed., Ch. 5; Coughanowr & LeBlanc, Ch. 8',
        eqs: [['G(s) = \\frac{K_p}{\\tau^2s^2 + 2\\zeta\\tau s + 1}', 'standard second-order form'], ['OS = \\exp\\!\\left(\\frac{-\\pi\\zeta}{\\sqrt{1-\\zeta^2}}\\right),\\quad DR = OS^2', 'overshoot and decay ratio depend on \u03b6 only'], ['T = \\frac{2\\pi\\tau}{\\sqrt{1-\\zeta^2}},\\quad t_p = \\frac{T}{2}', 'ringing period and time to first peak'], ['t_s \\approx \\frac{4\\tau}{\\zeta}', '\u00b12 % settling time']],
        notes: ['Underdamped analytic solution used for \u03b6 < 1, critically damped for \u03b6 = 1, overdamped otherwise.', 'Interacting first-order lags always give \u03b6 \u2265 1; overshoot requires energy storage or a controller.', 'Inverse response (right-half-plane zero) is a separate pathology, not captured here.'],
        params: [P('Kp', 'Process gain K\u209a', 0.2, 5, 0.05, 1, null, '\u2014'), P('tau', 'Time constant \u03c4', 0.5, 20, 0.1, 3, null, 'min'), P('z', 'Damping ratio \u03b6', 0.05, 3, 0.01, 0.5, null, '\u2014'), P('M', 'Step magnitude M', 0.5, 10, 0.5, 1, null, '\u2014'), P('tmax', 'Time window', 5, 150, 1, 40, null, 'min')],
        compute: v => {
          const z = v.z, tau = v.tau, yss = v.Kp * v.M;
          const under = z < 1;
          const OS = under ? Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) : 0;
          const T = under ? 2 * Math.PI * tau / Math.sqrt(1 - z * z) : NaN;
          const y = t => {
            const x = t / tau;
            if (z < 0.999) { const s = Math.sqrt(1 - z * z); return yss * (1 - Math.exp(-z * x) * (Math.cos(s * x) + (z / s) * Math.sin(s * x))); }
            if (z <= 1.001) return yss * (1 - (1 + x) * Math.exp(-x));
            const s = Math.sqrt(z * z - 1); return yss * (1 - Math.exp(-z * x) * (Math.cosh(s * x) + (z / s) * Math.sinh(s * x)));
          };
          const tr = self.bis(t => y(t) - yss, 1e-4, v.tmax, 1e-6);
          return {
            y: y, yss: yss, OS: OS, T: T, under: under,
            res: [{ l: 'Steady-state value', v: yss, u: '\u2014', d: 3 }, { l: 'Damping ratio \u03b6', v: z, u: '\u2014', d: 3 }, { l: 'Character', s: z < 1 ? 'underdamped \u2014 oscillatory' : z < 1.001 ? 'critically damped' : 'overdamped \u2014 no overshoot', u: '' }, { l: 'Overshoot', v: OS * 100, u: '%', d: 2 }, { l: 'Decay ratio', v: OS * OS, u: '\u2014', d: 4 }, { l: 'Period of ringing T', v: T, u: 'min', d: 2 }, { l: 'Time to first peak', v: T / 2, u: 'min', d: 2 }, { l: 'Rise time (first crossing)', v: under && isFinite(tr) ? tr : NaN, u: 'min', d: 2 }, { l: 'Settling time (\u00b12 %)', v: 4 * tau / z, u: 'min', d: 1 }, { l: 'Natural frequency \u03c9\u2099', v: 1 / tau, u: 'rad/min', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const hi = Math.max(r.yss * (1 + r.OS) * 1.15, r.yss * 1.2), lo = Math.min(0, r.yss * (1 - r.OS * 1.2));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: lo, ymax: hi, ml: 62 });
          g.grid('Time  min', 'Response');
          g.title('Second-order step response');
          g.line([[0, r.yss], [v.tmax, r.yss]], C.lt, 1.2, [6, 4]);
          g.fill([[0, r.yss * 0.98], [v.tmax, r.yss * 0.98], [v.tmax, r.yss * 1.02], [0, r.yss * 1.02]], C.soft);
          [0.25, 0.5, 0.707, 1, 1.5].forEach(zz => {
            if (Math.abs(zz - v.z) < 0.02) return;
            const s = Math.sqrt(Math.abs(1 - zz * zz));
            g.fn(t => { const x = t / v.tau; return zz < 1 ? r.yss * (1 - Math.exp(-zz * x) * (Math.cos(s * x) + (zz / s) * Math.sin(s * x))) : zz === 1 ? r.yss * (1 - (1 + x) * Math.exp(-x)) : r.yss * (1 - Math.exp(-zz * x) * (Math.cosh(s * x) + (zz / s) * Math.sinh(s * x))); }, 'rgba(29,31,32,0.13)', 1.2, null, 300);
          });
          if (r.under) g.fn(t => r.yss * (1 + Math.exp(-v.z * t / v.tau)), C.lt, 1.2, [4, 4], 200);
          g.fn(t => r.y(t), C.acc, 2.8, null, 500);
          if (r.under && isFinite(r.T)) g.dot(r.T / 2, r.yss * (1 + r.OS), C.dk, 4.5);
          g.legend([{ c: C.acc, l: '\u03b6 = ' + v.z.toFixed(2) }, { c: 'rgba(29,31,32,0.13)', l: '\u03b6 = 0.25, 0.5, 0.707, 1, 1.5' }]);
        }
      },
      {
        id: 'pidtune', num: 'C-03', sec: S, name: 'PID tuning correlations',
        blurb: 'Five published rule sets translate the same three-parameter process model into controller settings, and they disagree by a factor of three. This runs all of them against your model, simulates the closed loop for the one you pick, and scores the result on integral error.',
        howto: 'Start with the model from C-01, then compare. Ziegler\u2013Nichols is fast and oscillatory \u2014 it was designed for quarter-amplitude decay on disturbances. Cohen\u2013Coon is more aggressive still on dead-time-dominant loops. IMC gives you a single tuning knob \u03bb: raise it and the loop becomes slower and more robust, which is what you want on a noisy or interacting loop. Tyreus\u2013Luyben is the conservative choice for integrating and distillation loops.',
        std: 'Ziegler & Nichols (1942); Cohen & Coon (1953); Rivera, Morari & Skogestad IMC (1986); Tyreus & Luyben (1992); Smith & Corripio ITAE',
        eqs: [['K_c = \\frac{1.2\\,\\tau}{K_p\\theta},\\quad \\tau_I = 2\\theta,\\quad \\tau_D = 0.5\\theta', 'Ziegler\u2013Nichols PID, open-loop form'], ['K_c = \\frac{1}{K_p}\\frac{\\tau}{\\theta}\\left(\\frac{4}{3}+\\frac{\\theta}{4\\tau}\\right)', 'Cohen\u2013Coon proportional gain'], ['K_c = \\frac{\\tau + \\theta/2}{K_p(\\lambda + \\theta/2)},\\quad \\tau_I = \\tau + \\frac{\\theta}{2}', 'IMC-PID with filter time \u03bb'], ['p(t) = \\bar p + K_c\\!\\left[e + \\frac{1}{\\tau_I}\\!\\int\\! e\\,dt - \\tau_D\\frac{dy}{dt}\\right]', 'ideal PID with derivative on measurement']],
        notes: ['Derivative acts on the measurement, not the error \u2014 no set-point kick.', 'Integral windup limited by clamping the controller output at \u00b1100 %.', 'IMC \u03bb is floored at 0.1\u03b8 to keep the design realisable.', 'Simulation is a unit set-point step with a load step later in the window.'],
        params: [P('Kp', 'Process gain K\u209a', 0.1, 5, 0.05, 1.5, null, '\u2014'), P('tau', 'Time constant \u03c4', 0.5, 40, 0.5, 10, null, 'min'), P('th', 'Dead time \u03b8', 0.2, 25, 0.1, 3, null, 'min'), SEL('meth', 'Tuning rule', 'imc', TMETH), SEL('form', 'Controller form', 'PID', TFORM), P('lam', 'IMC filter \u03bb', 0.2, 40, 0.1, 4, null, 'min'), P('tmax', 'Time window', 10, 300, 5, 90, null, 'min')],
        compute: v => {
          const t0 = tune(v.Kp, v.tau, v.th, v.meth, v.form, v.lam);
          const s = sim({ Kp: v.Kp, tau: v.tau, th: v.th, Kc: t0.Kc, tI: t0.tI, tD: t0.tD, sp: 1, td: v.tmax * 0.55, dist: 0.5, tmax: v.tmax, umax: 100 });
          const u = ultimate(v.Kp, v.tau, v.th);
          const rows = TMETH.map(m => {
            const t = tune(v.Kp, v.tau, v.th, m[0], v.form, v.lam);
            const ss = sim({ Kp: v.Kp, tau: v.tau, th: v.th, Kc: t.Kc, tI: t.tI, tD: t.tD, sp: 1, td: 1e30, tmax: v.tmax, umax: 100 });
            return [m[1], t.Kc.toPrecision(3), t.tI ? t.tI.toPrecision(3) : '\u2014', t.tD ? t.tD.toPrecision(3) : '\u2014', ((ss.ymax - 1) * 100).toFixed(1) + ' %', ss.iae.toPrecision(3)];
          });
          return {
            s: s, t0: t0,
            res: [{ l: 'Controller gain K_c', v: t0.Kc, u: '\u2014', d: 4 }, { l: 'Integral time \u03c4_I', v: t0.tI || NaN, u: 'min', d: 3 }, { l: 'Derivative time \u03c4_D', v: t0.tD || NaN, u: 'min', d: 3 }, { l: 'Ultimate gain K\u1d64', v: u.Ku, u: '\u2014', d: 3 }, { l: 'Gain ratio K_c/K\u1d64', v: t0.Kc / u.Ku, u: '\u2014', d: 3 }, { l: 'Set-point overshoot', v: (s.ymax - 1) * 100, u: '%', d: 1 }, { l: 'IAE (whole run)', v: s.iae, u: '\u2014', d: 3 }, { l: 'ITAE', v: s.itae, u: '\u2014', d: 2 }, { l: 'Residual offset', v: Math.abs(1 - s.yend), u: '\u2014', d: 4 }, { l: 'Verdict', s: (s.ymax - 1) > 0.4 ? 'too aggressive \u2014 detune or raise \u03bb' : v.form === 'P' ? 'offset remains \u2014 add integral action' : 'acceptable closed-loop behaviour', u: '' }],
            table: { title: 'Tuning rules compared \u2014 ' + v.form + ' form, set-point step', head: ['Rule', 'K_c', '\u03c4_I  min', '\u03c4_D  min', 'Overshoot', 'IAE'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: -0.3, ymax: Math.max(1.8, r.s.ymax * 1.15), ml: 60 });
          g.grid('Time  min', 'Controlled variable');
          g.title('Closed loop \u2014 set-point step, then load step');
          g.line([[0, 1], [v.tmax, 1]], C.lt, 1.3, [6, 4]);
          g.line([[v.tmax * 0.55, -0.3], [v.tmax * 0.55, 3]], 'rgba(29,31,32,0.18)', 1, [4, 4]);
          g.line(r.s.y, C.acc, 2.6);
          g.line(r.s.u.map(p => [p[0], p[1] * 0.25]), C.mid, 1.4, [5, 3]);
          if (g.w > 300) g.txt('load step', v.tmax * 0.55, -0.22, C.mut, 'center', 11);
          g.legend([{ c: C.acc, l: 'y(t)' }, { c: C.lt, l: 'set point', d: [6, 4] }, { c: C.mid, l: 'controller output \u00d70.25', d: [5, 3] }]);
        }
      },
      {
        id: 'clsim', num: 'C-04', sec: S, name: 'Closed-loop simulator \u2014 servo & regulator',
        blurb: 'The tuning constants themselves as the sliders. Two questions matter for any loop and they have different answers: how well does it follow a new set point, and how well does it reject a load change? This runs both on the same model so you can see the trade.',
        howto: 'Turn integral action off (\u03c4_I to its maximum) and watch offset appear \u2014 that is the whole argument for reset. Then shorten \u03c4_I until the response rings: integral action is destabilising, always. Derivative buys back some phase and lets you raise K_c, but it amplifies measurement noise, which is why so many plant loops run PI. The regulator curve is the one that matters most in practice \u2014 set points rarely move.',
        std: 'Seborg et al., Ch. 11\u201312; Marlin, Process Control, 2nd ed., Ch. 8',
        eqs: [['\\frac{Y}{Y_{sp}} = \\frac{G_cG_p}{1+G_cG_p}', 'servo (set-point) transfer function'], ['\\frac{Y}{D} = \\frac{G_d}{1+G_cG_p}', 'regulator (load) transfer function'], ['e_{ss} = \\frac{1}{1+K_cK_p}\\ \\text{(P only)},\\qquad e_{ss}=0\\ \\text{with integral}', 'offset'], ['IAE = \\int_0^\\infty |e|\\,dt,\\quad ITAE = \\int_0^\\infty t|e|\\,dt', 'performance integrals']],
        notes: ['Ideal (non-interacting) PID, derivative on measurement.', 'Load disturbance enters at the process output with the same first-order dynamics.', 'Output clamped at \u00b1100 % with conditional integration anti-windup.'],
        params: [P('Kp', 'Process gain K\u209a', 0.1, 5, 0.05, 1.5, null, '\u2014'), P('tau', 'Time constant \u03c4', 0.5, 40, 0.5, 10, null, 'min'), P('th', 'Dead time \u03b8', 0, 20, 0.1, 3, null, 'min'), P('Kc', 'Controller gain K_c', 0.02, 20, 0.02, 1.2, null, '\u2014'), P('tI', 'Integral time \u03c4_I', 0.2, 120, 0.2, 12, null, 'min'), P('tD', 'Derivative time \u03c4_D', 0, 20, 0.1, 0, null, 'min'), P('dist', 'Load step magnitude', -2, 2, 0.05, 0.5, null, '\u2014'), P('tmax', 'Time window', 10, 400, 10, 120, null, 'min')],
        compute: v => {
          const servo = sim({ Kp: v.Kp, tau: v.tau, th: v.th, Kc: v.Kc, tI: v.tI >= 119 ? 0 : v.tI, tD: v.tD, sp: 1, td: 1e30, tmax: v.tmax, umax: 100 });
          const reg = sim({ Kp: v.Kp, tau: v.tau, th: v.th, Kc: v.Kc, tI: v.tI >= 119 ? 0 : v.tI, tD: v.tD, sp: 0, td: v.tmax * 0.05, dist: v.dist, tmax: v.tmax, umax: 100 });
          const u = ultimate(v.Kp, v.tau, v.th);
          const offset = v.tI >= 119 ? 1 / (1 + v.Kc * v.Kp) : 0;
          const stable = v.Kc < u.Ku;
          return {
            servo: servo, reg: reg,
            res: [{ l: 'Ultimate gain K\u1d64', v: u.Ku, u: '\u2014', d: 3 }, { l: 'Gain margin on K_c', v: u.Ku / v.Kc, u: '\u2014', d: 2 }, { l: 'Stability', s: stable ? (u.Ku / v.Kc > 1.7 ? 'stable with adequate margin' : 'stable but close to the limit') : 'UNSTABLE \u2014 reduce K_c', u: '' }, { l: 'Servo overshoot', v: (servo.ymax - 1) * 100, u: '%', d: 1 }, { l: 'Servo IAE', v: servo.iae, u: '\u2014', d: 3 }, { l: 'Servo ITAE', v: servo.itae, u: '\u2014', d: 2 }, { l: 'Predicted P-only offset', v: offset, u: '\u2014', d: 4 }, { l: 'Peak load deviation', v: Math.max(Math.abs(reg.ymax), Math.abs(reg.ymin)), u: '\u2014', d: 4 }, { l: 'Regulator IAE', v: reg.iae, u: '\u2014', d: 3 }, { l: 'Load offset remaining', v: Math.abs(reg.yend), u: '\u2014', d: 4 }, { l: 'Integral action', s: v.tI >= 119 ? 'off \u2014 P only' : v.tI < v.th ? 'very fast reset \u2014 expect ringing' : 'active', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const hi = Math.max(1.6, r.servo.ymax * 1.12, r.reg.ymax * 1.3);
          const lo = Math.min(-0.25, r.reg.ymin * 1.3);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: lo, ymax: hi, ml: 60 });
          g.grid('Time  min', 'Deviation from steady state');
          g.title('Servo and regulator responses');
          g.line([[0, 1], [v.tmax, 1]], C.lt, 1.2, [6, 4]);
          g.line([[0, 0], [v.tmax, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g.line(r.servo.y, C.acc, 2.6);
          g.line(r.reg.y, C.dk, 2.4, [8, 4]);
          g.legend([{ c: C.acc, l: 'set-point step' }, { c: C.dk, l: 'load step', d: [8, 4] }, { c: C.lt, l: 'set point', d: [6, 4] }]);
        }
      },
      {
        id: 'bode', num: 'C-05', sec: S, name: 'Bode plot & stability margins',
        blurb: 'Feedback goes unstable when the loop returns a signal that is as large as it started and exactly out of phase. The Bode plot puts amplitude ratio and phase lag on the same frequency axis so you can read off how much gain and how much extra lag the loop can absorb before that happens.',
        howto: 'Find the crossover frequency where the phase curve hits \u2212180\u00b0; the amplitude ratio there, inverted, is the gain margin \u2014 aim for 1.7 to 2. Then find where the amplitude ratio is 1; how far the phase is above \u2212180\u00b0 there is the phase margin, and 30\u201345\u00b0 is the usual target. Dead time is pure phase lag with no amplitude penalty, which is exactly why it is so corrosive to feedback.',
        std: 'Seborg et al., Ch. 14; Marlin, Ch. 10; Luyben, Process Modeling, Simulation and Control, Ch. 13',
        eqs: [['G_{OL}(i\\omega) = K_c\\!\\left(1+\\frac{1}{i\\tau_I\\omega}+i\\tau_D\\omega\\right)\\frac{K_pe^{-i\\theta\\omega}}{1+i\\tau\\omega}', 'open-loop frequency response'], ['AR = |G_{OL}|,\\qquad \\phi = \\angle G_{OL}', 'amplitude ratio and phase angle'], ['GM = \\frac{1}{AR|_{\\phi=-180^\\circ}},\\qquad PM = 180^\\circ + \\phi|_{AR=1}', 'the two margins'], ['\\text{dead time: } \\phi = -\\theta\\omega \\ \\text{rad},\\ AR = 1', 'lag without attenuation']],
        notes: ['Bode stability criterion assumes an open-loop-stable process with a monotonic phase curve.', 'Amplitude ratio plotted on log\u2013log axes, phase on a linear axis mapped to the same frame.', 'Set \u03c4_D = 0 for a PI controller; set K_c = 1 and \u03c4_I large to see the bare process.'],
        params: [P('Kp', 'Process gain K\u209a', 0.1, 5, 0.05, 1.5, null, '\u2014'), P('tau', 'Time constant \u03c4', 0.5, 40, 0.5, 10, null, 'min'), P('th', 'Dead time \u03b8', 0.05, 20, 0.05, 3, null, 'min'), P('Kc', 'Controller gain K_c', 0.02, 20, 0.02, 1, null, '\u2014'), P('tI', 'Integral time \u03c4_I', 0.5, 200, 0.5, 15, null, 'min'), P('tD', 'Derivative time \u03c4_D', 0, 20, 0.1, 0, null, 'min')],
        compute: v => {
          const AR = w => v.Kc * Math.sqrt(1 + Math.pow(v.tD * w - 1 / (v.tI * w), 2)) * Math.abs(v.Kp) / Math.sqrt(1 + Math.pow(v.tau * w, 2));
          const PH = w => (Math.atan(v.tD * w - 1 / (v.tI * w)) - v.th * w - Math.atan(v.tau * w)) * 180 / Math.PI;
          const wu = self.bis(w => PH(w) + 180, 1e-4, 300, 1e-10);
          const GM = isFinite(wu) ? 1 / AR(wu) : Infinity;
          const wc = self.bis(w => Math.log(AR(w)), 1e-4, 300, 1e-10);
          const PM = isFinite(wc) ? 180 + PH(wc) : NaN;
          const good = GM >= 1.7 && PM >= 30;
          return {
            AR: AR, PH: PH, wu: wu, wc: wc, GM: GM, PM: PM,
            res: [{ l: 'Crossover frequency \u03c9_co', v: wu, u: 'rad/min', d: 4 }, { l: 'AR at \u2212180\u00b0', v: AR(wu), u: '\u2014', d: 4 }, { l: 'Gain margin GM', v: GM, u: '\u2014', d: 3 }, { l: 'Unity-gain frequency \u03c9_g', v: wc, u: 'rad/min', d: 4 }, { l: 'Phase margin PM', v: PM, u: '\u00b0', d: 1 }, { l: 'Ultimate period at \u03c9_co', v: 2 * Math.PI / wu, u: 'min', d: 2 }, { l: 'Max allowable K_c', v: v.Kc * GM, u: '\u2014', d: 3 }, { l: 'Extra dead time tolerated', v: PM * Math.PI / 180 / wc, u: 'min', d: 2 }, { l: 'Verdict', s: !isFinite(GM) || GM < 1 ? 'UNSTABLE closed loop' : good ? 'robust \u2014 both margins met' : GM < 1.7 ? 'gain margin thin \u2014 detune' : 'phase margin thin \u2014 expect overshoot', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.56, h2 = b.h - h1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 1e-3, xmax: 30, ymin: 1e-3, ymax: 1e3, xlog: true, ylog: true, ml: 64, mb: 22, mt: 32 });
          g.grid('', 'Amplitude ratio');
          g.title('Bode diagram \u2014 open loop');
          g.line([[1e-3, 1], [30, 1]], C.lt, 1.2, [6, 4]);
          g.fn(w => Math.min(Math.max(r.AR(w), 1e-3), 1e3), C.acc, 2.6, null, 320);
          if (isFinite(r.wu)) { g.line([[r.wu, 1e-3], [r.wu, 1e3]], 'rgba(29,31,32,0.2)', 1, [4, 4]); g.dot(r.wu, Math.min(Math.max(r.AR(r.wu), 1e-3), 1e3), C.dk, 4.5); }
          if (isFinite(r.wc)) g.dot(r.wc, 1, C.acc, 4.5);
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: h2, xmin: 1e-3, xmax: 30, ymin: -360, ymax: 90, xlog: true, ml: 64, mt: 10, mb: 46 });
          g2.grid('Frequency  rad/min', 'Phase  deg', 5, 5);
          g2.line([[1e-3, -180], [30, -180]], C.lt, 1.2, [6, 4]);
          g2.fn(w => Math.max(r.PH(w), -360), C.acc, 2.6, null, 320);
          if (isFinite(r.wu)) { g2.line([[r.wu, -360], [r.wu, 90]], 'rgba(29,31,32,0.2)', 1, [4, 4]); g2.dot(r.wu, -180, C.dk, 4.5); }
          if (isFinite(r.wc)) g2.dot(r.wc, Math.max(r.PH(r.wc), -360), C.acc, 4.5);
        }
      },
      {
        id: 'nyq', num: 'C-06', sec: S, name: 'Nyquist plot & direct-substitution stability',
        blurb: 'The same information as the Bode plot, drawn as one curve in the complex plane. Encircle the point (\u22121, 0) and the closed loop is unstable; the distance of closest approach is a single robustness number that neither margin captures alone.',
        howto: 'Watch the curve swell as K_c rises \u2014 stability is lost the moment it swallows the critical point. The maximum sensitivity M_s is the reciprocal of the shortest distance to (\u22121, 0), and it bounds both margins at once: M_s < 2 is a well-tuned loop, M_s > 2.5 is fragile. Direct substitution, in the results panel, gives the same ultimate gain algebraically by setting s = i\u03c9 on the characteristic equation.',
        std: 'Seborg et al., Ch. 14; \u00c5str\u00f6m & H\u00e4gglund, Advanced PID Control, Ch. 4',
        eqs: [['1 + G_cG_p = 0', 'characteristic equation \u2014 roots must lie in the left half plane'], ['s = i\\omega_u:\\quad |G_cG_p| = 1,\\ \\angle G_cG_p = -180^\\circ', 'direct substitution for the stability limit'], ['M_s = \\max_\\omega \\left|\\frac{1}{1+G_{OL}(i\\omega)}\\right|', 'maximum sensitivity'], ['GM \\ge \\frac{M_s}{M_s-1},\\qquad PM \\ge 2\\arcsin\\frac{1}{2M_s}', 'margins bounded by M\u209b']],
        notes: ['Curve traced for \u03c9 from 10\u207b\u00b3 to 10\u00b2 rad/min.', 'Open-loop-stable process assumed, so the Nyquist criterion reduces to encirclement of \u22121.', 'M\u209b evaluated on the same frequency grid.'],
        params: [P('Kp', 'Process gain K\u209a', 0.1, 5, 0.05, 1.5, null, '\u2014'), P('tau', 'Time constant \u03c4', 0.5, 40, 0.5, 10, null, 'min'), P('th', 'Dead time \u03b8', 0.05, 20, 0.05, 3, null, 'min'), P('Kc', 'Controller gain K_c', 0.02, 20, 0.02, 1, null, '\u2014'), P('tI', 'Integral time \u03c4_I', 0.5, 200, 0.5, 15, null, 'min'), P('tD', 'Derivative time \u03c4_D', 0, 20, 0.1, 0, null, 'min')],
        compute: v => {
          const pts = []; let Ms = 0, wMs = 0, dmin = 1e9;
          for (let i = 0; i <= 900; i++) {
            const w = Math.pow(10, -3 + 5 * i / 900);
            const gc = { re: v.Kc, im: v.Kc * (v.tD * w - 1 / (v.tI * w)) };
            const den = 1 + Math.pow(v.tau * w, 2);
            const gp = { re: v.Kp * (Math.cos(v.th * w) - v.tau * w * Math.sin(v.th * w)) / den, im: v.Kp * (-Math.sin(v.th * w) - v.tau * w * Math.cos(v.th * w)) / den };
            const re = gc.re * gp.re - gc.im * gp.im, im = gc.re * gp.im + gc.im * gp.re;
            pts.push([re, im]);
            const d = Math.hypot(re + 1, im);
            if (d < dmin) { dmin = d; wMs = w; }
          }
          Ms = 1 / dmin;
          const u = ultimate(v.Kp, v.tau, v.th);
          const KuLoop = u.Ku;
          return {
            pts: pts, Ms: Ms, dmin: dmin,
            res: [{ l: 'Ultimate gain of process K\u1d64', v: KuLoop, u: '\u2014', d: 3 }, { l: 'Ultimate frequency \u03c9\u1d64', v: u.wu, u: 'rad/min', d: 4 }, { l: 'Ultimate period P\u1d64', v: u.Pu, u: 'min', d: 2 }, { l: 'Closest approach to (\u22121,0)', v: dmin, u: '\u2014', d: 4 }, { l: 'Maximum sensitivity M\u209b', v: Ms, u: '\u2014', d: 3 }, { l: 'Frequency at M\u209b', v: wMs, u: 'rad/min', d: 4 }, { l: 'Implied GM bound', v: Ms / (Ms - 1), u: '\u2014', d: 2 }, { l: 'Implied PM bound', v: 2 * Math.asin(1 / (2 * Ms)) * 180 / Math.PI, u: '\u00b0', d: 1 }, { l: 'Robustness', s: Ms < 1.6 ? 'conservative \u2014 could be faster' : Ms < 2 ? 'well tuned' : Ms < 2.5 ? 'aggressive' : 'fragile \u2014 detune', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let mx = 1.6; r.pts.forEach(p => { mx = Math.max(mx, Math.abs(p[0]), Math.abs(p[1])); });
          mx = Math.min(mx * 1.1, 12);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -mx, xmax: mx * 0.6, ymin: -mx, ymax: mx * 0.6, ml: 60 });
          g.grid('Real', 'Imaginary');
          g.title('Nyquist locus of G_c G_p');
          g.line([[-mx, 0], [mx, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g.line([[0, -mx], [0, mx]], 'rgba(29,31,32,0.22)', 1.1);
          g.clip(() => {
            ctx.save(); ctx.strokeStyle = C.lt; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(g.X(0), g.Y(0), Math.abs(g.X(1) - g.X(0)), 0, 7); ctx.stroke();
            ctx.strokeStyle = C.soft3; ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(g.X(-1), g.Y(0), Math.abs(g.X(r.dmin) - g.X(0)), 0, 7); ctx.stroke(); ctx.restore();
          });
          g.line(r.pts, C.acc, 2.4);
          g.line(r.pts.map(p => [p[0], -p[1]]), 'rgba(29,31,32,0.15)', 1.4, [5, 3]);
          g.cross(-1, 0, C.warn, 8);
          if (g.w > 300) { g.txt('\u22121', -1, -mx * 0.07, C.warn, 'center', 12); g.txt('unit circle', 0.72, 0.72, C.mid, 'left', 11); }
          g.legend([{ c: C.acc, l: '\u03c9 > 0' }, { c: 'rgba(29,31,32,0.15)', l: 'mirror image', d: [5, 3] }, { c: C.soft3, l: '1/M\u209b circle' }]);
        }
      },
      {
        id: 'cascade', num: 'C-07', sec: S, name: 'Cascade control',
        blurb: 'A second, faster measurement placed between the valve and the slow output. The inner loop swallows disturbances before they reach the primary variable, and it linearises the valve for the outer loop \u2014 which is why nearly every temperature loop in a plant is really a cascade onto flow.',
        howto: 'The ratio of inner to outer time constant is the whole story: cascade pays when the secondary loop is at least three to five times faster. Set the ratio near 1 and the two loops fight each other. Then put the disturbance in the inner loop and compare the two curves \u2014 that is the case cascade was invented for, and the improvement is often an order of magnitude.',
        std: 'Seborg et al., Ch. 16; Shinskey, Process Control Systems, 4th ed., Ch. 6',
        eqs: [['G_{inner} = \\frac{K_{c2}G_{p2}}{1+K_{c2}G_{p2}}', 'the inner loop becomes the outer loop\u2019s process'], ['\\frac{Y_1}{D_2} = \\frac{G_{p1}G_{d2}}{(1+G_{c2}G_{p2})(1+G_{c1}G_{inner}G_{p1})}', 'inner-loop disturbance attenuated twice'], ['\\tau_{2} \\lesssim \\tfrac{1}{3}\\tau_{1}', 'the design rule for cascade to pay'], ['K_{c2}\\ \\text{high, P-only; } G_{c1}\\ \\text{PI}', 'usual tuning \u2014 inner tight, outer with reset']],
        notes: ['Both loops modelled as first order plus dead time; inner loop P-only, outer PI.', 'Disturbance enters the secondary process, the classic cascade case.', 'The single-loop comparison uses the same outer controller onto the full process.'],
        params: [P('Kp1', 'Primary gain K\u209a\u2081', 0.2, 5, 0.05, 1, null, '\u2014'), P('t1', 'Primary time constant \u03c4\u2081', 2, 60, 1, 20, null, 'min'), P('th1', 'Primary dead time \u03b8\u2081', 0, 15, 0.1, 1, null, 'min'), P('Kp2', 'Secondary gain K\u209a\u2082', 0.2, 5, 0.05, 1, null, '\u2014'), P('t2', 'Secondary time constant \u03c4\u2082', 0.2, 30, 0.1, 2, null, 'min'), P('Kc2', 'Inner gain K_c\u2082', 0.5, 40, 0.5, 8, null, '\u2014'), P('Kc1', 'Outer gain K_c\u2081', 0.05, 15, 0.05, 1.5, null, '\u2014'), P('tI1', 'Outer integral \u03c4_I\u2081', 1, 120, 1, 20, null, 'min'), P('dist', 'Load step into inner loop', -2, 2, 0.05, 1, null, '\u2014'), P('tmax', 'Time window', 20, 400, 10, 150, null, 'min')],
        compute: v => {
          const n = 2000, dt = v.tmax / n, nd = Math.max(0, Math.round(v.th1 / dt));
          const run = casc => {
            let y1 = 0, y2 = 0, I = 0; const buf = []; for (let i = 0; i <= nd; i++) buf.push(0);
            const pts = [[0, 0]]; let iae = 0, pk = 0;
            for (let i = 1; i <= n; i++) {
              const t = i * dt, d = t >= v.tmax * 0.08 ? v.dist : 0;
              const e = -y1; I += e * dt;
              const uo = v.Kc1 * (e + I / v.tI1);
              let u2;
              if (casc) { u2 = v.Kc2 * (uo - y2); } else { u2 = uo; }
              y2 = y2 + dt * (-y2 + v.Kp2 * u2 + d) / v.t2;
              buf.push(y2);
              const y2d = buf[buf.length - 1 - nd];
              y1 = y1 + dt * (-y1 + v.Kp1 * y2d) / v.t1;
              iae += Math.abs(e) * dt; pk = Math.max(pk, Math.abs(y1));
              pts.push([t, y1]);
            }
            return { pts: pts, iae: iae, pk: pk };
          };
          const A = run(true), B = run(false);
          const ratio = v.t1 / v.t2;
          return {
            A: A, B: B,
            res: [{ l: 'Time-constant ratio \u03c4\u2081/\u03c4\u2082', v: ratio, u: '\u2014', d: 2 }, { l: 'Cascade suitable?', s: ratio >= 5 ? 'yes \u2014 inner loop is much faster' : ratio >= 3 ? 'marginal but usually worthwhile' : 'no \u2014 loops will interact', u: '' }, { l: 'Inner-loop gain K_c\u2082K\u209a\u2082', v: v.Kc2 * v.Kp2, u: '\u2014', d: 2 }, { l: 'Inner closed-loop \u03c4', v: v.t2 / (1 + v.Kc2 * v.Kp2), u: 'min', d: 3 }, { l: 'Inner-loop offset', v: 1 / (1 + v.Kc2 * v.Kp2), u: '\u2014', d: 4 }, { l: 'Peak deviation \u2014 cascade', v: A.pk, u: '\u2014', d: 4 }, { l: 'Peak deviation \u2014 single loop', v: B.pk, u: '\u2014', d: 4 }, { l: 'Peak reduction', v: (1 - A.pk / Math.max(B.pk, 1e-12)) * 100, u: '%', d: 1 }, { l: 'IAE \u2014 cascade', v: A.iae, u: '\u2014', d: 3 }, { l: 'IAE \u2014 single loop', v: B.iae, u: '\u2014', d: 3 }, { l: 'IAE improvement factor', v: B.iae / Math.max(A.iae, 1e-12), u: '\u00d7', d: 2 }]
          };
        },
        draw: (ctx, b, v, r) => {
          let mx = 0.05; r.A.pts.concat(r.B.pts).forEach(p => { mx = Math.max(mx, Math.abs(p[1])); });
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: -mx * 1.2, ymax: mx * 1.2, ml: 62 });
          g.grid('Time  min', 'Primary variable deviation');
          g.title('Inner-loop disturbance \u2014 cascade against single loop');
          g.line([[0, 0], [v.tmax, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g.line(r.B.pts, C.mid, 2.2, [8, 4]);
          g.line(r.A.pts, C.acc, 2.8);
          g.legend([{ c: C.acc, l: 'cascade' }, { c: C.mid, l: 'single loop', d: [8, 4] }]);
        }
      },
      {
        id: 'ffwd', num: 'C-08', sec: S, name: 'Feedforward with feedback trim',
        blurb: 'Feedback can only act after the error appears. If the disturbance can be measured, a lead\u2013lag compensator can cancel its effect before the controlled variable moves \u2014 perfectly in principle, approximately in practice, which is why feedforward is always paired with feedback trim.',
        howto: 'Set the compensator gain to the ideal value and the disturbance vanishes from the output; then mis-set it by 20 % and watch feedback clean up the remainder. The lead\u2013lag ratio matters as much as the gain: get the dynamics wrong and the feedforward action arrives at the wrong moment, producing a transient in the opposite direction. Feedforward alone never removes offset \u2014 model error guarantees it.',
        std: 'Seborg et al., Ch. 15; Shinskey, Ch. 7',
        eqs: [['G_f = -\\frac{G_d}{G_p}', 'the ideal feedforward controller'], ['G_f = K_f\\frac{\\tau_{ld}s+1}{\\tau_{lg}s+1}e^{-\\theta_fs}', 'realisable lead\u2013lag form'], ['K_f = -\\frac{K_d}{K_p}', 'static feedforward gain \u2014 always start here'], ['\\theta_f = \\theta_d - \\theta_p \\ge 0', 'realisability: the disturbance path must be slower']],
        notes: ['Disturbance and manipulated paths both first order plus dead time.', 'Feedback trim is a PI controller acting in parallel.', 'A negative required \u03b8_f is unrealisable \u2014 the compensator is truncated to a pure lead\u2013lag.'],
        params: [P('Kp', 'Manipulated gain K\u209a', 0.2, 5, 0.05, 1, null, '\u2014'), P('tp', 'Manipulated \u03c4\u209a', 1, 40, 0.5, 6, null, 'min'), P('thp', 'Manipulated \u03b8\u209a', 0, 15, 0.1, 2, null, 'min'), P('Kd', 'Disturbance gain K_d', -3, 3, 0.05, 1, null, '\u2014'), P('td', 'Disturbance \u03c4_d', 1, 40, 0.5, 10, null, 'min'), P('thd', 'Disturbance \u03b8_d', 0, 20, 0.1, 4, null, 'min'), P('Kf', 'Feedforward gain K_f', -5, 5, 0.05, -1, null, '\u2014'), P('fb', 'Feedback gain K_c (0 = off)', 0, 8, 0.05, 0.8, null, '\u2014'), P('tI', 'Feedback \u03c4_I', 1, 100, 1, 10, null, 'min'), P('tmax', 'Time window', 20, 300, 10, 100, null, 'min')],
        compute: v => {
          const n = 2000, dt = v.tmax / n;
          const nP = Math.round(v.thp / dt), nD = Math.round(v.thd / dt);
          const tld = v.td, tlg = v.tp;
          const run = mode => {
            let y = 0, xd = 0, xf = 0, I = 0, lead = 0;
            const bp = [], bd = []; for (let i = 0; i <= Math.max(nP, nD); i++) { bp.push(0); bd.push(0); }
            const pts = [[0, 0]]; let iae = 0, pk = 0;
            for (let i = 1; i <= n; i++) {
              const t = i * dt, d = t >= v.tmax * 0.06 ? 1 : 0;
              const e = -y; if (v.fb > 0 && mode !== 'ff') I += e * dt;
              const ufb = (mode === 'ff' || v.fb === 0) ? 0 : v.fb * (e + I / v.tI);
              let uff = 0;
              if (mode !== 'fb') { lead = lead + dt * (d - lead) / tlg; uff = v.Kf * (lead + tld * (d - lead) / tlg); }
              bp.push(ufb + uff); bd.push(d);
              const up = bp[bp.length - 1 - nP], dd = bd[bd.length - 1 - nD];
              xf = xf + dt * (-xf + v.Kp * up) / v.tp;
              xd = xd + dt * (-xd + v.Kd * dd) / v.td;
              y = xf + xd;
              iae += Math.abs(e) * dt; pk = Math.max(pk, Math.abs(y));
              pts.push([t, y]);
            }
            return { pts: pts, iae: iae, pk: pk, yend: y };
          };
          const both = run('both'), ffo = run('ff'), fbo = run('fb');
          const Kideal = -v.Kd / v.Kp, thf = v.thd - v.thp;
          return {
            both: both, ffo: ffo, fbo: fbo,
            res: [{ l: 'Ideal feedforward gain', v: Kideal, u: '\u2014', d: 4 }, { l: 'Gain error', v: (v.Kf - Kideal) / Math.abs(Kideal) * 100, u: '%', d: 1 }, { l: 'Lead time \u03c4_ld', v: tld, u: 'min', d: 2 }, { l: 'Lag time \u03c4_lg', v: tlg, u: 'min', d: 2 }, { l: 'Required \u03b8_f', v: thf, u: 'min', d: 2 }, { l: 'Realisable?', s: thf >= 0 ? 'yes \u2014 disturbance path is slower' : 'no \u2014 needs prediction, use lead\u2013lag only', u: '' }, { l: 'Peak deviation \u2014 FF + FB', v: both.pk, u: '\u2014', d: 4 }, { l: 'Peak deviation \u2014 FF only', v: ffo.pk, u: '\u2014', d: 4 }, { l: 'Peak deviation \u2014 FB only', v: fbo.pk, u: '\u2014', d: 4 }, { l: 'IAE \u2014 FF + FB', v: both.iae, u: '\u2014', d: 3 }, { l: 'IAE \u2014 FB only', v: fbo.iae, u: '\u2014', d: 3 }, { l: 'Residual offset \u2014 FF only', v: Math.abs(ffo.yend), u: '\u2014', d: 4 }]
          };
        },
        draw: (ctx, b, v, r) => {
          let mx = 0.05; [r.both, r.ffo, r.fbo].forEach(s => s.pts.forEach(p => { mx = Math.max(mx, Math.abs(p[1])); }));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: -mx * 1.15, ymax: mx * 1.15, ml: 62 });
          g.grid('Time  min', 'Controlled variable');
          g.title('Unit disturbance step \u2014 three control structures');
          g.line([[0, 0], [v.tmax, 0]], 'rgba(29,31,32,0.22)', 1.1);
          g.line(r.fbo.pts, C.mid, 2, [8, 4]);
          g.line(r.ffo.pts, C.lt, 2, [3, 3]);
          g.line(r.both.pts, C.acc, 2.8);
          g.legend([{ c: C.acc, l: 'FF + FB' }, { c: C.lt, l: 'FF only', d: [3, 3] }, { c: C.mid, l: 'FB only', d: [8, 4] }]);
        }
      },
      {
        id: 'levelc', num: 'C-09', sec: S, name: 'Level control \u2014 integrating process',
        blurb: 'A surge drum has no self-regulation: a flow imbalance ramps the level for ever. That changes the tuning problem completely \u2014 proportional-only control gives no offset in the usual sense, and integral action is what makes level loops cycle.',
        howto: 'Averaging control is the goal for a surge drum: absorb the inflow swing and pass a smooth outflow downstream. Set K_c near 1 to 2 and turn reset almost off, then check the level stays inside the vessel. Tight level control does the opposite \u2014 it transmits every inflow upset straight into the next unit. The plot shows both the level and the manipulated outflow so you can see the trade directly.',
        std: 'Seborg et al., Ch. 12; Shinskey, Ch. 4; Cheung & Luyben (1979) averaging level control',
        eqs: [['A\\frac{dh}{dt} = q_{in} - q_{out}', 'pure integrator \u2014 no self-regulation'], ['G_p(s) = \\frac{1}{As},\\qquad \\text{no steady-state gain}', 'transfer function'], ['\\Delta q_{out} = K_c\\Delta h \\Rightarrow \\text{proportional band sets the swing}', 'P-only averaging control'], ['h_{max} = \\frac{\\Delta q\\,\\tau_r}{A},\\quad \\tau_r = \\frac{A}{K_c}', 'residence-derived excursion']],
        notes: ['Level loop modelled as a pure integrator plus a small valve lag.', 'Manipulated flow limited to the vessel\u2019s design throughput.', 'P-only on an integrator gives zero offset for a step in load \u2014 a property unique to integrating processes.'],
        params: [P('D', 'Vessel diameter', 0.5, 6, 0.1, 2, 'L'), P('H', 'Vessel height', 1, 12, 0.1, 4, 'L'), P('q0', 'Nominal flow', 5, 500, 5, 100, 'Q'), P('dq', 'Inflow step', -80, 80, 1, 25, null, 'm\u00b3/h'), P('Kc', 'Controller gain K_c', 0.2, 20, 0.1, 2, null, '%/%'), P('tI', 'Integral time \u03c4_I (100 = off)', 1, 100, 1, 100, null, 'min'), P('tv', 'Valve time constant', 0.05, 5, 0.05, 0.3, null, 'min'), P('tmax', 'Time window', 10, 300, 5, 90, null, 'min')],
        compute: v => {
          const A = Math.PI * v.D * v.D / 4, Vtot = A * v.H;
          const n = 2000, dt = v.tmax / n;
          const span = v.H;
          let h = v.H / 2, q = v.q0, I = 0, hmax = h, hmin = h, qmax = q, qmin = q;
          const hp = [[0, h]], qp = [[0, q]];
          const off = v.tI >= 99.5;
          for (let i = 1; i <= n; i++) {
            const t = i * dt, qin = v.q0 + (t >= v.tmax * 0.05 ? v.dq : 0);
            const e = (v.H / 2 - h) / span * 100;
            if (!off) I += e * dt;
            let qs = v.q0 - v.Kc * (e / 100) * v.q0 * 2 - (off ? 0 : v.Kc * (I / v.tI / 100) * v.q0 * 2);
            qs = Math.max(0, Math.min(v.q0 * 2.5, qs));
            q = q + dt * (qs - q) / v.tv;
            h = h + dt * (qin - q) / (60 * A);
            h = Math.max(0, Math.min(v.H, h));
            hmax = Math.max(hmax, h); hmin = Math.min(hmin, h); qmax = Math.max(qmax, q); qmin = Math.min(qmin, q);
            hp.push([t, h]); qp.push([t, q]);
          }
          const tres = Vtot / (v.q0 / 60);
          return {
            hp: hp, qp: qp,
            res: [{ l: 'Cross-sectional area', v: A, u: 'm\u00b2', d: 3 }, { l: 'Total volume', v: Vtot, u: 'm\u00b3', d: 2 }, { l: 'Residence time (full)', v: tres, u: 'min', d: 1 }, { l: 'Level swing', v: (hmax - hmin) / v.H * 100, u: '% of span', d: 1 }, { l: 'Peak level', v: hmax, u: 'm', d: 3 }, { l: 'Minimum level', v: hmin, u: 'm', d: 3 }, { l: 'Outflow swing', v: (qmax - qmin) / v.q0 * 100, u: '% of nominal', d: 1 }, { l: 'Transmitted fraction', v: (qmax - qmin) / Math.max(Math.abs(v.dq), 1e-9) * 100, u: '%', d: 1 }, { l: 'Vessel breached?', s: hmax >= v.H * 0.999 ? 'YES \u2014 overflows' : hmin <= 0.001 ? 'YES \u2014 empties' : 'no', u: '' }, { l: 'Control character', s: (qmax - qmin) / Math.max(Math.abs(v.dq), 1e-9) < 0.5 ? 'averaging \u2014 surge absorbed' : (qmax - qmin) / Math.max(Math.abs(v.dq), 1e-9) > 0.9 ? 'tight \u2014 upset passed downstream' : 'intermediate', u: '' }, { l: 'Reset action', s: off ? 'off \u2014 P only, correct for surge duty' : 'on \u2014 will drive level back to set point', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: 0, ymax: v.H, ml: 62, mr: 62 });
          g.grid('Time  min', 'Level  m');
          g.title('Surge drum \u2014 level and manipulated outflow');
          g.line([[0, v.H / 2], [v.tmax, v.H / 2]], C.lt, 1.2, [6, 4]);
          g.fill([[0, 0], [v.tmax, 0], [v.tmax, v.H * 0.1], [0, v.H * 0.1]], C.soft2);
          g.fill([[0, v.H * 0.9], [v.tmax, v.H * 0.9], [v.tmax, v.H], [0, v.H]], C.soft2);
          g.line(r.hp, C.acc, 2.8);
          const qs = r.qp.map(p => [p[0], p[1] / (v.q0 * 2.5) * v.H]);
          g.line(qs, C.mid, 1.8, [7, 4]);
          g.legend([{ c: C.acc, l: 'level' }, { c: C.mid, l: 'outflow (scaled)', d: [7, 4] }, { c: C.lt, l: 'set point', d: [6, 4] }]);
        }
      },
      {
        id: 'ident', num: 'C-10', sec: S, name: 'Process identification from a step test',
        blurb: 'Everything upstream of tuning depends on getting three numbers out of a noisy chart recorder trace. Three published constructions disagree with each other and with the truth; this generates a synthetic test with known parameters so you can see how much each method costs you.',
        howto: 'Raise the noise and watch the tangent method fall apart \u2014 it depends on a derivative, which noise destroys. The two-point methods use integrated quantities and hold up far better; Sundaresan\u2013Krishnaswamy is the usual recommendation. Then check how the tuning built on each fit performs: a 20 % error in \u03b8 matters far more than a 20 % error in \u03c4.',
        std: 'Smith (1972) two-point; Sundaresan & Krishnaswamy (1978); Ziegler & Nichols reaction curve; Seborg et al., Ch. 7',
        eqs: [['t_{28.3},\\ t_{63.2}:\\quad \\tau = 1.5(t_{63.2}-t_{28.3}),\\ \\theta = t_{63.2}-\\tau', 'Smith two-point fit'], ['t_{35.3},\\ t_{85.3}:\\quad \\tau = 0.67(t_{85.3}-t_{35.3}),\\ \\theta = 1.3t_{35.3}-0.29t_{85.3}', 'Sundaresan\u2013Krishnaswamy'], ['K_p = \\frac{\\Delta y_{\\infty}}{\\Delta u}', 'steady-state gain \u2014 the one robust parameter'], ['\\text{tangent at inflection} \\Rightarrow \\theta,\\ \\theta+\\tau', 'the classical reaction curve']],
        notes: ['Synthetic data generated from the true FOPDT model plus Gaussian noise, seeded so it is reproducible.', 'Steady-state gain taken from the average of the last 10 % of the record.', 'Tangent method uses a five-point central difference at the steepest sampled point.'],
        params: [P('Kp', 'True gain K\u209a', 0.2, 5, 0.05, 2, null, '\u2014'), P('tau', 'True \u03c4', 1, 40, 0.5, 10, null, 'min'), P('th', 'True \u03b8', 0.2, 20, 0.1, 3, null, 'min'), P('M', 'Step magnitude', 1, 20, 0.5, 5, null, '%'), P('noise', 'Noise (\u03c3, % of \u0394y)', 0, 10, 0.1, 1.5, null, '%'), P('seed', 'Random seed', 1, 60, 1, 7, null, '\u2014'), P('tmax', 'Record length', 10, 250, 5, 70, null, 'min')],
        compute: v => {
          let s = v.seed * 9301 + 49297;
          const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
          const gauss = () => { let u = 0, w = 0; while (u === 0) u = rnd(); while (w === 0) w = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
          const n = 500, dt = v.tmax / n, dyT = v.Kp * v.M;
          const data = [];
          for (let i = 0; i <= n; i++) { const t = i * dt; const y0 = t <= v.th ? 0 : dyT * (1 - Math.exp(-(t - v.th) / v.tau)); data.push([t, y0 + gauss() * v.noise / 100 * Math.abs(dyT)]); }
          let sEnd = 0, cEnd = 0;
          data.forEach(p => { if (p[0] > v.tmax * 0.9) { sEnd += p[1]; cEnd++; } });
          const dy = sEnd / Math.max(cEnd, 1), Kfit = dy / v.M;
          const tAt = frac => { const tgt = frac * dy; for (let i = 1; i < data.length; i++) { if ((data[i][1] - tgt) * (data[i - 1][1] - tgt) <= 0 && data[i][0] > 0) return data[i - 1][0] + (tgt - data[i - 1][1]) / (data[i][1] - data[i - 1][1] + 1e-15) * dt; } return NaN; };
          const t283 = tAt(0.283), t632 = tAt(0.632), t353 = tAt(0.353), t853 = tAt(0.853);
          const smTau = 1.5 * (t632 - t283), smTh = t632 - smTau;
          const skTau = 0.67 * (t853 - t353), skTh = 1.3 * t353 - 0.29 * t853;
          let bi = 2, bs = -1e30;
          for (let i = 2; i < data.length - 2; i++) { const sl = (data[i + 2][1] - data[i - 2][1]) / (4 * dt); if (sl > bs) { bs = sl; bi = i; } }
          const tgTau = dy / Math.max(bs, 1e-12), tgTh = Math.max(data[bi][0] - data[bi][1] / Math.max(bs, 1e-12), 0);
          const err = (a, b) => (a - b) / b * 100;
          return {
            data: data, dy: dy, sm: [smTh, smTau], sk: [skTh, skTau], tg: [tgTh, tgTau], bs: bs, bi: bi,
            res: [{ l: 'Fitted gain K\u209a', v: Kfit, u: '\u2014', d: 4 }, { l: 'Gain error', v: err(Kfit, v.Kp), u: '%', d: 2 }, { l: 't at 28.3 %', v: t283, u: 'min', d: 2 }, { l: 't at 63.2 %', v: t632, u: 'min', d: 2 }, { l: 'Smith \u03c4', v: smTau, u: 'min', d: 2 }, { l: 'Smith \u03b8', v: smTh, u: 'min', d: 2 }, { l: 'Sundaresan\u2013K \u03c4', v: skTau, u: 'min', d: 2 }, { l: 'Sundaresan\u2013K \u03b8', v: skTh, u: 'min', d: 2 }, { l: 'Tangent \u03c4', v: tgTau, u: 'min', d: 2 }, { l: 'Tangent \u03b8', v: tgTh, u: 'min', d: 2 }, { l: 'Best method here', s: Math.abs(err(skTh, v.th)) < Math.abs(err(smTh, v.th)) ? 'Sundaresan\u2013Krishnaswamy' : 'Smith two-point', u: '' }],
            table: {
              title: 'Identified parameters against the truth',
              head: ['Method', 'K\u209a', 'error', '\u03c4  min', 'error', '\u03b8  min', 'error'],
              rows: [
                ['True values', v.Kp.toFixed(3), '\u2014', v.tau.toFixed(2), '\u2014', v.th.toFixed(2), '\u2014'],
                ['Smith two-point', Kfit.toFixed(3), err(Kfit, v.Kp).toFixed(1) + ' %', smTau.toFixed(2), err(smTau, v.tau).toFixed(1) + ' %', smTh.toFixed(2), err(smTh, v.th).toFixed(1) + ' %'],
                ['Sundaresan\u2013Krishnaswamy', Kfit.toFixed(3), err(Kfit, v.Kp).toFixed(1) + ' %', skTau.toFixed(2), err(skTau, v.tau).toFixed(1) + ' %', skTh.toFixed(2), err(skTh, v.th).toFixed(1) + ' %'],
                ['Tangent (reaction curve)', Kfit.toFixed(3), err(Kfit, v.Kp).toFixed(1) + ' %', tgTau.toFixed(2), err(tgTau, v.tau).toFixed(1) + ' %', tgTh.toFixed(2), err(tgTh, v.th).toFixed(1) + ' %']
              ]
            }
          };
        },
        draw: (ctx, b, v, r) => {
          const hi = r.dy * 1.3, lo = Math.min(-r.dy * 0.12, -0.01);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: lo, ymax: hi, ml: 62 });
          g.grid('Time  min', 'Response  %');
          g.title('Step test record and the three fits');
          g.line([[0, r.dy], [v.tmax, r.dy]], C.lt, 1.2, [6, 4]);
          g.clip(() => { r.data.forEach(p => { ctx.fillStyle = 'rgba(29,31,32,0.32)'; ctx.beginPath(); ctx.arc(g.X(p[0]), g.Y(p[1]), 1.4, 0, 7); ctx.fill(); }); });
          const mk = (th, tau, col, dash) => g.fn(t => t <= th ? 0 : r.dy * (1 - Math.exp(-(t - th) / tau)), col, 2, dash, 300);
          mk(r.sm[0], r.sm[1], C.mid, [7, 4]);
          mk(r.sk[0], r.sk[1], C.acc, null);
          mk(r.tg[0], r.tg[1], C.warn, [3, 3]);
          g.line([[r.tg[0], 0], [r.tg[0] + r.tg[1], r.dy]], 'rgba(29,31,32,0.2)', 1.1, [4, 4]);
          g.legend([{ c: C.acc, l: 'Sundaresan\u2013K' }, { c: C.mid, l: 'Smith', d: [7, 4] }, { c: C.warn, l: 'tangent', d: [3, 3] }]);
        }
      },
      {
        id: 'smith', num: 'C-11', sec: S, name: 'Dead-time compensation \u2014 Smith predictor',
        blurb: 'When dead time dominates, feedback is blind for a full \u03b8 after every move. The Smith predictor gives the controller a model of the process to look at instead, so it can be tuned as if the dead time were not there \u2014 provided the model is right.',
        howto: 'With a perfect model the closed-loop response is the delay-free response, shifted by \u03b8: nothing can beat that. Then mis-set the model dead time by 20 % and watch it degrade \u2014 the compensator is only as good as the model, and it fails ungracefully. Compare against conventional PI on the same process; the advantage appears once \u03b8/\u03c4 exceeds about 0.5.',
        std: 'Smith (1957); Seborg et al., Ch. 16; Marlin, Ch. 19',
        eqs: [['G_c^* = \\frac{G_c}{1+G_c\\tilde G(1-e^{-\\tilde\\theta s})}', 'effective controller with the predictor'], ['\\frac{Y}{Y_{sp}} = \\frac{G_cG e^{-\\theta s}}{1+G_cG}', 'perfect model \u2014 delay leaves the characteristic equation'], ['\\text{tune } G_c \\text{ on } \\tilde G \\text{ alone (no dead time)}', 'the design advantage'], ['\\text{robustness} \\propto \\left|\\tilde\\theta - \\theta\\right|', 'sensitivity to model error']],
        notes: ['Internal model is FOPDT with its own gain, time constant and dead time.', 'Comparison controller is a PI tuned by IMC on the true process.', 'Model mismatch is applied to the predictor only \u2014 the plant keeps the true parameters.'],
        params: [P('Kp', 'True gain K\u209a', 0.2, 5, 0.05, 1, null, '\u2014'), P('tau', 'True \u03c4', 1, 40, 0.5, 5, null, 'min'), P('th', 'True \u03b8', 0.5, 30, 0.5, 8, null, 'min'), P('mK', 'Model gain error', -50, 50, 1, 0, null, '%'), P('mT', 'Model \u03c4 error', -50, 50, 1, 0, null, '%'), P('mTh', 'Model \u03b8 error', -50, 50, 1, 0, null, '%'), P('Kc', 'Controller gain K_c', 0.05, 15, 0.05, 1.5, null, '\u2014'), P('tI', 'Integral time \u03c4_I', 0.5, 60, 0.5, 5, null, 'min'), P('tmax', 'Time window', 20, 300, 10, 100, null, 'min')],
        compute: v => {
          const mK = v.Kp * (1 + v.mK / 100), mT = v.tau * (1 + v.mT / 100), mTh = v.th * (1 + v.mTh / 100);
          const n = 2500, dt = v.tmax / n;
          const nd = Math.round(v.th / dt), nm = Math.round(mTh / dt);
          const runSmith = () => {
            let y = 0, ym = 0, I = 0; const bp = [], bm = [];
            for (let i = 0; i <= Math.max(nd, nm) + 1; i++) { bp.push(0); bm.push(0); }
            const pts = [[0, 0]]; let iae = 0, ymax = 0;
            for (let i = 1; i <= n; i++) {
              const t = i * dt;
              const ymd = bm[bm.length - 1 - nm];
              const e = 1 - (y + ym - ymd);
              I += e * dt;
              const u = v.Kc * (e + I / v.tI);
              bp.push(u);
              const ud = bp[bp.length - 1 - nd];
              y = y + dt * (-y + v.Kp * ud) / v.tau;
              ym = ym + dt * (-ym + mK * u) / mT;
              bm.push(ym);
              iae += Math.abs(1 - y) * dt; ymax = Math.max(ymax, y);
              pts.push([t, y]);
            }
            return { pts: pts, iae: iae, ymax: ymax };
          };
          const A = runSmith();
          const imc = tune(v.Kp, v.tau, v.th, 'imc', 'PI', Math.max(0.5 * v.th, 0.2));
          const B = sim({ Kp: v.Kp, tau: v.tau, th: v.th, Kc: imc.Kc, tI: imc.tI, tD: 0, sp: 1, td: 1e30, tmax: v.tmax, umax: 100 });
          const R = v.th / v.tau;
          return {
            A: A, B: B,
            res: [{ l: 'Dead-time ratio \u03b8/\u03c4', v: R, u: '\u2014', d: 3 }, { l: 'Worth a predictor?', s: R > 1 ? 'yes \u2014 dead-time dominant' : R > 0.5 ? 'probably \u2014 marginal case' : 'no \u2014 ordinary PI is enough', u: '' }, { l: 'Model gain', v: mK, u: '\u2014', d: 3 }, { l: 'Model \u03c4', v: mT, u: 'min', d: 2 }, { l: 'Model \u03b8', v: mTh, u: 'min', d: 2 }, { l: 'Smith overshoot', v: (A.ymax - 1) * 100, u: '%', d: 1 }, { l: 'Smith IAE', v: A.iae, u: '\u2014', d: 3 }, { l: 'IMC-PI overshoot', v: (B.ymax - 1) * 100, u: '%', d: 1 }, { l: 'IMC-PI IAE', v: B.iae, u: '\u2014', d: 3 }, { l: 'IAE improvement', v: (1 - A.iae / Math.max(B.iae, 1e-12)) * 100, u: '%', d: 1 }, { l: 'Mismatch verdict', s: Math.abs(v.mTh) > 25 ? 'dead-time error too large \u2014 predictor degrades badly' : Math.abs(v.mK) > 30 ? 'gain error leaves offset transients' : 'model adequate', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const hi = Math.max(1.7, r.A.ymax * 1.15, r.B.ymax * 1.1);
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: v.tmax, ymin: -0.25, ymax: hi, ml: 60 });
          g.grid('Time  min', 'Controlled variable');
          g.title('Set-point step \u2014 Smith predictor against IMC-PI');
          g.line([[0, 1], [v.tmax, 1]], C.lt, 1.2, [6, 4]);
          g.line([[v.th, -0.25], [v.th, hi]], 'rgba(29,31,32,0.18)', 1, [4, 4]);
          g.line(r.B.pts || r.B.y, C.mid, 2.2, [8, 4]);
          g.line(r.A.pts, C.acc, 2.8);
          if (g.w > 300) g.txt('\u03b8', v.th, -0.18, C.mut, 'center', 12);
          g.legend([{ c: C.acc, l: 'Smith predictor' }, { c: C.mid, l: 'IMC-PI', d: [8, 4] }]);
        }
      }
    ];
  }

  /* ══ PHASE EQUILIBRIA & MODELS ════════════════════════════ */
