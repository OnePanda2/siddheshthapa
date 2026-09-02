# Editorial Register — public-website safety pass

Applied to all source material before any of it became public-facing content.
Rule set: political content / religious content / general philosophical critique /
provocation / humour, per the editorial brief.

Legend — **PUBLIC** live on the site · **HELD** catalogued, not published ·
**BLOCKED** requires written authorisation · **REFRAME** underlying idea published,
original wording held.

---

## PUBLISHED — society

| Object | Register | Why it passed |
|---|---|---|
| Blind party loyalty | belief | Explicitly non-partisan. Criticises the *behaviour* of unconditional loyalty, and says both sides equally. Names no party. |
| Convenient neutrality | belief | Aimed at performative caution, not at any political position. |
| What you vote them for | observation | About incentives and revealed preference. No party, no leader. |
| Someone else's politics | observation | About misdirected civic attention. Names no party or leader. |
| A light that becomes a wall | philosophical proposition | **REFRAME.** Generalised from religion to *any* framework that becomes unquestionable — ideologies, philosophical schools, institutions that think they are immune. This generalisation is the source's own, not mine. |
| Institutions · Incentives · Tribalism · Conviction · Dogma | concepts | Conceptual centres about collective behaviour and epistemology. Directed at ideas and institutions, never at communities. |

---

## HELD — not published, catalogued only

| Object | Reason |
|---|---|
| **Both parties have betrayed the country** | Names two specific parties and makes an unsubstantiated accusation of betrayal. Fails §1 twice. Its intellectual content — that corruption is systemic rather than one party's — already survives intact in *blind party loyalty*, which names nobody. Nothing is lost by holding it. |
| **Religion-and-gullibility litmus test** | Turns on an inference about IQ from religious hatred. Even though its target is bigotry rather than any faith, the wording reads as an attack on believers. **REFRAME available:** the underlying idea — unexamined tribal hatred as a signal of susceptibility to propaganda — is publishable without the IQ claim, if you want it. |
| **"Terrorism has a religion and it's extremism"** | Your position sits deliberately between the left and right framings, and the point is genuinely about extremism of *any* ideology. But the opening clause is quotable out of context in exactly the wrong way. **REFRAME available:** "The common denominator is extremism, not any particular faith." |
| **40% tax, 0% facilities** | Rhetorical figures presented as fact, and reads as targeting a particular government. Held pending your call. |
| **"F buddha, this is my truth"** | The proposition — desire as the engine of achievement, contra the Buddhist framing — is legitimate philosophical disagreement and can be published. The profanity aimed at a religious figure cannot. **REFRAME:** publish the proposition, drop the four words. |
| **"Rather be a bully than be bullied"** | Not political or religious, so outside the safety rules — held on your earlier NEEDS REVIEW flag. Reads as endorsing cruelty rather than rejecting victimhood. |
| **Religious extremism / Bangladesh** | Tied to a specific communal incident. No framing makes this safe on a personal website. |

---

## BLOCKED

| Object | Reason |
|---|---|
| **Defence startup** | Your own handover instructs: no operational detail, no specifications, no tactical information, respect NDAs, publish only what you explicitly authorise. The *design method* — idea, market research, consulting veterans, on-ground feedback, iteration, procurement — is publishable on its own and names no product. Say the word. |

---

## Data-model change

`register` now sits beside `state` on every object and renders in the panel, so the
site reads `belief · formed` or `observation · growing` — and a joke would read
`joke`, never `Siddhesh believes X`. Types available: belief, observation, joke,
provocation, question, hypothesis, conviction, unfinished thought, quote, project.

Sourced objects also carry `src` and display *from CV · handover §12* under the text,
so every claim points at the document it came from.

---

## What changed in the build

- **RevenuePilot OS and FlowMail removed.** My inventions. Gone from the data, and a
  check now fails the build if either name returns.
- **My Works repopulated with real artifacts:** COTSI, StateLab, Claude-skills,
  automation-portfolio, siddheshthapa.com, and the three years across startups. The
  Claude-skills line is your own repo description, kept verbatim.
- **Music emptied.** Its six concepts were all mine. The region now says so in its own
  words rather than being furnished with things you never said.
- **Society added** with five concepts and five thought objects, all sourced.
- **Two automated editorial checks** now run on every build: no published object or
  relationship gloss may name a political party or a faith.
