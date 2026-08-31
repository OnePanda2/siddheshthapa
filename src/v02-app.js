/* ═══════════════════════════════════════════════════════════════════════
   V02 — COGNITIVE CONSTELLATION
   The experience layer. The graph above is the model; nothing here invents.

   Read DESIGN-V02.md before editing. The rules that bind this file:
     · darkness comes from DISTANCE or FOCUS, never from region identity
     · the neuron alphabet is reused, never redesigned
     · no geometry exists without a referent in the graph
     · the DOM layer is the structure; this canvas is only a view
   ═══════════════════════════════════════════════════════════════════════ */

/* ── derive the graph, exactly as preview.html does ──────────────────── */
var NODES=[],byId={},owned={};
/* ── THE V02 OVERLAY ──────────────────────────────────────────────────
   Everything V02 changes about the extracted P4.7 graph, declared in one
   place. Nothing else may diverge. */
var V02_OVERLAY={
  relabel:[
    { id:'my-works', from:'MY WORKS', to:'ART',
      why:'the MMM entry becomes ART; the welcome page will later own a separate My Works door. Identity, ownership, concepts, writings and relationships are untouched.' }
  ],
  /* an internal key moves; nothing else does */
  renameIds:[
    { from:'psychology', to:'psychology-behaviour',
      why:'frees the id psychology for the top-level MIG. The concept keeps its PSYCHOLOGY label, its owner HUMAN BEHAVIOUR, and all of its relationships.' }
  ],
  addMIGs:[
    { id:'psychology', label:'PSYCHOLOGY',
      gloss:'Not yet written. The region exists; the thinking has not been filed here.',
      empty:true,
      why:'required as a first-class MIG. Created EMPTY on purpose — no concepts were invented.',
      idNote:'takes the id psychology because the Minor IG that held it has been re-keyed to psychology-behaviour by the declared rename above.',
      conflict:null }
  ]
};
(function(){
  /* every place an id can appear: the object itself, both ends of every edge,
     and the crosses[] hints. Miss one and the object silently disappears. */
  (V02_OVERLAY.renameIds||[]).forEach(function(rn){
    var moved=0;
    MINORS.concat(THOUGHTS).forEach(function(o){
      if(o.id===rn.from){ o.id=rn.to; moved++; }
      if(o.crosses) o.crosses=o.crosses.map(function(c){ return c===rn.from?rn.to:c; });
    });
    EDGES.forEach(function(e){
      if(e[0]===rn.from){ e[0]=rn.to; }
      if(e[1]===rn.from){ e[1]=rn.to; }
    });
    rn.movedObjects=moved;
  });
  V02_OVERLAY.relabel.forEach(function(r){
    for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===r.id){
      r.observedFrom=MIGS[i].label; MIGS[i].label=r.to;
    }
  });
  V02_OVERLAY.addMIGs.forEach(function(a){
    for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===a.id) return;   // never twice
    MIGS.push({ id:a.id, label:a.label, gloss:a.gloss, v02Added:true, v02Empty:!!a.empty });
  });
})();
MIGS.forEach(function(m){ m.t='mig'; m.mig=m.id; NODES.push(m); owned[m.id]=[]; });
MINORS.forEach(function(n){ n.t='minor'; NODES.push(n); });
THOUGHTS.forEach(function(n){ NODES.push(n); });
NODES.forEach(function(n,i){ n.i=i; byId[n.id]=n; });
NODES.forEach(function(n){ if(n.t!=='mig' && owned[n.mig]) owned[n.mig].push(n.id); });

var adj={}, degree={}, xdeg={};
NODES.forEach(function(n){ adj[n.id]=[]; degree[n.id]=0; xdeg[n.id]=0; });
var LINKS=[];
EDGES.forEach(function(e){
  if(!byId[e[0]]||!byId[e[1]]) return;
  adj[e[0]].push({o:e[1],v:e[2],g:e[3],dir:1});
  adj[e[1]].push({o:e[0],v:e[2],g:e[3],dir:-1});
  degree[e[0]]++; degree[e[1]]++;
  if(byId[e[0]].mig!==byId[e[1]].mig){ xdeg[e[0]]++; xdeg[e[1]]++; }
  LINKS.push({a:e[0],b:e[1],verb:e[2],gloss:e[3]});
});

/* ── 1. THE UNIVERSE IS BUILT FROM THE GRAPH, NOT FROM A LAYOUT ───────
   MIG positions are seeded on a Fibonacci sphere — a genuinely volumetric
   distribution, never a plane with depth added — then relaxed so regions
   that share cross-region relationships drift toward each other. The
   arrangement is therefore an ARGUMENT ABOUT THE MIND rather than
   decoration: proximity means intellectual traffic. Deterministic, so it
   is testable and identical on every load. ─────────────────────────── */
var R_UNIVERSE=250;
function seedSphere(i,n,r){
  var k=i+0.5, phi=Math.acos(1-2*k/n), theta=Math.PI*(1+Math.sqrt(5))*k;
  return new THREE.Vector3(Math.cos(theta)*Math.sin(phi)*r,
                           Math.sin(theta)*Math.sin(phi)*r*0.62,  // flatten slightly: a mind, not a ball
                           Math.cos(phi)*r);
}
var migAffinity={};
MIGS.forEach(function(m){ migAffinity[m.id]={}; });
LINKS.forEach(function(l){
  var A=byId[l.a].mig, B=byId[l.b].mig;
  if(A===B) return;
  migAffinity[A][B]=(migAffinity[A][B]||0)+1;
  migAffinity[B][A]=(migAffinity[B][A]||0)+1;
});
MIGS.forEach(function(m,i){ m.pos=seedSphere(i,MIGS.length,R_UNIVERSE); });
var MW=byId['my-works']; if(MW) MW.pos.set(-40,-18,R_UNIVERSE*0.86);   // nearest the arriving camera
for(var pass=0; pass<60; pass++){
  MIGS.forEach(function(m){
    if(m.id==='my-works') return;            // the hook stays put
    var force=new THREE.Vector3();
    MIGS.forEach(function(o){
      if(o===m) return;
      var d=new THREE.Vector3().subVectors(o.pos,m.pos), len=Math.max(1,d.length());
      var pull=(migAffinity[m.id][o.id]||0)*0.9;      // shared thinking attracts
      var push=9000/(len*len);                        // nothing may collapse together
      force.add(d.normalize().multiplyScalar(pull*0.16-push*len*0.012));
    });
    m.pos.add(force.clamp(new THREE.Vector3(-4,-4,-4), new THREE.Vector3(4,4,4)));
    if(m.pos.length()>R_UNIVERSE*1.5) m.pos.setLength(R_UNIVERSE*1.5);
  });
}

/* ── 1b. A MIG WITH A TEMPLATE BECOMES A SOLAR SYSTEM ─────────────────
   The astronomy is injected from data/astronomy-systems.json, which holds
   figures retrieved from the NASA Exoplanet Archive. Nothing here is a
   constant somebody typed: change the dataset and the geometry follows.

   The MIG is the star. Its concepts occupy orbital positions whose RELATIVE
   spacing is the measured spacing — r_i / r_0 is exactly a_i / a_0 — so
   TRAPPIST-1's real signature (seven orbits inside 0.062 AU, outer 5.36x the
   inner) survives normalisation. Absolute AU is discarded because it means
   nothing here; the architecture is what we borrowed.

   Writings are NOT planets. They are secondary bodies belonging to the
   concept they actually connect to in the graph. */
var ASTRO_DATA=/*__ASTRO__*/;
var ASTRO={}; (ASTRO_DATA.systems||[]).forEach(function(sy){ ASTRO[sy.system]=sy; });

/* Two worlds are assigned, chosen to be structurally opposite: one star with
   seven packed orbits, against two stars with a hollow centre. */
var MIG_SYSTEM={ 'philosophy':'TRAPPIST-1', 'love':'Kepler-16', 'movies':'HR 8799',
                 'life':'Kepler-33' };
function templateFor(migId){ return ASTRO[MIG_SYSTEM[migId]]||null; }

var ORBIT_R0=13;                     // the innermost orbit, in scene units
var SYS_TILT=0.42;                   // one shared viewing tilt, ~24 degrees

/* Scene units per world are a MAP SCALE, not a measurement. What the astronomy
   fixes is the ratios inside a world, and that is what the checks pin.
   Kepler-16 needs a larger scale for one reason: its two stars have to resolve
   as two. */
/* MOVIES is the counterweight to PHILOSOPHY, and the data says so: HR 8799 is
   filed as "the strongest available contrast to TRAPPIST-1". Seven tight
   orbits whose spacing COMPRESSES outward (gaps 1.37 down to 1.22) against
   four whose spacing EXPANDS (1.46, 1.58, 1.79) — the near-2:1 resonances of
   a directly imaged system spanning 16 to 68 AU. The scale is larger so that
   four bodies have room to be sparse rather than merely few. */
/* LIFE is Kepler-33, five bodies evenly graded outward across 3.7x. Its gaps
   COMPRESS harder than TRAPPIST-1's — 1.76 down to 1.19 against 1.37 down to
   1.22 — so it is the most compressive system in the set, not a smaller copy
   of Philosophy. */
var WORLD_SCALE={ 'philosophy':13, 'love':52, 'movies':18, 'life':15 };
function scaleFor(migId){ return WORLD_SCALE[migId]||ORBIT_R0; }

/* TRAPPIST-1 is famously coplanar — mutual inclinations under ~0.1 degrees —
   so the orbits stay nearly flat. That flatness is a real property of the
   system, not a shortcut, and exaggerating it would misrepresent the source. */
function orbitalSlots(tpl,R0,want){
  R0=R0||ORBIT_R0;
  if(tpl.sourceType==='circumbinary-system'){
    /* Kepler-16 has exactly ONE measured planet. Orbit 0 is that measurement;
       everything beyond it is spaced by the rule declared in the data file and
       is never claimed as an observation. The rule is read from the data, so
       changing the data changes the geometry. */
    var step=(tpl.illustrative&&tpl.illustrative.orbitSpacingStep)||1.31037;
    var out=[];
    for(var k=0;k<Math.max(1,want||1);k++) out.push(R0*Math.pow(step,k));
    return out;
  }
  var a=tpl.semiMajorAxisAU, inner=a[0];
  return a.map(function(v){ return R0*(v/inner); });
}
function localOrbit(r,theta,incl){
  var x=Math.cos(theta)*r, z=Math.sin(theta)*r, y=Math.sin(theta)*r*incl;
  // tilt the whole system once so the orbital plane reads as a plane in 3D
  return new THREE.Vector3(x, y*Math.cos(SYS_TILT)-z*Math.sin(SYS_TILT),
                              y*Math.sin(SYS_TILT)+z*Math.cos(SYS_TILT));
}

/* ── 1a1. THE BRAIN ───────────────────────────────────────────────────
   A direction on the unit sphere is warped onto a brain-like shell: longer
   front to back than side to side, flattened above and below, fuller at the
   front, tapered at the back, with a temporal bulge low and forward and a
   fissure down the middle. Not anatomy — a silhouette. */
/* ── THE LATERAL PROFILE ──────────────────────────────────────────────
   The midsagittal outline, sampled every 15 degrees from +Z (the frontal
   pole) rotating toward +Y (the crown). This is the silhouette, and the
   silhouette is what a viewer names. Landmarks, in order:

     0-75    frontal lobe, fullest just above the pole
     90      vertex, the high point, set slightly BEHIND centre
     165-180 occipital pole, tapering
     195-210 the notch above the cerebellum
     225     the cerebellar mass, a separate smaller bulge
     255-285 the base, flat and much closer in
     300-330 the temporal lobe, hanging forward and low
     345     the Sylvian notch, the cleft that separates temporal from frontal

   A perfect ellipse has no notches. These two — cerebellar and Sylvian —
   are what stop this reading as an egg. */
var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,1.07,1.05,1.02,0.99,0.96,0.93,0.89,
                   0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];
var BRAIN_R=210;
/* the lateral axis. A check measures the angle between the camera direction
   and pure lateral, so "side view" is an assertion rather than a claim. */
var BRAIN_VIEW=new THREE.Vector3(1.0,0.125,0.105).normalize();
function bsmooth(a,b,x){ var t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }
function brainRadius(phi){
  var n=BRAIN_PROFILE.length, step=6.283185/n;
  var a=phi%6.283185; if(a<0) a+=6.283185;
  var i=Math.floor(a/step), f=(a-i*step)/step;
  var t=(1-Math.cos(f*Math.PI))/2;                    // C1 through the table
  return BRAIN_PROFILE[i%n]*(1-t)+BRAIN_PROFILE[(i+1)%n]*t;
}
/* how far the shell reaches sideways. A brain is longer than it is wide
   (167 x 140 x 93mm, so d/w 1.19), widest through the temporal lobes, and
   narrows toward both poles and along the base. */
function brainWidth(y,z){
  /* real proportions: a brain is 167 long, 140 wide, 93 high */
  var w=0.68;
  w*=1-0.34*bsmooth(0.25,1.00,z);                        // narrows to the frontal pole
  w*=1-0.40*bsmooth(0.25,1.00,-z);                       // narrows to the occipital pole
  w*=1-0.32*bsmooth(0.10,0.95,-y);                       // the base is narrower than the crown
  w*=1+0.32*Math.exp(-Math.pow((y+0.30)/0.30,2));        // the temporal bulge
  return w;
}

var BRAIN_GAP=0.055;
/* THE FORM.

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

/* ── THE CONSTELLATION ────────────────────────────────────────────────
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
function buildBrainCurves(viewDir, detail){
  var P=[], E=[], seen={}, curves=[];
  BRAIN_CHAINS=[];
  function ekey(a,b){ return a<b ? a+'_'+b : b+'_'+a; }
  function link(a,b){ var k=ekey(a,b); if(!seen[k]){seen[k]=1; E.push([a,b]);} }
  /* Catmull-Rom through control directions, resampled onto the surface, so a
     boundary curves the way the form curves instead of cutting across it —
     which is what turned the landmark version into a faceted polyhedron. */
  function chain(ctrl, cnt, closed, name){
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
    /* named, so the drawing can be described rather than merely counted. Every
       chain in the figure is a real anatomical boundary and says which. */
    if(name){
      /* where this chain actually sits on the form, so its ARRANGEMENT can be
         asserted and not merely its existence: a temporal chain drawn above
         the Sylvian fissure would still be present, and still be wrong. */
      var lo=[1e9,1e9], hi=[-1e9,-1e9];
      idx.forEach(function(j){
        var d=P[j].clone().normalize();
        lo[0]=Math.min(lo[0],d.z); hi[0]=Math.max(hi[0],d.z);
        lo[1]=Math.min(lo[1],d.y); hi[1]=Math.max(hi[1],d.y);
      });
      BRAIN_CHAINS.push({ id:name, stars:idx.length, closed:!!closed,
                          side:(name.slice(-1)==='R'?-1:1),
                          u:[+lo[0].toFixed(2),+hi[0].toFixed(2)],
                          v:[+lo[1].toFixed(2),+hi[1].toFixed(2)] });
    }
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
    return chain(c, N(18), true, 'profile-'+(side>0?'L':'R'));
  }
  var proL=profileRing(1), proR=profileRing(-1);

  /* 2. THE LONGITUDINAL FISSURE, a rim either side of the midline. This is
     what makes the view from ABOVE two hemispheres instead of one oval. */
  var rimC=[[0.15,0.36,0.88],[0.17,0.74,0.62],[0.17,0.96,0.10],
            [0.16,0.88,-0.44],[0.14,0.46,-0.84]];
  var rimL=chain(rimC,N(9),false,'fissure-L'), rimR=chain(mirror(rimC),N(9),false,'fissure-R');

  /* 3. THE SYLVIAN FISSURE — the cleft that frees the temporal lobe, and the
     most identifying single mark on a lateral view. */
  var sylC=[[0.70,-0.20,0.58],[0.84,-0.16,0.28],[0.90,-0.08,-0.06],
            [0.82,0.02,-0.34],[0.66,0.10,-0.56]];
  var sylL=chain(sylC,N(8),false,'sylvian-L'), sylR=chain(mirror(sylC),N(8),false,'sylvian-R');

  /* 4. THE TEMPORAL LOBE'S LOWER EDGE, so the mass below the fissure is a lobe
     with a bottom rather than an open corner. */
  var tmpC=[[0.54,-0.56,0.52],[0.70,-0.56,0.16],[0.72,-0.52,-0.20],[0.56,-0.46,-0.50]];
  var tmpL=chain(tmpC,N(7),false,'temporal-L'), tmpR=chain(mirror(tmpC),N(7),false,'temporal-R');

  /* 5. THE CEREBELLUM — its own arc behind and below the notch, so it reads as
     a separate organ rather than more occipital lobe. */
  var cbC=[[0.46,-0.36,-0.70],[0.50,-0.58,-0.78],[0.36,-0.76,-0.74],[0.14,-0.82,-0.58]];
  var cbL=chain(cbC,N(5),false,'cerebellar-L'), cbR=chain(mirror(cbC),N(5),false,'cerebellar-R');

  /* 6. THE CENTRAL SULCUS — the diagonal running down and forward from the
     crown. Two marks at an angle read as anatomy; two parallel ones read as a
     contour map. */
  var csC=[[0.34,0.90,-0.20],[0.62,0.62,-0.04],[0.80,0.28,0.08]];
  var csL=chain(csC,N(5),false,'central-L'), csR=chain(mirror(csC),N(5),false,'central-R');

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
}

/* ── BRAIN ANATOMY ────────────────────────────────────────────────────
   There is none here any more, and that is the change.

   The anatomy used to be a list of curves inked over a shell. It is now the
   shell: the profile carries the lobes, the gyroid carries the cortex, and
   the two named fissures are grooves cut into the geometry. A fold is visible
   because it is lit, not because a line was drawn where a fold would be.

   featurePoints survives only because the harness measures the midline gap
   with it. Nothing is emitted into the line buffer for the brain. */
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
}
var mindOpen=0;                 // 0 = brain, 1 = universe
var MORPH_ON=false;

/* ── 1a2. THE CONSTELLATION ───────────────────────────────────────────
   THE STARS ARE REAL. THE LINES ARE THE MIND'S.
   Star positions come from SIMBAD; the figure is drawn by OBSERVATION's own
   relationships. The conventional asterism is used for exactly one thing —
   fixing which object lands on which star — and is never rendered. */
var CONST_DATA=/*__CONST__*/;
var MIG_CONSTELLATION={ 'observation':'Ursa Major' };
var CONST_SCALE=2.6;        // scene units per light year — a map scale, like WORLD_SCALE
var CONSTELLATIONS={};

function constellationFor(migId){ return MIG_CONSTELLATION[migId]?CONST_DATA:null; }

/* Walk the region's own relationships. A constellation MIG is one whose
   objects form a single chain; the walk is deterministic, so the mapping is
   reproducible from the data rather than hand-placed. */
function chainOf(migId){
  var mem=(owned[migId]||[]);
  var adj={}; mem.forEach(function(id){ adj[id]=[]; });
  var internal=[];
  LINKS.forEach(function(l){
    if(byId[l.a].mig!==migId||byId[l.b].mig!==migId) return;
    if(!adj[l.a]||!adj[l.b]) return;
    adj[l.a].push(l.b); adj[l.b].push(l.a);
    internal.push(l);
  });
  var ends=mem.filter(function(id){ return adj[id].length===1; }).sort();
  var lone=mem.filter(function(id){ return adj[id].length===0; }).sort();
  /* start from the endpoint that is a Minor IG; lexicographic id breaks ties */
  var start=null;
  for(var i=0;i<ends.length;i++) if(byId[ends[i]].t==='minor'){ start=ends[i]; break; }
  if(!start) start=ends[0]||null;
  var chain=[], cur=start, prev=null;
  while(cur){
    chain.push(cur);
    var nx=null;
    for(var j=0;j<adj[cur].length;j++) if(adj[cur][j]!==prev){ nx=adj[cur][j]; break; }
    prev=cur; cur=nx;
    if(chain.length>mem.length) break;             // never loop on bad data
  }
  return {chain:chain, lone:lone, internal:internal, adj:adj};
}

/* True 3D. RA/Dec/distance -> Cartesian light years, then rotated so the mean
   line of sight becomes the depth axis. Measurement showed this figure is 0.90x
   as deep as it is wide, so NO depth exaggeration is applied: what you see is
   the real relative geometry at one map scale. */
function buildConstellation(migId){
  var D=constellationFor(migId); if(!D) return null;
  var stars=D.measured.stars, order=D.unverified.asterismDrawOrder,
      lone=D.unverified.offAsterismStar;
  var byName={}; stars.forEach(function(s){ byName[s.proper]=s; });
  var R=Math.PI/180;
  function xyz(s){
    var ra=s.raDeg*R, de=s.decDeg*R, r=s.distanceLy;
    return new THREE.Vector3(r*Math.cos(de)*Math.cos(ra),
                             r*Math.cos(de)*Math.sin(ra),
                             r*Math.sin(de));
  }
  var carts=stars.map(xyz);
  var mean=new THREE.Vector3();
  stars.forEach(function(s,i){ mean.add(carts[i].clone().divideScalar(s.distanceLy)); });
  mean.divideScalar(stars.length).normalize();
  var wv=mean.clone();
  var uv=new THREE.Vector3().crossVectors(wv,new THREE.Vector3(0,0,1)).normalize();
  var vv=new THREE.Vector3().crossVectors(wv,uv);
  var meanDepth=0; carts.forEach(function(c){ meanDepth+=c.dot(wv); });
  meanDepth/=carts.length;
  var local={};
  stars.forEach(function(s,i){
    local[s.proper]=new THREE.Vector3(carts[i].dot(uv), carts[i].dot(vv),
                                      carts[i].dot(wv)-meanDepth);
  });
  var g=chainOf(migId);
  var map={}, starOf={};
  g.chain.forEach(function(id,k){ if(order[k]){ map[id]=order[k]; starOf[order[k]]=id; } });
  if(g.lone.length===1 && byName[lone]){ map[g.lone[0]]=lone; starOf[lone]=g.lone[0]; }
  return { data:D, local:local, byName:byName, map:map, starOf:starOf,
           chain:g.chain, lone:g.lone, internal:g.internal,
           meanDistanceLy:D.derived.meanDistanceLy,
           order:order, offAsterism:lone, u:uv, v:vv, w:wv };
}

var ORBITS={};                       // migId -> [{id,r,theta,incl}] for checking

var CONST_BG=[];                       // render-only sky, never graph objects

MIGS.forEach(function(m){
  var mem=owned[m.id]||[], n=Math.max(1,mem.length);
  var tpl=templateFor(m.id);
  var kon=MIG_CONSTELLATION[m.id]?buildConstellation(m.id):null;

  if(kon){
    /* the figure's local frame is oriented so its DEPTH AXIS points back along
       the radius the camera arrives on — which is why the pattern resolves on
       arrival and comes apart the moment you move off that line */
    var wW=m.pos.clone().normalize();
    var uW=new THREE.Vector3().crossVectors(wW,new THREE.Vector3(0,1,0)).normalize();
    var vW=new THREE.Vector3().crossVectors(wW,uW);
    kon.frame={u:uW, v:vW, w:wW, centre:m.pos.clone()};
    var place=function(p){
      return new THREE.Vector3().addVectors(m.pos,
        uW.clone().multiplyScalar(p.x*CONST_SCALE)
          .add(vW.clone().multiplyScalar(p.y*CONST_SCALE))
          .add(wW.clone().multiplyScalar(-p.z*CONST_SCALE)));
    };
    kon.place=place;
    Object.keys(kon.map).forEach(function(id){
      var s=kon.byName[kon.map[id]], node=byId[id];
      if(!s||!node) return;
      node.pos=place(kon.local[s.proper]);
      node.home=m.id;
      node.star=s.proper; node.starV=(s.vMag===null?s.vMagDerived:s.vMag);
      node.starLy=s.distanceLy;
      node.offAsterism=(s.proper===kon.offAsterism);
    });
    /* 53 real stars of the same field, V<6.0. Atmospheric only: their RA/Dec
       are measured, their DEPTH is not, and they never enter the graph. */
    var bg=(kon.data.background&&kon.data.background.stars)||[];
    var Rr=Math.PI/180, ref=kon.meanDistanceLy;
    var named=kon.data.measured.stars;
    bg.forEach(function(b,bi){
      /* the field query returned the eight named stars too — drop them, or the
         constellation would be drawn twice and the sky would compete with it */
      for(var q=0;q<named.length;q++)
        if(Math.abs(named[q].raDeg-b.raDeg)<0.02 && Math.abs(named[q].decDeg-b.decDeg)<0.02) return;
      var ra=b.raDeg*Rr, de=b.decDeg*Rr;
      var dir=new THREE.Vector3(Math.cos(de)*Math.cos(ra),
                                Math.cos(de)*Math.sin(ra), Math.sin(de));
      var far=ref*(1.55+((bi*37)%23)/23*0.55);      // declared, not measured
      var c=dir.multiplyScalar(far);
      var p=new THREE.Vector3(c.dot(kon.u), c.dot(kon.v),
                              c.dot(kon.w)-ref);
      CONST_BG.push({ mig:m.id, vMag:b.vMag, pos:place(p) });
    });
    /* the MIG itself has no body here: the constellation IS the emblem */
    m.constellation=kon;
    CONSTELLATIONS[m.id]=kon;
  } else if(tpl){
    var concepts=mem.filter(function(id){ return byId[id].t==='minor'; });
    var writings=mem.filter(function(id){ return byId[id].t!=='minor'; });
    var slots=orbitalSlots(tpl, scaleFor(m.id), concepts.length);
    ORBITS[m.id]=[];
    concepts.forEach(function(id,k){
      var node=byId[id];
      /* Exact 7<->7: concept k takes orbit k, no interpolation. Angle comes
         from the concept's own graph degree so the arrangement is derived
         rather than decorative — never k/n*2pi, which is what turns every
         world into the same radial menu. */
      var theta=k*2.39996+((degree[id]||0)%5)*0.42;
      var incl=tpl.sourceType==='circumbinary-system'
             ? 0.0087                       // measured: coplanar within 0.5 deg
             : 0.02+((k%3)*0.012);          // near-coplanar, as measured
      var r=slots[Math.min(k,slots.length-1)];
      node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(r,theta,incl));
      node.home=m.id; node.orbit={r:r,theta:theta,slot:k};
      ORBITS[m.id].push({id:id,r:r,theta:theta,slot:k});
    });
    /* a writing sits just outside whichever concept it actually connects to;
       with no such edge it joins a quiet belt beyond the outermost orbit */
    var outer=slots[slots.length-1];
    writings.forEach(function(id,k){
      var node=byId[id];
      var host=null;
      (adj[id]||[]).forEach(function(e){
        if(!host && byId[e.o] && byId[e.o].t==='minor' && byId[e.o].mig===m.id) host=byId[e.o];
      });
      if(host && host.pos){
        /* far enough out that the concept stays a single body, close enough
           that the writing still reads as belonging to it */
        var off=k*2.11+(degree[id]||0)*0.9;
        var lift=(k%2?1:-1)*(6.5+(k%3)*2.2);
        node.pos=new THREE.Vector3().addVectors(host.pos,
          new THREE.Vector3(Math.cos(off)*13.5, lift, Math.sin(off)*13.5));
        node.belt=false;
      } else {
        var th=k*2.39996+1.1;
        node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(outer*1.34,th,0.05));
        node.belt=true;
      }
      node.home=m.id;
    });
  } else {
    /* every other MIG keeps the previous spherical distribution */
    mem.forEach(function(id,k){
      var node=byId[id];
      var minor=(node.t==='minor');
      var scale=Math.pow(Math.max(1,n)/8,0.42);
      var r=((minor?11:20)+((k*7)%9))*scale;
      node.pos=new THREE.Vector3().addVectors(m.pos, seedSphere(k,n,r));
      node.home=m.id;
    });
  }
});

/* ── 1b. THE BINARY ───────────────────────────────────────────────────
   Two unequal stars orbit a shared barycentre which is itself EMPTY. Both
   ellipses share that focus and their periapses point opposite ways, so the
   pair is always on opposite sides — bound together, never coincident.
   Every number here is measured or derived in data/astronomy-systems.json.
   Nothing about the binary is invented in the renderer. */
var BINARY={};
function binaryRadius(b,which,phase){
  var a=which? b.rB : b.rA;
  return a*(1-b.ecc*b.ecc)/(1+b.ecc*Math.cos(phase));
}
function binaryOffset(b,which,phase){
  /* the SAME true anomaly drives both radii; only the position angle flips,
     which is what keeps M_A*r_A = M_B*r_B true at every instant */
  return localOrbit(binaryRadius(b,which,phase), phase+(which?Math.PI:0), 0);
}
Object.keys(MIG_SYSTEM).forEach(function(mid){
  var tpl=ASTRO[MIG_SYSTEM[mid]];
  if(!tpl||tpl.sourceType!=='circumbinary-system') return;
  var d=tpl.derived, ill=tpl.illustrative||{}, R0=scaleFor(mid);
  var aBin=R0/d.planetToBinaryRatio;            // scene units, from the ratio
  var mu=1/(1+d.swingRatioBoverA);              // M_B / M_total
  var node=byId[mid];
  BINARY[mid]={
    aBin:aBin,
    rA:aBin*mu,                 // the massive star barely moves
    rB:aBin*(1-mu),             // the small one swings 3.45x wider
    ecc:(ill.binaryEccentricity!==undefined?ill.binaryEccentricity:0),
    eccMeasured:false,          // published as "eccentric", value unsourced
    sizeRatio:d.visualSizeRatioAoverB,
    stability:aBin*d.stabilityLowerBoundRatio,
    phase:0.92,
    centre:node&&node.pos?node.pos.clone():null   // the barycentre: empty
  };
  /* the MIG node IS star A. It moves off the barycentre onto its own ellipse,
     AFTER its concepts were placed relative to the barycentre. */
  if(node&&node.pos) node.pos.add(binaryOffset(BINARY[mid],0,BINARY[mid].phase));
});
function centreOf(mid){ return (BINARY[mid]&&BINARY[mid].centre)||byId[mid].pos; }

/* Render-only bodies. A world's template can require a body that is not an
   idea: star B is structure, not a concept. It must never enter the graph, the
   menu, or the pick list, so it lives only in the geometry, appended after
   every real node. */
var COMPANIONS=[];
Object.keys(BINARY).forEach(function(mid){
  var b=BINARY[mid]; if(!b.centre) return;
  COMPANIONS.push({ mig:mid, role:'starB',
    pos:new THREE.Vector3().addVectors(b.centre, binaryOffset(b,1,b.phase)) });
});

/* ── 1d. TWO PLACES FOR EVERY OBJECT ──────────────────────────────────
   uPos is where it lives in the universe. bPos is where it lives in the brain:
   a MIG sits on the shell, and everything a MIG owns is folded into it, so the
   brain shows regions and their relationships and nothing else. */
NODES.forEach(function(nd){ if(nd.pos) nd.uPos=nd.pos.clone(); });
/* Where does a region sit in the organ? Spread across the plane the visitor
   is looking at, in the order the universe already puts them in — so the
   arrangement is derived from the data rather than typed out region by region,
   and adding a sixteenth MIG re-spaces the lot instead of needing a new case.

   The lattice is deliberately uneven. A clean 5x3 grid of names over a brain
   would read as a diagram of a brain; the offsets keep it a mind. */
MIGS.forEach(function(m,i){
  if(!m.uPos) return;
  var N=MIGS.length, COLS=Math.ceil(Math.sqrt(N*1.9));   // wider than tall, as the organ is
  var ROWS=Math.ceil(N/COLS);
  var cx=(i%COLS+0.5)/COLS, cy=(Math.floor(i/COLS)+0.5)/ROWS;
  /* deterministic per-region offsets from the index — no hand placement */
  cx+=(((i*7)%5)/5-0.5)*0.11;
  cy+=(((i*11)%7)/7-0.5)*0.20;
  /* front is +Z and the crown is +Y, so a column walks the brain back to front
     and a row walks it top to bottom */
  var z=(0.5-cx)*2.05, y=(0.56-cy)*1.62;
  /* the hemispheres alternate, which puts neighbours at different depths and
     stops two names from ever landing on the same pixel */
  var side=(i%2===0)?1:-1;
  var lat=0.20+((i*13)%4)/4*0.30;
  var dir=new THREE.Vector3(lat*side,y,z).normalize();
  var rad=0.72+((i*5)%3)/3*0.13;
  m.bPos=brainShell(dir).multiplyScalar(rad);
});
var BRAIN_SPREAD=0.46;
NODES.forEach(function(nd,k){
  if(nd.t==='mig') return;
  var host=byId[nd.mig];
  if(!host||!host.uPos){ nd.bPos=nd.uPos?nd.uPos.clone():null; return; }
  /* a deterministic offset around its own region's direction, then dropped onto
     the shell — so the object sits on the brain's surface, in its region's
     neighbourhood, and nothing is placed by hand */
  /* around the host's position IN THE BRAIN, not its position in the
     universe. The two stopped being the same when the regions were laid out
     for the lateral view, and using the universe direction scattered a
     region's contents to the far side of the organ from its own name — so
     naming a region lit up tissue somewhere else entirely. */
  var d0=(host.bPos||host.uPos).clone().normalize();
  var a1=(k*2.39996)%6.2832, a2=((k*7)%13)/13*3.14159;
  var t1=new THREE.Vector3(-d0.z,0,d0.x); if(t1.lengthSq()<1e-6) t1.set(1,0,0);
  t1.normalize();
  var t2=new THREE.Vector3().crossVectors(d0,t1).normalize();
  var amp=BRAIN_SPREAD*(0.42+0.58*Math.sin(a2));
  var dir=d0.clone()
    .add(t1.multiplyScalar(Math.cos(a1)*amp))
    .add(t2.multiplyScalar(Math.sin(a1)*amp)).normalize();
  /* what a region holds sits inside it too, at varying depth, so the interior
     has substance and the surface stays anatomy */
  nd.bPos=brainShell(dir).multiplyScalar(0.34+((k*11)%17)/17*0.36);
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

/* ── 2. THE NEURON ALPHABET, REUSED ───────────────────────────────────
   The glyphs are drawn once into a texture atlas by the SAME shape logic
   the 2D build uses. This is the promotion the brief asked for (§15): the
   alphabet is not redesigned, it becomes the atomic object at every range.
   FAR the sprite is a point of light; MID it resolves into its glyph;
   NEAR the DOM adds its label and state. ────────────────────────────── */

var MIG_VISUAL={
  /* 21 concepts, 14 writings, 6 contradictions — the most interconnected
     region. A neural body with many fine branches. */
  'philosophy'  :{family:'neural',   branches:8, len:0.86, spread:0.40, rings:0, core:0.58},
  /* people are consistent in ways they would deny: irregular adaptive splits */
  'behaviour'   :{family:'neural',   branches:6, len:0.74, spread:0.92, rings:0, core:0.52},
  /* 12 writings, the region everything reports back to: organic and expansive */
  'life'        :{family:'organic',  branches:7, len:0.94, spread:0.62, rings:0, core:0.62},
  /* two bodies whose trajectories bend around each other. Connection, not romance. */
  'love'        :{family:'binary',   branches:0, len:0.00, spread:0.00, rings:1, core:0.46},
  /* 14 concepts of systems and structure: a body with controlled satellites */
  'business'    :{family:'orbital',  branches:3, len:0.42, spread:0.20, rings:2, core:0.60},
  /* precise, engineered, connected micro-orbits — not a circuit board */
  'technology'  :{family:'lattice',  branches:6, len:0.60, spread:0.10, rings:1, core:0.50},
  /* assembly, modular, stacked: an architectural cluster */
  'building'    :{family:'modular',  branches:4, len:0.52, spread:0.06, rings:1, core:0.54},
  /* knowledge expanding: complexity increases outward, shells layer */
  'learning'    :{family:'growth',   branches:9, len:0.90, spread:0.55, rings:2, core:0.44},
  /* noticing, caught before it hardens: one focused light with a lens halo */
  /* noticing, and distrusting the notice. Its identity is not an icon at all —
     it is the figure its own relationships draw across real stars. */
  'observation' :{family:'constellation', branches:0, len:0.00, spread:0.00, rings:0, core:0.30},
  /* deliberately EMPTY of writings. A bare rhythmic pulse, honestly sparse. */
  'music'       :{family:'harmonic', branches:5, len:0.70, spread:0.00, rings:1, core:0.40},
  /* frames and cuts: sequential lights receding, a temporal trajectory */
  'movies'      :{family:'sequence', branches:4, len:0.66, spread:0.00, rings:0, core:0.46},
  /* abundance and material life: a dense nourishing micro-cluster */
  'food'        :{family:'cluster',  branches:0, len:0.00, spread:0.00, rings:0, core:0.40},
  /* constructed, intentional, engineered — the most geometric, still celestial */
  'my-works'    :{family:'artifact', branches:2, len:0.30, spread:0.00, rings:2, core:0.56},
  /* many minds forming one system: stable bodies sharing a gravity well */
  'society'     :{family:'assembly', branches:0, len:0.00, spread:0.00, rings:1, core:0.44},
  /* a region that exists and has not been written yet. Diffuse, uncondensed —
     not an empty box, but matter that has not yet become a body. */
  'psychology'  :{family:'nascent',  branches:0, len:0.00, spread:0.00, rings:0, core:0.30}
};

/* The star values are LIGHTER than the bodies orbiting them, which is the
   opposite of how they began.

   These hues were chosen for ink on a pale page, where a star was the densest
   mark in its system — the darkest thing on white. On a night sky that
   relationship inverts: the densest ink becomes the dimmest light, so
   TRAPPIST-1 rendered as a dark silhouette while its own planets glowed
   around it, and the centre of the world looked like it had gone missing.

   Only the star values change, and each keeps its variant's hue. The bodies,
   orbits, fog and accents are untouched. */
var PHIL_VARIANTS={
  a:{ name:'cobalt + indigo',
      fog:0xa8b6d4, star:0x7d97e6, body:0x35508f, orbit:0x3c5ba9, accent:0x2b4fa8 },
  b:{ name:'electric blue + violet',
      fog:0xb2b0da, star:0x8f84e4, body:0x4741a3, orbit:0x5a4fc0, accent:0x5136c9 },
  c:{ name:'deep navy depth + cyan/violet',
      fog:0x9fb4c8, star:0x74aede, body:0x2d5f7a, orbit:0x2f6f8f, accent:0x1d7fa8 }
};
/* LOVE is warm because its stars are: the primary is a measured 4450 K
   K-dwarf, and the 0.20-solar secondary is necessarily cooler and redder. The
   colour is therefore stellar temperature, not romance. */
var LOVE_VARIANTS={
  a:{ name:'amber + rose',
      fog:0xdcc4b4, star:0x9a4f0d, star2:0xa8433f, body:0xa4614c, orbit:0xb87a58, accent:0xb0542a },
  b:{ name:'ember + rose',
      fog:0xe0c6bd, star:0x9c4a12, star2:0x93303f, body:0xa8564f, orbit:0xc07a5c, accent:0xb1401f },
  c:{ name:'gold + deep red',
      fog:0xdcc7ad, star:0x8a5a12, star2:0x8b262a, body:0x9c6141, orbit:0xb5824b, accent:0x9c5312 }
};
var OBS_VARIANTS={
  a:{ name:'verdigris + cold gold',
      fog:0xbdcfcb, star:0x1d4f4a, body:0x2f6f66, line:0x4a8f86, accent:0x2a7f74,
      anomaly:0x9a7b1f },
  b:{ name:'deep teal + brass',
      fog:0xb6cbcd, star:0x123f47, body:0x27636b, line:0x3f8a91, accent:0x1f7a83,
      anomaly:0xa8862a },
  c:{ name:'oxidised copper-green + pale gold',
      fog:0xc3d2c8, star:0x24564a, body:0x38756a, line:0x56988a, accent:0x2f8471,
      anomaly:0x8f7a26 }
};
/* MOVIES: HR 8799 is the one system here whose planets have been SEEN rather
   than inferred — four young, hot, self-luminous giants imaged in the near
   infrared, orbiting an A5V star of about 7400K. So the world is a cold
   blue-white centre with ember companions, which is what that photograph
   actually looks like, and it is a combination nothing else in the mind uses:
   Philosophy is uniformly blue-violet, Love a warm pair, Observation
   verdigris. The contrast between a hot white star and its own red planets is
   the astronomy, not a mood. */
var MOVIES_VARIANTS={
  a:{ name:'deep blue-white + ember',
      fog:0xc4ccd6, star:0x2f6aa8, body:0xb85a34, orbit:0x3d5c85, accent:0xc86a38 },
  b:{ name:'cold blue + infrared',
      fog:0xbdc9d8, star:0x265f9c, body:0xc26139, orbit:0x44648c, accent:0xd2743d },
  c:{ name:'steel + coal ember',
      fog:0xc8ced8, star:0x35719f, body:0xa85231, orbit:0x38547c, accent:0xb85f32 }
};
/* LIFE inverts MOVIES, and the astronomy is why. Kepler-33 is an old
   Sun-like star slightly evolved off the main sequence — yellow-white, warm —
   and its five planets are sub-Neptunes, hazy and cool. So this world is a
   warm centre with cool bodies, exactly the reverse of HR 8799's cold star
   among its embers. Neither is a mood: both are what the two systems are. */
var LIFE_VARIANTS={
  a:{ name:'old gold + cool haze',
      fog:0xd0c8b4, star:0x7a6420, body:0x4a5f72, orbit:0x6b5a2c, accent:0x8a6f22 },
  b:{ name:'amber-olive + slate',
      fog:0xcdc7ae, star:0x6e5f1c, body:0x445870, orbit:0x63562a, accent:0x7d6a26 },
  c:{ name:'wheat + deep blue-grey',
      fog:0xd6ccb8, star:0x866c26, body:0x3f5468, orbit:0x74602f, accent:0x957726 }
};
var LIFE_PICK=(function(){
  var m=/(^|[#&])lifepal:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var MOVIES_PICK=(function(){
  var m=/(^|[#&])movpal:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var OBS_PICK=(function(){
  var m=/(^|[#&])obspal:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var LOVE_PICK=(function(){
  var m=/(^|[#&])lovepal:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var PALETTE_PICK=(function(){
  var m=/(^|[#&])palette:([abc])/.exec(location.hash||'');
  return m?m[2]:'b';   // B chosen from the rendered comparison
})();
var MIG_PALETTE={};
(function(){
  var v=PHIL_VARIANTS[PALETTE_PICK]||PHIL_VARIANTS.a;
  MIG_PALETTE['philosophy']={fog:v.fog, star:v.star, body:v.body, orbit:v.orbit, accent:v.accent};
  /* OBSERVATION: verdigris and cold teal — the colour of oxidised optical
     instruments, the apparatus of looking. Not "space is blue". The single
     off-palette cold gold is reserved for the object that does not belong. */
  var o=OBS_VARIANTS[OBS_PICK]||OBS_VARIANTS.a;
  MIG_PALETTE['observation']={fog:o.fog, star:o.star, body:o.body,
                              orbit:o.line, accent:o.accent, anomaly:o.anomaly};
  var w=LOVE_VARIANTS[LOVE_PICK]||LOVE_VARIANTS.a;
  MIG_PALETTE['love']={fog:w.fog, star:w.star, star2:w.star2, body:w.body,
                       orbit:w.orbit, accent:w.accent};
  var mv=MOVIES_VARIANTS[MOVIES_PICK]||MOVIES_VARIANTS.a;
  MIG_PALETTE['movies']={fog:mv.fog, star:mv.star, body:mv.body,
                         orbit:mv.orbit, accent:mv.accent};
  var lf=LIFE_VARIANTS[LIFE_PICK]||LIFE_VARIANTS.a;
  MIG_PALETTE['life']={fog:lf.fog, star:lf.star, body:lf.body,
                       orbit:lf.orbit, accent:lf.accent};
})();
/* every other MIG keeps the neutral atmosphere until its own world is built —
   inventing thirteen palettes before their geometry exists would be decoration */
var NEUTRAL_PALETTE={fog:0xc9d3dc, star:0x1a3350, body:0x46525f, orbit:0x2b4f86, accent:0x2b6cb0};
function paletteOf(migId){ return MIG_PALETTE[migId]||NEUTRAL_PALETTE; }
/* ── THE WORLD PROFILE ────────────────────────────────────────────────
   One entry per MIG. The graph stays the source of truth; this is only the
   visual interpretation of it. Every field the renderer actually consults
   lives here, so a new world is a profile rather than a new branch. */
var WORLD_TYPES=['planetary','circumbinary','constellation','latent'];
var WORLD_BIAS={ 'movies':0.90, 'life':1.20 };
var MIG_WORLD_PROFILE={};
(function(){
  MIGS.forEach(function(m){
    var sys=MIG_SYSTEM[m.id]||null;
    var tpl=sys?ASTRO[sys]:null;
    var kon=MIG_CONSTELLATION[m.id]||null;
    var type = kon ? 'constellation'
             : (tpl && tpl.sourceType==='circumbinary-system') ? 'circumbinary'
             : tpl ? 'planetary'
             : 'latent';
    /* how far the camera stands when it arrives — the one number that sets the
       scale of everything range-based in that world */
    /* A world framed further out has to carry its ranges with it. The bias is
       what sets the distance, so the ranges scale by how far this world's bias
       departs from the one its type would otherwise use. Every world without
       an override has a scale of exactly 1, so the approved worlds are
       untouched to the unit. Without this MOVIES arrived at 272 with a label
       range of 160 and showed four unnamed lights. */
    /* Written as a lookup rather than a second ternary chain: an identical
       chain would duplicate the framingBias anchors below, and a mutation
       whose anchor matches twice is UNVERIFIED. */
    var TYPE_BIAS={constellation:1.00, circumbinary:0.55, planetary:0.66, latent:1.00};
    var typeBias = TYPE_BIAS[type]!==undefined ? TYPE_BIAS[type] : 1.00;
    var biasScale = (WORLD_BIAS[m.id]!==undefined ? WORLD_BIAS[m.id] : typeBias)/typeBias;
    var arrive = kon ? (CONST_DATA.derived.meanDistanceLy*CONST_SCALE)
               : (type==='circumbinary') ? 2.5*scaleFor(m.id)*0.70+2.5*scaleFor(m.id)*0.42
               : (type==='planetary') ? 115*biasScale
               : 96;
    MIG_WORLD_PROFILE[m.id]={
      worldType:type,
      astronomyTemplate: kon || sys || null,
      centralObject: type==='circumbinary' ? 'two stars about an empty barycentre'
                   : type==='constellation' ? 'none — the figure itself is the emblem'
                   : type==='planetary' ? 'one star'
                   : 'none yet',
      palette: MIG_PALETTE[m.id]?'own':'neutral',
      geometry: type==='constellation' ? 'measured RA/Dec/distance, true relative 3D'
              : type==='latent' ? 'spherical placeholder'
              : 'measured semi-major axis ratios',
      motion: type==='circumbinary' ? 'the pair swings while the camera travels'
            : type==='constellation' ? 'parallax on pointer — the figure depends on where you stand'
            : 'still',
      /* WORLD-LOCAL relationship visibility. Range is derived from the world's
         own arrival distance, so every world's relationships are equally
         legible when you get there — the shared rule, parameterised. */
      relationshipStyle:{ range:+(arrive*2.2).toFixed(1), arrival:+arrive.toFixed(1) },
      labelStyle: type==='constellation' ? {minor:470, writing:190}
                : {minor:Math.round(160*biasScale), writing:Math.round(80*biasScale)},
      /* how much of the world must fit the readable area. A constellation is a
         FIGURE and must be whole; a dense planetary system is allowed to crop
         its outer orbits, which is what its approved composition does. */
      /* A per-world override, because a bias is a statement about ONE world's
         composition and the type only approximates it. TRAPPIST-1 can crop its
         outer orbits: it has seven bodies and the outermost is one voice among
         many. HR 8799 has four, each 1.5 to 1.8 times further out than the
         last, and the wide separation IS the world — cropping the outermost
         throws away the exact property that makes it the counterweight to
         Philosophy. So MOVIES asks for nearly all of itself. */
      framingBias: WORLD_BIAS[m.id]!==undefined ? WORLD_BIAS[m.id]
                 : type==='constellation' ? 1.00
                 : type==='circumbinary'  ? 0.55
                 : type==='planetary'     ? 0.66
                 /* A latent world is a placeholder sphere. It has no approved
                    composition to protect and nothing worth cropping, so it
                    simply fits. 0.90 was never read at all until this branch
                    started asking for a measured distance. */
                 : 1.00,
      atmosphere: MIG_PALETTE[m.id]?'own fog and body tones':'shared neutral',
      mobileMode: type==='constellation' ? 'stand back 2.02x and aim below the figure'
                : type==='circumbinary' ? 'stand back and lift the pair out of the sheet'
                : type==='planetary' ? 'stand back and aim high'
                : 'default'
    };
  });
})();
function profileOf(mid){ return MIG_WORLD_PROFILE[mid]||null; }
/* the source line under a MIG's name. Never invented: a region with no world
   yet is labelled as such. */
function sourceLabelOf(mid){
  var p=MIG_WORLD_PROFILE[mid];
  if(!p) return 'unassigned';
  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';
  return p.astronomyTemplate;
}
function relRangeOf(mid){
  var p=MIG_WORLD_PROFILE[mid];
  return (p && p.relationshipStyle && p.relationshipStyle.range) || 260;
}

var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};
function speciesOf(migId){ return MIG_VISUAL[migId]||GENERIC_SPECIES; }
var ATLAS_CANVAS=null;
var GLYPHS=['mig','minor','thought','belief','question','project','experiment',
            'contradiction','person','reference','star'];
var CELL=128, ATLAS=6;   // 11 type forms + 15 MIG species, one texture
function buildAtlas(){
  var c=document.createElement('canvas'); c.width=c.height=CELL*ATLAS;
  var g=c.getContext('2d');
  GLYPHS.forEach(function(t,i){
    var cx=(i%ATLAS)*CELL+CELL/2, cy=Math.floor(i/ATLAS)*CELL+CELL/2, R=CELL/2;
    g.save(); g.translate(cx,cy);
    g.globalCompositeOperation='lighter';
    // every body shares a luminous core: at distance the mind reads as a sky
    function core(rad,peak){
      var gr=g.createRadialGradient(0,0,0,0,0,rad);
      gr.addColorStop(0,'rgba(255,255,255,'+peak+')');
      gr.addColorStop(0.22,'rgba(255,255,255,'+(peak*0.62)+')');
      gr.addColorStop(0.55,'rgba(255,255,255,'+(peak*0.16)+')');
      gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(0,0,rad,0,6.2832); g.fill();
    }
    // a few dendrites, tapering to nothing: neural, not medical
    function dendrites(count,len,seed,spread){
      for(var b=0;b<count;b++){
        var a=(b/count)*6.2832+seed, px=0, py=0, steps=5;
        for(var q=1;q<=steps;q++){
          var tt=q/steps, aa=a+Math.sin(seed+q*1.7)*spread*tt, rr=len*tt;
          var nx=Math.cos(aa)*rr, ny=Math.sin(aa)*rr;
          g.strokeStyle='rgba(255,255,255,'+(0.40*(1-tt)).toFixed(3)+')';
          g.lineWidth=Math.max(1,(R*0.055)*(1-tt)*2.2); g.lineCap='round';
          g.beginPath(); g.moveTo(px,py); g.lineTo(nx,ny); g.stroke();
          px=nx; py=ny;
        }
      }
    }
    if(t==='star'){
      /* A POINT OF LIGHT. Tight centre, fast falloff, one wide faint halo — the
         difference between a star and a glow is how quickly it stops. */
      var sg=g.createRadialGradient(0,0,0,0,0,R*0.22);
      sg.addColorStop(0,'rgba(255,255,255,1)');
      sg.addColorStop(0.38,'rgba(255,255,255,0.62)');
      sg.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=sg; g.beginPath(); g.arc(0,0,R*0.22,0,6.2832); g.fill();
      core(R*0.72,0.13);
    }
    else if(t==='mig'){ core(R*0.86,0.92); }   // generic anchor; real MIGs use their species
    else if(t==='minor'){ core(R*0.70,0.94); }                 // a major star, no branches
    else if(t==='thought'){ core(R*0.52,0.90); }                // a quiet point of light
    else if(t==='belief'){ core(R*0.60,0.97); }                 // steadier, denser core
    else if(t==='question'){ core(R*0.40,0.74);
      g.strokeStyle='rgba(255,255,255,0.26)'; g.lineWidth=R*0.03;
      g.beginPath(); g.arc(0,0,R*0.60,0,6.2832); g.stroke(); }   // unresolved: an open halo
    else if(t==='project'){ core(R*0.50,0.92);
      g.strokeStyle='rgba(255,255,255,0.42)'; g.lineWidth=R*0.045;
      g.beginPath(); g.ellipse(0,0,R*0.72,R*0.26,0.5,0,6.2832); g.stroke();
      g.strokeStyle='rgba(255,255,255,0.22)';
      g.beginPath(); g.ellipse(0,0,R*0.72,R*0.26,-0.5,0,6.2832); g.stroke(); }
    else if(t==='experiment'){ core(R*0.44,0.86);
      g.strokeStyle='rgba(255,255,255,0.22)'; g.lineWidth=R*0.028;
      g.beginPath(); g.arc(0,0,R*0.52,0.6,4.2); g.stroke(); }    // still being tested
    else if(t==='contradiction'){
      g.save(); g.translate(-R*0.24,0); core(R*0.44,0.90); g.restore();
      g.save(); g.translate( R*0.24,0); core(R*0.44,0.90); g.restore();
      g.strokeStyle='rgba(255,255,255,0.24)'; g.lineWidth=R*0.03;
      g.beginPath(); g.ellipse(0,0,R*0.60,R*0.30,0,0,6.2832); g.stroke(); }
    else if(t==='person'){ core(R*0.52,0.88);
      g.strokeStyle='rgba(255,255,255,0.20)'; g.lineWidth=R*0.03;
      g.beginPath(); g.arc(0,0,R*0.66,0,6.2832); g.stroke(); }
    else if(t==='reference'){ core(R*0.40,0.80);
      var gr2=g.createLinearGradient(-R*0.8,0,R*0.8,0);
      gr2.addColorStop(0,'rgba(255,255,255,0)');
      gr2.addColorStop(0.5,'rgba(255,255,255,0.42)');
      gr2.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr2; g.fillRect(-R*0.8,-R*0.045,R*1.6,R*0.09); }
    g.restore();
  });
  /* ── one celestial body per MIG ───────────────────────────────────────
     Every family is a core plus structure, so all fourteen still read as
     members of one cosmos at distance; the species only becomes legible on
     approach, which is the progressive disclosure the brief asks for. */
  Object.keys(MIG_VISUAL).forEach(function(mid,k){
    var idx=GLYPHS.length+k;
    var cx=(idx%ATLAS)*CELL+CELL/2, cy=Math.floor(idx/ATLAS)*CELL+CELL/2, R=CELL/2;
    var v=MIG_VISUAL[mid];
    g.save(); g.translate(cx,cy); g.globalCompositeOperation='lighter';
    function core2(rad,peak){
      var gr=g.createRadialGradient(0,0,0,0,0,rad);
      gr.addColorStop(0,'rgba(255,255,255,'+peak+')');
      gr.addColorStop(0.24,'rgba(255,255,255,'+(peak*0.60)+')');
      gr.addColorStop(0.58,'rgba(255,255,255,'+(peak*0.15)+')');
      gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(0,0,rad,0,6.2832); g.fill();
    }
    function branch(n,len,spread,seed,wob){
      for(var b=0;b<n;b++){
        var a=(b/n)*6.2832+seed, px=0, py=0, st=6;
        for(var q=1;q<=st;q++){
          var tt=q/st, aa=a+Math.sin(seed+q*1.9)*spread*tt+(wob?Math.sin(q*2.4+b)*0.18:0);
          var rr=len*R*tt, nx=Math.cos(aa)*rr, ny=Math.sin(aa)*rr;
          g.strokeStyle='rgba(255,255,255,'+(0.42*(1-tt)).toFixed(3)+')';
          g.lineWidth=Math.max(1,(R*0.05)*(1-tt)*2.4); g.lineCap='round';
          g.beginPath(); g.moveTo(px,py); g.lineTo(nx,ny); g.stroke();
          px=nx; py=ny;
        }
      }
    }
    function ring(rx,ry,rot,al){
      g.strokeStyle='rgba(255,255,255,'+al+')'; g.lineWidth=R*0.032;
      g.beginPath(); g.ellipse(0,0,rx,ry,rot,0,6.2832); g.stroke();
    }
    var f=v.family;
    if(f==='neural'){                       // PHILOSOPHY / HUMAN BEHAVIOUR
      /* a soma with a bright dense centre, then branches of uneven length
         that fork once and taper to nothing. Irregularity is what separates
         a neuron from an asterisk. */
      core2(R*0.30,0.99); core2(R*0.62,0.55);
      var NB=v.branches||8;
      for(var b3=0;b3<NB;b3++){
        var a3=(b3/NB)*6.2832+0.37;
        var len3=R*v.len*(0.55+0.45*Math.abs(Math.sin(b3*2.7)));   // uneven
        var px3=0, py3=0, st3=7;
        for(var q3=1;q3<=st3;q3++){
          var tt3=q3/st3;
          var aa3=a3+Math.sin(b3*1.9+q3*0.8)*v.spread*tt3;
          var rr3=len3*tt3, nx3=Math.cos(aa3)*rr3, ny3=Math.sin(aa3)*rr3;
          g.strokeStyle='rgba(255,255,255,'+(0.52*(1-tt3*0.85)).toFixed(3)+')';
          g.lineWidth=Math.max(0.8,(R*0.075)*(1-tt3)*2.0);
          g.lineCap='round';
          g.beginPath(); g.moveTo(px3,py3); g.lineTo(nx3,ny3); g.stroke();
          /* one fork, partway along — dendrites branch, spokes do not */
          if(q3===4){
            var fa=aa3+(b3%2?0.55:-0.55), fl=len3*0.30;
            g.strokeStyle='rgba(255,255,255,0.24)';
            g.lineWidth=Math.max(0.7,R*0.030);
            g.beginPath(); g.moveTo(nx3,ny3);
            g.lineTo(nx3+Math.cos(fa)*fl, ny3+Math.sin(fa)*fl); g.stroke();
          }
          px3=nx3; py3=ny3;
        }
      }
    } else if(f==='nascent'){               // PSYCHOLOGY: present, unwritten
      /* wide and faint, with no centre yet — it reads as potential rather than
         as an object, which is the honest thing to draw for a region whose
         thinking has not been filed here. */
      core2(R*0.96,0.13); core2(R*0.66,0.10); core2(R*0.34,0.09);
    } else if(f==='constellation'){         // OBSERVATION: a figure, not an icon
      /* Never rendered in the scene — OBSERVATION's MIG body is deliberately
         empty, because the constellation itself is the emblem. Drawn here only
         so the species stays unique and legible if anything ever asks for it. */
      var CP=[[-0.62,0.30],[-0.30,0.10],[0.02,-0.06],[0.30,-0.22],[0.56,0.02],[0.30,0.34]];
      g.strokeStyle='rgba(255,255,255,0.20)'; g.lineWidth=R*0.024;
      g.beginPath();
      CP.forEach(function(p,i){ i?g.lineTo(p[0]*R,p[1]*R):g.moveTo(p[0]*R,p[1]*R); });
      g.stroke();
      CP.forEach(function(p,i){ g.save(); g.translate(p[0]*R,p[1]*R);
        core2(R*(0.16-i*0.012),0.92); g.restore(); });
    } else if(f==='binary'){                 // LOVE: ONE radiant star.
      /* Drawing two dots here would be a picture of a binary. The pair has to
         be real geometry in the scene, so the glyph is a single smooth stellar
         body — no branches, which is what separates it from Philosophy's
         neural soma — and LOVE's signature is that it is the only world made
         of TWO of them. */
      core2(R*0.62,1.00); core2(R*0.92,0.26); core2(R*0.34,1.00);
      ring(R*0.74,R*0.74,0,0.10);
    } else if(f==='cluster'){               // FOOD: a dense nourishing micro-cluster
      var pts=[[0,0,0.62],[-0.34,-0.20,0.40],[0.32,-0.26,0.42],[-0.26,0.30,0.38],
               [0.30,0.28,0.36],[0.02,-0.44,0.30],[-0.46,0.06,0.26],[0.46,0.04,0.28]];
      pts.forEach(function(q){ g.save(); g.translate(q[0]*R,q[1]*R); core2(R*q[2]*0.7,0.80); g.restore(); });
    } else if(f==='assembly'){              // SOCIETY: many bodies, one gravity well
      core2(R*0.40,0.72);
      for(var q2=0;q2<7;q2++){ var a2=q2/7*6.2832;
        g.save(); g.translate(Math.cos(a2)*R*0.56,Math.sin(a2)*R*0.42); core2(R*0.20,0.70); g.restore(); }
      ring(R*0.62,R*0.46,0,0.20);
    } else if(f==='harmonic'){              // MUSIC: a bare oscillation, honestly sparse
      core2(R*0.40,0.86);
      for(var w=0;w<3;w++){
        g.strokeStyle='rgba(255,255,255,'+(0.26-w*0.07).toFixed(2)+')'; g.lineWidth=R*0.028;
        g.beginPath();
        for(var x2=-R*0.86;x2<=R*0.86;x2+=R*0.06)
          g.lineTo(x2, Math.sin(x2/R*3.4+w*1.1)*R*(0.16+w*0.07));
        g.stroke();
      }
    } else if(f==='sequence'){              // MOVIES: sequential lights receding
      for(var q3=0;q3<5;q3++){
        g.save(); g.translate((q3-2)*R*0.34, (q3-2)*R*0.12);
        core2(R*(0.44-q3*0.05),0.86-q3*0.12); g.restore();
      }
    } else if(f==='focus'){                 // OBSERVATION: one light through a lens
      core2(R*v.core,0.98); ring(R*0.58,R*0.58,0,0.30); ring(R*0.84,R*0.84,0,0.14);
      branch(v.branches,v.len,v.spread,0.4,false);
    } else if(f==='modular'){               // BUILDING: stacked, measured
      for(var q4=0;q4<4;q4++){ g.save(); g.translate(0,(q4-1.5)*R*0.30);
        core2(R*(0.34-q4*0.03),0.80); g.restore(); }
      ring(R*0.70,R*0.24,0,0.22);
    } else if(f==='artifact'){              // MY WORKS: engineered, constructed
      core2(R*v.core,0.95);
      ring(R*0.76,R*0.26,0.5,0.44); ring(R*0.76,R*0.26,-0.5,0.26);
      branch(v.branches,v.len,0,1.2,false);
    } else if(f==='orbital'){               // BUSINESS: a body with satellites
      core2(R*v.core,0.94);
      ring(R*0.62,R*0.32,0.2,0.30); ring(R*0.86,R*0.44,0.2,0.16);
      for(var q5=0;q5<3;q5++){ var a5=q5/3*6.2832+0.7;
        g.save(); g.translate(Math.cos(a5)*R*0.62,Math.sin(a5)*R*0.32); core2(R*0.16,0.80); g.restore(); }
    } else if(f==='lattice'){               // TECHNOLOGY: precise, connected
      core2(R*v.core,0.90); branch(v.branches,v.len,v.spread,0.0,false); ring(R*0.72,R*0.72,0,0.18);
    } else if(f==='growth'){                // LEARNING: complexity increasing outward
      core2(R*v.core,0.88); branch(v.branches,v.len,v.spread,2.1,true);
      ring(R*0.54,R*0.54,0,0.16); ring(R*0.84,R*0.84,0,0.09);
    } else if(f==='organic'){               // LIFE: expansive, growing
      core2(R*v.core,0.92); branch(v.branches,v.len,v.spread,1.4,true);
    } else {                                // anything without its own form
      core2(R*v.core,0.94); branch(v.branches,v.len,v.spread,0.6,false);
    }
    g.restore();
  });
  /* #atlas shows the raw sheet, so a glyph defect can be seen rather than
     inferred from what a 170px sprite happens to look like on screen */
  if(/(^|[#&])atlas/.test(location.hash)){
    c.style.cssText='position:fixed;left:20px;top:20px;z-index:99;background:#0e1620;'+
                    'width:640px;height:640px;image-rendering:pixelated';
    document.body.appendChild(c);
  }
  ATLAS_CANVAS=c;
  var tex=new THREE.CanvasTexture(c);
  /* NO MIPMAPS. A texture atlas without padding cannot be mipmapped: at the
     smaller mip levels a 640px sheet reduces to a few pixels and every cell
     bleeds into its neighbours, so one sprite renders fragments of several
     glyphs at once. That is what made every concept look like a cluster of
     dots rather than a single body. It is also cheaper. */
  tex.minFilter=THREE.LinearFilter; tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;
  /* CanvasTexture flips Y on upload by default, so v in [0,0.2] sampled the
     BOTTOM row of the sheet rather than the top: a concept asking for cell
     (1,0) was handed cell (1,4) — FOOD's eight-body cluster. That single line
     is why every concept rendered as a cluster of dots. With flipY off the
     row index means what it says, and gl_PointCoord.y is no longer inverted. */
  tex.flipY=false;
  return tex;
}
function glyphIndex(n){
  var i=GLYPHS.indexOf(n.t);
  return i<0 ? GLYPHS.indexOf('thought') : i;
}

/* ── 3. SCENE ─────────────────────────────────────────────────────────
   White-first. Depth is ATMOSPHERIC, not shadowed — the one principle the
   reference matrix produced that the old build could not express. Fog is
   the literal version of what Stripe fakes with a gradient mesh. */
/* DEEP SPACE. GROUND is the sky behind everything; FAR_TONE is what distance
   drains toward — on a dark ground that is DARKER, not lighter, which inverts
   the whole atmospheric-perspective model the scene was built on. */
var GROUND=new THREE.Color(0x05070f), FAR_TONE=new THREE.Color(0x0b1020);
var cv=document.getElementById('gl');
var renderer, scene, camera, glOK=true;
try{
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false,
    preserveDrawingBuffer:true,powerPreference:'high-performance'});
}catch(e){ glOK=false; }
if(!renderer||!renderer.getContext()) glOK=false;

var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var LITE=/(^|[#&])lite\b/.test(location.hash);

var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};
var BRAIN_CURVE_COUNT=0;
/* how far the mind has turned, and how it is being turned */
var MIND_YAW=0, MIND_PITCH=0, MIND_DRAG=false, MIND_HELD=0, MIND_LAST=0;
var MIND_DRIFT=0.026;                 // radians per second — slow enough to be weather
/* the declared lateral axis, turned by however far the visitor has turned it.
   Everything that frames or shades the mind reads THIS, so one value moves the
   camera, the depth cue and the framing together and they cannot disagree. */
function brainView(){
  var v=BRAIN_VIEW.clone();
  v.applyAxisAngle(new THREE.Vector3(0,1,0), MIND_YAW);
  var right=new THREE.Vector3().crossVectors(v,new THREE.Vector3(0,1,0)).normalize();
  v.applyAxisAngle(right, MIND_PITCH);
  return v.normalize();
}
/* the constellation's own vertices, filled by buildBrainCurves */
var BRAIN_STARS=[], BRAIN_CHAINS=[], starField=null;
var RENDERS=0;
/* eased so naming a region is a settle rather than a flicker */
var BRAIN_ASK=0, BRAIN_ASK_TO=0;
/* 1 on the threshold, 0 inside the mind. Drives both how loud the organ is
   and how far it is pushed out from behind the name. */
var WELCOME_DIM=1;
var LINE_WALK=null, RENDER_ONLY=[], GYRI_COUNT=0;
var BIN_KEYS=Object.keys(BINARY), STARB_INDEX={}, AXIS_INDEX={}, binPhase=0;
var prevCam=new THREE.Vector3(1e9,1e9,1e9);
/* ── THE DEEP FIELD ──────────────────────────────────────────────────
   Three layers split by spatial frequency, each painted or placed ONCE at
   boot. Nothing here is recomputed per frame: a procedural sky recalculated
   every frame is exactly the cost that makes a page unusable on a modest
   machine, and none of it moves. */
/* ---------- 1. GAS ---------- */
function makeGasTexture(){
  var W=1024,H=512;
  var c=document.createElement('canvas'); c.width=W; c.height=H;
  var g=c.getContext('2d');
  var seed=20260828;
  function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }

  /* the ground of space is not black. Pure black is what makes a starfield
     look cheap, because nothing out there is actually empty. */
  var base=g.createLinearGradient(0,0,0,H);
  base.addColorStop(0,'#070a16'); base.addColorStop(0.5,'#05070f');
  base.addColorStop(1,'#080b16');
  g.fillStyle=base; g.fillRect(0,0,W,H);

  var hues=[[64,86,170],[128,72,152],[52,124,140],[158,88,104],[80,110,190]];
  for(var i=0;i<44;i++){
    var x=rnd()*W, y=rnd()*H, r=80+rnd()*300;
    var h=hues[i%hues.length], a=0.045+rnd()*0.085;
    var grd=g.createRadialGradient(x,y,0,x,y,r);
    grd.addColorStop(0,'rgba('+h[0]+','+h[1]+','+h[2]+','+a.toFixed(3)+')');
    grd.addColorStop(0.5,'rgba('+h[0]+','+h[1]+','+h[2]+','+(a*0.45).toFixed(3)+')');
    grd.addColorStop(1,'rgba('+h[0]+','+h[1]+','+h[2]+',0)');
    g.fillStyle=grd; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill();
  }
  /* dark dust, so the gas has structure rather than being an even wash */
  for(var d=0;d<20;d++){
    var x2=rnd()*W, y2=H*0.5+(rnd()-0.5)*H*0.5, r2=40+rnd()*140;
    var dg=g.createRadialGradient(x2,y2,0,x2,y2,r2);
    dg.addColorStop(0,'rgba(3,4,10,0.40)'); dg.addColorStop(1,'rgba(3,4,10,0)');
    g.fillStyle=dg; g.beginPath(); g.arc(x2,y2,r2,0,6.2832); g.fill();
  }
  /* a fine dither, because smooth radial gradients on a stretched texture band
     into visible concentric rings and nothing in space has rings like that */
  var img=g.getImageData(0,0,W,H), D=img.data;
  for(var q=0;q<D.length;q+=4){
    /* hashed on the PIXEL, not on the byte offset. Hashing the linear index
       gives a value that repeats every row and tiles into a visible rectangular
       lattice across the whole sky — which is worse than the banding it was
       meant to remove. */
    var px=(q>>2)%W, py=(q>>2)/W|0;
    var hsh=(px*73856093)^(py*19349663);
    hsh=(hsh^(hsh>>13))*1274126177;
    var n=(((hsh^(hsh>>16))>>>0)%1000)/1000-0.5;
    D[q]  =Math.max(0,Math.min(255,D[q]  +n*8));
    D[q+1]=Math.max(0,Math.min(255,D[q+1]+n*8));
    D[q+2]=Math.max(0,Math.min(255,D[q+2]+n*8));
  }
  g.putImageData(img,0,0);
  var tex=new THREE.CanvasTexture(c);
  tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  return tex;
}
function buildGas(){
  var m=new THREE.Mesh(new THREE.SphereGeometry(2600,32,18),
    new THREE.MeshBasicMaterial({ map:makeGasTexture(), side:THREE.BackSide,
      depthWrite:false, fog:false }));
  m.rotation.y=2.1;
  m.renderOrder=-20;
  return m;
}

/* ---------- 3. DEEP-SKY OBJECTS ---------- */
function makeDeepSkyAtlas(){
  var S=256, c=document.createElement('canvas');
  c.width=S*2; c.height=S*2;
  var g=c.getContext('2d');
  function cell(ix,iy,draw){ g.save(); g.translate(ix*S+S/2, iy*S+S/2); draw(); g.restore(); }

  /* 0,0 — a spiral galaxy seen at a tilt */
  cell(0,0,function(){
    g.rotate(-0.5); g.scale(1,0.36);
    var gr=g.createRadialGradient(0,0,0,0,0,S*0.46);
    gr.addColorStop(0,'rgba(255,250,238,0.95)');
    gr.addColorStop(0.12,'rgba(226,222,244,0.55)');
    gr.addColorStop(0.45,'rgba(150,170,230,0.20)');
    gr.addColorStop(1,'rgba(150,170,230,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,0,S*0.46,0,6.2832); g.fill();
    g.strokeStyle='rgba(214,226,255,0.34)'; g.lineWidth=S*0.022; g.lineCap='round';
    for(var a=0;a<2;a++){
      g.beginPath();
      for(var t=0;t<=1;t+=0.03){
        var th=a*Math.PI+t*3.4, rr=S*0.06+t*S*0.38;
        var px=Math.cos(th)*rr, py=Math.sin(th)*rr;
        if(t===0) g.moveTo(px,py); else g.lineTo(px,py);
      }
      g.stroke();
    }
  });
  /* 1,0 — an elliptical galaxy, no arms */
  cell(1,0,function(){
    g.rotate(0.8); g.scale(1,0.58);
    var gr=g.createRadialGradient(0,0,0,0,0,S*0.42);
    gr.addColorStop(0,'rgba(255,246,228,0.92)');
    gr.addColorStop(0.2,'rgba(238,214,186,0.42)');
    gr.addColorStop(0.6,'rgba(220,180,150,0.14)');
    gr.addColorStop(1,'rgba(220,180,150,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,0,S*0.42,0,6.2832); g.fill();
  });
  /* 0,1 — a black hole: accretion glow, photon ring, and the dark disc */
  cell(0,1,function(){
    var ag=g.createRadialGradient(0,0,S*0.10,0,0,S*0.46);
    ag.addColorStop(0,'rgba(255,186,110,0.50)');
    ag.addColorStop(0.30,'rgba(255,140,80,0.20)');
    ag.addColorStop(1,'rgba(255,120,70,0)');
    g.fillStyle=ag; g.beginPath(); g.arc(0,0,S*0.46,0,6.2832); g.fill();
    g.save(); g.scale(1,0.20);
    g.strokeStyle='rgba(255,214,158,0.80)'; g.lineWidth=S*0.055;
    g.beginPath(); g.arc(0,0,S*0.26,0,6.2832); g.stroke();
    g.restore();
    g.strokeStyle='rgba(255,240,210,0.95)'; g.lineWidth=S*0.020;
    g.beginPath(); g.arc(0,0,S*0.105,0,6.2832); g.stroke();
    g.globalCompositeOperation='destination-out';
    g.fillStyle='#000'; g.beginPath(); g.arc(0,0,S*0.093,0,6.2832); g.fill();
    g.globalCompositeOperation='source-over';
  });
  /* 1,1 — a distant globular cluster */
  cell(1,1,function(){
    var gr=g.createRadialGradient(0,0,0,0,0,S*0.34);
    gr.addColorStop(0,'rgba(255,252,242,0.70)');
    gr.addColorStop(0.35,'rgba(226,232,250,0.18)');
    gr.addColorStop(1,'rgba(226,232,250,0)');
    g.fillStyle=gr; g.beginPath(); g.arc(0,0,S*0.34,0,6.2832); g.fill();
    var s2=7717;
    function r2(){ s2=(s2*1103515245+12345)&0x7fffffff; return s2/0x7fffffff; }
    for(var i=0;i<130;i++){
      var a=r2()*6.2832, rr=Math.pow(r2(),0.55)*S*0.30;
      g.fillStyle='rgba(255,250,240,'+(0.25+r2()*0.55).toFixed(2)+')';
      g.beginPath(); g.arc(Math.cos(a)*rr, Math.sin(a)*rr, S*0.006+r2()*S*0.006, 0, 6.2832); g.fill();
    }
  });
  var tex=new THREE.CanvasTexture(c);
  tex.minFilter=THREE.LinearFilter; tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false; tex.flipY=false;
  return tex;
}
/* where each one hangs, how big, and which cell it uses */
var DEEP_SKY=[
  { dir:[-0.72, 0.34,-0.60], size:168, cell:[0,0] },   // spiral, high and behind
  { dir:[ 0.64,-0.28, 0.72], size:124, cell:[1,0] },   // elliptical, low and in front
  { dir:[ 0.88, 0.46,-0.16], size:104, cell:[0,1] },   // the black hole
  { dir:[-0.34,-0.62, 0.70], size: 86, cell:[1,1] },   // a cluster, below
  { dir:[ 0.12, 0.80, 0.58], size: 72, cell:[1,0] },   // a small elliptical, above
  { dir:[-0.86,-0.10, 0.50], size: 62, cell:[1,1] },
  { dir:[ 0.30, 0.62,-0.72], size: 96, cell:[0,0] },   // a second spiral, behind and high
  { dir:[-0.20,-0.86,-0.46], size: 70, cell:[1,0] },   // one below the mind
  { dir:[ 0.94,-0.20,-0.28], size: 58, cell:[1,1] }
];
function buildDeepSky(){
  var g=new THREE.BufferGeometry(), pos=[], cel=[], siz=[];
  DEEP_SKY.forEach(function(o){
    var d=new THREE.Vector3(o.dir[0],o.dir[1],o.dir[2]).normalize().multiplyScalar(2050);
    pos.push(d.x,d.y,d.z); cel.push(o.cell[0],o.cell[1]); siz.push(o.size);
  });
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('cell',new THREE.Float32BufferAttribute(cel,2));
  g.setAttribute('psize',new THREE.Float32BufferAttribute(siz,1));
  var m=new THREE.ShaderMaterial({
    uniforms:{ atlas:{value:makeDeepSkyAtlas()} },
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:['attribute vec2 cell; attribute float psize; varying vec2 vCell;',
      'void main(){ vCell=cell; vec4 mv=modelViewMatrix*vec4(position,1.0);',
      ' gl_PointSize=psize;',
      ' gl_Position=projectionMatrix*mv; }'].join(String.fromCharCode(10)),
    fragmentShader:['uniform sampler2D atlas; varying vec2 vCell;',
      'void main(){ vec2 uv=(vCell+gl_PointCoord)*0.5;',
      ' vec4 t=texture2D(atlas,uv);',
      ' if(t.a<0.004) discard;',
      ' gl_FragColor=vec4(t.rgb,t.a); }'].join(String.fromCharCode(10))
  });
  var p=new THREE.Points(g,m);
  p.renderOrder=-15;
  return p;
}

if(glOK){
  scene=new THREE.Scene();
  scene.background=GROUND;
  scene.fog=new THREE.FogExp2(FAR_TONE.getHex(), 0.0008);
  scene.add(buildGas());
  scene.add(buildDeepSky());
  camera=new THREE.PerspectiveCamera(45, 1, 0.5, 2000);

  var atlas=buildAtlas();

  /* neurons — one Points cloud, one draw call for the whole mind */
  var placed=NODES.filter(function(n){ return n.pos; });
  nodeOrder=placed;
  /* render-only bodies occupy vertices AFTER every real node, so picking —
     which walks nodeOrder — can never reach them by construction */
  var TOTV=placed.length+COMPANIONS.length+CONST_BG.length;
  var NOCTR=new Float32Array(TOTV);
  var P=new Float32Array(TOTV*3), CELLA=new Float32Array(TOTV*2),
      SZ=new Float32Array(TOTV), COL=new Float32Array(TOTV*3),
      EMPH=new Float32Array(TOTV), REG=new Float32Array(TOTV),
      CAP=new Float32Array(TOTV);
  var CAP_DEFAULT=212.5;            // == maxPx * 1.25, the previous global cap
  var migIndex={}; MIGS.forEach(function(m,i){ migIndex[m.id]=i; });
  placed.forEach(function(n,i){
    nodeIndex[n.id]=i;
    P[i*3]=n.pos.x; P[i*3+1]=n.pos.y; P[i*3+2]=n.pos.z;
    var gi=glyphIndex(n);
    /* in a constellation every object is a star — the kind of object is carried
       by the label tier and the sheet, never by a pictogram among stars */
    if(n.star!==undefined){ var si=GLYPHS.indexOf('star'); if(si>=0) gi=si; }
    if(n.t==='mig'){
      var order=Object.keys(MIG_VISUAL).indexOf(n.id);
      if(order>=0) gi=GLYPHS.length+order;      // its species, not the generic anchor
    }
    CELLA[i*2]=gi%ATLAS; CELLA[i*2+1]=Math.floor(gi/ATLAS);
    var deg=degree[n.id]||0, xd=xdeg[n.id]||0;
    var weight=Math.min(1,(deg+xd*1.6)/9);                 // meaning, not taste
    SZ[i]= n.t==='mig' ? 150 : (n.t==='minor' ? 62+weight*38 : 44+weight*34);
    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.35;  // far, slow, and few
    /* A constellation star is sized by its REAL magnitude, so the sky keeps its
       own hierarchy. Legibility of the Minor IG names is solved by label tier
       and focus, never by inflating every star (DESIGN §6). */
    if(n.star!==undefined) SZ[i]=46+(4.2-n.starV)*22;
    var pal=paletteOf(n.mig);
    /* the object with no relationship inside its own region gets the one
       off-palette colour, because it is the thing that does not belong */
    var c=new THREE.Color(n.offAsterism&&pal.anomaly ? pal.anomaly
                        : (n.t==='mig'?pal.star:pal.body));
    COL[i*3]=c.r; COL[i*3+1]=c.g; COL[i*3+2]=c.b;
    EMPH[i]=n.t==='mig'?1.0:(0.62+Math.min(1,(degree[n.id]||0)/7)*0.34);
    REG[i]=(migIndex[n.mig]===undefined?-1:migIndex[n.mig]);
    CAP[i]=CAP_DEFAULT;
    /* A binary primary keeps the same emblem SIZE as every other MIG, so at
       universe range LOVE is exactly as findable as its neighbours — but it
       gets a much tighter cap, so on approach it stops growing and its
       companion separates from it instead of being swallowed. That reveal is
       the whole point: from far away LOVE is one warm light; up close it is
       unmistakably two. */
    /* OBSERVATION has no central body: inside its world the FIGURE is the
       emblem, and inventing a star at the middle of Ursa Major would be a
       fabrication — the Dipper has no such star.

       But that was applied unconditionally, so the region had nothing to find
       in the MIND either: fourteen regions showed an emblem and OBSERVATION
       showed empty space, which is precisely what it looked like. The
       suppression belongs to the WORLD, not to the menu. */
    NOCTR[i]=(n.t==='mig'&&CONSTELLATIONS[n.id])?1:0;
    if(n.star!==undefined) EMPH[i]=n.offAsterism?1.35:1.12;
    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=68; }
    else if(BINARY[n.mig]){ CAP[i]=50; }     // and never larger than its stars
    else if(n.star!==undefined){ CAP[i]=124; }   // room for real magnitude to show
  });
  /* THE SKY THE FIGURE WAS PICKED OUT OF. 53 measured stars of the same field.
     Render-only, exactly like a binary companion: appended after every real
     node, so picking — which walks nodeOrder — can never reach them. */
  CONST_BG.forEach(function(b,bi){
    var i=placed.length+COMPANIONS.length+bi;
    RENDER_ONLY.push({i:i, u:b.pos.clone(),
      b:(byId[b.mig]&&byId[b.mig].bPos)?byId[b.mig].bPos.clone():b.pos.clone()});
    P[i*3]=b.pos.x; P[i*3+1]=b.pos.y; P[i*3+2]=b.pos.z;
    var gi=GLYPHS.indexOf('star'); if(gi<0) gi=1;
    CELLA[i*2]=gi%ATLAS; CELLA[i*2+1]=Math.floor(gi/ATLAS);
    SZ[i]=13+Math.max(0,(6.0-b.vMag))*6.0;
    CAP[i]=27;                                   // never a body, always a backdrop
    var pb=paletteOf(b.mig), cb=new THREE.Color(pb.body);
    COL[i*3]=cb.r; COL[i*3+1]=cb.g; COL[i*3+2]=cb.b;
    EMPH[i]=0.60;                                // tertiary, and it must stay there
    REG[i]=(migIndex[b.mig]===undefined?-1:migIndex[b.mig]);   // hover reaches it
  });
  var starBIndex={};
  COMPANIONS.forEach(function(c,ci){
    var i=placed.length+ci;
    RENDER_ONLY.push({i:i, u:c.pos.clone(),
      b:(byId[c.mig]&&byId[c.mig].bPos)?byId[c.mig].bPos.clone():c.pos.clone()});
    starBIndex[c.mig]=i;
    P[i*3]=c.pos.x; P[i*3+1]=c.pos.y; P[i*3+2]=c.pos.z;
    var order=Object.keys(MIG_VISUAL).indexOf(c.mig);
    var gi=order>=0?GLYPHS.length+order:0;      // the SAME stellar form
    CELLA[i*2]=gi%ATLAS; CELLA[i*2+1]=Math.floor(gi/ATLAS);
    var b=BINARY[c.mig];
    SZ[i]=150/b.sizeRatio;                      // cube root of the mass ratio
    CAP[i]=68/b.sizeRatio;
    var pal=paletteOf(c.mig);
    var c2=new THREE.Color(pal.star2||pal.star);   // cooler star, redder
    COL[i*3]=c2.r; COL[i*3+1]=c2.g; COL[i*3+2]=c2.b;
    EMPH[i]=1.30;
    REG[i]=(migIndex[c.mig]===undefined?-1:migIndex[c.mig]);  // hover reaches it
  });
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(P,3));
  geo.setAttribute('cell',new THREE.BufferAttribute(CELLA,2));
  geo.setAttribute('size',new THREE.BufferAttribute(SZ,1));
  geo.setAttribute('tint',new THREE.BufferAttribute(COL,3));
  geo.setAttribute('emph',new THREE.BufferAttribute(EMPH,1));
  geo.setAttribute('region',new THREE.BufferAttribute(REG,1));
  geo.setAttribute('capPx',new THREE.BufferAttribute(CAP,1));
  var ISMIG=new Float32Array(TOTV);
  placed.forEach(function(nd,i){ ISMIG[i]=(nd.t==='mig')?1:0; });
  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));
  /* each vertex knows which object it is, so ONE uniform can name any of them */
  var NIDX=new Float32Array(TOTV);
  for(var q9=0;q9<TOTV;q9++) NIDX[q9]=(q9<placed.length)?q9:-1;
  geo.setAttribute('nodeIdx',new THREE.BufferAttribute(NIDX,1));
  /* the brain cell: regions take the plain star, everything else keeps its own */
  var CELLB=new Float32Array(TOTV*2);
  var starCell=GLYPHS.indexOf('star'); if(starCell<0) starCell=1;
  for(var cb=0;cb<TOTV;cb++){
    if(ISMIG[cb]>0.5){ CELLB[cb*2]=starCell%ATLAS; CELLB[cb*2+1]=Math.floor(starCell/ATLAS); }
    else { CELLB[cb*2]=CELLA[cb*2]; CELLB[cb*2+1]=CELLA[cb*2+1]; }
  }
  geo.setAttribute('cellB',new THREE.BufferAttribute(CELLB,2));
  /* 1 for a world whose figure IS its emblem: no centre once that world opens,
     and one in the mind, where the region has to be findable */
  geo.setAttribute('noCentre',new THREE.BufferAttribute(NOCTR,1));

  var mat=new THREE.ShaderMaterial({
    uniforms:{ atlas:{value:atlas}, fogColor:{value:FAR_TONE},
               fogDensity:{value:0.0008}, cells:{value:ATLAS}, minPx:{value:9.0}, maxPx:{value:170.0},
               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0},
               hoverNode:{value:-1.0}, mindOpen:{value:0.0}, brainMid:{value:600.0} },
    transparent:true, depthWrite:false,
    vertexShader:[
      'uniform float minPx; uniform float maxPx;',
      'uniform float focusRegion; uniform float hoverRegion; uniform float mindOpen;',
      'uniform float hoverNode; attribute float nodeIdx;',
      'attribute float isMig; attribute float noCentre;',
      'attribute vec2 cell; attribute vec2 cellB; attribute float size; attribute vec3 tint; attribute float emph;',
      'attribute float region; attribute float capPx;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'uniform float brainMid; varying float vBrain; varying float vMig;',
      'void main(){',
      /* a region wears its world's species only once the mind is open; before
         that every region is drawn the same way, because it is still one organ */
      '  vCell = (mindOpen < 0.5) ? cellB : cell;',
      /* IN THE MIND, A REGION IS A STAR.

         Its declared colour is the colour of its WORLD — TRAPPIST-1 indigo,
         Kepler-16 amber, Ursa Major verdigris — and those were chosen as ink
         on a pale page, where luminance was never the point. Used unchanged
         against a sky they cap the emblem far below the constellation stars
         around it: Ursa Major's 0x1d4f4a cannot exceed a luminance of 64
         however bright the glyph is drawn, so OBSERVATION read as empty space.

         While the mind is closed the emblem is lifted toward white, which
         keeps the hue and gives it a star's brightness. Once a world opens the
         tint returns to exactly its declared value, so every approved palette
         is untouched where it actually matters. */
      /* Lifted MULTIPLICATIVELY, not mixed toward white. Mixing washes the
         hue out, and every region then reads as the same pale dot — which
         throws away the one thing that makes a world identifiable at a
         glance. Scaling keeps the colour and only raises its luminance, so
         Kepler-16 stays amber and Ursa Major stays verdigris while both
         become bright enough to find. */
      '  vTint=min(tint*mix(3.4, 1.0, mindOpen), vec3(1.0));',
      // inside a world everything elsewhere recedes but never vanishes: the
      // mind must stay felt while one region of it is being read
      '  float here = (focusRegion<0.0 || abs(region-focusRegion)<0.5) ? 1.0 : 0.13;',
      // hovering a MIG in the menu identifies its world: that world lifts,
      // the rest step back just enough to make the answer unambiguous
      '  if(hoverRegion>=0.0){',
      /* the gap has to survive being seen through a lit surface, so it is a
         gap in BOTH directions rather than a brightening alone */
      '    here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;',
      '  }',
      /* before the mind opens only the regions exist; everything they own is
         folded inside them and must not be drawn */
      /* what a region holds is visible as TISSUE before the mind opens —
         enough to give the brain a surface, never enough to compete with the
         regions themselves */
      '  if(isMig < 0.5) here *= (0.42 + 0.58*mindOpen);',
      /* pointing at one idea by name lifts that idea and lets the rest settle
         back — never a flash across the whole environment */
      '  if(hoverNode >= 0.0){',
      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 0.44;',
      '  }',
      /* a world whose figure is its own emblem loses its centre as that world
         opens, and keeps it in the mind where it must be found */
      '  here *= (1.0 - noCentre*mindOpen);',
      '  vEmph=clamp(emph*here,0.0,1.6);',
      '  vMig=isMig;',
      '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
      '  float persp=size*(300.0/max(1.0,-mv.z));',
      /* the floor is the whole starfield: without it distance erases the mind */
      /* the emblem establishes identity; it never becomes the environment.
         Uncapped it swallowed the concepts it was meant to introduce. */
      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.95 : 1.0;',
      '  if(hoverNode >= 0.0 && abs(nodeIdx-hoverNode)<0.5) lift *= 1.34;',
      '  if(isMig < 0.5) lift *= (0.46 + 0.54*mindOpen);',
      /* the cap is per-body, not global: a binary primary must stop growing
         before it swallows its own companion */
      '  gl_PointSize=clamp(persp*lift,minPx,min(capPx,maxPx*1.25));',
      '  vFog=-mv.z;',
      /* -1 at the back of the organ, +1 at the front. Only meaningful while
         the mind is folded; once it opens, the universe supplies its own depth. */
      '  vBrain=clamp((brainMid-(-mv.z))/210.0,-1.0,1.0);',
      '  gl_Position=projectionMatrix*mv;',
      '}'].join('\n'),
    fragmentShader:[
      'uniform sampler2D atlas; uniform vec3 fogColor; uniform float fogDensity; uniform float cells;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'uniform float mindOpen; varying float vBrain; varying float vMig;',
      'void main(){',
      '  vec2 uv=(vCell+gl_PointCoord)/cells;',
      '  float a=texture2D(atlas,uv).a*vEmph;',
      '  if(a<0.02) discard;',
      /* atmospheric perspective: distance drains the ink toward the far tone.
         This is the depth medium — not shadow. */
      /* A REGION IS A TARGET, NOT ATMOSPHERE.

         Distance drains everything else toward the far tone, and inside the
         organ the far hemisphere recedes — both correct for the mind's
         CONTENTS. Applied to the regions themselves they were wrong: the
         fifteen things the whole menu exists to point at were rendering
         dimmer than the constellation stars beside them, so the centre of
         PHILOSOPHY and OBSERVATION read as empty space and clicking one
         looked like flying into nothing.

         A region is exempt from both. It is what you are being shown. */
      '  float f=1.0-exp(-fogDensity*fogDensity*vFog*vFog);',
      '  f *= (1.0 - vMig*0.85);',
      '  vec3 col=mix(vTint,fogColor,clamp(f,0.0,1.0));',
      '  float out_a=a*(1.0-clamp(f*0.55,0.0,0.88));',
      /* inside the organ, depth is the whole hierarchy: the near hemisphere
         is legible, the far one is present but recessive. Without this the
         two hemispheres would read as one flat sheet of labels. */
      '  float d=clamp(vBrain*0.5+0.5,0.0,1.0);',
      '  float bd=mix(0.62,1.0,pow(d,1.10));',
      '  bd = mix(bd, 1.0, vMig);',
      '  out_a*=mix(bd,1.0,mindOpen);',
      '  col=mix(mix(fogColor,col,mix(0.55,1.0,bd)),col,mindOpen);',
      '  if(out_a<0.004) discard;',
      '  gl_FragColor=vec4(col,out_a);',
      '}'].join('\n')
  });
  pts=new THREE.Points(geo,mat);
  /* AFTER the organ. A label the tissue swallows is not a menu. */
  pts.renderOrder=3;
  STARB_INDEX=starBIndex;
  scene.add(pts);

  /* ── relationships as TRAJECTORIES ─────────────────────────────────
     Every segment is a real edge. Alpha ramps from source to target so the
     line states its own direction without an arrowhead — direction is
     load-bearing (the V0.2 bug) and must survive into 3D. */
  /* 41 bright arcs across a sphere WAS the line-noise. Rank the cross-region
     edges by real significance — endpoint degree, cross-reach, whether the
     edge carries a contradiction — and let only the strongest stay bright at
     universe range. Nothing is deleted from the graph. */
  LINKS.forEach(function(l){
    l.sig=(degree[l.a]+degree[l.b])+(xdeg[l.a]+xdeg[l.b])*1.5+(l.verb==='tension'?6:0);
  });
  var strongest=LINKS.filter(function(l){ return byId[l.a].mig!==byId[l.b].mig; })
                     .sort(function(a,b){ return b.sig-a.sig; }).slice(0,8);
  strongest.forEach(function(l){ l.keep=true; });
  var migIndex2={}; MIGS.forEach(function(m,i){ migIndex2[m.id]=i; });
  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[], homes=[];
  /* the same walk is used to build the buffer and to restretch it while the
     brain opens, so the structure can never drift from the nodes */
  LINE_WALK=function(write){
    var k=0;
    LINKS.forEach(function(l){
      var A=byId[l.a], B=byId[l.b];
      if(!A.pos||!B.pos) return;
      var cross=(A.mig!==B.mig);
      var onShell=(mindOpen<0.999 && A.bPos && B.bPos);
      var dA=onShell?A.bPos.clone().normalize():null;
      var dB=onShell?B.bPos.clone().normalize():null;
      for(var s=0;s<SEGS;s++){
        var t0=s/SEGS, t1=(s+1)/SEGS;
        [t0,t1].forEach(function(t){
          var p=new THREE.Vector3().lerpVectors(A.pos,B.pos,t);
          if(cross){
            var bow=Math.sin(t*Math.PI)*A.pos.distanceTo(B.pos)*(0.04+0.10*mindOpen);
            p.add(new THREE.Vector3().addVectors(A.pos,B.pos).normalize().multiplyScalar(bow));
          }
          if(onShell){
            /* a curve lying ON the brain, not a chord through it */
            var dm=dA.clone().lerp(dB,t);
            if(dm.lengthSq()>1e-9){
              var surf=brainShell(dm.normalize());
              p.lerpVectors(surf,p,mindOpen);
            }
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
        verts.push(p.x,p.y,p.z);
        /* In a constellation world the internal relationships ARE the figure,
           so they carry the world's own colour and enough presence to read as
           a drawn line — while staying below the stars they join. No
           conventional asterism is ever added: these are graph edges. */
        var kon2=(!cross&&CONSTELLATIONS[A.mig])?CONSTELLATIONS[A.mig]:null;
        var c=kon2?new THREE.Color(paletteOf(A.mig).orbit)
                 :(cross?new THREE.Color(0x2b6cb0):new THREE.Color(0x8c99a6));
        cols.push(c.r,c.g,c.b);
        alphas.push((kon2?0.46:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));
        kinds.push((cross&&l.keep)?1:0);
        /* WORLD-LOCAL vs GLOBAL. An internal relationship belongs to exactly
           one world and is judged by the camera's distance to THAT world.
           A cross-MIG arc belongs to no single world, so it keeps the global
           rule. -1 means global. */
        homes.push(cross ? -1 : (migIndex2[A.mig]===undefined?-1:migIndex2[A.mig]));
      });
    }
  });
  /* THE FOLDS — render-only, kind 2, appended to the same buffer so they cost
     no extra draw call. Declared here and nowhere else. */
  GYRI_COUNT=0;
  (function(){
    var gc=new THREE.Color(0x39465c), gcInk=new THREE.Color(0x1e2836);
    function emit(pl, w, contour){
      for(var i=0;i<pl.length-1;i++){
        [pl[i],pl[i+1]].forEach(function(p){
          verts.push(p.x,p.y,p.z);
          var cc=contour?gcInk:gc;
          cols.push(cc.r,cc.g,cc.b);
          alphas.push(w);               // the hierarchy lives here
          kinds.push(contour?3:2);      // 3 = contour, never depth-faded
          homes.push(-1);
          GYRI_COUNT++;
        });
      }
    }
    /* THE BRAIN, as a constellation.

       Straight segments between stars — the Star Gazer idiom — luminous on a
       dark sky rather than inked on a pale one. kind 3 is the class that is
       never depth-faded by the old contour rule; the per-vertex depth cue
       below does that job properly instead, because a constellation with no
       near/far difference collapses into a flat cage from every angle. */
    var LINE_NEAR=new THREE.Color(0x8fb2e4), LINE_FAR=new THREE.Color(0x2e3f63);
    var phoneLine=window.innerWidth<768;
    BRAIN_CURVE_COUNT=0; GYRI_COUNT=0;
    buildBrainCurves(BRAIN_VIEW, phoneLine?0.5:1).forEach(function(c){
      BRAIN_CURVE_COUNT++;
      for(var i=0;i<c.pts.length-1;i++){
        [c.pts[i],c.pts[i+1]].forEach(function(p){
          verts.push(p.x,p.y,p.z);
          /* Depth is NOT baked here. It is computed against the LIVE camera
             in the shader, because the mind turns: a near/far split frozen at
             build time keeps pointing wherever the camera happened to start,
             and the figure falls apart the moment it rotates. */
          cols.push(LINE_NEAR.r,LINE_NEAR.g,LINE_NEAR.b);
          alphas.push(0.86);
          kinds.push(3);
          homes.push(-1);
          GYRI_COUNT++;
        });
      }
    });
  })();
  var lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(verts),3));
  lg.setAttribute('tint',new THREE.BufferAttribute(new Float32Array(cols),3));
  lg.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(alphas),1));
  lg.setAttribute('kind',new THREE.BufferAttribute(new Float32Array(kinds),1));
  lg.setAttribute('home',new THREE.BufferAttribute(new Float32Array(homes),1));
  var lm=new THREE.ShaderMaterial({
    uniforms:{ fogColor:{value:FAR_TONE}, fogDensity:{value:0.0008},
               globalMix:{value:0.0},                 // camera -> origin, for cross-MIG arcs
               focusRegion:{value:-1.0}, focusMix:{value:0.0},   // the world being visited
               hoverRegion:{value:-1.0}, hoverMix:{value:0.0},   // the world being pointed at
               mindOpen:{value:0.0}, brainMid:{value:600.0},
               brainDim:{value:1.0}, brainAsk:{value:0.0} },
    transparent:true, depthWrite:false,
    vertexShader:['attribute vec3 tint; attribute float alpha; attribute float kind;',
      'uniform float brainDim;',
      'attribute float home;',
      'uniform float globalMix; uniform float focusRegion; uniform float focusMix;',
      'uniform float hoverRegion; uniform float hoverMix; uniform float mindOpen;',
      'uniform float brainMid;',
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
      '  float a=alpha*mix(lm,1.0,min(kind,1.0));',
      /* the folds are the brain's surface: they exist only while it is closed,
         and the far hemisphere falls back so the two do not read as a tangle */
      /* contour is never depth-faded: it LIVES at mid depth, so fading by depth
         erases the one line that states the organ */
      /* THE CONSTELLATION. Its near half is legible and its far half a
         whisper, which is the only thing that stops a wireframe reading as a
         flat cage from every angle. Measured against the LIVE camera. */
      '  if(kind > 2.5){',
      '    float dz = -(modelViewMatrix*vec4(position,1.0)).z;',
      '    float nr = clamp((brainMid - dz)/210.0, -1.0, 1.0)*0.5+0.5;',
      '    nr = pow(clamp(nr,0.0,1.0), 1.5);',
      '    a = alpha * (1.0 - mindOpen) * (0.07 + 0.93*nr) * (1.0 - brainDim*0.42);',
      '  } else if(kind > 1.5){',
      '    float depth = clamp((brainMid - (-(modelViewMatrix*vec4(position,1.0)).z))/220.0, -1.0, 1.0);',
      '    a = alpha * (1.0 - mindOpen) * pow(clamp(depth*0.5+0.5,0.0,1.0), 3.0);',
      '  }',
      /* while the mind is closed the cross-region arcs are the brain's drawing,
         not background detail */
      /* in the brain every cross-region relationship carries the SAME modest
         weight, so they read as internal structure rather than as highlights.
         Multiplying instead saturated the eight strongest into bright chords. */
      /* folds also carry home=-1, so this must not reach them — it ran after
         the fold rule and was overwriting it */
      /* §10 — inside the brain the relationships are the FAINTEST thing in
         the drawing. At 0.055 the cross-region arcs read as a web laid over
         the anatomy and the graph became the subject again, which is the
         failure this redesign exists to undo. */
      '  if(home < -0.5 && kind < 1.5) a = mix(a, 0.024, 1.0-mindOpen);',
      '  vA=a; vec4 mv=modelViewMatrix*vec4(position,1.0);',
      ' vFog=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\n'),
    fragmentShader:['uniform vec3 fogColor; uniform float fogDensity;',
      'varying vec3 vT; varying float vA; varying float vFog;',
      'void main(){ float f=1.0-exp(-fogDensity*fogDensity*vFog*vFog);',
      ' gl_FragColor=vec4(mix(vT,fogColor,clamp(f,0.0,1.0)), vA*(1.0-clamp(f*0.6,0.0,0.9))); }'].join('\n')
  });
  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);

  /* ── THE STARS ──────────────────────────────────────────────────────
     The sky's and the mind's, in one buffer. A star is a point with a soft
     core, not a textured sprite: procedural costs nothing and stays sharp at
     every size, and the whole field is a single draw call. */
  (function(){
    var sp=[], st=[], sm=[], sb=[];
    /* the sky: a magnitude distribution rather than a sprinkle, gathered
       toward a galactic band, at a spread of distances so it has parallax */
    var phoneSky=window.innerWidth<768;
    var SKYN=phoneSky?1500:2600;
    for(var i=0;i<SKYN;i++){
      var y=1-2*(i+0.5)/SKYN, rr=Math.sqrt(Math.max(0,1-y*y)), th=i*2.399963;
      var d=new THREE.Vector3(rr*Math.cos(th), y, rr*Math.sin(th));
      var band=Math.exp(-Math.pow(y/0.55,2));
      if(((i*29)%1000)/1000 > 0.34+0.66*band) continue;
      var R=1000+((i*137)%1400);
      sp.push(d.x*R,d.y*R,d.z*R);
      var mg=((i*7919)%1000)/1000, w=0.30+mg*mg*mg*0.70;
      var t2=((i*104729)%1000)/1000, col;
      if(t2>0.88)      col=[1.00,0.86,0.72];
      else if(t2>0.74) col=[1.00,0.96,0.88];
      else if(t2>0.32) col=[0.91,0.94,0.99];
      else             col=[0.78,0.86,1.00];
      st.push(col[0]*w,col[1]*w,col[2]*w);
      sm.push(0.34+mg*mg*1.30);
      sb.push(0.0);
    }
    /* the mind: the constellation's vertices, unequal in magnitude the way
       real stars in a figure are */
    BRAIN_STARS.forEach(function(p,i){
      sp.push(p.x,p.y,p.z);
      st.push(0.80,0.88,1.00);
      sm.push(0.66+((i*17)%23)/23*0.78);
      sb.push(1.0);
    });
    var g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
    g.setAttribute('tint',new THREE.Float32BufferAttribute(st,3));
    g.setAttribute('mag',new THREE.Float32BufferAttribute(sm,1));
    g.setAttribute('isBrain',new THREE.Float32BufferAttribute(sb,1));
    starField=new THREE.Points(g,new THREE.ShaderMaterial({
      uniforms:{ mindOpen:{value:0.0}, dim:{value:1.0}, mid:{value:600.0} },
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:['attribute vec3 tint; attribute float mag; attribute float isBrain;',
        'uniform float mindOpen; uniform float dim; uniform float mid;',
        'varying vec3 vC; varying float vA;',
        'void main(){ vC=tint;',
        /* the figure's stars go with the figure; the sky stays */
        '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
        /* near/far, measured live so the figure survives being turned */
        '  float nr = clamp((mid - (-mv.z))/210.0, -1.0, 1.0)*0.5+0.5;',
        '  nr = pow(clamp(nr,0.0,1.0), 1.5);',
        '  float depth = mix(1.0, 0.16+0.84*nr, isBrain);',
        '  vA = mix(1.0, (1.0-mindOpen)*(1.0-dim*0.55), isBrain)*depth;',
        '  float s = mix(19.0, 23.0, isBrain);',
        '  gl_PointSize=s*mag*(300.0/max(1.0,-mv.z))*mix(1.0,0.55+0.45*nr,isBrain);',
        '  gl_Position=projectionMatrix*mv; }'].join(String.fromCharCode(10)),
      fragmentShader:['varying vec3 vC; varying float vA;',
        'void main(){ float d=length(gl_PointCoord-vec2(0.5));',
        '  if(d>0.5) discard;',
        '  float a=pow(1.0-d*2.0,2.2)*vA;',
        '  if(a<0.004) discard;',
        '  gl_FragColor=vec4(vC*1.30,a); }'].join(String.fromCharCode(10))
    }));
    starField.renderOrder=-5;
    starField.frustumCulled=false;
    scene.add(starField);
  })();

  /* The organ is not an object in the scene any more. It is the curves above,
     inside the line buffer that was already being drawn. */

  /* ORBIT PATHS. Thin, atmospheric, and batched into ONE geometry so seven
     rings cost one draw call. They must register as structure without
     becoming the subject — an orbit drawn brightly is a dashboard ring. */
  var ov=[], oa=[], oc=[];
  var _oc=new THREE.Color();
  function push2(pt,al,hex){ ov.push(pt.x,pt.y,pt.z); oa.push(al);
    _oc.setHex(hex); oc.push(_oc.r,_oc.g,_oc.b); }
  Object.keys(ORBITS).forEach(function(mid){
    var centre=centreOf(mid), seen={};
    ORBITS[mid].forEach(function(sl){
      if(seen[sl.r]) return; seen[sl.r]=1;
      var STEP=110, incl=0.02;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var th=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(centre, localOrbit(sl.r,th,incl));
          var al=0.16-Math.min(0.09,sl.r*0.0009);     // outer rings quieter
          if(BINARY[mid]) al*=1.55;   // distance-compensated; the rings still
                                      // sit under the pair in the hierarchy
          /* Philosophy keeps the exact tint it shipped with; only a world that
             declares its own takes it, so this stays a pure addition */
          push2(pt, al, BINARY[mid]?paletteOf(mid).orbit:0x2b4f86);
        });
      }
    });
  });
  /* THE TWO STELLAR ORBITS, and the middle nothing can hold.
     These are what make the world legible as circumbinary without a word of
     explanation: two ellipses about one empty point, then a dashed boundary,
     then a wide gap, and only then the first planetary path. */
  Object.keys(BINARY).forEach(function(mid){
    var b=BINARY[mid]; if(!b.centre) return;
    var pal=paletteOf(mid);
    [0,1].forEach(function(si){
      var STEP=104;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var ph=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(b.centre, binaryOffset(b,si,ph));
          push2(pt, si?0.88:1.00, si?(pal.star2||pal.star):pal.star);
        });
      }
    });
    /* THE BARYCENTRE. Two stars orbit a point that contains nothing. Marking it
       is what turns two lights into one system: it is the thing they share. */
    var CR=b.aBin*0.10;
    [0, Math.PI, 1.5708, -1.5708].forEach(function(a0){
      push2(b.centre.clone(), 0.80, pal.accent);
      push2(new THREE.Vector3().addVectors(b.centre, localOrbit(CR,a0,0)), 0.05, pal.accent);
    });
    /* dashed, so it can never be mistaken for an orbit: inside this radius no
       stable path exists around a pair of stars (Holman & Wiegert 1999) */
    var S2=132;
    for(var q2=0;q2<S2;q2+=3){
      [q2,q2+1].forEach(function(w){
        var th=(w/S2)*6.2832;
        push2(new THREE.Vector3().addVectors(b.centre, localOrbit(b.stability,th,0)),
              0.30, paletteOf(mid).body);
      });
    }
  });
  /* THE LINE OF CENTRES. A and B are always diametrically opposite through the
     barycentre, so one axis through all three states the whole relationship
     without a word: these two are bound, and what they turn around is empty.
     Kept last in the buffer so travel can move it with the stars. */
  var AXIS_OFF={};
  Object.keys(BINARY).forEach(function(mid){
    var b=BINARY[mid]; if(!b.centre) return;
    var A=byId[mid], iB=STARB_INDEX[mid];
    if(!A||!A.pos||iB===undefined) return;
    AXIS_OFF[mid]=ov.length/3;
    var pB=new THREE.Vector3().addVectors(b.centre, binaryOffset(b,1,b.phase));
    var pal2=paletteOf(mid);
    push2(A.pos.clone(), 0.62, pal2.star);
    push2(b.centre.clone(), 0.52, pal2.accent);
    push2(b.centre.clone(), 0.52, pal2.accent);
    push2(pB, 0.62, pal2.star2||pal2.star);
  });
  AXIS_INDEX=AXIS_OFF;
  if(ov.length){
    var og=new THREE.BufferGeometry();
    og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ov),3));
    og.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(oa),1));
    og.setAttribute('otint',new THREE.BufferAttribute(new Float32Array(oc),3));
    var om=new THREE.ShaderMaterial({
      uniforms:{ near:{value:1.0}, mindOpen:{value:0.0},
                 hoverOwn:{value:0.0} },
      transparent:true, depthWrite:false,
      vertexShader:['attribute float alpha; attribute vec3 otint;',
        'varying float vA; varying float vD; varying vec3 vT;',
        'void main(){ vA=alpha; vT=otint; vec4 mv=modelViewMatrix*vec4(position,1.0);',
        ' vD=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\n'),
      fragmentShader:['uniform float near; uniform float hoverOwn; uniform float mindOpen;',
        'varying float vA; varying float vD; varying vec3 vT;',
        /* the paths only exist when you are close enough for them to mean
           something; from the universe they would be noise */
        'void main(){ float vis=clamp((260.0-vD)/170.0,0.0,1.0);',
        ' float a=vA*vis*near*mindOpen*(1.0+hoverOwn*1.9); if(a<0.004) discard;',
        ' gl_FragColor=vec4(vT,a); }'].join('\n')
    });
    orbitLines=new THREE.LineSegments(og,om);
    scene.add(orbitLines);
  }
  setMindOpen(0);        // the scene exists at universe positions; fold it
}

/* ── 4. CAMERA AS NAVIGATION ──────────────────────────────────────────
   Never teleport. Every state change is travel, and BACK reverses the same
   route, so spatial memory is preserved (DESIGN-V02 §10). */
function setMindOpen(v){
  mindOpen=Math.max(0,Math.min(1,v));
  applyMorph();
  if(!glOK||!pts) return;
  var pa=pts.geometry.attributes.position;
  nodeOrder.forEach(function(nd,i){
    if(!nd.pos) return;
    pa.array[i*3]=nd.pos.x; pa.array[i*3+1]=nd.pos.y; pa.array[i*3+2]=nd.pos.z;
  });
  /* companions and the constellation sky belong to the universe too */
  RENDER_ONLY.forEach(function(o){
    var _mp=new THREE.Vector3().lerpVectors(o.b,o.u,mindOpen);
    pa.array[o.i*3]=_mp.x; pa.array[o.i*3+1]=_mp.y; pa.array[o.i*3+2]=_mp.z;
  });
  pa.needsUpdate=true;
  pts.material.uniforms.mindOpen.value=mindOpen;
  pts.material.uniforms.brainMid.value=camera.position.length();
  if(orbitLines) orbitLines.material.uniforms.mindOpen.value=mindOpen;
  if(lineSeg && LINE_WALK){
    /* the folds are static and live AFTER the relationship vertices, so the
       walk can never reach them */
    var la=lineSeg.geometry.attributes.position;
    LINE_WALK(function(k,p){ la.array[k*3]=p.x; la.array[k*3+1]=p.y; la.array[k*3+2]=p.z; });
    la.needsUpdate=true;
  }
}

var camPos=new THREE.Vector3(0,60,720), camAim=new THREE.Vector3(0,0,0);
var wantPos=camPos.clone(), wantAim=camAim.clone();
/* the camera opens on the brain, not on the universe */
(function(){ var bf=frameFor('universe');
  camPos.copy(bf.p); camAim.copy(bf.a); wantPos.copy(bf.p); wantAim.copy(bf.a); })();
var state={mode:'universe', focus:null, region:null};
var history=[];

/* what does this world actually occupy? Measured from its own objects, never
   declared per MIG. */
function worldBounds(migId){
  var host=byId[migId];
  var c=(BINARY[migId]&&BINARY[migId].centre) || (host&&(host.uPos||host.pos));
  if(!c) return null;
  var maxR=0;
  /* PRINCIPAL bodies only. Writings sit outside the orbits by design and were
     never part of any world's intended frame. */
  (owned[migId]||[]).forEach(function(oid){
    var nd=byId[oid];
    /* a constellation's writings ARE part of its figure, so they are
       principal there; elsewhere writings sit outside the orbits by design */
    if(!nd || (nd.t!=='minor' && nd.star===undefined)) return;
    var p=nd.uPos||nd.pos;
    if(p) maxR=Math.max(maxR, p.distanceTo(c));
  });
  if(host&&(host.uPos||host.pos)) maxR=Math.max(maxR,(host.uPos||host.pos).distanceTo(c));
  return { centre:c, radius:maxR };
}
/* the distance at which those bounds fit the readable area. The sheet covers
   the left of a desktop and the lower part of a phone, so the safe area is not
   the viewport. */
/* refWidth asks the question the APPROVED compositions were tuned against:
   how far back would this world need to stand if the panel took the share of
   the frame it takes on a wide desktop? The difference between that and the
   real answer is what the panel costs beyond what was already allowed for. */
function fitDistance(migId, whole, refWidth){
  var b=worldBounds(migId);
  if(!b||!b.radius||!camera) return 0;
  /* NO VIEWPORT, NO FIT.

     If the canvas has no size — a tab that has not been laid out, a resize
     race, a hidden pane — camera.aspect is zero or NaN and this divides a
     world's radius by nothing. Observed: a world 105 units across asking to be
     viewed from 93,812, which puts every one of its objects off screen and
     looks exactly like "I clicked the region and there is nothing there".

     A framing rule must never be able to throw the camera into deep space. */
  var vpW=renderer?renderer.domElement.clientWidth:0;
  var vpH=renderer?renderer.domElement.clientHeight:0;
  if(!(vpW>0 && vpH>0) || !isFinite(camera.aspect) || camera.aspect<=0) return 0;
  var phone=window.innerWidth<768;
  var vHalf=(camera.fov*Math.PI/180)/2;
  /* two fits. The READABLE one asks for the world to land where a person is
     looking; the WHOLE one asks only that it be on the screen at all. */
  var safeH=whole?0.96:(phone?0.34:0.86);
  /* THE PANEL IS A FIXED WIDTH, THE WINDOW IS NOT.

     0.62 reserved a constant 38% of the frame for a sheet that is actually a
     fixed 380px: right at 1400px wide, and far too little at 900, where the
     same panel takes 44%. So a world was framed to fit a width it did not
     have, and the overflow went under the sheet — measured at 884x605,
     LEARNING put 4 of its 5 principal bodies behind the panel and BUSINESS 6
     of 8, while at 1424 nearly everything was readable.

     Taking the smaller of the two leaves every wide desktop framed exactly as
     it was and only tightens the frame once the panel genuinely crowds it. */
  var safeW=whole?0.96:(phone?0.86:0.62);
  if(!whole && !phone && !refWidth){
    var shE=document.getElementById('semantic');
    var shB=(shE && shE.getBoundingClientRect) ? shE.getBoundingClientRect() : null;
    if(shB && vpW>0) safeW=Math.min(safeW, Math.max(0.30, 1-(shB.right/vpW)-0.06));
  }
  var tanV=Math.tan(vHalf)*safeH;
  var tanH=Math.tan(vHalf)*camera.aspect*safeW;
  var d=b.radius/Math.max(0.001,Math.min(tanV,tanH));
  /* and a hard ceiling relative to the world's own size, so no arithmetic
     accident can put the camera somewhere a person would never be */
  return Math.min(d, b.radius*16);
}
/* the camera position a world's own profile prefers, pulled back if it does not
   fit. A world that already frames well is left exactly as it was. */
function frameWorldPos(migId, centre, dir, preferred){
  var p=MIG_WORLD_PROFILE[migId]||{};
  var bias=(p.framingBias===undefined)?1.0:p.framingBias;
  /* Whether every body must be on screen depends on whether the bodies MOVE.

     A constellation is a fixed figure: if one of its stars is outside the
     frame the figure is broken, and no amount of waiting will fix it. So a
     static world is floored by the whole-viewport fit — all of it, always.

     An orbital world's concepts are on orbits. One of them being outside the
     frame at a given instant is an orbit, not a cropping bug, and forcing the
     outermost body permanently into view means standing far enough back that
     Kepler-16 becomes two dots in an empty page — which is precisely the
     composition the LOVE phase was spent fixing. So an orbital world keeps its
     biased fit and lets its outer bodies travel through the frame. */
  var p2=MIG_WORLD_PROFILE[migId]||{};
  var moves=(p2.worldType==='planetary'||p2.worldType==='circumbinary');
  /* THE BIAS IS AN ALLOWANCE FOR CROPPING, AND IT BELONGS TO THE WORLD.

     It used to multiply the whole readable fit, which quietly spent the same
     allowance twice on a narrow window: the fit already grows there to make
     room for a panel that takes 43% of the width instead of 27%, and cutting
     that larger number by the same 0.66 threw away the panel's share as well
     as the world's. PHILOSOPHY kept 7 of its 8 concepts readable at 1440 and
     only 6 at 900 for that reason.

     Split the two against the panel's WIDE share, which is the share the
     approved compositions were tuned with. On a wide desktop the two fits are
     identical, so every approved camera distance comes out unchanged to the
     unit. Only the EXTRA distance a narrower panel demands is added, and it is
     added in full, because the panel does not negotiate. */
  var fitRead=fitDistance(migId), fitAll=fitDistance(migId,true),
      fitRef=fitDistance(migId,false,true);
  var extra=Math.max(0, fitRead-fitRef);
  var need=moves ? fitRef*bias + extra
                 : Math.max(fitRef*bias + extra, fitAll);
  var d=Math.max(preferred, need);
  return { p:new THREE.Vector3().addVectors(centre, dir.clone().normalize().multiplyScalar(d)),
           d:d, preferred:preferred, need:need };
}

/* COMPOSE AGAINST THE SHEET, NOT AGAINST THE WINDOW.

   Every world frame below aims dead at its subject, which centres it in the
   WINDOW — but the readable area is the window minus a fixed 380px panel, and
   those two centres are not the same place. On a wide desktop it does not
   matter: the world is small enough inside the space that is left that all of
   it clears. As the window narrows the panel takes a larger and larger share
   until the world is composed half underneath it.

   Standing further back — what fitDistance now does — shrinks the world but
   does not move it, so it is only half the answer. This slides the whole
   frame, camera and aim together, exactly as the brain view already does for
   the same reason.

   The shift engages only when the panel actually crowds the subject, so every
   window past about 1150px is composed precisely as it was before. The phone
   is excluded: its sheet is BELOW rather than beside, and the lift for that
   is applied per-branch in the vertical. */
function composeForSheet(mode,f){
  if(mode==='universe' || !camera || !renderer || !f) return f;
  if(window.innerWidth<768) return f;
  var Wpx=renderer.domElement.clientWidth, Hpx=renderer.domElement.clientHeight;
  if(!(Wpx>0 && Hpx>0)) return f;
  var el=document.getElementById('semantic');
  var pr=(el && el.getBoundingClientRect) ? el.getBoundingClientRect() : null;
  var panelR=pr?pr.right:Wpx*0.27;
  var shiftPx=Math.max(Wpx/2, panelR+0.20*Wpx)-Wpx/2;
  if(shiftPx<1) return f;
  var d=f.p.distanceTo(f.a);
  if(!(d>0)) return f;
  var vd=new THREE.Vector3().subVectors(f.a,f.p).normalize();
  var rt=new THREE.Vector3().crossVectors(vd,new THREE.Vector3(0,1,0));
  if(rt.lengthSq()<1e-6) return f;
  /* screen-space px to world units at the subject's own depth */
  rt.normalize().multiplyScalar(shiftPx*(2*d*Math.tan((camera.fov*Math.PI/180)/2)/Hpx));
  f.p.sub(rt); f.a.sub(rt);
  return f;
}
function frameFor(mode,id){ return composeForSheet(mode, frameForRaw(mode,id)); }
function frameForRaw(mode,id){
  /* the whole-mind frame follows the FOLD STATE: the brain while it is closed,
     and the wider universe frame if it is ever expanded without a region
     selected (which only a harness does, but the camera must still be sane). */
  if(mode==='universe' && mindOpen<0.5){
    /* §3 — before the mind opens, the universe frame IS the brain frame, and
       it is LATERAL. A brain is identified from the side: that is the view in
       which the frontal pole, the crown, the occipital taper, the temporal
       lobe and the cerebellum are all simultaneously legible. From the front
       it is two lobes; from above it is an ellipse; from three-quarters the
       Sylvian fissure foreshortens into nothing.

       The camera therefore sits on the X axis — the axis normal to the
       midsagittal plane — lifted by about 7 degrees and swung forward by
       about 6, which is enough to give the crown some depth without turning
       the view into a three-quarter one. BRAIN_VIEW is a declared direction so
       a check can measure the angle rather than trust this comment. */
    var phoneB2=window.innerWidth<768;
    var k=(phoneB2?5.60:2.50)*(1+WELCOME_DIM*0.13);
    var d=brainView().multiplyScalar(BRAIN_R*k);
    var a=new THREE.Vector3(0, BRAIN_R*(phoneB2?0.10:0.22), 0);
    /* §4 — on the threshold the name owns the left of the page, so the organ
       is aimed off-centre and drifts back as the mind is entered. On a phone
       the copy owns the middle, so it moves DOWN rather than sideways. */
    /* Both the threshold and the MMM keep their copy on the LEFT — the welcome
       block, then the region list — so on a desktop the organ is never centred
       in the window. It is centred in what is left of it. The offset therefore
       does not ease to zero; it eases from one composition to the other, which
       is why the reveal is a settle rather than a slide across the page.

       On a phone the copy is above and below rather than beside, so the organ
       moves DOWN instead. Translating the camera AND the aim by the same
       vector keeps the view direction fixed: same brain, same angle, both
       screens (§41). */
    if(!phoneB2){
      var lateral=new THREE.Vector3().crossVectors(BRAIN_VIEW,new THREE.Vector3(0,1,0)).normalize();
      var off=BRAIN_R*(0.50+WELCOME_DIM*0.14);
      d.addScaledVector(lateral,off); a.addScaledVector(lateral,off);
    } else {
      /* A phone's copy is BELOW rather than beside: the threshold text, then
         the region list, own the lower three fifths. So the organ moves up
         into the band that is left, and it moves further on the MMM than on
         the threshold because the region list is taller than the welcome. */
      var dy=-BRAIN_R*(1.16-WELCOME_DIM*0.82);
      d.y+=dy; a.y+=dy;
    }
    return { p:d, a:a };
  }
  /* the universe frame must contain the WHOLE mind: with the old aim,
     OBSERVATION sat 31px above the top edge, so hovering it in the menu
     identified a world nobody could see — which is the entire point of the
     highlight. Lift the aim until all fourteen are inside the frame. */
  if(mode==='universe') return {p:new THREE.Vector3(0,84,830), a:new THREE.Vector3(0,40,0)};
  var n=byId[id]; if(!n||!n.pos) return {p:wantPos.clone(), a:wantAim.clone()};
  /* An orbital world has a plane, so arrive ABOVE and OUTSIDE it — looking
     down the sphere normal would flatten the architecture we borrowed. */
  if(mode==='region' && CONSTELLATIONS[id]){
    /* The figure resolves from ONE line of sight. Arrive on it — the scaled
       equivalent of where Earth actually stands — and the pattern comes
       together; move off it and the real depths pull it apart. */
    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var narrow=window.innerWidth<1024 && window.innerWidth>=768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?2.02:(narrow?1.22:1.0));
    var fwC=frameWorldPos(id, n.pos, kc.frame.w, Dc);
    var aimC=n.pos.clone();
    /* push the figure up out of the sheet by aiming below it */
    if(phoneC) aimC.add(kc.frame.v.clone().multiplyScalar(fwC.d*0.265));
    return { p:fwC.p, a:aimC };
  }
  if(mode==='region' && BINARY[id] && BINARY[id].centre){
    /* Philosophy is compact, so arriving there frames the whole system. LOVE
       is not: its first planetary orbit sits at 3.15x the stellar separation,
       so framing the whole thing would shrink the two stars to a dot. Arrive
       facing the PAIR, with the planetary paths sweeping out past the frame —
       the composition the astronomy actually implies. */
    var b=BINARY[id], phoneB=window.innerWidth<768;
    var d0=(phoneB?6.2:4.4)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var dirB=b.centre.clone().normalize().multiplyScalar(0.70)
              .add(new THREE.Vector3(0,(phoneB?0.56:0.42),0)
                   .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT));
    var fwB=frameWorldPos(id, b.centre, dirB, d0*dirB.length());
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=fwB.d*0.28;
    return {p:fwB.p, a:aimB};
  }
  if(mode==='region' && templateFor(id)){
    /* a phone sees a tall, narrow slice, and the sheet takes the lower 58%.
       Stand further back and aim high so the whole system sits in the strip
       that is actually visible — not a corner of it. */
    var phone=window.innerWidth<768;
    var dirP=n.pos.clone().normalize().multiplyScalar(phone?168:96)
              .add(new THREE.Vector3(0, phone?96:64, 0)
                   .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT));
    var fwP=frameWorldPos(id, n.pos, dirP, dirP.length());
    var aim=n.pos.clone();
    /* the lift out of the sheet must SCALE with how far back we stand, or a
       distant framing leaves the world centred behind the panel */
    if(phone) aim.y-=fwP.d*0.30;
    return {p:fwP.p, a:aim};
  }
  /* THE FALLBACK OWES THE PHONE THE SAME CORRECTION THE CHARTED WORLDS MAKE.

     The three branches above each drop their aim on a phone, because the sheet
     owns the lower three fifths there and a world aimed dead centre is a world
     under the panel. This branch — the one the twelve uncharted regions take —
     aimed straight at the node, so on a phone they arrived centred vertically
     and therefore behind the sheet: measured at a 500x749 viewport, twelve of
     fifteen landed at y=375 against a sheet starting at y=315, while
     PHILOSOPHY, LOVE and OBSERVATION cleared it because they have branches of
     their own. On a desktop the sheet is beside rather than below, so the same
     framing is correct there and is left alone.
     The lift runs along SCREEN up, not world up. This branch stands the camera
     on the region's own radial, so that radial's tilt differs region by region
     and a fixed world-Y offset turns into a different screen shift for each
     one — with a constant 0.24 the fourteen cleared the sheet but BUILDING,
     whose radial is the most steeply inclined, still landed 6px inside it.
     Projecting world up onto the view plane makes the correction mean the same
     thing everywhere. */
  /* AND IT OWES EVERY WORLD A MEASURED DISTANCE.

     This branch stood at a flat 62 units whatever it was looking at, so the
     twelve uncharted regions were the only ones in the mind not framed by
     their own size. Their profiles have declared a framingBias all along and
     nothing ever read it: fitDistance was computing 62.4 for BUSINESS on a
     wide desktop and 72.0 on a narrow one, and both were discarded for the
     constant. That is why BUSINESS held 8 of 8 concepts readable at 1440 and
     only 5 of 8 at 900 — the world never moved.

     A latent world is a placeholder sphere with no approved composition to
     protect, so unlike TRAPPIST-1 it has no reason to crop: its bias is 1.00
     and it simply fits. 62 stays as the PREFERRED distance, so a world small
     enough to frame well from there is left exactly where it was. */
  var dOut=(mode==='region'?62:26);
  var out=n.pos.clone().normalize().multiplyScalar(dOut);
  if(mode==='region'){
    var fwG=frameWorldPos(id, n.pos, out, dOut);
    out.normalize().multiplyScalar(fwG.d);
    dOut=fwG.d;
  }
  var aimN=n.pos.clone();
  if(window.innerWidth<768){
    var vd=out.clone().normalize().negate();            // camera toward the world
    var upS=new THREE.Vector3(0,1,0);
    upS.addScaledVector(vd, -upS.dot(vd));              // world up, on the view plane
    if(upS.lengthSq()>1e-6) aimN.addScaledVector(upS.normalize(), -dOut*0.22);
  }
  return {p:new THREE.Vector3().addVectors(n.pos,out), a:aimN};
}
/* FRAME THE DESTINATION, NOT THE DEPARTURE.

   Every branch of frameFor above reads n.pos, and n.pos is not a fixed
   coordinate: applyMorph rewrites it in place as the mind folds, so it means
   "where this object is RIGHT NOW". Asking it where a world is while the mind
   is still folded answers with the world's position INSIDE THE BRAIN — the
   place it is about to leave.

   That is what made the first selection from the closed mind arrive at empty
   space. travelTo starts the fold and picks the camera's destination in the
   same tick, so the flight was aimed 167 to 528 units away from where the
   world would be 1150ms later, against worlds about 100 across. LOVE was the
   only region unaffected, and not by design: its branch frames from
   BINARY[id].centre, a snapshot taken at build time while the scene still
   stood at universe positions, so it is the one frame source that does not
   read the live n.pos.

   The bug was invisible to every suite because under prefers-reduced-motion
   travelTo folds IMMEDIATELY, before it frames — so the checks measured the
   one path where the ordering does not matter.

   Evaluating at the destination fold costs one lerp per node and touches no
   buffer or uniform: applyMorph moves positions only. */
function frameForAt(mode,id,openV){
  if(Math.abs(openV-mindOpen)<1e-6) return frameFor(mode,id);
  var save=mindOpen;
  mindOpen=openV; applyMorph();
  try { return frameFor(mode,id); }
  finally { mindOpen=save; applyMorph(); }
}
function travelTo(mode,id,push){
  if(push!==false) history.push({mode:state.mode, focus:state.focus, region:state.region});
  /* the brain opens into the world you chose, and closes behind you */
  var wantOpen = (mode==='universe' && !id) ? 0 : 1;
  /* RETARGET, never discard.

     This used to refuse to start a morph while one was already running. The
     effect was that choosing a region DURING a transition was thrown away: the
     morph already in flight carried on to wherever IT was going, so clicking a
     MIG while the mind was still closing left the mind CLOSED with the state
     saying 'region' — the world's objects still folded inside the brain, and
     nothing to see. Going back and clicking again worked, because by then no
     morph was in flight.

     A destination is a destination. If the mind is heading somewhere other
     than where the new selection needs it, it turns around from wherever it
     currently is. */
  var needsMorph = entered &&
    (MORPH_ON ? (wantOpen!==MORPH_TO) : (wantOpen!==mindOpen));
  if(needsMorph){
    if(reduced||LITE){ setMindOpen(wantOpen); }
    else { MORPH_FROM=mindOpen; MORPH_TO=wantOpen; MORPH_ON=true; morphT=0; morphStart=0; }
  }
  state.mode=mode;
  if(mode==='region'){ state.region=id; state.focus=null; }
  else if(mode==='concept'){ state.focus=id; state.region=byId[id]?byId[id].mig:state.region; }
  else if(mode==='universe'){ state.region=null; state.focus=null; }
  var f=frameForAt(mode, id||state.region, wantOpen);
  wantPos.copy(f.p); wantAim.copy(f.a);
  invalidate(190);
  if(reduced||LITE){ camPos.copy(wantPos); camAim.copy(wantAim); FLIGHT_ON=false; }
  else {
    var jump=camPos.distanceTo(wantPos);
    if(entered && jump>FLIGHT_MIN){
      FLIGHT_FROM_P.copy(camPos); FLIGHT_FROM_A.copy(camAim);
      /* longer for a longer journey, but bounded at both ends: never so brief
         that it reads as a cut, never so slow that it reads as waiting */
      FLIGHT_MS=Math.min(1600, Math.max(820, jump*2.1));
      FLIGHT_T0=(performance&&performance.now)?performance.now():Date.now();
      FLIGHT_ON=true;
    } else FLIGHT_ON=false;
  }
  paintDOM();
}

/* ── 5. THE DOM LAYER IS THE STRUCTURE ────────────────────────────────
   Everything below exists whether or not WebGL does. Delete the canvas and
   the mind is still completely navigable — the property that makes a 3D
   rebuild safe (DESIGN-V02 §22). */
var elWhere=document.getElementById('where'), elGloss=document.getElementById('gloss'),
    elTier=document.getElementById('tier'), elGroups=document.getElementById('groups'),
    elStatus=document.getElementById('status'),
    backBtn=document.getElementById('backBtn'), mindBtn=document.getElementById('mindBtn');

function row(n, meta, onClick, current){
  var li=document.createElement('li'), b=document.createElement('button');
  b.type='button'; b.setAttribute('data-nav',n.id);
  if(current) b.setAttribute('aria-current','true');
  var l=document.createElement('span'); l.className='lbl'; l.textContent=n.label||n.id;
  b.appendChild(l);
  if(n.t==='mig'){
    var src=document.createElement('span');
    src.className='src'; src.setAttribute('data-src',n.id);
    src.textContent=sourceLabelOf(n.id);
    b.appendChild(src);
    b.setAttribute('aria-label',(n.label||n.id)+' — '+sourceLabelOf(n.id));
  }
  if(meta){ var m=document.createElement('span'); m.className='meta'; m.innerHTML=meta; b.appendChild(m); }
  b.addEventListener('click',onClick);
  /* hovering a MIG row identifies its world in the sky. Pointer events only —
     there is no hover on touch and inventing one causes accidental navigation. */
  if(n.t!=='mig'){
    b.addEventListener('pointerenter',function(e){ if(e.pointerType!=='touch') highlightNode(n.id); });
    b.addEventListener('pointerleave',function(){ highlightNode(null); });
    b.addEventListener('focus',function(){ if(kbNav) highlightNode(n.id); });
    b.addEventListener('blur',function(){ if(hoveredNode===n.id) highlightNode(null); });
  }
  if(n.t==='mig'){
    b.addEventListener('pointerenter',function(e){ if(e.pointerType!=='touch') highlightMIG(n.id); });
    b.addEventListener('pointerleave',function(){ highlightMIG(null); });
    b.addEventListener('focus',function(){
      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only
    });
    /* release unconditionally: if this row is the lit one, leaving it must
       clear it, however the focus got here */
    b.addEventListener('blur',function(){ if(hoveredMIG===n.id) highlightMIG(null); });
  }
  li.appendChild(b); return li;
}
function group(title, rows){
  if(!rows.length) return null;
  var d=document.createElement('div'); d.className='grp';
  var h=document.createElement('h2'); h.textContent=title; d.appendChild(h);
  var ul=document.createElement('ul'); ul.className='nav';
  rows.forEach(function(r){ ul.appendChild(r); });
  d.appendChild(ul); return d;
}
/* group() returns null for a section with nothing in it, deliberately, so an
   empty heading is never painted. Every call site then appended the result
   without checking, which throws — and a region is allowed to be empty. MUSIC
   has no concepts and no writings by design ("deliberately EMPTY of writings.
   A bare rhythmic pulse, honestly sparse"), so choosing MUSIC or PSYCHOLOGY
   threw inside paintDOM and left the sheet half-painted. */
function put(el){ if(el) elGroups.appendChild(el); }
function esc(s){ return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

function paintDOM(){
  elGroups.innerHTML='';
  backBtn.hidden=(state.mode==='universe');
  mindBtn.hidden=(state.mode==='universe');

  if(state.mode==='universe'){
    elTier.textContent='The mind of';
    elWhere.textContent='Siddhesh Thapa';
    elGloss.textContent=MIGS.length+' regions of thinking, '+NODES.length+' objects, '+LINKS.length+
      ' relationships. Nothing here is arranged — regions that share thinking sit closer together.';
    var ordered=MIGS.slice().sort(function(a,b){
      return (a.id==='my-works'?-1:0)-(b.id==='my-works'?-1:0); });   // the work comes first
    var rows=ordered.map(function(m){
      var mem=owned[m.id]||[];
      /* concepts are the Minor IGs, not every member — mem.length counts the
         writings too and stated them twice */
      var c=mem.filter(function(id){return byId[id].t==='minor';}).length;
      var w=mem.filter(function(id){return byId[id].src;}).length;
      return row(m, c+' concepts · '+w+' writings', function(){ travelTo('region',m.id); });
    });
    put(group('Regions',rows));
    say('The whole mind. '+MIGS.length+' regions.');
    return;
  }
  if(state.mode==='region'){
    var m=byId[state.region];
    elTier.textContent='The region of';
    elWhere.textContent=m.label;
    elGloss.textContent=m.line||'';
    var mem=owned[m.id]||[];
    put(group('Concepts', mem.filter(function(id){return byId[id].t==='minor';})
      .map(function(id){ var n=byId[id];
        return row(n, adj[id].length+' connections', function(){ travelTo('concept',id); }); })));
    put(group('Writings', mem.filter(function(id){return byId[id].src;})
      .map(function(id){ var n=byId[id];
        return row(n, esc(n.t)+' · '+esc(n.src), function(){ openReader(id); }); })));
    say('Region '+m.label+'.');
    return;
  }
  var n=byId[state.focus];
  elTier.textContent=esc(n.t)+(n.state?' · '+esc(n.state):'');
  elWhere.textContent=n.label;
  elGloss.textContent=n.line||'';
  put(group('Connects to', adj[n.id].map(function(k){
    var o=byId[k.o];
    var meta=(k.dir>0? '<span class="verb">'+esc(k.v)+'</span> '+esc(o.label)
                     : esc(o.label)+' <span class="verb">'+esc(k.v)+'</span> this')
             +(o.mig!==n.mig? ' · crosses into '+esc(byId[o.mig].label.toLowerCase()) : '');
    return row(o, meta, function(){ o.src? openReader(o.id) : travelTo('concept',o.id); });
  })));
  if(n.src) put(group('This writing',[ row(n,'Open the source — '+esc(n.src),
    function(){ openReader(n.id); }) ]));
  say(n.label+'. '+adj[n.id].length+' connections.');
}
function say(t){ elStatus.textContent=t; }

/* ── 6. READING — a calmer layer of the same world ────────────────── */
var reader=document.getElementById('reader'), readTitle=document.getElementById('readTitle'),
    readPlate=document.getElementById('readPlate'), readRunning=document.getElementById('readRunning'),
    readFolio=document.getElementById('readFolio'), readClose=document.getElementById('readClose');
var readingId=null, camMemory=null;

function openReader(id){
  var n=byId[id]; if(!n) return;
  readingId=id;
  camMemory={p:wantPos.clone(), a:wantAim.clone(), mode:state.mode, focus:state.focus, region:state.region};
  readTitle.textContent=n.line||n.label;
  readRunning.textContent=byId[n.mig]?byId[n.mig].label:'';
  readFolio.textContent=esc(n.t).toUpperCase();
  readPlate.innerHTML='From <b>'+esc(n.src||'—')+'</b>'+
    (n.register?' · '+esc(n.register):'')+(n.state?' · '+esc(n.state):'');
  reader.classList.add('on'); reader.setAttribute('aria-hidden','false');
  readClose.focus();
  say('Reading '+n.label+'.');
}
function closeReader(){
  reader.classList.remove('on'); reader.setAttribute('aria-hidden','true');
  if(camMemory){ wantPos.copy(camMemory.p); wantAim.copy(camMemory.a); }   // spatial memory
  readingId=null; invalidate(140);
  var b=document.querySelector('[data-nav="'+(state.focus||state.region||'')+'"]');
  if(b) b.focus();
  say('Back where you were.');
}
readClose.addEventListener('click',closeReader);

backBtn.addEventListener('click',function(){
  if(readingId) return closeReader();
  var h=history.pop();
  if(!h) return travelTo('universe',null,false);
  state.mode=h.mode; state.focus=h.focus; state.region=h.region;
  var f=frameFor(h.mode, h.focus||h.region);
  wantPos.copy(f.p); wantAim.copy(f.a);
  if(reduced||LITE){ camPos.copy(wantPos); camAim.copy(wantAim); }
  paintDOM();
});
mindBtn.addEventListener('click',function(){ if(readingId) closeReader(); travelTo('universe'); });
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){ if(readingId) closeReader(); else if(state.mode!=='universe') backBtn.click(); }
});

/* scroll = travel along the current approach vector (DESIGN-V02 §11).
   Reading stays ordinary document scrolling. */
var dolly=0;
window.addEventListener('wheel',function(e){
  if(readingId) return;
  dolly=Math.max(-40,Math.min(90,dolly+e.deltaY*0.055)); invalidate(70);
},{passive:true});

/* cursor: a slight parallax offset only — proving the world, not the toybox */
var mx=0,my=0;
window.addEventListener('pointermove',function(e){
  mx=(e.clientX/window.innerWidth-0.5); my=(e.clientY/window.innerHeight-0.5); invalidate(22);
},{passive:true});

/* ── 7. RENDER ────────────────────────────────────────────────────── */
function resize(){
  if(!glOK) return;
  var w=window.innerWidth,h=window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, window.innerWidth<768?1:1.5));  // P1
  renderer.setSize(w,h,false);
  camera.aspect=w/Math.max(1,h); camera.updateProjectionMatrix();
}
window.addEventListener('resize',function(){ resize(); invalidate(40); });
document.addEventListener('visibilitychange',function(){ if(!document.hidden) invalidate(40); });

var morphT=0, morphStart=0, MORPH_FROM=0, MORPH_TO=1;
/* ── THE FLIGHT ───────────────────────────────────────────────────────
   Choosing a region is a journey, not a nudge, and it should feel like one.

   The camera has always eased toward its target exponentially, which has no
   duration and no shape: it leaves fast, arrives slowly, and a 600-unit
   journey into a world reads exactly like a 20-unit adjustment. For travel
   between the mind and a world that is the wrong gesture — you are supposed
   to feel that you MOVED.

   So a large move becomes a timed flight with an ease that accelerates out of
   the mind and decelerates into the world. Small moves keep the old lerp,
   because ceremonially animating a nudge is worse than not animating it. */
var FLIGHT_ON=false, FLIGHT_T0=0, FLIGHT_MS=1400;
var FLIGHT_FROM_P=new THREE.Vector3(), FLIGHT_FROM_A=new THREE.Vector3();
var FLIGHT_MIN=48;      /* below this a move is an adjustment, not a journey */
var lastMs=0, frameMs=16;
function step(){
  var t0=(performance&&performance.now)?performance.now():Date.now();
  var k=reduced?1:0.055;
  var aim=wantPos.clone();
  aim.z+=dolly;
  /* A pattern depends on where you stand. Inside a constellation the viewpoint
     is the subject, so the same pointer travel carries much further there. */
  var par=(state.region && CONSTELLATIONS[state.region]) ? 13.0 : 1.0;
  aim.x+=mx*10*par; aim.y+=-my*7*par;
  if(FLIGHT_ON){
    var fnow=(performance&&performance.now)?performance.now():Date.now();
    var ft=Math.min(1,(fnow-FLIGHT_T0)/FLIGHT_MS);
    /* ease in and out: leave the mind gathering speed, arrive settling */
    var fe = ft<0.5 ? 4*ft*ft*ft : 1-Math.pow(-2*ft+2,3)/2;
    camPos.lerpVectors(FLIGHT_FROM_P, aim, fe);
    camAim.lerpVectors(FLIGHT_FROM_A, wantAim, fe);
    if(ft>=1) FLIGHT_ON=false;
    invalidate(4);
  } else {
    camPos.lerp(aim,k); camAim.lerp(wantAim,k);
  }
  camera.position.copy(camPos); camera.lookAt(camAim);
  /* RANGE GOVERNS WHAT IS SHOWN. From the universe a visitor should see that
     worlds exist and that a few thoughts travel between them — not 126 lines.
     Local relationships resolve as the camera closes on a constellation. */
  if(pts){
    var fr=-1.0;
    if(state.region){ for(var mi=0;mi<MIGS.length;mi++) if(MIGS[mi].id===state.region) fr=mi; }
    pts.material.uniforms.focusRegion.value=fr;
  }
  if(lineSeg){
    var LU=lineSeg.material.uniforms;
    /* GLOBAL — cross-MIG arcs, judged against the scale of the mind you are
       actually looking at. In the brain those arcs ARE the structure, so they
       are fully present; as the mind opens they hand over to the universe rule
       they always had. */
    var uniMix=0.008+0.992*Math.max(0,Math.min(1,(430-camPos.length())/210));
    LU.globalMix.value=(1-mindOpen)*0.92 + mindOpen*uniMix;
    /* WORLD-LOCAL — the camera's distance to the world the edge belongs to,
       against a range the world's own profile declares. This is the fix. */
    var fr=-1.0, fm=0.0;
    if(state.region && byId[state.region] && byId[state.region].pos){
      for(var mi2=0;mi2<MIGS.length;mi2++) if(MIGS[mi2].id===state.region) fr=mi2;
      var ld=camPos.distanceTo(byId[state.region].pos);
      var range=relRangeOf(state.region);
      fm=Math.max(0,Math.min(1,(range-ld)/(range*0.62)));
    }
    LU.focusRegion.value=fr; LU.focusMix.value=fm; LU.mindOpen.value=mindOpen;
    (function(){
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
      if(starField){
        starField.material.uniforms.mindOpen.value=mindOpen;
        starField.material.uniforms.dim.value=WELCOME_DIM;
        starField.material.uniforms.mid.value=camPos.length();
      }
      LU.brainAsk.value=BRAIN_ASK;
    })();
    LU.brainMid.value=camPos.length();
    var hr=-1.0;
    if(hoveredMIG){ for(var mi3=0;mi3<MIGS.length;mi3++) if(MIGS[mi3].id===hoveredMIG) hr=mi3; }
    LU.hoverRegion.value=hr;
    LU.hoverMix.value=hr>=0?0.80:0.0;
  }
  /* The pair moves exactly while the camera does. A binary turning forever
     would cost a frame forever, and P4 says a still universe is free — so
     arrival is when the relationship is felt, and rest is free. */
  /* while the mind is folded the pair belongs to the brain's interior, not to
     its own orbit — running this then threw LOVE's stars outside the organ */
  if(BIN_KEYS.length && pts && mindOpen > 0.5){
    /* measured against the PREVIOUS frame, not against wantPos: a parked
       camera still carries a dolly and a mouse offset, and testing the target
       would read those as travel and turn the pair forever */
    var travelling=camPos.distanceTo(prevCam)>0.05;
    prevCam.copy(camPos);
    if(travelling){
      binPhase+=0.030;
      var pa=pts.geometry.attributes.position;
      BIN_KEYS.forEach(function(mid){
        var b=BINARY[mid]; if(!b.centre) return;
        var ia=nodeIndex[mid], ib=STARB_INDEX[mid];
        if(ia!==undefined){
          var pA=binaryOffset(b,0,b.phase+binPhase);
          pa.array[ia*3]=b.centre.x+pA.x; pa.array[ia*3+1]=b.centre.y+pA.y;
          pa.array[ia*3+2]=b.centre.z+pA.z;
          byId[mid].pos.set(pa.array[ia*3],pa.array[ia*3+1],pa.array[ia*3+2]);
        }
        if(ib!==undefined){
          var pB=binaryOffset(b,1,b.phase+binPhase);
          pa.array[ib*3]=b.centre.x+pB.x; pa.array[ib*3+1]=b.centre.y+pB.y;
          pa.array[ib*3+2]=b.centre.z+pB.z;
        }
        var ax=AXIS_INDEX[mid];
        if(ax!==undefined && orbitLines){
          var oaP=orbitLines.geometry.attributes.position;
          oaP.array[ax*3]=pa.array[ia*3];   oaP.array[ax*3+1]=pa.array[ia*3+1];
          oaP.array[ax*3+2]=pa.array[ia*3+2];
          oaP.array[(ax+3)*3]=pa.array[ib*3];   oaP.array[(ax+3)*3+1]=pa.array[ib*3+1];
          oaP.array[(ax+3)*3+2]=pa.array[ib*3+2];
          oaP.needsUpdate=true;
        }
      });
      pa.needsUpdate=true;
    }
  }
  if(MORPH_ON){
    /* driven by TIME, not by frame count: a frame-counted morph takes as long
       as the machine is slow, which is exactly backwards. 1.15s everywhere. */
    var mnow=(performance&&performance.now)?performance.now():Date.now();
    if(!morphStart) morphStart=mnow;
    morphT=Math.min(1,(mnow-morphStart)/1150);
    /* ease out: the brain lets go quickly, then the universe settles */
    var e=1-Math.pow(1-morphT,3);
    setMindOpen(MORPH_FROM+(MORPH_TO-MORPH_FROM)*e);
    if(morphT>=1){ MORPH_ON=false; morphStart=0; }
    invalidate(4);
  }
  layLabels();
  renderer.render(scene,camera);
  RENDERS++;                          // so idle cost can be measured, not asserted
  var t1=(performance&&performance.now)?performance.now():Date.now();
  frameMs=frameMs*0.9+(t1-t0)*0.1;
}
var needFrames=0;
function invalidate(n){ needFrames=Math.max(needFrames, n||46); }
/* RENDER ON DEMAND — idle is free, a hidden tab is free, reading nearly stops
   the world. Frames are requested by events, never by mere existence. */
function loop(){
  requestAnimationFrame(loop);
  if(!glOK||LITE) return;
  if(document.hidden) return;                     // P2 hidden tab
  if(readingId){ needFrames=0; return; }          // P3 reading pauses the world
  /* THE DRIFT. Only while the mind is the subject, never inside a world,
     never under reduced motion, never while it is being held, and never
     faster than it needs to be. Metered to about 20 frames a second rather
     than 60, because a constellation that must read from every direction is
     only worth building if a visitor can get to those directions — and most
     people never drag anything. That metering is roughly a third of the cost
     of an unthrottled spin, which is the difference between weather and a
     machine working hard for nothing. */
  if(!reduced && !MIND_DRAG && mindOpen<0.5 && !state.region){
    var nowT=performance.now();
    if(nowT-MIND_LAST > 48 && nowT > MIND_HELD+2400){
      var dt=Math.min(0.25,(nowT-MIND_LAST)/1000);
      MIND_LAST=nowT;
      MIND_YAW += MIND_DRIFT*dt;
      var bf=frameFor('universe');
      wantPos.copy(bf.p); wantAim.copy(bf.a);
      invalidate(2);
    }
  }
  if(needFrames<=0) return;                       // P4 a still universe is free
  needFrames--; step();
}

/* ── TAKING HOLD OF THE MIND ─────────────────────────────────────────
   Drag to turn it. Only in the brain, only on the canvas, and it holds the
   drift off for a moment afterwards so what you positioned stays put. */
(function(){
  if(!glOK||!renderer) return;
  var el=renderer.domElement, px=0, py=0, pid=null;
  el.addEventListener('pointerdown',function(e){
    if(mindOpen>0.5 || state.region) return;
    pid=e.pointerId; px=e.clientX; py=e.clientY; MIND_DRAG=true;
    try{ el.setPointerCapture(pid); }catch(_){}
  });
  el.addEventListener('pointermove',function(e){
    if(!MIND_DRAG || e.pointerId!==pid) return;
    var dx=e.clientX-px, dy=e.clientY-py;
    px=e.clientX; py=e.clientY;
    MIND_YAW -= dx*0.0052;
    /* pitch is bounded: past about fifty degrees you are looking at the mind
       from underneath, which is a view of a brain nobody can read */
    MIND_PITCH = Math.max(-0.88, Math.min(0.88, MIND_PITCH - dy*0.0040));
    var bf2=frameFor('universe');
    wantPos.copy(bf2.p); wantAim.copy(bf2.a);
    invalidate(8);
  });
  function release(e){
    if(!MIND_DRAG || (e && e.pointerId!==pid)) return;
    MIND_DRAG=false; MIND_HELD=performance.now(); MIND_LAST=MIND_HELD;
    try{ el.releasePointerCapture(pid); }catch(_){}
    pid=null;
  }
  el.addEventListener('pointerup',release);
  el.addEventListener('pointercancel',release);
})();

if(glOK){ resize(); travelTo('universe',null,false); if(!LITE) loop(); else step(); }
else { travelTo('universe',null,false); }

/* ── LABELS EMERGE FROM DISTANCE ──────────────────────────────────────
   The scene had no spatial identity because nothing was named. Names are
   projected DOM text, not textures: they stay selectable, translatable and
   invisible to nobody. Progressive disclosure is the curiosity mechanism —
   something is always visible before it is legible. */
var labelLayer=document.createElement('div');
labelLayer.id='labels'; labelLayer.setAttribute('aria-hidden','true');
document.body.appendChild(labelLayer);
var labelEls={};
function labelFor(n,cls){
  var e=labelEls[n.id];
  if(!e){ e=document.createElement('span'); e.className='lb '+cls;
          if(n.t==='mig'){
            /* two lines, two weights: the region is the answer, the system it
               borrows is the question underneath it */
            var nm=document.createElement('span'); nm.className='lb-name';
            nm.textContent=n.label; e.appendChild(nm);
            /* 29 — the source is intrigue, and twelve repetitions of "not yet
               charted" floating over an organ is not intrigue, it is noise.
               The three charted worlds say what they borrow; the rest say
               nothing here and are still declared uncharted in the menu, which
               is where the claim is auditable. */
            var src=sourceLabelOf(n.id);
            if(src==='not yet charted') src=null;
            if(src){ var sp=document.createElement('span'); sp.className='lb-src';
                     sp.textContent=src; e.appendChild(sp); }
          } else { e.textContent=n.label; }
          labelLayer.appendChild(e); labelEls[n.id]=e; }
  return e;
}
function layLabels(){
  if(!glOK||!labelLayer) return;   // boot renders before the layer exists
  var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
  var shown={};
  NODES.forEach(function(n){
    if(!n.pos) return;
    var d=camPos.distanceTo(n.pos);
    var elsewhere = state.region && n.mig!==state.region;
    /* A constellation is framed whole, so its stars are far and would other-
       wise never be named. Minor IGs carry much further than writings, which
       is the hierarchy rather than a tweak: the concepts are what the region
       IS, the writings are what it produced. */
    var lp=(profileOf(n.mig)||{}).labelStyle||{minor:160,writing:80};
    var isStar=(n.star!==undefined);
    /* the whole organ must be named. Measured from where the camera actually
       is, so re-framing the brain can never silently delete part of the menu. */
    var migRange = (mindOpen<0.5) ? (camPos.length()+BRAIN_R*1.30) : 620;
    /* on the threshold the organ is atmosphere. A region name over the
       welcome copy is two things asking to be read at once. */
    if(!entered && n.t==='mig') return;
    var want = n.t==='mig' ? (d<migRange && !elsewhere)
             : ((n.t==='minor' ? d<lp.minor : d<lp.writing) && !elsewhere);
    if(!want) return;
    var v=n.pos.clone().project(camera);
    if(v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1) return;
    var e=labelFor(n, n.t==='mig'?'lb-mig':(n.t==='minor'?'lb-min':'lb-w'));
    var lr=(n.t==='minor'?lp.minor:lp.writing);
    var near = n.t==='mig' ? Math.max(0,Math.min(1,(migRange-d)/(migRange*0.55)))
             : Math.max(0,Math.min(1,(lr-d)/(lr*0.5)));
    e.style.transform='translate(-50%,-50%) translate('+((v.x*0.5+0.5)*w).toFixed(1)+'px,'+
      ((-v.y*0.5+0.5)*h+(n.t==='mig'?26:16)).toFixed(1)+'px)';
    e.style.opacity=(0.18+0.82*near).toFixed(3);
    e.style.display='block';
    shown[n.id]=1;
  });
  Object.keys(labelEls).forEach(function(id){ if(!shown[id]) labelEls[id].style.display='none'; });
}

/* ── 8. THE HARNESS SURFACE ───────────────────────────────────────────
   Exposed so a checker can assert SCENE-GRAPH TRUTH and PROJECTED SCREEN
   COORDINATES rather than pixels — pixel diffing has been invalid for this
   project since V0.3 and 3D does not change that. `frame()` is the
   headless-lite entry: render exactly one frame and return. */
/* Did the visitor drive this focus, or did we? Only their own keyboard
   navigation should light a world up. */
var kbNav=false;
window.addEventListener('keydown',function(e){
  if(e.key==='Tab'||e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='ArrowLeft'||
     e.key==='ArrowRight'||e.key==='Home'||e.key==='End') kbNav=true;
},true);
window.addEventListener('pointerdown',function(){ kbNav=false; },true);

var hoveredNode=null;
/* highlightNode(id) — name one object and the world answers. The renderer
   decides how; there is no per-world and no per-object implementation. */
function highlightNode(id){
  if(hoveredNode===id) return;
  hoveredNode=id;
  if(!glOK||!pts) return;
  var i=(id && nodeIndex[id]!==undefined) ? nodeIndex[id] : -1;
  pts.material.uniforms.hoverNode.value=i;
  invalidate(40);
}

var hoveredMIG=null;
/* highlightMIG(id) — the renderer decides how that world answers. One entry
   point for every world type; never a per-MIG hover implementation. */
/* the organ is told a region has been named, from the one place that knows */
function askedRegion(id){ BRAIN_ASK_TO=(id?1:0); invalidate(30); }
function highlightMIG(migId){
  if(hoveredMIG===migId) return;
  hoveredMIG=migId;
  if(!glOK) return;
  var idx=-1;
  if(migId) for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===migId) idx=i;
  if(pts) pts.material.uniforms.hoverRegion.value=idx;
  askedRegion(migId);
  if(orbitLines) orbitLines.material.uniforms.hoverOwn.value=
    (migId && ORBITS[migId]) ? 1.0 : 0.0;
  invalidate(40);
}
window.__v02={
  ok:function(){ return glOK; },
  lite:function(){ return LITE; },
  reduced:function(){ return reduced; },
  frame:function(){ if(glOK) step(); return true; },
  settle:function(n){ for(var i=0;i<(n||90);i++) step(); return true; },
  state:function(){ return {mode:state.mode, focus:state.focus, region:state.region,
    reading:readingId, cam:camPos.toArray().map(Math.round), aim:camAim.toArray().map(Math.round)}; },
  graph:function(){ return {nodes:NODES.length, links:LINKS.length,
    cross:LINKS.filter(function(l){return l.cross;}).length}; },
  nodeAt:function(id){ var n=byId[id]; return n&&n.pos? n.pos.toArray().map(function(v){return +v.toFixed(2);}):null; },
  /* screen-space truth: where a real node actually lands for a real viewer */
  project:function(id){
    var n=byId[id]; if(!n||!n.pos||!glOK) return null;
    var v=n.pos.clone().project(camera);
    var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
    return {x:Math.round((v.x*0.5+0.5)*w), y:Math.round((-v.y*0.5+0.5)*h),
            z:+v.z.toFixed(4), onScreen:(v.z<1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1),
            dist:+camera.position.distanceTo(n.pos).toFixed(1)};
  },
  /* FAR / MID / NEAR — the perception ranges, measured from real distance */
  range:function(id){
    var p=this.project(id); if(!p) return null;
    return p.dist>190?'far':(p.dist>70?'mid':'near');
  },
  ranges:function(){
    var o={far:0,mid:0,near:0}, self=this;
    nodeOrder.forEach(function(n){ var r=self.range(n.id); if(r) o[r]++; });
    return o;
  },
  spread:function(){                                  // is the layout genuinely volumetric?
    var xs=[],ys=[],zs=[];
    nodeOrder.forEach(function(n){ xs.push(n.pos.x); ys.push(n.pos.y); zs.push(n.pos.z); });
    function sd(a){ var m=a.reduce(function(s,v){return s+v;},0)/a.length;
      return Math.sqrt(a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/a.length); }
    return {x:+sd(xs).toFixed(1), y:+sd(ys).toFixed(1), z:+sd(zs).toFixed(1)};
  },
  ink:function(){
    if(!glOK) return null;
    var g=renderer.getContext(), W2=renderer.domElement.width, H2=renderer.domElement.height;
    var sw=Math.min(360,W2), sh=Math.min(240,H2);
    var px=new Uint8Array(sw*sh*4);
    g.readPixels(Math.floor((W2-sw)/2),Math.floor((H2-sh)/2),sw,sh,g.RGBA,g.UNSIGNED_BYTE,px);
    var bg=[251,252,253], off=0, minL=255, maxL=0;
    for(var i=0;i<px.length;i+=4){
      if(Math.abs(px[i]-bg[0])+Math.abs(px[i+1]-bg[1])+Math.abs(px[i+2]-bg[2])>10) off++;
      var L=px[i]*0.299+px[i+1]*0.587+px[i+2]*0.114;
      if(L<minL)minL=L; if(L>maxL)maxL=L;
    }
    return {sampled:sw*sh, differing:off, pct:+(100*off/(sw*sh)).toFixed(2),
            range:Math.round(maxL-minL)};
  },
  perf:function(){
    if(!glOK) return null;
    var i=renderer.info;
    return {calls:i.render.calls, points:i.render.points, lines:i.render.lines,
            triangles:i.render.triangles, geometries:i.memory.geometries,
            textures:i.memory.textures, frameMs:+frameMs.toFixed(2),
            dpr:renderer.getPixelRatio(),
            renderer:(function(){ try{ var g=renderer.getContext(),
              d=g.getExtension('WEBGL_debug_renderer_info');
              return d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'unknown'; }catch(e){ return 'unknown'; } })()};
  },
  go:function(mode,id){ travelTo(mode,id); return this.state(); },
  /* drive the same viewpoint the pointer drives, so a checker and a screenshot
     can stand where a visitor would stand */
  look:function(x,y){ mx=x||0; my=y||0; invalidate(30); return {mx:mx,my:my}; },
  highlight:function(id){ highlightMIG(id); return this.hoverState(); },
  highlightNode:function(id){ highlightNode(id); return this.nodeHoverState(); },
  nodeHoverState:function(){
    return { hovered:hoveredNode,
             hoverNode:pts?pts.material.uniforms.hoverNode.value:null,
             expectedIndex:(hoveredNode&&nodeIndex[hoveredNode]!==undefined)?nodeIndex[hoveredNode]:-1 };
  },
  hoverState:function(){
    return {hovered:hoveredMIG,
            hoverRegion:pts?pts.material.uniforms.hoverRegion.value:null,
            orbitHover:orbitLines?orbitLines.material.uniforms.hoverOwn.value:null,
            palette:PALETTE_PICK, philPalette:MIG_PALETTE['philosophy']||null};
  },
  read:function(id){ openReader(id); return readingId; },
  close:function(){ closeReader(); return readingId; },
  back:function(){ backBtn.click(); return this.state(); },
  /* composition audit: are the constellations SEPARABLE, and is anything
     actually big enough on screen to be seen? */
  audit:function(){
    var out={mig:[], sizes:{}, sep:null};
    var cents={};
    MIGS.forEach(function(m){
      var mem=(owned[m.id]||[]).map(function(id){return byId[id];}).filter(function(n){return n.pos;});
      var c=new THREE.Vector3(); mem.forEach(function(n){ c.add(n.pos); });
      if(mem.length) c.divideScalar(mem.length);
      var sp=0; mem.forEach(function(n){ sp+=n.pos.distanceTo(c); });
      sp=mem.length?sp/mem.length:0;
      cents[m.id]={c:c, spread:+sp.toFixed(1), n:mem.length};
      out.mig.push({id:m.id, members:mem.length, spread:+sp.toFixed(1)});
    });
    // nearest other constellation centre vs own spread — if spread exceeds the
    // gap, the clusters interpenetrate and cannot read as separate bodies
    var worst=null, ratios=[];
    MIGS.forEach(function(m){
      var a=cents[m.id], best=1e9, who=null;
      MIGS.forEach(function(o){ if(o===m) return;
        var d=a.c.distanceTo(cents[o.id].c); if(d<best){best=d;who=o.id;} });
      var ratio=a.spread/Math.max(1,best);
      ratios.push(ratio);
      if(!worst||ratio>worst.ratio) worst={id:m.id, nearest:who, gap:+best.toFixed(1),
                                          spread:a.spread, ratio:+ratio.toFixed(2)};
    });
    out.sep={worst:worst, meanRatio:+(ratios.reduce(function(s,v){return s+v;},0)/ratios.length).toFixed(2),
             interpenetrating:ratios.filter(function(v){return v>0.5;}).length};
    // on-screen size of a representative of each kind, at the current camera
    var reps={mig:'philosophy', minor:'curiosity', writing:'b-kind'};
    Object.keys(reps).forEach(function(k){
      var n=byId[reps[k]]; if(!n||!n.pos) return;
      var d=camera.position.distanceTo(n.pos);
      var base=(n.t==='mig'?116:(n.t==='minor'?54:40));
      var px=base*(300/Math.max(1,d));
      /* the glyph only occupies part of its atlas cell, so the MARK is much
         smaller than the sprite */
      var fill=(n.t==='mig'?0.69:(n.t==='minor'?0.42:0.27));
      out.sizes[k]={dist:Math.round(d), spritePx:Math.round(px), markPx:Math.round(px*fill)};
    });
    out.visible=NODES.filter(function(n){return n.pos;}).length;
    return out;
  },
  /* the authoritative hierarchy, read from the live model */
  arch:function(){
    var migIds=MIGS.map(function(m){return m.id;});
    var rows=[].slice.call(document.querySelectorAll('#groups [data-nav]'))
               .map(function(b){ return b.getAttribute('data-nav'); });
    var owners={}, reparented=[], selfOwned=0;
    NODES.forEach(function(n){
      if(n.t==='mig'){ if(n.mig===n.id) selfOwned++; else reparented.push(n.id+'->'+n.mig); }
      owners[n.mig]=(owners[n.mig]||0)+1;
    });
    // does MY WORKS own anything that is not its own declared member?
    var mwOwns=(owned['my-works']||[]).slice();
    var mwOwnsAMig=mwOwns.filter(function(id){ return byId[id] && byId[id].t==='mig'; });
    return {
      migCount:MIGS.length, migIds:migIds,
      migsInMenu:migIds.filter(function(id){ return rows.indexOf(id)>=0; }).length,
      menuFirst:rows[0]||null,
      migsSelfOwned:selfOwned,            // every MIG is its own owner
      reparented:reparented,              // must stay empty
      myWorksOwnsMigs:mwOwnsAMig,         // must stay empty
      myWorksMembers:mwOwns.length,
      philosophyTopLevel:(byId['philosophy'] && byId['philosophy'].t==='mig' &&
                          byId['philosophy'].mig==='philosophy'),
      philosophyMembers:(owned['philosophy']||[]).length
    };
  },
  relVis:function(){
    if(!lineSeg) return null;
    var u=lineSeg.material.uniforms;
    return { globalMix:+u.globalMix.value.toFixed(4), focusRegion:u.focusRegion.value,
             focusMix:+u.focusMix.value.toFixed(4), hoverRegion:u.hoverRegion.value,
             hoverMix:+u.hoverMix.value.toFixed(4), mindOpen:+u.mindOpen.value.toFixed(4),
             camFromOrigin:+camPos.length().toFixed(1),
             camFromWorld:(state.region&&byId[state.region]&&byId[state.region].pos)?
               +camPos.distanceTo(byId[state.region].pos).toFixed(1):null,
             range:state.region?relRangeOf(state.region):null };
  },
  framing:function(mid){
    var b=worldBounds(mid);
    if(!b) return null;
    var pr=MIG_WORLD_PROFILE[mid]||{};
    var out={ id:mid, radius:+b.radius.toFixed(1), fit:+fitDistance(mid).toFixed(1),
              fitWhole:+fitDistance(mid,true).toFixed(1),
              worldType:pr.worldType||null,
              /* declared, not inferred: does this world's content move? */
              moves:(pr.worldType==='planetary'||pr.worldType==='circumbinary') };
    /* where every object of this world lands, and whether it is in the READABLE
       area rather than merely on screen */
    var W=renderer?renderer.domElement.clientWidth:0, H=renderer?renderer.domElement.clientHeight:0;
    var phone=window.innerWidth<768;
    /* THE SHEET IS MEASURED, NOT ASSUMED. It used to be described as 27% of
       the width, but it is a FIXED 380px panel: that fraction is right at
       1400px and badly wrong at 800, where the panel really takes 47%. A
       readable-area test that under-states the panel reports a world as
       readable while half of it sits underneath. The fractions remain as the
       fallback for when the sheet has not been laid out yet. */
    var shEl=document.getElementById('semantic');
    var shR=(shEl && shEl.getBoundingClientRect) ? shEl.getBoundingClientRect() : null;
    var safe={ x0:phone?8:Math.round(shR?shR.right+8:W*0.27), x1:W-8,
               y0:8, y1:phone?Math.round(shR?shR.top-8:H*0.40):H-8 };
    /* PRINCIPAL bodies are counted separately from everything else, because
       they are what the framing rule actually measures. A dense world's outer
       writings sit beyond its orbits by design and were never inside the
       approved frame — counting them would make a correct composition look
       like a failure, and padding the bar to accommodate them would make a
       real cropping bug invisible. So both numbers are reported and the
       assertions can hold each to its own standard. */
    var inSafe=0, total=0, off=0, pIn=0, pTotal=0, pOff=0;
    (owned[mid]||[]).concat([mid]).forEach(function(oid){
      var nd=byId[oid]; if(!nd||!nd.pos||!camera) return;
      var principal=(oid===mid) || nd.t==='minor' || nd.star!==undefined;
      total++; if(principal) pTotal++;
      var v=nd.pos.clone().project(camera);
      var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
      if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1){ off++; if(principal) pOff++; return; }
      if(px>=safe.x0&&px<=safe.x1&&py>=safe.y0&&py<=safe.y1){ inSafe++; if(principal) pIn++; }
    });
    out.total=total; out.inSafe=inSafe; out.offScreen=off; out.safe=safe;
    out.principal={ total:pTotal, inSafe:pIn, offScreen:pOff };
    /* WHICH principal bodies missed, so a failure names the object rather
       than reporting a ratio nobody can act on */
    out.principal.missed=[];
    (owned[mid]||[]).concat([mid]).forEach(function(oid){
      var nd=byId[oid]; if(!nd||!nd.pos||!camera) return;
      if(!((oid===mid)||nd.t==="minor"||nd.star!==undefined)) return;
      var v=nd.pos.clone().project(camera);
      var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
      var offs=(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1);
      if(offs || !(px>=safe.x0&&px<=safe.x1&&py>=safe.y0&&py<=safe.y1))
        out.principal.missed.push(oid+(offs?" (off screen)":" (behind the sheet)"));
    });
    out.centre=b.centre.toArray().map(function(v){return +v.toFixed(1);});
    out.camDist=camera?+camera.position.distanceTo(b.centre).toFixed(1):null;
    /* where the camera is HEADING, which is what the framing rule decided */
    out.wantDist=+wantPos.distanceTo(b.centre).toFixed(1);
    return out;
  },
  renders:function(){ return RENDERS; },
  /* the unfolding, from the inside. Exposed because the two bugs that made
     choosing a region show nothing were both invisible to every existing
     suite: they only appear with motion enabled and a laid-out viewport, and
     every check runs under reduced motion, which snaps. */
  morph:function(){
    return { on:MORPH_ON, from:+MORPH_FROM.toFixed(4), to:MORPH_TO,
             open:+mindOpen.toFixed(4), reduced:!!reduced };
  },
  /* Park a morph part-way, so the retarget can be tested against a KNOWN
     in-flight state. Headless cannot observe a real one: under a virtual time
     budget the browser fast-forwards timers straight past the whole 1150ms,
     so the morph is always either not started or already finished. This
     constructs the state under test rather than waiting to be lucky. */
  /* Snap the camera to wherever it is heading. Framing is a claim about the
     DESTINATION, and with motion enabled a flight does not advance inside a
     synchronous harness — so measuring the live camera measures where the
     journey started, and any assertion about arrival passes vacuously. */
  arrive:function(){
    camPos.copy(wantPos); camAim.copy(wantAim); FLIGHT_ON=false;
    if(camera){ camera.position.copy(camPos); camera.lookAt(camAim); }
    invalidate(6);
    return this.camera();
  },
  parkMorph:function(from,to){
    MORPH_FROM=from; MORPH_TO=to; MORPH_ON=true;
    morphStart=(performance&&performance.now)?performance.now():Date.now();
    morphT=0; setMindOpen(from); invalidate(4);
    return this.morph();
  },
  /* where the camera actually is, and where it is heading — so the TRAVEL
     between the mind and a world can be measured rather than described */
  camera:function(){
    return { pos:camPos.toArray().map(function(v){return +v.toFixed(1);}),
             aim:camAim.toArray().map(function(v){return +v.toFixed(1);}),
             want:wantPos.toArray().map(function(v){return +v.toFixed(1);}),
             distToWant:+camPos.distanceTo(wantPos).toFixed(1),
             flying:FLIGHT_ON, flightMs:Math.round(FLIGHT_MS),
             fov:camera?camera.fov:null,
             dolly:+dolly.toFixed(1) };
  },
  mind:function(){ return {open:+mindOpen.toFixed(4), morphing:MORPH_ON, entered:entered,
    mode:state.mode, region:state.region||null,
                           brainR:BRAIN_R}; },
  /* a harness control: land the morph immediately, so a measurement can be
     taken of a SETTLED scene rather than of one mid-flight */
  setOpen:function(v){
    MORPH_ON=false; morphStart=0; setMindOpen(v);
    /* re-frame: the whole-mind camera depends on the fold state, so forcing the
       fold without moving the camera leaves the scene outside the frustum */
    var f=frameFor(state.mode, state.region);
    wantPos.copy(f.p); wantAim.copy(f.a); camPos.copy(f.p); camAim.copy(f.a);
    invalidate(30);
    return mindOpen;
  },
  /* THE DRAWING — measured, not described. */
  organ:function(){
    var o={ exists:true, isMesh:false, drawCalls:0 };
    var curves=buildBrainCurves(BRAIN_VIEW, window.innerWidth<768?0.5:1);
    /* A CONSTELLATION IS STARS AND SEGMENTS, so it is described as such.

       This used to report 122 "curves" all called 'seg' — the number of line
       segments, which tells you nothing: a cage, a cloud and a brain would all
       give the same number. What the drawing consists of is a set of NAMED
       chains, each a real anatomical boundary, drawn between stars. */
    o.segments=curves.length;
    o.stars=BRAIN_STARS.length;
    o.chains=BRAIN_CHAINS.map(function(c){ return c.id; });
    o.chainStars={}; BRAIN_CHAINS.forEach(function(c){ o.chainStars[c.id]=c.stars; });
    o.curves=BRAIN_CHAINS.length;
    o.named=o.chains;
    /* the drawing's own extent, and how much of it is DEPTH — a flat drawing
       pinned to a plane would have none */
    var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
    var near=0,far=0,minAbsX=1e9,pts=0;
    /* measured over the STARS, each counted once. Walking the segments counts
       every star twice, and once more for each extra line meeting at it, which
       silently weights the reading by how connected a place happens to be. */
    BRAIN_STARS.forEach(function(p){
      pts++;
      if(p.x<mnx)mnx=p.x; if(p.x>mxx)mxx=p.x;
      if(p.y<mny)mny=p.y; if(p.y>mxy)mxy=p.y;
      if(p.z<mnz)mnz=p.z; if(p.z>mxz)mxz=p.z;
      if(p.x>0)near++; else far++;
      if(Math.abs(p.x)<minAbsX) minAbsX=Math.abs(p.x);
    });
    o.points=pts;
    o.bbox={ w:+(mxx-mnx).toFixed(1), h:+(mxy-mny).toFixed(1), d:+(mxz-mnz).toFixed(1) };
    /* a curve set that sits on a plane has zero spread on one axis; this one
       wraps a form, so every axis carries extent */
    o.depthSpread=+((mxx-mnx)/Math.max(1,mxz-mnz)).toFixed(3);
    o.hemispheres={ near:near, far:far };
    o.midlineGap=+(minAbsX*2).toFixed(2);

    /* the outline, read back from the same table the shell uses */
    var prof=[], N=72;
    for(var k=0;k<N;k++) prof.push(+brainRadius(k/N*6.283185).toFixed(4));
    o.profile=prof;
    var mins=[], maxs=[];
    for(var j=0;j<N;j++){
      var pa=prof[(j-1+N)%N], pb=prof[j], pc=prof[(j+1)%N];
      if(pb<pa && pb<=pc) mins.push(+(j/N*360).toFixed(0));
      if(pb>pa && pb>=pc) maxs.push(+(j/N*360).toFixed(0));
    }
    o.minimaAt=mins; o.maximaAt=maxs;
    var A=0,B=0;
    for(var q=0;q<N;q++){ var t=q/N*6.283185;
      A=Math.max(A,Math.abs(prof[q]*Math.cos(t))); B=Math.max(B,Math.abs(prof[q]*Math.sin(t))); }
    var dev=0;
    for(var q2=0;q2<N;q2++){ var t2=q2/N*6.283185;
      var e=1/Math.sqrt(Math.pow(Math.cos(t2)/A,2)+Math.pow(Math.sin(t2)/B,2));
      dev=Math.max(dev, Math.abs(prof[q2]-e)/e); }
    o.ellipseDeviation=+dev.toFixed(3);

    /* where each named region of the drawing actually lands on the face, so a
       check can prove the temporal, frontal and cerebellar marks exist WHERE
       they are claimed to rather than merely existing */
    o.spans={};
    BRAIN_CHAINS.forEach(function(c){ o.spans[c.id]={u:c.u, v:c.v}; });

    if(camera){
      var dir=camera.position.clone().sub(camAim).normalize();
      o.lateralDeg=+(Math.acos(Math.max(-1,Math.min(1,Math.abs(dir.x))))*180/Math.PI).toFixed(1);
      o.viewDeclared=+(Math.acos(Math.abs(BRAIN_VIEW.x))*180/Math.PI).toFixed(1);
    }
    if(camera && renderer){
      var W=renderer.domElement.clientWidth, H=renderer.domElement.clientHeight;
      var xs=[],ys=[],off=0,samp=0;
      curves.forEach(function(c){
        for(var i=0;i<c.pts.length;i+=3){
          var v=c.pts[i].clone().project(camera);
          var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
          xs.push(px); ys.push(py); samp++;
          if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1) off++;
        }
      });
      var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
      var y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
      o.frame={ w:W, h:H, offScreen:off, samples:samp,
                x0:Math.round(x0), x1:Math.round(x1), y0:Math.round(y0), y1:Math.round(y1),
                fillsW:+((x1-x0)/W).toFixed(3), fillsH:+((y1-y0)/H).toFixed(3) };
      var phone=window.innerWidth<768;
      var rx0=phone?0:Math.round(W*0.26);
      o.frame.inReadable=(x0>=rx0-4 && x1<=W+4 && y0>=-4 && y1<=H+4);
      o.frame.margin=Math.round(Math.min(x0-rx0, y0, W-x1, H-y1));
    }
    o.staging={ dim:+WELCOME_DIM.toFixed(3), ask:+BRAIN_ASK.toFixed(3),
                open:+mindOpen.toFixed(3) };
    /* the anatomy shares the buffer the relationships use, so the two are
       counted separately to prove they are separate LAYERS rather than one
       undifferentiated pile of segments */
    o.anatomyLineVerts=(typeof GYRI_COUNT==='number')?GYRI_COUNT:-1;
    o.graphLineVerts=(typeof LINKS!=='undefined' && LINKS.length)?LINKS.length:0;
    /* the real proof of separation: read the LINE BUFFER ITSELF and split it
       by the kind attribute. Anatomy is kind >= 2 and carries home = -1;
       a relationship is kind < 2 and carries the region it belongs to. If the
       two ever collapsed into one class this would show it. */
    if(lineSeg && lineSeg.geometry.attributes.kind){
      var ka=lineSeg.geometry.attributes.kind, ha=lineSeg.geometry.attributes.home;
      var anat=0, graph=0, mixed=0;
      for(var z=0;z<ka.count;z++){
        var kk=ka.getX(z), hh=ha.getX(z);
        /* a cross-region relationship legitimately has no single home, so
           only the reverse is a violation: an anatomical curve claiming to
           belong to a region would mean the two layers had merged. */
        if(kk>=1.5){ anat++; if(hh>-0.5) mixed++; }
        else graph++;
      }
      o.buffer={ anatomy:anat, graph:graph, mixed:mixed };
    }
    return o;
  },
  brain:function(){
    var out={ radius:BRAIN_R, nodes:[], links:0, midlineGap:null };
    MIGS.forEach(function(m){
      if(!m.bPos) return;
      out.nodes.push({ id:m.id, label:m.label,
                       b:m.bPos.toArray().map(function(v){return +v.toFixed(2);}),
                       u:m.uPos?m.uPos.toArray().map(function(v){return +v.toFixed(2);}):null });
    });
    out.links=LINKS.filter(function(l){ return byId[l.a].mig!==byId[l.b].mig; }).length;
    var xs=out.nodes.map(function(o){ return Math.abs(o.b[0]); });
    out.midlineGap=+Math.min.apply(null,xs).toFixed(2);
    var bx=out.nodes.map(function(o){return o.b[0];}),
        by=out.nodes.map(function(o){return o.b[1];}),
        bz=out.nodes.map(function(o){return o.b[2];});
    out.extent={ w:+(Math.max.apply(null,bx)-Math.min.apply(null,bx)).toFixed(1),
                 h:+(Math.max.apply(null,by)-Math.min.apply(null,by)).toFixed(1),
                 d:+(Math.max.apply(null,bz)-Math.min.apply(null,bz)).toFixed(1) };
    if(camera && renderer){
      var W2=renderer.domElement.clientWidth, H2=renderer.domElement.clientHeight;
      var xs2=[], ys2=[], off=0;
      MIGS.forEach(function(m){
        if(!m.bPos) return;
        var v=m.bPos.clone().project(camera);
        var px=(v.x*0.5+0.5)*W2, py=(-v.y*0.5+0.5)*H2;
        xs2.push(px); ys2.push(py);
        if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1) off++;
      });
      out.frame={ w:W2, h:H2, offScreen:off,
                  x0:Math.round(Math.min.apply(null,xs2)), x1:Math.round(Math.max.apply(null,xs2)),
                  y0:Math.round(Math.min.apply(null,ys2)), y1:Math.round(Math.max.apply(null,ys2)) };
      out.frame.margin=Math.round(Math.min(out.frame.x0, out.frame.y0,
                                           W2-out.frame.x1, H2-out.frame.y1));
      out.frame.fillsW=+((out.frame.x1-out.frame.x0)/W2).toFixed(3);
      out.frame.fillsH=+((out.frame.y1-out.frame.y0)/H2).toFixed(3);
    }
    /* the ORGAN's own proportions, sampled from the shell. The MIG cloud sits
       inside it at 0.68x and does not sample the surface uniformly, so its
       bounding box is not the brain's shape. */
    (function(){
      var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
      for(var i=0;i<48;i++) for(var j=0;j<96;j++){
        var th=Math.acos(1-2*(i+0.5)/48), ph=(j/96)*6.2832;
        var p=brainShell(new THREE.Vector3(Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph)));
        if(p.x<mnx)mnx=p.x; if(p.x>mxx)mxx=p.x;
        if(p.y<mny)mny=p.y; if(p.y>mxy)mxy=p.y;
        if(p.z<mnz)mnz=p.z; if(p.z>mxz)mxz=p.z;
      }
      out.shell={ w:+(mxx-mnx).toFixed(1), h:+(mxy-mny).toFixed(1), d:+(mxz-mnz).toFixed(1) };
    })();
    out.left=bx.filter(function(v){return v<0;}).length;
    out.right=bx.filter(function(v){return v>0;}).length;
    return out;
  },
  overlay:function(){
    var out={ relabel:[], added:[], migCount:MIGS.length, migs:MIGS.map(function(m){
      return {id:m.id, label:m.label, added:!!m.v02Added, empty:!!m.v02Empty,
              owns:(owned[m.id]||[]).length}; }) };
    V02_OVERLAY.relabel.forEach(function(r){
      var m=byId[r.id];
      out.relabel.push({ id:r.id, from:r.from, observedFrom:r.observedFrom||null,
                         to:r.to, nowLabel:m?m.label:null,
                         owns:(owned[r.id]||[]).length });
    });
    V02_OVERLAY.addMIGs.forEach(function(a){
      var m=byId[a.id];
      out.added.push({ id:a.id, label:m?m.label:null, empty:!!a.empty,
                       owns:(owned[a.id]||[]).length, conflict:a.conflict||null });
    });
    out.renamed=(V02_OVERLAY.renameIds||[]).map(function(rn){
      var o=byId[rn.to];
      return { from:rn.from, to:rn.to, moved:rn.movedObjects||0,
               /* the old id is legitimately reused by the MIG, so what matters is
                  that it no longer points at the CONCEPT */
               oldIdHeldBy:byId[rn.from]?byId[rn.from].t:null,
               label:o?o.label:null, ownedBy:o?o.mig:null, type:o?o.t:null,
               edges:LINKS.filter(function(l){ return l.a===rn.to||l.b===rn.to; }).length };
    });
    /* the object the rename is about, so a check can prove it did not move */
    var p=byId['psychology-behaviour'];
    out.existingPsychologyConcept = p ? {id:p.id, label:p.label, ownedBy:p.mig, type:p.t} : null;
    return out;
  },
  worlds:function(){
    var out={profiles:{}, types:{}, migs:MIGS.length};
    MIGS.forEach(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      out.profiles[m.id]=p||null;
      if(p && typeof p.worldType==='string')
        out.types[p.worldType]=(out.types[p.worldType]||0)+1;
    });
    out.validTypes=WORLD_TYPES;
    /* a profile that exists but names no worldType IS the silent fallback */
    out.undeclared=MIGS.filter(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      return !p || typeof p.worldType!=='string';
    }).map(function(m){return m.id;});
    return out;
  },
  species:function(){
    var out={};
    MIGS.forEach(function(m){
      var v=MIG_VISUAL[m.id], order=Object.keys(MIG_VISUAL).indexOf(m.id);
      out[m.id]={hasProfile:!!v, family:v?v.family:null,
                 cell:order>=0?GLYPHS.length+order:null,
                 generic:!v, params:v||null};
    });
    return {profiles:out, families:Object.keys(MIG_VISUAL).map(function(k){return MIG_VISUAL[k].family;}),
            atlasCells:ATLAS*ATLAS, used:GLYPHS.length+Object.keys(MIG_VISUAL).length,
            textures:1, sharedMaterial:true};
  },
  counts:function(){
    var out={};
    MIGS.forEach(function(m){
      var mem=owned[m.id]||[];
      out[m.id]={ minors:mem.filter(function(id){return byId[id].t==='minor';}).length,
                  writings:mem.filter(function(id){return byId[id].src;}).length,
                  members:mem.length };
    });
    return out;
  },
  menuRows:function(){
    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){
      var s=b.querySelector('.src'), mt=b.querySelector('.meta');
      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\s+/g,' ').trim(),
               source:s?s.textContent:null, meta:mt?mt.textContent:null,
               aria:b.getAttribute('aria-label')||null,
               expected:sourceLabelOf(b.getAttribute('data-nav')) };
    });
  },
  constellation:function(mid){
    mid=mid||'observation';
    var k=CONSTELLATIONS[mid]; if(!k) return null;
    var map={}, stars=[];
    Object.keys(k.map).forEach(function(id){
      var nd=byId[id];
      map[id]=k.map[id];
      stars.push({ id:id, star:k.map[id], kind:nd.t, mig:nd.mig, vMag:nd.starV, ly:nd.starLy,
                   offAsterism:!!nd.offAsterism,
                   pos:nd.pos?nd.pos.toArray().map(function(v){return +v.toFixed(2);}):null,
                   inGraph:!!byId[id] });
    });
    /* depth along the figure's own axis, so ordering can be compared with the
       measured distances rather than with screen space */
    var c=byId[mid].pos;
    stars.forEach(function(s){
      if(!s.pos) return;
      var p=new THREE.Vector3(s.pos[0],s.pos[1],s.pos[2]).sub(c);
      s.depth=+(-p.dot(k.frame.w)/CONST_SCALE).toFixed(3);
    });
    var bg=CONST_BG.filter(function(b){ return b.mig===mid; });
    return {
      system:MIG_CONSTELLATION[mid],
      source:(k.data._source||null), retrieved:(k.data._retrieved||null),
      scale:CONST_SCALE,
      depthExaggeration:null,      // none applied: the figure is 0.90x as deep as wide
      meanDistanceLy:k.meanDistanceLy,
      chain:k.chain, lone:k.lone, order:k.order, offAsterism:k.offAsterism,
      map:map, stars:stars,
      internalEdges:k.internal.map(function(l){ return {a:l.a,b:l.b,verb:l.verb}; }),
      background:{ count:bg.length,
                   inGraph:bg.filter(function(b){ return !!byId['bg-'+b.vMag]; }).length,
                   maxSize:Math.max.apply(null,bg.map(function(b){ return b.vMag; })) },
      renderedPoints:pts?pts.geometry.attributes.position.count:0,
      graphNodes:NODES.length,
      companions:COMPANIONS.length,
      migBodyDrawn:(function(){
        if(!pts) return null;
        var i=nodeIndex[mid];
        return i===undefined?null:pts.geometry.attributes.emph.array[i];
      })(),
      palette:MIG_PALETTE[mid]||null
    };
  },
  binaryProfile:function(mid){
    if(!glOK||!BINARY[mid]) return null;
    var b=BINARY[mid], A=byId[mid], iB=STARB_INDEX[mid];
    if(!A||!A.pos||iB===undefined||!pts) return null;
    var arr=pts.geometry.attributes.position.array;
    var pB=new THREE.Vector3(arr[iB*3],arr[iB*3+1],arr[iB*3+2]);
    var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
    function sc(p){ var v=p.clone().project(camera);
      return {x:(v.x*0.5+0.5)*w, y:(-v.y*0.5+0.5)*h}; }
    var a=sc(A.pos), c=sc(pB);
    var g=renderer.getContext(), ratio=renderer.getPixelRatio();
    var cw=renderer.domElement.width, ch=renderer.domElement.height;
    /* walk from a little before A to a little past B */
    var N=121, out=[], EXT=0.22;
    for(var i=0;i<N;i++){
      var t=-EXT+(1+2*EXT)*(i/(N-1));
      var px=Math.round((a.x+(c.x-a.x)*t)*ratio);
      var py=Math.round((a.y+(c.y-a.y)*t)*ratio);
      if(px<0||py<0||px>=cw||py>=ch){ out.push(0); continue; }
      var buf=new Uint8Array(4);
      g.readPixels(px, ch-py, 1, 1, g.RGBA, g.UNSIGNED_BYTE, buf);
      /* contrast against the GROUND, like every other probe. On the old pale
         page a body was darker than its surroundings; on a night sky it is
         brighter, and 255-luminance measures the sky instead — which made the
         profile between two stars read as bright as the stars themselves. */
      var lum=buf[0]*0.299+buf[1]*0.587+buf[2]*0.114;
      out.push(Math.round(Math.max(0, lum-(GROUND.r*0.299+GROUND.g*0.587+GROUND.b*0.114)*255)));
    }
    /* the two stars sit at t=0 and t=1 of the walk */
    var iA=Math.round((0+EXT)/(1+2*EXT)*(N-1));
    var iBx=Math.round((1+EXT)/(1+2*EXT)*(N-1));
    function localMax(c0){ var m=0;
      for(var k=Math.max(0,c0-7);k<=Math.min(N-1,c0+7);k++) if(out[k]>m) m=out[k];
      return m; }
    var peakA=localMax(iA), peakB=localMax(iBx), trough=1e9;
    for(var q=iA+8;q<=iBx-8;q++) if(out[q]<trough) trough=out[q];
    if(trough===1e9) trough=Math.min(peakA,peakB);
    return { samples:out, peakA:peakA, peakB:peakB, trough:trough,
             sepPx:Math.round(Math.sqrt(Math.pow(a.x-c.x,2)+Math.pow(a.y-c.y,2))),
             /* separated when the dip falls well below the weaker star */
             separated:(trough < Math.min(peakA,peakB)*0.62),
             bothVisible:(peakA>18 && peakB>18) };
  },
  binary:function(){
    var out={worlds:{}};
    Object.keys(BINARY).forEach(function(mid){
      var b=BINARY[mid]; if(!b.centre) return;
      var A=byId[mid], iB=STARB_INDEX[mid];
      var pB=null;
      if(pts&&iB!==undefined){
        var a=pts.geometry.attributes.position.array;
        pB=new THREE.Vector3(a[iB*3],a[iB*3+1],a[iB*3+2]);
      }
      function proj(p){
        if(!p||!camera) return null;
        var v=p.clone().project(camera);
        var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
        return {x:Math.round((v.x*0.5+0.5)*w), y:Math.round((-v.y*0.5+0.5)*h),
                onScreen:(v.z<1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1),
                dist:+camera.position.distanceTo(p).toFixed(1)};
      }
      var sepScene=(A&&A.pos&&pB)? +A.pos.distanceTo(pB).toFixed(3) : null;
      var pa=proj(A&&A.pos), pb=proj(pB), pc=proj(b.centre);
      out.worlds[mid]={
        system:MIG_SYSTEM[mid],
        barycentre:b.centre.toArray().map(function(v){return +v.toFixed(2);}),
        starA:A&&A.pos?A.pos.toArray().map(function(v){return +v.toFixed(2);}):null,
        starB:pB?pB.toArray().map(function(v){return +v.toFixed(2);}):null,
        rA:+b.rA.toFixed(3), rB:+b.rB.toFixed(3), aBin:+b.aBin.toFixed(3),
        ecc:b.ecc, eccMeasured:b.eccMeasured,
        stability:+b.stability.toFixed(3),
        sizeRatio:+b.sizeRatio.toFixed(4),
        /* the defining property: A and B are always on OPPOSITE sides of the
           barycentre, and their distances hold the measured mass ratio */
        offA:A&&A.pos?+A.pos.distanceTo(b.centre).toFixed(3):null,
        offB:pB?+pB.distanceTo(b.centre).toFixed(3):null,
        oppositeDeg:(function(){
          if(!A||!A.pos||!pB) return null;
          var va=new THREE.Vector3().subVectors(A.pos,b.centre).normalize();
          var vb=new THREE.Vector3().subVectors(pB,b.centre).normalize();
          return +(Math.acos(Math.max(-1,Math.min(1,va.dot(vb))))*180/Math.PI).toFixed(2);
        })(),
        separationScene:sepScene,
        projA:pa, projB:pb, projBary:pc,
        sepPx:(pa&&pb)? Math.round(Math.sqrt(Math.pow(pa.x-pb.x,2)+Math.pow(pa.y-pb.y,2))) : null,
        starBIsGraphNode:!!byId[mid+'-starB'],
        companionCount:COMPANIONS.filter(function(c){return c.mig===mid;}).length,
        orbitRadii:(ORBITS[mid]||[]).map(function(o){ return +o.r.toFixed(3); }),
        conceptCount:(ORBITS[mid]||[]).length
      };
    });
    out.totalCompanions=COMPANIONS.length;
    out.renderOnly=COMPANIONS.length+CONST_BG.length;   // every body that is not an idea
    out.graphNodes=NODES.length;
    out.renderedPoints=pts?pts.geometry.attributes.position.count:0;
    return out;
  },
  astro:function(){
    var out={assigned:{}, orbits:{}, dataset:{systems:(ASTRO_DATA.systems||[]).length,
             source:ASTRO_DATA._sourceType||null, retrieved:ASTRO_DATA._retrieved||null}};
    Object.keys(MIG_SYSTEM).forEach(function(mid){
      var tpl=templateFor(mid);
      out.assigned[mid]=tpl?{system:tpl.system, planets:tpl.planetCount,
        axes:tpl.semiMajorAxisAU, confidence:tpl.confidence, sourceType:tpl.sourceType}:null;
    });
    Object.keys(ORBITS).forEach(function(mid){
      var centre=byId[mid].pos;
      out.orbits[mid]=ORBITS[mid].map(function(sl){
        var n=byId[sl.id];
        return {id:sl.id, slot:sl.slot, r:+sl.r.toFixed(3),
                mig:n.mig, t:n.t,
                dist:+centre.distanceTo(n.pos).toFixed(3)};
      });
    });
    out.orbitLineObject=!!orbitLines;
    return out;
  },
  /* what is ACTUALLY within a radius of a node — used to settle whether a
     visual cluster is real geometry or a rendering artefact */
  near:function(id,rad){
    var c=byId[id]; if(!c||!c.pos) return null;
    var out=[];
    NODES.forEach(function(n){
      if(!n.pos||n.id===id) return;
      var d=c.pos.distanceTo(n.pos);
      if(d<=rad) out.push({id:n.id,t:n.t,mig:n.mig,d:+d.toFixed(2)});
    });
    out.sort(function(a,b){return a.d-b.d;});
    return {of:id, radius:rad, count:out.length, items:out.slice(0,14),
            selfPos:c.pos.toArray().map(function(v){return +v.toFixed(1);})};
  },
  /* how many separate bright blobs live in one atlas cell? A single body
     should be exactly one. More than one means the sprite is showing several
     forms at once, which is what an on-screen "cluster" would really be. */
  atlasStats:function(name){
    if(!ATLAS_CANVAS) return null;
    var i=GLYPHS.indexOf(name);
    if(i<0){ var k=Object.keys(MIG_VISUAL).indexOf(name); if(k<0) return null; i=GLYPHS.length+k; }
    var cx=(i%ATLAS)*CELL, cy=Math.floor(i/ATLAS)*CELL;
    var g=ATLAS_CANVAS.getContext('2d');
    var d=g.getImageData(cx,cy,CELL,CELL).data;
    // count local maxima of alpha on a coarse grid — blob count, not noise
    var STEP=4, peaks=0, maxA=0, lit=0;
    function A(x,y){ if(x<0||y<0||x>=CELL||y>=CELL) return 0; return d[(y*CELL+x)*4+3]; }
    for(var y=STEP;y<CELL-STEP;y+=STEP) for(var x=STEP;x<CELL-STEP;x+=STEP){
      var a=A(x,y); if(a>maxA) maxA=a; if(a>24) lit++;
      if(a<90) continue;
      var isPeak=true;
      for(var dy=-STEP;dy<=STEP&&isPeak;dy+=STEP) for(var dx=-STEP;dx<=STEP;dx+=STEP){
        if(!dx&&!dy) continue;
        if(A(x+dx,y+dy)>a){ isPeak=false; break; }
      }
      if(isPeak) peaks++;
    }
    return {cell:i, col:i%ATLAS, row:Math.floor(i/ATLAS), peaks:peaks, maxAlpha:maxA, litSamples:lit};
  },
  /* What did this concept ACTUALLY draw on screen? atlasStats reads the
     canvas and so never goes through the texture — it cannot see a sampling
     fault like flipY, which silently handed every concept FOOD's eight-body
     cluster. This reads the framebuffer where the concept really landed and
     counts the separate bright blobs there. Rendered truth, not source truth. */
  spriteBlobs:function(id,box){
    if(!glOK) return null;
    var pr=this.project(id); if(!pr||!pr.onScreen) return null;
    var B=box||150, g=renderer.getContext();
    var cw=renderer.domElement.width, ch=renderer.domElement.height;
    var ratio=renderer.getPixelRatio();
    var px=Math.round(pr.x*ratio), py=Math.round(pr.y*ratio);
    var x0=Math.max(0,px-B/2), y0=Math.max(0,ch-py-B/2);
    var w=Math.min(B,cw-x0), h=Math.min(B,ch-y0);
    if(w<8||h<8) return null;
    var buf=new Uint8Array(w*h*4);
    g.readPixels(x0,y0,w,h,g.RGBA,g.UNSIGNED_BYTE,buf);
    /* CONTRAST AGAINST THE GROUND, whichever way the ground runs.

       This used to return 255 minus luminance, because the page was near-white
       and a body was darker than what surrounded it. The page is deep space
       now, so that expression measures the SKY: every probe came back at 248
       and nine assertions across four suites failed at once while the feature
       they tested was working perfectly.

       GROUND_LUM is read from the scene's own clear colour, so this cannot
       drift out of step with the palette again. */
    var GROUND_LUM=(GROUND.r*0.299+GROUND.g*0.587+GROUND.b*0.114)*255;
    function dark(x,y){
      if(x<0||y<0||x>=w||y>=h) return 0;
      var i=(y*w+x)*4;
      var lum=buf[i]*0.299+buf[i+1]*0.587+buf[i+2]*0.114;
      return Math.max(0, lum-GROUND_LUM);
    }
    /* CONNECTED COMPONENTS, not local maxima. A soft radial body has dozens
       of tiny maxima from gradient dithering, so peak-counting reports a
       single star as forty. What actually distinguishes one body from eight
       is how many SEPARATE regions of ink exist. */
    var STEP=3, gw=Math.floor(w/STEP), gh=Math.floor(h/STEP), maxD=0;
    var grid=new Uint8Array(gw*gh);
    for(var gy=0;gy<gh;gy++) for(var gx=0;gx<gw;gx++){
      var d=dark(gx*STEP,gy*STEP); if(d>maxD) maxD=d;
      grid[gy*gw+gx]=d;
    }
    /* DOMINANCE, not a component count. Counting regions is fragile: a soft
       edge fragments at any fixed contour and a passing orbit ring adds one.
       What actually separates "one body" from "eight dots" is how much of the
       ink the LARGEST region holds — near all of it, or roughly an eighth. */
    var thr=Math.max(10,maxD*0.34), seen=new Uint8Array(gw*gh), blobs=0;
    var total=0, largest=0;
    for(var t2=0;t2<grid.length;t2++) if(grid[t2]>=thr) total++;
    for(var i2=0;i2<grid.length;i2++){
      if(seen[i2]||grid[i2]<thr) continue;
      blobs++;
      var area=0, stack=[i2]; seen[i2]=1;
      while(stack.length){
        var c2=stack.pop(), cx2=c2%gw, cy2=(c2-cx2)/gw;
        area++;
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(dd){
          var nx=cx2+dd[0], ny=cy2+dd[1];
          if(nx<0||ny<0||nx>=gw||ny>=gh) return;
          var ni=ny*gw+nx;
          if(seen[ni]||grid[ni]<thr) return;
          seen[ni]=1; stack.push(ni);
        });
      }
      if(area>largest) largest=area;
    }
    var dominance = total? largest/total : 0;
    /* TOTAL light in the neighbourhood, as well as the peak.

       The peak alone stopped being a usable measure of "did this brighten"
       once the mind became a constellation: a bright star of the figure sits
       near enough to most regions to pin the maximum, so hovering a MIG raised
       its sprite while the reported peak never moved. Summing the signal is
       monotone in the sprite's own contribution whatever else shares the box. */
    var sum=0;
    for(var s3=0;s3<grid.length;s3++) sum+=grid[s3];
    /* MEAN COLOUR of the brightest ink, so a suite can ask whether an emblem
       kept its hue and not merely whether it got brighter. Lifting a region
       toward white would raise every signal above and still be a regression:
       fifteen identical pale dots carry no identity. Only pixels at or above
       the same threshold the blob pass uses contribute, so the surrounding
       sky cannot drag the reading toward grey. */
    var rs=0,gs=0,bs=0,cn=0;
    for(var cy3=0;cy3<gh;cy3++) for(var cx3=0;cx3<gw;cx3++){
      if(grid[cy3*gw+cx3]<thr) continue;
      var i3=((cy3*STEP)*w+(cx3*STEP))*4;
      rs+=buf[i3]; gs+=buf[i3+1]; bs+=buf[i3+2]; cn++;
    }
    var rgb = cn ? [Math.round(rs/cn),Math.round(gs/cn),Math.round(bs/cn)] : [0,0,0];
    var mx=Math.max(rgb[0],rgb[1],rgb[2]), mn=Math.min(rgb[0],rgb[1],rgb[2]);
    return {id:id, box:B, blobs:blobs, dominance:+dominance.toFixed(2),
            maxSignal:Math.round(maxD),
            sumSignal:Math.round(sum/100),
            rgb:rgb, chroma:mx-mn,
            at:[pr.x,pr.y]};
  },
  /* THE ATLAS SAMPLING CONTRACT. A13 measures whether a concept renders as
     one body, but it cannot separate a MERGED cluster from a single star —
     FOOD's eight cores overlap at any sane ink threshold. The defect that
     actually shipped was an orientation fault, so pin the orientation itself:
     flipY off, and gl_PointCoord used un-inverted. Those two facts together
     are exactly the contract that broke. */
  atlasContract:function(){
    if(!pts) return null;
    var t=pts.material.uniforms.atlas.value;
    var vs=pts.material.vertexShader||'', fs=pts.material.fragmentShader||'';
    var src=vs+fs;
    return {
      flipY: t? t.flipY : null,
      mipmaps: t? t.generateMipmaps : null,
      uvExpression: (src.match(/vec2 uv=\(vCell[^;]*/)||[''])[0].trim(),
      uvInverted: /1\.0-gl_PointCoord\.y/.test(src),
      cells: pts.material.uniforms.cells.value
    };
  },
  /* the relationship verbs, as actually rendered. They are the reasoning of
     the whole site, and a field-name slip printed "UNDEFINED" everywhere while
     every geometric assertion stayed green. */
  verbs:function(){
    var out=[].slice.call(document.querySelectorAll('.verb')).map(function(e){
      return (e.textContent||'').trim();
    });
    return {total:out.length,
            broken:out.filter(function(v){ return !v||/^undefined$/i.test(v); }).length,
            sample:out.slice(0,6)};
  },
  dom:function(){ return {focusable:document.querySelectorAll('button,[tabindex]:not([tabindex="-1"]),a[href]').length,
    navRows:document.querySelectorAll('[data-nav]').length,
    where:elWhere.textContent, tier:elTier.textContent,
    canvasHidden:document.getElementById('gl').getAttribute('aria-hidden')==='true'}; }
};

/* ── THE THRESHOLD ────────────────────────────────────────────────────
   A moment of arrival. It states only what is actually in the graph — the
   counts are read, never written — and hands over one control. Entering
   dissolves it rather than navigating, so the universe behind is continuous
   with the universe after. */
var threshold=document.getElementById('threshold'), enterBtn=document.getElementById('enterBtn');
var worksBtn=document.getElementById('worksBtn');
/* the second door. NOT the future My Works experience — it opens the mind and
   travels to ART, so both paths exist without a second project corpus. */
if(worksBtn) worksBtn.addEventListener('click',function(){
  enterMind();
  travelTo('region','my-works');
});
var crossCount=LINKS.filter(function(l){return byId[l.a].mig!==byId[l.b].mig;}).length;
document.getElementById('thFacts').textContent=
  MIGS.length+' regions of thinking. '+NODES.length+' objects, '+LINKS.length+
  ' relationships between them — '+crossCount+' of which cross from one region into another.';
var entered=false;
function enterMind(){
  if(entered) return; entered=true;
  document.body.classList.add('entered');
  threshold.classList.add('gone');
  threshold.setAttribute('aria-hidden','true');
  /* Entering does NOT expand the mind. The brain IS the menu: you look at the
     whole organ, point at a region to identify it, and the mind unfolds only
     when you choose one. */
  state.mode='universe'; state.region=null; state.focus=null;
  var uf=frameFor('universe');
  wantPos.copy(uf.p); wantAim.copy(uf.a);
  invalidate(200);
  paintDOM();
  setTimeout(function(){ var f=document.querySelector('#groups [data-nav]'); if(f) f.focus(); },
             (reduced?0:540));
  say('You are in the mind. '+MIGS.length+' regions.');
}
enterBtn.addEventListener('click',enterMind);
window.__v02.enter=enterMind;
window.__v02.atThreshold=function(){ return !entered; };

/* boot straight to a state, for capture: #focus:<id>  #read:<id>  #lite */
(function boot(){
  var h=decodeURIComponent(location.hash.slice(1));
  if(!h) return;
  if(!/^lite$/.test(h)) enterMind();   // a deep link lands inside, not at the door
  h.split('&').forEach(function(part){
    var m=part.split(':'), kind=m.shift();
    if(kind==='focus'&&m[0]){
      var n=byId[m[0]]; if(!n) return;
      travelTo(n.t==='mig'?'region':'concept', m[0], false);
    } else if(kind==='hover'&&m[0]){
      var hid=m[0];
      setTimeout(function(){ highlightMIG(hid); },0);   // after the arrival focus
    } else if(kind==='read'&&m[0]){
      var w=byId[m[0]]; if(!w) return;
      travelTo('concept', w.id, false); openReader(m[0]);
    }
  });
  if(glOK&&(LITE||reduced)) step();
})();
