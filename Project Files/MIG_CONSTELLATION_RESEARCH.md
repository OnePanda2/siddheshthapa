# MIG_CONSTELLATION_RESEARCH

**Phase 3D — third world archetype: the constellation world.**
Research only. No renderer code has been written. Retrieved 2026-08-21.

---

## 1. Chosen MIG and why

**OBSERVATION.**

Not because the name sounds celestial. Because it is the only region in the graph
whose own relationships already draw a constellation, and because its content is
*about* the epistemics of constellations.

### 1a. The topology, measured

Every MIG's internal relationship graph was measured (`.p3/shape.js`). A
constellation figure is a **path or thin tree**; a mesh is a hairball and belongs
to a planetary world.

| MIG | objects | relations | components | max degree | leaves | e/(n−1) | shape |
|---|---|---|---|---|---|---|---|
| building | 5 | 1 | 4 | 1 | 2 | 0.25 | dust (4 fragments) |
| technology | 7 | 2 | 5 | 1 | 4 | 0.33 | tree-like |
| learning | 10 | 6 | 4 | 2 | 6 | 0.67 | tree-like |
| love | 7 | 4 | 3 | 2 | 4 | 0.67 | tree-like |
| my-works | 10 | 6 | 4 | 2 | 6 | 0.67 | tree-like |
| philosophy | 21 | 14 | 8 | 4 | 8 | 0.70 | tree-like |
| behaviour | 9 | 6 | 3 | 2 | 6 | 0.75 | tree-like |
| movies | 6 | 4 | 2 | 2 | 4 | 0.80 | tree-like |
| life | 17 | 13 | 4 | 3 | 10 | 0.81 | tree-like |
| business | 14 | 11 | 4 | 4 | 8 | 0.85 | tree-like |
| **observation** | **8** | **6** | **2** | **2** | **2** | **0.86** | **PATH / CHAIN** |
| society | 10 | 8 | 3 | 3 | 5 | 0.89 | tree-like |
| food | 5 | 4 | 1 | 3 | 3 | 1.00 | tree-like |
| music | 0 | 0 | — | — | — | — | empty region |

**OBSERVATION is the only MIG that forms a single connected chain**: every
internal degree ≤ 2, exactly two endpoints, one traversal from end to end.
(`building` also scores as a chain but is 5 objects in 4 disconnected fragments
with a single relationship — that is dust, not a figure.)

The chain the data itself draws:

```
1. ATTENTION                          (Minor IG,  degree 1  — an endpoint)
2. WHEN REELS BECOME HOMEWORK         (thought,   degree 2)
3. SERIOUS vs ABSURD                  (contradiction, degree 2)
4. EVIDENCE                           (Minor IG,  degree 2)
5. LAST IN THE QUEUE FOR ACCOUNTABILITY (thought, degree 2)
6. PATTERNS                           (Minor IG,  degree 2)
7. MAGICIANS EVERYWHERE               (thought,   degree 1  — an endpoint)

✱  ANOMALY                            (Minor IG,  degree 0 inside its own region)
```

**Seven objects in a line, plus exactly one that connects to nothing.**

ANOMALY — whose own line reads *"The thing that does not fit is usually where the
interesting question is hiding"* — is, graph-theoretically, the thing that does
not fit. That was not arranged. It was measured.

### 1b. Why the meaning fits (expanded in §13)

OBSERVATION's four Minor IGs:

| Minor IG | its own line |
|---|---|
| **PATTERNS** | *"The pleasure of seeing one is so strong it should be treated as a source of error."* |
| **ATTENTION** | *"The scarcest thing I own and the one I am worst at spending on purpose."* |
| **EVIDENCE** | *"What would have to be true, and what I would accept as showing it was not."* |
| **ANOMALY** | *"The thing that does not fit is usually where the interesting question is hiding."* |

A constellation is the canonical false pattern: real lights, imaginary lines,
drawn because seeing the figure is pleasurable. PATTERNS states the hazard
directly. This is the one region where the constellation is not decoration — it
is the subject.

---

## 2. Candidate constellations considered

| Candidate | Why considered | Why rejected / kept |
|---|---|---|
| **Orion** | Most recognisable; 7 principal stars | Rejected: its figure is two shoulders + belt + two feet — a *branching* form, not a chain. Would not match OBSERVATION's measured path. |
| **Cassiopeia** | A 5-star zig-zag; genuinely a path | Rejected: 5 stars against 8 objects. Would require inventing three stars or dropping three objects. |
| **Crux (Southern Cross)** | 4–5 stars, compact | Rejected: too few stars, and a cross is a crossing, not a chain. Also visually compact — the brief asks for large negative space. |
| **Lyra** | Vega plus a parallelogram | Rejected: 5 stars, and the figure is a closed quadrilateral. |
| **Corona Borealis** | An arc of 7 | Considered seriously — 7 stars in an arc is a genuine chain. Rejected in favour of Ursa Major because it has no counterpart for ANOMALY, and its stars are far less well known. |
| **Ursa Major / Big Dipper** | 7 bright stars traditionally joined as a single traversal, **plus Alcor** | **CHOSEN.** See §3. |

---

## 3. Final constellation

**The Big Dipper (the Plough) — the seven-star asterism within Ursa Major —
plus Alcor.**

Three independent reasons:

1. **Topological match.** The Dipper is seven stars conventionally joined in one
   continuous traversal from the handle tip to the bowl. OBSERVATION's chain is
   seven objects in one continuous traversal. 7 ↔ 7, exactly, with no
   interpolation and nothing dropped.

2. **Alcor answers ANOMALY.** Alcor sits 12.0 arcmin from Mizar (measured, §4).
   It is **not part of the asterism** and has been used for centuries as a test
   of eyesight — the star you only see if you are looking properly. OBSERVATION's
   ANOMALY is the one object with no internal relationship. The outlier in the
   sky maps to the outlier in the graph, and both are about whether you are
   paying attention.

3. **The figure is measurably part-illusion.** The seven stars are *not* at the
   same distance:

   | star | distance |
   |---|---|
   | Megrez | 80.9 ly |
   | Alcor | 81.7 ly |
   | Alioth | 82.6 ly |
   | Phecda | 83.2 ly |
   | Merak | 84.5 ly |
   | Mizar | 85.8 ly |
   | **Alkaid** | **103.9 ly** |
   | **Dubhe** | **122.9 ly** |

   The middle five plus Alcor lie within ~5 ly of each other — they are a real
   physical association (the Ursa Major Moving Group). **Dubhe and Alkaid are not
   members.** So the shape is genuinely half-real and half-projection, and it
   exists only from this vantage point. A **1.52× depth spread** is enough that
   moving the camera off-axis visibly distorts the figure.

   That is PATTERNS' warning, rendered as geometry rather than illustrated by it.

---

## 4. Real stars used

All values measured from SIMBAD unless marked. RA/Dec are ICRS degrees.

| Proper name | Bayer / Flamsteed | RA (deg) | Dec (deg) | V mag | parallax (mas) | distance (ly) | spectral type |
|---|---|---|---|---|---|---|---|
| Alkaid | eta UMa | 206.88516 | 49.31327 | 1.86 | 31.38 | 103.94 | B3V |
| Mizar | zeta UMa | 200.98142 | 54.92535 | **2.007 †** | 38.01 | 85.81 | — |
| Alioth | epsilon UMa | 193.50729 | 55.95982 | 1.77 | 39.51 | 82.55 | A1III-IVpkB9 |
| Megrez | delta UMa | 183.85650 | 57.03262 | 3.32 | 40.3279 | 80.88 | A2Vn |
| Phecda | gamma UMa | 178.45770 | 53.69476 | 2.44 | 39.21 | 83.18 | A0V |
| Merak | beta UMa | 165.46033 | 56.38243 | 2.37 | 38.6031 | 84.49 | A1IVps |
| Dubhe | alpha UMa | 165.93196 | 61.75103 | 1.79 | 26.54 | 122.89 | G9III+A7.5 |
| Alcor | 80 UMa | 201.30641 | 54.98796 | 4.01 | 39.91 | 81.72 | A5V+M3-4V |

**† DERIVED, not measured.** SIMBAD's naked-eye entry for `* zet UMa` returns
**no V magnitude** because it resolves Mizar as a pair. The combined magnitude is
derived by flux addition from the two measured components:

```
zeta-1 UMa  V = 2.22        (measured)
zeta-2 UMa  V = 3.88        (measured)
m = -2.5 * log10( 10^(-0.4*2.22) + 10^(-0.4*3.88) ) = 2.007
```

This is recorded in `data/constellation-ursa-major.json` under `derived`, never
under `measured`. I did not type a remembered magnitude for Mizar.

**Verified projection.** A gnomonic (tangent-plane) projection of these
coordinates about the field centre reproduces the Dipper correctly — handle
sweeping from Alkaid through Mizar and Alioth to Megrez, bowl closing through
Phecda, Merak and Dubhe. Measured extent: **25.0° wide × 12.4° tall**.
Mizar–Alcor separation from the projected coordinates: **12.0 arcmin**.

---

## 5. Source of star coordinates

- **SIMBAD Astronomical Database — CDS, Strasbourg**, TAP/ADQL service
  `https://simbad.cds.unistra.fr/simbad/sim-tap/sync`
- Credit: Wenger et al. 2000, *A&AS* **143**, 9 — "The SIMBAD astronomical database"
- Queried tables: `basic` (ra, dec, plx_value, sp_type), `ident` (identifier
  resolution), `allfluxes` (V, B)
- Retrieved **2026-08-21**
- Stored at `data/constellation-ursa-major.json`, split into
  `measured` / `derived` / `background` / `unverified`

Every number in §4 is re-fetchable from that endpoint. Nothing was recalled.

---

## 6. Mapping between Minor IGs and stars

### The rule, stated before the result

1. Extract OBSERVATION's internal relationship graph.
2. Confirm it is a single chain (max degree ≤ 2, exactly 2 endpoints).
3. **Traverse from the endpoint that is a Minor IG.** (Here: ATTENTION. The other
   endpoint, MAGICIANS EVERYWHERE, is a writing.) If both or neither endpoint
   were a Minor IG, fall back to lexicographic id — deterministic either way.
4. Map the traversal onto the asterism's conventional draw order, starting at the
   **handle tip** (Alkaid) and ending at the **bowl lip** (Dubhe).
5. Map the isolated object onto **Alcor**.

This is fully deterministic and reproducible from the data. No hand placement.

### The resulting map

| # | graph object | kind | star | V | distance |
|---|---|---|---|---|---|
| 1 | ATTENTION | Minor IG | Alkaid | 1.86 | 103.9 ly |
| 2 | WHEN REELS BECOME HOMEWORK | thought | Mizar | 2.007 † | 85.8 ly |
| 3 | SERIOUS vs ABSURD | contradiction | Alioth | 1.77 | 82.6 ly |
| 4 | EVIDENCE | Minor IG | Megrez | 3.32 | 80.9 ly |
| 5 | LAST IN THE QUEUE FOR ACCOUNTABILITY | thought | Phecda | 2.44 | 83.2 ly |
| 6 | PATTERNS | Minor IG | Merak | 2.37 | 84.5 ly |
| 7 | MAGICIANS EVERYWHERE | thought | Dubhe | 1.79 | 122.9 ly |
| ✱ | **ANOMALY** | Minor IG | **Alcor** | 4.01 | 81.7 ly |

### Consequences worth noting — and a caveat

Three alignments fall out of the rule rather than being chosen:

- **EVIDENCE lands on Megrez**, the junction where the handle meets the bowl —
  and the faintest of the seven. Evidence is the joint of the figure, and the
  dimmest part of it.
- **PATTERNS lands on Merak**, one of the two *pointer stars* used to find
  Polaris — the most widely practised act of pattern-use in the sky.
- **MAGICIANS EVERYWHERE lands on Dubhe**, the other pointer, and one of the two
  stars that is *not* physically part of the group. A magician exploits
  pattern-seeing; the star is a stranger pretending to belong to the figure.

**Caveat, stated plainly:** the traversal rule has exactly one alternative —
running the chain the other way (ATTENTION→Dubhe rather than ATTENTION→Alkaid).
I fixed the direction on the stated principle (Minor IG endpoint → handle tip)
and these resonances are a consequence. I am not claiming they are evidence for
the mapping; they are a pleasant result of it. The reverse direction is recorded
here so the choice is visible rather than hidden.

---

## 7. Which stars are graph objects

**Eight, and only eight** — the 8 objects OBSERVATION already owns:

- 4 Minor IGs: ATTENTION, EVIDENCE, PATTERNS, ANOMALY
- 3 thoughts: WHEN REELS BECOME HOMEWORK, LAST IN THE QUEUE FOR ACCOUNTABILITY,
  MAGICIANS EVERYWHERE
- 1 contradiction: SERIOUS vs ABSURD

No object is invented. No object is dropped. The graph remains the source of
truth, and OBSERVATION remains a top-level MIG owning exactly these.

**Hierarchy rule (for §5/§6 legibility):** star *size* follows real magnitude
— astronomy stays honest. **Label priority follows graph role**: Minor IG names
outrank writing titles at every range, and the focused object outranks
everything. Legibility is solved with scale, tier and selective focus, never by
making everything brighter.

Note this puts ANOMALY on the faintest star in the field (V 4.01). That is
correct, not a defect: Alcor is the eyesight test. It should take looking.

---

## 8. Which stars are purely atmospheric

**53 real stars**, every SIMBAD object in RA 160–212°, Dec 44–66° with
**V < 6.0** — the naked-eye limit, a principled cutoff rather than a chosen count.

These are **render-only**. They use the same mechanism already proven for LOVE's
star B: appended to the geometry after every real node, never entering `NODES`,
the menu, or the pick list. They are context, not content — the rest of the sky
the figure was picked out of, which is exactly the point of a constellation.

Stored under `background` in the data file, flagged
`"These are RENDER-ONLY. They never enter the graph, the menu, or the pick list."`

---

## 9. How constellation lines are derived

**From the graph, not from the sky.**

The lines drawn are OBSERVATION's own six relationships, in its own verbs:

```
attention    --taxed by-->      t-reels
c-absurd     --tension-->       t-reels
c-absurd     --tension-->       evidence
evidence     --requires-->      t-manager
patterns     --catches-->       t-manager
t-magicians  --reads-->         patterns
```

This is the load-bearing decision of the whole world, and it is the honest one:

> **The stars are real. The lines are the mind's.**

Because the mapping is order-preserving, those six relationships trace the
Dipper's own outline — the handle, and three sides of the bowl. The world will
read unmistakably as the Big Dipper while every line in it is a real
relationship from Siddhesh's graph rather than a copied asterism.

The traditional asterism line order is used **only** to fix the star sequence in
§6. It is a cultural convention, not a measurement, and is recorded as such under
`unverified` in the data file. It is never drawn as astronomy.

---

## 10. Interpolation required

**None.**

- 7 chain objects → 7 asterism stars. Exact.
- 1 isolated object → 1 non-asterism star. Exact.
- No star is subdivided, duplicated, or synthesised.
- No object is merged or omitted.

This is the first world in the project needing **zero** interpolation. Philosophy
needed none (7 concepts ↔ 7 TRAPPIST-1 planets). LOVE needed a declared spacing
rule for 3 of its 4 orbits, because Kepler-16 has only one measured planet.
Ursa Major needs nothing.

---

## 11. Illustrative geometry

Only three quantities are not astronomy, and each must be flagged in the data and
machine-checked:

1. **Scene scale** — how many scene units one degree of sky becomes. A map scale,
   exactly as `WORLD_SCALE` already is for Philosophy and LOVE. The *ratios*
   between star positions stay measured.
2. **Depth exaggeration factor** — real distances span 80.9–122.9 ly (1.52×). At
   true scale relative to the 25° angular spread the depth would be
   imperceptible. A declared exaggeration factor will be applied so the parallax
   effect is visible. **The factor is illustrative; the ordering and the ratios
   are measured.** This must be recorded as `illustrative`, never as distance.
3. **Field orientation / roll** — the angle the plate is presented at. Cosmetic.

Nothing else. Star positions, magnitudes, parallaxes and the Mizar derivation are
all real, and the derivation is recorded as derived.

---

## 12. Provenance for every non-obvious value

| Value | Status | Source / formula |
|---|---|---|
| RA, Dec (8 stars) | **measured** | SIMBAD `basic.ra`, `basic.dec` (ICRS) |
| Parallax (8 stars) | **measured** | SIMBAD `basic.plx_value` |
| Spectral types | **measured** | SIMBAD `basic.sp_type` |
| V magnitude (7 stars) | **measured** | SIMBAD `allfluxes.V` |
| **Mizar V = 2.007** | **derived** | flux addition of measured ζ¹ (2.22) and ζ² (3.88) |
| Distances in ly | **derived** | `1000/plx` pc × 3.26156 |
| Mizar–Alcor 12.0′ | **derived** | from the measured coordinates |
| Field extent 25.0° × 12.4° | **derived** | tangent-plane projection of measured coordinates |
| Ursa Major Moving Group membership | **derived** | inferred from the measured distance clustering (80.9–85.8 ly vs 103.9 and 122.9) |
| 53 background stars | **measured** | SIMBAD, V < 6.0 in RA 160–212°, Dec 44–66° |
| Proper names (Dubhe, Merak…) | **unverified** | traditional names supplied by me, *not* returned by the query. Bayer designations ARE the queried identifiers. |
| Asterism line order | **convention** | cultural, not measured. Used only to fix star sequence. |
| Scene scale, depth exaggeration, roll | **illustrative** | rendering choices, to be flagged in data |

---

## 13. Why this metaphor fits the meaning of the MIG

A planetary system is held together by gravity — the relationships are physical,
and they would exist with nobody watching. That is right for PHILOSOPHY, where
ideas genuinely pull on each other, and right for LOVE, where two centres really
do bind.

**A constellation is held together by a person looking at it.** The stars are
real and unrelated; the figure is an act of interpretation performed by an
observer, and it dissolves from any other position in the galaxy.

OBSERVATION is the region of this mind that is *about that act* — and about
distrusting it:

> *"The pleasure of seeing one is so strong it should be treated as a source of error."*

So the world can be built to mean what the region means, without a word of
explanation:

- **The stars are measured. The lines are the mind's.** Real data, human figure.
- **The depths are real**, so the figure only resolves from one vantage point.
  Move, and it comes apart. The pattern is a function of where you stand.
- **Two of the seven do not belong** to the physical group. The figure was
  already part-illusion before anybody drew it.
- **ANOMALY is the faintest star, off the figure, connected to nothing** — and
  Alcor has been an eyesight test for centuries. The thing that does not fit is
  the thing that tests whether you are really looking.
- **53 real background stars** show the sky the figure was picked out of — the
  alternatives the pattern ignored.

That is not astronomy used as decoration. It is a region of a person's mind whose
argument is enacted by the geometry.

---

## 14. Implications for implementation (not yet built)

Recorded here so the checkpoint is honest about what §3's "new spatial grammar"
will actually cost.

- **New renderer infrastructure required** (as the LOVE checkpoint predicted a
  new *kind* of world would): a tangent-plane projection from RA/Dec, per-star
  depth, a star-field of render-only background points, and a line set drawn from
  graph relationships rather than orbits. Reuses the existing points cloud,
  atlas, LineSegments batch, `COMPANIONS` render-only mechanism, per-vertex cap
  and per-vertex tint. **No new draw call is expected** — the additions merge
  into the three existing buffers.
- **Cost estimate:** 8 graph stars (already nodes) + 53 background points + 6
  line segments. Well under LOVE's addition.
- **`MIG_VISUAL['observation']` must change.** It is currently
  `family:'focus', rings:2` — "one focused light with a lens halo". §3 forbids
  the generic star-with-circle. The constellation itself becomes the identity.
- **Palette (§10), chosen from meaning not from "space is blue":** verdigris and
  cold teal — the colour of oxidised optical instruments, the apparatus of
  looking — with a single off-palette **cold gold** reserved for ANOMALY/Alcor,
  because it is the one thing that does not belong. Maximally distant from both
  Philosophy's violet and LOVE's amber.
- **Motion (§11):** no permanent loop. The parallax dissolution is driven by
  camera travel and pointer drift, which already request frames. Idle stays free.

---

## 15. Honest risks

1. **The figure may not read at small viewports.** 25° × 12.4° compressed to a
   375px strip could reduce the Dipper to a smear. Must be checked at 375 before
   claiming success, not after.
2. **Depth exaggeration is a dial with taste in it.** Too little and the parallax
   idea is invisible; too much and the constellation never resolves at all. It is
   illustrative and must be labelled as such.
3. **Writings outnumber Minor IGs on the bright stars.** Three of the four
   brightest stars carry writings, not concepts. The label-tier rule is what
   protects Minor IG legibility; if it fails in render, the mapping — not the
   typography — is what needs revisiting.
4. **53 background stars must not become visual noise.** They are tertiary. If
   they compete with the 8, cut the magnitude limit.

---

## Status

Research complete. The data supports an honest implementation: a real asterism
whose star count matches the region's object count exactly, with zero
interpolation, full provenance, and a metaphor that is the region's actual
subject rather than an ornament.

**Stopping here for review, per §5 of the brief. No renderer code written.**

---

## 16. Corrections found during implementation (2026-08-21)

Three claims in this document were wrong or incomplete. Recorded here rather
than quietly edited above.

**§8 said 53 background stars. The real number is 42.** The field query returned
53 *rows*, but 11 of them are the eight named stars and their resolved
components — Dubhe appears three times, Mizar twice. Rendering them would have
drawn the constellation on top of itself and let the sky compete with the
figure. The renderer drops them by coordinate match within 0.02°, and the data
file now records `rawFieldRows: 53`, `namedOrComponentRows: 11`,
`atmosphericCount: 42`.

**§11 predicted a depth-exaggeration factor would be needed. None is used.**
Converting to true Cartesian light years and rotating so the mean line of sight
is the depth axis gives a transverse extent of 43.8 ly and a depth extent of
39.2 ly — the figure is **0.90× as deep as it is wide**. True relative 3D scale
with a single map constant is enough. One illustrative quantity was removed
from the design rather than added.

**§15 risk 1 was correct and had to be fixed.** At 375px the first
implementation put eight of nine objects behind the sheet — one star visible.
Phone framing now stands 2.02× further back along the same line of sight and
aims below the figure so it rises into the visible strip. Measured: 9/9 objects
in the sky strip at 375×812 and at 768×1024.

**One thing this document did not anticipate.** Mizar and Alcor are 11.8 arcmin
apart, which is **7.9px at any framing that shows the whole 25° figure** — so
ANOMALY and WHEN REELS BECOME HOMEWORK merge into a single light at the ideal
view. That is astronomically true and it is what Alcor has always been: an
eyesight test. It is resolved by the parallax rather than by moving the star —
the two are 0.94 units apart across the sky and **10.7 units apart in depth**,
so a small move off the line of sight separates them visibly. The mapping was
not changed.
