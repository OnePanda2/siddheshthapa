/* scratch.js — where the checks put their working files, and who deletes them.

   Every check and probe in this project drives a headless Chrome, and each run
   needs somewhere to write a copy of the artifact plus a fresh
   --user-data-dir for the browser. That was os.tmpdir(), which on Windows is
   C:\\Users\\<name>\\AppData\\Local\\Temp — the SYSTEM drive, regardless of
   where the project lives. Nothing ever deleted those directories.

   A full regression launches Chrome once per check and once per mutation, so a
   single run leaves well over a hundred browser profiles behind. Measured on
   this machine before the fix: 911 abandoned directories holding 21.4 GB, all
   of it on C:, while the project itself sits on F:.

   Two changes, both here rather than in forty-seven files:

     - the scratch root moves NEXT TO THE PROJECT, so it uses the drive the
       project was put on;
     - it is swept, so it does not grow without limit.

   Cleanup happens twice over, because a killed process runs no exit handler
   and this tooling is killed fairly often — background runs get stopped, and
   mutation harnesses die on a bad anchor. So each run deletes its own
   directories when it exits AND sweeps anything older than two hours left by a
   run that never got the chance. Two hours is comfortably longer than the
   slowest suite and far shorter than the gap between sessions.
*/
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..', '.scratch');
const STALE_MS = 2 * 60 * 60 * 1000;
let ready = false;

function sweep() {
  let names;
  try { names = fs.readdirSync(ROOT); } catch (e) { return; }
  const now = Date.now();
  for (const n of names) {
    const p = path.join(ROOT, n);
    try {
      if (now - fs.statSync(p).mtimeMs > STALE_MS) fs.rmSync(p, { recursive: true, force: true });
    } catch (e) { /* in use by a live run, or already gone — either is fine */ }
  }
}

function mine() {
  let names;
  try { names = fs.readdirSync(ROOT); } catch (e) { return; }
  const pid = String(process.pid);
  /* every caller puts its pid in the directory name; matching on the pid alone
     is safe because nothing but this tooling writes here */
  for (const n of names) {
    if (n.indexOf(pid) < 0) continue;
    try { fs.rmSync(path.join(ROOT, n), { recursive: true, force: true }); } catch (e) {}
  }
}

/* AND THE BROWSERS THE DIRECTORIES BELONGED TO.

   A killed process runs no exit handler — the reason the sweep above exists —
   and on Windows it takes its grandchildren with it even less reliably than
   its files. execSync's timeout kills the node child it spawned; the Chrome
   that child had launched keeps running.

   MEASURED, not assumed: a viewport probe cut off at 12s left TWELVE chrome
   processes still running immediately afterwards. That is what made
   widecheck's retry useless — a state that timed out was retried against a
   machine still carrying the entire load of the attempt that had just beaten
   it, and at 2560x1080 in software raster that load is the whole problem. Both
   retries it has ever fired failed for this reason.

   It matches on --user-data-dir pointing inside this project's own scratch
   root, so it can only ever reach browsers this tooling started. A real
   browser has no such profile and is never touched.

   CALL IT ONLY WHEN NONE OF YOUR OWN PROBES IS RUNNING. It cannot tell a
   hung browser from a working one, and the suite is serial by design. */
function reap() {
  if (process.platform !== 'win32') return 0;   // the only place this has bitten
  const ps = path.join(ROOT, 'reap-' + process.pid + '.ps1');
  try {
    fs.mkdirSync(ROOT, { recursive: true });
    fs.writeFileSync(ps,
      '$p = @(Get-CimInstance Win32_Process -Filter "Name=\'chrome.exe\'" |\n' +
      "  Where-Object { $_.CommandLine -like '*--user-data-dir=*.scratch*' })\n" +
      '$p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }\n' +
      '$p.Count\n', 'utf8');
    const out = require('child_process').execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ps + '"',
      { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
    return parseInt(String(out).trim(), 10) || 0;
  } catch (e) {
    return 0;                                   // reaping is best effort, never fatal
  } finally {
    try { fs.unlinkSync(ps); } catch (e) {}
  }
}

/* Drop-in for os.tmpdir(). Forward slashes, because every caller builds a
   file:/// URL and a Chrome command line out of it. */
function root() {
  if (!ready) {
    fs.mkdirSync(ROOT, { recursive: true });
    sweep();
    process.on('exit', mine);
    /* Ctrl-C and a task-runner kill both arrive as signals, and neither fires
       'exit' on its own. SIGKILL still cannot be caught — the two-hour sweep
       is what covers that. */
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
      process.on(sig, () => { mine(); process.exit(130); });
    }
    ready = true;
  }
  return ROOT.split(String.fromCharCode(92)).join('/');
}

module.exports = { root, sweep, reap, ROOT };
