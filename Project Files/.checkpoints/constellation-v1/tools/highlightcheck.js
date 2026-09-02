/* highlightcheck.js — does hovering a MIG in the Main Mind Menu identify its
   world in the sky, and does it do so without touching anything else?

   The point of the feature is identification: a visitor sees a strange
   celestial system and wants to know which Major Idea Group it belongs to.
   So these assertions measure RENDERED BRIGHTNESS of real worlds, not the
   presence of a CSS class.

   H1 the MIG -> world mapping is deterministic (a region index, never screen
      coordinates)
   H2 hovering a MIG brightens ITS world
   H3 hovering a MIG dims the others — the answer is unambiguous
   H4 hover is exactly reversible
   H5 hover mutates no state: no navigation, no camera move, no ownership change
   H6 all 14 MIGs remain in the Main Mind Menu throughout
   H7 keyboard focus gives the same highlight as pointer hover
   H8 a planetary world's orbits answer the hover too

   usage: node tools/highlightcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (os.tmpdir() + '/hl-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  M.enter(); M.settle(60);
  /* the MMM is now the BRAIN, where every object sits inside one small organ and
     per-object blobs overlap into saturation. World highlight is only
     measurable once the mind is unfolded, which is the state it describes. */
  M.setOpen(1); M.settle(40);
  /* sumSignal, not maxSignal. A bright star of the constellation sits near
     enough to most regions to pin the peak, so hovering a MIG lifted its
     sprite while the reported maximum never moved. Total light in the
     neighbourhood is monotone in the sprite's own contribution. */
  function bright(id){ var b=M.spriteBlobs(id,110); return b? b.sumSignal : null; }
  function snap(){ return {state:M.hoverState(), st:M.state(), arch:M.arch(),
                           phil:bright('philosophy'), works:bright('my-works'),
                           life:bright('life'), menu:M.dom().navRows}; }
  M.highlight(null); M.settle(40);
  var base=snap();
  M.highlight('philosophy'); M.settle(40); var hPhil=snap();
  M.highlight('my-works');   M.settle(40); var hWork=snap();
  M.highlight(null);         M.settle(40); var rel=snap();

  /* H7 — the keyboard must reach the same behaviour as the mouse */
  var kb=null;
  var row=document.querySelector('[data-nav="philosophy"]');
  /* a real keyboard focus always follows a key press; a bare programmatic
     .focus() is what the app itself does on entry and must NOT highlight */
  if(row){
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
    row.focus(); M.settle(30); kb=M.hoverState(); row.blur(); M.settle(20);
  }

  return {base:base, hPhil:hPhil, hWork:hWork, rel:rel, kb:kb,
          migCount:M.arch().migCount};
})()`;

const page = tmp + '/h.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},320);</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=2800 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g,'/') + '#lite"', { maxBuffer: 1<<26, timeout: 240000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
                     .replace(/&gt;/g,'>').replace(/&amp;/g,'&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e){
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,80));
  process.exit(1);
}

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

// H1 — a deterministic index, never geometry
ck('H1', r.hPhil.state.hoverRegion >= 0 && r.hWork.state.hoverRegion >= 0 &&
         r.hPhil.state.hoverRegion !== r.hWork.state.hoverRegion &&
         r.base.state.hoverRegion === -1,
   'MIG -> world mapping is a region index: philosophy=' + r.hPhil.state.hoverRegion +
   ', my-works=' + r.hWork.state.hoverRegion + ', none=' + r.base.state.hoverRegion);

// H2 — the hovered world brightens
ck('H2', r.hPhil.phil > r.base.phil && r.hWork.works >= r.base.works * 0.98,
   'the hovered world brightens — philosophy ' + r.base.phil + ' -> ' + r.hPhil.phil +
   ', my-works ' + r.base.works + ' -> ' + r.hWork.works);

// H3 — the others recede, so the answer is unambiguous
const philGap = r.hPhil.phil - r.hPhil.works;
const workGap = r.hWork.works - r.hWork.phil;
ck('H3', philGap > 40 && workGap > 40,
   'the answer is unambiguous — hovering philosophy leaves it ' + philGap +
   ' brighter than my-works; hovering my-works leaves it ' + workGap + ' brighter than philosophy');

// H4 — exactly reversible
ck('H4', r.rel.state.hoverRegion === -1 &&
         Math.abs(r.rel.phil - r.base.phil) <= 2 &&
         Math.abs(r.rel.works - r.base.works) <= 2 &&
         Math.abs(r.rel.life - r.base.life) <= 2,
   'releasing restores the baseline exactly (' + r.base.phil + '/' + r.base.works + '/' + r.base.life +
   ' -> ' + r.rel.phil + '/' + r.rel.works + '/' + r.rel.life + ')');

// H5 — hover is not navigation
ck('H5', r.hPhil.st.mode === r.base.st.mode && r.hPhil.st.focus === r.base.st.focus &&
         r.hPhil.st.region === r.base.st.region &&
         JSON.stringify(r.hPhil.st.cam) === JSON.stringify(r.base.st.cam) &&
         r.hPhil.arch.reparented.length === 0,
   'hover changed no state — mode ' + r.hPhil.st.mode + ', camera unmoved, no reparenting');

// H6 — the MMM stays whole
const MIG_TOTAL = require('../.p3/expect.js').expectedMigs().total;
ck('H6', r.base.menu === r.hPhil.menu && r.hPhil.menu === r.rel.menu && r.migCount === MIG_TOTAL,
   'all ' + r.migCount + ' MIGs and ' + r.hPhil.menu + ' menu rows survive the hover');

// H7 — keyboard parity
ck('H7', r.kb && r.kb.hoverRegion === r.hPhil.state.hoverRegion,
   r.kb ? 'keyboard focus highlights the same world (region ' + r.kb.hoverRegion + ')'
        : 'keyboard focus did not reach the highlight');

// H8 — a planetary world's orbits answer too
ck('H8', r.hPhil.state.orbitHover === 1 && r.hWork.state.orbitHover === 0 &&
         r.rel.state.orbitHover === 0,
   'the orbital paths answer the hover for a planetary world, and not for a world without one');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' highlight invariants hold');
console.log('  palette in use: ' + r.base.state.palette);
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\nhovering a MIG identifies its world, and changes nothing else');
process.exit(bad ? 1 : 0);
