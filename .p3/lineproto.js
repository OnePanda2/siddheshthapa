/* §27 — the isolated brain prototype. Lines only: no MIGs, no graph, no
   labels, no menu, no celestial systems. Exactly the §28 blind test.
   usage: node .p3/lineproto.js [view] [w] [h] [folds] [farFolds] */
const fs = require('fs'), path = require('path');
const lines = require('./brainlines.js').SRC;
const three = fs.readFileSync(path.join(__dirname, 'three.min.js'), 'utf8');

const VIEW = process.argv[2] || 'lateral';
const W = +(process.argv[3] || 1200), H = +(process.argv[4] || 820);
const FOLDS = +(process.argv[5] || 14), FAR = +(process.argv[6] || 3);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#f7f8fa;overflow:hidden}canvas{display:block}
</style></head><body>
<script>${three}</script>
<script>
${lines}
var VIEWS={
  lateral:      [1.00, 0.125, 0.105],
  lateralPure:  [1.00, 0.00, 0.00],
  returned:     [1.00, 0.20, 0.26],
  threequarter: [0.86, 0.20, 0.62]
};
var vd=VIEWS['${VIEW}']||VIEWS.lateral;
var viewDir=new THREE.Vector3(vd[0],vd[1],vd[2]).normalize();

var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(38, ${W}/${H}, 1, 4000);
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(1); renderer.setSize(${W},${H});
renderer.setClearColor(0xf7f8fa,1);
document.body.appendChild(renderer.domElement);

/* the five layers, deliberately unequal */
/* alpha AND stroke count, because alpha alone saturates: at weight 2.1 the
   silhouette and at weight 1.78 the Sylvian both clamped to fully opaque and
   the two heaviest lines in the drawing rendered identically. */
var LAYER={
  A:{ col:0x1d2a38, a:0.95, fade:0.00, n:3, gap:0.9 },  // silhouette
  B:{ col:0x2c3e52, a:0.80, fade:0.30, n:2, gap:0.8 },  // named fissures
  C:{ col:0x51637c, a:0.46, fade:0.50, n:1, gap:0 },    // the other sulci
  D:{ col:0x51637c, a:0.40, fade:0.70, n:1, gap:0 },
  E:{ col:0x93a0b4, a:0.34, fade:0.92, n:1, gap:0 }     // midline + far side
};

var curves=buildBrainCurves(viewDir, ${FOLDS}>=1?1:0.5);
var pos=[], col=[], alp=[], fad=[];
curves.forEach(function(c){
  var L=LAYER[c.layer]||LAYER.D, k=new THREE.Color(L.col);
  var rows=strokeOffsets(c.pts, L.gap, L.n);
  rows.forEach(function(row){
    for(var i=0;i<row.length-1;i++){
      [row[i],row[i+1]].forEach(function(p){
        pos.push(p.x,p.y,p.z); col.push(k.r,k.g,k.b);
        alp.push(Math.min(1.0, L.a*c.w)); fad.push(L.fade);
      });
    }
  });
});
var g=new THREE.BufferGeometry();
g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
g.setAttribute('tint',new THREE.Float32BufferAttribute(col,3));
g.setAttribute('alpha',new THREE.Float32BufferAttribute(alp,1));
g.setAttribute('fade',new THREE.Float32BufferAttribute(fad,1));
var m=new THREE.ShaderMaterial({
  uniforms:{ mid:{value:600.0} },
  transparent:true, depthWrite:false,
  vertexShader:[
    'attribute vec3 tint; attribute float alpha; attribute float fade;',
    'uniform float mid; varying vec3 vC; varying float vA;',
    'void main(){ vC=tint;',
    ' vec4 mv=modelViewMatrix*vec4(position,1.0);',
    /* depth is the whole 3D story: a curve on the far side of the organ is a
       whisper, one on the near side is legible. No mesh, no occlusion pass. */
    ' float d=clamp((mid-(-mv.z))/190.0,-1.0,1.0);',
    ' float near=pow(clamp(d*0.5+0.5,0.0,1.0),1.6);',
    ' vA=alpha*mix(1.0,near,fade);',
    ' gl_Position=projectionMatrix*mv; }'].join('\\n'),
  fragmentShader:['varying vec3 vC; varying float vA;',
    'void main(){ if(vA<0.004) discard; gl_FragColor=vec4(vC,vA); }'].join('\\n')
});
var seg=new THREE.LineSegments(g,m);
scene.add(seg);

camera.position.copy(viewDir.clone().multiplyScalar(640));
camera.lookAt(0,0,0);
m.uniforms.mid.value=camera.position.length();
renderer.render(scene,camera);
window.__STATS__={ curves:curves.length, verts:pos.length/3,
                   byLayer:curves.reduce(function(o,c){o[c.layer]=(o[c.layer]||0)+1;return o;},{}) };
document.title=JSON.stringify(window.__STATS__);
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, 'lineproto.html'), html, 'utf8');
console.log('view=' + VIEW + '  folds=' + FOLDS + '  far=' + FAR);
