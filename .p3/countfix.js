/* The Main Mind Menu labelled every region's TOTAL member count as its concept
   count: LOVE read "7 concepts · 3 writings" when it has 4 concepts and 3
   writings, Philosophy read "21 concepts" when it has 7. The front door of the
   site was overstating the size of every region in the mind. */
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
`      var mem=owned[m.id]||[];
      var w=mem.filter(function(id){return byId[id].src;}).length;
      return row(m, mem.length+' concepts · '+w+' writings', function(){ travelTo('region',m.id); });`,
`      var mem=owned[m.id]||[];
      /* concepts are the Minor IGs, not every member — mem.length counts the
         writings too and stated them twice */
      var c=mem.filter(function(id){return byId[id].t==='minor';}).length;
      var w=mem.filter(function(id){return byId[id].src;}).length;
      return row(m, c+' concepts · '+w+' writings', function(){ travelTo('region',m.id); });`);

/* let a checker compare what the menu SAYS against what the model HOLDS */
sub(`  binaryProfile:function(mid){`,
`  counts:function(){
    var out={};
    MIGS.forEach(function(m){
      var mem=owned[m.id]||[];
      out[m.id]={ minors:mem.filter(function(id){return byId[id].t==='minor';}).length,
                  writings:mem.filter(function(id){return byId[id].src;}).length,
                  members:mem.length };
    });
    return out;
  },
  menuRows:function(){
    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){
      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\\s+/g,' ').trim() };
    });
  },
  binaryProfile:function(mid){`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
