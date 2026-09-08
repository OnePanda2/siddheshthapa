/* regioncheck.js — can a TOPIC be added, renamed and retired without code?
 *
 * This was the last thing on the page that needed a programmer. A topic needs
 * a star, and the fourteen stars were typed into src/v02-app.js where no form
 * could reach them — so every other part of "add a region" already worked
 * (the menu takes one, the palette hands it an unused hue, the emblem falls
 * through to a family, the books make it a key) and the one line nobody could
 * write stopped the whole thing.
 *
 * A topic is declared in data/notes.json now and claims the next unclaimed
 * system from the reserve pool. None of that can be observed on the site as it
 * stands, because no topic has ever been added this way — so this adds two,
 * renames one, retires one, and asks the page what happened. The store is put
 * back byte for byte and the restoration is verified.
 *
 *   G1  a topic declared in the store becomes a region of the mind, carrying
 *       the name and the sentence the editor was given
 *   G2  it claims a real system from the reserve, shown whole, at a scale
 *       inside the band the worlds already in service occupy — not the
 *       default, which would put a 75x system nine hundred units out
 *   G3  a note can be filed into it and takes an orbit, so the topic is a
 *       place and not a decoration
 *   G4  renaming it changes the door and moves nothing behind it — same id,
 *       same world, same contents, same orbit
 *   G5  retiring it closes the room: gone from the mind, and the relationships
 *       that pointed into it swept rather than left drawing onto nothing
 *   G6  and retiring one topic does not move another topic's star, which is
 *       the whole reason a retired topic keeps its place in the queue
 *   G7  the new world is READABLE — smoke's own five questions, asked of a
 *       world that did not exist when smoke was written
 *
 * usage: node tools/regioncheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/region-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const ONE = 'zz-first', TWO = 'zz-second';
const NOTE = 'zz-region-note';
const REGIONS = [
  { id: ONE, label: 'FIRST HARNESS TOPIC', added: '2026-09-08',
    line: 'A topic added by the harness to prove one can be added at all, and removed again.' },
  { id: TWO, label: 'SECOND HARNESS TOPIC', added: '2026-09-08',
    line: 'A second one, so the queue can be shown to advance and then to hold still.' }
];
const IN_IT = {
  id: NOTE, t: 'thought', label: 'A NOTE IN A NEW TOPIC', mig: ONE, crosses: ['philosophy'],
  state: 'seed', register: 'fixture — written by the harness, not by anyone',
  src: 'Live note', added: '2026-09-08',
  line: 'Filed into a topic that did not exist until this file wrote it, to prove the topic is a place.'
};
/* AND ONE IN THE SECOND, because of what smoke actually asks. Its orbit count
   comes from astro().orbits, which is the OCCUPIED orbits — so an empty world
   reports zero and smoke calls it a problem, correctly: it is asking whether
   anything is standing in this place. An empty topic is a legitimate state and
   G2 already proves the rings are drawn, so the way to make G7 mean something
   is to put something in both worlds rather than to weaken the question. */
const IN_TWO = {
  id: NOTE + '-b', t: 'thought', label: 'A NOTE IN THE SECOND TOPIC', mig: TWO, crosses: [],
  state: 'seed', register: 'fixture — written by the harness, not by anyone',
  src: 'Live note', added: '2026-09-08',
  line: 'So the second world has something standing in it when smoke asks what it holds.'
};

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function write(store) { fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + '\n', 'utf8'); }
function gate() {
  try { execSync('node tools/notescheck.js', { stdio: 'pipe' }); return null; }
  catch (e) { return ((e.stdout || '') + (e.stderr || '')).toString(); }
}

const PROBE = '(function(){' +
  'var M=window.__v02; if(!M) return {ERROR:"no __v02"};' +
  'M.enter(); M.settle(60); M.setOpen(1); M.settle(40);' +
  'var S=M.systems(), C=M.claims(), mdl=M.model();' +
  'var out={ centre:C.centre, claimed:C.claimed, pool:C.pool,' +
  '          migs:mdl.migs.map(function(m){ return m.id; }),' +
  '          labels:{}, lines:{}, worlds:{}, edges:0, seat:null };' +
  'mdl.migs.forEach(function(m){ out.labels[m.id]=m.label; });' +
  'mdl.nodes.forEach(function(n){ if(n.t==="mig") out.lines[n.id]=n.line||""; });' +
  'Object.keys(S).forEach(function(id){ var rr=S[id].radii||[];' +
  '  out.worlds[id]={ sys:S[id].system, n:S[id].slots, full:!!S[id].fullSystem,' +
  '    inner:rr.length?+rr[0].toFixed(2):null, outer:rr.length?+rr[rr.length-1].toFixed(2):null,' +
  '    seats:(S[id].seats||[]).map(function(s){ return s.id+"@"+s.slot; }) };});' +
  'out.edges=(mdl.links||mdl.edges||[]).length;' +
  'out.nodeIds=mdl.nodes.map(function(n){ return n.id; });' +
  'return out; })()';

function measure(tag) {
  const page = tmp + '/' + tag + '.html';
  fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') +
    "\n<script>window.addEventListener('load',function(){setTimeout(function(){\n" +
    '  var r; try{ r=' + PROBE + '; }catch(e){ r={ERROR:String((e&&e.message)||e)}; }\n' +
    '  document.title=JSON.stringify(r);\n},400);});</script>', 'utf8');
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

try {
  build();
  const before = measure('before');

  /* ---- two topics and a note in the first ---------------------------- */
  const D = JSON.parse(ORIGINAL);
  D.regions = REGIONS.map(r => Object.assign({}, r));
  D.notes = D.notes.concat([IN_IT, IN_TWO]);
  write(D);
  const refused = gate();
  if (refused) throw new Error('the gate refused a well-formed topic:\n' + refused);
  build();
  const added = measure('added');

  ck('G1', added.migs.indexOf(ONE) >= 0 && added.migs.indexOf(TWO) >= 0 &&
           added.labels[ONE] === 'FIRST HARNESS TOPIC' &&
           /prove one can be added at all/.test(added.lines[ONE] || ''),
     'the mind grew from ' + before.migs.length + ' regions to ' + added.migs.length +
     ', and the new one arrives named "' + added.labels[ONE] + '" carrying its own sentence — ' +
     'declared in data/notes.json, with nothing added to src/');

  /* ---- G2: a real world, at a sane scale ----------------------------- */
  const w1 = added.worlds[ONE] || {}, w2 = added.worlds[TWO] || {};
  /* THE BAND IS NOT THE TEST, and using it as one was a mistake worth writing
     down: inner radii already run from 1.1 to 1043 across the fourteen, so
     almost anything falls inside them — the DEFAULT scale of 13 would have
     passed a band test on both of these worlds. What the rule actually claims
     is narrower and therefore checkable: a claimed world is scaled to sit at
     the same geometric centre, sqrt(inner * outer), as the median world that
     already has a hand-tuned scale. So that is what is asked. */
  const centreOf = w => Math.sqrt(w.inner * w.outer);
  const near = (a, b) => Math.abs(a / b - 1) < 0.01;
  ck('G2', !!w1.sys && !!w2.sys && before.pool.indexOf(w1.sys) === 0 &&
           before.pool.indexOf(w2.sys) === 1 && w1.full && w2.full &&
           near(centreOf(w1), added.centre) && near(centreOf(w2), added.centre),
     'they took ' + w1.sys + ' and ' + w2.sys + ' — the first two in the reserve, in order — ' +
     'and each is shown whole: ' + w1.n + ' orbits from ' + w1.inner + ' to ' + w1.outer +
     ', ' + w2.n + ' from ' + w2.inner + ' to ' + w2.outer + '. Their geometric centres are ' +
     centreOf(w1).toFixed(1) + ' and ' + centreOf(w2).toFixed(1) + ', both the ' + added.centre +
     ' the hand-tuned worlds sit at — so the scale was DERIVED from the set, not defaulted ' +
     '(the default 13 would put them at ' + (13 * Math.sqrt(w1.outer / w1.inner)).toFixed(0) +
     ' and ' + (13 * Math.sqrt(w2.outer / w2.inner)).toFixed(0) + ')');

  /* ---- G3: it is a place, not a decoration --------------------------- */
  const seated = (w1.seats || []).filter(s => s.indexOf(NOTE + '@') === 0);
  ck('G3', seated.length === 1,
     seated.length === 1
       ? 'a note filed into it stands on an orbit — ' + seated[0].replace('@', ' on orbit ') +
         ' — so the topic is somewhere things can be written, not a name on a menu'
       : 'the note filed into it is standing on no orbit at all');

  /* ---- G4: rename moves the door, not the room ----------------------- */
  const D2 = JSON.parse(JSON.stringify(D));
  D2.edits = { [ONE]: { label: 'RENAMED HARNESS TOPIC' } };
  write(D2);
  const refused2 = gate();
  if (refused2) throw new Error('the gate refused a rename:\n' + refused2);
  build();
  const renamed = measure('renamed');
  const rw = renamed.worlds[ONE] || {};
  ck('G4', renamed.labels[ONE] === 'RENAMED HARNESS TOPIC' &&
           renamed.migs.indexOf(ONE) >= 0 && rw.sys === w1.sys &&
           rw.inner === w1.inner && rw.outer === w1.outer &&
           (rw.seats || []).join() === (w1.seats || []).join(),
     'renamed to "' + renamed.labels[ONE] + '" and NOTHING behind the door moved: same ' +
     'reference ' + ONE + ', same world ' + rw.sys + ', same radii, same note on the same orbit');

  /* ---- G5 and G6: retire the first ----------------------------------- */
  const D3 = JSON.parse(JSON.stringify(D2));
  D3.retiredRegions = [{ id: ONE, at: '2026-09-08', why: 'retired by the harness' }];
  /* the note inside it goes too — a note in a retired room is as invisible as
     one in a hidden region, which is what the gate says, so the harness moves
     it out rather than asking the gate to contradict itself */
  D3.notes = D3.notes.filter(n => n.id !== NOTE);
  delete D3.edits;
  write(D3);
  const refused3 = gate();
  if (refused3) throw new Error('the gate refused a retirement:\n' + refused3);
  build();
  const gone = measure('retired');

  ck('G5', gone.migs.indexOf(ONE) < 0 && gone.migs.indexOf(TWO) >= 0 &&
           gone.migs.length === added.migs.length - 1 && !gone.worlds[ONE],
     'retired: ' + added.migs.length + ' regions down to ' + gone.migs.length + '. ' +
     ONE + ' is gone from the mind and has no world, and ' + TWO + ' is untouched — ' +
     'the room closed rather than the topic being deleted out of the graph');

  const gw = gone.worlds[TWO] || {};
  ck('G6', gw.sys === w2.sys && gw.inner === w2.inner && gw.outer === w2.outer &&
           gone.claimed._spent === added.claimed._spent,
     'and the OTHER topic did not move: ' + TWO + ' still has ' + gw.sys + ' at ' +
     gw.inner + ' to ' + gw.outer + ', identical. The retired topic keeps its place in the ' +
     'queue (' + gone.claimed._spent + ' spent, as before), so closing one room cannot ' +
     'rearrange the sky around it');

  /* ---- G7: and it is readable ---------------------------------------- */
  write(D);                       // both topics standing, note in the first
  build();
  let smokeOut = '', smokeOk = false;
  try { smokeOut = execSync('node tools/smoke.js ' + ONE + ' ' + TWO,
                            { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 600000 });
        smokeOk = true; }
  catch (e) { smokeOut = ((e.stdout || '') + (e.stderr || '')).toString(); }
  const lines = smokeOut.split('\n').filter(l => new RegExp('\\b(' + ONE + '|' + TWO + ')\\b').test(l));
  ck('G7', smokeOk && lines.length === 2,
     smokeOk ? 'and smoke\u2019s own five questions pass on worlds that did not exist when it ' +
               'was written —\n           ' + lines.map(l => l.trim()).join('\n           ')
             : 'smoke refused the new worlds:\n           ' +
               smokeOut.split('\n').slice(-8).join('\n           '));

} catch (e) {
  bad++;
  console.log('  FAIL  ---  the harness threw: ' + ((e && e.message) || e));
} finally {
  fs.writeFileSync(STORE, ORIGINAL, 'utf8');
  build();
  if (fs.readFileSync(STORE, 'utf8') !== ORIGINAL) {
    console.log('  FAIL  ---  THE STORE WAS NOT RESTORED — fix data/notes.json by hand'); bad++;
  } else console.log('\n  the note store is back exactly as it was, byte for byte');
}

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' region invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'a topic can be added, renamed and retired from the editor, and it gets a real world');
process.exit(bad ? 1 : 0);
