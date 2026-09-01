/* How much of each world actually lands in the READABLE area?
   usage: node .p3/frameprobe.js [w] [h] */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/fr-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/f.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02; M.enter(); M.settle(60);
  r.w={};
  ['philosophy','love','observation'].forEach(function(id){
    M.go('region',id); M.settle(150);
    r.w[id]=M.framing(id);
  });
}catch(e){ r={err:String(e&&e.message||e)}; }
var q=document.createElement('pre');q.id='vp';q.textContent=JSON.stringify(r);
document.body.appendChild(q);
},420);</script>`, 'utf8');
const W = process.argv[2] || 1440, H = process.argv[3] || 900;
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=' + W + ',' + H +
  ' --virtual-time-budget=4200 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 240000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err); process.exit(1); }
console.log(W + 'x' + H);
Object.keys(r.w).forEach(k => {
  const o = r.w[k];
  if (!o) { console.log('  ' + k + '  null'); return; }
  console.log('  ' + k.padEnd(13) + 'in safe area ' + String(o.inSafe + '/' + o.total).padEnd(8) +
    ' offScreen ' + String(o.offScreen).padStart(2) +
    '   radius ' + String(o.radius).padStart(6) + '  fitNeeds ' + String(o.fit).padStart(7) +
    '  camAt ' + String(o.camDist).padStart(7));
});
