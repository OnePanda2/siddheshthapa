# MIG_SYSTEM_RESEARCH.md
## Phase 3D — real astronomical templates for the fourteen worlds

**Source of every figure:** NASA Exoplanet Archive TAP service, table `pscomppars`
(Planetary Systems Composite Parameters), IPAC/Caltech, retrieved 2026-08-19.
Raw values are in [`data/astronomy-systems.json`](data/astronomy-systems.json).

**Nothing here is estimated, remembered, or invented.** Where the archive
returned no value, that is recorded as a gap rather than filled in. Our own
Solar System is excluded, as instructed.

---

## 1. What was verified

**12 systems** with usable measured geometry, spanning an enormous range of
spatial character — which is the whole point, since fourteen worlds that all
look like a radial menu would defeat the exercise:

| System | Planets | Span (AU) | Spatial character |
|---|---|---|---|
| TRAPPIST-1 | 7 | 0.0115 – 0.0619 | extremely compact resonant chain |
| TOI-178 | 6 | 0.026 – 0.128 | Laplace resonance, 2:4:6:9:12 |
| K2-138 | 6 | 0.034 – 0.231 | 3:2 chain, then a gap |
| GJ 876 | 4 | 0.021 – 0.334 | coupled, motions locked |
| Kepler-33 | 5 | 0.068 – 0.254 | evenly graded outward |
| Kepler-11 | 6 | 0.091 – 0.466 | flat, coplanar, stratified |
| HD 219134 | 6 | 0.039 – 3.11 | compact core + one far outlier |
| HD 10180 | 6 | 0.064 – 3.381 | near-geometric, each orbit ~2× |
| 55 Cnc | 5 meas. | 0.0154 – 5.6 | 363× dynamic range |
| Kepler-16 | 1 | 0.705 | **circumbinary** — orbits a star *pair* |
| Proxima Cen | 2 | 0.029 – 0.048 | sparse, nearly empty |
| HR 8799 | 4 | 16.4 – 68.0 | vast, directly imaged, huge voids |

TRAPPIST-1 against HR 8799 is a **1,100× difference in scale**. That contrast
alone guarantees the worlds cannot read as the same interface.

---

## 2. Proposed assignments

Each is justified by the region's real content, then matched to geometry.

| MIG | Concepts | Template | Why this geometry |
|---|---|---|---|
| **PHILOSOPHY** | **7** | **TRAPPIST-1 (7)** | **Exact 1:1 fit.** The most densely interconnected region (21 members, and the graph-wide contradiction c-curiosity) takes the most tightly bound resonant system. Nothing is stretched. |
| BUSINESS | 7 | HD 10180 (6) | Near-geometric doubling is the most *architectural* spacing measured — systems and structure |
| LIFE | 5 | HR 8799 (4) | The vast, sparse one. Life is the region that should feel most open |
| SOCIETY | 5 | Kepler-11 (6) | Flat, coplanar, crowded — many bodies sharing one plane |
| MUSIC | 0 | TOI-178 (6) | Genuine Laplace resonance: rhythm is *measured*, not decorated |
| LEARNING | 4 | K2-138 (6) | An ordered chain that then breaks — progression with a discontinuity |
| LOVE | 4 | **Kepler-16 (circumbinary)** | Everything orbits a **pair**, not either star. Proximity and distance, from real astronomy — no hearts |
| MY WORKS | 4 | HD 219134 (6) | Compact core of artifacts plus one distant outlier |
| TECHNOLOGY | 4 | Kepler-33 (5) | Evenly graded, precise, each shell slightly larger |
| HUMAN BEHAVIOUR | 4 | GJ 876 (4) | **Exact fit.** Resonant coupling — bodies whose motions are locked to one another |
| OBSERVATION | 4 | 55 Cnc (5) | Extreme dynamic range: one body almost touching the star, one very far — a system about *scale of attention* |
| BUILDING | 4 | *unassigned* | needs a template |
| MOVIES | 4 | *unassigned* | needs a template |
| FOOD | 4 | *unassigned* | needs a template |

**Two systems short, three MIGs unassigned.** Per §4 I will not fabricate a
system to reach fourteen. The fallback is documented **real constellation**
geometry, which is a legitimately different category (sparse, mythic,
non-orbital) and would give those three worlds their own class.

---

## 3. Gaps — recorded, not papered over

1. **Kepler-90 returned no rows.** An 8-planet system, would have been strong.
   Queried and got nothing. **Not verified, must not be used** until re-queried.
2. **HD 158259 has no semi-major axes.** Periods for 5 planets, `pl_orbsmax`
   null for every one. Periods alone cannot place bodies without assuming a
   stellar mass. Either derive from Kepler's third law with a *sourced* mass,
   or drop it.
3. **55 Cnc count mismatch.** `sy_pnum` says 7; only 5 returned geometry. Use
   the 5 measured orbits and say so.
4. **Kepler-16's binary pair is not in this data.** `pscomppars` returns the
   planet, not the two stars' mutual orbit. The two-centre geometry that makes
   it right for LOVE needs a second authoritative source before it can be drawn
   accurately.

---

## 4. The mapping algorithm (proposed, not yet built)

A template's planet count rarely equals a MIG's concept count, so:

1. **Normalise** each template's semi-major axes to 0–1 against its own span.
   This preserves *relative* spacing — the actual grammar — while discarding
   absolute AU, which is meaningless here.
2. **Exact match** (Philosophy/TRAPPIST-1, Behaviour/GJ 876): concept *i* takes
   orbit *i*. No interpolation.
3. **Fewer concepts than orbits**: take the orbits that best preserve the
   spacing signature — always both extremes, then the largest gaps.
4. **More concepts than orbits**: subdivide *within* the existing shells rather
   than appending new ones, so the silhouette is unchanged.
5. **Angle** comes from the concept's own graph degree, deterministically —
   never `i/n × 2π`, which is what makes fourteen radial menus.
6. Writings are **not** planets. They are secondary bodies associated with the
   concept that owns them.

Every step must be deterministic so it is testable and identical on every load.

---

## 5. Recommendation for the vertical slice

**Philosophy on TRAPPIST-1.** It is the only exact 7↔7 fit available, it needs
no interpolation, its compactness matches the region's density honestly, and
the geometry is fully measured with high confidence.

---

## 6. Status

**Research only.** No code written this pass. The brief (§3, §38) requires the
research deliverable before implementation, and I stopped there deliberately
rather than start a build I could not finish or verify in this session.

Not started: the orbital layout implementation, `tools/astronomycheck.js`
(A1–A15), mutation tests, screenshots, performance measurement.
