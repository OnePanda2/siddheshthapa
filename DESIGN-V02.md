# DESIGN-V02.md
## The visual constitution of the Cognitive Constellation

Supersedes `DESIGN.md` **for V02 only**. `DESIGN.md` remains the contract for
the published P4.7 build and is not amended until V02 is promoted.

Read with `PRODUCT.md`, `CONTENT-MODEL.md`, `REBIRTH-V02-AUDIT.md`,
`DESIGN-REFERENCE-MATRIX.md`, `V02-TECH-DECISIONS.md`.

This is a contract. Read it before editing the visual system.

---

## 1. Thesis

> **A mind rendered as a navigable universe.**

Not a graph with atmosphere around it. The audit's finding is the thing being
fixed: today every spatial decision derives from partitioning one flat
rectangle. V02 replaces the *spatial model*, not the paint.

Three tiers of perception, one continuous space:

```
UNIVERSE      14 constellations at real distances
   ↓ approach
CONSTELLATION one region's cluster, entered by travelling into it
   ↓ approach
NEURAL FIELD  concepts and writings at legible range
   ↓ enter
THOUGHT       the reading environment — the universe recedes, does not vanish
```

Nothing "opens". Everything is **approached**.

---

## 2. The three qualities, expressed as mechanisms

Not adjectives — each must have a mechanism a check can find.

| Quality | Mechanism |
|---|---|
| **CURIOSITY** | Something is always visible but not yet legible. Distance withholds detail; approach grants it. There is always a further object. |
| **COURAGE** | The composition commits: real emptiness, one dominant object, large travel, asymmetry. It does not hedge by filling space. |
| **RIGHTEOUSNESS** | Provenance is visible at every range. Contradictions are shown as unresolved, not smoothed. Quotation is distinguished from belief. Uncertainty is stated. |

Righteousness is the one that must never be traded for beauty.

---

## 3. White-first — and the rule that makes it survivable

The ground is **light**. Dark is a tool for depth and focus, not the default.

`redesign-existing-projects` names the precise trap:

> "A single dark-background section breaking an otherwise light page looks like
> a copy-paste accident. Either commit to a full dark mode or keep a consistent
> background tone."

The brief also wants "deep-space moments" (§7). Both are right, and the
resolution is a rule:

> ### THE GROUND RULE
> **Darkness is only ever produced by DISTANCE or by FOCUS — never by region.**
>
> - **Distance:** space recedes into deeper tone with depth. Continuous, always.
> - **Focus:** when reading, the surround dims. Reversible, always.
>
> A region may **never** simply *be* dark. No MIG owns a dark ground. A dark
> area is always explained by where the camera is or what is being read.

That keeps every transition continuous and makes a dark moment read as
*travel*, never as a different page.

---

## 4. Colour system

### 4.1 The new enforceable rule

Replaces the V1 "blue-dominant or near-neutral" allow-list. The build gate now
enforces **semantic discipline + accessibility + declared ownership**, not a
list of permitted hex values.

**A. Semantic role.** Every colour must be declared against exactly one role:
`ground · surface · ink · ink-muted · ink-subtle · line · accent · focus ·
state`. A colour with no declared role fails the build.

**B. Contrast.** Enforced, not advisory:
- body text ≥ **4.5:1** against its own surface
- display text and UI ≥ **3:1**
- focus indicator ≥ **3:1** against both the focused element and its ground
- decorative-only colour is exempt but must be declared `decorative`, and
  decorative colour may never carry information.

**C. Coherence.** Every colour resolves from `WORLDS[id]` or the global token
set. No literal in a painter.

**D. No drift.** A hex or `rgb()` literal outside the token declaration block
fails the build. (This is the one mechanism carried over unchanged from V1 —
it was the part that worked.)

**E. Environment ownership.** A MIG may declare **one** accent family. It must
pass contrast on that MIG's own ground and must not collide with `focus`.

> **Suppression clause** (from Linear): *one* accent per environment, used on
> the focused object, the focus ring, and relationship emphasis — **never
> decoratively.** Additional colour requires a stated reason in the profile.

### 4.2 Global palette

| Role | Value | Note |
|---|---|---|
| `ground-0` | `#fbfcfd` | never pure `#ffffff` — a faint cool tint, mirroring Linear's refusal of pure black |
| `ground-1` | `#f5f7f9` | |
| `ground-2` | `#eef1f4` | the light **surface ladder**, ~3–5 points apart |
| `ground-3` | `#e6eaef` | |
| `depth-far` | `#c9d3dc` | what distance fades *toward* |
| `ink` | `#0e1620` | primary text |
| `ink-muted` | `#46525f` | |
| `ink-subtle` | `#7c8794` | |
| `line` | `#d4dbe2` | hairlines carry separation, not shadows |

Energetic family, drawn on by environments: sky · electric blue · cyan ·
turquoise · teal · cobalt · indigo. Reserve: violet, pale gold, muted green,
coral, warm amber — **only** where a MIG proves the need.

**Shadows are tinted with the ground's hue, never black** (Stripe:
`rgba(0,55,112,0.08)`). Pure-black shadow fails review.

---

## 5. Typography

Serif for source material, sans for the file's voice, mono for metadata —
**unchanged from V1**, because it encodes the honesty system.

**Tracking**, resolving the SpaceX/Linear conflict in Linear's favour:

| Tier | Size | Tracking | Line-height |
|---|---|---|---|
| Cosmic | clamp 64–140px | −4% of size | 0.98 |
| Display | 40–64px | −3% | 1.05 |
| Dominant writing | 28–48px | −2% | 1.18 |
| Body | 16–18px | −0.3% | 1.5 |
| Label / small caps | 9–11px | **+4%** | 1.2 |

Display weight **caps at 600.** Authority comes from size and space, not fat.

**Never truncate a sentence to fit a layout.** P4.4 and P4.7 both learned this.
Wrap to a measure; if it cannot fit, show fewer things.

---

## 6. 3D language

**Genuine depth, minimum machinery.** Three.js, inlined (ADR-01).

- **Units:** 1 unit = 1 "thought-length". Universe spans ~400 units; a
  constellation ~40; a neural field ~8.
- **Camera:** perspective, FOV 45°. Never orthographic — parallax *is* the
  depth cue.
- **The scene is a view, never the model.** The graph remains the model.
- **No object exists without a referent.** Every mesh maps to a real node,
  edge, or region. Decorative geometry is forbidden (§13).

---

## 7. Constellation language

Each MIG is a constellation with: position, scale, density, distribution,
material, motion profile, colour signature, gravitational radius.

- **Distributed, never arranged.** No ring, no menu. Positions derive from
  the graph — regions sharing many cross-edges sit nearer each other, so the
  *layout is an argument about the mind*, not decoration.
- **Density is honest.** Music (0 writings) is genuinely sparse; Life (12) is
  genuinely dense. This finally satisfies the P0 thin-region ruling.
- Approach reveals structure: point cloud → clusters → individual neurons.

---

## 8. Neuron behaviour

**The neuron alphabet is preserved and promoted** (§15). It is the atomic
object at every range.

| Range | Appearance |
|---|---|
| Far | luminous point; type distinguished by brightness only |
| Mid | the recognisable glyph — MIG halo, belief hollow, question diamond, contradiction two rings, project square |
| Near | full glyph + label + state + register |

Same alphabet as today. Same shapes. One routine.

---

## 9. Relationship behaviour

Relationships are the product. They stop being lines and become **trajectories**.

- Drawn in the edge's own direction — **direction is load-bearing** (V0.2 bug).
- The verb sits on the path, legible at mid-range.
- Weight by relevance: focused relationships brighten; distant ones thin.
- `tension` is visually interrupted — a semantic variation, allowed; variation
  by *world* remains forbidden.
- **Cross-region trajectories are visible from the universe view.** This is the
  rabbit hole made spatial: you can *see* that a thought in Philosophy reaches
  into Life before you know what either says.

---

## 10. Camera language

Camera movement is the navigation system. **Never teleport.**

| Action | Camera |
|---|---|
| Hover a constellation | slight dolly-in, ~2% |
| Select a MIG | continuous travel; peripheral constellations stay visible and parallax |
| Select a concept | move deeper; the field reorganises around it |
| Open a writing | camera settles and stops; surround dims |
| Back | reverses the same path |
| Brain | pulls out to the universe in one continuous move |

Spatial memory is the promise: returning must land where you left.

---

## 11. Scroll language

Scroll is **travel along the current approach vector** — not a page scroll, not
a cinematic timeline.

- On the universe: scroll = dolly through depth.
- On a constellation: scroll = move through the cluster.
- In a reading page: scroll is **ordinary document scrolling**. The document is
  a document (V1 constant, preserved).

Scroll must be interruptible and must never trap.

---

## 12. Depth

Ordered by strength:
1. **Atmospheric fog** — the primary medium (Stripe: *atmospheric colour, not
   shadow*). Objects fade toward `depth-far` with distance.
2. **Parallax** from real perspective.
3. **Scale** — true, not simulated.
4. **Legibility falloff** — distant text is small because it is far, which is
   the honest answer to IB-04.
5. **Surface ladder + hairlines** for DOM panels (Linear).

Explicitly **not**: drop shadows as the primary cue; blur as a depth fake.

---

## 13. Materiality

Restrained; felt before noticed. Grain (carried from P4.7, now a shader or
overlay), light diffusion, hairline registration, tinted shadow. If the texture
is noticed before the ideas, it is too strong — remove it.

---

## 14. Lighting

Soft ambient + one directional key. Localised glow on the focused object only.
**No bloom overload, no neon, no rim-light on everything.** Light is a focus
instrument.

---

## 15. Motion

Every motion answers **"why is this moving?"** If there is no answer, delete it.

Permitted: camera travel · approach/recession · emergence on relevance ·
attraction and separation (contradiction) · settle on focus.
Forbidden: idle floating, perpetual rotation, decorative particles, bounce,
cursor trails, parallax for its own sake.

`prefers-reduced-motion` yields a **designed static composition** — Tier D is a
real state, not a disabled one.

---

## 16. Focus

Focus reorganises the environment, it does not highlight an item:
the focused object gains spatial authority · related objects come forward ·
unrelated recede without vanishing (the network must stay felt) · negative
space redistributes · marginalia strengthens.

---

## 17. Cross-MIG connections

The mind must not become isolated rooms. Real cross-region edges exist
(b-kind→society, b-boundaries→learning, c-curiosity→life, seneca/thoreau/
nietzsche/kierkegaard→life). Each is a visible trajectory leaving its
constellation. Four of six contradictions span two regions — those axes cross
open space and should be among the most striking objects in the universe.

---

## 18. MIG environment profiles

`WORLDS[id]` remains the single source of truth, extended with 3D fields:
`position` `scale` `density` `distribution` `material` `motionProfile`
`accent` `fogDensity` `gravity`.

A region must differ in **behaviour**, not only colour. Directions per §21 of
the brief (Philosophy: intellectual cosmos, deep layering, large fragments,
contradiction axes, cobalt/indigo, slow motion — the vertical slice).

**Constraint carried from P4:** what is extracted to other regions is
**infrastructure, not appearance.** If another region ends up looking like
Philosophy, the phase failed.

---

## 19. Reading environment

The document constant is **preserved exactly** — it is one of the three V1
constants and it works. A reading page is a file taken off a shelf, identical
in all 14 regions, inheriting only colour.

What changes: arrival and departure. The universe recedes and quiets rather
than a panel sliding over it; leaving restores the exact prior camera state.

---

## 20. Mobile — 2.5D

**P3 remains authoritative.** The sheet carries structure; the constellation
above is atmospheric. No free camera, no orbit control.

Depth via layered parallax planes, not a perspective scene. Preserve: neuron
glyphs, relationship verbs in the edge's own direction, "Leads to", 44px
targets, the sheet as the interface. Do not reproduce the desktop composition.

---

## 21. Performance tiers

Per ADR-05: **A** full · **B** reduced · **C** 2.5D mobile · **D** no
WebGL/reduced-motion → designed static state. Tier D must be genuinely
usable, not degraded.

---

## 22. Accessibility

**Non-negotiable, and the property that makes this rebuild safe:**

> Delete the `<canvas>` and the site must remain fully navigable and readable.

Canvas stays `aria-hidden`. The parallel focusable layer remains the single
source of structure. Roving tabindex, arrow-key relationship walking, focus
ring drawn on whatever holds DOM focus, hidden states leave the tab order.
Keyboard alone must complete: universe → MIG → concept → relationship →
writing → return.

---

## 23. Authenticity

Unchanged and absolute. `fragmentsOf()` filters on `n.src && n.line`;
`cropTo()` marks a crop; every mark re-derives from a record. Serif = source
material. A quotation that is not his says so. An unsourced object is visibly
scaffolding.

> **Space does not license prose.** A larger environment has more room to fill
> and the temptation scales with it. If the environment needs more material,
> **use less**. Empty space is better than fabricated thought.

No invented beliefs, quotes, fragments, footnotes, sources, relationships or
interpretations. RevenuePilot and FlowMail stay removed permanently.

---

## 24. Forbidden patterns

Decorative 3D with no referent · particles for atmosphere alone · neon · bloom
overload · glassmorphism everywhere · gradient blobs · floating cards · 3D only
in a hero while the rest is flat · Web3/dashboard aesthetics · hacker terminals
· Matrix green · rotating the old 2D graph and calling it 3D · animation
without meaning · scroll effects without narrative · sacrificing readability or
accessibility for spectacle · hiding navigation behind cleverness · a region
that is merely a skin.

---

## 25. DO NOT COPY  *(mandatory section)*

From any studied reference — Stripe, SpaceX, Linear, or any other:

- ❌ layout or composition
- ❌ typography pairing
- ❌ visual identity or brand language
- ❌ brand colours (Stripe's mesh, Linear's lavender, SpaceX's black)
- ❌ interaction choreography
- ❌ distinctive animation sequences
- ❌ 3D objects or scene composition
- ❌ signature navigation metaphors

We extract **principles**: atmosphere-as-depth, procedural scale,
suppression-as-luxury. The expression must be original to Siddhesh's mind. If a
reviewer can name the site we borrowed from, the work has failed.

---

## 26. Vertical-slice acceptance criteria

Slice: **Universe → Philosophy → Curiosity → one cross-MIG trajectory → one
writing → return.**

**Regression gates — failing any one fails the slice regardless of beauty:**
1. Keyboard alone completes the whole journey.
2. Deleting the canvas leaves the site navigable and readable.
3. `prefers-reduced-motion` yields a legible designed composition.
4. Zero external requests; zero fabricated text.
5. Every control ≥44px on touch.

**Visual gates:**

6. A **still frame** reads as volumetric — depth without motion.
7. Approaching Philosophy is continuous travel; no cut, no fade-to-black.
8. At least one cross-region relationship is visible as a trajectory from the
   universe view.
9. The neuron alphabet survives at three ranges.
10. Reading quiets the universe; return restores the prior camera state.
11. Light ground dominates; no region is dark merely by being that region.
12. One authentic sentence carries the composition at display scale, whole.
13. A reviewer cannot say *"the old site with particles added."*

---

## 27. Open questions requiring Siddhesh's judgement

1. **IB-04** — should distant writing be legible enough to invite a click, or
   is illegibility-at-distance the honest behaviour?
2. **IB-05** — may the field echo the writing already open in the panel?
3. **The `verbatim` flag** — 20 of 69 lines are the file's summary, not his
   words. Still unresolved from V1 and it affects what may be set in serif.
4. **P6** — the graph is sparse (mean degree 2.01, 19 dead ends). A universe
   makes sparseness *more* visible, not less. The frozen queue may need to
   thaw before the constellation reads as a mind.
