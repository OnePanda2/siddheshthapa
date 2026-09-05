/* worldcheck.js — the shared architecture, not any one world.

   WORLD ARCHITECTURE
   W1 every MIG has exactly one world profile
   W2 no MIG falls through to an undeclared fallback
   W3 every profile's worldType is one of the declared types
   W4 all MIGs are top-level; nothing is nested or reparented
   W5 the Main Mind Menu exposes every MIG, Psychology included
   W6 ART is a relabel, not a new region: it keeps its id and everything it owns
   W7 Psychology is a first-class MIG, and it did not take content from anyone

   THE BRAIN
   M1 the MIG layout has brain proportions, two hemispheres and a midline gap
   M2 every MIG appears in the brain
   M3 hovering a menu entry identifies the right region while the mind is closed
   M4 that highlight is reversible
   M5 entering the mind moves brain -> universe, and the objects travel

   WORLD HIGHLIGHT
   H1 a hover maps to exactly one MIG
   H2 the right celestial world answers once the mind is open
   H3 the others recede
   H4 release restores the baseline

   LOCAL RELATIONSHIPS  (the shared localMix fix)
   R1 relationship visibility is judged against the SELECTED world, not the origin
   R2 Philosophy's relationships resolve when you are in Philosophy
   R3 Love's do
   R4 Observation's do

   usage: node tools/worldcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (require('./scratch.js').root() + '/wc-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02; if(!M) return {error:'__v02 missing'};
  M.settle(60);
  /* sumSignal, not maxSignal. A bright star of the constellation sits near
     enough to most regions to pin the peak, so hovering a MIG lifted its
     sprite while the reported maximum never moved. Total light in the
     neighbourhood is monotone in the sprite's own contribution. */
  function b(id,box){ var x=M.spriteBlobs(id,box||110); return x?x.sumSignal:null; }

  /* ---- while the mind is still closed ---- */
  var closed={ mind:M.mind(), brain:M.brain(), menu:M.menuRows(),
               rel:M.relVis(), overlay:M.overlay(), worlds:M.worlds() };
  /* every object and its kind, so uniqueness of ids can be asserted across the
     whole mind rather than for one pair that happened to collide once */
  closed.nodes=(M.model?M.model().nodes:[]).map(function(n){
    return {id:n.id, t:n.t, mig:n.mig}; });
  closed.base={ phil:b('philosophy'), love:b('love') };
  M.highlight('philosophy'); M.settle(30);
  closed.hPhil={ st:M.hoverState(), phil:b('philosophy'), love:b('love'), rel:M.relVis() };
  /* A SECOND REGION, CHOSEN FROM THE MIND RATHER THAN NAMED. This hovered
     'psychology', which stopped being a region the moment that world became
     BOOKS — and a highlight of a region that does not exist reports -1, which
     is indistinguishable from a highlight that failed. */
  var second=(M.arch().migIds||[]).filter(function(x){ return x!=='philosophy'; })[0];
  closed.secondId=second;
  M.highlight(second); M.settle(30);
  closed.hPsy={ st:M.hoverState() };
  M.highlight(null); M.settle(30);
  closed.rel2={ st:M.hoverState(), phil:b('philosophy'), love:b('love') };

  /* ---- open it ---- */
  M.enter(); M.settle(60);
  /* SAMPLED HERE, NOT WHILE THE MIND IS SHUT. The sky builds its labels when
     the sky is drawn, so asking for them at the threshold returns an empty
     list — which reads as "no world names a source" and failed W9 for the one
     reason that had nothing to do with the site. */
  closed.sky = M.skyLabels();
  var afterEnter=M.mind();            // entering must leave the brain standing
  M.go('region','philosophy'); M.settle(150);
  var afterPick=M.mind();             // choosing a region unfolds it
  M.go('universe'); M.settle(150);
  var afterBack=M.mind();             // and stepping back folds it again
  M.setOpen(1); M.settle(60);
  var open={ mind:M.mind(), rel:M.relVis(), afterEnter:afterEnter,
             afterPick:afterPick, afterBack:afterBack };
  open.base={ phil:b('philosophy'), love:b('love'), obs:b('observation'),
              loveTight:b('love',40) };
  M.highlight('love'); M.settle(30);
  open.hLove={ st:M.hoverState(), phil:b('philosophy'), love:b('love'),
               loveTight:b('love',40) };
  M.highlight(null); M.settle(30);
  open.rel={ phil:b('philosophy'), love:b('love') };

  /* ---- Minor IG highlight, inside a world ---- */
  M.go('region','philosophy'); M.settle(140);
  var minor={ base:{ cur:b('curiosity',110), eth:b('meaning',110) } };
  M.highlightNode('curiosity'); M.settle(40);
  minor.on={ st:M.nodeHoverState(), cur:b('curiosity',110), eth:b('meaning',110) };
  M.highlightNode(null); M.settle(40);
  minor.off={ st:M.nodeHoverState(), cur:b('curiosity',110), eth:b('meaning',110) };

  /* ---- world-local relationship visibility, one world at a time ---- */
  var worlds={};
  ['philosophy','love','observation'].forEach(function(id){
    M.go('region',id); M.settle(140);
    worlds[id]=M.relVis();
  });
  M.go('universe'); M.settle(80);
  var atUniverse=M.relVis();

  return { closed:closed, open:open, worlds:worlds, atUniverse:atUniverse, minor:minor,
           arch:M.arch(), graph:M.graph(), perf:M.perf() };
})()`;

const page = tmp + '/w.html';
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
    ' --virtual-time-budget=5200 --force-prefers-reduced-motion --dump-dom "file:///' +
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

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };
const near = (a, b, t) => Math.abs(a - b) <= t;
const W = r.closed.worlds, OV = r.closed.overlay, B = r.closed.brain;
const ids = Object.keys(W.profiles);

// W1
const missing = ids.filter(k => !W.profiles[k]);
ck('W1', ids.length === W.migs && ids.length === OV.migCount && missing.length === 0,
   'every one of the ' + ids.length + ' MIGs has exactly one world profile' +
   (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));

// W2
ck('W2', W.undeclared.length === 0,
   'no MIG falls through to an undeclared fallback (' +
   Object.keys(W.types).map(t => t + ' ' + W.types[t]).join(', ') + ')');

// W3
const badType = ids.filter(k => W.validTypes.indexOf(W.profiles[k].worldType) < 0);
ck('W3', badType.length === 0 && W.validTypes.indexOf('latent') >= 0 &&
         W.validTypes.length >= 4,
   'every worldType is declared — ' + W.validTypes.join(' / ') +
   (badType.length ? '  BAD: ' + badType.join(', ') : ''));

// W4
ck('W4', r.arch.migCount === OV.migCount && r.arch.reparented.length === 0,
   'all ' + r.arch.migCount + ' MIGs are top-level, nothing reparented');

// W5
/* the menu shows every region and ONLY regions. It used to require my-works
   among them; the works are a door now rather than a room, so their presence
   here would be the defect. */
/* EVERY REGION THE OVERLAY DECLARES, not one named example. This required
   'psychology' by name, to prove the region the overlay had just added really
   reached the menu. That was the right claim and the wrong way to hold it: the
   moment the added region was called something else, the check failed while
   the property it protects was perfectly intact. Asking for all of them is
   both stronger and immune to renaming. */
const declaredIds = (OV.added || []).map(x => x.id);
const missingFromMenu = declaredIds.filter(id => !r.closed.menu.some(x => x.id === id));
ck('W5', r.closed.menu.length === OV.migCount &&
         missingFromMenu.length === 0 &&
         !r.closed.menu.some(x => x.id === 'my-works'),
   'the Main Mind Menu exposes all ' + r.closed.menu.length +
   ' regions and nothing else — every one the overlay declares (' +
   (declaredIds.join(', ') || 'none') + ') is present, the works are not' +
   (missingFromMenu.length ? ' — MISSING: ' + missingFromMenu.join(', ') : ''));

/* W6 — ART IS A REGION NOW, AND MY WORKS HAS ITS NAME BACK.

   This used to assert the opposite, and was right to: ART was a label borrowed
   from MY WORKS while the works waited for a door of their own and ART had no
   contents — one placeholder covering for another. Both halves of that are
   over. The works have their own section, and ART arrived with five concepts
   and three beliefs out of Master Context §14. The assertion is inverted
   rather than deleted, because the thing worth guarding is the same: no region
   may quietly be a costume for another. */
const art = (OV.added || []).find(x => x.id === 'art') || {};
const stillRelabelled = (OV.relabel || []).some(x => x.id === 'my-works');
const worksIsRegion = (OV.migs || []).some(x => x.id === 'my-works');
ck('W6', art.label === 'ART' && art.empty === false && art.owns >= 8 &&
         !worksIsRegion && !stillRelabelled,
   'ART is its own region and the works are not one — ART owns ' +
   (art.owns === undefined ? '?' : art.owns) +
   ' objects under its own id, nothing is relabelled, and my-works is absent ' +
   'from the mind');

// W7 — Psychology exists and took nothing
/* W7 — A REGION DECLARED EMPTY IS ACTUALLY EMPTY, and PSYCHOLOGY is a concept.

   This read "PSYCHOLOGY is a first-class MIG, intentionally empty". It is not
   one any more: that world is BOOKS, and PSYCHOLOGY is back to being a Minor IG
   of HUMAN BEHAVIOUR, which is where it was before it was ever promoted.

   The half worth keeping is the half that was doing the work — a region the
   overlay declares EMPTY must hold nothing, because declaring emptiness and
   then quietly filling it is the fabrication the content rule forbids. That is
   now asked of every such region rather than of one by name, and the concept's
   ownership is asserted alongside it. */
const declaredEmpty = (OV.added || []).filter(x => x.empty === true);
const notEmpty = declaredEmpty.filter(x => x.owns !== 0);
const psyConcept = OV.existingPsychologyConcept || {};
ck('W7', declaredEmpty.length > 0 && notEmpty.length === 0 &&
         psyConcept.ownedBy === 'behaviour' && psyConcept.type === 'minor',
   declaredEmpty.length + ' region(s) declared empty hold nothing (' +
   declaredEmpty.map(x => x.label + ' ' + x.owns).join(', ') +
   '), and PSYCHOLOGY is a ' + (psyConcept.type || 'missing') + ' of ' +
   (psyConcept.ownedBy || 'nothing') + ' rather than a region of its own' +
   (notEmpty.length ? ' — NOT EMPTY: ' + notEmpty.map(x => x.label).join(', ') : ''));

/* M1 — brain proportions. A human brain is roughly 140 wide x 93 tall x 167
   deep, so h/w near 0.66 and d/w near 1.19. Assert the layout is in that
   neighbourhood, has two populated hemispheres, and keeps a midline clear. */
/* measure the ORGAN, not the MIG cloud inside it */
const SH = B.shell || B.extent;
const hw = SH.h / SH.w, dw = SH.d / SH.w;
ck('M1', hw > 0.45 && hw < 0.90 && dw > 0.95 && dw < 1.55 &&
         B.left >= 5 && B.right >= 5 && Math.abs(B.left - B.right) <= 3 &&
         B.midlineGap > B.radius * 0.08,
   'the layout has brain proportions — h/w ' + hw.toFixed(2) + ' (brain 0.66), d/w ' +
   dw.toFixed(2) + ' (brain 1.19), hemispheres ' + B.left + '/' + B.right +
   ', midline clear by ' + B.midlineGap);

// M2
/* The 41 that used to sit here was measured once and typed in, and ART's own
   relationships made it wrong. The brain is supposed to draw exactly the
   relationships that cross a region boundary, so that is what is asserted:
   the DRAWING against the DATA, not against a remembered number. */
/* against the relationships between regions the mind actually SHOWS. The graph
   holds more than that — an object in a hidden region keeps every link it had —
   and the brain can only draw the ones with two ends to draw. */
ck('M2', B.nodes.length === OV.migCount && B.links === r.graph.crossPlaced &&
         B.links > 0,
   'all ' + B.nodes.length + ' regions are in the brain, drawn by its ' +
   B.links + ' cross-region relationships and no others');

// M3 — hover identifies a region while the mind is CLOSED
ck('M3', r.closed.mind.open === 0 && r.closed.hPhil.st.hoverRegion >= 0 &&
         r.closed.hPsy.st.hoverRegion >= 0 &&
         r.closed.hPhil.st.hoverRegion !== r.closed.hPsy.st.hoverRegion &&
         /* compared to ITSELF before and after, not to another region. On a
            sky full of stars a cross-region comparison measures whichever
            constellation star happens to sit in the other region's box; a
            region against its own baseline cannot be confounded that way. */
         r.closed.hPhil.phil > r.closed.base.phil,
   'hovering identifies the right brain region while the mind is closed — philosophy=' +
   r.closed.hPhil.st.hoverRegion + ', ' + r.closed.secondId + '=' +
   r.closed.hPsy.st.hoverRegion);

// M4
ck('M4', r.closed.rel2.st.hoverRegion === -1 &&
         near(r.closed.rel2.phil, r.closed.base.phil, 3) &&
         near(r.closed.rel2.love, r.closed.base.love, 3),
   'the brain highlight is reversible (' + r.closed.base.phil + '/' + r.closed.base.love +
   ' -> ' + r.closed.rel2.phil + '/' + r.closed.rel2.love + ')');

// M5 — the mind actually opens, and things move
/* the brain IS the menu. Entering leaves it standing; the mind unfolds when a
   region is chosen and folds again on the way back. */
const travel = B.nodes.map(nd => nd.u ? Math.hypot(nd.b[0] - nd.u[0], nd.b[1] - nd.u[1],
                                                   nd.b[2] - nd.u[2]) : 0);
const moved = travel.filter(d => d > 40).length;
ck('M5', r.closed.mind.open === 0 && r.open.afterEnter.open === 0 &&
         r.open.afterEnter.entered === true &&
         r.open.afterPick.open === 1 && r.open.afterBack.open === 0 &&
         moved >= B.nodes.length - 1,
   'the brain IS the menu — entering leaves mindOpen at ' + r.open.afterEnter.open +
   ', choosing a region opens it to ' + r.open.afterPick.open +
   ', stepping back folds it to ' + r.open.afterBack.open + '; ' + moved + ' of ' +
   B.nodes.length + ' regions travel between the two states');

// H1
/* brain nodes are listed in MIGS order, so a MIG's index there IS its region
   index. Asserting >= 0 let a mutation map every MIG to region 0. */
const loveIdx = B.nodes.findIndex(nd => nd.id === 'love');
const psyIdx  = B.nodes.findIndex(nd => nd.id === r.closed.secondId);
ck('H1', loveIdx >= 0 && r.open.hLove.st.hoverRegion === loveIdx &&
         r.open.hLove.st.hovered === 'love' &&
         r.closed.hPsy.st.hoverRegion === psyIdx && loveIdx !== psyIdx,
   'a hover maps to exactly one MIG — love is region ' + r.open.hLove.st.hoverRegion +
   ' (its own index ' + loveIdx + '), ' + r.closed.secondId + ' is ' + r.closed.hPsy.st.hoverRegion);

// H2 / H3
/* strictly brighter: `> base * 0.98` would have accepted it getting darker */
/* ANY rise was too weak a bar. A hover does two things — raises the emphasis
   AND grows the point — so with the brightening removed entirely the growth
   alone still nudged the total from 62 to 64, and "greater than" accepted it.
   The assertion passed against a build where hovering did not brighten
   anything, which is precisely what it existed to catch.

   Measured through this same probe: with the brightening, the core reads
   44 -> 60 (+36%); without it, 44 -> 44 (+0%). The 20% bound sits between
   them with room either side. The tight window is what makes the reading
   honest — growth spreads a sprite's light outward, out of a 40px box, while
   emphasis raises it in place — and the wide reading is kept alongside so a
   world that brightens at its core while going dark overall still fails. */
const h2rise = r.open.base.loveTight ? r.open.hLove.loveTight / r.open.base.loveTight : 0;
ck('H2', r.open.hLove.love > r.open.base.love && h2rise >= 1.20,
   'the right world answers once the mind is open — love ' + r.open.base.love +
   ' -> ' + r.open.hLove.love + ', and at its core ' + r.open.base.loveTight +
   ' -> ' + r.open.hLove.loveTight + ' (+' + Math.round((h2rise - 1) * 100) +
   '%, needs +20%)');
/* the gap alone did not test RECEDING: the hovered world's own lift produced
   it even with the dimming removed. Assert the unhovered world actually darkens
   against its own baseline. */
ck('H3', r.open.hLove.phil < r.open.base.phil - 12 &&
         r.open.hLove.love - r.open.hLove.phil > 25,
   'the others recede — philosophy drops ' + r.open.base.phil + ' -> ' + r.open.hLove.phil +
   ' while love is hovered, leaving a gap of ' + (r.open.hLove.love - r.open.hLove.phil));

// H4
ck('H4', near(r.open.rel.love, r.open.base.love, 3) && near(r.open.rel.phil, r.open.base.phil, 3),
   'release restores the baseline (' + r.open.base.love + '/' + r.open.base.phil + ' -> ' +
   r.open.rel.love + '/' + r.open.rel.phil + ')');

/* R1 — the fix itself. Visibility must track the camera's distance to the
   SELECTED world against that world's own range, and must NOT be the old
   origin-distance rule. Every world sits far from the origin, so the old rule
   collapsed to ~0.008 in all three; if focusMix still tracked it, all three
   would be equal and tiny. */
const wv = r.worlds;
const mixes = ['philosophy', 'love', 'observation'].map(k => wv[k].focusMix);
const originMix = ['philosophy', 'love', 'observation'].map(k => wv[k].globalMix);
ck('R1', mixes.every(m => m > 0.5) && originMix.every(m => m < 0.2) &&
         ['philosophy', 'love', 'observation'].every(k =>
           wv[k].camFromWorld !== null && wv[k].camFromWorld < wv[k].range),
   'visibility is judged against the SELECTED world, not the origin — focusMix ' +
   mixes.map(m => m.toFixed(2)).join('/') + ' while the origin rule gives ' +
   originMix.map(m => m.toFixed(3)).join('/'));

['R2 philosophy', 'R3 love', 'R4 observation'].forEach(s => {
  const [id, key] = [s.slice(0, 2), s.slice(3)];
  const v = wv[key];
  ck(id, v.focusMix > 0.5 && v.focusRegion >= 0,
     key + "'s relationships resolve when you are in it — camera " + v.camFromWorld +
     ' from the world, range ' + v.range + ', mix ' + v.focusMix.toFixed(2));
});

/* W8 — NO TWO OBJECTS SHARE AN ID, AND NO REGION TAKES ONE A CONCEPT HOLDS.

   This asserted that a specific collision had been resolved by a specific
   rename: PSYCHOLOGY the region took the id, and PSYCHOLOGY the concept was
   re-keyed out of its way. Both halves of that are gone — the region is BOOKS,
   the concept has its own id back, and the rename that carried the collision
   has been deleted rather than left standing over nothing.

   What the rename existed to protect is still true and is worth more as a
   general rule than as a note about one pair: an id names exactly one thing in
   this mind, and a region may not take an id a concept is already using. That
   holds whether or not anyone is being promoted today, and it is what would
   catch the next promotion done carelessly. */
const allIds = (r.closed.nodes || []).map(n => n.id);
const dupIds = allIds.filter((id, i) => allIds.indexOf(id) !== i);
const conceptIds = {};
(r.closed.nodes || []).forEach(n => { if (n.t === 'minor') conceptIds[n.id] = n.mig; });
const stolen = (r.closed.menu || []).filter(m => conceptIds[m.id] !== undefined);
ck('W8', allIds.length > 0 && dupIds.length === 0 && stolen.length === 0,
   'an id names exactly one thing — ' + allIds.length + ' objects, no duplicates, ' +
   'and no region has taken an id a concept holds' +
   (dupIds.length ? ' — DUPLICATED: ' + dupIds.join(', ') : '') +
   (stolen.length ? ' — TAKEN FROM A CONCEPT: ' +
      stolen.map(m => m.id + ' (a concept of ' + conceptIds[m.id] + ')').join(', ') : ''));

/* W9 — every MIG states its source, and an unassigned one says so */
const sky9 = r.closed.sky || [];
const menuSrc9 = {}; (r.closed.menu || []).forEach(m => menuSrc9[m.id] = m.source);
const srcBad = sky9.filter(m => m.shown !== null && m.shown !== m.expected);
/* an uncharted region must SAY so somewhere, and the sky cannot say it */
const silent = sky9.filter(m => !m.shown && menuSrc9[m.id] !== 'not yet charted');
const charted = sky9.filter(m => m.shown);
/* derived rather than listed, for the reason recorded on braincheck B19: a
   hardcoded roster of system names is maintenance, not a test, and each world
   added was making the same edit in two files. A source must be unique to its
   region, and no region may invent one. */
/* the same census turned rule: it required a topic without a world, and there
   is no longer one. What is asserted is that nothing claims what it lacks. */
ck('W9', srcBad.length === 0 && silent.length === 0 && charted.length >= 6 &&
         new Set(charted.map(m => m.shown)).size === charted.length,
   'no world claims a heritage it does not have — ' +
   charted.map(m => m.id + '=' + m.shown).join(', ') + '; the other ' +
   (sky9.length - charted.length) + ' declare themselves uncharted' +
   (silent.length ? ' — SILENT: ' + silent.map(m => m.id).join(', ') : '') +
   (srcBad.length ? ' — WRONG: ' + srcBad.map(m => m.id).join(', ') : ''));

/* M6 — the whole brain is in frame, not cropped and not zoomed into a MIG */
const FR = B.frame || {};
ck('M6', FR.offScreen === 0 && FR.margin > 20 &&
         FR.fillsW > 0.28 && FR.fillsW < 0.98 && FR.fillsH > 0.28 && FR.fillsH < 0.98,
   'the whole brain is framed — ' + FR.offScreen + ' regions off screen, ' +
   FR.margin + 'px clear of every edge, filling ' + FR.fillsW + ' x ' + FR.fillsH +
   ' of a ' + FR.w + 'x' + FR.h + ' frame');

/* MI1-3 — naming one idea lights that idea, and only that one */
const MN = r.minor || {};
ck('MI1', MN.on && MN.on.st.hoverNode === MN.on.st.expectedIndex && MN.on.st.hoverNode >= 0 &&
          MN.on.st.hovered === 'curiosity' && MN.on.cur > MN.base.cur,
   'hovering a Minor IG lights exactly that object — curiosity is vertex ' +
   (MN.on ? MN.on.st.hoverNode : '?') + ', brightness ' + (MN.base ? MN.base.cur : '?') +
   ' -> ' + (MN.on ? MN.on.cur : '?'));
ck('MI2', MN.on && MN.on.eth < MN.base.eth && (MN.on.cur - MN.on.eth) > 25,
   'the objects it did not name recede — meaning ' + (MN.base ? MN.base.eth : '?') + ' -> ' +
   (MN.on ? MN.on.eth : '?') + ', leaving curiosity ' +
   (MN.on ? (MN.on.cur - MN.on.eth) : '?') + ' brighter');
ck('MI3', MN.off && MN.off.st.hoverNode === -1 && MN.off.st.hovered === null &&
          near(MN.off.cur, MN.base.cur, 2) && near(MN.off.eth, MN.base.eth, 2),
   'releasing restores the baseline exactly (' + (MN.base ? MN.base.cur + '/' + MN.base.eth : '?') +
   ' -> ' + (MN.off ? MN.off.cur + '/' + MN.off.eth : '?') + ')');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' architecture invariants hold');
console.log('  ' + OV.migCount + ' MIGs · ' + Object.keys(W.types).map(t => t + ' ' + W.types[t]).join(' · '));
console.log('  draw calls ' + r.perf.calls + ' · geometries ' + r.perf.geometries +
            ' · textures ' + r.perf.textures + ' · points ' + r.perf.points);
console.log(bad ? '\n' + bad + ' PROBLEM(S)' : '\nthe brain opens into the universe, and one rule governs both');
process.exit(bad ? 1 : 0);
