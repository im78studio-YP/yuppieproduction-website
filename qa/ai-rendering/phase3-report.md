# AI Rendering Phase 3 QA Report

Date: 2026-08-29  
Scope: Clean Screenshot Export (Local only)

## Implemented

- Added a `ดาวน์โหลด Clean Screenshot` action to the PROMPT panel.
- Added `ThreeBoothRenderer.exportCleanScreenshot()` and the public `window.exportCleanScreenshot(options)` hook.
- Export waits for pending GLB models and floor/wall image textures before capture.
- The output preserves the active viewport aspect ratio and uses a minimum long edge of 1,536 px.
- Dimension helpers, selection helpers, curved-wall guide edge, external ground, and all HTML UI are excluded.
- The active camera and Geometry Manifest are captured against the same export viewport.
- Renderer size, pixel ratio, camera aspect, controls, background, visibility, and animation state are restored in `finally`.
- Preview metadata is stored without persisting PNG/base64 data in `BoothSpec`.

## Verification

- JavaScript syntax: passed using the bundled Node.js runtime.
- `git diff --check`: passed (line-ending notice only).
- Browser button visibility/enabled state: passed.
- Local browser export: passed.
- Produced PNG: `1536 × 1137 px`, preserving the tested `782 × 579` viewport aspect ratio.
- Visual inspection: no HTML toolbar, dimensions, selection box, or external dark ground; booth geometry, branding placeholder, material, and lighting remain visible.
- Post-export editor canvas restored to `782 × 579`; camera controls remain enabled.
- Browser error/warning log after export: empty.

## Deployment

No production/server upload was performed.
