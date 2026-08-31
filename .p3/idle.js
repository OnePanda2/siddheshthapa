/* §44 — idle must cost nothing. settle() drives frames on purpose, so it can
   never answer this; the only honest measurement is wall-clock time passing
   with nobody touching anything. */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tmp = (os.tmpdir() + '/idle-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(tmp + '/p.html', fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
  var M=window.__v02;
  M.enter(); M.settle(240);
  setTimeout(function(){
    var a=M.renders();                    // everything has come to rest
    setTimeout(function(){
      var b=M.renders();
      M.highlight('love');
      setTimeout(function(){
        var c=M.renders();
        document.title=JSON.stringify({
          rendersOverTwoIdleSeconds:b-a,
          rendersCausedByOneHover:c-b
        });
      },700);
    },2000);
  },1500);
},300);</script>`, 'utf8');
const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --disable-extensions' +
  ' --window-size=1440,900 --virtual-time-budget=12000 --dump-dom "file:///' + tmp + '/p.html"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const m = dom.match(/<title>([\s\S]*?)<\/title>/);
console.log(m ? m[1].replace(/&quot;/g, '"') : 'no result');
