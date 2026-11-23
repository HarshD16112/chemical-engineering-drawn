  /* ── TeX-subset renderer (offline, no library) ─────────── */
  tex(src) {
    const SY = { alpha: '\u03b1', beta: '\u03b2', gamma: '\u03b3', Gamma: '\u0393', delta: '\u03b4', Delta: '\u0394', epsilon: '\u03b5', varepsilon: '\u03b5', zeta: '\u03b6', eta: '\u03b7', theta: '\u03b8', Theta: '\u0398', kappa: '\u03ba', lambda: '\u03bb', Lambda: '\u039b', mu: '\u03bc', nu: '\u03bd', xi: '\u03be', pi: '\u03c0', Pi: '\u03a0', rho: '\u03c1', sigma: '\u03c3', Sigma: '\u03a3', tau: '\u03c4', upsilon: '\u03c5', phi: '\u03c6', varphi: '\u03d5', Phi: '\u03a6', chi: '\u03c7', psi: '\u03c8', Psi: '\u03a8', omega: '\u03c9', Omega: '\u03a9', varpi: '\u03d6', infty: '\u221e', partial: '\u2202', nabla: '\u2207', cdot: '\u00b7', cdots: '\u22ef', times: '\u00d7', div: '\u00f7', pm: '\u00b1', mp: '\u2213', approx: '\u2248', simeq: '\u2243', neq: '\u2260', leq: '\u2264', geq: '\u2265', ll: '\u226a', gg: '\u226b', to: '\u2192', rightarrow: '\u2192', Rightarrow: '\u21d2', leftrightarrow: '\u21cc', propto: '\u221d', ldots: '\u2026', prime: '\u2032', ast: '\u2217', circ: '\u2218', degree: '\u00b0', angstrom: '\u00c5', perp: '\u22a5', in: '\u2208' };
    const BIG = { int: '\u222b', sum: '\u2211', prod: '\u220f', oint: '\u222e' };
    const FN = ['exp', 'ln', 'log', 'sin', 'cos', 'tan', 'tanh', 'coth', 'sinh', 'cosh', 'max', 'min', 'erf', 'erfc', 'lim', 'mod'];
    const s = String(src);
    let i = 0, bigFlag = false;
    const isL = c => c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z';
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const IT = 'font-style:italic;font-family:Barlow,Georgia,serif';
    const frac = (a, bq) => '<span style="display:inline-flex;flex-direction:column;align-items:center;margin:0 .24em;line-height:1.26"><span style="padding:0 .36em 2px">' + a + '</span><span style="padding:2px .36em 0;border-top:1px solid currentColor">' + bq + '</span></span>';
    const rowWrap = inner => '<span style="display:inline-flex;align-items:center;flex-wrap:wrap;row-gap:.45em;justify-content:flex-start">' + inner + '</span>';
    const rad = a => '<span style="display:inline-flex;align-items:flex-start;margin:0 .06em"><span style="font-size:1.22em;line-height:1">\u221a</span><span style="border-top:1px solid currentColor;padding:1px .16em 0;margin-top:.16em">' + a + '</span></span>';
    const ss = (sup, sub) => sup && sub
      ? '<span style="display:inline-grid;vertical-align:-0.5em;font-size:.6em;line-height:1.24;padding-left:.07em;text-align:left">' + '<span>' + sup + '</span><span>' + sub + '</span></span>'
      : sup ? '<span style="font-size:.62em;vertical-align:0.68em;line-height:1;padding-left:.04em">' + sup + '</span>'
        : '<span style="font-size:.62em;vertical-align:-0.32em;line-height:1;padding-left:.06em">' + sub + '</span>';
    const isTall = h => h.indexOf('flex-direction:column') >= 0 || h.indexOf('\u221a') >= 0 || h.indexOf('data-tall="1"') >= 0;
    const tallScript = (h, sup, sub) => {
      const col = 'display:inline-flex;flex-direction:column;align-self:stretch;font-size:.6em;line-height:1;padding-left:.1em;font-style:normal';
      const inner = sup && sub
        ? '<span style="' + col + ';justify-content:space-between"><span>' + sup + '</span><span>' + sub + '</span></span>'
        : '<span style="' + col + ';justify-content:' + (sup ? 'flex-start' : 'flex-end') + '"><span>' + (sup || sub) + '</span></span>';
      return '<span style="display:inline-flex;align-items:stretch">' + h + inner + '</span>';
    };
    const spc = w => '<span style="display:inline-block;width:' + w + '"></span>';
    const parseCmd = () => {
      i++;
      let n = '';
      while (i < s.length && isL(s[i])) { n += s[i]; i++; }
      if (n && s[i] === ' ') i++;
      if (!n) {
        const c = s[i]; i++;
        if (c === ',') return spc('.19em');
        if (c === ';') return spc('.32em');
        if (c === ' ') return spc('.28em');
        if (c === '!') return '';
        return '<span>' + esc(c) + '</span>';
      }
      if (n === 'frac' || n === 'dfrac' || n === 'tfrac') { const a = group(); const b = group(); return frac(a, b); }
      if (n === 'tilde') return '<span style="position:relative;display:inline-block">' + group() + '<span style="position:absolute;left:0;right:0;top:-.55em;text-align:center;font-size:.72em">\u02dc</span></span>';
      if (n === 'ell') return '<span style="' + IT + '">\u2113</span>';
      if (n === 'sqrt') {
        let idx = '';
        if (s[i] === '[') { let j = i + 1; while (j < s.length && s[j] !== ']') j++; idx = s.slice(i + 1, j); i = j + 1; }
        const body = rad(group());
        return idx ? '<span style="display:inline-flex;align-items:flex-start"><span style="font-size:.55em;font-style:normal;transform:translate(.5em,.1em);position:relative;z-index:1">' + esc(idx) + '</span>' + body + '</span>' : body;
      }
      if (n === 'vphantom' || n === 'phantom') { group(); return ''; }
      if (n === 'circ') return '<span style="font-style:normal">\u00b0</span>';
      if (n === 'text' || n === 'mathrm' || n === 'operatorname') return '<span style="font-style:normal;font-family:inherit">' + group() + '</span>';
      if (n === 'overline' || n === 'bar') return '<span style="border-top:1px solid currentColor;padding-top:1px;display:inline-block">' + group() + '</span>';
      if (n === 'hat') return '<span style="position:relative;display:inline-block">' + group() + '<span style="position:absolute;left:0;right:0;top:-.58em;text-align:center;font-size:.78em">\u02c6</span></span>';
      if (n === 'dot') return '<span style="position:relative;display:inline-block">' + group() + '<span style="position:absolute;left:0;right:0;top:-.62em;text-align:center;font-size:.8em">\u00b7</span></span>';
      if (n === 'quad') return spc('1em');
      if (n === 'qquad') return spc('2em');
      if (n === 'left') { const d = s[i]; i++; const inner = seq(null); if (s.substr(i, 6) === '\\right') { i += 6; } const d2 = s[i]; i++; return delim(d, inner, d2); }
      if (n === 'right') { i -= 6; return ''; }
      if (BIG[n]) { if (n === 'sum' || n === 'prod') bigFlag = true; return '<span style="font-size:1.55em;line-height:.9;padding:0 .06em;font-style:normal">' + BIG[n] + '</span>'; }
      if (FN.indexOf(n) >= 0) return '<span style="font-style:normal;font-family:inherit">' + n + '</span>' + spc('.14em');
      if (SY[n]) return '<span style="font-family:Barlow,Georgia,serif">' + SY[n] + '</span>';
      return '<span style="font-style:normal">' + esc(n) + '</span>';
    };
    const delim = (o, inner, c) => {
      const tall = isTall(inner);
      const k = tall ? 'font-size:2.15em;line-height:.66;font-weight:200;' : 'font-size:1.06em;';
      const P = ch => ch === '.' ? '' : '<span style="' + k + 'font-style:normal;padding:0 .05em;display:inline-block">' + esc(ch) + '</span>';
      return '<span' + (tall ? ' data-tall="1"' : '') + ' style="display:inline-flex;align-items:center">' + P(o) + inner + P(c) + '</span>';
    };
    const group = () => {
      while (s[i] === ' ') i++;
      if (s[i] === '{') { i++; const h = seq('}'); if (s[i] === '}') i++; return h; }
      if (s[i] === '\\') return parseCmd();
      const c = s[i]; i++;
      return isL(c) ? '<span style="' + IT + '">' + esc(c) + '</span>' : '<span>' + esc(c) + '</span>';
    };
    const scriptGroup = () => {
      while (s[i] === ' ') i++;
      if (s[i] === '{') {
        let d = 1, j = i + 1;
        while (j < s.length && d > 0) { if (s[j] === '{') d++; else if (s[j] === '}') d--; if (d > 0) j++; }
        const raw = s.slice(i + 1, j);
        if (/^[A-Za-z]{2,}$/.test(raw)) { i = j + 1; return '<span style="font-style:normal;font-family:inherit;letter-spacing:.01em">' + esc(raw) + '</span>'; }
      }
      return group();
    };
    const seq = stop => {
      const parts = [];
      const push = (h, big) => parts.push({ h: h, sub: '', sup: '', big: !!big });
      while (i < s.length) {
        if (stop && s[i] === stop) break;
        if (!stop && s.substr(i, 6) === '\\right') break;
        const c = s[i];
        if (c === '^' || c === '_') {
          i++;
          const g = scriptGroup();
          if (!parts.length) push('');
          const last = parts[parts.length - 1];
          if (c === '^') last.sup = (last.sup || '') + g; else last.sub = (last.sub || '') + g;
          continue;
        }
        if (c === '\\') { bigFlag = false; const hh = parseCmd(); push(hh, bigFlag); bigFlag = false; continue; }
        if (c === '{') { i++; push(seq('}')); if (s[i] === '}') i++; continue; }
        if (c === ' ') { i++; if (parts.length) parts[parts.length - 1].h += spc('.22em'); continue; }
        i++;
        if (isL(c)) { push('<span style="' + IT + '">' + esc(c) + '</span>'); continue; }
        if ('=+<>'.indexOf(c) >= 0) { push('<span style="padding:0 .28em">' + esc(c) + '</span>'); continue; }
        if (c === '-') { push('<span style="padding:0 .24em">\u2212</span>'); continue; }
        if (c === '*') { push('<span style="padding:0 .16em">\u00b7</span>'); continue; }
        push('<span>' + esc(c) + '</span>');
      }
      return rowWrap(parts.map(p => {
        if (!p.sub && !p.sup) return '<span style="display:inline-block">' + p.h + '</span>';
        if (p.big) return '<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.06;margin:0 .12em">' + (p.sup ? '<span style="font-size:.6em">' + p.sup + '</span>' : '') + p.h + (p.sub ? '<span style="font-size:.6em">' + p.sub + '</span>' : '') + '</span>';
        if (isTall(p.h)) return tallScript(p.h, p.sup, p.sub);
        return '<span style="display:inline-block;white-space:nowrap">' + p.h + ss(p.sup, p.sub) + '</span>';
      }).join(''));
    };
    try { return seq(null); } catch (e) { return esc(s); }
  }
  texEl(src) {
    const ck = String(src), cc = this._texC || (this._texC = {});
    if (cc[ck] !== undefined) return cc[ck];
    return (cc[ck] = this._texEl(ck));
  }
  _texEl(src) {
    if (window.katex) {
      let html = '';
      try {
        html = String(src).split(/\\qquad/).map(p => p.trim()).filter(p => p.length)
          .map(p => '<div style="margin:0">' + window.katex.renderToString(p, { displayMode: true, throwOnError: false, strict: false, output: 'html' }) + '</div>').join('');
      } catch (e) { html = ''; }
      if (html) return React.createElement('span', { style: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', color: 'var(--color-text)', fontSize: '19px' }, dangerouslySetInnerHTML: { __html: html } });
    }
    return React.createElement('span', { style: { display: 'inline-flex', maxWidth: '100%', fontFamily: 'Barlow, Georgia, serif', fontSize: '20px', lineHeight: 1.3, color: 'var(--color-text)' }, dangerouslySetInnerHTML: { __html: this.tex(src) } });
  }
  /* inline sub/superscripts for labels, units and table text */
  sub(t) {
    const s = String(t == null ? '' : t);
    if (!/[_^]/.test(s)) return s;
    const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if ((c === '_' || c === '^') && i + 1 < s.length) {
        let body;
        if (s[i + 1] === '{') { const j = s.indexOf('}', i + 2); body = s.slice(i + 2, j < 0 ? s.length : j); i = j < 0 ? s.length : j + 1; }
        else { const mm = /^[A-Za-z0-9\u0370-\u03ff]+/.exec(s.slice(i + 1)); body = mm ? mm[0] : s[i + 1]; i += 1 + body.length; }
        out += (c === '_' ? '<sub>' : '<sup>') + esc(body) + (c === '_' ? '</sub>' : '</sup>');
        continue;
      }
      out += esc(c); i++;
    }
    return React.createElement('span', { dangerouslySetInnerHTML: { __html: out } });
  }

