/* The focus handler gained a kbNav gate, so H7's old anchor vanished and the
   harness stopped — correctly, since a mutation that does not apply is
   UNVERIFIED, not a pass. Re-point it at the current handler. */
const fs = require('fs');
const F = 'tools/highlightmutate.js';
let s = fs.readFileSync(F, 'utf8');
const find = "  { n: 'H7', name: 'keyboard focus reaches the highlight',\n" +
             "    find: \"    b.addEventListener('focus',function(){ highlightMIG(n.id); });   // keyboard parity\",\n" +
             "    repl: \"\",\n" +
             "    expect: 'keyboard focus' },";
const repl = "  { n: 'H7', name: 'keyboard focus reaches the highlight',\n" +
             "    find: \"      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only\",\n" +
             "    repl: \"      if(false) highlightMIG(n.id);           // keyboard parity removed\",\n" +
             "    expect: 'keyboard focus' },";
const hits = s.split(find).length - 1;
if (hits !== 1) { console.error('ANCHOR x' + hits); process.exit(1); }
fs.writeFileSync(F, s.replace(find, repl), 'utf8');
console.log('H7 re-anchored');
