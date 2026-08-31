# Auto Lighting — Phase 1

## Data flow

1. `BoothSpec.lighting` is normalized through `YPAutoLighting.normalizeLightingState()`.
2. **สร้างแสงอัตโนมัติ** captures the current booth state, detects lighting targets and valid mount surfaces, then creates `suggestions`.
3. Suggested physical fixtures render in the Three.js scene but remain `AI Suggested / Render Staging` and do not enter BOQ. Invisible Preview Lights render only illumination—no mesh, Asset List row, or BOQ record.
4. **อนุมัติไฟแนะนำ** moves valid suggestions to `approvedFixtures`. Only approved visible fixtures enter the lighting cost and production classification in Geometry Manifest.
5. Scene geometry/camera changes mark the plan stale. Approved fixture transforms are preserved and receive a validation warning until the user recalculates.
6. Prompt Builder and Render Package serialize the same lighting state as the 3D scene.

## Schema

`lighting` stores mode, intent, temperature, brightness, fixture preference, revisions, `suggestions`, and `approvedFixtures`. Each fixture stores target and mount IDs, transform, aim target, beam settings, validation status, and warnings.

## Placement rules

- Priority is controlled by intent: balanced, brand, product, or counter.
- Existing overhead structures prefer Clear Light.
- Wall-only positions prefer Arm Light.
- If no valid physical mount exists, the system creates an Invisible Preview light without a floating fixture mesh.
- Wide branding receives two symmetric fixtures; other targets receive one by default.
- Each suggestion references either a target Asset or a target zone.
- Boundary, missing-mount, and duplicate-spacing checks populate `validationWarnings`.

## Migration

- New projects explicitly receive Auto Lighting / balanced / 4000K / standard / auto fixture preference.
- A loaded legacy project without `lighting.mode` normalizes to Manual Lighting so the original light count, wattage, wall, model, and spacing behavior remains intact.

## Undo, save, and reload

Lighting state is included in the existing object history snapshot. Generate, recalculate, approve, fine-position, rotate, aim, type-change, and delete actions create Undo entries. `BoothSpec` serialization includes the complete lighting state for project save/reload and atomic render packages.

## Tests

Run:

```powershell
node --test qa/auto-lighting/auto-lighting-phase1.test.mjs
```

The suite covers new defaults, legacy migration, target and mount detection, Clear/Arm/Invisible selection, wide-logo placement, intent priority, recalculate/approve behavior, stale state, prompt classification, and duplicate placement.

## Phase 1 limitations / Phase 2 candidates

- Phase 1 uses deterministic target and mount heuristics rather than a full mesh-level raycast service outside the browser renderer.
- Approved fixtures can be edited individually from the Auto Lighting panel (X/Y/Z, rotate, aim, fixture type, delete). Phase 1 uses form controls rather than direct 3D gizmos.
- Phase 2 can add per-fixture 3D gizmos, richer lux simulation, photometric IES profiles, drag-to-aim, and automatic revalidation against arbitrary imported mesh surfaces.
