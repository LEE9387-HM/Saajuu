# Saajuu Loop Log

## 2026-07-22 - Cycle 14

### Selected Work

Increase the default depth of yearly and tarot content without bringing back long chaotic scrolling.

### Acceptance Criteria

- Expand yearly editorial cards from 3 to 4 per topic.
- Expand tarot catalog prompts from 4 to 6 where needed.
- Make yearly and tarot empty states feel less placeholder-like.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/fortune.test.js
- CHANGELOG.md
- PROJECT_STATUS_README.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- Yearly and tarot are denser now, but other free-content surfaces like weekly, seasonal landing copy, and non-visible admin-side text still need a separate editorial pass.
- The page is structurally shorter thanks to tabs, but more topic-specific content still needs stronger reuse patterns before SEO-scale expansion.

### Next Suggested Work

- Expand the same density pattern into weekly and compatibility editorial blocks, then review admin tooling for content QA.

## 2026-07-22 - Cycle 13

### Selected Work

Reduce scroll in yearly/tarot sections with tabs and tighten the visible service copy.

### Acceptance Criteria

- Split yearly fortune into summary, editorial, and monthly tabs.
- Split tarot into spread, insights, and questions tabs.
- Make the first visible copy shorter and more verdict-first.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/main.js
- src/styles.css
- CHANGELOG.md
- PROJECT_STATUS_README.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- The yearly and tarot sections are easier to scan now, but deeper long-form default content is still needed for empty-state trust on yearly, tarot, and future seasonal pages.
- Some older copy outside the currently visible yearly/tarot path still deserves a dedicated editorial cleanup pass.

### Next Suggested Work

- Expand yearly topic dictionaries again and add denser default text for empty states and SEO-facing free content.

## 2026-07-22 - Cycle 12

### Selected Work

Expand the annual-fortune editorial layer and add a topic-specific tarot question catalog.

### Acceptance Criteria

- Add seasonal quarterly notes to the annual fortune block.
- Add a visible tarot question catalog with topic-aware prompts.
- Normalize broken strings inside the annual/tarot generators.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/fortune.test.js
- src/main.js
- src/styles.css
- CHANGELOG.md
- PROJECT_STATUS_README.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- The annual and tarot blocks are denser now, but the remaining long-form editorial dictionaries for yearly, weekly, and campaign landing content are still relatively shallow.
- Some older unrelated copy outside the currently rendered annual/tarot paths may still contain historical encoding damage and should be cleaned in a dedicated pass.

### Next Suggested Work

- Expand the yearly topic dictionaries again with deeper per-topic narrative sections, then connect those sections to admin-side content review tooling.

## 2026-07-22 - Cycle 11

### Selected Work

Increase the density of the default yearly fortune and tarot content without making the page longer in a chaotic way.

### Acceptance Criteria

- Add denser interpretation cards to yearly fortune.
- Add next-step guidance to each monthly chip.
- Add concise interpretation cards and more follow-up prompts to tarot.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/fortune.test.js
- src/main.js
- src/styles.css
- CHANGELOG.md
- PROJECT_STATUS_README.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- The default content is denser, but some older strings in legacy fortune dictionaries still have mojibake risk and should be normalized in a dedicated cleanup pass.
- The yearly/tarot cards are stronger, but annual, weekly, and seasonal content still need a fuller editorial pass if ad-driven traffic becomes a priority.

### Next Suggested Work

- Expand annual fortune topic dictionaries and seasonal templates so each topic has richer long-form copy, not only denser summary cards.

## 2026-07-22 - Cycle 10

### Selected Work

Auto-fill the consultation opener from the latest compatibility result and clean up the durable status documents.

### Acceptance Criteria

- When a linked relationship already has a fresh compatibility result, reuse that summary in the consultation opener.
- Reset stale compatibility summaries when the user switches to a different linked relationship.
- Rewrite the durable status documents in clean Korean.
- Run npm test and npm run build.

### Result

done

### Files Changed

- src/main.js
- PROJECT_STATUS_README.md
- CHANGELOG.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- The consultation opener is now more specific, but deeper quality still depends on the server-side LLM orchestration and prompt shaping.
- Historical auxiliary docs outside the main handoff set may still contain older mojibake and should be cleaned when they matter again.

### Next Suggested Work

- Use the most recent compatibility result to generate 2-3 sharper starter chips in the consult view so the user can begin with one tap instead of editing a long prefilled message.

## 2026-07-22 - Cycle 9

### Selected Work

Tighten the relationship-linked flow so compatibility and consultation keep the selected relationship context.

### Acceptance Criteria

- Keep relationship linking browser and DB flow unchanged.
- Preserve the selected relationship context when opening compatibility from a linked card.
- Add a direct consultation CTA from the compatibility result.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/main.js
- src/styles.css
- CHANGELOG.md
- PROJECT_STATUS_README.md
- LOOP_LOG.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- Compatibility still requires the user to re-enter counterpart birth data for privacy, so the remaining friction is intentional rather than technical.
- Historical documentation files still contain older encoding damage and need a separate cleanup pass.

### Next Suggested Work

- Reduce relationship follow-through friction further by pre-filling consultation opener text from the latest compatibility result and tightening the relationship card copy around the most-used actions.

## 2026-07-21 - Cycle 8

### Selected Work

Deepen relationship compatibility output so it leads into real conversation and consultation, not just a score.

### Acceptance Criteria

- Keep compatibility browser-only.
- Add relationship-flow, next-step, and follow-up question blocks.
- Make compatibility guidance differ by relationship type.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/fortune.test.js
- src/main.js
- src/styles.css
- CHANGELOG.md
- PROJECT_STATUS_README.md
- VERSION
- package.json
- package-lock.json

### Verification

- npm test
- npm run build

### Remaining Risk

- Earlier historical changelog entries still contain some legacy encoding damage and should be cleaned in a separate documentation pass.
- Relationship-linked invite flow still asks the user to re-enter counterpart birth data for compatibility, which is intentional for privacy but still adds friction.

### Next Suggested Work

- Improve relationship-linked flow so a connected person card can open directly into compatibility guidance and a prefilled consultation start without extra orientation copy.

﻿# Saajuu Loop Log

## 2026-07-21 - Cycle 7

### Selected Work

Expand the tarot free-content block so it feels as substantial as yearly flow, without adding server dependencies.

### Acceptance Criteria

- Keep tarot browser-only.
- Upgrade tarot from a single-card summary to a richer multi-card reading.
- Add topic-specific follow-up prompts.
- Run npm test and npm run build.

### Result

done

### Files Changed

- index.html
- src/fortune.js
- src/fortune.test.js
- src/main.js
- src/styles.css
- CHANGELOG.md
- VERSION
- package.json
- package-lock.json
- LOOP_LOG.md
- PROJECT_STATUS_README.md

### Verification

- npm test - passed, 6 files and 66 tests.
- npm run build - passed with Vite production build.

### Remaining Risk

- Tarot is now denser, but the content is still generated from a compact template set. If the goal is ad-grade long-form content, the next step is a broader editorial card matrix by topic and intent.

### Next Suggested Work

Expand relationship/compatibility output so saved links, one-off compatibility, and consultation prompts share the same deeper question sets and follow-up structure.


## 2026-07-21 - Cycle 6

### Selected Work

Expand yearly fortune copy so the same score model produces topic-specific output for business, relationship, marriage, career, family, and general yearly readings.

### Acceptance Criteria

- Keep the same monthly score structure.
- Make yearly copy differ by topic.
- Cover topic-specific yearly copy with tests.
- Run npm test and npm run build.

### Result

done

### Files Changed

- src/fortune.js
- src/fortune.test.js
- CHANGELOG.md
- VERSION
- package.json
- package-lock.json
- LOOP_LOG.md
- PROJECT_STATUS_README.md

### Verification

- npm test - passed, 6 files and 65 tests.
- npm run build - passed with Vite production build.

### Remaining Risk

- Topic-specific yearly copy is still template-driven. To materially improve ad-grade content depth, the next step is widening the editorial matrix by topic x month x score band, not only adding another tone layer.

### Next Suggested Work

Expand tarot content from the current single-card/question structure into richer spreads and topic-specific follow-up cards so the second free content pillar is as dense as yearly flow.


## 2026-07-21 - Cycle 5

### Selected Work

Tighten the profile-management copy and raise the baseline density of yearly fortune content so the free experience feels substantive before more monetization layers are added.

### Acceptance Criteria

- Remove awkward management-heavy copy around saved profile and account areas.
- Expand yearly fortune output with monthly narrative copy, evidence, half-year focus, and summary notes.
- Lock the richer yearly output with tests.
- Run `npm test` and `npm run build`.

### Result

`done`

### Files Changed

- `index.html`
- `src/fortune.js`
- `src/fortune.test.js`
- `src/main.js`
- `src/styles.css`
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `LOOP_LOG.md`
- `PROJECT_STATUS_README.md`

### Verification

- `npm test` - passed, 6 files and 64 tests.
- `npm run build` - passed with Vite production build.

### Remaining Risk

- The yearly flow is now denser, but yearly and tarot content still depend on the current browser-side templates rather than a larger editorial data library. If the product wants Google AdSense-grade content depth, the next step is expanding template coverage by topic and month, not just styling.

### Next Suggested Work

Expand the non-AI free content set further with richer tarot spreads, topic-specific yearly variants, and relationship-entry flows that feed directly into consultation prompts.

## 2026-07-21 - Cycle 4

### Selected Work

Add export actions to the admin console so operators can save the current dashboard state without relying on external dashboards or manual copy-paste.

### Acceptance Criteria

- Add JSON export action to admin toolbar.
- Add CSV export action to admin toolbar.
- Export current dashboard metrics and recent operational lists.
- Keep the implementation frontend-only and low-risk.
- Run `npm test` and `npm run build`.

### Result

`done`

### Files Changed

- `index.html`
- `src/main.js`
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `LOOP_LOG.md`
- `PROJECT_STATUS_README.md`

### Verification

- `npm test` - passed, 6 files and 64 tests.
- `npm run build` - passed with Vite production build.

### Remaining Risk

- Export content is based on the currently loaded admin snapshot, not a separate reporting query. If operators need long-range or paginated exports, that should move to a dedicated Edge Function later.

### Next Suggested Work

Add refund-safe payment exception handling and an admin escalation view that highlights sessions with repeated safety events or unresolved paid-order issues.

## 2026-07-21 - Cycle 3

### Selected Work

Extend the admin console with a period-based operational view and a user-level detail modal, without touching blocked roadmap items or destructive commerce actions.

### Acceptance Criteria

- Add a reusable metrics window selector for admin operations.
- Show recent-period counts for signups, paid orders, consultation starts, and safety events.
- Add a user detail modal from the recent profiles list.
- Include relationship, consultation, order, and entitlement context in that modal.
- Run `npm test` and `npm run build`.

### Result

`done`

### Files Changed

- `index.html`
- `src/main.js`
- `src/styles.css`
- `supabase/functions/get-admin-dashboard/index.ts`
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `PROJECT_STATUS_README.md`
- `LOOP_LOG.md`

### Verification

- `npm test` - passed, 6 files and 64 tests.
- `npm run build` - passed with Vite production build.

### Remaining Risk

- The new admin modal is only locally verified. The Edge Function still needs explicit deployment before the live admin page can use the new response fields.
- User detail currently exposes the selected profile email only when the selected profile is the currently logged-in admin account. If broader admin email visibility is needed, that requires a deliberate schema or service-role design choice.

### Next Suggested Work

Deploy the updated `get-admin-dashboard` Edge Function, then continue with higher-value admin operations: refund-safe payment exception handling, consultation escalation tooling, and export/report actions.

## 2026-07-20 - Cycle 1

### Selected Work

Create a controlled improvement loop and make the first product-facing improvement without requiring external provider settings.

### Acceptance Criteria

- Add a reusable loop specification for future agent cycles.
- Record the first cycle in a durable log.
- Improve the app's counseling output so a user's free-text concern is narrowed by intent, not only repeated verbatim.
- Cover the behavior with tests.
- Run `npm test` and `npm run build`.

### Result

`done`

### Files Changed

- `LOOP.md`
- `LOOP_LOG.md`
- `AGENTS.md`
- `src/fortune.js`
- `src/fortune.test.js`
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `PROJECT_STATUS_README.md`

### Verification

- `npm test` - passed, 6 files and 62 tests.
- `npm run build` - passed with Vite production build.

### Remaining Risk

- The concern intent classifier is intentionally rule-based. It improves the static app without an LLM or server call, but it should be expanded from real paid-question logs before treating it as final product intelligence.
- OAuth, Supabase provider settings, payment, and production deployment were not changed or live-verified in this cycle.

### Next Suggested Work

Use the same loop to add a "10-minute consultation script" for the first wedge product: relationship or marriage questions that naturally upsell from the free reading into a paid AI consultation.

## 2026-07-19 - Cycle 2

### Selected Work

Research current 2026 AI relationship, astrology, and reflection products, then distill only the market patterns that should change Saajuu's roadmap.

### Acceptance Criteria

- Verify current comparable products with primary or near-primary sources.
- Separate durable product patterns from hype.
- Add one durable product-strategy document to the repo.
- Update roadmap and handoff docs so future work follows the new findings.
- Run `npm test` and `npm run build`.

### Result

`done`

### Files Planned

- `docs/07_2026_AI_SERVICE_LANDSCAPE.md`
- `docs/monetization-plan.md`
- `docs/06_IMPLEMENTATION_ROADMAP.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `PROJECT_STATUS_README.md`

### Verification

- `npm test` - passed, 6 files and 62 tests.
- `npm run build` - passed with Vite production build.

### Remaining Risk

- This cycle only changes product direction and handoff docs. It does not yet implement the next UX step in code.
- The strongest next product work is still relationship-card retention and free 3-turn cumulative-memory quality.

### Next Suggested Work

Implement the first code change implied by this research: make connected-relationship cards generate daily follow-up prompts and ensure the free 3-turn consultation shows explicit turn-to-turn memory.



