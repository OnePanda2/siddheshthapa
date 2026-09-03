/* Part 19's review matrix: 11 states x 6 widths, every frame rendered AND
   measured, because a state that silently renders nothing is the failure this
   project keeps finding. */
const { execSync } = require('child_process');
const fs = require('fs');
const DIR = 'F:/Projects/Siddhesh Thapa/.p3/shots-p4/matrix';
fs.mkdirSync(DIR, { recursive: true });

/* hide the threshold panel so the brain behind it can be inspected on its own.
   An inspection aid, not a product state. */
const BARE = "var th=document.getElementById('threshold'); if(th) th.style.opacity='0';";

const STATES = [
  ['01-welcome',      "M.settle(90);", 'noenter'],
  ['02-brain',        BARE + " M.settle(90);", 'noenter'],
  ['03-hover-phil',   BARE + " M.highlight('philosophy'); M.settle(60);", 'noenter'],
  ['04-hover-love',   BARE + " M.highlight('love'); M.settle(60);", 'noenter'],
  ['05-hover-art',    BARE + " M.highlight('my-works'); M.settle(60);", 'noenter'],
  ['06-hover-psy',    BARE + " M.highlight('psyche'); M.settle(60);", 'noenter'],
  ['07-transition',   BARE + " M.setOpen(0.45); M.settle(40);", 'noenter'],
  ['08-universe',     "M.settle(120);", ''],
  ['09-philosophy',   "M.go('region','philosophy'); M.settle(140);", ''],
  ['10-love',         "M.go('region','love'); M.settle(140);", ''],
  ['11-observation',  "M.go('region','observation'); M.settle(140);", '']
];
const VIEWS = [[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1440]];

const only = process.argv[2];
const rows = [];
for (const [name, drv, noenter] of STATES) {
  if (only && name.indexOf(only) < 0) continue;
  for (const [w, h] of VIEWS) {
    const out = DIR + '/' + name + '_' + w + '.png';
    try {
      execSync('node .p3/shot2.js ' + w + ' ' + h + ' "' + out + '" "' +
               drv.replace(/"/g, '\\"') + '" ' + noenter, { stdio: 'pipe', timeout: 300000 });
    } catch (e) { rows.push([name, w, 'SHOT FAILED', '', '']); continue; }
    let m = '';
    try { m = execSync('node .p3/pnginspect.js "' + out + '" ' + Math.round(w * 0.28),
                       { timeout: 60000 }).toString(); } catch (e) { m = ''; }
    rows.push([name, w, (m.match(/ink px\s+(\d+)/) || [])[1] || '0',
               (m.match(/strong>=70:(\d+)/) || [])[1] || '0',
               (m.match(/mean ([\d.]+)/) || [])[1] || '0']);
  }
}
console.log('state'.padEnd(18) + 'view'.padStart(6) + 'ink px'.padStart(9) +
            'strong'.padStart(8) + 'mean'.padStart(7) + '   verdict');
let blank = 0;
rows.forEach(([n, w, ink, strong, mean]) => {
  const empty = (+ink < 400);
  if (empty) blank++;
  console.log(n.padEnd(18) + String(w).padStart(6) + String(ink).padStart(9) +
              String(strong).padStart(8) + String(mean).padStart(7) +
              '   ' + (empty ? '*** BLANK ***' : 'rendered'));
});
console.log('\n' + rows.length + ' frames, ' + blank + ' blank');
