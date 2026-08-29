# Design QA — Smart Move

## Source of truth

- Interaction reference: `C:/Users/Admin/AppData/Local/Temp/codex-clipboard-2f553cfc-08bc-452d-bc1a-3612048c52e7.png`
- Existing YP_WEB_ONLINE visual system in `public/yp-web-ai/index.html`
- Requested behavior: drag an Asset without choosing X/Z, Y, or Surface first; retain the three explicit modes as advanced controls.

## Implementation evidence

- Desktop screenshot: `artifacts/smart-move-desktop.png` (1280 × 720 viewport)
- Mobile screenshot: `artifacts/smart-move-mobile.png` (390 × 844 viewport)
- Side-by-side comparison: `artifacts/smart-move-comparison.png`
- Tested state: Asset catalog active, one counter selected, anchor helpers visible, Smart Move active.

## Comparison and findings

- Preserved the existing dark/gold component system, toolbar position, button sizing, selection box, and anchor colors.
- Replaced the three always-visible movement choices with one primary `Smart Move` action and a secondary `ปรับละเอียด` disclosure.
- Desktop keeps all normal object actions on the toolbar. The disclosure closes after an advanced mode is selected.
- Mobile keeps the toolbar visible after the Asset panel closes. The advanced controls open in a three-column pop-up above the toolbar without covering the right navigation rail.
- Body drag changes X/Z while retaining Y. A pointer drag changed the counter from X 3.00 / Y 0.00 / Z 2.15 to X 4.80 / Y 0.00 / Z 5.15; Undo restored the previous scene state.
- Direct anchor drag can resolve X/Y/Z from a target anchor or surface; magnetic preview helpers remain editor-only.
- Browser console check reported no warnings or errors.

## QA history

1. First mobile pass found the toolbar disappeared when the Asset panel was closed.
2. Added a persistent `asset-tool-active` state so the selected Asset workflow remains available with the panel collapsed.
3. Second mobile pass found the advanced menu clipped by the horizontal toolbar overflow.
4. Changed the mobile disclosure to a focused pop-up and hid sibling actions only while it is open.
5. Re-tested desktop, mobile, advanced-mode switching, drag, Undo, DOM IDs, inline JavaScript syntax, and console logs.

## Final result

passed
