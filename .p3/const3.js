/* Two corrections found by probing the built artifact.

   1. LINKS stores the relationship verb under `verb`; the harness read `l.v`
      and reported every constellation line as "undefined". Same class as the
      A18 bug — geometry correct, meaning blank.

   2. The research said 53 background stars. The raw field query returned 53
      ROWS, but 11 of them are the eight named stars and their resolved
      components (Dubhe x3, Mizar x2). Drawing them would render the
      constellation twice. 42 are genuine background. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

edit('src/v02-app.js',
  `      internalEdges:k.internal.map(function(l){ return {a:l.a,b:l.b,v:l.v}; }),`,
  `      internalEdges:k.internal.map(function(l){ return {a:l.a,b:l.b,verb:l.verb}; }),`);

/* record the real counts in the data, so no check can read 53 as "atmospheric" */
const F = 'data/constellation-ursa-major.json';
const d = JSON.parse(fs.readFileSync(F, 'utf8'));
const named = d.measured.stars;
const dup = d.background.stars.filter(b =>
  named.some(s => Math.abs(s.raDeg - b.raDeg) < 0.02 && Math.abs(s.decDeg - b.decDeg) < 0.02));
d.background.rawFieldRows = d.background.stars.length;
d.background.namedOrComponentRows = dup.length;
d.background.atmosphericCount = d.background.stars.length - dup.length;
d.background._countNote =
  'The field query returned ' + d.background.stars.length + ' rows. ' + dup.length +
  ' of them are the eight named stars or their resolved components (Dubhe appears three times, Mizar twice), and the renderer drops them by coordinate match within 0.02 deg — drawing them would render the constellation twice and let the sky compete with the figure. ' +
  (d.background.stars.length - dup.length) + ' rows are genuine atmospheric background.';
fs.writeFileSync(F, JSON.stringify(d, null, 1), 'utf8');
n++;

console.log(n + ' corrections applied');
console.log('  raw rows            ' + d.background.rawFieldRows);
console.log('  named + components  ' + d.background.namedOrComponentRows);
console.log('  atmospheric         ' + d.background.atmosphericCount);
