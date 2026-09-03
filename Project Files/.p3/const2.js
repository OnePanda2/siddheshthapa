const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── the 8 named stars must not also appear as background ────────────── */
sub(`    bg.forEach(function(b,bi){`,
`    var named=kon.data.measured.stars;
    bg.forEach(function(b,bi){
      /* the field query returned the eight named stars too — drop them, or the
         constellation would be drawn twice and the sky would compete with it */
      for(var q=0;q<named.length;q++)
        if(Math.abs(named[q].raDeg-b.raDeg)<0.02 && Math.abs(named[q].decDeg-b.decDeg)<0.02) return;`);

/* ── OBSERVATION's own species: the constellation IS the identity ────── */
sub(`  'observation' :{family:'focus',    branches:2, len:0.34, spread:0.12, rings:2, core:0.68},`,
    `  /* noticing, and distrusting the notice. Its identity is not an icon at all —
     it is the figure its own relationships draw across real stars. */
  'observation' :{family:'constellation', branches:0, len:0.00, spread:0.00, rings:0, core:0.30},`);

sub(`    } else if(f==='binary'){                 // LOVE: ONE radiant star.`,
`    } else if(f==='constellation'){         // OBSERVATION: a figure, not an icon
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
    } else if(f==='binary'){                 // LOVE: ONE radiant star.`);

/* ── star sizing, tint, and the one that does not belong ─────────────── */
sub(`    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.35;  // far, slow, and few`,
`    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.35;  // far, slow, and few
    /* A constellation star is sized by its REAL magnitude, so the sky keeps its
       own hierarchy. Legibility of the Minor IG names is solved by label tier
       and focus, never by inflating every star (DESIGN §6). */
    if(n.star!==undefined) SZ[i]=46+(4.2-n.starV)*22;`);

sub(`    var pal=paletteOf(n.mig);
    var c=new THREE.Color(n.t==='mig'?pal.star:pal.body);`,
`    var pal=paletteOf(n.mig);
    /* the object with no relationship inside its own region gets the one
       off-palette colour, because it is the thing that does not belong */
    var c=new THREE.Color(n.offAsterism&&pal.anomaly ? pal.anomaly
                        : (n.t==='mig'?pal.star:pal.body));`);

sub(`    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=68; }`,
`    /* OBSERVATION has no central body: the figure is the emblem, so the MIG
       node is present for its label and the camera but is never drawn. */
    if(n.t==='mig'&&CONSTELLATIONS[n.id]) EMPH[i]=0.0;
    if(n.star!==undefined) EMPH[i]=n.offAsterism?1.35:1.12;
    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=68; }`);

sub(`    else if(BINARY[n.mig]){ CAP[i]=50; }     // and never larger than its stars`,
`    else if(BINARY[n.mig]){ CAP[i]=50; }     // and never larger than its stars
    else if(n.star!==undefined){ CAP[i]=64; }`);

/* ── the 53 background stars: real sky, render-only, tertiary ────────── */
sub(`  var TOTV=placed.length+COMPANIONS.length;`,
    `  var TOTV=placed.length+COMPANIONS.length+CONST_BG.length;`);

sub(`  var starBIndex={};
  COMPANIONS.forEach(function(c,ci){`,
`  /* THE SKY THE FIGURE WAS PICKED OUT OF. 53 measured stars of the same field.
     Render-only, exactly like a binary companion: appended after every real
     node, so picking — which walks nodeOrder — can never reach them. */
  CONST_BG.forEach(function(b,bi){
    var i=placed.length+COMPANIONS.length+bi;
    P[i*3]=b.pos.x; P[i*3+1]=b.pos.y; P[i*3+2]=b.pos.z;
    var gi=GLYPHS.indexOf('minor'); if(gi<0) gi=1;
    CELLA[i*2]=gi%ATLAS; CELLA[i*2+1]=Math.floor(gi/ATLAS);
    SZ[i]=9+Math.max(0,(6.0-b.vMag))*4.4;
    CAP[i]=17;                                   // never a body, always a backdrop
    var pb=paletteOf(b.mig), cb=new THREE.Color(pb.body);
    COL[i*3]=cb.r; COL[i*3+1]=cb.g; COL[i*3+2]=cb.b;
    EMPH[i]=0.30;                                // tertiary, and it must stay there
    REG[i]=(migIndex[b.mig]===undefined?-1:migIndex[b.mig]);   // hover reaches it
  });
  var starBIndex={};
  COMPANIONS.forEach(function(c,ci){`);

/* ── the constellation's lines are its own relationships ─────────────── */
sub(`        var c=cross?new THREE.Color(0x2b6cb0):new THREE.Color(0x8c99a6);
        cols.push(c.r,c.g,c.b);
        alphas.push((cross&&l.keep?0.46:(cross?0.14:0.10))*(0.18+0.82*t));`,
`        /* In a constellation world the internal relationships ARE the figure,
           so they carry the world's own colour and enough presence to read as
           a drawn line — while staying below the stars they join. No
           conventional asterism is ever added: these are graph edges. */
        var kon2=(!cross&&CONSTELLATIONS[A.mig])?CONSTELLATIONS[A.mig]:null;
        var c=kon2?new THREE.Color(paletteOf(A.mig).orbit)
                 :(cross?new THREE.Color(0x2b6cb0):new THREE.Color(0x8c99a6));
        cols.push(c.r,c.g,c.b);
        alphas.push((kon2?0.30:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));`);

/* ── arrival: stand where the pattern was drawn from ─────────────────── */
sub(`  if(mode==='region' && BINARY[id] && BINARY[id].centre){`,
`  if(mode==='region' && CONSTELLATIONS[id]){
    /* The figure resolves from ONE line of sight. Arrive on it — the scaled
       equivalent of where Earth actually stands — and the pattern comes
       together; move off it and the real depths pull it apart. */
    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;
    var Dc=kc.meanDistanceLy*CONST_SCALE*(phoneC?1.62:1.0);
    return { p:new THREE.Vector3().addVectors(n.pos, kc.frame.w.clone().multiplyScalar(Dc)),
             a:n.pos.clone() };
  }
  if(mode==='region' && BINARY[id] && BINARY[id].centre){`);

/* ── harness ─────────────────────────────────────────────────────────── */
sub(`  binaryProfile:function(mid){`,
`  constellation:function(mid){
    mid=mid||'observation';
    var k=CONSTELLATIONS[mid]; if(!k) return null;
    var map={}, stars=[];
    Object.keys(k.map).forEach(function(id){
      var nd=byId[id];
      map[id]=k.map[id];
      stars.push({ id:id, star:k.map[id], kind:nd.t, vMag:nd.starV, ly:nd.starLy,
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
      internalEdges:k.internal.map(function(l){ return {a:l.a,b:l.b,v:l.v}; }),
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
  binaryProfile:function(mid){`);

console.log(n + ' rendering edits applied');
