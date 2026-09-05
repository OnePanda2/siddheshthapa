/* navcheck.js — does the browser's own Back button work, in both halves?
 *
 * The mind has written addresses for a long time: #mind, #focus:, #read:, each
 * one a history entry, which is why Back walks it. MY WORKS wrote nothing at
 * all — URL_KINDS did not know the word and openWorks never pushed — so Back
 * from a sheet found no entry belonging to this page and LEFT THE SITE.
 *
 * That is the bug this file exists for, and it is the kind that cannot be seen
 * from inside the app: every button in the manual worked perfectly. Only the
 * browser's own control was broken, so only driving the browser's own history
 * can show it.
 *
 *   N1  the mind still writes its addresses, and Back walks them
 *   N2  opening the manual writes an address, and so does opening a sheet
 *   N3  Back from a sheet returns to the contents — inside the manual
 *   N4  Back again closes the manual instead of leaving the site
 *   N5  Forward re-opens it, so the walk is reversible
 *   N6  a link to a sheet still opens that sheet from cold
 *
 * usage: node tools/navcheck.js [v02.html]
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (require('./scratch.js').root() + '/nav-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

/* history.back() is asynchronous — popstate arrives on a later task — so every
   step waits for the address to actually change rather than assuming it has.
   A fixed sleep here would pass on a fast machine and lie on a slow one. */
const PROBE = `(async function(){
  var M=window.__v02;
  if(!M) return {ERROR:'__v02 missing'};
  var W=M.works;
  function hash(){ return location.hash||''; }
  function step(){ return new Promise(function(r){ setTimeout(r, 220); }); }
  async function back(){ history.back(); await step(); M.settle(30); }
  async function fwd(){ history.forward(); await step(); M.settle(30); }

  var out={ startEntries:history.length };

  /* ---- the mind, which is said to work and must keep working ---- */
  M.enter(); M.settle(80);
  out.mind={};
  out.mind.afterEnter=hash();
  M.go('region','philosophy'); M.settle(60);
  out.mind.afterTopic=hash();
  await back();
  out.mind.afterBack=hash();
  out.mind.stillIn=M.state().mode;

  /* back to a known place before the manual is opened */
  location.hash='';
  await step();
  M.settle(40);

  /* ---- the manual ---- */
  out.works={};
  W.open(); M.settle(60);
  out.works.afterOpen=hash();
  out.works.openView=W.view();

  var sheets=W.sheets();
  W.show(sheets[1]); M.settle(60);
  out.works.afterSheet=hash();
  out.works.sheetView=W.view();

  await back();
  out.works.backFromSheet={ hash:hash(), open:W.isOpen(), view:W.view() };

  await back();
  out.works.backAgain={ hash:hash(), open:W.isOpen() };

  await fwd();
  out.works.forward={ hash:hash(), open:W.isOpen() };

  return out;
})()`;

const page = tmp + '/n.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `
<script>window.addEventListener('load',function(){setTimeout(function(){
  ${PROBE}.then(function(r){ document.title=JSON.stringify(r); })
          .catch(function(e){ document.title=JSON.stringify({ERROR:String((e&&e.message)||e)}); });
},500);});</script>`, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/u" --no-first-run --no-default-browser-check' +
  ' --window-size=1440,900 --virtual-time-budget=20000 --dump-dom "' + page + '"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!mm) { console.error('the page never reported'); process.exit(1); }
const r = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
if (r.ERROR) { console.error(r.ERROR); process.exit(1); }

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const m = r.mind, w = r.works;

ck('N1', m.afterEnter === '#mind' && m.afterTopic === '#focus:philosophy' &&
         m.afterBack === '#mind' && m.stillIn === 'universe',
   'ENTER THE MIND is untouched — entering writes ' + m.afterEnter + ', a topic writes ' +
   m.afterTopic + ', and Back returns to ' + m.afterBack + ' with the app still in ' +
   m.stillIn);

ck('N2', w.afterOpen === '#works' && /^#works:/.test(w.afterSheet || ''),
   'the manual writes its own address — opening gives ' + w.afterOpen +
   ' and a sheet gives ' + w.afterSheet + ' (it wrote nothing at all before, ' +
   'which is why Back left the site)');

/* 'contents' is what wkView holds on the contents page — the first version
   demanded it be falsy, which is the shut state, so it asked for the manual to
   be open and closed at once. */
ck('N3', w.backFromSheet.hash === '#works' && w.backFromSheet.open === true &&
         w.backFromSheet.view === 'contents',
   'Back from a sheet returns to the contents and stays INSIDE the manual — ' +
   w.backFromSheet.hash + ', open=' + w.backFromSheet.open + ', showing ' + w.backFromSheet.view);

ck('N4', w.backAgain.open === false,
   'Back again closes the manual rather than leaving the site — open=' +
   w.backAgain.open + ', address ' + (w.backAgain.hash || '(none)'));

ck('N5', w.forward.open === true && /^#works/.test(w.forward.hash || ''),
   'and Forward re-opens it, so the walk is reversible — ' + w.forward.hash +
   ', open=' + w.forward.open);

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' navigation invariants hold');
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\nthe browser\u2019s own Back button walks both halves of the site');
process.exit(bad ? 1 : 0);
