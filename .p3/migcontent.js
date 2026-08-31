/* Read what the candidate regions actually SAY. A constellation is a figure a
   human draws between lights that are not physically related — so the MIG that
   earns it should be one whose meaning is about pattern-finding, separateness,
   or many points read as one shape. Structure alone can't decide that. */
const fs = require('fs');
const s = fs.readFileSync('preview.html', 'utf8');
const blk = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const minorsRaw = blk('  var MINORS=[', '  var THOUGHTS=[');
const thoughtsRaw = blk('  var THOUGHTS=[', '  var EDGES=[');
const migsRaw = blk('  var MIGS=[', '  var MINORS=[');
const eStart = s.indexOf('  var EDGES=['), eEnd = s.indexOf('\n  ];', eStart);
const EDGES = [...s.slice(eStart, eEnd).matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'/g)]
  .map(m => ({ a: m[1], b: m[2], v: m[3] }));

const want = (process.argv[2] || 'observation,society,business,technology,movies').split(',');
const MINORS = [...minorsRaw.matchAll(/\{id:'([^']+)',label:'([^']+)',mig:'([^']+)'([^}]*)\}/g)];
const THOUGHTS = [...thoughtsRaw.matchAll(/\{id:'([^']+)'([^}]*)\}/g)];
const home = {};
MINORS.forEach(m => home[m[1]] = m[3]);
THOUGHTS.forEach(m => { const g = m[0].match(/mig:'([^']+)'/); if (g) home[m[1]] = g[1]; });

console.log('MIG blurbs:');
[...migsRaw.matchAll(/\{id:'([^']+)',label:'([^']+)'([^}]*)\}/g)].forEach(m => {
  if (want.indexOf(m[1]) < 0) return;
  const g = (m[3].match(/gloss:'([^']*)'/) || [])[1];
  console.log('  ' + m[2].padEnd(16) + (g || ''));
});

want.forEach(mig => {
  console.log('\n═══ ' + mig.toUpperCase() + ' ═══');
  console.log('  Minor IGs:');
  MINORS.filter(m => m[3] === mig).forEach(m => {
    const line = (m[4].match(/line:'([^']*)'/) || [])[1];
    const st = (m[4].match(/state:'([^']*)'/) || [])[1];
    const cr = (m[4].match(/crosses:\[([^\]]*)\]/) || [])[1];
    console.log('    ' + m[2].padEnd(20) + (st || '').padEnd(9) +
                (cr ? 'crosses ' + cr.replace(/'/g, '') : ''));
    if (line) console.log('      "' + line.slice(0, 96) + '"');
  });
  const w = THOUGHTS.filter(m => /mig:'/.test(m[0]) && m[0].match(/mig:'([^']+)'/)[1] === mig);
  console.log('  Writings (' + w.length + '):');
  w.forEach(m => {
    const t = (m[0].match(/t:'([^']+)'/) || [])[1];
    const l = (m[0].match(/label:'([^']*)'/) || [])[1];
    console.log('    ' + (t || '?').padEnd(15) + (l || '').slice(0, 60));
  });
  const inE = EDGES.filter(e => home[e.a] === mig && home[e.b] === mig);
  console.log('  Internal relationships (' + inE.length + '):');
  inE.forEach(e => console.log('    ' + e.a + '  --' + e.v + '-->  ' + e.b));
});
