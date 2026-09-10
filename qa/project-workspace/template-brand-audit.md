# Template branding and detail audit — 2026-09-11

## Scope

31 library templates: Inline 6, Corner 6, Peninsular 17, Island 2. Both Corner orientations are exported and checked, giving 37 preview/project pairs. This is a template-only change, not a migration of customer projects.

## Findings and changes

- Removed reference lettering from the Inline and Peninsular artwork generators, including the HANDA / ARCHELO and generic signage in the two native 6×6 templates.
- Replaced affected signs/screens and existing brand-copy panels with the supplied `YPDefaultLogo` vector. Nested SVG `xMidYMid meet` uses each panel's physical width/height, fixing the previously stretched 0.18-height logo panels without moving or resizing them.
- Retained decorative graphic backgrounds. Existing system-wall branding uses the Yuppie logo; redundant generic wall taglines were removed.
- Added template-instance detail for shell chairs, glass meeting tables, thin glass rims, leaf geometry / hollow planters and separately cushioned sofas. Existing authored custom geometry remains intact.
- Regenerated thumbnails and portable `.ypbooth.json` files from actual editor snapshots, rather than swapping only catalogue images. Updated preview and script cache versions.
- Saved/customer objects are not restyled on load. Template application still uses existing active A/B confirmation flow.

## Verification

- `test:projects`: 100 passed; `test`: 207 passed.
- `test:template-audit`: checks all 31 templates / 37 orientations, Yuppie artwork provenance, aspect-preserving SVG composition, image decode, finite custom geometry, serialization / restore and retained customer brand state.
- Contact sheets: `template-audit-inline.png`, `template-audit-corner.png`, `template-audit-peninsular.png`, `template-audit-island.png`.
- Detailed per-template counts: `template-brand-audit-results.json`. `logos` counts artwork panels, excluding the separate system-wall logo.

## Fidelity boundary

The structural layouts remain approximate editable models based on available reference images. This pass improves materials/furniture detail and branding; it does not certify pixel-identical reconstruction or fabrication readiness. Unseen construction, exact dimensions and inaccessible original image details are not inferred as verified facts. The native 6×6 examples retain their explicitly estimated 3.6 m height.

Backup: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-11_template-brand-audit/`.
