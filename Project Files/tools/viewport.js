/* viewport.js — render the site at a TRUE CSS viewport width, headless.

   Headless Chrome clamps its window to ~500px while still writing a
   375px-wide screenshot, which looks exactly like a clipping bug and is not.
   An iframe resolves media queries and vw/vh against its own box, so loading
   the page inside a 375x812 iframe gives a genuine phone viewport that can be
   screenshotted and measured.

   usage:
     node tools/viewport.js shot  <src.html> <w> <h> <hash> <out.png>
     node tools/viewport.js probe <src.html> <w> <h> <hash> <expr-file>

   `probe` evaluates the JS in <expr-file> inside the frame and prints the
   JSON result. The expression may use `D` (frame document) and `M`
   (window.__mind inside the frame).
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [mode, srcFile, W, H, hash, out] = process.argv.slice(2);
if (!mode) { console.error('usage: viewport.js shot|probe <src> <w> <h> <hash> <out>'); process.exit(2); }

const tmp = require('./scratch.js').root() + '/viewport-' + process.pid; fs.mkdirSync(tmp, { recursive: true });
execSync('node tools/capture.js "' + srcFile + '" "' + tmp + '/cap.html"', { stdio: 'pipe' });

const frameSrc = 'cap.html' + (hash && hash !== '-' ? '#' + hash : '');
const expr = mode === 'probe' ? fs.readFileSync(out, 'utf8') : 'null';

/* The iframe exists only to get BELOW Chrome's ~500px window floor. At normal
   and large widths it is pure cost — and at 2560 the nested render blew the
   virtual-time budget and timed out. Above the floor, load the page directly:
   media queries then evaluate against the real window, which is the thing we
   are actually trying to measure. */
const DIRECT = +W >= 560;

/* Virtual time runs ~60 frames per simulated second, so the budget is a frame
   COUNT in disguise. At 2560x1080 each frame is 2.76M pixels in software
   raster, and a 2200ms budget (~132 frames) blew past four minutes. Under
   reduced-motion the layout snaps in a single frame, so a wide viewport needs
   only enough clock for the boot hook and the probe — not a longer timeout. */
const WIDE   = (+W * +H) > 1600000;
const BUDGET = WIDE ? 900 : 4200;
const DELAY  = WIDE ? 260 : 900;      // when the probe fires, inside that clock

// The wrapper is deliberately bare: no margins, no scrollbars, so the
// screenshot is exactly the frame and nothing else.
if (DIRECT){
  // append the probe to the page itself; D/Wn/M refer to this document
  const inline = `<script>
setTimeout(function(){
  var D=document, Wn=window, M=window.__mind, r;
  try{ r=(function(){ return (${expr}); })(); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({viewport:{cssWidth:Wn.innerWidth,cssHeight:Wn.innerHeight,dpr:Wn.devicePixelRatio}, result:r});
  document.body.appendChild(p);
},${DELAY});
</script>`;
  fs.writeFileSync(tmp + '/frame.html', fs.readFileSync(tmp + '/cap.html', 'utf8') + inline, 'utf8');
} else {
  fs.writeFileSync(tmp + '/frame.html', `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#000;overflow:hidden}
iframe{display:block;width:${W}px;height:${H}px;border:0}</style>
<iframe id="f" src="${frameSrc}"></iframe>
<script>
setTimeout(function(){
  var f=document.getElementById('f'), D=f.contentDocument, Wn=f.contentWindow, M=Wn.__mind;
  var r;
  try{ r=(function(){ return (${expr}); })(); }catch(e){ r={error:String(e&&e.message||e)}; }
  var real={cssWidth:Wn.innerWidth, cssHeight:Wn.innerHeight, dpr:Wn.devicePixelRatio};
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({viewport:real, result:r});
  document.body.appendChild(p);
},${DELAY});
</script>`, 'utf8');
}

const url = 'file:///' + (tmp + '/frame.html').replace(/\\/g, '/') +
            (DIRECT && hash && hash !== '-' ? '#' + hash : '');
// file:// frames are opaque origins by default, so the wrapper cannot reach
// contentDocument without this. It is a test-harness flag and never ships.
/* EVERY check funnels through here, so a matrix run launches Chrome dozens of
   times in quick succession — and without --user-data-dir they all contend on
   the one default profile. That produced two intermittent FALSE results in a
   single matrix run: widecheck reporting Business labels "sitting on the panel"
   and contradictioncheck reporting c-money-value's poles "not opposed", both of
   which passed cleanly on re-run and measured byte-identical to the previous
   build. A false FAILURE wastes a day; the same race could equally produce a
   false PASS, which is far worse. One throwaway profile per process. */
const base = '"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
             ' --user-data-dir="' + tmp + '/chrome-profile"' +
             ' --no-first-run --no-default-browser-check --disable-extensions' +
             ' --disable-background-networking --disable-sync --disable-features=Translate' +
             ' --allow-file-access-from-files' +
             ' --window-size=' + (Math.max(+W, 520)) + ',' + (Math.max(+H, 520)) +
             ' --virtual-time-budget=' + BUDGET + ' --force-prefers-reduced-motion';

if (mode === 'shot'){
  execSync(base + ' --screenshot="' + out + '" "' + url + '"', { stdio: 'pipe' });
  console.log('wrote ' + out + ' at a true ' + W + 'x' + H + ' CSS viewport');
} else {
  const dom = execSync(base + ' --dump-dom "' + url + '"', { maxBuffer: 1 << 26 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m){ console.error('probe did not run'); process.exit(2); }
  // Chrome serialises U+00A0 as &nbsp; in --dump-dom output; decode it or a
  // real space in the page reads back as a literal entity and looks like a bug
  const decoded = m[1].replace(/&nbsp;/g,' ').replace(/&quot;/g,'"')
                      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const parsed = JSON.parse(decoded);
  /* A probe that measured nothing must never read as success. Window chrome
     costs a scrollbar's width in direct mode, so allow a small tolerance —
     but a 375 request rendering at 500 is a 125px gap and still fails hard,
     which is the case this guard exists for. */
  if (Math.abs(parsed.viewport.cssWidth - +W) > 24){
    console.error('VIEWPORT MISMATCH: asked for ' + W + ', frame reported ' + parsed.viewport.cssWidth);
    process.exit(3);
  }
  console.log(JSON.stringify(parsed, null, 1));
}
