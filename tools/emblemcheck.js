/* emblemcheck.js — can a visitor SEE where clicking a region will take them?

   This suite exists because one bug reached the user twice. The fifteen MIG
   emblems are the only navigation targets in the Main Mind Menu, and they were
   being drawn dimmer than the constellation's own decorative stars — Philosophy
   at 45 and Observation at 72 against background stars near 250. Clicking a
   region therefore flew the camera into what looked like empty space.

   Nothing asserted it, so nothing caught it. Every assertion here is taken off
   the rendered framebuffer, because the defect was never visible in the data:
   every profile was correct, every position was correct, and the emblems were
   simply too faint to find.

   E1  every region's emblem is actually on screen and measurable
   E2  none falls below the findability floor
   E3  no single region is left far darker than its neighbours
   E4  emblems keep their HUE — fifteen identical pale dots carry no identity
   E5  PHILOSOPHY keeps its central star when its world opens
   E6  OBSERVATION gains no fabricated centre — Ursa Major has no central star

   E4 is what stops E2 being gamed. The cheap way to pass a brightness floor is
   to mix every region toward white, which would satisfy E1-E3 while destroying
   the thing they exist to protect.

   usage: node tools/emblemcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
const tmp = fwd(os.tmpdir() + '/emb-' + process.pid);
fs.mkdirSync(tmp, { recursive: true });

/* A TIGHT BOX. The default 150px window around a region overlaps its
   neighbours and the constellation chains running past it, so a dark emblem
   still reads bright on somebody else's light. 40px holds the emblem and
   little else. */
const BOX = 40;

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  if(!M.ok || !M.ok()) return {error:'no GL'};
  M.enter(); M.settle(280);

  var menu={}, ids=M.arch().migIds;
  ids.forEach(function(id){
    var b=M.spriteBlobs(id, ${BOX});
    menu[id]= b ? {max:b.maxSignal, sum:b.sumSignal, chroma:b.chroma, rgb:b.rgb} : null;
  });

  M.go('region','observation'); M.settle(300);
  var ob=M.spriteBlobs('observation', 34);
  M.go('universe',null); M.settle(300);
  M.go('region','philosophy'); M.settle(300);
  var ph=M.spriteBlobs('philosophy', 34);

  return { ids:ids, menu:menu,
           obsWorld: ob?{max:ob.maxSignal,sum:ob.sumSignal}:null,
           philWorld: ph?{max:ph.maxSignal,sum:ph.sumSignal}:null };
})()`;

const page = tmp + '/e.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},420);</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=6500 --force-prefers-reduced-motion --dump-dom "file:///' +
    fwd(page) + '"', { maxBuffer: 1 << 26, timeout: 300000 }).toString();
  const m = dom.match(/<pre id="vp">([^]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>').replace(/&amp;/g, '&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e) {
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split(/[\r\n]/)[0].slice(0, 90));
  process.exit(1);
}

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

const ids = r.ids, MENU = r.menu;
const seen = ids.filter(id => MENU[id]);
const vals = seen.map(id => MENU[id].max);
const chr = seen.map(id => MENU[id].chroma);
const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
const dimmest = seen[vals.indexOf(lo)];

/* The floor. Philosophy measured 45 and Observation 72 while the bug was live;
   the healthy population sits at 129-182. 100 sits clear of both. */
const FLOOR = 100;
/* Colour, not brightness. A fully desaturated dot has chroma 0; the real
   palette runs 64-102. 30 fails a wash-to-white long before it looks uniform. */
const CHROMA = 30;

// E1 — on screen and measurable at all
ck('E1', seen.length === ids.length && ids.length === 15,
   'all ' + seen.length + '/' + ids.length + ' region emblems are on screen and measurable');

// E2 — bright enough to find
const under = seen.filter(id => MENU[id].max < FLOOR);
ck('E2', under.length === 0,
   'every emblem clears the findability floor of ' + FLOOR +
   ' (dimmest ' + dimmest + ' at ' + lo + ')' +
   (under.length ? ' — BELOW: ' + under.map(id => id + '=' + MENU[id].max).join(', ') : ''));

// E3 — and none is left far behind the rest
const spread = hi ? lo / hi : 0;
ck('E3', spread >= 0.5,
   'no region is left far darker than its neighbours (' + dimmest + ' is ' +
   Math.round(spread * 100) + '% of the brightest, floor 50%)');

// E4 — brightness did not come at the cost of identity
const grey = seen.filter(id => MENU[id].chroma < CHROMA);
ck('E4', grey.length === 0,
   'every emblem keeps its own colour, none washed toward white (chroma ' +
   Math.min.apply(null, chr) + '-' + Math.max.apply(null, chr) + ', floor ' + CHROMA + ')' +
   (grey.length ? ' — GREY: ' + grey.join(', ') : ''));

// E5 — the originally reported bug: the centre must survive the world opening
ck('E5', !!r.philWorld && r.philWorld.max >= FLOOR,
   'PHILOSOPHY keeps its central star when the world opens (' +
   (r.philWorld ? r.philWorld.max : 'ABSENT') + ')');

/* E6 — the other half of the same fix, and the reason it is not simply "make
   every centre bright". Ursa Major HAS no central star; inventing one to
   satisfy E2 would be a worse bug than the one being fixed. The emblem belongs
   in the menu and nowhere else. */
/* The bound is measured, not guessed. Correct, the box holds only the light
   the Dipper's own stars bleed into it: 20 peak, 1 total. Fabricate a centre
   and the same box reads 53 peak, 5 total. 38 and 2 sit between the two with
   room either side, and the pair is checked together because peak alone is
   the noisier half. */
ck('E6', !!r.obsWorld && r.obsWorld.max < 38 && r.obsWorld.sum <= 2,
   'OBSERVATION invents no central star inside its world — Ursa Major has none (' +
   (r.obsWorld ? r.obsWorld.max + ' peak / ' + r.obsWorld.sum + ' total' : 'n/a') +
   ', must stay under 38 / 2)');

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' emblem invariants hold');
if (!bad) console.log('  menu ' + lo + '-' + hi + '  ·  in-world  philosophy ' +
                      (r.philWorld && r.philWorld.max) + '  observation ' +
                      (r.obsWorld && r.obsWorld.max));
process.exit(bad ? 1 : 0);
