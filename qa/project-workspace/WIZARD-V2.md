# Wizard v2

Five steps: business brief → actual area and booth type → starting template/current design/blank booth → optional theme, flooring and storage → live review and A/B destination.

## Behavior

- Entry distinguishes editing current design from starting a new booth. Reopening reads actual W/D/H. Current mode preserves the complete captured snapshot, including custom asset files, artwork and attachments.
- New/blank builds from the initial snapshot, not the old objects. Template cards show original dimensions; exact-area filtering checks width/depth. Choosing another size keeps the user's area unless they explicitly choose the original dimensions. Authored structures and furniture are not stretched or moved.
- Color, floor, and room defaults come from the chosen base. Theme uses YPBoothTheme with graphics/plants/wood protected by default. Changing floor uses the existing floor controls. A reset returns all customization to the base snapshot.
- Storage defaults to keep: no inference of "no room" from a missing standard-room flag. Add creates an extra standard room with an overlap warning. Remove affects only the system room, never authored template geometry.
- Preview uses an isolated comparison iframe. Parent state and browser draft remain untouched. Origin, frame source, token and revision are checked. A failed/unfinished preview disables commit and offers retry.
- Final commit uses a single project-workspace transaction with exact reviewed dimensions, native confirmation, and a stale source guard before/after confirmation. Only the selected A/B slot is replaced. This operation follows project replacement history behavior, not per-object Undo; save a project file to retain earlier work.
- Stale detection uses a canonical authored-design signature. It excludes renderer-computed logo alpha bounds, the derived registry/Snap caches, active viewport/camera, and generated AI request/result caches. It still includes source objects, geometry, materials, graphics, system visibility/locks, attachment graph, and user AI preferences. The same function is used when opening and before/after confirmation.
- Cancel/Escape discards the draft. Editor shortcuts remain blocked behind the Wizard.

## Verification

Run with the configured bundled Node runtime:

```
node --test qa/project-workspace/wizard-v2.test.mjs
node qa/project-workspace/wizard-v2-smoke.cjs
node qa/project-workspace/wizard-stale-guard-smoke.cjs
```

The browser test uses a fresh headless Chrome context, not the user's current tab. Internet access is required by the existing Three.js CDN import. Its screenshots include desktop area, customization, review, and mobile. It covers template/custom-room preservation, isolated theme/floor preview, dimensions, A/B cancel/commit, current reopening, invalid dimensions, corner side, backtracking, empty filter, stale edit rejection and actual blank-booth creation.

The stale-guard regression holds real Three.js requests until after Wizard entry, then renders the real logo. It verifies that full snapshot JSON changes (the original bug), while the authored-design signature stays stable. Soft Wave + green theme + grey carpet + extra standard room can cancel/confirm into B with A preserved. Actual edits during the confirmation dialog and an active-slot mismatch are still rejected.

Checkpoint and rollback instructions: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-wizard-v2/README.md`.

## Limits

- Preview is the editor's 3D renderer, not the AI photoreal render. Existing CDN connectivity and WebGL requirements apply.
- Resizing area does not fit or scale template geometry; review explicitly warns about out-of-bounds parts. Individual structures and modeled rooms remain editable in the editor.
- This is an additive migration: the legacy Wizard implementation stays loaded but its UI entry/step navigation is owned by wizard-v2.js. Remove the v2 includes to return to the previous flow.
