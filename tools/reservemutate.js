/* reservemutate.js — mutation harness for tools/reservecheck.js
 *
 * Mutations are applied to the source and v02.html is REBUILT, so what is
 * tested is the artifact a visitor would load.
 *
 * Protocol: mutate · prove it reached the file · require failure FOR THE
 * STATED REASON · restore byte-for-byte · require pass. A mutation that does
 * not apply is a hard stop, never a SKIP.
 *
 * Two of these mutations are surgical on purpose. R4's rewrites Kepler-444's
 * axes AND its periods together, to Kepler-33's own figures — so the record
 * stays complete, stays ordered, and stays a valid physical solution, and the
 * ONLY thing wrong with it is that the pool now holds a copy of a world
 * already in service. That is precisely the failure R4 exists for, and a
 * clumsier mutation would have been caught by R2 or R3 first and proved
 * nothing about R4 at all.
 *
 * usage: node tools/reservemutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', DATA = 'data/astronomy-systems.json',
      BUILD = 'tools/build-v02.js';
const ORIG = {};
ORIG[APP] = fs.readFileSync(APP, 'utf8');
ORIG[DATA] = fs.readFileSync(DATA, 'utf8');
ORIG[BUILD] = fs.readFileSync(BUILD, 'utf8');

const L = a => a.join('\n');

const MUTATIONS = [
  /* R1 — spend one. ART takes Kepler-444 and the pool is a world short
     without anyone editing the pool. */
  { n: 'R1', name: 'nothing has quietly spent the pool',
    file: APP, find: "'art':'HD 40307',", repl: "'art':'Kepler-444',",
    expect: 'BUT SPENT' },

  /* R2 — take an axis away from Kepler-444 and leave the count claiming five.
     This is the shape of every real gap in this dataset: the archive declares
     a planet and returns no geometry for it, which is why 55 Cnc and Kepler-80
     carry illustrative orbits. A reserve world must not have that problem
     silently. */
  { n: 'R2', name: 'each reserve system is complete',
    file: DATA,
    find: L(['   "semiMajorAxisAU": [', '    0.04178,', '    0.04881,', '    0.06,',
             '    0.0696,', '    0.0811', '   ],']),
    repl: L(['   "semiMajorAxisAU": [', '    0.04178,', '    0.04881,', '    0.06,',
             '    0.0696', '   ],']),
    expect: 'BROKEN' },

  /* R3 — pull one of Kepler-167's periods off its axis. Nothing else in the
     file notices: the axes still ascend, the count is still right, and the
     rendered ratios still match the axes they were given. Only the physics
     disagrees, which is the whole point of asking it. */
  { n: 'R3', name: 'axes and periods are one physical solution',
    file: DATA,
    find: L(['   "orbitalPeriodDays": [', '    4.3931539,', '    7.406106,',
             '    21.80379,', '    1071.23205', '   ],']),
    repl: L(['   "orbitalPeriodDays": [', '    4.3931539,', '    7.406106,',
             '    21.80379,', '    300.0', '   ],']),
    expect: 'WANDERS' },

  /* R3b — the other half, and the one that matters more. Kepler-90's axes are
     quoted to two significant figures and sit 5.6% off the law. That is
     allowed; calling it "high" is not. */
  { n: 'R3b', assertion: 'R3', name: 'coarse figures are declared coarse',
    file: DATA,
    find: L(['   "visualCharacter": "the fullest system there is: a crowded core, one clear break, and a long ordered outer run",',
             '   "confidence": "medium",']),
    repl: L(['   "visualCharacter": "the fullest system there is: a crowded core, one clear break, and a long ordered outer run",',
             '   "confidence": "high",']),
    expect: 'COARSE BUT CALLED HIGH' },

  /* R4 — the pool holds a second Kepler-33. Axes and periods are swapped
     together so the record remains complete (R2), remains a single physical
     solution (R3), and fails only for being a shape the set already has. */
  { n: 'R4', name: 'no reserve world repeats a shape already in use',
    file: DATA,
    find: L(['   "semiMajorAxisAU": [', '    0.04178,', '    0.04881,', '    0.06,',
             '    0.0696,', '    0.0811', '   ],',
             '   "orbitalPeriodDays": [', '    3.6001053,', '    4.5458841,',
             '    6.189392,', '    7.743493,', '    9.740486', '   ],']),
    repl: L(['   "semiMajorAxisAU": [', '    0.0677,', '    0.1189,', '    0.1662,',
             '    0.2138,', '    0.2535', '   ],',
             '   "orbitalPeriodDays": [', '    5.66793,', '    13.17562,',
             '    21.77596,', '    31.7844,', '    41.02902', '   ],']),
    expect: 'TOO ALIKE' },

  /* R5 — take the eight-planet world out of the pool. Three sizes remain, so
     a check that only counted sizes would still pass; what is gone is the
     ceiling, and every region added afterwards would be smaller than ones
     this project already has. */
  { n: 'R5', name: 'the pool reaches as high as the regions already in service',
    file: DATA,
    find: L(['   "confidence": "medium",', '   "reserve": true,']),
    repl: '   "confidence": "medium",',
    expect: 'CAPPED' },

  /* R6 — strip the pool at the moment it is inlined. The data file still holds
     six worlds, every other assertion still reads them from disk and passes,
     and the artifact a visitor loads has none of them. This is the failure
     that would be invisible everywhere except in the built page. */
  { n: 'R6', name: 'the artifact carries the pool',
    file: BUILD,
    find: "const astro = fs.readFileSync('data/astronomy-systems.json', 'utf8');",
    repl: "const astro = (function(){ var d=JSON.parse(fs.readFileSync('data/astronomy-systems.json','utf8'));" +
          " d.systems=d.systems.filter(function(s){return !s.reserve;}); return JSON.stringify(d); })();",
    expect: 'MISSING' }
];

const DRY = process.argv.indexOf('--dry') >= 0;
const ONLY = process.argv.slice(2).filter(x => x !== '--dry')
  .join(',').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;
/* A NAME THAT MATCHES NOTHING IS A TYPO, NOT AN EMPTY TEST RUN. */
if (ONLY.length && SEL.length !== ONLY.length) {
  const missing = ONLY.filter(x => !MUTATIONS.some(m => String(m.n) === String(x)));
  console.error('no mutation named ' + missing.join(', ') +
                ' — refusing to report a result for a set that was never tested');
  process.exit(1);
}

if (DRY) {
  let bad = 0;
  MUTATIONS.forEach(m => {
    const hits = ORIG[m.file].split(m.find).length - 1;
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.n + '  "' + m.find.slice(0, 58) + '"'); }
  });
  console.log(bad ? bad + ' BAD ANCHOR(S) of ' + MUTATIONS.length
                  : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run() {
  try { return { code: 0, out: execSync('node tools/reservecheck.js v02.html',
                                        { maxBuffer: 1 << 26, timeout: 600000 }).toString() }; }
  catch (e) { return { code: e.status || 1, out: (e.stdout || '').toString() + (e.stderr || '').toString() }; }
}
function restoreAll() {
  Object.keys(ORIG).forEach(f => fs.writeFileSync(f, ORIG[f], 'utf8'));
  build();
}

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0) { console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL) {
  const orig = ORIG[m.file];
  const hits = orig.split(m.find).length - 1;
  if (hits !== 1) {
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times: ' + m.find.slice(0, 56));
    restoreAll(); process.exit(3);
  }
  const mutated = orig.replace(m.find, m.repl);
  if (mutated === orig) { console.error('STOP: mutation ' + m.n + ' changed nothing'); restoreAll(); process.exit(3); }
  fs.writeFileSync(m.file, mutated, 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== orig;
  build();
  const r = run();
  const failed = r.code !== 0;
  const want = m.assertion || m.n;
  const right = failed && r.out.indexOf('FAIL  ' + want) >= 0;
  /* and it must fail for the STATED REASON, not merely under the right id */
  const reason = right && r.out.indexOf(m.expect) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && reason && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(5) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' forTheStatedReason=' + reason + ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right) console.log(r.out.split('\n').filter(l => /FAIL/.test(l)).map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' reserve assertions mutation-verified');
process.exit(bad ? 1 : 0);
