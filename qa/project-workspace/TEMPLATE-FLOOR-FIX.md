# Template floor finish — 2026-09-11

Botanical Atelier had a fixed wood plane 9 mm above the system floor. Flooring menu selections changed the system material underneath it, leaving the visible template plane unchanged.

The plane now declares `userData.boothFloorFinish`. After catalog construction, the renderer applies its existing `floorMaterial(spec)` to declared floor skins. Template object IDs, dimensions, transforms, borders and floor elevation are unchanged; saved templates need no data migration. Unmarked wood furniture and trims are unaffected.

For floor stickers, the renderer projects a clipped copy of the existing graphic onto visible horizontal floor skins. The graphic retains the system artwork UVs, size and material settings. Rotated horizontal skins are clipped to the sticker rectangle; tilted objects are not flattened or repositioned. The original system-floor sticker remains underneath.

Verification: `template-floor-smoke.cjs` uses a fresh browser context, loads Botanical Atelier, clicks the dark-wood control, checks five different flooring materials against the system floor, checks sticker height and UV bounds, unchanged objects, 10 cm elevation, save/restore and hidden skins. Screenshot: `template-floor-dark-wood.png`.

Baseline suites: 100 project tests and 207 editor tests passed. Backup: `00_เก่า-สำรอง/2026-09-11_before-template-floor-finish/` in the workspace root.
