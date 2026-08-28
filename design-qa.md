# Design QA — คานไฟดาวน์ไลท์

- Source visual truth: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-8ff12a90-ad12-40e6-a551-d652f8adc636.png`
- Downlight model: `public/yp-web-ai/assets/lights/Downlight_V1.glb`
- Implementation: `public/yp-web-ai/index.html`
- Verified preview: `http://127.0.0.1:4173/yp-web-ai/index.html`
- Verified viewports: desktop 1191 px wide and mobile 390 × 844 CSS px

## Functional verification

- The Asset catalog shows `คานไฟดาวน์ไลท์` in the booth-structure group.
- Default dimensions are 6.00 m long, 0.30 m deep, 0.20 m thick, installed at 2.40 m, with 5 downlights.
- A new beam uses the current booth width and height, so a 6 m booth receives a 6 m full-width beam.
- The default mounting now follows the correction reference: the beam's rear edge meets the front face of the rear wall, the beam projects into the booth, and the beam's top is flush with the wall top.
- For the 6 × 3 × 2.4 m Inline booth, the verified beam base-center is X 3.00, Y 0.00, Z 0.25 m (0.10 m wall + half of the 0.30 m beam depth).
- The `ชิดด้านหน้าผนังหลัง · เสมอยอดผนัง` action restores the reference mounting after a manual move, rotation, or height change.
- Dragging, rotating, or changing the installation height intentionally releases the automatic wall attachment so custom placement remains possible.
- Changing beam length and downlight count updates successfully; the tested values 5.00 m and 7 lights were accepted.
- Downlights use equal spacing calculated from `beam length / (light count + 1)`, preserving equal end margins.
- Length, depth, thickness, installation height, light count, beam color, and light color are editable.
- Ceiling-mounted collision checks are separated from floor Assets, while beam-to-beam collision remains active.
- Move, rotate, duplicate, delete, Lock / Unlock, Undo, Redo, Snap 5 cm, and PROMPT descriptions remain connected.
- The supplied `Downlight_V1.glb` and catalog reference image return HTTP 200 from the local preview.

## Responsive and runtime verification

- The beam inspector fits within a 390 px mobile viewport with no page-level horizontal overflow.
- JavaScript syntax parsing passed for the full inline application script.
- The local browser loaded the 3D canvas, created the beam editor, and showed all default control values.
- No console errors were observed while adding and inspecting the corrected beam.
- Temporary QA Assets were removed after testing.

## Findings

- No blocking layout, interaction, model-loading, or responsive issues remain.
- No files were uploaded to the production server.

final result: passed
