/* Is a depth-exaggeration factor actually needed?
   Convert (RA, Dec, distance) to true Cartesian light-years, rotate so the mean
   viewing direction is the depth axis, and compare the transverse extent with
   the depth extent. If they are comparable, the honest thing is true relative
   scale with ONE map constant — and no illustrative dial at all. */
const d = JSON.parse(require('fs').readFileSync('data/constellation-ursa-major.json', 'utf8'));
const S = d.measured.stars;
const rad = x => x * Math.PI / 180;

const cart = S.map(s => {
  const ra = rad(s.raDeg), de = rad(s.decDeg), r = s.distanceLy;
  return { name: s.proper, v: [r * Math.cos(de) * Math.cos(ra),
                               r * Math.cos(de) * Math.sin(ra),
                               r * Math.sin(de)], ly: r };
});
/* mean direction = the vantage point's line of sight to the figure */
const mean = [0, 1, 2].map(i => cart.reduce((a, c) => a + c.v[i] / c.ly, 0) / cart.length);
const mn = Math.hypot(...mean);
const w = mean.map(x => x / mn);                       // depth axis
const up = [0, 0, 1];
let u = [w[1] * up[2] - w[2] * up[1], w[2] * up[0] - w[0] * up[2], w[0] * up[1] - w[1] * up[0]];
const un = Math.hypot(...u); u = u.map(x => x / un);   // east
const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const meanDepth = cart.reduce((a, c) => a + dot(c.v, w), 0) / cart.length;

const P = cart.map(c => ({ name: c.name, ly: c.ly,
  x: dot(c.v, u), y: dot(c.v, v), z: dot(c.v, w) - meanDepth }));
const ext = k => Math.max(...P.map(p => p[k])) - Math.min(...P.map(p => p[k]));
console.log('true 3D extents, in light years:');
console.log('  transverse x  ' + ext('x').toFixed(1) + ' ly');
console.log('  transverse y  ' + ext('y').toFixed(1) + ' ly');
console.log('  DEPTH      z  ' + ext('z').toFixed(1) + ' ly');
console.log('  depth / width ' + (ext('z') / ext('x')).toFixed(2) + 'x');
console.log('\nper star (x, y, depth) in ly, depth relative to the figure mean:');
P.forEach(p => console.log('  ' + p.name.padEnd(7) +
  p.x.toFixed(1).padStart(7) + p.y.toFixed(1).padStart(7) + p.z.toFixed(1).padStart(8) +
  '   (' + p.ly.toFixed(1) + ' ly)'));
const sc = 150 / ext('x');
console.log('\nat a scale putting the figure 150 scene units wide (x' + sc.toFixed(2) + '):');
console.log('  depth spread becomes ' + (ext('z') * sc).toFixed(1) + ' scene units');
