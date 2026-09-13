# Logo replacement — 2026-09-13

- Fresh templates classify standalone logo/text placeholders as `logoSlot.kind=logo`; screens, posters and composite imagery are `media`. Logo slots use transparent Yuppie artwork and cutout finish by default. Physical fascia/panels are not removed.
- Clicking a logo opens Signage with a scoped upload button. Both that button and the former `+ โลโก้` entry address the selected logo (or main branding when no object is selected).
- The dialog supports local PNG/SVG/WebP/JPG, preview on a checkerboard, cancel, selected/all logo scope and explicit rectangular-panel opt-in. Files are rasterized locally, cropped to their alpha bounds and fitted without distortion inside unchanged slot geometry. SVGs are loaded as images, never inserted as live markup.
- Opaque images require acknowledgement. No automatic white/background removal: white may legitimately belong to the artwork. Partly transparent images may still contain printed background areas; users must inspect the preview.
- Light type, tone, intensity, transforms and dimensions are preserved. All targets update as one Undo item; main branding image fields are now included in Undo/Redo. Locked targets and stale project/object sessions are rejected before any mutation. Async file previews are invalidated on close or a newer upload.
- Saved projects are not auto-migrated. Legacy original template IDs are classified read-only. To clear an old sample's baked backdrop, explicitly choose `ใช้โลโก้ Yuppie โปร่งใส` and confirm. Unknown/custom graphic objects are not swept into bulk changes.
- Media graphics can still contain a Yuppie example embedded in poster/screen content; bulk logo replacement intentionally does not edit those images. Template-library thumbnails are existing reference previews, not regenerated renders.

## Verification

`logo-slots.test.mjs` covers the role allowlist. `logo-replacement-smoke.cjs` exercises all 36 template snapshots, transparent defaults, real scene raycast selection, preview/cancel, scoped/bulk changes, unchanged other objects, retained lighting, opaque-file warning, Undo/Redo, save/restore, stale-session protection, atomic lock rejection and narrow-screen layout. It uses an isolated browser; no customer tab/draft is modified.

Checkpoint: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-logo-replacement/`. Restore only scoped changes; preserve subsequent unrelated edits.
