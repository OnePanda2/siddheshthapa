const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/uq-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/q.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02; M.enter(); M.settle(60);
  r.proj={}; ['philosophy','life','love','behaviour','observation','learning','technology','business','building','music','movies','food','my-works','society','attention','t-magicians','patterns','anomaly','t-manager']
    .forEach(function(id){ r.proj[id]=M.project(id); });
  r.blobs={};
  ['observation','philosophy'].forEach(function(id){
    var b=M.spriteBlobs(id,170); r.blobs[id]=b?b.maxDarkness:null; });
}catch(e){ r={err:String(e&&e.message||e)}; }
var q=document.createElement('pre');q.id='vp';q.textContent=JSON.stringify(r);
document.body.appendChild(q);
},420);</script>`, 'utf8');
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=3400 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err); process.exit(1); }
console.log('at UNIVERSE range:');
Object.keys(r.proj).forEach(id => { const p = r.proj[id];
  console.log('  ' + id.padEnd(13) + (p ? ('(' + String(p.x).padStart(6) + ',' + String(p.y).padStart(6) +
    ')  d=' + String(p.dist).padStart(6) + '  ' + (p.onScreen ? 'ON ' : 'OFF')) : 'null')); });
console.log('blob maxDarkness: ' + JSON.stringify(r.blobs));
