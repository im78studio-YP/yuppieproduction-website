# Replace equipment

Select a single unlocked, ungrouped catalogue object → เปลี่ยนอุปกรณ์ → choose from the catalogue → inspect isolated 3D preview → confirm. Same-category filter is initially selected; all categories and My Asset are supported. Cancel leaves the scene untouched.

Replacement preserves object identity, base-center XYZ, Euler rotations, orientation and flips. It uses the new catalogue constructor's dimensions, unit price, geometry, appearance and unit scale. Custom structure data, old branding and attachments are not copied. Other objects remain in place; attachments to the replaced object are detached. Undo/redo include link changes in one transaction. A stale source or changed A/B slot blocks confirmation.

Preview reuses the isolated template preview transport. Its comparePreview context does not read or write user drafts; messages require matching origin, frame and per-session token. Rapid choices are serialized and confirmation waits for the latest preview. Errors offer retry. Editor keyboard shortcuts are suppressed while the dialog is open.

QA: `asset-replace-smoke.cjs` uses a fresh browser context, not the user's profile. Screenshots cover desktop, 390 px and 768 px. Existing project and editor tests are also run.

Pre-feature backup: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-11_before-asset-replace/index.html`. To roll back after later changes, remove only replacement hooks and includes rather than overwriting unrelated work. Template mixer and user drafts are independent and must be retained.
