/* §7's actual conceptual interaction did not exist. The pointer parallax moves
   the camera by +-5 scene units; at the constellation's 236-unit viewing
   distance that is +-1.2 degrees, far too little to pull a figure apart.

   In a constellation world the parallax is amplified, because there it is not
   decoration — it is the argument. The stars have real, measured depths, so
   moving off the line of sight separates things that looked adjacent. Mizar and
   Alcor are 0.94 units apart across the sky and 10.7 units apart in depth: from
   the ideal view they are one light, and a small move proves they are not.

   Still event-driven: pointermove already requests frames, idle stays free. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  aim.x+=mx*10; aim.y+=-my*7;`,
`  /* A pattern depends on where you stand. Inside a constellation the viewpoint
     is the subject, so the same pointer travel carries much further there. */
  var par=(state.region && CONSTELLATIONS[state.region]) ? 13.0 : 1.0;
  aim.x+=mx*10*par; aim.y+=-my*7*par;`);

sub(`  go:function(mode,id){ travelTo(mode,id); return this.state(); },`,
`  go:function(mode,id){ travelTo(mode,id); return this.state(); },
  /* drive the same viewpoint the pointer drives, so a checker and a screenshot
     can stand where a visitor would stand */
  look:function(x,y){ mx=x||0; my=y||0; invalidate(30); return {mx:mx,my:my}; },`);

console.log(n + ' edits applied');
