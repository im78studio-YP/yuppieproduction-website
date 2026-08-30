# AI Rendering Data Flow and Test Plan

Status: Phase 3 Clean Screenshot export
Schema: `BoothSpec.version = 2`, `aiRendering.schemaVersion = 1`

## 1. Compatibility strategy

The existing `BoothSpec` remains the serializable source of truth. Existing rendering, pricing, material, placement, and prompt functions continue to read the same state. AI Rendering is added as a backward-compatible semantic layer rather than a replacement Scene graph.

Old Scene objects are migrated in memory by normalization functions. Missing AI fields receive safe defaults; existing geometry fields are not changed.

## 2. Data flow

```text
BoothSpec + S.objects + active Three.js camera
                  |
                  v
        Scene Semantic Adapter
                  |
        +---------+----------+
        |                    |
        v                    v
Geometry Manifest      Camera Manifest
        |                    |
        +---------+----------+
                  |
                  v
       Render Package Builder
        |         |          |
        v         v          v
 Clean PNG   Natural Prompt  AI permissions
                  |
                  v
            Preview / QA
                  |
                  v
       Future Render AI integration
```

## 3. Phase 1 state model

`BoothSpec.aiRendering` contains:

- `schemaVersion`: AI Rendering schema version
- `allowOptionalProps`: global gate for optional additions
- `optionalPermissions`: independent permissions for products, plants, people, and props
- `camera`: reserved for the serialized active camera in the camera phase
- `preview`: reserved for non-authoritative preview metadata

Every catalog object in `BoothSpec.objects` contains `ai`:

- `lockLevel`: `LOCKED`, `STYLEABLE`, or `OPTIONAL`
- `geometryLocked`: whether dimensions and transforms are immutable
- `styleable`: whether AI may improve allowed appearance fields
- `presenceRequired`: whether the object must remain in the output
- `optionalCategory`: products, plants, people, props, or `null`
- `materialIntent`: current material/color intent
- `allowedChanges`: allow-list of AI changes

Default policy:

- Structural and principal furniture objects: `LOCKED`
- Decorative plant catalog objects: `OPTIONAL` in category `plants`
- Geometry changes remain disallowed for required objects
- Style changes use explicit allow-lists
- Global optional-prop permission is off by default

The existing `object.locked` field remains an editor-interaction lock and is intentionally separate from `object.ai.lockLevel`.

## 4. Implemented semantic adapter

`window.getGeometryManifest()` now creates a fresh snapshot from the current `BoothSpec`. The Manifest contains:

- a right-handed, metre-based coordinate system with origin at the back-left floor corner
- booth type, W/D/H, floor elevation, wall thickness, present walls, and open faces
- the current serialized camera
- optional-prop permissions
- stable nodes for explicit and derived Scene elements

Generated nodes include:

- `booth-floor`
- `wall-back`, `wall-left`, `wall-right`
- `storage-room` and its opening/door
- `branding-main` and side branding
- individual wall-light fixture nodes and attachment transforms
- `photo360-platform`
- every item in `BoothSpec.objects`
- every catalog object, including structure configuration for entrance frames and downlight beams

Each node contains a stable ID, type, dimensions, position, rotation, semantic level, geometry constraint, material intent, allowed changes, parent relationship, and source path in `BoothSpec`.

`STYLEABLE` nodes remain geometry-locked. Their allow-list excludes position, rotation, and scale so visual freedom cannot silently become layout freedom.

## 5. Implemented camera serialization

`window.getCameraManifest()` returns the active Three.js perspective camera and OrbitControls target:

- preset name or `custom`
- position and target
- up vector
- FOV, near, far, and aspect ratio
- viewport width, height, aspect ratio, and renderer pixel ratio

Camera state is refreshed after a preset selection, viewport resize, orbit, or zoom. An unframed `(0,0,0)` startup camera is rejected and never saved as an authoritative view.

## 6. Implemented Clean Screenshot export

The PROMPT panel now provides `ดาวน์โหลด Clean Screenshot`. The export pipeline:

1. Waits up to 10 seconds for pending models and floor/wall textures.
2. Snapshots the renderer size, pixel ratio, camera aspect, controls state, background, animation state, and helper visibility.
3. Hides the external Scene ground, dimension objects, curved-wall guide edge, and object/branding selection helpers.
4. Uses a neutral clean background while preserving the exact current viewport aspect ratio.
5. Temporarily resizes the drawing buffer so the long edge is at least 1,536 px.
6. Renders once and creates a PNG Blob directly from the Three.js canvas.
7. Creates matching camera and Geometry Manifest snapshots for that capture.
8. Stores only small preview metadata in `BoothSpec.aiRendering.preview`; it never stores the PNG/base64 payload in Scene state.
9. Restores every changed renderer, camera, helper, controls, background, and animation setting in `finally`.

The Screenshot contains no HTML UI because only the Three.js canvas is exported. The public local integration hook is `window.exportCleanScreenshot(options)`; `download`, `minLongEdge`, `background`, `fileName`, `includeDataUrl`, and `assetTimeoutMs` can be supplied when composing a later render package.

## 7. Planned Prompt Builder

The Prompt will be natural language and will not embed the raw Manifest. It will contain four named sections:

1. Geometry constraints — generated from LOCKED transforms and camera data
2. Design/style instructions — generated from STYLEABLE intent and the creativity control
3. Rendering-quality instructions — PBR, GI, AO, contact shadows, reflections, exhibition lighting, buildability
4. Negative constraints — no geometry changes, no missing objects, no unapproved props, no editor overlays

The existing 0–10 control is defined as `stagingFreedom` only. Geometry and camera constraints remain locked through `geometryFidelity = 10` at every value.

### Locked Geometry and Auto-Staging layers

The natural Prompt is split into two independent layers:

- `LAYER A — LOCKED 3D GEOMETRY` contains booth dimensions, floor, walls, storage room, brand-sign geometry, every customer-selected Asset, transforms, attachments, and camera constraints.
- `LAYER B — AI AUTO-STAGING` contains only render-time floating furniture, generic products, people, decor, plants, lighting, and exhibition atmosphere allowed by `BoothSpec.aiStaging`.

`BoothSpec.objects` always represents customer-selected confirmed Geometry. Render-time suggestions are stored separately in `BoothSpec.aiStaging.suggestions` with status `AI Suggested / Render Staging`. Unconfirmed suggestions explicitly set `countsAsSelectedAsset`, `includedInBOQ`, `includedInProductionScope`, and `includedInConfirmedGeometry` to `false`.

Default state:

```text
aiStaging.enabled = true
aiStaging.density = "medium"
aiStaging.allowFurniture = true
aiStaging.allowProducts = true
aiStaging.allowPeople = true
aiStaging.allowDecor = true
aiStaging.allowPlants = true
aiStaging.allowNewPermanentStructures = false
geometryFidelity = 10
stagingFreedom = 6
```

## 8. Planned Preview

Before Generate, the user will see:

- Clean Screenshot thumbnail and pixel dimensions
- Booth and current-camera summary
- Semantic object list with LOCKED/STYLEABLE/OPTIONAL status
- Optional-prop permissions
- Prompt preview
- Geometry Manifest preview/download
- Validation warnings for missing or inconsistent information

`Render AI` remains disabled until a later integration phase.

## 9. Test plan

### Data migration

- A Scene without `aiRendering` receives schema defaults.
- Old objects without `ai` receive catalog-safe defaults.
- Existing dimensions, positions, rotations, prices, and editor locks remain unchanged.
- Duplicated objects retain their AI rule.

### Manifest

- Every visible required Scene element has one stable manifest node.
- Object count and IDs match the Scene.
- Dimensions, positions, and rotations match `BoothSpec` and the renderer.
- Required nodes are never marked optional by default.

### Camera

- Orbit, zoom, and preset changes update the serialized camera.
- Camera position, target, FOV, aspect ratio, and projection match the captured Screenshot.

### Clean Screenshot

- Long edge is at least 1,536 px.
- Aspect ratio matches the viewport within rounding tolerance.
- No dimension lines, dimension labels, grid, selection box, or UI appears.
- Renderer and editor state are restored after success or failure.

### Prompt and permissions

- Prompt values match the current Manifest.
- Style creativity never weakens geometry constraints.
- Optional props are prohibited when the global gate is off.
- Only enabled optional categories appear in allowed additions.
- Raw JSON is not inserted into the natural-language Prompt.

### Regression

- Booth sizing and booth types
- Floor, wall, sticker, logo, lighting, storage, and pricing
- Asset add/move/rotate/duplicate/delete and editor Lock/Unlock
- Desktop and mobile menus
- JavaScript syntax and browser console errors

## 10. Delivery phases

1. Completed — Requirements, Data Flow, schema, and migration
2. Completed — Geometry Manifest and camera serialization
3. Completed — Clean Screenshot export
4. Completed — AI Auto-Staging permission controls and two-layer Prompt Builder
5. Render-package Preview and QA
6. Future AI provider integration after separate approval
