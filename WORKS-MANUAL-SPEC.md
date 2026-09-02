# WORKS-MANUAL-SPEC

MY WORKS is **the operating manual for the six things Siddhesh has built.** Six
sheets, one per work, in the register a manual uses: purpose, parts, procedure,
known failures, see also.

It is not a portfolio and not a gallery. A portfolio shows you the outside of
a thing; a manual shows you how it works and what breaks.

This document is written before the code and is the thing the code is judged
against. Where a detail is not fixed here, it is a decision to be made by
looking at a render, not by argument.

---

## 0. Why a manual, and why not the other four

Four other directions were mocked up and rejected. The reasons are recorded so
they are not re-argued later.

**The constraint that decided it: the works are not photogenic.** Three are
public repositories, one is this site, one is a skill, one is a career. There
is nothing to photograph. Every format that leads with an image — gallery,
case-study grid, showreel — starts by asking these six objects for the one
thing they cannot give.

A drawing does not need a photograph. It needs a **mechanism**, and all six
have one.

**The second reason: everything here is already a procedure.** COTSI is
"diagnose before teaching". The skills repo is codified procedures. The
automation repo is procedures. The positioning work is a procedure applied to a
sentence. The manual is not a costume over the work; it is the work's own
shape.

**The third reason: failure gets a home that is not a confession.** Manuals
list failure modes as routine engineering. A `KNOWN FAILURES` section can be
honest without the apologetic register that ruins most "here is what went
wrong" writing.

Rejected, with what was taken from each:

| Direction | Why not | Kept |
|---|---|---|
| Machine Room | Needs a runnable mechanism per work; three of six have none | **One** operable figure — COTSI's diagnostic |
| Evidence Table | Museum framing needs objects worth staring at, and its strongest move, an abandoned tray, is currently empty | Provenance discipline in the title block |
| Ledger | Requires honest figures the corpus does not contain | A two-column cost/return **block**, not a section |
| Revision | Needs a genuine "before" per work; exists for one | The before/after **toggle** where both exist |

---

## 1. The rule that governs every word on a sheet

Three tiers, and nothing may cross between them.

**Tier 1 — derived.** Anything the graph already declares. A sheet reads it by
node id and never restates it: `label`, `line`, `src`, `state`, `register`,
`mig`, and every relationship in `EDGES`. `preview.html` is locked
(sha256-16 `a86e4deb12e0a496`) and remains the source of truth for content.

**Tier 2 — declared.** What a manual needs and the graph does not carry:
purpose, parts, procedure steps, known failures, figure key. These live in
`data/works.json`, are authored by hand, and are injected at build time.

**Tier 3 — forbidden.** Everything else. No invented failure, no plausible
step, no reconstructed timeline, no number that is not in a source.

The tiers are not a style preference; they are what makes drift impossible. A
sheet that restated a label would let the manual and the mind disagree about
the same object. **A check asserts that no Tier-2 record contains a Tier-1
field name** — the schema makes the mistake unrepresentable rather than
discouraged.

---

## 2. What a sheet is

```
data/works.json
{
  "version": 1,
  "sheets": [
    {
      "node":     "p-cotsi",              // must exist, must be mig:'my-works'
      "purpose":  "...",                  // one paragraph, present tense
      "parts":    [ { "n":1, "name":"trigger", "note":"..." }, ... ],
      "procedure":[ "...", "..." ],       // 4-6 imperative steps
      "knownFailures": [ { "name":"...", "note":"..." } ],
      "figure":   "diagnostic-before-generation",   // key, or null
      "authority":[ "source-text/Siddhesh Thapa (rtf).txt §12" ]
    }
  ]
}
```

`authority` is not decoration. Every Tier-2 field must be traceable to a source
the project holds, and the sheet prints it in the title block. A sheet whose
`authority` is empty may not carry a procedure.

**Sheet numbering is derived**, never typed: `SHEET n OF m` where `m` is the
count of `my-works` projects in the graph. Adding a seventh work renumbers the
manual with no edit to any sheet.

---

## 3. The six sheets, and what is actually missing

Measured from `preview.html`, not assumed. Edge counts are real relationships
already declared.

**All six are now written.** The table below is what was true when this spec
was drafted, kept because two of its predictions were wrong in a way worth
recording.

| # | Work | Predicted | What happened |
|---|---|---|---|
| 1 | COTSI | buildable from `source-text` §12 | built; known failures came from the same source |
| 2 | SIDDHESHTHAPA.COM | it documents itself | built; four known failures, all from `CHECKPOINT.md` |
| 3 | THREE YEARS ACROSS STARTUPS | buildable, no failures available | **wrong** — §13 and §14 held two, both costly |
| 4 | CLAUDE-SKILLS | thin: only its own quoted line | **wrong** — reading the repository gave seven parts |
| 5 | STATELAB | nothing to write | Siddhesh wrote it; one part-written sheet |
| 6 | AUTOMATION PORTFOLIO | nothing to write | reading the repository gave five parts and a README |

The two wrong predictions have the same cause: **the spec assumed the corpus
was the only source.** Three of the six works are public repositories, and
reading them turned two "thin" sheets into two of the fullest. A work that
looks undocumented may only be undocumented *here*.

Both of those lines have since been replaced, because both were made false —
STATELAB by Siddhesh writing the description, AUTOMATION PORTFOLIO by its
repository gaining a README. The replacements are declared in `V02_OVERLAY`
next to the sentences they replace.

The rule that produced this outcome stands unchanged: **a work with nothing
true to say stays reserved, and is never solved by writing plausible text.**

**Latent sheets.** A work with no authored procedure renders as a **numbered,
titled sheet stamped NOT YET WRITTEN**, carrying only its derived tier: the
line, the source, the state, the relationships. It is not hidden and it is not
padded. This is exactly how MUSIC and PSYCHOLOGY are handled in the mind, and
the honesty reads as confidence rather than absence — a manual with a sheet
reserved for a part not yet documented is a real manual.

Sheets 1–3 are buildable today. Sheet 4 is buildable thin. Sheets 5 and 6 are
latent until Siddhesh writes them.

---

## 4. Visual grammar

The inverse of the mind on every axis that matters. The mind wonders in the
subjunctive; the manual instructs in the imperative.

| | Mind | Manual |
|---|---|---|
| ground | deep space | paper |
| motion | continuous drift | none; the page is still |
| order | non-linear wander | numbered, sequential |
| extent | infinite | *sheet 2 of 6* |
| register | unresolved | instruction |

**Palette.** Paper `#E9E9E4`, ink `#1A1D1F`, hairline `#B9BCB6`, one spot red
`#9A2A1F`. The red is load-bearing and rationed: part numbers, step numbers,
the state stamp, the `KNOWN FAILURES` headings. It appears nowhere else.

**Type.** One face — a monospace — for the entire sheet, at three sizes: 26px
title, 13px body, 10.5px labels at `.17em` tracking. A manual set in one
typewriter face is more convincing than one set in two well-paired ones.

**Title block.** Bottom rule of every sheet, in the position a drawing puts it:
`SHEET n OF m` left, `SOURCE — <src>` right, both derived.

**The state stamp.** Top right, ruled box, rotated 3°, in the spot red,
printing the graph's own `state` word — `FORMED`, `GROWING`, `SEED`, `PROVEN`.
Not a re-categorisation; the same vocabulary the mind uses.

---

## 5. The figure

One orthographic diagram per sheet, hand-authored inline SVG, keyed by name.

Rules:

1. **Parts are numbered, and the numbers match `parts[].n`.** A check asserts
   this; a figure that has drifted from its parts list is a defect, not a
   variation.
2. **No perspective, no shading, no colour** except the spot red on part
   numbers. Boxes, hairlines, leader lines.
3. **Exploded is a state, not a decoration.** Assembled shows the mechanism;
   exploded separates the parts and reveals the leader lines. It is the only
   motion in the section, it is user-initiated, and it respects
   `prefers-reduced-motion` by snapping.
4. **A sheet with no figure gets a ruled-off block, not a placeholder.** An
   empty frame that says "diagram to come" is worse than a clean rule.

COTSI's figure is the exception that earns extra: its four parts are the
mechanism, and **the diagnostic is operable** — three yes/no questions that
change which milestones the generated course strikes through. It is the single
most convincing thing the section can contain, and it costs one small
state machine.

---

## 6. The night strip, and the way back

At the foot of every sheet, a band of the mind's night — the only dark on the
page, and roughly a tenth of it. This is the whole of the 10–20% hint, and it
is not a tint: it is a **door**.

**Its contents are derived from real edges.** Every work already carries 2–4
declared relationships with a verb and a sentence:

```
['b-tutor','p-cotsi','built as','Diagnostic questions first, yes/no and
 multiple choice only, then a course from the actual level.']
```

so COTSI's strip reads `A GOOD TUTOR DIAGNOSES BEFORE TEACHING — built as —`
and steps into the mind at that node. Nothing is authored, nothing can be
fabricated, and the sentence shown is the one the graph already holds.

Clicking a strip entry **closes the manual, enters the mind, and travels to
that node.** That is the section's only outbound route, and it is the sentence
the whole site is built to earn: *the works are where the thinking landed, and
this is the way back up.*

Carried over from the mind, and nothing else: the monospace label voice, the
hairline weight, provenance discipline, and this strip.

---

## 7. Structure and navigation

`PRODUCT.md` requires a visitor to answer six questions at all times. The
manual answers them structurally.

- **Where am I** — a contents page first: six numbered sheets, their states,
  their sources. Not a splash.
- **What can I interact with** — sheet links, the explode control, the
  diagnostic, the strip.
- **What is this connected to** — the strip, on every sheet.
- **What happens if I click** — sheets scroll; the strip leaves for the mind.
- **How do I get back** — a persistent return control, Escape, and browser
  back. Escape from a sheet goes to contents; Escape from contents goes to the
  threshold.

**It is a layer, not a page.** `#works` sits above the canvas exactly as
`#reader` does, with the same `visibility`/`opacity` pattern. Consequences,
all of them good:

- the 3D scene is untouched and **paused** while the manual is open — the
  renderer already supports idling at zero renders;
- `worksBtn` on the threshold opens it directly and **does not enter the
  mind**, which is what its current placeholder does;
- deep links `#works` and `#works:p-cotsi` land inside it.

**The manual and the mind are never both open.** Asserted, not assumed.

---

## 8. Phone

Single column below 760px. The two-column purpose/parts grid collapses in
declared order — purpose, parts, procedure, known failures — because that is
the reading order of a manual, not a layout convenience.

The figure gets its own `overflow-x: auto` container and is the only thing on
the page permitted to scroll sideways. The body never does.

Type does not shrink below 13px body / 10px label. If a sheet cannot fit, the
sheet is too long.

---

## 9. Where it lives in the build

```
src/v02-works.js      the manual: contents, sheets, figures, the strip
src/v02-shell.html    one new layer, #works, and its styles
data/works.json       Tier-2 content, injected at /*__WORKS__*/
tools/build-v02.js    one read, one replace, same guard
```

The injection follows the astronomy precedent exactly: *"the astronomy is
INJECTED from the researched dataset, never retyped into the app."* If
`works.json` changes, the manual changes; the app holds no copy of its content.

`preview.html` is not touched. The existing external-reference guard in the
build still applies — the manual loads nothing.

**Weight.** The artifact is 912KB, of which 594KB is three.js. The manual is
DOM and inline SVG: budget **40KB** for the layer and its six figures. It buys
no new library.

---

## 10. What must never happen

1. **No invented content.** No failure, step, metric or date that is not in a
   source. `data/works.json` carries `authority` for exactly this reason.
2. **No restating the graph.** A sheet that types a label has created a second
   truth.
3. **No padded sheet.** A latent work stays latent. Six honest sheets, two of
   them reserved, beats six sheets of equal length where two are filler.
4. **No cosmic tint.** The night strip is the entire borrowing. No stars behind
   the paper, no gradient, no drift.
5. **No screenshots.** If a work can only be shown by photographing it, this is
   the wrong section for it.

---

## 11. How it is verified

A new suite, to the standard the rest of the project holds: assertions that
measure the live DOM, and a mutation for each that must make it fail.

| id | assertion |
|---|---|
| W1 | every sheet's `node` exists and belongs to `my-works` |
| W2 | no sheet record contains a Tier-1 field name — drift is unrepresentable |
| W3 | `SHEET n OF m` is derived: m equals the graph's project count |
| W4 | every strip entry is a real edge in `EDGES`, with its declared verb |
| W5 | a work with no procedure renders stamped NOT YET WRITTEN, never empty |
| W6 | figure part numbers match `parts[].n`, one for one |
| W7 | opening the manual pauses the scene; closing restores the camera |
| W8 | manual and mind are never open together |
| W9 | Escape returns: sheet → contents → threshold; focus lands on the door |
| W10 | no two labels overlap and nothing is clipped, at all six matrix widths |

W10 reuses the measurement already written for the mind's labels — parsed from
the applied transform, because `getBoundingClientRect` returns the
untransformed box in this environment.

The current suite is 188/188 with 117 mutations. The manual does not ship until
it has added its own and the total has grown.

---

## 12. Open decisions — Siddhesh's, not mine

1. **What ART becomes.** The six works currently sit inside the mind as the
   region labelled ART (`V02_OVERLAY.relabel`, `src/v02-app.js:19`). When they
   move out, ART is either given real content or made latent like MUSIC and
   PSYCHOLOGY. It cannot stay a borrowed label.

2. ~~**STATELAB and AUTOMATION PORTFOLIO.**~~ **RESOLVED.** Both written.

3. ~~**Whether `KNOWN FAILURES` can be filled honestly.**~~ **RESOLVED, and it
   was the question that mattered.** Every one of the six carries at least one,
   twelve in total, and none is invented. The costly ones are real: a suite
   that stayed green while thirteen of fifteen regions arrived off screen; an
   assertion that passed with the behaviour it tested removed; an outreach that
   went straight for the pitch and was told to stop performing; and the same
   failure — work done, description not written — recorded twice across two
   repositories, which makes it a habit rather than an oversight.

4. **Keeping the reserved path tested.** With every work written, nothing a
   visitor can reach renders a reserved sheet, so W5 had nothing to measure and
   said so rather than passing vacuously. It now proves the path on demand
   through `works.asReserved()`, which renders a real sheet with its record
   suppressed — the state a seventh work would arrive in.
