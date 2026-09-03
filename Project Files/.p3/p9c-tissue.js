/* The shell's proportions measured correctly — w:h 0.69, w:d 1.19 against a
   real brain's 0.66 and 1.19 — but fifteen points cannot draw a surface, so it
   read as a network rather than as a brain.

   The fix invents nothing. Every concept and writing was already folded onto
   its region's position; instead of stacking them all on one point, they are
   spread across the shell in their own region's neighbourhood. The brain is
   then drawn by the mind's own 144 objects: the regions are the landmarks and
   what they hold is the tissue. When the mind opens, that tissue flies out into
   the worlds it belongs to. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`NODES.forEach(function(nd){
  if(nd.t==='mig') return;
  var host=byId[nd.mig];
  nd.bPos=(host&&host.bPos)?host.bPos.clone():(nd.uPos?nd.uPos.clone():null);
});`,
`var BRAIN_SPREAD=0.46;
NODES.forEach(function(nd,k){
  if(nd.t==='mig') return;
  var host=byId[nd.mig];
  if(!host||!host.uPos){ nd.bPos=nd.uPos?nd.uPos.clone():null; return; }
  /* a deterministic offset around its own region's direction, then dropped onto
     the shell — so the object sits on the brain's surface, in its region's
     neighbourhood, and nothing is placed by hand */
  var d0=host.uPos.clone().normalize();
  var a1=(k*2.39996)%6.2832, a2=((k*7)%13)/13*3.14159;
  var t1=new THREE.Vector3(-d0.z,0,d0.x); if(t1.lengthSq()<1e-6) t1.set(1,0,0);
  t1.normalize();
  var t2=new THREE.Vector3().crossVectors(d0,t1).normalize();
  var amp=BRAIN_SPREAD*(0.42+0.58*Math.sin(a2));
  var dir=d0.clone()
    .add(t1.multiplyScalar(Math.cos(a1)*amp))
    .add(t2.multiplyScalar(Math.sin(a1)*amp)).normalize();
  nd.bPos=brainShell(dir);
});`);

/* the tissue is present but quiet in the brain, and full size in the universe */
sub(`      '  if(isMig < 0.5) here *= mindOpen;',`,
`      /* what a region holds is visible as TISSUE before the mind opens —
         enough to give the brain a surface, never enough to compete with the
         regions themselves */
      '  if(isMig < 0.5) here *= (0.30 + 0.70*mindOpen);',`);

sub(`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',`,
    `      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',
      '  if(isMig < 0.5) lift *= (0.30 + 0.70*mindOpen);',`);

/* render-only bodies belong to the universe: fold them in with everything else */
sub(`  CONST_BG.forEach(function(b,bi){
    var i=placed.length+COMPANIONS.length+bi;`,
`  CONST_BG.forEach(function(b,bi){
    var i=placed.length+COMPANIONS.length+bi;
    RENDER_ONLY.push({i:i, u:b.pos.clone(),
      b:(byId[b.mig]&&byId[b.mig].bPos)?byId[b.mig].bPos.clone():b.pos.clone()});`);

sub(`  COMPANIONS.forEach(function(c,ci){
    var i=placed.length+ci;
    starBIndex[c.mig]=i;`,
`  COMPANIONS.forEach(function(c,ci){
    var i=placed.length+ci;
    RENDER_ONLY.push({i:i, u:c.pos.clone(),
      b:(byId[c.mig]&&byId[c.mig].bPos)?byId[c.mig].bPos.clone():c.pos.clone()});
    starBIndex[c.mig]=i;`);

sub(`var LINE_WALK=null, NEEDS_FOLD=false;`,
    `var LINE_WALK=null, NEEDS_FOLD=false, RENDER_ONLY=[];`);

sub(`  nodeOrder.forEach(function(nd,i){
    if(!nd.pos) return;
    pa.array[i*3]=nd.pos.x; pa.array[i*3+1]=nd.pos.y; pa.array[i*3+2]=nd.pos.z;
  });`,
`  nodeOrder.forEach(function(nd,i){
    if(!nd.pos) return;
    pa.array[i*3]=nd.pos.x; pa.array[i*3+1]=nd.pos.y; pa.array[i*3+2]=nd.pos.z;
  });
  RENDER_ONLY.forEach(function(o){
    _mp.lerpVectors(o.b,o.u,mindOpen);
    pa.array[o.i*3]=_mp.x; pa.array[o.i*3+1]=_mp.y; pa.array[o.i*3+2]=_mp.z;
  });`);

console.log(n + ' edits applied');
