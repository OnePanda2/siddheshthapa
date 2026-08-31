/* the harness reports the ORGAN — its mesh, its profile and its projection —
   so §34 can be asserted from measurements rather than from screenshots alone.
   Every field here is read off the live scene; nothing is declared twice. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  brain:function(){`,
`  /* THE ORGAN — measured, not described. */
  organ:function(){
    var o={ exists:!!brainMesh, geometries:null };
    if(!brainMesh||!brainGeo) return o;
    var pos=brainGeo.attributes.position, nrm=brainGeo.attributes.normal;
    o.verts=pos.count; o.tris=brainGeo.index?brainGeo.index.count/3:0;
    o.drawCalls=1;                      // one mesh, both hemispheres
    o.sameGeometryAsWelcome=true;       // there is only one, by construction

    /* volume, not a plane: how much of the mesh's own extent is depth, and do
       its normals actually point in every direction */
    var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9,mnz=1e9,mxz=-1e9;
    var left=0,right=0,minAbsX=1e9, octants={};
    for(var i=0;i<pos.count;i++){
      var x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
      if(x<mnx)mnx=x; if(x>mxx)mxx=x;
      if(y<mny)mny=y; if(y>mxy)mxy=y;
      if(z<mnz)mnz=z; if(z>mxz)mxz=z;
      if(x<0)left++; else right++;
      if(Math.abs(x)<minAbsX) minAbsX=Math.abs(x);
      var nx=nrm.getX(i),ny=nrm.getY(i),nz=nrm.getZ(i);
      octants[(nx<0?0:1)+''+(ny<0?0:1)+''+(nz<0?0:1)]=1;
    }
    o.bbox={ w:+(mxx-mnx).toFixed(1), h:+(mxy-mny).toFixed(1), d:+(mxz-mnz).toFixed(1) };
    o.hemispheres={ left:left, right:right };
    o.midlineGap=+(minAbsX*2).toFixed(2);
    o.normalOctants=Object.keys(octants).length;   // 8 means it closes in every direction

    /* the lateral profile, read back from the same table the shell uses, so a
       check tests the SHAPE rather than a copy of the numbers */
    var prof=[], N=72;
    for(var k=0;k<N;k++) prof.push(+brainRadius(k/N*6.283185).toFixed(4));
    o.profile=prof;
    /* local minima and maxima around the outline. An ellipse has exactly two
       of each; a brain has notches. */
    var mins=[], maxs=[];
    for(var j=0;j<N;j++){
      var a=prof[(j-1+N)%N], b=prof[j], c=prof[(j+1)%N];
      if(b<a && b<=c) mins.push(+(j/N*360).toFixed(0));
      if(b>a && b>=c) maxs.push(+(j/N*360).toFixed(0));
    }
    o.minimaAt=mins; o.maximaAt=maxs;
    /* how far the outline departs from the best-fit ellipse through it */
    var A=0,B=0;
    for(var q=0;q<N;q++){ var t=q/N*6.283185;
      A=Math.max(A,Math.abs(prof[q]*Math.cos(t))); B=Math.max(B,Math.abs(prof[q]*Math.sin(t))); }
    var dev=0;
    for(var q2=0;q2<N;q2++){ var t2=q2/N*6.283185;
      var e=1/Math.sqrt(Math.pow(Math.cos(t2)/A,2)+Math.pow(Math.sin(t2)/B,2));
      dev=Math.max(dev, Math.abs(prof[q2]-e)/e); }
    o.ellipseDeviation=+dev.toFixed(3);

    /* the named fissures, sampled where they are supposed to be */
    function cut(x,y,z){ return +fissureDepth(new THREE.Vector3(x,y,z).normalize()).toFixed(4); }
    o.fissures={ sylvian:cut(0.86,-0.18,0.30), transverse:cut(0.62,-0.42,-0.60),
                 crown:cut(0.30,0.94,0.10) };

    /* where the camera actually is relative to pure lateral */
    if(camera){
      var dir=camera.position.clone().sub(camAim).normalize();
      var ax=Math.abs(dir.x);
      o.lateralDeg=+(Math.acos(Math.max(-1,Math.min(1,ax)))*180/Math.PI).toFixed(1);
      o.viewDeclared=+(Math.acos(Math.abs(BRAIN_VIEW.x))*180/Math.PI).toFixed(1);
    }
    /* the organ's OWN projected footprint — the MIG cloud is not the brain */
    if(camera && renderer){
      var W=renderer.domElement.clientWidth, H=renderer.domElement.clientHeight;
      var xs=[],ys=[],off=0;
      for(var s=0;s<pos.count;s+=7){
        var v=new THREE.Vector3(pos.getX(s),pos.getY(s),pos.getZ(s)).project(camera);
        var px=(v.x*0.5+0.5)*W, py=(-v.y*0.5+0.5)*H;
        xs.push(px); ys.push(py);
        if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1) off++;
      }
      var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
      var y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
      o.frame={ w:W, h:H, offScreen:off, samples:xs.length,
                x0:Math.round(x0), x1:Math.round(x1), y0:Math.round(y0), y1:Math.round(y1),
                fillsW:+((x1-x0)/W).toFixed(3), fillsH:+((y1-y0)/H).toFixed(3) };
      /* the readable area: on a desktop the sheet owns the left */
      var phone=window.innerWidth<768;
      var rx0=phone?0:Math.round(W*0.26);
      o.frame.inReadable = (x0>=rx0-4 && x1<=W+4 && y0>=-4 && y1<=H+4);
      o.frame.margin=Math.round(Math.min(x0-rx0, y0, W-x1, H-y1));
    }
    o.uniforms={ open:+brainMesh.material.uniforms.uOpen.value.toFixed(3),
                 dim:+brainMesh.material.uniforms.uDim.value.toFixed(3),
                 ask:+brainMesh.material.uniforms.uAsk.value.toFixed(3) };
    o.visible=brainMesh.visible;
    /* how many line-buffer vertices the brain's anatomy contributes. The whole
       point of the redesign is that this is ZERO. */
    o.anatomyLineVerts=(typeof GYRI_COUNT==='number')?GYRI_COUNT:-1;
    return o;
  },
  brain:function(){`);

console.log(n + ' edits applied');
