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
const OUT    = 'v02.html';
/* the editor is a second artifact, never a mode of the first */
const EDITOR = 'editor.html';

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
/* MY WORKS carries only what the graph does not: purpose, parts, procedure,
   known failures. Same rule as the astronomy — injected, never retyped, so
   the manual cannot drift from the mind it came out of. */
const worksData = fs.readFileSync('data/works.json', 'utf8');
/* LIVE NOTES. The only input to this build that is not written by hand — the
   editor writes it and commits it, and the build is what turns a commit into a
   published page. NOTES_FILE exists so the pipeline can be exercised against a
   fixture without fabricating published content. */
const notesFile = process.env.NOTES_FILE || 'data/notes.json';
const notesData = fs.readFileSync(notesFile, 'utf8');
const notes = JSON.parse(notesData);
const worksApp  = fs.readFileSync('src/v02-works.js', 'utf8');
const works = worksApp.replace('/*__WORKSDATA__*/', () => worksData);
if (works === worksApp) throw new Error('the /*__WORKSDATA__*/ marker was not found in the manual');

/* the ASTRO marker lives inside the APP, so it must be filled BEFORE the app
   is inserted into the shell — replacing it on the shell first finds nothing */
let appWithAstro = app.replace('/*__ASTRO__*/', () => astro);
if (appWithAstro === app) throw new Error('the /*__ASTRO__*/ marker was not found in the app');
const withConst = appWithAstro.replace('/*__CONST__*/', () => konst);
if (withConst === appWithAstro) throw new Error('the /*__CONST__*/ marker was not found in the app');
appWithAstro = withConst;
const withNotes = appWithAstro.replace('/*__NOTES__*/', () => notesData);
if (withNotes === appWithAstro) throw new Error('the /*__NOTES__*/ marker was not found in the app');
appWithAstro = withNotes;

const out = shell
  .replace('/*__THREE__*/', () => three)
  .replace('/*__DATA__*/',  () => data)
  .replace('/*__APP__*/',   () => appWithAstro)
  .replace('/*__WORKS__*/', () => works);

fs.writeFileSync(OUT, out, 'utf8');

/* ── THE SECOND ARTIFACT ────────────────────────────────────────────────────
   editor.html is v02.html plus one script. Keeping them as two files rather
   than one file with a hidden mode is what lets ADR-02 stay literally true of
   the published page: every network call in this project lives in the editor,
   so the page the world loads still makes none. It is also the honest split —
   there is nothing to "unlock" in v02.html, because the editor is not in it. */
const editorApp = fs.readFileSync('src/v02-editor.js', 'utf8');
const editorCfg = fs.readFileSync('data/editor-config.json', 'utf8');
const editorReady = editorApp.replace('/*__EDITORCFG__*/', () => editorCfg);
if (editorReady === editorApp) throw new Error('the /*__EDITORCFG__*/ marker was not found in the editor');
fs.writeFileSync(EDITOR, out + '\n<script>\n' + editorReady + '\n</script>\n', 'utf8');
/* the published page must contain no editor and no way out to the network.
   Measured against the file WITHOUT the three.js payload, which carries its own
   fetch and would otherwise convict the page of the editor's crime. */
if (/__EDITORCFG__|api\.github\.com|login\/oauth/.test(out.replace(three, '')))
  throw new Error('the editor leaked into the published artifact');
const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log('wrote ' + OUT + '  ' + kb(out.length) +
            '   (three ' + kb(three.length) + ' · data ' + kb(data.length) +
            ' · app ' + kb(appWithAstro.length) + ' · shell ' + kb(shell.length) + ')');
console.log('data block: ' + counts.migs + ' declared objects, ' + counts.edges + ' relationship rows');
console.log('manual: ' + (JSON.parse(worksData).sheets || []).length + ' sheet(s) written, ' +
            kb(works.length) + ' of layer');
console.log('live notes: ' + (notes.notes || []).length + ' note(s), ' +
            (notes.minors || []).length + ' concept(s), ' +
            (notes.edges || []).length + ' relationship(s)' +
            (notesFile === 'data/notes.json' ? '' : '   [fixture: ' + notesFile + ']'));
if (out.indexOf('/*__WORKS__*/') >= 0) throw new Error('the manual was not injected into the shell');
if (/src="http|href="http|fetch\(|import\(/.test(out.replace(three,'')))
  console.error('WARNING: an external reference appeared outside the three.js payload');
