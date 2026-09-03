# V02-TECH-DECISIONS.md
## Architecture decision record — Cognitive Constellation

Written so no future session re-litigates this. If you disagree, amend the
record; do not silently choose differently.

---

## ADR-01 — Render technology

**Selected: Three.js, inlined into the single HTML file.**
**Not selected: React Three Fiber (for the vertical slice).**

### Why

| Reason | Detail |
|---|---|
| **The CSP is absolute** | The artifact host blocks every external origin and a blocked script fails **silently** — the page renders empty with no error. Any CDN import is not "risky", it is non-functional. Three.js must be inlined regardless of which wrapper sits on top of it. |
| **R3F cannot be inlined** | It needs React, JSX and a bundler → npm, a build step, a `dist/` artifact. That is three new failure surfaces before the concept is proven. |
| **It would break verification** | `tools/capture.js` appends a hook to the raw file and every other tool depends on that. A bundled build invalidates the entire harness — 8 runtime tools, 3 mutation harnesses, 174 acceptance checks. |
| **Reversibility** | Inlining is additive. If the slice fails the §40 gate, deleting one `<script>` block restores P4.7 exactly. A framework migration is not reversible in one step. |
| **Sufficiency** | One scene, one camera, ~200 objects. R3F's value is component composition across many scenes; we do not have many scenes. |

**Revisit condition:** if the validated slice proves component composition is the
bottleneck. That is a separate decision, taken *after* visual approval, never
before.

---

## ADR-02 — Payload budget

| Item | Size |
|---|---|
| P4.7 baseline | 232 KB |
| Three.js r16x core, minified | ~600 KB |
| V02 scene + environment profiles | ~80 KB est. |
| **Projected total** | **~910 KB** |
| Artifact ceiling | 16 MB |

Headroom is ~17×. **Build a custom Three.js bundle** containing only the modules
used (core, `PerspectiveCamera`, `WebGLRenderer`, `BufferGeometry`,
`Points`/`InstancedMesh`, `Fog`, `Line`) — a full build is wasteful when tree-shaken
core is typically ~150–250 KB.

**Rule:** the file must remain **one artifact, zero external requests**. That
property is verified today (`grep -cE 'src="http|fetch\(|<link'` → 0) and a check
must keep verifying it.

---

## ADR-03 — How 3D coexists with the DOM

Adopting **Pattern 1, Layered Separation** from `web3d-integration-patterns.md`,
minus React:

```
├── 3D layer      (Three.js)  — space, depth, constellations, neurons, motion
├── Animation     (own rAF)   — camera, easing; no GSAP for the slice
└── UI layer      (DOM)       — all text, controls, reading, accessibility
```

This is **already the site's architecture.** Canvas is the view; the DOM
parallel layer is the structure. V02 substitutes the render layer and changes
nothing about the relationship. That is why this port is tractable.

**Hard rules**
1. No intellectual content is ever rendered *only* in WebGL. Every writing,
   label, verb and gloss exists in the DOM.
2. The 3D canvas stays `aria-hidden`, exactly as the 2D canvas is today.
3. The parallel focusable layer remains the single source of structure.
4. Hit-testing may use raycasting, but must resolve **by node id**, never by
   screen proximity to rendered text.

---

## ADR-04 — Accessibility independence

**Requirement:** delete the `<canvas>` and the site must still be fully
navigable and readable.

That is true today and is the acceptance condition for the slice. It is the one
property that makes a 3D rebuild safe: WebGL is opaque to assistive technology,
so it may never become load-bearing for meaning.

Verification: a check that boots with WebGL context creation forced to fail and
asserts the journey still completes.

---

## ADR-05 — Performance tiers

| Tier | Target | Treatment |
|---|---|---|
| **A** desktop, GPU | 60fps | Full scene, fog, instanced neurons, all relationship trajectories |
| **B** laptop / integrated | 45–60fps | Reduced particle count, no soft shadows, simplified fog |
| **C** mobile | 30fps+ | 2.5D — layered depth, no free camera, P3 sheet model preserved |
| **D** no WebGL / reduced-motion | n/a | Static composition; DOM layer unchanged |

Tier detection from `WebGLRenderer` capabilities + `devicePixelRatio` +
`prefers-reduced-motion`. **Tier D must be a real, designed state**, not a
blank screen.

---

## ADR-06 — The verification problem (highest technical risk)

Headless Chrome has **no GPU**. It uses SwiftShader software raster. The harness
already times out intermittently at 2560×1080 on *2D*. A WebGL scene may be
unmeasurable there even while being fast for a real user.

**Mitigation, to be built in Phase 3 before the scene grows:**
1. Run headless with `--use-gl=swiftshader --enable-unsafe-swiftshader`; confirm
   a context is obtainable at all.
2. Assert **scene-graph state and projected screen coordinates**, not pixels.
   `camera.projectVector()` gives testable 2D positions from 3D truth — the
   existing tools' assertions port onto that directly.
3. Keep a **headless-lite mode**: a flag that renders one frame and exits, for
   geometry probes that do not need animation.
4. If a probe cannot be measured, it **fails** — the existing rule stands.

**If the harness cannot be made to work, that is a blocking finding and the
stack decision returns to the table.** Better to learn it in Phase 3 than
Phase 12.

---

## ADR-07 — Fallback strategy

- P4.7 (`a86e4deb12e0`) stays published and untouched at the SITE URL.
- V02 is built in a **separate file** (`v02.html`) until the §40 gate passes.
- `preview.html` is not the playground.
- Promotion to the published URL happens only after visual approval.
