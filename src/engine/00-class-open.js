
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.schemRef = React.createRef();
    const map = { 'McCabe-Thiele': 'mccabe', 'Steam tables': 'steam', 'Moody chart': 'moody' };
    const start = map[props.startModule];
    this.state = { home: !start, mod: start || 'mccabe', us: props.defaultUnits === 'US', q: '', vals: {}, vw: typeof window !== 'undefined' ? window.innerWidth : 1440, nav: false, lib: this.loadLib(), lookup: '', lookMsg: '', looking: false };
    this.C = { ink: '#16263b', grid: 'rgba(22,38,59,0.08)', grid2: 'rgba(22,38,59,0.04)', bg: '#ffffff',
      acc: '#b0552a', dk: '#17324f', lt: '#a8c0da', mid: '#3d6490', mut: '#4e5e75', warn: '#b03024', div: '#dde4ec',
      soft: 'rgba(176,85,42,0.11)', soft2: 'rgba(23,50,79,0.10)', soft3: 'rgba(176,85,42,0.32)' };
  }

