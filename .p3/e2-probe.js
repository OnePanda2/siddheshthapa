/* the harness reports the DRAWING, not a mesh. Every field is read off the
   live curve set, so §32 can be asserted from measurements. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
const a = s.indexOf('  /* THE ORGAN — measured, not described. */');
const b = s.indexOf('  brain:function(){', a);
if (a < 0 || b < 0) { console.error('anchors'); process.exit(1); }

const repl = `  /* THE DRAWING — measured, not described. */
  organ:function(){
    var o={ exists:true, isMesh:false, drawCalls:0 };
    var curves=buildBrainCurves(BRAIN_VIEW, window.innerWidth<768?0.5:1);
    o.curves=curves.length;
    o.named=curves.map(function(c){ return c.id; });
    o.byLayer={};
    curves.forEach(function(c){ o.byLayer[c.layer]=(o.byLayer[c.layer]||0)+1; });
    /* the drawing's own extent, and how much of it is DEPTH — a flat drawing
       pinned to a plane would have none */
    var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
    var near=0,far=0,minAbsX=1e9,pts=0;
    curves.forEach(function(c){
      c.pts.forEach(function(p){
        pts++;
        if(p.x<mnx)mnx=p.x; if(p.x>mxx)mxx=p.x;
        if(p.y<mny)mny=p.y; if(p.y>mxy)mxy=p.y;
        if(p.z<mnz)mnz=p.z; if(p.z>mxz)mxz=p.z;
        if(p.x>0)near++; else far++;
        if(Math.abs(p.x)<minAbsX) minAbsX=Math.abs(p.x);
      });
    });
    o.points=pts;
    o.bbox={ w:+(mxx-mnx).toFixed(1), h:+(mxy-mny).toFixed(1), d:+(mxz-mnz).toFixed(1) };
    /* a curve set that sits on a plane has zero spread on one axis; this one
       wraps a form, so every axis carries extent */
    o.depthSpread=+((mxx-mnx)/Math.max(1,mxz-mnz)).toFixed(3);
    o.hemispheres={ near:near, far:far };
    o.midlineGap=+(minAbsX*2).toFixed(2);

    /* the outline, read back from the same table the shell uses */
    var prof=[], N=72;
    for(var k=0;k<N;k++) prof.push(+brainRadius(k/N*6.283185).toFixed(4));
    o.profile=prof;
    var mins=[], maxs=[];
    for(var j=0;j<N;j++){
      var pa=prof[(j-1+N)%N], pb=prof[j], pc=prof[(j+1)%N];
      if(pb<pa && pb<=pc) mins.push(+(j/N*360).toFixed(0));
      if(pb>pa && pb>=pc) maxs.push(+(j/N*360).toFixed(0));
    }
    o.minimaAt=mins; o.maximaAt=maxs;
    var A=0,B=0;
    for(var q=0;q<N;q++){ var t=q/N*6.283185;
      A=Math.max(A,Math.abs(prof[q]*Math.cos(t))); B=Math.max(B,Math.abs(prof[q]*Math.sin(t))); }
    var dev=0;
    for(var q2=0;q2<N;q2++){ var t2=q2/N*6.283185;
      var e=1/Math.sqrt(Math.pow(Math.cos(t2)/A,2)+Math.pow(Math.sin(t2)/B,2));
      dev=Math.max(dev, Math.abs(prof[q2]-e)/e); }
    o.ellipseDeviation=+dev.toFixed(3);

    /* where each named region of the drawing actually lands on the face, so a
       check can prove the temporal, frontal and cerebellar marks exist WHERE
       they are claimed to rather than merely existing */
    function span(id){
      var c=null;
      curves.forEach(function(x){ if(x.id===id) c=x; });
      if(!c) return null;
      var lo=[1e9,1e9], hi=[-1e9,-1e9];
      c.pts.forEach(function(p){
        var d=p.clone().normalize();
        lo[0]=Math.min(lo[0],d.z); hi[0]=Math.max(hi[0],d.z);
        lo[1]=Math.min(lo[1],d.y); hi[1]=Math.max(hi[1],d.y);
      });
      return { u:[+lo[0].toFixed(2),+hi[0].toFixed(2)], v:[+lo[1].toFixed(2),+hi[1].toFixed(2)] };
    }
    o.spans={ sylvian:span('sylvian'), central:span('central'),
              temporal:span('superior-temporal'), frontal:span('superior-frontal'),
              cerebellar:span('cerebellar-edge'), midline:span('midline') };

    if(camera){
      var dir=camera.position.clone().sub(camAim).normalize();
      o.lateralDeg=+(Math.acos(Math.max(-1,Math.min(1,Math.abs(dir.x))))*180/Math.PI).toFixed(1);
      o.viewDeclared=+(Math.acos(Math.abs(BRAIN_VIEW.x))*180/Math.PI).toFixed(1);
    }
    if(camera && renderer){
      var W=renderer.domElement.clientWidth, H=renderer.domElement.clientHeight;
      var xs=[],ys=[],off=0,samp=0;
      curves.forEach(function(c){
        for(var i=0;i<c.pts.length;i+=3){
          var v=c.pts[i].clone().project(camera);
          var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
          xs.push(px); ys.push(py); samp++;
          if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1) off++;
        }
      });
      var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
      var y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
      o.frame={ w:W, h:H, offScreen:off, samples:samp,
                x0:Math.round(x0), x1:Math.round(x1), y0:Math.round(y0), y1:Math.round(y1),
                fillsW:+((x1-x0)/W).toFixed(3), fillsH:+((y1-y0)/H).toFixed(3) };
      var phone=window.innerWidth<768;
      var rx0=phone?0:Math.round(W*0.26);
      o.frame.inReadable=(x0>=rx0-4 && x1<=W+4 && y0>=-4 && y1<=H+4);
      o.frame.margin=Math.round(Math.min(x0-rx0, y0, W-x1, H-y1));
    }
    o.staging={ dim:+WELCOME_DIM.toFixed(3), ask:+BRAIN_ASK.toFixed(3),
                open:+mindOpen.toFixed(3) };
    /* the anatomy shares the buffer the relationships use, so the two are
       counted separately to prove they are separate LAYERS rather than one
       undifferentiated pile of segments */
    o.anatomyLineVerts=(typeof GYRI_COUNT==='number')?GYRI_COUNT:-1;
    o.graphLineVerts=(typeof LINKS!=='undefined' && LINKS.length)?LINKS.length:0;
    return o;
  },
`;
fs.writeFileSync(F, s.slice(0, a) + repl + s.slice(b), 'utf8');
console.log('organ() now reports the drawing');
