# Camp design QA

Source: `docs/camp/reference.webp`, the first displayed concept selected by the user.
Implementation: `docs/camp/desktop.webp` and `docs/camp/mobile.webp`.
Full comparison: `docs/camp/comparison.webp` (reference left, implementation right).
Focused station comparison: `docs/camp/stations-comparison.webp`.

## Evidence and scope

Source pixels: 1672 × 941, normalized to 1536 × 864 for comparison.
Desktop screenshot: 1536 × 864 CSS/pixels, deviceScaleFactor 1.
Portrait screenshot: 390 × 844 CSS/pixels, deviceScaleFactor 1.
State: camp overview, story incomplete. The illustrative concept says stage 4; the running game correctly shows its actual stage 1. Images are newly generated separate cutouts rather than an exact extraction of the illustration. Existing gameplay and unlock rules take precedence over illustrative labels and invented mock state.

Evidence was captured from the running Vite application with local Chromium/Playwright. A hosted cloud-browser preview was not available; this report does not claim one.

## Findings and fixes

- [P1, resolved] Original hover/camera movement rotated or scaled whole stations. Fixed shared frontal camera, fixed cutouts, independent projected HTML buttons, slight selection zoom only.
- [P1, resolved] Initial implementation retained primitive station geometry. Added separate transparent illustrations for all six stations, fire layers, protagonists, flag and supplies, plus backdrop and ground.
- [P2, resolved] Camp header overlapped combat/debug UI. Camp now hides combat HUD and the debug panel; heading stays at the upper left.
- [P2, resolved] Primary gate label wrapped. Enlarged its available width and increased the gate's visual prominence.
- [P2, resolved] First portrait return from a panel left a focused hidden button outside the viewport, causing document scrolling. Clipped the camp screen, made hidden panels inert and noninteractive, and reran the complete portrait journey.
- [P2, resolved] Sprites could stretch when replacement art had different proportions. Cutouts now fit within their configured boxes while preserving their natural aspect ratio.
- [P2, resolved] First background layout left uncovered areas in portrait. Background scale now follows the shared camera's aspect fitting.

Post-fix screenshots and combined comparison show a centered gateway as the primary destination, fire and protagonists in the foreground, distinct equipment stations on both sides, readable independent labels and clear paths. The reference's dense environmental clutter is intentionally reduced for independently replaceable assets and readable interactions.

## Required fidelity surfaces

- Typography: legible system sans-serif, uppercase station labels, stable readable UI sizes independent of world scale, hierarchy between primary entrance and supporting stations. Actual progress and equipment names are retained.
- Spacing/layout: six labels remain inside the desktop viewport with no overlapping bounds; portrait buttons move to a two-column dock with the entrance spanning both columns, minimum target height 44 px.
- Color: warm amber fire and gate against a dark woodland/city backdrop; inherited station accent colors distinguish functions. Equipment and ground keep earthy colors.
- Images: separate raster art, transparent openings/edges, consistent frontal perspective; no baked UI labels. Aspect preservation and bottom-center anchors verified. Phosphor provides UI icons.
- Copy: Russian UI and existing unlock conditions; the entrance dynamically changes to «ПРОДОЛЖИТЬ БОЙ» when returning from combat.

## Interaction checks

Verified in browser: settings audio toggle, locked-station explanation, archive and return, keyboard station activation, all six portrait targets, story launch and intro, hidden controls becoming inert, pause → camp → resume battle. No JavaScript page exceptions. New camp assets load successfully. Two resource-error console messages were observed during the development run; the response listener recorded no failed camp request. Missing pre-existing sprite/arena art remains outside this change; no claim of a completely clean asset console is made.

`npm run build` and `git diff --check` pass. Vite retains its existing large-bundle warning.

## Follow-up polish

- Final author-created illustrations can replace the concept assets through the documented layout contract.
- Hand-painted contact shadows and additional low foreground foliage would bring environmental density closer to the concept.
- Exact ground-texture seam quality and animation frames can be refined with final art.

final result: passed
