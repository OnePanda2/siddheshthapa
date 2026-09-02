# REBUILD-PLAN.md — V1.0

Follows [DESIGN-AUDIT.md](DESIGN-AUDIT.md). Nothing here is implemented yet;
brief §52 and §67 require the audit and plan to land before code.

**Sequencing principle.** Reach and shape before sophistication. An inaccessible,
sparse graph rendered beautifully is still an inaccessible, sparse graph — and
both defects are invisible in the screenshots that have driven the last seven
iterations.

---

## P0 — Rulings · **SETTLED 2026-08-15**

| | Question | Ruling |
|---|---|---|
| C1 | 13 regions or 14? | **Keep 14.** SOCIETY stays; the brief is stale |
| C2 | RevenuePilot in brief §40 | **Stays removed** — fabrication, build blocks it |
| C3 | Turquoise vs the blue-dominant check | **Keep the check**; teal as material only |
| C4 | Astro/Tailwind/Vercel | **Keep the single file** (brief §6) |
| C5 | GSAP / Three.js | **Neither** until a requirement demands one |
| — | Thin regions | **State the thinness honestly** *and* **shrink their footprint** |

Still open, shapes P6:
- The `verbatim` flag — 20 of 69 lines are the file's summary rather than his
  words. Marking them needs his judgement per item.
- Whether material will arrive for BUILDING, FOOD, MOVIES, MUSIC.

The thin-region ruling adds work to **P5**: MUSIC, BUILDING, FOOD and MOVIES get
a reduced presence on the global map so the composition matches what is actually
behind them, plus MUSIC's honest-emptiness treatment extended to the other
three.

---

## P1 — The accessibility spine · **S1.1** · **SHIPPED 2026-08-15**

Done. The canvas is now the *view*; structure lives in a parallel focusable
layer built from the same `ring1`/`ring2`/`rim` sets the canvas draws, so there
is no second source of truth to drift.

- Skip link → named `nav` landmark → `role="status"` live region.
- Canvas marked `aria-hidden` — it is a picture of the structure, not the
  structure.
- Roving tabindex: the map is **one** tab stop, not 143. Arrow keys walk the
  current view — where you are, what it connects to, then the ways out — which
  is the site's own thesis expressed as a keyboard model.
- The canvas rings whatever holds DOM focus, so a sighted keyboard user is not
  moving an invisible cursor.
- Closed panel, closed reading page and crossed threshold now leave the tab
  order (they hid with `opacity` alone, so focus walked into invisible buttons).

Verified by driving the full journey with keyboard only — threshold → map →
region → writing → reading page → back. 18 new checks, all mutation-tested;
two shipped blind on the first attempt (matching text outside the function they
policed) and were re-scoped to the function body.

**Left for later:** the reading page's internal focus order and a focus trap
while the dialog is open; touch handlers land with P3.

---

### P1 as originally planned

The largest architectural change, and first because it changes who owns
selection state.

- Add a parallel DOM layer over the canvas: a landmark-wrapped, focusable list
  of the current view's nodes and their relationships.
- Canvas rendering becomes a *view* of that state, not the owner of it. Focus
  and selection are one thing, expressed twice.
- Arrow keys move between neighbours *along relationships* — which is the site's
  own thesis expressed as a keyboard model, not a bolted-on tab order.
- Every node gets an accessible name carrying kind, region and state; every edge
  its verb and gloss.
- `nav` and `main` landmarks; skip link to the graph.
- Screen-reader announcement on region change.

**Done when:** the full journey from threshold → region → concept → writing →
reading page → back is completable with a keyboard alone, and a screen reader
can enumerate what is connected to what. New acceptance checks, mutation-tested.

## P2 — The token system · **S3.1**

Close the gap the `design-system-generator` skill exists to close, and the
prerequisite for composing region variation instead of hand-tuning it.

- `--space-*`, `--duration-*`, `--ease-*`, `--radius-*`, `--shadow-*`,
  `--blur-*` scales.
- Migrate the ad-hoc `clamp()` values onto the scale, keeping current rendered
  values within a pixel or two so nothing shifts visually.
- Add an environment-profile block per region (density, material, motion,
  contrast, temperature, accent) as brief §47 specifies, so a region is
  *declared* rather than hand-written.

**Done when:** a new region can be specified as a profile and inherit correct
composition without writing bespoke CSS.

## P3 — Mobile recomposition · **S1.2**

Not a scaled desktop. A different spatial model that preserves the mental one.

- Region view on a phone: the graph becomes a navigable radial/list hybrid where
  ownership and crossings stay legible at 375px.
- Touch targets ≥44px; the canvas gets touch handlers, not just mouse.
- Test matrix: 320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · ultrawide,
  over a local server with real device emulation — never `--window-size`.

**Done when:** the six orientation questions in PRODUCT.md are answerable at
375px, and the graph is genuinely usable rather than merely rendered.

## P4 — PHILOSOPHY as the laboratory · brief §53

The richest region (14 writings) and currently only "moderate" in composition.
Take one region to a standard the others will be measured against: density,
type, marginalia, fragment behaviour, hover, selection, transition, reduced
motion, keyboard, phone.

**Critical constraint, brief §54:** what gets extracted afterwards is
**infrastructure, not appearance**. Philosophy's environment stays unique. If
another region ends up looking like Philosophy, this phase failed.

### Increment status

| # | Increment | Status |
|---|---|---|
| P4.1 | Authenticity — invented fragments removed, layer fed from `n.src` | **LOCKED** |
| P4.2 | Attention — `fragWeight` by graph distance, four type tiers | **LOCKED** |
| P4.3 | Fragments are doorways — `fragHits` resolved by id | **LOCKED** |
| P4.4 | Editorial grid — `philZones`, columns, obstacles subtracted | **LOCKED** |
| P4.5 | Contradiction as an axis — `polesOf`, measured dignity/opposition | **LOCKED** |
| P4.6 | Expanded marginalia — source + destination, all authentic | **SHIPPED 2026-08-17** |
| P4.7 | Compositional rebirth — the graph field made habitable | **SHIPPED 2026-08-19** |
| P4.8 | Transitions in / out | not started |
| P4.9 | Mobile Philosophy climate | not started |
| P4.10 | Impeccable audit of the complete environment | not started |

**P4.7 as shipped.** The root cause of "a diagram with text beside it" was
structural: `philZones()` derived every editorial band as the COMPLEMENT of the
graph zone, so writing was forbidden from approaching a neuron. The field is now
sampled for slots clear of the labels, the panel and the margins, and quiet
writing settles among the neurons — 4–7 fragments inside the graph at 1440,
7–13 at 2560. The dominant voice WRAPS to a measure instead of being cut to
death (`We divided knowledge for the sake of understanding it, but we shouldn't
let those divisions limit our…` now reads at 54px over two lines at 2560, where
it was one truncated 30px line). A neutral grain, rendered once per viewport and
blitted, gives the ground a surface. Nothing was invented: every enlarged
sentence is a real writing, and where there is no room the layer shows less
rather than filling space.

**P4.6 as shipped.** Every mark re-states a real field: the writing's own
`n.src` in the right margin, and stacked with it the region a real cross-region
edge reaches. The invented apparatus (twelve footnote numbers, seven "cf. N"
references, nine arbitrary rules) is gone and cannot return — `accept.js` has
nine structural guards and `tools/marginaliacheck.js` re-derives every painted
mark from the record it claims, at ten widths. Placement is decided for the
PAIR: a source mark with no destination beside it is indistinguishable from a
thought that leaves the region nowhere, so if the margin cannot hold both it
holds neither. Marginalia is not interactive — fragments remain the doorways,
proven by probing the site's own hit tests at each mark's centre.

## P5 — The remaining thirteen · **S2.1**

Raise the five colour-only regions (Food, Building, Learning, Human Behaviour,
Love) to genuine composition, using the P2 profiles and the P4 infrastructure.

Explicitly rebalance effort toward content: LIFE (12 writings) and SOCIETY (5)
get real composition work; MUSIC's 1,330 characters of composition for zero
content is not extended further until material exists.

**Done when:** all fourteen pass the §35 test — recognisable without reading the
title — and the differentiation table in `MIG-SYSTEM.md` no longer inversely
correlates with content.

## P6 — Graph density · **S2.2**

The highest-leverage content work in the project, and the one that most directly
serves the north star.

- Convert the 19 dead-end writings into junctions by adding well-argued
  relationships. `MIND-MAP.md` lists them.
- Every new edge needs a semantic verb and a first-person gloss ≥25 characters,
  in the edge's own direction. **No "related to" edges.**
- Target mean writing degree ≥3.0 and zero writings with a single edge.
- Contradictions declare their two poles explicitly rather than the reading page
  guessing from the first two neighbours.

**This needs Siddhesh in the loop.** A gloss is a first-person claim about why
two of his ideas connect; the file inventing 40 of them would be exactly the
fabrication the project has already been burned by once.

## P7 — Transitions · **S3.2**

Extend the crossing from colour to composition: rim re-placement, ring
re-arrangement and relationship lines reforming as a staged sequence, with the
neuron persisting through it (§45 — already true, and the anchor for the rest).

Hand-rolled unless this phase produces a specific requirement CSS and canvas
cannot meet. That is the only condition under which C5 reopens.

## P8 — Impeccable pass · brief §56

Run the audit method against the finished build, asking its questions rather
than "does this look good": what is generic, what is accidental, what is
over-designed, where is hierarchy weak, where is cognitive load excessive, which
regions still feel too similar, what looks AI-generated.

Then the craft pass — optical alignment, animation interruptibility, enter/exit
continuity, line lengths, perceived responsiveness.

## P9 — QA and deployment

Functional · visual · performance · accessibility QA. Then real deployment to
siddheshthapa.com, which has been outstanding since V0.5 and is the only item
here that makes the work public.

---

## Sequencing

```
P0  rulings ─────────────────────────► blocks everything
P1  accessibility spine ─────────────► blocks P3, P4
P2  tokens ──────────────────────────► blocks P5
P3  mobile ──┐
P4  philosophy laboratory ───────────► blocks P5
P5  remaining regions ───────────────► blocks P8
P6  graph density  (parallel, needs Siddhesh)
P7  transitions
P8  impeccable + craft
P9  QA + deploy
```

P6 runs in parallel with everything from P1 onward because it is content work
gated on Siddhesh, not on code.

---

## What I am not doing

- Not migrating to Astro/Tailwind/Vercel. Brief §6 rules the existing stack is
  the source of truth; the artifact target makes a build step actively harmful.
- Not adding GSAP or Three.js speculatively. Brief §27 and §60 both argue
  against it and no requirement currently needs either.
- Not reintroducing RevenuePilot.
- Not deleting SOCIETY on the strength of an omission.
- Not inventing relationship glosses, region content, or the missing MUSIC,
  FOOD, BUILDING and MOVIES material.
- Not rewriting the neuron, the ownership rule, the relationship contract or the
  document layer. They work, they are enforced, and the brief agrees (§8, §45).
