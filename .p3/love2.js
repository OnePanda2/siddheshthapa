/* Composition pass. The binary physics measured exactly right (180.00 deg
   apart, offB/offA 3.4484 vs mass ratio 3.4485) but it did NOT READ as two
   bound stars: a big amber blob and a small dark dot, inside huge planetary
   rings. Fix what the eye gets, not what the numbers say. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

/* ── 1. UNDO the global orbit-tint regression. Philosophy's paths must stay
   blue; colour has to be per-world, so it becomes a vertex attribute. ── */
sub(`      uniforms:{ tint:{value:new THREE.Color(0x8a5f7a)}, near:{value:1.0},`,
    `      uniforms:{ near:{value:1.0},`);

sub(
`      vertexShader:['attribute float alpha; varying float vA; varying float vD;',
        'void main(){ vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0);',
        ' vD=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\\n'),
      fragmentShader:['uniform vec3 tint; uniform float near; uniform float hoverOwn;',
        'varying float vA; varying float vD;',`,
`      vertexShader:['attribute float alpha; attribute vec3 otint;',
        'varying float vA; varying float vD; varying vec3 vT;',
        'void main(){ vA=alpha; vT=otint; vec4 mv=modelViewMatrix*vec4(position,1.0);',
        ' vD=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\\n'),
      fragmentShader:['uniform float near; uniform float hoverOwn;',
        'varying float vA; varying float vD; varying vec3 vT;',`);

sub(`        ' gl_FragColor=vec4(tint,a); }'].join('\\n')`,
    `        ' gl_FragColor=vec4(vT,a); }'].join('\\n')`);

sub(`    og.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(oa),1));`,
    `    og.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(oa),1));
    og.setAttribute('otint',new THREE.BufferAttribute(new Float32Array(oc),3));`);

sub(`  var ov=[], oa=[];`,
`  var ov=[], oa=[], oc=[];
  var _oc=new THREE.Color();
  function push2(pt,al,hex){ ov.push(pt.x,pt.y,pt.z); oa.push(al);
    _oc.setHex(hex); oc.push(_oc.r,_oc.g,_oc.b); }`);

/* planetary rings: keep them, but in a binary world they must not out-shout
   the two stars they belong to */
sub(
`        var pt=new THREE.Vector3().addVectors(centre, localOrbit(sl.r,th,incl));
          ov.push(pt.x,pt.y,pt.z);
          oa.push(0.16-Math.min(0.09,sl.r*0.0009));   // outer rings quieter`,
`        var pt=new THREE.Vector3().addVectors(centre, localOrbit(sl.r,th,incl));
          var al=0.16-Math.min(0.09,sl.r*0.0009);     // outer rings quieter
          if(BINARY[mid]) al*=0.70;                   // the pair leads, not the rings
          /* Philosophy keeps the exact tint it shipped with; only a world that
             declares its own takes it, so this stays a pure addition */
          push2(pt, al, BINARY[mid]?paletteOf(mid).orbit:0x2b4f86);`);

/* ── 2. the stellar orbits lead, and the binding is drawn ───────────── */
sub(
`    [0,1].forEach(function(si){
      var STEP=104;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var ph=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(b.centre, binaryOffset(b,si,ph));
          ov.push(pt.x,pt.y,pt.z);
          oa.push(si?0.30:0.38);        // the wide swing drawn slightly quieter
        });
      }
    });`,
`    var pal=paletteOf(mid);
    [0,1].forEach(function(si){
      var STEP=104;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var ph=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(b.centre, binaryOffset(b,si,ph));
          push2(pt, si?0.50:0.58, si?(pal.star2||pal.star):pal.star);
        });
      }
    });
    /* THE BARYCENTRE. Two stars orbit a point that contains nothing. Marking it
       is what turns two lights into one system: it is the thing they share. */
    var CR=b.aBin*0.10;
    [0, Math.PI, 1.5708, -1.5708].forEach(function(a0){
      push2(b.centre.clone(), 0.46, pal.accent);
      push2(new THREE.Vector3().addVectors(b.centre, localOrbit(CR,a0,0)), 0.05, pal.accent);
    });`);

/* the line of centres, appended LAST so the motion code can find it */
sub(
`  if(ov.length){
    var og=new THREE.BufferGeometry();`,
`  /* THE LINE OF CENTRES. A and B are always diametrically opposite through the
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
    push2(A.pos.clone(), 0.30, pal2.star);
    push2(b.centre.clone(), 0.30, pal2.accent);
    push2(b.centre.clone(), 0.30, pal2.accent);
    push2(pB, 0.30, pal2.star2||pal2.star);
  });
  AXIS_INDEX=AXIS_OFF;
  if(ov.length){
    var og=new THREE.BufferGeometry();`);

sub(`var BIN_KEYS=Object.keys(BINARY), STARB_INDEX={}, binPhase=0;`,
    `var BIN_KEYS=Object.keys(BINARY), STARB_INDEX={}, AXIS_INDEX={}, binPhase=0;`);

/* the stability ring keeps its own quiet colour */
sub(`        var pt=new THREE.Vector3().addVectors(b.centre, localOrbit(b.stability,th,0));
        ov.push(pt.x,pt.y,pt.z); oa.push(0.12);`,
    `        push2(new THREE.Vector3().addVectors(b.centre, localOrbit(b.stability,th,0)),
              0.16, paletteOf(mid).body);`);

/* ── 3. the axis travels with the pair ──────────────────────────────── */
sub(
`        if(ib!==undefined){
          var pB=binaryOffset(b,1,b.phase+binPhase);
          pa.array[ib*3]=b.centre.x+pB.x; pa.array[ib*3+1]=b.centre.y+pB.y;
          pa.array[ib*3+2]=b.centre.z+pB.z;
        }`,
`        if(ib!==undefined){
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
        }`);

/* ── 4. the stars become STARS: a real luminous disc, not a pinpoint ─── */
sub(
`      core2(R*0.24,1.00); core2(R*0.48,0.50); core2(R*0.82,0.18);
      ring(R*0.61,R*0.61,0,0.12);`,
`      core2(R*0.62,1.00); core2(R*0.92,0.26); core2(R*0.34,1.00);
      ring(R*0.74,R*0.74,0,0.10);`);

/* ── 5. bigger caps so the discs carry, and warmer, closer-valued stars ─ */
sub(`    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=88; }`,
    `    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=104; }`);
sub(`    CAP[i]=88/b.sizeRatio;`, `    CAP[i]=104/b.sizeRatio;`);

sub(
`  a:{ name:'amber + rust',
      fog:0xdcc4b4, star:0x8f4a0f, star2:0x8e2f35, body:0xa15b4a, orbit:0xba7550, accent:0xa63d1f },`,
`  a:{ name:'amber + rose',
      fog:0xdcc4b4, star:0x9a4f0d, star2:0xa8433f, body:0xa4614c, orbit:0xb87a58, accent:0xb0542a },`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' composition edits applied');
