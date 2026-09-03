/* §16/§29 — the MMM names every region, and names its world underneath.

   Two faults, one cause. The MIG label range was the constant 620, chosen
   when the brain frame sat close. A lateral view has to stand further back to
   contain the whole organ, so five regions on the far hemisphere fell outside
   a fixed range and simply stopped being named — the menu silently lost a
   third of itself. A range measured against the ORGAN rather than typed as a
   number cannot drift when the framing changes again.

   And while the label is being rebuilt: it carries the world's real source on
   a second line. PHILOSOPHY / TRAPPIST-1. That is the second layer of
   intrigue 29 asks for, and it comes from the profile, never invented. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`    var want = n.t==='mig' ? (d<620 && !elsewhere)`,
`    /* the whole organ must be named. Measured from where the camera actually
       is, so re-framing the brain can never silently delete part of the menu. */
    var migRange = (mindOpen<0.5) ? (camPos.length()+BRAIN_R*1.30) : 620;
    var want = n.t==='mig' ? (d<migRange && !elsewhere)`);

sub(`    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))`,
`    var near = n.t==='mig' ? Math.max(0,Math.min(1,(migRange-d)/(migRange*0.55)))`);

/* the source line */
sub(`          e.textContent=n.label; labelLayer.appendChild(e); labelEls[n.id]=e; }`,
`          if(n.t==='mig'){
            /* two lines, two weights: the region is the answer, the system it
               borrows is the question underneath it */
            var nm=document.createElement('span'); nm.className='lb-name';
            nm.textContent=n.label; e.appendChild(nm);
            var src=sourceLabelOf(n.id);
            if(src){ var sp=document.createElement('span'); sp.className='lb-src';
                     sp.textContent=src; e.appendChild(sp); }
          } else { e.textContent=n.label; }
          labelLayer.appendChild(e); labelEls[n.id]=e; }`);

console.log(n + ' edits applied');
