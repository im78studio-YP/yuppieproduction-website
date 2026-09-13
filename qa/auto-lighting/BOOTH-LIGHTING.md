# Simple booth lighting — 2026-09-13

## Scope

The lighting panel contains only On / Off and White / Warm. Changes apply immediately, participate in object Undo/Redo, and travel with each A/B snapshot and project file. No fixture type selection, automatic fixture generation, placement or approval is exposed by this panel. Legacy planner code/state remains available internally for old projects and compatibility tests.

`lighting.boothControl` (version 1, enabled, tone) is independent of the original fixture inventory. Lamp housings are hidden in both states; Off disables emission and light cones. Existing legacy quantities, positions, types, approval status and pricing are not rewritten by the new controls.

## Rendering

- `booth-lighting.js` applies only to the booth group; studio key/fill/rim/background remain unchanged.
- Actual booth lights and explicitly tagged procedural luminous surfaces obey the switch. White/warm emitters use the selected tint; saturated decorative colour is preserved.
- Procedural emitter tagging is shared by template geometry builders, including Soft Wave fascia, LED strips, counter trims and downlights; Botanical counter strip; Yellow Frame lamp lenses; and Peninsular/Corner luminous details.
- Screens, artwork and untagged imported emissive materials are not blanket recoloured. Unknown GLB emissive surfaces require explicit emitter metadata to participate; this avoids turning a screen into a lamp.
- `booth-light-beams.js` hides lamp housings while retaining tracks, support beams, ceilings and other structural geometry. Soft Wave and Beauty use their authored lamp objects; Yellow Frame and Six Lit Beam expose local beam anchors that follow the parent transform. Existing spotlights retain their position and aim.
- Templates without authored light sources sample actual overhead undersides and visible wall surfaces using raycasts. Nearby counter/table/shelf surfaces may be targets. Generated lighting is capped at eight sources; it does not add project assets or billable items. These are presentation lighting, not an installation plan.
- Translucent cone helpers follow source direction and stop at the first opaque obstacle on the centre ray. They are excluded from selection, snapping and framing bounds. Cone edges are a lightweight visual approximation, not volumetric scattering or full cone-volume occlusion.
- LED strips remain continuous strips. White/Warm controls both cones and surface illumination; Off hides cones without darkening the neutral studio.
- Themes skip tagged emitting surfaces, keeping theme palettes separate from light tint.
- The atomic render package includes resolved `boothControl` values and the prompt honours the same state: hide lamp housings, follow reference beam positions, protect supporting geometry and keep studio/hall illumination. AI compliance itself is not guaranteed or tested by this local change.

## Verification

- `node --test qa/auto-lighting/booth-lighting.test.mjs`: control defaults, non-mutating legacy reads, prompt off-state, colour protection and integration hooks.
- `node qa/auto-lighting/booth-lighting-smoke.cjs`: isolated Chrome session, actual 3D and real UI. Covers Soft Wave, Botanical Atelier, Yellow Frame and Timber Lounge; emission, unchanged objects/pricing, studio and graphics, Undo/Redo, project serialization, keyboard activation, legacy approved/manual fixtures and mobile layout.
- Existing project-workspace + auto-lighting unit tests: 206 passing. AI rendering tests: 28 passing.
- Captured local screenshots: `booth-light-white.png`, `booth-light-warm.png`, `booth-light-off.png`, `booth-light-mobile.png`.
- Correction verification: `template-beams-smoke.cjs` checks cones On/Off/White, hidden housings, retained LED strips, unchanged objects/pricing/studio, four distinct template layouts, legacy fixtures, source transforms, Undo and portable project files. Current screenshots are `beams-*.png`; `booth-light-*.png` were also refreshed by the passing UI regression run.
- `all-template-beams.cjs` checks every template library entry for a finite, non-empty beam layout in isolated Chrome.
- Results: all 36 template entries passed; the detailed four-template beam smoke and the existing UI regression smoke both passed; 206 workspace/lighting and 28 rendering unit tests passed. Layout existence tests are not a claim that every viewing angle is photorealistic.

## Rollback

Pre-change `index.html` and `js/booth-theme.js` are backed up in `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-simple-booth-lighting/`. Roll back only these scoped changes and the new module reference; preserve any later unrelated work and customer project files. No user browser draft was modified by the smoke tests.

The subsequent housing/cone correction has its own checkpoint at `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-template-light-beams/` (index, lighting controller and the two amended geometry modules).
