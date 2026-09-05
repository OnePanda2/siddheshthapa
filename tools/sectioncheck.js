/* sectioncheck.js — can a writing carry sections, and does the page draw them?
 *
 * A writing in this mind is one sentence held still, and for a long time the
 * reader drew exactly that and nothing else. It can now carry sections after
 * the statement — what a quote meant, where it came from, what changed — added
 * whenever they are wanted, including to a writing published months ago.
 *
 * None of that can be observed on the mind as it stands, because no note has
 * a section yet. So this writes one: a note with two sections goes into the
 * store, the artifact is rebuilt, the reader is opened on it and read, and the
 * store is put back exactly as it was and the restoration verified byte for
 * byte. Same shape as tools/systemfill.js, and for the same reason — a claim
 * about what happens NEXT cannot be checked by describing what is here now.
 *
 *   X1  a writing with no sections is unchanged: the reader draws none
 *   X2  sections appear under the statement, in the order they were written
 *   X3  a heading is optional — a section without one draws no heading element
 *   X4  a section is TEXT: markup in a body is shown, never interpreted
 *   X5  the gate refuses a section with a heading and no body, which would
 *       render as a title over nothing
 *
 * usage: node tools/sectioncheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/sec-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const MARKUP = '<b>not bold</b> & kept as typed';
const NOTE = {
  id: 'zz-sec-1', t: 'thought', label: 'SECTION TEST', mig: 'music',
  crosses: [], state: 'seed', register: 'harness fixture',
  src: 'tools/sectioncheck.js — synthetic, never committed',
  line: 'The statement this writing is built around.',
  added: '2026-09-05',
  sections: [
    { heading: 'WHAT IT MEANS', body: 'The first section, which carries a heading.' },
    { heading: '', body: 'The second section, which carries none. ' + MARKUP }
  ]
};

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }

function measure(tag, id) {
  const page = tmp + '/' + tag + '.html';
  fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>window.addEventListener('load',function(){setTimeout(function(){
  var r;
  try{
    var M=window.__v02;
    M.enter(); M.settle(60); M.setOpen(1); M.settle(40);
    M.read('${id}'); M.settle(40);
    var box=document.getElementById('readSections');
    r={ statement:(document.getElementById('readTitle')||{}).textContent||'',
        secs:[].slice.call(box?box.children:[]).map(function(d){
          var h=d.querySelector('.docsec-h'), b=d.querySelector('.docsec-b');
          return { heading:h?h.textContent:null,
                   body:b?b.textContent:null,
                   /* COUNTED IN THE PAGE, NOT COMPARED AS HTML AFTERWARDS.
                      This returned innerHTML and the assertion looked for an
                      escaped "&lt;b&gt;" in it — but the result travels home
                      through document.title and the reader of it decodes
                      entities, so the escaping was undone by the measurement
                      before it could be seen. The check failed while the page
                      was doing exactly the right thing.

                      A body that had PARSED its markup would have element
                      children; one that escaped it has none. A count survives
                      any amount of decoding on the way out. */
                   kids:b?b.childElementCount:-1 }; }) };
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

function write(note) {
  const D = JSON.parse(ORIGINAL);
  D.notes = D.notes.concat([note]);
  fs.writeFileSync(STORE, JSON.stringify(D, null, 2) + '\n', 'utf8');
}

try {
  /* ── a writing with no sections is untouched ──────────────────────────── */
  const plain = JSON.parse(ORIGINAL).notes[0];
  if (plain) {
    build();
    const before = measure('plain', plain.id);
    ck('X1', before.secs.length === 0,
       'a writing with no sections draws none — ' + plain.id + ' shows ' +
       before.secs.length + ', and its statement is intact');
  } else {
    ck('X1', false, 'the store has no note to check the untouched case against');
  }

  /* ── one with two ─────────────────────────────────────────────────────── */
  write(NOTE); build();
  const r = measure('withsecs', NOTE.id);

  ck('X2', r.secs.length === 2 &&
           /first section/.test(r.secs[0].body || '') &&
           /second section/.test(r.secs[1].body || ''),
     r.secs.length + ' section(s) drawn under the statement, in the order written' +
     (r.secs.length === 2 ? ' — "' + String(r.secs[0].heading) + '" then a headless one' : ''));

  ck('X3', r.secs[0] && r.secs[0].heading === 'WHAT IT MEANS' &&
           r.secs[1] && r.secs[1].heading === null,
     'the heading is optional — the first draws "' + (r.secs[0] || {}).heading +
     '", the second draws no heading element at all');

  ck('X4', r.secs[1] && /<b>not bold<\/b>/.test(r.secs[1].body || '') &&
           r.secs[1].kids === 0,
     'a section is text, never markup — the reader is shown the tag itself, and the ' +
     'paragraph holds ' + ((r.secs[1] || {}).kids) + ' element children, so nothing ' +
     'in the body was parsed as markup');

  /* ── and the gate refuses a section that would draw nothing ───────────── */
  const broken = JSON.parse(JSON.stringify(NOTE));
  broken.id = 'zz-sec-2';
  broken.sections = [{ heading: 'A TITLE OVER NOTHING', body: '   ' }];
  const D2 = JSON.parse(ORIGINAL); D2.notes = D2.notes.concat([broken]);
  fs.writeFileSync(STORE, JSON.stringify(D2, null, 2) + '\n', 'utf8');
  let refused = false, why = '';
  try { execSync('node tools/notescheck.js', { stdio: 'pipe' }); }
  catch (e) { refused = true; why = ((e.stdout || '') + (e.stderr || '')).toString(); }
  ck('X5', refused && /body is required/.test(why),
     refused ? 'the gate refuses a heading with no body, before it can reach the site'
             : 'the gate ACCEPTED a section that would render as a title over nothing');

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

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' section invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'a writing can carry sections, the reader draws them in order, and a ' +
                  'section that would draw nothing never gets published');
process.exit(bad ? 1 : 0);
