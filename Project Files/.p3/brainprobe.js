const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/bn-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/b.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02; M.settle(90);
  r.brain=M.brain(); r.mind=M.mind();
  r.proj={};
  r.brain.nodes.forEach(function(nd){ r.proj[nd.id]=M.project(nd.id); });
}catch(e){ r={err:String(e&&e.message||e)}; }
var q=document.createElement('pre');q.id='vp';q.textContent=JSON.stringify(r);
document.body.appendChild(q);
},420);</script>`, 'utf8');
const W = process.argv[2] || 1440, H = process.argv[3] || 900;
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=' + W + ',' + H +
  ' --virtual-time-budget=3600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err); process.exit(1); }
const b = r.brain;
console.log('mindOpen ' + r.mind.open + '   brainR ' + b.radius + '   cross-links ' + b.links);
console.log('extent  w ' + b.extent.w + '  h ' + b.extent.h + '  d ' + b.extent.d +
            '   (w:h ' + (b.extent.h / b.extent.w).toFixed(2) + ', w:d ' + (b.extent.d / b.extent.w).toFixed(2) + ')');
console.log('frame   ', JSON.stringify(b.frame));
console.log('hemispheres  left ' + b.left + '  right ' + b.right + '   midline gap ' + b.midlineGap);
console.log('\nnode          brain x,y,z                 screen');
b.nodes.forEach(nd => {
  const p = r.proj[nd.id];
  console.log('  ' + nd.id.padEnd(13) +
    ('(' + nd.b.map(v => String(Math.round(v)).padStart(5)).join(',') + ')').padEnd(24) +
    (p ? ('(' + String(p.x).padStart(5) + ',' + String(p.y).padStart(5) + ')  ' +
          (p.onScreen ? 'ON' : 'off')) : 'null'));
});
const xs = b.nodes.map(o => r.proj[o.id]).filter(p => p).map(p => p.x);
const ys = b.nodes.map(o => r.proj[o.id]).filter(p => p).map(p => p.y);
console.log('\non-screen spread: x ' + Math.min(...xs) + '..' + Math.max(...xs) +
            '   y ' + Math.min(...ys) + '..' + Math.max(...ys) + '   of ' + W + 'x' + H);
