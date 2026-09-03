/* L14 read the hover state synchronously after enter(), but enterMind moves
   focus inside a setTimeout — so the assertion was sampling a moment before the
   thing it tests had happened, and the mutation that removes the gate changed
   nothing it could see. Reproduce the app's own programmatic focus directly. */
const fs = require('fs');
const F = 'tools/lovecheck.js';
let s = fs.readFileSync(F, 'utf8');
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 60)); process.exit(1); }
  s = s.replace(find, repl);
}

sub("  M.enter(); M.settle(60);\n  var onEntry=M.hoverState();",
`  M.enter(); M.settle(60);
  /* enterMind parks focus on the first menu row inside a setTimeout, so
     sampling right after enter() sees a moment BEFORE the thing under test.
     Do what the app does, synchronously, then look. */
  var firstRow=document.querySelector('#groups [data-nav]');
  if(firstRow) firstRow.focus();
  M.settle(20);
  var onEntry={ hoverState:M.hoverState(), focused:document.activeElement &&
                document.activeElement.getAttribute &&
                document.activeElement.getAttribute('data-nav') };`);

sub("ck('L14', r.onEntry && r.onEntry.hovered === null && r.onEntry.hoverRegion === -1,",
    "ck('L14', r.onEntry && r.onEntry.hoverState.hovered === null &&\n" +
    "         r.onEntry.hoverState.hoverRegion === -1 && !!r.onEntry.focused,");

sub("   JSON.stringify(r.onEntry && r.onEntry.hovered) + ', region=' +\n" +
    "   (r.onEntry && r.onEntry.hoverRegion) + ')');",
    "   JSON.stringify(r.onEntry && r.onEntry.hoverState.hovered) + ' while focus sits on ' +\n" +
    "   JSON.stringify(r.onEntry && r.onEntry.focused) + ')');");

fs.writeFileSync(F, s, 'utf8');
console.log('L14 now measures the real moment');
