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
if (D.ERROR || P.ERROR) { console.error('  ' + (D.ERROR || P.ERROR)); process.exit(1); }

let bad = 0;
const TOTAL = 8;
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

console.log('\n  1440: ' + all.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total + ' @' + f.camDist).join(' · '));
console.log('  375 : ' + pw.map(f => f.id + ' ' + f.principal.inSafe + '/' + f.principal.total + ' @' + f.camDist).join(' · '));
console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' world-framing invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)' : '  choosing a world shows you that world');
process.exit(bad ? 1 : 0);
