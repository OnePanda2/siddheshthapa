/* How many MIGs SHOULD there be?

   Not a number typed into each check — that is how a suite goes stale the
   moment the architecture legitimately changes. It is the count in the
   authoritative graph plus the additions the V02 overlay openly declares.
   A MIG added without being declared still breaks every check that uses this. */
const fs = require('fs');

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
  return { inSource, declared, total: inSource + declared };
}

module.exports = { expectedMigs };

if (require.main === module) {
  const e = expectedMigs();
  console.log('authoritative graph: ' + e.inSource + '   declared V02 additions: ' + e.declared +
              '   expected total: ' + e.total);
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
  return { migs, minors, thoughts, inSource: migs + minors + thoughts,
           declaredMigs, declaredMinors, declaredWritings,
           declared, total: migs + minors + thoughts + declared };
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
  return { inSource, declared, total: inSource + declared };
}
module.exports.expectedLinks = expectedLinks;
