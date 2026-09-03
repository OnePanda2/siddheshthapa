import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ═══ FIX A — A CONCEPT IS ONE BODY ═══════════════════════════════════════
# Writings were parked 5 units from their host concept, so at this zoom every
# concept accumulated a blob around it and read as an icon cluster — the exact
# failure the brief forbids. A writing belongs to its concept but must not sit
# ON it: push it to a clearly secondary distance and let the orbit read.
s = s.replace("""        var off=k*1.31+(degree[id]||0)*0.7;
        node.pos=new THREE.Vector3().addVectors(host.pos,
          new THREE.Vector3(Math.cos(off)*5.2, Math.sin(off*1.7)*2.4, Math.sin(off)*5.2));
        node.belt=false;""",
"""        /* far enough out that the concept stays a single body, close enough
           that the writing still reads as belonging to it */
        var off=k*2.11+(degree[id]||0)*0.9;
        var lift=(k%2?1:-1)*(6.5+(k%3)*2.2);
        node.pos=new THREE.Vector3().addVectors(host.pos,
          new THREE.Vector3(Math.cos(off)*13.5, lift, Math.sin(off)*13.5));
        node.belt=false;""")

# ═══ FIX B — ENTERING A WORLD MEANS LEAVING THE OTHERS ═══════════════════
# Neighbouring constellations bled into Philosophy's space and their labels
# landed on its writings. A region you have entered must dominate; the rest of
# the mind stays present but recedes. Carried by ONE uniform and ONE existing
# attribute — no extra pass, no extra draw call.
s = s.replace("""  var P=new Float32Array(placed.length*3), CELLA=new Float32Array(placed.length*2),
      SZ=new Float32Array(placed.length), COL=new Float32Array(placed.length*3),
      EMPH=new Float32Array(placed.length);""",
"""  var P=new Float32Array(placed.length*3), CELLA=new Float32Array(placed.length*2),
      SZ=new Float32Array(placed.length), COL=new Float32Array(placed.length*3),
      EMPH=new Float32Array(placed.length), REG=new Float32Array(placed.length);
  var migIndex={}; MIGS.forEach(function(m,i){ migIndex[m.id]=i; });""")
s = s.replace("    EMPH[i]=n.t==='mig'?1.0:(0.62+Math.min(1,(degree[n.id]||0)/7)*0.34);",
              "    EMPH[i]=n.t==='mig'?1.0:(0.62+Math.min(1,(degree[n.id]||0)/7)*0.34);\n"
              "    REG[i]=(migIndex[n.mig]===undefined?-1:migIndex[n.mig]);")
s = s.replace("  geo.setAttribute('emph',new THREE.BufferAttribute(EMPH,1));",
              "  geo.setAttribute('emph',new THREE.BufferAttribute(EMPH,1));\n"
              "  geo.setAttribute('region',new THREE.BufferAttribute(REG,1));")
s = s.replace("cells:{value:ATLAS}, minPx:{value:9.0}, maxPx:{value:170.0} },",
              "cells:{value:ATLAS}, minPx:{value:9.0}, maxPx:{value:170.0},\n"
              "               focusRegion:{value:-1.0} },")
s = s.replace("      'attribute vec2 cell; attribute float size; attribute vec3 tint; attribute float emph;',",
              "      'uniform float focusRegion;',\n"
              "      'attribute vec2 cell; attribute float size; attribute vec3 tint; attribute float emph;',\n"
              "      'attribute float region;',")
s = s.replace("      '  vCell=cell; vTint=tint; vEmph=emph;',",
              "      '  vCell=cell; vTint=tint;',\n"
              "      /* inside a world, everything elsewhere recedes but never vanishes:',\n"
              "      '     the mind must stay felt while one region is being read */',\n"
              "      '  float here = (focusRegion<0.0 || abs(region-focusRegion)<0.5) ? 1.0 : 0.13;',\n"
              "      '  vEmph=emph*here;',")

# drive the uniform from the current state
s = s.replace("""  if(lineSeg){
    var d=camPos.length();""",
"""  if(pts){
    var fr=-1.0;
    if(state.region){ for(var mi=0;mi<MIGS.length;mi++) if(MIGS[mi].id===state.region) fr=mi; }
    pts.material.uniforms.focusRegion.value=fr;
  }
  if(lineSeg){
    var d=camPos.length();""")

# labels obey the same rule — a neighbouring world must not caption itself
# over the writing you are reading
s = s.replace("""    var want = n.t==='mig' ? d<620
             : (n.t==='minor' ? d<120 : d<64);
    if(!want) return;""",
"""    var elsewhere = state.region && n.mig!==state.region;
    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : (n.t==='minor' ? (d<160 && !elsewhere) : (d<80 && !elsewhere));
    if(!want) return;""")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('one body per concept; entering a world recedes the others')
