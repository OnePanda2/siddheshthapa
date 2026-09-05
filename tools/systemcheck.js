/* systemcheck.js — is a world's capacity a property of the SYSTEM rather than
   of how much has been written into it?

   MUSIC and PSYCHOLOGY were charted with nothing in them and rendered as a
   single star in an empty sky, because a ring was only ever drawn when a
   concept was standing on it. Fixing that meant separating two things the code
   had always conflated: how many places a world HAS, and how many are TAKEN.

   Once those are separate, three promises follow, and this file holds them:

     S1  every planetary world has exactly the orbits its system declares —
         the archive's measured axes plus a frozen number of extras, and
         nothing that gets written changes that number
     S2  the two worlds with invented orbits still have exactly the invented
         orbits they shipped with: LOVE 1 measured + 3, BUSINESS 5 + 2
     S3  no world is over-subscribed — no two notes on one orbit, which is the
         defect the old code had, quietly stacking every surplus concept on the
         outermost ring
     S4  a declared full-system world draws its whole system: an orbit for
         every place, and a planet marker on every place nobody occupies
     S5  a world that is NOT declared draws only the orbits it occupies, so
         nothing changed for the thirteen worlds that were already right
     S6  a note with nowhere to stand is invisible — no position in the sky and
         no row in the sheet — rather than being drawn somewhere arbitrary

   usage: node tools/systemcheck.js [v02.html]
*/
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (require('./scratch.js').root() + '/sys-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {ERROR:'__v02 missing'};
  M.enter(); M.settle(60);
  M.setOpen(1); M.settle(40);
  var out={ systems:M.systems() };

  /* what the SHEET lists for a world, so a queued note can be shown to be
     absent from the page as well as from the sky.

     THE WORLDS ARE ASKED FOR, NOT NAMED. This listed ['music','psychology'],
     which was true when it was written and crashed the whole file the moment
     PSYCHOLOGY stopped being a topic — reading .queued off an undefined world.
     Exactly the stale-census failure this project has spent a week removing,
     written into a brand-new check by the person removing them. Every world
     that declares itself full-system is visited, whatever it happens to be
     called today. */
  out.sheet={};
  Object.keys(out.systems).forEach(function(id){
    if(!out.systems[id].fullSystem) return;
    M.go('region',id); M.settle(60);
    out.sheet[id]=[].slice.call(document.querySelectorAll('#semantic [data-nav]'))
      .map(function(b){ return b.getAttribute('data-nav'); });
  });
  return out;
})()`;

const page = tmp + '/s.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `
<script>window.addEventListener('load',function(){setTimeout(function(){
  var r; try{ r=${PROBE}; }catch(e){ r={ERROR:String((e&&e.message)||e)}; }
  document.title=JSON.stringify(r);
},400);});</script>`, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/u" --no-first-run --no-default-browser-check' +
  ' --window-size=1440,900 --virtual-time-budget=14000 --dump-dom "' + page + '"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!mm) { console.error('the page never reported'); process.exit(1); }
const r = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
if (r.ERROR) { console.error(r.ERROR); process.exit(1); }

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const S = r.systems, ids = Object.keys(S);

/* S1 — capacity is declared, and it is what is drawn */
const wrongCount = ids.filter(id => S[id].slots !== S[id].declaredCount);
ck('S1', ids.length >= 13 && wrongCount.length === 0,
   ids.length + ' planetary worlds each have exactly the orbits their system declares' +
   (wrongCount.length ? ' — WRONG: ' + wrongCount.map(id =>
      id + ' draws ' + S[id].slots + ' for a declared ' + S[id].declaredCount).join(', ') : ''));

/* S2 — the two worlds with invented orbits are unchanged, to the orbit */
const inventedNow = ids.filter(id => S[id].extra > 0)
  .map(id => id + ' ' + S[id].measured + '+' + S[id].extra).sort().join(', ');
ck('S2', inventedNow === 'business 5+2, love 1+3',
   'only the two worlds that already had invented orbits have any — ' +
   (inventedNow || 'none') + ' (every other world is exactly its measured axes)');

/* S3 — one note, one place */
const doubled = ids.filter(id => new Set(S[id].occupied).size !== S[id].occupied.length);
const over = ids.filter(id => S[id].occupied.some(k => k >= S[id].slots));
ck('S3', doubled.length === 0 && over.length === 0,
   'no orbit carries two notes and none carries a note past the last orbit' +
   (doubled.length ? ' — DOUBLED: ' + doubled.join(', ') : '') +
   (over.length ? ' — PAST THE END: ' + over.join(', ') : ''));

/* S4 — a declared world shows the whole system */
const full = ids.filter(id => S[id].fullSystem);
const fullWrong = full.filter(id => {
  const w = S[id];
  const places = w.occupied.length + w.vacant.length;
  return places !== w.slots || w.vacant.length === 0 && w.occupied.length < w.slots;
});
ck('S4', full.length > 0 && fullWrong.length === 0,
   full.length + ' declared world(s) draw every place their system has — ' +
   full.map(id => id.toUpperCase() + ' ' + S[id].system + ': ' + S[id].slots +
     ' orbits, ' + S[id].occupied.length + ' taken, ' + S[id].vacant.length + ' empty').join('; ') +
   (fullWrong.length ? ' — WRONG: ' + fullWrong.join(', ') : ''));

/* S5 — and an undeclared world draws only what it occupies */
const plain = ids.filter(id => !S[id].fullSystem);
const plainWrong = plain.filter(id => S[id].vacant.length !== 0);
ck('S5', plainWrong.length === 0,
   plain.length + ' undeclared world(s) draw no empty planets, so nothing changed for ' +
   'the worlds that were already right' +
   (plainWrong.length ? ' — DREW EMPTIES: ' + plainWrong.join(', ') : ''));

/* S6 — a note with nowhere to stand is nowhere to be seen */
const queued = [];
ids.forEach(id => (S[id].queued || []).forEach(q => queued.push(id + '/' + q)));
const drawnQueued = [];
ids.forEach(id => {
  const w = S[id];
  (w.queued || []).forEach(q => { if ((w.unplaced || []).indexOf(q) < 0) drawnQueued.push(id + '/' + q); });
});
const inSheet = [];
Object.keys(r.sheet || {}).forEach(id => {
  if (!S[id]) return;                       // a world can stop existing between probe and assertion
  (S[id].queued || []).forEach(q => { if (r.sheet[id].indexOf(q) >= 0) inSheet.push(id + '/' + q); });
});
ck('S6', drawnQueued.length === 0 && inSheet.length === 0,
   queued.length
     ? queued.length + ' waiting note(s) are absent from both the sky and the sheet — ' + queued.join(', ')
     : 'no note is waiting today: every world has room for what is in it, so this ' +
       'has nothing to measure and will apply to the first note written past a full system' +
   (drawnQueued.length ? ' — DRAWN ANYWAY: ' + drawnQueued.join(', ') : '') +
   (inSheet.length ? ' — LISTED ANYWAY: ' + inSheet.join(', ') : ''));

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' system invariants hold');
ids.sort().forEach(id => {
  const w = S[id];
  console.log('    ' + id.padEnd(12) + (w.system || '').padEnd(12) +
    String(w.slots).padStart(2) + ' orbits · ' +
    String(w.occupied.length).padStart(2) + ' taken · ' +
    String(w.vacant.length).padStart(2) + ' empty · ' +
    String((w.queued || []).length).padStart(2) + ' waiting' +
    (w.fullSystem ? '   (shows its whole system)' : ''));
});
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\na world has the places its system has, and a note takes one or waits');
process.exit(bad ? 1 : 0);
