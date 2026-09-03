/* Which MIG genuinely wants to be a constellation?
   Not which name sounds celestial — measure the topology.

   A constellation wants: few bodies, wide spacing, sparse but MEANINGFUL
   links, and a shape that means something. A dense, highly-interconnected
   region would render as a hairball and should stay planetary. */
const fs = require('fs');
const s = fs.readFileSync('preview.html', 'utf8');

function block(startMark, endMark) {
  const a = s.indexOf(startMark), b = s.indexOf(endMark);
  return s.slice(a, b);
}
const migsRaw = block('  var MIGS=[', '  var MINORS=[');
const minorsRaw = block('  var MINORS=[', '  var THOUGHTS=[');
const thoughtsRaw = block('  var THOUGHTS=[', '  var EDGES=[');
const eStart = s.indexOf('  var EDGES=[');
const eEnd = s.indexOf('\n  ];', eStart);
const edgesRaw = s.slice(eStart, eEnd > 0 ? eEnd : eStart + 60000);

const MIGS = [...migsRaw.matchAll(/\{id:'([^']+)',label:'([^']+)'/g)].map(m => ({ id: m[1], label: m[2] }));
const MINORS = [...minorsRaw.matchAll(/\{id:'([^']+)',label:'([^']+)',mig:'([^']+)'([^}]*)\}/g)]
  .map(m => ({ id: m[1], label: m[2], mig: m[3], rest: m[4] || '' }));
const THOUGHTS = [...thoughtsRaw.matchAll(/\{id:'([^']+)'([^}]*)\}/g)].map(m => {
  const o = m[0];
  const g = (k) => (o.match(new RegExp(k + ":'([^']*)'")) || [])[1];
  return { id: m[1], mig: g('mig'), t: g('t'), label: g('label') };
});
/* edges are ARRAYS, not objects: ['a','b','verb','note'] */
const EDGES = [...edgesRaw.matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'/g)]
  .map(m => ({ a: m[1], b: m[2], v: m[3] }));

const home = {};
MINORS.forEach(n => home[n.id] = n.mig);
THOUGHTS.forEach(n => home[n.id] = n.mig);

const deg = {};
EDGES.forEach(e => { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });

const stat = {};
MIGS.forEach(m => stat[m.id] = {
  label: m.label, minors: 0, writings: 0, contradictions: 0,
  inEdges: 0, crossEdges: 0, tension: 0, degs: [], crossPartners: new Set()
});
MINORS.forEach(n => { if (stat[n.mig]) stat[n.mig].minors++; });
THOUGHTS.forEach(n => {
  if (!stat[n.mig]) return;
  stat[n.mig].writings++;
  if (n.t === 'contradiction') stat[n.mig].contradictions++;
});
EDGES.forEach(e => {
  const ha = home[e.a], hb = home[e.b];
  if (!ha || !hb) return;
  if (ha === hb) { if (stat[ha]) stat[ha].inEdges++; }
  else {
    if (stat[ha]) { stat[ha].crossEdges++; stat[ha].crossPartners.add(hb); }
    if (stat[hb]) { stat[hb].crossEdges++; stat[hb].crossPartners.add(ha); }
  }
  if (e.v === 'tension') { if (stat[ha]) stat[ha].tension++; if (hb !== ha && stat[hb]) stat[hb].tension++; }
});
MINORS.forEach(n => { if (stat[n.mig]) stat[n.mig].degs.push(deg[n.id] || 0); });

console.log('graph: ' + MIGS.length + ' MIGs · ' + MINORS.length + ' Minor IGs · ' +
            THOUGHTS.length + ' writings · ' + EDGES.length + ' relationships\n');
console.log('MIG'.padEnd(13) + 'minor'.padStart(6) + 'writ'.padStart(6) + 'cntr'.padStart(6) +
            'inE'.padStart(5) + 'xE'.padStart(4) + 'xMIG'.padStart(6) +
            'dens'.padStart(7) + 'degs'.padStart(6) + '   degree spread');
const rows = MIGS.map(m => {
  const t = stat[m.id];
  const n = t.minors;
  const possible = n > 1 ? n * (n - 1) / 2 : 1;
  const density = t.inEdges / possible;
  const mx = Math.max(0, ...t.degs), mn = Math.min(99, ...t.degs);
  return { id: m.id, t, density, mx, mn };
});
rows.sort((a, b) => a.density - b.density);
rows.forEach(r => {
  const t = r.t;
  console.log(r.id.padEnd(13) + String(t.minors).padStart(6) + String(t.writings).padStart(6) +
    String(t.contradictions).padStart(6) + String(t.inEdges).padStart(5) +
    String(t.crossEdges).padStart(4) + String(t.crossPartners.size).padStart(6) +
    r.density.toFixed(2).padStart(7) + (t.degs.length ? (r.mn + '-' + r.mx) : '-').padStart(6) +
    '   ' + t.degs.slice().sort((a, b) => b - a).join(' '));
});
console.log('\nlegend: inE=edges inside the MIG · xE=cross-MIG edges · xMIG=distinct MIGs reached');
console.log('        dens=internal edges / all possible pairs among its Minor IGs');
