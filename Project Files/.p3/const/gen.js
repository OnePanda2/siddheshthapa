/* CONSTELLATION BRAIN — four approaches, four angles each.
   Standalone prototypes. Nothing here touches the app.
   usage: node .p3/const/gen.js <A|B|C|D> [w] [h]
*/
const fs = require('fs'), path = require('path');
const three = fs.readFileSync(path.join(__dirname, '..', 'three.min.js'), 'utf8');
const sky = require('./sky.js').SRC;
const APPROACH = (process.argv[2] || 'A').toUpperCase();
const W = +(process.argv[3] || 1400), H = +(process.argv[4] || 1000);

const body = sky + `
/* ---- the proven brain profile: 52% off its own best-fit ellipse, with the
   cerebellar and basal notches that stop it reading as an egg ---- */
var BRAIN_R=210;
var PROFILE=[0.96,1.00,1.04,1.07,1.08,1.07,1.05,1.02,0.99,0.96,0.93,0.89,
             0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];
function sm(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function radiusAt(phi){
  var n=PROFILE.length,st=6.283185/n,a=phi%6.283185; if(a<0)a+=6.283185;
  var i=Math.floor(a/st),f=(a-i*st)/st,t=(1-Math.cos(f*Math.PI))/2;
  return PROFILE[i%n]*(1-t)+PROFILE[(i+1)%n]*t;
}
function widthAt(y,z){
  var w=0.68;   /* real proportions: 167 long x 140 wide x 93 high */
  w*=1-0.34*sm(0.25,1.00,z);                        // narrows to the frontal pole
  w*=1-0.40*sm(0.25,1.00,-z);                       // narrows to the occipital pole
  w*=1-0.32*sm(0.10,0.95,-y);                       // the base is narrower than the crown
  w*=1+0.32*Math.exp(-Math.pow((y+0.30)/0.30,2));   // the temporal bulge
  return w;
}
/* THE FORM.

   The first four sheets all failed the same way: whatever constellation was
   drawn on it, the figure came out a rounded polyhedron. The reason was the
   form, not the drawing. A lateral profile alone gives an egg, because the two
   cues that make a brain unmistakable from ABOVE and from the FRONT were
   missing — the longitudinal fissure and the temporal lobes.

   So the form is now genuinely bilobed: two bodies with a real gap between
   them, a surface that falls away toward the midline, a Sylvian groove and a
   temporal bulge hanging below it. */
function shell(d){
  var v=d.clone().normalize();
  var x=v.x, y=v.y, z=v.z, ax=Math.abs(x);
  var r=radiusAt(Math.atan2(y,z));
  var p=new THREE.Vector3(x*widthAt(y,z), y*r*0.74, z*r);

  /* THE LONGITUDINAL FISSURE — the single cue that makes the top and the front
     views read as a brain instead of an egg. The crown falls away toward the
     midline and the hemispheres stand apart. */
  var cleft=Math.exp(-Math.pow(ax/0.30,2))*sm(-0.15,0.85,y);
  p.y -= cleft*0.22;
  p.x += (x>=0?1:-1)*(0.030+0.022*sm(0.15,1.0,y));   /* a cleft, not a chasm */

  /* THE SYLVIAN FISSURE — the lateral groove that cuts the temporal lobe free
     of everything above it */
  var syl=Math.exp(-Math.pow((y+0.42*z+0.06)/0.13,2))*sm(0.28,0.72,ax);
  p.multiplyScalar(1-0.11*syl);

  return p.multiplyScalar(BRAIN_R);
}
function fib(i,n){
  var y=1-2*(i+0.5)/n, r=Math.sqrt(Math.max(0,1-y*y)), th=i*2.399963;
  return new THREE.Vector3(r*Math.cos(th), y, r*Math.sin(th));
}
function key(a,b){ return a<b ? a+'_'+b : b+'_'+a; }

/* ========== A — SURFACE CONSTELLATION ==========
   Stars scattered over the brain's surface, each joined to its nearest
   neighbours. The net traces the form, so its outline is the brain's outline
   from whichever direction you look. */
function buildA(){
  var N=78, P=[], E=[], seen={};
  for(var i=0;i<N;i++) P.push(shell(fib(i,N)));
  for(var a=0;a<N;a++){
    var d=[];
    for(var b=0;b<N;b++) if(b!==a) d.push([P[a].distanceTo(P[b]),b]);
    d.sort(function(p,q){return p[0]-q[0];});
    for(var k=0;k<3;k++){ var kk=key(a,d[k][1]); if(!seen[kk]){seen[kk]=1; E.push([a,d[k][1]]);} }
  }
  return {P:P,E:E};
}

/* ========== B — ANATOMICAL CONSTELLATION ==========
   Stars only where a brain has a landmark, joined along the boundaries between
   its lobes. Minimal, and every star is a place you could name. Mirrored, so
   the figure exists on both sides and holds from any angle. */
function buildB(){
  var L={}, P=[], E=[], seen={};
  function add(name,x,y,z){ L[name]=P.length; P.push(shell(new THREE.Vector3(x,y,z))); }
  function pair(name,x,y,z){ add(name+'L',x,y,z); add(name+'R',-x,y,z); }
  function link(a,b){ var kk=key(L[a],L[b]); if(!seen[kk]){seen[kk]=1; E.push([L[a],L[b]]);} }

  /* the midline chain, over the top from front to back and round underneath */
  add('front', 0.02, 0.10, 1.0);
  add('brow',  0.02, 0.62, 0.80);
  add('crown', 0.02, 1.00, 0.10);
  add('parM',  0.02, 0.86,-0.50);
  add('occ',   0.02, 0.18,-1.00);
  add('cbM',   0.02,-0.55,-0.82);
  add('stem',  0.02,-0.92,-0.10);
  add('base',  0.02,-0.80, 0.35);
  [['front','brow'],['brow','crown'],['crown','parM'],['parM','occ'],
   ['occ','cbM'],['cbM','stem'],['stem','base'],['base','front']]
    .forEach(function(t){ link(t[0],t[1]); });

  /* the lateral landmarks, both sides */
  pair('fp',  0.62, 0.18, 0.78);   // frontal, lateral
  pair('ft',  0.55, 0.70, 0.45);   // frontal, high
  pair('cs',  0.60, 0.86,-0.10);   // central, at the crown
  pair('par', 0.62, 0.55,-0.60);   // parietal
  pair('oc',  0.48, 0.10,-0.86);   // occipital, lateral
  pair('syA', 0.80,-0.14, 0.52);   // Sylvian, front end
  pair('syB', 0.92,-0.06,-0.05);   // Sylvian, middle
  pair('syC', 0.72, 0.10,-0.55);   // Sylvian, back end
  pair('tp',  0.62,-0.50, 0.55);   // temporal pole
  pair('tm',  0.78,-0.48,-0.05);   // temporal, middle
  pair('tb',  0.55,-0.42,-0.55);   // temporal, back
  pair('cb',  0.46,-0.62,-0.70);   // cerebellum

  ['L','R'].forEach(function(s){
    /* the Sylvian fissure: the line that separates the temporal lobe */
    link('syA'+s,'syB'+s); link('syB'+s,'syC'+s);
    /* the temporal lobe hanging below it */
    link('tp'+s,'tm'+s); link('tm'+s,'tb'+s);
    link('syA'+s,'tp'+s); link('syC'+s,'tb'+s);
    /* the frontal lobe above the front of it */
    link('fp'+s,'syA'+s); link('fp'+s,'ft'+s); link('ft'+s,'cs'+s);
    /* the central boundary running down to the fissure */
    link('cs'+s,'syB'+s);
    /* parietal and occipital */
    link('cs'+s,'par'+s); link('par'+s,'oc'+s); link('oc'+s,'syC'+s);
    /* the cerebellum, its own small mass */
    link('cb'+s,'tb'+s); link('cb'+s,'oc'+s); link('cb'+s,'cbM'); link('cb'+s,'stem');
    /* tie the lateral figure to the midline so it reads in the round */
    link('fp'+s,'front'); link('ft'+s,'brow'); link('cs'+s,'crown');
    link('par'+s,'parM'); link('oc'+s,'occ'); link('tp'+s,'base');
  });
  return {P:P,E:E};
}

/* ========== C — NEURAL CLOUD ==========
   Stars through the whole volume rather than on its surface, each joined to
   its two nearest neighbours. No outline is drawn at all: the shape is
   whatever the density of light happens to occupy. */
function buildC(){
  var N=150, P=[], E=[], seen={};
  for(var i=0;i<N;i++){
    var t=((i*0.6180339887)%1);
    /* biased outward, so the mass gathers near the cortex */
    P.push(shell(fib(i,N)).multiplyScalar(0.42+0.58*Math.sqrt(t)));
  }
  for(var a=0;a<N;a++){
    var dd=[];
    for(var b=0;b<N;b++) if(b!==a) dd.push([P[a].distanceTo(P[b]),b]);
    dd.sort(function(p,q){return p[0]-q[0];});
    for(var k=0;k<2;k++){ var kk=key(a,dd[k][1]); if(!seen[kk]){seen[kk]=1; E.push([a,dd[k][1]]);} }
  }
  return {P:P,E:E};
}

/* ========== D — RIBBED CONSTELLATION ==========
   A handful of closed rings, each a genuine cross-section of the form: five
   wrapping the front-to-back axis, two wrapping the left-to-right one.
   Whichever way you look, you are reading real sections of a solid that is
   never drawn. */
function buildD(){
  var P=[], E=[], SEG=18, rows=[];
  function ring(axis, ang){
    var start=P.length, u, v, w;
    if(axis==='z'){ u=new THREE.Vector3(1,0,0); v=new THREE.Vector3(0,1,0); w=new THREE.Vector3(0,0,1); }
    else          { u=new THREE.Vector3(0,0,1); v=new THREE.Vector3(0,1,0); w=new THREE.Vector3(1,0,0); }
    for(var i=0;i<SEG;i++){
      var t=(i/SEG)*6.283185;
      var d=new THREE.Vector3()
        .addScaledVector(w,Math.cos(ang))
        .addScaledVector(u,Math.sin(ang)*Math.cos(t))
        .addScaledVector(v,Math.sin(ang)*Math.sin(t));
      P.push(shell(d));
    }
    for(var j=0;j<SEG;j++) E.push([start+j, start+(j+1)%SEG]);
    return start;
  }
  [0.62,1.00,1.40,1.80,2.20].forEach(function(a){ rows.push(ring('z',a)); });
  ring('x',1.5708); ring('x',1.05);
  /* tie neighbouring sections together, so it is the cage of a form rather
     than a stack of unrelated hoops */
  for(var r=0;r<rows.length-1;r++)
    for(var i=0;i<SEG;i+=3) E.push([rows[r]+i, rows[r+1]+i]);
  return {P:P,E:E};
}

/* ========== E — THE ANATOMICAL CHAINS ==========
   B was the closest in shape but read as a faceted polyhedron, because its
   landmarks were joined by long straight chords that cut through the interior.
   D wrapped the volume convincingly but was too regular to be anything but a
   cage.

   E takes the structure of B and the volume-wrapping of D. Every line is a
   real anatomical boundary, and each one is a CHAIN of stars lying on the
   surface rather than one chord across the middle. Density therefore comes
   from subdividing lines that already had a reason to exist, never from adding
   new ones — which is the whole of "more lines do not mean more details". */
function buildE(){
  var P=[], E=[], seen={};
  function link(a,b){ var k=key(a,b); if(!seen[k]){seen[k]=1; E.push([a,b]);} }
  /* Catmull-Rom through control directions, resampled onto the surface, so a
     boundary curves the way the form curves instead of cutting across it. */
  function chain(ctrl, n, closed){
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
    for(var i=0;i<n;i++){
      idx.push(P.length);
      P.push(shell(at(closed ? i/n : i/(n-1))));
    }
    for(var j=0;j<idx.length-1;j++) link(idx[j],idx[j+1]);
    if(closed) link(idx[idx.length-1],idx[0]);
    return idx;
  }
  function mirror(ctrl){ return ctrl.map(function(c){ return [-c[0],c[1],c[2]]; }); }

  /* 1. THE PROFILE. The midsagittal outline, closed. This alone is the shape
     everyone pictures when they picture a brain from the side. */
  /* PARASAGITTAL, not midsagittal. At x=0.05 the ring sits inside the
     longitudinal cleft, which pulls the crown down and flattens the whole side
     view into a potato. Out at 0.34 it traces the profile a person actually
     sees, and mirroring it gives the two hemispheres their own outlines. */
  function profileRing(side){
    var c=[];
    for(var a=0;a<12;a++){ var t=a/12*6.283185; c.push([0.62*side, Math.sin(t), Math.cos(t)]); }
    return chain(c, 18, true);
  }
  var MID=profileRing(1), MIDR=profileRing(-1);

  /* 2. THE LONGITUDINAL FISSURE. A rim either side of the midline, running
     front to back over the crown. This is what makes the view from ABOVE read
     as two hemispheres rather than one oval. */
  var rimC=[[0.15,0.36,0.88],[0.17,0.74,0.62],[0.17,0.96,0.10],
            [0.16,0.88,-0.44],[0.14,0.46,-0.84]];
  var rimL=chain(rimC,9,false), rimR=chain(mirror(rimC),9,false);

  /* 3. THE SYLVIAN FISSURE, each side. The cleft that frees the temporal lobe,
     and the single most identifying mark on a lateral view. */
  var sylC=[[0.70,-0.20,0.58],[0.84,-0.16,0.28],[0.90,-0.08,-0.06],
            [0.82,0.02,-0.34],[0.66,0.10,-0.56]];
  var sylL=chain(sylC,8,false), sylR=chain(mirror(sylC),8,false);

  /* 4. THE TEMPORAL LOBE'S LOWER EDGE, each side, so the mass below the
     fissure is a lobe with a bottom rather than an open corner. */
  var tmpC=[[0.54,-0.56,0.52],[0.70,-0.56,0.16],[0.72,-0.52,-0.20],
            [0.56,-0.46,-0.50]];
  var tmpL=chain(tmpC,7,false), tmpR=chain(mirror(tmpC),7,false);

  /* 5. THE CEREBELLUM, each side: its own small arc behind and below the
     notch, so it reads as a separate organ. */
  var cbC=[[0.46,-0.36,-0.70],[0.50,-0.58,-0.78],[0.36,-0.76,-0.74],[0.14,-0.82,-0.58]];
  var cbL=chain(cbC,5,false), cbR=chain(mirror(cbC),5,false);

  /* 6. THE CENTRAL SULCUS, each side: the diagonal running down and forward
     from the crown to the fissure. Two marks at an angle read as anatomy. */
  var csC=[[0.34,0.90,-0.20],[0.62,0.62,-0.04],[0.80,0.28,0.08]];
  var csL=chain(csC,5,false), csR=chain(mirror(csC),5,false);

  /* short joins only, between stars that are already neighbours. Never a chord
     across the interior — that is exactly what flattened B into a polyhedron. */
  function nearest(i, pool){
    var best=-1, bd=1e9;
    pool.forEach(function(j){ var d=P[i].distanceTo(P[j]); if(d<bd){bd=d;best=j;} });
    return best;
  }
  [[sylL,tmpL],[sylR,tmpR],[sylL,csL],[sylR,csR],
   [tmpL,cbL],[tmpR,cbR],[cbL,MID],[cbR,MIDR],
   [rimL,MID],[rimR,MIDR],[csL,rimL],[csR,rimR],
   [sylL,MID],[sylR,MIDR]].forEach(function(pr){
     var from=pr[0], to=pr[1];
     [from[0], from[from.length-1]].forEach(function(i){ link(i, nearest(i,to)); });
   });
  return {P:P,E:E};
}

var B={A:buildA,B:buildB,C:buildC,D:buildD,E:buildE}['__APPROACH__']();

/* ---- the 15 MIG systems: a separate, brighter layer inside the figure ---- */
var MIGP=[], MIGC=[];
var TINT=[0x8a7bd8,0xd88b6a,0x4fa89b,0x6f8fd0,0xc9a15e,0x7fb08a,0xa87fc0,0xd06f8f,
          0x5fa0c8,0xc0b070,0x8fc07f,0xd0806f,0x7f9fd8,0xb090c8,0x70b0a8];
for(var mi=0;mi<15;mi++){
  var COLS=5, cx=(mi%COLS+0.5)/COLS, cy=(Math.floor(mi/COLS)+0.5)/3;
  cx+=(((mi*7)%5)/5-0.5)*0.10; cy+=(((mi*11)%7)/7-0.5)*0.18;
  var mz=(0.5-cx)*1.9, my=(0.56-cy)*1.5, lat=0.22+((mi*13)%4)/4*0.30;
  var side=(mi%2===0)?1:-1;
  MIGP.push(shell(new THREE.Vector3(lat*side,my,mz)).multiplyScalar(0.66));
  MIGC.push(new THREE.Color(TINT[mi]));
}

/* ---- scene ---- */
var scene=new THREE.Scene();
var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(1); renderer.setSize(__W__,__H__);
renderer.setClearColor(0x05070f,1);
renderer.autoClear=false;
document.body.appendChild(renderer.domElement);

/* Depth is the whole reason this reads as an object instead of a flat tangle.
   Without it, near and far are additively blended at identical brightness and
   every angle collapses into a cage. */
function pointMat(size,bright,fade){
  return new THREE.ShaderMaterial({
    uniforms:{ s:{value:size}, b:{value:bright}, f:{value:fade?1.0:0.0} },
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:['attribute vec3 tint; attribute float mag;',
      'varying vec3 vC; varying float vD; uniform float s;',
      'void main(){ vC=tint; vec4 mv=modelViewMatrix*vec4(position,1.0);',
      ' vD=-mv.z;',
      ' gl_PointSize=s*mag*(300.0/max(1.0,-mv.z));',
      ' gl_Position=projectionMatrix*mv; }'].join(String.fromCharCode(10)),
    fragmentShader:['varying vec3 vC; varying float vD; uniform float b; uniform float f;',
      'void main(){ float d=length(gl_PointCoord-vec2(0.5));',
      ' if(d>0.5) discard;',
      ' float a=pow(1.0-d*2.0,2.2);',
      ' float near=clamp((940.0-vD)/380.0,0.0,1.0);',
      ' a*=mix(1.0, 0.13+0.87*near*near, f);',
      ' gl_FragColor=vec4(vC*b,a); }'].join(String.fromCharCode(10))
  });
}
function pointsFrom(list,cols,mags,size,bright,fade){
  var g=new THREE.BufferGeometry(), pos=[],tn=[],mg=[];
  list.forEach(function(p,i){
    pos.push(p.x,p.y,p.z);
    var c=cols?cols[i]:new THREE.Color(0xdfe8f8);
    tn.push(c.r,c.g,c.b);
    mg.push(mags?mags[i]:1.0);
  });
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('tint',new THREE.Float32BufferAttribute(tn,3));
  g.setAttribute('mag',new THREE.Float32BufferAttribute(mg,1));
  return new THREE.Points(g,pointMat(size,bright,fade));
}

/* the sky, in three layers by spatial frequency */
scene.add(buildGas());
scene.add(buildDeepSky());

/* THE STARS — real points in three dimensions at a spread of distances, so the
   field has depth and turns with parallax when the mind turns. A magnitude
   distribution rather than a sprinkle: most faint, a few bright enough to
   carry a colour, and gathered toward a galactic band. */
var near=[],nearc=[],nearm=[];
for(var si=0;si<2600;si++){
  var sd=fib(si,2600), R=1000+((si*137)%1400);
  var band=Math.exp(-Math.pow(sd.y/0.55,2));
  if(((si*29)%1000)/1000 > 0.34+0.66*band) continue;
  near.push(new THREE.Vector3(sd.x*R,sd.y*R,sd.z*R));
  var mg=((si*7919)%1000)/1000;
  var w=0.30+mg*mg*mg*0.70;
  var t2=((si*104729)%1000)/1000, col;
  if(t2>0.88)      col=[1.00,0.86,0.72];
  else if(t2>0.74) col=[1.00,0.96,0.88];
  else if(t2>0.32) col=[0.91,0.94,0.99];
  else             col=[0.78,0.86,1.00];
  nearc.push(new THREE.Color(col[0]*w,col[1]*w,col[2]*w));
  nearm.push(0.34+mg*mg*1.30);
}
scene.add(pointsFrom(near,nearc,nearm,20.0,1.55,false));

/* the figure's own stars, unequal in magnitude as real ones are */
var mags=B.P.map(function(_,i){ return 0.72+((i*17)%23)/23*0.75; });
scene.add(pointsFrom(B.P,null,mags,34.0,1.0,true));

/* the constellation lines: straight segments between stars */
(function(){
  var g=new THREE.BufferGeometry(), pos=[];
  B.E.forEach(function(e){
    var a=B.P[e[0]], b=B.P[e[1]];
    pos.push(a.x,a.y,a.z, b.x,b.y,b.z);
  });
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  scene.add(new THREE.LineSegments(g,new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:['varying float vD;',
      'void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vD=-mv.z;',
      ' gl_Position=projectionMatrix*mv; }'].join(String.fromCharCode(10)),
    fragmentShader:['varying float vD;',
      'void main(){ float near=clamp((940.0-vD)/380.0,0.0,1.0);',
      ' float a=0.68*(0.08+0.92*near*near);',
      ' gl_FragColor=vec4(vec3(0.44,0.53,0.74),a); }'].join(String.fromCharCode(10))
  })));
})();

/* the MIG systems, brighter and coloured, inside the figure */
scene.add(pointsFrom(MIGP,MIGC,MIGP.map(function(){return 1.9;}),44.0,1.7,true));

/* ---- four angles on one sheet, because "reads from every direction" is only
   testable if you can see every direction at once ---- */
var VIEWS=[
  ['side',          1.00, 0.10, 0.10],
  ['front',         0.06, 0.10, 1.00],
  ['top',           0.05, 1.00, 0.08],
  ['three-quarter', 0.78, 0.42, 0.62]
];
var hw=__W__/2, hh=__H__/2;
var cam=new THREE.PerspectiveCamera(34, hw/hh, 1, 6000);
renderer.clear();
var tags=document.getElementById('tags');
VIEWS.forEach(function(v,i){
  var col=i%2, row=Math.floor(i/2);
  var x=col*hw, y=__H__-(row+1)*hh;
  renderer.setViewport(x,y,hw,hh);
  renderer.setScissor(x,y,hw,hh);
  renderer.setScissorTest(true);
  cam.position.set(v[1],v[2],v[3]).normalize().multiplyScalar(720);
  cam.up.set(0,1,0);
  if(v[0]==='top') cam.up.set(0,0,-1);
  cam.lookAt(0,0,0);
  renderer.render(scene,cam);
  var t=document.createElement('div');
  t.textContent=v[0];
  t.style.left=(col*hw+14)+'px';
  t.style.top=(row*hh+12)+'px';
  tags.appendChild(t);
});
document.title=JSON.stringify({approach:'__APPROACH__',stars:B.P.length,lines:B.E.length});
`;

const html = '<!doctype html><html><head><meta charset="utf-8"><style>\n' +
  'html,body{margin:0;height:100%;background:#05070f;overflow:hidden}\n' +
  'canvas{display:block}\n' +
  '#tags{position:fixed;inset:0;pointer-events:none;font:10px/1.4 ui-monospace,monospace;' +
  'letter-spacing:.18em;color:#7d8ba6;text-transform:uppercase}\n' +
  '#tags div{position:absolute}\n' +
  '#name{position:fixed;left:16px;bottom:12px;font:12px/1 ui-monospace,monospace;' +
  'letter-spacing:.22em;color:#aab8d0;text-transform:uppercase}\n' +
  '</style></head><body>\n' +
  '<div id="name">approach ' + APPROACH + '</div><div id="tags"></div>\n' +
  '<script>' + three + '</script>\n<script>' +
  body.split('__APPROACH__').join(APPROACH).split('__W__').join(W).split('__H__').join(H) +
  '</script></body></html>';

fs.writeFileSync(path.join(__dirname, 'proto.html'), html, 'utf8');
console.log('approach ' + APPROACH + '  ' + W + 'x' + H);
