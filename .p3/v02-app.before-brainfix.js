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
var MIG_SYSTEM={ 'philosophy':'TRAPPIST-1', 'love':'Kepler-16' };
function templateFor(migId){ return ASTRO[MIG_SYSTEM[migId]]||null; }

var ORBIT_R0=13;                     // the innermost orbit, in scene units
var SYS_TILT=0.42;                   // one shared viewing tilt, ~24 degrees

/* Scene units per world are a MAP SCALE, not a measurement. What the astronomy
   fixes is the ratios inside a world, and that is what the checks pin.
   Kepler-16 needs a larger scale for one reason: its two stars have to resolve
   as two. */
var WORLD_SCALE={ 'philosophy':13, 'love':52 };
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
MIGS.forEach(function(m){
  if(!m.uPos) return;
  m.bPos=brainShell(m.uPos.clone().normalize());
});
var BRAIN_SPREAD=0.46;
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

var PHIL_VARIANTS={
  a:{ name:'cobalt + indigo',
      fog:0xa8b6d4, star:0x1b2f6b, body:0x35508f, orbit:0x3c5ba9, accent:0x2b4fa8 },
  b:{ name:'electric blue + violet',
      fog:0xb2b0da, star:0x2a1f6e, body:0x4741a3, orbit:0x5a4fc0, accent:0x5136c9 },
  c:{ name:'deep navy depth + cyan/violet',
      fog:0x9fb4c8, star:0x0f2340, body:0x2d5f7a, orbit:0x2f6f8f, accent:0x1d7fa8 }
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
    var arrive = kon ? (CONST_DATA.derived.meanDistanceLy*CONST_SCALE)
               : (type==='circumbinary') ? 2.5*scaleFor(m.id)*0.70+2.5*scaleFor(m.id)*0.42
               : (type==='planetary') ? 115
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
      labelStyle: type==='constellation' ? {minor:470, writing:190} : {minor:160, writing:80},
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
var GROUND=new THREE.Color(0xfbfcfd), FAR_TONE=new THREE.Color(0xc9d3dc);
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
var LINE_WALK=null, RENDER_ONLY=[];
var BIN_KEYS=Object.keys(BINARY), STARB_INDEX={}, AXIS_INDEX={}, binPhase=0;
var prevCam=new THREE.Vector3(1e9,1e9,1e9);
if(glOK){
  scene=new THREE.Scene();
  scene.background=GROUND;
  scene.fog=new THREE.FogExp2(FAR_TONE.getHex(), 0.0008);
  camera=new THREE.PerspectiveCamera(45, 1, 0.5, 2000);

  var atlas=buildAtlas();

  /* neurons — one Points cloud, one draw call for the whole mind */
  var placed=NODES.filter(function(n){ return n.pos; });
  nodeOrder=placed;
  /* render-only bodies occupy vertices AFTER every real node, so picking —
     which walks nodeOrder — can never reach them by construction */
  var TOTV=placed.length+COMPANIONS.length+CONST_BG.length;
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
    /* OBSERVATION has no central body: the figure is the emblem, so the MIG
       node is present for its label and the camera but is never drawn. */
    if(n.t==='mig'&&CONSTELLATIONS[n.id]) EMPH[i]=0.0;
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

  var mat=new THREE.ShaderMaterial({
    uniforms:{ atlas:{value:atlas}, fogColor:{value:FAR_TONE},
               fogDensity:{value:0.0008}, cells:{value:ATLAS}, minPx:{value:9.0}, maxPx:{value:170.0},
               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0},
               hoverNode:{value:-1.0}, mindOpen:{value:0.0} },
    transparent:true, depthWrite:false,
    vertexShader:[
      'uniform float minPx; uniform float maxPx;',
      'uniform float focusRegion; uniform float hoverRegion; uniform float mindOpen;',
      'uniform float hoverNode; attribute float nodeIdx;',
      'attribute float isMig;',
      'attribute vec2 cell; attribute vec2 cellB; attribute float size; attribute vec3 tint; attribute float emph;',
      'attribute float region; attribute float capPx;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'void main(){',
      /* a region wears its world's species only once the mind is open; before
         that every region is drawn the same way, because it is still one organ */
      '  vCell = (mindOpen < 0.5) ? cellB : cell;',
      '  vTint=tint;',
      // inside a world everything elsewhere recedes but never vanishes: the
      // mind must stay felt while one region of it is being read
      '  float here = (focusRegion<0.0 || abs(region-focusRegion)<0.5) ? 1.0 : 0.13;',
      // hovering a MIG in the menu identifies its world: that world lifts,
      // the rest step back just enough to make the answer unambiguous
      '  if(hoverRegion>=0.0){',
      '    here *= (abs(region-hoverRegion)<0.5) ? 2.15 : 0.45;',
      '  }',
      /* before the mind opens only the regions exist; everything they own is
         folded inside them and must not be drawn */
      /* what a region holds is visible as TISSUE before the mind opens —
         enough to give the brain a surface, never enough to compete with the
         regions themselves */
      '  if(isMig < 0.5) here *= (0.78 + 0.22*mindOpen);',
      /* pointing at one idea by name lifts that idea and lets the rest settle
         back — never a flash across the whole environment */
      '  if(hoverNode >= 0.0){',
      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 0.44;',
      '  }',
      '  vEmph=clamp(emph*here,0.0,1.6);',
      '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
      '  float persp=size*(300.0/max(1.0,-mv.z));',
      /* the floor is the whole starfield: without it distance erases the mind */
      /* the emblem establishes identity; it never becomes the environment.
         Uncapped it swallowed the concepts it was meant to introduce. */
      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',
      '  if(hoverNode >= 0.0 && abs(nodeIdx-hoverNode)<0.5) lift *= 1.34;',
      '  if(isMig < 0.5) lift *= (0.46 + 0.54*mindOpen);',
      /* the cap is per-body, not global: a binary primary must stop growing
         before it swallows its own companion */
      '  gl_PointSize=clamp(persp*lift,minPx,min(capPx,maxPx*1.25));',
      '  vFog=-mv.z;',
      '  gl_Position=projectionMatrix*mv;',
      '}'].join('\n'),
    fragmentShader:[
      'uniform sampler2D atlas; uniform vec3 fogColor; uniform float fogDensity; uniform float cells;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'void main(){',
      '  vec2 uv=(vCell+gl_PointCoord)/cells;',
      '  float a=texture2D(atlas,uv).a*vEmph;',
      '  if(a<0.02) discard;',
      /* atmospheric perspective: distance drains the ink toward the far tone.
         This is the depth medium — not shadow. */
      '  float f=1.0-exp(-fogDensity*fogDensity*vFog*vFog);',
      '  vec3 col=mix(vTint,fogColor,clamp(f,0.0,1.0));',
      '  gl_FragColor=vec4(col,a*(1.0-clamp(f*0.55,0.0,0.88)));',
      '}'].join('\n')
  });
  pts=new THREE.Points(geo,mat);
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
               mindOpen:{value:0.0} },
    transparent:true, depthWrite:false,
    vertexShader:['attribute vec3 tint; attribute float alpha; attribute float kind;',
      'attribute float home;',
      'uniform float globalMix; uniform float focusRegion; uniform float focusMix;',
      'uniform float hoverRegion; uniform float hoverMix; uniform float mindOpen;',
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
      '  float a=alpha*mix(lm,1.0,kind);',
      /* while the mind is closed the cross-region arcs are the brain's drawing,
         not background detail */
      '  if(home < -0.5) a *= (1.0 + 3.4*(1.0-mindOpen));',
      '  vA=a; vec4 mv=modelViewMatrix*vec4(position,1.0);',
      ' vFog=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\n'),
    fragmentShader:['uniform vec3 fogColor; uniform float fogDensity;',
      'varying vec3 vT; varying float vA; varying float vFog;',
      'void main(){ float f=1.0-exp(-fogDensity*fogDensity*vFog*vFog);',
      ' gl_FragColor=vec4(mix(vT,fogColor,clamp(f,0.0,1.0)), vA*(1.0-clamp(f*0.6,0.0,0.9))); }'].join('\n')
  });
  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);

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
  if(orbitLines) orbitLines.material.uniforms.mindOpen.value=mindOpen;
  if(lineSeg && LINE_WALK){
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

function frameFor(mode,id){
  if(mode==='universe' && !entered){
    /* before the mind opens, the universe frame IS the brain frame: a
       three-quarter view, slightly above and to the front-right, which is the
       angle at which a brain reads as a brain rather than as a blob */
    var phoneB2=window.innerWidth<768;
    var k=phoneB2?3.20:1.78;
    return { p:new THREE.Vector3(BRAIN_R*0.92*k, BRAIN_R*0.50*k, BRAIN_R*1.22*k),
             a:new THREE.Vector3(0, BRAIN_R*(phoneB2?-0.30:0.02), 0) };
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
    var aimC=n.pos.clone();
    /* push the figure up out of the sheet by aiming below it */
    if(phoneC) aimC.add(kc.frame.v.clone().multiplyScalar(Dc*0.265));
    return { p:new THREE.Vector3().addVectors(n.pos, kc.frame.w.clone().multiplyScalar(Dc)),
             a:aimC };
  }
  if(mode==='region' && BINARY[id] && BINARY[id].centre){
    /* Philosophy is compact, so arriving there frames the whole system. LOVE
       is not: its first planetary orbit sits at 3.15x the stellar separation,
       so framing the whole thing would shrink the two stars to a dot. Arrive
       facing the PAIR, with the planetary paths sweeping out past the frame —
       the composition the astronomy actually implies. */
    var b=BINARY[id], phoneB=window.innerWidth<768;
    var d0=(phoneB?6.2:4.4)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var awayB=b.centre.clone().normalize().multiplyScalar(d0*0.70);
    var liftB=new THREE.Vector3(0, d0*(phoneB?0.56:0.42), 0)
               .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=d0*0.28;
    return {p:new THREE.Vector3().addVectors(b.centre, awayB.add(liftB)), a:aimB};
  }
  if(mode==='region' && templateFor(id)){
    /* a phone sees a tall, narrow slice, and the sheet takes the lower 58%.
       Stand further back and aim high so the whole system sits in the strip
       that is actually visible — not a corner of it. */
    var phone=window.innerWidth<768;
    var away=n.pos.clone().normalize().multiplyScalar(phone?168:96);
    var lift=new THREE.Vector3(0, phone?96:64, 0)
              .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aim=n.pos.clone();
    if(phone) aim.y-=46;                 // push the system up out of the sheet
    return {p:new THREE.Vector3().addVectors(n.pos, away.add(lift)), a:aim};
  }
  var out=n.pos.clone().normalize().multiplyScalar(mode==='region'?62:26);
  return {p:new THREE.Vector3().addVectors(n.pos,out), a:n.pos.clone()};
}
function travelTo(mode,id,push){
  if(push!==false) history.push({mode:state.mode, focus:state.focus, region:state.region});
  state.mode=mode;
  if(mode==='region'){ state.region=id; state.focus=null; }
  else if(mode==='concept'){ state.focus=id; state.region=byId[id]?byId[id].mig:state.region; }
  else if(mode==='universe'){ state.region=null; state.focus=null; }
  var f=frameFor(mode, id||state.region);
  wantPos.copy(f.p); wantAim.copy(f.a);
  invalidate(140);
  if(reduced||LITE){ camPos.copy(wantPos); camAim.copy(wantAim); }
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
    elGroups.appendChild(group('Regions',rows));
    say('The whole mind. '+MIGS.length+' regions.');
    return;
  }
  if(state.mode==='region'){
    var m=byId[state.region];
    elTier.textContent='The region of';
    elWhere.textContent=m.label;
    elGloss.textContent=m.line||'';
    var mem=owned[m.id]||[];
    elGroups.appendChild(group('Concepts', mem.filter(function(id){return byId[id].t==='minor';})
      .map(function(id){ var n=byId[id];
        return row(n, adj[id].length+' connections', function(){ travelTo('concept',id); }); })));
    elGroups.appendChild(group('Writings', mem.filter(function(id){return byId[id].src;})
      .map(function(id){ var n=byId[id];
        return row(n, esc(n.t)+' · '+esc(n.src), function(){ openReader(id); }); })));
    say('Region '+m.label+'.');
    return;
  }
  var n=byId[state.focus];
  elTier.textContent=esc(n.t)+(n.state?' · '+esc(n.state):'');
  elWhere.textContent=n.label;
  elGloss.textContent=n.line||'';
  elGroups.appendChild(group('Connects to', adj[n.id].map(function(k){
    var o=byId[k.o];
    var meta=(k.dir>0? '<span class="verb">'+esc(k.v)+'</span> '+esc(o.label)
                     : esc(o.label)+' <span class="verb">'+esc(k.v)+'</span> this')
             +(o.mig!==n.mig? ' · crosses into '+esc(byId[o.mig].label.toLowerCase()) : '');
    return row(o, meta, function(){ o.src? openReader(o.id) : travelTo('concept',o.id); });
  })));
  if(n.src) elGroups.appendChild(group('This writing',[ row(n,'Open the source — '+esc(n.src),
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

var morphT=0, morphStart=0;
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
  camPos.lerp(aim,k); camAim.lerp(wantAim,k);
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
    var hr=-1.0;
    if(hoveredMIG){ for(var mi3=0;mi3<MIGS.length;mi3++) if(MIGS[mi3].id===hoveredMIG) hr=mi3; }
    LU.hoverRegion.value=hr;
    LU.hoverMix.value=hr>=0?0.80:0.0;
  }
  /* The pair moves exactly while the camera does. A binary turning forever
     would cost a frame forever, and P4 says a still universe is free — so
     arrival is when the relationship is felt, and rest is free. */
  if(BIN_KEYS.length && pts){
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
    setMindOpen(e);
    if(morphT>=1){ MORPH_ON=false; morphStart=0; }
    invalidate(4);
  }
  layLabels();
  renderer.render(scene,camera);
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
  if(needFrames<=0) return;                       // P4 a still universe is free
  needFrames--; step();
}

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
          e.textContent=n.label; labelLayer.appendChild(e); labelEls[n.id]=e; }
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
    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : ((n.t==='minor' ? d<lp.minor : d<lp.writing) && !elsewhere);
    if(!want) return;
    var v=n.pos.clone().project(camera);
    if(v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1) return;
    var e=labelFor(n, n.t==='mig'?'lb-mig':(n.t==='minor'?'lb-min':'lb-w'));
    var lr=(n.t==='minor'?lp.minor:lp.writing);
    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))
             : Math.max(0,Math.min(1,(lr-d)/(lr*0.5)));
    e.style.transform='translate(-50%,-50%) translate('+((v.x*0.5+0.5)*w).toFixed(1)+'px,'+
      ((-v.y*0.5+0.5)*h+(n.t==='mig'?64:16)).toFixed(1)+'px)';
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
function highlightMIG(migId){
  if(hoveredMIG===migId) return;
  hoveredMIG=migId;
  if(!glOK) return;
  var idx=-1;
  if(migId) for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===migId) idx=i;
  if(pts) pts.material.uniforms.hoverRegion.value=idx;
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
  mind:function(){ return {open:+mindOpen.toFixed(4), morphing:MORPH_ON, entered:entered,
                           brainR:BRAIN_R}; },
  /* a harness control: land the morph immediately, so a measurement can be
     taken of a SETTLED scene rather than of one mid-flight */
  setOpen:function(v){ MORPH_ON=false; morphStart=0; setMindOpen(v); return mindOpen; },
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
      out.push(Math.round(255-(buf[0]*0.299+buf[1]*0.587+buf[2]*0.114)));
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
    /* the ground is near-white, so a body is DARKER than its surroundings */
    function dark(x,y){
      if(x<0||y<0||x>=w||y>=h) return 0;
      var i=(y*w+x)*4;
      return 255-(buf[i]*0.299+buf[i+1]*0.587+buf[i+2]*0.114);
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
    return {id:id, box:B, blobs:blobs, dominance:+dominance.toFixed(2),
            maxDarkness:Math.round(maxD),
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
  /* the brain expands. Not a fade: the regions travel outward, their
     relationships stretch, and what each region was holding flies out of it. */
  state.mode='universe'; state.region=null; state.focus=null;
  var uf=frameFor('universe');
  wantPos.copy(uf.p); wantAim.copy(uf.a);
  if(reduced||LITE){ setMindOpen(1); camPos.copy(wantPos); camAim.copy(wantAim); }
  else { MORPH_ON=true; morphT=0; morphStart=0; }
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
