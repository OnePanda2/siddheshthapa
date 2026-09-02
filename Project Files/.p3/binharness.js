/* Expose the binary to the checker: barycentre, both stars, their projections,
   and whether star B is a graph node (it must NOT be). */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl);
}

sub(
`  astro:function(){`,
`  binary:function(){
    var out={worlds:{}};
    Object.keys(BINARY).forEach(function(mid){
      var b=BINARY[mid]; if(!b.centre) return;
      var A=byId[mid], iB=STARB_INDEX[mid];
      var pB=null;
      if(pts&&iB!==undefined){
        var a=pts.geometry.attributes.position.array;
        pB=new THREE.Vector3(a[iB*3],a[iB*3+1],a[iB*3+2]);
      }
      function proj(p){
        if(!p||!camera) return null;
        var v=p.clone().project(camera);
        var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
        return {x:Math.round((v.x*0.5+0.5)*w), y:Math.round((-v.y*0.5+0.5)*h),
                onScreen:(v.z<1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1),
                dist:+camera.position.distanceTo(p).toFixed(1)};
      }
      var sepScene=(A&&A.pos&&pB)? +A.pos.distanceTo(pB).toFixed(3) : null;
      var pa=proj(A&&A.pos), pb=proj(pB), pc=proj(b.centre);
      out.worlds[mid]={
        system:MIG_SYSTEM[mid],
        barycentre:b.centre.toArray().map(function(v){return +v.toFixed(2);}),
        starA:A&&A.pos?A.pos.toArray().map(function(v){return +v.toFixed(2);}):null,
        starB:pB?pB.toArray().map(function(v){return +v.toFixed(2);}):null,
        rA:+b.rA.toFixed(3), rB:+b.rB.toFixed(3), aBin:+b.aBin.toFixed(3),
        ecc:b.ecc, eccMeasured:b.eccMeasured,
        stability:+b.stability.toFixed(3),
        sizeRatio:+b.sizeRatio.toFixed(4),
        /* the defining property: A and B are always on OPPOSITE sides of the
           barycentre, and their distances hold the measured mass ratio */
        offA:A&&A.pos?+A.pos.distanceTo(b.centre).toFixed(3):null,
        offB:pB?+pB.distanceTo(b.centre).toFixed(3):null,
        oppositeDeg:(function(){
          if(!A||!A.pos||!pB) return null;
          var va=new THREE.Vector3().subVectors(A.pos,b.centre).normalize();
          var vb=new THREE.Vector3().subVectors(pB,b.centre).normalize();
          return +(Math.acos(Math.max(-1,Math.min(1,va.dot(vb))))*180/Math.PI).toFixed(2);
        })(),
        separationScene:sepScene,
        projA:pa, projB:pb, projBary:pc,
        sepPx:(pa&&pb)? Math.round(Math.sqrt(Math.pow(pa.x-pb.x,2)+Math.pow(pa.y-pb.y,2))) : null,
        starBIsGraphNode:!!byId[mid+'-starB'],
        companionCount:COMPANIONS.filter(function(c){return c.mig===mid;}).length,
        orbitRadii:(ORBITS[mid]||[]).map(function(o){ return +o.r.toFixed(3); }),
        conceptCount:(ORBITS[mid]||[]).length
      };
    });
    out.totalCompanions=COMPANIONS.length;
    out.graphNodes=NODES.length;
    out.renderedPoints=pts?pts.geometry.attributes.position.count:0;
    return out;
  },
  astro:function(){`);

fs.writeFileSync(F, s, 'utf8');
console.log('binary() harness added');
