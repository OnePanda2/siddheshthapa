const fs = require('fs');
const F = 'tools/worldmutate.js';
let s = fs.readFileSync(F, 'utf8');
const anchor = `  { n: 'R1', file: APP, name: 'relationship visibility is world-local, not origin-based',`;
if (s.split(anchor).length - 1 !== 1) { console.error('anchor'); process.exit(1); }

const NEW = [
"  { n: 'W8', file: APP, name: 'the rename carries the relationships with it',",
"    find: `    EDGES.forEach(function(e){",
"      if(e[0]===rn.from){ e[0]=rn.to; }",
"      if(e[1]===rn.from){ e[1]=rn.to; }",
"    });`,",
"    repl: `    /* mutation: re-key the object but orphan its relationships */` },",
"",
"  { n: 'W8b', assert: 'W8', file: APP, name: 'the freed id belongs to the MIG, not the concept',",
"    find: `      if(o.id===rn.from){ o.id=rn.to; moved++; }`,",
"    repl: `      if(false){ o.id=rn.to; moved++; }   // mutation: never re-key` },",
"",
"  { n: 'W9', file: APP, name: 'an unassigned MIG never invents a source',",
"    find: `  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';`,",
"    repl: `  if(p.worldType==='latent' || !p.astronomyTemplate) return 'TRAPPIST-1';` },",
"",
"  { n: 'M6', file: APP, name: 'the whole brain stays inside the frame',",
"    find: `    var k=phoneB2?2.62:1.78;`,",
"    repl: `    var k=phoneB2?2.62:0.72;            // mutation: zoom into the brain` },",
"",
"  { n: 'MI1', file: APP, name: 'the named object is the one that lights',",
"    find: `  var i=(id && nodeIndex[id]!==undefined) ? nodeIndex[id] : -1;`,",
"    repl: `  var i=id?0:-1;                       // mutation: always the same object` },",
"",
"  { n: 'MI2', file: APP, name: 'the objects it did not name recede',",
"    find: `      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 0.44;',`,",
"    repl: `      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 1.0;',` },",
"",
"  { n: 'MI3', file: APP, name: 'the Minor IG highlight is reversible',",
"    find: `function highlightNode(id){",
"  if(hoveredNode===id) return;`,",
"    repl: `function highlightNode(id){",
"  if(!id) return;                        // mutation: never release",
"  if(hoveredNode===id) return;` },",
"",
""
].join('\n');

fs.writeFileSync(F, s.replace(anchor, NEW + anchor), 'utf8');
console.log('7 mutations added');
