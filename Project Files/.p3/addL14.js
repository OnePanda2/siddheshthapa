const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 60)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* capture the hover state the instant the mind opens */
edit('tools/lovecheck.js',
  "  M.enter(); M.settle(60);\n  var menu=M.menuRows(), counts=M.counts();",
  "  M.enter(); M.settle(60);\n  var onEntry=M.hoverState();\n  var menu=M.menuRows(), counts=M.counts();");

edit('tools/lovecheck.js',
  "  return { bin:bin, prof:prof, astro:astro, arch:arch, near:near, menu:menu, counts:counts,",
  "  return { bin:bin, prof:prof, astro:astro, arch:arch, near:near, menu:menu, counts:counts,\n           onEntry:onEntry,");

edit('tools/lovecheck.js',
  "console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' contrast invariants hold');",
  [
    "/* L14 — the universe must open NEUTRAL.",
    "   enterMind() moves focus to the first menu row for the keyboard. That focus",
    "   was firing the highlight, so the mind opened with MY WORKS lit and the",
    "   other thirteen worlds dimmed to 0.45 — and it clobbered any highlight set",
    "   before it landed, which made two different hover screenshots identical. */",
    "ck('L14', r.onEntry && r.onEntry.hovered === null && r.onEntry.hoverRegion === -1,",
    "   'the universe opens with NO world highlighted — entering focuses the menu " +
    "for the keyboard without lighting a region (hovered=' +",
    "   JSON.stringify(r.onEntry && r.onEntry.hovered) + ', region=' +",
    "   (r.onEntry && r.onEntry.hoverRegion) + ')');",
    "",
    ""
  ].join('\n') + "console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' contrast invariants hold');");

/* mutations for both new assertions */
edit('tools/lovemutate.js',
  "  { n: 'L12', file: APP, name: 'Philosophy is not disturbed',",
  [
    "  { n: 'L13', file: APP, name: 'the menu states true counts, not total members',",
    "    find: \"      var c=mem.filter(function(id){return byId[id].t==='minor';}).length;\",",
    "    repl: \"      var c=mem.length;              // total members labelled as concepts\",",
    "    expect: 'TRUE concept and writing counts' },",
    "",
    "  { n: 'L14', file: APP, name: 'a focus the app moved does not light a world',",
    "    find: \"      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only\",",
    "    repl: \"      highlightMIG(n.id);                    // any focus lights up\",",
    "    expect: 'opens with NO world highlighted' },",
    "",
    "  { n: 'L12', file: APP, name: 'Philosophy is not disturbed',"
  ].join('\n'));

console.log(n + ' edits applied');
