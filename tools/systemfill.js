/* systemfill.js — does a declared world actually FILL, QUEUE and REASSIGN?
 *
 * systemcheck can only describe the mind as it stands, and as it stands nothing
 * is waiting: MUSIC has five empty planets and no notes at all. Its S6 says so
 * rather than claiming a pass, which is honest and is not the same as proof.
 *
 * The behaviour that was asked for is about what happens NEXT — write a note
 * and it takes a free planet; write more notes than there are planets and the
 * extra ones wait out of sight; delete one and the waiting note takes the place
 * that was given up. None of that can be observed without writing notes, so
 * this writes them: synthetic notes go into data/notes.json, the artifact is
 * rebuilt, the world is measured, and the file is put back exactly as it was.
 *
 * That is the same shape as the mutation harnesses in this project and it is
 * held to the same rule: the tree is restored and the restoration is VERIFIED
 * byte for byte, because a harness that dies partway and leaves its notes in
 * the store would publish them.
 *
 * usage: node tools/systemfill.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const WORLD = 'music';                 // declared, and empty, so the arithmetic is clean
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/fill-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

/* a note in the store's own schema — notescheck refuses the build otherwise */
function note(i) {
  return {
    id: 'zz-fill-' + i, t: 'thought', label: 'FILL TEST ' + i, mig: WORLD,
    crosses: [], state: 'seed', register: 'harness fixture',
    src: 'tools/systemfill.js — synthetic, never committed',
    line: 'A synthetic note written by the fill harness to occupy a planet, and ' +
          'removed again before this tool exits. It is not anybody\u2019s writing.',
    added: '2026-09-05'
  };
}

function write(notes, retired) {
  const D = JSON.parse(ORIGINAL);
  D.notes = D.notes.concat(notes);
  if (retired && retired.length) D.retired = retired;
  fs.writeFileSync(STORE, JSON.stringify(D, null, 2) + '\n', 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}

function measure(tag) {
  const page = tmp + '/' + tag + '.html';
  fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>window.addEventListener('load',function(){setTimeout(function(){
  var r;
  try{
    var M=window.__v02;
    M.enter(); M.settle(60); M.setOpen(1); M.settle(40);
    var sys=M.systems()['${WORLD}'];
    M.go('region','${WORLD}'); M.settle(60);
    r={ sys:sys, sheet:[].slice.call(document.querySelectorAll('#semantic [data-nav]'))
          .map(function(b){ return b.getAttribute('data-nav'); }) };
  }catch(e){ r={ERROR:String((e&&e.message)||e)}; }
  document.title=JSON.stringify(r);
},400);});</script>`, 'utf8');
  const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/u-' + tag + '" --no-first-run --no-default-browser-check' +
    ' --window-size=1440,900 --virtual-time-budget=14000 --dump-dom "' + page + '"',
    { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
  const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
  if (!mm) throw new Error('the page never reported at ' + tag);
  const r = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
  if (r.ERROR) throw new Error(r.ERROR + ' at ' + tag);
  return r;
}

let capacity = 0;
try {
  /* ── how many places does this world have ─────────────────────────────── */
  const base = measure('base');
  capacity = base.sys.slots;
  ck('F1', base.sys.fullSystem && capacity > 0 && base.sys.vacant.length === capacity,
     WORLD.toUpperCase() + ' starts as ' + capacity + ' empty planets on ' +
     capacity + ' orbits, with nothing standing on any of them');

  /* ── fill it exactly ──────────────────────────────────────────────────── */
  const exact = [];
  for (let i = 1; i <= capacity; i++) exact.push(note(i));
  write(exact, null);
  const full = measure('full');
  ck('F2', full.sys.occupied.length === capacity && full.sys.vacant.length === 0 &&
           (full.sys.queued || []).length === 0,
     capacity + ' notes take the ' + capacity + ' planets and none is left empty — ' +
     'seats ' + full.sys.seats.map(s => s.slot + ':' + s.id.replace('zz-fill-', '#')).join(' ') +
     ', ' + full.sys.vacant.length + ' empty, ' + (full.sys.queued || []).length + ' waiting');

  /* ── one more than it can hold ────────────────────────────────────────── */
  write(exact.concat([note(capacity + 1)]), null);
  const over = measure('over');
  const extraId = 'zz-fill-' + (capacity + 1);
  const queued = over.sys.queued || [];
  ck('F3', over.sys.occupied.length === capacity && queued.length === 1 &&
           queued[0] === extraId,
     'the ' + (capacity + 1) + 'th note does not make a ' + (capacity + 1) + 'th orbit — ' +
     'it waits, and the system still has ' + over.sys.slots + ' orbits' +
     (queued.length ? ' (waiting: ' + queued.join(', ') + ')' : ' — NOTHING WAITED'));

  ck('F4', (over.sys.unplaced || []).indexOf(extraId) >= 0 &&
           over.sheet.indexOf(extraId) < 0,
     'and it is invisible while it waits — no position in the sky, no row in the sheet');

  /* ── give up a planet, and the waiting note should take THAT planet ───── */
  const giveUp = full.sys.seats[1];                     // the second orbit, not the first or last
  write(exact.concat([note(capacity + 1)]),
        [{ id: giveUp.id, at: '2026-09-05' }]);
  const after = measure('after');

  const took = (after.sys.seats || []).filter(s => s.id === extraId)[0];
  ck('F5', !!took && took.slot === giveUp.slot && Math.abs(took.r - giveUp.r) < 0.001,
     took
       ? 'the planet given up by ' + giveUp.id.replace('zz-fill-', 'note #') +
         ' is taken by the note that was waiting — orbit ' + took.slot +
         ' at radius ' + took.r + ', the same radius to three decimals'
       : 'the waiting note did NOT take the freed planet');

  /* nobody else moved: every other seat is the same id at the same radius */
  const before = {}; full.sys.seats.forEach(s => { if (s.slot !== giveUp.slot) before[s.slot] = s; });
  const moved = Object.keys(before).filter(k => {
    const now = (after.sys.seats || []).filter(s => s.slot === +k)[0];
    return !now || now.id !== before[k].id || Math.abs(now.r - before[k].r) > 0.001;
  });
  ck('F6', moved.length === 0 && (after.sys.queued || []).length === 0,
     'and nothing else moved — ' + Object.keys(before).length +
     ' other planets keep the same note at the same radius, and nothing is left waiting' +
     (moved.length ? ' — MOVED: orbit ' + moved.join(', ') : ''));

} catch (e) {
  bad++;
  console.log('  FAIL  ---  the harness threw: ' + ((e && e.message) || e));
} finally {
  /* THE STORE GOES BACK, AND IT IS CHECKED. A fill harness that died halfway
     and left synthetic notes in data/notes.json would publish them to the live
     site on the next deploy. */
  fs.writeFileSync(STORE, ORIGINAL, 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
  const restored = fs.readFileSync(STORE, 'utf8') === ORIGINAL;
  if (!restored) { console.log('  FAIL  ---  THE STORE WAS NOT RESTORED — fix data/notes.json by hand'); bad++; }
  else console.log('\n  the note store is back exactly as it was, byte for byte');
}

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' fill invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'a note takes a free planet, a surplus note waits unseen, and a planet ' +
                  'given up goes to whoever was waiting');
process.exit(bad ? 1 : 0);
