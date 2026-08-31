const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/orb-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/o.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r; try{ var M=window.__v02; M.enter(); M.go('region','philosophy'); M.settle(120);
  r={astro:M.astro(), perf:M.perf(), state:M.state()};
}catch(e){ r={err:String(e&&e.message||e)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);document.body.appendChild(p);
},300);</script>`, 'utf8');

const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR', r.err); process.exit(1); }

const A = r.astro;
console.log('dataset :', JSON.stringify(A.dataset));
console.log('assigned:', JSON.stringify(A.assigned.philosophy));
console.log('orbit line object:', A.orbitLineObject);
console.log('\nPHILOSOPHY ORBITS   slot · concept · radius · measured distance from the star');
(A.orbits.philosophy || []).forEach(o =>
  console.log('  ' + o.slot + '   ' + o.id.padEnd(14) + ' r=' + String(o.r).padEnd(8) + ' dist=' + o.dist));
const rs = (A.orbits.philosophy || []).map(o => o.r);
if (rs.length) {
  console.log('\nratio outer/inner = ' + (rs[rs.length - 1] / rs[0]).toFixed(2) +
              '   (TRAPPIST-1 measured = 5.36)');
  const axes = A.assigned.philosophy.axes;
  const want = axes.map(v => (v / axes[0]).toFixed(3));
  const got  = rs.map(v => (v / rs[0]).toFixed(3));
  console.log('measured ratios : ' + want.join(' '));
  console.log('rendered ratios : ' + got.join(' '));
  console.log('spacing preserved: ' + (want.join() === got.join()));
}
console.log('\nperf:', JSON.stringify(r.perf));
