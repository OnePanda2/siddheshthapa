# V02-INTERACTION-BACKLOG.md
## Real, measured interaction issues

**Nothing here is invented.** Every entry was reproduced by runtime probe at
1440×900 against `preview.html` @ `a86e4deb12e0`. Items I could not reproduce
are recorded as such rather than fixed speculatively.

Severity: **S1** blocks a user · **S2** degrades a real task · **S3** polish.

---

### IB-01 — Persistent controls are under 44px on desktop

- **Problem:** `backBtn` renders 29×38; `mindBtn` renders 31×31. The project's
  own standard is 44px; both meet WCAG 2.2 AA (24px) but fail the house rule.
- **State:** every desktop state after the threshold.
- **Expected:** ≥44×44 hit area, without the *visual* mark growing — pad the
  target, not the glyph.
- **Severity:** S2 · **Phase:** 4 (interaction physics)

### IB-02 — The brain control is unlabelled on touch

- **Problem:** the "Go back to Mind map" tooltip is deliberately suppressed on
  touch, so on a tablet the control carries no visible explanation. The
  `title` attribute exists for AT but never renders for a touch user.
- **State:** touch devices, all states.
- **Expected:** a persistent, non-hover affordance on touch — a short label, or
  a first-visit hint that decays.
- **Severity:** S2 · **Phase:** 4

### IB-03 — Two returns that look alike and are never explained

- **Problem:** `<` (one step back, real history) and the brain (drop focus,
  return to the neutral map) are different promises rendered as two small marks
  in opposite corners. Nothing in-world distinguishes them.
- **State:** any region or concept view.
- **Expected:** in a spatial model, "back" should read as reversing the camera
  and "brain" as zooming out to the universe. The distinction should be
  **spatial**, not textual.
- **Severity:** S2 · **Phase:** 4 — this is an opportunity V02 creates, not a
  defect to patch in P4.7.

### IB-04 — Field fragments are invisible but clickable

- **Problem:** P4.7 places quiet writing in the graph field at 10px / 2% alpha
  with a 44px hit box. The target is real; the text is at the edge of
  perceptibility. An invisible doorway is a confusing doorway.
- **State:** focused concept and writing states, ≥1024px.
- **Expected:** either legible enough to invite a click, or not clickable.
- **Severity:** S2 · **Phase:** 3/7 — resolved by depth, where distance
  explains faintness. **Needs Siddhesh's judgement** (see DESIGN-V02 §26).

### IB-05 — The focused writing is rendered twice

- **Problem:** the writing in the reading panel also appears as the dominant
  editorial fragment. Most visible in the contradiction state.
- **State:** any concept/writing focus at ≥1280px.
- **Expected:** the field shows what you are *not* looking at; the panel shows
  what you are.
- **Severity:** S2 · **Phase:** 3 — one filter condition, but it is an
  editorial decision about whether the field may echo the panel.

### IB-06 — Cross-region marks name a destination but cannot be followed

- **Problem:** marginalia says `→ society`; it is deliberately inert (P4.6
  interaction policy: marginalia is evidence, not a control). The visitor is
  told where a thought leads and given no way to go there.
- **State:** focused states with cross-region writings.
- **Expected:** in V02 the *trajectory itself* becomes the affordance — you
  follow the line through space rather than clicking a label.
- **Severity:** S2 · **Phase:** 9 (cross-MIG rabbit holes)

### IB-07 — No sense of corpus size

- **Problem:** nothing communicates how much there is. A visitor cannot tell
  whether exploring is a two-minute or two-hour proposition, so has no reason
  to start.
- **State:** first 30 seconds.
- **Expected:** the universe should make its own extent legible — 14 regions,
  143 objects — without becoming a progress bar.
- **Severity:** S2 · **Phase:** 3

### IB-08 — "WANDER FROM HERE →" has no stated destination

- **Problem:** the control's outcome is unpredictable; nothing indicates
  whether it is random, related, or distant.
- **State:** concept panel.
- **Expected:** either name the kind of jump, or make the destination visible
  before committing.
- **Severity:** S3 · **Phase:** 9

### IB-09 — Scroll is inert on the map

- **Problem:** the mouse wheel does nothing in the region and map views.
- **State:** all desktop map/region states.
- **Expected:** V02 §18 makes scroll spatial travel.
- **Severity:** S3 · **Phase:** 4

---

## Could NOT reproduce — do not "fix"

**"Broken/nonfunctional icons" (V02 brief §36).** Measured at 1440×900:

| Control | Size | Visible | Name | Handler |
|---|---|---|---|---|
| `enterBtn` | 231×15 | correctly hidden post-threshold | — | yes |
| `backBtn` | 29×38 | yes | "Back" | yes |
| `mindBtn` | 31×31 | yes | "Go back to Mind map" | yes |

8 click listeners, 23 focusable elements, zero dead handlers found. The real
issues are IB-01 and IB-02. **If a specific control misbehaved, name the
control and the state and it will be chased.** Nothing has been redesigned on
the basis of an unreproduced report.

---

## Regression gates — must never break

Carried from P1/P3; these are not backlog items, they are invariants:
keyboard completes the full journey · roving tabindex keeps the map one tab
stop · arrow keys walk relationships · focus ring is drawn on whatever holds
DOM focus · hidden states leave the tab order · `prefers-reduced-motion` is
respected · every control ≥44px on touch.
