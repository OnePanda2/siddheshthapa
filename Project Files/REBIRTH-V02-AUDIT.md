# REBIRTH-V02-AUDIT.md
## Phase 0 — Design archaeology for the Cognitive Constellation rebuild

Written against `preview.html` @ `a86e4deb12e0` (P4.7, published 2026-08-19).
Method: runtime measurement, not recollection. Every number below was probed.

---

## 0. THE HEADLINE

The site does not feel like a world for one structural reason, and it is not
the visual layer:

> **Every spatial decision in the build is derived from a 2D rectangle
> subtraction model.** `philZones()` computes editorial space as the
> *complement* of the graph's bounding band. Composition is therefore an
> exercise in dividing one flat plane into non-overlapping boxes.

P4.7 pushed that model as far as it goes — writing was finally allowed *inside*
the graph field, the dominant voice was given a measure, the ground was given a
surface. The result is a genuinely better page. It is still a page.

A universe cannot be expressed as a partition of a rectangle. That is the
finding that justifies V02.

---

## 1. THE FIFTEEN QUESTIONS (brief §9)

### 1. What makes it feel like a graph rather than a world?

Four measured causes, in order of force:

| # | Cause | Evidence |
|---|---|---|
| 1 | **No depth axis exists.** Every object has `(x, y)` and an alpha. There is no `z`, no camera, no perspective. | 4 × `getContext('2d')`, 0 × WebGL |
| 2 | **Space is partitioned, not inhabited.** Zones are rectangles cut around obstacles. | `philZones()` → `subtract()` keeps the largest remaining rect |
| 3 | **Regions are a flat list at one scale.** All 14 MIGs sit on one plane at one distance; you never *approach* anything. | `rim` places 13 labels around one ellipse |
| 4 | **Transitions are re-layouts.** Entering a region re-targets node positions and cross-fades colour. Nothing travels. | `retarget()` + eased `n.cx += (n.tx-n.cx)*k` |

The neuron alphabet, the relationship semantics and the provenance system are
all excellent and are *not* the problem. They are being rendered onto a
whiteboard.

### 2. Which systems should be preserved?

These are the mind. They cost seven increments and are all machine-enforced:

- **The content graph** — 143 nodes, 126 relationships, ownership rule
  (`n.mig` + `n.crosses`), 14 MIGs, 60 minor IGs, 69 writings.
- **The authenticity system** — `fragmentsOf()` filters on `n.src && n.line`;
  `cropTo()` marks a crop; marks re-derive from records. Fabrication is
  structurally hard. **This is the product.**
- **The provenance model** — `src` / `register` / `state`, serif = source
  material, sans = the file's voice, "Not his words · SENECA".
- **The relationship model** — semantic verbs, first-person glosses,
  direction as load-bearing, `tension` as a first-class type.
- **The contradiction model** — `polesOf()`, measured dignity 1.00 /
  opposition −1.00 across all six.
- **P1 accessibility spine** — parallel focusable layer, roving tabindex,
  arrow-key relationship walking, 23 focusable elements.
- **P3 mobile model** — sheet + constellation, one graph state, two spatial
  representations.
- **The QA discipline** — 174 acceptance checks, 8 runtime tools, mutation
  harnesses, "unmeasured is a failure".

### 3. Which systems should be replaced?

| System | Verdict |
|---|---|
| `philZones()` rectangle partition | **Replace.** Cannot express depth. |
| `layZone()` / column compaction | **Replace.** Solves a 2D packing problem that stops existing. |
| `paintMotif()` 14-case painter | **Replace** with environment profiles driving a scene, not a `switch`. |
| `retarget()` position easing | **Replace** with camera movement; keep the *graph* logic it drives. |
| Canvas-2D render path | **Replace** for space/atmosphere; **keep** for nothing. |
| Grain via `drawImage` | Retire — becomes a shader/material concern. |
| Marginalia geometry (`margFits`) | **Replace** the placement; **keep** the derivation rules verbatim. |

### 4. Which visual elements cause confusion?

- **The dominant fragment duplicates the reading panel.** The focused writing
  is shown in the panel *and* as the large editorial fragment. Visible in the
  contradiction state. Reads as a bug, not a composition.
- **Field fragments are unreadable** (2% alpha, 10px) yet are 44px click
  targets. An invisible doorway is a confusing doorway.
- **Two returns that look alike** — `<` (one step back) and the brain (leave
  the climate) are adjacent in function but never explained in-world.
- **The rim is a ring of 13 words.** It reads as a menu, which contradicts the
  claim that regions are places.

### 5. Which icons/interactions are broken?

**I could not reproduce a broken control.** Measured at 1440×900:

| Control | Size | Visible | Accessible name |
|---|---|---|---|
| `enterBtn` | 231×15 | correctly hidden post-threshold | — |
| `backBtn` | 29×38 | yes | "Back" |
| `mindBtn` | 31×31 | yes | "Go back to Mind map" |

All three carry handlers and labels; 8 click listeners total; 23 focusable
elements. **Two real defects do exist:**

1. Both persistent controls are **under 44×44** on desktop (29×38, 31×31).
   They meet WCAG 2.2 AA (24px) but fail the project's own 44px standard.
2. The brain's tooltip is suppressed on touch, so on a tablet the control is
   unlabelled visually.

> **NEEDS YOUR INPUT:** §36 states the site has broken icons. It does not, so
> far as I can measure. Tell me which control misbehaved and in which state and
> I will chase it; otherwise I will treat §36 as satisfied by the two fixes above.

### 6. Which navigation paths are unclear?

- No way to reach a *specific* region from inside another without going up to
  the map — cross-region marks name a destination but are deliberately inert.
- "WANDER FROM HERE →" has no stated destination.
- Nothing communicates **how much is left**; there is no sense of the
  corpus's size, so no reason to believe exploring is finite enough to try.

### 7. Where does visual hierarchy fail?

Measured at 1440 (concept state): dominant 28px, mid 17px, small 11px, field
10px. The **28px dominant is the weak link** — it is the wrapped compromise
between "whole sentence" and "large". At 2560 it reaches 54px and the
composition immediately reads better. Below 1100 there is no room for display
type at all and the assertion correctly stands down.

### 8. Where is the site repetitive?

**All fourteen regions are the same composition with different constants.**
One painter, one zone algorithm, one rim, one panel, one fragment field.
Music (0 writings) and Life (12 writings) get identical spatial treatment.
This is the deepest repetition and V02 §21 targets it directly.

### 9. Where is the 3D/depth opportunity?

Strongest first: **region approach** (14 constellations at real distances) ·
**cross-region edges** (currently a text list; should be visible trajectories
across space) · **contradiction** (an axis in a plane wants to be an axis in a
volume) · **fragment depth** (already faked with scale — make it real) ·
**reading** (the universe recedes rather than a panel sliding in).

### 10–15. The journey (first 30s, scroll, approach, enter, read, return)

Currently: threshold → click → map appears → click region → labels re-arrange
→ click concept → panel slides in → click fragment → reading page. Six
discrete state changes, none of which is *movement*. Scroll does nothing on
the map. The audit's answer to §9.10–15 is that **none of these six moments
currently has a spatial expression**, and V02's Phase 4 exists to give each one.

---

## 2. RULINGS V02 OVERTURNS — record so nothing regresses by accident

| P0 ruling | V02 position | Consequence |
|---|---|---|
| **C3** blue/white/black/grey enforced; every hex near-neutral or blue-dominant | §6 "officially relaxed"; white-first | `accept.js` colour check and `tokencheck`'s 98 values must be **rewritten, not deleted** |
| **C5** no GSAP, no Three.js | §13 "3D is now a legitimate core requirement" | See §3 below — this is the hard one |
| **C4** keep the single self-contained file | §13 "choose the minimum technology" | Collides with React Three Fiber. Decision required. |
| Dark ground as identity | §7 white-first | 14 environment profiles re-authored |

Everything else from P0 stands: no invented content, no RevenuePilot/FlowMail,
14 MIGs including SOCIETY, P6 frozen pending Siddhesh's reasoning.

---

## 3. THE ONE HARD CONSTRAINT — read this before choosing a stack

**The artifact CSP blocks every external host.** No CDN, no
`import` from a URL, no webfont. This is not a preference; a blocked script
fails *silently* and the page renders empty. It is why the project has 0
external requests today.

Therefore:

| Option | Viable? | Cost |
|---|---|---|
| **Three.js inlined into the single file** | **YES** | ~600KB minified appended to 232KB → ~850KB. Well under the 16MB artifact ceiling. Keeps single-file, keeps zero-dependency deployment, keeps the whole QA harness working unchanged. |
| **React Three Fiber** | **NO — not without abandoning the single file** | R3F needs React + JSX + a bundler. That means npm, a build step, and a dist artifact. It also invalidates `tools/capture.js`, which appends a hook to the raw file. |
| **Hand-written WebGL** | Yes | No payload, but months of work re-implementing what Three.js gives free. |
| **CSS 3D transforms + 2D canvas** | Partly | Real perspective and depth sorting, no shaders/lighting. Cheapest path to genuine depth. Would satisfy §39 A/C/E but probably not the ambition. |

**My recommendation: Three.js, inlined, single file retained.** It satisfies
§13's "minimum technology that can produce the intended experience", preserves
every verification tool, and keeps deployment a single artifact. R3F buys
ergonomics we do not need for one scene and costs the architecture that has
made this project verifiable.

**This is your decision and I have not acted on it.**

---

## 4. RISKS

**Performance.** The harness already times out intermittently at 2560×1080 on
2D under software raster; headless Chrome has no GPU. A WebGL scene may be
*unmeasurable* in the current harness even when it is fast for a real user.
This is the single largest threat to the project's verification discipline and
must be solved in Phase 3, not discovered in Phase 12.

**Accessibility.** P1 is the site's spine. WebGL is a black box to assistive
technology. The parallel DOM layer must remain the source of structure, with
the 3D scene as a *view* — exactly the relationship the canvas has today. If
3D becomes the only way to navigate, the rebuild has failed §35.

**Authenticity.** A spatial environment has far more room to fill. The
temptation to generate atmosphere-prose scales with the empty space. The
`fragmentsOf()` mechanism must survive the port intact.

**Verification.** Eight runtime tools read 2D geometry via `window.__mind`.
Every one needs a 3D equivalent (project to screen space, then assert). Budget
for this explicitly.

**Scope.** V02 is 12 phases. P4 alone took 7 increments. The realistic risk is
an abandoned half-migration that is worse than P4.7. The vertical-slice gate
(§40) is the control and must be honoured.

---

## 5. WHAT REMAINS UNTOUCHED

`validate.js` · the data block (143 nodes, 126 edges) · `docgen.js` ·
`p6queue.js` · `editorial-register.md` · `content-inventory.json` ·
the editorial safety rules · the held/blocked material · P6's frozen queue.

---

## 6. VERTICAL-SLICE ACCEPTANCE CRITERIA (§40)

The slice is: **Universe → Philosophy → Curiosity → one cross-MIG edge → one
writing → return.** It passes only if all of these are true:

1. Depth is perceivable without motion — a still frame reads as volumetric.
2. Approaching Philosophy is continuous travel; no cut, no fade-through-black.
3. At least one cross-MIG relationship is visible *as a trajectory* from the
   global view.
4. The neuron alphabet survives at three ranges (point → neuron → detail).
5. Reading quiets the universe; returning restores the prior camera state.
6. White/neutral is the dominant ground.
7. Keyboard alone completes the whole journey.
8. Reduced-motion yields a legible static composition.
9. Zero external requests; zero fabricated text.
10. A reviewer cannot say "the old site with particles added."

Criteria 7, 8 and 9 are **non-negotiable regressions gates**; failing any one
of them fails the slice regardless of how good it looks.

---

## 7. WHAT I HAVE NOT DONE

Per §41, Phase 0 stops here. Not started: `DESIGN.md` (Phase 1),
`DESIGN-REFERENCE-MATRIX.md` (Phase 2), any implementation.

---

## 8. DECISIONS I NEED FROM YOU

1. **Stack** — Three.js inlined in the single file (recommended), or abandon
   single-file for React Three Fiber?
2. **The broken icon** — which control, in which state? I could not reproduce one.
3. **Colour enforcement** — the machine check that has protected the palette
   for seven versions must be rewritten. Do you want a new enforceable rule
   (e.g. "neutral OR within the blue–cyan–teal arc, no warm hues above X
   saturation"), or is colour now a matter of judgement rather than build gate?
4. **Fate of P4.7** — the current build is published and verified. Do I keep it
   as the fallback while V02 is built alongside, or is `preview.html` the thing
   being rebuilt in place?
