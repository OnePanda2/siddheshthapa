#!/bin/sh
# P4.6 final verification chain. Strictly serial — two Chrome-heavy tools at
# once have raced in this project before.
cd "F:/Projects/Siddhesh Thapa" || exit 1
S="C:/Users/SIDDHE~1/AppData/Local/Temp/claude/F--Projects-Siddhesh-Thapa/6449f481-2cdb-472d-a094-ffc550770bfa/scratchpad"
mkdir -p "$S/shots"

echo "######## 1. MUTATION SUITE (final code) ########"
node tools/margmutate.js preview.html 2>&1 | grep -v "ERROR:\|DEPRECATED\|externally_managed\|TensorFlow"
echo "MUT_EXIT=$?"

echo ""
echo "######## 2. FULL GATE MATRIX ########"
node tools/p46matrix.js preview.html 2>&1 | grep -v "ERROR:\|DEPRECATED\|externally_managed\|TensorFlow"
echo "MATRIX_EXIT=$?"

echo ""
echo "######## 3. SCREENSHOTS ########"
shot(){ # w h hash name
  node tools/viewport.js shot preview.html "$1" "$2" "$3" "$S/shots/$4.png" 2>&1 \
    | grep -v "ERROR:\|DEPRECATED\|externally_managed\|TensorFlow"
}
shot 1440 900  focus:philosophy               a-1440-region
shot 1440 900  focus:philosophy:curiosity     b-1440-concept
shot 1440 900  focus:philosophy:b-boundaries  c-1440-writing-crossregion
shot 1440 900  focus:philosophy:c-curiosity   d-1440-contradiction
shot 1920 1080 focus:philosophy:c-curiosity   e-1920-contradiction
shot 2560 1080 focus:philosophy:curiosity     f-2560-concept
shot 1024 768  focus:philosophy:curiosity     g-1024-concept
shot 375  812  focus:philosophy:curiosity     h-375-phone
shot 1440 900  read:b-kind                    i-1440-reading
echo "SHOTS DONE"
ls -la "$S/shots"
