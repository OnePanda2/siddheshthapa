# DESIGN-AUDIT.md — V1.0 rebuild, phase 4

Audit of the shipped build (`preview.html`, 157,809 bytes, 2,634 lines) against
[PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md) and the V1.0 rebirth brief.
Every number here was measured, not estimated.

Severity: **S1** blocks the rebuild · **S2** major · **S3** notable · **S4** polish

---

## Strengths — do not rebuild these

1. **The neuron constant.** One shape routine, one edge path, machine-enforced.
   It is the strongest idea in the project and it works. Keep exactly.
2. **The ownership rule.** Strict single-owner + declared crossings. Makes the
   map legible at a glance and is validated. Keep exactly.
3. **The relationship contract.** Semantic verb + first-person gloss ≥25 chars,
   direction-correct. This is what makes the graph an argument instead of a
   diagram. Keep exactly.
4. **Content integrity.** 69 sourced writings, register on every one, two
   fabricated projects removed with a check preventing their return, an empty
   region that admits it. Hard-won. Keep exactly.
5. **Zero dependencies.** One file, no build, no network at runtime. This is why
   it loads instantly and cannot rot. Treat as a feature.
6. **The document layer.** Reading pages are typographically distinct from
   regions and enforce provenance honesty. Shipped this session.
7. **The verification suite.** 107 checks, mutation-tested. Nothing else in this
   project would survive without it.

---

## S1 — Blocking

### S1.1 The graph is unreachable by keyboard and invisible to assistive tech

Measured:

```
tabindex attributes .............. 0
canvas event listeners ........... mousemove, mouseleave, click
keydown listeners ................ 1  (Escape only)
nav / main landmarks ............. 0 / 0
aria attributes .................. 6  (on 2 buttons and the reader dialog)
```

143 nodes and 126 relationships — **the entire navigation system** — exist only
as pixels in a `<canvas>` with mouse hit-testing. A keyboard-only visitor can
reach the threshold, press Escape, and nothing else. A screen reader is told
there is a canvas.

The brief states the rule itself, at §31: *"If an effect cannot coexist with
accessibility, accessibility wins."* The site currently fails its own rule at
the level of its core mechanic. This is not a polish item and it cannot be
retrofitted late — it changes how selection state is owned.

**Fix direction:** a parallel DOM layer, not a canvas rewrite. The canvas stays
the visual; a visually-hidden-but-focusable list of the current view's nodes and
edges becomes the semantic truth, and canvas selection mirrors DOM focus. Cost
is moderate and it is the correct architecture regardless.

### S1.2 Mobile is a scaled desktop, which the brief forbids

Five media queries exist (1080 / 900 / 860 / 560 px, plus reduced-motion). None
of them touch the graph. On a phone the canvas renders the same 14-region
ellipse at the same relative coordinates, with the same node radii and the same
label gating, in a third of the width.

The brief, §33: *"Do not simply shrink the desktop graph. On mobile, rethink the
spatial experience."*

Two testing traps were found and fixed this session and must be recorded, because
both produce false confidence:
- The file had **no viewport meta**, so every local mobile check rendered at a
  980px fallback canvas and the phone CSS never engaged.
- **Headless Chrome clamps its window to ~500px** while still writing a
  375px-wide screenshot. Narrow captures looked clipped when the layout was
  fine. Verify true phone widths over a local server with device emulation.

---

## S2 — Major

### S2.1 Environment effort is inversely correlated with content

Page composition overridden per region, measured from the CSS:

| Region | CSS chars | Writings |
|---|--:|--:|
| MY WORKS | 1486 | 6 |
| **MUSIC** | **1330** | **0** |
| OBSERVATION | 1264 | 4 |
| MOVIES | 823 | 2 |
| BUSINESS | 585 | 7 |
| TECHNOLOGY | 414 | 3 |
| **LIFE** | **390** | **12** |
| SOCIETY | 370 | 5 |
| **PHILOSOPHY** | **358** | **14** |
| LOVE | 281 | 3 |
| HUMAN BEHAVIOUR | 275 | 5 |
| LEARNING | 268 | 6 |
| BUILDING | 258 | 1 |
| FOOD | 206 | 1 |

The most heavily composed region has **no content at all**. The two richest
regions — Philosophy with 14 writings and Life with 12 — are near the bottom.
Five regions (Food, Building, Learning, Human Behaviour, Love) override under
300 characters of CSS, which means they differ from each other by **colour
tokens and a canvas backdrop only**.

Against brief §35 — *the visitor should recognise "I am somewhere else" without
reading the title* — five of fourteen regions currently fail, and they are not
the five you would choose to sacrifice.

### S2.2 The curiosity loop is not supported by the graph's actual shape

```
relationships .................... 126 across 143 nodes
mean edges per writing ........... 2.01
writings with exactly 1 edge ..... 19 of 69   (28%)
cross-region edges ............... 41 of 126  (33%)
```

The site's stated engine (§14) is *"why are these two things connected?"*
followed by another hop, and another. But 19 writings are **cul-de-sacs** — a
visitor arriving there can only go back the way they came. At a mean degree of
2.01, the median journey is a corridor, not a network.

This is the same defect Siddhesh named at V1.0 — *"a huge walk down a hallway
with no rooms to enter"* — reappearing one level down. The rooms exist now. The
doors between them are too few.

`MIND-MAP.md` lists all 19 by id. They are the highest-value targets in the
project: each new well-argued relationship converts a dead end into a junction.

### S2.4 Rim labels collide with the reading panel · **FIXED 2026-08-15**

Found while capturing the keyboard focus ring in HUMAN BEHAVIOUR at 1440×900.
`placeRim()` distributed the other thirteen regions across the full stage,
including the quadrant the `.emerge` panel occupies. `retarget()` measured
`emergeTop` and used it as a `floor` for the *ring*, but the rim was only
limited vertically — a border label could still be placed straight through the
panel's text.

**It was worse than the one region I photographed.** Once measured properly:
**8 of 14 regions** had overlapping labels, at both 1440×900 and 1280×800 —
philosophy, love, behaviour, observation, learning, building, music and food.

Fixed geometrically in `clearPanel()`: the panel's real rectangle is measured
and any label landing inside it is pushed to the nearest clear edge. No rim
mode, region or viewport is named anywhere in the logic, so it holds for labels
added later. Verified by `tools/overlapcheck.js`, which measures real
intersections at multiple viewports and was mutation-tested against the pre-fix
build (15 overlaps caught).

### S2.3 Four regions are effectively unfurnished

MUSIC 0 writings · BUILDING 1 · FOOD 1 · MOVIES 2.

Music is empty on purpose and says so, which is correct and should stay until
material exists. The other three are not empty on purpose — they are thin
because ingestion found little. A region with one writing cannot sustain the
environment built around it.

**This is a content problem and cannot be solved by design.** Per PRODUCT.md,
sparse real content beats dense synthetic content; the honest options are to get
material from Siddhesh, or to state the thinness the way Music does.

---

## S3 — Notable

### S3.1 There is no spacing, duration or easing scale

Every dimension in the file is an ad-hoc `clamp()`. There is no `--space-*`,
`--duration-*`, `--ease-*`, `--radius-*` or `--shadow-*` token. Colour and type
are tokenised; nothing else is.

This is the gap the `design-system-generator` skill exists to close, and it is
why region variation currently has to be hand-tuned per rule instead of composed
from a system. Brief §46 asks for exactly this token set.

### S3.2 Region transitions are a colour cross-fade only

Ground, ink and accent ease between regions per frame — genuinely good, and the
reason a crossing reads as a change of light. But nothing else transitions.
Composition snaps, the rim re-places instantly, type swaps.

Brief §44 asks for environment morphing, neuron persistence through the
transition, spatial reorganisation, relationship lines reforming. Currently only
the first half of that promise is kept. §45 — *the neuron must survive the
transition* — is the part that is already true and should anchor the rest.

### S3.3 Provenance is approximate where it reads as exact

49 of 69 lines are verbatim; 20 are the file's summary of a source. All 69
render identically. The plate byline was corrected this session (`From <src>`
rather than a name), and the colophon now claims only traceability — but a
reader still cannot tell his sentence from the file's.

Resolved by a `verbatim` flag, which needs his judgement per item. Listed in
CONTENT-MODEL.md.

### S3.4 The threshold does not earn its first ten seconds

One static screen: name, subline, "Enter the mind →", with drifting fragments.
It states rather than provokes. Brief §38 wants the visitor to immediately
notice the living graph, the existence of hidden structure, and something they
can act on. Currently the graph is entirely hidden until after a click.

---

## S4 — Polish

- **Contradiction poles are guessed.** The reading page takes the first two
  connected nodes as the two sides. Now labelled by name so nothing false is
  asserted, but a contradiction should declare its poles in the data.
- **`KIND: Writing`** is the label for `t:'thought'` — vague against the precise
  register beside it.
- **`.rel` line repeats the target**, once in mono and once as the heading.
- **Essay paragraphing** relies on splitting `'… '`; any source line using an
  ellipsis mid-sentence would split wrongly.
- **No focus-visible styling on canvas-adjacent controls** beyond the global
  1px outline.

---

## Conflicts between the brief and the shipped build

These need a ruling before implementation. Four of the five are cases where the
brief appears to have been written against a pre-V0.9 snapshot.

| # | Conflict | Evidence | Recommendation |
|---|---|---|---|
| **C1** | Brief §12 lists **13 MIGs and omits SOCIETY** | Build has 14; SOCIETY added in V0.9 by your decision, holds 10 objects incl. 5 writings | **Keep 14.** Deleting a region you asked for, with real content in it, on the strength of an omission, is destructive and not reversible from the brief alone |
| **C2** | Brief §40 names **RevenuePilot** in its example journey | RevenuePilot is one of the two fabricated projects removed in V0.9; `accept.js` fails the build if the string returns | **Do not reintroduce.** The fabrication has resurfaced in the brief itself — exactly the failure mode the anti-fabrication rule exists to catch |
| **C3** | Brief §9 puts **turquoise** in the colour DNA | True turquoise is green-dominant; the enforced check passes only near-neutral or blue-dominant colours | **Keep the check.** Read "restrained turquoise" as deep teal used as material, which is what V0.5/V0.6 settled and what ships in 3 regions |
| **C4** | `Website Rebuild` skill mandates **Astro 5 + Tailwind 4 + npm + Vercel**, "no framework switching" | Project is one self-contained HTML file, no build step, deployed as an artifact whose CSP blocks external hosts | **Use its process, not its stack.** Brief §6 already rules this way: *"the existing project is the source of truth for implementation constraints"* |
| **C5** | Brief §26/§27 offer **GSAP and Three.js** | CSP blocks CDNs, so either must be inlined (~70KB / ~600KB). `frontend-design` skill says prioritise CSS for HTML; brief §60 says remove costly effects with little meaning | **Neither, for now.** No current requirement needs them. Revisit only if a named requirement in P4 cannot be met in CSS/canvas |

---

## What the audit changes about the plan

The brief's instinct is that the site needs to become **more sophisticated**.
The measurements say the two largest gaps are not sophistication at all — they
are **reach** (nobody without a mouse can use it) and **shape** (the graph is
too sparse to loop). Both are invisible in a screenshot, which is precisely why
seven iterations of screenshot-driven work did not surface them.

Sophistication is real work and it is in the plan. It is phase four, not phase
one.
