import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ══════════════════════════════════════════════════════════════════════════
# A VISUAL SPECIES PER MIG — same physics, different biology.
#
# The identity lives in DATA, not scattered through the renderer: the renderer
# asks speciesOf(mig) and draws. Each family was chosen from what the region
# actually contains, never assigned decoratively — the reasoning is recorded
# beside each entry so a later session can argue with it.
#
# Every form is still a luminous core with structure around it. Nothing here
# is an icon: no hearts, no forks, no notes, no film cameras, no buildings.
# ══════════════════════════════════════════════════════════════════════════
PROFILE = """
var MIG_VISUAL={
  /* 21 concepts, 14 writings, 6 contradictions — the most interconnected
     region. A neural body with many fine branches. */
  'philosophy'  :{family:'neural',   branches:8, len:0.86, spread:0.40, rings:0, core:0.58},
  /* people are consistent in ways they would deny: irregular adaptive splits */
  'behaviour'   :{family:'neural',   branches:6, len:0.74, spread:0.92, rings:0, core:0.52},
  /* 12 writings, the region everything reports back to: organic and expansive */
  'life'        :{family:'organic',  branches:7, len:0.94, spread:0.62, rings:0, core:0.62},
  /* two bodies whose trajectories bend around each other. Connection, not romance. */
  'love'        :{family:'binary',   branches:0, len:0.00, spread:0.00, rings:1, core:0.46},
  /* 14 concepts of systems and structure: a body with controlled satellites */
  'business'    :{family:'orbital',  branches:3, len:0.42, spread:0.20, rings:2, core:0.60},
  /* precise, engineered, connected micro-orbits — not a circuit board */
  'technology'  :{family:'lattice',  branches:6, len:0.60, spread:0.10, rings:1, core:0.50},
  /* assembly, modular, stacked: an architectural cluster */
  'building'    :{family:'modular',  branches:4, len:0.52, spread:0.06, rings:1, core:0.54},
  /* knowledge expanding: complexity increases outward, shells layer */
  'learning'    :{family:'growth',   branches:9, len:0.90, spread:0.55, rings:2, core:0.44},
  /* noticing, caught before it hardens: one focused light with a lens halo */
  'observation' :{family:'focus',    branches:2, len:0.34, spread:0.12, rings:2, core:0.68},
  /* deliberately EMPTY of writings. A bare rhythmic pulse, honestly sparse. */
  'music'       :{family:'harmonic', branches:5, len:0.70, spread:0.00, rings:1, core:0.40},
  /* frames and cuts: sequential lights receding, a temporal trajectory */
  'movies'      :{family:'sequence', branches:4, len:0.66, spread:0.00, rings:0, core:0.46},
  /* abundance and material life: a dense nourishing micro-cluster */
  'food'        :{family:'cluster',  branches:0, len:0.00, spread:0.00, rings:0, core:0.40},
  /* constructed, intentional, engineered — the most geometric, still celestial */
  'my-works'    :{family:'artifact', branches:2, len:0.30, spread:0.00, rings:2, core:0.56},
  /* many minds forming one system: stable bodies sharing a gravity well */
  'society'     :{family:'assembly', branches:0, len:0.00, spread:0.00, rings:1, core:0.44}
};
var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};
function speciesOf(migId){ return MIG_VISUAL[migId]||GENERIC_SPECIES; }
"""
s = s.replace("var GLYPHS=['mig','minor','thought','belief','question','project','experiment',\n            'contradiction','person','reference'];",
              PROFILE + "var GLYPHS=['mig','minor','thought','belief','question','project','experiment',\n            'contradiction','person','reference'];")

# the atlas grows to 5x5: ten type forms, then one species body per MIG.
# Still ONE texture and ONE draw call — differentiation costs no extra pass.
s = s.replace("var CELL=128, ATLAS=4;", "var CELL=128, ATLAS=5;   // 10 type forms + 14 MIG species, one texture")
s = s.replace("  var c=document.createElement('canvas'); c.width=c.height=CELL*ATLAS;",
              "  var c=document.createElement('canvas'); c.width=c.height=CELL*ATLAS;")

# draw the species bodies after the type alphabet
s = s.replace("""    g.restore();
  });
  var tex=new THREE.CanvasTexture(c);""",
"""    g.restore();
  });
  /* ── one celestial body per MIG ───────────────────────────────────────
     Every family is a core plus structure, so all fourteen still read as
     members of one cosmos at distance; the species only becomes legible on
     approach, which is the progressive disclosure the brief asks for. */
  Object.keys(MIG_VISUAL).forEach(function(mid,k){
    var idx=GLYPHS.length+k;
    var cx=(idx%ATLAS)*CELL+CELL/2, cy=Math.floor(idx/ATLAS)*CELL+CELL/2, R=CELL/2;
    var v=MIG_VISUAL[mid];
    g.save(); g.translate(cx,cy); g.globalCompositeOperation='lighter';
    function core2(rad,peak){
      var gr=g.createRadialGradient(0,0,0,0,0,rad);
      gr.addColorStop(0,'rgba(255,255,255,'+peak+')');
      gr.addColorStop(0.24,'rgba(255,255,255,'+(peak*0.60)+')');
      gr.addColorStop(0.58,'rgba(255,255,255,'+(peak*0.15)+')');
      gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(0,0,rad,0,6.2832); g.fill();
    }
    function branch(n,len,spread,seed,wob){
      for(var b=0;b<n;b++){
        var a=(b/n)*6.2832+seed, px=0, py=0, st=6;
        for(var q=1;q<=st;q++){
          var tt=q/st, aa=a+Math.sin(seed+q*1.9)*spread*tt+(wob?Math.sin(q*2.4+b)*0.18:0);
          var rr=len*R*tt, nx=Math.cos(aa)*rr, ny=Math.sin(aa)*rr;
          g.strokeStyle='rgba(255,255,255,'+(0.42*(1-tt)).toFixed(3)+')';
          g.lineWidth=Math.max(1,(R*0.05)*(1-tt)*2.4); g.lineCap='round';
          g.beginPath(); g.moveTo(px,py); g.lineTo(nx,ny); g.stroke();
          px=nx; py=ny;
        }
      }
    }
    function ring(rx,ry,rot,al){
      g.strokeStyle='rgba(255,255,255,'+al+')'; g.lineWidth=R*0.032;
      g.beginPath(); g.ellipse(0,0,rx,ry,rot,0,6.2832); g.stroke();
    }
    var f=v.family;
    if(f==='binary'){                       // LOVE: two bodies, one shared halo
      g.save(); g.translate(-R*0.27,0); core2(R*0.44,0.94); g.restore();
      g.save(); g.translate( R*0.27,0); core2(R*0.40,0.88); g.restore();
      ring(R*0.66,R*0.30,0.32,0.26); ring(R*0.66,R*0.30,-0.32,0.16);
    } else if(f==='cluster'){               // FOOD: a dense nourishing micro-cluster
      var pts=[[0,0,0.62],[-0.34,-0.20,0.40],[0.32,-0.26,0.42],[-0.26,0.30,0.38],
               [0.30,0.28,0.36],[0.02,-0.44,0.30],[-0.46,0.06,0.26],[0.46,0.04,0.28]];
      pts.forEach(function(q){ g.save(); g.translate(q[0]*R,q[1]*R); core2(R*q[2]*0.7,0.80); g.restore(); });
    } else if(f==='assembly'){              // SOCIETY: many bodies, one gravity well
      core2(R*0.40,0.72);
      for(var q2=0;q2<7;q2++){ var a2=q2/7*6.2832;
        g.save(); g.translate(Math.cos(a2)*R*0.56,Math.sin(a2)*R*0.42); core2(R*0.20,0.70); g.restore(); }
      ring(R*0.62,R*0.46,0,0.20);
    } else if(f==='harmonic'){              // MUSIC: a bare oscillation, honestly sparse
      core2(R*0.40,0.86);
      for(var w=0;w<3;w++){
        g.strokeStyle='rgba(255,255,255,'+(0.26-w*0.07).toFixed(2)+')'; g.lineWidth=R*0.028;
        g.beginPath();
        for(var x2=-R*0.86;x2<=R*0.86;x2+=R*0.06)
          g.lineTo(x2, Math.sin(x2/R*3.4+w*1.1)*R*(0.16+w*0.07));
        g.stroke();
      }
    } else if(f==='sequence'){              // MOVIES: sequential lights receding
      for(var q3=0;q3<5;q3++){
        g.save(); g.translate((q3-2)*R*0.34, (q3-2)*R*0.12);
        core2(R*(0.44-q3*0.05),0.86-q3*0.12); g.restore();
      }
    } else if(f==='focus'){                 // OBSERVATION: one light through a lens
      core2(R*v.core,0.98); ring(R*0.58,R*0.58,0,0.30); ring(R*0.84,R*0.84,0,0.14);
      branch(v.branches,v.len,v.spread,0.4,false);
    } else if(f==='modular'){               // BUILDING: stacked, measured
      for(var q4=0;q4<4;q4++){ g.save(); g.translate(0,(q4-1.5)*R*0.30);
        core2(R*(0.34-q4*0.03),0.80); g.restore(); }
      ring(R*0.70,R*0.24,0,0.22);
    } else if(f==='artifact'){              // MY WORKS: engineered, constructed
      core2(R*v.core,0.95);
      ring(R*0.76,R*0.26,0.5,0.44); ring(R*0.76,R*0.26,-0.5,0.26);
      branch(v.branches,v.len,0,1.2,false);
    } else if(f==='orbital'){               // BUSINESS: a body with satellites
      core2(R*v.core,0.94);
      ring(R*0.62,R*0.32,0.2,0.30); ring(R*0.86,R*0.44,0.2,0.16);
      for(var q5=0;q5<3;q5++){ var a5=q5/3*6.2832+0.7;
        g.save(); g.translate(Math.cos(a5)*R*0.62,Math.sin(a5)*R*0.32); core2(R*0.16,0.80); g.restore(); }
    } else if(f==='lattice'){               // TECHNOLOGY: precise, connected
      core2(R*v.core,0.90); branch(v.branches,v.len,v.spread,0.0,false); ring(R*0.72,R*0.72,0,0.18);
    } else if(f==='growth'){                // LEARNING: complexity increasing outward
      core2(R*v.core,0.88); branch(v.branches,v.len,v.spread,2.1,true);
      ring(R*0.54,R*0.54,0,0.16); ring(R*0.84,R*0.84,0,0.09);
    } else if(f==='organic'){               // LIFE: expansive, growing
      core2(R*v.core,0.92); branch(v.branches,v.len,v.spread,1.4,true);
    } else {                                // PHILOSOPHY + HUMAN BEHAVIOUR: neural
      core2(R*v.core,0.94); branch(v.branches,v.len,v.spread,0.6,f==='neural');
    }
    g.restore();
  });
  var tex=new THREE.CanvasTexture(c);""")

# a MIG anchor now draws its OWN species cell
s = s.replace("    var gi=glyphIndex(n);",
"""    var gi=glyphIndex(n);
    if(n.t==='mig'){
      var order=Object.keys(MIG_VISUAL).indexOf(n.id);
      if(order>=0) gi=GLYPHS.length+order;      // its species, not the generic anchor
    }""")

# expose the profile so a check can prove every MIG has one
s = s.replace("  dom:function(){",
"""  species:function(){
    var out={};
    MIGS.forEach(function(m){
      var v=MIG_VISUAL[m.id], order=Object.keys(MIG_VISUAL).indexOf(m.id);
      out[m.id]={hasProfile:!!v, family:v?v.family:null,
                 cell:order>=0?GLYPHS.length+order:null,
                 generic:!v, params:v||null};
    });
    return {profiles:out, families:Object.keys(MIG_VISUAL).map(function(k){return MIG_VISUAL[k].family;}),
            atlasCells:ATLAS*ATLAS, used:GLYPHS.length+Object.keys(MIG_VISUAL).length,
            textures:1, sharedMaterial:true};
  },
  dom:function(){""")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('14 MIG visual species added')
