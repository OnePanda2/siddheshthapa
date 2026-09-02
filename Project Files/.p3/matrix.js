/* The full §23 review matrix: 8 states x 6 viewports, rendered and MEASURED.
   Measuring every frame is what catches a state that silently renders nothing —
   the failure mode that has bitten this project twice. */
const { execSync } = require('child_process');
const fs = require('fs');
const DIR = 'F:/Projects/Siddhesh Thapa/.p3/shots-love/matrix';
fs.mkdirSync(DIR, { recursive: true });

const STATES = [
  ['1-universe',    ""],
  ['2-hover-love',  "M.highlight('love');"],
  ['3-love',        "M.go('region','love');"],
  ['4-love-concept',"M.go('region','love'); M.settle(90); M.go('concept','attachment');"],
  ['5-love-writing',"M.go('region','love'); M.settle(90); M.go('concept','attachment'); M.settle(60); M.read('c-independence');"],
  ['6-back-mmm',    "M.go('region','love'); M.settle(90); M.back();"],
  ['7-philosophy',  "M.go('region','philosophy');"],
  ['8-my-works',    "M.go('region','my-works');"]
];
const VIEWS = [[375,812],[768,1024],[1024,768],[1440,900],[1920,1080],[2560,1440]];

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
                       { timeout: 60000 }).toString(); } catch (e) { m = 'INSPECT FAILED'; }
    const ink = (m.match(/ink px\s+(\d+)/) || [])[1] || '0';
    const strong = (m.match(/strong>=70:(\d+)/) || [])[1] || '0';
    const mean = (m.match(/mean ([\d.]+)/) || [])[1] || '0';
    rows.push([name, w, ink, strong, mean]);
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
