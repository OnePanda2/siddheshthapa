/* LOVE -> Kepler-16. A circumbinary world: two unequal stars swinging
   anti-phase about an empty barycentre, a dynamically forbidden middle, then a
   few far slow bodies. Philosophy is not touched. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
const before = s;
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

/* ── 1. two worlds, per-world map scale, circumbinary slot rule ──────── */
sub(
`/* Only Philosophy is assigned for the vertical slice. The rest keep the
   earlier spherical layout until this model is judged worth generalising. */
var MIG_SYSTEM={ 'philosophy':'TRAPPIST-1' };
function templateFor(migId){ return ASTRO[MIG_SYSTEM[migId]]||null; }

var ORBIT_R0=13;                     // the innermost orbit, in scene units
var SYS_TILT=0.42;                   // one shared viewing tilt, ~24 degrees
`,
`/* Two worlds are assigned, chosen to be structurally opposite: one star with
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
`);

sub(
`function orbitalSlots(tpl){
  var a=tpl.semiMajorAxisAU, inner=a[0];
  return a.map(function(v){ return ORBIT_R0*(v/inner); });
}`,
`function orbitalSlots(tpl,R0,want){
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
}`);

/* ── 2. slots now depend on the world and on how many concepts it owns ── */
sub(
`    var slots=orbitalSlots(tpl);`,
`    var slots=orbitalSlots(tpl, scaleFor(m.id), concepts.length);`);

/* Kepler-16's three bodies are coplanar to within 0.5 degrees (measured), and
   the planet's eccentricity is 0.0069 — effectively circular. So LOVE's disc is
   FLAT and ROUND, and all of its eccentricity lives in the stellar orbit. That
   is the data, and it is also the better metaphor. */
sub(
`      var incl=0.02+((k%3)*0.012);        // near-coplanar, as measured`,
`      var incl=tpl.sourceType==='circumbinary-system'
             ? 0.0087                       // measured: coplanar within 0.5 deg
             : 0.02+((k%3)*0.012);          // near-coplanar, as measured`);

/* ── 3. the binary itself ────────────────────────────────────────────── */
sub(
`/* ── 2. THE NEURON ALPHABET, REUSED ───────────────────────────────────`,
`/* ── 1b. THE BINARY ───────────────────────────────────────────────────
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

/* ── 2. THE NEURON ALPHABET, REUSED ───────────────────────────────────`);

/* ── 4. LOVE's glyph: one radiant star. The pair is geometry, not a picture ── */
sub(
`    } else if(f==='binary'){                 // LOVE: two bodies, one shared halo
      g.save(); g.translate(-R*0.27,0); core2(R*0.44,0.94); g.restore();
      g.save(); g.translate( R*0.27,0); core2(R*0.40,0.88); g.restore();
      ring(R*0.66,R*0.30,0.32,0.26); ring(R*0.66,R*0.30,-0.32,0.16);`,
`    } else if(f==='binary'){                 // LOVE: ONE radiant star.
      /* Drawing two dots here would be a picture of a binary. The pair has to
         be real geometry in the scene, so the glyph is a single smooth stellar
         body — no branches, which is what separates it from Philosophy's
         neural soma — and LOVE's signature is that it is the only world made
         of TWO of them. */
      core2(R*0.24,1.00); core2(R*0.48,0.50); core2(R*0.82,0.18);
      ring(R*0.61,R*0.61,0,0.12);`);

/* ── 5. palette ──────────────────────────────────────────────────────── */
sub(
`var PALETTE_PICK=(function(){`,
`/* LOVE is warm because its stars are: the primary is a measured 4450 K
   K-dwarf, and the 0.20-solar secondary is necessarily cooler and redder. The
   colour is therefore stellar temperature, not romance. */
var LOVE_VARIANTS={
  a:{ name:'amber + rust',
      fog:0xdcc4b4, star:0x8f4a0f, star2:0x8e2f35, body:0xa15b4a, orbit:0xba7550, accent:0xa63d1f },
  b:{ name:'ember + rose',
      fog:0xe0c6bd, star:0x9c4a12, star2:0x93303f, body:0xa8564f, orbit:0xc07a5c, accent:0xb1401f },
  c:{ name:'gold + deep red',
      fog:0xdcc7ad, star:0x8a5a12, star2:0x8b262a, body:0x9c6141, orbit:0xb5824b, accent:0x9c5312 }
};
var LOVE_PICK=(function(){
  var m=/(^|[#&])lovepal:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var PALETTE_PICK=(function(){`);

sub(
`  var v=PHIL_VARIANTS[PALETTE_PICK]||PHIL_VARIANTS.a;
  MIG_PALETTE['philosophy']={fog:v.fog, star:v.star, body:v.body, orbit:v.orbit, accent:v.accent};
})();`,
`  var v=PHIL_VARIANTS[PALETTE_PICK]||PHIL_VARIANTS.a;
  MIG_PALETTE['philosophy']={fog:v.fog, star:v.star, body:v.body, orbit:v.orbit, accent:v.accent};
  var w=LOVE_VARIANTS[LOVE_PICK]||LOVE_VARIANTS.a;
  MIG_PALETTE['love']={fog:w.fog, star:w.star, star2:w.star2, body:w.body,
                       orbit:w.orbit, accent:w.accent};
})();`);

/* ── 6. companions in the points cloud + per-vertex size cap ─────────── */
sub(
`  var placed=NODES.filter(function(n){ return n.pos; });
  nodeOrder=placed;
  var P=new Float32Array(placed.length*3), CELLA=new Float32Array(placed.length*2),
      SZ=new Float32Array(placed.length), COL=new Float32Array(placed.length*3),
      EMPH=new Float32Array(placed.length), REG=new Float32Array(placed.length);`,
`  var placed=NODES.filter(function(n){ return n.pos; });
  nodeOrder=placed;
  /* render-only bodies occupy vertices AFTER every real node, so picking —
     which walks nodeOrder — can never reach them by construction */
  var TOTV=placed.length+COMPANIONS.length;
  var P=new Float32Array(TOTV*3), CELLA=new Float32Array(TOTV*2),
      SZ=new Float32Array(TOTV), COL=new Float32Array(TOTV*3),
      EMPH=new Float32Array(TOTV), REG=new Float32Array(TOTV),
      CAP=new Float32Array(TOTV);
  var CAP_DEFAULT=212.5;            // == maxPx * 1.25, the previous global cap`);

sub(
`    EMPH[i]=n.t==='mig'?1.0:(0.62+Math.min(1,(degree[n.id]||0)/7)*0.34);
    REG[i]=(migIndex[n.mig]===undefined?-1:migIndex[n.mig]);
  });`,
`    EMPH[i]=n.t==='mig'?1.0:(0.62+Math.min(1,(degree[n.id]||0)/7)*0.34);
    REG[i]=(migIndex[n.mig]===undefined?-1:migIndex[n.mig]);
    CAP[i]=CAP_DEFAULT;
    /* A binary primary keeps the same emblem SIZE as every other MIG, so at
       universe range LOVE is exactly as findable as its neighbours — but it
       gets a much tighter cap, so on approach it stops growing and its
       companion separates from it instead of being swallowed. That reveal is
       the whole point: from far away LOVE is one warm light; up close it is
       unmistakably two. */
    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=88; }
  });
  var starBIndex={};
  COMPANIONS.forEach(function(c,ci){
    var i=placed.length+ci;
    starBIndex[c.mig]=i;
    P[i*3]=c.pos.x; P[i*3+1]=c.pos.y; P[i*3+2]=c.pos.z;
    var order=Object.keys(MIG_VISUAL).indexOf(c.mig);
    var gi=order>=0?GLYPHS.length+order:0;      // the SAME stellar form
    CELLA[i*2]=gi%ATLAS; CELLA[i*2+1]=Math.floor(gi/ATLAS);
    var b=BINARY[c.mig];
    SZ[i]=150/b.sizeRatio;                      // cube root of the mass ratio
    CAP[i]=88/b.sizeRatio;
    var pal=paletteOf(c.mig);
    var c2=new THREE.Color(pal.star2||pal.star);   // cooler star, redder
    COL[i*3]=c2.r; COL[i*3+1]=c2.g; COL[i*3+2]=c2.b;
    EMPH[i]=1.0;
    REG[i]=(migIndex[c.mig]===undefined?-1:migIndex[c.mig]);  // hover reaches it
  });`);

sub(
`  geo.setAttribute('region',new THREE.BufferAttribute(REG,1));`,
`  geo.setAttribute('region',new THREE.BufferAttribute(REG,1));
  geo.setAttribute('capPx',new THREE.BufferAttribute(CAP,1));`);

sub(
`      'attribute vec2 cell; attribute float size; attribute vec3 tint; attribute float emph;',
      'attribute float region;',`,
`      'attribute vec2 cell; attribute float size; attribute vec3 tint; attribute float emph;',
      'attribute float region; attribute float capPx;',`);

sub(
`      '  gl_PointSize=clamp(persp*lift,minPx,maxPx*1.25);',`,
`      /* the cap is per-body, not global: a binary primary must stop growing
         before it swallows its own companion */
      '  gl_PointSize=clamp(persp*lift,minPx,min(capPx,maxPx*1.25));',`);

/* ── 7. orbit paths: stellar ellipses + the forbidden middle ─────────── */
sub(
`  var ov=[], oa=[];
  Object.keys(ORBITS).forEach(function(mid){
    var centre=byId[mid].pos, seen={};`,
`  var ov=[], oa=[];
  Object.keys(ORBITS).forEach(function(mid){
    var centre=centreOf(mid), seen={};`);

sub(
`  if(ov.length){
    var og=new THREE.BufferGeometry();`,
`  /* THE TWO STELLAR ORBITS, and the middle nothing can hold.
     These are what make the world legible as circumbinary without a word of
     explanation: two ellipses about one empty point, then a dashed boundary,
     then a wide gap, and only then the first planetary path. */
  Object.keys(BINARY).forEach(function(mid){
    var b=BINARY[mid]; if(!b.centre) return;
    [0,1].forEach(function(si){
      var STEP=104;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var ph=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(b.centre, binaryOffset(b,si,ph));
          ov.push(pt.x,pt.y,pt.z);
          oa.push(si?0.30:0.38);        // the wide swing drawn slightly quieter
        });
      }
    });
    /* dashed, so it can never be mistaken for an orbit: inside this radius no
       stable path exists around a pair of stars (Holman & Wiegert 1999) */
    var S2=132;
    for(var q2=0;q2<S2;q2+=3){
      [q2,q2+1].forEach(function(w){
        var th=(w/S2)*6.2832;
        var pt=new THREE.Vector3().addVectors(b.centre, localOrbit(b.stability,th,0));
        ov.push(pt.x,pt.y,pt.z); oa.push(0.12);
      });
    }
  });
  if(ov.length){
    var og=new THREE.BufferGeometry();`);

sub(
`      uniforms:{ tint:{value:new THREE.Color(0x2b4f86)}, near:{value:1.0},`,
`      uniforms:{ tint:{value:new THREE.Color(0x8a5f7a)}, near:{value:1.0},`);

/* ── 8. arrival: a binary world is framed on the PAIR ───────────────── */
sub(
`  if(mode==='region' && templateFor(id)){`,
`  if(mode==='region' && BINARY[id] && BINARY[id].centre){
    /* Philosophy is compact, so arriving there frames the whole system. LOVE
       is not: its first planetary orbit sits at 3.15x the stellar separation,
       so framing the whole thing would shrink the two stars to a dot. Arrive
       facing the PAIR, with the planetary paths sweeping out past the frame —
       the composition the astronomy actually implies. */
    var b=BINARY[id], phoneB=window.innerWidth<768;
    var d0=(phoneB?4.0:2.75)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));
    var awayB=b.centre.clone().normalize().multiplyScalar(d0*0.70);
    var liftB=new THREE.Vector3(0, d0*(phoneB?0.56:0.42), 0)
               .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aimB=b.centre.clone();
    if(phoneB) aimB.y-=d0*0.28;
    return {p:new THREE.Vector3().addVectors(b.centre, awayB.add(liftB)), a:aimB};
  }
  if(mode==='region' && templateFor(id)){`);

/* ── 9. the pair swings while you travel, and only then ─────────────── */
sub(
`  layLabels();
  renderer.render(scene,camera);`,
`  /* The pair moves exactly while the camera does. A binary turning forever
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
      });
      pa.needsUpdate=true;
    }
  }
  layLabels();
  renderer.render(scene,camera);`);

/* declared BEFORE the points build, because that is where STARB_INDEX is
   filled in — a `var` down at the render loop would hoist, then re-run its
   initialiser and wipe the assignment */
sub(
`var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};`,
`var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};
var BIN_KEYS=Object.keys(BINARY), STARB_INDEX={}, binPhase=0;
var prevCam=new THREE.Vector3(1e9,1e9,1e9);`);

sub(
`  pts=new THREE.Points(geo,mat);
  scene.add(pts);`,
`  pts=new THREE.Points(geo,mat);
  STARB_INDEX=starBIndex;
  scene.add(pts);`);

if (s === before) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied to ' + F);
