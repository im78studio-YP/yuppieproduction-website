# Universal Scene Asset Registry — Task 1

## Scope

Task 1 introduces a registry for every physical scene object without changing drag, Smart Move, Magnetic Snap, geometry, materials, or camera behavior. Cameras and visual/system helpers remain outside the registry.

## SceneAsset schema

```js
{
  id: string,
  name: string,
  assetType: string,
  category: "structure" | "surface" | "furniture" | "branding" |
            "display" | "lighting" | "equipment" | "custom",
  object3DId: string,
  transform: {
    position: { x: number, y: number, z: number },
    rotation: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number }
  },
  bounds: { width: number, height: number, depth: number },
  locked: boolean,
  selectable: boolean,
  movable: boolean,
  snapEnabled: boolean,
  metadata: object
}
```

Stable structure IDs include `structure.floor.main`, `structure.wall.back`, `structure.wall.left`, `structure.wall.right`, `structure.room.main`, and `structure.door.main`. Existing catalog and My Asset IDs are retained unchanged.

## Runtime API

The reusable module is `public/yp-web-ai/js/scene-asset-registry.js`. It exposes `YPSceneAssetRegistry.createRegistry()` and the registry methods:

- `registerAsset(asset, object3D?)`
- `unregisterAsset(assetId, options?)`
- `getAssetById(assetId)`
- `getAssetByObject3D(object3D)`
- `getObject3DByAssetId(assetId)`
- `updateAssetTransform(assetId, transform, options?)`
- `listAssets()`
- `listAssetsByCategory(category)`
- `validateRegistry(sceneRoot, options?)`

The editor also exposes `window.SceneAssetRegistryAPI` for development diagnostics. Physical roots and mesh descendants receive `userData.assetId` and `userData.assetType`. Selection lock remains independent from raycast/snap eligibility, so locked structures can still be selected from Asset List and used as raycast targets.

## Lifecycle and compatibility

1. `BoothSpec.sceneAssetRegistry` is persisted with Project State.
2. A legacy project without registry data is migrated during normalization/load.
3. Registry records are rebuilt from the current Project State without altering existing transforms, materials, geometry, or camera state.
4. Existing user asset IDs remain unchanged; only system geometry receives new stable IDs.
5. Every renderer rebuild rebinds registry entries to newly created Object3D instances.
6. Object history snapshots include the serialized registry, preserving Undo/Redo compatibility.
7. Prompt Builder, Clean Screenshot, and Render Package keep reading the existing Project State. Registry generation uses the same supplied state snapshot rather than reading a different live booth type.

## Asset List grouping

The Asset List groups registered items as structure, walls/floor, room/door, branding, furniture, display, lighting, suggested, custom, and equipment. Rows show Locked, Hidden, Suggested, Approved, and System status when applicable. Structure deletion remains blocked by the existing workflow.

## Excluded objects

Camera, grid, dimensions, bounding/selection outlines, transform/snap/raycast helpers, light helpers, and debug objects are explicitly excluded. The surrounding scene ground is marked as a system helper because it is presentation context rather than booth geometry.

## Development validation

Run `window.validateSceneAssetRegistry()` in Development Mode. Validation reports:

- duplicate asset IDs;
- registry entries without an Object3D;
- physical meshes without `assetId`;
- physical meshes referring to missing registry entries;
- system helpers incorrectly registered as assets.

## Task 1 limitations

- No Smart Snap or movement behavior was changed.
- The registry is an identity/state adapter over the existing renderer, not a renderer rewrite.
- AI staging objects without confirmed 3D geometry remain virtual suggestions until approved by the existing workflow.
