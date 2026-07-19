# Saajuu Controlled Improvement Loop

This file defines how to keep improving Saajuu through repeated agent cycles without letting the work become an uncontrolled infinite loop.

## Goal

Increase the chance that a user feels Saajuu is a personalized, counseling-style fortune service and reaches a clear next step toward a paid report or AI consultation.

## Inputs

- `PROJECT_STATUS_README.md`
- `TODOS.md`
- `docs/monetization-plan.md`
- `docs/01_JEOMSIN_BENCHMARK.md` through `docs/06_IMPLEMENTATION_ROADMAP.md`
- Current app behavior in `src/`
- Test/build output

## Cycle

1. Read the current status and pick one high-value work item.
2. Write the acceptance criteria before editing.
3. Keep the implementation small enough to review.
4. Run focused tests, then `npm test` and `npm run build` when code changes.
5. Record what changed, how it was verified, and what should happen next.
6. Stop or continue with the next highest-value item.

## Work Selection

Priority order:

1. Blockers to login, consultation, payment, deployment, or data safety.
2. Features that sharpen concrete paid user questions.
3. Counseling UX that narrows the user's concern into decisions, tradeoffs, and next actions.
4. Retention, sharing, and repeat-use features.
5. Internal documentation, test coverage, and operational polish.

## Guardrails

- Do not put API keys, LLM calls, payment secrets, or provider secrets in the static app.
- Do not claim Kakao, Google, Supabase, payment, or production deployment issues are fixed without live verification.
- Do not use deterministic or harmful claims such as guaranteed marriage, pregnancy, death, investment return, disease, or legal outcomes.
- Do not send birth data, names, raw concerns, or consultation text to analytics.
- Stop before destructive data changes, paid actions, external dashboard changes, or deployment if the user has not asked for them.

## Terminal States

- `done`: acceptance criteria met and verification passed.
- `blocked_external`: provider dashboard, secret, account permission, or production access is required.
- `blocked_validation`: tests, build, or QA exposed an issue that must be fixed before continuing.
- `needs_product_decision`: the next step requires pricing, legal, brand, or product direction.
- `no_change_needed`: the selected item is already satisfied.

## Acceptance Evidence

Each cycle should leave evidence in `LOOP_LOG.md`:

- Selected work item
- Acceptance criteria
- Files changed
- Verification commands and result
- Remaining risk
- Next suggested work item
