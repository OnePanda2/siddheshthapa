/* acceptmutate.js — mutation harness for the P4.6 checks in tools/accept.js.

   accept.js is STATIC, and static checks are exactly the class that has
   passed while the behaviour was broken in this project. Nine new checks that
   nobody has deliberately broken are nine unverified claims.

   usage: node tools/acceptmutate.js [preview.html]
*/
const fs = require('fs'), { execSync } = require('child_process');
const FILE = process.argv[2] || 'preview.html';
const ORIGINAL = fs.readFileSync(FILE, 'utf8');

const MUTATIONS = [
  { name: 'the marginalia layer is present and locatable',
    find: 'var margFits=function(', repl: 'var margFitsRenamed=function(' },
  { name: 'every mark records the writing it belongs to, by id',
    find: "marginalia.push({id:h.id,kind:'source'", repl: "marginalia.push({kind:'source'" },
  { name: "a source mark is the record's own src, never a written-out label",
    find: "st=n.src?String(n.src):''", repl: "st='Master Context §18'+''" },
  { name: "a destination is judged against the node's own region, not a hard-coded one",
    find: 'o.mig!==n.mig', repl: "o.mig!=='philosophy'" },
  { name: 'a destination names the region the graph actually reaches',
    find: "byId[dests[0]].label.toLowerCase()", repl: "'elsewhere'" },
  { name: 'the invented footnote and "cf. N" apparatus is gone from the margins',
    find: "dw=g.measureText(dt).width;", repl: "dt='cf. 4'; dw=g.measureText(dt).width;" },
  { name: 'marginalia opacity is a named constant the acceptance suite can read',
    find: '(strong?MARG_ALPHA.src.strong:MARG_ALPHA.src.quiet)', repl: '(strong?.30:.14)' },
  { name: 'marginalia is not in the hit-test chain — fragments stay the doorways',
    find: '  function fragmentAt(mx,my){\n', repl: '  function fragmentAt(mx,my){\n    if(marginalia.length){}\n' },
  { name: 'marginalia never resolves as a node',
    find: '  function nodeAt(mx,my,touch){\n', repl: '  function nodeAt(mx,my,touch){\n    if(marginalia.length){}\n' }
];

function run(){
  try { return { code: 0, out: execSync('node tools/accept.js "' + FILE + '"', { maxBuffer: 1 << 26 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}

const base = run();
if (base.code !== 0){ console.error('baseline not green'); console.log(base.out.slice(-2000)); process.exit(2); }
const baseCount = (base.out.match(/  PASS  /g) || []).length;
console.log('BASELINE  green, ' + baseCount + ' checks\n');

let bad = 0;
for (const m of MUTATIONS){
  const hits = ORIGINAL.split(m.find).length - 1;
  if (hits !== 1){
    console.error('STOP: anchor matched ' + hits + ' times for "' + m.name + '"');
    fs.writeFileSync(FILE, ORIGINAL, 'utf8'); process.exit(3);
  }
  fs.writeFileSync(FILE, ORIGINAL.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(FILE, 'utf8').indexOf(m.repl) >= 0;
  const r = run();
  // it must fail, and the NAMED check must be the one that failed
  const named = r.out.indexOf('- ' + m.name) >= 0 || r.out.indexOf('FAIL  ' + m.name) >= 0;
  fs.writeFileSync(FILE, ORIGINAL, 'utf8');
  const restored = fs.readFileSync(FILE, 'utf8') === ORIGINAL;
  const after = run().code === 0;
  const ok = applied && r.code !== 0 && named && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.name);
  console.log('     applied=' + applied + ' failed=' + (r.code !== 0) + ' namedCheckFailed=' + named +
              ' restored=' + restored + ' passesAfter=' + after);
  if (!named && r.code !== 0)
    console.log('     failures were: ' + (r.out.match(/- .*/g) || []).slice(0,4).join(' | '));
}
fs.writeFileSync(FILE, ORIGINAL, 'utf8');
console.log('\n' + (MUTATIONS.length - bad) + '/' + MUTATIONS.length + ' accept.js marginalia checks mutation-verified');
process.exit(bad ? 1 : 0);
