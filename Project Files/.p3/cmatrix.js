/* §15 review matrix for the constellation world: 8 states x 6 widths, every
   frame rendered AND measured. Measuring each one is what catches a state that
   silently renders nothing. */
const { execSync } = require('child_process');
const fs = require('fs');
const DIR = 'F:/Projects/Siddhesh Thapa/.p3/shots-const/matrix';
fs.mkdirSync(DIR, { recursive: true });

const OBS = "M.go('region','observation'); M.settle(120);";
const STATES = [
  ['1-universe',    ""],
  ['2-hover-obs',   "M.highlight('observation');"],
  ['3-obs-ideal',   OBS],
  ['4-obs-focus',   OBS + " M.go('concept','patterns');"],
  ['5-obs-reading', OBS + " M.go('concept','patterns'); M.settle(60); M.read('t-magicians');"],
  ['6-obs-offaxis', OBS + " M.look(0.5,-0.5);"],
  ['7-obs-returned',OBS + " M.look(0.5,-0.5); M.settle(60); M.look(0,0);"],
  ['8-back-mmm',    OBS + " M.back();"]
];
const VIEWS = [[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1440]];

const only = process.argv[2];
const rows = [];
for (const [name, drv] of STATES) {
  if (only && name.indexOf(only) < 0) continue;
  for (const [w, h] of VIEWS) {
    const out = DIR + '/' + name + '_' + w + '.png';
    try {
      execSync('node .p3/shot2.js ' + w + ' ' + h + ' "' + out + '" "' +
               drv.replace(/"/g, '\\"') + '"', { stdio: 'pipe', timeout: 300000 });
    } catch (e) { rows.push([name, w, 'SHOT FAILED', '', '']); continue; }
    let m = '';
    try { m = execSync('node .p3/pnginspect.js "' + out + '" ' + Math.round(w * 0.28),
                       { timeout: 60000 }).toString(); } catch (e) { m = ''; }
    rows.push([name, w, (m.match(/ink px\s+(\d+)/) || [])[1] || '0',
               (m.match(/strong>=70:(\d+)/) || [])[1] || '0',
               (m.match(/mean ([\d.]+)/) || [])[1] || '0']);
  }
}
console.log('state'.padEnd(17) + 'view'.padStart(6) + 'ink px'.padStart(9) +
            'strong'.padStart(8) + 'mean'.padStart(7) + '   verdict');
let blank = 0;
rows.forEach(([n, w, ink, strong, mean]) => {
  const empty = (+ink < 400);
  if (empty) blank++;
  console.log(n.padEnd(17) + String(w).padStart(6) + String(ink).padStart(9) +
              String(strong).padStart(8) + String(mean).padStart(7) +
              '   ' + (empty ? '*** BLANK ***' : 'rendered'));
});
console.log('\n' + rows.length + ' frames, ' + blank + ' blank');
