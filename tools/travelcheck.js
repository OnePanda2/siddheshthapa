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
const W = 1440, H = 900;

const tmp = (os.tmpdir() + '/tv-' + process.pid).split('\\').join('/');
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
      M.arrive();                       /* measure the destination, not the departure */
      M.settle(30);
      var f=M.framing(id);
      out.fits[id]={ radius:f.radius, fit:f.fit, camDist:f.camDist,
                     wantDist:f.wantDist, offScreen:f.principal.offScreen };
    });

    /* and back to the mind */
    M.go('universe'); M.settle(80);
    out.returned={ morph:M.morph(), mind:M.mind() };
    out.perf=M.perf();
  }catch(e){ out.ERROR=(e&&e.message)||String(e); }
  document.title=JSON.stringify(out);
},300);</script>`, 'utf8');

/* NO --force-prefers-reduced-motion. Under reduced motion the mind snaps and
   the camera teleports, which is exactly why neither bug was ever caught. */
const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=7000' +
  ' --dump-dom "file:///' + tmp + '/p.html"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });

const m = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!m) { console.error('  the page never reported'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
if (r.ERROR) { console.error('  ' + r.ERROR); process.exit(1); }

let bad = 0;
const TOTAL = 8;
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

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' travel invariants hold');
console.log(bad ? '  ' + bad + ' PROBLEM(S)'
                : '  choosing a region takes you there, even mid-transition');
process.exit(bad ? 1 : 0);
