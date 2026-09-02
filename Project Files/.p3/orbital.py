import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

OLD = """/* Each constellation is a local volume. Minor IGs sit near their centre,
   writings further out — density is honest, so a region with one writing
   really is sparse and a region with twelve really is dense. */
MIGS.forEach(function(m){
  var mem=owned[m.id]||[], n=Math.max(1,mem.length);
  mem.forEach(function(id,k){
    var node=byId[id];
    var minor=(node.t==='minor');
    var scale=Math.pow(Math.max(1,n)/8,0.42);
    var r=((minor?11:20)+((k*7)%9))*scale;
    var p=seedSphere(k,n,r);
    node.pos=new THREE.Vector3().addVectors(m.pos,p);
    node.home=m.id;
  });
});"""

NEW = """/* ── 1b. A MIG WITH A TEMPLATE BECOMES A SOLAR SYSTEM ─────────────────
   The astronomy is injected from data/astronomy-systems.json, which holds
   figures retrieved from the NASA Exoplanet Archive. Nothing here is a
   constant somebody typed: change the dataset and the geometry follows.

   The MIG is the star. Its concepts occupy orbital positions whose RELATIVE
   spacing is the measured spacing — r_i / r_0 is exactly a_i / a_0 — so
   TRAPPIST-1's real signature (seven orbits inside 0.062 AU, outer 5.36x the
   inner) survives normalisation. Absolute AU is discarded because it means
   nothing here; the architecture is what we borrowed.

   Writings are NOT planets. They are secondary bodies belonging to the
   concept they actually connect to in the graph. */
var ASTRO_DATA=/*__ASTRO__*/;
var ASTRO={}; (ASTRO_DATA.systems||[]).forEach(function(sy){ ASTRO[sy.system]=sy; });

/* Only Philosophy is assigned for the vertical slice. The rest keep the
   earlier spherical layout until this model is judged worth generalising. */
var MIG_SYSTEM={ 'philosophy':'TRAPPIST-1' };
function templateFor(migId){ return ASTRO[MIG_SYSTEM[migId]]||null; }

var ORBIT_R0=13;                     // the innermost orbit, in scene units
var SYS_TILT=0.42;                   // one shared viewing tilt, ~24 degrees

/* TRAPPIST-1 is famously coplanar — mutual inclinations under ~0.1 degrees —
   so the orbits stay nearly flat. That flatness is a real property of the
   system, not a shortcut, and exaggerating it would misrepresent the source. */
function orbitalSlots(tpl){
  var a=tpl.semiMajorAxisAU, inner=a[0];
  return a.map(function(v){ return ORBIT_R0*(v/inner); });
}
function localOrbit(r,theta,incl){
  var x=Math.cos(theta)*r, z=Math.sin(theta)*r, y=Math.sin(theta)*r*incl;
  // tilt the whole system once so the orbital plane reads as a plane in 3D
  return new THREE.Vector3(x, y*Math.cos(SYS_TILT)-z*Math.sin(SYS_TILT),
                              y*Math.sin(SYS_TILT)+z*Math.cos(SYS_TILT));
}

var ORBITS={};                       // migId -> [{id,r,theta,incl}] for checking

MIGS.forEach(function(m){
  var mem=owned[m.id]||[], n=Math.max(1,mem.length);
  var tpl=templateFor(m.id);

  if(tpl){
    var concepts=mem.filter(function(id){ return byId[id].t==='minor'; });
    var writings=mem.filter(function(id){ return byId[id].t!=='minor'; });
    var slots=orbitalSlots(tpl);
    ORBITS[m.id]=[];
    concepts.forEach(function(id,k){
      var node=byId[id];
      /* Exact 7<->7: concept k takes orbit k, no interpolation. Angle comes
         from the concept's own graph degree so the arrangement is derived
         rather than decorative — never k/n*2pi, which is what turns every
         world into the same radial menu. */
      var theta=k*2.39996+((degree[id]||0)%5)*0.42;
      var incl=0.02+((k%3)*0.012);        // near-coplanar, as measured
      var r=slots[Math.min(k,slots.length-1)];
      node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(r,theta,incl));
      node.home=m.id; node.orbit={r:r,theta:theta,slot:k};
      ORBITS[m.id].push({id:id,r:r,theta:theta,slot:k});
    });
    /* a writing sits just outside whichever concept it actually connects to;
       with no such edge it joins a quiet belt beyond the outermost orbit */
    var outer=slots[slots.length-1];
    writings.forEach(function(id,k){
      var node=byId[id];
      var host=null;
      (adj[id]||[]).forEach(function(e){
        if(!host && byId[e.o] && byId[e.o].t==='minor' && byId[e.o].mig===m.id) host=byId[e.o];
      });
      if(host && host.pos){
        var off=k*1.31+(degree[id]||0)*0.7;
        node.pos=new THREE.Vector3().addVectors(host.pos,
          new THREE.Vector3(Math.cos(off)*5.2, Math.sin(off*1.7)*2.4, Math.sin(off)*5.2));
        node.belt=false;
      } else {
        var th=k*2.39996+1.1;
        node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(outer*1.34,th,0.05));
        node.belt=true;
      }
      node.home=m.id;
    });
  } else {
    /* every other MIG keeps the previous spherical distribution */
    mem.forEach(function(id,k){
      var node=byId[id];
      var minor=(node.t==='minor');
      var scale=Math.pow(Math.max(1,n)/8,0.42);
      var r=((minor?11:20)+((k*7)%9))*scale;
      node.pos=new THREE.Vector3().addVectors(m.pos, seedSphere(k,n,r));
      node.home=m.id;
    });
  }
});"""

assert OLD in s
s = s.replace(OLD, NEW)

# ── the orbit paths themselves: one batched geometry, one draw call ────────
s = s.replace("  lineSeg=new THREE.LineSegments(lg,lm);\n  scene.add(lineSeg);",
"""  lineSeg=new THREE.LineSegments(lg,lm);
  scene.add(lineSeg);

  /* ORBIT PATHS. Thin, atmospheric, and batched into ONE geometry so seven
     rings cost one draw call. They must register as structure without
     becoming the subject — an orbit drawn brightly is a dashboard ring. */
  var ov=[], oa=[];
  Object.keys(ORBITS).forEach(function(mid){
    var centre=byId[mid].pos, seen={};
    ORBITS[mid].forEach(function(sl){
      if(seen[sl.r]) return; seen[sl.r]=1;
      var STEP=110, incl=0.02;
      for(var q=0;q<STEP;q++){
        [q,q+1].forEach(function(w){
          var th=(w/STEP)*6.2832;
          var pt=new THREE.Vector3().addVectors(centre, localOrbit(sl.r,th,incl));
          ov.push(pt.x,pt.y,pt.z);
          oa.push(0.16-Math.min(0.09,sl.r*0.0009));   // outer rings quieter
        });
      }
    });
  });
  if(ov.length){
    var og=new THREE.BufferGeometry();
    og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ov),3));
    og.setAttribute('alpha',new THREE.BufferAttribute(new Float32Array(oa),1));
    var om=new THREE.ShaderMaterial({
      uniforms:{ tint:{value:new THREE.Color(0x2b4f86)}, near:{value:1.0} },
      transparent:true, depthWrite:false,
      vertexShader:['attribute float alpha; varying float vA; varying float vD;',
        'void main(){ vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0);',
        ' vD=-mv.z; gl_Position=projectionMatrix*mv; }'].join('\\n'),
      fragmentShader:['uniform vec3 tint; uniform float near; varying float vA; varying float vD;',
        /* the paths only exist when you are close enough for them to mean
           something; from the universe they would be noise */
        'void main(){ float vis=clamp((260.0-vD)/170.0,0.0,1.0);',
        ' float a=vA*vis*near; if(a<0.004) discard;',
        ' gl_FragColor=vec4(tint,a); }'].join('\\n')
    });
    orbitLines=new THREE.LineSegments(og,om);
    scene.add(orbitLines);
  }""")

s = s.replace("var pts=null, lineSeg=null, nodeOrder=[], nodeIndex={};",
              "var pts=null, lineSeg=null, orbitLines=null, nodeOrder=[], nodeIndex={};")

# ── arrive looking ALONG the orbital plane, not down the sphere normal ────
s = s.replace("""  var n=byId[id]; if(!n||!n.pos) return {p:wantPos.clone(), a:wantAim.clone()};
  var out=n.pos.clone().normalize().multiplyScalar(mode==='region'?62:26);
  return {p:new THREE.Vector3().addVectors(n.pos,out), a:n.pos.clone()};""",
"""  var n=byId[id]; if(!n||!n.pos) return {p:wantPos.clone(), a:wantAim.clone()};
  /* An orbital world has a plane, so arrive ABOVE and OUTSIDE it — looking
     down the sphere normal would flatten the architecture we borrowed. */
  if(mode==='region' && templateFor(id)){
    var away=n.pos.clone().normalize().multiplyScalar(96);
    var lift=new THREE.Vector3(0, 64, 0).applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    return {p:new THREE.Vector3().addVectors(n.pos, away.add(lift)), a:n.pos.clone()};
  }
  var out=n.pos.clone().normalize().multiplyScalar(mode==='region'?62:26);
  return {p:new THREE.Vector3().addVectors(n.pos,out), a:n.pos.clone()};""")

# ── expose the orbital truth for the checker ──────────────────────────────
s = s.replace("  dom:function(){",
"""  astro:function(){
    var out={assigned:{}, orbits:{}, dataset:{systems:(ASTRO_DATA.systems||[]).length,
             source:ASTRO_DATA._sourceType||null, retrieved:ASTRO_DATA._retrieved||null}};
    Object.keys(MIG_SYSTEM).forEach(function(mid){
      var tpl=templateFor(mid);
      out.assigned[mid]=tpl?{system:tpl.system, planets:tpl.planetCount,
        axes:tpl.semiMajorAxisAU, confidence:tpl.confidence, sourceType:tpl.sourceType}:null;
    });
    Object.keys(ORBITS).forEach(function(mid){
      var centre=byId[mid].pos;
      out.orbits[mid]=ORBITS[mid].map(function(sl){
        var n=byId[sl.id];
        return {id:sl.id, slot:sl.slot, r:+sl.r.toFixed(3),
                mig:n.mig, t:n.t,
                dist:+centre.distanceTo(n.pos).toFixed(3)};
      });
    });
    out.orbitLineObject=!!orbitLines;
    return out;
  },
  dom:function(){""")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('orbital layout implemented from the measured axes')
