# DESIGN.md — the visual and interaction system

The persistent design context. Read with [PRODUCT.md](PRODUCT.md).
Per-region specifications live in [MIG-SYSTEM.md](MIG-SYSTEM.md).

---

## 1. The three constants

Everything else may vary per region. These three may not, and each is enforced
by `tools/accept.js`.

### 1.1 The neuron

One `shape()` routine, one edge path, one label treatment, for the whole site.
No per-world overrides — the acceptance suite fails the build if a world config
contains a `node` or `edge` key.

| Object | Mark |
|---|---|
| MIG | double halo |
| minor IG | filled dot (+ ring when `g:1`) |
| thought | filled dot |
| belief | hollow circle |
| question | open diamond |
| project | solid square |
| experiment | crosshair |
| contradiction | two rings, accent |
| person | concentric |
| reference | bar |

The metaphor: **same mind, different mental climate.** The neuron is the mind.
The environment is the climate. Redesigning the neuron per region would say the
person changes between subjects, which is the opposite of the thesis.

### 1.2 The document

A reading page is a **file you take off a shelf**, not a place you stand in.
Fixed type, ruled margins, a running head, numbered sections, a folio. It is
identical in all fourteen regions — it inherits only their colour. No world may
restyle `.doc`, `.docplate`, `.docbody`, `.dochead`, `.docfoot`, `.pline` or
`.note`.

### 1.3 The colour family

Blue · white · black · grey, treated as a spectrum rather than four swatches.
46 shades currently in use.

**The rule, exactly as enforced:** every hex and `rgb()` literal in the file must
be either near-neutral (`max−min ≤ 14`) or blue-dominant (`b ≥ r`, `b ≥ g`,
`b − r ≥ 8`). Anything warm fails the build.

Teal is **material, not accent** — permitted in exactly three worlds (behaviour,
food, love) and only as a `tone`, never as a UI accent.

> **Note against the V1.0 brief §9.** The brief lists "turquoise" in the colour
> DNA. True turquoise is green-dominant and would fail the enforced check.
> "Restrained turquoise" is kept as *deep teal used as material*, which is what
> V0.5/V0.6 settled on and what ships today. Do not add a green-dominant accent
> without changing the check first, deliberately.

The retired V0.1–V0.4 identity (`#C4432B` oxidised red, `#E9E5DA` ivory) is
asserted never to return.

---

## 2. Tokens

### 2.1 Global palette

```
--black #05070A   --near #080B11   --slate #101725   --graphite #222833
--navy  #0B1626   --deep #132239   --blue #4C8DFF    --blue-dim #2C5FA6
--pale  #A9C4E8   --white #FFFFFF  --off  #EEF1F5    --grey #A5AFBD
--grey-2 #6C7686
```

### 2.2 Per-region tokens (reassigned when a region is entered)

```
--env        the ground
--ink        primary text
--ink-2      secondary text
--ink-3      tertiary / apparatus
--line       hairlines and rules
--accent     the region's blue
--accent-soft
```

Regions consume tokens. A region must never hard-code a colour.

### 2.3 Type

```
--display    'Iowan Old Style','Palatino Linotype','Book Antiqua',Palatino,Georgia,serif
--body       -apple-system,'Segoe UI Variable Text','Segoe UI',Roboto,Arial,sans-serif
--mono       ui-monospace,'Cascadia Mono','Cascadia Code',Consolas,'SF Mono',monospace
--doc-serif  Georgia,'Iowan Old Style','Times New Roman',Times,serif
```

**No webfonts, ever.** The artifact CSP blocks font CDNs and a linked font fails
*silently* — the page renders in a fallback and nothing reports an error. System
stacks only.

`--display` is the regions' voice: large, tight, atmospheric.
`--doc-serif` is the document's voice: a text face, set at reading size.
They are deliberately different faces (Palatino vs Georgia) so a reading page
can never be mistaken for a region page. Enforced: a region's title must be at
least **1.8×** the document's largest type.

### 2.4 Spacing

`--gut: clamp(20px, 4vw, 64px)` is the page gutter. Everything else is set in
`clamp()` against viewport units — there is no step scale, and adding one is a
task in the rebuild plan.

---

## 3. The honesty rules, made typographic

These are not stylistic preferences. They are the mechanism that keeps the site
trustworthy, and they are checked.

| Rule | Mechanism |
|---|---|
| Source material may be set in serif. Nothing else. | `voice(n)` returns `his` only when `n.src` exists |
| The file's own prose is sans, always | `.note`, `.lnk .why` use `--body` |
| A writing is credited to its **source**, never given a byline | plate renders `From <src>` |
| A quotation that is not his says so, in accent, on its own title page | `Not his words · SENECA` |
| A joke can never render as a conviction | `register` shown beside `state` everywhere |
| An unsourced object is visibly scaffolding | no `src` → no serif |

---

## 4. Motion

Motion communicates causality, hierarchy, attention, transformation, discovery
and continuity. It does not decorate.

- Per-region `ease` (settling speed) spans 12× — Life `.028`, Movies `.34`.
- Per-region `sway`: `0` (still), `[amp, period]`, `'beat'`, or `'breathe'`.
- Crossing a region cross-fades ground, ink and accent per frame — a crossing is
  a change of light, not a repaint.
- Environments drop to `0.55` alpha while a writing is being read. Five react
  specifically to the focused concept.
- `prefers-reduced-motion` collapses all transitions to `0.001ms`.

**Banned:** perpetual floating, random parallax, meaningless particles, bounce,
gratuitous zoom, every element fading in independently.

**Currently hand-rolled.** No animation library ships. Adding GSAP means inlining
it (~70KB) because the CSP blocks CDNs, and the frontend-design skill itself says
to prioritise CSS for HTML. Do not add it without a named requirement that CSS
cannot meet.

---

## 5. Composition

`WORLDS[id]` declares, per region:

```
anchor  [x,y]   where the focus sits — only ONE region may be dead centre
rim     how the other regions wait: ellipse | edge-left | edge-right |
        bottom-row | horizon | margins | docked
env     background painter
ring    how its minor IGs arrange
ground / ink / accent / tone    rgb triples, eased per frame between regions
ease    settling speed
sway    ambient motion
dens / gapY / padTop / paper
```

Enforced: ≥9 distinct anchors, ≥5 rim modes, ≥12 ring arrangements, ≥9 distinct
ease rates, ≥3 light-ground regions, every region's ground distinct, every
region's ink legible on its own ground (luminance delta > .45).

---

## 6. Accessibility

**Stated policy: if an effect cannot coexist with accessibility, accessibility
wins.**

**Current reality: the policy is not met.** The graph — 143 nodes, 126 edges,
the entire navigation system — is a `<canvas>` with three mouse listeners and no
keyboard or assistive-technology surface at all. There are 0 `tabindex`
attributes and no `nav`/`main` landmarks. A keyboard-only or screen-reader
visitor can reach the threshold, the reading page and nothing else.

This is the single largest gap between what this project claims and what it
does, and it is the first item in the rebuild plan. The fix is a parallel DOM
layer, not a canvas rewrite — see [REBUILD-PLAN.md](REBUILD-PLAN.md) P1.

---

## 7. Responsive

**Desktop is not the source of truth.** The graph must be *recomposed* for small
screens, not scaled.

Required test widths: 320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 ·
ultrawide.

Two traps already paid for:
1. **A missing viewport meta** made every local mobile check render at a 980px
   fallback, so the phone CSS never engaged. It is now present.
2. **Headless Chrome clamps its window to ~500px** while still writing a
   375px-wide screenshot, which looks exactly like a clipping bug. Verify true
   phone widths over a local server with device emulation, not `--window-size`.

---

## 8. Performance

Single self-contained HTML file. No framework, no build step, no dependency, no
network request at runtime. This is a deliberate strength, not a limitation to
grow out of.

Known constraint: heavy per-frame canvas work starves headless capture and weak
hardware. Radial-gradient fields are cached to an offscreen canvas for this
reason. Any new per-frame cost must be cached or budgeted.

If an effect costs significant performance and contributes little meaning,
remove it.

---

## 9. Verification

No structural claim about this project is made by eye.

```bash
node tools/validate.js preview.html && node tools/accept.js preview.html
```

`validate.js` — ownership, leaks, relationship contract, region reachability.
`accept.js` — 107 checks across the neuron constant, the worlds, the document,
navigation, palette, content integrity and restraint.

**Test the tests.** This project has shipped four tests that fired on the wrong
thing, which is worse than no test. Any new check must be mutation-verified:
deliberately break the rule and confirm the suite catches it.
