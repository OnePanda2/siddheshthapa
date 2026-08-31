/* OBSERVATION -> Ursa Major. The third world grammar.

   A planetary system is held together by gravity and would exist with nobody
   watching. A constellation is held together by someone looking at it: the
   stars are real and unrelated, the figure is an act of interpretation, and it
   resolves only from one place.

   So the star POSITIONS are measured astronomy and the LINES are the mind's own
   relationships. No conventional asterism is ever drawn. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── build: inject the constellation dataset ─────────────────────────── */
edit('tools/build-v02.js',
`const astro = fs.readFileSync('data/astronomy-systems.json', 'utf8');`,
`const astro = fs.readFileSync('data/astronomy-systems.json', 'utf8');
const konst = fs.readFileSync('data/constellation-ursa-major.json', 'utf8');`);

edit('tools/build-v02.js',
`const appWithAstro = app.replace('/*__ASTRO__*/', () => astro);
if (appWithAstro === app) throw new Error('the /*__ASTRO__*/ marker was not found in the app');`,
`let appWithAstro = app.replace('/*__ASTRO__*/', () => astro);
if (appWithAstro === app) throw new Error('the /*__ASTRO__*/ marker was not found in the app');
const withConst = appWithAstro.replace('/*__CONST__*/', () => konst);
if (withConst === appWithAstro) throw new Error('the /*__CONST__*/ marker was not found in the app');
appWithAstro = withConst;`);

/* ── the constellation model ─────────────────────────────────────────── */
edit('src/v02-app.js',
`var ORBITS={};                       // migId -> [{id,r,theta,incl}] for checking`,
`/* ── 1a2. THE CONSTELLATION ───────────────────────────────────────────
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

var ORBITS={};                       // migId -> [{id,r,theta,incl}] for checking`);

/* ── layout branch ───────────────────────────────────────────────────── */
edit('src/v02-app.js',
`MIGS.forEach(function(m){
  var mem=owned[m.id]||[], n=Math.max(1,mem.length);
  var tpl=templateFor(m.id);

  if(tpl){`,
`var CONST_BG=[];                       // render-only sky, never graph objects

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
    bg.forEach(function(b,bi){
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
  } else if(tpl){`);

/* ── palette ─────────────────────────────────────────────────────────── */
edit('src/v02-app.js',
`  var w=LOVE_VARIANTS[LOVE_PICK]||LOVE_VARIANTS.a;`,
`  /* OBSERVATION: verdigris and cold teal — the colour of oxidised optical
     instruments, the apparatus of looking. Not "space is blue". The single
     off-palette cold gold is reserved for the object that does not belong. */
  var o=OBS_VARIANTS[OBS_PICK]||OBS_VARIANTS.a;
  MIG_PALETTE['observation']={fog:o.fog, star:o.star, body:o.body,
                              orbit:o.line, accent:o.accent, anomaly:o.anomaly};
  var w=LOVE_VARIANTS[LOVE_PICK]||LOVE_VARIANTS.a;`);

edit('src/v02-app.js',
`var LOVE_PICK=(function(){`,
`var OBS_VARIANTS={
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
var LOVE_PICK=(function(){`);

console.log(n + ' edits applied (build + model + layout + palette)');
