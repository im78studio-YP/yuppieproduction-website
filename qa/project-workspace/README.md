# Booth designer — phases 1–5

## Phase 5: A/B comparison

The project bar's “เปรียบเทียบ A/B” opens two images and a comparison table.
Images use a shared orthographic frame, orientation, aspect and zoom, centered on
each variant's conservative envelope. The same world unit has the same image scale;
each variant is not independently zoomed to fill its card. Counts are catalog-object
counts, not production BOM quantities, and hidden objects are reported separately.
Differences highlight booth size/area, open sides, purpose, brand/logo presence and
equipment counts. Equal counts do not imply identical placement, materials or geometry.

Rendering occurs sequentially in a disposable off-screen iframe of the same editor.
`comparePreview=1` prevents project-workspace initialization and draft access there.
Each child restores its own embedded assets, so custom model IDs shared between A/B
do not reuse the parent's model cache. Parent selection, history, design and active
variant are untouched by previewing. Messages require the child Window reference and
a per-run random token. Frames and Blob URLs are released on retry/close; close can
cancel an in-flight preview. Errors suppress the pair and preserve the data comparison.
The feature uses existing rendering assets/CDNs and does not send a quote or LINE message.
The non-interactive child skips the local drag-handle ESM import, allowing preview
rendering from file URLs without changing the parent editor's interactive tools.
Uploaded GLB headers and required model templates are checked before publishing the
pair; missing models produce a failure notice, not a successful placeholder image.

Selecting a variant performs the existing explicit A/B switch and opens handoff review;
the other variant remains intact. A missing variant stays missing; the user is guided
to make a copy instead of one being created automatically. Scene changes invalidate
the comparison, but camera/viewport changes do not. Mobile cards stack vertically.

`npm run test:compare:browser` checks single-variant handling, real paired images,
embedded GLB differences, shared camera scale, parent/Undo preservation, responsive
selection-to-handoff, cancellation and failed rendering. Pure camera/count/signature
tests run with `npm run test:projects`.
`node qa/project-workspace/compare-file-smoke.cjs` additionally verifies real A/B
previews and choosing a variant when opening the editor directly with file://.

## Phase 4: advisory readiness review

Review now shows an actual PNG of the selected A/B snapshot and caches that exact
image for the archive (no second render at download). Editing, switching variants,
closing or explicitly refreshing clears the preview; a changed scene blocks stale
exports. Image failures are explicit; the user can opt out and export data only.

The optional event start date joins the existing brief fields. The checklist flags
missing logo/brand, event/venue/dates and inconsistent dates. Footprint warnings use
the editor's collision geometry on cloned objects, including its rotation/scale
handling, with a 5 mm tolerance against the rectangular booth envelope. All objects,
including hidden ones, are inspected. Special booth types and missing geometry are
explicitly unverified. No collision, aisle, load-bearing or venue-rule certification
is claimed, and no warning blocks export or moves/resizes any object. Select-to-fix
closes review and selects the existing object without moving it or unlocking it.
Hidden objects still need to be made visible through the normal object list.

The same advisory report is embedded in brief.json and summary.html. This is not
a production BOM, structural approval or a quotation; LINE remains disconnected.

`npm run test:readiness:browser` checks read-only geometry, scaled/rotated bounds,
select-to-fix, A/B isolation, exact equality of preview/export PNG bytes, field links,
mobile overflow and stale-snapshot rejection. `test:projects` covers report rules,
date validation, unsupported layouts, missing geometry and exported warnings.

## Phase 3: offline handoff

The header's “เตรียมส่งงาน” opens a job/contact form and A/B selection. Review
captures an immutable snapshot; the downloaded ZIP includes only the selected
variant, its embedded assets, brief.json, an escaped printable summary.html,
README.txt and optionally a clean PNG. No network send or LINE login is implemented.
Old simulated LINE/quote success messages have been replaced with offline notices.
Contact information remains in page memory and the ZIP, not in auto-drafts or the
editable project. Refresh clears the form. This is not a quotation or production BOM.
If PNG creation fails, no archive is downloaded until the user retries or explicitly
unchecks the image option. Status confirms a browser download request, not receipt.

`npm run test:projects` includes brief validation, HTML escaping, selected-variant
isolation, ZIP CRC/headers and missing-image labeling. `npm run test:handoff:browser`
tests A/B, real PNG download, explicit failure fallback and mobile layout in an
isolated Chrome profile against port 4173. Generated ZIP/screenshots are QA fixtures.

## Phase 1

The project bar sits above the viewport. It uses the existing visual tokens and
leaves all original control IDs, geometry builders, pricing and quote handlers in place.

## Customer workflow

1. Name the project. Edit variant A with the existing booth tools.
2. Choose **ทำสำเนาเป็น B** to preserve A and start a separate alternative.
3. Switch A/B freely. Replacing an existing alternative requires confirmation.
4. **บันทึกไฟล์** downloads `name.ypbooth.json` containing both alternatives,
   embedded logos/material images and the GLB files referenced by either alternative.
5. **เปิดไฟล์** validates the package and asks before replacing the current project.
6. A browser-local draft is saved after a short idle interval. On reload, a banner
   offers recovery; the old draft is not overwritten until the user chooses.

Use **เครื่องมือขั้นสูง** to reveal Scale, XYZ positioning, flips, Asset Editor
and attachment controls. Core move, resize, rotate, lock, appearance, duplicate,
delete, object list and object undo/redo remain available in basic mode.

## Boundaries

- Files are local, not cloud projects. Drafts are scoped to the current browser/origin;
  `file:`, localhost and the live site have separate storage. Clearing browser data
  removes drafts. Download files for durable backups or transfer to another computer.
- Only the latest project is kept as a recovery draft. Opening another project asks
  the user to save the current one first. A/B is not a full version-history system.
- Switching/opening a valid project clears the old object undo stack. A failed
  restore rolls the design and object history back.
- Export uses an atomic snapshot. Edits during export are not silently included;
  the status asks for another save when further changes were made.
- File limit: 150 MB. Both variants include their own referenced GLBs. Large models
  may increase memory usage. No hosted sharing, real quotation submission or new
  pricing database is implemented in this phase.
- Generated AI request/result caches are omitted; editable scene, AI settings and
  camera state are retained. Existing external render services are unchanged.

## Accessibility and failure states

Project names use a labelled input. Variant and advanced buttons expose pressed
states. Import/overwrite dialogs use native modal focus management, Escape/cancel
and a safe default focus. Editor shortcuts are blocked while these dialogs are open.
Status is announced through `aria-live`; storage errors never report a successful
draft save. Unsupported/corrupt files do not replace the current design.

## Tests

- `npm test` — existing regression suite.
- `npm run test:projects` — portable format, cloning, GLB roundtrip, invalid data,
  image URL safety and imported asset ID isolation.
- `npm run test:projects:browser` — Chrome/Playwright against the Vite server on
  `http://127.0.0.1:4173`. Requires the existing Three.js CDN and Google fonts to
  be reachable. Set `PLAYWRIGHT_MODULE` if Playwright is installed elsewhere.
- `npm run build` — TypeScript + Vite production build.

The browser test uses an isolated browser profile (never the customer's draft).
It covers A/B with objects, PNG logo and a GLB, basic/advanced controls, download
and import, invalid-option rollback, recovery, storage failure and mobile bounds.

## Phase 2 — purpose-based starter layouts

The Business panel now includes **บูธนี้เน้นอะไร?**. Completing Quick Setup also
offers this optional dialog. Skipping it does not apply a template or change objects.
Three goals are available: product display, sales and business meetings.

The preview uses real catalog dimensions and current booth width/depth/open sides.
The plan reserves a 0.9 m circulation area as a **design heuristic, not a venue or
accessibility compliance claim**. Storage rooms get a conservative 0.85 m approach
buffer on exposed sides. Narrow/constrained layouts may omit optional pieces; the
dialog lists omissions. If the core group cannot fit, Apply is disabled.

Templates support Inline, Corner, Peninsular and Island. Special booth types remain
manually editable and display an explanation instead of applying an unsuitable plan.
Island display templates use freestanding displays instead of tall shelves.

Default action: create the layout in the other A/B slot and retain the current one.
Overwriting an occupied alternative requires confirmation. Applying to the current
slot confirms replacement of movable furniture. Locked objects, additional structures,
brand copies, linked children/parents and their groups are retained as obstacles.
The preview shows retained/replaced counts. Brand, finishes, room and dimensions stay
unchanged. Placed furniture remains ordinary editable catalog objects with their
existing prices and normal undo/redo; no new price or AI system is introduced.

`designPurpose` and `starterLayout` metadata persist with each variant and portable
file. The planner is deterministic and data-only; it does not modify scene objects
during preview. Apply checks the scene signature again before creating objects.

- `npm run test:projects` includes planning matrices, collisions, missing catalog,
  unsupported types, meeting-seat orientation and deterministic output.
- `npm run test:starters:browser` covers preview, preservation of A, overwrite cancel,
  locked objects, nested attachment records, editing/undo, file metadata, onboarding,
  blocked room and responsive dialog layout in an isolated profile.
