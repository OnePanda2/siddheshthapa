/* Screenshot an arbitrary DRIVEN state.
   usage: node .p3/shot2.js <w> <h> <out.png> "<driver js>" [noenter]
   The driver runs with M = window.__v02 in scope, after enter() — unless
   "noenter" is passed, which leaves the mind closed so the BRAIN can be seen. */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [W, H, out, driver, noenter] = process.argv.slice(2);
const tmp = (require('../tools/scratch.js').root() + '/s2-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/s.html';
const enterLine = (noenter === 'noenter') ? '' : 'M.enter(); M.settle(60);';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
  try{
    var M=window.__v02;
    if(!M||!M.ok()) return;
    ${enterLine}
    ${driver || ''}
    M.settle(150);
  }catch(e){
    var p=document.createElement('pre');p.style.cssText='position:fixed;top:0;left:0;z-index:99;background:#fdd';
    p.textContent='DRIVER ERROR: '+(e&&e.message||e);document.body.appendChild(p);
  }
},260);</script>`, 'utf8');

execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + Math.max(+W, 400) + ',' + Math.max(+H, 400) +
  ' --virtual-time-budget=4400 --force-prefers-reduced-motion' +
  ' --screenshot="' + out + '" "file:///' + page.replace(/\\/g, '/') + '"',
  { stdio: 'pipe', timeout: 300000 });
console.log('wrote ' + out.split(/[\\/]/).pop() + '  ' + W + 'x' + H);
