/* regionmutate.js — mutation harness for tools/regioncheck.js
 *
 * Mutations are applied to the source and v02.html is REBUILT, so what is
 * tested is the artifact a visitor would load.
 *
 * Protocol: mutate · prove it reached the file · require failure FOR THE
 * STATED REASON · restore byte-for-byte · require pass. A mutation that does
 * not apply is a hard stop, never a SKIP.
 *
 * SOME OF THESE TRIP MORE THAN THEIR OWN ASSERTION, and that is honest rather
 * than sloppy: taking a claimed region's system away removes its world, its
 * rings and the orbit its note was standing on, so G2 and G3 both fall. The
 * runner requires the NAMED assertion to be among the failures and reports the
 * rest, exactly as astromutate does when it removes a world outright.
 *
 * G7 has no mutation of its own and the note at the foot of the table says why
 * — the attempt to give it one measured something else, and is kept as the
 * evidence for leaving it uncovered here.
 *
 * G6 is the one worth reading. It restores the defect the design exists to
 * avoid — counting only the regions still standing — so that retiring one
 * topic silently moves the next one's star. Nothing else on the page notices:
 * the sky is still real astronomy, still correctly spaced, still readable. It
 * is just a different sky than it was yesterday, for a topic nobody touched.
 *
 * usage: node tools/regionmutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ORIG = {};
ORIG[APP] = fs.readFileSync(APP, 'utf8');

const MUTATIONS = [
  /* G1 — the store stops being able to declare a topic at all. This is the
     state the project was in before any of this: a topic could only be added
     by editing src/. */
  { n: 'G1', name: 'a topic declared in the store becomes a region',
    file: APP,
    find: "  (V02_NOTES.regions||[]).forEach(function(r){",
    repl: "  [].forEach(function(r){                        // mutation: the store declares nothing",
    expect: 'FAIL  G1' },

  /* G2 — the scale stops being derived and falls back to the default. The
     world is still real, still correctly spaced, still inside the range the
     other fourteen occupy — which is exactly why the assertion had to be
     about the geometric CENTRE and not about a band. */
  { n: 'G2', name: 'a claimed world is scaled off the worlds already in service',
    file: APP,
    find: "    WORLD_SCALE[id]=sp ? WORLD_CENTRE/Math.sqrt(sp) : ORBIT_R0;",
    repl: "    WORLD_SCALE[id]=ORBIT_R0;   // mutation: the default, as if span did not matter",
    expect: 'FAIL  G2' },

  /* G2b — it is claimed but not shown whole, so a brand-new empty topic is a
     single light with a name under it: the exact state MUSIC and BOOKS were
     in before FULL_SYSTEM existed. */
  { n: 'G2b', assertion: 'G2', name: 'a claimed world is shown whole',
    file: APP,
    find: "    FULL_SYSTEM[id]=1;",
    repl: "                                // mutation: claimed, but its empty orbits stay dark",
    expect: 'FAIL  G2' },

  /* G3 — no system is assigned, so the topic exists as a place with no sky
     and the note filed into it has no orbit to stand on. */
  { n: 'G3', name: 'a note filed into a new topic takes an orbit',
    file: APP,
    find: "    MIG_SYSTEM[id]=sy.system;",
    repl: "                                // mutation: the claim assigns no system",
    expect: 'FAIL  G3' },

  /* G4 — applyEdits refuses the name the way it refuses id, mig and t. The
     rename is accepted by the gate, committed, built, and then silently does
     nothing — which is the failure mode this whole file exists to catch. */
  { n: 'G4', name: 'renaming a topic changes the door',
    file: APP,
    find: '        if(k==="id"||k==="mig"||k==="t") return;',
    repl: '        if(k==="id"||k==="mig"||k==="t"||k==="label") return;   // mutation: the sign never changes',
    expect: 'FAIL  G4' },

  /* G5 — retiring stops closing the room. The editor reports success, the
     commit lands, and the topic is still standing on the page. */
  { n: 'G5', name: 'retiring a topic closes the room',
    file: APP,
    find: "  (V02_NOTES.retiredRegions||[]).forEach(function(r){",
    repl: "  [].forEach(function(r){                        // mutation: nothing is ever retired",
    expect: 'FAIL  G5' },

  /* G6 — THE ONE THE DESIGN IS FOR. Count only the regions still standing and
     the queue closes up behind a retirement, so the topic after it takes the
     world that used to belong to the one before. Every other assertion on this
     page still passes: the astronomy is real, the spacing is measured, the
     world is readable. It is simply somebody else's sky. */
  { n: 'G6', name: 'retiring one topic does not move another topic’s star',
    file: APP,
    find: "    var sy=pool[k++];\n    if(!sy) return;                              // the pool is dry; no world\n    if(!standing[id]) return;                    // retired, and holding its index",
    repl: "    if(!standing[id]) return;                    // mutation: the queue closes up behind it\n    var sy=pool[k++];\n    if(!sy) return;",
    expect: 'FAIL  G6' },

  /* G7 HAS NO MUTATION OF ITS OWN, and the attempt to give it one is worth
     recording rather than deleting.

     It was scaled x40 — a claimed world flung out to an outer orbit of 12,695
     scene units — expecting its labels to leave the frame. G2 fell. G7 did
     not: the world was still perfectly readable at forty times its size,
     because labelStyle is derived from each world's own ARRIVAL distance
     (`{minor: arrive*1.39, writing: arrive*0.70}`), so the camera, the naming
     range and the relationship range all scale together. The mutation proved
     the shared rule is genuinely parameterised, which is a real answer to a
     different question.

     There is no fourth knob to aim at. The claim sets exactly three things —
     the system, the scale and whether the whole system is shown — and G2, G2b
     and G3 mutate all three. A claimed world adds no rendering path of its own,
     which is the entire point of it: it is drawn by the same code as the other
     fourteen.

     So G7 is covered by consequence rather than by a mutation of its own, and
     the run above shows it: BOTH G2b and G3 fell G7 as well. A contrived
     mutation here would only be testing the renderer, which its own suites
     already do. Same reasoning astromutate records for A20, A23 and A26. */
];

const DRY = process.argv.indexOf('--dry') >= 0;
const ONLY = process.argv.slice(2).filter(x => x !== '--dry').join(',').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;
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
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.n + '  "' + m.find.slice(0, 60) + '"'); }
  });
  console.log(bad ? bad + ' BAD ANCHOR(S) of ' + MUTATIONS.length
                  : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run() {
  try { return { code: 0, out: execSync('node tools/regioncheck.js',
                                        { maxBuffer: 1 << 26, timeout: 1800000 }).toString() }; }
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
  /* A CRASH IS NOT A CATCH. The harness prints "FAIL  ---" when it throws
     rather than when an assertion fails, and a mutation that merely breaks the
     page proves nothing about the assertion it was aimed at. */
  const crashed = r.out.indexOf('FAIL  ---') >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && !crashed && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(5) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' harnessRanCleanly=' + !crashed + ' restored=' + restored + ' passesAfter=' + after);
  const also = r.out.split('\n').filter(l => /FAIL /.test(l) && l.indexOf('FAIL  ' + want) < 0);
  if (ok && also.length) console.log('     also fell: ' +
    also.map(l => (l.match(/FAIL\s+(\S+)/) || [])[1]).join(', '));
  if (failed && !right) console.log(r.out.split('\n').filter(l => /FAIL/.test(l))
    .map(l => '       ' + l.trim()).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' region assertions mutation-verified');
process.exit(bad ? 1 : 0);
