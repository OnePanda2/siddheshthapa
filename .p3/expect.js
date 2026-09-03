/* How many MIGs SHOULD there be?

   Not a number typed into each check — that is how a suite goes stale the
   moment the architecture legitimately changes. It is the count in the
   authoritative graph plus the additions the V02 overlay openly declares.
   A MIG added without being declared still breaks every check that uses this. */
const fs = require('fs');

/* LIVE NOTES COUNT TOO. Everything below derives its expectation from
   preview.html and the overlay, which was the whole point of this file — a
   number typed into a check goes stale the moment the architecture
   legitimately changes. Publishing a note is exactly such a change, and the
   suite went stale on the very first one: glcheck failed four states with
   "expected 152 nodes, model has 153" because a note had been written from
   inside the site.

   A published note must never fail the build. It is not a defect, it is the
   feature working, so the expectation reads the same store the build reads. */
function liveNotes() {
  const file = process.env.NOTES_FILE || 'data/notes.json';
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { notes: (j.notes || []).length,
             minors: (j.minors || []).length,
             edges: (j.edges || []).length };
  } catch (e) {
    /* no store is not an error — this file predates live notes and the P4.x
       suites still run against a tree that may not have one */
    return { notes: 0, minors: 0, edges: 0 };
  }
}
module.exports = module.exports || {};

function expectedMigs() {
  const src = fs.readFileSync('preview.html', 'utf8');
  const block = src.slice(src.indexOf('  var MIGS=['), src.indexOf('  var MINORS=['));
  const inSource = (block.match(/\{id:'[^']+',label:'[^']+'/g) || []).length;

  const app = fs.readFileSync('src/v02-app.js', 'utf8');
  const at = app.indexOf('addMIGs:[');
  let declared = 0;
  if (at >= 0) {
    const end = app.indexOf('\n  ]', at);
    declared = (app.slice(at, end > 0 ? end : at + 4000).match(/\{\s*id:'/g) || []).length;
  }
  /* and the overlay may REMOVE a region as openly as it adds one: MY WORKS
     stopped being a region of the mind when the works got their own door, and
     every check that counts regions has to learn that in one place. */
  const hideAt = app.indexOf('hideMIGs:[');
  let hidden = 0;
  if (hideAt >= 0) {
    const hideEnd = app.indexOf('\n  ]', hideAt);
    hidden = (app.slice(hideAt, hideEnd > 0 ? hideEnd : hideAt + 4000)
      .match(/\{\s*id:'/g) || []).length;
  }
  return { inSource, declared, hidden, total: inSource + declared - hidden };
}

module.exports = { expectedMigs };

if (require.main === module) {
  const e = expectedMigs();
  const n = expectedNodes(), l = expectedLinks();
  console.log('authoritative graph: ' + e.inSource + '   declared V02 additions: ' + e.declared +
              '   expected total: ' + e.total);
  console.log('objects: ' + n.inSource + ' in source + ' + n.declared + ' declared - ' +
              n.hidden + ' hidden + ' + n.written + ' written live = ' + n.total);
  console.log('relationships: ' + l.inSource + ' + ' + l.declared + ' declared + ' +
              l.written + ' written live = ' + l.total);
}

/* the same idea for objects: the graph's own declarations plus what the overlay
   openly adds */
function expectedNodes() {
  const fs2 = require('fs');
  const src = fs2.readFileSync('preview.html', 'utf8');
  const cut = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
  const migs = (cut('  var MIGS=[', '  var MINORS=[').match(/\{id:'[^']+',label:'[^']+'/g) || []).length;
  const minors = (cut('  var MINORS=[', '  var THOUGHTS=[').match(/\{id:'[^']+',label:'[^']+',mig:'/g) || []).length;
  const thoughts = (cut('  var THOUGHTS=[', '  var EDGES=[').match(/\n    \{id:'/g) || []).length;
  /* the overlay adds CONTENTS as well as regions now — ART arrived with five
     concepts and three writings — so counting only its added MIGs left every
     check that uses this expecting nine objects fewer than the scene holds */
  const app = fs2.readFileSync('src/v02-app.js', 'utf8');
  function declaredIn(key){
    const at = app.indexOf(key);
    if (at < 0) return 0;
    const end = app.indexOf(String.fromCharCode(10) + '  ]', at);
    return (app.slice(at, end > 0 ? end : at + 6000).match(/\{\s*id:'/g) || []).length;
  }
  const declaredMigs = expectedMigs().declared;
  const declaredMinors = declaredIn('addMinors:[');
  const declaredWritings = declaredIn('addWritings:[');
  const declared = declaredMigs + declaredMinors + declaredWritings;
  /* a hidden region loses its own node — only the region, never its contents,
     which stay in the graph and are what the manual reads */
  const hidden = expectedMigs().hidden || 0;
  const live = liveNotes();
  const written = live.notes + live.minors;
  return { migs, minors, thoughts, inSource: migs + minors + thoughts,
           declaredMigs, declaredMinors, declaredWritings, hidden,
           written,
           declared, total: migs + minors + thoughts + declared - hidden + written };
}
module.exports.expectedNodes = expectedNodes;

/* How many relationships are there? The locked graph's own rows plus the ones
   the overlay openly declares. Typed as 126 into glcheck, which went stale the
   moment ART arrived with relationships of its own. */
function expectedLinks() {
  const fs4 = require('fs');
  const src = fs4.readFileSync('preview.html', 'utf8');
  const app = fs4.readFileSync('src/v02-app.js', 'utf8');
  const ROW = new RegExp(String.fromCharCode(10) + "    \\['", 'g');
  /* sliced to the END of the edges array, the way build-v02.js slices the data
     block. Running to the end of the file picked up one extra row-shaped line
     further down and made every count one too many. */
  const edgesFrom = src.indexOf('  var EDGES=[');
  const edgesTo = src.indexOf('  var NODES=[],byId={},owned={};');
  const inSource = (src.slice(edgesFrom, edgesTo > edgesFrom ? edgesTo : undefined)
    .match(ROW) || []).length;
  const at = app.indexOf('addEdges:[');
  let declared = 0;
  if (at >= 0) {
    const end = app.indexOf(String.fromCharCode(10) + '  ]', at);
    declared = (app.slice(at, end > 0 ? end : at + 6000).match(ROW) || []).length;
  }
  const written = liveNotes().edges;
  return { inSource, declared, written, total: inSource + declared + written };
}
module.exports.expectedLinks = expectedLinks;
