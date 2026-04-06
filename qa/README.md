# Fliprop QA System

This QA system generates a combined website quality review for Fliprop with:

- functional browser testing
- accessibility auditing
- Lighthouse auditing
- optional AI UX review
- weighted score aggregation
- JSON, Markdown, and HTML reports

## Commands

- `npm run qa`
- `npm run qa:functional`
- `npm run qa:a11y`
- `npm run qa:lighthouse`
- `npm run qa:ux`
- `npm run qa:report`

Optional env overrides:

- `QA_BASE_URL=https://staging.fliprop.com npm run qa`
- `QA_SERVER_MODE=build npm run qa`
- `QA_SERVER_MODE=dev npm run qa`
- `QA_USER_EMAIL=qa@example.com QA_USER_PASSWORD=secret QA_BASE_URL=https://fliprop.com npm run qa`
- `QA_TEST_ADDRESS_LINE1="123 Main St" QA_TEST_CITY="Tampa" QA_TEST_STATE="FL" QA_TEST_ZIP="33602" npm run qa`
- `OPENAI_API_KEY=... QA_OPENAI_MODEL=... npm run qa:ux`

## Output

Each run writes to `output/qa/<timestamp>/`.

Key files:

- `functional.json`
- `accessibility.json`
- `lighthouse.json`
- `ux-review.json`
- `summary.json`
- `report.md`
- `report.html`

Screenshots and Playwright artifacts are stored under the same run directory.

## Notes

- The suite builds the frontend with `REACT_APP_ENABLE_QA_MOCKS=true` so tests can run against deterministic QA data without changing normal product behavior.
- `QA_BASE_URL` must be a real reachable URL. Do not literally use placeholder values like `https://your-staging-or-prod-url`.
- By default the launcher prefers a production-style static build and falls back to a QA-mode dev server if the local build bootstrap fails. For release-grade audits against a deployed environment, point `QA_BASE_URL` at staging or production.
- Public live-site mode audits homepage, login, pricing, and route protection immediately. Protected deal/report flows are exercised only when `QA_USER_EMAIL` and `QA_USER_PASSWORD` are provided.
- If a live authenticated account can log in but does not have paid comps/report access yet, the suite marks paid report flows as `blocked` instead of misreporting them as broken. The combined report will call out the billing gate and keep scoring the flows that were actually available.
- For authenticated live-site flows, you can also override the test property inputs with `QA_TEST_ADDRESS_LINE1`, `QA_TEST_CITY`, `QA_TEST_STATE`, `QA_TEST_ZIP`, `QA_TEST_ASKING_PRICE`, and `QA_TEST_REHAB`.
- Live AI UX scoring runs only when both `OPENAI_API_KEY` and `QA_OPENAI_MODEL` are set. Otherwise the script still captures screenshots, page summaries, and prompt payloads so the review step is ready to wire up.
- When no AI API credentials are configured, the UX layer falls back to deterministic heuristic scoring so the combined report still includes usability and polish scores.
