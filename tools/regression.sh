#!/bin/sh
# tools/regression.sh — the whole suite, in order.
#
# THIS LIVED IN A TEMPORARY DIRECTORY. Every check written since was
# registered in a file no commit could see, one cleanup away from taking the
# suite with it, and there was nowhere durable to add a new one. The checks
# are this project’s memory of its own defects; they belong inside it.
#
# Full regression. Strictly serial: two Chrome-heavy tools at once have raced
# in this project before.
#
# AND IT CHECKS THE TREE BETWEEN HARNESSES. A mutation harness that dies partway
# leaves its mutation in src/ — a blackout did exactly that, and a later build
# picked it up. Worse than losing one run: every harness after it would be
# testing a mutated artifact and reporting the results as if they meant
# something. So the tree is checked after each one, restored if dirty, and the
# fact is recorded rather than swallowed.
cd "F:/Projects/Siddhesh Thapa" || exit 1
LOG="$1"
: > "$LOG"

run(){
  name="$1"; shift
  start=$(date +%s)
  out=$("$@" 2>&1)
  code=$?
  end=$(date +%s)
  last=$(printf '%s' "$out" | grep -v '^$' | tail -1 | cut -c1-110)
  if [ $code -eq 0 ]; then
    printf 'PASS  %-24s %3ss  %s\n' "$name" "$((end-start))" "$last" >> "$LOG"
  else
    printf 'FAIL  %-24s %3ss  exit=%s  %s\n' "$name" "$((end-start))" "$code" "$last" >> "$LOG"
    printf '%s\n' "$out" | tail -25 | sed 's/^/        | /' >> "$LOG"
  fi
  dirty=$(git status --porcelain src/ data/ preview.html 2>/dev/null)
  if [ -n "$dirty" ]; then
    printf '      !! %s LEFT THE TREE DIRTY — restored before continuing:\n' "$name" >> "$LOG"
    printf '%s\n' "$dirty" | sed 's/^/         /' >> "$LOG"
    git checkout -- src/ data/ preview.html 2>/dev/null
    node tools/build-v02.js >/dev/null 2>&1
  fi
  # AND THE BROWSERS IT LEFT RUNNING. A harness that times out or is killed
  # takes its node child with it and not the Chrome that child launched:
  # measured at twelve surviving processes from one cut-off probe. Those go on
  # burning CPU while the next harness runs, which is how a suite starts
  # failing at the far end for reasons that have nothing to do with the code
  # being tested. Safe here because the suite is strictly serial — nothing of
  # ours is meant to be running between two harnesses.
  reaped=$(node -e "process.stdout.write(String(require('./tools/scratch.js').reap()))" 2>/dev/null)
  if [ -n "$reaped" ] && [ "$reaped" -gt 0 ] 2>/dev/null; then
    printf '      !! %s LEFT %s BROWSER PROCESS(ES) RUNNING — reaped\n' "$name" "$reaped" >> "$LOG"
  fi
}

echo "===== BUILD =====" >> "$LOG"
run build      node tools/build-v02.js
# FIRST, BECAUSE IT COSTS TEN SECONDS AND SAVES HOURS. Every mutation harness
# works by finding an exact string in the source; when a refactor moves that
# string the anchor matches nothing, and that surfaces either as a hard STOP
# deep into the run or as a mutation that silently tests nothing and reports a
# green. constellationmutate hard-stopped 650 seconds in for exactly this,
# three hours into a regression, on a line worldmutate had already been fixed
# for in the same commit.
run anchorcheck node tools/anchorcheck.js
# and the handover, which is the only document a future reader is promised
# is true. Every checkable claim in it -- harness count, store keys, overlay
# channels, world counts, the files it names -- is asserted against the
# repository, because a handover that is confidently wrong is worse than none.
run handovercheck node tools/handovercheck.js
run datacheck  node tools/datacheck.js
run notescheck node tools/notescheck.js
run textcheck  node tools/textcheck.js
run smoke      node tools/smoke.js

echo "" >> "$LOG"
echo "===== V02 CHECKS (target v02.html) =====" >> "$LOG"
for t in archcheck astronomycheck braincheck constellationcheck emblemcheck \
         glcheck highlightcheck lovecheck migvischeck navcheck reservecheck systemcheck \
         travelcheck workscheck worldcheck worldframecheck editorcheck; do
  run "$t" node "tools/$t.js"
done

echo "" >> "$LOG"
echo "===== MUTATION HARNESSES =====" >> "$LOG"
# systemfill, sectioncheck, projectcheck, regioncheck and menucheck sit here
# rather than among the checks above: like the mutation harnesses they WRITE to
# data/notes.json and put it back, so they need the contamination guard
# standing between them and whatever runs next. regioncheck is also the longest
# single run in the suite — it rebuilds five times and calls smoke at the end.
for t in notesmutate systemfill sectioncheck projectcheck regioncheck menucheck edgecheck \
         worksmutate brainmutate glmutate emblemmutate highlightmutate lovemutate \
         reservemutate regionmutate menumutate travelmutate worldmutate \
         worldframemutate constellationmutate astromutate editormutate edgemutate; do
  run "$t" node "tools/$t.js"
done

echo "" >> "$LOG"
echo "===== P4.x SUITE (target preview.html) =====" >> "$LOG"
for t in contradictioncheck gridcheck marginaliacheck mobilecheck \
         overlapcheck tokencheck widecheck; do
  run "$t" node "tools/$t.js"
done
for t in acceptmutate gridmutate margmutate; do
  run "$t" node "tools/$t.js"
done

echo "" >> "$LOG"
echo "===== DONE =====" >> "$LOG"
printf 'passed %s of %s runs\n' "$(grep -c '^PASS' "$LOG")" "$(grep -c '^PASS\|^FAIL' "$LOG")" >> "$LOG"
