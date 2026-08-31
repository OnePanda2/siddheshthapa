# CHECKPOINT — CONSTELLATION-V1

**The approved base of the project.** Everything from here is additive. Nothing
in this state is to be undone; work builds on top of it.

Tag: `constellation-v1`

---

## What is locked in this state

**The mind is a 3D constellation.** 104 star points joined by 122 straight
lines on a genuinely bilobed form, so the figure reads as a brain from the
side, the front, the top and the back — not from one flattering angle. Star
points and straight segments, the language constellation charts use.

**Deep space, whole site.** Three sky layers, each at the resolution its
content actually needs, all built once at boot and never recomputed:

| layer | what | why it is where it is |
|---|---|---|
| gas | nebulae, dust lanes | low frequency; a small texture on a sphere is correct, and blurry is what gas looks like |
| stars | ~1,500 real 3D points | high frequency, must stay sharp, and gives parallax when the mind turns |
| deep sky | 4 galaxies, 2 clusters, 1 black hole | sharp and small; sprites, so they stay crisp at any size |

**Two layers inside the figure.** The constellation carries its own faint
stars; the 15 MIG planetary systems are the brighter coloured objects living
in its regions.

**Text stays readable over stars.** Gradient scrims behind the region sheet and
the welcome copy, and a three-stop halo on every projected label. Gradients
rather than backdrop blur, because a blur is a per-frame GPU cost and buys
nothing here.

**It turns.** Slow drift plus drag. The drift is metered to about 20fps rather
than 60, stops when a world opens or the tab hides, never runs under
prefers-reduced-motion, and yields to a drag for 2.4s after release.

**The three proven worlds are unchanged**: PHILOSOPHY → TRAPPIST-1,
LOVE → Kepler-16, OBSERVATION → Ursa Major. Real astronomy, real provenance.

---

## Verified at this commit

| suite | result |
|---|---|
| archcheck | 7/7 |
| migvischeck | 9/9 |
| astronomycheck | 18/18 |
| highlightcheck | 8/8 |
| lovecheck | 14/14 |
| constellationcheck | 15/15 |
| worldcheck | 26/26 |
| worldframecheck | 8/8 |
| **total** | **105/105** |

*(The suite has since grown to 150/150 across twelve check suites, with 95
mutations verified: `travelcheck` was added when the MIG zoom was fixed,
`braincheck` was rewritten for the constellation, `emblemcheck` was added when
the region emblems turned out to be invisible in the menu, and `travelcheck`
grew T9/T10/T11 when the first selection from the CLOSED mind turned out to
arrive at the wrong place for fourteen of the fifteen regions on a desktop and,
separately, under the sheet for twelve of them on a phone. `travelcheck` now
runs at two viewports, and `worldframecheck` gained WF9/WF10 for the narrow
laptop and WF11/WF12 for the per-world bias, and now runs at three.)*

- idle = **0 renders** over two seconds
- draw calls 6 — three for the mind, three for the sky
- `preview.html` sha256-16 `a86e4deb12e0a496`, the P4.7 fallback, untouched
- artifact 864KB

---

## Known imperfections at this checkpoint

Recorded so they are not rediscovered as surprises. None of these is a reason
to undo anything here.

1. ~~**Selecting a MIG does not zoom in.**~~ **FIXED** after this checkpoint,
   see `travelcheck` / `travelmutate`. Two real bugs were behind it: a region
   chosen while a transition was already running was silently discarded, and a
   degenerate viewport could fling the camera 93,812 units from a world 105
   across. The camera now flies with an eased, bounded journey.
2. ~~**`braincheck` and `brainmutate` are stale.**~~ **FIXED** after this
   checkpoint. Both rewritten for the constellation: the figure now reports
   itself as 12 named chains and 104 stars rather than 122 things called
   'seg', and the assertions test the chains' ARRANGEMENT — the temporal chain
   below the Sylvian, the cerebellar chain at the back and below — not merely
   their presence. 20/20, mutation-verified.
3. **Phone labels crowd.** Fifteen region names over a small figure overlap.
4. ~~**The mutation suites have not been re-run** since the brightness metric
   was inverted.~~ **DONE** — all 87 re-verified. One assertion had gone quiet
   and was repaired: `worldcheck` H2 claimed to test that hovering a region
   brightens it, but measured any rise at all in a wide window, and a hover
   also GROWS the point. With the brightening removed entirely the growth alone
   moved the reading 62 → 64 and H2 still passed. It now measures the core in a
   tight window, where growth spreads light outward and only emphasis raises
   it: +36% healthy against +0% mutated.
   **The six-width visual matrix still has not been re-run** since the sky went
   in.
5. **MOVIES → HR 8799 is not built.** No fourth world exists.
6. ~~**The region emblems were invisible in the menu.**~~ **FIXED.** The fifteen
   emblems are the only navigation targets in the Main Mind Menu and were being
   drawn dimmer than the constellation's own decorative stars — Philosophy at
   45 and Observation at 72 against background stars near 250 — so choosing a
   region flew the camera into what looked like empty space. Three causes: the
   regions were subject to the same atmospheric fade and depth drain as
   ordinary bodies; they were tinted for a world's interior rather than for
   being seen across the whole mind; and Observation alone was zeroed
   unconditionally by a rule that should only have applied inside its own
   world. Now 129–182 across all fifteen, with hue preserved. Guarded by
   `emblemcheck` / `emblemmutate`, 6/6.
7. ~~**The first selection from the closed mind arrived at empty space.**~~
   **FIXED.** There are two menu states, and only one of them worked. From the
   INNER menu — reached by the back button, which never touches the fold, so
   the mind stays unfolded — choosing a region was always correct. From the
   OUTER menu, the closed brain a visitor sees first, it was correct only for
   LOVE. `frameFor` reads `n.pos`, and `applyMorph` rewrites `n.pos` in place
   as the mind folds, so it means "where is this object RIGHT NOW".
   `travelTo` started the fold and chose the camera's destination in the same
   tick, framing every world at its position INSIDE the brain — the place it
   was about to leave — and never recomputing. Measured at 1440x900: thirteen
   of fifteen regions landed completely off screen (philosophy at y=2710,
   observation at -6070,-38218), `learning` landed behind the region sheet,
   and only LOVE was right — because its branch frames from
   `BINARY[id].centre`, a snapshot taken at build time while the scene still
   stood at universe positions, so it is the one frame source that never reads
   the live `n.pos`. Every suite passed throughout, because under
   `prefers-reduced-motion` `travelTo` folds BEFORE it frames, so the checks
   only ever measured the one path where the ordering does not matter. Fixed
   by evaluating the frame at the destination fold (`frameForAt`). Guarded by
   `travelcheck` T9, which sweeps all fifteen with motion enabled.
   The phone had the same failure in the other axis: the sheet sits BELOW the
   mind there, and each of the three charted branches drops its aim to clear
   it, but the generic branch the other twelve regions take did not — so they
   arrived centred vertically and therefore under the panel (y=375 against a
   sheet starting at y=315, at 500x749). The lift added to that branch runs
   along SCREEN up rather than world up, because the camera stands on each
   region's own radial and a fixed world-Y offset means a different screen
   shift per region. Guarded by `travelcheck` T11, kept separate from T9 so
   the phone case cannot be carried by the desktop one.
9. ~~**Narrow laptops composed worlds half under the sheet.**~~ **FIXED.** The
   sheet is a FIXED 380px panel while the window is not, so the share of the
   frame it takes grows as the window shrinks — 27% at 1440px, 43% at 900px.
   Two things assumed otherwise: `fitDistance` reserved a constant 38% for it,
   and every world frame aimed dead at its subject, centring it in the WINDOW
   rather than in the part the panel leaves. Measured at 884x605, readable
   principal bodies were 51/79 — LEARNING 1/5, BUSINESS 2/8, LOVE 2/5 against
   its 0.60 bar, OBSERVATION 6/9 when it must be whole. Now 70/79, with every
   world at or above the same bar the wide desktop has to meet. Wide windows
   are untouched: the shift computes to zero above about 1150px. Guarded by
   `worldframecheck` WF9 (composition) and WF10 (the fit), kept separate
   because WF9 alone still passed with the fit's correction removed.
10. ~~**Choosing MUSIC or PSYCHOLOGY threw.**~~ **FIXED**, found by sweeping all
   fifteen regions rather than the three that are built. `group()` returns
   `null` for a section with nothing in it, deliberately, so an empty heading
   is never painted — but `paintDOM` appended that null unchecked, and a
   region is allowed to be empty. Guarded by `travelcheck` T10.

---

## How to come back here

Nothing else in the project needs to be understood to restore this state.

```
git checkout constellation-v1
```

To return to the tip of work afterwards:

```
git checkout main
```

To reset the working tree to this checkpoint, discarding later work:

```
git reset --hard constellation-v1
```

There is also a plain copy at `.checkpoints/constellation-v1/`, which needs no
git at all: copying `src/`, `tools/`, `data/` and `v02.html` back over the
project restores it.

Rebuild the artifact after any restore with:

```
node tools/build-v02.js
```
