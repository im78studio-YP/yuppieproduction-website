# AI Rendering Data Flow and Test Plan

Status: Phase 1 foundation  
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

## 4. Planned semantic adapter

The Geometry Manifest phase will generate stable nodes for both explicit and derived Scene elements:

- `booth-floor`
- `wall-back`, `wall-left`, `wall-right`
- `storage-room` and its opening/door
- `branding-main` and side branding
- `lighting-group` and fixture transforms
- `photo360-platform`
- every item in `BoothSpec.objects`
- `camera-active`

Each manifest node will contain a stable ID, type, dimensions, position, rotation, semantic level, geometry constraint, material intent, allowed changes, parent relationship, and source path in `BoothSpec`.

## 5. Planned Clean Screenshot export

1. Wait for pending model and texture loads.
2. Snapshot camera, controls target, renderer size, pixel ratio, exposure, background, and helper visibility.
3. Hide dimension objects and selection helpers.
4. Preserve the current viewport aspect ratio.
5. Resize temporarily so the long edge is at least 1,536 px.
6. Render once and export PNG from the WebGL canvas.
7. Restore every renderer, camera, helper, and viewport setting in `finally`.

The Screenshot will not contain HTML UI because only the Three.js canvas is exported.

## 6. Planned Prompt Builder

The Prompt will be natural language and will not embed the raw Manifest. It will contain four named sections:

1. Geometry constraints — generated from LOCKED transforms and camera data
2. Design/style instructions — generated from STYLEABLE intent and the creativity control
3. Rendering-quality instructions — PBR, GI, AO, contact shadows, reflections, exhibition lighting, buildability
4. Negative constraints — no geometry changes, no missing objects, no unapproved props, no editor overlays

The existing 0–10 control will be redefined as style creativity only. Geometry and camera constraints will remain unchanged at every value.

## 7. Planned Preview

Before Generate, the user will see:

- Clean Screenshot thumbnail and pixel dimensions
- Booth and current-camera summary
- Semantic object list with LOCKED/STYLEABLE/OPTIONAL status
- Optional-prop permissions
- Prompt preview
- Geometry Manifest preview/download
- Validation warnings for missing or inconsistent information

`Render AI` remains disabled until a later integration phase.

## 8. Test plan

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

## 9. Delivery phases

1. Requirements, Data Flow, schema, and migration
2. Geometry Manifest and camera serialization
3. Clean Screenshot export
4. AI permission controls and structured Prompt Builder
5. Render-package Preview and QA
6. Future AI provider integration after separate approval
