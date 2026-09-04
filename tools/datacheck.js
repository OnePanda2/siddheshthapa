/* datacheck.js — has a data file been reformatted underneath the anchors?

   THIS EXISTS BECAUSE OF A REAL FAILURE, not a style preference. Adding three
   systems to data/astronomy-systems.json was done by parsing the file, pushing
   three objects, and writing it back with JSON.stringify(D, null, 2). The file
   had always been written at an indent of 1. Nothing about the data changed
   except the three additions, and yet every line moved: a commit that should
   have been sixty lines was 559 insertions and 457 deletions.

   That is not merely ugly. Mutation harnesses anchor on exact text, and four
   data files are anchored into. Re-indenting one silently invalidates every
   anchor in it, so those mutations stop being applied — and a mutation that no
   longer runs does not announce itself. The suite goes on printing a number,
   and the number is now wrong. It took a full regression to notice, and only
   because the runners audit their anchors.

   So the shape each file is kept in is stated and enforced:

     a serialized file  is exactly JSON.stringify(value, null, indent) + '\n',
                        and must stay at that indent
     a hand-kept file   is grouped and spaced by a person for reading, and must
                        NOT become machine-serialized — if it ever matches a
                        plain stringify, something rewrote it wholesale and
                        every anchor in it moved

   Both directions matter. The first catches a file being re-indented; the
   second catches a hand-grouped file being flattened, which is the same
   accident wearing the opposite mask.

   Only files that something anchors into are listed. This is not a formatter,
   and files nobody anchors on are none of its business.

   It is pure Node and takes milliseconds — it belongs at the top of a run,
   beside the build, not among the browser suites.

   usage: node tools/datacheck.js          report
          node tools/datacheck.js --fix    re-indent drifted SERIALIZED files
*/
const fs = require('fs');

const FILES = [
  { path: 'data/astronomy-systems.json', form: 1,
    why: 'lovemutate L10 and astromutate A21/A24 anchor on exact lines inside it' },
  { path: 'data/notes.json', form: 2,
    why: 'notesmutate anchors on it, and the editor rewrites it on every publish' },
  { path: 'data/works.json', form: 2,
    why: 'worksmutate anchors on exact lines inside it' },
  { path: 'data/constellation-ursa-major.json', form: 'hand',
    why: 'constellationmutate anchors on it, and it is grouped by hand for reading' }
];

const FIX = process.argv.indexOf('--fix') >= 0;
let bad = 0, checked = 0, fixed = 0, missing = 0;

for (const f of FILES) {
  if (!fs.existsSync(f.path)) { missing++; console.log('  --    ' + f.path + ' — not present, skipped'); continue; }
  const raw = fs.readFileSync(f.path, 'utf8');
  let value;
  try { value = JSON.parse(raw); }
  catch (e) { bad++; console.log('  FAIL  ' + f.path + ' — is not valid JSON: ' + e.message); continue; }
  checked++;

  if (f.form === 'hand') {
    /* the failure to catch here is the opposite one: a hand-kept file that has
       been run through a serializer, which moves every line at once */
    let asMachine = null;
    for (const i of [0, 1, 2, 3, 4]) if (raw === JSON.stringify(value, null, i) + '\n') asMachine = i;
    if (asMachine === null) { console.log('  ok    ' + f.path + ' (hand-kept, still hand-kept)'); continue; }
    bad++;
    console.log('  FAIL  ' + f.path + ' — has been machine-serialized at indent ' + asMachine + '.');
    console.log('        It is kept by hand because ' + f.why + '.');
    console.log('        Every line in it moved, so every anchor into it is now suspect.');
    console.log('        Restore it from git rather than re-fixing it here: git checkout -- ' + f.path);
    continue;
  }

  const canon = JSON.stringify(value, null, f.form) + '\n';
  if (raw === canon) { console.log('  ok    ' + f.path + ' (serialized, indent ' + f.form + ')'); continue; }

  /* say WHAT drifted — "not canonical" is not actionable */
  const a = raw.split('\n'), b = canon.split('\n');
  let firstDiff = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  const moved = a.filter((l, i) => l !== b[i]).length;

  if (FIX) {
    fs.writeFileSync(f.path, canon, 'utf8');
    fixed++;
    console.log('  FIXED ' + f.path + ' — rewritten at indent ' + f.form +
                ' (' + moved + ' line(s) differed; the DATA is untouched)');
  } else {
    bad++;
    console.log('  FAIL  ' + f.path + ' — not at its indent of ' + f.form + '; ' +
                moved + ' line(s) differ, first at line ' + (firstDiff + 1));
    console.log('        kept this way because ' + f.why);
    if (firstDiff >= 0) {
      console.log('          on disk   ' + JSON.stringify(a[firstDiff]));
      console.log('          should be ' + JSON.stringify(b[firstDiff]));
    }
    console.log('        the DATA is not in question — run: node tools/datacheck.js --fix');
  }
}

console.log('');
if (bad) {
  console.log(bad + ' data file(s) have been reformatted underneath their anchors.');
  console.log('A mutation whose anchor no longer matches is not applied, and a harness cannot');
  console.log('tell you the difference between an assertion that held and one never tested.');
  process.exit(1);
}
console.log('datacheck clean — ' + checked + ' anchored data file(s) still in the shape their ' +
            'anchors were written against' + (fixed ? ', ' + fixed + ' rewritten' : '') +
            (missing ? ', ' + missing + ' absent' : ''));
