import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ══════════════════════════════════════════════════════════════════════════
# ONE SIGNATURE PER MIG — the correction.
#
# The species work made two mistakes, both visible in the MOVIES screenshot:
#
#   1. the MIG anchor grew without limit as the camera approached, becoming a
#      radial blob that swallowed the concept labels and the writings
#   2. every concept carried dendrites of its own, so a region read as a
#      cluster of icons rather than a constellation with one emblem
#
# The signature is the constellation's emblem. It establishes identity ONCE.
# Concepts are quiet points of light around it, and the content is readable.
# ══════════════════════════════════════════════════════════════════════════

# 1. the emblem may be large, but it may not grow without bound and cover the
#    region's own writing. Content outranks atmosphere.
s = s.replace("      '  gl_PointSize=max(minPx,persp);',",
"""      /* the emblem establishes identity; it never becomes the environment.
         Uncapped it swallowed the concepts it was meant to introduce. */
      '  gl_PointSize=clamp(persp,minPx,maxPx);',""")
s = s.replace("cells:{value:ATLAS}, minPx:{value:9.0} },",
              "cells:{value:ATLAS}, minPx:{value:9.0}, maxPx:{value:170.0} },")
s = s.replace("      'uniform float minPx;',",
              "      'uniform float minPx; uniform float maxPx;',")

# 2. concepts do not inherit the signature. Strip the branching from every
#    non-MIG body so a region reads as ONE emblem among quiet stars.
s = s.replace("    else if(t==='minor'){ core(R*0.74,0.92); dendrites(5,R*0.60,1.7,0.42); }",
              "    else if(t==='minor'){ core(R*0.70,0.94); }                 // a major star, no branches")
s = s.replace("    else if(t==='thought'){ core(R*0.56,0.90); dendrites(4,R*0.62,2.9,0.55); }",
              "    else if(t==='thought'){ core(R*0.52,0.90); }                // a quiet point of light")
s = s.replace("    else if(t==='belief'){ core(R*0.62,0.95); dendrites(3,R*0.44,0.9,0.30); }",
              "    else if(t==='belief'){ core(R*0.60,0.97); }                 // steadier, denser core")
s = s.replace("    else if(t==='question'){ core(R*0.46,0.80); dendrites(6,R*0.66,4.1,0.85); }",
              "    else if(t==='question'){ core(R*0.40,0.74);\n"
              "      g.strokeStyle='rgba(255,255,255,0.26)'; g.lineWidth=R*0.03;\n"
              "      g.beginPath(); g.arc(0,0,R*0.60,0,6.2832); g.stroke(); }   // unresolved: an open halo")
s = s.replace("    else if(t==='experiment'){ core(R*0.48,0.85); dendrites(4,R*0.56,3.3,0.7); }",
              "    else if(t==='experiment'){ core(R*0.44,0.86);\n"
              "      g.strokeStyle='rgba(255,255,255,0.22)'; g.lineWidth=R*0.028;\n"
              "      g.beginPath(); g.arc(0,0,R*0.52,0.6,4.2); g.stroke(); }    // still being tested")
s = s.replace("    if(t==='mig'){ core(R*0.92,0.95);\n      g.strokeStyle='rgba(255,255,255,0.30)'; g.lineWidth=R*0.035;\n      g.beginPath(); g.arc(0,0,R*0.42,0,6.2832); g.stroke();\n      dendrites(7,R*0.80,0.6,0.35); }",
              "    if(t==='mig'){ core(R*0.86,0.92); }        // generic anchor; real MIGs use their species")

# 3. the emblem must not sit on top of its own label
s = s.replace("      ((-v.y*0.5+0.5)*h+(n.t==='mig'?26:16)).toFixed(1)+'px)';",
              "      ((-v.y*0.5+0.5)*h+(n.t==='mig'?64:16)).toFixed(1)+'px)';")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('one signature per MIG; concepts are quiet stars again')
