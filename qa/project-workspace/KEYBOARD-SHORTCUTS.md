# Keyboard shortcuts — 2026-09-11

Added a project-bar help button and F1 dialog, with tooltips and `aria-keyshortcuts` on Undo, Redo, Delete and Save. Ctrl/Cmd+Z, Shift+Z, Y and S use physical `KeyboardEvent.code` (key fallback), supporting Thai and English layouts. Commands invoke existing button handlers and respect their disabled states, workspace readiness, busy state and pending drafts.

Editor commands are suppressed during text input, number input, selection controls, contenteditable editing, IME composition, key repeats and open dialogs. Native text Undo remains available. Escape handling now checks editing/modal state before cancelling canvas selection. Existing project-save and editor shortcut listeners were consolidated to prevent duplicate operations.

Undo/Redo retain the editor's existing history scope; this does not add history for every project setting. Comparison frames do not install the new shortcuts or UI.

Browser verification: `keyboard-shortcuts-smoke.cjs` passed English and Thai-key Undo/Redo, Delete, locked-object protection, input/contenteditable/IME/repeat safety, settings and help-dialog isolation, F1/Escape focus return, mobile layout, one Save download and tooltips. Fresh browser context only; no customer draft modified. Baseline tests: 100 project + 207 editor tests passed. Visual inspection: `keyboard-shortcuts-390.png`.

Backup: workspace `00_เก่า-สำรอง/2026-09-11_before-keyboard-shortcuts/`.
