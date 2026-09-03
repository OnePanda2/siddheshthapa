/* The arcs were straight chords cutting through the middle of the shell, so
   forty-one of them read as a net strung across a space rather than as the
   surface of something. A brain is read from its surface.

   While the mind is closed, an arc travels ACROSS THE SHELL: the two endpoints'
   directions are interpolated and the result dropped back onto the brain
   surface, so every relationship becomes a curve lying on the organ. As the
   mind opens the same arc straightens into the wide bow it has in the universe. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  LINE_WALK=function(write){
    var k=0;
    LINKS.forEach(function(l){
      var A=byId[l.a], B=byId[l.b];
      if(!A.pos||!B.pos) return;
      var cross=(A.mig!==B.mig);
      for(var s=0;s<SEGS;s++){
        var t0=s/SEGS, t1=(s+1)/SEGS;
        [t0,t1].forEach(function(t){
          var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
          if(cross){
            /* in the brain the arcs hug the shell and trace the silhouette;
               out in the universe they bow wide across open space */
            var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*(0.04+0.10*mindOpen);
            p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
          }
          write(k++, p);
        });
      }
    });
    return k;
  };`,
`  LINE_WALK=function(write){
    var k=0;
    LINKS.forEach(function(l){
      var A=byId[l.a], B=byId[l.b];
      if(!A.pos||!B.pos) return;
      var cross=(A.mig!==B.mig);
      var onShell=(mindOpen<0.999 && A.bPos && B.bPos);
      var dA=onShell?A.bPos.clone().normalize():null;
      var dB=onShell?B.bPos.clone().normalize():null;
      for(var s=0;s<SEGS;s++){
        var t0=s/SEGS, t1=(s+1)/SEGS;
        [t0,t1].forEach(function(t){
          var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
          if(cross){
            var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*(0.04+0.10*mindOpen);
            p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
          }
          if(onShell){
            /* a curve lying ON the brain, not a chord through it */
            var dm=dA.clone().lerp(dB,t);
            if(dm.lengthSq()>1e-9){
              var surf=brainShell(dm.normalize());
              p.lerpVectors(surf,p,mindOpen);
            }
          }
          write(k++, p);
        });
      }
    });
    return k;
  };`);

console.log(n + ' edits applied');
