/* §13/§16 — the mind's content has to be READABLE inside the organ.

   With the shell drawn over the points, seven of the fifteen regions were
   illegible: a MIG label is the menu, and a menu you cannot read is not a
   menu. But drawing the points on top unconditionally would put a
   far-hemisphere region in front of the near cortex, which destroys the
   volume the shell was built to create.

   So: the points draw last, and a brain-mode depth term does the work the
   occlusion was doing. A region on the near side is full strength; one on the
   far side is drained toward the page. Depth is felt rather than clipped —
   which is also how atmospheric perspective already works everywhere else in
   this scene, so it is the same idea applied at organ scale. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the vertex stage measures how deep into the organ this body sits */
sub(`      'attribute float region; attribute float capPx;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',`,
`      'attribute float region; attribute float capPx;',
      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'uniform float brainMid; varying float vBrain;',`);

sub(`      '  vFog=-mv.z;',
      '  gl_Position=projectionMatrix*mv;',`,
`      '  vFog=-mv.z;',
      /* -1 at the back of the organ, +1 at the front. Only meaningful while
         the mind is folded; once it opens, the universe supplies its own depth. */
      '  vBrain=clamp((brainMid-(-mv.z))/210.0,-1.0,1.0);',
      '  gl_Position=projectionMatrix*mv;',`);

sub(`      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'void main(){',
      '  vec2 uv=(vCell+gl_PointCoord)/cells;',`,
`      'varying vec2 vCell; varying vec3 vTint; varying float vFog; varying float vEmph;',
      'uniform float mindOpen; varying float vBrain;',
      'void main(){',
      '  vec2 uv=(vCell+gl_PointCoord)/cells;',`);

sub(`      '  gl_FragColor=vec4(col,a*(1.0-clamp(f*0.55,0.0,0.88)));',
      '}'].join('\\n')
  });
  pts=new THREE.Points(geo,mat);`,
`      '  float out_a=a*(1.0-clamp(f*0.55,0.0,0.88));',
      /* inside the organ, depth is the whole hierarchy: the near hemisphere
         is legible, the far one is present but recessive. Without this the
         two hemispheres would read as one flat sheet of labels. */
      '  float d=clamp(vBrain*0.5+0.5,0.0,1.0);',
      '  float bd=mix(0.30,1.0,pow(d,1.25));',
      '  out_a*=mix(bd,1.0,mindOpen);',
      '  col=mix(mix(fogColor,col,bd),col,mindOpen);',
      '  if(out_a<0.004) discard;',
      '  gl_FragColor=vec4(col,out_a);',
      '}'].join('\\n')
  });
  pts=new THREE.Points(geo,mat);
  /* AFTER the organ. A label the tissue swallows is not a menu. */
  pts.renderOrder=3;`);

sub(`               hoverNode:{value:-1.0}, mindOpen:{value:0.0} },
    transparent:true, depthWrite:false,
    vertexShader:[
      'uniform float minPx; uniform float maxPx;',`,
`               hoverNode:{value:-1.0}, mindOpen:{value:0.0}, brainMid:{value:600.0} },
    transparent:true, depthWrite:false,
    vertexShader:[
      'uniform float minPx; uniform float maxPx;',`);

/* the same camera distance the line layer already uses */
sub(`  pts.material.uniforms.mindOpen.value=mindOpen;`,
`  pts.material.uniforms.mindOpen.value=mindOpen;
  pts.material.uniforms.brainMid.value=camera.position.length();`);

console.log(n + ' edits applied');
