# Before template mixer experiment — 2026-09-11

Checkpoint folder: `D:/YP Job/2026/CoWork/00_เก่า-สำรอง/2026-09-11_before-template-mixer/`.
Contains the exact pre-experiment `index.html` and `project-workspace.js`, including the approved light-grey studio and dimensional lighting. Existing uncommitted work is preserved.

SHA256 at checkpoint:
- index.html: `CE7DF1F0C1D8FD32EA28524C2B02D645D91751E27AF7AF655D05314C5EB99EF0`
- project-workspace.js: `96866FD4856CF4B3D59BE0028720450120C817A981E3E09977AA2CE24811B335`

Experimental UI entry: booth-size/template area → ผสมเทมเพลต / เทมเพลตของฉัน · ทดลอง. The preview uses an isolated comparePreview iframe and does not read/write the workspace draft. The initial release preserves base materials, imports selected catalog objects (whole existing groups), supports independent XYZ offsets and removal of base groups, and detaches imported parts from old attachment targets. Native system walls follow the chosen booth type; custom structures keep their original sizes. Individual transforms happen after confirming the mixed snapshot in the existing editor. Personal templates are local-only; portable .ypbooth.json export is available.

Rollback only this experiment: compare current files with checkpoint first, remove the template-mixer script/style includes and the optional exactArea argument in useTemplate (or restore the two checkpoint files only if no later changes overlap). New feature files use the prefix `template-mixer` in js/css, with associated mixer QA files. Do not reset the repository or remove any user draft/assets. Personal mixed templates live in the separate IndexedDB database `yp-personal-templates-v1`; disabling the UI must not delete that database.
