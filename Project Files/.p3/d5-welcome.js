/* §4/§33 — the welcome and the MMM are the same organ, differently staged.

   Three faults in the first render:

     1. every region name was printed over the welcome copy. On the threshold
        the brain is atmosphere, not a menu; the names belong to the MMM.
     2. the organ sat centred, directly behind the name, so the type and the
        anatomy fought for the same pixels.
     3. it was rendered at full strength, so "quieter" was a claim rather than
        a state.

   The fix keeps ONE brain and ONE camera path. The threshold simply holds it
   dimmer and pushed to the side; entering the mind swings it back to centre
   and full strength, which is the subtle reveal 33 asks for rather than a cut
   between two different scenes. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* 1. the threshold has no menu */
sub(`    var want = n.t==='mig' ? (d<migRange && !elsewhere)`,
`    /* on the threshold the organ is atmosphere. A region name over the
       welcome copy is two things asking to be read at once. */
    if(!entered && n.t==='mig') return;
    var want = n.t==='mig' ? (d<migRange && !elsewhere)`);

/* 2 & 3. dimmer and off to one side until the mind is entered */
sub(`    if(brainMesh){
      brainMesh.material.uniforms.uOpen.value=mindOpen;`,
`    if(brainMesh){
      brainMesh.material.uniforms.uOpen.value=mindOpen;
      /* eased so the reveal is a movement, not a switch */
      WELCOME_DIM += ((entered?0:1)-WELCOME_DIM)*0.085;
      if(Math.abs((entered?0:1)-WELCOME_DIM)>0.002) invalidate(6);
      brainMesh.material.uniforms.uDim.value=WELCOME_DIM;`);

sub(`var brainMesh=null, brainGeo=null;`,
`var brainMesh=null, brainGeo=null;
/* 1 on the threshold, 0 inside the mind. Drives both how loud the organ is
   and how far it is pushed out from behind the name. */
var WELCOME_DIM=1;`);

/* the camera offset — one term, applied to the brain frame only */
sub(`    var d=BRAIN_VIEW.clone().multiplyScalar(BRAIN_R*k);
    return { p:d, a:new THREE.Vector3(0, BRAIN_R*(phoneB2?-0.14:-0.04), 0) };`,
`    var d=BRAIN_VIEW.clone().multiplyScalar(BRAIN_R*k);
    var a=new THREE.Vector3(0, BRAIN_R*(phoneB2?0.10:0.22), 0);
    /* on the threshold the name owns the left of the page, so the organ is
       aimed off-centre and drifts back as the mind is entered. On a phone the
       copy owns the middle, so it moves DOWN rather than sideways. */
    if(WELCOME_DIM>0.002){
      var off=WELCOME_DIM*BRAIN_R*(phoneB2?0.0:0.62);
      a.add(new THREE.Vector3(0,0,1).cross(BRAIN_VIEW).normalize().multiplyScalar(-off));
      if(phoneB2) a.y-=WELCOME_DIM*BRAIN_R*0.30;
    }
    return { p:d.add(a.clone().setY(0)), a:a };`);

console.log(n + ' edits applied');
