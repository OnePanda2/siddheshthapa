#!/bin/sh
# tools/regression.sh — the whole suite, in order.
#
# THIS LIVED IN A TEMPORARY DIRECTORY. Every check written since was
# registered in a file no commit could see, one cleanup away from taking the
# suite with it, and there was nowhere durable to add a new one. The checks
# are this project’s memory of its own defects; they belong inside it.
#
# Full regression.
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
}

echo "===== BUILD =====" >> "$LOG"
run build      node tools/build-v02.js
run datacheck  node tools/datacheck.js
run notescheck node tools/notescheck.js
run textcheck  node tools/textcheck.js
run smoke      node tools/smoke.js

echo "" >> "$LOG"
echo "===== V02 CHECKS (target v02.html) =====" >> "$LOG"
for t in archcheck astronomycheck braincheck constellationcheck emblemcheck \
         glcheck highlightcheck lovecheck migvischeck navcheck reservecheck systemcheck \
         travelcheck workscheck worldcheck worldframecheck; do
  run "$t" node "tools/$t.js"
done

echo "" >> "$LOG"
echo "===== MUTATION HARNESSES =====" >> "$LOG"
# systemfill, sectioncheck and projectcheck sit here rather than among the
# checks above: like the mutation harnesses they WRITE to data/notes.json and
# put it back, so they need the contamination guard standing between them and
# whatever runs next.
for t in notesmutate systemfill sectioncheck projectcheck worksmutate brainmutate \
         glmutate emblemmutate highlightmutate lovemutate reservemutate \
         travelmutate worldmutate worldframemutate constellationmutate astromutate; do
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
