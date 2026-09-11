# Inline · Soft Wave Pavilion

Reconstructed as one editable booth from the user's two perspective references:
`codex-clipboard-30c80027-c5ee-492f-8c5e-aa3d0f4b771e.png` and
`codex-clipboard-ae57ae5f-71e1-434b-ae68-9b58e5a6c95b.png`.

- 6 m frontage × 3 m depth, Inline, 50 separately editable objects.
- Estimated crown height 3.6 m; top of floodlights 3.8 m. These are visual estimates, not measured construction dimensions.
- Continuous stepped/radiused fascia with warm luminous trim, shallow soffits, 8 recessed lights (4 actual local light sources), 3 top flood fixtures.
- White shell and integrated rear-right storage nook with flush door, back screen, 5 infographic panels, oak slats, low planting trough, white reception, two tables and six grey tub chairs.
- All 10 artwork slots use the supplied Yuppie vector logo with `xMidYMid meet`; decorative diagrams and screen landscape are locally authored, with no source slogans, fake contact details, certifications or original brands. Reference captions/border are not modeled.
- Standard editable booth floor, no template floor overlay: material changes remain usable.
- Custom shell hides only generated wall/graphic instances for this fresh template. No changes to customer drafts, legacy templates, transforms, snapping or pricing rules.
- Exposed in Inline library, Wizard, template mixer (dynamic library), and standalone Inline overview. Apply uses existing confirmation/active A/B transaction.

Implementation: `js/inline-soft-wave.js`, small hooks in Inline builder/bridge and renderer. Existing files backed up in `00_เก่า-สำรอง/2026-09-11_before-inline-soft-wave/` before editing.

Verification: `node qa/project-workspace/soft-wave-smoke.cjs` generates both real 3D thumbnails and portable `.ypbooth.json`; checks finite geometry, branding slots, save/restore, 7-card library, apply/cancel, A/B isolation, editable floor, Wizard entry and mobile dialog. `inline-templates.test.mjs` includes the new design. Browser tests use a fresh context, not the user's draft.

Limitations: geometry/material preview rather than photorealistic AI output; estimated depth/height of concealed storage. Structural clearances, accessibility and local organizer height limits must be checked before production.
