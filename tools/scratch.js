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

module.exports = { root, sweep, ROOT };
