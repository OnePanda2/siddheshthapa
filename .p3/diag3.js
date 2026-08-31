const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/diag3-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/d.html';

/* capture BEFORE the app runs, so a shader-compile failure or a lost context
   is recorded rather than lost to a headless console nobody reads */
const pre = `<script>
window.__LOG=[];
['error','warn','log'].forEach(function(k){
  var o=console[k].bind(console);
  console[k]=function(){ try{ window.__LOG.push(k+': '+Array.prototype.slice.call(arguments).join(' ').slice(0,400)); }catch(e){} o.apply(null,arguments); };
});
window.addEventListener('error',function(e){ window.__LOG.push('window.error: '+e.message+' @'+e.lineno); });
document.addEventListener('DOMContentLoaded',function(){
  var cv=document.getElementById('gl');
  if(cv) cv.addEventListener('webglcontextlost',function(){ window.__LOG.push('*** WEBGL CONTEXT LOST ***'); });
});
</script>`;

const post = `<script>setTimeout(function(){
var r={log:window.__LOG.slice(0,14)};
try{
  var M=window.__v02, cv=document.getElementById('gl');
  M.settle(30);
  var gl=cv.getContext('webgl2')||cv.getContext('webgl');
  r.lost = gl? gl.isContextLost() : 'no ctx';
  r.err  = gl? gl.getError() : null;
  r.ptRange = gl? String(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)) : null;
  r.viewport = gl? String(gl.getParameter(gl.VIEWPORT)) : null;
}catch(e){ r.threw=String(e&&e.message||e); }
var p=document.createElement('pre'); p.id='vp';
p.textContent=JSON.stringify(r); document.body.appendChild(p);
},340);</script>`;

const html = fs.readFileSync('v02.html', 'utf8');
fs.writeFileSync(page, pre + html + post, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --use-gl=swiftshader --enable-unsafe-swiftshader --user-data-dir="' + tmp + '/cr"' +
  ' --no-first-run --window-size=1440,900 --virtual-time-budget=2600' +
  ' --force-prefers-reduced-motion --dump-dom "file:///' + page.replace(/\\/g,'/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const o = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
console.log('lost:', o.lost, ' glError:', o.err, ' pointRange:', o.ptRange, ' viewport:', o.viewport);
if (o.threw) console.log('threw:', o.threw);
console.log('--- page console ---');
(o.log||[]).forEach(l => console.log('  ' + l));
