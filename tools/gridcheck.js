/* gridcheck.js — does the editorial grid actually hold?

   Runtime geometry only. Searching the source for strings proves nothing
   about where a fragment landed, and this project has shipped four checks
   that passed while the behaviour was broken.

   Verified per state, per width:
     1. every fragment sits inside the zone it was assigned
     2. no fragment overlaps the reading panel
     3. no fragment overlaps a drawn node label
     4. fragments do not overlap each other
     5. the grid's drawn alpha stays under the faintest fragment tier
     6. the field is populated (fragments did not vanish)
   A state that cannot be measured FAILS. It never counts as a pass.

   usage: node tools/gridcheck.js preview.html [w] [h]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const STATES = ['philosophy', 'curiosity', 'b-kind'];

const tmp = (require('./scratch.js').root() + '/gridcheck').replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const probe = `(function(){
  M.repaint();                        // settle: same instant for boxes and zones
  var z=M.zones(), f=M.frags(), a=M.alphas(), c=M.comp();
  if(!c) return {error:'no composition'};
  if(c.phone) return {phone:true, frags:f.length};
  if(!z) return {error:'no zones on a desktop viewport'};
  // a shared edge is adjacency, not collision — require real overlap
  function hit(p,q){ return (Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0))>1 && (Math.min(p.y1,q.y1)-Math.max(p.y0,q.y0))>1; }
  // the TEXT box for composition, the padded box only for touch size
  var boxes=f.map(function(h){ return {id:h.id,x0:h.tx0,y0:h.ty0,x1:h.tx1,y1:h.ty1}; });
  var small=f.filter(function(h){ return h.h<44; }).map(function(h){return h.id;});
  /* 1 — containment: a fragment must sit in one of the editorial zones.
     P4.7 added a fourth family: slots INSIDE the graph field, cut from the
     same obstacle set the bands are, so quiet writing can settle among the
     neurons instead of being structurally excluded from them. A field slot is
     a real assigned zone and is checked as one — with a tight tolerance,
     because unlike a column it is not allowed to grow. */
  var zoneList=[z.A,z.B,z.C].filter(Boolean);
  var slots=(z.G||[]);
  var outside=boxes.filter(function(b){
    if(slots.some(function(s){
      return b.x0>=s.x0-10 && b.x1<=s.x1+40 && b.y0>=s.y0-20 && b.y1<=s.y1+14; })) return false;
    return !zoneList.some(function(zz){
      return b.x0>=zz.x0-24 && b.x1<=zz.x1+140 && b.y0>=zz.y0-70 && b.y1<=zz.y1+40;
    });
  }).map(function(b){return b.id;});
  // 2 — the reading panel is occupied space
  var onPanel = z.panel? boxes.filter(function(b){return hit(b,z.panel);}).map(function(b){return b.id;}) : [];
  // 3 — drawn node labels
  var vis=M.visible(), lab={}; lab[vis.focus]=1;
  vis.ring1.forEach(function(k){lab[k]=1;}); vis.rim.forEach(function(k){lab[k]=1;});
  var labelBoxes=Object.keys(lab).filter(function(k){return M.byId[k];}).map(function(k){
    var n=M.byId[k], half=Math.min(118,(String(n.label).length*6.1)/2+12);
    return {id:k,x0:n.cx-half,y0:n.cy-12,x1:n.cx+half,y1:n.cy+34};
  });
  var onLabel=[];
  boxes.forEach(function(b){ labelBoxes.forEach(function(l){
    if(hit(b,l)) onLabel.push(b.id+'/'+l.id); }); });
  /* 7 (P4.7) — THE GRAPH FIELD IS HABITABLE. The whole point of P4.7 is that
     writing may settle among the neurons instead of being confined to bands
     around them. A build where the field offers slots and nothing is ever
     placed in one has silently reverted to the old composition, so count what
     actually landed inside the graph zone rather than trusting that the
     feature exists. */
  var gz=z.graph, insideGraph=boxes.filter(function(b){
    var mx=(b.x0+b.x1)/2, my=(b.y0+b.y1)/2;
    return gz && mx>gz.x0 && mx<gz.x1 && my>gz.y0 && my<gz.y1;
  }).map(function(b){return b.id;});
  /* Measured against the INTENDED display size, not against the next tier
     down: when the wrap is removed the whole hierarchy collapses together
     (28/17 becomes 17/11) and a ratio between neighbours still looks healthy
     while the dominant voice has gone. */
  var ts=M.type(), intended=ts.dom;
  /* Is there ROOM for a dominant voice? At 768 the reading panel spans 712 of
     768px and the only band left is 60px tall — it cannot hold display type at
     all, so demanding one there would be demanding a composition the geometry
     does not permit. Where the zone can hold it, it must be there. Measured,
     the same way P4.6 decides whether an empty margin is a fact or a fault. */
  var zA=z.A, roomForDom = !!zA && (zA.y1-zA.y0) >= intended*2.2 && (zA.x1-zA.x0) >= intended*7;
  /* 8 (P4.7) — THE DOMINANT SENTENCE IS NOT CUT TO DEATH. Growing the type
     without giving it a measure is how "We divided knowledge for the sake of
     understanding it" became "We divided knowledge for the …" — the same
     defect P4.4 caught at 30px, worse the larger the type gets. The fragment
     set at the dominant size must still show most of the crop it was given. */
  var mz=M.measure(), domSize=0;
  mz.forEach(function(m){ if(m.size>domSize) domSize=m.size; });
  var gutted=mz.filter(function(m){
    if(m.size<domSize-2) return false;             // only the dominant voice
    var n=M.byId[m.id]; if(!n||!n.line) return false;
    var want=Math.min(ts.crop,String(n.line).length);
    return m.chars < want*0.55;
  }).map(function(m){ return m.id+' '+m.chars+'/'+Math.min(ts.crop,String(M.byId[m.id].line).length); });
  if(!roomForDom) gutted=[];
  /* 9 (P4.7) — THERE IS A DOMINANT VOICE. Typographic drama is the point of
     this phase: one authentic sentence carries the composition and the rest
     murmur. Measured, not asserted — without the wrap the dominant fragment
     shrinks to fit one line and lands at exactly the mid tier's size (28 -> 17
     at 1424), which is a field with no hierarchy at all. */
  var sizes=mz.map(function(m){return m.size;}).sort(function(a,b){return b-a;});
  var second=0; for(var si2=0;si2<sizes.length;si2++) if(sizes[si2]<domSize){ second=sizes[si2]; break; }
  // 4 — fragments must not sit on top of each other
  var stacked=[];
  for(var i=0;i<boxes.length;i++) for(var j=i+1;j<boxes.length;j++)
    if(hit(boxes[i],boxes[j])) stacked.push(boxes[i].id+'/'+boxes[j].id);
  return {
    frags:f.length, zonesUsed:zoneList.length, fieldSlots:slots.length,
    insideGraph:insideGraph.length, gutted:gutted, domSize:domSize,
    intended:intended, second:second, roomForDom:roomForDom,
    outsideZones:outside, onPanel:onPanel, onLabel:onLabel.slice(0,6), stacked:stacked.slice(0,6),
    touchTooSmall:small,
    gridAlpha:a.grid, faintestFragment:Math.min.apply(null,Object.keys(a.frag).map(function(k){return a.frag[k];})),
    panelMeasured: !!z.panel
  };
})()`;
fs.writeFileSync(tmp + '/p.js', probe, 'utf8');

let bad = 0, measured = 0;
STATES.forEach(id => {
  let r;
  try {
    const raw = execSync('node tools/viewport.js probe "' + file + '" ' + W + ' ' + H +
                         ' focus:' + id + ' "' + tmp + '/p.js"',
                         { maxBuffer: 1 << 26, timeout: 300000 }).toString();
    const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    if (Math.abs(parsed.viewport.cssWidth - W) > 24) throw new Error('viewport ' + parsed.viewport.cssWidth);
    r = parsed.result;
    if (!r || r.error) throw new Error(r ? r.error : 'no result');
  } catch (e){
    console.log('  FAIL  ' + id.padEnd(12) + ' NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,64));
    bad++; return;                       // unmeasured is a failure, never a pass
  }
  measured++;
  if (r.phone){ console.log('  PASS  ' + id.padEnd(12) + ' phone model — no desktop grid, ' + r.frags + ' fragments'); return; }
  const p = [];
  if (!r.frags)                p.push('no fragments painted — the field emptied');
  if (r.outsideZones.length)   p.push('outside their zone: ' + r.outsideZones.join(', '));
  if (!r.panelMeasured)        p.push('panel not measured');
  if (r.onPanel.length)        p.push('on the reading panel: ' + r.onPanel.join(', '));
  if (r.onLabel.length)        p.push('over a node label: ' + r.onLabel.join(', '));
  if (r.stacked.length)        p.push('stacked on each other: ' + r.stacked.join(', '));
  if (r.frags > 2 && r.roomForDom && r.domSize < r.intended * 0.55)
    p.push('no dominant voice — the largest fragment rendered at ' + r.domSize + 'px against an intended ' +
           r.intended + 'px; the sentence was shrunk to fit one line instead of wrapping to a measure');
  if (r.gutted && r.gutted.length)
    p.push('the dominant fragment was cut to death rather than wrapped: ' + r.gutted.join(', '));
  if (r.fieldSlots >= 2 && !r.insideGraph)
    p.push('the graph field offered ' + r.fieldSlots + ' slots and nothing was placed in it — ' +
           'the P4.7 interleave has regressed to bands around the graph');
  if (r.touchTooSmall && r.touchTooSmall.length) p.push('touch target under 44px: ' + r.touchTooSmall.join(', '));
  if (!(r.gridAlpha < r.faintestFragment))
    p.push('grid alpha ' + r.gridAlpha + ' is not below the faintest fragment ' + r.faintestFragment);
  if (p.length){ bad += p.length; console.log('  FAIL  ' + id); p.forEach(x => console.log('          ' + x)); }
  else console.log('  PASS  ' + id.padEnd(12) + String(r.frags).padStart(3) + ' fragments · ' + r.zonesUsed +
                   ' zones · ' + r.insideGraph + '/' + r.fieldSlots + ' in field · type ' + r.domSize + '/' + r.second + ' · grid ' + r.gridAlpha + ' < faintest ' + r.faintestFragment);
});
console.log('\n' + measured + '/' + STATES.length + ' states measured at ' + W + 'x' + H);
console.log(bad ? bad + ' PROBLEM(S)' : 'the editorial grid holds');
process.exit(bad ? 1 : 0);
