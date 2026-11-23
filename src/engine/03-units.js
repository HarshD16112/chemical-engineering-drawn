  /* ── units ─────────────────────────────────────────────── */
  get CV() {
    return {
      T: { u: ['\u00b0C', '\u00b0F'], m: 1.8, b: 32 },
      dT: { u: ['K', '\u00b0R'], m: 1.8 },
      P: { u: ['kPa', 'psi'], m: 0.1450377 },
      Pb: { u: ['bar', 'psi'], m: 14.50377 },
      L: { u: ['m', 'ft'], m: 3.28084 },
      mm: { u: ['mm', 'in'], m: 0.0393701 },
      Q: { u: ['m\u00b3/h', 'gpm'], m: 4.402868 },
      M: { u: ['kg/h', 'lb/h'], m: 2.204623 },
      Ms: { u: ['kg/s', 'lb/s'], m: 2.204623 },
      vel: { u: ['m/s', 'ft/s'], m: 3.28084 },
      W: { u: ['kW', 'MBtu/h'], m: 0.00341214 },
      Wm: { u: ['W/m', 'Btu/h\u00b7ft'], m: 1.040183 },
      A: { u: ['m\u00b2', 'ft\u00b2'], m: 10.76391 },
      V: { u: ['m\u00b3', 'ft\u00b3'], m: 35.31467 },
      rho: { u: ['kg/m\u00b3', 'lb/ft\u00b3'], m: 0.06242796 },
      H: { u: ['kJ/kg', 'Btu/lb'], m: 0.4299226 },
      S: { u: ['kJ/kg\u00b7K', 'Btu/lb\u00b7\u00b0F'], m: 0.2388459 },
      U: { u: ['W/m\u00b2K', 'Btu/hft\u00b2F'], m: 0.1761102 },
      kt: { u: ['W/m\u00b7K', 'Btu/hftF'], m: 0.5777893 },
      vv: { u: ['m\u00b3/kg', 'ft\u00b3/lb'], m: 16.01846 }
    };
  }
  cvt(v, key) {
    const c = key && this.CV[key];
    if (!c) return [v, key === null || key === undefined ? '' : key];
    const i = this.state.us ? 1 : 0;
    if (i === 0) return [v, c.u[0]];
    return [v * (c.m || 1) + (c.b || 0), c.u[1]];
  }
  inv(d, key) {
    const c = key && this.CV[key];
    if (!c || !this.state.us) return d;
    return (d - (c.b || 0)) / (c.m || 1);
  }
  f(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '\u2014';
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-3 || a >= 1e7)) return x.toExponential(2);
    if (d !== null && d !== undefined) return x.toFixed(d);
    return x.toFixed(a < 1 ? 4 : a < 10 ? 3 : a < 100 ? 2 : a < 10000 ? 1 : 0);
  }

