/* braincheck.js — the mind is a 3D CONSTELLATION, so these assertions test one.

   Rewritten after the brain became star points joined by straight lines. The
   previous version asserted the old anatomical drawing by name — 'sylvian',
   'superior-frontal', 'far-ghost' — and those names no longer exist, so four
   of its twenty were failing on vocabulary rather than on anything real.

   What is tested now: that the figure is made of lines and not a solid, that
   those lines wrap a volume rather than lying on a plane, that its named
   chains are ARRANGED the way a brain's are and not merely present, that the
   count stays inside its declared budget, and that the mind's relationships
   are a separate layer the anatomy does not depend on.

   Every number is measured from the live scene through M.organ(); this file
   computes no geometry, so a check can never quietly agree with a copy of the
   thing it is checking.

   usage: node tools/braincheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const W = 1440, H = 900;

/* the declared budget, from BRAIN-VISUAL-SPEC. A ceiling, not a target. */
const BUDGET = { chainsMin: 8, chainsMax: 18, starsMin: 70, starsMax: 150 };

const tmp = (require('./scratch.js').root() + '/bc-' + process.pid).split('\\').join('/');
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
              menu:M.menuRows(), sky:M.skyLabels() };
    /* how many labels are actually drawn over the closed organ */
    out.mmm.labelsDrawn=[].filter.call(document.querySelectorAll('.lb'),
      function(e){ return e.style.display!=='none'; }).length;
    /* where each region NAME lands, in pixels, in the view a visitor opens on */
    out.mmm.proj=M.arch().migIds.map(function(id){
      var p=M.project(id);
      return {id:id, on:!!(p&&p.onScreen),
              x:p?Math.round(p.x):null, y:p?Math.round(p.y):null};
    });
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
const TOTAL = 22;
function ck(id, ok, msg) {
  if (!ok) bad++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + id.padEnd(4) + '  ' + msg);
}

const O = r.mmm.organ, WEL = r.welcome.organ, RET = r.returned.organ, IN = r.inWorld.organ;
const P = r.profile || [];
const at = deg => P[Math.round(deg / 360 * P.length) % P.length];
const has = id => (O.chains || []).indexOf(id) >= 0;
const S = O.spans || {};
/* both sides of a mirrored pair must exist, or the figure only works from one
   direction — which is the whole failure this design replaced */
const pair = n => has(n + '-L') && has(n + '-R');

/* B1 — lines, not a solid. The drawing owns no mesh and no draw call: its
   segments live in the line buffer the relationships already use. */
ck('B1', O.isMesh === false && O.drawCalls === 0 &&
         O.segments > 0 && O.stars > 0 && O.buffer.anatomy > 0,
   'the brain is line geometry — ' + O.stars + ' stars joined by ' + O.segments +
   ' straight segments, contributing ' + O.buffer.anatomy +
   ' vertices to a buffer it shares, and owning no mesh and no draw call');

/* B2 — and those lines wrap a volume. A figure lying on a plane has no extent
   on one axis; this has extent on all three, with depth comparable to width. */
ck('B2', O.bbox.w > 40 && O.bbox.h > 40 && O.bbox.d > 40 &&
         O.depthSpread > 0.35 && O.depthSpread < 2.0,
   'the figure wraps a volume rather than a plane — ' + O.bbox.w + ' wide x ' +
   O.bbox.h + ' high x ' + O.bbox.d + ' deep, width/depth ' + O.depthSpread);

/* B3 — lateral by default. Not three-quarter, not front, not top. */
ck('B3', O.lateralDeg < 20 && O.viewDeclared < 20,
   'the default camera is lateral — ' + O.lateralDeg +
   ' degrees off the midsagittal normal (declared ' + O.viewDeclared + ')');

/* B4 — the whole figure sits inside the readable area, not merely on screen */
ck('B4', O.frame.offScreen === 0 && O.frame.inReadable && O.frame.margin > 20 &&
         O.frame.fillsW > 0.25 && O.frame.fillsW < 0.95,
   'the complete brain fits the MMM — 0 of ' + O.frame.samples +
   ' samples off screen, ' + O.frame.margin + 'px clear of the readable area, ' +
   'filling ' + O.frame.fillsW + ' x ' + O.frame.fillsH);

/* B5 — two hemispheres, both fully drawn. Symmetry is deliberate: a figure
   that must read from ANY direction cannot have a near side and a ghosted far
   side, because either one can become the near side. */
const lo = Math.min(O.hemispheres.near, O.hemispheres.far);
const hi = Math.max(O.hemispheres.near, O.hemispheres.far);
ck('B5', lo > 0 && lo / hi > 0.9 &&
         ['profile', 'fissure', 'sylvian', 'temporal', 'cerebellar', 'central'].every(pair),
   'two hemispheres, both fully drawn — ' + O.hemispheres.near + ' stars one side, ' +
   O.hemispheres.far + ' the other, and all six chains mirrored, because either ' +
   'side can become the near side');

/* B6 — separated by a real gap, with the fissure drawn along it */
/* The gap is judged as a FRACTION of the form, not as an absolute count. An
   absolute floor of 8 units was too permissive to mean anything: removing the
   hemisphere offset entirely still left the chains 17 units apart, purely from
   where they happen to sit, and the assertion passed a figure whose halves had
   been fused. A separation has to be proportionate to the thing separated. */
const gapFrac = O.midlineGap / O.bbox.w;
ck('B6', gapFrac > 0.07 && gapFrac < 0.35 && pair('fissure') &&
         S['fissure-L'] && S['fissure-L'].v[0] > 0.1,
   'a central separation exists — the hemispheres stand ' + O.midlineGap +
   ' apart across a ' + O.bbox.w + ' width, which is ' +
   (gapFrac * 100).toFixed(1) + '% of it, with the longitudinal fissure drawn ' +
   'along the top at v ' + S['fissure-L'].v.join('..'));

/* B7 — a frontal lobe: the outline is fullest toward the front */
const front = Math.max(at(0), at(30), at(60));
const back = Math.max(at(150), at(180), at(210));
ck('B7', P.length > 0 && front > back * 1.08,
   'a frontal profile exists — the outline reaches ' + front.toFixed(2) +
   ' at the front against ' + back.toFixed(2) + ' at the back');

/* B8 — a temporal region, and it is BELOW the Sylvian fissure. Present is not
   enough: a temporal chain drawn above the fissure would still be present. */
const sy = S['sylvian-L'], tm = S['temporal-L'];
ck('B8', pair('sylvian') && pair('temporal') && sy && tm && tm.v[1] < sy.v[0],
   'a temporal region hangs below the Sylvian fissure — the fissure runs at v ' +
   sy.v.join('..') + ' and the temporal edge lies entirely beneath it at v ' +
   tm.v.join('..'));

/* B9 — a cerebellum: its own chain, at the back and below, behind the notch
   the outline makes for it */
const notch = Math.min(at(195), at(210)), cbl = Math.max(at(225), at(240));
const cb = S['cerebellar-L'];
ck('B9', pair('cerebellar') && cb && cb.u[1] < -0.4 && cb.v[0] < -0.4 &&
         cbl > notch * 1.06,
   'a cerebellar region exists — its own chain at the back (u ' + cb.u.join('..') +
   ') and below (v ' + cb.v.join('..') + '), behind an outline that dips to ' +
   notch.toFixed(2) + ' and rises again to ' + cbl.toFixed(2));

/* B10 — the outline is not an ellipse. An ellipse has exactly two minima;
   every extra one is a notch, and the notches are the recognition. */
ck('B10', O.ellipseDeviation > 0.25 && O.minimaAt.length >= 2 && O.maximaAt.length >= 2,
   'the silhouette is non-elliptical — ' + (O.ellipseDeviation * 100).toFixed(0) +
   '% from its own best-fit ellipse, minima at ' + O.minimaAt.join('/') +
   ' degrees, maxima at ' + O.maximaAt.join('/'));

/* B11 — the budget holds. This is the assertion that stops the failure the
   whole brief was about: fixing a weak shape by adding lines. */
ck('B11', O.curves >= BUDGET.chainsMin && O.curves <= BUDGET.chainsMax &&
          O.stars >= BUDGET.starsMin && O.stars <= BUDGET.starsMax,
   'the figure stays inside its budget — ' + O.curves + ' chains (ceiling ' +
   BUDGET.chainsMax + ') and ' + O.stars + ' stars (ceiling ' + BUDGET.starsMax +
   '), density coming from subdividing chains that already had a reason to exist');

/* B12 — anatomy and cognition are separate layers. They share one buffer, so
   the proof is that the buffer splits cleanly and nothing belongs to both. */
ck('B12', O.buffer && O.buffer.anatomy > 0 && O.buffer.graph > 0 &&
          O.buffer.mixed === 0,
   'the graph is a separate layer from the anatomy — the shared buffer holds ' +
   O.buffer.anatomy + ' anatomical vertices and ' + O.buffer.graph +
   ' relationship vertices, with ' + O.buffer.mixed + ' belonging to both');

/* B13 — the figure survives the graph being taken away, because not one of its
   chains is produced from a relationship: every one is named anatomy. */
const anatomical = ['profile-L', 'profile-R', 'fissure-L', 'sylvian-L',
                    'temporal-L', 'cerebellar-L', 'central-L'];
ck('B13', anatomical.every(has) &&
          (O.chains || []).every(n => !/^edge|^link|^rel|^seg/.test(n)),
   'the brain is recognisable with the graph disabled — all ' + O.curves +
   ' of its chains are named anatomy (' + anatomical.length +
   ' key landmarks present), none derived from a relationship');

/* B14 — one figure, two stagings */
ck('B14', WEL.stars === O.stars && WEL.segments === O.segments &&
          WEL.viewDeclared === O.viewDeclared &&
          WEL.staging.dim > 0.5 && O.staging.dim < 0.1,
   'welcome and MMM are the same figure — identical ' + WEL.stars + ' stars and ' +
   WEL.segments + ' segments on the same axis, the threshold merely holding it ' +
   'at dim ' + WEL.staging.dim + ' against the MMM at ' + O.staging.dim);

/* B15 — and it comes back framed and lateral after a world */
ck('B15', RET.frame.offScreen === 0 && RET.frame.inReadable &&
          RET.lateralDeg < 20 && r.returned.mind.open < 0.02 &&
          RET.stars === O.stars,
   'returning from a MIG restores valid framing — ' + RET.lateralDeg +
   ' degrees off lateral, ' + RET.frame.offScreen + ' off screen, mindOpen ' +
   r.returned.mind.open + ', the same ' + RET.stars + ' stars');

/* B16 / B17 — every region is inside the figure, and in the menu */
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

/* B19 — source labels come from the world assignments, and an unassigned world
   does not get one invented for it */
const menu = r.mmm.menu || [];
const charted = menu.filter(x => x.source && x.source !== 'not yet charted');
/* The charted set is DERIVED, not listed. This assertion was edited four
   times in one session purely to bump a hardcoded count and paste another
   system name into a regular expression, which is maintenance rather than
   testing — and a list that has to be updated by hand is a list that will one
   day be updated wrongly. What actually matters is that every label matches
   the profile it came from, that a region without a world says so, and that
   the charted ones are a real subset. All three survive a thirteenth world. */
/* THE CLAIM MOVED, SO THE AUDIT MOVED WITH IT. This read the source line under
   every menu row, where an uncharted region declared itself "not yet charted".
   The menu no longer repeats what the sky says, so the sky is where a source is
   now stated — and only the charted worlds state one.

   ONE PROPERTY DID NOT SURVIVE THE MOVE, and pretending otherwise would be
   worse than losing it: an unassigned region used to SAY it had no system, and
   now it merely says nothing. Silence is not a declaration, and no assertion
   can make it one. What is still testable is the half that stops a world
   inventing a heritage it does not have — every source shown is the one the
   profile assigns, no region shows a source it lacks, and no two share one. */
const sky = r.mmm.sky || [];
const skyCharted = sky.filter(x => x.shown);
const wantCharted = sky.filter(x => x.expected && x.expected !== 'not yet charted');
ck('B19', menu.length === r.mmm.arch.migCount &&
          sky.length === r.mmm.arch.migCount &&
          sky.every(x => x.shown === null || x.shown === x.expected) &&
          skyCharted.length === wantCharted.length && skyCharted.length >= 6 &&
          skyCharted.length < sky.length &&
          new Set(skyCharted.map(x => x.shown)).size === skyCharted.length,
   'the sky names each charted world and no other — ' +
   skyCharted.map(x => x.id + '=' + x.shown).join(', ') + '; the other ' +
   (sky.length - skyCharted.length) + ' show none rather than inventing one');

/* B20 — visiting a world does not rewrite the anatomy. Compared DURING the
   world as well as after it: a figure rewritten while a world is open and
   restored on the way out would pass a before-and-after test while still
   being wrong. */
ck('B20', IN.stars === O.stars &&
          JSON.stringify(IN.chains) === JSON.stringify(O.chains) &&
          RET.stars === O.stars &&
          JSON.stringify(RET.chains) === JSON.stringify(O.chains) &&
          RET.ellipseDeviation === O.ellipseDeviation &&
          RET.midlineGap === O.midlineGap,
   'world rendering does not mutate the anatomy — the same ' + IN.curves +
   ' chains while Philosophy is open, and the same ' + RET.midlineGap +
   ' midline gap and silhouette on return');

console.log('\n  figure: ' + O.stars + ' stars · ' + O.segments + ' segments · ' +
            O.curves + ' named chains · 0 draw calls of its own');
console.log('  chains: ' + (O.chains || []).join(' · '));
/* B21 — TWO REGION NAMES MUST NOT LAND ON THE SAME PLACE.

   Fifteen names are drawn over the figure and nothing measured whether any two
   of them collided. Two pairs did. The layout alternates hemispheres, and the
   reason recorded for that was it "stops two names from ever landing on the
   same pixel" — but alternating varies X and the default camera looks straight
   down X, so it produced the collisions rather than preventing them.
   PHILOSOPHY at x +18.5 and BUSINESS at x -64.7 sat 5.3 units apart in the
   plane the viewer sees, out of a brain 156 tall, with their labels drawn one
   on top of the other. MY WORKS and SOCIETY, 5.8.

   Measured in PIXELS on the projected positions, because pixels are what
   collide. A 3D separation proves nothing here: the two worst offenders were
   83 units apart in space and still on the same pixel, which is the entire
   point — depth is exactly the axis a lateral camera cannot show. */
const proj = (r.mmm.proj || []).filter(p => p.on);
let nearest = Infinity, nearestPair = '';
for (let i = 0; i < proj.length; i++)
  for (let j = i + 1; j < proj.length; j++) {
    const d = Math.hypot(proj[i].x - proj[j].x, proj[i].y - proj[j].y);
    if (d < nearest) { nearest = d; nearestPair = proj[i].id + '/' + proj[j].id; }
  }
ck('B21', proj.length === r.mmm.arch.migCount && nearest >= 30,
   'no two region names land on the same place — all ' + proj.length +
   ' are on screen and the closest pair, ' + nearestPair + ', is ' +
   Math.round(nearest) + 'px apart against a floor of 30');

/* B22 — WHILE THE MIND IS CLOSED, ONLY THE REGIONS ARE NAMED.

   The renderer already refuses to DRAW what a region owns while the brain is
   folded: everything is collapsed into its region and must not compete with
   it. The labels were never given the same rule — they were kept out only by
   being further from the camera than a flat 160-unit range.

   That stopped being true once label ranges started following each world's own
   size. FOOD's range is 3262 and BUILDING's 1330, so their concepts were
   suddenly inside it while folded, and TASTE, RITUAL, TOOLS and ITERATION were
   drawn over the organ in the menu — on a phone, on top of the region names
   themselves. Distance was never the reason the rule held; the fold state is,
   and now it says so. */
ck('B22', r.mmm.labelsDrawn === r.mmm.arch.migCount,
   'the closed mind names its ' + r.mmm.arch.migCount + ' regions and nothing ' +
   'else — ' + r.mmm.labelsDrawn + ' labels drawn, so nothing a region owns is ' +
   'named while it is still folded inside it');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' brain invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)'
                : '  the brain is a constellation, and every chain in it has a name');
process.exit(bad ? 1 : 0);
