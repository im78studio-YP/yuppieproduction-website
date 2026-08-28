# Design QA — Photo 360 Radius Mobile Popup

- Source visual truth: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-f087b458-bcdd-4a34-9580-b2e3de978418.png` (desktop radius control) and `D:\YP Job\2026\CoWork\Website_TeamYuppie\613016.jpg` (existing mobile UI language)
- Implementation: `D:\YP Job\2026\CoWork\Website_TeamYuppie\yuppieproduction-website\public\yp-web-ai\index.html`
- Source pixels: 374 × 375 px (desktop control) and 914 × 2048 px (mobile app view)
- Implementation screenshot: unavailable
- CSS viewport and density normalization: unavailable because the browser verification surface blocks the local `file:///` page
- State: Booth Size panel → มุมถ่ายภาพ 360 selected → mobile R trigger → bottom popup open

## Full-view comparison evidence

The existing desktop and mobile interface references were inspected. The revised implementation could not be captured because the browser verification surface rejects local `file:///` pages. No alternate browser automation surface was used.

## Focused region comparison evidence

Static inspection confirms the mobile breakpoint swaps the inline desktop control for a compact R-value trigger. The trigger opens a bottom sheet containing the current value, 3–100 m slider, numeric input, explanatory note, close control, and “เสร็จสิ้น” button. A rendered focused-region comparison is unavailable for the same browser-policy reason.

## Findings

- [P2] Browser-rendered mobile layout and live interaction evidence is unavailable.
  - Location: Booth Size panel and `#mPhoto360Radius` at viewport widths up to 820 px.
  - Evidence: JavaScript syntax and static DOM assertions pass; no post-change screenshot or touch/drag interaction could be captured.
  - Impact: Exact bottom-sheet spacing, safe-area fit, and live slider responsiveness have not been visually confirmed.
  - Fix: Reload the local page on a mobile viewport, select “มุมถ่ายภาพ 360”, open “ปรับรัศมีผนังโค้ง R”, drag from 3.50 m toward another value, and confirm the 3D wall updates immediately.

## Required fidelity surfaces

- Fonts and typography: existing Inter and Noto Sans Thai stack reused; rendered comparison blocked.
- Spacing and layout rhythm: existing panel tokens and 18 px bottom-sheet radius reused; rendered comparison blocked.
- Colors and visual tokens: existing `--acc`, `--acc2`, `--line`, `--bg2`, `--bg3`, `--tx2`, and `--tx3` tokens reused.
- Image quality and asset fidelity: no image assets were added or changed.
- Copy and content: R range is 3–100 m, default is 3.50 m, and mobile actions are written in Thai consistently with the existing UI.

## Comparison history

- Initial pass: changed the default/range and added the mobile bottom sheet; JavaScript syntax and static DOM assertions passed; browser capture remained blocked by the local-file URL policy.

## Implementation checklist

- [x] Set R range to 3–100 m with 0.01 m steps.
- [x] Set the initial R value to 3.50 m in HTML and application state.
- [x] Keep the inline slider and numeric input on desktop.
- [x] Replace the inline control with a popup trigger at mobile widths.
- [x] Add a mobile bottom sheet with synchronized slider, numeric input, close, backdrop, Escape, and “เสร็จสิ้น”.
- [x] Clamp all R values to the valid range and update the 3D scene immediately.
- [x] Close the popup if the booth type changes or the viewport returns to desktop.
- [ ] Capture and compare the rendered mobile state.

final result: blocked
