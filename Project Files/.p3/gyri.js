/* The outline of a brain is close to a kidney; what makes people SAY "brain" is
   the folded surface. The renderer draws points and lines, so the folds have to
   be lines. Prototype them offline before touching the scene.

   A gyrus is parametrised on the shell with the pole along X:
     dir = ( cos(alpha), sin(alpha)*cos(beta), sin(alpha)*sin(beta) )
   beta sweeps front-to-back around the sagittal profile; alpha — the lateral
   depth — meanders. That is what a gyrus does.

   usage: node .p3/gyri.js [lateral|threequarter|top] [bands]
*/
function smooth(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
const PROFILE = [1.00,1.03,1.04,1.02,0.99,0.95,0.92,0.90,0.88,0.86,0.84,0.82,
                 0.80,0.76,0.72,0.76,0.70,0.54,0.48,0.54,0.66,0.80,0.88,0.94];
function radiusAt(phi) {
  const n = PROFILE.length, step = (Math.PI * 2) / n;
  let a = phi % (Math.PI * 2); if (a < 0) a += Math.PI * 2;
  const i = Math.floor(a / step), f = (a - i * step) / step;
  const t = (1 - Math.cos(f * Math.PI)) / 2;
  return PROFILE[i % n] * (1 - t) + PROFILE[(i + 1) % n] * t;
}
function widthAt(y, z) {
  let w = 0.74;
  w *= 1 - 0.26 * smooth(0.35, 1.0, z);
  w *= 1 - 0.30 * smooth(0.35, 1.0, -z);
  w *= 1 - 0.36 * smooth(0.25, 0.95, -y);
  w *= 1 + 0.20 * Math.exp(-Math.pow((y + 0.28) / 0.34, 2));
  return w;
}
function shell(x, y, z) {
  const r = radiusAt(Math.atan2(y, z));
  return [x * widthAt(y, z) + (x >= 0 ? 1 : -1) * 0.10, y * r * 0.78, z * r];
}

/* ── the gyri ─────────────────────────────────────────────────────────
   Each band sweeps beta and meanders in alpha. Deterministic from its index,
   mirrored across the midline, and stopping short of the poles so the folds
   wrap the mass instead of collapsing on it. */
const BANDS = +(process.argv[3] || 9);
function gyrus(k, side) {
  const pts = [];
  const a0 = 0.34 + (k / (BANDS-1)) * 1.06;        // lateral depth of this fold
  const amp = 0.055 + 0.030 * Math.sin(k * 2.1);  // how much it wanders
  const freq = 2 + (k % 2);                       // how often
  const psi = k * 1.7;
  const SEG = 74;
  for (let s = 0; s <= SEG; s++) {
    /* sweep the sagittal angle, but stop short of straight down */
    const beta = -0.62 + (s / SEG) * 4.10;
    const alpha = a0 + amp * Math.sin(freq * beta + psi);
    const x = Math.cos(alpha) * side;
    const rr = Math.sin(alpha);
    const y = rr * Math.sin(beta), z = rr * Math.cos(beta);
    pts.push(shell(x, y, z));
  }
  return pts;
}
const curves = [];
for (let k = 0; k < BANDS; k++) { curves.push(gyrus(k, 1)); curves.push(gyrus(k, -1)); }

const VIEWS = { lateral:[2.60,0.26,0.30], threequarter:[2.05,0.52,1.15], top:[0.18,2.40,0.28] };
const eye = VIEWS[process.argv[2] || 'threequarter'] || VIEWS.threequarter;
const en = Math.hypot(...eye), w3 = eye.map(v => v / en);
let u = [-w3[2], 0, w3[0]]; const un = Math.hypot(...u); u = u.map(v => v / un);
const v2 = [w3[1]*u[2]-w3[2]*u[1], w3[2]*u[0]-w3[0]*u[2], w3[0]*u[1]-w3[1]*u[0]];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

const all = [].concat(...curves).map(p => [dot(p, u), dot(p, v2), dot(p, w3)]);
const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);

const W = 92, H = 36;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
curves.forEach(c => {
  const pr = c.map(p => [dot(p, u), dot(p, v2), dot(p, w3)]);
  for (let i = 0; i < pr.length - 1; i++) {
    /* draw the segment, nearer folds in a heavier mark */
    const near = pr[i][2] > 0;
    for (let t = 0; t <= 1; t += 0.12) {
      const px = pr[i][0] + (pr[i+1][0]-pr[i][0]) * t;
      const py = pr[i][1] + (pr[i+1][1]-pr[i][1]) * t;
      const cx = Math.round((px - x0) / (x1 - x0) * (W - 1));
      const cy = Math.round((1 - (py - y0) / (y1 - y0)) * (H - 1));
      if (grid[cy] && (near || grid[cy][cx] === ' ')) grid[cy][cx] = near ? '#' : '.';
    }
  }
});
console.log('view ' + (process.argv[2] || 'threequarter') + '   ' + curves.length +
            ' folds   ratio ' + ((y1 - y0) / (x1 - x0)).toFixed(2) + '\n');
grid.forEach(r => console.log('  ' + r.join('')));
