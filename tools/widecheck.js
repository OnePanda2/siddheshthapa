/* widecheck.js — does the composition hold up on a very wide screen?

   "It rendered" is not the acceptance criterion. This measures the eight
   things that decide whether an ultrawide layout is intentional:

     1. the page renders at the asked-for viewport
     2. every drawn node sits inside the stage
     3. nothing disappeared (marks painted, panel populated)
     4. no two canvas labels collide
     5. no border label sits on the reading panel
     6. the back and brain controls are where they promise to be
     7. the composition still has density (grid coverage)
     8. no enormous dead zone

   ONE CHROME PROCESS PER STATE. Opening a region repaints a full-viewport
   offscreen environment canvas — 2.76M pixels at 2560x1080 — and five of them
   in a single run took 429 seconds and still timed out. Split, each run is
   short and one slow state cannot take the whole measurement down.

   usage: node tools/widecheck.js preview.html [w] [h]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const W = +(process.argv[3] || 2560), H = +(process.argv[4] || 1080);
const STATES = ['philosophy', 'business', 'music', 'my-works', 'curiosity'];

const tmp = (require('./scratch.js').root() + '/widecheck').replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

/* Boot straight into the state with #focus:<id> rather than loading the map
   and opening the region in the probe. Each region entry repaints a
   full-viewport offscreen environment canvas, so doing it twice doubled an
   already expensive run — that, not the frame count, was the real cost. */
const probeFor = id => `(function(){
  var stage=D.getElementById('stage'), sr=stage.getBoundingClientRect();
  var SW=sr.width, SH=sr.height;
  function labelBox(n){
    var half=Math.min(118,(String(n.label).length*6.1)/2+12);
    return {x0:n.cx-half,y0:n.cy-12,x1:n.cx+half,y1:n.cy+34,id:n.id,label:n.label};
  }
  function hits(a,b){ return !(a.x1<b.x0||a.x0>b.x1||a.y1<b.y0||a.y0>b.y1); }
  var focus=M.byId['${id}'];
  var drawn=Object.keys(M.byId).map(function(k){return M.byId[k];})
    .filter(function(n){ return n.cx!==undefined && n.cx>-50 && n.cx<SW+50 && n.cy>-50 && n.cy<SH+50; });
  /* Exactly what the canvas labels, taken from the page rather than assumed.
     In a MIG view that is the focus plus every rim region; in a concept view
     it is the focus, its ring and the rim only — assuming all 14 regions
     carry labels invented collisions that were never on screen. */
  var vis=M.visible();
  var lab={}; lab[vis.focus]=1;
  vis.ring1.forEach(function(k){lab[k]=1;}); vis.rim.forEach(function(k){lab[k]=1;});
  var labelled=drawn.filter(function(n){ return lab[n.id]; });
  var boxes=labelled.map(labelBox), collisions=[];
  for(var i=0;i<boxes.length;i++) for(var j=i+1;j<boxes.length;j++)
    if(hits(boxes[i],boxes[j])) collisions.push(boxes[i].label+' / '+boxes[j].label);
  var em=D.getElementById('emerge'), pOn=em.classList.contains('on');
  var pr=em.getBoundingClientRect();
  var panel=pOn?{x0:pr.left-sr.left,y0:pr.top-sr.top,x1:pr.right-sr.left,y1:pr.bottom-sr.top}:null;
  var onPanel=[];
  if(panel) boxes.forEach(function(b){ if(b.id!==focus.id && hits(b,panel)) onPanel.push(b.label); });
  var bb=D.getElementById('backBtn').getBoundingClientRect();
  var mb=D.getElementById('mindBtn').getBoundingClientRect();
  var CX=12, CY=6, used=0, grid=[];
  for(var gy=0;gy<CY;gy++){ grid[gy]=[];
    for(var gx=0;gx<CX;gx++){
      var c={x0:gx*SW/CX,y0:gy*SH/CY,x1:(gx+1)*SW/CX,y1:(gy+1)*SH/CY};
      var u=drawn.some(function(n){return n.cx>=c.x0&&n.cx<c.x1&&n.cy>=c.y0&&n.cy<c.y1;}) ||
            boxes.some(function(b){return hits(b,c);}) || (panel && hits(panel,c));
      grid[gy][gx]=u?1:0; if(u)used++;
    }
  }
  var best=0;
  for(var y0=0;y0<CY;y0++) for(var x0=0;x0<CX;x0++)
    for(var y1=y0;y1<CY;y1++) for(var x1=x0;x1<CX;x1++){
      var ok=true;
      for(var yy=y0;yy<=y1&&ok;yy++) for(var xx=x0;xx<=x1&&ok;xx++) if(grid[yy][xx]) ok=false;
      if(ok) best=Math.max(best,(y1-y0+1)*(x1-x0+1));
    }
  return {
    stage: Math.round(SW)+'x'+Math.round(SH),
    drawnMarks: drawn.length,
    /* Only LABELLED marks must stay on screen. Background nodes are parked
       outside the stage on purpose (retarget pushes them outward from the
       anchor and draws them faint), so flagging those was my own artifact,
       not a defect in the page. */
    outsideStage: labelled.filter(function(n){return n.cx<0||n.cx>SW||n.cy<0||n.cy>SH;}).length,
    labelCollisions: collisions,
    labelsOnPanel: onPanel,
    panelMeasured: !!panel,
    panelRows: pOn ? em.querySelectorAll('button').length : 0,
    backTopLeft: bb.left<SW*0.12 && bb.top<SH*0.12,
    brainTopRight: mb.right>SW*0.88 && mb.top<SH*0.12,
    coveragePct: Math.round(used/(CX*CY)*100),
    deadBlockPct: Math.round(best/(CX*CY)*100)
  };
})()`;

let bad = 0, measured = 0, stageSeen = '';
STATES.forEach(id => {
  fs.writeFileSync(tmp + '/p-' + id + '.js', probeFor(id), 'utf8');
  let s;
  try {
    const raw = execSync('node tools/viewport.js probe "' + file + '" ' + W + ' ' + H +
                         ' focus:' + id + ' "' + tmp + '/p-' + id + '.js"',
                         { maxBuffer: 1 << 26, timeout: 320000 }).toString();
    const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    if (Math.abs(parsed.viewport.cssWidth - W) > 24)
      throw new Error('viewport reported ' + parsed.viewport.cssWidth);
    s = parsed.result;
    if (s && s.error) throw new Error(s.error);
  } catch (e){
    // NOT MEASURED is a failure, never a pass
    console.log('  FAIL  ' + id.padEnd(12) + ' NOT MEASURED — exit ' + (e.status || '?') +
                (e.signal ? ' ' + e.signal : '') + ' ' + String(e.message).split('\n')[0].slice(0, 70));
    bad++; return;
  }
  measured++; stageSeen = s.stage;
  const p = [];
  if (s.drawnMarks < 5) p.push('only ' + s.drawnMarks + ' marks painted — content disappeared');
  if (s.outsideStage) p.push(s.outsideStage + ' marks outside the stage');
  if (s.labelCollisions.length) p.push('labels collide: ' + s.labelCollisions.slice(0,4).join(' | '));
  if (!s.panelMeasured) p.push('panel not measured');
  if (s.labelsOnPanel.length) p.push('sitting on the panel: ' + s.labelsOnPanel.join(', '));
  if (!s.panelRows) p.push('panel has no content');
  if (!s.backTopLeft) p.push('back control not top-left');
  if (!s.brainTopRight) p.push('brain control not top-right');
  if (s.coveragePct < 30) p.push('composition too sparse — ' + s.coveragePct + '% coverage');
  if (s.deadBlockPct > 34) p.push('dead zone covering ' + s.deadBlockPct + '% of the field');
  if (p.length){ bad += p.length; console.log('  FAIL  ' + id); p.forEach(x => console.log('          ' + x)); }
  else console.log('  PASS  ' + id.padEnd(12) + String(s.drawnMarks).padStart(4) + ' marks · ' +
                   String(s.coveragePct).padStart(3) + '% coverage · dead block ' +
                   String(s.deadBlockPct).padStart(2) + '% · panel ' + s.panelRows + ' controls');
});
console.log('\nstage ' + (stageSeen || '?') + ' — ' + measured + '/' + STATES.length + ' states measured');
console.log(bad ? bad + ' PROBLEM(S) at ' + W + 'x' + H
                : STATES.length + ' states compose correctly at ' + W + 'x' + H);
process.exit(bad ? 1 : 0);
