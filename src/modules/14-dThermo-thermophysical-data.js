  dThermo() {
    const self = this, C = this.C;
    const S = 'Thermophysical Data';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    return [
      {
        id: 'steam', num: 'T-01', sec: S, name: 'Steam tables (IAPWS-IF97)',
        blurb: 'Water and steam properties computed from the industrial formulation itself \u2014 not interpolated from a printed table. Saturation line, subcooled liquid and superheated vapour, with the state plotted on the temperature\u2013entropy dome.',
        howto: 'The dome is the two-phase region: left branch saturated liquid, right branch saturated vapour, and the horizontal distance between them at any temperature is the entropy of vaporisation. A point inside the dome is wet steam, one to the right of the dome is superheated, one to the left is subcooled liquid. Move pressure and watch the dome shrink toward the critical point at 374 \u00b0C, where the two branches meet and the latent heat disappears altogether.',
        std: 'IAPWS-IF97 (1997, rev. 2007) \u2014 Regions 1, 2 and 4 implemented directly',
        eqs: [['\\frac{g(p,T)}{RT} = \\gamma(\\pi,\\tau)', 'Gibbs formulation, Regions 1 and 2'], ['h = RT\\tau\\gamma_\\tau,\\quad s = R(\\tau\\gamma_\\tau - \\gamma),\\quad v = \\frac{RT}{p}\\pi\\gamma_\\pi', 'properties as derivatives of γ'], ['\\pi_{sat} = \\left[\\frac{2C}{-B+\\sqrt{B^2-4AC}}\\right]^4', 'Region 4 saturation line, closed form']],
        notes: ['Region 1 (liquid) and Region 2 (vapour) valid to 100 MPa / 800 \u00b0C.', 'Near-critical accuracy degrades above about 350 \u00b0C on the saturation line.', 'Reference state: h = s = 0 at the triple point of liquid water.'],
        params: [{ k: 'mode', label: 'Specify by', type: 'select', val: 'psat', options: [['psat', 'Saturation \u2014 by pressure'], ['tsat', 'Saturation \u2014 by temperature'], ['sup', 'Superheated \u2014 p and T']] }, P('p', 'Pressure', 1, 20000, 1, 1000, 'P'), P('T', 'Temperature', 5, 700, 1, 250, 'T')],
        compute: v => {
          const f = self.if97();
          const isSup = v.mode === 'sup';
          let pMPa, Tsat;
          if (v.mode === 'tsat') { pMPa = f.psat(v.T + 273.15); Tsat = v.T; }
          else { pMPa = v.p / 1000; Tsat = f.tsat(pMPa) - 273.15; }
          const Ts = Math.min(Tsat, 372);
          const liq = f.r1(pMPa, Ts + 273.15 - 0.01);
          const vap = f.r2(pMPa, Ts + 273.15 + 0.01);
          const res = [{ l: 'Saturation pressure', v: pMPa * 1000, u: '', cv: 'P', d: 2 }, { l: 'Saturation temperature', v: Tsat, u: '', cv: 'T', d: 2 }, { l: 'Latent heat h_fg', v: vap.h - liq.h, u: '', cv: 'H', d: 1 }];
          let pt = { s: liq.s, T: Ts };
          if (isSup) {
            if (v.T > Tsat + 0.05) {
              const sh = f.r2(pMPa, v.T + 273.15);
              pt = { s: sh.s, T: v.T };
              res.push({ l: 'Degrees of superheat', v: v.T - Tsat, u: '', cv: 'dT', d: 1 }, { l: 'Enthalpy h', v: sh.h, u: '', cv: 'H', d: 1 }, { l: 'Entropy s', v: sh.s, u: '', cv: 'S', d: 4 }, { l: 'Specific volume v', v: sh.v, u: '', cv: 'vv', d: 5 }, { l: 'Density \u03c1', v: 1 / sh.v, u: '', cv: 'rho', d: 3 }, { l: 'Internal energy u', v: sh.u, u: '', cv: 'H', d: 1 });
            } else {
              const sc = f.r1(pMPa, v.T + 273.15);
              pt = { s: sc.s, T: v.T };
              res.push({ l: 'State', s: 'subcooled liquid', u: '' }, { l: 'Subcooling', v: Tsat - v.T, u: '', cv: 'dT', d: 1 }, { l: 'Enthalpy h', v: sc.h, u: '', cv: 'H', d: 2 }, { l: 'Entropy s', v: sc.s, u: '', cv: 'S', d: 4 }, { l: 'Specific volume v', v: sc.v, u: '', cv: 'vv', d: 6 });
            }
          }
          const tbl = {
            title: 'Saturated properties at ' + self.f(self.cvt(pMPa * 1000, 'P')[0], 2) + ' ' + self.cvt(0, 'P')[1] + '  /  ' + self.f(self.cvt(Tsat, 'T')[0], 2) + ' ' + self.cvt(0, 'T')[1],
            head: ['Property', 'Saturated liquid  (f)', 'Saturated vapour  (g)', 'Change  (fg)'],
            rows: [
              ['Specific volume  ' + self.cvt(0, 'vv')[1], self.f(self.cvt(liq.v, 'vv')[0], 6), self.f(self.cvt(vap.v, 'vv')[0], 5), self.f(self.cvt(vap.v - liq.v, 'vv')[0], 5)],
              ['Enthalpy  ' + self.cvt(0, 'H')[1], self.f(self.cvt(liq.h, 'H')[0], 2), self.f(self.cvt(vap.h, 'H')[0], 2), self.f(self.cvt(vap.h - liq.h, 'H')[0], 2)],
              ['Entropy  ' + self.cvt(0, 'S')[1], self.f(self.cvt(liq.s, 'S')[0], 5), self.f(self.cvt(vap.s, 'S')[0], 5), self.f(self.cvt(vap.s - liq.s, 'S')[0], 5)],
              ['Internal energy  ' + self.cvt(0, 'H')[1], self.f(self.cvt(liq.u, 'H')[0], 2), self.f(self.cvt(vap.u, 'H')[0], 2), self.f(self.cvt(vap.u - liq.u, 'H')[0], 2)],
              ['Density  ' + self.cvt(0, 'rho')[1], self.f(self.cvt(1 / liq.v, 'rho')[0], 3), self.f(self.cvt(1 / vap.v, 'rho')[0], 4), '\u2014']
            ]
          };
          res.push({ l: 'Liquid enthalpy h_f', v: liq.h, u: '', cv: 'H', d: 2 }, { l: 'Vapour enthalpy h_g', v: vap.h, u: '', cv: 'H', d: 2 }, { l: 'Vapour specific volume', v: vap.v, u: '', cv: 'vv', d: 5 });
          return { f: f, liq: liq, vap: vap, Tsat: Tsat, pt: pt, res: res, table: tbl };
        },
        draw: (ctx, b, v, r) => {
          const f = r.f;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 9.5, ymin: 0, ymax: 420, ml: 68 });
          g.grid('Entropy  s  (' + self.cvt(0, 'S')[1] + ')', 'Temperature  (' + self.cvt(0, 'T')[1] + ')', 5, 6, t => self.f(self.cvt(t, 'S')[0], 1), t => self.f(self.cvt(t, 'T')[0], 0));
          g.title('Temperature\u2013entropy diagram');
          const lf = [], vg = [];
          for (let T = 1; T <= 371; T += 3) {
            const p = f.psat(T + 273.15);
            lf.push([f.r1(p, T + 273.15).s, T]);
            vg.push([f.r2(p, T + 273.15).s, T]);
          }
          g.fill(lf.concat(vg.slice().reverse()), C.soft);
          g.line(lf, C.dk, 2.2);
          g.line(vg, C.dk, 2.2);
          [0.1, 1, 10, 22].forEach(pm => {
            const ts = pm < 22.06 ? f.tsat(pm) - 273.15 : 373.95;
            const pts = [];
            for (let T = Math.ceil(ts) + 1; T <= 700; T += 8) pts.push([f.r2(pm, T + 273.15).s, T]);
            g.line(pts, 'rgba(29,31,32,0.24)', 1.1, [5, 3]);
            if (pts.length) g.txt(pm + ' MPa', pts[0][0], pts[0][1] + 8, C.mut, 'left', 10);
          });
          g.txt('saturated liquid', 1.2, 300, C.mid, 'right', 11);
          g.txt('two-phase', 4.6, 150, C.mid, 'center', 12);
          g.txt('superheated vapour', 8.2, 330, C.mid, 'center', 11);
          g.dot(373.95 > 0 ? 4.4070 : 0, 373.95, C.mut, 3.5);
          g.txt('critical point', 4.41, 388, C.mut, 'center', 10.5);
          g.line([[0, r.Tsat], [9.5, r.Tsat]], 'rgba(29,31,32,0.2)', 1, [3, 3]);
          g.dot(r.liq.s, r.Tsat, C.acc, 4.5);
          g.dot(r.vap.s, r.Tsat, C.acc, 4.5);
          g.line([[r.liq.s, r.Tsat], [r.vap.s, r.Tsat]], C.acc, 2);
          if (v.mode === 'sup') { g.cross(r.pt.s, r.pt.T, C.dk, 10); g.dot(r.pt.s, r.pt.T, C.acc, 5); }
          g.legend([{ c: C.dk, l: 'saturation dome' }, { c: C.acc, l: 'your state' }, { c: 'rgba(29,31,32,0.24)', l: 'isobars', d: [5, 3], lw: 1.1 }]);
        }
      },
      {
        id: 'psychro', num: 'T-02', sec: S, name: 'Psychrometric chart',
        blurb: 'Moist air on the chart every HVAC and drying calculation is read from: dry-bulb across, humidity ratio up, relative-humidity curves fanning out from saturation, and the wet-bulb lines sloping back the other way.',
        howto: 'Your state is the cross. Move left along a horizontal line and you cool at constant moisture until you hit saturation \u2014 that intersection is the dew point, and any further cooling condenses water out. Move up the sloping wet-bulb line and you are humidifying adiabatically, as an evaporative cooler or a cooling tower does. Altitude matters more than people expect: raising it shifts the whole saturation curve upward.',
        std: 'ASHRAE Handbook \u2014 Fundamentals, Ch. 1; Hyland & Wexler (1983) saturation pressure',
        eqs: [['W = 0.621945\\,\\frac{p_w}{p-p_w}', 'humidity ratio from partial pressure'], ['h = 1.006t + W(2501 + 1.86t)', 'enthalpy of moist air, kJ per kg dry air'], ['W = \\frac{(2501-2.326t^*)W_s^* - 1.006(t-t^*)}{2501 + 1.86t - 4.186t^*}', 'wet-bulb relation, solved by bisection']],
        notes: ['Dry air treated as ideal; enthalpy referenced to 0 \u00b0C dry air.', 'Barometric pressure from the standard atmosphere at the chosen altitude.', 'Wet bulb solved by bisection on the adiabatic saturation equation.'],
        params: [P('Tdb', 'Dry-bulb temperature', -10, 60, 0.5, 26, 'T'), P('RH', 'Relative humidity', 1, 100, 1, 55, null, '%'), P('alt', 'Site altitude', 0, 3000, 25, 0, 'L')],
        compute: v => {
          const pws = t => {
            const T = t + 273.15;
            if (t >= 0) return Math.exp(-5800.2206 / T + 1.3914993 - 0.048640239 * T + 4.1764768e-5 * T * T - 1.4452093e-8 * T * T * T + 6.5459673 * Math.log(T)) / 1000;
            return Math.exp(-5674.5359 / T + 6.3925247 - 0.009677843 * T + 6.2215701e-7 * T * T + 2.0747825e-9 * T * T * T - 9.484024e-13 * T * T * T * T + 4.1635019 * Math.log(T)) / 1000;
          };
          const pat = 101.325 * Math.pow(1 - 2.25577e-5 * v.alt, 5.2559);
          const Wof = (t, rh) => { const pw = rh / 100 * pws(t); return 0.621945 * pw / Math.max(pat - pw, 1e-6); };
          const Ws = t => Wof(t, 100);
          const W = Wof(v.Tdb, v.RH);
          const h = 1.006 * v.Tdb + W * (2501 + 1.86 * v.Tdb);
          const pw = W * pat / (0.621945 + W);
          const Tdp = self.bis(t => pws(t) - pw, -60, 90, 1e-7);
          const Twb = self.bis(ts => {
            const wss = Ws(ts);
            return ((2501 - 2.326 * ts) * wss - 1.006 * (v.Tdb - ts)) / (2501 + 1.86 * v.Tdb - 4.186 * ts) - W;
          }, -50, v.Tdb, 1e-7);
          const vol = 0.287042 * (v.Tdb + 273.15) * (1 + 1.607858 * W) / pat;
          return {
            Ws: Ws, Wof: Wof, W: W, pat: pat, Tdp: Tdp, Twb: Twb,
            res: [{ l: 'Barometric pressure', v: pat, u: '', cv: 'P', d: 3 }, { l: 'Humidity ratio W', v: W * 1000, u: 'g/kg dry air', d: 3 }, { l: 'Enthalpy h', v: h, u: '', cv: 'H', d: 2 }, { l: 'Dew point', v: Tdp, u: '', cv: 'T', d: 2 }, { l: 'Wet bulb', v: Twb, u: '', cv: 'T', d: 2 }, { l: 'Wet-bulb depression', v: v.Tdb - Twb, u: '', cv: 'dT', d: 2 }, { l: 'Specific volume', v: vol, u: '', cv: 'vv', d: 4 }, { l: 'Density of moist air', v: (1 + W) / vol, u: '', cv: 'rho', d: 4 }, { l: 'Water vapour pressure', v: pw, u: '', cv: 'P', d: 4 }, { l: 'Saturation W at T_db', v: Ws(v.Tdb) * 1000, u: 'g/kg dry air', d: 3 }, { l: 'Moisture to saturate', v: (Ws(v.Tdb) - W) * 1000, u: 'g/kg dry air', d: 3 }]
          };
        },
        draw: (ctx, b, v, r) => {
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -10, xmax: 55, ymin: 0, ymax: 0.032, ml: 62, mr: 74 });
          g.grid('Dry-bulb temperature  (' + self.cvt(0, 'T')[1] + ')', '', 6, 8, t => self.f(self.cvt(t, 'T')[0], 0), t => (t * 1000).toFixed(0));
          g.title('Psychrometric chart at ' + self.f(self.cvt(r.pat, 'P')[0], 1) + ' ' + self.cvt(0, 'P')[1]);
          ctx.save(); ctx.translate(g.x - 46, g.y + g.h / 2); ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = C.ink; ctx.font = '700 14px Lato, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('HUMIDITY RATIO  W  (g WATER / kg DRY AIR)', 0, 0); ctx.restore();
          let lastLab = -1e9;
          [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(rh => {
            g.fn(t => r.Wof(t, rh), 'rgba(29,31,32,0.20)', 1.1);
            const te = self.bis(t => r.Wof(t, rh) - 0.0315, -10, 55, 1e-5);
            if (isFinite(te) && te > -9 && te < 54) {
              const px = g.X(te);
              if (Math.abs(px - lastLab) > 30) { g.txt(rh + '%', te, 0.0318, C.mut, 'center', 10, 'bottom'); lastLab = px; }
            } else g.txt(rh + '%', 54, Math.min(r.Wof(54, rh), 0.031), C.mut, 'right', 10, 'bottom');
          });
          g.fn(t => r.Ws(t), C.dk, 2.6);
          g.txt('saturation  100%', 30, Math.min(r.Ws(30), 0.031), C.dk, 'right', 11, 'bottom');
          for (let tw = -5; tw <= 35; tw += 5) {
            const pts = [];
            for (let t = tw; t <= 55; t += 1) {
              const wss = r.Ws(tw);
              const W = ((2501 - 2.326 * tw) * wss - 1.006 * (t - tw)) / (2501 + 1.86 * t - 4.186 * tw);
              if (W > 0) pts.push([t, W]);
            }
            g.line(pts, C.soft3, 1, [4, 3]);
            if (r.Ws(tw) < 0.031 && tw >= 0) g.txt(tw + '\u00b0', tw, r.Ws(tw) + 0.0008, C.mid, 'center', 9.5, 'bottom');
          }
          g.line([[v.Tdb, 0], [v.Tdb, r.W]], 'rgba(29,31,32,0.25)', 1, [3, 3]);
          g.line([[r.Tdp, r.W], [v.Tdb, r.W]], 'rgba(29,31,32,0.25)', 1, [3, 3]);
          g.dot(r.Tdp, r.W, C.mid, 4);
          g.txt('dew pt', r.Tdp, r.W + 0.0012, C.mid, 'right', 10.5);
          g.cross(v.Tdb, r.W, C.dk, 11);
          g.dot(v.Tdb, r.W, C.acc, 5.5);
          g.txt(v.Tdb.toFixed(1) + '\u00b0C  ' + v.RH.toFixed(0) + '% RH', v.Tdb, r.W + 0.0022, C.ink, 'center', 12);
          ctx.save();
          ctx.fillStyle = C.mut; ctx.font = '13px Barlow, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('wet-bulb', g.x + g.w + 10, g.y + 14);
          ctx.fillText('(dashed)', g.x + g.w + 10, g.y + 30);
          ctx.restore();
        }
      }
    ];
  }
  /* ══ BALANCES, COST & TOOLS ═══════════════════════════════ */
