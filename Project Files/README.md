# siddheshthapa.com — project files

An off-site copy of the working project, so the work survives a disk failure.
This is the **source**, not the published site.

Synced from the local repository at `F:\Projects\Siddhesh Thapa`.

---

## What this is

An interactive externalisation of a mind: fifteen regions of thinking rendered
as a 3D constellation that folds open into a universe, plus a second section —
MY WORKS — that is the operating manual for the things built.

Everything ships as **one self-contained HTML file**. Nothing is fetched at run
time, because the artifact's content policy blocks every CDN and a blocked
script fails silently.

## How to rebuild it

Node is the only requirement. From this folder:

```
node tools/build-v02.js
```

That composes `v02.html` from five inputs — the graph extracted from
`preview.html`, the shell, three.js, the scene, and the manual. To view it:

```
python -m http.server 8777
```

then open `http://localhost:8777/v02.html`.

## Where to start reading

| File | What it settles |
|---|---|
| `PRODUCT.md` | what the site is, and the six questions a visitor must always be able to answer |
| `CHECKPOINT.md` | the approved base state, what is verified, and every known imperfection |
| `BRAIN-VISUAL-SPEC.md` | the constellation, and why two earlier attempts were rejected |
| `WORKS-MANUAL-SPEC.md` | MY WORKS — the manual, and the rule that keeps it from drifting |
| `MIND-MAP.md` | the conceptual architecture, generated from the data |

## Two rules the project runs on

**Content is declared once.** `preview.html` is the locked source of every
belief, writing and relationship — sha256-16 `a86e4deb12e0a496`. It is
extracted at build time and never retyped, so no part of the site can disagree
with another about the same object. Where V02 deliberately diverges, it is
declared in one place (`V02_OVERLAY`) alongside the text it replaced.

**A check that cannot fail is not a check.** Every assertion is broken on
purpose by a matching mutation suite. One that survives its own mutation is
repaired; the mutation is never weakened to suit it.

```
node tools/workscheck.js      # the manual
node tools/worksmutate.js     # break it on purpose
node tools/smoke.js           # the fast pass, ~20s
```

## What is deliberately not here

- `.p3/` and `.scratch/` screenshots and headless-Chrome working files — 131MB
  of evidence for decisions already made, regenerated on demand.
- `siddheshthapa-v0.2–v0.5.pdf` — already stored at the root of this
  repository, so they are not duplicated inside this folder.
