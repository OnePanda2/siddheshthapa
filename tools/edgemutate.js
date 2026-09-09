/* edgemutate.js — mutation harness for tools/edgecheck.js
 *
 * D1b is the one worth reading. It matches the retirement in one direction
 * only, which looks entirely reasonable — edges ARE directed, and the store
 * writes {a, b} in the order you clicked. But the corpus declares this
 * particular claim as ['meaning','e-every-day'] and you unlink it while
 * standing on the writing, so the pair arrives the other way round and the
 * withdrawal quietly does nothing. The editor would say Unlinked and the
 * relationship would still be there after the build.
 *
 * usage: node tools/edgemutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', GATE = 'tools/notescheck.js';
const ORIG = {};
ORIG[APP] = fs.readFileSync(APP, 'utf8');
ORIG[GATE] = fs.readFileSync(GATE, 'utf8');

const MUTATIONS = [
  { n: 'D1', name: 'a retired relationship actually goes',
    file: APP,
    find: "    (V02_NOTES.retiredEdges||[]).forEach(function(r){\n      if(!r || !r.a || !r.b) return;",
    repl: "    [].forEach(function(r){                      // mutation: nothing is ever retired\n      if(!r || !r.a || !r.b) return;",
    expect: 'FAIL  D1' },

  { n: 'D1b', assertion: 'D1', name: 'the pair is matched however it was written down',
    file: APP,
    find: "      gone[r.a+' '+r.b]=1; gone[r.b+' '+r.a]=1;",
    repl: "      gone[r.a+' '+r.b]=1;   // mutation: one direction only",
    expect: 'FAIL  D1' },

  { n: 'D2', name: 'only the one relationship goes',
    file: APP,
    find: "      if(gone[EDGES[ri][0]+' '+EDGES[ri][1]]){ EDGES.splice(ri,1); cut++; }",
    repl: "      if(gone[EDGES[ri][0]+' '+EDGES[ri][1]] ||\n" +
          "         (V02_NOTES.retiredEdges||[]).some(function(r){\n" +
          "           return r.a===EDGES[ri][0]||r.a===EDGES[ri][1]; })){   // mutation: take the lot\n" +
          "        EDGES.splice(ri,1); cut++; }",
    expect: 'FAIL  D2' },

  { n: 'D5', name: 'retiring nothing is refused at the commit',
    file: GATE,
    find: "  if (!pairsThatExist.has(r.a + ' ' + r.b))",
    repl: "  if (false)   // mutation: the gate stops asking whether it exists",
    expect: 'FAIL  D5' }
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
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.n + '  "' + m.find.slice(0, 58) + '"'); }
  });
  console.log(bad ? bad + ' BAD ANCHOR(S) of ' + MUTATIONS.length
                  : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run() {
  try { return { code: 0, out: execSync('node tools/edgecheck.js',
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
  fs.writeFileSync(m.file, orig.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== orig;
  build();
  const r = run();
  const failed = r.code !== 0;
  const want = m.assertion || m.n;
  const right = failed && r.out.indexOf('FAIL  ' + want) >= 0;
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
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' relationship assertions mutation-verified');
process.exit(bad ? 1 : 0);
