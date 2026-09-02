/* THE BRAIN, PROPERLY.

   Five attempts sculpted an implicit blob and none read as a brain. Two reasons,
   both now addressed:

   1. A radial dip cannot change a silhouette. The outline of a lateral view is
      the midsagittal ring, and on a unit sphere that ring cannot reach the band
      the Sylvian fissure occupies. So the sagittal PROFILE is now specified
      directly as a radius table — frontal pole, domed crown, occipital taper,
      cerebellum, flat base, temporal lobe — with a separate width function for
      how far the shell reaches sideways.

   2. The outline of a brain is close to a kidney. What makes people say "brain"
      is the FOLDED SURFACE, and the renderer draws lines, so the folds have to
      be lines. Gyri are added as render-only curves on the shell: never graph
      relationships, never in the graph, and they dissolve as the mind opens. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`var BRAIN_R=210;
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
}`,
`var BRAIN_R=210;
function bsmooth(a,b,x){ var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
/* the midsagittal outline, every 15 degrees from +Z (front) toward +Y (top) */
var BRAIN_PROFILE=[1.00,1.03,1.04,1.02,0.99,0.95,0.92,0.90,0.88,0.86,0.84,0.82,
                   0.80,0.76,0.72,0.76,0.70,0.54,0.48,0.54,0.66,0.80,0.88,0.94];
function brainRadius(phi){
  var n=BRAIN_PROFILE.length, step=6.2832/n;
  var a=phi%6.2832; if(a<0) a+=6.2832;
  var i=Math.floor(a/step), f=(a-i*step)/step;
  var t=(1-Math.cos(f*Math.PI))/2;
  return BRAIN_PROFILE[i%n]*(1-t)+BRAIN_PROFILE[(i+1)%n]*t;
}
/* how far the shell reaches sideways: widest through the temporal lobes,
   narrow at both poles and narrower still along the base */
function brainWidth(y,z){
  var w=0.74;
  w*=1-0.26*bsmooth(0.35,1.0,z);
  w*=1-0.30*bsmooth(0.35,1.0,-z);
  w*=1-0.36*bsmooth(0.25,0.95,-y);
  w*=1+0.20*Math.exp(-Math.pow((y+0.28)/0.34,2));
  return w;
}
function brainShell(dir){
  var x=dir.x, y=dir.y, z=dir.z;
  var r=brainRadius(Math.atan2(y,z));
  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.78, z*r);
  /* the hemispheres never meet at the midline */
  p.x += (x>=0?1:-1)*0.10;
  return p.multiplyScalar(BRAIN_R);
}

/* ── THE FOLDS ────────────────────────────────────────────────────────
   Render-only curves lying on the shell. A gyrus sweeps front-to-back while
   its lateral depth meanders — which is what a gyrus does. They are NOT graph
   relationships, never enter the graph, and dissolve as the mind opens. */
var GYRI_BANDS=7;
function gyrusPoints(k, side){
  var out=[];
  var a0=0.34+(k/(GYRI_BANDS-1))*1.06;
  var amp=0.055+0.030*Math.sin(k*2.1);
  var freq=2+(k%2), psi=k*1.7, SEG=54;
  for(var s=0;s<=SEG;s++){
    var beta=-0.62+(s/SEG)*4.10;
    var alpha=a0+amp*Math.sin(freq*beta+psi);
    var rr=Math.sin(alpha);
    out.push(brainShell(new THREE.Vector3(Math.cos(alpha)*side,
                                          rr*Math.sin(beta), rr*Math.cos(beta))));
  }
  return out;
}`);

console.log(n + ' edits applied');
