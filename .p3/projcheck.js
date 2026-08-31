/* Does a tangent-plane projection of these real coordinates actually draw the
   Dipper? Sketch it in ASCII before committing to it in the research document. */
const d = JSON.parse(require('fs').readFileSync('data/constellation-ursa-major.json', 'utf8'));
const S = d.measured.stars;
const rad = x => x * Math.PI / 180;
const ra0 = rad(S.reduce((a, s) => a + s.raDeg, 0) / S.length);
const de0 = rad(S.reduce((a, s) => a + s.decDeg, 0) / S.length);

/* gnomonic (tangent plane) projection about the field centre */
const pts = S.map(s => {
  const ra = rad(s.raDeg), de = rad(s.decDeg);
  const cosc = Math.sin(de0) * Math.sin(de) + Math.cos(de0) * Math.cos(de) * Math.cos(ra - ra0);
  const x = (Math.cos(de) * Math.sin(ra - ra0)) / cosc;
  const y = (Math.cos(de0) * Math.sin(de) - Math.sin(de0) * Math.cos(de) * Math.cos(ra - ra0)) / cosc;
  return { name: s.proper, x: -x, y: y, ly: s.distanceLy, v: s.vMag === null ? s.vMagDerived : s.vMag };
});
const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
const W = 66, H = 20;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
pts.forEach(p => {
  const cx = Math.round((p.x - x0) / (x1 - x0) * (W - 3)) + 1;
  const cy = Math.round((1 - (p.y - y0) / (y1 - y0)) * (H - 2)) + 1;
  const ch = p.name === 'Alcor' ? '+' : '*';
  if (grid[cy]) { grid[cy][cx] = ch;
    const lab = p.name.slice(0, 6);
    for (let i = 0; i < lab.length; i++) if (cx + 2 + i < W) grid[cy][cx + 2 + i] = lab[i]; }
});
console.log('tangent-plane projection of the MEASURED coordinates (+ = Alcor):\n');
grid.forEach(r => console.log('  ' + r.join('')));
console.log('\nangular extent: ' +
  ((x1 - x0) * 180 / Math.PI).toFixed(1) + ' deg wide x ' +
  ((y1 - y0) * 180 / Math.PI).toFixed(1) + ' deg tall');
console.log('depth spread  : ' + Math.min(...pts.map(p => p.ly)).toFixed(1) + ' - ' +
  Math.max(...pts.map(p => p.ly)).toFixed(1) + ' ly  (ratio ' +
  (Math.max(...pts.map(p => p.ly)) / Math.min(...pts.map(p => p.ly))).toFixed(2) + 'x)');
const mz = pts.find(p => p.name === 'Mizar'), al = pts.find(p => p.name === 'Alcor');
const sep = Math.hypot(mz.x - al.x, mz.y - al.y) * 180 / Math.PI * 60;
console.log('Mizar-Alcor   : ' + sep.toFixed(1) + ' arcmin apart');
