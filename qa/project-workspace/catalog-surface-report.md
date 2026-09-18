# Catalog surface audit — 2026-09-18

## Scope and findings

- Audited all 74 built-in catalog definitions (73 visible and one hidden system entry): 35 GLB-backed and 39 procedural entries. Also audited the three active fixture models. All 77 loaded successfully.
- The audit completed before production repair code was added. Raw results: `catalog-surface-audit-before.json`.
- Shading-normal disagreements occurred in 12 catalog definitions and two fixtures. Missing/default-material handling needed adjustment in 31 catalog definitions and one fixture. The union is 34 affected entries.
- TV source models also omit some materials, but their dedicated TV appearance pipeline intentionally supplies a black chassis. These were excluded from fallback recolouring.
- Files privately stored in the user's browser My Asset database were not enumerated in this isolated audit. The same loader repair and preview path is now used when those models are loaded; no customer model bytes are rewritten.

## Repair

- Repair normals only where they oppose the triangle winding. Preserve existing normal direction magnitudes, smoothing and hard-edge boundaries by changing signs, not blanket recomputation. Split shared vertices only when incident faces require contradictory signs; preserve per-corner positions, UVs and other attributes. Flip tangent handedness with normals when applicable.
- Give genuinely absent materials a nonmetal white/default surface. Recognize the exact exported-default signature only for the previously inspected Standee/Counter imports. Do not change explicitly authored colours, black materials, named finishes or metallic materials.
- Apply repair on load before renderer caching and part-editor capture, for both furniture and fixtures. Existing saved appearances are still applied afterward.
- Generate 32 separate corrected catalog previews. Keep previous previews and all source/deployed GLBs intact. Version My Asset preview cache so stale previews regenerate.
- Backup: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/20260918-catalog-surfaces/`.

## Verification

- `catalog-surface-verify.cjs`: all 77 checked; zero remaining opposing-normal corners; 14 entries repaired for normals, 32 for missing/default materials.
- Verified per-triangle positions, UVs, all other non-normal attributes, transforms, mesh names/count, colours, textures and material side settings unchanged. Named finishes unchanged.
- Regression cases: healthy geometry, opposing normals, conflicting shared vertices, tangent handedness, legitimate black/metallic material preservation, idempotence.
- Renderer cache, independent instance colours, stable part-editor keys and save/reopen passed.
- Align/Tag/upload persistence browser smoke passed. Twenty Asset List and project-file unit tests passed. TypeScript and production build passed.
- Visual comparison: `catalog-surface-before-after.png`. Machine-readable result: `catalog-surface-audit-after.json`.

To repeat verification (from repository root):

`node qa/project-workspace/catalog-surface-verify.cjs`

Add `--write-previews` only when intentionally regenerating the corrected previews.
