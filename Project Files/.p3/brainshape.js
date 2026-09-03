/* Prototype the brain shell OFFLINE, so the shape can be judged in seconds
   instead of through a browser screenshot of fifteen dots.

   Sculpting an implicit blob failed: a radial dip cannot alter the silhouette,
   because the outline of a lateral view is the midsagittal ring, and on the
   unit sphere that ring cannot reach the band the Sylvian fissure occupies.

   So the profile is specified DIRECTLY. R(phi) is the midsagittal outline of a
   brain traced as a radius table — frontal pole, domed crown, occipital taper,
   cerebellum, flat base, temporal lobe — and a separate width function says how
   far the shell reaches sideways at each point on it.

   Coordinates: +Z anterior, +Y superior, +X right.
   usage: node .p3/brainshape.js [lateral|threequarter|top]
*/
function smooth(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* the midsagittal outline, every 15 degrees from +Z (front) toward +Y (top) */
const PROFILE = [
  1.00, // 0    frontal pole
  1.03, // 15
  1.04, // 30
  1.02, // 45
  0.99, // 60
  0.95, // 75
  0.92, // 90   crown
  0.90, // 105
  0.88, // 120
  0.86, // 135
  0.84, // 150
  0.82, // 165
  0.80, // 180  occipital pole
  0.76, // 195
  0.74, // 210
  0.78, // 225  cerebellum swells
  0.74, // 240
  0.60, // 255  notch beneath the cerebellum
  0.55, // 270  base, flat
  0.58, // 285
  0.68, // 300  temporal lobe begins
  0.80, // 315  temporal lobe, full
  0.86, // 330
  0.94  // 345
];

function radiusAt(phi) {
  const n = PROFILE.length, step = (Math.PI * 2) / n;
  let a = phi % (Math.PI * 2); if (a < 0) a += Math.PI * 2;
  const i = Math.floor(a / step), f = (a - i * step) / step;
  const r0 = PROFILE[i % n], r1 = PROFILE[(i + 1) % n];
  const t = (1 - Math.cos(f * Math.PI)) / 2;          // cosine interpolation
  return r0 * (1 - t) + r1 * t;
}

/* how far the shell reaches sideways. Widest through the temporal lobes and the
   mid-crown; narrow at the poles and narrower still under the base. */
function widthAt(phi, y, z) {
  let w = 0.72;
  w *= 1 - 0.26 * smooth(0.35, 1.0, z);          // frontal pole narrows
  w *= 1 - 0.30 * smooth(0.35, 1.0, -z);         // occipital narrows
  w *= 1 - 0.34 * smooth(0.30, 0.95, -y);        // the base is narrow
  w *= 1 + 0.22 * Math.exp(-Math.pow((y + 0.30) / 0.34, 2));  // temporal fullness
  return w;
}

function brainShell(x, y, z) {
  const phi = Math.atan2(y, z);
  const r = radiusAt(phi);
  /* the sagittal plane sets the outline; x is scaled by the width function */
  let py = y * r * 0.78, pz = z * r;
  let px = x * widthAt(phi, y, z);
  /* the hemispheres never meet at the midline */
  px += (x >= 0 ? 1 : -1) * 0.10;
  return [px, py, pz];
}

const VIEWS = {
  lateral:      [2.60, 0.26, 0.30],
  threequarter: [2.05, 0.52, 1.15],
  top:          [0.18, 2.40, 0.28]
};
const view = process.argv[2] || 'threequarter';
const eye = VIEWS[view] || VIEWS.threequarter;

const pts = [];
const N = 160;
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N * 2; j++) {
    const th = Math.acos(1 - 2 * (i + 0.5) / N);
    const ph = (j / (N * 2)) * Math.PI * 2;
    pts.push(brainShell(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)));
  }
}

const en = Math.hypot(...eye);
const w3 = eye.map(v => v / en);
let u = [-w3[2], 0, w3[0]];
const un = Math.hypot(...u); u = u.map(v => v / un);
const v2 = [w3[1] * u[2] - w3[2] * u[1], w3[2] * u[0] - w3[0] * u[2], w3[0] * u[1] - w3[1] * u[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const proj = pts.map(p => [dot(p, u), dot(p, v2)]);
const xs = proj.map(p => p[0]), ys = proj.map(p => p[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);

const W = 90, H = 34;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
proj.forEach(p => {
  const cx = Math.round((p[0] - x0) / (x1 - x0) * (W - 1));
  const cy = Math.round((1 - (p[1] - y0) / (y1 - y0)) * (H - 1));
  if (grid[cy]) grid[cy][cx] = '#';
});
console.log('view ' + view + '   silhouette ratio ' + ((y1 - y0) / (x1 - x0)).toFixed(2) + '\n');
grid.forEach(r => console.log('  ' + r.join('')));

const ex = k => { const a = pts.map(p => p[k]); return Math.max(...a) - Math.min(...a); };
console.log('\nextent  width ' + ex(0).toFixed(2) + '  height ' + ex(1).toFixed(2) +
            '  length ' + ex(2).toFixed(2));
console.log('h/w ' + (ex(1) / ex(0)).toFixed(2) + ' (brain 0.66)   d/w ' +
            (ex(2) / ex(0)).toFixed(2) + ' (brain 1.19)');
