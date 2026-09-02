const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
function grab(name, open='['){
  const i = src.indexOf('var ' + name + '=' + open);
  const close = open === '[' ? ']' : '}';
  let j = src.indexOf(open, i), depth = 0, k = j;
  for (; k < src.length; k++){
    if (src[k] === open) depth++;
    else if (src[k] === close){ depth--; if (!depth) break; }
  }
  return eval('(' + src.slice(j, k + 1) + ')');
}
const MIGS = grab('MIGS'), MINORS = grab('MINORS'), THOUGHTS = grab('THOUGHTS'),
      EDGES = grab('EDGES'), WORLDS = grab('WORLDS', '{');

const nodes = [...MIGS.map(m=>({...m,t:'mig',mig:m.id})), ...MINORS.map(m=>({...m,t:'minor'})), ...THOUGHTS];
const byId = {}; nodes.forEach(n => byId[n.id] = n);
const owned = {}; MIGS.forEach(m => owned[m.id] = []);
nodes.forEach(n => { if (n.t !== 'mig') owned[n.mig].push(n.id); });
const minorsOf = id => owned[id].filter(x => byId[x].t === 'minor');
const adj = {}; nodes.forEach(n => adj[n.id] = []);
EDGES.forEach(e => { adj[e[0]].push({o:e[1],e}); adj[e[1]].push({o:e[0],e}); });

const fail = [];
const ok = (c, label) => { console.log((c?'  PASS  ':'  FAIL  ') + label); if(!c) fail.push(label); };
const css = (src.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const js  = (src.match(/<script>[\s\S]*?<\/script>/) || [''])[0];

/* Scope a claim to the body of one function. Testing the whole script lets a
   check pass on text from a different function — or from the declaration it
   is supposed to be checking the CALL of. Three checks shipped blind that way
   before this existed. */
function fnBody(name){
  const i = js.indexOf('function ' + name + '(');
  if (i < 0) return '';
  let j = js.indexOf('{', i), d = 0, k = j;
  for (; k < js.length; k++){ if (js[k] === '{') d++; else if (js[k] === '}'){ d--; if (!d) break; } }
  return js.slice(j, k + 1);
}

console.log('\nTHE NEURONS ARE THE CONSTANT');
ok(!/cfg\(\)\.node|\*sc;/.test(js), 'node geometry does not vary by world');
ok(!/case 'curve'|case 'ortho'|case 'step'|case 'gap':/.test(js), 'edges are drawn identically in every world');
ok(!/c\.ls|cfg\(\)\.ls/.test(js), 'node labels are set the same way in every world');
ok(/function shape\(/.test(js) && (js.match(/function shape\(/g)||[]).length === 1, 'one shape routine for the whole site');
const worldKeys = new Set();
Object.values(WORLDS).forEach(w => Object.keys(w).forEach(k => worldKeys.add(k)));
ok(!worldKeys.has('node') && !worldKeys.has('edge'),
   `world configs carry no neuron overrides (${[...worldKeys].join(', ')})`);

console.log('\nDIFFERENT WORLDS');
ok(MIGS.every(m => WORLDS[m.id]), 'every MIG has an environment');
const envs = new Set(MIGS.map(m => WORLDS[m.id].env));
ok(MIGS.length === 14, `fourteen MIGs exist (${MIGS.length})`);
ok(!!WORLDS['my-works'], 'MY WORKS has its own environment');
ok(envs.size === MIGS.length, `every environment is distinct (${envs.size}/${MIGS.length})`);
const grounds = new Set(MIGS.map(m => WORLDS[m.id].ground.join(',')));
ok(grounds.size === MIGS.length, `every ground differs (${grounds.size}/${MIGS.length})`);
/* P2 relocation. This used to assert that each world redefined its colours in
   a CSS block. It did — and so did WORLDS, in rgb, for the canvas. The same
   region was declared twice with nothing checking the two agreed. The profile
   is now the single source of truth, so the check follows the tokens rather
   than the location, and gets stricter: the set must be COMPLETE, and the CSS
   duplication must not come back. */
const PROFILE_TOKENS = ['ground','ink','ink2','ink3','line','accent','accentSoft','tone'];
MIGS.forEach(m => {
  const miss = PROFILE_TOKENS.filter(k => !WORLDS[m.id][k]);
  if (miss.length) ok(false, `${m.id}: profile is missing ${miss.join(', ')}`);
});
ok(MIGS.every(m => PROFILE_TOKENS.every(k => WORLDS[m.id][k])),
   `every world declares its full colour set in its profile (${PROFILE_TOKENS.length} tokens)`);
ok(!/html\.w-[\w-]+\{--env/.test(css.replace(/\s/g, '')),
   'no world redeclares its colours in CSS — the profile is the only source');
// scoped to syncWorld's body — matching the whole script would match
// applyProfile's own declaration and prove nothing
ok(/function applyProfile\(/.test(js) && /applyProfile\(/.test(fnBody('syncWorld')),
   'the profile is handed to CSS when the world changes');
ok(MIGS.every(m => ['material','contrast','temperature'].every(k => WORLDS[m.id][k])),
   'every world declares material, contrast and temperature');
ok(new Set(MIGS.map(m => WORLDS[m.id].material)).size === MIGS.length,
   `every world is made of a different material (${new Set(MIGS.map(m => WORLDS[m.id].material)).size}/${MIGS.length})`);
ok(MIGS.every(m => new RegExp('html\\.w-' + m.id + ' \\.migtitle').test(css) || m.id === 'philosophy'),
   'every world places its title deliberately');
// light vs dark: at least two worlds must invert
const lum = c => (0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]) / 255;
const light = MIGS.filter(m => lum(WORLDS[m.id].ground) > .5).map(m => m.id);
ok(light.length >= 3, `three or more worlds are light-ground (${light.join(', ') || 'none'})`);
const contrastOK = MIGS.every(m => Math.abs(lum(WORLDS[m.id].ground) - lum(WORLDS[m.id].ink)) > .45);
ok(contrastOK, 'every world keeps ink legible against its own ground');



console.log('\nNO SHARED PAGE TEMPLATE');
const anchors = MIGS.map(m => (WORLDS[m.id].anchor||[.5,.5]).join(','));
ok(new Set(anchors).size >= 9, `the centre of attention moves per world (${new Set(anchors).size} anchors)`);
ok(anchors.filter(a => a === '0.5,0.5').length <= 1, 'worlds do not default to dead centre');
const offX = MIGS.filter(m => Math.abs((WORLDS[m.id].anchor||[.5])[0] - .5) > .04).map(m => m.id);
ok(offX.length >= 4, `several worlds are horizontally asymmetric (${offX.join(', ')})`);
const rimModes = new Set(MIGS.map(m => WORLDS[m.id].rim));
ok(rimModes.size >= 5, `the borders wait in different places (${[...rimModes].join(', ')})`);
ok(/function placeRim\(/.test(js), 'rim placement is a real routine, not one ellipse');
['edge-right','bottom-row','horizon','margins','docked'].forEach(k =>
  ok(new RegExp("case '" + k + "'").test(js), `rim mode "${k}" is implemented`));
// the panel must not sit in the same corner everywhere
const panelWorlds = (css.match(/html\.w-[\w-]+ \.emerge\{/g)||[]).length;
ok(panelWorlds >= 5, `${panelWorlds} worlds reposition the reading panel`);
const flat = css.replace(/\s/g,'');   // note: selector spaces vanish here
ok(/html\.w-music\.emerge\{[^}]*left:50%/.test(flat), 'Music reads from the centre');
ok(/html\.w-my-works\.emerge\{[^}]*right:var\(--gut\)/.test(flat), 'My Works reads down the right');
console.log('\nENVIRONMENTAL PHYSICS');
const rings = new Set(MIGS.map(m => WORLDS[m.id].ring));
ok(rings.size >= 12, `spatial behaviour differs per world (${rings.size} arrangements)`);
const eases = MIGS.map(m => WORLDS[m.id].ease);
ok(eases.every(e => typeof e === 'number'), 'every world declares a settling speed');
ok(new Set(eases).size >= 9, `motion language genuinely varies (${new Set(eases).size} distinct rates)`);
ok(Math.max(...eases) / Math.min(...eases) >= 8,
   `fastest world settles far faster than the slowest (${Math.min(...eases)} → ${Math.max(...eases)})`);
const still = MIGS.filter(m => !WORLDS[m.id].sway).map(m => m.id);
ok(still.length >= 2, `some worlds hold perfectly still (${still.join(', ') || 'none'})`);
const named = MIGS.filter(m => typeof WORLDS[m.id].sway === 'string').map(m => m.id);
ok(named.length >= 2, `some worlds move in their own named way (${named.join(', ') || 'none'})`);
const dens = MIGS.map(m => WORLDS[m.id].dens);
ok(new Set(dens).size >= 6, `density varies across worlds (${new Set(dens).size} values)`);
ok(MIGS.every(m => WORLDS[m.id].tone), 'every world declares a secondary material');


console.log('\nTWO NAVIGATION CONTROLS');
ok(/id="mindBtn"/.test(src), 'a brain control exists');
ok(/\.mindbtn\{[\s\S]*?right:/.test(css.replace(/\s+/g,m=>m.includes('\n')?'\n':' ')) || /right:clamp/.test(css.match(/\.mindbtn\{[^}]*\}/)?.[0]||''),
   'the brain sits at the top-right');
const tip = (src.match(/data-tip="([^"]+)"/)||['',''])[1];
ok(tip === 'Go back to Mind map', `its tooltip reads "${tip}"`);
ok(/content:attr\(data-tip\)/.test(css.replace(/\s/g,'')), 'the tooltip is shown on hover');
ok(/function goHome\(/.test(js), 'the brain has its own behaviour, separate from the chevron');
ok(/goHome[\s\S]{0,200}focus=null/.test(js), 'it returns to the global map rather than a previous view');
ok(/goHome[\s\S]{0,160}history\.push/.test(js), 'it still records where you were, so the chevron can walk back in');
ok(/mindBtn\.addEventListener\('click',goHome\)/.test(js) && /backBtn\.addEventListener\('click',goBack\)/.test(js),
   'the two controls are wired to different behaviours');
ok(!/html\.w-\w+ \.mindbtn\s*\{/.test(css), 'no world redesigns the brain control');

console.log('\nTHE GLOBAL MAP STAYS NEUTRAL');
ok(/mode\(\)==='world'\?'none'/.test(js), 'the map paints no world environment');
ok(/currentMig\(\)\{ return focus\? byId\[focus\.mig\] : null; \}/.test(js.replace(/\s+/g,' ')) || /return focus\?\s*byId\[focus\.mig\]\s*:\s*null/.test(js),
   'with nothing focused there is no active world');
ok(/if\(worldClass\)document\.documentElement\.classList\.remove\(worldClass\)/.test(js),
   'the previous climate is removed from the document on leaving');

console.log('\nTHE ROOM ANSWERS');
ok(/var onIdea = mode\(\)==='focus'/.test(js), 'environments know when an idea is open');
const responses = (js.match(/if\(onIdea\)/g)||[]).length;
ok(responses >= 5, `${responses} environments respond to the focused concept`);
ok(/g\.globalAlpha=\.55/.test(js), 'the environment defers while something is being read');
console.log('\nCHROMATIC DEPTH');
const tones = new Set(MIGS.map(m => WORLDS[m.id].tone.join(',')));
ok(tones.size >= 8, `secondary tones are varied (${tones.size} distinct)`);
// teal keeps green close to blue; steel blue does not
const isTeal = c => c[1] > 90 && c[2] >= c[1] && c[2] - c[1] <= 12 && c[2] - c[0] > 40;
const tealWorlds = MIGS.filter(m => isTeal(WORLDS[m.id].tone)).map(m => m.id);
ok(tealWorlds.length >= 1 && tealWorlds.length <= 4,
   `teal used as material, sparingly (${tealWorlds.join(', ') || 'none'})`);
const shades = new Set([...MIGS.flatMap(m => [WORLDS[m.id].ground.join(), WORLDS[m.id].ink.join(),
                                              WORLDS[m.id].accent.join(), WORLDS[m.id].tone.join()])]);
ok(shades.size >= 30, `the family is used as a spectrum, not four swatches (${shades.size} shades)`);

console.log('\nBUILDING vs MY WORKS');
const buildingOwns = owned['building'].map(id => byId[id]);
const worksOwns = owned['my-works'].map(id => byId[id]);
ok(!buildingOwns.some(n => n.t === 'project'), 'BUILDING holds method, not artifacts');
ok(worksOwns.filter(n => n.t === 'project').length >= 3,
   `MY WORKS holds the artifacts (${worksOwns.filter(n => n.t === 'project').length} projects)`);
ok(worksOwns.filter(n => n.t === 'minor').length >= 4, 'MY WORKS has its own minor IGs');
ok(worksOwns.some(n => n.state === 'changed' || n.id === 'abandoned'),
   'MY WORKS admits something was abandoned');
console.log('\nONE COLOUR FAMILY');
// every colour in the page must be blue / white / black / grey
const hexes = [...new Set((src.match(/#[0-9A-Fa-f]{6}/g) || []).map(s => s.toUpperCase()))];
function classify(hex){
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn;
  if (d <= 14) return 'neutral';                       // black / grey / white
  if (b >= r && b >= g && b - r >= 8) return 'blue';    // blue family
  return 'STRAY';
}
const stray = hexes.filter(h => classify(h) === 'STRAY');
ok(stray.length === 0, `no colour outside blue/white/black/grey${stray.length ? ' — ' + stray.join(' ') : ''}`);
const rgbLits = [...src.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)]
  .map(m => [+m[1], +m[2], +m[3]])
  .filter(c => { const mx=Math.max(...c), mn=Math.min(...c); return mx-mn > 14; })
  .filter(c => !(c[2] >= c[0] && c[2] >= c[1] && c[2]-c[0] >= 8));
ok(rgbLits.length === 0, `no stray rgb() literals${rgbLits.length ? ' — ' + JSON.stringify(rgbLits.slice(0,3)) : ''}`);
ok(!/#C4432B|#E4563A|#E9E5DA/i.test(src), 'the old ivory/oxide identity is fully retired');

console.log('\nUX IS UNCHANGED');
ok(/class="back"/.test(src) && /id="backBtn"/.test(src), 'the back control still exists');
const backBtnHtml = (src.match(/<button class="back"[^>]*>([\s\S]*?)<\/button>/)||['',''])[1].trim();
ok(backBtnHtml === '&lt;', `still a bare chevron (found "${backBtnHtml}")`);
ok(!/html\.w-\w+ \.back\s*\{/.test(css), 'no world redesigns the back button');
ok(/history\.push/.test(js) && /history\.pop/.test(js), 'navigation history still a real stack');
let leak = null;
MIGS.forEach(m => minorsOf(m.id).forEach(id => { if (byId[id].mig !== m.id) leak = `${id} in ${m.id}`; }));
ok(!leak, 'a MIG still shows only its own minor IGs');
ok(MIGS.filter(m => m.id !== 'music').every(m => minorsOf(m.id).length >= 4), 'every furnished MIG still has 4+ minor IGs');
ok(EDGES.every(e => e[2] && e[3] && e[3].trim().length >= 25), 'every relationship keeps verb and explanation');
const pairs = new Set(); let inv = 0;
EDGES.forEach(e => { if (pairs.has(e[1]+'>'+e[0])) inv++; pairs.add(e[0]+'>'+e[1]); });
ok(inv === 0, 'no relationship inverted');


console.log('\nCONTENT INTEGRITY');
// check the data, not the source text — the comment recording the removal is fine
const invented = /revenuepilot|flowmail/i;
ok(!nodes.some(n => invented.test(n.id + ' ' + n.label + ' ' + (n.line||''))) &&
   !EDGES.some(e => invented.test(e.join(' '))),
   'the invented projects are gone from the data');
ok(minorsOf('music').length === 0 && owned['music'].length === 0, 'MUSIC is empty, not invented');
ok(/deliberately/.test(js) && /unfurnished/.test(js), 'an empty region says so in its own words');
ok(!!WORLDS['society'], 'SOCIETY has its own environment');
ok(owned['society'].length >= 8, `SOCIETY carries real material (${owned['society'].length} objects)`);
ok(/n\.register\?/.test(js), 'register is rendered alongside state');
ok(/n\.src\?/.test(js), 'sourced objects show where they came from');
const sourced = nodes.filter(n => n.src).length;
ok(sourced >= 10, `${sourced} objects cite a source document`);
// the editorial rule: nothing may name a party, a faith or a community
const NAMED = /\b(BJP|Congress|Hindu|Muslim|Islam|Christian|Christianity|Jewish|Judaism|Sikh|Jain|Buddhist|buddha)\b/i;
const offenders = nodes.filter(n => NAMED.test((n.line||'') + ' ' + (n.label||''))).map(n => n.id);
ok(offenders.length === 0, `no published object names a party or faith${offenders.length ? ' — ' + offenders.join(', ') : ''}`);
const edgeOffenders = EDGES.filter(e => NAMED.test(e[3]||'')).length;
ok(edgeOffenders === 0, 'no relationship gloss names a party or faith');
console.log('\nORIENTATION');
ok(/migtitle/.test(css) && /id="migTitle"/.test(src), 'the MIG name is an environmental element');
ok(/syncWorld/.test(js) && (js.match(/syncWorld\(\)/g)||[]).length >= 4, 'the world is re-synced on every view change');
ok(/fadeStart/.test(js) && /prevCv/.test(js), 'crossing a border cross-fades rather than repaints');

console.log('\nTHE READING PAGE IS A DOCUMENT, NOT A ROOM');
// a region is a place you stand in; a writing is a file you take off a shelf.
// they must never be set the same way, or the visitor cannot tell them apart.
['doc','dochead','docplate','docbody','docfoot'].forEach(k =>
  ok(new RegExp('\\.' + k + '\\{').test(flat), `the document has a ${k}`));
ok(/--doc-serif:/.test(flat), 'the document declares its own text face');
const docSerif = (css.match(/--doc-serif:([^;]+);/) || ['',''])[1].trim();
const display  = (css.match(/--display:([^;]+);/)  || ['',''])[1].trim();
ok(!!docSerif && docSerif !== display && !/var\(--display\)/.test(docSerif),
   `the document does not borrow the regions' display face (${docSerif.split(',')[0]} vs ${display.split(',')[0]})`);
// size: nothing on a reading page may be set at region scale
function clampMax(sel){
  const b = (css.match(new RegExp('\\' + sel + '\\{[^}]*\\}')) || [''])[0];
  const m = b.match(/font-size:clamp\([^,]+,[^,]+,\s*([\d.]+)px\)/);
  return m ? +m[1] : null;
}
const plineMax = clampMax('.pline'), migMax = clampMax('.migtitle');
ok(plineMax && migMax && migMax / plineMax >= 1.8,
   `a region's name still dwarfs a writing's text (${migMax}px vs ${plineMax}px)`);
// the honesty rule, made structural
ok(/\.pline\{[^}]*var\(--doc-serif\)/.test(flat) && /\.full\{[^}]*var\(--doc-serif\)/.test(flat),
   'source material is set in the document serif');
ok(/\.note\{[^}]*var\(--body\)/.test(flat) && /\.lnk\.why\{[^}]*var\(--body\)/.test(flat),
   "the file's own notes are set in sans, never in his face");
ok(/function voice\(n\)\{\s*return n && n\.src \? 'his' : 'filed'; \}/.test(js.replace(/\s+/g,' ')) ||
   /voice\(n\)\{[^}]*n\.src \? 'his'/.test(js.replace(/\s+/g,' ')),
   'serif is gated on a recorded source, not on taste');
// `src` records which document a line was drawn from — not that he wrote that
// sentence. The page must state provenance, never assert authorship.
ok(/'From<b>'\+esc\(n\.src\)/.test(js.replace(/\s+/g,'')),
   'a writing is credited to its source document, not given an authorship byline');
ok(/Not his words<\/span>/.test(js), 'a quotation that is not his says so on its own title page');
// the shape the reader actually asked for
ok(/\.docplate\{[^}]*min-height:calc\(100vh-var\(--doc-h\)\)/.test(flat),
   'the writing gets the whole first screen to itself');
ok(/justify-content:center/.test((css.match(/\.docplate\{[^}]*\}/)||[''])[0]),
   'and sits in the middle of it');
ok(/secs\.push\(\['What this is'/.test(js), 'the explanation is a real section below the fold');
ok(/class="pcue"[^]{0,60}esc\(secs\[0\]\[0\]\)/.test(js),
   'the foot of the title page names what is coming next');
ok(/\.reader\.scrolled \.pcue\{opacity:0\}/.test(css.replace(/\s+/g,' ')) || /\.reader\.scrolled\.pcue\{opacity:0\}/.test(flat),
   'that promise gets out of the way once it has been taken up');
// like the neurons, the document is one thing everywhere
ok(!/html\.w-[\w-]+\.(doc|docplate|docbody|dochead|docfoot|pline|note)\{/.test(flat),
   'no world redesigns the document');
ok(/name="viewport"/.test(src), 'the page declares a viewport, so phone CSS can take effect');

console.log('\nTHE SYSTEM IS DECLARATIVE');
// scales exist so variation can be composed rather than hand-tuned
[['--space-','spacing'],['--dur-','duration'],['--ease-','easing']].forEach(([p,label]) => {
  const n = new Set((css.match(new RegExp(p + '[\\w-]+:', 'g')) || [])).size;
  ok(n >= 3, `there is a ${label} scale (${n} steps)`);
});
// a scale nothing consumes is decoration, not a system. Count only uses
// OUTSIDE :root — the previous count was inflated by four tokens that had
// been accidentally defined as themselves, which is the opposite of a use.
const cssNoRoot = css.replace(/:root\{[\s\S]*?\}/, '');
const spaceUses = (cssNoRoot.match(/var\(--(?:space|inset)-/g) || []).length;
ok(spaceUses >= 6, `the spacing scale is actually consumed (${spaceUses} uses outside :root)`);
/* A token defined as itself resolves to nothing, and every rule consuming it
   silently loses that declaration. A bulk find-and-replace during P2 did
   exactly this to four tokens and the whole suite still passed, because
   counting uses does not prove a value comes out the other end. */
const circular = [...css.matchAll(/(--[\w-]+)\s*:\s*var\(\s*(--[\w-]+)\s*\)/g)]
  .filter(m => m[1] === m[2]).map(m => m[1]);
ok(circular.length === 0, `no token is defined as itself${circular.length ? ' — ' + [...new Set(circular)].join(' ') : ''}`);
ok(/--radius-0:0/.test(flat) && /--shadow-0:none/.test(flat) && /--blur-0:none/.test(flat),
   'radius, shadow and blur are declared empty on purpose, not left undefined');
// the scales have to be used, or they are decoration
ok((css.match(/var\(--dur-/g) || []).length >= 20,
   `durations come from the scale (${(css.match(/var\(--dur-/g) || []).length} uses)`);
ok((css.match(/var\(--ease-out\)/g) || []).length >= 5,
   'the site\'s one easing curve is a token');
const bareDur = [...css.matchAll(/(?:transition|animation)[^;}]*?(?<![\d.])(\d*\.\d+|[1-9]\d*)s/g)]
  .map(m => m[1] + 's').filter(v => v !== '0s');
ok(bareDur.length === 0, `no hard-coded transition durations left${bareDur.length ? ' — ' + [...new Set(bareDur)].join(' ') : ''}`);

console.log('\nTHE GRAPH IS REACHABLE WITHOUT A MOUSE');
// A canvas is a picture. Without a parallel structure, 143 ideas and 126
// arguments are unreachable by keyboard and invisible to a screen reader.
ok(/class="skip"[^>]*href="#graphnav"/.test(src), 'a skip link jumps straight to the map');
ok(/<nav class="a11y" id="graphnav" aria-label="[^"]+"/.test(src), 'the map is a landmark with a name');
ok(/id="ann"[^>]*aria-live="polite"/.test(src) || /aria-live="polite"[^>]*id="ann"/.test(src),
   'view changes are announced');
ok(/<canvas id="graph" aria-hidden="true">/.test(src),
   'the canvas is marked decorative — the structure is the nav, not the pixels');
// Scope a claim to the body of one function. Matching the whole script
// lets a check pass on text from a completely different function — which
// is how two of these shipped blind on the first attempt.
function body(name){
  const i = js.indexOf('function ' + name + '(');
  if (i < 0) return '';
  let j = js.indexOf('{', i), d = 0, k = j;
  for (; k < js.length; k++){ if (js[k] === '{') d++; else if (js[k] === '}'){ d--; if (!d) break; } }
  return js.slice(j, k + 1);
}
// the layer must mirror retarget()'s visible sets, not keep its own truth
const navSetBody = body('navSet');
ok(!!navSetBody && /Object\.keys\(ring1\)/.test(navSetBody) && /Object\.keys\(rim\)/.test(navSetBody),
   'the layer mirrors the same ring1/ring2/rim the canvas draws');
ok(/navIds\.length/.test(js) && /tabIndex\s*=\s*i===navAt\s*\?\s*0\s*:\s*-1/.test(js.replace(/\s+/g,' ')),
   'roving tabindex — the map is one tab stop, not 143');
["ArrowDown","ArrowUp","Home","End"].forEach(k =>
  ok(new RegExp("k==='" + k + "'").test(js), `${k} moves through the current view`));
ok(/function navFocusId\(/.test(js) && /var kf=navFocusId\(\)/.test(js),
   'the canvas rings whatever holds keyboard focus');
['open','goBack','goHome'].forEach(fn =>
  ok(/syncNav\(\)/.test(body(fn)), `${fn}() re-syncs the layer`));
ok(/enterBtn\.addEventListener\('click',function\(\)\{[^}]*syncNav\(\)/.test(js),
   'entering the mind builds the layer');
// focus must never walk into something nobody can see
ok(/\.emerge:not\(\.on\)\{visibility:hidden/.test(flat), 'the closed panel leaves the tab order');
ok(/\.reader:not\(\.on\)\{visibility:hidden/.test(flat), 'the closed reading page leaves the tab order');
ok(/\.threshold\.gone\{visibility:hidden/.test(flat), 'the crossed threshold leaves the tab order');

console.log('\nTHE PHONE IS A DIFFERENT SPATIAL MODEL, NOT A SCALE FACTOR');
/* Not "does a 560px query exist" — there are two, and the weak version of
   this check passed while the phone model was disabled. The model is proven
   by what it actually does: the desktop panel is replaced by the sheet. */
ok(/\.emerge\{display:none\}/.test(flat) && /--sheet:/.test(flat),
   'the phone replaces the desktop panel with a sheet, rather than shrinking it');
ok(/function phone\(\)/.test(js) && /matchMedia\('\(max-width:560px\)'\)/.test(js),
   'one query decides which model is in force, shared by layout and labelling');
// the sheet is the P1 layer promoted, not a second data model
ok(/\.a11y#graphnav\{[^}]*clip-path:none/.test(flat),
   'the phone interface is the accessibility layer made visible');
ok(!/var\s+MOBILE_NODES|mobileGraph|phoneData/.test(js),
   'there is no separate mobile data model');
ok(/function navSet\(\)/.test(js) && (js.match(/function navSet\(/g) || []).length === 1,
   'desktop and phone read the same visible set');
// the neuron vocabulary survives the medium change
const glyphTypes = (fnBody('glyph').match(/case '([\w]+)'/g) || []).map(s => s.slice(6, -1));
const shapeTypes = (fnBody('shape').match(/case '([\w]+)'/g) || []).map(s => s.slice(6, -1));
ok(glyphTypes.length >= 9 && shapeTypes.every(t => glyphTypes.includes(t)),
   `the phone draws the same neuron alphabet (${glyphTypes.length} marks, covering all ${shapeTypes.length} canvas types)`);
ok(/\.nv-g\{[^}]*display:block/.test(flat), 'every row carries its neuron mark');
// relationships keep direction, verb and gloss on a phone
ok(/nv-v/.test(js) && /link\.e\[2\]/.test(js) && /link\.e\[3\]/.test(js),
   'a phone row carries the verb and the first-person gloss, not "related topics"');
ok(/esc\(byId\[link\.e\[0\]\]\.label\.toLowerCase\(\)\)/.test(js.replace(/\s+/g,'')) ||
   /byId\[link\.e\[0\]\]/.test(js),
   'the relationship is rendered in the edge\'s own direction');
// touch
ok(/touchstart/.test(js) && /nodeAt\([^)]*true\)/.test(js), 'the canvas answers to a fingertip');
ok(/\.back,\.mindbtn\{[^}]*min-height:44px/.test(flat), 'both navigation controls are 44px targets');
// note: `flat` strips selector spaces, so ".reader button" is ".readerbutton"
ok(/\.readerbutton\{min-height:44px\}/.test(flat), 'so is every control in the document');
// the two promises stay separate on a phone
ok(!/\.mindbtn\{[^}]*display:none/.test(flat) && !/\.back\{[^}]*display:none/.test(flat),
   'neither navigation control is dropped on small screens');
// sparse regions are not padded to fill the sheet
ok(/empty by design/.test(js), 'an empty region still says so on a phone');

console.log('\nTHE ENVIRONMENT MAY ONLY QUOTE THE CORPUS');
/* The editorial layer used to draw thirteen hand-written lines that read as
   Siddhesh's aphorisms and were not his. The fix is mechanical, not a promise:
   the layer is fed from owned[] and can only emit text that carries a src. */
ok(/function fragmentsOf\(/.test(js) && /n\.src && n\.line/.test(js),
   'the fragment layer is fed from sourced writings only');
// scoped: the ellipsis also appears in the reading page, so a whole-file
// match proved nothing about cropTo at all
const cropBody = fnBody('cropTo'), fragBody = fnBody('fragmentsOf');
ok(/'…'/.test(cropBody) && /slice\(0/.test(cropBody),
   'a cropped fragment is visibly a crop, and the wording is never changed');
// Strip comments first: an apostrophe inside "Siddhesh's" was being read as a
// string delimiter, so the check flagged its own explanatory comment as prose.
const editorialBody = (js.match(/case 'editorial': \{[\s\S]*?\n      \}/) || [''])[0]
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
/* Only flag things that are actually SENTENCES. String-concatenation pieces
   like '+(big?.085:...)+' sat between quotes and were being reported as prose,
   which made the check fire on healthy code. Real prose is letters, spaces and
   ordinary punctuation — no operators — and has several words. */
const proseInPainter = (editorialBody.match(/'[^'\n]{25,}'/g) || [])
  .map(s => s.slice(1, -1))
  .filter(s => /^[A-Za-z][A-Za-z ,.'’—–-]+$/.test(s) && (s.match(/ /g) || []).length >= 3)
  .filter(s => !/serif|monospace|Palatino|Georgia|Iowan|italic/.test(s));
ok(proseInPainter.length === 0,
   `the editorial painter contains no hand-written prose${proseInPainter.length ? ' — ' + proseInPainter.slice(0,2).join(' | ') : ''}`);
// the specific fabrications must never return
ok(!/the reasoning arrives dressed as the cause|what is worth knowing|who is asking/.test(js),
   'the invented Philosophy fragments are gone from the data');
// provenance survives into the atmosphere
// both scoped to the generator: `notMine` must be DERIVED from the register,
// and the mark must be READ from the type table — renaming MARK to NOTMARK
// slipped past a substring match
ok(/notMine\s*=\s*\(?\s*n\.register\s*===\s*'quote — not mine'/.test(fragBody),
   'an attributed quotation is identified from its own register');
ok(/mark\s*:/.test(fragBody) && /MARK\[n\.t\]/.test(fragBody) && /\bvar MARK\s*=\s*\{/.test(js),
   'marginal labels are read off the record, not assigned by taste');

console.log('\nA FRAGMENT IS A DOORWAY, NOT DECORATION');
const paintBody = fnBody('paintMotif'), hitBody = fnBody('fragmentAt');
ok(/fragHits\.push\(\{id:fr\.id/.test(paintBody),
   'a painted fragment records the writing it came from, by id');
ok(!/fragHits\.push[^)]*text/.test(paintBody),
   'the source is never inferred from the displayed text, which is a crop');
ok(/fragHits=\[\]/.test(paintBody), 'the hit map is rebuilt on every repaint, never stale');
ok(/byId\[f\.id\]/.test(hitBody), 'a hit resolves to the real writing object');
ok(/Math\.max\(44,/.test(paintBody), 'the hit area is fingertip-sized even when the text is not');
// the graph must win a contested pixel — fragments are the background layer
const clickBody = js.slice(js.indexOf("cv.addEventListener('click'"), js.indexOf("cv.addEventListener('click'") + 900);
ok(clickBody.indexOf('nodeAt(') < clickBody.indexOf('fragmentAt(') &&
   clickBody.indexOf('edgeAt(') < clickBody.indexOf('fragmentAt('),
   'nodes and edges are tested before fragments, so the graph wins a contested pixel');
ok(/fragmentAt\(tx,ty\)/.test(js), 'fragments answer to touch as well as to a mouse');
ok(/cursor=\(n\|\|e\|\|fragmentAt\(mx,my\)\)/.test(js.replace(/\s/g,'')),
   'a fragment shows it is reachable before it is clicked');

console.log('\nMARGINALIA IS EVIDENCE, NOT DECORATION');
/* This layer used to paint twelve invented footnote numbers, seven invented
   "cf. N" cross-references and nine rules at arbitrary positions. None of it
   referred to anything — it was the P4.1 failure repeated in the margins.
   These checks are structural guards against it coming back; the behaviour
   itself is proved at runtime by tools/marginaliacheck.js, which re-derives
   every painted mark from the record it claims. */
/* Anchored on CODE, not on the comment that explains it — and stripped of
   comments before matching. The explanatory comment above this layer names
   the very fabrications it removed ("cf. 3", "footnote"), so a check that
   read it would fire on its own documentation. */
const margStart = js.indexOf('var margFits=function(');
const margBody = margStart < 0 ? ''
  : js.slice(margStart, js.indexOf('break; }', margStart))
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok(margBody.length > 400, 'the marginalia layer is present and locatable');
ok(/marginalia\.push\(\{id:h\.id,kind:'source'/.test(margBody) &&
   /marginalia\.push\(\{id:h\.id,kind:'cross'/.test(margBody),
   'every mark records the writing it belongs to, by id');
ok(/\bst\s*=\s*n\.src\s*\?\s*String\(n\.src\)/.test(margBody),
   'a source mark is the record\'s own src, never a written-out label');
ok(/o\.mig!==n\.mig/.test(margBody.replace(/\s/g,'')),
   'a destination is judged against the node\'s own region, not a hard-coded one');
ok(/byId\[dests\[0\]\]\.label/.test(margBody),
   'a destination names the region the graph actually reaches');
ok(!/'cf\.|footnote|\bibid\b/i.test(margBody),
   'the invented footnote and "cf. N" apparatus is gone from the margins');
// a mark's opacity must be readable by the suite, not a literal only the painter knows
ok(/var MARG_ALPHA\s*=\s*\{/.test(js) && /MARG_ALPHA\.src\.strong/.test(margBody) &&
   /MARG_ALPHA\.cross\.strong/.test(margBody),
   'marginalia opacity is a named constant the acceptance suite can read');
// the interaction policy, structurally: a mark is not a doorway
ok(!/marginalia/.test(fnBody('fragmentAt')),
   'marginalia is not in the hit-test chain — fragments stay the doorways');
ok(!/marginalia/.test(fnBody('nodeAt')),
   'marginalia never resolves as a node');

console.log('\nRESTRAINT');
ok(!/backdrop-filter|filter:\s*blur/i.test(css), 'no glassmorphism blur effects');
const worldCss = (css.match(/html\.w-[\s\S]*/)||[''])[0];
ok(!/gradient/i.test(worldCss), 'no world uses a decorative CSS gradient');
ok(!/WebGL|THREE\.|perspective\(/i.test(src), 'no 3D');
ok(!/#00FF|#0F0\b|neon/i.test(src), 'no neon');
ok(!/design record|Notes on the system/i.test(src), 'no design record on the public site');

console.log('\n' + (fail.length ? `${fail.length} FAILED:\n  - ` + fail.join('\n  - ') : 'ALL CHECKS PASSED'));
process.exit(fail.length ? 1 : 0);
