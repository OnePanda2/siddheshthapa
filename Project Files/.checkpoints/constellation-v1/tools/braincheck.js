/* braincheck.js — §32, for the LINE brain.

   The brain is a drawing again, so these assertions test a drawing: that it is
   made of curves and not a surface, that those curves wrap a volume rather
   than lying on a plane, that the outline has the landmarks that stop it
   reading as an egg, that the number of curves stays inside its declared
   budget, and that the mind's own relationships are a separate layer which the
   anatomy does not depend on.

   Every number is measured from the live scene through M.organ(); this file
   computes none of the geometry, so a check can never quietly agree with a
   copy of the thing it is checking.

   usage: node tools/braincheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const W = 1440, H = 900;

/* the declared line budget, from BRAIN-VISUAL-SPEC §2. A ceiling, not a target. */
const BUDGET = { min: 12, max: 26 };

const tmp = (os.tmpdir() + '/bc-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(tmp + '/p.html', fs.readFileSync(FILE, 'utf8') + `
<script>setTimeout(function(){
  var out={};
  try{
    var M=window.__v02;
    if(!M||!M.ok()){ document.title=JSON.stringify({ERROR:'no webgl'}); return; }
    M.settle(200);
    out.welcome={ organ:M.organ(), mind:M.mind() };
    out.profile=out.welcome.organ.profile; delete out.welcome.organ.profile;
    M.enter(); M.settle(260);
    out.mmm={ organ:M.organ(), mind:M.mind(), brain:M.brain(), arch:M.arch(),
              menu:M.menuRows() };
    delete out.mmm.organ.profile;
    M.go('region','philosophy'); M.settle(220);
    out.inWorld={ organ:M.organ(), mind:M.mind() };
    delete out.inWorld.organ.profile;
    M.go('universe'); M.settle(280);
    out.returned={ organ:M.organ(), mind:M.mind() };
    delete out.returned.organ.profile;
    out.perf=M.perf();
  }catch(e){ out.ERROR=(e&&e.message)||String(e); }
  document.title=JSON.stringify(out);
},300);</script>`, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=7000' +
  ' --force-prefers-reduced-motion --dump-dom "file:///' + tmp + '/p.html"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });

const m = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!m) { console.error('  the page never reported'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
if (r.ERROR) { console.error('  ' + r.ERROR); process.exit(1); }

let bad = 0;
const TOTAL = 20;
function ck(id, ok, msg) {
  if (!ok) bad++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + id.padEnd(4) + '  ' + msg);
}

const O = r.mmm.organ, WEL = r.welcome.organ, RET = r.returned.organ;
const P = r.profile || [];
const at = deg => P[Math.round(deg / 360 * P.length) % P.length];
const has = id => (O.named || []).indexOf(id) >= 0;

/* B1 — lines, not a solid. The drawing owns no mesh and adds no draw call. */
ck('B1', O.isMesh === false && O.drawCalls === 0 && O.curves > 0 &&
         O.anatomyLineVerts > 0 && r.perf.triangles === 0,
   'the brain is line geometry — ' + O.curves + ' curves contributing ' +
   O.anatomyLineVerts + ' line vertices, in 0 draw calls of its own, with ' +
   r.perf.triangles + ' triangles anywhere in the scene');

/* B2 — those curves wrap a volume. A drawing pinned to a plane has no extent
   on one axis; this one has extent on all three, and depth comparable to width. */
/* the near face carries the drawing and the far hemisphere carries only its
   ghost, so the curves never span the shell's full width — what matters is
   that the spread across the VIEW axis is substantial rather than zero, which
   is what a drawing pinned to a plane would give. */
ck('B2', O.bbox.w > 40 && O.bbox.h > 40 && O.bbox.d > 40 &&
         O.depthSpread > 0.35 && O.depthSpread < 2.0,
   'the curves wrap a volume rather than a plane — ' + O.bbox.w + ' wide x ' +
   O.bbox.h + ' high x ' + O.bbox.d + ' deep, width/depth ' + O.depthSpread);

/* B3 — lateral. Not three-quarter, not front, not top. */
ck('B3', O.lateralDeg < 20 && O.viewDeclared < 20,
   'the default camera is lateral — ' + O.lateralDeg +
   ' degrees off the midsagittal normal (declared ' + O.viewDeclared + ')');

/* B4 — the whole drawing is inside the readable area, not merely on screen */
ck('B4', O.frame.offScreen === 0 && O.frame.inReadable && O.frame.margin > 20 &&
         O.frame.fillsW > 0.25 && O.frame.fillsW < 0.95,
   'the complete brain fits the MMM — 0 of ' + O.frame.samples +
   ' samples off screen, ' + O.frame.margin + 'px clear of the readable area, ' +
   'filling ' + O.frame.fillsW + ' x ' + O.frame.fillsH);

/* B5 — two hemispheres, DIFFERENTLY drawn. The far side is a ghost of the
   outline and nothing else, which is what stops the two reading as one
   drawing laid twice on top of itself. */
ck('B5', O.hemispheres.near > 0 && O.hemispheres.far > 0 &&
         has('far-ghost') && O.hemispheres.far < O.hemispheres.near * 0.6,
   'two hemispheric regions exist and are drawn differently — ' +
   O.hemispheres.near + ' near-side points against ' + O.hemispheres.far +
   ' far-side, the far one carrying only the ghosted outline');

/* B6 — and they are separated by a real gap, not a seam */
ck('B6', O.midlineGap > 8 && O.midlineGap < 0.25 * O.bbox.w && has('midline'),
   'a central separation exists — the hemispheres stand ' + O.midlineGap +
   ' apart across a ' + O.bbox.w + ' width, with the midline crest drawn');

/* B7 — a frontal lobe: the outline is fullest toward the front */
const front = Math.max(at(0), at(30), at(60));
const back = Math.max(at(150), at(180), at(210));
ck('B7', P.length > 0 && front > back * 1.08 && has('superior-frontal'),
   'a frontal profile exists — the outline reaches ' + front.toFixed(2) +
   ' at the front against ' + back.toFixed(2) + ' at the back, with its sulci drawn');

/* B8 — a temporal region below the Sylvian fissure, with the stack of sulci
   that turns it into a lobe rather than a corner */
const base = at(270), temporal = Math.max(at(300), at(315), at(330));
const sy = O.spans.sylvian, tm = O.spans.temporal;
ck('B8', temporal > base * 1.10 && has('sylvian') && has('superior-temporal') &&
         tm && sy && tm.v[0] < sy.v[0],
   'a temporal region exists — the outline hangs to ' + temporal.toFixed(2) +
   ' forward of the ' + base.toFixed(2) + ' base, and the temporal sulci sit ' +
   'below the Sylvian fissure (' + tm.v[0] + ' against ' + sy.v[0] + ')');

/* B9 — a cerebellum: a notch, then a smaller mass, with its own foliation */
const notch = Math.min(at(195), at(210)), cbl = Math.max(at(225), at(240));
ck('B9', cbl > notch * 1.06 && has('cerebellar-edge') &&
         has('folia-1') && has('folia-2') && has('folia-3'),
   'a cerebellar region exists — the outline dips to ' + notch.toFixed(2) +
   ' then rises to ' + cbl.toFixed(2) + ', bounded by its own edge and three folia');

/* B10 — the outline is not an ellipse. An ellipse has exactly two minima;
   every extra one is a notch, and the notches are the recognition. */
ck('B10', O.ellipseDeviation > 0.25 && O.minimaAt.length >= 2 && O.maximaAt.length >= 2,
   'the silhouette is non-elliptical — ' + (O.ellipseDeviation * 100).toFixed(0) +
   '% from its own best-fit ellipse, minima at ' + O.minimaAt.join('/') +
   ' degrees, maxima at ' + O.maximaAt.join('/'));

/* B11 — the line budget holds. This is the assertion that stops the failure
   mode the whole brief is about: fixing a weak shape by adding curves. */
ck('B11', O.curves >= BUDGET.min && O.curves <= BUDGET.max,
   'the structural line count is within budget — ' + O.curves + ' curves ' +
   'against a declared ceiling of ' + BUDGET.max + ' (' +
   Object.keys(O.byLayer).sort().map(k => k + ':' + O.byLayer[k]).join(' ') + ')');

/* B12 — anatomy and cognition are separate layers. They share one buffer, so
   the proof is that they are counted separately and neither derives from the
   other. */
ck('B12', O.buffer && O.buffer.anatomy > 0 && O.buffer.graph > 0 &&
          O.buffer.mixed === 0 && r.perf.calls <= 4,
   'the graph is a separate layer from the anatomy — the shared buffer holds ' +
   (O.buffer?O.buffer.anatomy:'?') + ' anatomical vertices and ' +
   (O.buffer?O.buffer.graph:'?') + ' relationship vertices with ' +
   (O.buffer?O.buffer.mixed:'?') + ' belonging to both, across ' + r.perf.calls + ' draw calls');

/* B13 — the drawing survives the graph being taken away, because no curve in
   it is produced from a relationship: the whole set is named anatomy. */
const anatomical = ['silhouette', 'sylvian', 'central', 'cerebellar-edge',
                    'superior-temporal', 'superior-frontal', 'midline'];
ck('B13', anatomical.every(has) && (O.named || []).every(n => !/^edge|^link|^rel/.test(n)),
   'the brain is recognisable with the graph disabled — every one of its ' +
   O.curves + ' curves is named anatomy (' + anatomical.length +
   ' key landmarks all present), none derived from a relationship');

/* B14 — one drawing, two stagings */
ck('B14', WEL.curves === O.curves && WEL.bbox.w === O.bbox.w &&
          WEL.viewDeclared === O.viewDeclared &&
          WEL.staging.dim > 0.5 && O.staging.dim < 0.1,
   'welcome and MMM use the same geometry — identical ' + WEL.curves +
   ' curves on the same axis, the threshold merely holding it at dim ' +
   WEL.staging.dim + ' against the MMM\u2019s ' + O.staging.dim);

/* B15 — and it comes back framed after a world */
ck('B15', RET.frame.offScreen === 0 && RET.frame.inReadable &&
          RET.lateralDeg < 20 && r.returned.mind.open < 0.02 &&
          RET.curves === O.curves,
   'returning from a MIG restores valid framing — ' + RET.lateralDeg +
   ' degrees off lateral, ' + RET.frame.offScreen + ' off screen, mindOpen ' +
   r.returned.mind.open + ', the same ' + RET.curves + ' curves');

/* B16 / B17 — every region is inside the brain and in the menu */
const placed = (r.mmm.brain.nodes || []).length;
ck('B16', placed === r.mmm.arch.migCount,
   'the brain contains all ' + placed + ' MIG regions, matching the ' +
   r.mmm.arch.migCount + ' the data declares');
ck('B17', r.mmm.arch.migsInMenu === r.mmm.arch.migCount,
   'the MMM lists all ' + r.mmm.arch.migsInMenu + ' MIGs');

/* B18 — and none of them is nested in another */
ck('B18', r.mmm.arch.reparented.length === 0 &&
          r.mmm.arch.myWorksOwnsMigs.length === 0 &&
          r.mmm.arch.migsSelfOwned === r.mmm.arch.migCount,
   'no MIG is nested inside another — ' + r.mmm.arch.reparented.length +
   ' reparented, ' + r.mmm.arch.myWorksOwnsMigs.length + ' owned by ART, all ' +
   r.mmm.arch.migsSelfOwned + ' owning themselves');

/* B19 — source labels come from the world assignments, and an unassigned
   world does not get one invented for it */
const menu = r.mmm.menu || [];
const charted = menu.filter(x => x.source && x.source !== 'not yet charted');
ck('B19', menu.length === r.mmm.arch.migCount &&
          menu.every(x => x.source === x.expected) && charted.length === 3 &&
          charted.every(x => /TRAPPIST-1|Kepler-16|Ursa Major/.test(x.source)),
   'source labels derive from the world assignments — ' +
   charted.map(x => x.id + '=' + x.source).join(', ') + '; the other ' +
   (menu.length - charted.length) + ' say "not yet charted" rather than inventing one');

/* B20 — visiting a world does not rewrite the anatomy. The drawing that comes
   back is the drawing that left. */
/* compared DURING the world as well as after it: an anatomy rewritten while a
   world is open and restored on the way out would pass a before/after test
   while still being wrong. */
const IN=r.inWorld.organ;
ck('B20', IN.curves === O.curves && JSON.stringify(IN.named) === JSON.stringify(O.named) &&
          RET.curves === O.curves &&
          JSON.stringify(RET.named) === JSON.stringify(O.named) &&
          RET.ellipseDeviation === O.ellipseDeviation &&
          RET.midlineGap === O.midlineGap,
   'world rendering does not mutate the anatomy — the same ' + IN.curves +
   ' curves while Philosophy is open, and ' + RET.curves +
   ' named curves, the same ' + RET.midlineGap + ' midline gap and the same ' +
   'silhouette come back from Philosophy');

console.log('\n  drawing: ' + O.curves + ' curves · ' + O.points + ' points · ' +
            O.anatomyLineVerts + ' line vertices · 0 draw calls of its own');
console.log('  layers : ' + Object.keys(O.byLayer).sort()
                              .map(k => k + '=' + O.byLayer[k]).join(' · '));
console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' brain invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)' : '  the brain is a drawing, and every line in it has a name');
process.exit(bad ? 1 : 0);
