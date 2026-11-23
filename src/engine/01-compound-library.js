  /* ── compound library ──────────────────────────────────────
     Every module that names a chemical reads from here, so a compound the
     user adds becomes available everywhere at once. Records carry Antoine
     constants (mmHg, °C), critical constants, UNIQUAC r/q and a liquid
     density; anything missing is filled by the Joback estimator below. */
  get BASE() {
    return {
      water: { n: 'Water', cas: '7732-18-5', f: 'H2O', A: 8.07131, B: 1730.63, Cc: 233.426, r: 0.9200, q: 1.400, Tc: 647.1, Pc: 220.55, w: 0.3449, M: 18.015, rho: 998, src: 'reference' },
      methanol: { n: 'Methanol', cas: '67-56-1', f: 'CH4O', A: 8.08097, B: 1582.271, Cc: 239.726, r: 1.4311, q: 1.432, Tc: 512.6, Pc: 80.97, w: 0.5658, M: 32.042, rho: 792, src: 'reference' },
      ethanol: { n: 'Ethanol', cas: '64-17-5', f: 'C2H6O', A: 8.20417, B: 1642.89, Cc: 230.300, r: 2.1055, q: 1.972, Tc: 513.9, Pc: 61.48, w: 0.6452, M: 46.068, rho: 789, src: 'reference' },
      ipa: { n: '2-Propanol', cas: '67-63-0', f: 'C3H8O', A: 8.87829, B: 2010.330, Cc: 252.636, r: 2.7791, q: 2.508, Tc: 508.3, Pc: 47.62, w: 0.6689, M: 60.095, rho: 786, src: 'reference' },
      nbutanol: { n: '1-Butanol', cas: '71-36-3', f: 'C4H10O', A: 7.83700, B: 1558.190, Cc: 196.881, r: 3.4543, q: 3.052, Tc: 563.0, Pc: 44.14, w: 0.5900, M: 74.122, rho: 810, src: 'reference' },
      acetone: { n: 'Acetone', cas: '67-64-1', f: 'C3H6O', A: 7.11714, B: 1210.595, Cc: 229.664, r: 2.5735, q: 2.336, Tc: 508.1, Pc: 47.01, w: 0.3065, M: 58.079, rho: 784, src: 'reference' },
      mek: { n: 'MEK (2-butanone)', cas: '78-93-3', f: 'C4H8O', A: 7.06356, B: 1261.340, Cc: 221.969, r: 3.2479, q: 2.876, Tc: 535.5, Pc: 41.54, w: 0.3231, M: 72.106, rho: 805, src: 'reference' },
      benzene: { n: 'Benzene', cas: '71-43-2', f: 'C6H6', A: 6.90565, B: 1211.033, Cc: 220.790, r: 3.1878, q: 2.400, Tc: 562.2, Pc: 48.98, w: 0.2103, M: 78.112, rho: 876, src: 'reference' },
      toluene: { n: 'Toluene', cas: '108-88-3', f: 'C7H8', A: 6.95464, B: 1344.800, Cc: 219.482, r: 3.9228, q: 2.968, Tc: 591.8, Pc: 41.06, w: 0.2640, M: 92.138, rho: 867, src: 'reference' },
      pxylene: { n: 'p-Xylene', cas: '106-42-3', f: 'C8H10', A: 6.99052, B: 1453.430, Cc: 215.307, r: 4.6578, q: 3.536, Tc: 616.2, Pc: 35.11, w: 0.3218, M: 106.165, rho: 861, src: 'reference' },
      ethylbenzene: { n: 'Ethylbenzene', cas: '100-41-4', f: 'C8H10', A: 6.95719, B: 1424.255, Cc: 213.206, r: 4.5972, q: 3.508, Tc: 617.2, Pc: 36.09, w: 0.3035, M: 106.165, rho: 867, src: 'reference' },
      chloroform: { n: 'Chloroform', cas: '67-66-3', f: 'CHCl3', A: 6.90328, B: 1163.030, Cc: 227.400, r: 2.8700, q: 2.410, Tc: 536.4, Pc: 54.72, w: 0.2185, M: 119.378, rho: 1489, src: 'reference' },
      dcm: { n: 'Dichloromethane', cas: '75-09-2', f: 'CH2Cl2', A: 7.40916, B: 1325.938, Cc: 252.616, r: 2.2560, q: 1.988, Tc: 510.0, Pc: 60.80, w: 0.1990, M: 84.933, rho: 1326, src: 'reference' },
      npentane: { n: 'n-Pentane', cas: '109-66-0', f: 'C5H12', A: 6.87632, B: 1075.780, Cc: 233.205, r: 3.8254, q: 3.316, Tc: 469.7, Pc: 33.70, w: 0.2515, M: 72.150, rho: 626, src: 'reference' },
      nhexane: { n: 'n-Hexane', cas: '110-54-3', f: 'C6H14', A: 6.87601, B: 1171.170, Cc: 224.408, r: 4.4998, q: 3.856, Tc: 507.6, Pc: 30.25, w: 0.3013, M: 86.177, rho: 655, src: 'reference' },
      nheptane: { n: 'n-Heptane', cas: '142-82-5', f: 'C7H16', A: 6.89386, B: 1264.370, Cc: 216.640, r: 5.1742, q: 4.396, Tc: 540.2, Pc: 27.40, w: 0.3495, M: 100.204, rho: 684, src: 'reference' },
      noctane: { n: 'n-Octane', cas: '111-65-9', f: 'C8H18', A: 6.91868, B: 1351.990, Cc: 209.150, r: 5.8486, q: 4.936, Tc: 568.7, Pc: 24.90, w: 0.3996, M: 114.231, rho: 703, src: 'reference' },
      cyclohexane: { n: 'Cyclohexane', cas: '110-82-7', f: 'C6H12', A: 6.84130, B: 1201.530, Cc: 222.650, r: 4.0464, q: 3.240, Tc: 553.5, Pc: 40.73, w: 0.2081, M: 84.161, rho: 779, src: 'reference' },
      propane: { n: 'Propane', cas: '74-98-6', f: 'C3H8', A: 6.82973, B: 813.200, Cc: 248.000, r: 2.4770, q: 2.236, Tc: 369.8, Pc: 42.48, w: 0.1523, M: 44.096, rho: 493, src: 'reference' },
      nbutane: { n: 'n-Butane', cas: '106-97-8', f: 'C4H10', A: 6.80896, B: 935.860, Cc: 238.730, r: 3.1502, q: 2.776, Tc: 425.1, Pc: 37.96, w: 0.2002, M: 58.123, rho: 579, src: 'reference' },
      ibutane: { n: 'Isobutane', cas: '75-28-5', f: 'C4H10', A: 6.74808, B: 882.800, Cc: 240.000, r: 3.1502, q: 2.776, Tc: 407.8, Pc: 36.40, w: 0.1835, M: 58.123, rho: 563, src: 'reference' },
      acetic: { n: 'Acetic acid', cas: '64-19-7', f: 'C2H4O2', A: 7.38782, B: 1533.313, Cc: 222.309, r: 2.2024, q: 2.072, Tc: 592.7, Pc: 57.86, w: 0.4665, M: 60.052, rho: 1049, src: 'reference' },
      ammonia: { n: 'Ammonia', cas: '7664-41-7', f: 'NH3', A: 7.55466, B: 1002.711, Cc: 247.885, r: 0.9080, q: 1.048, Tc: 405.5, Pc: 113.53, w: 0.2526, M: 17.031, rho: 682, src: 'reference' },
      co2: { n: 'Carbon dioxide', cas: '124-38-9', f: 'CO2', A: 9.81066, B: 1347.786, Cc: 273.000, r: 1.3000, q: 1.120, Tc: 304.2, Pc: 73.83, w: 0.2236, M: 44.010, rho: 770, src: 'reference' },
      mea: { n: 'Monoethanolamine', cas: '141-43-5', f: 'C2H7NO', A: 7.45680, B: 1577.670, Cc: 173.370, r: 3.0130, q: 2.836, Tc: 678.2, Pc: 71.24, w: 0.7500, M: 61.084, rho: 1012, src: 'reference' },
      egly: { n: 'Ethylene glycol', cas: '107-21-1', f: 'C2H6O2', A: 8.09083, B: 2088.936, Cc: 203.454, r: 2.4088, q: 2.248, Tc: 720.0, Pc: 77.00, w: 0.5068, M: 62.068, rho: 1113, src: 'reference' }
    };
  }
  loadLib() {
    try { const raw = window.localStorage.getItem('nomograph.lib.v1'); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') return o; } } catch (e) { }
    return {};
  }
  saveLib(lib) { try { window.localStorage.setItem('nomograph.lib.v1', JSON.stringify(lib)); } catch (e) { } }
  /* full library = built-ins plus whatever the user has added */
  lib() { return Object.assign({}, this.BASE, this.state.lib || {}); }
  cmp(key) { const L = this.lib(); return L[key] || L.water; }
  cmpOpts() {
    const L = this.lib(), base = this.BASE;
    const own = Object.keys(L).filter(k => !base[k]);
    const mk = k => [k, L[k].n + (own.indexOf(k) >= 0 ? '  \u2022 added' : '')];
    return Object.keys(base).map(mk).concat(own.map(mk));
  }
  addCmp(key, rec) {
    const lib = Object.assign({}, this.state.lib || {});
    lib[key] = rec; this.saveLib(lib); this.setState({ lib: lib });
  }
  delCmp(key) {
    const lib = Object.assign({}, this.state.lib || {});
    delete lib[key]; this.saveLib(lib); this.setState({ lib: lib });
  }
  slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 22) || ('c' + Date.now() % 100000); }

