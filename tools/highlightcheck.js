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
const tmp = (require('./scratch.js').root() + '/hl-' + process.pid).replace(/\\/g, '/');
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
                           phil:bright('philosophy'), works:bright('psychology'),
                           life:bright('life'), menu:M.dom().navRows}; }
  M.highlight(null); M.settle(40);
  var base=snap();
  M.highlight('philosophy'); M.settle(40); var hPhil=snap();
  M.highlight('psychology');   M.settle(40); var hWork=snap();
  /* a SECOND populated region, for the contrast test. An uncharted one cannot
     serve: its emblem has no world of bodies behind it, so hovering it lifts
     the reading by about 17 against a charted region's 370, and the check was
     measuring the difference between a full world and an empty one rather
     than whether the highlight works. */
  M.highlight('life');       M.settle(40); var hLife=snap();
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

  return {base:base, hPhil:hPhil, hWork:hWork, hLife:hLife, rel:rel, kb:kb,
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
   ', psychology=' + r.hWork.state.hoverRegion + ', none=' + r.base.state.hoverRegion);

/* H2 — the hovered world brightens AND the rest step back.

   THIS ASSERTION ONCE SURVIVED ITS OWN MUTATION, which means it proved
   nothing. It read "hovering philosophy raises philosophy's brightness", and
   that stayed true with the hover contrast deleted from the shader, because
   TWO mechanisms answer a hover and only one of them was being measured:

     here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;   the contrast
     float lift = (... hovered ...) ? 1.95 : 1.0;            the size

   lift scales gl_PointSize, so a hovered region's sprites grow by 1.95 and put
   more lit pixels inside a fixed probe box whatever the contrast line says.
   Brightness alone cannot tell the two apart.

   The dimming can. lift is exactly 1.0 for every region that is not hovered,
   so nothing but the contrast line can push another region DOWN — which is
   also what the source says the line is for: "the gap has to survive being
   seen through a lit surface, so it is a gap in BOTH directions rather than a
   brightening alone". Measuring both directions is therefore not a stricter
   version of the same claim, it is the claim.

   The floor is 10% of the region's own baseline, never an absolute figure,
   because regions carry wildly different amounts of light — and never smaller
   than 4, which is twice the +/-2 that H4 already treats as the noise in this
   measurement. Real dimming is to 30%, so the margin is wide. */
const h2Fall = r.base.life - r.hPhil.life;
const h2Floor = Math.max(4, r.base.life * 0.10);
ck('H2', r.hPhil.phil > r.base.phil &&
         h2Fall > h2Floor &&
         r.hWork.works >= r.base.works * 0.98,
   'the hovered world brightens and the others step back — philosophy ' +
   r.base.phil + ' -> ' + r.hPhil.phil + ', while life falls ' + h2Fall +
   ' (needs more than ' + Math.round(h2Floor) + '); hovering psychology leaves it at ' +
   r.base.works + ' -> ' + r.hWork.works);

/* H3 — the others recede, so the answer is unambiguous.

   This compared the two regions' ABSOLUTE brightness: hovering A had to leave
   A outshining B. That only holds between regions of similar population, and
   it held only because the region it used to test against was one of the
   busiest in the mind. Against an uncharted region it fails while the
   behaviour is perfectly correct — PHILOSOPHY has a charted world of bodies
   behind its emblem and simply carries more light, hovered or not.

   What "the others recede" actually means is a direction of change: each hover
   lifts its own region and does not lift the other. That is what is measured
   now, and it is true of any pair. */
const philRise = r.hPhil.phil - r.base.phil;
const philOtherMove = r.hPhil.life - r.base.life;
const lifeRise = r.hLife.life - r.base.life;
const lifeOtherMove = r.hLife.phil - r.base.phil;
ck('H3', philRise > 40 && philOtherMove <= 0 && lifeRise > 40 && lifeOtherMove <= 0,
   'each hover lifts its own region and recedes the other — philosophy ' +
   (philRise > 0 ? '+' : '') + philRise + ' while life moves ' +
   philOtherMove + '; life ' + (lifeRise > 0 ? '+' : '') + lifeRise +
   ' while philosophy moves ' + lifeOtherMove);

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
