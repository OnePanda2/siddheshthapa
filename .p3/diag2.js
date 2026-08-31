const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/diag2-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/d.html';
const probe = `
<script>setTimeout(function(){
var r={};
try{
  var M=window.__v02, cv=document.getElementById('gl');
  M.settle(60);
  var gl=cv.getContext('webgl2')||cv.getContext('webgl');
  r.ctxSame = !!gl;
  r.pointRange = gl?Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)):null;
  r.maxTex = gl?gl.getParameter(gl.MAX_TEXTURE_SIZE):null;
  r.boundFB = gl?String(gl.getParameter(gl.FRAMEBUFFER_BINDING)):null;

  // rebuild the glyph atlas the same way the app does, and measure its alpha
  var c=document.createElement('canvas'); c.width=c.height=512;
  var g2=c.getContext('2d');
  g2.fillStyle='#fff'; g2.beginPath(); g2.arc(64,64,15,0,6.2832); g2.fill();
  var id=g2.getImageData(64,64,1,1).data;
  r.canvas2dWorks=[id[0],id[1],id[2],id[3]];

  // explicit readback right after an explicit render
  M.frame();
  var w=cv.width,h=cv.height;
  var px=new Uint8Array(4*9), i=0;
  [[w/2,h/2],[w/2,h/2+40],[100,100]].forEach(function(pt){
    var b=new Uint8Array(4);
    gl.readPixels(Math.floor(pt[0]),Math.floor(pt[1]),1,1,gl.RGBA,gl.UNSIGNED_BYTE,b);
    px[i++]=b[0];px[i++]=b[1];px[i++]=b[2];
  });
  r.samples=Array.from(px.slice(0,9));
  r.glError=gl.getError();
}catch(e){ r.err=String(e&&e.message||e); }
var p=document.createElement('pre'); p.id='vp';
p.textContent=JSON.stringify(r); document.body.appendChild(p);
},320);</script>`;
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + probe, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --use-gl=swiftshader --enable-unsafe-swiftshader --user-data-dir="' + tmp + '/cr"' +
  ' --no-first-run --window-size=1440,900 --virtual-time-budget=2600' +
  ' --force-prefers-reduced-motion --dump-dom "file:///' + page.replace(/\\/g,'/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
console.log(m ? m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&') : 'NO PROBE');
