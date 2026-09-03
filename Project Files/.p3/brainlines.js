/* BRAIN LINES — the line-drawing generator, per BRAIN-VISUAL-SPEC.
   Emitted as a source string so the prototype and the app share one definition.

   The form is carried by curves on a shell. There is no surface. Depth comes
   from where a curve IS, not from anything being solid.

   ── on generating versus placing ────────────────────────────────────────
   The first three attempts at the folds were generative: trace the isolines of
   a gyroid field across the shell. The field is the right MODEL of a cortex —
   the rejected mesh proved that by displacing geometry with it — but as curves
   it failed three separate ways. Traced at the zero-set, every seed converged
   onto the same connected branch and fourteen folds rendered as three. Traced
   at each seed's own level, the lines became long smooth sweeps and the whole
   drawing read as a cracked eggshell. Seeded on real sign changes, the
   crossings bunched wherever the scan happened to begin and left two thirds of
   the brain empty.

   The lesson is the one the brief states. A cortex has about a dozen named
   sulci in lateral view and they are always in the same arrangement, so they
   are PLACED — by name, in the coordinates they are seen in — and nothing is
   generated. Every curve below can be pointed at and identified, which is the
   real test: a line whose answer to "what does this communicate?" is "it fills
   space" cannot exist here, because no space-filler produced any of them. */

const SRC = `
/* ── THE SILHOUETTE ───────────────────────────────────────────────────
   Kept verbatim from the measured profile: 52% off its own best-fit ellipse,
   minima at 210 and 285 degrees, maxima at 60 and 225. The notches are what
   stop it reading as an egg, so they are the part that must not be smoothed. */
var BRAIN_R=210;
var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,1.07,1.05,1.02,0.99,0.96,0.93,0.89,
                   0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];
function bsmooth(a,b,x){ var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
function brainRadius(phi){
  var n=BRAIN_PROFILE.length, step=6.283185/n;
  var a=phi%6.283185; if(a<0) a+=6.283185;
  var i=Math.floor(a/step), f=(a-i*step)/step;
  var t=(1-Math.cos(f*Math.PI))/2;
  return BRAIN_PROFILE[i%n]*(1-t)+BRAIN_PROFILE[(i+1)%n]*t;
}
function brainWidth(y,z){
  var w=0.62;
  w*=1-0.30*bsmooth(0.30,1.00,z);
  w*=1-0.34*bsmooth(0.30,1.00,-z);
  w*=1-0.30*bsmooth(0.20,0.95,-y);
  w*=1+0.24*Math.exp(-Math.pow((y+0.24)/0.32,2));
  return w;
}
var BRAIN_GAP=0.055;
function brainShell(dir){
  var x=dir.x, y=dir.y, z=dir.z;
  var r=brainRadius(Math.atan2(y,z));
  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.80, z*r);
  p.x += (x>=0?1:-1)*BRAIN_GAP;
  return p.multiplyScalar(BRAIN_R);
}

/* ── FACE COORDINATES ─────────────────────────────────────────────────
   The curves are specified the way they are SEEN.

   A direction is (cos a, sin a sin b, sin a cos b), so on a lateral view the
   screen position is polar: sin(a) is the radial distance from the centre of
   the visible face and b is the angle around it. Specifying an anatomical line
   in (a,b) therefore draws an arc at CONSTANT RADIUS — an inner contour ring,
   which is exactly what the first render produced and why the Sylvian fissure
   came out as a giant croissant.

   faceDir maps a point on the visible face instead: u runs front(+) to
   back(-), v runs up(+) to down(-), both on [-1,1]. That is the space a person
   draws a brain in, so every control point below can be read against the
   picture and moved by eye. */
function faceDir(u,v){
  var r2=u*u+v*v;
  var k=Math.sqrt(Math.max(0.0001,1-Math.min(0.996,r2)));
  return new THREE.Vector3(k, v, u).normalize();
}
function curvePoint(beta, alpha, side){
  var rr=Math.sin(alpha);
  return brainShell(new THREE.Vector3(Math.cos(alpha)*side,
                                      rr*Math.sin(beta), rr*Math.cos(beta)));
}

/* ── THE NAMED CURVES ─────────────────────────────────────────────────
   Every line in the drawing is a named sulcus, in the arrangement a lateral
   cortex actually has, listed front to back and top to bottom. Control points
   carry a deliberate wobble: a sulcus is not a straight line, and three
   collinear points would read as a scratch. */
var BRAIN_CURVES=[

  /* ---- LAYER B: the two that do the identifying ---- */

  /* THE SYLVIAN FISSURE — the cleft separating the temporal lobe, running low
     at the front to higher at the back. No other single mark says "lateral
     view of a brain" as economically. */
  { id:'sylvian', layer:'B', w:1.78,
    uv:[[0.54,-0.21],[0.36,-0.19],[0.16,-0.14],[-0.04,-0.07],[-0.24,0.01],[-0.42,0.07]] },
  /* THE CENTRAL SULCUS — a diagonal running the OTHER way and crossing it.
     Two marks at an angle read as anatomy; two parallel sweeps read as a map. */
  { id:'central', layer:'B', w:1.12,
    uv:[[-0.12,0.72],[-0.04,0.54],[0.05,0.34],[0.13,0.14],[0.19,-0.04]] },

  /* ---- LAYER C: the rest of the lateral sulci, in their real arrangement ---- */

  /* the two that flank the central sulcus, which is what makes it read as
     central rather than as a lone slash across the middle */
  { id:'precentral', layer:'C', w:0.84,
    uv:[[0.16,0.56],[0.23,0.42],[0.29,0.28],[0.33,0.16]] },
  { id:'postcentral', layer:'C', w:0.78,
    uv:[[-0.30,0.60],[-0.24,0.48],[-0.18,0.36],[-0.14,0.24]] },
  /* the frontal pair, roughly horizontal, stacked */
  { id:'superior-frontal', layer:'C', w:0.78,
    uv:[[0.74,0.40],[0.61,0.46],[0.47,0.49],[0.33,0.49]] },
  { id:'inferior-frontal', layer:'C', w:0.70,
    uv:[[0.72,0.11],[0.60,0.17],[0.48,0.21],[0.37,0.21]] },
  /* the parietal one, running back from behind the postcentral */
  { id:'intraparietal', layer:'C', w:0.76,
    uv:[[-0.20,0.34],[-0.34,0.36],[-0.48,0.34],[-0.62,0.28]] },
  /* the temporal pair, below the Sylvian and roughly following it — the stack
     that turns the region under the fissure into a temporal LOBE */
  { id:'superior-temporal', layer:'C', w:0.80,
    uv:[[0.42,-0.39],[0.24,-0.36],[0.04,-0.30],[-0.16,-0.22],[-0.34,-0.15]] },
  { id:'inferior-temporal', layer:'C', w:0.66,
    uv:[[0.36,-0.55],[0.18,-0.52],[0.00,-0.46],[-0.18,-0.38]] },
  /* two short marks at the occipital pole */
  { id:'lateral-occipital-1', layer:'C', w:0.62,
    uv:[[-0.60,0.10],[-0.70,0.00],[-0.76,-0.12]] },
  { id:'lateral-occipital-2', layer:'C', w:0.58,
    uv:[[-0.50,-0.12],[-0.62,-0.20],[-0.70,-0.30]] },

  /* THE CEREBELLUM — its upper boundary, so the mass behind and below the
     notch reads as its own organ rather than as more occipital lobe */
  { id:'cerebellar-edge', layer:'C', w:1.10,
    uv:[[-0.40,-0.40],[-0.54,-0.46],[-0.66,-0.48],[-0.76,-0.44]] },
  /* its folia: three short arcs. Regular spacing is CORRECT here and only
     here — the cerebellum genuinely is finely and evenly foliated, and the
     contrast with the irregular cortex above is itself a recognition cue. */
  { id:'folia-1', layer:'C', w:0.60, uv:[[-0.46,-0.52],[-0.58,-0.56],[-0.68,-0.54]] },
  { id:'folia-2', layer:'C', w:0.56, uv:[[-0.45,-0.60],[-0.56,-0.63],[-0.66,-0.61]] },
  { id:'folia-3', layer:'C', w:0.52, uv:[[-0.43,-0.68],[-0.53,-0.70],[-0.62,-0.68]] },
  /* the crease under the front of the Sylvian that turns the corner below it
     into a temporal pole rather than a filled wedge */
  { id:'temporal-pole', layer:'C', w:0.68,
    uv:[[0.48,-0.33],[0.53,-0.24],[0.53,-0.13]] },

  /* ---- LAYER E: the far hemisphere, at a whisper ---- */

  /* THE MIDLINE CREST — the far hemisphere's edge showing over the near one.
     One line, and the hemispheres separate. */
  { id:'midline', layer:'E', w:0.60,
    uv:[[0.42,0.58],[0.20,0.74],[-0.04,0.80],[-0.28,0.76],[-0.48,0.64]] }
];

function curvePoints(c, side){
  var p=c.uv, out=[], SEG=16;
  function at(u,v){
    var d=faceDir(u,v); if(side<0) d.x=-d.x;
    return brainShell(d);
  }
  /* Catmull-Rom through the control points, so a sulcus curves the way a
     sulcus curves instead of turning a corner at every control point */
  function cr(i,t){
    var p0=p[Math.max(0,i-1)], p1=p[i],
        p2=p[Math.min(p.length-1,i+1)], p3=p[Math.min(p.length-1,i+2)];
    var t2=t*t, t3=t2*t, o=[0,0];
    for(var k=0;k<2;k++)
      o[k]=0.5*((2*p1[k]) + (-p0[k]+p2[k])*t +
                (2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2 +
                (-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
    return o;
  }
  for(var i=0;i<p.length-1;i++)
    for(var s=0;s<SEG;s++){ var o=cr(i,s/SEG); out.push(at(o[0],o[1])); }
  out.push(at(p[p.length-1][0], p[p.length-1][1]));
  return out;
}

/* ── THE OUTLINE ──────────────────────────────────────────────────────
   Not the midline and not the widest ring: the silhouette is where the shell
   turns away from the CAMERA. Traced for the declared view direction so the
   heaviest line in the drawing is a true outline rather than an approximation
   of one. */
function silhouettePoints(viewDir, side){
  var out=[], N=190;
  for(var i=0;i<=N;i++){
    var beta=(i/N)*6.283185;
    var lo=0.06, hi=1.5708;
    function facing(alpha){
      var d=new THREE.Vector3(Math.cos(alpha)*side,
                              Math.sin(alpha)*Math.sin(beta), Math.sin(alpha)*Math.cos(beta));
      var p=brainShell(d), e=0.02;
      var d2=new THREE.Vector3(Math.cos(alpha+e)*side,
                               Math.sin(alpha+e)*Math.sin(beta), Math.sin(alpha+e)*Math.cos(beta));
      var d3=new THREE.Vector3(Math.cos(alpha)*side,
                               Math.sin(alpha)*Math.sin(beta+e), Math.sin(alpha)*Math.cos(beta+e));
      var n=new THREE.Vector3().crossVectors(
        brainShell(d2).sub(p), brainShell(d3).sub(p)).normalize();
      return n.dot(viewDir);
    }
    var f0=facing(lo);
    for(var k=0;k<26;k++){
      var mid=(lo+hi)/2;
      if((facing(mid)>0)===(f0>0)) lo=mid; else hi=mid;
    }
    out.push(curvePoint(beta,(lo+hi)/2,side));
  }
  return out;
}

/* ── ASSEMBLY ─────────────────────────────────────────────────────────
   Every curve the brain is made of, with its layer, so the renderer can give
   each family a different weight and a different depth response.

   detail = 1 draws the whole set; below that the smallest marks drop out,
   because on a phone they are noise rather than detail. The desktop drawing is
   never simply shrunk. */
/* ── WEIGHT ───────────────────────────────────────────────────────────
   A WebGL line is one pixel wide whatever lineWidth says, so 	hicker has to
   be built rather than requested: a heavy curve is drawn as several strokes
   offset sideways along the surface. This is the only way the silhouette can
   out-weigh a sulcus, and without it every line in the drawing rendered at the
   same strength no matter what weight it declared. */
function strokeOffsets(pts, gap, n){
  if(n<=1) return [pts];
  var out=[];
  for(var k=0;k<n;k++){
    var off=(k-(n-1)/2)*gap, row=[];
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      var q=pts[Math.min(pts.length-1,i+1)], r=pts[Math.max(0,i-1)];
      var t=new THREE.Vector3(q.x-r.x,q.y-r.y,q.z-r.z);
      if(t.length()<1e-6){ row.push(p.clone()); continue; }
      t.normalize();
      /* sideways WITHIN the surface: perpendicular to the tangent and to the
         outward direction, so the extra strokes hug the form */
      var rad=p.clone().normalize();
      var side=new THREE.Vector3().crossVectors(t,rad).normalize();
      row.push(p.clone().addScaledVector(side,off));
    }
    out.push(row);
  }
  return out;
}
function buildBrainCurves(viewDir, detail){
  var curves=[];
  /* A — the outline, near side only, heaviest */
  curves.push({ id:'silhouette', layer:'A', w:2.10, pts:silhouettePoints(viewDir,1) });
  /* E — the far hemisphere gets a ghost of the same outline and nothing else.
     The hemispheres must be DIFFERENTLY DRAWN, not merely differently lit, or
     they read as two copies of one drawing laid on top of each other. */
  curves.push({ id:'far-ghost', layer:'E', w:0.44, pts:silhouettePoints(viewDir,-1) });
  var minW = (detail>=1) ? 0 : 0.62;
  BRAIN_CURVES.forEach(function(c){
    if(c.w < minW) return;
    curves.push({ id:c.id, layer:c.layer, w:c.w, pts:curvePoints(c,1) });
  });
  return curves;
}
`;

module.exports = { SRC };
