  /* ── coverage audit against the reference calculator taxonomy ── */
  cov() {
    if (this._cov) return this._cov;
    this._cov = [
      { g: 'Fluid flow', items: [
        ['Pipe sizing \u2014 liquids & solvents', 'P', 'in F-07'], ['Single-phase incompressible \u0394P', 'B', 'F-01'],
        ['Friction factor / Moody chart', 'B', 'F-01'], ['Compressible gas flow in a pipe', 'B', 'F-05'],
        ['Non-Newtonian power law', 'B', 'F-06'], ['Non-Newtonian Bingham plastic', 'B', 'F-06'],
        ['Packed bed \u0394P (Ergun)', 'P', 'in R-06'], ['Pipe fitting losses \u2014 3K / 2K', 'B', 'F-07'],
        ['Centrifugal pump sizing', 'B', 'F-02'], ['Centrifugal pump curves & NPSH', 'B', 'F-02'],
        ['Pump operation in series & parallel', 'B', 'F-10'], ['Blower & fan calculation', 'B', 'F-08'],
        ['Reciprocating compressor calculation', 'P', 'in F-08'], ['Reciprocating compressor rating', 'B', 'F-11'],
        ['Natural gas pipeline sizing', 'B', 'F-12'], ['Two-phase flow \u2014 Beggs & Brill', 'B', 'F-09'],
        ['Two-phase flow in horizontal pipe', 'P', 'in F-09'], ['Hydraulic network engine', 'B', 'F-15']] },
      { g: 'Heat transfer', items: [
        ['LMTD calculation', 'B', 'H-01'], ['LMTD correction factor charts', 'B', 'H-01'],
        ['Heat exchanger analysis (\u03b5\u2013NTU)', 'B', 'H-02'], ['Shortcut exchanger sizing', 'P', 'in H-01'],
        ['Air-cooled heat exchanger sizing', 'B', 'H-04'], ['Batch reactor heating & cooling', 'B', 'H-05'],
        ['Jacketed vessel heat transfer', 'P', 'in H-05'], ['Tank heating with steam coil', 'P', 'in H-05'],
        ['Insulation heat loss \u2014 steel pipe', 'B', 'H-03'], ['Insulation heat loss \u2014 flat surface', 'B', 'H-07'],
        ['Heat exchanger rating (Bell\u2013Delaware)', 'B', 'H-08'], ['Double-pipe heat exchanger', 'B', 'H-09'],
        ['Vertical thermosyphon reboiler', 'B', 'H-06']] },
      { g: 'Instrument', items: [
        ['Control valve sizing', 'B', 'F-03'], ['Valve C\u1d65 & installed characteristic', 'B', 'F-03'],
        ['Orifice plate sizing (ISO 5167)', 'B', 'F-04'], ['Venturi & nozzle meters', 'P', 'in F-04'],
        ['Restriction orifice', 'B', 'F-13'], ['Rotameter sizing', 'B', 'F-14'],
        ['Relief valve sizing', 'B', 'E-05']] },
      { g: 'Distillation', items: [
        ['Binary McCabe\u2013Thiele diagram', 'B', 'S-02'], ['Shortcut distillation (FUG)', 'B', 'S-07'],
        ['Packed tower sizing & flooding', 'B', 'S-08'], ['Stripping column', 'B', 'S-03'],
        ['Gas absorption (Kremser)', 'B', 'S-04'], ['Liquid\u2013liquid extraction', 'B', 'S-06'],
        ['Batch distillation simulator', 'B', 'S-09'], ['Tray hydraulics & weeping', 'B', 'S-10']] },
      { g: 'Vapour\u2013liquid equilibria', items: [
        ['VLE \u2014 T\u2013x\u2013y and x\u2013y', 'B', 'S-01'], ['Activity coefficients & azeotropes', 'P', 'in S-01'],
        ['Bubble & dew point', 'P', 'in S-01'], ['Isothermal flash (Rachford\u2013Rice)', 'B', 'S-05'],
        ['Relative volatility', 'P', 'in S-02'], ['Henry\u2019s law & gas solubility', 'B', 'S-11']] },
      { g: 'Properties', items: [
        ['Natural gas compressibility Z', 'B', 'T-03'], ['Natural gas viscosity', 'B', 'T-03'],
        ['Steam tables (IAPWS-IF97)', 'B', 'T-01'], ['Psychrometric calculations', 'B', 'T-02'],
        ['Gas mixture properties', 'B', 'T-06'], ['Solvent property & sizing', 'B', 'T-07'],
        ['Property estimation \u2014 Joback', 'B', 'T-10']] },
      { g: 'Petroleum & refining', items: [
        ['Degree API gravity & density', 'B', 'T-04'], ['Volume correction to 15 \u00b0C (ASTM D1250)', 'P', 'in T-04'],
        ['Barrel \u2194 tonne conversion', 'P', 'in T-04'], ['Watson characterisation factor', 'P', 'in T-04'],
        ['Fuel & residue blending', 'B', 'T-05'], ['Refutas viscosity blending', 'P', 'in T-05'],
        ['Flash point & sulphur blending', 'P', 'in T-05'], ['Crude assay & TBP cuts', 'B', 'T-08'],
        ['Octane & cetane blending', 'B', 'T-09']] },
      { g: 'Equipment', items: [
        ['Vessel volume & level', 'B', 'E-01'], ['Pressure vessel thickness & MAWP', 'B', 'E-02'],
        ['Vertical separator sizing', 'B', 'E-03'], ['Horizontal separator sizing', 'B', 'E-03'],
        ['Tank design & emission loss', 'B', 'E-06'], ['Nozzle & manway sizing', 'B', 'E-07'],
        ['Cyclone sizing', 'B', 'E-08']] },
      { g: 'Mixing', items: [
        ['Agitator power & impeller selection', 'B', 'E-04'], ['Blend time', 'P', 'in E-04'],
        ['Solid suspension (Zwietering)', 'P', 'in E-04'], ['Agitated vessel heat transfer', 'B', 'H-10']] },
      { g: 'Others & utilities', items: [
        ['Unit conversion', 'B', 'U-04'], ['Cooling tower makeup water', 'B', 'U-01'],
        ['Gas volume conversion', 'P', 'in U-04'], ['Condensate flash', 'B', 'H-11'],
        ['Steam desuperheating', 'B', 'H-12'], ['Recycle & purge balance', 'B', 'U-02'],
        ['Equipment cost & capital estimate', 'B', 'U-03'], ['CEPCI escalation', 'P', 'in U-03']] },
      { g: 'Reactors & kinetics \u2014 beyond the reference set', items: [
        ['Reversible batch reaction', 'B', 'R-01'], ['Series reactions & optimum time', 'B', 'R-02'],
        ['Parallel reactions & selectivity', 'B', 'R-03'], ['CSTR vs PFR sizing', 'B', 'R-04'],
        ['Non-isothermal CSTR multiplicity', 'B', 'R-05'], ['Packed bed \u2014 diffusion & \u0394P', 'B', 'R-06'],
        ['Transport limitation criteria', 'B', 'R-07'], ['Thiele modulus & effectiveness', 'B', 'R-07'],
        ['Residence-time distribution', 'B', 'R-08'], ['Enzyme / Michaelis\u2013Menten kinetics', 'B', 'R-09']] },
      { g: 'Process dynamics & control', items: [
        ['First-order plus dead time model', 'B', 'C-01'], ['Second-order dynamics & damping', 'B', 'C-02'],
        ['Process reaction curve', 'P', 'in C-01'], ['PID tuning \u2014 Ziegler\u2013Nichols', 'B', 'C-03'],
        ['PID tuning \u2014 Cohen\u2013Coon', 'P', 'in C-03'], ['IMC / lambda tuning', 'P', 'in C-03'],
        ['Tyreus\u2013Luyben tuning', 'P', 'in C-03'], ['Closed-loop servo & regulator simulation', 'B', 'C-04'],
        ['Integral error criteria IAE / ISE / ITAE', 'P', 'in C-04'], ['Bode plot & stability margins', 'B', 'C-05'],
        ['Nyquist plot & maximum sensitivity', 'B', 'C-06'], ['Direct substitution & ultimate gain', 'P', 'in C-06'],
        ['Cascade control', 'B', 'C-07'], ['Feedforward with feedback trim', 'B', 'C-08'],
        ['Lead\u2013lag compensator design', 'P', 'in C-08'], ['Level control \u2014 integrating process', 'B', 'C-09'],
        ['Averaging vs tight level control', 'P', 'in C-09'], ['Process identification from a step test', 'B', 'C-10'],
        ['Smith predictor \u2014 dead-time compensation', 'B', 'C-11']] },
      { g: 'Phase equilibria & thermodynamic models', items: [
        ['Margules \u2014 two and three suffix', 'B', 'Q-01'], ['van Laar model', 'P', 'in Q-01'],
        ['Wilson model', 'P', 'in Q-01'], ['NRTL model', 'B', 'Q-02'],
        ['UNIQUAC model', 'B', 'Q-03'], ['Excess Gibbs energy & \u03b3\u221e', 'P', 'in Q-01'],
        ['Azeotrope prediction & pressure swing', 'P', 'in Q-02'], ['Cubic EOS \u2014 van der Waals', 'B', 'Q-04'],
        ['Cubic EOS \u2014 Redlich\u2013Kwong & SRK', 'P', 'in Q-04'], ['Cubic EOS \u2014 Peng\u2013Robinson', 'P', 'in Q-04'],
        ['Fugacity coefficient', 'B', 'Q-05'], ['Departure functions H\u1d3f, S\u1d3f', 'P', 'in Q-05'],
        ['Liquid\u2013liquid equilibrium & binodal', 'B', 'Q-06'], ['Spinodal & stability analysis', 'P', 'in Q-06'],
        ['Vapour pressure \u2014 Antoine & Clausius\u2013Clapeyron', 'B', 'Q-07'], ['Watson \u0394H_vap correlation', 'P', 'in Q-07'],
        ['Thermodynamic consistency \u2014 Herington', 'B', 'Q-08'], ['Van Ness point test', 'P', 'in Q-08']] },
      { g: 'Multicomponent distillation', items: [
        ['Sorel plate-to-plate with energy balances', 'B', 'M-01'], ['Lewis constant molal overflow', 'P', 'in M-01'],
        ['Lewis\u2013Matheson method', 'B', 'M-02'], ['Thiele\u2013Geddes method', 'B', 'M-03'],
        ['Lyster \u03b8-method convergence', 'P', 'in M-03'], ['Wang\u2013Henke bubble-point matrix method', 'B', 'M-04'],
        ['Tridiagonal MESH solution', 'P', 'in M-04'], ['Column composition & temperature profiles', 'P', 'in M-04'],
        ['Hengstebeck\u2013Geddes non-key distribution', 'B', 'M-05'], ['Fenske minimum stages', 'P', 'in M-05'],
        ['Underwood minimum reflux \u2014 multicomponent', 'B', 'M-06'], ['Gilliland correlation', 'P', 'in M-06'],
        ['Kirkbride feed-stage location', 'P', 'in M-06']] },
      { g: 'Multiphase reaction engineering', items: [
        ['Hatta number & enhancement factor', 'B', 'X-01'], ['van Krevelen\u2013Hoftijzer chart', 'P', 'in X-01'],
        ['Gas\u2013liquid regime classification', 'B', 'X-02'], ['Film concentration profiles', 'P', 'in X-02'],
        ['Instantaneous reaction plane', 'P', 'in X-02'], ['Damk\u00f6hler numbers I\u2013IV', 'B', 'X-03'],
        ['Overall effectiveness & observed E_a', 'P', 'in X-03'], ['Slurry reactor resistances in series', 'B', 'X-04'],
        ['Satterfield 1/r against 1/m plot', 'P', 'in X-04'], ['Trickle bed \u2014 wetting efficiency', 'B', 'X-05'],
        ['Gas-limited vs liquid-limited pellets', 'P', 'in X-05'], ['Bubble column \u2014 hold-up & k_La', 'B', 'X-06'],
        ['Flow regime transition', 'P', 'in X-06'], ['Shrinking-core model', 'B', 'X-07'],
        ['Ash, film and reaction control', 'P', 'in X-07'], ['Fluidised bed \u2014 Kunii\u2013Levenspiel', 'B', 'X-08'],
        ['Bubble bypass and interchange', 'P', 'in X-08']] },
      { g: 'Statistics & data analysis', items: [
        ['Distribution atlas \u2014 19 distributions', 'B', 'D-01'], ['Moments, quantiles & shape', 'P', 'in D-01'],
        ['Hypothesis test selector \u2014 19 tests', 'B', 'D-02'], ['p-values & rejection regions', 'P', 'in D-02'],
        ['Statistical power & sample size', 'P', 'in D-02'], ['Central limit theorem', 'B', 'D-03'],
        ['Sampling distribution of the mean', 'P', 'in D-03'], ['Confidence & prediction intervals', 'B', 'D-04'],
        ['Tolerance intervals', 'P', 'in D-04'], ['Sample size for a target margin', 'P', 'in D-04'],
        ['Linear regression & diagnostics', 'B', 'D-05'], ['Residual analysis & influence', 'P', 'in D-05'],
        ['Uncertainty propagation (GUM)', 'B', 'D-06'], ['Monte Carlo uncertainty', 'P', 'in D-06'],
        ['Shewhart control charts', 'B', 'D-07'], ['Process capability C_p, C_pk', 'P', 'in D-07'],
        ['Two-level factorial design', 'B', 'D-08'], ['Half-normal plot & Lenth PSE', 'P', 'in D-08'],
        ['Arrhenius parameter estimation', 'B', 'D-09'], ['Parameter correlation & reparameterisation', 'P', 'in D-09'],
        ['Data reconciliation', 'B', 'D-10'], ['Gross-error detection', 'P', 'in D-10']] },
      { g: 'Compounds & properties', items: [
        ['Compound library \u2014 26 reference compounds', 'B', 'P-01'], ['CAS-number lookup (PubChem)', 'P', 'in P-01'],
        ['SMILES \u2192 Joback group counting', 'P', 'in P-01'], ['Offline estimation from a formula', 'P', 'in P-01'],
        ['Joback critical constants', 'B', 'T-10'], ['Lee\u2013Kesler acentric factor', 'P', 'in P-01'],
        ['Antoine regression from an estimate', 'P', 'in P-01'], ['User-added compounds in every picker', 'P', 'in P-01'],
        ['Compound comparison & K-values', 'B', 'P-02'], ['Kay\u2019s pseudocritical rule', 'P', 'in P-02'],
        ['Ideal relative volatility screen', 'P', 'in P-02']] },
      { g: 'Crystallisation', items: [
        ['Solubility curves & cooling yield', 'B', 'Y-01'], ['Hydrate yield with water of crystallisation', 'P', 'in Y-01'],
        ['Supersaturation & the metastable zone', 'B', 'Y-02'], ['Primary nucleation \u2014 classical theory', 'P', 'in Y-02'],
        ['Secondary nucleation power law', 'P', 'in Y-02'], ['N\u00fdvlt metastable width', 'P', 'in Y-02'],
        ['Population balance \u2014 MSMPR CSD', 'B', 'Y-03'], ['Moments, L_dom and magma density', 'P', 'in Y-03'],
        ['Growth & nucleation kinetics from CSD', 'B', 'Y-04'], ['Relative kinetic order b/g', 'P', 'in Y-04'],
        ['Batch cooling profile control', 'B', 'Y-05'], ['Seeding and size amplification', 'P', 'in Y-05'],
        ['Evaporative crystallisation', 'B', 'Y-06'], ['Antisolvent crystallisation', 'P', 'in Y-06'],
        ['Crystalliser sizing & scale-up', 'B', 'Y-07'], ['Fines destruction & classification', 'P', 'in Y-07'],
        ['Zwietering suspension check', 'P', 'in Y-07']] },
      { g: 'Fluidisation & packed beds', items: [
        ['Ergun equation \u2014 packed-bed \u0394P', 'B', 'Z-01'], ['Blake\u2013Kozeny & Burke\u2013Plummer limits', 'P', 'in Z-01'],
        ['Sphericity and wall effects', 'P', 'in Z-01'], ['Minimum fluidisation velocity', 'B', 'Z-02'],
        ['Wen\u2013Yu correlation', 'P', 'in Z-02'], ['Bed expansion (Richardson\u2013Zaki)', 'P', 'in Z-02'],
        ['Terminal velocity & operating window', 'P', 'in Z-02'], ['Geldart powder classification', 'B', 'Z-03'],
        ['Minimum bubbling velocity', 'P', 'in Z-03'], ['Slugging and regime transitions', 'P', 'in Z-03'],
        ['Entrainment & TDH', 'B', 'Z-04'], ['Elutriation and cyclone recovery', 'P', 'in Z-04'],
        ['Catalytic fixed vs fluidised bed', 'B', 'Z-05'], ['Bubble bypass penalty', 'P', 'in Z-05'],
        ['Non-catalytic fluid bed \u2014 Yagi\u2013Kunii', 'B', 'Z-06'], ['Staging to beat the mixing loss', 'P', 'in Z-06']] },
      { g: 'Process equipment design', items: [
        ['Shell-and-tube tube count & layout', 'B', 'G-01'], ['TEMA bundle & shell diameter', 'P', 'in G-01'],
        ['Baffle spacing & shell-side geometry', 'P', 'in G-01'], ['Tray column diameter & internals', 'B', 'G-02'],
        ['Downcomer sizing & backup', 'P', 'in G-02'], ['Weir and hole layout', 'P', 'in G-02'],
        ['Packed column diameter (Eckert)', 'B', 'G-03'], ['HETP and bed depth limits', 'P', 'in G-03'],
        ['Liquid distributor criteria', 'P', 'in G-03'], ['Storage tank shell courses (API 650)', 'B', 'G-04'],
        ['Wind overturning & anchorage', 'P', 'in G-04'], ['Plate-and-frame filtration', 'B', 'G-05'],
        ['Optimum filtration cycle', 'P', 'in G-05'], ['Cake washing efficiency', 'P', 'in G-05'],
        ['Rotary dryer sizing', 'B', 'G-06'], ['Drying-rate curve & critical moisture', 'P', 'in G-06'],
        ['Flare & vent stack sizing (API 521)', 'B', 'G-07'], ['Radiation criteria & flame tilt', 'P', 'in G-07'],
        ['Multiple-effect evaporator train', 'B', 'G-08'], ['Steam economy & optimum effects', 'P', 'in G-08']] }
    ];
    return this._cov;
  }
  covN(kind) {
    const c = this._covN || (this._covN = {});
    if (c[kind] !== undefined) return c[kind];
    let n = 0;
    this.cov().forEach(g => g.items.forEach(it => { if (!kind || it[1] === kind) n++; }));
    return (c[kind] = n);
  }
  coverage() {
    if (this._covV) return this._covV;
    return (this._covV = this.cov().map(g => ({
      g: g.g,
      items: g.items.map(it => {
        const num = String(it[2] || '').replace(/^in\s+/, '');
        const id = this.numMap()[num];
        return { name: it[0], mark: it[1] === 'B' ? '+' : '\u00b7', ref: it[2], linked: !!id, plain: !id, go: id ? () => this.setState({ home: false, mod: id, nav: false }) : null };
      })
    })));
  }

