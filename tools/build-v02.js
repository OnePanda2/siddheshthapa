/* build-v02.js — assemble v02.html from three parts, so the experimental
   artifact never diverges from the graph it claims to represent.

     shell          src/v02-shell.html   markup, style, DOM semantic layer
     three          .p3/three.min.js     inlined; the CSP blocks every CDN
     graph data     preview.html         MIGS / MINORS / THOUGHTS / EDGES, verbatim
     app            src/v02-app.js       the scene

   The data is EXTRACTED, never retyped. P4.7 remains the source of truth for
   content; V02 is a new experience layer over the same mind.

   usage: node tools/build-v02.js
*/
const fs = require('fs');

const SRC   = 'preview.html';
const THREE = '.p3/t0.149.0.js';
const OUT   = 'v02.html';

const src = fs.readFileSync(SRC, 'utf8');

/* Slice the data block: from `var MIGS=[` up to (not including) `var NODES=[]`,
   which is where preview.html stops declaring and starts deriving. */
const a = src.indexOf('  var MIGS=[');
const b = src.indexOf('  var NODES=[],byId={},owned={};');
if (a < 0 || b < 0 || b <= a) throw new Error('could not locate the data block in ' + SRC);
const data = src.slice(a, b);

// prove we took what we think we took
const counts = {
  migs:     (data.match(/\n    \{id:'/g) || []).length,
  edges:    (data.match(/\n    \['/g) || []).length
};
if (counts.migs < 100) throw new Error('data block looks too small: ' + JSON.stringify(counts));

const three = fs.readFileSync(THREE, 'utf8');
const shell = fs.readFileSync('src/v02-shell.html', 'utf8');
const app   = fs.readFileSync('src/v02-app.js', 'utf8');
/* The astronomy is INJECTED from the researched dataset, never retyped into
   the app. If a figure in data/astronomy-systems.json changes, the geometry
   changes with it — the scene cannot drift from its sources. */
const astro = fs.readFileSync('data/astronomy-systems.json', 'utf8');
const konst = fs.readFileSync('data/constellation-ursa-major.json', 'utf8');

/* the ASTRO marker lives inside the APP, so it must be filled BEFORE the app
   is inserted into the shell — replacing it on the shell first finds nothing */
let appWithAstro = app.replace('/*__ASTRO__*/', () => astro);
if (appWithAstro === app) throw new Error('the /*__ASTRO__*/ marker was not found in the app');
const withConst = appWithAstro.replace('/*__CONST__*/', () => konst);
if (withConst === appWithAstro) throw new Error('the /*__CONST__*/ marker was not found in the app');
appWithAstro = withConst;

const out = shell
  .replace('/*__THREE__*/', () => three)
  .replace('/*__DATA__*/',  () => data)
  .replace('/*__APP__*/',   () => appWithAstro);

fs.writeFileSync(OUT, out, 'utf8');
const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log('wrote ' + OUT + '  ' + kb(out.length) +
            '   (three ' + kb(three.length) + ' · data ' + kb(data.length) +
            ' · app ' + kb(appWithAstro.length) + ' · shell ' + kb(shell.length) + ')');
console.log('data block: ' + counts.migs + ' declared objects, ' + counts.edges + ' relationship rows');
if (/src="http|href="http|fetch\(|import\(/.test(out.replace(three,'')))
  console.error('WARNING: an external reference appeared outside the three.js payload');
