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

- idle = **0 renders** over two seconds
- draw calls 6 — three for the mind, three for the sky
- `preview.html` sha256-16 `a86e4deb12e0a496`, the P4.7 fallback, untouched
- artifact 864KB

---

## Known imperfections at this checkpoint

Recorded so they are not rediscovered as surprises. None of these is a reason
to undo anything here.

1. **Selecting a MIG does not zoom in.** The world is framed correctly and all
   its objects are in the readable area, but the camera does not travel into
   it the way the brief describes.
2. **`braincheck` and `brainmutate` are stale.** They assert the old anatomical
   sulci by name; those names no longer exist. 4 of 20 fail on naming, not on
   the design. The brain currently has no dedicated test coverage.
3. **Phone labels crowd.** Fifteen region names over a small figure overlap.
4. **The full six-width visual matrix has not been re-run** since the sky went
   in, and the mutation suites have not been re-run since the brightness metric
   was inverted.
5. **MOVIES → HR 8799 is not built.** No fourth world exists.

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
