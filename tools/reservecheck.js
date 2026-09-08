/* reservecheck.js — are there worlds left for regions that do not exist yet?
 *
 * Every one of the fourteen regions had a system and there were no spare ones.
 * That is not a cosmetic shortage: a template's planet count IS the number of
 * rings a region gets, so a region added from the editor had literally nowhere
 * to live, and "add a topic without a coding agent" was blocked on astronomy
 * rather than on code. Six more were retrieved from the same TAP service and
 * the same table as the other fourteen, and filed unassigned.
 *
 * A pool is only useful if it is real, unspent, and not six more of what the
 * set already has, so:
 *
 *   R1  the pool exists, and nothing has quietly spent it — no region in the
 *       BUILT ARTIFACT uses a system marked reserve
 *   R2  each reserve system is complete: as many axes, periods and letters as
 *       it declares planets, ascending, with nothing missing or invented
 *   R3  axes and periods are ONE physical solution, not two typed lists — a
 *       must go as P^(2/3) within each system — and any system whose figures
 *       are too coarse to hold that is recorded at lowered confidence, which
 *       is the honesty rule this file has kept since 55 Cnc
 *   R4  no reserve world repeats a shape already spoken for, measured against
 *       a floor the SET ITSELF sets: the two most alike worlds now in use
 *   R5  the pool offers more than one size, because a region with three notes
 *       and a region with nine cannot wear the same number of rings
 *   R6  the artifact carries the pool, so a build that needs a world has one
 *       without anyone fetching anything
 *
 * usage: node tools/reservecheck.js [v02.html]
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const DATA = 'data/astronomy-systems.json';
const tmp = (require('./scratch.js').root() + '/res-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const D = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const RESERVE = D.systems.filter(s => s.reserve);
const INUSE = D.systems.filter(s => !s.reserve);

/* Ask the ARTIFACT what is assigned rather than reading the source literal.
   The question is what shipped, not what a file says it intended. */
const PROBE = '(function(){' +
  'var M=window.__v02;' +
  "if(!M) return {ERROR:'__v02 missing'};" +
  'M.enter(); M.settle(60);' +
  'var A=M.astro(), used={};' +
  'Object.keys(A.assigned).forEach(function(mid){' +
  ' var a=A.assigned[mid]; if(a && a.system) used[a.system]=mid; });' +
  'return { used:used, inArtifact:A.dataset.systems, source:A.dataset.source };' +
  '})()';

const page = tmp + '/r.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') +
  "\n<script>window.addEventListener('load',function(){setTimeout(function(){\n" +
  '  var r; try{ r=' + PROBE + '; }catch(e){ r={ERROR:String((e&&e.message)||e)}; }\n' +
  '  document.title=JSON.stringify(r);\n},400);});</script>', 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/u" --no-first-run --no-default-browser-check' +
  ' --window-size=1440,900 --virtual-time-budget=14000 --dump-dom "' + page + '"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!mm) { console.error('the page never reported'); process.exit(1); }
const r = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
if (r.ERROR) { console.error(r.ERROR); process.exit(1); }

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

/* ---- R1 ---------------------------------------------------------------- */
const spent = RESERVE.filter(s => r.used[s.system]);
ck('R1', RESERVE.length >= 4 && spent.length === 0,
   RESERVE.length + ' worlds are held unassigned — ' +
   RESERVE.map(s => s.system + ' (' + s.planetCount + 'p)').join(', ') +
   (spent.length
     ? ' — BUT SPENT: ' + spent.map(s => s.system + ' by ' + r.used[s.system]).join(', ')
     : '. ' + Object.keys(r.used).length + ' regions are served by the other ' +
       INUSE.length + ', and not one reaches into the pool'));

/* ---- R2 ---------------------------------------------------------------- */
const incomplete = RESERVE.filter(s => {
  const a = s.semiMajorAxisAU || [], p = s.orbitalPeriodDays || [], L = s.letters || [];
  if (a.length !== s.planetCount || p.length !== s.planetCount || L.length !== s.planetCount)
    return true;
  if (!a.every(x => typeof x === 'number' && isFinite(x) && x > 0)) return true;
  if (!p.every(x => typeof x === 'number' && isFinite(x) && x > 0)) return true;
  for (let i = 1; i < a.length; i++) if (!(a[i] > a[i - 1])) return true;
  for (let i = 1; i < p.length; i++) if (!(p[i] > p[i - 1])) return true;
  return false;
});
ck('R2', incomplete.length === 0,
   'every reserve system is complete and ordered — ' +
   RESERVE.map(s => s.planetCount + 'p').join(', ') +
   ', each axis with its period and its letter, ascending, none null' +
   (incomplete.length ? ' — BROKEN: ' + incomplete.map(s => s.system).join(', ') : ''));

/* ---- R3 ---------------------------------------------------------------- */
/* a = k * P^(2/3) around one star. If axes and periods had been typed
   independently the constant would wander; if they are one solution it holds
   across the whole system. 3% is not a number chosen to pass: it is where
   55 Cnc already sat, the coarsest system in service before any of this. */
const COARSE = 3.0;
function scatter(s) {
  const a = s.semiMajorAxisAU || [], p = s.orbitalPeriodDays || [];
  if (a.length < 2 || p.length !== a.length) return null;
  const k = a.map((x, i) => x / Math.pow(p[i] / 365.25, 2 / 3));
  const m = k.reduce((x, y) => x + y, 0) / k.length;
  return Math.max.apply(null, k.map(x => Math.abs(x / m - 1))) * 100;
}
const scat = RESERVE.map(s => ({ s: s, v: scatter(s) }));
const wander = scat.filter(x => x.v === null || x.v > 8);
const undeclared = scat.filter(x => x.v !== null && x.v > COARSE && x.s.confidence === 'high');
ck('R3', wander.length === 0 && undeclared.length === 0,
   'axes and periods are one physical solution: ' +
   scat.map(x => x.s.system + ' ' + (x.v === null ? '?' : x.v.toFixed(2) + '%')).join(', ') +
   ' off Kepler\u2019s third law, and the one past ' + COARSE + '% is recorded at lowered ' +
   'confidence rather than passed off as exact' +
   (wander.length ? ' — WANDERS: ' + wander.map(x => x.s.system).join(', ') : '') +
   (undeclared.length ? ' — COARSE BUT CALLED HIGH: ' +
      undeclared.map(x => x.s.system).join(', ') : ''));

/* ---- R4 ---------------------------------------------------------------- */
/* Shape, as this project has always meant it: how large the gaps are, how
   even, whether they open or close, the widest single one, the total reach,
   and how many bodies share it. */
function feat(sy) {
  const a = (sy.semiMajorAxisAU || []).filter(x => typeof x === 'number');
  const g = []; for (let i = 1; i < a.length; i++) g.push(Math.log(a[i] / a[i - 1]));
  if (!g.length) return null;
  const m = g.reduce((x, y) => x + y, 0) / g.length;
  const sd = Math.sqrt(g.reduce((x, y) => x + (y - m) * (y - m), 0) / g.length);
  let slope = 0;
  if (g.length > 1) {
    const xm = (g.length - 1) / 2; let nu = 0, de = 0;
    g.forEach((y, i) => { nu += (i - xm) * (y - m); de += (i - xm) * (i - xm); });
    slope = nu / de;
  }
  return { mean: m, sd: sd, slope: slope, max: Math.max.apply(null, g),
           span: Math.log(a[a.length - 1] / a[0]), n: a.length };
}
function dist(p, q) {
  return Math.sqrt(2 * Math.pow(p.mean - q.mean, 2) + 3 * Math.pow(p.sd - q.sd, 2) +
    3 * Math.pow(p.slope - q.slope, 2) + Math.pow(p.max - q.max, 2) +
    0.6 * Math.pow(p.span - q.span, 2) + 0.25 * Math.pow(p.n - q.n, 2));
}
const used = INUSE.map(s => ({ n: s.system, f: feat(s) })).filter(x => x.f);
let floor = Infinity, fa = '', fb = '';
for (let i = 0; i < used.length; i++) for (let j = i + 1; j < used.length; j++) {
  const d = dist(used[i].f, used[j].f);
  if (d < floor) { floor = d; fa = used[i].n; fb = used[j].n; }
}
const near = RESERVE.map(s => {
  const f = feat(s); let d = Infinity, who = '';
  used.forEach(v => { const x = dist(f, v.f); if (x < d) { d = x; who = v.n; } });
  return { n: s.system, d: d, who: who };
});
const closest = near.reduce((a, b) => a.d < b.d ? a : b);
const tooLike = near.filter(x => x.d <= floor);
ck('R4', tooLike.length === 0,
   'no reserve world repeats a shape already in use. The two most alike worlds now in ' +
   'service are ' + fa + ' and ' + fb + ' at ' + floor.toFixed(2) + '; the closest reserve ' +
   'world is ' + closest.n + ' at ' + closest.d.toFixed(2) + ' from ' + closest.who +
   ' — every one further apart than a pair the set already tolerates' +
   (tooLike.length ? ' — TOO ALIKE: ' + tooLike.map(x => x.n + '/' + x.who).join(', ') : ''));

/* ---- R5 ---------------------------------------------------------------- */
/* Two things, because a pool can be varied and still be too small. It must
   offer several sizes, AND it must reach at least as high as the largest
   region already in service — otherwise every future region is capped below
   what this project has already found itself needing. */
const sizes = RESERVE.map(s => s.planetCount).sort((a, b) => a - b);
const biggestInUse = Math.max.apply(null, INUSE.map(s => s.planetCount));
const biggestSpare = Math.max.apply(null, sizes);
ck('R5', new Set(sizes).size >= 3 && biggestSpare >= biggestInUse,
   'the pool offers ' + new Set(sizes).size + ' different sizes — ' + sizes.join(', ') +
   ' rings — so a region with three notes and a region with nine need not wear the same ' +
   'world, and its largest (' + biggestSpare + ') is not smaller than the largest region ' +
   'already in service (' + biggestInUse + ')' +
   (biggestSpare < biggestInUse ? ' — CAPPED: every future region would be smaller than ' +
      'ones this project already has' : ''));

/* ---- R6 ---------------------------------------------------------------- */
const art = fs.readFileSync(FILE, 'utf8');
const missing = RESERVE.filter(s => art.indexOf('"' + s.system + '"') < 0);
ck('R6', r.inArtifact === D.systems.length && missing.length === 0,
   'the artifact carries all ' + r.inArtifact + ' systems, the pool among them, from ' +
   r.source + ' — a build that needs a world finds one inline and fetches nothing' +
   (missing.length ? ' — MISSING: ' + missing.map(s => s.system).join(', ') : ''));

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' reserve invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'there are worlds left, and they are not six more of what is already here');
process.exit(bad ? 1 : 0);
