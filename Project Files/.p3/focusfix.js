/* Entering the mind called .focus() on the first menu row, whose focus handler
   highlighted that MIG. So the universe's baseline was "MY WORKS lit, all
   thirteen others dimmed to 0.45" from the moment you arrived, and any
   highlight set before that async focus landed was silently clobbered — which
   is why two screenshots of different hover states came out byte-identical.

   A focus the VISITOR drove with the keyboard should highlight. A focus the
   app moved for them should not. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

sub(
`var hoveredMIG=null;`,
`/* Did the visitor drive this focus, or did we? Only their own keyboard
   navigation should light a world up. */
var kbNav=false;
window.addEventListener('keydown',function(e){
  if(e.key==='Tab'||e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='ArrowLeft'||
     e.key==='ArrowRight'||e.key==='Home'||e.key==='End') kbNav=true;
},true);
window.addEventListener('pointerdown',function(){ kbNav=false; },true);

var hoveredMIG=null;`);

sub(
`    b.addEventListener('focus',function(){ highlightMIG(n.id); });   // keyboard parity
    b.addEventListener('blur',function(){ highlightMIG(null); });`,
`    b.addEventListener('focus',function(){
      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only
    });
    /* release unconditionally: if this row is the lit one, leaving it must
       clear it, however the focus got here */
    b.addEventListener('blur',function(){ if(hoveredMIG===n.id) highlightMIG(null); });`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
