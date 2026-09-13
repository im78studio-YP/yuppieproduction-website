# Logo finishes — 2026-09-13

- Lightbox face emission and front edge bloom now have a 2× gain relative to the initial bloom version. The 0–100% control, Off/zero behaviour and rear-halo intensity are unchanged. Checkpoint: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-lightbox-double-intensity/`.

- Three current choices: painted (`diecut`), rear halo (`backlit`), front-lit lightbox (`light`). Existing `sticker` projects retain their legacy value; it is hidden from new choices unless already selected.
- `logoLight` stores independent enabled/tone/intensity controls. `logoColorMode` allows original uploaded colours or a legacy/user tint. Changing finish never replaces the uploaded artwork. Front-light emission uses the artwork itself as emissive map, preserving cutouts and colour detail.
- Rear halos use a blurred alpha mask on the wall surface, including side/curved walls. This is a lightweight presentation approximation, not physical light transport. Best viewed against a supporting wall; no cones are generated. Raised/cutout edges retain the existing layered-alpha geometry technique, not a manufacturing-ready contour extrusion.
- Front lightboxes now add a padded, artwork-coloured edge bloom. The opaque artwork alpha is removed from the bloom layer so the face itself is not whitened; On/Off and brightness also control this layer. This is a local glow approximation, not full-scene postprocessing.
- Template-copy rear halos raycast nearby visible supporting geometry after world transforms are available and sit 3 mm above the hit surface, fixing the previous 1 mm wall penetration. With no nearby support they remain hidden, rather than floating behind the logo. The first-surface/planar projection is approximate on strongly curved or uneven supports.
- Main branding stores settings on BoothSpec. A selected `brandCopy` stores independent settings in `object.logoFinish`; other template logos remain unchanged. Artwork with a printed background still has that background: this feature does not remove it automatically.
- Existing dimensions, positions, artwork sources, catalog prices and fixture inventory remain unchanged. Finish selection does not calculate a new production quotation.
- Object Undo includes main-logo finish settings. A/B/project snapshots include the new fields. The render prompt describes logo finish and independent lighting; AI compliance is not guaranteed by these checks.

## Verification

`logo-finishes.test.mjs` checks defaults, bounds, original/tint compatibility and prompt semantics. `logo-finishes-smoke.cjs` exercises real Three.js materials, halo position, front emission, unchanged artwork/position, switches, Undo, project serialization, selected template logos and actual panel controls in isolated Chrome. Screenshots: `logo-diecut.png`, `logo-backlit.png`, `logo-light.png`, `logo-controls.png`, `logo-controls-mobile.png`.

`logo-bloom-smoke.cjs` checks bloom On/Off/zero, preserved authored geometry/artwork, a deliberately wall-penetrating test case and the actual Botanical template. Screenshots `logo-bloom-on.png`, `logo-bloom-off.png`, `logo-halo-fixed.png` were visually inspected for visible edge glow and surface halo, not only helper existence. The bloom correction checkpoint is `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-logo-bloom/`.

## Checkpoint

Before-change index: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-13_before-logo-finishes/index.html`. New implementation is in `public/yp-web-ai/js/logo-finishes.js` with scoped index integration. Preserve later unrelated edits when rolling back. No customer draft was modified during testing.
