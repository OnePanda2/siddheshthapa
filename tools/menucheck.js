/* menucheck.js — can the menu be reordered without moving the mind?
 *
 * ORDER IN THE MENU IS NOT ORDER IN THE MIND, and the whole design rests on
 * that separation. A region's INDEX in MIGS is where its star stands in space:
 * owned[] is filled in NODES order and the brain layout walks the same array,
 * so rearranging MIGS to tidy a list would pick up fifteen stars and move
 * them. The order of the doors is therefore a second, declared list.
 *
 * That is exactly the kind of claim that is easy to state and easy to get
 * wrong, so this reorders the menu from the store and then measures whether
 * anything behind it moved.
 *
 *   M1  the menu is the mind's own order when the store says nothing
 *   M2  a declared order lifts those topics to the front, in that order
 *   M3  and every topic NOT named keeps its place behind them — so a topic
 *       added after an ordering was saved appears without disturbing it and
 *       without vanishing from the list
 *   M4  THE SKY DOES NOT MOVE. Every region's world, radii and position are
 *       identical before and after, which is the promise the separation makes
 *   M5  a retired topic cannot be ordered — it has no door — and an id that
 *       names nothing is refused at the commit rather than silently ignored
 *   M6  clearing the list restores the mind's own order exactly
 *
 * usage: node tools/menucheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/menu-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function write(store) { fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + '\n', 'utf8'); }
function gate() {
  try { execSync('node tools/notescheck.js', { stdio: 'pipe' }); return null; }
  catch (e) { return ((e.stdout || '') + (e.stderr || '')).toString(); }
}

/* the ROWS the page paints, not the model's idea of them — the question is
   what a visitor sees listed, so it is read out of the DOM */
const PROBE = '(function(){' +
  'var M=window.__v02; if(!M) return {ERROR:"no __v02"};' +
  'M.enter(); M.settle(60); M.setOpen(1); M.go("universe",null); M.settle(60);' +
  'var out={ menu:M.menu(), worlds:{}, pos:{} };' +
  'out.rows=[].slice.call(document.querySelectorAll("#semantic [data-nav]"))' +
  '  .map(function(b){ return b.getAttribute("data-nav"); });' +
  'var S=M.systems();' +
  'Object.keys(S).forEach(function(id){ var rr=S[id].radii||[];' +
  '  out.worlds[id]={ sys:S[id].system, inner:rr.length?+rr[0].toFixed(3):null,' +
  '    outer:rr.length?+rr[rr.length-1].toFixed(3):null,' +
  '    seats:(S[id].seats||[]).map(function(s){ return s.id+"@"+s.slot; }).join(",") };});' +
  'out.pos=out.menu.stars;' +
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
const sky = r => JSON.stringify({ w: r.worlds, p: r.pos });
/* AND THE STARS MUST ACTUALLY HAVE BEEN COUNTED. The first version of M4
   read positions off model(), which carries none, so it compared two empty
   objects and reported that all zero stars had held still. A check that can
   pass while measuring nothing is worse than no check. */
const counted = r => Object.keys(r.pos || {}).length;

try {
  build();
  const before = measure('before');

  /* ---- M1 ----------------------------------------------------------- */
  ck('M1', before.rows.length === before.menu.mind.length &&
           before.rows.join() === before.menu.mind.join(),
     'with nothing declared the menu is the mind\u2019s own order, all ' +
     before.rows.length + ' of it: ' + before.rows.slice(0, 4).join(' · ') + ' \u2026');

  /* ---- reorder: take three from the back and put them in front ------- */
  const mind = before.menu.mind.slice();
  const lifted = [mind[mind.length - 1], mind[mind.length - 3], mind[1]];
  const D = JSON.parse(ORIGINAL);
  D.menuOrder = lifted;
  write(D);
  const refused = gate();
  if (refused) throw new Error('the gate refused a well-formed ordering:\n' + refused);
  build();
  const after = measure('after');

  ck('M2', after.rows.slice(0, 3).join() === lifted.join(),
     'a declared order lifts them to the front in that order — ' + lifted.join(' · ') +
     ' — from positions ' + lifted.map(id => mind.indexOf(id) + 1).join(', ') +
     ' of ' + mind.length);

  const restExpected = mind.filter(id => lifted.indexOf(id) < 0);
  ck('M3', after.rows.slice(3).join() === restExpected.join() &&
           after.rows.length === before.rows.length,
     'and the ' + restExpected.length + ' topics nobody ordered keep their own order behind ' +
     'them, none lost and none promoted — a topic added after this was saved would ' +
     'appear here rather than jumping to the top or falling off the list');

  /* ---- M4: the promise ---------------------------------------------- */
  const moved = Object.keys(before.worlds).filter(id =>
    JSON.stringify(before.worlds[id]) !== JSON.stringify(after.worlds[id]));
  const shifted = Object.keys(before.pos).filter(id =>
    JSON.stringify(before.pos[id]) !== JSON.stringify(after.pos[id]));
  ck('M4', sky(before) === sky(after) &&
           counted(before) === before.menu.mind.length && counted(before) > 0,
     moved.length + shifted.length === 0
       ? 'and NOTHING BEHIND THE DOORS MOVED: all ' + Object.keys(before.worlds).length +
         ' worlds keep their system, their radii and every seat, and all ' +
         counted(before) + ' of the ' + before.menu.mind.length + ' region stars keep their ' +
         'exact position. The ' +
         'menu is a list; the mind is a place'
       : 'the sky moved with the menu — worlds: ' + (moved.join(', ') || 'none') +
         ' · stars: ' + (shifted.join(', ') || 'none'));

  /* ---- M5: what cannot be ordered ------------------------------------ */
  const D2 = JSON.parse(ORIGINAL);
  D2.menuOrder = ['zz-not-a-topic'];
  write(D2);
  const r1 = gate();
  const D3 = JSON.parse(ORIGINAL);
  D3.regions = [{ id: 'zz-gone', label: 'RETIRED BEFORE IT WAS ORDERED', added: '2026-09-08',
                  line: 'Declared and retired in the same store, to be ordered and refused.' }];
  D3.retiredRegions = [{ id: 'zz-gone', at: '2026-09-08' }];
  D3.menuOrder = ['zz-gone'];
  write(D3);
  const r2 = gate();
  const D4 = JSON.parse(ORIGINAL);
  D4.menuOrder = [mind[0], mind[0]];
  write(D4);
  const r3 = gate();
  ck('M5', !!r1 && /is not an open topic/.test(r1) &&
           !!r2 && /retired/.test(r2) && !!r3 && /listed twice/.test(r3),
     'an id that names nothing is refused, a RETIRED topic is refused because it has no ' +
     'door, and a topic listed twice is refused because a door has one place — all three ' +
     'at the commit, rather than as a line in the store the page quietly ignores');

  /* ---- M6 ------------------------------------------------------------ */
  const D5 = JSON.parse(ORIGINAL);
  D5.menuOrder = [];
  write(D5);
  if (gate()) throw new Error('the gate refused an empty ordering');
  build();
  const cleared = measure('cleared');
  /* AGAINST THE MIND, NOT AGAINST "BEFORE". This asked only whether clearing
     produced the same list as the start, which two equally empty lists satisfy
     — and menumutate M6 proved it by reading an empty ordering as "show
     nothing": every row vanished from both measurements and the assertion was
     content. So it is anchored to the mind's own order and to a non-empty
     count, which no broken pair can satisfy between them. Same defect as M4's
     first version, which compared two empty sets of star positions. */
  ck('M6', cleared.rows.length === cleared.menu.mind.length &&
           cleared.rows.length > 0 &&
           cleared.rows.join() === cleared.menu.mind.join() &&
           cleared.rows.join() === before.rows.join() && sky(cleared) === sky(before),
     'and clearing it restores the mind\u2019s own order exactly, with the sky still ' +
     'untouched — an empty list is "no opinion about the order", which is what a fresh ' +
     'store already says');

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

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' menu invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'the doors can be put in any order, and the mind behind them does not move');
process.exit(bad ? 1 : 0);
