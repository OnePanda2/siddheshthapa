/* §46 step 7 — replace the line-drawn brain with the volumetric organ.

   Three separate substitutions, each one a real deletion rather than an
   addition on top:

     1. the form  — the old profile/width/shell give way to the prototyped
                    ones, plus the folds, the fissures and the mesh builder.
     2. the lines — BRAIN_FEATURES and BRAIN_MIDLINE are deleted outright.
                    Not reduced: deleted. The surface states the anatomy now,
                    so every one of those curves is decoration by definition.
     3. the camera — a genuine lateral view rather than a three-quarter one. */
const fs = require('fs');
const F = 'src/v02-app.js';
const form = require('./brainform.js').SRC;
const mat  = require('./brainmat.js').SRC;
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}
function cut(a, b, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const i = s.indexOf(a), j = s.indexOf(b, i);
  if (i < 0 || j < 0) { console.error('CUT anchor missing: ' + a.slice(0, 50) + ' .. ' + b.slice(0, 50)); process.exit(1); }
  fs.writeFileSync(F, s.slice(0, i) + repl + s.slice(j + b.length), 'utf8'); n++;
}

/* ---- 1. the form ---- */
cut('var BRAIN_R=210;', 'return p.multiplyScalar(BRAIN_R);\n}',
    form.trim() + '\n' + mat.trim());

/* ---- 2. the lines ---- */
cut('/* ── BRAIN ANATOMY ', 'function featurePoints(feat, side){',
`/* ── BRAIN ANATOMY ────────────────────────────────────────────────────
   There is none here any more, and that is the change.

   The anatomy used to be a list of curves inked over a shell. It is now the
   shell: the profile carries the lobes, the gyroid carries the cortex, and
   the two named fissures are grooves cut into the geometry. A fold is visible
   because it is lit, not because a line was drawn where a fold would be.

   featurePoints survives only because the harness measures the midline gap
   with it. Nothing is emitted into the line buffer for the brain. */
function featurePoints(feat, side){`);

sub(`    for(var side=-1;side<=1;side+=2)
      BRAIN_FEATURES.forEach(function(f){
        /* the contour is drawn ONCE. Both hemispheres carry a rim offset by the
           midline gap, and drawing both produced a doubled outline — a brain
           seen from three-quarters shows one contour and one midline. */
        if(f.contour && side<0) return;
        emit(featurePoints(f,side), f.w, f.contour);
      });
    emit(featurePoints(BRAIN_MIDLINE,1), BRAIN_MIDLINE.w, true);`,
`    /* nothing. The organ is a surface now; drawing its anatomy again in ink
       would be the exact mistake this redesign removes. */`);

/* ---- 3. the organ enters the scene ---- */
sub(`  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);`,
`  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);

  /* ── THE ORGAN ──────────────────────────────────────────────────────
     One mesh, one draw call, built once. Detail is reduced on a phone rather
     than the desktop mesh being squeezed onto it.

     depthWrite is off and it is added AFTER the points, so the mind's content
     is drawn first and the shell then lies over it: a region inside the organ
     reads as seen THROUGH tissue, which is what puts it inside rather than
     on top. */
  var phoneMesh=window.innerWidth<768;
  brainGeo=buildBrainGeometry(phoneMesh?76:128, phoneMesh?32:52);
  brainMesh=new THREE.Mesh(brainGeo, brainMaterial());
  brainMesh.renderOrder=2;
  scene.add(brainMesh);`);

sub(`var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};`,
`var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};
var brainMesh=null, brainGeo=null;`);

/* the organ dissolves as the mind unfolds, exactly like the old ink did */
sub(`    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;`,
`    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;
    if(brainMesh){
      brainMesh.material.uniforms.uOpen.value=mindOpen;
      /* a fully open mind is a universe: stop paying for the organ entirely */
      brainMesh.visible=(mindOpen<0.995);
    }`);

console.log(n + ' edits applied');
