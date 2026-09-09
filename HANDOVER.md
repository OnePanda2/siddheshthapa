# HANDOVER.md — siddheshthapa.com, complete

Written 2026-09-09, at commit `2bb2ddc`, as the project record. It assumes the
reader knows nothing: no prior conversation, no context, no access to whoever
built it. Everything needed to understand, run, change and verify this site is
here or is named here.

If you are an AI agent picking this up, **read the whole of this file before
touching anything.** The final section is a prompt written for you.

---

## 0. The one-paragraph version

This is Siddhesh Thapa's personal website: an interactive externalisation of
his mind as a "cognitive universe", rendered in WebGL, published at
**siddheshthapa.com** from the public repository **`OnePanda2/siddheshthapa`**
via GitHub Pages. The published page is a **single self-contained HTML file
that makes zero external network requests**. Content is added not by editing
code but through an editor page that commits JSON to the repository; a GitHub
Actions workflow validates that JSON and rebuilds the site. The project is
guarded by **55 test harnesses**, roughly half of which are mutation harnesses
that break the code on purpose to prove the other half actually test something.

---

## 1. What is deployed, and where

| | |
|---|---|
| Live site | https://siddheshthapa.com |
| Repository | https://github.com/OnePanda2/siddheshthapa (**public**) |
| Hosting | GitHub Pages, from `main`, built by Actions |
| Custom domain | declared in `CNAME`, copied into `_site/` at deploy |
| Editor | https://siddheshthapa.com/editor.html |
| Token exchange | https://siddheshthapa-auth.onepanda2.workers.dev (Cloudflare Worker) |
| Owner account | GitHub `OnePanda2` |

Two files are published: `_site/index.html` (the mind) and `_site/editor.html`
(the editor). They share an origin, which matters — see §9.

---

## 2. The architecture, and the three rules that explain it

### ADR-02 — one artifact, zero external requests

The published page inlines everything: three.js, all data, all styles, all
code. It fetches nothing at runtime. This is **enforced in CI**, not merely
intended: `.github/workflows/deploy.yml` greps the built `_site/index.html`
for `src="http`, `href="http`, `api.github.com` and `login/oauth`, and fails
the build if any appears. The three.js payload is excluded from that scan
because it contains the string `fetch` in its own source.

The editor is the one thing allowed to reach the network, which is precisely
why it is a **separate file**. There is nothing to "unlock" in `index.html`
because the editor is not in it.

### preview.html is the locked senior document

`preview.html` is the P4.7-era artifact and the **source of truth for the
graph**: `MIGS`, `MINORS`, `THOUGHTS`, `EDGES`. It is never edited. Ever. The
build extracts its data block by string offsets; several harnesses re-extract
it independently so they cannot quietly disagree with what ships.

If something in the corpus is wrong, it is **overridden**, not corrected.

### V02_OVERLAY — the one declared place `src/` may diverge

Near the top of `src/v02-app.js` is `var V02_OVERLAY = { … }`, the only
sanctioned divergence from `preview.html`. Its channels:

| channel | what it does |
|---|---|
| `relabel` | rename a region |
| `menuLast` | pin named regions to the foot of the menu |
| `reline` | replace a writing's line |
| `reedge` | replace a relationship's gloss |
| `hideMIGs` | close a region: it leaves `MIGS`, its objects keep their ids |
| `renameIds` | re-key an object everywhere it can appear |
| `addMIGs` | declare a new region |
| `addMinors` | declare a new concept |
| `addWritings` | declare a new writing |
| `addWorks` | declare a project (a MY WORKS object) |
| `addEdges` | declare a new relationship |

Each entry carries a `why:` explaining the divergence. That is a convention,
not a schema requirement, and it should be kept.

---

## 3. The content model

Read `CONTENT-MODEL.md`. It is the authority; `tools/notescheck.js` restates
its rules as assertions. The essentials:

**Three tiers of truth.** Tier 1 is Siddhesh's own words. Tier 2 is structure
derived from them. Tier 3 is invention — **forbidden**. Earlier versions of
this project invented two products ("RevenuePilot OS", "FlowMail") and
presented them as his across seven iterations; `tools/accept.js` still asserts
those names never return.

**Node types.** `mig` (a region/topic), `minor` (a concept), and writings,
which carry a `t` from: `belief`, `thought`, `question`, `contradiction`,
`project`, `experiment`, `person`, `reference`.

**`src` is provenance, not authorship.** An absent `src` means "not his
writing". A live note written in the editor says `Live note`, because claiming
otherwise would be a lie about provenance.

**Relationships carry a verb and a gloss.** The verb must be semantic —
"related to" is refused. The gloss must be ≥ 25 characters and says *why* the
edge exists. Direction is load-bearing. No duplicate pair, no inverted
duplicate, no self-loop.

**Position is an index.** `owned[mig]` is filled in `NODES` order, and a body's
place in its region is decided by where it sits in that list. This is why
**deletion is a line added, not a line removed** — splicing a node out would
move every star after it. A retired writing is *blanked in place*: it keeps its
id, its region and its index, and loses only what made it a writing. Its star
goes on burning, empty, and a later note may claim it.

That single rule explains `retired`, `retiredRegions` and `retiredEdges` alike.

---

## 4. The live-notes channel — how the site is edited

`data/notes.json` is the **only input a form can write**. Its schema, all ten
keys:

```
version           always 1
notes[]           writings: id, t, label, mig, crosses[], state, register,
                  src, line, added, and optional sections[]{heading?, body}
minors[]          concepts: same minus t/register/src/line
edges[]           [fromId, toId, verb, gloss]
retired[]         {id, at} — a writing or concept blanked in place
edits{}           id -> overrides. For a writing: label, line, src, register,
                  state, crosses, sections. For a topic: label and line only.
                  id, mig and t are REFUSED — applyEdits drops them silently,
                  so offering them would report a success that never happened
regions[]         {id, label, line, added} — a topic of the mind
retiredRegions[]  {id, at, why} — the room closes
menuOrder[]       region ids lifted to the front of the menu, in that order
retiredEdges[]    {a, b, at, why} — one relationship withdrawn, matched
                  UNORDERED because a claim is one claim either way round
```

The file documents its own schema in `_readme`. Keep that current.

**The security model is one sentence: the lock is on the commit, not on the
button.** Anyone may open the editor and fill in the form. Publishing means a
commit to the repository through `api.github.com`, and GitHub refuses a push
from anyone who cannot write to it. Nothing in the editor decides who may
publish.

### The publish path, end to end

1. Editor reads `data/notes.json` via the GitHub Contents API (with its `sha`)
2. Applies the change **to what is on the server right now**, not to a copy
   loaded minutes ago — `commitTo` takes a *function*, not a document
3. PUTs it back with that `sha`, so two devices cannot silently clobber
4. The push triggers `.github/workflows/deploy.yml`
5. `notescheck` runs **before the build**; a malformed store stops here
6. `textcheck` runs
7. `build-v02.js` produces `v02.html` and `editor.html` from source
8. `_site/` is assembled, the zero-request assertion runs on the built file
9. Pages deploys

Nothing pre-built in the repo is served. `v02.html` is committed for
convenience and the workflow ignores it and makes its own.

---

## 5. What can be done from the editor, with no code

This was the project's final goal and it is met for content and organisation.

| | control |
|---|---|
| Add a writing | `+ Add a writing` inside a region |
| Add a concept | `+ Add a concept` inside a region |
| Edit either | `edit` on the row |
| Delete either | `delete` on the row — blanks in place, star stays |
| Sections in a writing | inside the writing form; heading optional, body required |
| Add a relationship | `+ relationship` in the form — **works when editing too** |
| **Remove a relationship** | `unlink` on any row of a "Connects to" list |
| Add a project | `+ Add a project` under the MY WORKS contents |
| Write a project's sheet | `write sheet` on the contents page |
| The site's own words | **Words** on the editor bar |
| A topic's name + description | `✎ Edit what X is` inside the region |
| **Add a topic** | **New topic** on the editor bar |
| Retire a topic | inside the topic form; asks for the name typed back |
| **Menu order** | **Menu order** on the editor bar — ↑/↓ per row |

### What still requires code

1. **A new *kind* of thing.** A new node type needs an emblem and a species; a
   new page needs a page. This is a boundary, not a gap.
2. **Design.** Layout, typography, palette structure.
3. **Refilling the world reserve** when it empties (§6).

One bounded piece was scoped and never built: **per-region colour overridable
from the store**, which would need a check refusing a hue too close to a
neighbour's, since the palette currently guarantees ~18.6 ΔE separation.

---

## 6. The astronomy, and why a topic needs one

Every region is rendered as a real planetary system. `data/astronomy-systems.json`
holds **26 systems**, every figure retrieved from the **NASA Exoplanet Archive
TAP service, table `pscomppars`**. Nothing is estimated or invented; where the
archive returned no value the field is `null` and the confidence is lowered.

**14 are assigned**, one per region, each chosen for a spacing regime the
others do not occupy — PHILOSOPHY is TRAPPIST-1 (seven packed orbits), MOVIES
is HR 8799 (four sparse ones) as its deliberate opposite, LOVE is Kepler-16
(circumbinary, two stars), OBSERVATION is not a planetary system at all but the
real constellation Ursa Major from SIMBAD.

**12 are held unassigned**, in `reserve: true`. This is the pool a new topic
claims from.

### The claim

`MIG_SYSTEM` in `src/v02-app.js` types the fourteen chosen assignments, and
they must never move — nine assertions name a region and a system together. A
region **declared beyond the corpus** with no typed system claims the next
unclaimed reserve system.

Three properties make that safe, and all three are checked:

- **The claim is by position in the declaration order, and positions are never
  reused.** Retiring a topic does *not* free its world. Otherwise retiring one
  topic would silently move the next one's star.
- **The scale is derived, not chosen.** `WORLD_SCALE` runs 1.1 to 52 because a
  system's span multiplies it. A claimed world is scaled so its geometric
  centre — `sqrt(inner × outer)` — matches the median of the worlds already in
  service. That constant is **computed at load** (currently 36.653), not
  written down, so it stays true if a hand-tuned scale is revised.
- **A new topic is shown whole.** It arrives empty, which is what
  `FULL_SYSTEM` exists for: every orbit drawn, a faint planet on each vacancy.

**When the pool empties, `notescheck` refuses the commit** and says to retrieve
more from the archive. It will not ship a topic without a sky.

### How to refill it (the procedure that was used twice)

1. Query the archive:
   `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select hostname,pl_letter,pl_orbper,pl_orbsmax,sy_pnum,sy_dist,st_spectype,st_mass,st_age,sy_snum from pscomppars where sy_pnum >= 4&format=csv`
2. Keep only systems where **every declared planet has geometry** and no two
   bodies sit within 5% of the same radius.
3. **Exclude any candidate more than 8% off Kepler's third law**
   (`a ∝ P^(2/3)` within the system). A composite archive row can mix a stellar
   mass from one paper with axes from another; HD 160691 led one ranking at
   15.31% and would have been refused by `reservecheck` R3 after being written
   in. Apply this during *selection*.
4. Rank by distance from every system already in the file, in a shape space of
   mean gap, evenness, gap trend, largest single gap, total reach and body
   count. Then choose **farthest-point**, not top-six: the top of that ranking
   is always several near-copies of one shape.
5. Cap four-planet systems so the pool offers more than one size.
6. Copy the numbers **out of the response**, never type them. Write the prose
   by hand and then **verify every superlative against the figures**.
7. Serialise at **indent 1** — `datacheck` pins that.
8. `node tools/reservecheck.js` must stay 6/6.

---

## 7. Repository map

```
preview.html          LOCKED. The graph. Never edit.
v02.html              built artifact, committed for convenience, ignored by CI
editor.html           built artifact, GITIGNORED — CI builds and publishes it

src/v02-app.js        the whole mind: graph merge, layout, WebGL, semantic
                      panel, address bar, harness surface. ~370KB built.
src/v02-works.js      MY WORKS — the manual, a layer over the same scene
src/v02-editor.js     the editor. The only code that touches the network.
src/v02-shell.html    the page shell, all CSS

data/notes.json                 the live store (§4)
data/works.json                 manual sheets: purpose, parts, procedure,
                                known failures. May never restate anything the
                                graph declares — a second copy is a second truth
data/text.json                  the site's own words, editable
data/astronomy-systems.json     26 systems (§6). INDENT 1.
data/constellation-ursa-major.json  SIMBAD star positions. Hand-kept.
data/editor-config.json         public config: client id, owner, repo, branch,
                                path, exchange URL. No secrets by design.

worker/index.js       122 lines, most of them comment. The only server.
worker/README.md      deploy instructions
worker/wrangler.toml  name, compat date, public client id

tools/                69 files: the build, 55 harnesses, shared utilities
tools/build-v02.js    the build
tools/regression.sh   the whole suite, in order
tools/scratch.js      where checks put working files, and who deletes them
tools/viewport.js     drives headless Chrome at a given viewport
.github/workflows/deploy.yml    validate → build → assert → deploy

*.md                  design records, specs, research. CONTENT-MODEL.md is
                      the one that is normative.
```

---

## 8. The test suite

**55 harnesses**, run by `sh tools/regression.sh <logfile>`. Roughly
**4¾ hours** on the machine it was developed on. `tools/smoke.js` is the
20-second version for use while working.

### The protocol, which is the point

A check that has never failed is an **unverified assumption**. So almost every
`*check.js` has a matching `*mutate.js` that:

> mutate · prove the mutation reached the file · require failure **for the
> stated reason** · restore byte-for-byte · require pass

Four rules, learned the hard way:

- **An anchor must match exactly once.** Zero matches is a hard STOP, never a
  skip — a mutation that matches nothing tests nothing and reports green.
- **A crash is not a catch.** If the page throws, the assertion proved nothing.
- **A surviving mutation means fixing the CHECK, never the mutation** — unless
  the specification genuinely changed, in which case say so in the file.
- **`--dry` audits anchors in ten seconds.** `tools/anchorcheck.js` runs it
  across every harness and **runs first in the regression**.

### Groups

- **build**: `build`, `anchorcheck`, `datacheck`, `notescheck`, `textcheck`, `smoke`
- **v02 checks** (target `v02.html`): `archcheck`, `astronomycheck`,
  `braincheck`, `constellationcheck`, `emblemcheck`, `glcheck`,
  `highlightcheck`, `lovecheck`, `migvischeck`, `navcheck`, `reservecheck`,
  `systemcheck`, `travelcheck`, `workscheck`, `worldcheck`, `worldframecheck`,
  `editorcheck`
- **mutation harnesses** (these WRITE to `data/notes.json` or `src/` and put
  them back): `notesmutate`, `systemfill`, `sectioncheck`, `projectcheck`,
  `regioncheck`, `menucheck`, `edgecheck`, `worksmutate`, `brainmutate`,
  `glmutate`, `emblemmutate`, `highlightmutate`, `lovemutate`, `reservemutate`,
  `regionmutate`, `menumutate`, `editormutate`, `edgemutate`, `travelmutate`,
  `worldmutate`, `worldframemutate`, `constellationmutate`, `astromutate`
- **P4.x suite** (target `preview.html`): `contradictioncheck`, `gridcheck`,
  `marginaliacheck`, `mobilecheck`, `overlapcheck`, `tokencheck`, `widecheck`,
  `acceptmutate`, `gridmutate`, `margmutate`

### Two guards in the runner

**Contamination.** A mutation harness that dies partway leaves its mutation in
`src/`. The runner checks `git status --porcelain src/ data/ preview.html`
after every harness and restores if dirty. **This will silently revert
legitimate uncommitted work — commit before running a regression.**

**Orphaned browsers.** On Windows an `execSync` timeout kills the node child
and *not* the Chrome it launched — measured at **twelve surviving processes**
from one cut-off probe. Those burn CPU through everything that follows.
`scratch.js` exposes `reap()`, matching only on `--user-data-dir` inside this
project's scratch root, and the runner calls it after every harness.

### The last full run

`.checkpoints/regression-2026-09-09.log` is the record of it, kept because a
claim that the suite passed is worth less than the log that says so. **55 of 57
at commit `ec8f352`**, both failures stale census and both fixed in the commit
that carries the log. Every expensive harness green: `worldmutate` 30/30,
`astromutate` 19/19, `regionmutate` 7/7, `menumutate` 6/6, `glmutate` 7/7,
`margmutate` 12/12, `brainmutate` 21/21, `constellationmutate` 15/15,
`widecheck` 5/5 with no timeout. The tree stayed clean throughout — no
contamination line, no browsers reaped.

The deployed page was separately confirmed **byte-identical to the local
build**, with the zero-request assertion holding on the live file. The
regression proves the repository is consistent; it does not prove the site is
up, and those are different questions.

### Known flakiness

`widecheck` runs at 2560×1080 in software raster — 2.76M pixels a frame. One
of its five states occasionally exceeds the 420s ceiling, and **which state
rotates between runs**, so it is a resource limit, not a content problem. It
retries once, now reaping orphans first. If it fails, re-run it alone before
believing it.

---

## 9. The editor, the Worker, and the security model

### What protects what

**One check is the entire security boundary**: `worker/index.js` asks GitHub
whose token it just minted and returns nothing unless the answer is `OnePanda2`.

This is worth stating plainly because the code used to credit the wrong
mechanism. The client id is **public by construction** — it is in
`data/editor-config.json` — and anyone may take it to GitHub, authorise the app
against their own account, land on the registered callback in their own browser
and read a valid code out of the address bar. Registration controls where a
code is *delivered*; it does not control who can obtain one. The `ALLOWED`
origin list is not a security control either: `Origin` is a header and `curl`
sends whatever it likes. What that list does is stop a *browser* on another
page reading the response, which is all CORS was ever for.

**Do not weaken the owner check.** Not to "any authenticated user", not to a
path that returns a token when the `/user` call fails. It uses `String(...)` so
that an errored response yields the literal `"undefined"` and refuses; do not
replace it with an optional chain that yields `undefined` on both sides.

### Other properties

- The token is a **GitHub App** user token with **8-hour expiry**, held in
  `localStorage` on the editor's origin. `editorcheck` E6 asserts the editor
  talks to `api.github.com` and nowhere else.
- OAuth `state` is 128 bits from `crypto.getRandomValues`, stored in
  `sessionStorage`, and **removed before the comparison** so both branches
  spend it.
- The editor and the mind share an origin, so an XSS in *either* is a stolen
  token. A review found the sinks clean: of 28 `innerHTML` sites in the editor,
  24 are `= ""` clears and the four with content are two static strings and two
  `esc(me.login)` in element-content position. Keep it that way.
- `esc()` escapes `& < > "` but **not `'`** — safe only because no call site is
  in a single-quoted attribute. If you add one, fix `esc()` first.

### Deploying the Worker

Only needed if `worker/index.js` changes. **Secrets survive a redeploy.**

```bash
npm install -g wrangler          # if absent
wrangler login                   # browser opens; click Allow
cd "F:\Projects\Siddhesh Thapa\worker"
wrangler deploy
```

It must print `https://siddheshthapa-auth.onepanda2.workers.dev` — the value in
`data/editor-config.json`. A different subdomain means a different Cloudflare
account and the editor would be talking to the old Worker.

`wrangler secret list` should show `GITHUB_CLIENT_SECRET`. If it is missing:
`wrangler secret put GITHUB_CLIENT_SECRET`.

Rollback: `wrangler deployments list`, then `wrangler rollback <id>`.

**Never accept a secret in chat.** Not the GitHub PAT, not the client secret,
not the Razorpay key. They are set with `wrangler secret put` and typed by the
owner.

---

## 10. Working on this repository

```bash
node tools/build-v02.js      # rebuild both artifacts
node tools/smoke.js          # 20 seconds; catches a broken edit
node tools/anchorcheck.js    # 10 seconds; catches a stale mutation anchor
node tools/notescheck.js     # the gate, run exactly as CI runs it
sh tools/regression.sh /tmp/reg.log    # everything, ~4¾ hours
```

- `git pull` works — `main` tracks `origin/main` as of 2026-09-09. **Pull
  before local work**: publishing from the editor commits straight to GitHub
  and leaves your working copy behind.
- Commit before running a regression; the contamination guard reverts dirty
  source.
- `editor.html` is gitignored and built by CI.
- Do not commit anything under `.wrangler/`.

---

## 11. Open items

1. **Per-region colour from the store** — scoped, not built. Needs a check
   refusing a hue too close to a neighbour's.
2. **`widecheck` flakiness** — mitigated by the reaper, not eliminated. The
   reaper has not yet been observed rescuing a real retry, because no run has
   timed out since it was added.
3. **Four harnesses cannot be anchor-audited**: `acceptmutate`, `gridmutate`
   and `margmutate` anchor only into `preview.html`, which is locked and cannot
   move, so this is inert; `notesmutate` builds its own fixture. Adding `--dry`
   to the three would close it cosmetically.
4. **The Cloudflare account id and account email remain in git history** at
   commit `9c149c6`, in `worker/.wrangler/cache/wrangler-account.json`. That
   file is now untracked and ignored. Neither value is a credential — an
   account id can do nothing without an API token — but the email is personal
   data in a public repository. Removing it from history needs a rewrite and a
   force-push; that was **not** done, because it is disruptive and the owner
   should decide.
5. **A paywall for "Messages for the Elite" was designed and abandoned.** The
   region was retired and its contents removed. Do not resurrect it: the reason
   was that content capable of damaging a career should not be online behind
   any paywall, and screenshot prevention that looks like protection and is not
   would have been worse than nothing.

---

## 12. Traps this project has already fallen into

Every one of these cost real time. They are listed so they cost none again.

**A `var` assigned late hoists as `undefined`.** This bit `src/v02-app.js`
three separate times. The last was in `applyUrl`, two edits after the warning
comment about it was written.

**Check the instrument before the subject.** When a result is surprising, the
measurement is wrong more often than the code. Cases: `margmutate` assertion 7
ran at a viewport where its guards were provably dead; `sectioncheck` X4
returned `innerHTML` through `document.title` and destroyed its own evidence;
`menucheck` M4 read positions off an accessor that carries none and reported
"all 0 stars held still"; `menucheck` M6 compared two equally-empty lists;
`worldcheck` W5 compared the menu against a live count the same defect shrinks.

**An assertion satisfied by two nulls is not an assertion.** Anchor to
something the defect cannot move — a count derived from source, a non-empty
requirement, the mind's own order.

**A stale census passes forever.** Six assertions were found guarding
conditions that had become unreachable. `brainmutate` B19's precondition went
stale **three times**; the third time was the reserve pool silently handing ART
a world when the mutation took its typed one away.

**Name the property, not the line.** `worldmutate` W5's anchor broke three
times because it named a line instead of the thing whose job is the property.
It is anchored on `menuOrdered()` now.

**Dry-run every harness after a refactor, not the ones that look affected.**
`constellationmutate` hard-stopped 650 seconds into a regression on the same
line `worldmutate` had already been fixed for in the same commit.
`anchorcheck` exists for this.

**A mutation that can silently no-op is worse than none.** `worldmutate` W7
moved a concept id that had stopped existing months earlier, changed nothing,
and reported green. Describe what you want to break; do not name the victim.

**Harnesses that write the store directly prove nothing about the form.** Two
live defects hid in that gap — `commitTo` shadowing its parameter so three
controls threw on a real store, and the edit path discarding relationships.
`editorcheck` closes it by driving the real form and reading the real PUT.

**The regression's contamination guard will revert your uncommitted work.**

---

## 13. Voice, and what the comments are for

The code comments in this project are unusually long and they are load-bearing.
They record **why** something is the way it is, and specifically **what went
wrong before**. A comment saying "this was Math.random() and here is why that
mattered" is worth more than one saying what the line does.

Prose on the site itself is Siddhesh's. Prose in the code is the project
explaining itself to whoever opens it next. Neither should be flattened into
generic phrasing. When something is fixed, the comment should say what it was
fixed *from*.

Commit messages follow the same rule: they state the finding, not the diff.

---

## 14. Handover prompt

> Copy everything below into a fresh session.

---

You are picking up **V02**, the personal website of Siddhesh Thapa, at
`F:\Projects\Siddhesh Thapa`, repository `OnePanda2/siddheshthapa`, live at
siddheshthapa.com. The project is complete and in maintenance.

**Read `HANDOVER.md` in the repository root, in full, before doing anything.**
It is the complete record: architecture, content model, editor, security model,
astronomy, the 56-harness test suite, open items, and the traps this project
has already fallen into. Then read `CONTENT-MODEL.md`, which is normative.

Hold these as hard constraints:

1. **`preview.html` is locked.** Never edit it. Divergence is declared in
   `V02_OVERLAY` in `src/v02-app.js` and nowhere else.
2. **Never invent content.** No belief, project, memory, preference or opinion
   that is not Siddhesh's. An unwritten thing is marked unwritten. This project
   has fabricated before and the assertions that catch it are still running.
3. **The published page makes zero external requests**, enforced in CI.
4. **Deletion is a line added, not a line removed.** Position is an index.
5. **A check that has never failed is an unverified assumption.** Any new
   assertion needs a mutation proving it can fail, for its own stated reason. A
   surviving mutation means the check is wrong, not the mutation.
6. **When a result is surprising, check the instrument first.** This project
   has been wrong about its own measurements at least six times.
7. **Never accept a secret in chat.** Secrets are set by the owner with
   `wrangler secret put`.
8. **Commit before running a regression** — the runner's contamination guard
   reverts dirty source.

Before changing code: `node tools/smoke.js` (20s) and `node tools/anchorcheck.js`
(10s). After: rebuild, re-run the harnesses that touch what you changed, and
add a check plus a mutation for anything new. The full regression is
`sh tools/regression.sh <log>` and takes about 4¾ hours.

Write comments the way the existing ones are written: say why, and say what
went wrong before. Write commit messages that state the finding, not the diff.

The site can now be run indefinitely by its owner without a developer. Adding a
writing, a concept, a relationship, a project, a topic, or reordering the menu
are all editor operations. What still needs code is a new *kind* of thing, any
design change, and refilling the planetary-system reserve when its twelve
remaining worlds are spent — the procedure for which is in §6.

---

*Written at commit `2bb2ddc`, 142 commits in at the time of writing. 55 harnesses.
26 planetary systems, 12 unclaimed. One artifact, zero external requests.*
