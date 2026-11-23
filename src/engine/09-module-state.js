  /* ── module state ──────────────────────────────────────── */
  all() { if (!this._all) this._all = [].concat(this.dReact(), this.dSep(), this.dFluid(), this.dHeat(), this.dThermo(), this.dUtil(), this.dNewA(), this.dNewB(), this.dNewC(), this.dNewD(), this.dNewE(), this.dNewF(), this.dNewG(), this.dNewH(), this.dNewI(), this.dCtrl(), this.dPhase(), this.dMulti(), this.dMphase(), this.dStat(), this.dCompound(), this.dCryst(), this.dFluidise(), this.dEquip()); return this._all; }
  /* Every canvas label goes through here. Drawing type was authored a touch
     smaller than the interface around it; one scale lifts the whole set
     without each sketch having to restate its sizes. */
  TZ(n) { return Math.round(n * 1.18 * 2) / 2; }
  cur() {
    const a = this.all();
    if (!this._byId) { this._byId = {}; a.forEach(m => { this._byId[m.id] = m; }); }
    return this._byId[this.state.mod] || a[0];
  }
  numMap() { if (!this._nm) { this._nm = {}; this.all().forEach(m => { this._nm[m.num] = m.id; }); } return this._nm; }
  vals(m) {
    const o = {};
    (m.params || []).forEach(p => { const k = m.id + '.' + p.k; o[p.k] = this.state.vals[k] !== undefined ? this.state.vals[k] : p.val; });
    return o;
  }
  setV(m, k, x, keepEdit) {
    /* Any change that did not come from the number field itself releases that
       field's typing buffer, so a slider move is never out of step with it. */
    if (!keepEdit) this._ed = null;
    const vs = Object.assign({}, this.state.vals);
    vs[m.id + '.' + k] = x;
    this.setState({ vals: vs });
  }

