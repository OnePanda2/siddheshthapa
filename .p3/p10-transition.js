/* PART 10 — BRAIN -> UNIVERSE.

   setMindOpen writes one parameter through the whole scene: node positions,
   the stretched relationship lines, and the two shader uniforms that keep the
   collapsed objects and the orbital furniture out of the brain. enterMind eases
   it from 0 to 1 while the camera flies in, so the transition is spatial — the
   brain expands into the universe rather than cutting to it. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* one writer for the whole morph */
sub(`var camPos=new THREE.Vector3(0,60,720), camAim=new THREE.Vector3(0,0,0);`,
`var _mp=new THREE.Vector3();
function setMindOpen(v){
  mindOpen=Math.max(0,Math.min(1,v));
  applyMorph();
  if(!glOK||!pts) return;
  var pa=pts.geometry.attributes.position;
  nodeOrder.forEach(function(nd,i){
    if(!nd.pos) return;
    pa.array[i*3]=nd.pos.x; pa.array[i*3+1]=nd.pos.y; pa.array[i*3+2]=nd.pos.z;
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

var camPos=new THREE.Vector3(0,60,720), camAim=new THREE.Vector3(0,0,0);`);

/* the brain has its own frame; the universe keeps the one it had */
sub(`  /* the universe frame must contain the WHOLE mind: with the old aim,`,
`  if(mode==='universe' && !entered){
    /* before the mind opens, the universe frame IS the brain frame: a
       three-quarter view, slightly above and to the front-right, which is the
       angle at which a brain reads as a brain rather than as a blob */
    var phoneB2=window.innerWidth<768;
    var k=phoneB2?2.62:1.78;
    return { p:new THREE.Vector3(BRAIN_R*0.92*k, BRAIN_R*0.50*k, BRAIN_R*1.22*k),
             a:new THREE.Vector3(0, BRAIN_R*(phoneB2?-0.30:0.02), 0) };
  }
  /* the universe frame must contain the WHOLE mind: with the old aim,`);

/* enter the mind: the brain opens */
sub(`function enterMind(){
  if(entered) return; entered=true;
  threshold.classList.add('gone');
  threshold.setAttribute('aria-hidden','true');`,
`function enterMind(){
  if(entered) return; entered=true;
  threshold.classList.add('gone');
  threshold.setAttribute('aria-hidden','true');
  /* the brain expands. Not a fade: the regions travel outward, their
     relationships stretch, and what each region was holding flies out of it. */
  state.mode='universe'; state.region=null; state.focus=null;
  var uf=frameFor('universe');
  wantPos.copy(uf.p); wantAim.copy(uf.a);
  if(reduced||LITE){ setMindOpen(1); camPos.copy(wantPos); camAim.copy(wantAim); }
  else { MORPH_ON=true; morphT=0; }
  invalidate(200);
  paintDOM();`);

sub(`var lastMs=0, frameMs=16;`,
    `var morphT=0;
var lastMs=0, frameMs=16;`);

/* drive it from the frame loop, and stop when it lands */
sub(`  layLabels();
  renderer.render(scene,camera);`,
`  if(MORPH_ON){
    morphT=Math.min(1,morphT+0.016);
    /* ease out: the brain lets go quickly, then the universe settles */
    var e=1-Math.pow(1-morphT,3);
    setMindOpen(e);
    if(morphT>=1){ MORPH_ON=false; }
    invalidate(4);
  }
  layLabels();
  renderer.render(scene,camera);`);

/* start in the brain */
/* fold into the brain only once every buffer exists — orbit rings, the
   constellation and the sky are all built from universe positions */
sub(`    orbitLines=new THREE.LineSegments(og,om);
    scene.add(orbitLines);
  }
}`,
`    orbitLines=new THREE.LineSegments(og,om);
    scene.add(orbitLines);
  }
  setMindOpen(0);
  var bf0=frameFor('universe');
  camPos.copy(bf0.p); camAim.copy(bf0.a);
  wantPos.copy(bf0.p); wantAim.copy(bf0.a);
}`);

/* harness */
sub(`  overlay:function(){`,
`  mind:function(){ return {open:+mindOpen.toFixed(4), morphing:MORPH_ON, entered:entered,
                           brainR:BRAIN_R}; },
  setOpen:function(v){ setMindOpen(v); return mindOpen; },
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
    out.left=bx.filter(function(v){return v<0;}).length;
    out.right=bx.filter(function(v){return v>0;}).length;
    return out;
  },
  overlay:function(){`);

console.log(n + ' edits applied');
