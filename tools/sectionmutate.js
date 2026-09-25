/* sectionmutate.js — mutation harness for tools/sectioncheck.js
 *
 * sectioncheck X6–X9 were written after a poem folded into one paragraph on
 * the page while every check in the project read it back intact. They read
 * textContent, which is the characters that were stored and keeps every
 * newline whatever the stylesheet does with them; the page drew one paragraph
 * and the checks saw thirteen lines. A check that has never failed is an
 * unverified assumption, so each mutation here puts one thing back the way it
 * shipped, or the way it is tempting to write it, and requires the named
 * assertion to fail for it.
 *
 *   X6   the statement's white-space rule removed — the defect as it shipped
 *   X7   the section body's white-space rule removed. It had been there since
 *        sections were added, and nothing had ever shown it doing anything
 *   X7t  the section body trim()med again — the indent on its first line goes
 *        while every other line keeps its own
 *   X8   the panel's white-space rule removed
 *   X9   focus scrolls a tall reading to its end again
 *
 * usage: node tools/sectionmutate.js [ids] [--dry]
 */
const fs = require('fs'), { execSync } = require('child_process');
const SHELL = 'src/v02-shell.html', APP = 'src/v02-app.js';
const ORIG = {};
[SHELL, APP].forEach(f => { ORIG[f] = fs.readFileSync(f, 'utf8'); });

const MUTATIONS = [
  /* THE ONE THAT WAS LIVE. The browser's default white-space folds every line
     break and run of spaces into one space: HAPPINESS and STAGE OF GRIEF were
     committed with their newlines and drawn as single paragraphs. */
  { n: 'X6', expect: 'X6', name: 'the statement is drawn in the shape it was typed',
    file: SHELL,
    find: "  letter-spacing:-.02em;margin:0 0 30px;white-space:pre-wrap}",
    repl: "  letter-spacing:-.02em;margin:0 0 30px}   /* mutation: folded into one paragraph again */" },

  { n: 'X7', expect: 'X7', name: "a section's body is drawn in the shape it was typed",
    file: SHELL,
    find: "  color:var(--ink-muted);margin:0;white-space:pre-wrap}",
    repl: "  color:var(--ink-muted);margin:0}   /* mutation */" },

  /* trim() is the tempting way to tidy a body, and it takes the indent off the
     first line only — the one place the stylesheet cannot put it back */
  { n: 'X7t', expect: 'X7', name: "a section's first line keeps its indent",
    file: APP,
    find: "    b2.textContent=asTyped(sec.body);",
    repl: "    b2.textContent=String(sec.body).trim();   // mutation: the first line's indent is trimmed away" },

  { n: 'X8', expect: 'X8', name: 'the panel shows a focused writing in its shape',
    file: SHELL,
    find: "  margin:0 0 18px;max-width:34ch;white-space:pre-wrap}",
    repl: "  margin:0 0 18px;max-width:34ch}   /* mutation */" },

  /* focus() scrolls what it lands on into view, and the close button sits
     under the writing */
  { n: 'X9', expect: 'X9', name: 'a tall reading opens at its first line',
    file: APP,
    find: "  readClose.focus({preventScroll:true});\n  reader.scrollTop=0;",
    repl: "  readClose.focus();   // mutation: the reading opens scrolled to its end again" }
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
  try { return { code: 0, out: execSync('node tools/sectioncheck.js',
                                        { maxBuffer: 1 << 26, timeout: 900000 }).toString() }; }
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
  const right = failed && r.out.indexOf('FAIL  ' + m.expect) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(4) + ' ' + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  const also = r.out.split('\n').filter(l => /FAIL /.test(l) && l.indexOf('FAIL  ' + m.expect) < 0);
  if (ok && also.length) console.log('     also fell: ' +
    also.map(l => (l.match(/FAIL\s+(\S+)/) || [])[1]).join(', '));
  if (failed && !right) console.log(r.out.split('\n').filter(l => /FAIL/.test(l))
    .map(l => '       ' + l.trim()).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' section assertions mutation-verified');
process.exit(bad ? 1 : 0);
