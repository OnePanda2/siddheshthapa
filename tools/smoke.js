/* smoke.js — the fast check, for use WHILE building worlds.

   The full regression is twelve check suites plus seven mutation suites, and it
   launches a headless Chrome once per check and once per mutation — over a
   hundred browsers, about thirty-five minutes. That is the right cost before a
   checkpoint and the wrong cost after editing a palette.

   This is one Chrome, one page load, about twenty seconds, and it answers the
   five questions that actually catch a broken edit:

     1. does it build and load at all
     2. did anything throw
     3. does the named world open
     4. are its objects present and framed where a person can see them
     5. and a screenshot, so the answer can be looked at rather than trusted

   It does NOT replace the suites and it removes nothing. Every assertion the
   project has still exists and still runs — this only defers them to the
   points where they are worth thirty-five minutes.

   usage: node tools/smoke.js                 all charted worlds
          node tools/smoke.js business life   only these
          node tools/smoke.js --shot          also write .p3/smoke.png
*/
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const SHOT = args.includes('--shot');
const WANT = args.filter(a => a[0] !== '-');
/* --w / --h so the same five questions can be asked at every width the
   responsive matrix cares about, rather than only at 1440x900 */
const dim = f => { const m = args.find(a => a.indexOf('--' + f + '=') === 0);
                   return m ? parseInt(m.split('=')[1], 10) : null; };
const VW = dim('w') || 1440, VH = dim('h') || 900;
const tmp = require('./scratch.js').root() + '/smoke-' + process.pid;
fs.mkdirSync(tmp, { recursive: true });

/* 1 — it has to build before anything else is worth asking */
try { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
catch (e) { console.log('  FAIL  build — ' + String(e.message).slice(0, 120)); process.exit(1); }

const PROBE = `(function(){
  var errs=[];
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var M=window.__v02;
  if(!M) return {fatal:'__v02 missing — the app did not boot'};
  if(!M.ok || !M.ok()) return {fatal:'no WebGL context'};
  M.enter(); M.settle(260);

  var ids = ${JSON.stringify(WANT)};
  if(!ids.length){
    var prof=M.worlds().profiles;
    ids=M.arch().migIds.filter(function(id){ return prof[id] && prof[id].palette==='own'; });
  }

  /* the emblem for every region, in the menu — this is the navigation target */
  var menu={};
  M.arch().migIds.forEach(function(id){
    var b=M.spriteBlobs(id,40);
    menu[id]= b ? {max:b.maxSignal, rgb:b.rgb} : null;
  });

  var worlds={};
  ids.forEach(function(id){
    try{
      M.setOpen(0); M.go('universe',null); M.setOpen(0);
      M.go('region',id);
      M.parkMorph(1,1); M.arrive(); M.settle(60);
      var f=M.framing(id), p=M.project(id), w=M.worlds().profiles[id];
      worlds[id]={
        type:f.worldType, source:w.astronomyTemplate||null,
        readable:f.principal.inSafe, total:f.principal.total,
        missed:f.principal.missed, cam:Math.round(f.camDist),
        onScreen:!!(p&&p.onScreen),
        /* the EFFECTIVE range at this viewport, not the stored one — a phone
           stands further back and scales it, and reading the profile hid that */
        labelRange:Math.round((M.labelRange?M.labelRange(id).minor:(w.labelStyle||{}).minor)||0)||null,
        orbits:(M.astro().orbits[id]||[]).length
      };
    }catch(e){ worlds[id]={threw:(e&&e.message)||String(e)}; }
  });
  M.setOpen(1); M.go('universe',null); M.settle(60);
  return {worlds:worlds, menu:menu, errs:errs, perf:M.perf()};
})()`;

const page = tmp + '/s.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={fatal:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='sk';
  p.textContent=JSON.stringify(r); document.body.appendChild(p);
},320);</script>`, 'utf8');

let out;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
    ' --disable-extensions --disable-background-networking --disable-sync' +
    ' --window-size=' + VW + ',' + VH + ' --virtual-time-budget=6000' +
    ' --force-prefers-reduced-motion' +
    (SHOT ? ' --screenshot="' + process.cwd().split(String.fromCharCode(92)).join('/') + '/.p3/smoke.png"' : '') +
    ' --dump-dom "file:///' + page + '"',
    { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 180000 });
  const m = dom.match(/<pre id="sk">([^]*?)<\/pre>/);
  if (!m) throw new Error('the page never reported');
  out = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
} catch (e) {
  console.log('  FAIL  load — ' + String(e.message).split(/[\r\n]/)[0].slice(0, 120));
  process.exit(1);
}

let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log('  ' + (ok ? 'ok  ' : 'FAIL') + '  ' + msg); };

if (out.fatal) { console.log('  FAIL  ' + out.fatal); process.exit(1); }

say(true, VW + 'x' + VH + ' — builds and boots, WebGL up, ' +
          out.perf.calls + ' draw calls');
say((out.errs || []).length === 0,
    (out.errs || []).length ? 'runtime errors: ' + out.errs.join(' | ') : 'no runtime errors');

/* every region must still be findable in the menu — the navigation target */
const menuIds = Object.keys(out.menu);
const dark = menuIds.filter(id => !out.menu[id] || out.menu[id].max < 100);
say(dark.length === 0,
    'all ' + menuIds.length + ' emblems findable in the menu' +
    (dark.length ? ' — DIM: ' + dark.join(', ') : ''));

for (const id of Object.keys(out.worlds)) {
  const w = out.worlds[id];
  if (w.threw) { say(false, id + ' THREW: ' + w.threw); continue; }
  const frac = w.total ? w.readable / w.total : 0;
  /* the same bars the suites use: an orbital world may crop its outer bodies,
     a constellation is a fixed figure and must be whole — and it has no orbits
     at all, because the figure IS its emblem. Asking every world for orbits
     failed OBSERVATION for being what it is. */
  const fixed = w.type === 'constellation';
  /* A world framed further away than its own label range arrives as unnamed
     lights — MOVIES and TECHNOLOGY both did, and neither the framing nor the
     visibility checks noticed, because every body was present and on screen.
     The camera has to stop inside the distance at which names still resolve. */
  const named = !w.labelRange || w.cam < w.labelRange;
  const ok = w.onScreen && frac >= (fixed ? 1 : 0.60) && (fixed || w.orbits > 0) && named;
  say(ok, id.padEnd(12) + (w.source || 'latent').padEnd(12) +
      w.readable + '/' + w.total + ' readable  @' + w.cam +
      '  labels<' + w.labelRange + (named ? '' : '  ← ARRIVES UNNAMED') +
      '  ' + w.orbits + ' orbits' +
      (w.missed && w.missed.length ? '  (' + w.missed.join(', ') + ')' : ''));
}

console.log('\n  ' + (bad ? bad + ' PROBLEM(S) — look before continuing'
                         : 'smoke clean' + (SHOT ? ' · .p3/smoke.png written' : '')));
process.exit(bad ? 1 : 0);
