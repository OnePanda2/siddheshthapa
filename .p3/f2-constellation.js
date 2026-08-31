/* BRAIN V3, part 2 — the mind becomes a constellation, and everything that
   was tuned for ink on white is re-founded on a dark sky.

   The anatomical line drawing goes. In its place: star points joined by
   straight lines, the Star Gazer idiom, on a form that is genuinely bilobed so
   the figure holds from top, front, side and back. */
const fs = require('fs');
const F = 'src/v02-app.js';
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
  if (i < 0 || j < 0) { console.error('CUT missing: ' + a.slice(0, 44)); process.exit(1); }
  fs.writeFileSync(F, s.slice(0, i) + repl + s.slice(j + b.length), 'utf8'); n++;
}

/* ---- 1. the form is now bilobed, with a real fissure ---- */
sub(`function brainWidth(y,z){
  var w=0.62;
  w*=1-0.30*bsmooth(0.30,1.00,z);          // narrows to the frontal pole
  w*=1-0.34*bsmooth(0.30,1.00,-z);         // narrows to the occipital pole
  w*=1-0.30*bsmooth(0.20,0.95,-y);         // the base is narrower than the crown
  w*=1+0.24*Math.exp(-Math.pow((y+0.24)/0.32,2));   // the temporal bulge
  return w;
}`,
`function brainWidth(y,z){
  /* real proportions: a brain is 167 long, 140 wide, 93 high */
  var w=0.68;
  w*=1-0.34*bsmooth(0.25,1.00,z);                        // narrows to the frontal pole
  w*=1-0.40*bsmooth(0.25,1.00,-z);                       // narrows to the occipital pole
  w*=1-0.32*bsmooth(0.10,0.95,-y);                       // the base is narrower than the crown
  w*=1+0.32*Math.exp(-Math.pow((y+0.30)/0.30,2));        // the temporal bulge
  return w;
}`);

sub(`function brainShell(dir){
  var x=dir.x, y=dir.y, z=dir.z;
  var r=brainRadius(Math.atan2(y,z));
  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.80, z*r);
  p.x += (x>=0?1:-1)*BRAIN_GAP;
  return p.multiplyScalar(BRAIN_R);
}`,
`/* THE FORM.

   A lateral profile alone gives an egg, because the two cues that make a brain
   unmistakable from ABOVE and from the FRONT are missing — the longitudinal
   fissure and the temporal lobes. Every earlier version had exactly that
   defect, which is why it only ever read from one angle.

   So the form is genuinely bilobed: two bodies with a cleft between them, a
   crown that falls away toward the midline, a Sylvian groove, and a temporal
   bulge hanging below it. */
function brainShell(dir){
  var v=dir.clone ? dir.clone().normalize() : dir;
  var x=v.x, y=v.y, z=v.z, ax=Math.abs(x);
  var r=brainRadius(Math.atan2(y,z));
  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.74, z*r);

  /* THE LONGITUDINAL FISSURE — the single cue that makes the top and front
     views read as a brain rather than an egg */
  var cleft=Math.exp(-Math.pow(ax/0.30,2))*bsmooth(-0.15,0.85,y);
  p.y -= cleft*0.22;
  p.x += (x>=0?1:-1)*(0.030+0.022*bsmooth(0.15,1.0,y));   /* a cleft, not a chasm */

  /* THE SYLVIAN FISSURE — the lateral groove that cuts the temporal lobe free */
  var syl=Math.exp(-Math.pow((y+0.42*z+0.06)/0.13,2))*bsmooth(0.28,0.72,ax);
  p.multiplyScalar(1-0.11*syl);

  return p.multiplyScalar(BRAIN_R);
}`);

/* ---- 2. the drawing: named sulci out, constellation chains in ---- */
cut('/* ── THE NAMED CURVES ',
    'function buildBrainCurves(viewDir, detail){',
`/* ── THE CONSTELLATION ────────────────────────────────────────────────
   Star points joined by straight lines — the idiom used to draw Orion over
   the real sky — except the figure is a brain and it exists in three
   dimensions, so it holds from any direction rather than from one.

   Every chain is a real anatomical boundary. Density comes from SUBDIVIDING
   lines that already had a reason to exist, never from adding new ones: that
   is what "more lines do not mean more details" means in code rather than in
   a comment. */
function faceDir(u,v){
  var r2=u*u+v*v;
  var k=Math.sqrt(Math.max(0.0001,1-Math.min(0.996,r2)));
  return new THREE.Vector3(k, v, u).normalize();
}
function buildBrainCurves(viewDir, detail){`);

/* ---- 3. the assembly ---- */
cut('function buildBrainCurves(viewDir, detail){',
    '  return curves;\n}',
`function buildBrainCurves(viewDir, detail){
  var P=[], E=[], seen={}, curves=[];
  function ekey(a,b){ return a<b ? a+'_'+b : b+'_'+a; }
  function link(a,b){ var k=ekey(a,b); if(!seen[k]){seen[k]=1; E.push([a,b]);} }
  /* Catmull-Rom through control directions, resampled onto the surface, so a
     boundary curves the way the form curves instead of cutting across it —
     which is what turned the landmark version into a faceted polyhedron. */
  function chain(ctrl, cnt, closed){
    var idx=[];
    function at(t){
      var m=ctrl.length, f=t*(closed?m:(m-1)), i=Math.floor(f), u=f-i;
      function g(j){ return ctrl[((j%m)+m)%m]; }
      var p0=g(closed?i-1:Math.max(0,i-1)), p1=g(i),
          p2=g(closed?i+1:Math.min(m-1,i+1)), p3=g(closed?i+2:Math.min(m-1,i+2));
      var o=[0,0,0], u2=u*u, u3=u2*u;
      for(var c=0;c<3;c++)
        o[c]=0.5*((2*p1[c]) + (-p0[c]+p2[c])*u +
                  (2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*u2 +
                  (-p0[c]+3*p1[c]-3*p2[c]+p3[c])*u3);
      return new THREE.Vector3(o[0],o[1],o[2]);
    }
    for(var i=0;i<cnt;i++){ idx.push(P.length); P.push(brainShell(at(closed?i/cnt:i/(cnt-1)))); }
    for(var j=0;j<idx.length-1;j++) link(idx[j],idx[j+1]);
    if(closed) link(idx[idx.length-1],idx[0]);
    return idx;
  }
  function mirror(c){ return c.map(function(p){ return [-p[0],p[1],p[2]]; }); }
  var lo = (detail>=1) ? 1 : 0.68;   /* a phone drops resolution, not structure */
  function N(k){ return Math.max(3, Math.round(k*lo)); }

  /* 1. THE PROFILE, at the widest part of each hemisphere. Parasagittal, not
     midsagittal: a ring at the midline sits inside the cleft, which drags the
     crown down and flattens the whole side view into a potato. */
  function profileRing(side){
    var c=[];
    for(var a=0;a<12;a++){ var t=a/12*6.283185; c.push([0.62*side, Math.sin(t), Math.cos(t)]); }
    return chain(c, N(18), true);
  }
  var proL=profileRing(1), proR=profileRing(-1);

  /* 2. THE LONGITUDINAL FISSURE, a rim either side of the midline. This is
     what makes the view from ABOVE two hemispheres instead of one oval. */
  var rimC=[[0.15,0.36,0.88],[0.17,0.74,0.62],[0.17,0.96,0.10],
            [0.16,0.88,-0.44],[0.14,0.46,-0.84]];
  var rimL=chain(rimC,N(9),false), rimR=chain(mirror(rimC),N(9),false);

  /* 3. THE SYLVIAN FISSURE — the cleft that frees the temporal lobe, and the
     most identifying single mark on a lateral view. */
  var sylC=[[0.70,-0.20,0.58],[0.84,-0.16,0.28],[0.90,-0.08,-0.06],
            [0.82,0.02,-0.34],[0.66,0.10,-0.56]];
  var sylL=chain(sylC,N(8),false), sylR=chain(mirror(sylC),N(8),false);

  /* 4. THE TEMPORAL LOBE'S LOWER EDGE, so the mass below the fissure is a lobe
     with a bottom rather than an open corner. */
  var tmpC=[[0.54,-0.56,0.52],[0.70,-0.56,0.16],[0.72,-0.52,-0.20],[0.56,-0.46,-0.50]];
  var tmpL=chain(tmpC,N(7),false), tmpR=chain(mirror(tmpC),N(7),false);

  /* 5. THE CEREBELLUM — its own arc behind and below the notch, so it reads as
     a separate organ rather than more occipital lobe. */
  var cbC=[[0.46,-0.36,-0.70],[0.50,-0.58,-0.78],[0.36,-0.76,-0.74],[0.14,-0.82,-0.58]];
  var cbL=chain(cbC,N(5),false), cbR=chain(mirror(cbC),N(5),false);

  /* 6. THE CENTRAL SULCUS — the diagonal running down and forward from the
     crown. Two marks at an angle read as anatomy; two parallel ones read as a
     contour map. */
  var csC=[[0.34,0.90,-0.20],[0.62,0.62,-0.04],[0.80,0.28,0.08]];
  var csL=chain(csC,N(5),false), csR=chain(mirror(csC),N(5),false);

  /* Short joins only, between stars already near each other. Never a chord
     across the interior: that is exactly what flattened the landmark version
     into a polyhedron. */
  function nearest(i, pool){
    var best=-1, bd=1e9;
    pool.forEach(function(j){ var d=P[i].distanceTo(P[j]); if(d<bd){bd=d;best=j;} });
    return best;
  }
  [[sylL,tmpL],[sylR,tmpR],[sylL,csL],[sylR,csR],
   [tmpL,cbL],[tmpR,cbR],[cbL,proL],[cbR,proR],
   [rimL,proL],[rimR,proR],[csL,rimL],[csR,rimR],
   [sylL,proL],[sylR,proR]].forEach(function(pr){
     [pr[0][0], pr[0][pr[0].length-1]].forEach(function(i){ link(i, nearest(i,pr[1])); });
   });

  BRAIN_STARS=P;
  E.forEach(function(e){ curves.push({ id:'seg', layer:'B', w:1.0, pts:[P[e[0]],P[e[1]]] }); });
  return curves;
}`);

console.log(n + ' edits applied');
