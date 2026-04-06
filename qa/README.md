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
- By default the launcher prefers a production-style static build and falls back to a QA-mode dev server if the local build bootstrap fails. For release-grade audits against a deployed environment, point `QA_BASE_URL` at staging or production.
- Live AI UX scoring runs only when both `OPENAI_API_KEY` and `QA_OPENAI_MODEL` are set. Otherwise the script still captures screenshots, page summaries, and prompt payloads so the review step is ready to wire up.
