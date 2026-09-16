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
             edges: (j.edges || []).length,
             /* the ROWS, not a count: whether a retirement reduces the rendered
                total depends on which pair it names — see expectedLinks */
             retiredEdges: (j.retiredEdges || []) };
  } catch (e) {
    /* no store is not an error — this file predates live notes and the P4.x
       suites still run against a tree that may not have one */
    return { notes: 0, minors: 0, edges: 0, retiredEdges: [] };
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
              l.written + ' written live - ' + (l.orphaned || 0) +
              ' into hidden rooms = ' + l.total);
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
  /* AND THE OVERLAY CAN DECLARE A WORK. MY WORKS is derived from the graph, so
     a new sheet is a new node, and adding the BUILDING sheet took the model to
     154 objects while every check using this still expected 153 — glcheck
     failed all four states and constellationcheck's render-only count with it.
     Exactly the staleness this file exists to prevent, one list too late. */
  const declaredWorks = declaredIn('addWorks:[');
  const declared = declaredMigs + declaredMinors + declaredWritings + declaredWorks;
  /* a hidden region loses its own node — only the region, never its contents,
     which stay in the graph and are what the manual reads */
  const hidden = expectedMigs().hidden || 0;
  const live = liveNotes();
  const written = live.notes + live.minors;
  return { migs, minors, thoughts, inSource: migs + minors + thoughts,
           declaredMigs, declaredMinors, declaredWritings, declaredWorks, hidden,
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

  /* AND A HIDDEN ROOM TAKES ITS RELATIONSHIPS WITH IT.

     Hiding a region leaves its objects in the graph but gives them no position,
     so nothing draws them. A relationship from a VISIBLE topic to one of those
     objects therefore renders a row that goes nowhere — TECHNOLOGY advertising
     "TOOLS · in messages for the elite", pointing at something a visitor cannot
     reach. The app drops those edges, and this file is where the expectation
     has to learn it, exactly as it already learns that a hidden region loses
     its own node.

     MY WORKS is the exception, and the reason this never came up before: its
     objects have the manual to open, so a row pointing at one has somewhere to
     go. Only rooms with nothing behind them lose their edges. */
  const hidAt = app.indexOf('hideMIGs:[');
  const hiddenIds = [];
  if (hidAt >= 0) {
    const hidEnd = app.indexOf(String.fromCharCode(10) + '  ]', hidAt);
    const block = app.slice(hidAt, hidEnd > 0 ? hidEnd : hidAt + 4000);
    (block.match(/\{\s*id:'([a-z-]+)'/g) || []).forEach(t => {
      const id = /id:'([a-z-]+)'/.exec(t)[1];
      if (id !== 'my-works') hiddenIds.push(id);
    });
  }
  /* every object in a hidden room, which the survivor set below needs */
  const gone = {};
  if (hiddenIds.length) {
    /* every object the corpus files under a hidden region */
    const objRe = /\{id:'([a-z0-9-]+)'[^}]*?mig:'([a-z-]+)'/g;
    let om;
    while ((om = objRe.exec(src))) if (hiddenIds.includes(om[2])) gone[om[1]] = 1;
    /* and the same for anything the overlay added into one */
    const addRe = /\{\s*id:'([a-z0-9-]+)'[^}]*?mig:'([a-z-]+)'/g;
    let am;
    while ((am = addRe.exec(app))) if (hiddenIds.includes(am[2])) gone[am[1]] = 1;

    /* the count of edges lost to these rooms is taken below, from the survivor
       set, rather than here — see "A RETIRED WRITING TAKES ITS RELATIONSHIPS" */
  }

  /* ── AND A RELATIONSHIP WITHDRAWN ON PURPOSE ─────────────────────────────
     A writing is listed under a concept because it connects to it, so one that
     reaches into six concepts appears under all six — and the editor can now
     say that one of those six is wrong. The withdrawal is a line in the store,
     because almost every relationship lives in preview.html and that file is
     locked, and the app drops the pair AFTER everything that adds an edge.

     This file has to learn it, exactly as it already learns that a hidden room
     takes its relationships with it. It did not, and glcheck failed on all
     four states the first time a real unlink reached the store: "expected 127
     relationships, model has 126".

     COUNTED, NOT ASSUMED. A retirement naming a pair that was already dropped
     with its hidden room would be subtracted twice, so those are skipped. The
     gate refuses a retirement of a pair that does not exist at all, and the
     editor removes a store-published edge at source rather than retiring it,
     so nothing else here can double-count. */
  /* ── AND A RETIRED WRITING TAKES ITS RELATIONSHIPS WITH IT ──────────────────
     This is the SECOND time in a week this file did not know a way the graph
     can shrink, and the second time it was found only by data that was actually
     committed. A retired writing is blanked in place and the app sweeps every
     edge touching it — "a relationship to a vacancy is a line drawn to nothing".
     That mechanism has existed since writings became deletable, and this file
     never modelled it, because until PRETEND YOU MISS HER was retired from the
     editor no corpus writing with a relationship had ever been retired. glcheck:
     "expected 126 relationships, model has 125".

     So the count is no longer a chain of subtractions, each written the day a
     removal was noticed. It is the SET the app ends with, and that set does not
     depend on order, because every removal in the app runs after every
     addition: the retired sweep runs again after the live edges go in, and the
     hidden-room sweep and the retired-pair pass run last. An edge survives
     exactly when it is present in the corpus, the overlay or the store, neither
     end is retired, neither end lives in a hidden room, and its pair has not
     been withdrawn. Counting survivors cannot subtract an overlap twice.

     Each removed edge is attributed to the FIRST rule that takes it, in the
     app's order — retired end, then hidden room, then withdrawn pair — so the
     breakdown still reads as the app would explain it. The breakdown is for
     people; the total is what the checks assert. */
  const pairs = text => [...text.matchAll(/\['([^']+)','([^']+)'/g)].map(r => [r[1], r[2]]);
  const store = (() => {
    try { return JSON.parse(fs4.readFileSync(process.env.NOTES_FILE || 'data/notes.json', 'utf8')); }
    catch (e) { return {}; }
  })();
  const endAt = at >= 0 ? app.indexOf(String.fromCharCode(10) + '  ]', at) : -1;
  const all = [];
  const seen = {};
  const addOnce = rows => rows.forEach(e => {        // the app's addEdgesOnce: exact ordered pair
    const k = e[0] + ' ' + e[1];
    if (seen[k]) return;
    seen[k] = 1; all.push(e);
  });
  addOnce(pairs(src.slice(edgesFrom, edgesTo > edgesFrom ? edgesTo : undefined)));
  if (at >= 0) addOnce(pairs(app.slice(at, endAt > 0 ? endAt : at + 6000)));
  addOnce((store.edges || []).filter(e => Array.isArray(e) && e.length >= 2).map(e => [e[0], e[1]]));

  const retiredIds = {};
  (store.retired || []).forEach(r => { if (r && r.id) retiredIds[r.id] = 1; });
  const withdrawn = {};
  (store.retiredEdges || []).forEach(r => {
    if (r && r.a && r.b) { withdrawn[r.a + ' ' + r.b] = 1; withdrawn[r.b + ' ' + r.a] = 1; } });

  let retiredWritings = 0, hiddenRooms = 0, retiredEdges = 0, total = 0;
  all.forEach(([a, b]) => {
    if (retiredIds[a] || retiredIds[b]) retiredWritings++;
    else if (gone[a] || gone[b]) hiddenRooms++;
    else if (withdrawn[a + ' ' + b]) retiredEdges++;
    else total++;
  });

  return { inSource, declared, written,
           /* `orphaned` keeps its old name and meaning — edges lost to a hidden
              room — because edgecheck's D6 message prints it */
           orphaned: hiddenRooms, retiredWritings, retiredEdges, total };
}
module.exports.expectedLinks = expectedLinks;
