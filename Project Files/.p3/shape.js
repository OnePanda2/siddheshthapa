/* What SHAPE does a MIG's internal relationship graph actually make?
   A constellation figure is a path or a thin tree. A mesh is a hairball and
   should stay planetary. Measure components, degrees, and whether the graph is
   a simple path — and find any object that connects to nothing inside its own
   region, because that is a real outlier, not a decorative one. */
const fs = require('fs');
const s = fs.readFileSync('preview.html', 'utf8');
const blk = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const MINORS = [...blk('  var MINORS=[', '  var THOUGHTS=[')
  .matchAll(/\{id:'([^']+)',label:'([^']+)',mig:'([^']+)'/g)];
const THOUGHTS = [...blk('  var THOUGHTS=[', '  var EDGES=[').matchAll(/\{id:'([^']+)'([^}]*)\}/g)];
const eStart = s.indexOf('  var EDGES=['), eEnd = s.indexOf('\n  ];', eStart);
const EDGES = [...s.slice(eStart, eEnd).matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'/g)]
  .map(m => ({ a: m[1], b: m[2], v: m[3] }));

const home = {}, kind = {}, label = {};
MINORS.forEach(m => { home[m[1]] = m[3]; kind[m[1]] = 'minor'; label[m[1]] = m[2]; });
THOUGHTS.forEach(m => {
  const g = m[0].match(/mig:'([^']+)'/); if (!g) return;
  home[m[1]] = g[1];
  kind[m[1]] = (m[0].match(/t:'([^']+)'/) || [])[1] || 'writing';
  label[m[1]] = (m[0].match(/label:'([^']*)'/) || [])[1] || m[1];
});

const migs = [...new Set(Object.values(home))];
const out = [];
migs.forEach(mig => {
  const nodes = Object.keys(home).filter(id => home[id] === mig);
  const es = EDGES.filter(e => home[e.a] === mig && home[e.b] === mig);
  const adj = {}; nodes.forEach(n => adj[n] = []);
  es.forEach(e => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
  // components
  const seen = {}; let comps = 0, biggest = 0;
  nodes.forEach(n => {
    if (seen[n]) return;
    comps++; let size = 0; const st = [n]; seen[n] = 1;
    while (st.length) { const c = st.pop(); size++; adj[c].forEach(x => { if (!seen[x]) { seen[x] = 1; st.push(x); } }); }
    if (size > biggest) biggest = size;
  });
  const degs = nodes.map(n => adj[n].length);
  const isolated = nodes.filter(n => adj[n].length === 0);
  const leaves = degs.filter(d => d === 1).length;
  const maxDeg = Math.max(0, ...degs);
  // a path: every node degree <=2, exactly 2 leaves, one component covering it
  const pathish = maxDeg <= 2 && leaves === 2;
  out.push({ mig, n: nodes.length, e: es.length, comps, biggest, maxDeg, leaves,
             pathish, isolated, treeRatio: es.length / Math.max(1, nodes.length - 1) });
});
out.sort((a, b) => a.treeRatio - b.treeRatio);
console.log('MIG'.padEnd(13) + 'obj'.padStart(4) + 'rel'.padStart(4) + 'comp'.padStart(5) +
            'max°'.padStart(5) + 'leaf'.padStart(5) + 'e/(n-1)'.padStart(8) + '  shape');
out.forEach(r => {
  console.log(r.mig.padEnd(13) + String(r.n).padStart(4) + String(r.e).padStart(4) +
    String(r.comps).padStart(5) + String(r.maxDeg).padStart(5) + String(r.leaves).padStart(5) +
    r.treeRatio.toFixed(2).padStart(8) + '  ' +
    (r.pathish ? 'PATH/CHAIN' : r.treeRatio <= 1.05 ? 'tree-like' : 'mesh') +
    (r.isolated.length ? '  · unconnected inside its own region: ' +
      r.isolated.map(i => label[i]).join(', ') : ''));
});

/* print the actual chain for the best candidate */
const target = process.argv[2] || 'observation';
console.log('\n═══ ' + target.toUpperCase() + ' — the figure its own relationships draw ═══');
const nodes = Object.keys(home).filter(id => home[id] === target);
const es = EDGES.filter(e => home[e.a] === target && home[e.b] === target);
const adj = {}; nodes.forEach(n => adj[n] = []);
es.forEach(e => { adj[e.a].push({ o: e.b, v: e.v }); adj[e.b].push({ o: e.a, v: e.v }); });
const ends = nodes.filter(n => adj[n].length === 1);
if (ends.length) {
  let cur = ends[0], prev = null, chain = [];
  while (cur) {
    chain.push(cur);
    const nx = adj[cur].find(x => x.o !== prev);
    if (!nx) break;
    prev = cur; cur = nx.o;
  }
  chain.forEach((id, i) => console.log('  ' + (i + 1) + '. ' + label[id].padEnd(34) +
    '(' + kind[id] + ', degree ' + adj[id].length + ')'));
}
nodes.filter(n => adj[n].length === 0).forEach(n =>
  console.log('  ✱  ' + label[n] + '  — connects to nothing inside its own region'));
