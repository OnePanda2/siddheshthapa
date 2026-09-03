/* The MMM is now the brain, so M5's claim has changed. It asserted that
   ENTERING expands the mind. It no longer should: entering shows the brain as
   the menu, and the mind unfolds only when a region is chosen, folding again
   on the way back. Assert that instead — and mutate it. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 62)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

edit('tools/worldcheck.js',
`  M.enter(); M.settle(60);
  var afterEnter=M.mind();            // what ENTERING did, before we instruct anything
  M.setOpen(1); M.settle(60);`,
`  M.enter(); M.settle(60);
  var afterEnter=M.mind();            // entering must leave the brain standing
  M.go('region','philosophy'); M.settle(150);
  var afterPick=M.mind();             // choosing a region unfolds it
  M.go('universe'); M.settle(150);
  var afterBack=M.mind();             // and stepping back folds it again
  M.setOpen(1); M.settle(60);`);

edit('tools/worldcheck.js',
  `  var open={ mind:M.mind(), rel:M.relVis(), afterEnter:afterEnter };`,
  `  var open={ mind:M.mind(), rel:M.relVis(), afterEnter:afterEnter,\n             afterPick:afterPick, afterBack:afterBack };`);

edit('tools/worldcheck.js',
`const moved = B.nodes.filter(nd => nd.u && Math.hypot(nd.b[0] - nd.u[0], nd.b[1] - nd.u[1],
                                                      nd.b[2] - nd.u[2]) > 40).length;
ck('M5', r.closed.mind.open === 0 && r.open.afterEnter.open === 1 &&
         r.open.afterEnter.entered === true && moved === B.nodes.length,
   'ENTERING moves brain -> universe: mindOpen ' + r.closed.mind.open + ' -> ' +
   r.open.afterEnter.open + ' on entry alone, and all ' + moved + ' regions travel');`,
`/* the brain IS the menu. Entering leaves it standing; the mind unfolds when a
   region is chosen and folds again on the way back. */
const travel = B.nodes.map(nd => nd.u ? Math.hypot(nd.b[0] - nd.u[0], nd.b[1] - nd.u[1],
                                                   nd.b[2] - nd.u[2]) : 0);
const moved = travel.filter(d => d > 40).length;
ck('M5', r.closed.mind.open === 0 && r.open.afterEnter.open === 0 &&
         r.open.afterEnter.entered === true &&
         r.open.afterPick.open === 1 && r.open.afterBack.open === 0 &&
         moved >= B.nodes.length - 1,
   'the brain IS the menu — entering leaves mindOpen at ' + r.open.afterEnter.open +
   ', choosing a region opens it to ' + r.open.afterPick.open +
   ', stepping back folds it to ' + r.open.afterBack.open + '; ' + moved + ' of ' +
   B.nodes.length + ' regions travel between the two states');`);

/* the mutations follow the new claim */
edit('tools/worldmutate.js',
`  { n: 'M5', file: APP, name: 'entering actually opens the mind',
    find: \`  if(reduced||LITE){ setMindOpen(1); camPos.copy(wantPos); camAim.copy(wantAim); }\`,
    repl: \`  if(reduced||LITE){ camPos.copy(wantPos); camAim.copy(wantAim); }   // mutation: stay shut\` },`,
`  { n: 'M5', file: APP, name: 'choosing a region unfolds the mind',
    find: \`    if(reduced||LITE){ setMindOpen(wantOpen); }\`,
    repl: \`    if(reduced||LITE){ }                 // mutation: never unfold\` },

  { n: 'M5c', assert: 'M5', file: APP, name: 'entering leaves the brain standing',
    find: \`  var wantOpen = (mode==='universe' && !id) ? 0 : 1;\`,
    repl: \`  var wantOpen = 1;                      // mutation: always expanded\` },`);

console.log(n + ' edits applied');
