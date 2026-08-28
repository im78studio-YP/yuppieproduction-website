# UX Audit — Selecting Assets in a Crowded Booth

## Scope

- Product surface: YP_WEB_ONLINE Beta 1.1 booth editor
- User goal: reliably select one Asset when several Assets overlap in the 3D scene
- Evidence: current desktop 3D scene, Asset menu, and floor-plan view at 1191 × 912 CSS px

## Steps

1. **View a crowded 3D scene — Needs improvement**
   - Five Assets are present. Four similar entrance frames overlap visually on the right.
   - Direct picking depends on a small visible surface and gives no way to choose among intersecting hits.

2. **Open the Asset menu — Needs improvement**
   - The panel shows the Asset catalog but not a list of Assets already in the scene.
   - Users therefore have no deterministic selection path when direct 3D picking becomes ambiguous.

3. **Switch to floor plan — Partial fallback**
   - Top-down footprints make locations clearer and each footprint can be selected.
   - Repeated labels overlap and closely spaced objects remain difficult to distinguish, especially on mobile.

## Recommendation

Add a `รายการในฉาก` (Scene Objects) list at the top of the Asset panel. Number repeated instances, show Lock state, and give each row Select and Focus behavior. Keep direct 3D picking for speed, but when multiple ray hits overlap, display a small picker or cycle through candidates. Retain floor plan as a secondary spatial fallback, not the primary selection method.

## Accessibility risks

- Pure 3D clicking has no reliable keyboard or screen-reader selection path.
- Small or overlapping surfaces create poor touch targets on mobile.
- A semantic scene list with 44 px rows, visible selection, and announced lock state would address both risks.

## Evidence limits

- Screenshot review confirms layout and visible interaction affordances only.
- Full keyboard and assistive-technology behavior requires implementation testing.
