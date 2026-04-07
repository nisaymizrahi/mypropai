# Fliprop Codex Instructions

## Project Context
This repository is the Fliprop frontend application.

Fliprop is a real-estate investor SaaS product focused on:
- finding and analyzing deals
- comps and master deal reports
- potential properties / leads
- market search
- project execution after deal analysis
- budgets, expenses, receipts, vendors, bids, and workflow management

Codex should always think like a product-minded senior engineer working on a premium SaaS platform for real estate investors.

The goal is not just to make code work.
The goal is to make the product:
- easier to use
- cleaner
- visually stronger
- more professional
- more investor-friendly
- more presentation-ready

---

## Core Product Principles

### 1. Prioritize usability over technical cleverness
Do not overengineer.
Prefer clear, maintainable, practical solutions.

### 2. Reduce friction
Users should be able to:
- understand a page quickly
- take the next action easily
- avoid unnecessary scrolling, clutter, and confusion

### 3. Keep the app property-centric and investor-centric
Features should feel connected around:
- deal analysis
- property evaluation
- project execution
- budget vs actual
- decision-making

### 4. Avoid fragmented UX
Do not create deeply nested tabs, hidden flows, or disconnected sections unless absolutely necessary.

### 5. Visual quality matters
UI should feel:
- premium
- calm
- modern SaaS
- professional
- real-estate specific
- not overdesigned
- not cluttered

---

## File Editing Rules

### Always inspect before editing
Before changing a file:
- read the existing file carefully
- understand what it currently does
- check whether it has uncommitted changes
- do not assume the structure

### Do not clobber unrelated work
This repo may contain uncommitted changes.
Do not overwrite unrelated user work.
Only change what is necessary for the requested task.

### Prefer minimal, focused edits
Do not make broad refactors unless the task clearly requires them.

### Preserve existing behavior unless intentionally improving it
Avoid breaking working flows.

### If touching shared components, be cautious
Changes near root layout, navigation, shared utilities, report rendering, and global UI may affect many areas of the site.
Be conservative and intentional.

---

## UX/UI Rules

### Reduce unnecessary text
Avoid long intro paragraphs and dense instructions.
Prefer:
- short headings
- concise helper text
- visual structure
- cards
- summaries
- clear calls to action

### Make important conclusions obvious
If a page is about a deal/report/analysis, the user should quickly understand:
- whether it looks strong or risky
- key financial numbers
- next best action

### Favor one strong section over many weak ones
Do not crowd pages with too many competing elements.

### Forms should feel guided
Large forms should be grouped clearly.
Use progressive disclosure where appropriate.
Do not make the user feel like they are filling out a spreadsheet unless that is explicitly required.

### Reports should feel presentation-ready
Master deal reports, comps reports, and saved reports should look polished enough to show to investors, clients, or partners.

---

## Specific Product Guidance

### Potential Properties / Leads
These should support fast deal scanning and easy evaluation.
Favor:
- clear status
- clear financial snapshot
- AI assessment / deal quality indicators
- easy navigation across many deals

### Market Search
This should feel like a discovery tool.
Favor:
- visual browsing
- list + map workflows
- real-listing style presentation where data supports it
- easy add-to-potential-properties flow

### Master Deal Reports / Comps
These should feel like premium investor reports, not plain tool screens.
Favor:
- clear verdict
- strong financial visuals
- comps clarity
- property context
- polished PDF/export readiness

### Project Execution
After a deal moves forward, execution features should feel connected.
Budget categories / scope items should act as the backbone for:
- budgets
- expenses
- receipts
- vendors
- bids
- tasks

---

## Code Style and Implementation Preferences

### Frontend
- Use React + Tailwind
- Keep components readable and modular
- Avoid unnecessary abstraction
- Reuse existing patterns where appropriate
- Prefer small reusable components when they clearly improve consistency

### Styling
- Premium, restrained, professional
- Good spacing and hierarchy
- Avoid noisy gradients, excessive ornament, or gimmicky UI

### Data-heavy UI
For charts, tables, badges, KPI cards, and structured product UI:
- prefer code-native UI over image-based UI
- keep data readable
- emphasize summary first, detail second

---

## Safety / Workflow Rules

### Before implementation
For medium or large changes, first provide:
- concise audit of the current structure
- proposed implementation plan
- exact files likely to change
- any risks or blockers

### After implementation
Always report:
- files changed
- what was improved
- whether build passed
- any known issues still remaining

### Build / verification
Run the relevant build or verification command after changes when practical.

For frontend, prefer:
```bash
npm run build