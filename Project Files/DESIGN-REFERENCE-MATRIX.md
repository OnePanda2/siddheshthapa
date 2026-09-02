# DESIGN-REFERENCE-MATRIX.md
## Phase 2 — reference intelligence for the Cognitive Constellation

**Method.** Selection was made from the real `voltagent/awesome-design-md`
index (73 analysed sites across 10 categories), not from memory. Three were
then **read in full**; the rest were rejected as off-problem. Per brief §11
("once the matrix is sufficiently diverse and coherent, STOP") the set is
deliberately small.

**Honesty note.** Only the three below were actually studied. Nothing in this
document is a recalled impression of a website — every quoted principle comes
from a document I read. If you want more references studied, say so; I have
not padded the list to look thorough.

---

## Selection rationale

V02 has three visual problems the existing work does not solve:

1. **Depth on a light ground.** White-first is now mandated (§6/§7), but every
   depth technique the project owns assumes a dark canvas.
2. **Vast scale without photography.** The metaphor is celestial, but the site
   has no imagery and may not invent any.
3. **Expensive without shouting.** "Old money", intellectual, restrained.

One reference was chosen per problem.

---

## R1 — STRIPE  ·  depth on a light ground

**Source:** `design-md/stripe/DESIGN.md`

**What was learned**
- The depth medium is **"atmospheric color rather than literal shadow"** — a
  gradient mesh, described as *the brand's primary depth medium*.
- Shadows are **tinted with the ground's hue**, never black:
  `rgba(0,55,112,0.08) 0 1px 3px` → `rgba(0,55,112,0.08) 0 8px 24px`.
- Surfaces: canvas `#ffffff`, soft canvas `#f6f9fc`. The mesh is SVG with
  *organic blob shapes*, not a flat CSS gradient.
- Display type carries **proportional negative tracking**: −1.4px at 56px,
  −0.96px at 48px, 0 at body.
- Section rhythm ~96px, tightening to 32px in dense areas.

**Why it matters for V02**
It answers the exact question the audit could not: *how does a white
environment acquire depth?* Not with shadows — with **atmosphere**. That maps
onto a literal mechanism in Three.js: volumetric fog. Stripe fakes atmospheric
perspective in 2D; V02 can have the real thing.

**How it informs siddheshthapa.com**
- Fog becomes the primary depth cue, not shadow.
- Every shadow/line takes a tint from the environment profile's ground.
- Adopt proportional negative tracking on display type.

**What must NOT be copied**
The five-stop cream/orange/lavender/indigo/ruby mesh — that is Stripe's brand
identity and would be instantly recognisable. Take *atmospheric colour as a
depth medium*; reject their specific atmosphere. No blob gradients.

---

## R2 — SPACEX  ·  vast scale, and a warning

**Source:** `design-md/spacex/DESIGN.md`

**What was learned**
- Scale comes from **full-viewport photography**: "every band is a single
  full-viewport photograph or video paired with one all-caps headline" at 80px.
- **"Depth is photographic: a rocket launching at twilight has natural
  atmospheric depth."**
- **"Negative space is photographic, not a UI choice"** — empty sky performs
  the spacing.
- Display: D-DIN Bold uppercase, line-height **0.95**, tracking **+1.6px at
  80px** — "the brand's signature optical air".
- Zero accent colours, no illustrations, no icons beyond chevrons. Type sits
  directly on imagery with no scrim.

**Why it matters for V02**
This is the closest existing thing to the celestial metaphor, and studying it
**disproved an assumption**. SpaceX's power is not its black canvas — it is
photography. Strip the photographs and nothing remains but black and tracking.
V02 has no photographs and may not invent them, so **copying the dark canvas
would inherit the weakness without the strength.**

This is the strongest single argument *for* the white-first pivot.

**How it informs siddheshthapa.com**
- Scale must be produced **procedurally** — true distance, fog falloff,
  parallax — since it cannot be produced photographically.
- One dominant object per view; resist filling.
- Line-height near 1.0 on display type is correct at large sizes.

**What must NOT be copied**
The black substrate. The all-caps industrial voice. The +1.6px tracking (see
the conflict below). Any suggestion of aerospace/rocket iconography.

---

## R3 — LINEAR  ·  expensive without shouting

**Source:** `design-md/linear.app/DESIGN.md`

**What was learned**
- **One accent, used sparingly:** lavender `#5e6ad2` "appears on the brand
  mark, focus rings, and a few intentional CTAs — **never decoratively**."
- Depth is a **surface ladder + hairline borders**, not shadows: surfaces step
  `#0f1011 → #141516 → #18191a → #191a1b`, ~3–4 hex points apart — "micro-
  hierarchy without contrast shock." Borders `#23252a → #34343a → #3e3e44`.
- Canvas is `#010102`, **not** `#000000` — a faint blue tint "signals
  intentionality over digital flatness."
- **Aggressive negative tracking:** −3.0px at 80px ≈ **4% of size**; −1.8px at
  56px; −0.05px at body. Positive (+0.4px) only on eyebrow labels.
- Display weight **caps at 600** — "resists 700+ display weights."
- Reads as "software-craft documentation: dense, technical, quietly luxurious."

**Why it matters for V02**
"Old money" is not a colour, it is **suppression**. Linear proves premium comes
from what is withheld. It also supplies a depth technique that works on any
ground: a *surface ladder*, which inverts cleanly to near-whites.

**How it informs siddheshthapa.com**
- A **light** surface ladder: 4 near-white steps, small increments, hairlines.
- Exactly **one** accent per environment, never decorative.
- Never pure `#ffffff` — always a tinted near-white, mirroring Linear's
  refusal of pure black.
- Negative tracking at ~4% of size on display.
- Display weight ceiling; the type gets authority from size and space.

**What must NOT be copied**
The dark canvas, the lavender, the four-surface dark ladder verbatim, the
product-documentation voice.

---

## The productive conflict

R2 and R3 **disagree** on the same decision:

| | SpaceX | Linear |
|---|---|---|
| Display tracking at 80px | **+1.6px** (industrial air) | **−3.0px** (premium density) |

**Resolution — V02 takes Linear's.** The site is an intellectual archive, not
an engineering brochure; density and gravitas beat industrial spacing. Positive
tracking is reserved for small caps and metadata labels — which is also what
`redesign-existing-projects` independently prescribes ("negative tracking for
large headers, positive tracking for small caps or labels"). Three sources
agree once the conflict is resolved in that direction.

---

## Layer 1 — principles taken from the skill files

| Skill | Principle adopted |
|---|---|
| `xiaopu-ai web-design` | Spec before code; DESIGN.md is an explicit, reusable artifact. Interaction tier **L3** (scroll-driven timeline, cursor response, transitions) is the declared target. |
| `redesign-existing-projects` | The anti-generic audit. Critically: **"a single dark section in a light page looks like a copy-paste accident — commit, or keep a consistent tone."** Also: tinted shadows over black; grain over flatness; `transform`/`opacity` only; break symmetry. |
| `web3d-integration-patterns` | **Pattern 1, Layered Separation** — 3D layer / animation layer / DOM UI layer. Already the site's architecture; V02 substitutes the render layer only. |

**Rejected:** `lightweight-3d-effects` (Zdog/Vanta/Vanilla-Tilt) — all require
CDN delivery, which the CSP blocks outright. Recorded so nobody re-evaluates it.

---

## What must not be copied — global

From any reference: layout · typography pairing · visual identity · brand
colours · interaction choreography · signature animation sequences · 3D objects
· navigation metaphors.

We extract **principles**. Three references were studied and each contributed
one mechanism (atmosphere-as-depth, procedural scale, suppression-as-luxury).
The composition they inform must be original to Siddhesh's mind.
