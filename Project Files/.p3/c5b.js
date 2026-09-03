/* the remaining two world types adopt the generic fit, plus the harness */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`    var d0=(phoneB?6.2:4.4)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var awayB=b.centre.clone().normalize().multiplyScalar(d0*0.70);
    var liftB=new THREE.Vector3(0, d0*(phoneB?0.56:0.42), 0)
               .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=d0*0.28;
    return {p:new THREE.Vector3().addVectors(b.centre, awayB.add(liftB)), a:aimB};`,
`    var d0=(phoneB?6.2:4.4)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var dirB=b.centre.clone().normalize().multiplyScalar(0.70)
              .add(new THREE.Vector3(0,(phoneB?0.56:0.42),0)
                   .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT));
    var fwB=frameWorldPos(id, b.centre, dirB, d0*dirB.length());
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=fwB.d*0.28;
    return {p:fwB.p, a:aimB};`);

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

sub(`  mind:function(){`,
`  framing:function(mid){
    var b=worldBounds(mid);
    if(!b) return null;
    var out={ id:mid, radius:+b.radius.toFixed(1), fit:+fitDistance(mid).toFixed(1) };
    /* where every object of this world lands, and whether it is in the READABLE
       area rather than merely on screen */
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
    out.total=total; out.inSafe=inSafe; out.offScreen=off;
    out.camDist=camera?+camera.position.distanceTo(b.centre).toFixed(1):null;
    return out;
  },
  mind:function(){`);

console.log(n + ' edits applied');
