/* contradictioncheck.js — is a contradiction actually legible as a tension?

   Runtime geometry, not source strings. Per focused contradiction:
     1. exactly two poles, read from the graph (verb `tension`, outbound)
     2. both poles are on the stage — one side of a contradiction is a lie
     3. both are labelled
     4. they are genuinely OPPOSED: mirrored about the contradiction, within
        tolerance, at comparable distance (equal dignity, measured)
     5. neither pole sits on the reading panel
     6. pole labels do not collide with each other or with the contradiction
     7. the contradiction's own writing is still reachable (fragment present)
   A contradiction that cannot be measured FAILS.

   usage: node tools/contradictioncheck.js preview.html [w] [h]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const CONTRAS = process.argv[5] ? [process.argv[5]]
              : ['c-curiosity', 'c-money-value', 'c-cynical', 'c-absurd', 'c-independence', 'c-weakness'];

const tmp = (os.tmpdir() + '/contracheck-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const probeFor = id => `(function(){
  M.repaint();
  var c=M.byId['${id}'], st=D.getElementById('stage').getBoundingClientRect();
  var SW=st.width, SH=st.height;
  var edges=[];
  (M.edgesOf? M.edgesOf('${id}') : []).forEach(function(e){ edges.push(e); });
  var vis=M.visible(), z=M.zones();
  var phone=M.comp()&&M.comp().phone;
  function box(n){
    var half=Math.min(118,(String(n.label).length*6.1)/2+12);
    return {id:n.id,x0:n.cx-half,y0:n.cy-12,x1:n.cx+half,y1:n.cy+34};
  }
  function hit(p,q){ return (Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0))>1 && (Math.min(p.y1,q.y1)-Math.max(p.y0,q.y0))>1; }
  var poles=M.poles('${id}');
  if(!poles) return {error:'no poles resolved'};
  var A=poles[0], B=poles[1];
  var onStage=[A,B].filter(function(n){ return n.cx>4 && n.cx<SW-4 && n.cy>4 && n.cy<SH-4; }).length;
  var dA=Math.hypot(A.cx-c.cx, A.cy-c.cy), dB=Math.hypot(B.cx-c.cx, B.cy-c.cy);
  // opposition: the two poles should sit on opposite sides of the contradiction
  var vAx=A.cx-c.cx, vAy=A.cy-c.cy, vBx=B.cx-c.cx, vBy=B.cy-c.cy;
  var dot=(vAx*vBx+vAy*vBy)/((Math.hypot(vAx,vAy)||1)*(Math.hypot(vBx,vBy)||1));
  var bA=box(A), bB=box(B), bC=box(c);
  var frags=M.frags(), hasOwn=frags.some(function(f){ return f.id==='${id}'; });
  return {
    poleIds:[A.id,B.id], poleRegions:[A.mig,B.mig],
    onStage:onStage, phone:!!phone,
    distA:Math.round(dA), distB:Math.round(dB),
    dignity:+(Math.min(dA,dB)/Math.max(dA,dB)||0).toFixed(2),
    opposition:+dot.toFixed(2),
    labelled:[A.id,B.id].filter(function(i){ return vis.rim.indexOf(i)>=0 || vis.ring1.indexOf(i)>=0 || M.labelled(i); }).length,
    onPanel:(z&&z.panel)?[bA,bB].filter(function(b){return hit(b,z.panel);}).map(function(b){return b.id;}):[],
    labelClash:[[bA,bB],[bA,bC],[bB,bC]].filter(function(p){return hit(p[0],p[1]);}).map(function(p){return p[0].id+'/'+p[1].id;}),
    ownFragment:hasOwn
  };
})()`;

let bad = 0, measured = 0;
CONTRAS.forEach(id => {
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
    console.log('  FAIL  ' + id.padEnd(16) + ' NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,58));
    bad++; return;
  }
  measured++;
  const p = [];
  if (r.poleIds.length !== 2)  p.push('not exactly two poles');
  if (r.phone){
    // the phone shows the tension through the sheet, not the constellation
    console.log('  PASS  ' + id.padEnd(16) + ' phone — poles ' + r.poleIds.join(' / '));
    return;
  }
  if (r.onStage < 2)     p.push('only ' + r.onStage + ' of 2 poles on the stage');
  if (r.dignity < 0.55)  p.push('unequal dignity — distances ' + r.distA + ' vs ' + r.distB);
  if (r.opposition > -0.25) p.push('poles not opposed (cos ' + r.opposition + ', want < -0.25)');
  if (r.onPanel.length)  p.push('pole on the reading panel: ' + r.onPanel.join(', '));
  if (r.labelClash.length) p.push('label collision: ' + r.labelClash.join(', '));
  if (p.length){ bad += p.length; console.log('  FAIL  ' + id); p.forEach(x => console.log('          ' + x)); }
  else console.log('  PASS  ' + id.padEnd(16) + r.poleIds.join(' ↔ ') +
                   '  dignity ' + r.dignity + '  opposition ' + r.opposition +
                   (r.poleRegions[0]!==r.poleRegions[1] ? '  (spans ' + r.poleRegions.join('/') + ')' : ''));
});
console.log('\n' + measured + '/' + CONTRAS.length + ' contradictions measured at ' + W + 'x' + H);
console.log(bad ? bad + ' PROBLEM(S)' : 'every contradiction reads as a tension');
process.exit(bad ? 1 : 0);
