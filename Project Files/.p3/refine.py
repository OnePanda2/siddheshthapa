import io
p = 'src/v02-app.js'
s = io.open(p, encoding='utf-8', newline='').read()
o = s

# ── the chosen direction ──────────────────────────────────────────────────
# Judged from three rendered variants, not argued: A (cobalt/indigo) reads as
# generic blue-grey against a white ground and C (navy/cyan) is nearly the
# neutral baseline. B is the only one where the world owns a colour.
s = s.replace("  return m?m[2]:'a';", "  return m?m[2]:'b';   // B chosen from the rendered comparison")

# ── A NEURAL CORE, NOT A SPIKY BLOB ───────────────────────────────────────
# Eight equal spokes read as an asterisk. A neuron has a dense soma, branches
# of UNEVEN length that fork, and a falloff — the structure carries the
# metaphor, not a glow.
s = s.replace("""    if(t==='mig'){ core(R*0.86,0.92); }        // generic anchor; real MIGs use their species""",
              """    if(t==='mig'){ core(R*0.86,0.92); }        // generic anchor; real MIGs use their species""")
s = s.replace("""    if(f==='binary'){                       // LOVE: two bodies, one shared halo""",
"""    if(f==='neural'){                       // PHILOSOPHY / HUMAN BEHAVIOUR
      /* a soma with a bright dense centre, then branches of uneven length
         that fork once and taper to nothing. Irregularity is what separates
         a neuron from an asterisk. */
      core(R*0.30,0.99); core(R*0.62,0.55);
      var NB=v.branches||8;
      for(var b3=0;b3<NB;b3++){
        var a3=(b3/NB)*6.2832+0.37;
        var len3=R*v.len*(0.55+0.45*Math.abs(Math.sin(b3*2.7)));   // uneven
        var px3=0, py3=0, st3=7;
        for(var q3=1;q3<=st3;q3++){
          var tt3=q3/st3;
          var aa3=a3+Math.sin(b3*1.9+q3*0.8)*v.spread*tt3;
          var rr3=len3*tt3, nx3=Math.cos(aa3)*rr3, ny3=Math.sin(aa3)*rr3;
          g.strokeStyle='rgba(255,255,255,'+(0.52*(1-tt3*0.85)).toFixed(3)+')';
          g.lineWidth=Math.max(0.8,(R*0.075)*(1-tt3)*2.0);
          g.lineCap='round';
          g.beginPath(); g.moveTo(px3,py3); g.lineTo(nx3,ny3); g.stroke();
          /* one fork, partway along — dendrites branch, spokes do not */
          if(q3===4){
            var fa=aa3+(b3%2?0.55:-0.55), fl=len3*0.30;
            g.strokeStyle='rgba(255,255,255,0.24)';
            g.lineWidth=Math.max(0.7,R*0.030);
            g.beginPath(); g.moveTo(nx3,ny3);
            g.lineTo(nx3+Math.cos(fa)*fl, ny3+Math.sin(fa)*fl); g.stroke();
          }
          px3=nx3; py3=ny3;
        }
      }
    } else if(f==='binary'){                 // LOVE: two bodies, one shared halo""")
# the old generic 'neural' fallthrough is now unreachable for that family
s = s.replace("""    } else {                                // PHILOSOPHY + HUMAN BEHAVIOUR: neural
      core2(R*v.core,0.94); branch(v.branches,v.len,v.spread,0.6,f==='neural');
    }""",
"""    } else {                                // anything without its own form
      core2(R*v.core,0.94); branch(v.branches,v.len,v.spread,0.6,false);
    }""")

# ── MOBILE FRAMING ────────────────────────────────────────────────────────
# The phone was showing a corner of the system because it inherited the
# desktop arrival frame. A narrow viewport needs to stand further back and
# aim at the star, so the whole orbital architecture is legible above the
# sheet rather than cropped.
s = s.replace("""  if(mode==='region' && templateFor(id)){
    var away=n.pos.clone().normalize().multiplyScalar(96);
    var lift=new THREE.Vector3(0, 64, 0).applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    return {p:new THREE.Vector3().addVectors(n.pos, away.add(lift)), a:n.pos.clone()};
  }""",
"""  if(mode==='region' && templateFor(id)){
    /* a phone sees a tall, narrow slice, and the sheet takes the lower 58%.
       Stand further back and aim high so the whole system sits in the strip
       that is actually visible — not a corner of it. */
    var phone=window.innerWidth<768;
    var away=n.pos.clone().normalize().multiplyScalar(phone?168:96);
    var lift=new THREE.Vector3(0, phone?96:64, 0)
              .applyAxisAngle(new THREE.Vector3(1,0,0), -SYS_TILT);
    var aim=n.pos.clone();
    if(phone) aim.y-=46;                 // push the system up out of the sheet
    return {p:new THREE.Vector3().addVectors(n.pos, away.add(lift)), a:aim};
  }""")

assert s != o
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('palette B default · neural core rebuilt · mobile framing fixed')
