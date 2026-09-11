# Wall finish routing and paint precedence

Wall and wall-graphic system IDs now route from Asset Settings to the appropriate face in the Finish panel. System geometry remains locked; its surface is editable. The selected face is highlighted and focused. Switching to paint keeps the uploaded sticker image and selects the parent wall instead of leaving a deleted graphic selection.

`spec.wallPaintOverrides.{back,left,right}` stores explicit hex colors. Precedence: per-face paint > booth theme secondary > legacy wall color. The theme renderer skips explicitly painted system walls, including curved back walls. Plan and 3D use the same face-color resolver. The per-face “ตามธีม” button removes only that override. The legacy global white/CI controls explicitly apply color to all currently present wall faces.

Object history now includes wall finish state so paint/sticker toggles and per-face paint edits undo together with retained image data. Saved project snapshots carry the overrides without changing object poses, catalog assets, geometry locks or the other A/B variant.

QA: `wall-finish-smoke.cjs` in a fresh Chrome context checks graphic/wall routing, enabled finish controls, sticker mesh switching, retained image, actual material RGB under two themes, Undo/Redo, save/restore, plan color and 390 px layout. Existing 100 project tests and 207 editor tests pass.

Backup: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-11_before-wall-finish-fix/`. Retain later changes when rolling back.
