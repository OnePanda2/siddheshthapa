/* §16/§17 — a generic world framing rule.

   A selected world could be technically rendered while sitting largely outside
   the readable area: the DOM sheet covers the left of a desktop and the lower
   half of a phone, so "on screen" is not the same as "in the safe area".

   frameWorld measures the world's ACTUAL bounds from its own objects, works out
   the distance at which that sphere fits the safe area, and returns it. It is
   applied as a MINIMUM on top of each world's preferred distance, so a world
   that already frames well is untouched — Philosophy and Love keep their
   approved compositions exactly — and a world that does not fit is pulled back
   until it does. No per-MIG camera code. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`function frameFor(mode,id){`,
`/* what does this world actually occupy? Measured from its own objects, never
   declared per MIG. */
function worldBounds(migId){
  var host=byId[migId];
  var c=(BINARY[migId]&&BINARY[migId].centre) || (host&&(host.uPos||host.pos));
  if(!c) return null;
  var maxR=0;
  (owned[migId]||[]).forEach(function(oid){
    var nd=byId[oid], p=nd&&(nd.uPos||nd.pos);
    if(p) maxR=Math.max(maxR, p.distanceTo(c));
  });
  if(host&&(host.uPos||host.pos)) maxR=Math.max(maxR,(host.uPos||host.pos).distanceTo(c));
  return { centre:c, radius:maxR };
}
/* the distance at which those bounds fit the readable area. The sheet covers
   the left of a desktop and the lower part of a phone, so the safe area is not
   the viewport. */
function fitDistance(migId){
  var b=worldBounds(migId);
  if(!b||!b.radius||!camera) return 0;
  var phone=window.innerWidth<768;
  var vHalf=(camera.fov*Math.PI/180)/2;
  var safeH=phone?0.34:0.86;            // fraction of the height that is readable
  var safeW=phone?0.86:0.62;            // the sheet takes the left of a desktop
  var tanV=Math.tan(vHalf)*safeH;
  var tanH=Math.tan(vHalf)*camera.aspect*safeW;
  return b.radius/Math.max(0.001,Math.min(tanV,tanH));
}
/* the camera position a world's own profile prefers, pulled back if it does not
   fit. A world that already frames well is left exactly as it was. */
function frameWorldPos(migId, centre, dir, preferred){
  var need=fitDistance(migId);
  var d=Math.max(preferred, need);
  return { p:new THREE.Vector3().addVectors(centre, dir.clone().normalize().multiplyScalar(d)),
           d:d, preferred:preferred, need:need };
}

function frameFor(mode,id){`);

/* the constellation world uses it */
sub(`    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var narrow=window.innerWidth<1024 && window.innerWidth>=768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?2.02:(narrow?1.22:1.0));
    var aimC=n.pos.clone();
    /* push the figure up out of the sheet by aiming below it */
    if(phoneC) aimC.add(kc.frame.v.clone().multiplyScalar(Dc*0.265));
    return { p:new THREE.Vector3().addVectors(n.pos, kc.frame.w.clone().multiplyScalar(Dc)),
             a:aimC };`,
`    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var narrow=window.innerWidth<1024 && window.innerWidth>=768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?2.02:(narrow?1.22:1.0));
    var fwC=frameWorldPos(id, n.pos, kc.frame.w, Dc);
    var aimC=n.pos.clone();
    /* push the figure up out of the sheet by aiming below it */
    if(phoneC) aimC.add(kc.frame.v.clone().multiplyScalar(fwC.d*0.265));
    return { p:fwC.p, a:aimC };`);

/* the circumbinary world uses it */
sub(`    var d0=(phoneB?3.6:2.5)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var awayB=b.centre.clone().normalize().multiplyScalar(d0*0.70);
    var liftB=new THREE.Vector3(0, d0*(phoneB?0.56:0.42), 0)
               .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=d0*0.28;
    return {p:new THREE.Vector3().addVectors(b.centre, awayB.add(liftB)), a:aimB};`,
`    var d0=(phoneB?3.6:2.5)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var dirB=b.centre.clone().normalize().multiplyScalar(0.70)
              .add(new THREE.Vector3(0,(phoneB?0.56:0.42),0)
                   .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT));
    var fwB=frameWorldPos(id, b.centre, dirB, d0*dirB.length());
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=fwB.d*0.28;
    return {p:fwB.p, a:aimB};`);

/* the planetary world uses it */
sub(`    var phone=window.innerWidth<768;
    var away=n.pos.clone().normalize().multiplyScalar(phone?168:96);
    var lift=new THREE.Vector3(0, phone?96:64, 0)
              .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aim=n.pos.clone();
    if(phone) aim.y-=46;                 // push the system up out of the sheet
    return {p:new THREE.Vector3().addVectors(n.pos, away.add(lift)), a:aim};`,
`    var phone=window.innerWidth<768;
    var dirP=n.pos.clone().normalize().multiplyScalar(phone?168:96)
              .add(new THREE.Vector3(0, phone?96:64, 0)
                   .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT));
    var fwP=frameWorldPos(id, n.pos, dirP, dirP.length());
    var aim=n.pos.clone();
    if(phone) aim.y-=46;                 // push the system up out of the sheet
    return {p:fwP.p, a:aim};`);

/* the harness reports the framing so a check can measure it */
sub(`  mind:function(){`,
`  framing:function(mid){
    var b=worldBounds(mid);
    if(!b) return null;
    var out={ id:mid, radius:+b.radius.toFixed(1), fit:+fitDistance(mid).toFixed(1),
              centre:b.centre.toArray().map(function(v){return +v.toFixed(1);}) };
    /* where every object of this world actually lands, and whether it is in the
       READABLE area rather than merely on screen */
    var W=renderer?renderer.domElement.clientWidth:0, H=renderer?renderer.domElement.clientHeight:0;
    var phone=window.innerWidth<768;
    var safe={ x0:phone?8:Math.round(W*0.27), x1:W-8,
               y0:8, y1:phone?Math.round(H*0.40):H-8 };
    var inSafe=0, total=0, off=0;
    (owned[mid]||[]).concat([mid]).forEach(function(oid){
      var nd=byId[oid]; if(!nd||!nd.pos||!camera) return;
      total++;
      var v=nd.pos.clone().project(camera);
      var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
      if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1){ off++; return; }
      if(px>=safe.x0&&px<=safe.x1&&py>=safe.y0&&py<=safe.y1) inSafe++;
    });
    out.total=total; out.inSafe=inSafe; out.offScreen=off; out.safe=safe;
    out.camDist=camera?+camera.position.distanceTo(b.centre).toFixed(1):null;
    return out;
  },
  mind:function(){`);

console.log(n + ' edits applied');
