# Studio surrounds — 2026-09-11

Scope: match the supplied reference's pale grey seamless background and satin exterior floor. Do not recreate the reference booth or change flooring, branding, objects, lights, saved project data or UI colours.

`js/studio-environment.js` provides an effectively horizon-free floor matching the background, a restrained shadow catcher, and low-contrast blurred planar reflections of the current booth. Reflections use a 512 px half-float target with the current camera type (perspective or orthographic), throttled to 10 Hz during navigation/drag and refreshed less often at rest. Helpers are excluded, renderer state is restored after the off-screen pass, and rebuilding/disposal releases the target.

The environment remains a `scene-ground` helper group. Clean isolated booth exports continue hiding that group and restoring its visibility afterwards, preserving the existing export workflow.

Visual review: `studio-reference-perspective.png` has no hard horizon seam, a pale neutral surround and subdued blurred reflections. `studio-reference-front.png` confirms the orthographic view renders without shader errors. This is a real-time studio approximation, not the reference's offline-rendered booth materials or geometry.

Browser regression: `studio-environment-smoke.cjs` passed reflection initialization, resource disposal after a rebuild, unchanged objects and booth flooring, perspective/orthographic renders, export restoration and no WebGL errors. Tested in a fresh browser context, not the user's draft.

Backup: workspace `00_เก่า-สำรอง/2026-09-11_before-reference-studio/index.html`.
