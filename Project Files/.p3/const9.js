/* At 375 the constellation was almost entirely off-screen: one star visible.
   The sheet takes the lower ~58% of a phone, so aiming at the figure's centre
   puts the figure behind it. Stand further back AND aim below the figure, so it
   rises into the strip that is actually visible — the same correction LOVE
   needed, applied along the constellation's own frame. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(
`    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?1.62:1.0);
    return { p:new THREE.Vector3().addVectors(n.pos, kc.frame.w.clone().multiplyScalar(Dc)),
             a:n.pos.clone() };`,
`    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var narrow=window.innerWidth<1024 && window.innerWidth>=768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?1.74:(narrow?1.18:1.0));
    var aimC=n.pos.clone();
    /* push the figure up out of the sheet by aiming below it */
    if(phoneC) aimC.add(kc.frame.v.clone().multiplyScalar(-Dc*0.30));
    return { p:new THREE.Vector3().addVectors(n.pos, kc.frame.w.clone().multiplyScalar(Dc)),
             a:aimC };`);

console.log(n + ' edits applied');
