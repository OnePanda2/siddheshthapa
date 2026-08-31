/* BRAIN V3, part 4 — the mind turns.

   Drift AND drag, but drift is metered. A constellation that must read from
   every direction is only worth building if a visitor can actually get to
   those directions, and most never drag anything — so it turns on its own.

   The cost is the honest part. Drift means the render loop stops being free
   while the mind is on screen, which is exactly the thing that must not make a
   modest machine struggle. So it is capped to roughly 20 frames a second
   rather than 60, it stops the moment a world opens or the tab is hidden, it
   never runs under prefers-reduced-motion, and it yields immediately to a drag.
   That is about a third of the cost of an unthrottled spin. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`var BRAIN_CURVE_COUNT=0;`,
`var BRAIN_CURVE_COUNT=0;
/* how far the mind has turned, and how it is being turned */
var MIND_YAW=0, MIND_PITCH=0, MIND_DRAG=false, MIND_HELD=0, MIND_LAST=0;
var MIND_DRIFT=0.026;                 // radians per second — slow enough to be weather
/* the declared lateral axis, turned by however far the visitor has turned it.
   Everything that frames or shades the mind reads THIS, so one value moves the
   camera, the depth cue and the framing together and they cannot disagree. */
function brainView(){
  var v=BRAIN_VIEW.clone();
  v.applyAxisAngle(new THREE.Vector3(0,1,0), MIND_YAW);
  var right=new THREE.Vector3().crossVectors(v,new THREE.Vector3(0,1,0)).normalize();
  v.applyAxisAngle(right, MIND_PITCH);
  return v.normalize();
}`);

/* the brain frame follows the turn */
sub(`    var d=BRAIN_VIEW.clone().multiplyScalar(BRAIN_R*k);`,
    `    var d=brainView().multiplyScalar(BRAIN_R*k);`);

/* the drift, metered, inside the loop */
sub(`  if(needFrames<=0) return;                       // P4 a still universe is free
  needFrames--; step();
}`,
`  /* THE DRIFT. Only while the mind is the subject, never in a world, never
     under reduced motion, never while it is being held, and never faster than
     it needs to be. */
  if(!reduced && !MIND_DRAG && mindOpen<0.5 && !state.region){
    var now=performance.now();
    if(now-MIND_LAST > 48 && now > MIND_HELD+2400){   // ~20fps, and not just released
      var dt=Math.min(0.25,(now-MIND_LAST)/1000);
      MIND_LAST=now;
      MIND_YAW += MIND_DRIFT*dt;
      var bf=frameFor('universe');
      wantPos.copy(bf.p); wantAim.copy(bf.a);
      invalidate(2);
    }
  }
  if(needFrames<=0) return;                       // P4 a still universe is free
  needFrames--; step();
}

/* ── TAKING HOLD OF THE MIND ─────────────────────────────────────────
   Drag to turn it. Only in the brain, only on the canvas itself, and it
   yields the drift for a moment afterwards so the thing you positioned stays
   where you put it. */
(function(){
  if(!glOK||!renderer) return;
  var el=renderer.domElement, px=0, py=0, id=null, moved=0;
  el.addEventListener('pointerdown',function(e){
    if(mindOpen>0.5 || state.region) return;
    id=e.pointerId; px=e.clientX; py=e.clientY; moved=0;
    MIND_DRAG=true;
    try{ el.setPointerCapture(id); }catch(_){}
  });
  el.addEventListener('pointermove',function(e){
    if(!MIND_DRAG || e.pointerId!==id) return;
    var dx=e.clientX-px, dy=e.clientY-py;
    px=e.clientX; py=e.clientY; moved+=Math.abs(dx)+Math.abs(dy);
    MIND_YAW   -= dx*0.0052;
    /* pitch is bounded: past about fifty degrees you are looking at the mind
       from underneath, which is a view of a brain nobody can read */
    MIND_PITCH = Math.max(-0.88, Math.min(0.88, MIND_PITCH - dy*0.0040));
    var bf=frameFor('universe');
    wantPos.copy(bf.p); wantAim.copy(bf.a);
    invalidate(8);
  });
  function release(e){
    if(!MIND_DRAG || (e && e.pointerId!==id)) return;
    MIND_DRAG=false; MIND_HELD=performance.now(); MIND_LAST=MIND_HELD;
    try{ el.releasePointerCapture(id); }catch(_){}
    id=null;
  }
  el.addEventListener('pointerup',release);
  el.addEventListener('pointercancel',release);
  el.addEventListener('pointerleave',release);
})();`);

console.log(n + ' edits applied');
