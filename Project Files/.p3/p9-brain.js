/* PARTS 9-12 — THE BRAIN.

   Before entering, the mind is a brain: the 15 MIGs are its regions and their
   real cross-region relationships are its structure. Every concept and writing
   is collapsed onto its own region, so nothing is visible that has not been
   opened yet — which is why the brain reads as sparse rather than as a mesh.

   ENTER THE MIND does not fade. One parameter, mindOpen, runs 0 -> 1: the
   nodes travel from their brain positions to their universe positions, the
   relationship lines stretch with them, the collapsed concepts fly out of their
   regions, and the silhouette dissolves into fourteen celestial systems.

   The lines are the graph's own cross-MIG relationships. No connection is
   invented to make the shape work — the shape comes from where the regions sit
   on the shell, and the shell is the only designed thing here. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── the shell, and the two positions every node holds ───────────────── */
sub(`/* ── 1a2. THE CONSTELLATION ───────────────────────────────────────────`,
`/* ── 1a1. THE BRAIN ───────────────────────────────────────────────────
   A direction on the unit sphere is warped onto a brain-like shell: longer
   front to back than side to side, flattened above and below, fuller at the
   front, tapered at the back, with a temporal bulge low and forward and a
   fissure down the middle. Not anatomy — a silhouette. */
var BRAIN_R=210;
function brainShell(dir){
  var x=dir.x, y=dir.y, z=dir.z;
  var f=Math.max(0,z), bk=Math.max(0,-z), lo=Math.max(0,-y), up=Math.max(0,y);
  var p=new THREE.Vector3(x*0.80, y*0.66, z*1.14);
  p.multiplyScalar(1 + 0.14*f - 0.13*bk*bk + 0.06*up);
  /* temporal lobe — a lateral swelling below and forward */
  p.x *= 1 + 0.34*lo*Math.max(0,0.45+z*0.8);
  p.y -= 0.13*lo*Math.abs(x);
  /* the longitudinal fissure: nothing sits on the midline */
  p.x += (x>=0?1:-1)*0.15;
  return p.multiplyScalar(BRAIN_R);
}
var mindOpen=0;                 // 0 = brain, 1 = universe
var MORPH_ON=false;

/* ── 1a2. THE CONSTELLATION ───────────────────────────────────────────`);

/* every node remembers where it is in each state */
sub(`/* ── 2. THE NEURON ALPHABET, REUSED ───────────────────────────────────`,
`/* ── 1d. TWO PLACES FOR EVERY OBJECT ──────────────────────────────────
   uPos is where it lives in the universe. bPos is where it lives in the brain:
   a MIG sits on the shell, and everything a MIG owns is folded into it, so the
   brain shows regions and their relationships and nothing else. */
NODES.forEach(function(nd){ if(nd.pos) nd.uPos=nd.pos.clone(); });
MIGS.forEach(function(m){
  if(!m.uPos) return;
  m.bPos=brainShell(m.uPos.clone().normalize());
});
NODES.forEach(function(nd){
  if(nd.t==='mig') return;
  var host=byId[nd.mig];
  nd.bPos=(host&&host.bPos)?host.bPos.clone():(nd.uPos?nd.uPos.clone():null);
});
function applyMorph(){
  NODES.forEach(function(nd){
    if(!nd.uPos||!nd.bPos) return;
    nd.pos.lerpVectors(nd.bPos, nd.uPos, mindOpen);
  });
}
/* NOT applied here. Orbit rings, the constellation and the sky are all built
   from byId[...].pos, so the scene must be constructed at universe positions
   and folded into the brain only once it exists. */

/* ── 2. THE NEURON ALPHABET, REUSED ───────────────────────────────────`);

/* ── line vertices must be rebuildable, so the structure can stretch ─── */
sub(`  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];
  LINKS.forEach(function(l){
    var A=byId[l.a], B=byId[l.b];
    if(!A.pos||!B.pos) return;
    var cross=(A.mig!==B.mig);
    l.cross=cross;
    for(var s=0;s<SEGS;s++){
      var t0=s/SEGS, t1=(s+1)/SEGS;
      [t0,t1].forEach(function(t){
        var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
        if(cross){                                   // cross-region arcs bow outward
          var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*0.14;
          p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
        }
        verts.push(p.x,p.y,p.z);`,
`  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];
  /* the same walk is used to build the buffer and to restretch it while the
     brain opens, so the structure can never drift from the nodes */
  LINE_WALK=function(write){
    var k=0;
    LINKS.forEach(function(l){
      var A=byId[l.a], B=byId[l.b];
      if(!A.pos||!B.pos) return;
      var cross=(A.mig!==B.mig);
      for(var s=0;s<SEGS;s++){
        var t0=s/SEGS, t1=(s+1)/SEGS;
        [t0,t1].forEach(function(t){
          var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
          if(cross){
            /* in the brain the arcs hug the shell and trace the silhouette;
               out in the universe they bow wide across open space */
            var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*(0.04+0.10*mindOpen);
            p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
          }
          write(k++, p);
        });
      }
    });
    return k;
  };
  LINKS.forEach(function(l){
    var A=byId[l.a], B=byId[l.b];
    if(!A.pos||!B.pos) return;
    var cross=(A.mig!==B.mig);
    l.cross=cross;
    for(var s=0;s<SEGS;s++){
      var t0=s/SEGS, t1=(s+1)/SEGS;
      [t0,t1].forEach(function(t){
        var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
        if(cross){
          var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*(0.04+0.10*mindOpen);
          p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
        }
        verts.push(p.x,p.y,p.z);`);

sub(`var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};`,
    `var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};
var LINE_WALK=null;`);

/* ── the collapsed objects stay invisible until the mind opens ───────── */
sub(`               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0} },`,
    `               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0},
               mindOpen:{value:0.0} },`);

sub(`      'uniform float focusRegion; uniform float hoverRegion;',`,
    `      'uniform float focusRegion; uniform float hoverRegion; uniform float mindOpen;',
      'attribute float isMig;',`);

sub(`      '  vEmph=clamp(emph*here,0.0,1.6);',`,
`      /* before the mind opens only the regions exist; everything they own is
         folded inside them and must not be drawn */
      '  if(isMig < 0.5) here *= mindOpen;',
      '  vEmph=clamp(emph*here,0.0,1.6);',`);

sub(`  geo.setAttribute('capPx',new THREE.BufferAttribute(CAP,1));`,
`  geo.setAttribute('capPx',new THREE.BufferAttribute(CAP,1));
  var ISMIG=new Float32Array(TOTV);
  placed.forEach(function(nd,i){ ISMIG[i]=(nd.t==='mig')?1:0; });
  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));`);

/* orbit rings and constellation figures belong to the universe, not the brain */
sub(`      uniforms:{ near:{value:1.0},`,
    `      uniforms:{ near:{value:1.0}, mindOpen:{value:0.0},`);
sub(`      fragmentShader:['uniform float near; uniform float hoverOwn;',`,
    `      fragmentShader:['uniform float near; uniform float hoverOwn; uniform float mindOpen;',`);
sub(`        ' float a=vA*vis*near*(1.0+hoverOwn*1.9); if(a<0.004) discard;',`,
    `        ' float a=vA*vis*near*mindOpen*(1.0+hoverOwn*1.9); if(a<0.004) discard;',`);

console.log(n + ' edits applied');
