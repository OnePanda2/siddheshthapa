/* THE BRAIN, AS ANATOMY RATHER THAN AS A CAGE.

   The previous version drew 14 uniform bands sweeping the whole shell. Uniform
   parallel sweeps over a closed surface make a wireframe pod — the line count
   was never the problem, the grammar was.

   Replaced by a small set of NAMED features, each placed where the feature it
   represents actually sits, and each with its own weight so there is a
   hierarchy instead of a mesh:

     rim              the lateral contour            strongest
     sylvian          separates the temporal lobe    strong
     temporal         the lobe's own lower edge      strong
     central sulcus   crown down toward the sylvian  medium
     cerebellar arc   divides it from the occipital  medium
     two folds        cortical surface               faint

   Seven curves per hemisphere plus one midline. And the layers are now
   separated: ANATOMY lives on the surface, the MIND'S CONTENT lives inside it.
   A region is no longer a dot stuck to the shell — it is inside the organ.

   Curves are parametrised (beta, alpha): beta sweeps the sagittal angle
   (0 = front, pi/2 = crown, pi = back, -pi/2 = base); alpha is the polar angle
   from the lateral axis, so alpha = pi/2 is the midsagittal outline and small
   alpha is the side face. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`/* ── THE FOLDS ────────────────────────────────────────────────────────
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
}`,
`/* ── BRAIN ANATOMY ────────────────────────────────────────────────────
   Named features, not uniform bands. Render-only: never graph relationships,
   never in the graph, and they dissolve as the mind opens. Each is a list of
   [beta, alpha] control points interpolated along the shell. */
var BRAIN_FEATURES=[
  /* the lateral contour — the single line that states the organ */
  { id:'rim', w:1.00,
    pts:[[-1.62,1.44],[-1.10,1.50],[-0.40,1.54],[0.30,1.55],[1.00,1.54],
         [1.70,1.52],[2.40,1.50],[3.00,1.47],[3.55,1.40],[4.05,1.28]] },
  /* the Sylvian fissure — cuts in from the front-low and rises toward the back.
     This is what makes a temporal lobe read AS a lobe. */
  { id:'sylvian', w:0.86,
    pts:[[-0.42,0.52],[0.10,0.60],[0.62,0.72],[1.14,0.86],[1.66,0.99],[2.10,1.10]] },
  /* the temporal lobe's own lower edge, below the fissure */
  { id:'temporal', w:0.80,
    pts:[[-0.55,0.94],[-0.20,1.16],[0.25,1.30],[0.75,1.34],[1.25,1.28],[1.70,1.16]] },
  /* the central sulcus — crown down and forward toward the fissure */
  { id:'central', w:0.62,
    pts:[[1.86,1.34],[1.66,1.10],[1.42,0.88],[1.16,0.70],[0.94,0.58]] },
  /* the cerebellum, divided from the occipital above it */
  { id:'cerebellar', w:0.62,
    pts:[[3.28,1.36],[3.52,1.12],[3.74,0.92],[3.98,0.86],[4.20,0.96]] },
  /* two cortical folds, faint, following the contour */
  { id:'fold-a', w:0.34,
    pts:[[-0.10,0.86],[0.55,0.98],[1.20,1.10],[1.85,1.18],[2.45,1.20]] },
  { id:'fold-b', w:0.30,
    pts:[[0.35,1.14],[1.00,1.26],[1.65,1.34],[2.25,1.36],[2.80,1.32]] }
];
/* the longitudinal fissure, drawn once down the middle */
var BRAIN_MIDLINE={ id:'midline', w:0.70,
  pts:[[-0.90,1.57],[-0.20,1.57],[0.50,1.57],[1.20,1.57],[1.90,1.57],
       [2.60,1.57],[3.20,1.57],[3.70,1.57]] };

function featurePoint(beta, alpha, side){
  var rr=Math.sin(alpha);
  return brainShell(new THREE.Vector3(Math.cos(alpha)*side,
                                      rr*Math.sin(beta), rr*Math.cos(beta)));
}
function featurePoints(feat, side){
  var p=feat.pts, out=[], SEG=13;
  for(var i=0;i<p.length-1;i++){
    for(var s=0;s<SEG;s++){
      var t=s/SEG, u=(1-Math.cos(t*Math.PI))/2;
      out.push(featurePoint(p[i][0]+(p[i+1][0]-p[i][0])*u,
                            p[i][1]+(p[i+1][1]-p[i][1])*u, side));
    }
  }
  out.push(featurePoint(p[p.length-1][0], p[p.length-1][1], side));
  return out;
}`);

/* the scene draws the named features, weighted */
sub(`  GYRI_COUNT=0;
  (function(){
    var gc=new THREE.Color(0x8e9bb0);
    for(var side=-1;side<=1;side+=2){
      for(var k=0;k<GYRI_BANDS;k++){
        var pl=gyrusPoints(k,side);
        for(var i=0;i<pl.length-1;i++){
          [pl[i],pl[i+1]].forEach(function(p){
            verts.push(p.x,p.y,p.z);
            cols.push(gc.r,gc.g,gc.b);
            alphas.push(0.58);
            kinds.push(2);              // 2 = brain surface, not a relationship
            homes.push(-1);
            GYRI_COUNT++;
          });
        }
      }
    }
  })();`,
`  GYRI_COUNT=0;
  (function(){
    var gc=new THREE.Color(0x7d8ba1);
    function emit(pl, w){
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
    emit(featurePoints(BRAIN_MIDLINE,1), BRAIN_MIDLINE.w);
  })();`);

/* ── the mind's content lives INSIDE the organ, not stuck to its surface ── */
sub(`MIGS.forEach(function(m){
  if(!m.uPos) return;
  m.bPos=brainShell(m.uPos.clone().normalize());
});`,
`MIGS.forEach(function(m){
  if(!m.uPos) return;
  /* a region is INSIDE the mind, not a dot on its shell */
  m.bPos=brainShell(m.uPos.clone().normalize()).multiplyScalar(0.68);
});`);

sub(`  var amp=BRAIN_SPREAD*(0.42+0.58*Math.sin(a2));
  var dir=d0.clone()
    .add(t1.multiplyScalar(Math.cos(a1)*amp))
    .add(t2.multiplyScalar(Math.sin(a1)*amp)).normalize();
  nd.bPos=brainShell(dir);`,
`  var amp=BRAIN_SPREAD*(0.42+0.58*Math.sin(a2));
  var dir=d0.clone()
    .add(t1.multiplyScalar(Math.cos(a1)*amp))
    .add(t2.multiplyScalar(Math.sin(a1)*amp)).normalize();
  /* what a region holds sits inside it too, at varying depth, so the interior
     has substance and the surface stays anatomy */
  nd.bPos=brainShell(dir).multiplyScalar(0.34+((k*11)%17)/17*0.36);`);

/* ── a three-quarter LATERAL view: a brain is recognised from the side ── */
sub(`    var phoneB2=window.innerWidth<768;
    var k=phoneB2?3.20:1.78;
    return { p:new THREE.Vector3(BRAIN_R*0.92*k, BRAIN_R*0.50*k, BRAIN_R*1.22*k),
             a:new THREE.Vector3(0, BRAIN_R*(phoneB2?-0.30:0.02), 0) };`,
`    var phoneB2=window.innerWidth<768;
    var k=phoneB2?3.30:1.95;
    /* mostly from the SIDE, lifted a little and swung forward: the angle at
       which a brain is recognised. A frontal view of a brain is not. */
    return { p:new THREE.Vector3(BRAIN_R*1.52*k, BRAIN_R*0.62*k, BRAIN_R*0.86*k),
             a:new THREE.Vector3(0, BRAIN_R*(phoneB2?-0.26:0.0), 0) };`);

console.log(n + ' edits applied');
