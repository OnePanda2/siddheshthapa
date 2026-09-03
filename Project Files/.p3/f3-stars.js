/* BRAIN V3, part 3 — the stars.

   Two populations in ONE draw call: the sky's own stars, which never move and
   never fade, and the constellation's stars, which are the figure's vertices
   and dissolve with the rest of the mind when a world opens. One buffer, one
   material, one attribute telling them apart. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);`,
`  lineSeg=new THREE.LineSegments(lg,lm);
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
      var d=Math.max(0,Math.min(1,(p.dot(BRAIN_VIEW)/BRAIN_R+0.75)/1.5));
      var w=0.34+0.66*d*d;
      st.push(0.86*w,0.92*w,1.00*w);
      sm.push((0.66+((i*17)%23)/23*0.78)*(0.42+0.58*d*d));
      sb.push(1.0);
    });
    var g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
    g.setAttribute('tint',new THREE.Float32BufferAttribute(st,3));
    g.setAttribute('mag',new THREE.Float32BufferAttribute(sm,1));
    g.setAttribute('isBrain',new THREE.Float32BufferAttribute(sb,1));
    starField=new THREE.Points(g,new THREE.ShaderMaterial({
      uniforms:{ mindOpen:{value:0.0}, dim:{value:1.0} },
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:['attribute vec3 tint; attribute float mag; attribute float isBrain;',
        'uniform float mindOpen; uniform float dim;',
        'varying vec3 vC; varying float vA;',
        'void main(){ vC=tint;',
        /* the figure's stars go with the figure; the sky stays */
        '  vA = mix(1.0, (1.0-mindOpen)*(1.0-dim*0.55), isBrain);',
        '  vec4 mv=modelViewMatrix*vec4(position,1.0);',
        '  float s = mix(20.0, 34.0, isBrain);',
        '  gl_PointSize=s*mag*(300.0/max(1.0,-mv.z));',
        '  gl_Position=projectionMatrix*mv; }'].join(String.fromCharCode(10)),
      fragmentShader:['varying vec3 vC; varying float vA;',
        'void main(){ float d=length(gl_PointCoord-vec2(0.5));',
        '  if(d>0.5) discard;',
        '  float a=pow(1.0-d*2.0,2.2)*vA;',
        '  if(a<0.004) discard;',
        '  gl_FragColor=vec4(vC*1.45,a); }'].join(String.fromCharCode(10))
    }));
    starField.renderOrder=-5;
    starField.frustumCulled=false;
    scene.add(starField);
  })();`);

/* the figure's stars fade with the mind, and quieten on the threshold */
sub(`      LU.brainDim.value=WELCOME_DIM;`,
`      LU.brainDim.value=WELCOME_DIM;
      if(starField){
        starField.material.uniforms.mindOpen.value=mindOpen;
        starField.material.uniforms.dim.value=WELCOME_DIM;
      }`);

console.log(n + ' edits applied');
