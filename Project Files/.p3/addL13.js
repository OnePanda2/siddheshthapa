const fs = require('fs');
const F = 'tools/lovecheck.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 60)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

sub("  M.enter(); M.settle(60);\n  var uni=",
    "  M.enter(); M.settle(60);\n  var menu=M.menuRows(), counts=M.counts();\n  var uni=");

sub("  return { bin:bin, prof:prof, astro:astro, arch:arch, near:near,",
    "  return { bin:bin, prof:prof, astro:astro, arch:arch, near:near, menu:menu, counts:counts,");

const L13 = [
  "// L13 — the front door must not overstate the mind",
  "const wrongCounts = [];",
  "(r.menu || []).forEach(row => {",
  "  const c = r.counts[row.id];",
  "  if (!c) return;",
  "  const m = /(\\d+)\\s+concepts?\\s*.\\s*(\\d+)\\s+writings?/.exec(row.text);",
  "  if (!m) { wrongCounts.push(row.id + ':unparsed'); return; }",
  "  if (+m[1] !== c.minors || +m[2] !== c.writings)",
  "    wrongCounts.push(row.id + ' says ' + m[1] + '/' + m[2] +",
  "                     ' but holds ' + c.minors + '/' + c.writings);",
  "});",
  "ck('L13', (r.menu || []).length === 14 && wrongCounts.length === 0,",
  "   'the Main Mind Menu states TRUE concept and writing counts for all 14 regions' +",
  "   (wrongCounts.length ? ' — WRONG: ' + wrongCounts.join('; ')",
  "                       : ' (love ' + r.counts.love.minors + ' concepts / ' +",
  "                         r.counts.love.writings + ' writings, philosophy ' +",
  "                         r.counts.philosophy.minors + ' / ' +",
  "                         r.counts.philosophy.writings + ')'));",
  "",
  ""
].join('\n');

sub("console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' contrast invariants hold');",
    L13 + "console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' contrast invariants hold');");

fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied to ' + F);
