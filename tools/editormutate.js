/* editormutate.js — mutation harness for tools/editorcheck.js
 *
 * Both defects editorcheck was written for were found by READING, which means
 * the check has never been shown to fail. Every mutation here restores one of
 * them exactly as it shipped.
 *
 * E4 and E5 are the two that were live on the site. E5 is the more instructive:
 * one shadowed parameter name, and Retire, correct-an-original and
 * edit-a-topic all threw on a real store while every harness in the project
 * passed — because every other harness writes the store to disk and never
 * comes through commitTo at all.
 *
 * usage: node tools/editormutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-editor.js';
const ORIG = {};
ORIG[APP] = fs.readFileSync(APP, 'utf8');

const MUTATIONS = [
  /* THE ONE THAT WAS LIVE. The edit path calls saveEdit with the fields and
     not the relationships, so anything typed into the relationship control
     while editing is dropped and the editor reports Saved regardless. */
  { n: 'E4', name: 'relationships typed while editing are committed',
    file: APP,
    find: "            crosses: note2.crosses, src: note2.src, sections: sections },\n        rels,\n        function(err, added){",
    repl: "            crosses: note2.crosses, src: note2.src, sections: sections },\n        [],   // mutation: the relationships are dropped on the floor again\n        function(err, added){",
    expect: 'FAIL  E4' },

  /* AND THE ONE THAT MADE THREE CONTROLS THROW. Naming the response `file`
     shadows the path, so `file === CFG.path` compares an object to a string,
     is false every time, and the store reaches change() without `edits` — at
     which point editing anything from the corpus throws. */
  { n: 'E5', name: 'a store without edits or retired survives the round trip',
    file: APP,
    find: "  return gh(path + \"?ref=\" + encodeURIComponent(CFG.branch)).then(function(res){\n    var store;\n    try { store = JSON.parse(unb64(res.content)); }",
    repl: "  return gh(path + \"?ref=\" + encodeURIComponent(CFG.branch)).then(function(file){\n    var store;\n    try { store = JSON.parse(unb64(file.content)); }",
    expect: 'FAIL  E5' },

  /* the path that always worked, so that it keeps working */
  { n: 'E2', name: 'a new writing commits its relationships',
    file: APP,
    find: "    rels.forEach(function(r){ store.edges.push([note.id, r.to, r.verb, r.gloss]); });",
    repl: "    [].forEach(function(r){ store.edges.push([note.id, r.to, r.verb, r.gloss]); });   // mutation",
    expect: 'FAIL  E2' },

  /* ADR-02's other half: the editor is the one thing here allowed to reach the
     network, and only to one host. */
  { n: 'E6', name: 'the editor talks to api.github.com and nowhere else',
    file: APP,
    find: "var API = 'https://api.github.com';",
    repl: "var API = 'https://api.github.example';   // mutation: somewhere else entirely",
    expect: 'FAIL  E6' }
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
  try { return { code: 0, out: execSync('node tools/editorcheck.js',
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
  fs.writeFileSync(m.file, orig.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== orig;
  build();
  const r = run();
  const failed = r.code !== 0;
  const right = failed && r.out.indexOf('FAIL  ' + m.n) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(4) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  const also = r.out.split('\n').filter(l => /FAIL /.test(l) && l.indexOf('FAIL  ' + m.n) < 0);
  if (ok && also.length) console.log('     also fell: ' +
    also.map(l => (l.match(/FAIL\s+(\S+)/) || [])[1]).join(', '));
  if (failed && !right) console.log(r.out.split('\n').filter(l => /FAIL/.test(l))
    .map(l => '       ' + l.trim()).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' editor assertions mutation-verified');
process.exit(bad ? 1 : 0);
