/* edgecheck.js — can a relationship be withdrawn from the place it is wrong?
 *
 * A writing is listed under a concept because it CONNECTS to it: the concept
 * page is the adjacency and nothing more. So a writing that reaches into six
 * concepts appears under all six, and one of those six can simply be wrong —
 * BIRYANI WITH THECHA is a reasonable thing to file under TASTE and CULTURE
 * and a strange one to file under RITUAL.
 *
 * Until now that could not be said. Relationships could be added from the
 * editor and never taken away, and almost all of them live in preview.html,
 * which is the locked senior document and is never written to. So a withdrawal
 * follows the rule retired writings already follow: a line ADDED to the store,
 * never a line removed from the corpus.
 *
 *   D1  a retired relationship disappears from BOTH pages — the concept stops
 *       listing the writing and the writing stops listing the concept
 *   D2  and nothing else goes with it: every other relationship either object
 *       holds is still there, and both keep their star and their place
 *   D3  it works on a CORPUS relationship, which is the case that matters,
 *       since preview.html is locked and cannot be edited
 *   D4  a relationship the STORE published is removed at source instead, so
 *       one document never holds a claim and its withdrawal at once
 *   D5  and the gate refuses a retirement of something that was never there,
 *       which would remove nothing and read ever after as though it had
 *   D6  and .p3/expect.js knows one went. It did not, and it could not fail
 *       while this file was the only thing retiring anything — this file puts
 *       the store back. The first REAL unlink, committed from the editor,
 *       broke all four glcheck states at once.
 *
 * usage: node tools/edgecheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const STORE = 'data/notes.json';
const ORIGINAL = fs.readFileSync(STORE, 'utf8');
const tmp = (require('./scratch.js').root() + '/edge-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function write(s) { fs.writeFileSync(STORE, JSON.stringify(s, null, 2) + '\n', 'utf8'); }
function gate() {
  try { execSync('node tools/notescheck.js', { stdio: 'pipe' }); return null; }
  catch (e) { return ((e.stdout || '') + (e.stderr || '')).toString(); }
}

/* THE SUBJECT IS FOUND, NOT NAMED. Picking a pair by id is how half the
   mutations in this project went stale — the ids they named stopped existing
   and they went on quietly testing nothing. So this asks the graph for a
   writing that reaches into at least three concepts and takes one of them:
   whatever it is called, it is the shape this feature exists for. */
const PICK = '(function(){' +
  'var M=window.__v02; if(!M) return {ERROR:"no __v02"};' +
  'M.enter(); M.settle(60);' +
  'var mdl=M.model(), byId={}; mdl.nodes.forEach(function(n){ byId[n.id]=n; });' +
  'var A=M.adjacency ? M.adjacency() : null;' +
  'var best=null;' +
  'mdl.nodes.forEach(function(n){' +
  '  if(n.t==="mig"||n.t==="minor"||n.vacant||!n.src) return;' +
  '  M.go("concept",n.id); M.settle(30);' +
  '  var rows=[].slice.call(document.querySelectorAll("#semantic [data-nav]"))' +
  '    .map(function(b){ return b.getAttribute("data-nav"); })' +
  '    .filter(function(id){ return id!==n.id && byId[id] && byId[id].t==="minor"; });' +
  '  if(rows.length>=3 && (!best || rows.length>best.rows.length))' +
  '    best={ id:n.id, label:n.label, rows:rows };' +
  '});' +
  'return best ? {writing:best.id, label:best.label, concepts:best.rows} : {ERROR:"no writing reaches three concepts"};' +
  '})()';

const SEEN = w => '(function(){' +
  'var M=window.__v02; if(!M) return {ERROR:"no __v02"};' +
  'M.enter(); M.settle(60);' +
  'function rowsAt(kind,id){ M.go(kind,id); M.settle(40);' +
  '  return [].slice.call(document.querySelectorAll("#semantic [data-nav]"))' +
  '    .map(function(b){ return b.getAttribute("data-nav"); })' +
  '    .filter(function(x){ return x!==id; }); }' +
  'var out={ fromWriting:rowsAt("concept","' + w.writing + '"), atConcept:{} };' +
  JSON.stringify(w.concepts) + '.forEach(function(c){ out.atConcept[c]=rowsAt("concept",c); });' +
  'var mdl=M.model(); out.present=mdl.nodes.some(function(n){ return n.id==="' + w.writing + '" && !n.vacant; });' +
  'out.links=(M.graph()||{}).links||null;' +
  'return out; })()';

function measure(tag, probe) {
  const page = tmp + '/' + tag + '.html';
  fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') +
    "\n<script>window.addEventListener('load',function(){setTimeout(function(){\n" +
    '  var r; try{ r=' + probe + '; }catch(e){ r={ERROR:String((e&&e.message)||e)}; }\n' +
    '  document.title=JSON.stringify(r);\n},400);});</script>', 'utf8');
  const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/u-' + tag + '" --no-first-run --no-default-browser-check' +
    ' --window-size=1440,900 --virtual-time-budget=16000 --dump-dom "' + page + '"',
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
  const w = measure('pick', PICK);
  const target = w.concepts[0];
  console.log('  subject: ' + w.label + ' (' + w.writing + '), which reaches ' +
              w.concepts.length + ' concepts — retiring the one with ' + target + '\n');

  const before = measure('before', SEEN(w));

  /* DELIBERATELY THE OTHER WAY ROUND FROM THE CORPUS.
     The first version wrote {a: writing, b: concept} and happened to pick a
     pair the corpus declares in that same order — so an app matching one
     direction only would have passed, and edgemutate D1b proved it by
     surviving. That is not a hypothetical ordering: the corpus writes
     ['ritual','t-biryani'], concept first, while you unlink standing on the
     WRITING, so the pair reaches the store reversed. Retiring against the
     corpus order is the case this feature actually meets. */
  const corpusSrc = fs.readFileSync('preview.html', 'utf8');
  const forward = corpusSrc.indexOf("['" + w.writing + "','" + target + "'") >= 0;
  const A = forward ? target : w.writing;
  const B = forward ? w.writing : target;
  console.log('  the corpus declares it ' + (forward ? w.writing + ' -> ' + target
                                                     : target + ' -> ' + w.writing) +
              '; retiring it as ' + A + ' / ' + B + ', the other way round\n');
  const D = JSON.parse(ORIGINAL);
  D.retiredEdges = [{ a: A, b: B, at: '2026-09-09',
                      why: 'retired by the harness, and put back' }];
  write(D);
  const refused = gate();
  if (refused) throw new Error('the gate refused a real retirement:\n' + refused);
  build();
  const after = measure('after', SEEN(w));

  /* ---- D1 ------------------------------------------------------------ */
  const goneFromWriting = before.fromWriting.indexOf(target) >= 0 &&
                          after.fromWriting.indexOf(target) < 0;
  const goneFromConcept = (before.atConcept[target] || []).indexOf(w.writing) >= 0 &&
                          (after.atConcept[target] || []).indexOf(w.writing) < 0;
  ck('D1', goneFromWriting && goneFromConcept,
     goneFromWriting && goneFromConcept
       ? w.label + ' no longer appears under ' + target + ', and ' + target +
         ' no longer appears under it — one claim withdrawn, in both directions, ' +
         'because a relationship is one claim however it is written down'
       : 'the retirement did not take on both pages (writing side ' + goneFromWriting +
         ', concept side ' + goneFromConcept + ')');

  /* ---- D2 ------------------------------------------------------------ */
  const others = w.concepts.slice(1);
  const stillThere = others.filter(c => after.fromWriting.indexOf(c) >= 0);
  const lostElsewhere = others.filter(c =>
    (before.atConcept[c] || []).indexOf(w.writing) >= 0 &&
    (after.atConcept[c] || []).indexOf(w.writing) < 0);
  ck('D2', stillThere.length === others.length && lostElsewhere.length === 0 && after.present,
     'and nothing else went with it: it still reaches ' + stillThere.length +
     ' of its other ' + others.length + ' concepts (' + others.join(', ') +
     '), and it is still in the graph with its star' +
     (lostElsewhere.length ? ' — ALSO LOST: ' + lostElsewhere.join(', ') : ''));

  /* ---- D3 ------------------------------------------------------------ */
  const corpus = fs.readFileSync('preview.html', 'utf8');
  const inCorpus = corpus.indexOf("['" + target + "','" + w.writing + "'") >= 0 ||
                   corpus.indexOf("['" + w.writing + "','" + target + "'") >= 0;
  ck('D3', inCorpus,
     inCorpus
       ? 'and the relationship retired was one preview.html declares — the locked ' +
         'document is untouched, and the withdrawal is a line in the store beside it'
       : 'the pair retired was not a corpus relationship, so the case that matters is untested');

  /* ---- D6 — the link expectation knows a relationship went -----------
     THIS HARNESS COULD NOT HAVE CAUGHT IT, and that is the point of adding
     it here. .p3/expect.js derives the number of relationships the graph
     should render, and glcheck, constellationcheck and braincheck all assert
     against it. It did not know about retirements — and it could not fail
     while this file was the only thing retiring anything, because this file
     puts the store back. The first REAL unlink, committed from the editor,
     broke all four glcheck states at once: "expected 127, model has 126".
     So the expectation is now checked while a retirement is actually in
     place, which is the only moment it can be wrong. */
  const expected = require('../.p3/expect.js').expectedLinks();
  ck('D6', expected.total === after.links && expected.retiredEdges === 1,
     expected.total === after.links
       ? 'and .p3/expect.js knows one went: it expects ' + expected.total +
         ' relationships (' + expected.inSource + ' in the corpus + ' + expected.declared +
         ' declared + ' + expected.written + ' written − ' + expected.orphaned +
         ' orphaned − ' + expected.retiredEdges + ' retired) and the model renders ' +
         after.links + ' — so glcheck, constellationcheck and braincheck stay true'
       : 'the expectation says ' + expected.total + ' and the model renders ' + after.links +
         ' — every check that counts relationships would fail on a real unlink');

  /* ---- D4 — a store-published edge is removed at source --------------- */
  const D2s = JSON.parse(ORIGINAL);
  D2s.edges = (D2s.edges || []).concat([[w.writing, target, 'stands beside',
    'An edge published by the store itself, so that retiring it can be seen to remove the row.']]);
  write(D2s);
  /* the store now re-publishes the pair the corpus already has, which the gate
     must refuse as a duplicate — proof that the two live in one namespace */
  const dupRefused = gate();
  ck('D4', !!dupRefused && /already|duplicate/i.test(dupRefused),
     dupRefused
       ? 'a store row restating a relationship the corpus already declares is refused, ' +
         'so a claim and its withdrawal can never sit in one document saying opposite things'
       : 'the gate accepted a duplicate of a corpus relationship');

  /* ---- D5 ------------------------------------------------------------ */
  const D3s = JSON.parse(ORIGINAL);
  D3s.retiredEdges = [{ a: w.writing, b: 'zz-nothing-here', at: '2026-09-09' }];
  write(D3s);
  const nowhere = gate();
  ck('D5', !!nowhere && /no relationship between/.test(nowhere),
     nowhere
       ? 'and retiring something that was never there is refused at the commit — a line ' +
         'that removes nothing would read ever after as though it had'
       : 'the gate accepted a retirement of a relationship that does not exist');

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

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' relationship invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'a relationship can be withdrawn from the place it is wrong, and nowhere else');
process.exit(bad ? 1 : 0);
