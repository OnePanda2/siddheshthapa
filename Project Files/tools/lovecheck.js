/* lovecheck.js — is LOVE a genuinely different world, or Philosophy in warm
   paint?

   The brief (§20) is explicit that asserting LOVE_PALETTE !== PHIL_PALETTE
   would be trivially gameable, so nothing here tests colour. Every assertion
   is either a STRUCTURAL property of the system or a measurement taken off the
   rendered framebuffer.

   L1  LOVE is a real circumbinary system and its data separates measured from
       derived from illustrative
   L2  it has TWO stellar centres; Philosophy has one
   L3  the two stars are diametrically opposite through their barycentre
   L4  their offsets hold the MEASURED mass ratio, at every phase
   L5  the innermost orbit sits at the measured planet/binary ratio — the
       hollow centre is astronomy, not styling
   L6  the barycentre is empty and nothing orbits inside the stability radius
   L7  star B is render-only: it is in the geometry and NOT in the mind
   L8  the pair RENDERS as two separated lights (luminance profile, not code)
   L9  the two worlds differ structurally: centres, body count, spread, and
       where the spread comes from
   L10 the illustrative eccentricity is never presented as measured
   L11 one hover implementation serves both worlds
   L12 Philosophy is not disturbed: TRAPPIST-1 ratios still exact

   usage: node tools/lovecheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const DATA = 'data/astronomy-systems.json';
const tmp = (require('./scratch.js').root() + '/lv-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  M.enter(); M.settle(60);
  /* enterMind parks focus on the first menu row inside a setTimeout, so
     sampling right after enter() sees a moment BEFORE the thing under test.
     Do what the app does, synchronously, then look. */
  var firstRow=document.querySelector('#groups [data-nav]');
  if(firstRow) firstRow.focus();
  M.settle(20);
  var onEntry={ hoverState:M.hoverState(), focused:document.activeElement &&
                document.activeElement.getAttribute &&
                document.activeElement.getAttribute('data-nav') };
  var menu=M.menuRows(), counts=M.counts();
  var uni={ love:(M.spriteBlobs('love',76)||{}).sumSignal,
            phil:(M.spriteBlobs('philosophy',76)||{}).sumSignal };
  M.highlight('love');       M.settle(40);
  var hLove={ love:(M.spriteBlobs('love',76)||{}).sumSignal,
              phil:(M.spriteBlobs('philosophy',76)||{}).sumSignal,
              st:M.hoverState() };
  M.highlight('philosophy'); M.settle(40);
  var hPhil={ love:(M.spriteBlobs('love',76)||{}).sumSignal,
              phil:(M.spriteBlobs('philosophy',76)||{}).sumSignal,
              st:M.hoverState() };
  M.highlight(null);         M.settle(40);
  var rel={ love:(M.spriteBlobs('love',76)||{}).sumSignal,
            phil:(M.spriteBlobs('philosophy',76)||{}).sumSignal };

  M.go('region','love'); M.settle(150);
  var bin=M.binary(), prof=M.binaryProfile('love'), astro=M.astro(), arch=M.arch();
  var near=M.near('love', bin.worlds.love.stability);
  return { bin:bin, prof:prof, astro:astro, arch:arch, near:near, menu:menu, counts:counts,
           onEntry:onEntry,
           uni:uni, hLove:hLove, hPhil:hPhil, rel:rel,
           graph:M.graph(), perf:M.perf() };
})()`;

const page = tmp + '/l.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},420);</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=4200 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 300000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>').replace(/&amp;/g, '&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e) {
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0, 90));
  process.exit(1);
}

const D = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const K = (D.systems || []).find(s => s.system === 'Kepler-16') || {};
const W = (r.bin.worlds || {}).love || {};

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// L1 — a real system, with provenance kept apart
ck('L1', K.sourceType === 'circumbinary-system' && !!K.measured && !!K.derived &&
         !!K.illustrative && /NOT ASTRONOMY/.test(K.illustrative._warning || '') &&
         K.measured.stars.count === 2 && K.measured.binary.eccentric === true,
   'LOVE is Kepler-16, a real circumbinary system, with measured/derived/illustrative kept apart');

// L2 — two centres against one
ck('L2', W.companionCount === 1 && !r.bin.worlds.philosophy && r.bin.totalCompanions === 1,
   'LOVE has TWO stellar centres; Philosophy has one (companions: love=' +
   W.companionCount + ', total=' + r.bin.totalCompanions + ')');

// L3 — bound means opposite
ck('L3', near(W.oppositeDeg, 180, 0.5),
   'the two stars are diametrically opposite through the barycentre (' + W.oppositeDeg + ' deg)');

// L4 — and the offsets carry the measured mass ratio
const ratio = W.offB / W.offA, want = K.derived.swingRatioBoverA;
ck('L4', near(ratio, want, want * 0.002),
   'their offsets hold the MEASURED mass ratio — offB/offA ' + ratio.toFixed(4) +
   ' vs 0.6897/0.20 = ' + want);

// L5 — the hollow centre is astronomy
const r0 = W.orbitRadii[0], measuredRatio = K.derived.planetToBinaryRatio;
ck('L5', near(r0 / W.aBin, measuredRatio, 0.001),
   'the innermost orbit sits at the measured planet/binary ratio — ' +
   (r0 / W.aBin).toFixed(5) + ' vs ' + measuredRatio + ' (the hollow centre is measured, not styled)');

// L6 — and nothing lives in it
ck('L6', Array.isArray(r.near) ? r.near.length === 0 : (r.near && r.near.count === 0),
   'nothing orbits inside the stability radius (' + W.stability.toFixed(1) +
   ' units): ' + (Array.isArray(r.near) ? r.near.length : (r.near && r.near.count)) + ' bodies');

// L7 — star B is structure, never an idea
const EXP = require('../.p3/expect.js');
const MIG_TOTAL = EXP.expectedMigs().total, NODE_TOTAL = EXP.expectedNodes().total;
ck('L7', W.starBIsGraphNode === false && r.arch.migCount === MIG_TOTAL &&
         r.arch.reparented.length === 0 &&
         r.bin.renderedPoints === r.bin.placedNodes + r.bin.renderOnly,
   'star B is render-only — ' + r.bin.placedNodes + ' placed nodes + ' + r.bin.renderOnly +
   ' render-only bodies (' + r.bin.totalCompanions + ' companion + ' +
   (r.bin.renderOnly - r.bin.totalCompanions) + ' constellation sky) = ' +
   r.bin.renderedPoints + ' points, 14 MIGs, nothing reparented');

/* L8 — it must READ as two, off the framebuffer.
   The first version of this trusted the app's own bothVisible/separated flags,
   whose floor of 18 was below the brightness of the axis LINE running between
   the stars — so hiding star B entirely still "passed". Both mutations
   survived. The thresholds live here now, and they are absolute: a star has to
   outshine the line drawn through it. */
const P = r.prof || {};
/* The floor is RELATIVE now, not an absolute calibrated against a page that no
   longer exists. Its purpose was always that a star must outshine whatever path
   crosses the sample line through it — and the trough measures exactly that
   crossing light, so comparing to it says the same thing without being tied to
   a palette. The absolute minimum only stops a blank frame passing. */
const FLOOR = 40;
ck('L8', P.peakA >= FLOOR && P.peakB >= FLOOR && P.sepPx >= 24 &&
         P.trough < Math.min(P.peakA, P.peakB) * 0.55 &&
         Math.min(P.peakA, P.peakB) >= P.trough * 5,
   'the pair RENDERS as two separated lights — peaks ' + P.peakA + '/' + P.peakB +
   ', each at least five times the ' + P.trough + ' of whatever crosses between ' +
   'them, ' + P.sepPx + 'px apart');

/* L9 — structurally different worlds, not a recolour.
   Comparing spreads was too coarse: disabling LOVE's slot rule entirely still
   left the spreads far apart, so the assertion survived a mutation that
   destroyed the thing it claimed to pin. Pin the actual RULE each world's
   spacing obeys — LOVE every step equal to the declared ratio, Philosophy
   every step equal to a different MEASURED axis ratio. */
const pOrb = (r.astro.orbits.philosophy || []).map(o => o.r);
const lOrb = W.orbitRadii;
const T0 = D.systems.find(s => s.system === 'TRAPPIST-1');
const step = K.illustrative.orbitSpacingStep;
const lSteps = lOrb.slice(1).map((v, i) => v / lOrb[i]);
const pSteps = pOrb.slice(1).map((v, i) => v / pOrb[i]);
const pWant = T0.semiMajorAxisAU.slice(1).map((v, i) => v / T0.semiMajorAxisAU[i]);
const loveGeometric = lSteps.every(v => near(v, step, 0.002));
const philMeasured = pSteps.length === pWant.length &&
                     pSteps.every((v, i) => near(v, pWant[i], 0.002));
const philNotGeometric = !pSteps.every(v => near(v, pSteps[0], 0.002));
const lSpread = lOrb[lOrb.length - 1] / lOrb[0], pSpread = pOrb[pOrb.length - 1] / pOrb[0];
ck('L9', W.companionCount === 1 && lOrb.length !== pOrb.length &&
         loveGeometric && philMeasured && philNotGeometric,
   'the worlds obey DIFFERENT spacing laws — LOVE is geometric at the declared ' +
   step + 'x every step (' + lSteps.map(v => v.toFixed(3)).join(', ') +
   '), Philosophy follows uneven MEASURED axis ratios (' +
   pSteps.map(v => v.toFixed(3)).join(', ') + '); ' + lOrb.length + ' bodies vs ' +
   pOrb.length + ', spread ' + lSpread.toFixed(2) + 'x vs ' + pSpread.toFixed(2) + 'x');

// L10 — never launder an illustrative number into a measurement
const illKeys = Object.keys(K.illustrative || {}).filter(k => k[0] !== '_');
const leaked = illKeys.filter(k => K.measured && K.measured[k] !== undefined);
ck('L10', leaked.length === 0 && K.measured.binary.eccentricity === undefined &&
          typeof K.illustrative.binaryEccentricity === 'number' &&
          (K.unverified || {}).binaryEccentricityValue !== undefined &&
          W.eccMeasured === false,
   'the binary eccentricity is drawn but never claimed as measured — it lives in ' +
   'illustrative (' + K.illustrative.binaryEccentricity + ') and is recorded in unverified');

// L11 — one hover implementation, two world types
const loveGain = r.hLove.love - r.uni.love, philDrop = r.uni.phil - r.hLove.phil;
ck('L11', r.hLove.st.hoverRegion >= 0 && r.hPhil.st.hoverRegion >= 0 &&
          r.hLove.st.hoverRegion !== r.hPhil.st.hoverRegion &&
          r.hLove.love > r.hLove.phil && r.hPhil.phil > r.hPhil.love &&
          near(r.rel.love, r.uni.love, 2) && near(r.rel.phil, r.uni.phil, 2),
   'the same highlightMIG serves both worlds — hovering LOVE leaves it ' +
   (r.hLove.love - r.hLove.phil) + ' brighter than Philosophy; hovering Philosophy leaves it ' +
   (r.hPhil.phil - r.hPhil.love) + ' brighter than LOVE; release returns to baseline');

// L12 — Philosophy untouched
const T = D.systems.find(s => s.system === 'TRAPPIST-1');
const wantR = T.semiMajorAxisAU.map(v => +(pOrb[0] * v / T.semiMajorAxisAU[0]).toFixed(3));
const gotR = pOrb.map(v => +v.toFixed(3));
ck('L12', JSON.stringify(wantR) === JSON.stringify(gotR),
   'Philosophy still renders the exact TRAPPIST-1 spacing — ' + gotR.join(' '));

// L13 — the front door must not overstate the mind
const wrongCounts = [];
(r.menu || []).forEach(row => {
  const c = r.counts[row.id];
  if (!c) return;
  /* read the COUNTS span, not the whole button: the row now also carries an
     astronomical source line, and "TRAPPIST-1 7 concepts" parsed as 17. */
  const m = /(\d+)\s+concepts?\s*.\s*(\d+)\s+writings?/.exec(row.meta || row.text);
  if (!m) { wrongCounts.push(row.id + ':unparsed'); return; }
  if (+m[1] !== c.minors || +m[2] !== c.writings)
    wrongCounts.push(row.id + ' says ' + m[1] + '/' + m[2] +
                     ' but holds ' + c.minors + '/' + c.writings);
});
ck('L13', (r.menu || []).length === MIG_TOTAL && wrongCounts.length === 0,
   'the Main Mind Menu states TRUE concept and writing counts for all ' + MIG_TOTAL + ' regions' +
   (wrongCounts.length ? ' — WRONG: ' + wrongCounts.join('; ')
                       : ' (love ' + r.counts.love.minors + ' concepts / ' +
                         r.counts.love.writings + ' writings, philosophy ' +
                         r.counts.philosophy.minors + ' / ' +
                         r.counts.philosophy.writings + ')'));

/* L14 — the universe must open NEUTRAL.
   enterMind() moves focus to the first menu row for the keyboard. That focus
   was firing the highlight, so the mind opened with MY WORKS lit and the
   other thirteen worlds dimmed to 0.45 — and it clobbered any highlight set
   before it landed, which made two different hover screenshots identical. */
ck('L14', r.onEntry && r.onEntry.hoverState.hovered === null &&
         r.onEntry.hoverState.hoverRegion === -1 && !!r.onEntry.focused,
   'the universe opens with NO world highlighted — entering focuses the menu for the keyboard without lighting a region (hovered=' +
   JSON.stringify(r.onEntry && r.onEntry.hoverState.hovered) + ' while focus sits on ' +
   JSON.stringify(r.onEntry && r.onEntry.focused) + ')');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' contrast invariants hold');
console.log('  LOVE: 2 stars, ' + W.orbitRadii.length + ' bodies, spread ' + lSpread.toFixed(2) +
            'x, hollow centre ' + measuredRatio + 'x the stellar separation');
console.log('  draw calls ' + r.perf.calls + ' · geometries ' + r.perf.geometries +
            ' · textures ' + r.perf.textures);
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\nLOVE is a different kind of place, not a recoloured Philosophy');
process.exit(bad ? 1 : 0);
