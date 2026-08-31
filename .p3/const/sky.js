/* THE DEEP FIELD — three layers, each at the resolution its content needs.

   The first attempt painted everything into one equirectangular texture and
   mapped it on a sphere. Gas survived that; galaxies and a black hole did not.
   A 26-pixel feature on a 1024-wide texture wrapped around the sky subtends an
   enormous angle, so the black hole rendered as a tan smear across a quarter of
   the frame and every radial gradient banded into visible rings.

   So the layers are split by spatial frequency, which is the only thing that
   actually decides where something should live:

     1. GAS      — very low frequency. A small texture on a sphere is correct,
                   and blurry is what gas looks like anyway.
     2. STARS    — high frequency, need to stay sharp, need parallax.
                   Real points in three dimensions. One draw call.
     3. DEEP SKY — galaxies and the black hole. Sharp, small, few. Points
                   carrying a sprite atlas, so they stay crisp at any size
                   and still cost one draw call between them.

   Nothing here is recomputed after boot. */

const SRC = `
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
`;

module.exports = { SRC };
