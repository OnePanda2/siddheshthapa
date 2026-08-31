/* BRAIN V3, part 1 — the site becomes deep space.

   The scene's ground and fog were built for ink on white. Everything that
   assumed a pale page has to be re-founded on a dark one, or the mind renders
   as dark marks on a dark sky and disappears. */
const fs = require('fs');
const F = 'src/v02-app.js';
const sky = require('./const/sky.js').SRC;
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the two founding tones */
sub(`var GROUND=new THREE.Color(0xfbfcfd), FAR_TONE=new THREE.Color(0xc9d3dc);`,
`/* DEEP SPACE. GROUND is the sky behind everything; FAR_TONE is what distance
   drains toward — on a dark ground that is DARKER, not lighter, which inverts
   the whole atmospheric-perspective model the scene was built on. */
var GROUND=new THREE.Color(0x05070f), FAR_TONE=new THREE.Color(0x0b1020);`);

/* the deep field, all three layers, injected before the scene is built */
sub(`if(glOK){
  scene=new THREE.Scene();
  scene.background=GROUND;
  scene.fog=new THREE.FogExp2(FAR_TONE.getHex(), 0.0008);`,
`/* ── THE DEEP FIELD ──────────────────────────────────────────────────
   Three layers split by spatial frequency, each painted or placed ONCE at
   boot. Nothing here is recomputed per frame: a procedural sky recalculated
   every frame is exactly the cost that makes a page unusable on a modest
   machine, and none of it moves. */
${sky.trim()}

if(glOK){
  scene=new THREE.Scene();
  scene.background=GROUND;
  scene.fog=new THREE.FogExp2(FAR_TONE.getHex(), 0.0008);
  scene.add(buildGas());
  scene.add(buildDeepSky());`);

console.log(n + ' edits applied');
