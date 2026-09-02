/* capture.js — build a hash-drivable copy of the site for headless capture.
   The public file stays clean; this copy exposes window.__mind and boots
   straight to a view so a screenshot can be taken of any state.

   usage: node tools/capture.js preview.html <out.html>
   then:  chrome --headless=new --screenshot=x.png "file:///<out.html>#read:b-kind"

   hash forms:  #threshold  #mind  #focus:<id>[:<id>...]  #read:<id>
*/
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'preview.html', 'utf8');
const out = process.argv[3] || 'cap.html';

const HOOK = `
  /* ── capture hook (never shipped) ── */
  window.__mind={
    open:open, openReader:openReader, goBack:goBack, goHome:goHome, byId:byId,
    enter:function(){ enterBtn.click(); },
    /* Which marks the canvas actually LABELS right now. A checker that assumes
       every region carries a label is measuring an imagined page: in a concept
       view only the focus, its ring and the rim are written. */
    /* editorial-grid geometry, for tools/gridcheck.js (never ships) */
    /* force one settled repaint so geometry and hit boxes come from the SAME
       instant — refreshMotif schedules repaints at 220/520/900/1400ms and a
       probe can otherwise read zones from one paint and boxes from another */
    repaint:function(){ refreshMotif(); },
    poles:function(id){ return polesOf(byId[id]); },
    labelled:function(id){ return !!poleIds[id]; },
    zones:function(){ return (typeof philZones==='function')?philZones():null; },
    comp:function(){ return comp; },
    frags:function(){ return fragHits.slice(); },
    measure:function(){ return fragMeasure.slice(); },
    type:function(){ return typeScale(W); },
    marginalia:function(){ return marginalia.slice(); },
    /* regions genuinely reachable from a node by a real edge — so a checker
       can re-derive a cross-region mark instead of trusting its text */
    regionsReached:function(id){
      var out=[]; (adj[id]||[]).forEach(function(k){
        var o=byId[k.o]; if(o&&o.mig&&o.mig!==byId[id].mig&&out.indexOf(o.mig)<0) out.push(o.mig);
      }); return out.map(function(m){ return byId[m].label.toLowerCase(); });
    },
    alphas:function(){ return {grid:GRID_ALPHA, frag:FRAG_ALPHA, marg:MARG_ALPHA}; },
    /* The real fragment hit test, so a checker can prove the INTERACTION
       POLICY instead of assuming it: marginalia is evidence, not a control,
       so a mark's own box must not resolve to anything clickable. */
    hitFragment:function(x,y){ var n=fragmentAt(x,y); return n?n.id:null; },
    hitNode:function(x,y){ var n=nodeAt(x,y); return n?n.id:null; },
    visible:function(){
      return {mode:mode(), focus:focus?focus.id:null,
              ring1:Object.keys(ring1), ring2:Object.keys(ring2), rim:Object.keys(rim)};
    }
  };
  (function boot(){
    var h=decodeURIComponent(location.hash.slice(1));
    if(!h||h==='threshold')return;
    window.__mind.enter();
    if(h==='mind')return;
    var m=h.split(':'), kind=m.shift();
    if(kind==='focus'){ m.forEach(function(id){ if(byId[id]) open(byId[id]); }); }
    else if(kind==='nav'){
      // drive the keyboard layer: open the owning region, then focus the
      // parallel-layer entry for this node so the canvas rings it
      var t=byId[m[0]]; if(!t)return;
      if(t.t!=='mig'&&byId[t.mig]) open(byId[t.mig]);
      var b=document.querySelector('[data-nav="'+m[0]+'"]');
      if(b) b.focus();
    }
    else if(kind==='read'){
      var n=byId[m[0]]; if(!n)return;
      if(byId[n.mig]) open(byId[n.mig]);
      openReader(n);
      if(m[1]==='scrolled') reader.scrollTop=Math.round(window.innerHeight*0.92);
      if(m[1]==='end') reader.scrollTop=99999;
    }
  })();
`;

const i = src.lastIndexOf('})();');
if (i < 0) throw new Error('could not find the closing IIFE');
fs.writeFileSync(out, src.slice(0, i) + HOOK + '\n' + src.slice(i), 'utf8');
console.log('wrote ' + out);
