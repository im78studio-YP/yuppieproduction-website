# AI Rendering Requirements — YP_WEB_ONLINE

Status: Approved product requirement  
Recorded: 2026-08-29

## 1. Product goal

YP_WEB_ONLINE is a Web Sketch tool for constructing an accurate exhibition-booth reference. The web application is not required to create the final photorealistic image itself. Its responsibility is to define the booth dimensions, floor plan, geometry, object transforms, openings, circulation, branding placement, and camera view before handing a controlled render package to an AI image-generation system.

The final AI image is presentation output only. It must never become a new geometry source for the web application.

## 2. Required workflow

1. The web application creates the booth structure and layout.
2. The user chooses the final camera view.
3. The system exports a Clean Screenshot from that exact camera.
4. The system builds a Geometry Manifest from the current Scene.
5. The system builds a structured natural-language Prompt from the same Scene.
6. The user previews the Screenshot, Manifest, Prompt, camera data, and AI permissions.
7. The Screenshot and data package are passed to AI Image Generation.
8. AI preserves the original geometry and camera while improving design and rendering quality.

## 3. Core principles

- The Web Sketch is the mandatory geometry reference and the single source of truth.
- AI must not move, remove, add, resize, rotate, or reshape locked geometry.
- AI may creatively improve materials, colors, finishing, graphics, branding treatment, lighting, shadows, reflections, and atmosphere only within the declared permissions.
- The system locks structure while allowing design and rendering freedom.
- AI output is not imported back as geometry.
- Optional products, plants, people, props, or scene dressing may be added only when the user explicitly allows them.

## 4. Scene semantic levels

### LOCKED

Floor, walls, structural elements, booth dimensions, openings, walkways, principal furniture, required equipment, object quantity, object transforms, and the selected camera. Geometry and presence are mandatory.

### STYLEABLE

Color, material, finishing, graphic treatment, branding appearance, lighting treatment, reflections, shadows, and surface detail. Style freedom must not change the underlying geometry or placement.

### OPTIONAL

Products, plants, people, props, and supporting scene dressing. AI may add or modify these elements only when both the global permission and the relevant category permission are enabled.

The semantic level does not replace explicit constraints. Every manifest object also declares whether geometry is locked, whether presence is required, and which changes are allowed.

## 5. Web-controlled information

- Booth dimensions and booth type
- Floor, wall, storage-room, and structural geometry
- Openings, walkways, and circulation
- Furniture/equipment quantity, dimensions, position, and rotation
- Graphic, logo, display, and equipment placement
- Camera position, target, up vector, field of view, projection, and viewport aspect ratio
- AI semantic level and allowed changes for every Scene element
- Permission to add optional props, by category

## 6. Clean Screenshot requirements

- Capture only the 3D Scene; do not include the application interface.
- Hide grids, axes, dimension lines, labels, selection boxes, bounding boxes, and editing helpers.
- Use the exact current user camera.
- Preserve the current viewport aspect ratio.
- Export the long edge at no less than approximately 1,536 pixels.
- Use a clean background and neutral, readable lighting.
- Keep every important shape and opening clearly visible.
- Restore all editor helpers and renderer settings after export.

## 7. Render package

The package sent to AI must contain:

1. Clean Screenshot PNG
2. Geometry Manifest
3. Camera Manifest and booth dimensions
4. Natural-language Prompt with separate sections:
   - Geometry constraints
   - Design/style instructions
   - Rendering-quality instructions
   - Negative constraints
5. Optional-prop permissions

The Geometry Manifest must remain separate from the natural-language Prompt. Raw JSON must not be inserted into the Prompt text area.

## 8. Prompt intent

The system Prompt must communicate that the attached Screenshot is a mandatory geometry reference; booth dimensions, layout, walls, structures, openings, object count, transforms, and camera are immutable. AI may improve only the permitted materials, colors, finishing, graphics, lighting, reflections, and atmosphere.

Rendering-quality guidance should request physically plausible PBR materials, global illumination, ambient occlusion, contact shadows, realistic reflections, professional exhibition-hall lighting, dimensional realism, and buildable results.

Negative constraints must prohibit UI chrome, grids, axes, dimension labels, geometry changes, missing required objects, unapproved new props, distorted perspective, and non-buildable structural inventions.

## 9. Acceptance criteria

- Web Sketch geometry and the selected camera are authoritative.
- Users can classify Scene elements as LOCKED, STYLEABLE, or OPTIONAL.
- Clean Screenshot output is free of editor overlays and ready for image-reference use.
- Prompt and Manifest are generated from the actual current Scene.
- AI receives both the visual reference and explicit geometry constraints.
- Optional props are added only with explicit user permission.
- Existing booth design, pricing, placement, lighting, material, and mobile workflows continue to work.
- Data Flow and testing procedures are documented.

## 10. Delivery constraint

Changes must be developed and verified locally first. Production upload or deployment requires separate explicit approval from the user.
