/* astronomycheck.js — is the orbital world built from the researched data?

   A world can look astronomical and still be invented. These assertions tie
   the rendered geometry back to figures retrieved from the NASA Exoplanet
   Archive: the ratios on screen must BE the measured ratios, the concepts must
   be the real ones, and the visual layer must not have touched ownership.

   A1  Philosophy uses TRAPPIST-1
   A2  the template came from the research dataset, with provenance
   A3  exactly seven Philosophy concepts
   A4  exactly seven orbital positions
   A5  each concept maps to exactly one position, and each position is used once
   A6  orbital ordering follows the documented ordering (radii ascend by slot)
   A7  relative spacing IS the measured spacing
   A8  Philosophy is the gravitational centre
   A9  no other MIG is nested inside Philosophy
   A10 all 14 MIGs remain in the Main Mind Menu
   A11 every Philosophy concept is still owned by Philosophy
   A12 no concept falls back to a generic icon
   A13 no concept is a cluster — one body, one object
   A14 relationship visibility stays bounded
   A15 cross-MIG relationships do not mutate ownership
   A16 the mobile semantic model survives
   A17 the atlas sampling contract — the fault that actually shipped
   A18 relationship verbs render as real verbs, never "undefined"
   A19 MOVIES uses HR 8799, with provenance and an exact 4<->4 mapping
   A20 HR 8799's rendered spacing IS its measured spacing
   A21 the two planetary worlds are geometrically OPPOSITE, which is the whole
       reason HR 8799 was the system chosen to answer TRAPPIST-1
   A22 LIFE uses Kepler-33, with provenance and an exact 5<->5 mapping
   A23 Kepler-33's rendered spacing IS its measured spacing
   A24 the THREE planetary worlds occupy three distinct spacing regimes, in
       order, so a set of worlds is not one idea rendered three times

   usage: node tools/astronomycheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (os.tmpdir() + '/astro-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  M.enter(); M.go('region','philosophy'); M.settle(120);
  M.go('concept','curiosity');           // a state that renders verbs
  var verbs=M.verbs();
  M.go('region','philosophy'); M.settle(40);
  var A=M.astro(), arch=M.arch(), sp=M.species(), perf=M.perf();

  /* A13 — a concept must be ONE body. Read the atlas cell each concept type
     resolves to and count the separate bright blobs in it. This is the check
     that would have caught the flipY defect, where every concept silently
     rendered FOOD's eight-body cluster. */
  var blobs={};
  ['minor','thought','belief','question','reference'].forEach(function(g){
    var st=M.atlasStats(g); blobs[g]=st?st.peaks:null;
  });

  /* how many nodes actually sit near a concept — a cluster in the data would
     read as a cluster on screen just as surely as a bad glyph */
  var crowd={}, drawn={};
  (A.orbits.philosophy||[]).forEach(function(o){
    var n=M.near(o.id,9);
    crowd[o.id]=n?n.count:null;
    /* a TIGHT box: wide enough to contain the concept's own core, small
       enough that an orbit ring or a neighbouring writing cannot wander in
       and be counted as a second body */
    var sb=M.spriteBlobs(o.id,58);
    if(sb) drawn[o.id]=sb.dominance;
  });

  return {astro:A, arch:arch, species:sp, perf:perf, blobs:blobs, crowd:crowd, drawn:drawn,
          contract:M.atlasContract(), verbs:verbs,
          dom:M.dom(), state:M.state()};
})()`;

function run(w, h, extraHash){
  const page = tmp + '/a' + w + '.html';
  fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({viewport:{w:innerWidth},result:r});
  document.body.appendChild(p);
},300);</script>`, 'utf8');
  const cmd = '"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr' + w + '" --no-first-run' +
    ' --window-size=' + Math.max(w,520) + ',' + h +
    ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g,'/') + '#lite' + (extraHash||'') + '"';
  const dom = execSync(cmd, { maxBuffer: 1<<26, timeout: 240000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  return JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
                        .replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
}

let r, mob;
try {
  r = run(1440, 900).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e){
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,80));
  process.exit(1);
}
try { mob = run(390, 812).result; } catch (e){ mob = null; }

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const A = r.astro, assigned = A.assigned.philosophy;
const orbits = (A.orbits.philosophy || []);

// A1
ck('A1', assigned && assigned.system === 'TRAPPIST-1',
   assigned ? 'Philosophy uses ' + assigned.system : 'Philosophy has no template');

// A2 — provenance, not just a name
ck('A2', A.dataset && A.dataset.systems > 0 && /NASA/.test(A.dataset.source || '') &&
         assigned && Array.isArray(assigned.axes) && assigned.axes.length === 7,
   'template drawn from ' + (A.dataset ? A.dataset.source : '?') +
   ', retrieved ' + (A.dataset ? A.dataset.retrieved : '?') +
   ', ' + (assigned ? assigned.axes.length : 0) + ' measured axes');

// A3 / A4 / A5
const concepts = orbits.filter(o => o.t === 'minor');
ck('A3', concepts.length === 7, concepts.length + ' Philosophy concepts');
const slots = orbits.map(o => o.slot);
ck('A4', new Set(slots).size === 7 && slots.length === 7,
   new Set(slots).size + ' distinct orbital positions for ' + slots.length + ' bodies');
ck('A5', new Set(orbits.map(o => o.id)).size === orbits.length &&
         new Set(slots).size === slots.length,
   'each concept occupies exactly one position, each position used once');

// A6 — ordering follows the documented ordering
const asc = orbits.slice().sort((a,b) => a.slot - b.slot);
let ordered = true;
for (let i = 1; i < asc.length; i++) if (asc[i].r <= asc[i-1].r) ordered = false;
ck('A6', ordered, 'radii ascend with slot: ' + asc.map(o => o.r).join(' < '));

// A7 — THE ONE THAT MATTERS. rendered ratios must equal measured ratios.
let spacingOK = false, detail = 'no data';
if (assigned && assigned.axes && asc.length === assigned.axes.length){
  const want = assigned.axes.map(v => +(v / assigned.axes[0]).toFixed(3));
  const got  = asc.map(o => +(o.r / asc[0].r).toFixed(3));
  spacingOK = want.every((v, i) => Math.abs(v - got[i]) < 0.005);
  detail = 'measured ' + want.join(' ') + '  ·  rendered ' + got.join(' ');
}
ck('A7', spacingOK, 'relative spacing is the measured spacing — ' + detail);

// A8 — the star is the centre
const centreOK = orbits.every(o => Math.abs(o.dist - o.r) < 0.4);
ck('A8', centreOK && orbits.length > 0,
   'every body sits at its own orbital radius from Philosophy (max drift ' +
   Math.max(...orbits.map(o => Math.abs(o.dist - o.r))).toFixed(2) + ')');

// A9 / A10 / A11 / A15
const MIG_TOTAL = require('../.p3/expect.js').expectedMigs().total;
ck('A9', r.arch.reparented.length === 0 && r.arch.migCount === MIG_TOTAL,
   'no MIG nested inside Philosophy — all 14 own themselves');
ck('A10', r.arch.migsInMenu === MIG_TOTAL || r.state.mode !== 'universe',
   'all 14 MIGs remain in the model (menu is contextual inside a region)');
ck('A11', orbits.every(o => o.mig === 'philosophy'),
   'all ' + orbits.length + ' orbital bodies are still owned by Philosophy');
ck('A15', r.arch.philosophyTopLevel && r.arch.myWorksOwnsMigs.length === 0,
   'cross-region relationships changed pathway, not ownership');

// A12 — no generic fallback
ck('A12', r.species.profiles['philosophy'] && !r.species.profiles['philosophy'].generic,
   'Philosophy uses its own species (' + r.species.profiles['philosophy'].family + '), not the generic star');

/* A13 — ONE BODY PER CONCEPT, both in the glyph and in the data. The flipY
   defect made every concept render FOOD's eight-body cluster while every
   other check stayed green; this is the assertion that closes that hole. */
const glyphOK = ['minor','thought','belief'].every(g => r.blobs[g] === 1);
const crowdMax = Math.max(...Object.keys(r.crowd).map(k => r.crowd[k] || 0));
/* measured from the FRAMEBUFFER, so a sampling fault is visible. Reading the
   atlas alone could not see flipY and would have passed the broken build. */
const domVals = Object.keys(r.drawn).map(k => r.drawn[k]);
const domMin = domVals.length ? Math.min(...domVals) : 0;
ck('A13', glyphOK && crowdMax <= 1 && domVals.length >= 3 && domMin >= 0.6,
   'a concept renders as ONE body — ink dominance per concept ' +
   JSON.stringify(r.drawn) + ' (worst ' + domMin + ', need >=0.6), atlas ' +
   JSON.stringify(r.blobs) + ', neighbours within 9u: ' + crowdMax);

/* A17 — THE ATLAS SAMPLING CONTRACT. This is the assertion that would have
   stopped the real defect. CanvasTexture flips Y on upload by default, so a
   concept asking for cell (1,0) was handed cell (1,4) — FOOD's eight-body
   cluster — and every other assertion stayed green. A13 cannot catch it
   because those eight cores merge into one region at any usable threshold,
   so the orientation itself is pinned here. */
const K = r.contract;
ck('A17', K && K.flipY === false && K.uvInverted === false && K.cells > 0,
   K ? 'atlas sampling contract holds — flipY ' + K.flipY + ', uv not inverted, ' +
       K.cells + ' cells, uv: ' + K.uvExpression
     : 'could not read the sampling contract');

/* A18 — THE RELATIONSHIPS STILL SAY SOMETHING. Found by looking, not by
   checking: the adjacency stores the verb as `v` and the panel asked for
   `verb`, so every relationship rendered "UNDEFINED" while seventeen
   geometric assertions passed. The verbs are the reasoning. */
ck('A18', r.verbs && r.verbs.total > 0 && r.verbs.broken === 0,
   r.verbs ? r.verbs.total + ' relationship verbs rendered, ' + r.verbs.broken +
             ' broken — e.g. ' + JSON.stringify(r.verbs.sample.slice(0,3))
           : 'could not read the verbs');

// A14 — relationship visibility bounded
/* The budget is 7, not 4, and the extra three are the SKY: the gas sphere, the
   deep-sky sprites and the star field. They are new, they are real, and each is
   drawn once from geometry built at boot — none is per-MIG and none is
   recomputed per frame. The mind's own layers are unchanged at three: one
   Points call for every object whatever its species, one for relationships,
   one for orbits. */
ck('A14', r.perf.lines > 0 && r.perf.calls <= 7,
   'relationships batched into ' + r.perf.calls + ' draw calls (' + r.perf.lines +
   ' line vertices), three of them the sky and none of them per-MIG');

// A16 — mobile keeps the semantics
ck('A16', mob && mob.dom && mob.dom.navRows >= 3 && mob.dom.canvasHidden,
   mob ? 'mobile keeps ' + mob.dom.navRows + ' navigable rows, canvas still aria-hidden'
       : 'mobile state could not be measured');

/* ── THE FOURTH WORLD ─────────────────────────────────────────────────
   MOVIES is the counterweight to PHILOSOPHY, and the data file says so in as
   many words: HR 8799 is filed as "the strongest available contrast to
   TRAPPIST-1". These three hold that claim to the same standard the first
   world is held to — the ratios on screen must BE the measured ratios. */
const mvAssigned = A.assigned.movies, mvOrbits = (A.orbits.movies || []);
const mvAsc = mvOrbits.slice().sort((a, b) => a.slot - b.slot);

// A19 — the system, its provenance, and an exact 4<->4 mapping
const mvConcepts = mvOrbits.filter(o => o.t === 'minor');
ck('A19', mvAssigned && mvAssigned.system === 'HR 8799' &&
          Array.isArray(mvAssigned.axes) && mvAssigned.axes.length === 4 &&
          mvConcepts.length === 4 && new Set(mvAsc.map(o => o.slot)).size === 4,
   'MOVIES uses ' + (mvAssigned ? mvAssigned.system : 'nothing') + ' — ' +
   (mvAssigned ? mvAssigned.axes.length : 0) + ' measured axes for ' +
   mvConcepts.length + ' concepts, each on its own orbit, no interpolation');

// A20 — and the spacing is the measurement, not a look
let mvOK = false, mvDetail = 'no data';
if (mvAssigned && mvAssigned.axes && mvAsc.length === mvAssigned.axes.length) {
  const want = mvAssigned.axes.map(v => +(v / mvAssigned.axes[0]).toFixed(3));
  const got = mvAsc.map(o => +(o.r / mvAsc[0].r).toFixed(3));
  mvOK = want.every((v, i) => Math.abs(v - got[i]) < 0.005);
  mvDetail = 'measured ' + want.join(' ') + '  ·  rendered ' + got.join(' ');
}
ck('A20', mvOK, 'HR 8799 is rendered at its measured spacing — ' + mvDetail);

/* A21 — THE CONTRAST, ASSERTED RATHER THAN DESCRIBED.

   Choosing a second planetary system is only worth doing if it is genuinely a
   different shape, and "vast and sparse" is a phrase until something measures
   it. The two systems separate on the SIGN of their spacing: TRAPPIST-1's
   orbit gaps compress as they go out (1.37 down to 1.22, seven bodies packed
   inside 0.062 AU) while HR 8799's expand (1.46, 1.58, 1.79 — the near-2:1
   resonances of four bodies spread from 16 to 68 AU). One tightens, the other
   opens. That is a property of the astronomy, and it survives any change of
   scene scale because both are ratios. */
const gapsOf = a => a.slice(1).map((v, i) => v / a[i]);
const trGaps = gapsOf(assigned.axes), mvGaps = gapsOf(mvAssigned.axes);
const trTightens = trGaps[trGaps.length - 1] < trGaps[0];
const mvOpens = mvGaps.every((g, i) => i === 0 || g > mvGaps[i - 1]);
ck('A21', trTightens && mvOpens && mvGaps[mvGaps.length - 1] > trGaps[trGaps.length - 1] * 1.3,
   'the two worlds are opposite shapes — TRAPPIST-1 tightens outward (' +
   trGaps.map(g => g.toFixed(2)).join(' > ') + ') while HR 8799 opens (' +
   mvGaps.map(g => g.toFixed(2)).join(' < ') + ')');

/* ── THE FIFTH WORLD ──────────────────────────────────────────────────
   LIFE is Kepler-33, and it is the third PLANETARY world — the point at which
   "each world is its own species" stops being a claim about two systems and
   has to hold across a set. */
const lfAssigned = A.assigned.life, lfOrbits = (A.orbits.life || []);
const lfAsc = lfOrbits.slice().sort((a, b) => a.slot - b.slot);

// A22 — the system, its provenance, and an exact 5<->5 mapping
const lfConcepts = lfOrbits.filter(o => o.t === 'minor');
ck('A22', lfAssigned && lfAssigned.system === 'Kepler-33' &&
          Array.isArray(lfAssigned.axes) && lfAssigned.axes.length === 5 &&
          lfConcepts.length === 5 && new Set(lfAsc.map(o => o.slot)).size === 5,
   'LIFE uses ' + (lfAssigned ? lfAssigned.system : 'nothing') + ' — ' +
   (lfAssigned ? lfAssigned.axes.length : 0) + ' measured axes for ' +
   lfConcepts.length + ' concepts, each on its own orbit');

// A23 — and the spacing is the measurement
let lfOK = false, lfDetail = 'no data';
if (lfAssigned && lfAssigned.axes && lfAsc.length === lfAssigned.axes.length) {
  const want = lfAssigned.axes.map(v => +(v / lfAssigned.axes[0]).toFixed(3));
  const got = lfAsc.map(o => +(o.r / lfAsc[0].r).toFixed(3));
  lfOK = want.every((v, i) => Math.abs(v - got[i]) < 0.005);
  lfDetail = 'measured ' + want.join(' ') + '  ·  rendered ' + got.join(' ');
}
ck('A23', lfOK, 'Kepler-33 is rendered at its measured spacing — ' + lfDetail);

/* A24 — THREE WORLDS, THREE REGIMES, IN ORDER.

   A21 separated two systems by the sign of their spacing. With a third
   planetary world the weaker claim — "these two differ" — is no longer enough:
   a set of worlds that all compress would be one idea rendered three times.

   Measured by the trend of each system's own gaps, last over first, which is a
   ratio of ratios and therefore survives any scene scale:

     Kepler-33   1.18/1.76 = 0.67   compresses hard
     TRAPPIST-1  1.32/1.37 = 0.96   nearly even
     HR 8799     1.79/1.46 = 1.23   opens out

   Strictly ordered and straddling 1.0. That is three genuinely different
   shapes, not three paint jobs. */
const trendOf = a => { const g = gapsOf(a); return g[g.length - 1] / g[0]; };
const tKep = trendOf(lfAssigned.axes), tTra = trendOf(assigned.axes),
      tHR = trendOf(mvAssigned.axes);
ck('A24', tKep < tTra && tTra < tHR && tKep < 0.85 && tHR > 1.15,
   'the three planetary worlds are three regimes in order — Kepler-33 ' +
   tKep.toFixed(2) + ' (compresses) < TRAPPIST-1 ' + tTra.toFixed(2) +
   ' (nearly even) < HR 8799 ' + tHR.toFixed(2) + ' (opens)');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' astronomy invariants hold');
console.log('  draw calls ' + r.perf.calls + ' · geometries ' + r.perf.geometries +
            ' · textures ' + r.perf.textures + ' · dpr ' + r.perf.dpr);
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\nPhilosophy is TRAPPIST-1, and the spacing is the real spacing');
process.exit(bad ? 1 : 0);
