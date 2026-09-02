/* Mutation testing found five weak points. Four are assertions that did not
   pin what they claimed; two mutations were themselves too destructive to
   produce a clean named failure.

   W1  a missing profile crashed worlds() instead of being reported, so the
       check could not fail — it could only fail to run.
   W2  "undeclared fallback" was read as "no entry in the map". A profile whose
       worldType is undefined IS the fallback, and slipped through to W3.
   W3  did not require `latent` to exist, which is the whole point of declaring
       unbuilt worlds.
   W6  its mutation renamed a MIG's id and took the app down. A relabel that
       simply does not produce ART tests the same claim without the wreckage.
   M5  the check forced setOpen(1) before reading mindOpen, so it measured its
       own instruction rather than what entering does.
   H1  asserted hoverRegion >= 0, which stays true when EVERY MIG maps to
       region 0. It must equal that MIG's actual index.
*/
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 62)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* a missing profile must be REPORTED, not fatal */
edit('src/v02-app.js',
`    MIGS.forEach(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      out.profiles[m.id]=p;
      out.types[p.worldType]=(out.types[p.worldType]||0)+1;
    });`,
`    MIGS.forEach(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      out.profiles[m.id]=p||null;
      if(p && typeof p.worldType==='string')
        out.types[p.worldType]=(out.types[p.worldType]||0)+1;
    });`);

edit('src/v02-app.js',
  `    out.undeclared=MIGS.filter(function(m){ return !MIG_WORLD_PROFILE[m.id]; }).map(function(m){return m.id;});`,
  `    /* a profile that exists but names no worldType IS the silent fallback */
    out.undeclared=MIGS.filter(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      return !p || typeof p.worldType!=='string';
    }).map(function(m){return m.id;});`);

/* W1 — every profile must actually be there */
edit('tools/worldcheck.js',
`ck('W1', ids.length === W.migs && ids.length === OV.migCount,
   'every one of the ' + ids.length + ' MIGs has exactly one world profile');`,
`const missing = ids.filter(k => !W.profiles[k]);
ck('W1', ids.length === W.migs && ids.length === OV.migCount && missing.length === 0,
   'every one of the ' + ids.length + ' MIGs has exactly one world profile' +
   (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));`);

/* W3 — the declared list must include the state unbuilt worlds are in */
edit('tools/worldcheck.js',
`ck('W3', badType.length === 0 && W.validTypes.length >= 3,`,
`ck('W3', badType.length === 0 && W.validTypes.indexOf('latent') >= 0 &&
         W.validTypes.length >= 4,`);

/* M5 — read what entering does, before instructing anything */
edit('tools/worldcheck.js',
  `  M.enter(); M.settle(60); M.setOpen(1); M.settle(60);
  var open={ mind:M.mind(), rel:M.relVis() };`,
  `  M.enter(); M.settle(60);
  var afterEnter=M.mind();            // what ENTERING did, before we instruct anything
  M.setOpen(1); M.settle(60);
  var open={ mind:M.mind(), rel:M.relVis(), afterEnter:afterEnter };`);

edit('tools/worldcheck.js',
`ck('M5', r.closed.mind.open === 0 && r.open.mind.open === 1 && r.open.mind.entered === true &&
         moved === B.nodes.length,
   'entering moves brain -> universe: mindOpen ' + r.closed.mind.open + ' -> ' +
   r.open.mind.open + ', and all ' + moved + ' regions travel');`,
`ck('M5', r.closed.mind.open === 0 && r.open.afterEnter.open === 1 &&
         r.open.afterEnter.entered === true && moved === B.nodes.length,
   'ENTERING moves brain -> universe: mindOpen ' + r.closed.mind.open + ' -> ' +
   r.open.afterEnter.open + ' on entry alone, and all ' + moved + ' regions travel');`);

/* H1 — the index must be the MIG's own, not merely non-negative */
edit('tools/worldcheck.js',
`ck('H1', r.open.hLove.st.hoverRegion >= 0 && r.open.hLove.st.hovered === 'love',
   'a hover maps to exactly one MIG (' + r.open.hLove.st.hovered + ', region ' +
   r.open.hLove.st.hoverRegion + ')');`,
`/* brain nodes are listed in MIGS order, so a MIG's index there IS its region
   index. Asserting >= 0 let a mutation map every MIG to region 0. */
const loveIdx = B.nodes.findIndex(nd => nd.id === 'love');
const psyIdx  = B.nodes.findIndex(nd => nd.id === 'psyche');
ck('H1', loveIdx >= 0 && r.open.hLove.st.hoverRegion === loveIdx &&
         r.open.hLove.st.hovered === 'love' &&
         r.closed.hPsy.st.hoverRegion === psyIdx && loveIdx !== psyIdx,
   'a hover maps to exactly one MIG — love is region ' + r.open.hLove.st.hoverRegion +
   ' (its own index ' + loveIdx + '), psychology is ' + r.closed.hPsy.st.hoverRegion);`);

/* W6 — a mutation that fails instead of crashing */
edit('tools/worldmutate.js',
`    find: \`      r.observedFrom=MIGS[i].label; MIGS[i].label=r.to;\`,
    repl: \`      r.observedFrom=MIGS[i].label; MIGS[i].label=r.to; MIGS[i].id='art';\` },`,
`    /* renaming the id took the whole app down, which proves nothing. A relabel
       that does not produce ART tests the same claim cleanly. */
    find: \`    { id:'my-works', from:'MY WORKS', to:'ART',\`,
    repl: \`    { id:'my-works', from:'MY WORKS', to:'MY WORKS AND ART',\` },`);

console.log(n + ' fixes applied');
