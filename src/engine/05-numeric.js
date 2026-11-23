  /* ── numeric helpers ───────────────────────────────────── */
  rk4(f, y0, t0, t1, n) {
    const dt = (t1 - t0) / n, out = [[t0, y0.slice()]];
    let y = y0.slice(), t = t0;
    const ad = (a, b, s) => a.map((v, i) => v + b[i] * s);
    for (let i = 0; i < n; i++) {
      const k1 = f(t, y), k2 = f(t + dt / 2, ad(y, k1, dt / 2)), k3 = f(t + dt / 2, ad(y, k2, dt / 2)), k4 = f(t + dt, ad(y, k3, dt));
      y = y.map((v, j) => v + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      t += dt;
      out.push([t, y.slice()]);
    }
    return out;
  }
  simp(f, a, b, n) {
    n = n % 2 ? n + 1 : n;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }
  bis(f, a, b, tol) {
    let fa = f(a), fb = f(b);
    if (fa * fb > 0) return NaN;
    for (let i = 0; i < 90; i++) {
      const c = (a + b) / 2, fc = f(c);
      if (fa * fc <= 0) { b = c; fb = fc; } else { a = c; fa = fc; }
      if (Math.abs(b - a) < (tol || 1e-10)) break;
    }
    return (a + b) / 2;
  }

