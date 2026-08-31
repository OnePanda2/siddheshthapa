/* PART 1 — the shared localMix fix.

   The bug: relationship visibility was evaluated as `430 - camPos.length()`,
   the camera's distance from the UNIVERSE ORIGIN. But every MIG sits on a
   sphere far from that origin, so inside any world the gate evaluated to ~0.008
   and a world's own relationships were drawn at ~1% opacity. OBSERVATION needed
   a per-world bypass to be visible at all. That bypass is now removed.

   The fix is a distance MODEL, not a patch: the renderer distinguishes
     GLOBAL distance      — camera to origin, which governs cross-MIG arcs
     WORLD-LOCAL distance — camera to the world an edge belongs to
   Every internal relationship carries the index of its own world, and is
   evaluated against that world. One rule, every world, present and future. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* every edge records which world it belongs to; the constellation bypass goes */
sub(`  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[];`,
    `  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];`);

sub(`        /* kind=1 bypasses the localMix gate. A constellation's lines are not
           incidental local detail — they are the figure, and they must be
           visible wherever the figure is. */
        kinds.push((kon2||(cross&&l.keep))?1:0);`,
`        kinds.push((cross&&l.keep)?1:0);
        /* WORLD-LOCAL vs GLOBAL. An internal relationship belongs to exactly
           one world and is judged by the camera's distance to THAT world.
           A cross-MIG arc belongs to no single world, so it keeps the global
           rule. -1 means global. */
        homes.push(cross ? -1 : (migIndex2[A.mig]===undefined?-1:migIndex2[A.mig]));`);

sub(`  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];`,
    `  var migIndex2={}; MIGS.forEach(function(m,i){ migIndex2[m.id]=i; });
  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];`);

sub(`  lg.setAttribute('kind',new THREE.BufferAttribute(new Float32Array(kinds),1));`,
    `  lg.setAttribute('kind',new THREE.BufferAttribute(new Float32Array(kinds),1));
  lg.setAttribute('home',new THREE.BufferAttribute(new Float32Array(homes),1));`);

sub(`    uniforms:{ fogColor:{value:FAR_TONE}, fogDensity:{value:0.0008}, localMix:{value:0.0} },`,
`    uniforms:{ fogColor:{value:FAR_TONE}, fogDensity:{value:0.0008},
               globalMix:{value:0.0},                 // camera -> origin, for cross-MIG arcs
               focusRegion:{value:-1.0}, focusMix:{value:0.0},   // the world being visited
               hoverRegion:{value:-1.0}, hoverMix:{value:0.0} }, // the world being pointed at`);

sub(`    vertexShader:['attribute vec3 tint; attribute float alpha; attribute float kind;',
      'uniform float localMix;',
      'varying vec3 vT; varying float vA; varying float vFog;',
      'void main(){ vT=tint; vA=alpha*mix(localMix,1.0,kind); vec4 mv=modelViewMatrix*vec4(position,1.0);',`,
`    vertexShader:['attribute vec3 tint; attribute float alpha; attribute float kind;',
      'attribute float home;',
      'uniform float globalMix; uniform float focusRegion; uniform float focusMix;',
      'uniform float hoverRegion; uniform float hoverMix;',
      'varying vec3 vT; varying float vA; varying float vFog;',
      'void main(){ vT=tint;',
      /* an edge with no home is a cross-MIG arc: global rule.
         an edge with a home resolves when you are AT that world, or when you
         are pointing at it in the menu — the same reveal, one rule. */
      '  float lm = globalMix;',
      '  if(home > -0.5){',
      '    float f = (abs(home-focusRegion)<0.5) ? focusMix : 0.0;',
      '    float h = (abs(home-hoverRegion)<0.5) ? hoverMix : 0.0;',
      '    lm = max(f,h);',
      '  }',
      '  vA=alpha*mix(lm,1.0,kind); vec4 mv=modelViewMatrix*vec4(position,1.0);',`);

/* the CPU side: one global distance, one world-local distance */
sub(`  if(lineSeg){
    var d=camPos.length();
    lineSeg.material.uniforms.localMix.value=0.008+0.992*Math.max(0,Math.min(1,(430-d)/210));
  }`,
`  if(lineSeg){
    var LU=lineSeg.material.uniforms;
    /* GLOBAL — unchanged, so cross-MIG arcs behave exactly as before */
    LU.globalMix.value=0.008+0.992*Math.max(0,Math.min(1,(430-camPos.length())/210));
    /* WORLD-LOCAL — the camera's distance to the world the edge belongs to,
       against a range the world's own profile declares. This is the fix. */
    var fr=-1.0, fm=0.0;
    if(state.region && byId[state.region] && byId[state.region].pos){
      for(var mi2=0;mi2<MIGS.length;mi2++) if(MIGS[mi2].id===state.region) fr=mi2;
      var ld=camPos.distanceTo(byId[state.region].pos);
      var range=relRangeOf(state.region);
      fm=Math.max(0,Math.min(1,(range-ld)/(range*0.62)));
    }
    LU.focusRegion.value=fr; LU.focusMix.value=fm;
    var hr=-1.0;
    if(hoveredMIG){ for(var mi3=0;mi3<MIGS.length;mi3++) if(MIGS[mi3].id===hoveredMIG) hr=mi3; }
    LU.hoverRegion.value=hr;
    LU.hoverMix.value=hr>=0?0.80:0.0;
  }`);

console.log(n + ' edits applied');
