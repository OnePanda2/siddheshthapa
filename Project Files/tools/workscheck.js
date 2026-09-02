/* workscheck.js — MY WORKS is the manual, and these assertions test one.

   The content rule is the architecture (WORKS-MANUAL-SPEC §1): Tier 1 is
   DERIVED from the locked graph and never restated, Tier 2 is DECLARED in
   data/works.json, Tier 3 is forbidden. Most of what follows exists to make
   drift between the manual and the mind structurally impossible rather than
   merely discouraged — a sheet that restated a label would create a second
   truth about the same object, and no amount of care prevents that; a check
   does.

   Every number is measured from the live DOM through window.__v02.works. This
   file computes no content, so a check can never quietly agree with a copy of
   the thing it is checking.

   Runs at two viewports. The manual's composition changes at 760px — the two
   columns collapse and the figure starts to scroll inside itself — so one
   width proves nothing about the other.

   usage: node tools/workscheck.js [v02.html]
*/
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';

const tmp = (require('./scratch.js').root() + '/wc-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });

/* TIER-1 FIELD NAMES. If one of these appears in a works.json record, the
   manual has begun keeping its own copy of something the graph declares. */
const DERIVED = ['label', 'line', 'src', 'state', 'register', 'mig', 'crosses', 't'];

fs.writeFileSync(tmp + '/p.html', fs.readFileSync(FILE, 'utf8') + `
<script>
setTimeout(function(){
  var out={};
  try{
    var M=window.__v02, W=M.works;
    if(!M.ok()){ document.title=JSON.stringify({ERROR:'no webgl'}); return; }

    out.vw=window.innerWidth; out.vh=window.innerHeight;
    out.data=W.data();
    out.sheets=W.sheets();
    out.written=W.written();
    out.figures=Object.keys(W.figures()).map(function(k){
      return { key:k, parts:W.figures()[k].parts };
    });

    /* the graph's own count of what belongs in this manual */
    out.nodeCheck=W.sheets().map(function(id){
      var n=W.node(id);
      return { id:id, exists:!!n, mig:n?n.mig:null, t:n?n.t:null };
    });

    /* W7 — the scene stops while the manual is up.
       Asked of scenePaused(), which is the predicate the render loop itself
       calls, not a restatement of it. Counting real frames was tried first and
       is useless here: requestAnimationFrame does not run under headless
       virtual time, so both readings were zero and the check passed for the
       wrong reason. */
    out.pausedBefore=M.paused();
    W.open();
    out.openView=W.view();
    out.openIsOpen=W.isOpen();
    out.pausedDuring=M.paused();

    /* W8 — never both. The mind's own layers must be inert. */
    out.bodyClass=document.body.className;
    out.thresholdVis=getComputedStyle(document.getElementById('threshold')).display;
    out.semanticVis=getComputedStyle(document.getElementById('semantic')).display;

    /* the contents page. ITS OVERFLOW IS MEASURED HERE, not on a sheet: the
       grid that pushed past the right edge is the contents list, and reading
       the width while a sheet was up meant W10 never looked at it. */
    out.overflowContents=document.documentElement.scrollWidth > window.innerWidth;
    /* AND THE ROWS THEMSELVES. Chrome will not open a window narrower than
       ~500px, so the document-level overflow this started as is not reachable
       headless. The defect is really "a row is wider than the box it was
       given" — a grid column that refuses to shrink — and that is measurable
       at any width. */
    out.rowOverflow=Math.max.apply(null,
      [0].concat([].map.call(document.querySelectorAll('.wk-toc button'),
        function(b){ return b.scrollWidth - b.clientWidth; })));
    out.tocRows=document.querySelectorAll('.wk-toc button').length;
    out.tocIds=[].map.call(document.querySelectorAll('.wk-toc button'),
                           function(b){ return b.getAttribute('data-sheet'); });

    /* a written sheet */
    W.show('p-cotsi');
    out.sheetView=W.view();
    out.sheetName=(document.querySelector('.wk-name')||{}).textContent;
    out.stamp=(document.querySelector('.wk-stamp')||{}).textContent;
    out.steps=document.querySelectorAll('.wk-steps li').length;
    out.partNos=[].map.call(document.querySelectorAll('.wk-parts li b'),
                            function(b){ return parseInt(b.textContent,10); });
    out.fails=document.querySelectorAll('.wk-fail li').length;
    out.plate=[].map.call(document.querySelectorAll('.wk-plate span'),
                          function(s){ return s.textContent; });
    out.figPartNos=[].map.call(document.querySelectorAll('.wk-svg text'),
                          function(t){ return t.textContent; })
                      .filter(function(s){ return /^0[0-9]$/.test(s); })
                      .map(function(s){ return parseInt(s,10); });

    /* W4 — every strip entry is a real edge, in the graph's own verb */
    out.see=[].map.call(document.querySelectorAll('[data-see]'), function(b){
      return { id:b.getAttribute('data-see'),
               sibling:b.hasAttribute('data-sheet-link'),
               verb:(b.querySelector('.wk-see-v')||{}).textContent||'' };
    });
    /* TRUTH COMES FROM THE GRAPH, NOT FROM THE MANUAL. Read from W.seeAlso()
       first, which is the helper the strip is built with — so a mutation that
       fabricated an entry fabricated it on both sides and W4 passed. */
    out.seeTruth=M.edgesOf('p-cotsi').map(function(e){
      return { id: e.a === 'p-cotsi' ? e.b : e.a, verb: e.verb };
    });

    /* W10 — EVERY SHEET, not whichever one happened to be open. Measured on a
       single sheet this said "clean" while another one scrolled sideways: a
       drawing is authored per sheet, so the risk is per sheet too.

       The layer is measured as well as the document. #works sets
       overflow-y:auto, and CSS computes the other axis to auto alongside it,
       so the layer quietly absorbs sideways overflow and the DOCUMENT never
       grows to show it. */
    var wkEl=document.getElementById('works');
    out.perSheet={};
    W.sheets().forEach(function(id){
      W.show(id);
      var fsc=document.querySelector('.wk-figscroll');
      out.perSheet[id]={
        doc:document.documentElement.scrollWidth > window.innerWidth,
        layer:wkEl.scrollWidth - wkEl.clientWidth,
        figScrolls:fsc ? (fsc.scrollWidth > fsc.clientWidth) : null,
        /* W6, per sheet: the numbers in the parts list, and the numbers drawn
           in the figure. Checked on p-cotsi alone this said the manual was
           consistent while another sheet's drawing could have drifted. */
        partNos:[].map.call(document.querySelectorAll('.wk-parts li b'),
                  function(b){ return parseInt(b.textContent,10); }),
        figNos:[].map.call(document.querySelectorAll('.wk-svg text'),
                  function(x){ return x.textContent; })
                 .filter(function(s){ return /^0[0-9]$/.test(s); })
                 .map(function(s){ return parseInt(s,10); }),
        hasFigure:!!document.querySelector('.wk-svg'),
        plate:(document.querySelector('.wk-plate span')||{}).textContent||'',
        cap:(document.querySelector('.wk-cap')||{}).textContent||''
      };
    });
    W.show('p-cotsi');
    out.overflowX=out.perSheet['p-cotsi'].doc;
    out.layerOverflow=out.perSheet['p-cotsi'].layer;
    out.figScrolls=out.perSheet['p-cotsi'].figScrolls;

    /* W5 — a reserved sheet is stamped, not empty */
    W.show('p-statelab');
    out.reserved={
      name:(document.querySelector('.wk-name')||{}).textContent,
      stamp:(document.querySelector('.wk-stamp')||{}).textContent,
      hasNone:!!document.querySelector('.wk-none'),
      steps:document.querySelectorAll('.wk-steps li').length,
      /* the derived tier is still on the page */
      hasLine:!!document.querySelector('.wk-line'),
      plate:[].map.call(document.querySelectorAll('.wk-plate span'),
                        function(s){ return s.textContent; }),
      see:document.querySelectorAll('[data-see]').length
    };

    /* W9 — Escape steps back one level, then closes */
    function esc(){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }
    esc(); out.escOnce=W.view();
    esc(); out.escTwice=W.isOpen();
    out.pausedAfter=M.paused();
    out.focusAfter=document.activeElement ? document.activeElement.id : null;

    out.perf=M.perf();
  }catch(e){ out.ERROR=(e&&e.message)||String(e); }
  document.title=JSON.stringify(out);
},400);</script>`, 'utf8');

function run(w, h, tag){
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr-' + tag + '" --no-first-run --no-default-browser-check' +
    ' --disable-extensions --disable-background-networking --disable-sync' +
    ' --window-size=' + w + ',' + h + ' --virtual-time-budget=9000' +
    /* SNAP THE TRANSITIONS. #threshold transitions visibility, and a computed
       style read mid-transition still reports 'visible' — which failed W8 for
       a reason that has nothing to do with whether the layer is modal. */
    ' --force-prefers-reduced-motion' +
    ' --dump-dom "file:///' + tmp + '/p.html"',
    { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
  const m = dom.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) { console.error('  the page never reported at ' + w + 'x' + h); process.exit(1); }
  const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                           .replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  if (r.ERROR) { console.error('  ' + r.ERROR + ' at ' + w + 'x' + h); process.exit(1); }
  return r;
}

const r  = run(1280, 900, 'desk');
const rp = run(390, 844, 'phone');

let bad = 0;
const TOTAL = 10;
function ck(id, ok, msg){
  if(!ok) bad++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + id.padEnd(4) + '  ' + msg);
}

/* W1 — every sheet is a real work in the graph */
const strays = r.nodeCheck.filter(n => !n.exists || n.mig !== 'my-works' ||
                                       n.t === 'mig' || n.t === 'minor');
ck('W1', r.sheets.length > 0 && strays.length === 0,
   'every sheet is a work the graph declares — ' + r.sheets.length +
   ' sheets, all filed under my-works' +
   (strays.length ? ' — STRAY: ' + strays.map(s => s.id).join(', ') : ''));

/* W2 — the manual keeps no copy of anything the graph declares */
const restated = [];
(r.data.sheets || []).forEach(sh => {
  DERIVED.forEach(f => { if(Object.prototype.hasOwnProperty.call(sh, f))
    restated.push(sh.node + '.' + f); });
});
ck('W2', restated.length === 0,
   'no sheet restates a field the graph owns — ' + DERIVED.length +
   ' derived names checked against ' + (r.data.sheets || []).length + ' record(s)' +
   (restated.length ? ' — RESTATED: ' + restated.join(', ') : ''));

/* W3 — the numbering is derived from the graph, not typed into a sheet */
const m = r.sheets.length;
const plateOk = r.plate.length === 2 &&
                r.plate[0] === 'Sheet 01 of ' + (m < 10 ? '0' + m : m);
/* and the figure number tracks the sheet number, on every sheet that has a
   drawing. Typed by hand into each caption, they disagreed the moment a third
   sheet reordered the set: "Fig. 3.1" appeared on sheet 02. */
const capMismatch = [];
Object.keys(r.perSheet).forEach(id => {
  const p = r.perSheet[id];
  if(!p.cap) return;
  const sheetNo = (p.plate.match(/Sheet (\d+)/) || [])[1];
  const figNo = (p.cap.match(/Fig\. (\d+)/) || [])[1];
  if(sheetNo !== figNo) capMismatch.push(id + ' sheet ' + sheetNo + ' fig ' + figNo);
});
ck('W3', plateOk && capMismatch.length === 0,
   'sheet numbering is derived, and the figures follow it — "' +
   (r.plate[0] || '(none)') + '" against ' + m + ' works in the graph' +
   (capMismatch.length ? ' — MISMATCH: ' + capMismatch.join(', ') : ''));

/* W4 — every entry in the band of night is a relationship the graph holds.
   Checked against the graph's own edge list, not against the rendered text,
   so a hand-written "see also" could not pass. */
const truth = {};
(r.seeTruth || []).forEach(t => { truth[t.id] = t.verb; });
const invented = r.see.filter(s => !truth[s.id]);
const wrongVerb = r.see.filter(s => truth[s.id] && s.verb.indexOf(truth[s.id]) < 0);
ck('W4', r.see.length > 0 && invented.length === 0 && wrongVerb.length === 0,
   'every entry in the night band is a real edge, printed with its own verb — ' +
   r.see.length + ' of them' +
   (invented.length ? ' — INVENTED: ' + invented.map(s => s.id).join(', ') : '') +
   (wrongVerb.length ? ' — WRONG VERB: ' + wrongVerb.map(s => s.id).join(', ') : ''));

/* W5 — an undocumented work is reserved, not hidden and not padded */
const rv = r.reserved;
ck('W5', rv.stamp === 'not yet written' && rv.hasNone && rv.steps === 0 &&
         rv.hasLine && rv.plate.length === 2 && rv.see > 0,
   'an undocumented work is a reserved sheet, not an empty one — ' + rv.name +
   ' stamped "' + rv.stamp + '", 0 steps, and its derived tier still printed (' +
   rv.see + ' relationships)');

/* W6 — no drawing has drifted from its own parts list, on any sheet */
const num = a => a.slice().sort((x, y) => x - y).join('/');
const drifted = [];
let figuresChecked = 0;
(r.data.sheets || []).forEach(sh => {
  const p = r.perSheet[sh.node];
  if(!p) return;
  const declaredNos = (sh.parts || []).map(q => q.n);
  if(num(p.partNos) !== num(declaredNos))
    drifted.push(sh.node + ' list ' + num(p.partNos) + ' vs declared ' + num(declaredNos));
  if(sh.figure){
    figuresChecked++;
    if(!p.hasFigure) drifted.push(sh.node + ' declares a figure and drew none');
    else if(num(p.figNos) !== num(declaredNos))
      drifted.push(sh.node + ' drew ' + num(p.figNos) + ' vs parts ' + num(declaredNos));
  }
});
ck('W6', figuresChecked > 0 && drifted.length === 0,
   'every drawing is numbered to match its own parts list — ' + figuresChecked +
   ' figure(s) across ' + (r.data.sheets || []).length + ' written sheet(s)' +
   (drifted.length ? ' — DRIFTED: ' + drifted.join('; ') : ''));

/* W7 — the scene stops while the manual is up. Measured over real time,
   because settle() drives the renderer directly and would walk past the
   guard this asserts. */
ck('W7', r.pausedBefore === false && r.pausedDuring === true && r.pausedAfter === false,
   'the scene pauses behind the manual and restarts after it — running, ' +
   'paused, running');

/* W8 — a modal layer is actually modal */
ck('W8', /works-open/.test(r.bodyClass) &&
         r.thresholdVis === 'none' && r.semanticVis === 'none',
   'nothing behind the manual is reachable while it is open — threshold ' +
   r.thresholdVis + ', region sheet ' + r.semanticVis);

/* W9 — Escape steps back one level rather than dropping you out */
ck('W9', r.escOnce === 'contents' && r.escTwice === false,
   'Escape steps back one level — a sheet returns to the contents, the ' +
   'contents close the manual' +
   (r.focusAfter ? ' (focus lands on #' + r.focusAfter + ')' : ''));

/* W10 — and none of it scrolls sideways, at either composition */
const wide = [];
[[r,'desktop'],[rp,'phone']].forEach(([res,tag]) => {
  Object.keys(res.perSheet).forEach(id => {
    const p = res.perSheet[id];
    if(p.doc || p.layer !== 0) wide.push(tag + ':' + id + ' by ' + p.layer + 'px');
  });
});
ck('W10', wide.length === 0 &&
          r.overflowContents === false && rp.overflowContents === false &&
          r.rowOverflow === 0 && rp.rowOverflow === 0 &&
          rp.figScrolls === true,
   'nothing is wider than the box it was given — page and rows clean at ' +
   r.vw + 'x' + r.vh + ' and ' + rp.vw + 'x' + rp.vh +
   ' — all ' + Object.keys(r.perSheet).length + ' sheets, contents included' +
   (wide.length ? ' — WIDE: ' + wide.join(', ') : '') +
   ' — and only the drawing scrolls, inside itself');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' manual invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)'
                : '  the manual cannot drift from the mind it came out of');
process.exit(bad ? 1 : 0);
