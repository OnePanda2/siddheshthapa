/* The brain still read as scattered objects. Two causes, both about the fact
   that a brain is ONE thing:

   1. The 41 cross-region arcs — the only lines that can describe the shape —
      carry an alpha tuned for the universe, where they must not become noise.
      In the brain they ARE the drawing, so they are boosted while it is closed
      and hand back to the universe value as it opens.

   2. Every region was wearing its WORLD species: a neural star, a ringed
      artifact, a binary pair. Fifteen different emblems cannot read as one
      organ. In the brain a region is just a region; the species is what it
      BECOMES when the mind opens. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── 1. the arcs draw the silhouette while the mind is closed ────────── */
sub(`               hoverRegion:{value:-1.0}, hoverMix:{value:0.0} }, // the world being pointed at`,
    `               hoverRegion:{value:-1.0}, hoverMix:{value:0.0},   // the world being pointed at
               mindOpen:{value:0.0} },`);

sub(`      'uniform float hoverRegion; uniform float hoverMix;',`,
    `      'uniform float hoverRegion; uniform float hoverMix; uniform float mindOpen;',`);

sub(`      '  vA=alpha*mix(lm,1.0,kind); vec4 mv=modelViewMatrix*vec4(position,1.0);',`,
`      '  float a=alpha*mix(lm,1.0,kind);',
      /* while the mind is closed the cross-region arcs are the brain's drawing,
         not background detail */
      '  if(home < -0.5) a *= (1.0 + 3.4*(1.0-mindOpen));',
      '  vA=a; vec4 mv=modelViewMatrix*vec4(position,1.0);',`);

sub(`    LU.focusRegion.value=fr; LU.focusMix.value=fm;`,
    `    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;`);

/* ── 2. in the brain a region is a region, not yet a world ───────────── */
sub(`      'attribute vec2 cell; attribute float size; attribute vec3 tint; attribute float emph;',`,
    `      'attribute vec2 cell; attribute vec2 cellB; attribute float size; attribute vec3 tint; attribute float emph;',`);

sub(`      '  vCell=cell; vTint=tint;',`,
`      /* a region wears its world's species only once the mind is open; before
         that every region is drawn the same way, because it is still one organ */
      '  vCell = (mindOpen < 0.5) ? cellB : cell;',
      '  vTint=tint;',`);

sub(`  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));`,
`  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));
  /* the brain cell: regions take the plain star, everything else keeps its own */
  var CELLB=new Float32Array(TOTV*2);
  var starCell=GLYPHS.indexOf('star'); if(starCell<0) starCell=1;
  for(var cb=0;cb<TOTV;cb++){
    if(ISMIG[cb]>0.5){ CELLB[cb*2]=starCell%ATLAS; CELLB[cb*2+1]=Math.floor(starCell/ATLAS); }
    else { CELLB[cb*2]=CELLA[cb*2]; CELLB[cb*2+1]=CELLA[cb*2+1]; }
  }
  geo.setAttribute('cellB',new THREE.BufferAttribute(CELLB,2));`);

console.log(n + ' edits applied');
