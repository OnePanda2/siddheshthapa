/* CST-7 asserted that rendered depth ordering equals raw distance ordering.
   It does not, and it should not: depth is the component along the LINE OF
   SIGHT, and Merak (84.5 ly) sits further off-axis than Phecda (83.2 ly), so
   its projected depth is fractionally shorter. Two stars 1.3 ly apart swap.
   That is the projection being correct.

   Recompute the expected depth from the dataset with the same formula the
   renderer uses, and compare against that. Exact, and not gameable. */
const fs = require('fs');
const F = 'tools/constellationcheck.js';
let s = fs.readFileSync(F, 'utf8');
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 60)); process.exit(1); }
  s = s.replace(find, repl);
}

sub(`// CST-7 — depth ordering is the measured distance ordering
const byDepth = withPos.slice().sort((a, b) => a.depth - b.depth).map(s => s.star);
const byDist = withPos.slice().sort((a, b) => a.ly - b.ly).map(s => s.star);
const depthErr = Math.max(...withPos.map(s => Math.abs(s.depth - (s.ly - K.meanDistanceLy))));`,
`/* CST-7 — depth must be the measured distance projected onto the line of
   sight. Rebuild the figure's own frame from the dataset and compare. */
const names = D.measured.stars.map(s => s.proper);
const wv = [0, 0, 0];
D.measured.stars.forEach(s => { const c = cart[s.proper];
  for (let i = 0; i < 3; i++) wv[i] += c[i] / s.distanceLy; });
const wn = Math.hypot(...wv); const W = wv.map(x => x / wn);
const dotW = p => p[0] * W[0] + p[1] * W[1] + p[2] * W[2];
const meanDepth = names.reduce((a, nm) => a + dotW(cart[nm]), 0) / names.length;
const expected = {};
names.forEach(nm => expected[nm] = dotW(cart[nm]) - meanDepth);
const depthErr = Math.max(...withPos.map(s => Math.abs(s.depth - expected[s.star])));
const byDepth = withPos.slice().sort((a, b) => a.depth - b.depth).map(s => s.star);
const byDist = withPos.slice().sort((a, b) => expected[a.star] - expected[b.star]).map(s => s.star);`);

sub(`ck('CST-7', JSON.stringify(byDepth) === JSON.stringify(byDist) && depthErr < 3.0,
   'depth ordering IS the measured distance ordering (' + byDist.slice(0, 3).join(' < ') +
   ' … ' + byDist[byDist.length - 1] + '), line-of-sight vs raw distance differs by at most ' + depthErr.toFixed(2) + ' ly');`,
`ck('CST-7', JSON.stringify(byDepth) === JSON.stringify(byDist) && depthErr < 0.05 &&
            withPos.length === 8,
   'every star\\'s depth is its MEASURED distance projected on the line of sight — ' +
   byDist.slice(0, 2).join(' < ') + ' … ' + byDist[byDist.length - 1] +
   ', max deviation from the recomputed value ' + depthErr.toFixed(4) + ' ly');`);

fs.writeFileSync(F, s, 'utf8');
console.log('CST-7 now checks depth against the recomputed line-of-sight value');
