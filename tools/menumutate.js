/* menumutate.js — mutation harness for tools/menucheck.js
 *
 * Mutations are applied to the source and v02.html is REBUILT, so what is
 * tested is the artifact a visitor would load.
 *
 * Protocol: mutate · prove it reached the file · require failure FOR THE
 * STATED REASON · restore byte-for-byte · require pass. A mutation that does
 * not apply is a hard stop, never a SKIP.
 *
 * M4 IS THE ONE THAT MATTERS. It does the obvious thing — sorts MIGS itself
 * so the array is already in menu order — and that is precisely the move the
 * whole design exists to refuse. It produces a correct-looking menu and
 * quietly relocates every star in the mind, because a region's index in MIGS
 * is where its world stands in space. Nothing else on the page complains: the
 * astronomy is still real, the spacing is still measured, every world still
 * opens. It is simply a different mind.
 *
 * usage: node tools/menumutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', GATE = 'tools/notescheck.js';
const ORIG = {};
ORIG[APP] = fs.readFileSync(APP, 'utf8');
ORIG[GATE] = fs.readFileSync(GATE, 'utf8');

const MUTATIONS = [
  /* M1 — the menu stops being the mind's own order when nothing is declared.
     Alphabetical is the tidiest possible wrong answer: it looks deliberate. */
  { n: 'M1', name: 'with nothing declared the menu is the mind’s own order',
    file: APP,
    find: "  var ordered=head.concat(rest);",
    repl: "  var ordered=head.concat(rest.slice().sort(function(a,b){\n" +
          "    return a.label<b.label?-1:1; }));   // mutation: tidy, and not his order",
    expect: 'FAIL  M1' },

  /* M2 — the declared topics are lifted, but not in the order given. An
     ordering that ignores the order is the failure nobody would notice from
     a screenshot. */
  { n: 'M2', name: 'a declared order lifts topics in that order',
    file: APP,
    find: "  var head=want.map(function(id){",
    repl: "  var head=want.slice().reverse().map(function(id){   // mutation: backwards",
    expect: 'FAIL  M2' },

  /* M3 — only the named topics survive. Saving an ordering of three would
     delete twelve doors, and the editor would report a success. */
  { n: 'M3', name: 'topics nobody ordered keep their place behind them',
    file: APP,
    find: "  var rest=MIGS.filter(function(m){ return want.indexOf(m.id)<0; });",
    repl: "  var rest=[];   // mutation: anything unnamed falls off the list",
    expect: 'FAIL  M3' },

  /* M4 — THE HAZARD. Sort MIGS itself and the menu comes out right while
     every star moves, because owned[] is filled in NODES order and the brain
     layout walks the same array. This is the reason the order of the doors is
     a second list rather than a rearrangement of the first. */
  { n: 'M4', name: 'reordering the menu does not move the mind',
    file: APP,
    find: "  V02_OVERLAY.addMIGs.forEach(function(a){\n    if(DECLARED_REGIONS.indexOf(a.id)<0) DECLARED_REGIONS.push(a.id); });",
    repl: "  V02_OVERLAY.addMIGs.forEach(function(a){\n" +
          "    if(DECLARED_REGIONS.indexOf(a.id)<0) DECLARED_REGIONS.push(a.id); });\n" +
          "  /* mutation: put MIGS itself in menu order, which also moves every star */\n" +
          "  var mo=(V02_NOTES.menuOrder||[]);\n" +
          "  if(mo.length) MIGS.sort(function(a,b){\n" +
          "    var x=mo.indexOf(a.id), y=mo.indexOf(b.id);\n" +
          "    return (x<0?99:x)-(y<0?99:y); });",
    expect: 'FAIL  M4' },

  /* M5 — the gate stops looking, so an id that names nothing becomes a line
     in the store that the page silently ignores. */
  { n: 'M5', name: 'an unorderable id is refused at the commit',
    file: GATE,
    find: "const menuOrder = store.menuOrder;\nif (menuOrder !== undefined) {",
    repl: "const menuOrder = store.menuOrder;\nif (false) {   // mutation: the gate stops looking",
    expect: 'FAIL  M5' },

  /* M6 — an empty ordering is read as "show nothing" rather than "no opinion
     about the order", so clearing it empties the mind's front door. */
  { n: 'M6', name: 'clearing the ordering restores the mind’s own order',
    file: APP,
    find: "  var rest=MIGS.filter(function(m){ return want.indexOf(m.id)<0; });\n  var ordered=head.concat(rest);",
    repl: "  var rest=MIGS.filter(function(m){ return want.indexOf(m.id)<0; });\n" +
          "  if(!want.length) return head;   // mutation: no opinion read as 'nothing'\n" +
          "  var ordered=head.concat(rest);",
    expect: 'FAIL  M6' }
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
  try { return { code: 0, out: execSync('node tools/menucheck.js',
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
  /* A CRASH IS NOT A CATCH. */
  const crashed = r.out.indexOf('FAIL  ---') >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && !crashed && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(4) + m.name);
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
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' menu assertions mutation-verified');
process.exit(bad ? 1 : 0);
