/* projectcheck.js — can a project be added without touching any code?
 *
 * MY WORKS is derived from the graph: every object filed under my-works that is
 * not the region and not a concept becomes a sheet. So "add a project" means
 * adding that node, and the only channel that reaches the graph from outside
 * src/ is the live note store — which is what the editor writes.
 *
 * None of that can be observed on the site as it stands, because no project has
 * ever been added this way. So this adds one: a project goes into the store,
 * the artifact is rebuilt, the manual is asked what it now holds, and the store
 * is put back exactly as it was and the restoration verified byte for byte.
 *
 *   P1  the manual gains a sheet, and it is the one that was added
 *   P2  the sheet carries the name and the line the editor was given
 *   P3  it renders RESERVED — numbered, stamped, and not invented
 *   P4  and it stays OUT of the mind: no body in the sky, no row in a topic
 *   P5  the gate refuses a project filed into a hidden region that has no
 *       manual behind it, which is every hidden region but this one
 *
 * usage: node tools/projectcheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/proj-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const PROJECT = {
  id: 'zz-proj-1', t: 'project', label: 'HARNESS PROJECT', mig: 'my-works',
  crosses: ['technology'], state: 'seed', register: 'project',
  src: 'tools/projectcheck.js — synthetic, never committed',
  line: 'A project added by the harness to prove the manual can grow one, and removed again.',
  added: '2026-09-05'
};

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }

function measure(tag) {
  const page = tmp + '/' + tag + '.html';
  fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>window.addEventListener('load',function(){setTimeout(function(){
  var r;
  try{
    var M=window.__v02, W=M.works;
    M.enter(); M.settle(60);
    W.open(); M.settle(60);
    var sheets=W.sheets();
    /* what the contents page prints for each sheet */
    var rows=[].slice.call(document.querySelectorAll('[data-sheet]')).map(function(b){
      return { id:b.getAttribute('data-sheet'),
               text:(b.textContent||'').replace(/\\s+/g,' ').trim() }; });
    var out={ sheets:sheets, rows:rows, written:W.written() };
    /* and the sheet itself, if it is there */
    if(sheets.indexOf('${PROJECT.id}')>=0){
      W.show('${PROJECT.id}'); M.settle(60);
      out.sheet={ name:(document.querySelector('.wk-name')||{}).textContent||'',
                  line:(document.querySelector('.wk-line')||{}).textContent||'',
                  stamp:(document.querySelector('.wk-stamp')||{}).textContent||'',
                  reserved:!!document.querySelector('.wk-none') };
    }
    /* is it anywhere in the MIND? it must not be */
    W.close(); M.settle(40); M.setOpen(1); M.settle(40);
    var mdl=M.model();
    var n=mdl.nodes.filter(function(x){ return x.id==='${PROJECT.id}'; })[0]||null;
    out.inGraph=!!n;
    out.placed=(M.arch().migIds||[]).length;
    M.go('region','technology'); M.settle(60);
    out.technologyRows=[].slice.call(document.querySelectorAll('#semantic [data-nav]'))
      .map(function(b){ return b.getAttribute('data-nav'); });
    r=out;
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

try {
  build();
  const before = measure('before');

  const D = JSON.parse(ORIGINAL);
  D.notes = D.notes.concat([PROJECT]);
  fs.writeFileSync(STORE, JSON.stringify(D, null, 2) + '\n', 'utf8');
  execSync('node tools/notescheck.js', { stdio: 'pipe' });   // the gate must accept it
  build();
  const after = measure('after');

  ck('P1', after.sheets.length === before.sheets.length + 1 &&
           after.sheets.indexOf(PROJECT.id) >= 0,
     'the manual grew from ' + before.sheets.length + ' sheets to ' + after.sheets.length +
     ', and the new one is ' + PROJECT.id + ' — added to the GRAPH, never written into works.json');

  const row = (after.rows || []).filter(r => r.id === PROJECT.id)[0];
  ck('P2', !!row && /HARNESS PROJECT/.test(row.text) && /prove the manual can grow one/.test(row.text),
     row ? 'the contents page prints its name and its line — "' + row.text.slice(0, 66) + '…"'
         : 'the contents page does not list it at all');

  const sh = after.sheet || {};
  ck('P3', sh.name === 'HARNESS PROJECT' && /prove the manual can grow one/.test(sh.line || '') &&
           sh.stamp === 'not yet written' && sh.reserved === true,
     'its sheet renders reserved — stamped "' + sh.stamp + '", carrying its line, ' +
     'with nothing invented to fill it');

  ck('P4', after.inGraph === true && after.technologyRows.indexOf(PROJECT.id) < 0,
     'it is in the graph but not in the mind — it crosses into TECHNOLOGY and still ' +
     'does not appear among its ' + after.technologyRows.length + ' rows, because ' +
     'my-works is hidden and its objects live in the manual instead');

  /* P5 — the exemption is exactly one region wide */
  const D2 = JSON.parse(ORIGINAL);
  D2.notes = D2.notes.concat([Object.assign({}, PROJECT, { id: 'zz-proj-2', mig: 'building' })]);
  fs.writeFileSync(STORE, JSON.stringify(D2, null, 2) + '\n', 'utf8');
  let refused = false, why = '';
  try { execSync('node tools/notescheck.js', { stdio: 'pipe' }); }
  catch (e) { refused = true; why = ((e.stdout || '') + (e.stderr || '')).toString(); }
  ck('P5', refused && /is not a region that exists/.test(why),
     refused ? 'and a note filed into a hidden region with NO manual behind it is still ' +
               'refused — the exemption is one region wide, not "hidden regions are fine"'
             : 'the gate ACCEPTED a note that would have been invisible');

} catch (e) {
  bad++;
  console.log('  FAIL  ---  the harness threw: ' + ((e && e.message) || e));
} finally {
  fs.writeFileSync(STORE, ORIGINAL, 'utf8');
  build();
  const restored = fs.readFileSync(STORE, 'utf8') === ORIGINAL;
  if (!restored) { console.log('  FAIL  ---  THE STORE WAS NOT RESTORED — fix data/notes.json by hand'); bad++; }
  else console.log('\n  the note store is back exactly as it was, byte for byte');
}

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' project invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'a project can be added from the editor, and the manual grows a sheet for it');
process.exit(bad ? 1 : 0);
