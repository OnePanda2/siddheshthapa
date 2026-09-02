/* The features were long parallel sweeps at similar depth, so they nested like
   contour lines on an egg. A brain drawing is one strong outline plus a few
   SHORT marks set at angles to each other — the Sylvian and the central sulcus
   cross; the cerebellum is a small arc, not a sweep.

   Five features, shortened and angled, and the far hemisphere pushed much
   further back so its rim stops doubling the outline. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  /* the Sylvian fissure — cuts in from the front-low and rises toward the back.
     This is what makes a temporal lobe read AS a lobe. */
  { id:'sylvian', w:0.86,
    pts:[[-0.42,0.52],[0.10,0.60],[0.62,0.72],[1.14,0.86],[1.66,0.99],[2.10,1.10]] },
  /* the temporal lobe's own lower edge, below the fissure */
  { id:'temporal', w:0.80,
    pts:[[-0.55,0.94],[-0.20,1.16],[0.25,1.30],[0.75,1.34],[1.25,1.28],[1.70,1.16]] },
  /* the central sulcus — crown down and forward toward the fissure */
  { id:'central', w:0.62,
    pts:[[1.86,1.34],[1.66,1.10],[1.42,0.88],[1.16,0.70],[0.94,0.58]] },
  /* the cerebellum, divided from the occipital above it */
  { id:'cerebellar', w:0.62,
    pts:[[3.28,1.36],[3.52,1.12],[3.74,0.92],[3.98,0.86],[4.20,0.96]] },
  /* two cortical folds, faint, following the contour */
  { id:'fold-a', w:0.34,
    pts:[[-0.10,0.86],[0.55,0.98],[1.20,1.10],[1.85,1.18],[2.45,1.20]] },
  { id:'fold-b', w:0.30,
    pts:[[0.35,1.14],[1.00,1.26],[1.65,1.34],[2.25,1.36],[2.80,1.32]] }
];`,
`  /* THE SYLVIAN FISSURE — a short diagonal cutting up and back from the front,
     the mark that makes a temporal lobe read as a lobe */
  { id:'sylvian', w:0.90,
    pts:[[-0.05,0.50],[0.38,0.62],[0.80,0.76],[1.22,0.90]] },
  /* THE CENTRAL SULCUS — a short diagonal running the OTHER way, crossing it.
     Two marks at an angle say brain; two parallel sweeps say contour map. */
  { id:'central', w:0.72,
    pts:[[1.98,1.32],[1.72,1.06],[1.46,0.82],[1.24,0.64]] },
  /* THE CEREBELLUM — a small arc at the back and below, not a sweep */
  { id:'cerebellar', w:0.72,
    pts:[[3.46,1.30],[3.70,1.05],[3.94,0.90],[4.16,0.95]] },
  /* one cortical fold, faint */
  { id:'fold', w:0.30,
    pts:[[0.70,1.16],[1.30,1.26],[1.90,1.31],[2.44,1.28]] }
];`);

/* the far hemisphere must recede much harder, or its rim doubles the outline */
sub(`      '    a = alpha * (1.0 - mindOpen) * pow(clamp(depth*0.5+0.5,0.0,1.0), 2.6);',`,
    `      '    a = alpha * (1.0 - mindOpen) * pow(clamp(depth*0.5+0.5,0.0,1.0), 5.0);',`);

console.log(n + ' edits applied');
