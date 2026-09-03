/* Put the folds into the scene, and make the MMM stay a brain.

   Folds: appended to the existing line buffer as kind=2 — no new geometry, no
   new draw call. They fade out as the mind opens, and the far hemisphere
   recedes so the two do not read as a tangle.

   MMM: entering the mind no longer expands it. The brain IS the menu. The mind
   unfolds only when a region is chosen, and folds again on the way back. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── the folds join the shared line buffer ──────────────────────────── */
sub(`  var lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));`,
`  /* THE FOLDS — render-only, kind 2, appended to the same buffer so they cost
     no extra draw call. Declared here and nowhere else. */
  GYRI_COUNT=0;
  (function(){
    var gc=new THREE.Color(0x8e9bb0);
    for(var side=-1;side<=1;side+=2){
      for(var k=0;k<GYRI_BANDS;k++){
        var pl=gyrusPoints(k,side);
        for(var i=0;i<pl.length-1;i++){
          [pl[i],pl[i+1]].forEach(function(p){
            verts.push(p.x,p.y,p.z);
            cols.push(gc.r,gc.g,gc.b);
            alphas.push(0.30);
            kinds.push(2);              // 2 = brain surface, not a relationship
            homes.push(-1);
            GYRI_COUNT++;
          });
        }
      }
    }
  })();
  var lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));`);

sub(`var LINE_WALK=null, RENDER_ONLY=[];`,
    `var LINE_WALK=null, RENDER_ONLY=[], GYRI_COUNT=0;`);

/* the shader: folds belong to the brain, and the far hemisphere recedes */
sub(`      'uniform float hoverRegion; uniform float hoverMix; uniform float mindOpen;',`,
    `      'uniform float hoverRegion; uniform float hoverMix; uniform float mindOpen;',
      'uniform float brainMid;',`);

sub(`      '  float a=alpha*mix(lm,1.0,kind);',`,
`      '  float a=alpha*mix(lm,1.0,min(kind,1.0));',
      /* the folds are the brain's surface: they exist only while it is closed,
         and the far hemisphere falls back so the two do not read as a tangle */
      '  if(kind > 1.5){',
      '    float depth = clamp((brainMid - (-(modelViewMatrix*vec4(position,1.0)).z))/220.0, -1.0, 1.0);',
      '    a = alpha * (1.0 - mindOpen) * mix(0.16, 1.0, depth*0.5+0.5);',
      '  }',`);

sub(`    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;`,
    `    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;
    LU.brainMid.value=camPos.length();`);

sub(`               hoverRegion:{value:-1.0}, hoverMix:{value:0.0},   // the world being pointed at
               mindOpen:{value:0.0} },`,
    `               hoverRegion:{value:-1.0}, hoverMix:{value:0.0},   // the world being pointed at
               mindOpen:{value:0.0}, brainMid:{value:600.0} },`);

/* LINE_WALK must not tread on the folds: it rewrites only the relationship
   vertices, which sit before them in the buffer */
sub(`  if(lineSeg && LINE_WALK){
    var la=lineSeg.geometry.attributes.position;
    LINE_WALK(function(k,p){ la.array[k*3]=p.x; la.array[k*3+1]=p.y; la.array[k*3+2]=p.z; });
    la.needsUpdate=true;
  }`,
`  if(lineSeg && LINE_WALK){
    /* the folds are static and live AFTER the relationship vertices, so the
       walk can never reach them */
    var la=lineSeg.geometry.attributes.position;
    LINE_WALK(function(k,p){ la.array[k*3]=p.x; la.array[k*3+1]=p.y; la.array[k*3+2]=p.z; });
    la.needsUpdate=true;
  }`);

/* ── the MMM stays a brain ──────────────────────────────────────────── */
sub(`  /* the brain expands. Not a fade: the regions travel outward, their
     relationships stretch, and what each region was holding flies out of it. */
  state.mode='universe'; state.region=null; state.focus=null;
  var uf=frameFor('universe');
  wantPos.copy(uf.p); wantAim.copy(uf.a);
  if(reduced||LITE){ setMindOpen(1); camPos.copy(wantPos); camAim.copy(wantAim); }
  else { MORPH_ON=true; morphT=0; morphStart=0; }
  invalidate(200);
  paintDOM();`,
`  /* Entering does NOT expand the mind. The brain IS the menu: you look at the
     whole organ, point at a region to identify it, and the mind unfolds only
     when you choose one. */
  state.mode='universe'; state.region=null; state.focus=null;
  var uf=frameFor('universe');
  wantPos.copy(uf.p); wantAim.copy(uf.a);
  invalidate(200);
  paintDOM();`);

/* the mind unfolds when a region is entered, and folds again on the way back */
sub(`function travelTo(mode,id,push){
  if(push!==false) history.push({mode:state.mode, focus:state.focus, region:state.region});
  state.mode=mode;`,
`function travelTo(mode,id,push){
  if(push!==false) history.push({mode:state.mode, focus:state.focus, region:state.region});
  /* the brain opens into the world you chose, and closes behind you */
  var wantOpen = (mode==='universe' && !id) ? 0 : 1;
  if(entered && wantOpen!==mindOpen && !MORPH_ON){
    if(reduced||LITE){ setMindOpen(wantOpen); }
    else { MORPH_FROM=mindOpen; MORPH_TO=wantOpen; MORPH_ON=true; morphT=0; morphStart=0; }
  }
  state.mode=mode;`);

sub(`var morphT=0, morphStart=0;`,
    `var morphT=0, morphStart=0, MORPH_FROM=0, MORPH_TO=1;`);

sub(`    var e=1-Math.pow(1-morphT,3);
    setMindOpen(e);`,
    `    var e=1-Math.pow(1-morphT,3);
    setMindOpen(MORPH_FROM+(MORPH_TO-MORPH_FROM)*e);`);

/* the brain frame is the frame whenever no region is chosen */
sub(`  if(mode==='universe' && !entered){`,
    `  if(mode==='universe'){`);

console.log(n + ' edits applied');
