/* BRAIN V2 — replace the rejected solid mesh with the line drawing.

   This is a removal as much as an addition. The gyroid displacement, the
   surface material, the mesh builder, the mesh itself and its three uniforms
   all go; the curves take their place and are emitted into the EXISTING line
   buffer, so the organ costs no draw call at all rather than the one the mesh
   needed. */
const fs = require('fs');
const F = 'src/v02-app.js';
const lines = require('./brainlines.js').SRC;
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}
function cut(a, b, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const i = s.indexOf(a), j = s.indexOf(b, i);
  if (i < 0 || j < 0) { console.error('CUT missing: ' + a.slice(0, 46) + ' .. ' + b.slice(0, 46)); process.exit(1); }
  fs.writeFileSync(F, s.slice(0, i) + repl + s.slice(j + b.length), 'utf8'); n++;
}

/* ---- 1. the form: everything from the fold field to the end of the surface
         material is replaced by the curve system ---- */
cut('/* ── THE CORTICAL FOLDS ─────',
    '    side:THREE.DoubleSide\n  });\n}',
    /* keep only the part of the generator that is not already in the file:
       the profile, width and shell are identical and stay where they are. */
    /* brainShell and the midline gap sat INSIDE the block being cut, between
       the fold field and the material, so they have to come back with the
       curve system or nothing downstream can place a point at all. */
    lines.slice(lines.indexOf('var BRAIN_GAP=')).trim());

/* ---- 2. the anatomy is drawn again, into the buffer that already exists ---- */
sub(`    /* nothing. The organ is a surface now; drawing its anatomy again in ink
       would be the exact mistake this redesign removes. */`,
`    /* THE BRAIN, as lines.

       Five families with deliberately unequal weight. A WebGL line is one
       pixel wide whatever lineWidth says, so a heavy curve is drawn as
       several strokes offset sideways along the surface — without that, the
       silhouette and a minor sulcus render identically and the drawing has no
       hierarchy at all.

       kind 3 is the contour class, which is never depth-faded: these curves
       live at mid depth by definition and the existing fade would delete
       them. Only the far-hemisphere ghost takes kind 2, so it recedes. */
    var BRAIN_LAYERS={
      A:{ col:0x1d2a38, a:0.95, n:3, gap:0.9, kind:3 },
      B:{ col:0x2c3e52, a:0.80, n:2, gap:0.8, kind:3 },
      C:{ col:0x51637c, a:0.46, n:1, gap:0.0, kind:3 },
      E:{ col:0x93a0b4, a:0.34, n:1, gap:0.0, kind:2 }
    };
    var phoneLine=window.innerWidth<768;
    BRAIN_CURVE_COUNT=0; GYRI_COUNT=0;
    buildBrainCurves(BRAIN_VIEW, phoneLine?0.5:1).forEach(function(c){
      var L=BRAIN_LAYERS[c.layer]||BRAIN_LAYERS.C;
      var kc=new THREE.Color(L.col);
      BRAIN_CURVE_COUNT++;
      strokeOffsets(c.pts, L.gap, L.n).forEach(function(row){
        for(var i=0;i<row.length-1;i++){
          [row[i],row[i+1]].forEach(function(p){
            verts.push(p.x,p.y,p.z);
            cols.push(kc.r,kc.g,kc.b);
            alphas.push(Math.min(1.0, L.a*c.w));
            kinds.push(L.kind);
            homes.push(-1);
            GYRI_COUNT++;
          });
        }
      });
    });`);

/* ---- 3. the mesh leaves the scene ---- */
cut('  /* ── THE ORGAN ──',
    '  scene.add(brainMesh);',
`  /* The organ is not an object in the scene any more. It is the curves above,
     inside the line buffer that was already being drawn. */`);

sub(`var brainMesh=null, brainGeo=null;`,
    `var BRAIN_CURVE_COUNT=0;`);

/* ---- 4. its per-frame uniforms go with it; the eased staging values stay,
         because the welcome composition still uses them ---- */
cut(`    if(brainMesh){
      brainMesh.material.uniforms.uOpen.value=mindOpen;`,
    `      brainMesh.visible=(mindOpen<0.995);
    }`,
`    (function(){
      /* the threshold holds the drawing quieter and off to one side; entering
         settles it to the MMM composition. Same curves, same axis. */
      var wantDim=(entered?0:1);
      if(Math.abs(wantDim-WELCOME_DIM)>0.002){
        WELCOME_DIM += (wantDim-WELCOME_DIM)*0.085;
        /* the two compositions are different framings of one drawing and
           WELCOME_DIM interpolates between them, so the frame has to be
           recomputed while it moves. */
        if(!state.region && mindOpen<0.5){
          var wf=frameFor('universe');
          wantPos.copy(wf.p); wantAim.copy(wf.a);
        }
        invalidate(6);
      } else WELCOME_DIM=wantDim;
      BRAIN_ASK += (BRAIN_ASK_TO-BRAIN_ASK)*0.16;
      if(Math.abs(BRAIN_ASK_TO-BRAIN_ASK)>0.003) invalidate(4);
      LU.brainDim.value=WELCOME_DIM;
      LU.brainAsk.value=BRAIN_ASK;
    })();`);

/* the line material learns the two staging values */
sub(`               mindOpen:{value:0.0}, brainMid:{value:600.0} },`,
    `               mindOpen:{value:0.0}, brainMid:{value:600.0},
               brainDim:{value:1.0}, brainAsk:{value:0.0} },`);
sub(`    uniforms:{ fogColor:{value:FAR_TONE}, fogDensity:{value:0.0008},`,
    `    uniforms:{ fogColor:{value:FAR_TONE}, fogDensity:{value:0.0008},`);

console.log(n + ' edits applied');
