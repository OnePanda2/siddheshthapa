import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ═══ PART I — A CELESTIAL VOCABULARY ═════════════════════════════════════
# The old glyphs were OUTLINES: squares, rings, bars. They read as diagram
# nodes because that is what an outline is. Every body is now made of LIGHT —
# a core and a falloff — so it reads as something in space. The semantic
# types are untouched; only their appearance changes.
start = s.index("    var cx=(i%ATLAS)*CELL+CELL/2")
end   = s.index("    g.restore();\n  });\n  var tex=new THREE.CanvasTexture(c);")
NEW = """    var cx=(i%ATLAS)*CELL+CELL/2, cy=Math.floor(i/ATLAS)*CELL+CELL/2, R=CELL/2;
    g.save(); g.translate(cx,cy);
    g.globalCompositeOperation='lighter';
    // every body shares a luminous core: at distance the mind reads as a sky
    function core(rad,peak){
      var gr=g.createRadialGradient(0,0,0,0,0,rad);
      gr.addColorStop(0,'rgba(255,255,255,'+peak+')');
      gr.addColorStop(0.22,'rgba(255,255,255,'+(peak*0.62)+')');
      gr.addColorStop(0.55,'rgba(255,255,255,'+(peak*0.16)+')');
      gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(0,0,rad,0,6.2832); g.fill();
    }
    // a few dendrites, tapering to nothing: neural, not medical
    function dendrites(count,len,seed,spread){
      for(var b=0;b<count;b++){
        var a=(b/count)*6.2832+seed, px=0, py=0, steps=5;
        for(var q=1;q<=steps;q++){
          var tt=q/steps, aa=a+Math.sin(seed+q*1.7)*spread*tt, rr=len*tt;
          var nx=Math.cos(aa)*rr, ny=Math.sin(aa)*rr;
          g.strokeStyle='rgba(255,255,255,'+(0.40*(1-tt)).toFixed(3)+')';
          g.lineWidth=Math.max(1,(R*0.055)*(1-tt)*2.2); g.lineCap='round';
          g.beginPath(); g.moveTo(px,py); g.lineTo(nx,ny); g.stroke();
          px=nx; py=ny;
        }
      }
    }
    if(t==='mig'){ core(R*0.92,0.95);
      g.strokeStyle='rgba(255,255,255,0.30)'; g.lineWidth=R*0.035;
      g.beginPath(); g.arc(0,0,R*0.42,0,6.2832); g.stroke();
      dendrites(7,R*0.80,0.6,0.35); }
    else if(t==='minor'){ core(R*0.74,0.92); dendrites(5,R*0.60,1.7,0.42); }
    else if(t==='thought'){ core(R*0.56,0.90); dendrites(4,R*0.62,2.9,0.55); }
    else if(t==='belief'){ core(R*0.62,0.95); dendrites(3,R*0.44,0.9,0.30); }
    else if(t==='question'){ core(R*0.46,0.80); dendrites(6,R*0.66,4.1,0.85); }
    else if(t==='project'){ core(R*0.50,0.92);
      g.strokeStyle='rgba(255,255,255,0.42)'; g.lineWidth=R*0.045;
      g.beginPath(); g.ellipse(0,0,R*0.72,R*0.26,0.5,0,6.2832); g.stroke();
      g.strokeStyle='rgba(255,255,255,0.22)';
      g.beginPath(); g.ellipse(0,0,R*0.72,R*0.26,-0.5,0,6.2832); g.stroke(); }
    else if(t==='experiment'){ core(R*0.48,0.85); dendrites(4,R*0.56,3.3,0.7); }
    else if(t==='contradiction'){
      g.save(); g.translate(-R*0.24,0); core(R*0.44,0.90); g.restore();
      g.save(); g.translate( R*0.24,0); core(R*0.44,0.90); g.restore();
      g.strokeStyle='rgba(255,255,255,0.24)'; g.lineWidth=R*0.03;
      g.beginPath(); g.ellipse(0,0,R*0.60,R*0.30,0,0,6.2832); g.stroke(); }
    else if(t==='person'){ core(R*0.52,0.88);
      g.strokeStyle='rgba(255,255,255,0.20)'; g.lineWidth=R*0.03;
      g.beginPath(); g.arc(0,0,R*0.66,0,6.2832); g.stroke(); }
    else if(t==='reference'){ core(R*0.40,0.80);
      var gr2=g.createLinearGradient(-R*0.8,0,R*0.8,0);
      gr2.addColorStop(0,'rgba(255,255,255,0)');
      gr2.addColorStop(0.5,'rgba(255,255,255,0.42)');
      gr2.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr2; g.fillRect(-R*0.8,-R*0.045,R*1.6,R*0.09); }
"""
s = s[:start] + NEW + s[end:]

# ═══ PART II — PERFORMANCE ═══════════════════════════════════════════════
# The loop ran flat out forever, so a completely static universe still cost a
# continuous 60fps of GPU. That is why the machine strained. The world now
# animates BECAUSE SOMETHING IS HAPPENING.
s = s.replace("  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));",
              "  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, window.innerWidth<768?1:1.5));  // P1")
s = s.replace("function loop(){ if(glOK) step(); if(!LITE) requestAnimationFrame(loop); }",
"""var needFrames=0;
function invalidate(n){ needFrames=Math.max(needFrames, n||46); }
/* RENDER ON DEMAND — idle is free, a hidden tab is free, reading nearly stops
   the world. Frames are requested by events, never by mere existence. */
function loop(){
  requestAnimationFrame(loop);
  if(!glOK||LITE) return;
  if(document.hidden) return;                     // P2 hidden tab
  if(readingId){ needFrames=0; return; }          // P3 reading pauses the world
  if(needFrames<=0) return;                       // P4 a still universe is free
  needFrames--; step();
}""")
s = s.replace("  var f=frameFor(mode, id||state.region);\n  wantPos.copy(f.p); wantAim.copy(f.a);",
              "  var f=frameFor(mode, id||state.region);\n  wantPos.copy(f.p); wantAim.copy(f.a);\n  invalidate(140);")
s = s.replace("  dolly=Math.max(-40,Math.min(90,dolly+e.deltaY*0.055));",
              "  dolly=Math.max(-40,Math.min(90,dolly+e.deltaY*0.055)); invalidate(70);")
s = s.replace("  mx=(e.clientX/window.innerWidth-0.5); my=(e.clientY/window.innerHeight-0.5);",
              "  mx=(e.clientX/window.innerWidth-0.5); my=(e.clientY/window.innerHeight-0.5); invalidate(22);")
s = s.replace("window.addEventListener('resize',resize);",
              "window.addEventListener('resize',function(){ resize(); invalidate(40); });\n"
              "document.addEventListener('visibilitychange',function(){ if(!document.hidden) invalidate(40); });")
s = s.replace("  readingId=null;",
              "  readingId=null; invalidate(140);")

# ═══ cross-MIG trajectories ranked by real significance ══════════════════
s = s.replace("    var cross=(A.mig!==B.mig);\n    l.cross=cross;",
"""    var cross=(A.mig!==B.mig);
    l.cross=cross;""")
s = s.replace("  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[];",
"""  /* 41 bright arcs across a sphere WAS the line-noise. Rank the cross-region
     edges by real significance — endpoint degree, cross-reach, whether the
     edge carries a contradiction — and let only the strongest stay bright at
     universe range. Nothing is deleted from the graph. */
  LINKS.forEach(function(l){
    l.sig=(degree[l.a]+degree[l.b])+(xdeg[l.a]+xdeg[l.b])*1.5+(l.verb==='tension'?6:0);
  });
  var strongest=LINKS.filter(function(l){ return byId[l.a].mig!==byId[l.b].mig; })
                     .sort(function(a,b){ return b.sig-a.sig; }).slice(0,8);
  strongest.forEach(function(l){ l.keep=true; });
  var SEGS=10, verts=[], cols=[], alphas=[], kinds=[];""")
s = s.replace("        kinds.push(cross?1:0);",
              "        kinds.push(cross&&l.keep?1:0);")
s = s.replace("        alphas.push((cross?0.40:0.12)*(0.18+0.82*t));",
              "        alphas.push((cross&&l.keep?0.46:(cross?0.14:0.10))*(0.18+0.82*t));")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('vocabulary + performance + trajectory ranking patched')
