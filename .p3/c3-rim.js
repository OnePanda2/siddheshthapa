/* The outline was being erased by its own depth fade.

   The rim lies ON the silhouette, which is by definition at the same depth as
   the centre of the organ — so pow(0.5, 5.0) reduced it to 3% and the single
   most important line in the drawing disappeared. The marks on the side face
   DO need depth separation (or the far hemisphere's copies double them); the
   contour must not be touched.

   kind 2 = surface marks, depth-faded
   kind 3 = contour and midline, always present */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* mark which features are contour */
sub(`  { id:'rim', w:1.00,`, `  { id:'rim', w:1.00, contour:true,`);
sub(`var BRAIN_MIDLINE={ id:'midline', w:0.70,`,
    `var BRAIN_MIDLINE={ id:'midline', w:0.62, contour:true,`);

sub(`    function emit(pl, w){
      for(var i=0;i<pl.length-1;i++){
        [pl[i],pl[i+1]].forEach(function(p){
          verts.push(p.x,p.y,p.z);
          cols.push(gc.r,gc.g,gc.b);
          alphas.push(0.92*w);          // the hierarchy lives here
          kinds.push(2);                // 2 = anatomy, not a relationship
          homes.push(-1);
          GYRI_COUNT++;
        });
      }
    }
    for(var side=-1;side<=1;side+=2)
      BRAIN_FEATURES.forEach(function(f){ emit(featurePoints(f,side), f.w); });
    emit(featurePoints(BRAIN_MIDLINE,1), BRAIN_MIDLINE.w);`,
`    function emit(pl, w, contour){
      for(var i=0;i<pl.length-1;i++){
        [pl[i],pl[i+1]].forEach(function(p){
          verts.push(p.x,p.y,p.z);
          cols.push(gc.r,gc.g,gc.b);
          alphas.push(w);               // the hierarchy lives here
          kinds.push(contour?3:2);      // 3 = contour, never depth-faded
          homes.push(-1);
          GYRI_COUNT++;
        });
      }
    }
    for(var side=-1;side<=1;side+=2)
      BRAIN_FEATURES.forEach(function(f){ emit(featurePoints(f,side), f.w, f.contour); });
    emit(featurePoints(BRAIN_MIDLINE,1), BRAIN_MIDLINE.w, true);`);

sub(`      '  if(kind > 1.5){',
      '    float depth = clamp((brainMid - (-(modelViewMatrix*vec4(position,1.0)).z))/220.0, -1.0, 1.0);',
      '    a = alpha * (1.0 - mindOpen) * pow(clamp(depth*0.5+0.5,0.0,1.0), 5.0);',
      '  }',`,
`      /* contour is never depth-faded: it LIVES at mid depth, so fading by depth
         erases the one line that states the organ */
      '  if(kind > 2.5){',
      '    a = alpha * (1.0 - mindOpen);',
      '  } else if(kind > 1.5){',
      '    float depth = clamp((brainMid - (-(modelViewMatrix*vec4(position,1.0)).z))/220.0, -1.0, 1.0);',
      '    a = alpha * (1.0 - mindOpen) * pow(clamp(depth*0.5+0.5,0.0,1.0), 3.0);',
      '  }',`);

/* the contour must also survive the shared kind-based localMix mix */
sub(`      '  float a=alpha*mix(lm,1.0,min(kind,1.0));',`,
    `      '  float a=alpha*mix(lm,1.0,min(kind,1.0));',`);

/* raise the marks so they read as ink on white */
sub(`  { id:'sylvian', w:0.90,`, `  { id:'sylvian', w:0.78,`);
sub(`  { id:'central', w:0.72,`, `  { id:'central', w:0.62,`);
sub(`  { id:'cerebellar', w:0.72,`, `  { id:'cerebellar', w:0.62,`);
sub(`  { id:'fold', w:0.30,`, `  { id:'fold', w:0.26,`);

console.log(n + ' edits applied');
