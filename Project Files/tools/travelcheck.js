/* travelcheck.js — choosing a region must actually take you there.

   These assertions exist because two real bugs made "click a MIG and see
   nothing" possible, and 105 existing invariants all passed while they were
   live. Both were invisible to the other suites for the same reason: every
   other check runs under prefers-reduced-motion, where the mind snaps open
   instantly and the camera teleports, so neither the morph nor the flight is
   ever exercised. THIS SUITE RUNS WITH MOTION ENABLED. That is the point of
   it, and it must stay that way.

   The two bugs:

     1. A region chosen WHILE a transition was in flight was silently
        discarded. travelTo refused to start a morph if one was already
        running, so the morph already heading somewhere else carried on — and
        clicking a MIG while the mind was closing left the mind CLOSED with
        the state saying 'region'. The world's objects were still folded
        inside the brain. Clicking again worked, because by then nothing was
        in flight.

     2. A degenerate viewport produced an absurd camera distance. With a
        canvas of zero size, camera.aspect is zero and the framing rule
        divided a world's radius by nothing: a world 105 units across asked to
        be viewed from 93,812, putting every object off screen.

   usage: node tools/travelcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const MIG_TOTAL = require('../.p3/expect.js').expectedMigs().total;
const W = 1440, H = 900;

const tmp = (require('./scratch.js').root() + '/tv-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(tmp + '/p.html', fs.readFileSync(FILE, 'utf8') + `
<script>
/* real time has to pass for a time-driven morph to move: settle() runs step()
   in a synchronous loop, and performance.now() barely advances between
   synchronous calls. Frames are stepped one at a time with a wait between. */
function tick(M,n,ms){
  return new Promise(function(res){
    var i=0;
    (function go(){
      if(i++>=n) return res();
      M.settle(1);
      setTimeout(go, ms||70);
    })();
  });
}
setTimeout(async function(){
  var out={};
  try{
    var M=window.__v02;
    if(!M||!M.ok()){ document.title=JSON.stringify({ERROR:'no webgl'}); return; }
    out.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    M.enter(); M.settle(60);
    out.mmm={ morph:M.morph(), cam:M.camera(), mind:M.mind() };

    /* a clean selection from a settled mind */
    M.go('region','observation');
    out.picked={ morph:M.morph(), cam:M.camera(), mind:M.mind() };

    /* THE INTERRUPTION. Leave for the mind, then choose a region before the
       return has finished. This is the sequence that used to end with the
       mind closed and the world invisible. */
    M.go('universe');
    /* park the return HALF DONE, which is the state the bug lived in */
    var leaving=M.parkMorph(0.4, 0);
    M.go('region','love');
    out.interrupt={ leaving:leaving, after:M.morph(), mind:M.mind() };

    /* every world's fit, to prove none can fling the camera */
    out.fits={};
    ['philosophy','love','observation'].forEach(function(id){
      M.go('region',id);
      /* ARRIVING IS BOTH JOURNEYS. The interruption above deliberately leaves
         the fold parked at 0.4, and a time-driven morph does not advance
         inside a synchronous harness — so landing only the camera measured a
         world still half folded into the brain against a camera framed for
         the unfolded one, and called the difference "off screen". Land the
         fold too, without re-framing: setOpen would recompute the camera and
         hide the framing decision this suite exists to measure. */
      M.parkMorph(1,1);
      M.arrive();                       /* measure the destination, not the departure */
      M.settle(30);
      var f=M.framing(id);
      out.fits[id]={ radius:f.radius, fit:f.fit, camDist:f.camDist,
                     wantDist:f.wantDist, offScreen:f.principal.offScreen };
    });

    /* THE FIRST SELECTION FROM THE CLOSED MIND, for every region.

       This is the path a visitor actually takes, and the one the other
       measurements above never cover: they select from wherever the previous
       step left the mind, which after the first world is already unfolded.
       Forced back to the closed menu each time, then landed WITHOUT
       re-framing — setOpen would recompute the camera and hide the very
       defect under test, so the fold is parked and the flight arrived. */
    out.firstEntry={};
    M.arch().migIds.forEach(function(id){
      try{
        M.setOpen(0); M.go('universe',null); M.setOpen(0);
        M.go('region', id);
        M.parkMorph(1,1);
        M.arrive();
        M.settle(30);
        var pr=M.project(id);
        /* the sheet is measured PER REGION, not once: it is as tall as the
           region's own contents, so MUSIC with nothing in it and PHILOSOPHY
           with 21 objects do not leave the same space to arrive in */
        var sr=document.getElementById('semantic').getBoundingClientRect();
        out.firstEntry[id]= pr ? {on:!!pr.onScreen, x:Math.round(pr.x), y:Math.round(pr.y),
                                  shTop:Math.round(sr.top), shRight:Math.round(sr.right),
                                  threw:false}
                               : {on:false, x:null, y:null, threw:false};
      }catch(e){
        out.firstEntry[id]={on:false, x:null, y:null, threw:(e&&e.message)||String(e)};
      }
    });
    out.vw=window.innerWidth; out.vh=window.innerHeight;
    out.phone=window.innerWidth<768;

    /* and back to the mind */
    M.setOpen(1); M.go('universe'); M.settle(80);
    out.returned={ morph:M.morph(), mind:M.mind() };
    out.perf=M.perf();

    /* MEASURED LAST, ON PURPOSE. This block establishes its own state —
       the closed menu, fold parked, flight landed — and parking the fold
       leaves a morph target behind. Sitting earlier in the probe, that
       stale target was still there when T8 read the return and T8 passed
       while the mutation that removes the mind's close was live. Nothing
       reads the scene after this point, so nothing can be contaminated. */
    /* THE NAMES IN THE OUTER MENU MUST BE WHOLLY ABOVE THE SHEET.

       Overlap between two labels was already asserted; a label sliding UNDER
       the panel is a different failure and was not. On a phone the sheet is
       below the organ, every region name carried a second line naming its
       system, and SOCIETY's ran twelve pixels past the sheet's top edge with
       its source line sliced in half. Measured from the transform each label
       was actually given, parsed rather than matched, because this probe sits
       inside a template literal that eats a regex's backslashes. */
    /* LANDED, NOT MID-FLIGHT. This suite runs with motion enabled on purpose,
       so a plain settle after go('universe') measures a camera still on its
       way home — the first version of this read ART inside the column at a
       desktop width where the resting menu has nothing there at all. The fold
       is parked and the flight arrived, the same way T9 and T11 measure a
       destination rather than a departure. */
    M.setOpen(0); M.go('universe',null);
    M.parkMorph(0,0); M.arrive(); M.settle(120);
    var shR=document.getElementById('semantic').getBoundingClientRect();
    out.sheet={ top:Math.round(shR.top), right:Math.round(shR.right) };
    out.buried=[];
    [].forEach.call(document.querySelectorAll('.lb'), function(e){
      if(e.style.display==='none') return;
      var tr=e.style.transform, k=tr.lastIndexOf('translate(');
      if(k<0) return;
      var n=tr.slice(k+10).split(',');
      var cx=parseFloat(n[0])||0, cy=parseFloat(n[1])||0;
      var w=e.offsetWidth, h=e.offsetHeight;
      var L=cx-w/2, R=cx+w/2, T=cy-h/2, B=cy+h/2;
      var hits = (window.innerWidth<768)
        ? (B > shR.top && R > shR.left && L < shR.right)
        : (L < shR.right && B > shR.top && T < shR.bottom);
      if(hits) out.buried.push(e.textContent.trim().split(String.fromCharCode(10))[0]);
    });
  }catch(e){ out.ERROR=(e&&e.message)||String(e); }
  document.title=JSON.stringify(out);
},300);</script>`, 'utf8');

/* NO --force-prefers-reduced-motion. Under reduced motion the mind snaps and
   the camera teleports, which is exactly why neither bug was ever caught. */
function run(w, h, tag) {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr-' + tag + '" --no-first-run --no-default-browser-check' +
    ' --disable-extensions --disable-background-networking --disable-sync' +
    ' --window-size=' + w + ',' + h + ' --virtual-time-budget=7000' +
    ' --dump-dom "file:///' + tmp + '/p.html"',
    { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
  const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
  if (!mm) { console.error('  the page never reported at ' + w + 'x' + h); process.exit(1); }
  const rr = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                             .replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  if (rr.ERROR) { console.error('  ' + rr.ERROR + ' at ' + w + 'x' + h); process.exit(1); }
  return rr;
}

const r = run(W, H, 'desk');
/* THE SECOND VIEWPORT. Framing is composed against the sheet, and the sheet
   moves: beside the mind on a desktop, BELOW it on a phone. A first-entry
   sweep at one width therefore proves nothing about the other, and the phone
   is where the generic branch was landing worlds under the panel. */
const rp = run(390, 844, 'phone');

let bad = 0;
const TOTAL = 12;
function ck(id, ok, msg) {
  if (!ok) bad++;
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + id.padEnd(4) + '  ' + msg);
}

/* T1 — the suite is worthless if it runs under reduced motion, so it checks */
ck('T1', r.reduced === false && r.mmm.morph.reduced === false,
   'this suite runs with MOTION ENABLED — the browser reports reduced-motion ' +
   r.reduced + ' and the app agrees at ' + r.mmm.morph.reduced +
   '; under reduced motion the mind snaps and the camera teleports, which is ' +
   'exactly why neither bug was ever caught');

/* T2 — choosing a region aims the mind at OPEN */
ck('T2', r.picked.morph.on === true && r.picked.morph.to === 1 &&
         r.picked.mind.region === 'observation',
   'choosing a region starts the mind unfolding — morph running toward ' +
   r.picked.morph.to + ' with region ' + r.picked.mind.region);

/* T3 — THE INTERRUPTION. The bug. A selection made mid-transition must
   retarget the morph from wherever it currently is, never be discarded. */
ck('T3', r.interrupt.leaving.to === 0 && r.interrupt.leaving.on === true &&
         r.interrupt.after.to === 1 && r.interrupt.after.on === true &&
         r.interrupt.mind.region === 'love',
   'a region chosen mid-transition turns the mind around instead of being ' +
   'discarded — it was heading to ' + r.interrupt.leaving.to +
   ' and is now heading to ' + r.interrupt.after.to + ' for ' +
   r.interrupt.mind.region);

/* T4 — and it turns around FROM where it had got to, not from the start.
   The interruption is deliberately made after the return is genuinely under
   way, so 'where it had got to' is a value strictly between the endpoints —
   otherwise this assertion would pass trivially against a hardcoded zero. */
ck('T4', r.interrupt.leaving.open > 0.02 && r.interrupt.leaving.open < 0.98 &&
         r.interrupt.after.from === r.interrupt.leaving.open,
   'and it turns around from where it had actually got to — the mind was ' +
   r.interrupt.leaving.open + ' of the way closed and the new morph starts ' +
   'from exactly there, not from a standing start');

/* T5 — the flight is a journey with a bounded duration, not a teleport and
   not a wait */
ck('T5', r.picked.cam.flying === true &&
         r.picked.cam.flightMs >= 800 && r.picked.cam.flightMs <= 1600 &&
         r.picked.cam.distToWant > 100,
   'the camera flies rather than cutting — ' + r.picked.cam.distToWant +
   ' units to travel over ' + r.picked.cam.flightMs + 'ms');

/* T6 — no world can fling the camera. The ceiling is relative to the world's
   own size, so it holds whatever the viewport does. */
const fits = Object.keys(r.fits).map(k => r.fits[k]);
ck('T6', fits.every(f => f.wantDist <= f.radius * 16 && f.wantDist > 0),
   'no world can fling the camera — ' +
   Object.keys(r.fits).map(k => k + ' aiming for ' + r.fits[k].wantDist +
     ' with a radius of ' + r.fits[k].radius).join(', ') +
   ', all inside the 16x ceiling');

/* T7 — and what you arrive at is actually there to see.

   Held to the same standard worldframecheck established, for the same reason:
   a constellation is a FIXED figure and must be whole, while an orbital
   world's outer concepts travel through the frame, and standing far enough
   back to pin the outermost one permanently in view is what turns Kepler-16
   into two dots on an empty page. Demanding all of both would contradict a
   decision already made deliberately. */
const worst = fits.reduce((a, f) => (f.offScreen > a.offScreen ? f : a));
ck('T7', fits.every(f => f.offScreen <= 1) && r.fits.observation.offScreen === 0,
   'what you arrive at is there to see — ' +
   Object.keys(r.fits).map(k => k + ' ' + r.fits[k].offScreen + ' off').join(', ') +
   '; the constellation whole, the orbital worlds losing at most an outer body ' +
   'to its own orbit');

/* T8 — leaving closes the mind again */
ck('T8', r.returned.morph.to === 0 && r.returned.mind.region === null,
   'returning aims the mind back at closed — heading to ' +
   r.returned.morph.to + ' with region ' + r.returned.mind.region);

/* T9 — THE FIRST SELECTION FROM THE CLOSED MIND ARRIVES AT THE WORLD.

   frameFor reads n.pos, which applyMorph rewrites in place as the mind folds,
   so it answers "where is this object RIGHT NOW". travelTo started the fold
   and chose the camera's destination in the same tick, so from the closed
   menu every world was framed at its position INSIDE THE BRAIN — the place it
   was about to leave — and the flight landed 167 to 528 units from where the
   world actually arrived, against worlds about 100 across.

   Measured on this viewport before the fix: thirteen of fifteen regions
   landed completely off screen (philosophy at y=2710, observation at
   -6070,-38218, my-works at 3686,3058) and learning landed at x=91, behind
   the region sheet. LOVE was the only one correct, and not by design: its
   branch frames from BINARY[id].centre, a snapshot taken at build time while
   the scene still stood at universe positions, so it is the one frame source
   that never reads the live n.pos.

   Held to CLEAR OF THE SHEET rather than merely "on screen", because a world
   framed underneath the panel is exactly as invisible as one framed outside
   the viewport — and the panel is measured, not assumed, since it is as tall
   as the region's own contents.

   Checked at BOTH widths, because the composition flips: on a desktop the
   sheet is beside the mind and the world must clear its right edge; on a
   phone it is below, and the world must sit above its top. The phone was a
   separate failure of the same shape — the three charted worlds each drop
   their aim for it, but the generic branch the other twelve take did not, so
   they arrived centred vertically and therefore under the panel. */
function feMiss(res) {
  const ids = Object.keys(res.firstEntry || {});
  return { ids, bad: ids.filter(id => {
    const f = res.firstEntry[id];
    if (!f.on) return true;
    return res.phone ? !(f.y < f.shTop - 8) : !(f.x > f.shRight + 8);
  })};
}
/* T9 and T11 are kept APART rather than combined, because a single assertion
   spanning both widths is only ever as strong as its weaker half: the desktop
   mutation would carry it while the phone clause sat unverified. */
const feD = feMiss(r), feP = feMiss(rp);
const show = (res, o) => o.bad.map(id => id + ' at ' + res.firstEntry[id].x + ',' +
                                    res.firstEntry[id].y).join(', ');
/* counted from the graph, not typed: this said 15 and went red the day ART
   became a region of its own */
ck('T9', feD.ids.length === MIG_TOTAL && feD.bad.length === 0,
   'the first selection from the CLOSED mind arrives clear of the sheet for ' +
   'all ' + MIG_TOTAL + ' regions at ' + r.vw + 'x' + r.vh +
   (feD.bad.length ? ' — MISSED: ' + show(r, feD)
    : ' (x' + r.firstEntry.learning.x + ', past a sheet ending at ' +
      r.firstEntry.learning.shRight + ')'));

/* T10 — and a region is allowed to be empty.

   group() returns null for a section with nothing in it, deliberately, so an
   empty heading is never painted — but paintDOM appended that null without
   checking. MUSIC has no concepts and no writings by design, so choosing
   MUSIC or PSYCHOLOGY threw inside paintDOM and left the sheet half-painted.
   Found by sweeping all fifteen rather than the three worlds that are built. */
const threw = feD.ids.filter(id => r.firstEntry[id].threw || rp.firstEntry[id].threw);
ck('T10', threw.length === 0,
   'every region can be chosen at either width, including the ones with ' +
   'nothing in them yet' +
   (threw.length ? ' — THREW: ' + threw.map(id => id + ': ' +
      String(r.firstEntry[id].threw || rp.firstEntry[id].threw).slice(0, 44)).join('; ') : ''));

/* T11 — and the same thing on a phone, where the composition flips.

   The sheet is BELOW the mind there, not beside it, so a world framed dead
   centre is a world under the panel. Each of the three charted branches drops
   its aim for exactly this reason; the generic branch the other twelve
   regions take did not, so at a 500x749 viewport twelve of fifteen arrived at
   y=375 against a sheet starting at y=315 — on screen, and invisible.

   The lift runs along screen up rather than world up: this branch stands the
   camera on the region's own radial, so with a fixed world-Y offset the same
   number means a different screen shift per region, and BUILDING — the most
   steeply inclined — still landed 6px inside the sheet while the other
   fourteen cleared it. */
ck('T11', feP.ids.length === MIG_TOTAL && feP.bad.length === 0,
   'and on a phone, where the sheet is below rather than beside — all ' + MIG_TOTAL + ' ' +
   'arrive above it at ' + rp.vw + 'x' + rp.vh +
   (feP.bad.length ? ' — MISSED: ' + show(rp, feP)
    : ' (y' + rp.firstEntry.learning.y + ', above a sheet starting at ' +
      rp.firstEntry.learning.shTop + ')'));

/* T12 — AND ONCE THERE, THE NAMES ARE NOT BURIED BY THE PANEL.

   The menu is not only a picture, it is the navigation, and a name a visitor
   cannot read is a target they cannot choose. Two labels landing on each
   other was already covered; a label sliding under the sheet was not, and on
   a phone SOCIETY's did — twelve pixels in, with the line naming its system
   cut in half.

   THE PHONE ONLY, deliberately. The desktop is measured too and reported
   below, but it is not asserted: there the sheet is a column on the left
   while every region name sits over the organ on the right, and with BOTH
   guards removed not one desktop label moved into it. An assertion that
   cannot be made to fail is not a guard, and counting it as one would
   overstate what this suite covers. */
ck('T12', rp.buried.length === 0,
   'no region name is buried by the sheet on a phone — 15 names clear of a ' +
   'sheet starting at y' + rp.sheet.top + ' at ' + rp.vw + 'x' + rp.vh +
   ' (desktop measured too, ' + r.buried.length + ' in a column ending at x' +
   r.sheet.right + ', not asserted — nothing there can reach it)' +
   (rp.buried.length ? ' — BURIED: ' + rp.buried.join(', ') : ''));

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' travel invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)'
                : '  choosing a region takes you there, even mid-transition');
process.exit(bad ? 1 : 0);
