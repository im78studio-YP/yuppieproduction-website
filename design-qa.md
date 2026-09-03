# Design QA — Lightbox ชั้นสีหน้า 5D

## Source visual truth

- Rounded-edge target: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-ea94235a-d6d0-4402-a633-dac6f9c2da55.png` (501 × 509 px).
- Internal-gap defect reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-059fd32f-5336-49d1-8d88-3249cc20458b.png` (501 × 253 px).
- Requested behavior: every colored region and filled gap between letters shares one front plane, while the true outside silhouette keeps the glossy rounded fillet.

## Implementation evidence

- Browser-rendered close implementation: `qa/lightbox-maker/artifacts/front-color-5d-curve-restored-implementation.png` (1190 × 906 px; CSS viewport 1190 × 906 at density 1).
- Focused side-by-side evidence: `qa/lightbox-maker/artifacts/front-color-5d-curve-restored-comparison.png`.
- Tested state: default two-line artwork at close zoom, outer white and pink rings, build mode `ชั้นสีหน้า 5D`, height 5 mm, outer-edge radius 2 mm, assembled 3D view.

## Comparison findings

- Full view keeps the existing interface, typography, spacing, palette, canvas framing, and controls unchanged; the fix is limited to generated 5D geometry.
- The focused reference exposes recessed pink islands between `Light` and `Studio`; these are separate same-color components enclosed by other front colors, not actual outside edges.
- The implementation classifies every same-color component against `frontFit`, the actual front support after the 0.2 mm fit clearance: only components adjacent to that boundary enter the five-band quarter-round generator.
- Enclosed same-color islands and every internal color mesh retain their full flat footprint at z=0; the focused post-fix capture shows those gaps flush with the pink, white, and letter faces.
- Multiple color volumes remain separate in the 3MF for multicolor printing, but visually and dimensionally form one continuous front module.
- Smooth normals and gloss remain scoped to the physical outer fillet; the fixed five-segment profile avoids height-dependent mesh growth.

## Regression verification

- The radius control remains exclusive to the 5D work category and continues to rebuild the model.
- Standard, service, and shell modes still use their existing prism paths.
- Browser console: 0 warnings and 0 errors.
- Inline JavaScript syntax, TypeScript, production build, and all 162 project tests passed after the geometry split.
- No actionable P0, P1, or P2 issue remains for the requested flush-face/outer-only treatment.

## Required fidelity surfaces

- Fonts and typography: source text, font weight, line arrangement, and antialiasing are unchanged.
- Spacing and layout rhythm: application panels, canvas crop, controls, and model proportions are unchanged.
- Colors and visual tokens: the existing pink, white, charcoal, and dark UI tokens are preserved; the correction changes geometry only.
- Image quality and asset fidelity: comparison uses the supplied defect screenshot and a browser-rendered close capture of the live mesh; no raster substitute is used in the product.
- Copy and content: no customer-facing labels or values changed in this iteration.

## Comparison history

1. Previous pass removed fillets from adjoining color boundaries but still rounded the outer loop of every disconnected component belonging to the outer-ring color.
2. Latest reference identified the remaining P1 defect: enclosed pink components in letter gaps were recessed despite not touching the outside silhouette.
3. Added component-to-panel boundary classification and routed enclosed components through the flat prism path.
4. Close browser capture and focused side-by-side comparison confirm that the formerly recessed gaps now share the common front plane.
5. The first classification compared trimmed color masks with the larger raw `G.panel`; the 0.2 mm fit margin made real outside components look internal and removed their fillet (P1).
6. Changed the comparison support to `frontFit`, restoring the rounded outside highlight while keeping enclosed gap components flat.
7. The latest combined comparison confirms both required states together: curved outer edge and flush internal gaps.

## Final result

passed

---

# Design QA — Separate 5D Rounded and Chamfer Work Types

## Source of truth

- Rounded-edge reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-ea94235a-d6d0-4402-a633-dac6f9c2da55.png`
- Adjustable Chamfer reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-56161e28-dbd4-461b-a148-6abfe108e064.png`
- Requested behavior: restore the existing rounded 5D edge and expose adjustable Chamfer as a separate work type with a 45° default.

## Implementation evidence

- Rounded implementation: `qa/lightbox-maker/artifacts/face5d-rounded-restored-3d.png`
- Chamfer implementation: `qa/lightbox-maker/artifacts/face5d-chamfer-separate-45.png`
- Viewport: 1191 × 912 CSS px at browser density 1.
- Tested in assembled 3D view with the default YP Lightbox Studio two-line artwork.

## Required fidelity surfaces

- Work-type hierarchy: the selector now has independent “5D ขอบโค้งมน” and “5D ขอบ Chamfer” entries.
- Rounded geometry: the original five-segment fillet path and its radius control are restored unchanged.
- Chamfer geometry: the one-slope outer-edge path remains isolated to the new work type; angle defaults to 45° and can be adjusted from 20–70°.
- Parameters: rounded mode displays only its radius; Chamfer mode displays only Chamfer height and angle. Shared 5D height remains available in both.
- Production outputs: labels, README text, checks, and 3MF filenames identify the selected edge treatment.

## Interaction and regression checks

- Selected Chamfer, changed angle from 45° to 60°, and returned it to 45° successfully.
- Switched from Chamfer to rounded and back; each mode restored the correct exclusive controls without stale UI.
- Existing saved projects that contain `edgeR` remain rounded; short-lived Chamfer state without `edgeR` migrates to the new Chamfer mode.
- Full automated suite: 165/165 tests passed.
- Production build: passed.
- Browser console warnings/errors: 0.

## Comparison history

1. Prior implementation replaced the rounded 5D mode with Chamfer, causing the original work type to disappear.
2. Current implementation restores the rounded fillet path and adds a separate Chamfer work type instead of overwriting it.
3. Reference and implementation screenshots were inspected together; no actionable P0, P1, or P2 issue remains for the requested separation.

## Final result

passed

---

# Design QA — Adjustable 5D Chamfer Angle

## Source visual truth

- Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-56161e28-dbd4-461b-a148-6abfe108e064.png`.
- Source pixels: 1898 × 891 px.
- Scoped target: the 5D front uses a chamfered outer profile and exposes an adjustable chamfer-angle control whose default is 45°.

## Implementation evidence

- Browser-rendered implementation: `qa/lightbox-maker/artifacts/chamfer-45-implementation.png`.
- Focused side-by-side evidence: `qa/lightbox-maker/artifacts/chamfer-45-comparison.png`.
- Implementation pixels and CSS viewport: 1190 × 922 px at density 1.
- Comparison board: 2635 × 808 px; both captures were proportionally normalized to 760 px content height without cropping.
- State: `ชั้นสีหน้า 5D`, assembled 3D view, Chamfer height 2.0 mm, Chamfer angle 45°.

## Full-view comparison evidence

- The reference and implementation both present the chamfer controls alongside the live 3D model.
- The implementation intentionally retains the existing YP Lightbox Studio dark/pink design system; this is a scoped feature reference rather than a full-screen visual clone.
- The outer 5D wall now uses a single planar chamfer band instead of the former multi-segment fillet, while internal color boundaries remain flat.

## Focused region comparison evidence

- The combined board shows the reference 45° angle control and the implementation `มุม Chamfer` control at 45° in the same comparison input.
- The reference uses a larger 5 mm upper section, so its chamfer is visually broader. The implementation preserves the product's existing 2 mm edge-height default; this is an accepted P3 difference outside the requested angle-default change.

## Required fidelity surfaces

- Fonts and typography: existing application family, weight, size, line height, and antialiasing remain unchanged; the two new labels follow adjacent control typography.
- Spacing and layout rhythm: the new angle row uses the existing row, slider, numeric input, unit suffix, and panel spacing with no overflow.
- Colors and visual tokens: all existing dark surfaces, pink controls, neutral text, borders, and active states are reused.
- Image quality and asset fidelity: the live result remains WebGL geometry; no raster substitute, placeholder, or generated asset was introduced.
- Copy and content: `ความสูง Chamfer` and `มุม Chamfer` distinguish profile size from angle; the default visibly reads 45°.

## Interaction and regression verification

- Selected the 5D work category and opened the assembled 3D view.
- Entered 35° through the numeric control, confirmed the slider and model recomputed, then restored 45°.
- Unit verification confirms 30°, 45°, and 60° produce different horizontal chamfer runs, with 45° producing equal rise and run.
- Browser console: 0 warnings and 0 errors.
- All 165 project tests, TypeScript validation, inline application JavaScript parsing, and the production build passed.

## Findings

- No actionable P0, P1, or P2 issue remains for the requested adjustable-angle feature.
- P3: the default 2 mm chamfer height is subtler than the 5 mm reference upper section; it can be revisited as a separate dimensional decision.

## Comparison history

1. Initial implementation exposed the angle and replaced the outer fillet with a single chamfer surface.
2. Browser interaction verified 35° and return to the 45° default without visual or console errors.
3. Side-by-side review found no blocking mismatch within the requested scope.

## Final result

passed

---

# Design QA — Hollow 5D Front Light Path

## Source visual truth

- Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-c13888c4-85b2-4236-ab79-b82a1f2c7504.png`.
- Source dimensions: 512 × 474 px.
- Requested correction: the 5D relief height must not become the solid color-layer thickness; retain the rounded raised edge while opening an internal light path.

## Implementation evidence

- Browser-rendered plate view: `qa/lightbox-maker/artifacts/front-color-5d-hollow-plate.png`.
- Focused plate crop: `qa/lightbox-maker/artifacts/front-color-5d-hollow-plate-focus.png`.
- Lit state: `qa/lightbox-maker/artifacts/front-color-5d-hollow-lit.png`.
- Assembled rounded-edge state: `qa/lightbox-maker/artifacts/front-color-5d-hollow-assembled.png`.
- Full comparison: `qa/lightbox-maker/artifacts/front-color-5d-hollow-comparison.png`.
- Focused comparison: `qa/lightbox-maker/artifacts/front-color-5d-hollow-focused-comparison.png`.
- Implementation pixels and CSS viewport: 1190 × 906 px at density 1; focused crop 470 × 350 px. Comparison board: 1200 × 520 px.
- Tested state: build mode `ชั้นสีหน้า 5D`, color skin 0.6 mm, raised wall 5 mm, outer radius 2 mm, diffuser 0.4 mm.

## Full-view comparison evidence

- The source shows the problematic front as one solid-height colored mass.
- The implementation keeps the same 5 mm overall relief and rounded outline, but the front module now contains a 0.6 mm color skin, a 0.4 mm diffuser directly behind it, and a hollow raised perimeter wall.
- The box, front module, and back remain three separately printable groups on the build plate.

## Focused region comparison

- `front-color-5d-hollow-focused-comparison.png` puts the source defect and revised plate view in one board.
- The revised front remains visually thin at the emitting surface while the perimeter retains visible height; the black box and back are unchanged.

## Required fidelity surfaces

- Fonts and typography: existing UI font family, sizes, weights, wrapping, and hierarchy are unchanged; only the parameter label was clarified to `ความหนาชั้นสีหน้า`.
- Spacing and layout rhythm: the restored color-thickness control uses the existing row, slider, numeric input, and spacing tokens with no overflow.
- Colors and visual tokens: the existing pink, white, black, dark-panel, active-state, and material colors are preserved.
- Image quality and asset fidelity: WebGL geometry remains vector/mesh rendered; no raster substitute or placeholder asset was introduced. Rounded highlights remain smooth in the assembled close view.
- Copy and content: status and manufacturing guidance now distinguish `ความหนาชั้นสีหน้า` from `ความสูงสีหน้า 5D` and describe the hollow light path.

## Findings

- No actionable P0, P1, or P2 issue remains for the requested geometry change.
- Height interaction verified at 5 mm → 10 mm → 5 mm while color thickness remained 0.6 mm.
- Assembled, lit, exploded, and build-plate controls were exercised; the new 5D wall travels with the front module in exploded mode.
- Browser console errors/warnings: 0.
- All 163 project tests, TypeScript validation, production build, inline application JavaScript parsing, and `git diff --check` passed.

## Comparison history

1. Earlier state: `height5d` was assigned directly to `colorT`, producing a 5–10 mm solid colored face and placing the diffuser behind that mass.
2. Fix: split the stack into a thin color skin, adjacent diffuser, hollow perimeter wall using `faceH`, and a rear fitting lip aligned to the box at `faceH`.
3. Follow-up fix: added `face5dwall` to the exploded-view transform so every front-module component moves together.
4. Post-fix evidence: the focused comparison, assembled close view, lit view, and 5/10 mm interaction check show the requested behavior without changing the existing visual system.

## Final result

passed

---

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

---

# Design QA — Fill Transparent Logo Holes Default

## Source visual truth

- Reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-7b871058-6bb4-421d-a690-587c0a4a4617.png`
- Reference pixels: 280 × 111.
- Requested state: image/logo mode with “ปิดช่องโปร่งภายในโลโก้” checked by default.

## Implementation evidence

- Full browser screenshot: `qa/lightbox-maker/artifacts/fill-logo-holes-default-checked.png` (1280 × 720 pixels).
- Focused comparison crop: `qa/lightbox-maker/artifacts/fill-logo-holes-default-checked-focus.png` (308 × 160 pixels).
- CSS viewport: 1280 × 720 at device pixel ratio 1.25.
- State: image source tab selected, no image uploaded yet, checkbox checked.

## Full-view and focused comparison

- The full view confirms the existing dark YP Lightbox Studio layout and image-source state remain unchanged.
- The focused source and implementation were inspected together; the checkbox, label, surrounding spacing, colors, and adjacent inner-border control match the requested state.
- Density and crop differ because the source is a small reference crop; the focused implementation crop preserves the UI at native browser density without stretching.

## Required fidelity surfaces

- Fonts and typography: unchanged existing font family, size, weight, and hierarchy.
- Spacing and layout rhythm: checkbox row and adjacent control spacing are unchanged.
- Colors and visual tokens: existing dark panel, blue checked state, pink slider, and gray fields are preserved.
- Image quality and asset fidelity: no new image assets; the supplied screenshot is used only as state reference.
- Copy and content: image mode continues to display the exact label “ปิดช่องโปร่งภายในโลโก้”.

## Findings and interaction checks

- No actionable P0, P1, or P2 differences.
- Fresh image-mode state reports the checkbox as checked.
- The text and image modes still store their checkbox values independently, so a user override remains isolated to the active source type.
- Browser console warnings/errors: 0.
- Automated suite: 166/166 passed.
- Production build: passed.

## Comparison history

1. Earlier default stored `fillHolesImage: false`, so switching to image mode cleared the checkbox.
2. The image-mode default is now `true`; the existing independent state and event binding were preserved.
3. Post-fix focused comparison confirms the requested checked state with no visual regression.

## Final result

passed
