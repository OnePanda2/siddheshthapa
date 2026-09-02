# CONTENT-MODEL.md — the schema and its rules

The data contract. [MIND-MAP.md](MIND-MAP.md) is generated from the live data;
this file defines what the fields mean and what may not be violated.

---

## The three tiers

```
WORLD                        neutral global map, no region active
  └── MIG                    Major Intellectual Gravitational centre   (14)
        └── MINOR IG         a major concept, owned by exactly one MIG (60)
              └── WRITING    the actual material                       (69)
                    └── READING PAGE   its own full-screen document
```

143 nodes, 126 relationships.

---

## The ownership rule

Added in V0.4. It is the rule that makes the map readable, and the validator
fails on any violation.

- Every non-MIG node declares exactly one owner: `n.mig`.
- It also declares `n.crosses = []` — other MIG ids it reaches.
- **A MIG environment shows only what it owns.** Crossings surface through a
  "this idea crosses into…" affordance *after* a selection, never in the opening
  view.
- A MIG holds no member list. Ownership is declared upward, by the member.

> **Historical trap.** MIGs use `x`/`y` as layout coordinates. Minor IGs
> originally used `x` for crossings, and the layout pass silently overwrote it,
> destroying every crossing at load. The field is named `crosses` for this
> reason. Do not reintroduce `x` on a non-MIG node.

---

## Node fields

```js
{
  id,        // stable slug; appears as "Ref." in the document footer
  t,         // type — see below. MIGs and minor IGs are implied by their array
  label,     // uppercase title; NOT necessarily his words
  mig,       // the single owning region
  crosses:[],// other regions this reaches
  state,     // where it is in its life
  register,  // what KIND of statement it is
  src,       // which document it came from
  line       // the material itself
}
```

### `t` — type

`belief` · `thought` · `question` · `contradiction` · `project` · `experiment`
· `person` · `reference`

Counts: 16 belief, 31 thought, 2 question, 6 contradiction, 5 project,
2 experiment, 1 person, 6 reference.

### `state` — where it is in its life

| state | meaning |
|---|---|
| `seed` | written down before it was worked out |
| `growing` | still being added to; shape not final |
| `formed` | settled enough to state plainly, not closed to argument |
| `tested` | put into practice rather than only asserted |
| `proven` | has held up in practice over time |
| `changed` | an earlier version was held and is not any more |
| `open` | unresolved on purpose |

This vocabulary is **the file's**, not his. The reading page states it as the
file's classification, never as something he said.

### `register` — what kind of statement it is

Free text, 38 values in use. This field exists so a joke can never be read as a
conviction. Examples that carry real weight:

`belief` · `joke — not a belief` · `heuristic — not a law` · `quote — not mine`
· `long-form essay` · `unfinished thought — left blank on purpose` ·
`analogy — not a full economic account` ·
`social observation — not a psychological law` ·
`philosophical proposition — generalised` · `method — product details withheld`

Registers containing a disclaimer after an em-dash are doing safety work. Never
simplify one away.

### `src` — provenance, not authorship

Names the document a line was drawn from:

| id | document | note |
|---|---|---|
| S1 | Master Context.pdf | 32-section cognitive/philosophical profile |
| S2 | Master Context Prompt.docx | near-duplicate of S1; corroboration only |
| S3 | Siddhesh Thapa.pdf | CV |
| S4 | Siddhesh Thapa.rtf | **richest** — ~51 verbatim originals |
| S5 | github.com/OnePanda2 | 17 repos |

**`src` means traceable, not verbatim.** Cross-matched against
`content-inventory.json`, which records a `quote` field for verbatim material
and `detail` for facts: **49 of 69 lines are verbatim, 20 are the file's summary
of a source.**

The 20 non-verbatim: all 6 contradictions, all 5 projects, both experiments,
`feynman`, `t-wasted`, `t-magicians`, `t-disagree`, `t-rigidity`,
`t-justification`, `p-website`.

**Open decision.** Adding a `verbatim` flag would let the page set the other 20
in the file's sans voice, making the serif/sans split literally true rather than
approximately true. This requires Siddhesh's provenance judgement per item and
must not be guessed.

**No `src` = not his writing.** The 60 minor IGs are structural scaffolding and
carry none. That absence is the honesty signal, and it is machine-checkable.

---

## Relationships

```js
[ fromId, toId, verb, firstPersonGloss ]
```

- The verb is **semantic**, never "related to": interrogates, contradicts,
  operationalizes, complicates, emerged from, resembles, challenges, reinforces,
  evolved into, depends on, formalized as, resists, poorly proxies…
- The gloss answers *why this edge exists* and must be ≥25 characters.
- **Direction is load-bearing.** Always render in the edge's own direction.
  V0.2 shipped a bug where verbs rendered from the reader's side, inverting the
  claim (`philosophy → value` displayed as "VALUE INTERROGATES PHILOSOPHY").
- No duplicate pair, no inverted duplicate, no self-loop. Checked.
- Glosses are **editorial**, not sourced — they are set in sans on the reading
  page for that reason.

---

## Invariants (enforced)

| Rule | Where |
|---|---|
| Every non-MIG node has exactly one valid owner | validate.js |
| No MIG shows another MIG's minor IG | validate.js + accept.js |
| A node may not list its own MIG as a crossing | validate.js |
| Every furnished MIG has ≥4 minor IGs (music exempt) | both |
| Every node has ≥1 relationship | validate.js |
| Every MIG is enterable and leavable | validate.js |
| Every relationship keeps verb + gloss ≥25 chars | both |
| No inverted duplicate relationship | both |
| `RevenuePilot` / `FlowMail` never return | accept.js |
| MUSIC stays empty rather than invented | accept.js |
| No object or gloss names a political party or a faith | accept.js |

---

## The anti-fabrication rule

Never invent a belief, project, memory, preference or opinion. If unclear, mark
`NEEDS REVIEW` in `content-inventory.json` and leave it out of the build.

Earlier versions invented **RevenuePilot OS** and **FlowMail** and presented them
as his projects across seven iterations and four design-record PDFs.

> The V1.0 rebirth brief §40 still names RevenuePilot in its example journey.
> That is the fabrication resurfacing in the brief itself. It must not be
> reintroduced; the build fails if the string returns.

---

## Held and blocked material

Catalogued but **not published** — see `editorial-register.md`:

- "both BJP and Congress have betrayed the country" — names parties
- religion-and-gullibility litmus test — reframe drafted
- "terrorism has a religion and it's extremism" — reframe drafted
- "40% tax, 0% facilities" — unsubstantiated
- "F buddha" wording — proposition acceptable, wording not
- "rather be a bully than be bullied" — reputational
- Dostoevsky + Hitchens quotes — attribution unverified

**Blocked:** the defence startup. No operational detail, no specifications, no
tactical information, NDAs respected. Only the design method is publishable, and
it already is (`m-design`, register `method — product details withheld`).
