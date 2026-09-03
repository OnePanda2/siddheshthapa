import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ══════════════════════════════════════════════════════════════════════════
# MIG PALETTES — colour carries identity, and identity lives in data.
#
# The site stays WHITE-FIRST: the ground is always a near-white and darkness
# only ever comes from distance or focus. What a world owns is its ATMOSPHERE
# — the tone that distance fades toward — plus its star, bodies and orbits.
# Three Philosophy variants exist so the direction can be judged from renders
# rather than argued about; #palette:a|b|c selects one.
# ══════════════════════════════════════════════════════════════════════════
PALETTE = """
var PHIL_VARIANTS={
  a:{ name:'cobalt + indigo',
      fog:0xa8b6d4, star:0x1b2f6b, body:0x35508f, orbit:0x3c5ba9, accent:0x2b4fa8 },
  b:{ name:'electric blue + violet',
      fog:0xb2b0da, star:0x2a1f6e, body:0x4741a3, orbit:0x5a4fc0, accent:0x5136c9 },
  c:{ name:'deep navy depth + cyan/violet',
      fog:0x9fb4c8, star:0x0f2340, body:0x2d5f7a, orbit:0x2f6f8f, accent:0x1d7fa8 }
};
var PALETTE_PICK=(function(){
  var m=/(^|[#&])palette:([abc])/.exec(location.hash||'');
  return m?m[2]:'a';
})();
var MIG_PALETTE={};
(function(){
  var v=PHIL_VARIANTS[PALETTE_PICK]||PHIL_VARIANTS.a;
  MIG_PALETTE['philosophy']={fog:v.fog, star:v.star, body:v.body, orbit:v.orbit, accent:v.accent};
})();
/* every other MIG keeps the neutral atmosphere until its own world is built —
   inventing thirteen palettes before their geometry exists would be decoration */
var NEUTRAL_PALETTE={fog:0xc9d3dc, star:0x1a3350, body:0x46525f, orbit:0x2b4f86, accent:0x2b6cb0};
function paletteOf(migId){ return MIG_PALETTE[migId]||NEUTRAL_PALETTE; }
"""
s = s.replace("var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};",
              PALETTE + "var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};")

# bodies take their own world's colour
s = s.replace("    var c=new THREE.Color(n.t==='mig'?0x1a3350:0x46525f);",
              "    var pal=paletteOf(n.mig);\n"
              "    var c=new THREE.Color(n.t==='mig'?pal.star:pal.body);")

# ══════════════════════════════════════════════════════════════════════════
# MMM HIGHLIGHT — hovering a menu item identifies its world in the sky.
# ONE implementation, driven by region membership, so it works for a planetary
# world and a constellation world alike. It changes no state, moves no camera
# and touches no ownership: purely a rendering emphasis, fully reversible.
# ══════════════════════════════════════════════════════════════════════════
s = s.replace("               focusRegion:{value:-1.0} },",
              "               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0} },")
s = s.replace("      'uniform float focusRegion;',",
              "      'uniform float focusRegion; uniform float hoverRegion;',")
s = s.replace("      '  float here = (focusRegion<0.0 || abs(region-focusRegion)<0.5) ? 1.0 : 0.13;',\n"
              "      '  vEmph=emph*here;',",
              "      '  float here = (focusRegion<0.0 || abs(region-focusRegion)<0.5) ? 1.0 : 0.13;',\n"
              "      // hovering a MIG in the menu identifies its world: that world lifts,\n"
              "      // the rest step back just enough to make the answer unambiguous\n"
              "      '  if(hoverRegion>=0.0){',\n"
              "      '    here *= (abs(region-hoverRegion)<0.5) ? 2.15 : 0.45;',\n"
              "      '  }',\n"
              "      '  vEmph=clamp(emph*here,0.0,1.6);',")
s = s.replace("      '  gl_PointSize=clamp(persp,minPx,maxPx);',",
              "      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',\n"
              "      '  gl_PointSize=clamp(persp*lift,minPx,maxPx*1.25);',")

# the orbit paths belong to a world too, so they answer the same hover
s = s.replace("      uniforms:{ tint:{value:new THREE.Color(0x2b4f86)}, near:{value:1.0} },",
              "      uniforms:{ tint:{value:new THREE.Color(0x2b4f86)}, near:{value:1.0},\n"
              "                 hoverOwn:{value:0.0} },")
s = s.replace("      fragmentShader:['uniform vec3 tint; uniform float near; varying float vA; varying float vD;',",
              "      fragmentShader:['uniform vec3 tint; uniform float near; uniform float hoverOwn;',\n"
              "        'varying float vA; varying float vD;',")
s = s.replace("        ' float a=vA*vis*near; if(a<0.004) discard;',",
              "        ' float a=vA*vis*near*(1.0+hoverOwn*1.9); if(a<0.004) discard;',")

# ── the public API ────────────────────────────────────────────────────────
s = s.replace("window.__v02={",
"""var hoveredMIG=null;
/* highlightMIG(id) — the renderer decides how that world answers. One entry
   point for every world type; never a per-MIG hover implementation. */
function highlightMIG(migId){
  if(hoveredMIG===migId) return;
  hoveredMIG=migId;
  if(!glOK) return;
  var idx=-1;
  if(migId) for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===migId) idx=i;
  if(pts) pts.material.uniforms.hoverRegion.value=idx;
  if(orbitLines) orbitLines.material.uniforms.hoverOwn.value=
    (migId && ORBITS[migId]) ? 1.0 : 0.0;
  invalidate(40);
}
window.__v02={""")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('palettes + MMM highlight implemented')
