# Two-layer business brief — 2026-09-11

Three optional fields (`product`, `audience`, `activities`, max 240 characters each) are stored as `spec.businessBrief` in the active variant. The business sidebar edits this data without rendering or mutating geometry. Wizard fields edit its draft only and transfer on completion, including the template completion path. Missing fields in old projects remain empty.

The render panel contains “โจทย์ธุรกิจที่ AI จะใช้”, editable through a link back to the business panel, and expandable category guidance. The actual Structure Enhancement prompt combines category context with the specific customer brief. Existing geometry, uploaded branding, materials and enhancement permissions take priority over either layer. Enhancement-off prompts prohibit additions; suggestions do not add catalog objects or BOQ items.

The business category and normalized brief are part of the atomic render payload/signature. Editing them invalidates a prepared render package, so an old screenshot/prompt package cannot silently remain current. The brief is serialized with the normal project state and remains isolated per A/B variant.

Fixed legacy category suggestion merging: slice after the deduplicated user-choice count, not the original number of repeated objects. The new business context also deduplicates selected objects before category fallback.

Verification:
- `business-brief.test.cjs`: 3 tests passed (0/1/20/53 duplicate objects, normalization, permission rules and geometry protections).
- `business-brief-smoke.cjs`: inputs → actual prompt/review; atomic stale detection; save/restore; unchanged objects and B variant; edit link; Wizard draft and template transfer; enhancement-off; 390 px layout; no page errors. No AI generation/provider request was made.
- Existing suites: 100 project + 207 editor tests passed.
- Visually reviewed `business-brief-review.png` and `business-brief-390.png`.

Backup: workspace `00_เก่า-สำรอง/2026-09-11_before-business-brief/`.

Not included: automatic catalog recommendations, 3D placement, or an image-quality A/B evaluation against an AI provider. These changes improve the information sent; they do not prove a measured improvement in generated images.
