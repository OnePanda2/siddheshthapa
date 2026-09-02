const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/perf-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/p.html';
/* measured WITHOUT reduced-motion and WITHOUT lite, so the real render loop
   runs — the whole point is to see whether an idle universe costs frames */
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>
window.__frames=0;
(function(){ var raf=window.requestAnimationFrame; })();
setTimeout(function(){
  var r={};
  try{
    var M=window.__v02;
    M.enter(); M.setOpen(1);
    var a=M.perf();
    var t0=performance.now();
    // let the world settle after arrival, then watch an IDLE universe
    setTimeout(function(){
      var before=M.perf();
      var c0=before.calls;
      setTimeout(function(){
        var after=M.perf();
        r={ universe:a,
            idleDrawCallsChanged:(after.calls!==c0),
            calls:after.calls, geometries:after.geometries, textures:after.textures,
            points:after.points, lines:after.lines, dpr:after.dpr,
            frameMs:after.frameMs, renderer:after.renderer,
            mind:M.mind(), heapMB: (performance.memory? +(performance.memory.usedJSHeapSize/1048576).toFixed(1) : null) };
        var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);
        document.body.appendChild(p);
      }, 2600);
    }, 700);
  }catch(e){
    var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify({err:String(e&&e.message||e)});
    document.body.appendChild(p);
  }
},300);
</script>`, 'utf8');

const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=6000 --dump-dom "file:///' + page.replace(/\\/g,'/') + '#focus:philosophy"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 240000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
if (r.err) { console.log('ERR', r.err); process.exit(1); }
console.log('renderer     ', r.renderer);
console.log('draw calls   ', r.calls);
console.log('geometries   ', r.geometries, '· textures', r.textures);
console.log('points       ', r.points, '· line vertices', r.lines);
console.log('devicePixelRatio (capped)', r.dpr);
console.log('frame time   ', r.frameMs, 'ms');
console.log('JS heap      ', r.heapMB === null ? 'n/a' : r.heapMB + ' MB');
console.log('morph state ', JSON.stringify(r.mind));
console.log('artifact size', (fs.statSync('v02.html').size/1024).toFixed(0) + ' KB');
