  renderVals() {
    const self = this;
    /* Ordered the way the subject is taught: tools and balances, then
       properties and thermodynamics, transport, reaction, separations, and
       finally design, control and the statistics that underpin all of it. */
    const secs = [
      { name: 'Foundations & Balances', blurb: 'Units, material and energy balances, recycle systems and the cost estimate that closes a design.' },
      { name: 'Compounds & Properties', blurb: 'The shared compound library \u2014 add anything by CAS number or name \u2014 with the group-contribution estimator behind it.' },
      { name: 'Thermophysical Data', blurb: 'Steam, moist air, natural gas and petroleum fractions evaluated from the reference formulations.' },
      { name: 'Phase Equilibria & Models', blurb: 'Activity-coefficient models, cubic equations of state, departure functions and thermodynamic consistency.' },
      { name: 'Fluid Mechanics', blurb: 'Pipe hydraulics, rotating equipment and final control elements.' },
      { name: 'Fluidisation & Packed Beds', blurb: 'Ergun pressure drop, minimum fluidisation, Geldart behaviour, entrainment and both catalytic and non-catalytic beds.' },
      { name: 'Heat Transfer', blurb: 'Exchanger sizing by both driving-force and effectiveness routes, plus insulation.' },
      { name: 'Reactors & Kinetics', blurb: 'Batch and flow reactors, selectivity, thermal stability, catalyst pellets and transport criteria.' },
      { name: 'Multiphase Reaction Engineering', blurb: 'Gas\u2013liquid, gas\u2013solid and three-phase reactors \u2014 film theory, Hatta and Damk\u00f6hler regimes, resistances in series.' },
      { name: 'Separations', blurb: 'Phase equilibrium and the staged constructions built on top of it.' },
      { name: 'Multicomponent Distillation', blurb: 'Rigorous plate-to-plate design \u2014 Sorel, Lewis\u2013Matheson, Thiele\u2013Geddes and the matrix MESH solution.' },
      { name: 'Crystallisation', blurb: 'Solubility and supersaturation, nucleation and growth kinetics, the population balance and crystalliser sizing.' },
      { name: 'Process Equipment Design', blurb: 'Vessels, columns, exchangers, tanks, filters, dryers and relief \u2014 the mechanical side of process design.' },
      { name: 'Process Dynamics & Control', blurb: 'Open-loop dynamics, controller tuning, closed-loop simulation and frequency-domain stability.' },
      { name: 'Statistics & Data Analysis', blurb: 'Distributions, hypothesis testing, regression, uncertainty, control charts and experimental design.' }
    ];
    const all = this.all();
    const q = this.state.q.trim().toLowerCase();
    const nav = secs.map(s => {
      const items = all.filter(m => m.sec === s.name && (!q || (m.name + ' ' + m.blurb + ' ' + s.name + ' ' + m.num).toLowerCase().indexOf(q) >= 0))
        .sort((a, b) => a.num < b.num ? -1 : a.num > b.num ? 1 : 0);
      return {
        name: s.name, blurb: s.blurb, count: all.filter(m => m.sec === s.name).length,
        items: items.map(m => ({ name: m.name, num: m.num, active: !self.state.home && self.state.mod === m.id, go: () => self.setState({ home: false, mod: m.id, nav: false }) }))
      };
    }).filter(s => s.items.length);

    const m = this.cur();
    const v = this.vals(m);
    let r = {};
    try { r = m.compute(v) || {}; } catch (e) { r = { res: [] }; }

    const controls = (m.params || []).map(p => {
      if (p.type === 'select') {
        const opts = typeof p.options === 'function' ? p.options(v) : p.options;
        const has = opts.some(o => o[0] === v[p.k]);
        return { label: self.sub(p.label), isSelect: true, isRange: false, isText: false, isAction: false, value: has ? v[p.k] : opts[0][0], options: opts.map(o => ({ v: o[0], l: o[1] })), onSel: e => self.setV(m, p.k, e.target.value) };
      }
      if (p.type === 'text') {
        return { label: self.sub(p.label), isText: true, isSelect: false, isRange: false, isAction: false, tval: v[p.k] === undefined ? '' : String(v[p.k]), placeholder: p.placeholder || '', onText: e => self.setV(m, p.k, e.target.value) };
      }
      if (p.type === 'action') {
        return { label: self.sub(p.label), isAction: true, isSelect: false, isRange: false, isText: false, btnLabel: p.btn || 'Run', onAct: () => p.act(self.vals(m), self) };
      }
      const ek = m.id + '.' + p.k;
      const dv = self.cvt(v[p.k], p.cv);
      const dmin = self.cvt(p.min, p.cv)[0], dmax = self.cvt(p.max, p.cv)[0];
      const span = Math.abs(dmax - dmin);
      return {
        label: self.sub(p.label), isRange: true, isSelect: false, isText: false, isAction: false,
        hasSlider: !p.free, typeIn: !!p.free,
        rangeHint: self.f(self.cvt(p.min, p.cv)[0], span > 20 ? 0 : 2) + ' to ' + self.f(self.cvt(p.max, p.cv)[0], span > 20 ? 0 : 2),
        value: v[p.k], min: p.min, max: p.max, step: p.step,
        disp: (self._ed && self._ed.k === ek) ? self._ed.t : Number(dv[0].toFixed(span > 200 ? 1 : span > 20 ? 2 : span > 2 ? 3 : 4)),
        dstep: span > 200 ? 1 : span > 20 ? 0.1 : 0.01,
        unit: self.sub(p.unit !== undefined ? p.unit : dv[1]),
        onRange: e => self.setV(m, p.k, parseFloat(e.target.value)),
        onNum: e => {
          /* A number input reports '' for every in-progress state ('1.', '-',
             '1e'). Leave the DOM alone in that case: re-rendering would write
             the parsed value back and eat the character just typed. */
          const t = e.target.value;
          if (t === '') return;
          self._ed = { k: ek, t: t };
          const x = parseFloat(t);
          if (isFinite(x)) self.setV(m, p.k, Math.min(p.max, Math.max(p.min, self.inv(x, p.cv))), true);
          else self.forceUpdate();
        },
        onNumBlur: () => { if (self._ed && self._ed.k === ek) { self._ed = null; self.forceUpdate(); } }
      };
    });

    const vw = this.state.vw || 1440, nrw = vw < 900;
    /* How much room the module body actually has once the rail and page
       padding are taken out — the drawings are sized from this, not from the
       window, so a narrow preview gets a correctly proportioned sketch. */
    const cw = vw - (nrw ? 0 : 266) - (nrw ? 28 : 54);
    const stacked = cw < 810;
    /* A quantity that cannot be negative and came out negative means the input
       combination is infeasible, not that the answer is minus something. Say so
       rather than printing a negative area, length, yield or stage count. */
    const NONNEG = /\b(area|volume|diameter|length|thickness|number of|seeds|circulation|evaporated|yield|mass flow|reflux rate|distillate rate|bottoms rate|stages|lmtd|n_?min|ntu)\b/i;
    const SIGNED = /\b(net|extra|over|under|penalty|error|change|difference|margin|residual|deviation)\b/i;
    const results = (r.res || []).map(o => {
      if (o.s !== undefined) {
        const wide = String(o.s).length > 26;
        return { l: self.sub(o.l), v: self.sub(o.s), u: self.sub(o.u || ''), wide: wide, narrow: !wide };
      }
      if (typeof o.v === 'number' && isFinite(o.v) && o.v < 0 && NONNEG.test(o.l) && !SIGNED.test(o.l)) {
        return { l: self.sub(o.l), v: '\u2014', u: 'infeasible', wide: false, narrow: true };
      }
      const c = self.cvt(o.v, o.cv);
      return { l: self.sub(o.l), v: self.f(c[0], o.d), u: self.sub(o.u !== undefined ? o.u : c[1]), wide: false, narrow: true };
    });

    const tbl = r.table;
    return {
      nav: nav, isHome: this.state.home, isMod: !this.state.home,
      isNarrow: nrw, isWide: !nrw, navOpen: nrw && !!this.state.nav,
      toggleNav: () => this.setState({ nav: !this.state.nav }),
      closeNav: () => this.setState({ nav: false }),
      asideStyle: nrw
        ? 'position:fixed;top:0;bottom:0;left:0;width:272px;z-index:70;background:var(--color-bg);border-right:1px solid var(--color-divider);overflow-y:auto;padding:14px 0 60px;box-shadow:0 0 44px rgba(0,0,0,0.20);transition:transform .2s ease;transform:translateX(' + (this.state.nav ? '0' : '-104%') + ')'
        : 'width:266px;flex:none;border-right:1px solid var(--color-divider);overflow-y:auto;padding:14px 0 60px',
      headerStyle: 'flex:none;display:flex;align-items:center;gap:' + (nrw ? '10px' : '20px') + ';padding:' + (nrw ? '9px 13px' : '11px 22px') + ';border-bottom:1px solid var(--color-divider);flex-wrap:' + (vw < 620 ? 'wrap' : 'nowrap'),
      brandStyle: 'font-family:var(--font-heading);font-weight:600;font-size:' + (nrw ? '17px' : '21px') + ';letter-spacing:0.06em',
      searchStyle: 'width:' + (vw < 620 ? '100%' : nrw ? '150px' : '210px') + ';height:32px;min-height:32px;font-size:15px;order:' + (vw < 620 ? '9' : '0'),
      homePad: 'padding:' + (nrw ? '26px 15px 70px' : '44px 46px 80px') + ';max-width:1180px',
      modPad: 'padding:' + (nrw ? '18px 14px 80px' : '28px 27px 90px') + ';max-width:1560px',
      heroStyle: 'font-size:' + (vw < 620 ? '34px' : nrw ? '42px' : '52px') + ';margin:0 0 14px;max-width:20ch;line-height:1.04',
      titleStyle: 'font-size:' + (vw < 620 ? '27px' : nrw ? '32px' : '38px') + ';margin:0 0 8px;line-height:1.1',
      canvasStyle: 'width:100%;display:block',
      sideColStyle: stacked
        ? 'order:-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(246px,1fr));gap:18px;align-items:start;flex:1 1 100%;min-width:0;width:100%'
        : 'display:flex;flex-direction:column;gap:20px;flex:0 1 330px;max-width:348px;min-width:300px',
      bodyGap: 'display:flex;flex-wrap:wrap;gap:' + (nrw ? '18px' : '28px') + ';align-items:flex-start',
      sliderStyle: 'width:100%;height:' + (nrw ? '30px' : '16px') + ';cursor:pointer',
      numStyle: 'width:' + (nrw ? '84px' : '74px') + ';min-height:' + (nrw ? '32px' : '26px') + ';height:' + (nrw ? '32px' : '26px') + ';padding:2px 5px;font-size:14px;text-align:right;font-variant-numeric:tabular-nums',
      eqGrid: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (cw < 700 ? '240px' : '340px') + ',1fr));gap:' + (nrw ? '20px' : '26px'),
      isSI: !this.state.us, isUS: this.state.us, q: this.state.q,
      canvasRef: this.canvasRef,
      hasChart: m.chart !== false,
      hasSchem: !!m.schem, schemRef: this.schemRef,
      schemStyle: 'width:100%;display:block',
      schemNote: this.sub(m.schemNote || 'Live equipment sketch — the geometry and colours redraw from the inputs.'),
      m: { name: m.name, sec: m.sec, num: m.num, blurb: this.sub(m.blurb), howto: this.sub(m.howto), std: this.sub(m.std || '') },
      eqs: (m.eqs || []).map(e => ({ n: this.texEl(e[0]), d: this.sub(e[1]) })),
      hasNom: !!(NOM[m.num] && NOM[m.num].s && NOM[m.num].s.length),
      nomGrid: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (nrw ? '260px' : '330px') + ',1fr));gap:0 30px',
      nom: ((NOM[m.num] || {}).s || []).map(s => ({ s: this.texEl(s[0]), d: this.sub(s[1]) })),
      flow: this.sub((NOM[m.num] || {}).f || ''),
      coverage: this.state.home ? this.coverage() : [],
      covBuilt: this.covN('B'), covPart: this.covN('P'), covGap: this.covN('G'), covTotal: this.covN(''), nMod: this.all().length,
      notes: (m.notes || []).map(t => ({ t: this.sub(t) })),
      controls: controls, results: results,
      hasTable: !!tbl, tblTitle: tbl ? this.sub(tbl.title || 'Detail') : '',
      tblHead: tbl ? tbl.head.map(t => ({ t: this.sub(t) })) : [],
      tblRows: tbl ? tbl.rows.map(row => ({ cells: row.map(t => ({ t: this.sub(t) })) })) : [],
      goHome: () => this.setState({ home: true, nav: false }),
      onSearch: e => this.setState({ q: e.target.value }),
      setSI: () => this.setState({ us: false }),
      setUS: () => this.setState({ us: true }),
      reset: () => { this._ed = null; const vs = Object.assign({}, this.state.vals); Object.keys(vs).forEach(k => { if (k.indexOf(m.id + '.') === 0) delete vs[k]; }); this.setState({ vals: vs }); }
    };
  }

  /* ══ PROCESS EQUIPMENT DESIGN ═════════════════════════════ */
