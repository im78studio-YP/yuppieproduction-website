# Copy along booth axes

The existing equipment toolbar and Asset List copy entry open a compact modal with X/Y/Z, +/−, number of additional copies, distance, cm/m, and edge-gap versus step mode. X/Y/Z are fixed booth axes (Y is vertical), not camera-relative axes.

Edge-gap uses the combined rendered world AABB, including arbitrary rotation, flips and scale. For multiple selected objects the entire selection is one repeated set. Gaps are measured between enclosing bounds, not curved surface distances. Each set preserves relative positions and gets independent group IDs.

Preview clones the rendered meshes with disposable translucent material; no objects, IDs in the project, attachment graph, prices or history are committed until confirmation. For previews above 1500 mesh instances, translucent bounds are used. Only preview-owned materials and geometries are disposed; shared original geometry remains alive.

Enter confirms valid inputs; Esc/cancel removes ghosts without changing the design. Confirm rechecks source state and locks, then commits all copies in a single existing `mutateObjects` transaction. Attached objects retain their world pose but copies detach from original targets. Unselected objects and the original attachment graph are preserved. Stale previews cannot commit. No collision resolution, snapping or booth-bound clamping is applied; conservative AABB overlap/outside warnings are informational.

Resource limit: 1–100 repetitions, at most 300 new objects in one operation. Positions are not constrained to the booth. System logo copying keeps its previous dedicated single-copy behavior; generated system walls/floors are not converted to editable catalog copies.

Tests: `copy-array.test.mjs`, `copy-array-smoke.cjs`; rotated/scaled rendered bounds, offsets in six directions, edge-gap units, input validation, preview isolation/cleanup, Enter/Esc, atomic Undo/Redo, negative Y, stale/locked guards, grouping, portable serialization and responsive layout. Browser tests use a fresh isolated Chrome context.

Backup: `00_เก่า-สำรอง/2026-09-12_before-copy-array/index.html`.
