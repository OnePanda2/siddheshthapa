/* marginaliacheck.js — is every marginal mark a real trace, and is every
   trace the graph requires actually there?

   Runtime state only. The point of P4.6 is that fabrication must be
   structurally hard, so the check reads what was actually painted and
   re-derives each mark from the node record it claims to come from.

   The first version of this check had a real weakness: it asked only
   "is every mark that exists authentic?". A build where the cross-region
   layer rendered NOTHING satisfied it perfectly. Expected 3, rendered 0,
   result PASS. Assertion 3 exists because of that.

   Per state, per width:
     1. every SOURCE mark equals its node's real n.src
     2. every CROSS mark names a region actually reached by a real edge from
        that node, and its "+n" count matches the real remainder. A mark on a
        node with no cross-region edge at all fails here too.
     3. EXISTENCE — every fragment the graph says leaves the region, and which
        carries a painted source anchor, HAS a cross mark. A required feature
        rendering zero is a failure, not a pass.
     4. no fabricated footnote numbering ("1." … "12.") or "cf. N" is painted
     5. marks sit inside the annotation margins
     6. no mark overlaps the reading panel
     7. no mark overlaps a drawn graph label
     8. marginalia changes when focus changes
     9. marginalia stays subordinate — the painter's OWN alpha constants are
        read from the runtime, not copied here, and held to a bounded ratio of
        the strongest fragment tier
    10. interaction policy — no mark is clickable (its own box resolves to no
        fragment and no node) and none is exposed as a focusable control
   Unmeasured is a FAILURE.

   usage: node tools/marginaliacheck.js preview.html [w] [h]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const STATES = ['philosophy', 'curiosity', 'c-curiosity'];

const tmp = (os.tmpdir() + '/margcheck-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const probeFor = id => `(function(){
  M.repaint();
  var mg=M.marginalia(), z=M.zones(), c=M.comp(), vis=M.visible(), f=M.frags();
  if(!c) return {error:'no composition'};
  if(c.phone) return {phone:true, marks:mg.length};
  if(!z) return {error:'no zones'};
  function hit(p,q){ return (Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0))>1 && (Math.min(p.y1,q.y1)-Math.max(p.y0,q.y0))>1; }
  var boxes=mg.map(function(m){ return {id:m.id,kind:m.kind,text:m.text,
      x0:m.x,y0:m.y,x1:m.x+m.w,y1:m.y+m.h}; });
  // 1 & 2 — re-derive every mark from the record it claims
  var fabricated=[];
  mg.forEach(function(m){
    var n=M.byId[m.id];
    if(!n){ fabricated.push(m.kind+':'+m.text+' (no node)'); return; }
    if(m.kind==='source'){
      if(String(n.src)!==m.text) fabricated.push('source '+m.id+' claims "'+m.text+'" but src is "'+n.src+'"');
    } else if(m.kind==='cross'){
      var real=M.regionsReached(m.id);
      var t=m.text.replace(/^\\s*\\u2192\\s*/,'');     // strip the leading arrow
      var plus=/\\s\\+(\\d+)$/.exec(t);
      var extra=plus?+plus[1]:0;
      var named=plus? t.slice(0,plus.index) : t;
      if(real.indexOf(named)<0)
        fabricated.push('cross '+m.id+' claims "'+named+'" but its real edges reach ['+real.join(',')+']');
      else if(real.length-1 !== extra)
        fabricated.push('cross '+m.id+' says +'+extra+' but '+(real.length-1)+' other regions are reached');
    } else fabricated.push('unknown kind '+m.kind);
  });
  /* 3 — EXISTENCE. Derived from the GRAPH plus what was OBSERVED to be
     painted, never from a copy of the painter's placement guard — a check
     that re-implements the condition it is testing can only ever agree with
     it. A cross mark stacks under its source mark, so a fragment with real
     cross-region edges AND a painted source anchor must carry one. */
  var painted={}; mg.forEach(function(m){ painted[m.kind+'|'+m.id]=m; });
  var expectCross=[], missingCross=[], suppressed=[];
  f.forEach(function(h){
    if(!M.regionsReached(h.id).length) return;      // the graph says it leaves nowhere
    if(!painted['source|'+h.id]){ suppressed.push(h.id); return; }
    expectCross.push(h.id);
    if(!painted['cross|'+h.id]) missingCross.push(h.id);
  });
  // 4 — the old fabricated patterns must not be painted
  var fakePat=mg.filter(function(m){
    return /^\\s*\\d+\\.\\s*$/.test(m.text) || /^cf\\.\\s*\\d+/i.test(m.text);
  }).map(function(m){return m.text;});
  /* 5 — inside the annotation margins. The X tolerance is real: the margin
     BAND is narrower than a source string, so the text legitimately overhangs
     it to the right. The Y tolerance is not — it used to be ±40px, which let a
     mark sit nine pixels above the cleared zone and onto a graph label while
     this assertion still reported it as "inside the margins". A mark is
     vertically bounded by its box now, so 2px of rounding is all it needs. */
  var margins=[z.Lm,z.Rm].filter(Boolean);
  var outside=boxes.filter(function(b){
    return !margins.some(function(mm){ return b.x0>=mm.x0-40 && b.x1<=mm.x1+60 && b.y0>=mm.y0-2 && b.y1<=mm.y1+2; });
  }).map(function(b){return b.kind+':'+b.id;});
  // 6 — panel
  var onPanel = z.panel? boxes.filter(function(b){return hit(b,z.panel);}).map(function(b){return b.id;}) : [];
  // 7 — graph labels
  var lab={}; lab[vis.focus]=1; vis.ring1.forEach(function(k){lab[k]=1;}); vis.rim.forEach(function(k){lab[k]=1;});
  var onLabel=[];
  Object.keys(lab).forEach(function(k){
    var n=M.byId[k]; if(!n||n.cx===undefined)return;
    var half=Math.min(118,(String(n.label).length*6.1)/2+12);
    var lb={x0:n.cx-half,y0:n.cy-12,x1:n.cx+half,y1:n.cy+34};
    boxes.forEach(function(b){ if(hit(b,lb)) onLabel.push(b.id+'/'+k); });
  });
  /* 10 — INTERACTION POLICY. Marginalia is evidence, not a control. Probe the
     site's REAL hit tests at each mark's own centre: nothing there may resolve
     to a fragment or a node, or a margin note would silently become a
     doorway and steal the click a fragment is supposed to own. */
  var clickable=[];
  boxes.forEach(function(b){
    var cx=(b.x0+b.x1)/2, cy=(b.y0+b.y1)/2;
    var hf=M.hitFragment(cx,cy), hn=M.hitNode(cx,cy);
    if(hf||hn) clickable.push(b.kind+':'+b.id+'→'+(hf||hn));
  });
  // 9 — subordination, from the painter's own constants
  var a=M.alphas(), mA=0;
  Object.keys(a.marg).forEach(function(k){ Object.keys(a.marg[k]).forEach(function(j){
    if(a.marg[k][j]>mA) mA=a.marg[k][j]; }); });
  /* 8's evidence — the mark SET, not the mark COUNT. Comparing counts let two
     states with entirely different marks read as "responsive" whenever the
     totals happened to match, and let a build whose margins never change pass
     whenever the totals happened to differ. */
  var sig=mg.map(function(m){ return m.kind+'|'+m.id+'|'+m.text; }).sort().join(' ; ');
  /* Is there anywhere for a mark to GO? At 768 the reading panel spans 712 of
     768px and no annotation margin survives at all, so zero marks is the only
     correct outcome there. "The layer rendered nothing" is a failure when there
     was room and a fact when there was not — the difference is measured, not
     assumed. */
  var rmArea=Math.max(0,z.Rm.x1-z.Rm.x0)*Math.max(0,z.Rm.y1-z.Rm.y0);
  return {
    marks:mg.length, sig:sig, rmArea:Math.round(rmArea),
    kinds:mg.reduce(function(o,m){o[m.kind]=(o[m.kind]||0)+1;return o;},{}),
    fabricated:fabricated, fakePatterns:fakePat,
    expectCross:expectCross.length, missingCross:missingCross, suppressed:suppressed,
    outsideMargins:outside, onPanel:onPanel, onLabel:onLabel.slice(0,5),
    clickable:clickable.slice(0,5),
    marginaliaMaxAlpha:mA, strongestFragment:a.frag[3],
    focusableMarginalia:D.querySelectorAll('[data-marginalia]').length
  };
})()`;

let bad = 0, measured = 0, seen = {}, crossTotal = 0, expectTotal = 0;
STATES.forEach(id => {
  fs.writeFileSync(tmp + '/p-' + id + '.js', probeFor(id), 'utf8');
  let r;
  try {
    const raw = execSync('node tools/viewport.js probe "' + file + '" ' + W + ' ' + H +
                         ' focus:' + id + ' "' + tmp + '/p-' + id + '.js"',
                         { maxBuffer: 1 << 26, timeout: 300000 }).toString();
    const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    if (Math.abs(parsed.viewport.cssWidth - W) > 24) throw new Error('viewport ' + parsed.viewport.cssWidth);
    r = parsed.result;
    if (!r || r.error) throw new Error(r ? r.error : 'no result');
  } catch (e){
    console.log('  FAIL  ' + id.padEnd(14) + ' NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,56));
    bad++; return;
  }
  measured++;
  if (r.phone){ console.log('  PASS  ' + id.padEnd(14) + ' phone — no desktop marginalia (' + r.marks + ' marks)'); seen[id]={n:0,sig:'phone'}; return; }
  seen[id] = {n:r.marks, sig:r.sig};
  crossTotal += (r.kinds.cross || 0); expectTotal += r.expectCross;
  const p = [];
  if (!r.marks && r.rmArea > 0)
    p.push('no marginalia painted at all, though the annotation margin has ' + r.rmArea + 'px² of room');
  if (r.fabricated.length)     p.push('FABRICATED: ' + r.fabricated.slice(0,3).join(' | '));
  if (r.missingCross.length)   p.push('MISSING cross-region marks the graph requires: ' +
                                      r.missingCross.join(', ') + ' (expected ' + r.expectCross +
                                      ', rendered ' + (r.kinds.cross||0) + ')');
  if (r.fakePatterns.length)   p.push('fabricated footnote/cf pattern: ' + r.fakePatterns.join(', '));
  if (r.outsideMargins.length) p.push('outside the annotation margins: ' + r.outsideMargins.slice(0,4).join(', '));
  if (r.onPanel.length)        p.push('on the reading panel: ' + r.onPanel.join(', '));
  if (r.onLabel.length)        p.push('over a graph label: ' + r.onLabel.join(', '));
  if (r.clickable.length)      p.push('marginalia is clickable: ' + r.clickable.join(', '));
  if (!(r.marginaliaMaxAlpha > 0 && r.marginaliaMaxAlpha <= r.strongestFragment * 2.5))
    p.push('marginalia not subordinate — max alpha ' + r.marginaliaMaxAlpha +
           ' vs strongest fragment ' + r.strongestFragment);
  if (r.focusableMarginalia)   p.push(r.focusableMarginalia + ' marginalia exposed as focusable controls');
  if (p.length){ bad += p.length; console.log('  FAIL  ' + id); p.forEach(x => console.log('          ' + x)); }
  else {
    console.log('  PASS  ' + id.padEnd(14) + String(r.marks).padStart(3) + ' marks ' +
                JSON.stringify(r.kinds) + '  cross ' + (r.kinds.cross||0) + '/' + r.expectCross +
                ' required  all traceable');
    /* Reported, not failed. A fragment can have real cross-region edges and
       still carry no mark because the margin at its baseline is genuinely
       occupied — in the opening region view six rim labels march down the
       right edge THROUGH the margin column, and a mark there would sit on a
       region name. That is real geometry, not a defect. It is printed so it
       can never quietly get worse: if this number climbs, the margins are
       being eaten and someone should look. */
    if (!r.marks)
      console.log('        note  no annotation margin survives this viewport — the reading panel spans it, ' +
                  'so zero marks is correct');
    if (r.suppressed.length)
      console.log('        note  ' + r.suppressed.length + ' fragment(s) leave the region but the margin ' +
                  'at their baseline is occupied: ' + r.suppressed.join(', '));
  }
});
// 8 — focus must change what the margins show
const sigs = Object.keys(seen).map(k => seen[k].sig);
const anyMarks = Object.keys(seen).some(k => seen[k].n > 0);
if (measured >= 2 && anyMarks && new Set(sigs).size === 1){
  console.log('  FAIL  marginalia identical across every focus — it does not respond to attention');
  bad++;
}
/* A whole-run floor. Every per-state existence test can be individually
   satisfied by a build that paints no source anchors at all, which would take
   the cross layer down with it silently. Philosophy demonstrably contains
   cross-region writings, so across the measured states the layer must render. */
if (measured >= 2 && expectTotal > 0 && crossTotal === 0){
  console.log('  FAIL  the cross-region layer rendered nothing in any state (' + expectTotal + ' required)');
  bad++;
}
console.log('\n' + measured + '/' + STATES.length + ' states measured at ' + W + 'x' + H +
            '  ·  cross-region marks ' + crossTotal + '/' + expectTotal + ' required');
console.log(bad ? bad + ' PROBLEM(S)' : 'every marginal mark is a real trace, and every required trace is there');
process.exit(bad ? 1 : 0);
