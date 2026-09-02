/* overlapcheck.js — no border label may sit on top of the reading panel.

   This is a geometric property, so asserting that clearPanel() exists proves
   nothing. It enters every region at several viewports, measures the panel's
   real rectangle and every rim label's box, and reports actual intersections.

   usage: node tools/overlapcheck.js preview.html
*/
const fs = require('fs'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VIEWPORTS = [[1440,900],[1280,800]];

const tmp = require('os').tmpdir() + '/overlapcheck';
fs.mkdirSync(tmp, { recursive: true });
execSync('node tools/capture.js "' + file + '" "' + tmp + '/cap.html"', { stdio: 'pipe' });

const probe = `
<script>
setTimeout(function(){
  var M=window.__mind, out=[];
  var ids=Object.keys(M.byId).filter(function(k){return M.byId[k].t==='mig';});
  ids.forEach(function(id){
    M.open(M.byId[id]);
    var em=document.getElementById('emerge'), st=document.getElementById('stage');
    if(!em.classList.contains('on')){ out.push(id+'|nopanel'); return; }
    var r=em.getBoundingClientRect(), s=st.getBoundingClientRect();
    var p={x0:r.left-s.left,y0:r.top-s.top,x1:r.right-s.left,y1:r.bottom-s.top};
    var hits=[];
    ids.forEach(function(o){
      if(o===id)return;
      var n=M.byId[o];
      if(n.tx===undefined)return;
      var half=Math.min(118,(String(n.label).length*6.1)/2+12);
      var b={x0:n.tx-half,y0:n.ty-12,x1:n.tx+half,y1:n.ty+34};
      var over = !(b.x1<p.x0||b.x0>p.x1||b.y1<p.y0||b.y0>p.y1);
      if(over) hits.push(n.label);
    });
    out.push(id+'|'+(hits.join('/')||'clear'));
  });
  var e=document.createElement('pre');e.id='ov';e.textContent=out.join(';;');
  document.body.appendChild(e);
},500);
</script>`;
fs.writeFileSync(tmp + '/probe.html', fs.readFileSync(tmp + '/cap.html', 'utf8') + probe, 'utf8');

let bad = 0, tested = 0;
VIEWPORTS.forEach(([w, h]) => {
  const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --window-size=' + w + ',' + h +
    ' --virtual-time-budget=4000 --force-prefers-reduced-motion --dump-dom "file:///' +
    tmp.replace(/\\/g, '/') + '/probe.html#mind"', { maxBuffer: 1 << 26 }).toString();
  const m = dom.match(/<pre id="ov">([\s\S]*?)<\/pre>/);
  if (!m){ console.log('  ' + w + 'x' + h + ' — probe did not run'); bad++; return; }
  const rows = m[1].split(';;').map(r => r.split('|'));
  const clashes  = rows.filter(r => r[1] !== 'clear' && r[1] !== 'nopanel');
  /* A region whose panel could not be measured is UNTESTED, not passing.
     Treating it as a pass is how this check first reported "14 regions, no
     label on the panel" for a build that had the bug in it. */
  const untested = rows.filter(r => r[1] === 'nopanel');
  tested += rows.length - untested.length;
  if (clashes.length || untested.length){
    bad += clashes.length + untested.length;
    console.log('  FAIL  ' + w + 'x' + h);
    clashes.forEach(c => console.log('          in ' + c[0] + ': ' + c[1].split('/').join(', ') + ' overlap the panel'));
    if (untested.length) console.log('          UNTESTED (no panel measured): ' + untested.map(r => r[0]).join(', '));
  } else {
    console.log('  PASS  ' + (w + 'x' + h).padEnd(9) + ' ' + rows.length + ' regions measured, no label on the panel');
  }
});
console.log('\n' + (bad ? bad + ' OVERLAP(S)' : tested + ' region/viewport combinations clear'));
process.exit(bad ? 1 : 0);
