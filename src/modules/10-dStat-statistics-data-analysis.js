  dStat() {
    const self = this, C = this.C;
    const S = 'Statistics & Data Analysis';
    const P = (k, label, min, max, step, val, cv, unit) => ({ k: k, label: label, min: min, max: max, step: step, val: val, cv: cv, unit: unit });
    const SEL = (k, label, val, options) => ({ k: k, label: label, val: val, type: 'select', options: options });

    /* ── special functions ─────────────────────────────── */
    const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    const logGamma = z => {
      if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
      z -= 1; let x = 0.99999999999980993;
      for (let i = 0; i < 8; i++) x += LG[i] / (z + i + 1);
      const t = z + 7.5;
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    };
    const logBeta = (a, b) => logGamma(a) + logGamma(b) - logGamma(a + b);
    const gammaP = (a, x) => {
      if (x <= 0) return 0;
      if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 300; n++) { t *= x / (a + n); s += t; if (Math.abs(t) < Math.abs(s) * 1e-15) break; } return s * Math.exp(-x + a * Math.log(x) - logGamma(a)); }
      let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
      for (let i = 1; i < 300; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
      return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    };
    const betaI = (x, a, b) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta(a, b));
      const cf = (x2, a2, b2) => {
        let c = 1, d = 1 - (a2 + b2) * x2 / (a2 + 1);
        if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
        for (let m = 1; m < 300; m++) {
          const m2 = 2 * m;
          let aa = m * (b2 - m) * x2 / ((a2 + m2 - 1) * (a2 + m2));
          d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
          c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
          d = 1 / d; h *= d * c;
          aa = -(a2 + m) * (a2 + b2 + m) * x2 / ((a2 + m2) * (a2 + m2 + 1));
          d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
          c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
          d = 1 / d; const del = d * c; h *= del;
          if (Math.abs(del - 1) < 1e-14) break;
        }
        return h;
      };
      return x < (a + 1) / (a + b + 2) ? bt * cf(x, a, b) / a : 1 - bt * cf(1 - x, b, a) / b;
    };
    const erf = x => { const s = x < 0 ? -1 : 1; return s * gammaP(0.5, x * x); };
    const normCDF = z => 0.5 * (1 + erf(z / Math.SQRT2));
    const normPDF = (x, m, s) => Math.exp(-Math.pow(x - m, 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
    const normInv = p => { if (p <= 0) return -8; if (p >= 1) return 8; return self.bis(z => normCDF(z) - p, -9, 9, 1e-12); };
    const tCDF = (t, v) => { const x = v / (v + t * t); const p = 0.5 * betaI(x, v / 2, 0.5); return t > 0 ? 1 - p : p; };
    const tInv = (p, v) => self.bis(t => tCDF(t, v) - p, -60, 60, 1e-11);
    const chi2CDF = (x, v) => gammaP(v / 2, x / 2);
    const chi2Inv = (p, v) => self.bis(x => chi2CDF(x, v) - p, 1e-9, 5000, 1e-10);
    const fCDF = (f, d1, d2) => f <= 0 ? 0 : betaI(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2);
    const fInv = (p, d1, d2) => self.bis(f => fCDF(f, d1, d2) - p, 1e-9, 5000, 1e-10);
    const rng = seed => { let s = (seed * 9301 + 49297) % 233280 + 1; return { u: () => { s = (s * 9301 + 49297) % 233280; return (s + 0.5) / 233280; }, n: function () { let a = 0, b = 0; while (a === 0) a = this.u(); while (b === 0) b = this.u(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); } }; };

    /* ── distribution registry (ported from the atlas) ── */
    const D = {
      normal: { n: 'Normal (\u03bc, \u03c3\u00b2)', d: 'c', p: ['\u03bc mean', '\u03c3 standard deviation', '\u2014'], def: [0, 1, 1], sup: q => [q[0] - 4.2 * q[1], q[0] + 4.2 * q[1]], f: (x, q) => normPDF(x, q[0], q[1]), m: q => q[0], v: q => q[1] * q[1], sk: () => 0, ku: () => 0, eq: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\!\\left[-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right]', use: 'Measurement error, sums of many small effects (CLT). Foundation of t, \u03c7\u00b2 and F.' },
      lognormal: { n: 'Lognormal (\u03bc, \u03c3)', d: 'c', p: ['\u03bc log-mean', '\u03c3 log-sd', '\u2014'], def: [0, 0.5, 1], sup: q => [1e-4, Math.exp(q[0] + 3.5 * q[1])], f: (x, q) => x <= 0 ? 0 : Math.exp(-Math.pow(Math.log(x) - q[0], 2) / (2 * q[1] * q[1])) / (x * q[1] * Math.sqrt(2 * Math.PI)), m: q => Math.exp(q[0] + q[1] * q[1] / 2), v: q => (Math.exp(q[1] * q[1]) - 1) * Math.exp(2 * q[0] + q[1] * q[1]), eq: 'f(x) = \\frac{1}{x\\sigma\\sqrt{2\\pi}}\\exp\\!\\left[-\\frac{(\\ln x-\\mu)^2}{2\\sigma^2}\\right]', use: 'Positive, right-skewed quantities: particle sizes, permeabilities, concentrations, cost estimates.' },
      uniform: { n: 'Uniform (a, b)', d: 'c', p: ['a minimum', 'b maximum', '\u2014'], def: [0, 1, 1], sup: q => [q[0] - 0.25 * (q[1] - q[0]), q[1] + 0.25 * (q[1] - q[0])], f: (x, q) => x >= q[0] && x <= q[1] ? 1 / (q[1] - q[0]) : 0, m: q => (q[0] + q[1]) / 2, v: q => Math.pow(q[1] - q[0], 2) / 12, eq: 'f(x) = \\frac{1}{b-a},\\quad a \\le x \\le b', use: 'Maximum-ignorance prior; the seed for inverse-transform sampling.' },
      exponential: { n: 'Exponential (\u03bb)', d: 'c', p: ['\u03bb rate', '\u2014', '\u2014'], def: [1, 1, 1], sup: q => [0, 7 / q[0]], f: (x, q) => x < 0 ? 0 : q[0] * Math.exp(-q[0] * x), m: q => 1 / q[0], v: q => 1 / (q[0] * q[0]), sk: () => 2, eq: 'f(x) = \\lambda e^{-\\lambda x}', use: 'Time between Poisson events, component lifetimes, RTD of a perfectly mixed vessel.' },
      gamma: { n: 'Gamma (r, \u03bb)', d: 'c', p: ['r shape', '\u03bb rate', '\u2014'], def: [2, 1, 1], sup: q => [0, q[0] / q[1] + 6 * Math.sqrt(q[0]) / q[1]], f: (x, q) => x <= 0 ? 0 : Math.exp(q[0] * Math.log(q[1]) + (q[0] - 1) * Math.log(x) - q[1] * x - logGamma(q[0])), m: q => q[0] / q[1], v: q => q[0] / (q[1] * q[1]), sk: q => 2 / Math.sqrt(q[0]), eq: 'f(x) = \\frac{\\lambda^rx^{r-1}e^{-\\lambda x}}{\\Gamma(r)}', use: 'Waiting time for r events; the tanks-in-series residence-time distribution.' },
      beta: { n: 'Beta (\u03b1, \u03b2)', d: 'c', p: ['\u03b1', '\u03b2', '\u2014'], def: [2, 2, 1], sup: () => [0, 1], f: (x, q) => x <= 0 || x >= 1 ? 0 : Math.exp((q[0] - 1) * Math.log(x) + (q[1] - 1) * Math.log(1 - x) - logBeta(q[0], q[1])), m: q => q[0] / (q[0] + q[1]), v: q => { const s = q[0] + q[1]; return q[0] * q[1] / (s * s * (s + 1)); }, eq: 'f(x) = \\frac{x^{\\alpha-1}(1-x)^{\\beta-1}}{B(\\alpha,\\beta)}', use: 'Yields, conversions, any bounded fraction; conjugate prior for a binomial probability.' },
      chi2: { n: 'Chi-squared (\u03bd)', d: 'c', p: ['\u03bd degrees of freedom', '\u2014', '\u2014'], def: [4, 1, 1], sup: q => [0, q[0] + 6 * Math.sqrt(2 * q[0])], f: (x, q) => x <= 0 ? 0 : Math.exp((q[0] / 2 - 1) * Math.log(x) - x / 2 - (q[0] / 2) * Math.LN2 - logGamma(q[0] / 2)), m: q => q[0], v: q => 2 * q[0], sk: q => Math.sqrt(8 / q[0]), eq: 'f(x) = \\frac{x^{\\nu/2-1}e^{-x/2}}{2^{\\nu/2}\\Gamma(\\nu/2)}', use: 'Goodness-of-fit and independence tests; inference on a variance.' },
      t: { n: 'Student t (\u03bd)', d: 'c', p: ['\u03bd degrees of freedom', '\u2014', '\u2014'], def: [5, 1, 1], sup: () => [-5.5, 5.5], f: (x, q) => Math.exp(logGamma((q[0] + 1) / 2) - logGamma(q[0] / 2) - 0.5 * Math.log(q[0] * Math.PI) - ((q[0] + 1) / 2) * Math.log(1 + x * x / q[0])), m: q => q[0] > 1 ? 0 : NaN, v: q => q[0] > 2 ? q[0] / (q[0] - 2) : Infinity, eq: 'f(t) = \\frac{\\Gamma\\!\\left(\\frac{\\nu+1}{2}\\right)}{\\sqrt{\\nu\\pi}\\,\\Gamma\\!\\left(\\frac{\\nu}{2}\\right)}\\left(1+\\frac{t^2}{\\nu}\\right)^{-\\frac{\\nu+1}{2}}', use: 't-tests and confidence intervals when \u03c3 is estimated from a small sample.' },
      f: { n: 'F (\u03bd\u2081, \u03bd\u2082)', d: 'c', p: ['\u03bd\u2081 numerator df', '\u03bd\u2082 denominator df', '\u2014'], def: [5, 10, 1], sup: q => [0, 6], f: (x, q) => x <= 0 ? 0 : Math.exp((q[0] / 2) * Math.log(q[0] / q[1]) + (q[0] / 2 - 1) * Math.log(x) - ((q[0] + q[1]) / 2) * Math.log(1 + q[0] * x / q[1]) - logBeta(q[0] / 2, q[1] / 2)), m: q => q[1] > 2 ? q[1] / (q[1] - 2) : NaN, v: q => q[1] > 4 ? 2 * q[1] * q[1] * (q[0] + q[1] - 2) / (q[0] * Math.pow(q[1] - 2, 2) * (q[1] - 4)) : NaN, eq: 'f(x) = \\frac{1}{B(\\nu_1/2,\\nu_2/2)}\\left(\\frac{\\nu_1}{\\nu_2}\\right)^{\\nu_1/2}\\frac{x^{\\nu_1/2-1}}{(1+\\nu_1x/\\nu_2)^{(\\nu_1+\\nu_2)/2}}', use: 'ANOVA, variance ratios, lack-of-fit tests in regression.' },
      weibull: { n: 'Weibull (k, \u03bb)', d: 'c', p: ['k shape', '\u03bb scale', '\u2014'], def: [2, 1, 1], sup: q => [0, q[1] * 3.2], f: (x, q) => x < 0 ? 0 : (q[0] / q[1]) * Math.pow(x / q[1], q[0] - 1) * Math.exp(-Math.pow(x / q[1], q[0])), m: q => q[1] * Math.exp(logGamma(1 + 1 / q[0])), v: q => q[1] * q[1] * (Math.exp(logGamma(1 + 2 / q[0])) - Math.pow(Math.exp(logGamma(1 + 1 / q[0])), 2)), eq: 'f(x) = \\frac{k}{\\lambda}\\left(\\frac{x}{\\lambda}\\right)^{k-1}e^{-(x/\\lambda)^k}', use: 'Equipment reliability and time to failure; k < 1 infant mortality, k > 1 wear-out.' },
      cauchy: { n: 'Cauchy (x\u2080, \u03b3)', d: 'c', p: ['x\u2080 location', '\u03b3 scale', '\u2014'], def: [0, 1, 1], sup: q => [q[0] - 8 * q[1], q[0] + 8 * q[1]], f: (x, q) => 1 / (Math.PI * q[1] * (1 + Math.pow((x - q[0]) / q[1], 2))), m: () => NaN, v: () => NaN, eq: 'f(x) = \\frac{1}{\\pi\\gamma\\left[1+\\left(\\frac{x-x_0}{\\gamma}\\right)^2\\right]}', use: 'The pathological case \u2014 no mean, no variance. Ratio of two standard normals.' },
      laplace: { n: 'Laplace (\u03bc, b)', d: 'c', p: ['\u03bc location', 'b scale', '\u2014'], def: [0, 1, 1], sup: q => [q[0] - 7 * q[1], q[0] + 7 * q[1]], f: (x, q) => Math.exp(-Math.abs(x - q[0]) / q[1]) / (2 * q[1]), m: q => q[0], v: q => 2 * q[1] * q[1], eq: 'f(x) = \\frac{1}{2b}e^{-|x-\\mu|/b}', use: 'Heavy-tailed errors; the L\u2081 (least absolute deviation) regression likelihood.' },
      bernoulli: { n: 'Bernoulli (p)', d: 'd', p: ['p success probability', '\u2014', '\u2014'], def: [0.4, 1, 1], sup: () => [0, 1], f: (k, q) => k === 0 ? 1 - q[0] : k === 1 ? q[0] : 0, m: q => q[0], v: q => q[0] * (1 - q[0]), eq: 'P(X=k) = p^k(1-p)^{1-k}', use: 'A single pass/fail trial \u2014 one item conforming or not.' },
      binomial: { n: 'Binomial (n, p)', d: 'd', p: ['n trials', 'p probability', '\u2014'], def: [20, 0.35, 1], sup: q => [0, Math.round(q[0])], f: (k, q) => { const n = Math.round(q[0]); if (k < 0 || k > n) return 0; return Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1) + k * Math.log(q[1]) + (n - k) * Math.log(1 - q[1])); }, m: q => q[0] * q[1], v: q => q[0] * q[1] * (1 - q[1]), eq: 'P(X=k) = \\binom{n}{k}p^k(1-p)^{n-k}', use: 'Defectives in a batch of n; acceptance sampling plans.' },
      poisson: { n: 'Poisson (\u03bb)', d: 'd', p: ['\u03bb mean count', '\u2014', '\u2014'], def: [4, 1, 1], sup: q => [0, Math.ceil(q[0] + 5 * Math.sqrt(q[0]) + 4)], f: (k, q) => k < 0 ? 0 : Math.exp(-q[0] + k * Math.log(q[0]) - logGamma(k + 1)), m: q => q[0], v: q => q[0], eq: 'P(X=k) = \\frac{\\lambda^ke^{-\\lambda}}{k!}', use: 'Rare events per unit time or area \u2014 leaks, trips, particles counted.' },
      geometric: { n: 'Geometric (p)', d: 'd', p: ['p success probability', '\u2014', '\u2014'], def: [0.3, 1, 1], sup: q => [0, Math.ceil(6 / q[0])], f: (k, q) => k < 0 ? 0 : Math.pow(1 - q[0], k) * q[0], m: q => (1 - q[0]) / q[0], v: q => (1 - q[0]) / (q[0] * q[0]), eq: 'P(X=k) = (1-p)^kp', use: 'Number of failures before the first success \u2014 memoryless in discrete time.' },
      negbin: { n: 'Negative binomial (r, p)', d: 'd', p: ['r successes', 'p probability', '\u2014'], def: [4, 0.4, 1], sup: q => [0, Math.ceil(q[0] * (1 - q[1]) / q[1] + 6 * Math.sqrt(q[0] * (1 - q[1])) / q[1] + 6)], f: (k, q) => k < 0 ? 0 : Math.exp(logGamma(k + q[0]) - logGamma(q[0]) - logGamma(k + 1) + q[0] * Math.log(q[1]) + k * Math.log(1 - q[1])), m: q => q[0] * (1 - q[1]) / q[1], v: q => q[0] * (1 - q[1]) / (q[1] * q[1]), eq: 'P(X=k) = \\binom{k+r-1}{k}p^r(1-p)^k', use: 'Overdispersed counts \u2014 when the Poisson variance is too small for the data.' },
      hypergeom: { n: 'Hypergeometric (N, K, n)', d: 'd', p: ['N population', 'K successes in N', 'n sample size'], def: [50, 15, 10], sup: q => [Math.max(0, Math.round(q[2] + q[1] - q[0])), Math.min(Math.round(q[2]), Math.round(q[1]))], f: (k, q) => { const N = Math.round(q[0]), K = Math.round(q[1]), n = Math.round(q[2]); if (k < 0 || k > K || n - k > N - K) return 0; const lc = (a, b) => logGamma(a + 1) - logGamma(b + 1) - logGamma(a - b + 1); return Math.exp(lc(K, k) + lc(N - K, n - k) - lc(N, n)); }, m: q => q[2] * q[1] / q[0], v: q => q[2] * (q[1] / q[0]) * (1 - q[1] / q[0]) * (q[0] - q[2]) / (q[0] - 1), eq: 'P(X=k) = \\frac{\\binom{K}{k}\\binom{N-K}{n-k}}{\\binom{N}{n}}', use: 'Sampling without replacement \u2014 lot inspection from a finite batch.' },
      dunif: { n: 'Discrete uniform (a, b)', d: 'd', p: ['a minimum', 'b maximum', '\u2014'], def: [1, 6, 1], sup: q => [Math.round(q[0]), Math.round(q[1])], f: (k, q) => k >= q[0] && k <= q[1] ? 1 / (Math.round(q[1]) - Math.round(q[0]) + 1) : 0, m: q => (q[0] + q[1]) / 2, v: q => (Math.pow(Math.round(q[1]) - Math.round(q[0]) + 1, 2) - 1) / 12, eq: 'P(X=k) = \\frac{1}{b-a+1}', use: 'Equally likely discrete outcomes \u2014 random sampling positions, dice.' }
    };
    const DOPT = Object.keys(D).map(k => [k, D[k].n]);

    /* ── hypothesis-test registry (ported from the atlas) ── */
    const T = {
      ttest_ind: { n: 'Independent samples t-test', pur: 'Compare the means of two independent groups.', h0: '\u03bc\u2081 = \u03bc\u2082', st: 't = (x\u0304\u2081 \u2212 x\u0304\u2082) / [s_p \u221a(1/n\u2081 + 1/n\u2082)],  df = n\u2081 + n\u2082 \u2212 2', asm: 'Independence; approximate normality in each group; equal variances.', eff: 'Cohen\u2019s d = (x\u0304\u2081 \u2212 x\u0304\u2082)/s_p \u2014 0.2 small, 0.5 medium, 0.8 large.', alt: 'Welch when variances differ; Mann\u2013Whitney when badly non-normal.', dist: 't' },
      welch: { n: 'Welch\u2019s t-test', pur: 'Compare two means without assuming equal variances \u2014 the safer default.', h0: '\u03bc\u2081 = \u03bc\u2082', st: 't = (x\u0304\u2081 \u2212 x\u0304\u2082) / \u221a(s\u2081\u00b2/n\u2081 + s\u2082\u00b2/n\u2082),  Welch\u2013Satterthwaite df', asm: 'Independence; approximate normality; variances may differ.', eff: 'Cohen\u2019s d using the average SD, or Glass\u2019s \u0394 against the control SD.', alt: 'Pooled t-test if variances really are equal; Mann\u2013Whitney if not normal.', dist: 't' },
      mannwhitney: { n: 'Mann\u2013Whitney U test', pur: 'Rank-based comparison of two groups \u2014 does one tend to give larger values?', h0: 'The two distributions are identical', st: 'U = R\u2081 \u2212 n\u2081(n\u2081+1)/2, normal approximation for large n', asm: 'Independence; ordinal or continuous data; similar shapes for a median reading.', eff: 'Rank-biserial r = 1 \u2212 2U/(n\u2081n\u2082), or probability of superiority.', alt: 'Independent t-test when normality holds.', dist: 'z' },
      paired_t: { n: 'Paired t-test', pur: 'Compare two measurements on the same units \u2014 before and after, matched pairs.', h0: '\u03bc_d = 0', st: 't = d\u0304 / (s_d/\u221an),  df = n \u2212 1', asm: 'Paired observations; the differences approximately normal.', eff: 'Cohen\u2019s d_z = d\u0304/s_d.', alt: 'Wilcoxon signed-rank when the differences are skewed.', dist: 't' },
      wilcoxon: { n: 'Wilcoxon signed-rank', pur: 'Non-parametric paired comparison on the ranks of the differences.', h0: 'The median difference is zero', st: 'W = \u03a3 signed ranks of |d_i|, normal approximation for n > 20', asm: 'Paired data; differences symmetric about their median.', eff: 'Matched-pairs rank-biserial correlation.', alt: 'Paired t-test when the differences are normal.', dist: 'z' },
      anova: { n: 'One-way ANOVA', pur: 'Test whether three or more independent group means differ at all.', h0: '\u03bc\u2081 = \u03bc\u2082 = \u2026 = \u03bc_k', st: 'F = MS_between / MS_within,  df = (k\u22121, N\u2212k)', asm: 'Independence; normal residuals; homogeneous variances (check with Levene).', eff: '\u03b7\u00b2 = SS_between/SS_total; \u03c9\u00b2 is the less biased version.', alt: 'Welch\u2019s ANOVA for unequal variances; Kruskal\u2013Wallis for non-normal data.', dist: 'F' },
      kruskal: { n: 'Kruskal\u2013Wallis H test', pur: 'Rank-based alternative to one-way ANOVA for three or more groups.', h0: 'All groups share the same distribution', st: 'H = 12/[N(N+1)] \u03a3 R\u2c7c\u00b2/n\u2c7c \u2212 3(N+1) \u2248 \u03c7\u00b2(k\u22121)', asm: 'Independence; ordinal or continuous data; similar shapes.', eff: '\u03b5\u00b2 = H/(N\u22121).', alt: 'One-way ANOVA; follow up with Dunn\u2019s test.', dist: 'chi2' },
      ztest_prop: { n: 'Two-proportion z-test', pur: 'Compare the success rates of two independent groups.', h0: 'p\u2081 = p\u2082', st: 'z = (p\u0302\u2081 \u2212 p\u0302\u2082) / \u221a[p\u0304(1\u2212p\u0304)(1/n\u2081 + 1/n\u2082)]', asm: 'Independence; at least 5 successes and 5 failures expected in each group.', eff: 'Risk difference, relative risk, or odds ratio.', alt: 'Fisher\u2019s exact test for small expected counts.', dist: 'z' },
      fisher: { n: 'Fisher\u2019s exact test', pur: 'Exact association test for a 2\u00d72 table with small counts.', h0: 'The two classifications are independent', st: 'Hypergeometric probability of tables at least as extreme', asm: 'Independence; fixed margins (conservative if not).', eff: 'Odds ratio with a conditional maximum-likelihood confidence interval.', alt: 'Chi-square test when all expected counts exceed 5.', dist: 'none' },
      chi_indep: { n: 'Chi-square test of independence', pur: 'Test association between two categorical variables in an r\u00d7c table.', h0: 'The row and column classifications are independent', st: '\u03c7\u00b2 = \u03a3 (O \u2212 E)\u00b2/E,  df = (r\u22121)(c\u22121)', asm: 'Independence; expected count at least 5 in 80 % of the cells.', eff: 'Cram\u00e9r\u2019s V = \u221a[\u03c7\u00b2/(N\u00b7min(r\u22121,c\u22121))].', alt: 'Fisher\u2013Freeman\u2013Halton for sparse tables.', dist: 'chi2' },
      chi_gof: { n: 'Chi-square goodness of fit', pur: 'Compare observed frequencies with a specified distribution.', h0: 'The data follow the specified distribution', st: '\u03c7\u00b2 = \u03a3 (O \u2212 E)\u00b2/E,  df = k \u2212 1 \u2212 (fitted parameters)', asm: 'Independence; expected counts at least 5 per bin.', eff: 'Cohen\u2019s w = \u221a(\u03c7\u00b2/N).', alt: 'Kolmogorov\u2013Smirnov or Anderson\u2013Darling for continuous data.', dist: 'chi2' },
      pearson: { n: 'Pearson correlation r', pur: 'Strength of the linear relationship between two continuous variables.', h0: '\u03c1 = 0', st: 't = r\u221a(n\u22122)/\u221a(1\u2212r\u00b2),  df = n \u2212 2', asm: 'Bivariate normality; linearity; no influential outliers.', eff: 'r itself; r\u00b2 is the variance explained.', alt: 'Spearman\u2019s \u03c1 for monotonic but non-linear relationships.', dist: 't' },
      spearman: { n: 'Spearman rank correlation \u03c1', pur: 'Monotonic association, robust to outliers and non-normality.', h0: '\u03c1_s = 0', st: 'Pearson r computed on the ranks; t approximation with n \u2212 2 df', asm: 'Independence; ordinal or continuous data; monotonic relationship.', eff: '\u03c1_s itself.', alt: 'Pearson r when the relationship is linear and the data normal.', dist: 't' },
      ftest_var: { n: 'F-test for equality of variances', pur: 'Compare the variances of two normal populations.', h0: '\u03c3\u2081\u00b2 = \u03c3\u2082\u00b2', st: 'F = s\u2081\u00b2/s\u2082\u00b2,  df = (n\u2081\u22121, n\u2082\u22121)', asm: 'Independence; both samples normal \u2014 the test is very sensitive to this.', eff: 'Variance ratio with its confidence interval.', alt: 'Levene or Brown\u2013Forsythe, which are robust to non-normality.', dist: 'F' },
      levene: { n: 'Levene\u2019s test', pur: 'Equality of variances across groups, robust to non-normality.', h0: 'All group variances are equal', st: 'F on the absolute deviations from each group median (Brown\u2013Forsythe)', asm: 'Independence; the deviations approximately symmetric.', eff: 'Ratio of the largest to smallest group variance.', alt: 'Bartlett\u2019s test if normality is assured.', dist: 'F' },
      shapiro: { n: 'Shapiro\u2013Wilk test', pur: 'Test whether a sample came from a normal distribution.', h0: 'The data are normally distributed', st: 'W = (\u03a3a_ix_{(i)})\u00b2 / \u03a3(x_i \u2212 x\u0304)\u00b2', asm: 'Independent observations; best for n between 3 and 5000.', eff: 'W itself \u2014 close to 1 means close to normal.', alt: 'Anderson\u2013Darling is more sensitive in the tails; Q\u2013Q plots always.', dist: 'none' },
      ks: { n: 'Kolmogorov\u2013Smirnov test', pur: 'Compare a sample with a distribution, or two samples with each other.', h0: 'The samples come from the same distribution', st: 'D = sup|F_n(x) \u2212 F(x)|', asm: 'Continuous distribution fully specified in advance \u2014 otherwise conservative.', eff: 'D itself.', alt: 'Anderson\u2013Darling weights the tails; Lilliefors for estimated parameters.', dist: 'none' },
      ztest_1: { n: 'One-sample z-test', pur: 'Compare a sample mean with a known target when \u03c3 is known.', h0: '\u03bc = \u03bc\u2080', st: 'z = (x\u0304 \u2212 \u03bc\u2080)/(\u03c3/\u221an)', asm: 'Independence; known population standard deviation; normal or large n.', eff: 'Cohen\u2019s d = (x\u0304 \u2212 \u03bc\u2080)/\u03c3.', alt: 'One-sample t-test when \u03c3 must be estimated.', dist: 'z' },
      ttest_1: { n: 'One-sample t-test', pur: 'Compare a sample mean with a target when \u03c3 is estimated from the data.', h0: '\u03bc = \u03bc\u2080', st: 't = (x\u0304 \u2212 \u03bc\u2080)/(s/\u221an),  df = n \u2212 1', asm: 'Independence; approximate normality (robust for n above about 30).', eff: 'Cohen\u2019s d = (x\u0304 \u2212 \u03bc\u2080)/s.', alt: 'Wilcoxon signed-rank for skewed data.', dist: 't' }
    };
    const TOPT = Object.keys(T).map(k => [k, T[k].n]);

    return [
      {
        id: 'distatlas', num: 'D-01', sec: S, name: 'Distribution atlas',
        blurb: 'Nineteen probability distributions with their densities, moments and the situations that produce them. Most are related \u2014 the chi-squared is a gamma, the exponential is a Weibull, the t becomes normal \u2014 and knowing which one a measurement should follow is usually more informative than any test performed on it.',
        howto: 'Change the parameters and watch the shape, then read the moment table: mean, variance, skewness and the coefficient of variation together characterise a distribution far better than a name does. For process data the practical question is almost always whether the quantity is bounded, positive, or symmetric \u2014 that narrows the choice to two or three, and the tail behaviour picks between them.',
        std: 'Johnson, Kotz & Balakrishnan, Continuous Univariate Distributions; Montgomery & Runger, Applied Statistics and Probability for Engineers, 7th ed.',
        eqs: [['E[X] = \\int x f(x)\\,dx,\\qquad \\mathrm{Var}[X] = E[X^2]-E[X]^2', 'the first two moments'], ['CV = \\frac{\\sigma}{\\mu}', 'coefficient of variation \u2014 relative spread'], ['F(x) = \\int_{-\\infty}^{x} f(u)\\,du', 'cumulative distribution function'], ['\\gamma_1 = E\\!\\left[\\left(\\frac{X-\\mu}{\\sigma}\\right)^{3}\\right]', 'skewness']],
        notes: ['Parameter meanings change with the selected distribution \u2014 the results panel names them.', 'Discrete distributions are drawn as a stem plot; continuous ones as a density curve.', 'Moments computed analytically where a closed form exists, numerically otherwise.', 'The shaded region is the central interval containing the stated probability.'],
        params: [SEL('d', 'Distribution', 'normal', DOPT), P('p1', 'Parameter \u03b8\u2081', -20, 100, 0.05, 0, null, '\u2014'), P('p2', 'Parameter \u03b8\u2082', 0.05, 100, 0.05, 1, null, '\u2014'), P('p3', 'Parameter \u03b8\u2083', 1, 200, 1, 10, null, '\u2014'), P('cov', 'Central interval', 0.5, 0.999, 0.005, 0.95, null, '\u2014')],
        compute: v => {
          const d = D[v.d], q = [v.p1, v.p2, v.p3];
          if (d.d === 'd' && (v.d === 'binomial' || v.d === 'negbin' || v.d === 'hypergeom' || v.d === 'dunif' || v.d === 'chi2' || v.d === 'f')) { q[0] = Math.max(Math.round(q[0]), 1); }
          const sup = d.sup(q);
          let mean = d.m ? d.m(q) : NaN, vr = d.v ? d.v(q) : NaN;
          let num = { m: 0, v: 0, s: 0, tot: 0 };
          if (d.d === 'c') {
            const n = 2000, h = (sup[1] - sup[0]) / n;
            for (let i = 0; i <= n; i++) { const x = sup[0] + i * h, w = (i === 0 || i === n) ? 0.5 : 1; const p = d.f(x, q) * h * w; num.tot += p; num.m += x * p; }
            for (let i = 0; i <= n; i++) { const x = sup[0] + i * h, w = (i === 0 || i === n) ? 0.5 : 1; const p = d.f(x, q) * h * w; num.v += Math.pow(x - num.m, 2) * p; num.s += Math.pow(x - num.m, 3) * p; }
          } else {
            for (let k = Math.floor(sup[0]); k <= Math.ceil(sup[1]); k++) { const p = d.f(k, q); num.tot += p; num.m += k * p; }
            for (let k = Math.floor(sup[0]); k <= Math.ceil(sup[1]); k++) { const p = d.f(k, q); num.v += Math.pow(k - num.m, 2) * p; num.s += Math.pow(k - num.m, 3) * p; }
          }
          const sd = Math.sqrt(isFinite(vr) ? vr : num.v);
          const skew = d.sk ? d.sk(q) : num.s / Math.pow(Math.sqrt(num.v), 3);
          let mode = sup[0], pm = -1;
          if (d.d === 'c') { for (let i = 0; i <= 600; i++) { const x = sup[0] + (sup[1] - sup[0]) * i / 600; const p = d.f(x, q); if (p > pm) { pm = p; mode = x; } } }
          else { for (let k = Math.floor(sup[0]); k <= Math.ceil(sup[1]); k++) { const p = d.f(k, q); if (p > pm) { pm = p; mode = k; } } }
          const cdf = x => {
            if (d.d === 'd') { let s = 0; for (let k = Math.floor(sup[0]); k <= x; k++) s += d.f(k, q); return s; }
            const n = 800, h = (x - sup[0]) / n; let s = 0;
            for (let i = 0; i <= n; i++) s += d.f(sup[0] + i * h, q) * h * ((i === 0 || i === n) ? 0.5 : 1);
            return s;
          };
          const al = (1 - v.cov) / 2;
          const qlo = d.d === 'c' ? self.bis(x => cdf(x) - al, sup[0], sup[1], 1e-8) : sup[0];
          const qhi = d.d === 'c' ? self.bis(x => cdf(x) - (1 - al), sup[0], sup[1], 1e-8) : sup[1];
          const rows = DOPT.map(k => {
            const dd = D[k[0]], qq = dd.def;
            return [dd.n, dd.d === 'c' ? 'continuous' : 'discrete', dd.p[0], dd.p[1], isFinite(dd.m(qq)) ? dd.m(qq).toPrecision(4) : '\u2014', isFinite(dd.v(qq)) ? dd.v(qq).toPrecision(4) : '\u2014'];
          });
          return {
            d: d, q: q, sup: sup, cdf: cdf, qlo: qlo, qhi: qhi, mode: mode,
            res: [{ l: 'Distribution', s: d.n, u: '' }, { l: 'Type', s: d.d === 'c' ? 'continuous density' : 'discrete mass function', u: '' }, { l: '\u03b8\u2081 means', s: d.p[0], u: '' }, { l: '\u03b8\u2082 means', s: d.p[1], u: '' }, { l: '\u03b8\u2083 means', s: d.p[2], u: '' }, { l: 'Support', s: '[' + sup[0].toPrecision(4) + ', ' + sup[1].toPrecision(4) + ']', u: '' }, { l: 'Mean', v: isFinite(mean) ? mean : num.m, u: '\u2014', d: 5 }, { l: 'Variance', v: isFinite(vr) ? vr : num.v, u: '\u2014', d: 5 }, { l: 'Standard deviation', v: sd, u: '\u2014', d: 5 }, { l: 'Coefficient of variation', v: sd / Math.abs(isFinite(mean) ? mean : num.m), u: '\u2014', d: 4 }, { l: 'Skewness', v: skew, u: '\u2014', d: 4 }, { l: 'Mode', v: mode, u: '\u2014', d: 4 }, { l: 'Lower quantile', v: qlo, u: '\u2014', d: 4 }, { l: 'Upper quantile', v: qhi, u: '\u2014', d: 4 }, { l: 'Where it comes from', s: d.use, u: '' }],
            table: { title: 'The full registry, shown at its default parameters', head: ['Distribution', 'type', '\u03b8\u2081', '\u03b8\u2082', 'mean', 'variance'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const d = r.d, sup = r.sup;
          let ymax = 0;
          if (d.d === 'c') { for (let i = 0; i <= 400; i++) ymax = Math.max(ymax, d.f(sup[0] + (sup[1] - sup[0]) * i / 400, r.q)); }
          else { for (let k = Math.floor(sup[0]); k <= Math.ceil(sup[1]); k++) ymax = Math.max(ymax, d.f(k, r.q)); }
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: sup[0], xmax: sup[1], ymin: 0, ymax: ymax * 1.18, ml: 68 });
          g.grid(d.d === 'c' ? 'x' : 'k', d.d === 'c' ? 'Probability density  f(x)' : 'Probability mass  P(X = k)');
          g.title(d.n);
          if (d.d === 'c') {
            const inner = [];
            for (let i = 0; i <= 200; i++) { const x = r.qlo + (r.qhi - r.qlo) * i / 200; inner.push([x, d.f(x, r.q)]); }
            g.fill([[r.qlo, 0]].concat(inner).concat([[r.qhi, 0]]), C.soft);
            g.fn(x => d.f(x, r.q), C.acc, 2.8, null, 500);
            const m = d.m ? d.m(r.q) : NaN;
            if (isFinite(m)) g.line([[m, 0], [m, ymax * 1.05]], C.dk, 1.6, [6, 4]);
            g.line([[r.mode, 0], [r.mode, d.f(r.mode, r.q)]], C.mid, 1.2, [3, 3]);
            g.legend([{ c: C.acc, l: 'density' }, { c: C.dk, l: 'mean', d: [6, 4] }, { c: C.mid, l: 'mode', d: [3, 3] }]);
          } else {
            const lo = Math.floor(sup[0]), hi = Math.ceil(sup[1]);
            const wpx = Math.max(2, Math.min(18, (g.w / Math.max(hi - lo + 1, 1)) * 0.55));
            for (let k = lo; k <= hi; k++) {
              const p = d.f(k, r.q); if (!(p > 0)) continue;
              ctx.save(); ctx.fillStyle = C.acc; ctx.globalAlpha = 0.82;
              ctx.fillRect(g.X(k) - wpx / 2, g.Y(p), wpx, g.Y(0) - g.Y(p)); ctx.restore();
            }
            const m = d.m ? d.m(r.q) : NaN;
            if (isFinite(m)) g.line([[m, 0], [m, ymax * 1.1]], C.dk, 1.6, [6, 4]);
            g.legend([{ c: C.acc, l: 'mass function' }, { c: C.dk, l: 'mean', d: [6, 4] }]);
          }
        }
      },
      {
        id: 'hyptest', num: 'D-02', sec: S, name: 'Hypothesis test selector & p-value',
        blurb: 'Nineteen tests, what each one assumes, what statistic it computes and what to use instead when the assumption fails \u2014 with the reference distribution drawn and the rejection region shaded so the p-value stops being an abstraction.',
        howto: 'Pick the test that matches your design, then enter the statistic and degrees of freedom to see where it falls. The shaded tail is \u03b1; if the marker is in it you reject. Two things are worth watching: how much the critical value moves as the degrees of freedom fall below about 15 \u2014 that is the cost of a small sample \u2014 and how much a one-tailed test changes the threshold, which is why the choice of tails must be made before the data are seen.',
        std: 'Montgomery & Runger, Ch. 9\u201310; Wasserman, All of Statistics; ASTM E178 and E691 for the engineering conventions',
        eqs: [['p = P(|T| \\ge |t_{obs}| \\mid H_0)', 'the p-value \u2014 a statement about the data, not the hypothesis'], ['\\text{reject } H_0 \\text{ if } p < \\alpha', 'the decision rule'], ['\\text{Power} = 1 - \\beta = P(\\text{reject}\\mid H_1)', 'the probability of catching a real effect'], ['n \\approx \\frac{2(z_{\\alpha/2}+z_\\beta)^2}{d^2}', 'sample size per group for effect size d']],
        notes: ['Exact distributions used: Student t, chi-squared, F, standard normal.', 'Tests with no simple reference distribution (Fisher exact, Shapiro\u2013Wilk, Kolmogorov\u2013Smirnov) show the guidance only.', 'Power computed for the two-sided normal case at the stated effect size.', 'A non-significant result is not evidence of no effect \u2014 check the power.'],
        params: [SEL('t', 'Test', 'ttest_ind', TOPT), P('stat', 'Observed test statistic', -12, 40, 0.01, 2.35, null, '\u2014'), P('df1', 'Degrees of freedom (or \u03bd\u2081)', 1, 300, 1, 18, null, '\u2014'), P('df2', 'Second df (F tests)', 1, 300, 1, 20, null, '\u2014'), SEL('tails', 'Tails', '2', [['2', 'Two-tailed'], ['1', 'One-tailed']]), P('alpha', 'Significance level \u03b1', 0.001, 0.2, 0.001, 0.05, null, '\u2014'), P('eff', 'Effect size for the power calculation', 0.05, 3, 0.05, 0.5, null, '\u2014'), P('n', 'Sample size per group', 3, 500, 1, 20, null, '\u2014')],
        compute: v => {
          const t = T[v.t], kind = t.dist;
          const tails = v.tails === '1' ? 1 : 2;
          let p = NaN, crit = NaN, pdf = null, xr = [0, 1];
          if (kind === 't') { p = tails === 2 ? 2 * (1 - tCDF(Math.abs(v.stat), v.df1)) : 1 - tCDF(v.stat, v.df1); crit = tInv(1 - v.alpha / tails, v.df1); pdf = x => D.t.f(x, [v.df1]); xr = [-5.2, 5.2]; }
          else if (kind === 'z') { p = tails === 2 ? 2 * (1 - normCDF(Math.abs(v.stat))) : 1 - normCDF(v.stat); crit = normInv(1 - v.alpha / tails); pdf = x => normPDF(x, 0, 1); xr = [-5.2, 5.2]; }
          else if (kind === 'chi2') { p = 1 - chi2CDF(Math.max(v.stat, 0), v.df1); crit = chi2Inv(1 - v.alpha, v.df1); pdf = x => D.chi2.f(x, [v.df1]); xr = [0, Math.max(crit * 1.8, v.stat * 1.3, v.df1 * 2.5)]; }
          else if (kind === 'F') { p = 1 - fCDF(Math.max(v.stat, 0), v.df1, v.df2); crit = fInv(1 - v.alpha, v.df1, v.df2); pdf = x => D.f.f(x, [v.df1, v.df2]); xr = [0, Math.max(crit * 2, v.stat * 1.3, 5)]; }
          const sig = p < v.alpha;
          const za = normInv(1 - v.alpha / tails), zb = v.eff * Math.sqrt(v.n / 2) - za;
          const power = normCDF(zb);
          const nReq = Math.ceil(2 * Math.pow(za + normInv(0.8), 2) / (v.eff * v.eff));
          const rows = TOPT.map(k => [T[k[0]].n, T[k[0]].dist === 'none' ? 'special' : T[k[0]].dist, T[k[0]].h0, T[k[0]].alt]);
          return {
            pdf: pdf, xr: xr, crit: crit, kind: kind, tails: tails, p: p,
            res: [{ l: 'Test', s: t.n, u: '' }, { l: 'Purpose', s: t.pur, u: '' }, { l: 'Null hypothesis H\u2080', s: t.h0, u: '' }, { l: 'Test statistic', s: t.st, u: '' }, { l: 'Assumptions', s: t.asm, u: '' }, { l: 'Reference distribution', s: kind === 'none' ? 'no simple closed form \u2014 use tables or software' : kind === 't' ? 'Student t with ' + v.df1 + ' df' : kind === 'chi2' ? 'chi-squared with ' + v.df1 + ' df' : kind === 'F' ? 'F(' + v.df1 + ', ' + v.df2 + ')' : 'standard normal', u: '' }, { l: 'Critical value', v: crit, u: '\u2014', d: 4 }, { l: 'p-value', v: p, u: '\u2014', d: 6 }, { l: 'Decision at \u03b1 = ' + v.alpha, s: kind === 'none' ? 'not computed for this test' : sig ? 'reject H\u2080 \u2014 statistically significant' : 'fail to reject H\u2080', u: '' }, { l: 'Effect size guidance', s: t.eff, u: '' }, { l: 'Power at this effect size', v: power, u: '\u2014', d: 4 }, { l: 'n per group for 80 % power', s: String(nReq), u: '' }, { l: 'If assumptions fail', s: t.alt, u: '' }, { l: 'Caution', s: !sig && power < 0.8 ? 'under-powered \u2014 absence of significance is not evidence of no effect' : sig && v.n < 10 ? 'small sample \u2014 confirm the distributional assumption' : 'design adequate for this effect size', u: '' }],
            table: { title: 'The full test registry', head: ['Test', 'reference', 'H\u2080', 'if the assumptions fail'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          if (!r.pdf) {
            const g0 = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, ml: 60 });
            g0.grid('', '');
            g0.title('No closed-form reference distribution for this test');
            g0.ptxt('Use exact tables or software \u2014 the guidance panel gives the statistic and its alternatives.', g0.x + 16, g0.y + g0.h / 2, C.mid, 'left', 13);
            return;
          }
          let ymax = 0; for (let i = 0; i <= 400; i++) ymax = Math.max(ymax, r.pdf(r.xr[0] + (r.xr[1] - r.xr[0]) * i / 400));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: r.xr[0], xmax: r.xr[1], ymin: 0, ymax: ymax * 1.2, ml: 66 });
          g.grid('Test statistic', 'Density under H\u2080');
          g.title('Rejection region at \u03b1 = ' + v.alpha + ', ' + (r.tails === 2 ? 'two-tailed' : 'one-tailed'));
          const tail = (a, b2) => { const pts = [[a, 0]]; for (let i = 0; i <= 120; i++) { const x = a + (b2 - a) * i / 120; pts.push([x, r.pdf(x)]); } pts.push([b2, 0]); g.fill(pts, C.soft3); };
          tail(r.crit, r.xr[1]);
          if (r.tails === 2 && (r.kind === 't' || r.kind === 'z')) tail(r.xr[0], -r.crit);
          g.fn(x => r.pdf(x), C.acc, 2.8, null, 500);
          g.line([[r.crit, 0], [r.crit, ymax * 1.1]], C.warn, 1.6, [5, 4]);
          if (r.tails === 2 && (r.kind === 't' || r.kind === 'z')) g.line([[-r.crit, 0], [-r.crit, ymax * 1.1]], C.warn, 1.6, [5, 4]);
          const sx = Math.min(Math.max(v.stat, r.xr[0]), r.xr[1]);
          g.line([[sx, 0], [sx, ymax * 1.15]], C.dk, 2.2);
          g.dot(sx, r.pdf(sx), C.dk, 5);
          if (g.w > 300) { g.txt('observed', sx, ymax * 1.15, C.dk, 'center', 11.5, 'bottom'); g.txt('p = ' + (isFinite(r.p) ? r.p.toPrecision(3) : '\u2014'), r.xr[0] + (r.xr[1] - r.xr[0]) * 0.02, ymax * 1.1, C.mid, 'left', 12); }
          g.legend([{ c: C.acc, l: 'null distribution' }, { c: C.warn, l: 'critical value', d: [5, 4] }, { c: C.dk, l: 'observed statistic' }]);
        }
      },
      {
        id: 'clt', num: 'D-03', sec: S, name: 'Central limit theorem & sampling distributions',
        blurb: 'The reason so much of engineering statistics assumes normality: whatever the population looks like, the distribution of its sample mean tends to a normal one, and it does so surprisingly fast. How fast depends entirely on how skewed the population is, and that is worth seeing rather than being told.',
        howto: 'Start with the exponential population and n = 2 \u2014 the sampling distribution is still visibly skewed. Raise n and watch it straighten. The rule of thumb that n = 30 is enough holds for mildly skewed populations and fails badly for a lognormal with large \u03c3, where several hundred may be needed. The standard error always falls as 1/\u221an, which is the other half of the theorem and the reason precision is expensive.',
        std: 'Montgomery & Runger, Ch. 7; Rice, Mathematical Statistics and Data Analysis, Ch. 5',
        eqs: [['\\bar X = \\frac{1}{n}\\sum_{i=1}^{n}X_i', 'the sample mean'], ['E[\\bar X] = \\mu,\\qquad \\mathrm{Var}[\\bar X] = \\frac{\\sigma^2}{n}', 'exact for any population'], ['\\frac{\\bar X - \\mu}{\\sigma/\\sqrt n} \\xrightarrow{d} N(0,1)', 'the central limit theorem'], ['\\gamma_1(\\bar X) = \\frac{\\gamma_1(X)}{\\sqrt n}', 'skewness decays as 1/\u221an \u2014 the convergence rate']],
        notes: ['Sampling distribution built by Monte Carlo with the stated number of replicates.', 'Populations available: uniform, exponential, lognormal, Bernoulli and bimodal.', 'The overlaid curve is the normal predicted by the central limit theorem, not a fit.', 'Seeded generator \u2014 the same seed reproduces the same experiment.'],
        params: [SEL('pop', 'Population', 'exp', [['unif', 'Uniform'], ['exp', 'Exponential'], ['logn', 'Lognormal'], ['bern', 'Bernoulli'], ['bimod', 'Bimodal']]), P('n', 'Sample size n', 1, 200, 1, 5, null, '\u2014'), P('reps', 'Monte Carlo replicates', 200, 20000, 100, 4000, null, '\u2014'), P('shape', 'Population shape parameter', 0.05, 3, 0.05, 1, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 5, null, '\u2014')],
        compute: v => {
          const R = rng(v.seed);
          const draw = () => {
            if (v.pop === 'unif') return R.u();
            if (v.pop === 'exp') return -Math.log(R.u()) / v.shape;
            if (v.pop === 'logn') return Math.exp(R.n() * v.shape);
            if (v.pop === 'bern') return R.u() < Math.min(v.shape / 3, 0.95) ? 1 : 0;
            return R.u() < 0.5 ? R.n() * 0.35 - 1.4 : R.n() * 0.35 + 1.4;
          };
          const popStats = { unif: [0.5, 1 / 12, 0], exp: [1 / v.shape, 1 / (v.shape * v.shape), 2], logn: [Math.exp(v.shape * v.shape / 2), (Math.exp(v.shape * v.shape) - 1) * Math.exp(v.shape * v.shape), 0], bern: [Math.min(v.shape / 3, 0.95), Math.min(v.shape / 3, 0.95) * (1 - Math.min(v.shape / 3, 0.95)), 0], bimod: [0, 1.4 * 1.4 + 0.35 * 0.35, 0] }[v.pop];
          const mu = popStats[0], s2 = popStats[1];
          const n = Math.round(v.n), reps = Math.round(v.reps);
          const means = [];
          let sm = 0, ss = 0, s3 = 0;
          for (let r2 = 0; r2 < reps; r2++) { let t = 0; for (let i = 0; i < n; i++) t += draw(); const m = t / n; means.push(m); sm += m; }
          const mbar = sm / reps;
          means.forEach(m => { ss += Math.pow(m - mbar, 2); s3 += Math.pow(m - mbar, 3); });
          const sdM = Math.sqrt(ss / (reps - 1));
          const skewM = (s3 / reps) / Math.pow(sdM, 3);
          const seTheo = Math.sqrt(s2 / n);
          const lo = mbar - 4.2 * sdM, hi = mbar + 4.2 * sdM;
          const nb = 42, bins = new Array(nb).fill(0);
          means.forEach(m => { const i = Math.floor((m - lo) / (hi - lo) * nb); if (i >= 0 && i < nb) bins[i]++; });
          const bw = (hi - lo) / nb;
          const dens = bins.map(c => c / (reps * bw));
          /* Kolmogorov–Smirnov against the CLT normal */
          const sortM = means.slice().sort((a, b2) => a - b2);
          let Dks = 0;
          for (let i = 0; i < reps; i++) { const F = normCDF((sortM[i] - mbar) / sdM); Dks = Math.max(Dks, Math.abs((i + 1) / reps - F), Math.abs(F - i / reps)); }
          const kscrit = 1.36 / Math.sqrt(reps);
          return {
            dens: dens, lo: lo, hi: hi, bw: bw, mbar: mbar, sdM: sdM,
            res: [{ l: 'Population mean \u03bc', v: mu, u: '\u2014', d: 5 }, { l: 'Population variance \u03c3\u00b2', v: s2, u: '\u2014', d: 5 }, { l: 'Population skewness', v: popStats[2], u: '\u2014', d: 3 }, { l: 'Sample size n', s: String(n), u: '' }, { l: 'Mean of the sample means', v: mbar, u: '\u2014', d: 5 }, { l: 'Observed standard error', v: sdM, u: '\u2014', d: 5 }, { l: 'Theoretical \u03c3/\u221an', v: seTheo, u: '\u2014', d: 5 }, { l: 'Agreement', v: sdM / seTheo, u: '\u2014', d: 4 }, { l: 'Skewness of the sample means', v: skewM, u: '\u2014', d: 4 }, { l: 'Predicted skewness \u03b3\u2081/\u221an', v: popStats[2] / Math.sqrt(n), u: '\u2014', d: 4 }, { l: 'Kolmogorov\u2013Smirnov D', v: Dks, u: '\u2014', d: 5 }, { l: 'KS critical value (5 %)', v: kscrit, u: '\u2014', d: 5 }, { l: 'Normality of the sample mean', s: Dks < kscrit ? 'indistinguishable from normal at this n' : Math.abs(skewM) > 0.4 ? 'still visibly skewed \u2014 increase n' : 'close but detectably non-normal', u: '' }, { l: 'n for a normal sample mean', s: popStats[2] > 1.5 ? 'roughly ' + Math.ceil(Math.pow(popStats[2] / 0.2, 2)) + ' for skewness below 0.2' : 'about 20\u201330 is sufficient here', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let ymax = 0; r.dens.forEach(d => ymax = Math.max(ymax, d));
          const gmax = Math.max(ymax, normPDF(r.mbar, r.mbar, r.sdM));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: r.lo, xmax: r.hi, ymin: 0, ymax: gmax * 1.15, ml: 68 });
          g.grid('Sample mean  x\u0304', 'Density');
          g.title('Sampling distribution of the mean, n = ' + Math.round(v.n));
          const wpx = (g.w / r.dens.length) * 0.9;
          r.dens.forEach((d, i) => {
            const x = r.lo + (i + 0.5) * r.bw;
            ctx.save(); ctx.fillStyle = C.acc; ctx.globalAlpha = 0.35;
            ctx.fillRect(g.X(x) - wpx / 2, g.Y(d), wpx, g.Y(0) - g.Y(d));
            ctx.globalAlpha = 1; ctx.strokeStyle = C.acc; ctx.lineWidth = 1;
            ctx.strokeRect(g.X(x) - wpx / 2, g.Y(d), wpx, g.Y(0) - g.Y(d)); ctx.restore();
          });
          g.fn(x => normPDF(x, r.mbar, r.sdM), C.dk, 2.8);
          g.line([[r.mbar, 0], [r.mbar, gmax * 1.1]], C.warn, 1.5, [5, 4]);
          g.legend([{ c: C.acc, l: 'Monte Carlo' }, { c: C.dk, l: 'CLT normal' }]);
        }
      },
      {
        id: 'confint', num: 'D-04', sec: S, name: 'Confidence intervals & sample size',
        blurb: 'A measured value without an interval is an opinion. The interval width falls as the square root of the sample size, which sets the economics of every measurement campaign: halving the uncertainty costs four times as many runs.',
        howto: 'Move the sample size and watch the margin fall along the 1/\u221an curve \u2014 the flattening past n \u2248 30 is where extra measurements stop being worth their cost. The t multiplier is the other effect: below about ten degrees of freedom it inflates the interval sharply, which is the real penalty for a small sample. The sample-size panel inverts the whole calculation for a target margin.',
        std: 'Montgomery & Runger, Ch. 8; ISO/IEC Guide 98-3 (GUM) for the measurement conventions',
        eqs: [['\\bar x \\pm t_{\\alpha/2,\\,n-1}\\frac{s}{\\sqrt n}', 'confidence interval on a mean, \u03c3 unknown'], ['\\hat p \\pm z_{\\alpha/2}\\sqrt{\\frac{\\hat p(1-\\hat p)}{n}}', 'interval on a proportion (Wald)'], ['\\left[\\frac{(n-1)s^2}{\\chi^2_{\\alpha/2}},\\ \\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2}}\\right]', 'interval on a variance \u2014 note the asymmetry'], ['n = \\left(\\frac{z_{\\alpha/2}\\,\\sigma}{E}\\right)^{2}', 'sample size for a target margin E']],
        notes: ['Student t used for the mean; chi-squared for the variance; Wilson score interval reported alongside the Wald interval for proportions.', 'Prediction interval covers a single future observation, not the mean \u2014 it is always wider.', 'Tolerance interval uses the Howe approximation for a two-sided normal tolerance factor.'],
        params: [P('xbar', 'Sample mean x\u0304', -1000, 10000, 0.1, 100, null, '\u2014'), P('s', 'Sample standard deviation s', 0.001, 500, 0.001, 5, null, '\u2014'), P('n', 'Sample size n', 2, 500, 1, 12, null, '\u2014'), P('conf', 'Confidence level', 0.5, 0.999, 0.005, 0.95, null, '\u2014'), P('phat', 'Observed proportion p\u0302', 0.001, 0.999, 0.001, 0.08, null, '\u2014'), P('np', 'Sample size for the proportion', 5, 5000, 5, 200, null, '\u2014'), P('E', 'Target margin of error', 0.01, 100, 0.01, 1, null, '\u2014'), P('cover', 'Tolerance interval coverage', 0.8, 0.999, 0.005, 0.99, null, '\u2014')],
        compute: v => {
          const n = Math.round(v.n), al = 1 - v.conf, df = n - 1;
          const tc = tInv(1 - al / 2, df), zc = normInv(1 - al / 2);
          const se = v.s / Math.sqrt(n), marg = tc * se;
          const predM = tc * v.s * Math.sqrt(1 + 1 / n);
          const chiLo = chi2Inv(1 - al / 2, df), chiHi = chi2Inv(al / 2, df);
          const varLo = df * v.s * v.s / chiLo, varHi = df * v.s * v.s / chiHi;
          const nP = Math.round(v.np);
          const wald = zc * Math.sqrt(v.phat * (1 - v.phat) / nP);
          const wCen = (v.phat + zc * zc / (2 * nP)) / (1 + zc * zc / nP);
          const wHalf = (zc / (1 + zc * zc / nP)) * Math.sqrt(v.phat * (1 - v.phat) / nP + zc * zc / (4 * nP * nP));
          const nReq = Math.ceil(Math.pow(zc * v.s / v.E, 2));
          const nReqP = Math.ceil(Math.pow(zc, 2) * 0.25 / (v.E / 100) / (v.E / 100)) ;
          const zp = normInv((1 + v.cover) / 2);
          const kTol = zp * Math.sqrt((1 + 1 / n) * df / chi2Inv(al, df));
          const curve = [];
          for (let i = 2; i <= 200; i++) curve.push([i, tInv(1 - al / 2, i - 1) * v.s / Math.sqrt(i)]);
          return {
            curve: curve, marg: marg, n: n,
            res: [{ l: 'Degrees of freedom', s: String(df), u: '' }, { l: 't multiplier', v: tc, u: '\u2014', d: 4 }, { l: 'z multiplier (large n)', v: zc, u: '\u2014', d: 4 }, { l: 'Standard error s/\u221an', v: se, u: '\u2014', d: 5 }, { l: 'Margin of error', v: marg, u: '\u2014', d: 5 }, { l: 'CI on the mean \u2014 lower', v: v.xbar - marg, u: '\u2014', d: 5 }, { l: 'CI on the mean \u2014 upper', v: v.xbar + marg, u: '\u2014', d: 5 }, { l: 'Relative precision', v: marg / Math.abs(v.xbar) * 100, u: '%', d: 3 }, { l: 'Prediction interval half-width', v: predM, u: '\u2014', d: 5 }, { l: 'Tolerance factor k', v: kTol, u: '\u2014', d: 4 }, { l: 'CI on \u03c3 \u2014 lower', v: Math.sqrt(varLo), u: '\u2014', d: 5 }, { l: 'CI on \u03c3 \u2014 upper', v: Math.sqrt(varHi), u: '\u2014', d: 5 }, { l: 'Proportion CI (Wald)', s: (Math.max(v.phat - wald, 0) * 100).toFixed(3) + ' to ' + (Math.min(v.phat + wald, 1) * 100).toFixed(3) + ' %', u: '' }, { l: 'Proportion CI (Wilson)', s: (Math.max(wCen - wHalf, 0) * 100).toFixed(3) + ' to ' + (Math.min(wCen + wHalf, 1) * 100).toFixed(3) + ' %', u: '' }, { l: 'n for margin ' + v.E, s: String(nReq), u: '' }, { l: 'Extra runs needed', s: nReq > n ? String(nReq - n) + ' more' : 'target already met', u: '' }, { l: 'Small-sample penalty', s: df < 10 ? 'the t multiplier is inflating the interval by ' + ((tc / zc - 1) * 100).toFixed(0) + ' %' : 'negligible \u2014 t is close to z', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let ymax = 0; r.curve.forEach(p => ymax = Math.max(ymax, p[1]));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 2, xmax: 200, ymin: 0, ymax: Math.min(ymax, r.marg * 6) * 1.05, ml: 68 });
          g.grid('Sample size  n', 'Margin of error');
          g.title('Diminishing returns \u2014 margin against sample size');
          g.line([[2, v.E], [200, v.E]], C.warn, 1.5, [6, 4]);
          g.line(r.curve, C.acc, 2.8);
          g.line(r.curve.map(p => [p[0], normInv(1 - (1 - v.conf) / 2) * v.s / Math.sqrt(p[0])]), C.mid, 1.6, [4, 3]);
          g.dot(r.n, r.marg, C.dk, 5.5);
          if (g.w > 300) g.txt('target margin', 196, v.E * 1.12, C.warn, 'right', 11.5);
          g.legend([{ c: C.acc, l: 't interval' }, { c: C.mid, l: 'z interval', d: [4, 3] }, { c: C.warn, l: 'target', d: [6, 4] }]);
        }
      },
      {
        id: 'regress', num: 'D-05', sec: S, name: 'Linear regression & residual diagnostics',
        blurb: 'Least squares gives a line for any data at all, including data with no relationship and data with the wrong relationship. The parameter estimates are the easy part; the standard errors, the confidence band and the residual plot are what tell you whether to believe them.',
        howto: 'Raise the noise and watch r\u00b2 fall while the slope estimate stays unbiased \u2014 those are different things, and confusing them is the commonest error in reporting a fit. The confidence band pinches at the centroid and flares at the ends, which is why extrapolating a regression is dangerous even when the fit is excellent. The prediction band is the one to quote for a single future measurement; it is always much wider.',
        std: 'Draper & Smith, Applied Regression Analysis, 3rd ed.; Montgomery, Peck & Vining, Introduction to Linear Regression Analysis, 5th ed.',
        eqs: [['\\hat\\beta_1 = \\frac{S_{xy}}{S_{xx}},\\qquad \\hat\\beta_0 = \\bar y - \\hat\\beta_1\\bar x', 'the least-squares estimates'], ['SE(\\hat\\beta_1) = \\frac{s}{\\sqrt{S_{xx}}},\\qquad s^2 = \\frac{SS_E}{n-2}', 'standard error of the slope'], ['\\hat y_0 \\pm t_{\\alpha/2}\\,s\\sqrt{\\frac{1}{n}+\\frac{(x_0-\\bar x)^2}{S_{xx}}}', 'confidence band on the mean response'], ['R^2 = 1-\\frac{SS_E}{SS_T},\\qquad R^2_{adj} = 1-\\frac{SS_E/(n-2)}{SS_T/(n-1)}', 'variance explained']],
        notes: ['Data generated from the stated true line plus Gaussian noise, seeded for reproducibility.', 'Optional curvature is added to demonstrate what a lack-of-fit looks like in the residuals.', 'Durbin\u2013Watson statistic reported for serial correlation \u2014 relevant when x is time.', 'Leverage and Cook\u2019s distance flag influential points.'],
        params: [P('n', 'Number of points n', 5, 300, 1, 25, null, '\u2014'), P('b0', 'True intercept \u03b2\u2080', -100, 100, 0.5, 10, null, '\u2014'), P('b1', 'True slope \u03b2\u2081', -20, 20, 0.05, 2, null, '\u2014'), P('sig', 'Noise standard deviation', 0.01, 50, 0.01, 4, null, '\u2014'), P('curv', 'Curvature (lack of fit)', -0.5, 0.5, 0.005, 0, null, '\u2014'), P('xmax', 'Range of x', 1, 100, 1, 20, null, '\u2014'), P('conf', 'Confidence level', 0.5, 0.999, 0.005, 0.95, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 11, null, '\u2014')],
        compute: v => {
          const R = rng(v.seed), n = Math.round(v.n);
          const pts = [];
          for (let i = 0; i < n; i++) { const x = v.xmax * i / (n - 1); pts.push([x, v.b0 + v.b1 * x + v.curv * x * x + R.n() * v.sig]); }
          const sx = pts.reduce((p, q) => p + q[0], 0), sy = pts.reduce((p, q) => p + q[1], 0);
          const xb = sx / n, yb = sy / n;
          let Sxx = 0, Sxy = 0, Syy = 0;
          pts.forEach(p => { Sxx += Math.pow(p[0] - xb, 2); Sxy += (p[0] - xb) * (p[1] - yb); Syy += Math.pow(p[1] - yb, 2); });
          const b1 = Sxy / Sxx, b0 = yb - b1 * xb;
          const res = pts.map(p => p[1] - (b0 + b1 * p[0]));
          const SSE = res.reduce((p, q) => p + q * q, 0);
          const s2 = SSE / (n - 2), s = Math.sqrt(s2);
          const seB1 = s / Math.sqrt(Sxx), seB0 = s * Math.sqrt(1 / n + xb * xb / Sxx);
          const r2 = 1 - SSE / Syy, radj = 1 - (SSE / (n - 2)) / (Syy / (n - 1));
          const tB1 = b1 / seB1, pB1 = 2 * (1 - tCDF(Math.abs(tB1), n - 2));
          const tc = tInv(1 - (1 - v.conf) / 2, n - 2);
          let dw = 0; for (let i = 1; i < n; i++) dw += Math.pow(res[i] - res[i - 1], 2);
          dw /= SSE;
          const F = (Syy - SSE) / (SSE / (n - 2));
          let maxCook = 0, maxLev = 0;
          pts.forEach((p, i) => { const h = 1 / n + Math.pow(p[0] - xb, 2) / Sxx; maxLev = Math.max(maxLev, h); maxCook = Math.max(maxCook, res[i] * res[i] * h / (2 * s2 * Math.pow(1 - h, 2))); });
          const band = (x0, pred) => tc * s * Math.sqrt((pred ? 1 : 0) + 1 / n + Math.pow(x0 - xb, 2) / Sxx);
          return {
            pts: pts, res: res, b0: b0, b1: b1, band: band, xb: xb,
            res: [{ l: 'Slope \u03b2\u0302\u2081', v: b1, u: '\u2014', d: 5 }, { l: 'Standard error of the slope', v: seB1, u: '\u2014', d: 5 }, { l: 'CI on the slope', s: (b1 - tc * seB1).toPrecision(5) + ' to ' + (b1 + tc * seB1).toPrecision(5), u: '' }, { l: 'Intercept \u03b2\u0302\u2080', v: b0, u: '\u2014', d: 5 }, { l: 'Standard error of the intercept', v: seB0, u: '\u2014', d: 5 }, { l: 't for the slope', v: tB1, u: '\u2014', d: 3 }, { l: 'p-value for the slope', v: pB1, u: '\u2014', d: 6 }, { l: 'R\u00b2', v: r2, u: '\u2014', d: 5 }, { l: 'Adjusted R\u00b2', v: radj, u: '\u2014', d: 5 }, { l: 'Residual standard error s', v: s, u: '\u2014', d: 5 }, { l: 'F statistic', v: F, u: '\u2014', d: 3 }, { l: 'Durbin\u2013Watson', v: dw, u: '\u2014', d: 4 }, { l: 'Maximum leverage', v: maxLev, u: '\u2014', d: 4 }, { l: 'Maximum Cook\u2019s distance', v: maxCook, u: '\u2014', d: 4 }, { l: 'Slope recovered?', s: Math.abs(b1 - v.b1) < 2 * seB1 ? 'yes \u2014 within two standard errors of the truth' : 'biased \u2014 the model is mis-specified', u: '' }, { l: 'Lack of fit', s: Math.abs(v.curv) > 0.01 ? 'curvature present \u2014 residuals will show a pattern' : 'no systematic curvature', u: '' }, { l: 'Serial correlation', s: dw < 1.5 ? 'positive autocorrelation \u2014 residuals are not independent' : dw > 2.5 ? 'negative autocorrelation' : 'none detected', u: '' }, { l: 'Influence', s: maxCook > 1 ? 'an influential point is driving the fit' : 'no single point dominates', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const h1 = b.h * 0.64;
          let ylo = 1e30, yhi = -1e30;
          r.pts.forEach(p => { ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]); });
          const pad = (yhi - ylo) * 0.18 + 1e-6;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: h1, xmin: 0, xmax: v.xmax, ymin: ylo - pad, ymax: yhi + pad, ml: 66, mb: 20, mt: 32 });
          g.grid('', 'y');
          g.title('Least-squares fit with confidence and prediction bands');
          const up = [], dn = [], upP = [], dnP = [];
          for (let i = 0; i <= 120; i++) { const x = v.xmax * i / 120; const yy = r.b0 + r.b1 * x; up.push([x, yy + r.band(x, false)]); dn.push([x, yy - r.band(x, false)]); upP.push([x, yy + r.band(x, true)]); dnP.push([x, yy - r.band(x, true)]); }
          g.fill(upP.concat(dnP.slice().reverse()), C.soft);
          g.fill(up.concat(dn.slice().reverse()), C.soft2);
          g.line(upP, C.lt, 1.2, [4, 3]); g.line(dnP, C.lt, 1.2, [4, 3]);
          g.line([[0, r.b0], [v.xmax, r.b0 + r.b1 * v.xmax]], C.acc, 2.8);
          g.line([[0, v.b0], [v.xmax, v.b0 + v.b1 * v.xmax + v.curv * v.xmax * v.xmax]], C.mid, 1.5, [7, 4]);
          r.pts.forEach(p => g.dot(p[0], p[1], C.dk, 3.2));
          g.legend([{ c: C.acc, l: 'fit' }, { c: C.mid, l: 'truth', d: [7, 4] }, { c: C.lt, l: 'prediction band', d: [4, 3] }]);
          let rmax = 0;
          const resid = r.pts.map((p, i) => [p[0], p[1] - (r.b0 + r.b1 * p[0])]);
          resid.forEach(p => rmax = Math.max(rmax, Math.abs(p[1])));
          const g2 = self.mkG(ctx, { x: b.x, y: b.y + h1, w: b.w, h: b.h - h1, xmin: 0, xmax: v.xmax, ymin: -rmax * 1.3, ymax: rmax * 1.3, ml: 66, mt: 12, mb: 44 });
          g2.grid('x', 'Residual', 5, 4);
          g2.line([[0, 0], [v.xmax, 0]], 'rgba(29,31,32,0.3)', 1.3);
          resid.forEach(p => { g2.line([[p[0], 0], [p[0], p[1]]], C.lt, 1.2); g2.dot(p[0], p[1], C.acc, 3.2); });
        }
      },
      {
        id: 'errprop', num: 'D-06', sec: S, name: 'Uncertainty propagation',
        blurb: 'A calculated quantity is only as good as the measurements behind it, and for a product of powers the relative uncertainties add in quadrature weighted by the exponents. That weighting is why one badly measured variable with a large exponent can dominate a result that looks like it depends on six things equally.',
        howto: 'Read the contribution column. Improving the largest contributor is the only measurement worth improving; the others are already invisible in the answer. Then compare the linear result with the Monte Carlo one \u2014 they agree while the relative uncertainties are small, and separate once any of them passes about 20 %, where the linearisation stops being valid and the output distribution turns skewed.',
        std: 'ISO/IEC Guide 98-3:2008 (GUM) and Supplement 1 (Monte Carlo); Taylor, An Introduction to Error Analysis, 2nd ed.',
        eqs: [['y = k\\,x_1^{a}x_2^{b}x_3^{c}', 'the product-of-powers form'], ['\\left(\\frac{u_y}{y}\\right)^{2} = a^2\\!\\left(\\frac{u_1}{x_1}\\right)^{2} + b^2\\!\\left(\\frac{u_2}{x_2}\\right)^{2} + c^2\\!\\left(\\frac{u_3}{x_3}\\right)^{2}', 'relative uncertainties add in quadrature'], ['u_y^2 = \\sum_i \\left(\\frac{\\partial y}{\\partial x_i}\\right)^{2}u_i^2 + 2\\sum_{i<j}\\frac{\\partial y}{\\partial x_i}\\frac{\\partial y}{\\partial x_j}u_{ij}', 'the general law of propagation'], ['U = k_c\\,u_y,\\qquad k_c \\approx 2 \\text{ for 95 \\%}', 'expanded uncertainty']],
        notes: ['Uncertainties entered as standard uncertainties in per cent of the nominal value.', 'Correlation applies between x\u2081 and x\u2082 only \u2014 the commonest case, two readings from one instrument.', 'Monte Carlo uses lognormal inputs so that negative values cannot occur.', 'The coverage factor for 95 % is taken as 2, the GUM default for effective df above about 30.'],
        params: [P('k', 'Constant k', 0.001, 1000, 0.001, 1, null, '\u2014'), P('x1', 'x\u2081 nominal', 0.01, 10000, 0.01, 100, null, '\u2014'), P('a', 'Exponent a', -3, 3, 0.05, 1, null, '\u2014'), P('u1', 'u(x\u2081)', 0, 40, 0.1, 2, null, '%'), P('x2', 'x\u2082 nominal', 0.01, 10000, 0.01, 50, null, '\u2014'), P('bb', 'Exponent b', -3, 3, 0.05, 0.5, null, '\u2014'), P('u2', 'u(x\u2082)', 0, 40, 0.1, 5, null, '%'), P('x3', 'x\u2083 nominal', 0.01, 10000, 0.01, 25, null, '\u2014'), P('cc', 'Exponent c', -3, 3, 0.05, -1, null, '\u2014'), P('u3', 'u(x\u2083)', 0, 40, 0.1, 1, null, '%'), P('rho', 'Correlation between x\u2081 and x\u2082', -0.95, 0.95, 0.05, 0, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 9, null, '\u2014')],
        compute: v => {
          const y = v.k * Math.pow(v.x1, v.a) * Math.pow(v.x2, v.bb) * Math.pow(v.x3, v.cc);
          const r1 = v.a * v.u1 / 100, r2 = v.bb * v.u2 / 100, r3 = v.cc * v.u3 / 100;
          const varR = r1 * r1 + r2 * r2 + r3 * r3 + 2 * v.rho * r1 * r2;
          const relU = Math.sqrt(Math.max(varR, 0));
          const uy = relU * Math.abs(y);
          const c1 = r1 * r1 / Math.max(varR, 1e-30) * 100, c2 = r2 * r2 / Math.max(varR, 1e-30) * 100, c3 = r3 * r3 / Math.max(varR, 1e-30) * 100;
          const R = rng(v.seed), N = 6000, samp = [];
          const ln = (x, u) => { const s = Math.sqrt(Math.log(1 + Math.pow(u / 100, 2))); return { m: Math.log(x) - s * s / 2, s: s }; };
          const L1 = ln(v.x1, v.u1), L2 = ln(v.x2, v.u2), L3 = ln(v.x3, v.u3);
          let sm = 0;
          for (let i = 0; i < N; i++) {
            const z1 = R.n(), z2b = R.n(), z3 = R.n();
            const z2 = v.rho * z1 + Math.sqrt(Math.max(1 - v.rho * v.rho, 0)) * z2b;
            const X1 = Math.exp(L1.m + L1.s * z1), X2 = Math.exp(L2.m + L2.s * z2), X3 = Math.exp(L3.m + L3.s * z3);
            const val = v.k * Math.pow(X1, v.a) * Math.pow(X2, v.bb) * Math.pow(X3, v.cc);
            samp.push(val); sm += val;
          }
          const mMC = sm / N;
          let ss = 0, s3 = 0; samp.forEach(x => { ss += Math.pow(x - mMC, 2); s3 += Math.pow(x - mMC, 3); });
          const sdMC = Math.sqrt(ss / (N - 1)), skMC = (s3 / N) / Math.pow(sdMC, 3);
          samp.sort((p, q) => p - q);
          const q025 = samp[Math.floor(0.025 * N)], q975 = samp[Math.floor(0.975 * N)];
          const nb = 44, lo = samp[Math.floor(0.002 * N)], hi = samp[Math.floor(0.998 * N)];
          const bins = new Array(nb).fill(0);
          samp.forEach(x => { const i = Math.floor((x - lo) / (hi - lo) * nb); if (i >= 0 && i < nb) bins[i]++; });
          const bw = (hi - lo) / nb;
          const dens = bins.map(c => c / (N * bw));
          const dom = [['x\u2081', c1], ['x\u2082', c2], ['x\u2083', c3]].sort((p, q) => q[1] - p[1])[0];
          return {
            dens: dens, lo: lo, hi: hi, bw: bw, y: y, uy: uy, mMC: mMC, sdMC: sdMC,
            res: [{ l: 'Nominal result y', v: y, u: '\u2014', d: 6 }, { l: 'Combined standard uncertainty', v: uy, u: '\u2014', d: 6 }, { l: 'Relative uncertainty', v: relU * 100, u: '%', d: 4 }, { l: 'Expanded U (k = 2)', v: 2 * uy, u: '\u2014', d: 6 }, { l: '95 % interval (linear)', s: (y - 2 * uy).toPrecision(6) + ' to ' + (y + 2 * uy).toPrecision(6), u: '' }, { l: 'x\u2081 contribution', v: c1, u: '%', d: 2 }, { l: 'x\u2082 contribution', v: c2, u: '%', d: 2 }, { l: 'x\u2083 contribution', v: c3, u: '%', d: 2 }, { l: 'Dominant variable', s: dom[0] + ' \u2014 ' + dom[1].toFixed(0) + ' % of the variance', u: '' }, { l: 'Monte Carlo mean', v: mMC, u: '\u2014', d: 6 }, { l: 'Monte Carlo standard deviation', v: sdMC, u: '\u2014', d: 6 }, { l: 'Monte Carlo skewness', v: skMC, u: '\u2014', d: 4 }, { l: '95 % interval (Monte Carlo)', s: q025.toPrecision(6) + ' to ' + q975.toPrecision(6), u: '' }, { l: 'Linear vs Monte Carlo', v: sdMC / Math.max(uy, 1e-30), u: '\u2014', d: 4 }, { l: 'Linearisation valid?', s: Math.abs(sdMC / Math.max(uy, 1e-30) - 1) < 0.08 ? 'yes \u2014 the two agree' : 'no \u2014 uncertainties too large for the linear law', u: '' }, { l: 'Where to spend effort', s: 'improve ' + dom[0] + '; halving its uncertainty cuts the total by ' + ((1 - Math.sqrt(Math.max(varR - 0.75 * (dom[0] === 'x\u2081' ? r1 * r1 : dom[0] === 'x\u2082' ? r2 * r2 : r3 * r3), 0) / Math.max(varR, 1e-30))) * 100).toFixed(0) + ' %', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          let ymax = 0; r.dens.forEach(d => ymax = Math.max(ymax, d));
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: r.lo, xmax: r.hi, ymin: 0, ymax: ymax * 1.2, ml: 70 });
          g.grid('Result  y', 'Density');
          g.title('Monte Carlo output distribution against the linear law');
          const wpx = (g.w / r.dens.length) * 0.9;
          r.dens.forEach((d, i) => {
            const x = r.lo + (i + 0.5) * r.bw;
            ctx.save(); ctx.fillStyle = C.acc; ctx.globalAlpha = 0.32;
            ctx.fillRect(g.X(x) - wpx / 2, g.Y(d), wpx, g.Y(0) - g.Y(d));
            ctx.globalAlpha = 1; ctx.strokeStyle = C.acc; ctx.lineWidth = 1;
            ctx.strokeRect(g.X(x) - wpx / 2, g.Y(d), wpx, g.Y(0) - g.Y(d)); ctx.restore();
          });
          g.fn(x => normPDF(x, r.y, r.uy), C.dk, 2.8);
          g.line([[r.y, 0], [r.y, ymax * 1.12]], C.warn, 1.6, [5, 4]);
          g.line([[r.y - 2 * r.uy, 0], [r.y - 2 * r.uy, ymax * 0.7]], C.mid, 1.3, [4, 3]);
          g.line([[r.y + 2 * r.uy, 0], [r.y + 2 * r.uy, ymax * 0.7]], C.mid, 1.3, [4, 3]);
          g.legend([{ c: C.acc, l: 'Monte Carlo' }, { c: C.dk, l: 'linear (GUM)' }, { c: C.mid, l: '\u00b12u', d: [4, 3] }]);
        }
      },
      {
        id: 'spc', num: 'D-07', sec: S, name: 'Control charts & process capability',
        blurb: 'A control chart separates the variation a process always has from the variation something caused. Capability indices then ask a different question: given that variation, can the process meet the specification at all? A process can be perfectly in control and completely incapable, and confusing the two wastes a great deal of money.',
        howto: 'Introduce a shift part-way through the record and watch how long the chart takes to see it \u2014 that delay is the average run length, and for a one-sigma shift on an individuals chart it is around forty samples, which is far longer than most people expect. Subgrouping shortens it dramatically. Then look at C_p against C_pk: the gap between them is pure centring error, and it is usually the cheapest thing to fix.',
        std: 'Shewhart (1931); Montgomery, Introduction to Statistical Quality Control, 8th ed., Ch. 5\u20138; ISO 7870; AIAG SPC manual',
        eqs: [['\\bar{\\bar x} \\pm A_2\\bar R', 'x\u0304 chart limits from the range'], ['\\hat\\sigma = \\frac{\\bar R}{d_2}', 'within-subgroup standard deviation'], ['C_p = \\frac{USL-LSL}{6\\hat\\sigma},\\qquad C_{pk} = \\min\\!\\left(\\frac{USL-\\mu}{3\\hat\\sigma},\\frac{\\mu-LSL}{3\\hat\\sigma}\\right)', 'capability and centred capability'], ['ARL_0 = \\frac{1}{\\alpha},\\qquad ARL_1 = \\frac{1}{1-\\beta}', 'run lengths in and out of control']],
        notes: ['Data generated with a step shift at the stated sample; subgroups of the stated size.', 'Control limits from the within-subgroup range using the standard d\u2082 and A\u2082 constants.', 'Capability uses the within-subgroup sigma; performance indices P_p and P_pk use the overall sigma.', 'Western Electric run rules applied for the out-of-control signals.'],
        params: [P('mu', 'Process mean', -100, 1000, 0.1, 100, null, '\u2014'), P('sig', 'Process standard deviation', 0.01, 50, 0.01, 1, null, '\u2014'), P('LSL', 'Lower specification limit', -200, 1000, 0.1, 96, null, '\u2014'), P('USL', 'Upper specification limit', -100, 2000, 0.1, 104, null, '\u2014'), P('nsub', 'Subgroup size', 1, 10, 1, 4, null, '\u2014'), P('m', 'Number of subgroups', 15, 120, 1, 40, null, '\u2014'), P('shift', 'Mean shift (in \u03c3)', -4, 4, 0.1, 1.2, null, '\u03c3'), P('tshift', 'Shift starts at subgroup', 2, 119, 1, 25, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 17, null, '\u2014')],
        compute: v => {
          const R = rng(v.seed), n = Math.round(v.nsub), m = Math.round(v.m);
          const d2 = [0, 1.128, 1.128, 1.693, 2.059, 2.326, 2.534, 2.704, 2.847, 2.970, 3.078][n];
          const A2 = [0, 2.660, 1.880, 1.023, 0.729, 0.577, 0.483, 0.419, 0.373, 0.337, 0.308][n];
          const D4 = [0, 3.267, 3.267, 2.574, 2.282, 2.114, 2.004, 1.924, 1.864, 1.816, 1.777][n];
          const D3 = [0, 0, 0, 0, 0, 0, 0.076, 0.136, 0.184, 0.223, 0.256][n];
          const xb = [], rg = [], all = [];
          for (let j = 0; j < m; j++) {
            const sh = j >= v.tshift - 1 ? v.shift * v.sig : 0;
            const grp = [];
            for (let i = 0; i < n; i++) { const x = v.mu + sh + R.n() * v.sig; grp.push(x); all.push(x); }
            xb.push(grp.reduce((p, q) => p + q, 0) / n);
            rg.push(n > 1 ? Math.max.apply(null, grp) - Math.min.apply(null, grp) : 0);
          }
          const base = Math.max(Math.round(v.tshift) - 1, 5);
          const xbb = xb.slice(0, base).reduce((p, q) => p + q, 0) / base;
          const rbar = n > 1 ? rg.slice(0, base).reduce((p, q) => p + q, 0) / base : 0;
          let sigW = n > 1 ? rbar / d2 : 0;
          if (n === 1) { let mr = 0; for (let j = 1; j < base; j++) mr += Math.abs(xb[j] - xb[j - 1]); mr /= (base - 1); sigW = mr / 1.128; }
          const UCL = xbb + (n > 1 ? A2 * rbar : 2.66 * sigW * 1.128), LCL = xbb - (n > 1 ? A2 * rbar : 2.66 * sigW * 1.128);
          const oos = xb.map((x, j) => x > UCL || x < LCL);
          let firstSig = -1; for (let j = Math.round(v.tshift) - 1; j < m; j++) if (oos[j]) { firstSig = j + 1; break; }
          const mAll = all.reduce((p, q) => p + q, 0) / all.length;
          let sAll = 0; all.forEach(x => sAll += Math.pow(x - mAll, 2));
          sAll = Math.sqrt(sAll / (all.length - 1));
          const Cp = (v.USL - v.LSL) / (6 * sigW);
          const Cpk = Math.min((v.USL - v.mu) / (3 * sigW), (v.mu - v.LSL) / (3 * sigW));
          const Pp = (v.USL - v.LSL) / (6 * sAll);
          const Ppk = Math.min((v.USL - mAll) / (3 * sAll), (mAll - v.LSL) / (3 * sAll));
          const ppmU = (1 - normCDF((v.USL - v.mu) / sigW)) * 1e6, ppmL = normCDF((v.LSL - v.mu) / sigW) * 1e6;
          const kEff = Math.abs(v.shift) * Math.sqrt(n);
          const beta = normCDF(3 - kEff) - normCDF(-3 - kEff);
          const arl1 = 1 / Math.max(1 - beta, 1e-9);
          return {
            xb: xb, UCL: UCL, LCL: LCL, xbb: xbb, oos: oos, m: m,
            res: [{ l: 'Subgroup size', s: String(n) + (n === 1 ? ' \u2014 individuals chart' : ''), u: '' }, { l: 'Centre line x\u0304\u0304', v: xbb, u: '\u2014', d: 5 }, { l: 'Upper control limit', v: UCL, u: '\u2014', d: 5 }, { l: 'Lower control limit', v: LCL, u: '\u2014', d: 5 }, { l: 'Within-subgroup \u03c3', v: sigW, u: '\u2014', d: 5 }, { l: 'Overall \u03c3', v: sAll, u: '\u2014', d: 5 }, { l: 'Points out of control', s: String(oos.filter(Boolean).length) + ' of ' + m, u: '' }, { l: 'First signal after the shift', s: firstSig > 0 ? 'subgroup ' + firstSig + ' \u2014 ' + (firstSig - Math.round(v.tshift) + 1) + ' after it began' : 'not detected in this record', u: '' }, { l: 'Theoretical ARL for this shift', v: arl1, u: 'subgroups', d: 1 }, { l: 'In-control ARL\u2080', s: '370 subgroups (3\u03c3 limits)', u: '' }, { l: 'C_p', v: Cp, u: '\u2014', d: 4 }, { l: 'C_pk', v: Cpk, u: '\u2014', d: 4 }, { l: 'P_p (overall)', v: Pp, u: '\u2014', d: 4 }, { l: 'P_pk (overall)', v: Ppk, u: '\u2014', d: 4 }, { l: 'Centring loss C_p \u2212 C_pk', v: Cp - Cpk, u: '\u2014', d: 4 }, { l: 'Expected ppm above USL', v: ppmU, u: 'ppm', d: 1 }, { l: 'Expected ppm below LSL', v: ppmL, u: 'ppm', d: 1 }, { l: 'Capability verdict', s: Cpk >= 1.33 ? 'capable \u2014 C_pk at or above 1.33' : Cpk >= 1 ? 'marginal \u2014 tighten variation or re-centre' : 'not capable \u2014 the specification cannot be met reliably', u: '' }, { l: 'Priority', s: Cp - Cpk > 0.3 ? 're-centre the process \u2014 the mean is off target' : Cp < 1.33 ? 'reduce variation \u2014 centring will not be enough' : 'hold the gains', u: '' }]
          };
        },
        draw: (ctx, b, v, r) => {
          const span = Math.max(r.UCL - r.LCL, 1e-9);
          let lo = Math.min(r.LCL, Math.min.apply(null, r.xb)) - span * 0.25;
          let hi = Math.max(r.UCL, Math.max.apply(null, r.xb)) + span * 0.25;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 1, xmax: r.m, ymin: lo, ymax: hi, ml: 68 });
          g.grid('Subgroup number', 'Subgroup mean  x\u0304');
          g.title('Shewhart x\u0304 chart');
          g.fill([[1, r.LCL], [r.m, r.LCL], [r.m, r.UCL], [1, r.UCL]], C.soft);
          g.line([[1, r.UCL], [r.m, r.UCL]], C.warn, 1.6, [6, 4]);
          g.line([[1, r.LCL], [r.m, r.LCL]], C.warn, 1.6, [6, 4]);
          g.line([[1, r.xbb], [r.m, r.xbb]], C.dk, 1.4);
          g.line([[v.tshift, lo], [v.tshift, hi]], 'rgba(29,31,32,0.22)', 1.2, [4, 4]);
          g.line(r.xb.map((x, i) => [i + 1, x]), C.acc, 1.8);
          r.xb.forEach((x, i) => g.dot(i + 1, x, r.oos[i] ? C.warn : C.acc, r.oos[i] ? 5 : 3.2));
          if (g.w > 300) { g.txt('UCL', r.m * 0.99, r.UCL + span * 0.06, C.warn, 'right', 11.5); g.txt('shift', v.tshift, lo + span * 0.08, C.mut, 'center', 11.5); }
          g.legend([{ c: C.acc, l: 'subgroup mean' }, { c: C.warn, l: 'control limits', d: [6, 4] }]);
        }
      },
      {
        id: 'doe', num: 'D-08', sec: S, name: 'Two-level factorial design',
        blurb: 'Changing one factor at a time cannot find an interaction, and interactions are usually where the process actually lives. A two-level factorial changes everything at once in a balanced pattern, so every effect and every interaction comes out of the same runs \u2014 and it does so with fewer experiments than the one-at-a-time approach it replaces.',
        howto: 'The half-normal plot is the whole method in one picture: inert effects fall on the straight line through the origin because they are just noise, and active effects break away to the right. Judge by the break, not by a p-value. Then add centre points and look at the curvature test \u2014 a significant curvature says the two-level design has reached its limit and a response surface design is needed next.',
        std: 'Box, Hunter & Hunter, Statistics for Experimenters, 2nd ed., Ch. 5\u20136; Montgomery, Design and Analysis of Experiments, 10th ed., Ch. 6',
        eqs: [['\\text{Effect}_i = \\bar y_{+} - \\bar y_{-}', 'the main effect of a factor'], ['SE(\\text{Effect}) = \\frac{2\\sigma}{\\sqrt{N}},\\qquad N = 2^k n_r', 'standard error of every effect'], ['|\\text{Effect}| > t_{\\alpha/2}\\,SE', 'significance test'], ['\\text{Curvature} = \\bar y_{factorial} - \\bar y_{centre}', 'test for a quadratic term']],
        notes: ['Full 2\u00b3 factorial with the stated number of replicates and centre points.', 'Responses generated from the specified true effects plus Gaussian noise.', 'Lenth\u2019s pseudo standard error reported for unreplicated designs.', 'Half-normal plot ranks the absolute effects against their expected normal order statistics.'],
        params: [P('A', 'True effect of A', -20, 20, 0.1, 8, null, '\u2014'), P('Bf', 'True effect of B', -20, 20, 0.1, 4, null, '\u2014'), P('Cf', 'True effect of C', -20, 20, 0.1, 0.5, null, '\u2014'), P('AB', 'True interaction AB', -20, 20, 0.1, 5, null, '\u2014'), P('AC', 'True interaction AC', -20, 20, 0.1, 0, null, '\u2014'), P('BC', 'True interaction BC', -20, 20, 0.1, 0, null, '\u2014'), P('ABC', 'True interaction ABC', -20, 20, 0.1, 0, null, '\u2014'), P('curv', 'True curvature', -20, 20, 0.1, 0, null, '\u2014'), P('sig', 'Noise \u03c3', 0.05, 20, 0.05, 1.5, null, '\u2014'), P('rep', 'Replicates', 1, 8, 1, 2, null, '\u2014'), P('nc', 'Centre points', 0, 8, 1, 3, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 23, null, '\u2014')],
        compute: v => {
          const R = rng(v.seed), rep = Math.round(v.rep), nc = Math.round(v.nc);
          const design = [];
          for (let i = 0; i < 8; i++) design.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1]);
          const runs = [];
          design.forEach(d => {
            for (let r2 = 0; r2 < rep; r2++) {
              const mu = 50 + 0.5 * (v.A * d[0] + v.Bf * d[1] + v.Cf * d[2] + v.AB * d[0] * d[1] + v.AC * d[0] * d[2] + v.BC * d[1] * d[2] + v.ABC * d[0] * d[1] * d[2]);
              runs.push({ d: d, y: mu + R.n() * v.sig });
            }
          });
          const cps = [];
          for (let i = 0; i < nc; i++) cps.push(50 - v.curv / 2 + R.n() * v.sig);
          const N = runs.length;
          const cols = [['A', d => d[0]], ['B', d => d[1]], ['C', d => d[2]], ['AB', d => d[0] * d[1]], ['AC', d => d[0] * d[2]], ['BC', d => d[1] * d[2]], ['ABC', d => d[0] * d[1] * d[2]]];
          const eff = cols.map(c => { let s = 0; runs.forEach(r2 => s += c[1](r2.d) * r2.y); return { n: c[0], e: 2 * s / N }; });
          let SSE = 0, dfE = 0;
          if (rep > 1) {
            design.forEach(d => {
              const grp = runs.filter(r2 => r2.d[0] === d[0] && r2.d[1] === d[1] && r2.d[2] === d[2]).map(r2 => r2.y);
              const m = grp.reduce((p, q) => p + q, 0) / grp.length;
              grp.forEach(y => SSE += Math.pow(y - m, 2));
              dfE += grp.length - 1;
            });
          }
          const abs = eff.map(e => Math.abs(e.e)).sort((a, b2) => a - b2);
          const s0 = 1.5 * abs[Math.floor(abs.length / 2)];
          const keep = abs.filter(x => x < 2.5 * s0);
          const PSE = 1.5 * (keep.length ? keep[Math.floor(keep.length / 2)] : abs[0]);
          const sE = rep > 1 ? Math.sqrt(SSE / dfE) : NaN;
          const SEeff = rep > 1 ? 2 * sE / Math.sqrt(N) : PSE;
          const tcrit = rep > 1 ? tInv(0.975, dfE) : 2.3;
          const yF = runs.reduce((p, q) => p + q.y, 0) / N;
          const yC = nc ? cps.reduce((p, q) => p + q, 0) / nc : NaN;
          const curv = nc ? yF - yC : NaN;
          const seCurv = nc && rep > 1 ? sE * Math.sqrt(1 / N + 1 / nc) : NaN;
          const tCurv = curv / seCurv;
          const ranked = eff.slice().sort((a, b2) => Math.abs(a.e) - Math.abs(b2.e));
          const hn = ranked.map((e, i) => ({ n: e.n, e: Math.abs(e.e), z: normInv(0.5 + 0.5 * (i + 0.5) / ranked.length) }));
          const rows = eff.map(e => {
            const t = e.e / SEeff, p = rep > 1 ? 2 * (1 - tCDF(Math.abs(t), dfE)) : NaN;
            return [e.n, e.e.toFixed(4), (e.e / 2).toFixed(4), t.toFixed(3), rep > 1 ? p.toPrecision(4) : '\u2014', Math.abs(e.e) > tcrit * SEeff ? 'active' : '\u2014'];
          });
          const active = eff.filter(e => Math.abs(e.e) > tcrit * SEeff).map(e => e.n);
          return {
            hn: hn, eff: eff, SEeff: SEeff, tcrit: tcrit,
            res: [{ l: 'Design', s: '2\u00b3 factorial, ' + rep + ' replicate(s), ' + nc + ' centre point(s)', u: '' }, { l: 'Total runs', s: String(N + nc), u: '' }, { l: 'Pure-error standard deviation', v: sE, u: '\u2014', d: 4 }, { l: 'Error degrees of freedom', s: rep > 1 ? String(dfE) : 'none \u2014 unreplicated', u: '' }, { l: 'Standard error of an effect', v: SEeff, u: '\u2014', d: 4 }, { l: 'Lenth pseudo standard error', v: PSE, u: '\u2014', d: 4 }, { l: 'Significance threshold', v: tcrit * SEeff, u: '\u2014', d: 4 }, { l: 'Effect of A', v: eff[0].e, u: '\u2014', d: 4 }, { l: 'Effect of B', v: eff[1].e, u: '\u2014', d: 4 }, { l: 'Effect of C', v: eff[2].e, u: '\u2014', d: 4 }, { l: 'Interaction AB', v: eff[3].e, u: '\u2014', d: 4 }, { l: 'Active effects', s: active.length ? active.join(', ') : 'none detected', u: '' }, { l: 'Factorial mean', v: yF, u: '\u2014', d: 4 }, { l: 'Centre-point mean', v: yC, u: '\u2014', d: 4 }, { l: 'Curvature', v: curv, u: '\u2014', d: 4 }, { l: 'Curvature t', v: tCurv, u: '\u2014', d: 3 }, { l: 'Curvature significant?', s: !nc ? 'no centre points \u2014 cannot test' : Math.abs(tCurv) > tcrit ? 'yes \u2014 move to a response-surface design' : 'no \u2014 the linear model is adequate', u: '' }, { l: 'Next experiment', s: active.indexOf('AB') >= 0 || active.indexOf('AC') >= 0 || active.indexOf('BC') >= 0 ? 'interaction present \u2014 do not optimise factors independently' : active.length ? 'steepest ascent along the active main effects' : 'effects buried in noise \u2014 widen the factor ranges or replicate', u: '' }],
            table: { title: 'Effect estimates', head: ['Term', 'effect', 'coefficient', 't', 'p', 'verdict'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const emax = Math.max.apply(null, r.hn.map(h => h.e)) * 1.2 + 1e-9;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: 0, xmax: emax, ymin: 0, ymax: 2.2, ml: 66 });
          g.grid('|Effect|', 'Half-normal quantile');
          g.title('Half-normal plot \u2014 active effects break away from the line');
          const inert = r.hn.slice(0, Math.max(Math.ceil(r.hn.length / 2), 2));
          let sxy = 0, sxx = 0;
          inert.forEach(h => { sxy += h.e * h.z; sxx += h.e * h.e; });
          const sl = sxx > 0 ? sxy / sxx : 1;
          g.line([[0, 0], [emax, sl * emax]], C.mid, 1.6, [6, 4]);
          g.line([[r.tcrit * r.SEeff, 0], [r.tcrit * r.SEeff, 2.2]], C.warn, 1.4, [4, 4]);
          r.hn.forEach(h => {
            const act = h.e > r.tcrit * r.SEeff;
            g.dot(h.e, h.z, act ? C.warn : C.acc, act ? 5.5 : 4);
            if (g.w > 300) g.txt(h.n, h.e, h.z + 0.1, act ? C.warn : C.mut, 'center', 11.5);
          });
          if (g.w > 300) g.txt('significance threshold', r.tcrit * r.SEeff, 2.1, C.warn, 'left', 11);
          g.legend([{ c: C.acc, l: 'effect' }, { c: C.mid, l: 'noise line', d: [6, 4] }]);
        }
      },
      {
        id: 'arrfit', num: 'D-09', sec: S, name: 'Parameter estimation \u2014 Arrhenius fit',
        blurb: 'Fitting a rate constant against temperature is the most common regression in chemical engineering and the one most often done badly. Linearising by taking logarithms changes the error structure; the temperature range is almost always too narrow; and the pre-exponential factor and the activation energy are so strongly correlated that neither can be quoted alone.',
        howto: 'Watch the correlation coefficient between the two parameters \u2014 it is near \u22121 for any realistic temperature range, which means the joint confidence region is a long thin ellipse and the individual intervals are misleading. Reparameterising around the centroid temperature fixes it, and the reparameterised errors are reported alongside. Then narrow the temperature range and watch the activation-energy uncertainty explode: the leverage of the endpoints is everything.',
        std: 'Bard, Nonlinear Parameter Estimation; Froment, Bischoff & De Wilde, Chemical Reactor Analysis and Design, 3rd ed., Ch. 2; Schwaab & Pinto (2007) on reparameterisation',
        eqs: [['k = A\\exp\\!\\left(-\\frac{E_a}{RT}\\right)', 'the Arrhenius equation'], ['\\ln k = \\ln A - \\frac{E_a}{R}\\frac{1}{T}', 'linearised form \u2014 slope gives E_a'], ['k = k_{ref}\\exp\\!\\left[-\\frac{E_a}{R}\\!\\left(\\frac{1}{T}-\\frac{1}{T_{ref}}\\right)\\right]', 'reparameterised \u2014 decorrelates the two parameters'], ['\\rho_{AE} = \\frac{-\\overline{1/T}}{\\sqrt{\\overline{(1/T)^2}}}', 'the built-in parameter correlation']],
        notes: ['Synthetic data generated at equally spaced temperatures with constant relative error on k.', 'Weighted linear least squares in ln k, which is the correct treatment for constant relative error.', 'Confidence intervals from the linearised covariance matrix at the stated level.', 'The reparameterised fit uses the harmonic-mean temperature as the reference.'],
        params: [P('Ea', 'True activation energy', 20, 300, 1, 85, null, 'kJ/mol'), P('lnA', 'True ln A', 0, 40, 0.1, 22, null, '\u2014'), P('Tlo', 'Lowest temperature', 0, 500, 5, 60, 'T'), P('Thi', 'Highest temperature', 20, 700, 5, 140, 'T'), P('npt', 'Number of temperatures', 3, 40, 1, 7, null, '\u2014'), P('relerr', 'Relative error on k', 0.5, 40, 0.5, 5, null, '%'), P('conf', 'Confidence level', 0.5, 0.999, 0.005, 0.95, null, '\u2014'), P('seed', 'Random seed', 1, 60, 1, 31, null, '\u2014')],
        compute: v => {
          const Rg = 8.314, R = rng(v.seed), n = Math.round(v.npt);
          const pts = [];
          for (let i = 0; i < n; i++) {
            const TC = v.Tlo + (v.Thi - v.Tlo) * i / (n - 1), TK = TC + 273.15;
            const k0 = Math.exp(v.lnA - v.Ea * 1000 / (Rg * TK));
            pts.push({ T: TK, x: 1 / TK, k: k0 * (1 + R.n() * v.relerr / 100), k0: k0 });
          }
          const xs = pts.map(p => p.x), ys = pts.map(p => Math.log(Math.max(p.k, 1e-300)));
          const xb = xs.reduce((p, q) => p + q, 0) / n, yb = ys.reduce((p, q) => p + q, 0) / n;
          let Sxx = 0, Sxy = 0, Syy = 0;
          for (let i = 0; i < n; i++) { Sxx += Math.pow(xs[i] - xb, 2); Sxy += (xs[i] - xb) * (ys[i] - yb); Syy += Math.pow(ys[i] - yb, 2); }
          const b1 = Sxy / Sxx, b0 = yb - b1 * xb;
          let SSE = 0; for (let i = 0; i < n; i++) SSE += Math.pow(ys[i] - (b0 + b1 * xs[i]), 2);
          const s2 = SSE / (n - 2), s = Math.sqrt(s2);
          const seB1 = s / Math.sqrt(Sxx), seB0 = s * Math.sqrt(1 / n + xb * xb / Sxx);
          const Ea = -b1 * Rg / 1000, seEa = seB1 * Rg / 1000;
          const lnA = b0, r2 = 1 - SSE / Syy;
          const tc = tInv(1 - (1 - v.conf) / 2, n - 2);
          const rho = -xb / Math.sqrt(xb * xb + Sxx / n);
          const Tref = 1 / xb;
          const lnkref = b0 + b1 * xb;
          const seLnkref = s / Math.sqrt(n);
          const Tmid = (v.Tlo + v.Thi) / 2 + 273.15;
          const range = 1 / (v.Tlo + 273.15) - 1 / (v.Thi + 273.15);
          const rows = pts.map(p => [(p.T - 273.15).toFixed(1), (1 / p.T * 1000).toFixed(5), p.k.toPrecision(5), p.k0.toPrecision(5), ((p.k / p.k0 - 1) * 100).toFixed(2) + ' %', Math.log(p.k).toFixed(5), (b0 + b1 * p.x).toFixed(5)]);
          return {
            pts: pts, b0: b0, b1: b1, tc: tc, s: s, xb: xb, Sxx: Sxx, n: n,
            res: [{ l: 'Fitted E_a', v: Ea, u: 'kJ/mol', d: 3 }, { l: 'Standard error of E_a', v: seEa, u: 'kJ/mol', d: 4 }, { l: 'CI on E_a', s: (Ea - tc * seEa).toFixed(3) + ' to ' + (Ea + tc * seEa).toFixed(3) + ' kJ/mol', u: '' }, { l: 'Error against the truth', v: (Ea - v.Ea) / v.Ea * 100, u: '%', d: 3 }, { l: 'Fitted ln A', v: lnA, u: '\u2014', d: 4 }, { l: 'Standard error of ln A', v: seB0, u: '\u2014', d: 4 }, { l: 'Fitted A', v: Math.exp(lnA), u: '\u2014', d: 5 }, { l: 'Parameter correlation \u03c1', v: rho, u: '\u2014', d: 5 }, { l: 'Reference temperature', v: Tref - 273.15, u: '\u00b0C', d: 2 }, { l: 'ln k at T_ref', v: lnkref, u: '\u2014', d: 5 }, { l: 'SE of ln k_ref (reparameterised)', v: seLnkref, u: '\u2014', d: 5 }, { l: 'Improvement from reparameterising', v: seB0 / seLnkref, u: '\u00d7', d: 2 }, { l: 'R\u00b2 of the linearised fit', v: r2, u: '\u2014', d: 6 }, { l: 'Residual standard error', v: s, u: '\u2014', d: 5 }, { l: '1/T range covered', v: range * 1000, u: '\u00d710\u207b\u00b3 K\u207b\u00b9', d: 4 }, { l: 'Design quality', s: range * 1000 < 0.3 ? 'temperature range far too narrow \u2014 E_a is barely identifiable' : range * 1000 < 0.6 ? 'narrow range \u2014 widen it if the chemistry allows' : 'adequate range', u: '' }, { l: 'Reporting', s: 'quote E_a and k at T_ref, never ln A alone \u2014 \u03c1 = ' + rho.toFixed(3), u: '' }],
            table: { title: 'Generated data and the fit', head: ['T  \u00b0C', '1000/T  K\u207b\u00b9', 'k measured', 'k true', 'error', 'ln k', 'ln k fitted'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const xs = r.pts.map(p => p.x);
          const xlo = Math.min.apply(null, xs), xhi = Math.max.apply(null, xs);
          const pad = (xhi - xlo) * 0.12;
          let ylo = 1e30, yhi = -1e30;
          r.pts.forEach(p => { const y = Math.log(p.k); ylo = Math.min(ylo, y); yhi = Math.max(yhi, y); });
          const yp = (yhi - ylo) * 0.18 + 0.1;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: (xlo - pad) * 1000, xmax: (xhi + pad) * 1000, ymin: ylo - yp, ymax: yhi + yp, ml: 66 });
          g.grid('1000 / T   K\u207b\u00b9', 'ln k');
          g.title('Arrhenius plot with the confidence band');
          const up = [], dn = [];
          for (let i = 0; i <= 120; i++) {
            const x = (xlo - pad) + ((xhi + pad) - (xlo - pad)) * i / 120;
            const yy = r.b0 + r.b1 * x;
            const hw = r.tc * r.s * Math.sqrt(1 / r.n + Math.pow(x - r.xb, 2) / r.Sxx);
            up.push([x * 1000, yy + hw]); dn.push([x * 1000, yy - hw]);
          }
          g.fill(up.concat(dn.slice().reverse()), C.soft);
          g.line(up, C.lt, 1.2, [4, 3]); g.line(dn, C.lt, 1.2, [4, 3]);
          g.line([[(xlo - pad) * 1000, r.b0 + r.b1 * (xlo - pad)], [(xhi + pad) * 1000, r.b0 + r.b1 * (xhi + pad)]], C.acc, 2.8);
          r.pts.forEach(p => { g.dot(p.x * 1000, Math.log(p.k), C.dk, 4.2); g.line([[p.x * 1000, Math.log(p.k)], [p.x * 1000, Math.log(p.k0)]], C.mid, 1.1); });
          g.cross(r.xb * 1000, r.b0 + r.b1 * r.xb, C.warn, 8);
          g.legend([{ c: C.acc, l: 'weighted fit' }, { c: C.lt, l: 'confidence band', d: [4, 3] }, { c: C.warn, l: 'reference point' }]);
        }
      },
      {
        id: 'recon', num: 'D-10', sec: S, name: 'Data reconciliation & gross-error detection',
        blurb: 'Plant flow measurements never balance. Reconciliation adjusts them by the least amount, weighted by how much each instrument is trusted, until they do \u2014 and the size of the adjustment each meter needs is the sharpest available evidence about which meter is lying.',
        howto: 'Put a bias on one stream and watch the global test statistic exceed its chi-squared limit; then read the measurement test to see which meter is blamed. The trap is smearing: if the biased meter is the most trusted, the correction is pushed onto its neighbours and the wrong instrument is accused. Loosen the standard deviation of the suspect meter and the diagnosis usually resolves.',
        std: 'Narasimhan & Jordache, Data Reconciliation and Gross Error Detection; Crowe (1996); Romagnoli & S\u00e1nchez, Data Processing and Reconciliation for Chemical Process Operations',
        eqs: [['\\min_{\\hat x}\\ (y-\\hat x)^{T}\\Sigma^{-1}(y-\\hat x)\\quad \\text{s.t.}\\ A\\hat x = 0', 'the weighted least-squares reconciliation problem'], ['\\hat x = y - \\Sigma A^{T}(A\\Sigma A^{T})^{-1}Ay', 'the closed-form solution for linear balances'], ['\\gamma = r^{T}(A\\Sigma A^{T})^{-1}r \\sim \\chi^2_{m}', 'global test on the balance residuals'], ['z_i = \\frac{|y_i-\\hat x_i|}{\\sqrt{\\Sigma_{ii}-V_{ii}}} \\sim N(0,1)', 'measurement test for each stream']],
        notes: ['A single splitter node: one feed, three products, so two independent balances are not required \u2014 one is.', 'Standard deviations entered as a percentage of each measured flow.', 'The global test uses the chi-squared distribution with one degree of freedom for this topology.', 'Measurement-test threshold set at the Bonferroni-corrected 5 % level.'],
        params: [P('F', 'Measured feed F', 1, 5000, 1, 1000, 'M'), P('P1', 'Measured product 1', 1, 5000, 1, 400, 'M'), P('P2', 'Measured product 2', 1, 5000, 1, 350, 'M'), P('P3', 'Measured product 3', 1, 5000, 1, 200, 'M'), P('sF', 'Feed meter \u03c3', 0.2, 20, 0.1, 2, null, '%'), P('s1', 'Product 1 meter \u03c3', 0.2, 20, 0.1, 3, null, '%'), P('s2', 'Product 2 meter \u03c3', 0.2, 20, 0.1, 3, null, '%'), P('s3', 'Product 3 meter \u03c3', 0.2, 20, 0.1, 8, null, '%')],
        compute: v => {
          const y = [v.F, v.P1, v.P2, v.P3];
          const sd = [v.sF * v.F / 100, v.s1 * v.P1 / 100, v.s2 * v.P2 / 100, v.s3 * v.P3 / 100];
          const A = [1, -1, -1, -1];
          const r = A.reduce((p, a, i) => p + a * y[i], 0);
          let ASA = 0; A.forEach((a, i) => ASA += a * a * sd[i] * sd[i]);
          const xh = y.map((yi, i) => yi - sd[i] * sd[i] * A[i] * r / ASA);
          const adj = y.map((yi, i) => xh[i] - yi);
          const gamma = r * r / ASA;
          const gcrit = chi2Inv(0.95, 1);
          const gp = 1 - chi2CDF(gamma, 1);
          const Vii = y.map((_, i) => Math.pow(sd[i] * sd[i] * A[i], 2) / ASA);
          const z = y.map((_, i) => { const den = Math.sqrt(Math.max(Vii[i], 1e-30)); return Math.abs(adj[i]) / den; });
          const zcrit = normInv(1 - 0.05 / (2 * 4));
          const names = ['Feed F', 'Product 1', 'Product 2', 'Product 3'];
          const flagged = names.filter((_, i) => z[i] > zcrit);
          const worst = z.indexOf(Math.max.apply(null, z));
          const rows = names.map((nm, i) => [nm, y[i].toFixed(3), sd[i].toFixed(3), xh[i].toFixed(3), adj[i].toFixed(4), (adj[i] / y[i] * 100).toFixed(3) + ' %', z[i].toFixed(3), z[i] > zcrit ? 'SUSPECT' : 'ok']);
          return {
            y: y, xh: xh, sd: sd, names: names, z: z, zcrit: zcrit,
            res: [{ l: 'Balance residual', v: r, u: 'kg/h', d: 4 }, { l: 'Residual as % of feed', v: r / v.F * 100, u: '%', d: 4 }, { l: 'Reconciled feed', v: xh[0], u: 'kg/h', d: 3 }, { l: 'Reconciled product 1', v: xh[1], u: 'kg/h', d: 3 }, { l: 'Reconciled product 2', v: xh[2], u: 'kg/h', d: 3 }, { l: 'Reconciled product 3', v: xh[3], u: 'kg/h', d: 3 }, { l: 'Total adjustment', v: adj.reduce((p, q) => p + Math.abs(q), 0), u: 'kg/h', d: 4 }, { l: 'Largest adjustment', s: names[adj.map(Math.abs).indexOf(Math.max.apply(null, adj.map(Math.abs)))], u: '' }, { l: 'Global test \u03b3', v: gamma, u: '\u2014', d: 4 }, { l: 'Critical \u03c7\u00b2 (1 df, 5 %)', v: gcrit, u: '\u2014', d: 4 }, { l: 'Global test p-value', v: gp, u: '\u2014', d: 6 }, { l: 'Gross error present?', s: gamma > gcrit ? 'YES \u2014 the imbalance is larger than instrument noise explains' : 'no \u2014 the imbalance is consistent with random error', u: '' }, { l: 'Measurement-test threshold', v: zcrit, u: '\u2014', d: 3 }, { l: 'Streams flagged', s: flagged.length ? flagged.join(', ') : 'none', u: '' }, { l: 'Most likely faulty meter', s: gamma > gcrit ? names[worst] + ' \u2014 z = ' + z[worst].toFixed(2) : 'no fault indicated', u: '' }, { l: 'Caution', s: v.sF < 1 && gamma > gcrit ? 'the feed meter is the most trusted, so its error will be smeared onto the products' : 'weighting is reasonably balanced', u: '' }],
            table: { title: 'Measured against reconciled', head: ['Stream', 'measured', '\u03c3', 'reconciled', 'adjustment', 'relative', 'z', 'verdict'], rows: rows }
          };
        },
        draw: (ctx, b, v, r) => {
          const mx = Math.max.apply(null, r.y.concat(r.xh)) * 1.18;
          const g = self.mkG(ctx, { x: b.x, y: b.y, w: b.w, h: b.h, xmin: -0.5, xmax: 3.7, ymin: 0, ymax: mx, ml: 70 });
          g.grid('', 'Flow  kg/h', 4, 5, x => { const i = Math.round(x); return i >= 0 && i <= 3 ? ['F', 'P1', 'P2', 'P3'][i] : ''; });
          g.title('Measured, reconciled and instrument uncertainty');
          const bw = Math.min(46, g.w / 12);
          r.y.forEach((yi, i) => {
            ctx.save();
            ctx.fillStyle = C.acc; ctx.globalAlpha = 0.26;
            ctx.fillRect(g.X(i) - bw, g.Y(yi), bw, g.Y(0) - g.Y(yi));
            ctx.globalAlpha = 1; ctx.strokeStyle = C.acc; ctx.lineWidth = 1.2;
            ctx.strokeRect(g.X(i) - bw, g.Y(yi), bw, g.Y(0) - g.Y(yi));
            ctx.fillStyle = C.dk; ctx.globalAlpha = 0.5;
            ctx.fillRect(g.X(i), g.Y(r.xh[i]), bw, g.Y(0) - g.Y(r.xh[i]));
            ctx.globalAlpha = 1; ctx.strokeStyle = C.dk;
            ctx.strokeRect(g.X(i), g.Y(r.xh[i]), bw, g.Y(0) - g.Y(r.xh[i]));
            ctx.restore();
            ctx.save(); ctx.strokeStyle = C.warn; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(g.X(i) - bw / 2, g.Y(yi - 2 * r.sd[i])); ctx.lineTo(g.X(i) - bw / 2, g.Y(yi + 2 * r.sd[i]));
            ctx.moveTo(g.X(i) - bw / 2 - 5, g.Y(yi - 2 * r.sd[i])); ctx.lineTo(g.X(i) - bw / 2 + 5, g.Y(yi - 2 * r.sd[i]));
            ctx.moveTo(g.X(i) - bw / 2 - 5, g.Y(yi + 2 * r.sd[i])); ctx.lineTo(g.X(i) - bw / 2 + 5, g.Y(yi + 2 * r.sd[i]));
            ctx.stroke(); ctx.restore();
            if (r.z[i] > r.zcrit && g.w > 300) g.txt('suspect', i, Math.max(yi, r.xh[i]) + mx * 0.05, C.warn, 'center', 11.5);
          });
          g.legend([{ c: C.acc, l: 'measured' }, { c: C.dk, l: 'reconciled' }, { c: C.warn, l: '\u00b12\u03c3' }]);
        }
      }
    ];
  }

  /* ══ SEPARATIONS ══════════════════════════════════════════ */
