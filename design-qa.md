# Design QA — Smart Move

## Source of truth

- Interaction reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-2f553cfc-08bc-452d-bc1a-3612048c52e7.png`
- Existing YP_WEB_ONLINE visual system in `public/yp-web-ai/index.html`
- Requested behavior: drag an Asset without choosing X/Z, Y, or Surface first; retain the three explicit modes as advanced controls.

## Implementation evidence

- Desktop screenshot: `artifacts/smart-move-desktop.png` (1280 × 720 viewport)
- Mobile screenshot: `artifacts/smart-move-mobile.png` (390 × 844 viewport)
- Side-by-side comparison: `artifacts/smart-move-comparison.png`
- Tested state: Asset catalog active, one counter selected, anchor helpers visible, Smart Move active.

## Comparison and findings

- Preserved the existing dark/gold component system, toolbar position, button sizing, selection box, and anchor colors.
- Replaced the three always-visible movement choices with one primary `Smart Move` action and a secondary `ปรับละเอียด` disclosure.
- Desktop keeps all normal object actions on the toolbar. The disclosure closes after an advanced mode is selected.
- Mobile keeps the toolbar visible after the Asset panel closes. The advanced controls open in a three-column pop-up above the toolbar without covering the right navigation rail.
- Body drag changes X/Z while retaining Y. A pointer drag changed the counter from X 3.00 / Y 0.00 / Z 2.15 to X 4.80 / Y 0.00 / Z 5.15; Undo restored the previous scene state.
- Direct anchor drag can resolve X/Y/Z from a target anchor or surface; magnetic preview helpers remain editor-only.
- Browser console check reported no warnings or errors.

## QA history

1. First mobile pass found the toolbar disappeared when the Asset panel was closed.
2. Added a persistent `asset-tool-active` state so the selected Asset workflow remains available with the panel collapsed.
3. Second mobile pass found the advanced menu clipped by the horizontal toolbar overflow.
4. Changed the mobile disclosure to a focused pop-up and hid sibling actions only while it is open.
5. Re-tested desktop, mobile, advanced-mode switching, drag, Undo, DOM IDs, inline JavaScript syntax, and console logs.

## Final result

passed

# Design QA — Island Booth

## Source visual truth

- Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-aa173f55-b47d-4597-aa6b-7a02cf078f21.png`
- Source dimensions: 369 × 218 px.
- Requested state: add `Island` as an enabled booth type with all four sides open while preserving the existing booth-type card system.

## Implementation evidence

- Browser-rendered full view: `artifacts/island-booth-full.png`.
- Focused booth-type menu: `artifacts/island-booth-menu.png`.
- Side-by-side source/implementation comparison: `artifacts/island-booth-comparison.png`.
- Browser viewport and full screenshot: 1191 × 912 CSS px at device pixel ratio 1; no density normalization required.
- Focused implementation crop: 401 × 245 px.
- Tested state: `Island` selected at the default 6 × 3 × 2.4 m booth size.

## Full-view comparison evidence

- The new `Island — เปิด 4 ด้าน` card uses the same type scale, border, radius, spacing, and gold selected state as the existing booth-type cards.
- The three-column grid now uses the formerly open slot on the second row without changing the existing cards or surrounding hierarchy.
- The 3D scene shows the full floor footprint without perimeter booth walls.

## Focused region comparison evidence

- The side-by-side comparison shows the original five-card menu on the left and the extended six-card menu on the right.
- Existing labels, card density, and visual tokens are preserved; the only intentional structural change is the added `Island` card and its explanatory note.

## Required fidelity surfaces

- Fonts and typography: existing Thai/English font family, weights, sizes, and line heights are unchanged.
- Spacing and layout rhythm: card gaps and three-column grid alignment match the reference; no overflow or clipped controls were found.
- Colors and visual tokens: dark surface, neutral border, muted helper text, and gold active state reuse existing tokens.
- Image quality and asset fidelity: no raster or icon assets were introduced; the live 3D viewport remains sharp at density 1.
- Copy and content: `Island`, `เปิด 4 ด้าน`, and the no-perimeter-wall explanation accurately describe the new behavior.

## Interaction and regression verification

- Selecting `Island` updates the active card, scene tag, floor-only geometry, and type note.
- Geometry Manifest and Prompt report `Island`, no booth walls, and all four sides open.
- Wall-mounted branding automatically switches to floor-standing mode, preventing a logo from appearing on a nonexistent back wall.
- Wall-light mode switches off and cannot be re-enabled while Island has no booth walls.
- Browser console check: 0 warnings and 0 errors.
- Inline JavaScript syntax check and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 issues remain.

## Comparison history

- Initial reference had five active booth types and no Island option.
- Implementation enabled the existing Island data model, added no-wall normalization, and corrected the Prompt's open-side list to include the back side.
- Post-fix visual and interaction checks passed without additional visual changes.

## Final result

passed

---

# Regression QA — Asset Overlap, Above-Wall Height & Peninsular Storage Walls

## Reproduction

- Adding the same Asset twice used a placement search that forced non-overlap, so the second object moved to another grid point.
- Editing height with proportional scaling also changed the footprint; the collision guard could reject the whole edit even though Asset height is allowed above the booth wall.
- Storage-room panels reused the Peninsular back-wall thickness, rendering interior room walls at 0.30 m instead of the normal 0.10 m.

## Fixed behavior

- New and duplicated Assets use the global overlap policy and may intentionally occupy the same X/Z position.
- Height edits are accepted up to the existing 50 m Asset limit, including when proportional lock changes W/D.
- Peninsular booth back wall remains 0.30 m; only generated storage-room panels use 0.10 m.
- Geometry Manifest records the storage-room wall thickness as 0.10 m.
- Entrance-frame height uses the shared 50 m Asset ceiling instead of the booth-wall height; its initial value still follows the wall.
- The Inspector and Asset Settings modal now update the same `structure.height` source of truth, including proportional edits and reset-to-original.

## Verification

- Browser test: added two counters consecutively; Prompt data reported both at X 3.00 m / Z 2.15 m.
- Browser test: changed a counter from 1.00 m to 3.50 m high in a 2.40 m booth with proportional lock enabled; the Scene retained 3.50 m.
- Browser test: Inspector changed an entrance frame from 2.40 m to 3.50 m and retained it after switching panels.
- Browser test: Asset Settings changed the same entrance frame to 4.20 m with proportional lock; closing and reopening retained 4.20 m, and reset restored 1.00 × 2.40 × 2.40 m.
- Local preview reloaded with zero console errors.
- `git diff --check`: passed.

---

# Regression QA — Front-of-Booth Asset Staging

## Reproduction

- The catalogue `เพิ่ม` action called the automatic in-booth placement search.
- A large My Asset such as `S_Beam 01` could not fit the booth footprint, so the UI reported `พื้นที่ไม่เพียงพอ` and did not create the object.

## Fixed behavior

- Clicking `เพิ่ม` in either the built-in catalogue or My Asset always creates the Asset outside the front edge of the booth.
- The first staged Asset starts from the booth's left edge; each later staged Asset is placed to the right of the previous front-staged Asset with a 0.25 m gap.
- Every staged Asset is marked as free placement and allowed outside the booth, including structural and uploaded GLB Assets.
- Explicit desktop drag-and-drop still uses the exact floor point selected by the user and is not changed by staging.

## Verification

- Browser test in a 6 × 3 m booth: the first 1.20 × 0.60 m counter was staged at X 0.60 / Z 3.55 m.
- Browser test: the second counter was staged at X 2.05 / Z 3.55 m, preserving the 0.25 m gap between footprints.
- Browser test: My Asset `S_Beam 01` (5.40 × 1.64 × 0.20 m) was created without the former insufficient-space error at X 5.60 / Z 4.05 m; its back footprint begins at Z 3.23 m, outside the 3.00 m booth depth.
- Browser test: the structural downlight beam also remained free-standing in the front staging row at X 11.55 / Z 3.40 m.
- The direct 3D drop handler remains unchanged and still uses the user's selected floor point.
- Browser console check: 0 errors or warnings.
- Inline application JavaScript syntax check: passed.
- `git diff --check`: passed.

## Final result

passed

---

# Design QA — Anchor Lock Move Feedback

## Interaction contract

- Hovering a visible Asset Point enlarges it and changes it to red before drag begins.
- Pointer Assist uses a fixed screen-space capture radius around each Point: 22 px for mouse/pen and 28 px for touch, independent of camera distance.
- The nearest Point inside that capture radius takes priority over the Asset surface, so an approximate click still locks the intended Point.
- Click-hold on that Point uses it as the locked source anchor for Smart Move.
- While a valid Magnetic Snap is active, the locked Point changes to green and the live status reads `Snap สำเร็จ ปล่อยเมาส์ได้`.
- Releasing the pointer completes placement and returns the Point to its normal anchor color.

## Verification evidence

- Tested in the local preview at `http://127.0.0.1:4173/yp-web-ai/index.html` with a counter Asset.
- Visual hover check: Point enlarged and rendered red; the 3D canvas cursor changed to `grab`.
- Pointer Assist check: hovering 18 px outside the visible Point still selected the intended Point and showed the red hover state.
- Priority check: a click-drag from the assisted area over the Asset surface moved the Asset by the Point rather than selecting the mesh surface.
- Live drag check: the canvas cursor changed to `grabbing`, Magnetic Snap was acquired, and the status changed to `Snap สำเร็จ ปล่อยเมาส์ได้` before pointer release.
- Post-release check: the Asset remained at the snapped position and the active Point returned to its normal visual state.
- Browser console check: 0 errors or warnings.
- Inline application JavaScript syntax check: passed.

## Final result

passed

---

# Design QA — My Asset GLB Resizing

## Source of truth

- Issue reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-dce561d8-a49f-42ac-9fec-b901b7fa13d8.png`
- Requested behavior: My Asset `.glb` dimensions must resize the rendered model, and Asset height must be allowed above the booth-wall height.

## Implementation evidence

- Asset settings height field now accepts `0.01–50.00 m`; booth height is no longer used as an Asset-height ceiling.
- Height-only edits retain the existing footprint and bypass wall-height collision rejection; width/depth changes retain structure-collision validation.
- Uploaded GLB catalogue entries explicitly expose the `resizable` capability.
- Every cloned GLB model is scaled from its loaded template bounds to the selected Scene object's current width, height, and depth.
- The settings helper text makes the above-wall limit discoverable without changing the existing dark/gold modal hierarchy.

## Verification

- Reloaded the local app at `http://127.0.0.1:4173/yp-web-ai/index.html`.
- Verified the live settings field reports `max="50"` and accepts `3.50 m` for a `2.40 m` booth.
- Verified the updated menu copy and bottom-toolbar guidance are present.
- Inline application JavaScript syntax check: passed.
- Browser console warnings/errors: 0.

## Final result

passed

---

# Design QA — Asset Toolbar Bottom Placement

## Source visual truth

- Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-4201b163-a20c-4ef2-bbb5-80aacea4ca51.png`
- Source dimensions: 1143 × 681 px.
- Requested state: an Asset is selected while the Asset catalog is open; the floating menu must not cover the selected object.

## Implementation evidence

- Browser-rendered screenshot: `00_เก่า-สำรอง/asset-toolbar-bottom-qa.png`
- Side-by-side comparison: `00_เก่า-สำรอง/asset-toolbar-bottom-comparison.png`
- Desktop viewport and implementation pixels: 1280 × 720 CSS px at browser density 1.
- Mobile responsive check: 390 × 844 CSS px.
- Normalization: both desktop images were padded without distortion to a common 1280 px panel width in the comparison image.

## Full-view comparison evidence

- The reference menu obscures the selected Asset and its geometry helpers in the middle of the 3D canvas.
- The implementation anchors the toolbar 16 px from the viewport bottom and centers it to the visible 3D area, keeping the Asset unobstructed.
- The desktop toolbar remains within the 3D pane rather than centering across the right settings panel.
- On mobile, the existing bottom bar remains 10 px above the viewport edge and horizontally scrollable.

## Focused region comparison

- A separate crop was not required because the affected toolbar, selected Asset, viewport edge, and right panel are all clearly visible in the full-view comparison.

## Required fidelity surfaces

- Fonts and typography: unchanged from the existing toolbar.
- Spacing and layout rhythm: bottom spacing is consistent at 16 px desktop and 10 px mobile; no viewport overflow detected.
- Colors and visual tokens: existing dark surface, gold selection state, borders, and shadows remain unchanged.
- Image quality and asset fidelity: 3D Asset rendering and selection helpers are unchanged and remain visible.
- Copy and content: all existing commands and labels are preserved.

## Findings

- No actionable P0, P1, or P2 issues remain.
- Browser console check: 0 errors.
- Inline JavaScript syntax check: passed.

## Comparison history

1. Earlier reference state: toolbar followed the click point and covered the selected Asset.
2. Fix: replaced pointer-relative placement with viewport-bottom placement centered on the live 3D view bounds.
3. Post-fix evidence: `asset-toolbar-bottom-comparison.png` shows the selected object unobstructed; desktop and mobile geometry checks confirm correct bottom offsets.

## Final result

passed

---

# Design QA — Asset Context Menu & Settings

## Source of truth

- Interaction reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-11add6d1-dc90-490e-9f73-2fa1d5f8d08b.png`
- Existing YP_WEB_ONLINE dark/gold visual system in `public/yp-web-ai/index.html`
- Requested behavior: show controls whenever an Asset is clicked, add left–right/top–bottom Flip, and expose per-Asset size and surface settings.

## Implementation evidence

- Desktop screenshot: `00_เก่า-สำรอง/asset-context-menu-qa.png`
- Side-by-side comparison: `00_เก่า-สำรอง/asset-context-menu-comparison.png`
- Mobile breakpoint tested at 390 × 844; desktop tested at the normal 1280 × 720 viewport.

## Comparison and findings

- Preserved the existing compact dark toolbar, gold selected state, type scale, borders, and selected-object helpers.
- Desktop menu moves near the clicked Asset and clamps to the viewport; it dims during drag and returns after release.
- Mobile retains a fixed, horizontally scrollable bottom control bar so touch users do not lose the selected Asset actions.
- Added Flip left–right and top–bottom while keeping the selected Asset on the same base elevation.
- Added a desktop side sheet and mobile bottom sheet for custom name, proportional or independent dimensions, color, and uploaded sticker.
- Settings are stored on the selected Scene object, included in Undo/Redo snapshots, 3D rendering, Prompt data, and Geometry Manifest.
- Empty-scene click clears the selection and hides the contextual controls.
- Inline JavaScript syntax and desktop/mobile UI flows were re-tested after the final CSS pass.

## Final result

passed
