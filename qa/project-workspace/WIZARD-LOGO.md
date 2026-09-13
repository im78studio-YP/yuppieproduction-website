# Wizard logo upload — 2026-09-13

- Step 4 has a prominent, expanded logo-upload card above theme/floor/room customization. PNG/SVG/WebP/JPG files reuse the logo replacement decoder and proportional fitting, with a 10 MB upload cap and opaque-image acknowledgement.
- The upload lives only in the Wizard controller. `result()` first builds a detached snapshot and then applies the draft logo to that snapshot; the real preview and final commit use this same path. Main branding and classified logo slots update, while screens/posters, geometry and lighting settings remain untouched. Locked slots are skipped.
- Going back and choosing a different template retains the upload. The logo reset and full-original reset restore the new base's own artwork. Closing/restarting the Wizard invalidates async file loads and discards the draft. Failed uploads retain the previous valid choice.
- Loading/unacknowledged opaque artwork disables Next/Finish, including late preview acknowledgements. Existing preview readiness and A/B stale-design guards remain in place. Step 5 includes the uploaded filename in the review summary.
- Blank layouts without visible logo positions (notably blank Island) explicitly report that there is no visible slot; the image is retained for later use, without inventing new booth geometry.

Verification: `wizard-logo-smoke.cjs` uses isolated Chrome to exercise real 3D preview, unchanged live design/media/geometry, upload retention/reset, opaque warning, mobile layout, cancellation/session reset and final commit into B with A preserved. The regular project/lighting/rendering unit suites are also run.

Checkpoint: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-wizard-logo/`. No user tab or draft was modified during QA.
