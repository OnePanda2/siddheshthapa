/* §17 — hovering a region has to be ANSWERED, and inside a translucent organ
   the old answer stopped being visible.

   The emphasis was tuned against a scene of ink on white, where a 2.15x
   brightening of a small sprite was unmistakable. That sprite now sits under a
   lit surface, and a surface flattens contrast underneath it by design — the
   same property that makes the regions read as embedded makes a small change
   in one of them read as nothing.

   So the organ itself participates. When a region is named, the tissue steps
   back and that region steps forward: the shell drops its opacity, the named
   region's sprite grows and brightens hard, and its label goes to full ink.
   The brain does not stop being a brain — it becomes a brain being asked a
   question. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* 1. the tissue steps back */
sub(`      uDim:{value:0},           // the welcome page holds it quieter`,
`      uDim:{value:0},           // the welcome page holds it quieter
      uAsk:{value:0},           // a region has been named: the tissue steps back`);
sub(`uniform float uOpen; uniform float uDim;',`,
    `uniform float uOpen; uniform float uDim; uniform float uAsk;',`);
sub(`      '  a*=(1.0-uOpen)*(1.0-uDim*0.12);',`,
`      '  a*=(1.0-uOpen)*(1.0-uDim*0.12)*(1.0-uAsk*0.42);',`);

/* 2. the named region steps forward, hard enough to be seen through tissue */
sub(`      '  if(hoverRegion>=0.0){',
      '    here *= (abs(region-hoverRegion)<0.5) ? 2.15 : 0.45;',
      '  }',`,
`      '  if(hoverRegion>=0.0){',
      /* the gap has to survive being seen through a lit surface, so it is a
         gap in BOTH directions rather than a brightening alone */
      '    here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;',
      '  }',`);
sub(`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',`,
`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.95 : 1.0;',`);

/* 3. the shell is told, from the one place that already knows */
sub(`function highlightMIG(migId){`,
`function askedRegion(id){
  if(!brainMesh) return;
  BRAIN_ASK_TO=(id?1:0);
  invalidate(30);
}
function highlightMIG(migId){`);

sub(`var brainMesh=null, brainGeo=null;`,
`var brainMesh=null, brainGeo=null;
/* eased so naming a region is a settle rather than a flicker */
var BRAIN_ASK=0, BRAIN_ASK_TO=0;`);

sub(`      brainMesh.material.uniforms.uDim.value=WELCOME_DIM;`,
`      brainMesh.material.uniforms.uDim.value=WELCOME_DIM;
      BRAIN_ASK += (BRAIN_ASK_TO-BRAIN_ASK)*0.16;
      if(Math.abs(BRAIN_ASK_TO-BRAIN_ASK)>0.003) invalidate(4);
      brainMesh.material.uniforms.uAsk.value=BRAIN_ASK;`);

console.log(n + ' edits applied');
