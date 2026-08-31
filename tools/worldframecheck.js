/* worldframecheck.js — §35.

   Choosing a world must SHOW you that world. "On screen" is not the test: the
   sheet covers the left of a desktop and the lower part of a phone, so the
   test is whether the world lands in the part of the page a person can
   actually look at. That is what M.framing() reports, and it reports it for
   every world through one shared rule rather than per-MIG camera code.

   usage: node tools/worldframecheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';

function run(W, H) {
  const tmp = (os.tmpdir() + '/wf-' + process.pid + '-' + W).split('\\').join('/');
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(tmp + '/p.html', fs.readFileSync(FILE, 'utf8') + `
<script>setTimeout(function(){
  var out={w:${W},h:${H},worlds:{}};
  try{
    var M=window.__v02;
    if(!M||!M.ok()){ document.title=JSON.stringify({ERROR:'no webgl'}); return; }
    M.enter(); M.settle(220);
    ['philosophy','love','observation'].forEach(function(id){
      M.go('region',id); M.settle(220);
      out.worlds[id]=M.framing(id);
    });
    /* BUSINESS is the densest LATENT world — the class that had no astronomy
       and therefore no branch of its own, and was framed by a constant. */
    M.go('region','business'); M.settle(220);
    out.business=M.framing('business');
    /* and back — the world camera must not still be driving */
    M.go('universe'); M.settle(260);
    out.after={ mind:M.mind(), organ:{ frame:M.organ().frame, lateralDeg:M.organ().lateralDeg } };
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
  if (!m) throw new Error('the page never reported at ' + W);
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

const D = run(1440, 900);
const P = run(375, 812);
/* THE NARROW LAPTOP. The sheet is a FIXED 380px panel while the window is
   not, so the share of the frame it takes grows as the window shrinks — and
   between the desktop and the phone there is a whole class of window where
   the panel is neither a quarter of the width nor the full width. Nothing
   measured it, and it was the worst-composed size in the product. */
const N = run(900, 700);
if (D.ERROR || P.ERROR || N.ERROR) {
  console.error('  ' + (D.ERROR || P.ERROR || N.ERROR)); process.exit(1);
}

let bad = 0;
const TOTAL = 12;
function ck(id, ok, msg) {
  if (!ok) bad++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + id.padEnd(4) + '  ' + msg);
}
const pct = f => (f.inSafe / f.total * 100).toFixed(0) + '%';

/* WF1 — a world is framed by the SHARED rule, not by having been hand-placed.
   Every world reports a measured radius and a fit distance derived from it. */
const all = Object.keys(D.worlds).map(k => D.worlds[k]);
ck('WF1', all.every(f => f && f.radius > 0 && f.fit > 0 && f.camDist > 0),
   'every world is framed by measurement — ' +
   all.map(f => f.id + ' r' + f.radius + '/fit' + f.fit + '/cam' + f.camDist).join(', '));

/* WF2 — and what it frames lands where a person is looking.

   The bar depends on whether the world's bodies MOVE, which each profile
   declares. A constellation is a fixed figure and must be whole. An orbital
   world's outer concepts travel through the frame, and standing far enough
   back to pin the outermost one permanently in view is what turns Kepler-16
   into two dots on an empty page — so its bar is its centre plus the majority
   of its bodies, not all of them. */
function bar(f){ return f.moves ? 0.60 : 1.00; }
const worst = all.reduce((a, f) => (f.principal.inSafe / f.principal.total <
                                    a.principal.inSafe / a.principal.total ? f : a));
/* and the rule has to BIND, not merely agree with what each world already
   preferred. Observation is the world that did not fit on its own, so its
   camera standing exactly at the computed fit is the proof that the shared
   rule is what placed it. */
const obD = D.worlds.observation;
ck('WF2', all.every(f => f.principal.inSafe / f.principal.total >= bar(f)) &&
          all.every(f => f.moves || f.principal.offScreen === 0),
   'every world lands in the readable area to its own standard — ' +
   all.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total +
                (f.moves ? ' (orbital, bar ' + bar(f) + ')' : ' (fixed figure, all of it)')).join(', ') +
   '; Observation stands at ' + obD.camDist + ' against a computed fit of ' + obD.fit);

/* WF3 — the sheet is accounted for: the safe area is narrower than the window
   on a desktop and shorter than it on a phone, and the framing uses it */
const ds = D.worlds.observation.safe, ps = P.worlds.observation.safe;
ck('WF3', ds.x0 > 100 && ds.y1 > 700 && ps.x0 < 20 && ps.y1 < P.h * 0.6,
   'the content panel is accounted for — desktop safe area starts at x' + ds.x0 +
   ' and runs to y' + ds.y1 + '; the phone is full width but stops at y' + ps.y1);

/* WF4 — the phone is framed on its own terms, not by squeezing the desktop */
const pw = Object.keys(P.worlds).map(k => P.worlds[k]);
/* the phone is not the desktop scaled down: its safe area is a third of the
   height rather than most of it, so the SAME world must be fitted from much
   further back. A phone reusing desktop numbers would not show that gap. */
ck('WF4', pw.every(f => f.principal.inSafe / f.principal.total >= bar(f) * 0.9) &&
          pw.every(f => f.offScreen === 0 || f.moves) &&
          P.worlds.observation.camDist > D.worlds.observation.camDist * 2,
   'the phone frames independently — ' +
   pw.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total).join(', ') +
   '; Observation stands back ' + P.worlds.observation.camDist + ' there against ' +
   D.worlds.observation.camDist + ' on a desktop, because a phone reads a different shape');

/* WF5/6/7 — the three proven worlds. Philosophy and Love are held to their
   APPROVED camera distances, because "does not regress" means the composition
   that was signed off is still the composition being rendered. */
const ph = D.worlds.philosophy, lv = D.worlds.love, ob = D.worlds.observation;
ck('WF5', ph.camDist < 145 && ph.principal.inSafe / ph.principal.total >= 0.85,
   'Philosophy does not regress — still framed at ' + ph.camDist +
   ', close enough to hold the dense TRAPPIST-1 composition, with ' +
   ph.principal.inSafe + '/' + ph.principal.total + ' of its concepts in the readable area');
ck('WF6', lv.camDist < 200 && lv.principal.inSafe / lv.principal.total >= 0.75,
   'Love does not regress — still framed at ' + lv.camDist +
   ', close enough that Kepler-16 reads as a binary rather than two dots, with ' +
   lv.principal.inSafe + '/' + lv.principal.total + ' of its concepts in the readable area');
/* and it is whole BY THE RULE, not by luck. Observation's own preferred
   distance is nearly enough on a desktop — the fit adds about 12% — so the
   assertion that matters is that the camera stands at or beyond the distance
   which guarantees the figure, rather than merely happening to clear it. */
ck('WF7', ob.principal.inSafe === ob.principal.total && ob.principal.offScreen === 0 &&
          ob.camDist >= ob.fit - 1 &&
          P.worlds.observation.principal.inSafe === P.worlds.observation.principal.total &&
          ob.moves === false,
   'Observation is whole — the figure that used to sit outside the viewport is a fixed ' +
   'constellation, so it is held to all of it: ' + ob.principal.inSafe + '/' +
   ob.principal.total + ' on a desktop and ' + P.worlds.observation.principal.inSafe + '/' +
   P.worlds.observation.principal.total + ' on a phone, standing at ' + ob.camDist +
   ' against the ' + ob.fit + ' that guarantees it');

/* WF8 — leaving a world actually leaves it: the brain is back, framed and
   lateral, and no world camera is still driving */
ck('WF8', D.after.mind.open < 0.02 && D.after.mind.region === null &&
          D.after.organ.frame.offScreen === 0 && D.after.organ.frame.inReadable &&
          D.after.organ.lateralDeg < 20,
   'returning releases the world camera — mindOpen ' + D.after.mind.open + ', region ' +
   D.after.mind.region + ', the organ back in frame at ' + D.after.organ.lateralDeg +
   ' degrees off lateral');

/* WF9 — and the narrow laptop is held to the SAME standard as the wide one.

   Between a desktop and a phone sits a window where the fixed 380px panel
   takes 44% of the width rather than 27%, and two separate things assumed it
   would not: the fit reserved a constant fraction for it, and every world
   frame aimed dead at its subject, centring it in the WINDOW rather than in
   the part of the window the panel leaves. Measured at 884x605 before the
   fix, against the very bar WF2 applies at 1440: LOVE 2/5 against a bar of
   0.60, and OBSERVATION — a fixed figure that must be whole — 6/9. Both are
   failures at the standard the wide desktop already had to meet.

   The same bar is used deliberately rather than a softened one. A smaller
   window is a reason to stand further back and compose against the panel, not
   a reason to accept a world half hidden underneath it. */
const nw = Object.keys(N.worlds).map(k => N.worlds[k]);
ck('WF9', nw.every(f => f.principal.inSafe / f.principal.total >= bar(f)) &&
          nw.every(f => f.moves || f.principal.offScreen === 0),
   'a narrow laptop is composed to the same standard as a wide one at ' +
   N.w + 'x' + N.h + ' — ' +
   nw.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total +
               (f.moves ? ' (bar ' + bar(f) + ')' : ' (whole)')).join(', ') +
   '; the panel takes ' + Math.round(nw[0].safe.x0 / N.w * 100) + '% of this width ' +
   'against ' + Math.round(all[0].safe.x0 / D.w * 100) + '% of the wide one');

/* WF10 — and the FIT reserves the panel's real width, not a constant fraction.

   WF9 is carried by the composition shift alone: sliding a world out from
   under the panel satisfies every bar even if the fit still believes the
   panel is 38% of any window. That leaves the fit's own correction unbound,
   and unbound code rots.

   LOVE is the sentinel because its composition is the widest relative to its
   centre — Kepler-16's first orbit sits at 3.15x the stellar separation — so
   it is the first world to overflow a frame that was fitted for more width
   than it has. With the fit reserving the panel's true share it keeps all
   four readable bodies it has on a wide desktop; with the constant fraction
   restored it drops to three, landing exactly ON its bar instead of above it.

   PHILOSOPHY is deliberately not held to this: it is denser, and it gives up
   one more body to a narrower window whatever the fit does. */
const loveD = D.worlds.love, loveN = N.worlds.love;
ck('WF10', loveN.principal.inSafe >= loveD.principal.inSafe &&
           loveN.camDist > loveD.camDist,
   'a narrower window is fitted from further back rather than framed for width ' +
   'it does not have — LOVE keeps ' + loveN.principal.inSafe + '/' +
   loveN.principal.total + ' readable at ' + N.w + ', the same as ' +
   loveD.principal.inSafe + '/' + loveD.principal.total + ' at ' + D.w +
   ', standing at ' + loveN.camDist + ' against ' + loveD.camDist);

/* WF11 — A DENSE WORLD LOSES NO MORE TO A NARROW WINDOW THAN TO A WIDE ONE.

   WF9 holds every world to its bar, and a bar is a floor: PHILOSOPHY sat at
   6 of 8 concepts against a bar of 0.60 and passed comfortably while losing a
   concept that a wide window keeps. A floor cannot express "no worse than
   before", so this compares the narrow window against the wide one directly.

   Two changes had to land for it to hold. The composition is pushed clear of
   the panel rather than merely off it — the mutation for this assertion is
   the weaker push, which still satisfies every bar in WF9. And the cropping
   allowance is applied against the panel's WIDE share instead of the whole
   readable fit, so it is no longer spent twice on a narrow window; that half
   is caught by WF10, where LOVE is the world it costs.

   The approved compositions are unchanged to the unit on a wide desktop:
   Philosophy still stands at 129, Love at 181. */
ck('WF11', N.worlds.philosophy.principal.inSafe >= D.worlds.philosophy.principal.inSafe &&
           N.worlds.philosophy.camDist > D.worlds.philosophy.camDist &&
           D.worlds.philosophy.camDist < 145,
   'a narrow window costs PHILOSOPHY nothing a wide one does not — ' +
   N.worlds.philosophy.principal.inSafe + '/' + N.worlds.philosophy.principal.total +
   ' at ' + N.w + ' against ' + D.worlds.philosophy.principal.inSafe + '/' +
   D.worlds.philosophy.principal.total + ' at ' + D.w + ', standing at ' +
   N.worlds.philosophy.camDist + ' against the approved ' + D.worlds.philosophy.camDist);

/* WF12 — and a world with no astronomy yet is still framed by its own size.

   The twelve latent regions had no branch of their own and stood at a flat 62
   units whatever they contained. Their profiles declared a framingBias the
   whole time and nothing ever read it: BUSINESS measured a fit of 62.4 on a
   wide desktop and 72.0 on a narrow one, and both were discarded for the
   constant — which is why it held 8 of 8 concepts readable at 1440 and 5 of 8
   at 900. 62 remains the PREFERRED distance, so a world that already framed
   well from there has not moved at all. */
ck('WF12', N.business.principal.inSafe === N.business.principal.total &&
           N.business.camDist > D.business.camDist &&
           D.business.principal.inSafe === D.business.principal.total,
   'a latent world is framed by its own size, not a constant — BUSINESS ' +
   N.business.principal.inSafe + '/' + N.business.principal.total + ' at ' + N.w +
   ', standing at ' + N.business.camDist + ' against ' + D.business.camDist +
   ' on a wide desktop, where the same fit asks for less');

console.log('\n  1440: ' + all.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total + ' @' + f.camDist).join(' · '));
console.log('  900 : ' + nw.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total + ' @' + f.camDist).join(' · '));
console.log('  375 : ' + pw.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total + ' @' + f.camDist).join(' · '));
console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' world-framing invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)' : '  choosing a world shows you that world');
process.exit(bad ? 1 : 0);
