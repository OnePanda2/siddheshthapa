const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/ov-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/o.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02; M.enter(); M.settle(40);
  r.ov=M.overlay(); r.w=M.worlds(); r.arch=M.arch(); r.menu=M.menuRows();
}catch(e){ r={err:String(e&&e.message||e), stack:String(e&&e.stack||'').slice(0,400)}; }
var q=document.createElement('pre');q.id='vp';q.textContent=JSON.stringify(r);
document.body.appendChild(q);
},420);</script>`, 'utf8');
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=3600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err + '\n' + r.stack); process.exit(1); }
console.log('MIGs ' + r.ov.migCount + '   menu rows ' + r.menu.length + '   reparented ' + r.arch.reparented.length);
console.log('\nrelabel:');
r.ov.relabel.forEach(x => console.log('  ' + x.id + '  ' + x.observedFrom + ' -> ' + x.nowLabel +
  '   (still owns ' + x.owns + ' objects)'));
console.log('added:');
r.ov.added.forEach(x => console.log('  ' + x.id + '  ' + x.label + '   owns ' + x.owns +
  '   empty=' + x.empty));
console.log('\nthe existing concept it must not disturb:');
console.log('  ' + JSON.stringify(r.ov.existingPsychologyConcept));
console.log('\nworld types: ' + JSON.stringify(r.w.types));
console.log('undeclared profiles: ' + JSON.stringify(r.w.undeclared));
console.log('\nMMM:');
r.menu.forEach(m=>console.log('  '+m.id.padEnd(20)+String(m.source).padEnd(18)+(m.source===m.expected?'ok':'MISMATCH expected '+m.expected)));
