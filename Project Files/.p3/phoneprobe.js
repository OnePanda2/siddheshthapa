/* Where do the eight stars actually land on a phone? */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/ph-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/p.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02; M.enter(); M.settle(60);
  M.go('region','observation'); M.settle(150);
  r.proj={}; ['attention','t-reels','c-absurd','evidence','t-manager','patterns','t-magicians','anomaly','observation']
    .forEach(function(id){ r.proj[id]=M.project(id); });
}catch(e){ r={err:String(e&&e.message||e)}; }
var q=document.createElement('pre');q.id='vp';q.textContent=JSON.stringify(r);
document.body.appendChild(q);
},420);</script>`, 'utf8');
const W = process.argv[2] || 375, H = process.argv[3] || 812;
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=' + W + ',' + H +
  ' --virtual-time-budget=3600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err); process.exit(1); }
/* the sheet covers the lower part of a phone; the sky strip is the top */
const strip = Math.round(H * 0.42);
console.log('at ' + W + 'x' + H + ' — sky strip is y < ' + strip);
let inStrip = 0, on = 0;
Object.keys(r.proj).forEach(id => {
  const p = r.proj[id]; if (!p) { console.log('  ' + id.padEnd(14) + 'null'); return; }
  const ok = p.onScreen && p.y < strip && p.y > 0 && p.x > 4 && p.x < W - 4;
  if (p.onScreen) on++; if (ok) inStrip++;
  console.log('  ' + id.padEnd(14) + '(' + String(p.x).padStart(5) + ',' + String(p.y).padStart(5) +
              ')  ' + (ok ? 'IN STRIP' : (p.onScreen ? 'on screen, behind sheet' : 'OFF')));
});
console.log('  -> ' + inStrip + '/9 in the visible sky strip, ' + on + '/9 on screen');
