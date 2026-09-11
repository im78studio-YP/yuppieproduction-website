# Booth color themes

Entry: ธีมสี sidebar → preset or custom preview → before/after → ใช้ธีมนี้. Preview uses an isolated frame and must finish before confirmation. Cancel performs no authored-state writes. Changes apply only to the current A/B slot in one object-history transaction.

Persistent data is `spec.boothColorTheme` v1: primary, secondary, accent, name, keepGraphics/keepPlants/keepWood (all preservation flags default true). The original brand CI, object appearance, images, dimensions, poses and prices stay intact. Save/open and Undo/Redo retain the theme. Clearing the theme or undoing restores original materials.

Renderer uses cloned materials, classifying untextured painted surfaces by saturation/lightness. Light neutral surfaces use secondary, dark surfaces use accent, saturated surfaces use primary. Brown wood-like colors and wood-labelled assemblies are conservatively preserved. Texture-bearing and graphics-labelled assemblies, plants, metallic/glass/light materials, locked assets and helpers are excluded by default. Mixed or ambiguous custom assemblies may need visual inspection; the UI states this explicitly. Optional unchecked preservation flags permit tinting the corresponding materials, not replacing images. This is a visual theme layer, not a rewrite of original product material data.

QA: `booth-theme-smoke.cjs` uses a fresh Chrome context with Botanical Atelier, compares protected materials, checks unchanged original objects and other variant, before/after, cancel, Undo/Redo, save/restore, and mobile overflow. `booth-theme-desktop.png` and `booth-theme-390.png` show the preview.

Checkpoint: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-11_before-booth-theme/index.html`. Restore only theme hooks/includes if later edits overlap; preserve all user drafts and other features.
