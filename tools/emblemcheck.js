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
   E7  no two regions that HAVE an identity look alike

   E4 is what stops E2 being gamed. The cheap way to pass a brightness floor is
   to mix every region toward white, which would satisfy E1-E3 while destroying
   the thing they exist to protect.

   usage: node tools/emblemcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
const tmp = fwd(require('./scratch.js').root() + '/emb-' + process.pid);
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
  var prof=M.worlds().profiles;
  ids.forEach(function(id){
    var b=M.spriteBlobs(id, ${BOX});
    menu[id]= b ? {max:b.maxSignal, sum:b.sumSignal, chroma:b.chroma, rgb:b.rgb,
                   own:(prof[id]&&prof[id].palette)==='own',
                   at:[Math.round(b.at[0]),Math.round(b.at[1])]} : null;
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
/* Counted from the graph, not typed. This said 15 and broke the day ART
   became a region of its own — a check that has to be edited whenever the
   thing it measures grows is a check that will be edited without thinking. */
ck('E1', seen.length === ids.length && ids.length >= 15,
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

/* E7 — NO TWO REGIONS THAT HAVE AN IDENTITY LOOK ALIKE.

   E4 asks whether each emblem kept a colour. It never asked whether any two
   were the same colour, and with six charted worlds they were: LIFE and LOVE
   measured 10.5 apart in CIE Lab and MOVIES and OBSERVATION 8.7 — differences
   a person does not see on a small glowing dot.

   The cause was the menu's luminance lift, which multiplied each channel and
   clamped at 1.0. That raises brightness by destroying hue: any colour with
   two strong channels saturates both, so every warm palette collapsed into one
   olive-gold and every cool one into one teal, and an ember orange for MOVIES
   came out the same colour as LOVE. Normalising by the largest channel instead
   of clipping preserves the ratios exactly, and the six palettes separated on
   their own.

   Measured in CIE Lab off the rendered pixels, not compared as hex literals —
   two different hex values can land on the same screen colour, which is the
   whole failure being tested for.

   NOTHING IS EXCLUDED, and this paragraph used to say the opposite. It
   described nine latent regions sharing one neutral palette and being exempt
   from the comparison for that reason. That exemption was removed further down
   this same file — "an uncharted region takes the emptiest place left on a
   ring of constant perceived brightness ... there is nothing left to exempt"
   — and the paragraph up here was left behind describing the older check.

   It has since become wrong twice over: there are no latent regions at all now
   that MUSIC, PSYCHOLOGY and ART have their systems. E7 compares every region
   against every other, at two bars, and derives which bar applies from whether
   each has a palette of its own — so it holds a rule and not a roll-call, and
   no count in a comment needs revising when a world is added. */
function toLab(c) {
  const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const R = f(c[0]), G = f(c[1]), B = f(c[2]);
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const g = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = g(X), fy = g(Y), fz = g(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const dE = (a, b) => { const p = toLab(a), q = toLab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

/* 18 is the bar. Below about 10 two dots read as the same colour; the six
   charted worlds now sit at 22 and above, so this has real margin without
   being tuned to exactly what today's palette happens to score. */
const DE_MIN = 18;
/* EVERY REGION, not only the charted ones.

   This used to compare only regions with their own palette and say plainly
   that the rest "share the neutral palette" — which was true, and meant three
   emblems were the same blue at an RGB distance of 3. They no longer share it:
   an uncharted region takes the emptiest place left on a ring of constant
   perceived brightness, so it has both a colour of its own and enough light to
   be found. There is nothing left to exempt. */
/* TWO BARS, AND THE REASON IS ABOUT THE SPACE RATHER THAN THE CODE.

   18 stands between CHARTED regions. Those palettes were designed by hand and
   could be put wherever they needed to go.

   An uncharted region has no such freedom: it has to fit whatever gap the
   twelve fixed palettes leave, and measured across the whole wheel under the
   brightness floor the widest gap available is 16.7 deltaE. 18 is therefore
   not a bar it can clear however the placement is written, and insisting on it
   would mean either deleting this check or re-spacing twelve approved colours.
   14 is the bar instead, taken from the perceptual threshold this file already
   names: below about 10 two dots read as the same colour, so 14 keeps real
   margin over that while being honest that it is the looser of the two. */
const CHARTED_MIN = DE_MIN, UNCHARTED_MIN = 14;
const clashes = [];
let closest = Infinity, closestPair = '';
for (let i = 0; i < seen.length; i++)
  for (let j = i + 1; j < seen.length; j++) {
    const a = seen[i], b = seen[j];
    const bar = (MENU[a].own && MENU[b].own) ? CHARTED_MIN : UNCHARTED_MIN;
    const d = dE(MENU[a].rgb, MENU[b].rgb);
    if (d < bar) clashes.push(a + '/' + b + ' ' + d.toFixed(1) + ' under ' + bar);
    if (d < closest) { closest = d; closestPair = a + '/' + b; }
  }
const chartedCount = seen.filter(id => MENU[id].own).length;
ck('E7', seen.length >= 15 && clashes.length === 0,
   'no two regions look alike — all ' + seen.length + ' of them: ' +
   chartedCount + ' charted, held ' + CHARTED_MIN + ' deltaE apart, and ' +
   (seen.length - chartedCount) + ' uncharted held ' + UNCHARTED_MIN +
   ' because they take what the fixed palettes leave. Closest pair ' +
   closestPair + ' at ' + closest.toFixed(1) +
   (clashes.length ? ' — TOO CLOSE: ' + clashes.join(', ') : ''));

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' emblem invariants hold');
if (!bad) console.log('  menu ' + lo + '-' + hi + '  ·  in-world  philosophy ' +
                      (r.philWorld && r.philWorld.max) + '  observation ' +
                      (r.obsWorld && r.obsWorld.max));
process.exit(bad ? 1 : 0);
