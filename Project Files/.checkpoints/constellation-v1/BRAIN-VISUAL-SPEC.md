# BRAIN-VISUAL-SPEC

The Brain is a **sparse 3D line drawing of a human brain in lateral view**. Lines
are the form. There is no surface, no mass, no mesh.

This document is written before the code and is the thing the code is judged
against. Where an implementation detail is not fixed here, it is a decision to
be made by looking at a render, not by argument.

---

## 0. Why the two previous attempts failed

Both failures are informative and the spec is built around not repeating them.

**Attempt 1 — lines.** Fourteen uniformly spaced bands sweeping a closed shell,
plus a handful of named curves inked on top. It read as a helmet, a cage, a
wireframe pod. The cause was not the line count on its own: it was that every
line came from the *same* generator at the *same* weight, sweeping the *whole*
form. Evenly spaced curves on a closed surface make a contour map. A contour map
of a brain-shaped object is not a brain.

**Attempt 2 — a solid mesh.** 26,624 triangles with lit sulci. It was
recognisable and it was wrong: a translucent clay organ, a medical model, the
subject became the object rather than the mind. Rejected outright.

What attempt 2 *did* prove is that the silhouette works: it was measured there,
and it is carried over unchanged. Its fold pattern — a gyroid labyrinth — looked
like the right model to trace as curves. It was not; §3 records the three ways
that failed and what replaced it.

---

## 1. Silhouette strategy

The outline carries most of the recognition. It is kept from attempt 2, where it
was measured and proven, and it is unchanged:

A radius table sampled every 15° around the midsagittal plane, cosine
interpolated. Landmarks in order from the frontal pole, rotating toward the
crown:

| angle | value | landmark |
|---|---|---|
| 0–75° | 0.96 → 1.08 | frontal lobe, fullest just above the pole |
| 90° | 1.05 | vertex, set slightly behind centre |
| 165–180° | 0.89 → 0.85 | occipital taper |
| 195–210° | 0.75 → **0.71** | the notch above the cerebellum |
| 225° | **0.80** | the cerebellar mass |
| 255–285° | 0.60 → 0.50 | the base, flat and close in |
| 300–330° | 0.60 → 0.72 | the temporal lobe, hanging forward |

Measured properties this produces: **52% departure from its own best-fit
ellipse**, minima at 210° and 285°, maxima at 60° and 225°. An ellipse has
exactly two minima. The extra ones are the notches, and the notches are what
stop it reading as an egg.

The silhouette is drawn as **one continuous closed curve**, at the tangent where
the near hemisphere turns away from the camera — not at the midline, and not at
the widest point of the shell.

---

## 2. Line hierarchy

Five families, deliberately unequal. Weight, opacity and depth response all
differ; nothing is drawn twice at the same value.

| layer | what | count | weight | opacity |
|---|---|---|---|---|
| **A** | outer silhouette | 1 | heaviest | full, never faded |
| **B** | named fissures — Sylvian, central sulcus | 2 | heavy | high |
| **C** | the other named sulci, cerebellum + folia, temporal pole | 14 | medium | medium |
| **E** | midline crest + far-hemisphere ghost | 1 + 1 | lightest | very low |
| **F** | cognitive graph (the mind's own relationships) | — | faintest | 0.024 in brain mode |

There is no layer D. It was to be the traced cortical folds; §3 records why it
does not exist, and its work is done by the named sulci in C instead.

**Shipped: 19 curves. Budget ceiling: 26**, asserted by `braincheck` B11. Not a target to fill. A ceiling to stay
under. Every curve must answer "what does this communicate?" — a curve whose
answer is "it fills space" is deleted.

---

## 3. Fold strategy

**Placed, not generated.** This is the part of the spec that changed during
implementation, and the change is recorded here rather than quietly made.

The plan was to trace isolines of a gyroid field across the shell. The field is
the right *model* of a cortex — the rejected mesh proved that by displacing
geometry with it — but as curves it failed three separate ways:

1. Traced at the zero-set, every seed Newton-projected onto the same connected
   branch of the labyrinth. Fourteen folds rendered as three.
2. Traced at each seed's own level, the lines became long smooth sweeps across
   the whole face and the drawing read as a cracked eggshell.
3. Seeded on genuine sign changes found by scanning, the crossings bunched
   wherever the scan began and left two thirds of the brain empty.

A cortex has about a dozen named sulci in lateral view and they are always in
the same arrangement. So every curve is placed by name, in the coordinates it
is seen in, and nothing is generated at all:

| region | curves |
|---|---|
| frontal | superior frontal, inferior frontal |
| central | precentral, **central sulcus**, postcentral |
| parietal | intraparietal |
| temporal | **Sylvian fissure**, superior temporal, inferior temporal, temporal pole |
| occipital | lateral occipital ×2 |
| cerebellum | boundary arc, folia ×3 |
| midline | crest |

That is the actual test §5 sets. A line whose answer to "what does this
communicate?" is "it fills space" cannot exist here, because no space-filler
produced any of them — each one can be pointed at and named.

Two deliberate exceptions to the no-repetition rule, both earned:

- The **cerebellar folia** are evenly spaced. A cerebellum genuinely is finely
  and regularly foliated, and the contrast with the irregular cortex above it
  is itself a recognition cue.
- The **precentral and postcentral** sulci flank the central sulcus. They are
  deliberately shorter and unevenly spaced, because three equal parallels
  across the crown read as melon segments — which is exactly what the first
  placement produced and why they were shortened.

Control points are specified in **face coordinates**: `u` front(+) to back(-),
`v` up(+) to down(-). Not in the shell's polar angles — on a lateral view
`sin(alpha)` is the radial distance from the centre of the face, so a curve at
constant alpha draws an *inner contour ring*. The first render produced a
Sylvian fissure shaped like a croissant for exactly that reason.

Curves are interpolated Catmull-Rom, so a sulcus curves rather than turning a
corner at each control point.

### Weight

A WebGL line is one pixel wide whatever `lineWidth` says. Weight is therefore
built, not requested: a heavy curve is drawn as several strokes offset sideways
along the surface. Without this the silhouette and a minor sulcus render
identically and the drawing has no hierarchy — which is what the first
integration did, since alpha above 1.0 simply saturates.

| layer | strokes | alpha |
|---|---|---|
| A silhouette | 3 | 0.95 |
| B named fissures | 2 | 0.86 |
| C other sulci | 1 | 0.66 |
| E midline, far ghost | 1 | 0.34 |

## 4. Depth strategy — 3D without a solid

Every curve is a genuine 3D polyline on the shell, so depth is real and the
camera can move. Four devices, no mesh:

1. **Near/far brightness.** Per-vertex depth relative to the organ's centre
   drives alpha. Near-side curves are legible; far-side curves are a whisper.
2. **Asymmetric population.** The far hemisphere gets a ghost of the silhouette
   and nothing else. This is the fix for the old "two identical drawings
   superimposed" problem: the hemispheres are *differently drawn*, not
   differently coloured.
3. **Occlusion by falloff, not by clipping.** A curve crossing behind the near
   surface dims rather than disappearing, which keeps the drawing continuous.
4. **Parallax.** The two hemispheres are physically offset either side of the
   midline plane, so any camera movement separates them.

Depth is never simulated by adding more lines.

---

## 5. Colour

The brain is the neutral substrate the coloured worlds emerge from. It never
takes a MIG's colour.

| role | colour | note |
|---|---|---|
| silhouette | `#22303f` | deepest slate, the only near-ink value |
| named fissures | `#33465c` | |
| cerebellum | `#3d5068` | |
| traced folds | `#556880` | |
| midline / far ghost | `#8a97ab` | |
| graph, brain mode | region tint at 0.05 | present, never competing |

All neutrals are tinted cool. Page stays light; no dark rectangle behind the
brain. No pure black, no pure white.

---

## 6. Camera

**Lateral.** On the X axis — the midsagittal normal — with a small lift and a
small forward swing for depth, declared as a single vector so a check can
measure the angle rather than trust a comment. Target: under 12° off pure
lateral, hard-failing over 20°.

A brain is identified from the side: it is the only view in which frontal pole,
crown, occipital taper, temporal lobe and cerebellum are simultaneously legible.
From the front it is two lobes. From above it is an ellipse. From
three-quarters the Sylvian fissure foreshortens to nothing.

Framing: the whole organ, inside the readable area (the sheet owns the left of a
desktop and the lower half of a phone), no cropping at 375 / 768 / 1024 / 1440 /
1920 / 2560, filling 30–70% of the frame with clear margin.

---

## 7. MIG placement

The fifteen regions live **inside** the volume the lines describe — not on the
silhouette, not orbiting it. Laid out across the sagittal plane (the plane the
visitor is actually looking at) by index, so the arrangement is derived from the
data and a sixteenth MIG re-spaces the set rather than needing a new case. The
left-right axis carries hemisphere and depth, not layout.

A region's concepts are placed around **its brain position**, so naming a region
lights up the part of the brain where its name is.

---

## 8. Typography

Region name primary; astronomical source secondary beneath it at ~70% of the
size and lower contrast. Only the charted worlds state a source in 3D — twelve
repetitions of "not yet charted" floating over an organ is noise, not intrigue.
The uncharted ones still declare themselves in the navigation list, where the
claim is auditable.

---

## 9. Interaction

**Hovering a MIG** (`highlightMIG`, unchanged and generic): that region's
identity lifts, competing regions recede, the brain stays legible. It should
feel like attention moving inside a brain, not a UI flash.

**Hovering a Minor IG** (`highlightNode`, unchanged): the corresponding world
object brightens and its siblings recede. Keyboard focus mirrors both. No
pseudo-hover on touch.

---

## 10. Performance

The line brain must be **cheaper than the 26,624-triangle mesh it replaces**.

- anatomy shares the **existing line buffer** — no new draw call, no new geometry
- no lights, no shadow maps, no post-processing
- render on demand; idle = 0 frames
- coarser trace on mobile
- target: ≤ 4,000 line vertices for the whole anatomy

A beautifully composed 25-curve brain beats a technically impressive
25,000-line one. That is the whole thesis.

---

## 11. The gate

The brain ships only when, with every label, MIG, graph edge and UI element
hidden, the remaining line drawing is identified as a human brain in side view
by someone who has never seen the project. Not "organic shape". Not "helmet".
Not "network". Not "egg".

If it fails: change curve placement, silhouette, proportion, folding direction,
depth separation, hierarchy. **Never add more curves.**
