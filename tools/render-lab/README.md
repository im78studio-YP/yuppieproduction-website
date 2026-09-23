# Yuppie Render Lab — internal only

Isolated booth editor + clean-reference capture + gated OpenAI Images edit harness.
No public website changes. No customer accounts or customer quotas implemented here.

## Start without charges

From the repository root, run `node tools/render-lab/server.mjs`, then open
http://127.0.0.1:4174/. Defaults to locked preparation mode. It makes no OpenAI
request until all three conditions are met: server key, explicit paid-test flag,
and the checked confirmation + render button in the UI.

Use the embedded editor or import a saved `.ypbooth` file. This is a separate
origin/port and `comparePreview=1`; it does not restore or save the live A/B draft.
Unsaved changes in the embedded test editor are discarded when the page closes.
Prepare captures image and camera from one frozen snapshot. Changing the design
or camera after preparation blocks submission until a new capture is made.

## Paid testing requires owner approval first

Do not put the key in HTML, git, browser storage, URLs, or chat. Configure
`OPENAI_API_KEY` in the server process environment using your secret-management
workflow. Only after the owner approves actual billed testing, start the process
with `YP_RENDER_PAID_APPROVED=YES` too. Neither this program nor its tests enable
provider billing, purchase credits, or create keys.

This lab permits **two provider attempts total**, persisted across restarts in
`.render-lab.local/ledger.json` (already ignored by `*.local`). This is not a
customer-account allowance and not a guaranteed baht/dollar spending cap.
There is no reset endpoint, no automatic retry, and only one in-flight request.
Timeouts, HTTP errors, and uncertain outcomes remain counted: inspect provider
usage before authorizing further tests. Do not delete the ledger to retry blindly.
Do not run multiple copies against the same ledger. Bind is localhost only;
do not expose it via tunnels or deploy it as a customer backend.

The model is `gpt-image-2.5-sunburst`, quality `high`, `n=1`, PNG. Output long edge
1536 px, other edge rounded to a multiple of 16, preserving aspect approximately.
One direct `/v1/images/edits` request, no separate text-model call. Access to the
model still depends on the API account. Model alias behavior can change; pin an
approved snapshot after the quality evaluation if repeatability is required.

Raw usage and elapsed time are recorded; missing usage is unknown, not zero.
No fabricated cost or fixed cost-per-image is shown. Review actual provider billing
and record the cost per **acceptable** image, including failed/unsatisfactory tests,
before deciding the public two-renders-per-account budget.

Results are private local PNGs in `.render-lab.local/`. After browser refresh,
previous result links are available in the history JSON. Original inputs are kept
in browser memory only, not in the ledger. Check geometry, asset counts/locations,
logos/text/stickers and presentation quality manually; a prompt is not a fidelity
guarantee. This API result is not guaranteed identical to the ChatGPT example.

## Verification

`node --test tools/render-lab/core.test.mjs`

With the **locked** local server running, also run
`node --test tools/render-lab/http.test.mjs` for origin, Host, file-scope and
paid-endpoint-lock checks. It intentionally refuses an enabled paid-test server.

Tests use fake provider responses; no network call and no bill. Browser preflight
should exercise clean capture while status says locked. Public release still needs
verified login, transactional per-account quota, abuse prevention, durable jobs,
global budget controls and storage/privacy lifecycle; this lab is not those systems.

Sources checked 2026-09-22:
- https://developers.openai.com/api/docs/guides/image-generation
- https://developers.openai.com/api/reference/resources/images/methods/edit
