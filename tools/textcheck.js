/* textcheck.js — the site's own words, checked against the code that uses them.

   data/text.json exists so the furniture of this site can be changed by editing
   a value rather than editing a program. That only holds while the store and
   the code agree, and they drift in two directions, both quiet:

     A KEY USED AND MISSING renders as the key itself — "threshold.works.desc"
     printed on the page where a sentence should be. Better than a blank space,
     which is what an empty fallback would give, but still wrong in public.

     A KEY PRESENT AND UNUSED is worse, because it is invisible. It sits in the
     editor looking editable, someone changes it, publishes, and nothing
     happens anywhere. A value that cannot affect the page is a lie about what
     editing does.

   Both are refused here, before a build.

   The keys in use are found by READING THE SOURCE rather than by keeping a
   list: every T('...') call and every data-t attribute. A list would be a
   third place to keep in step with the other two.

   usage: node tools/textcheck.js [data/text.json]
*/
const fs = require('fs');

const FILE = process.argv[2] || 'data/text.json';
const SOURCES = ['src/v02-app.js', 'src/v02-shell.html', 'src/v02-works.js'];

let store;
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
catch (e) {
  console.error('textcheck: ' + FILE + ' is not valid JSON — ' + e.message);
  process.exit(1);
}

const fails = [];
const fail = m => fails.push(m);

if (store.version !== 1) fail('version must be 1, found ' + JSON.stringify(store.version));
if (!store.text || typeof store.text !== 'object') {
  console.error('textcheck: the store has no text object');
  process.exit(1);
}

/* every key the code actually asks for */
const used = new Set();
SOURCES.forEach(f => {
  const s = fs.readFileSync(f, 'utf8');
  (s.match(/\bT\((['"])([^'"]+)\1\)/g) || []).forEach(m => {
    used.add(m.replace(/^T\((['"])/, '').replace(/(['"])\)$/, ''));
  });
  (s.match(/data-t(?:-aria)?="([^"]+)"/g) || []).forEach(m => {
    used.add(m.replace(/^data-t(?:-aria)?="/, '').replace(/"$/, ''));
  });
});

const have = new Set(Object.keys(store.text));

used.forEach(k => {
  if (!have.has(k)) fail('the code asks for "' + k + '" and the store has no such key');
});
have.forEach(k => {
  if (!used.has(k)) fail('the store holds "' + k + '" and nothing on the site reads it');
});

/* and the values themselves have to be sayable */
Object.keys(store.text).forEach(k => {
  const v = store.text[k];
  if (typeof v !== 'string') return fail('"' + k + '" must be a string');
  if (!v.trim()) fail('"' + k + '" is empty — a blank heading is a rendering fault to a reader');
});

if (fails.length) {
  console.error('\ntextcheck: ' + fails.length + ' problem(s) in ' + FILE);
  fails.forEach(f => console.error('  ' + f));
  console.error('\nnothing was published.');
  process.exit(1);
}

console.log('textcheck clean — ' + have.size + ' string(s), every one of them read by the site ' +
            'and every string the site asks for present');
