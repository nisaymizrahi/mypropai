# Fliprop Imagegen Rollout

## Current status
- Preferred execution mode: built-in `image_gen`.
- Constraint in this session: the built-in tool is not exposed, so this pack prepares the work without using the CLI fallback.
- Generation rule when the built-in tool is available again:
  1. Generate to the Codex default output location.
  2. Review variants.
  3. Move only selected finals into the repo paths below.
  4. Do not overwrite existing committed assets unless explicitly approved. Use sibling names such as `hero-dashboard-v2.png`.

## Visual direction
- Modern SaaS and fintech tone with real-estate credibility.
- Calm, premium, and editorial rather than loud or glossy.
- Warm neutral base with decision accents:
  - green for strong opportunities
  - amber for workable but risky
  - red for stop or reprice
- Favor one anchor image per dense surface.
- Keep charts, gauges, buttons, and compact badges code-native unless the image is clearly doing marketing, storytelling, or empty-state work.

## Folder map
- Existing:
  - `public/assets/marketing/`
  - `public/assets/ui/`
  - `public/assets/ai/`
- New rollout folders:
  - `public/assets/acquisition/`
  - `public/assets/workspace/`
  - `public/assets/ops/`
  - `public/assets/account/`
  - `public/assets/states/`

## Rollout phases

### Phase 1: Marketing and acquisition entry
Goal: make the first impression and first decision feel expensive, clear, and fast.

| ID | Route or feature | Final path | Use case | Purpose |
| --- | --- | --- | --- | --- |
| marketing-home-hero-v2 | `/` homepage hero | `public/assets/marketing/home-hero-dashboard-v2.png` | `ui-mockup` | Premium dashboard hero that feels like a live product, not abstract art |
| marketing-home-decision-rail | `/` homepage decision preview | `public/assets/marketing/home-decision-rail-v2.png` | `ui-mockup` | Good / watch / walk-away concept image for the decision rail |
| marketing-product-architecture | `/product` platform architecture | `public/assets/marketing/product-architecture-v2.png` | `infographic-diagram` | Visual explanation of acquire -> execute -> operate -> billing |
| marketing-pricing-credits | `/pricing` and pricing sections | `public/assets/marketing/pricing-credits-explainer-v2.png` | `infographic-diagram` | Credits, trial, and top-up visual that makes pricing easier to understand |
| marketing-compare-preview | `/compare/flipper-force` | `public/assets/marketing/compare-workflow-preview-v2.png` | `ui-mockup` | Calm side-by-side workspace comparison visual |
| acquisition-leads-hero | `/leads` top summary | `public/assets/acquisition/leads-pipeline-hero-v2.png` | `ui-mockup` | Visual lead board or grid preview with clear decision states |
| acquisition-lead-detail-cover | `/leads/:id` | `public/assets/acquisition/lead-detail-underwrite-v2.png` | `product-mockup` | Underwriting cover image for lead detail and saved reports |
| acquisition-market-search | `/market-search` | `public/assets/acquisition/market-search-opportunity-v2.png` | `ui-mockup` | Map-plus-card visual showing neighborhood search and opportunity scan |
| acquisition-comps-cover | `/comps-report` | `public/assets/acquisition/comps-report-cover-v2.png` | `infographic-diagram` | Report cover art for investor-facing comps output |
| acquisition-create-property | `/properties/new` | `public/assets/acquisition/create-property-entry-v2.png` | `ui-mockup` | Add-property panel visual to support onboarding into the pipeline |

### Phase 2: Workspace and reporting
Goal: make the core property workspace feel like a premium command center.

| ID | Route or feature | Final path | Use case | Purpose |
| --- | --- | --- | --- | --- |
| workspace-dashboard-snapshot | `/dashboard` redirect context and executive summary | `public/assets/workspace/dashboard-executive-snapshot-v2.png` | `ui-mockup` | Executive portfolio preview for dashboard summaries |
| workspace-property-header | `/properties/:propertyKey` | `public/assets/workspace/property-workspace-header-v2.png` | `ui-mockup` | Anchor header art for the property command center |
| workspace-overview-state | property overview tab | `public/assets/workspace/property-overview-state-v2.png` | `ui-mockup` | Overview state for empty or partial property records |
| workspace-financials-state | property financials tab | `public/assets/workspace/property-financials-state-v2.png` | `infographic-diagram` | Financials empty-state art that suggests modeled cashflow and budget clarity |
| workspace-work-state | property work tab | `public/assets/workspace/property-work-ops-v2.png` | `ui-mockup` | Workstream, vendor, and scope visual for execution |
| workspace-documents-state | property documents tab | `public/assets/workspace/property-documents-vault-v2.png` | `product-mockup` | Visual metaphor for organized property docs and operational memory |
| workspace-analysis-state | property analysis tab | `public/assets/workspace/property-analysis-report-v2.png` | `product-mockup` | Saved-report and analysis-center visual |
| workspace-before-after | property workspace, reports, and marketing reuse | `public/assets/workspace/property-before-after-premium-v2.png` | `photorealistic-natural` | Higher-fidelity before-and-after concept for value creation storytelling |

### Phase 3: Operations and portfolio
Goal: extend the same premium system into management and execution pages without clutter.

| ID | Route or feature | Final path | Use case | Purpose |
| --- | --- | --- | --- | --- |
| ops-properties-overview | `/properties` | `public/assets/ops/properties-overview-v2.png` | `ui-mockup` | Portfolio listing hero or empty-state visual |
| ops-tasks-queue | `/tasks` | `public/assets/ops/tasks-queue-v2.png` | `ui-mockup` | Task orchestration visual with priority and due-date cues |
| ops-calendar-coordination | `/master-calendar` | `public/assets/ops/master-calendar-v2.png` | `ui-mockup` | Calendar coordination image for planning and follow-up |
| ops-vendors-network | `/vendors` | `public/assets/ops/vendors-network-v2.png` | `product-mockup` | Vendor directory / trade network visual |
| ops-management-overview | `/management` parked flow and future reuse | `public/assets/ops/management-portfolio-v2.png` | `ui-mockup` | Management portfolio state for future reactivation |
| ops-procurement-support | vendor procurement and bids | `public/assets/ops/procurement-bids-v2.png` | `ui-mockup` | Procurement and bids visualization |
| ops-project-lifecycle | work execution narrative | `public/assets/ops/project-lifecycle-v2.png` | `infographic-diagram` | Milestone view from lead approval to stabilized property |

### Phase 4: Account, trust, and long-tail states
Goal: improve confidence and polish in onboarding, billing, support, and low-data states.

| ID | Route or feature | Final path | Use case | Purpose |
| --- | --- | --- | --- | --- |
| account-login-trust | `/login` and `/signup` | `public/assets/account/auth-trust-visual-v2.png` | `product-mockup` | Calm trust-building illustration for auth pages |
| account-profile-setup | `/complete-profile` | `public/assets/account/profile-setup-v2.png` | `ui-mockup` | Onboarding visual for profile completion |
| account-billing-center | `/account` | `public/assets/account/billing-center-v2.png` | `ui-mockup` | Credits, trial, and billing-control visual |
| account-platform-manager | `/platform-manager` | `public/assets/account/platform-manager-v2.png` | `ui-mockup` | Admin or ops-control visual for managers |
| states-no-leads | leads empty state | `public/assets/states/no-leads-v2.png` | `ui-mockup` | Empty state for first-property creation |
| states-no-properties | portfolio empty state | `public/assets/states/no-properties-v2.png` | `ui-mockup` | Portfolio empty state |
| states-no-documents | documents and reports empty states | `public/assets/states/no-documents-v2.png` | `product-mockup` | Calm placeholder for missing docs and saved files |
| states-help-support | `/help`, `/email-preferences`, support surfaces | `public/assets/states/help-support-v2.png` | `product-mockup` | Support and settings illustration |

## Integration targets by page

### Public marketing
- `src/pages/Homepage.jsx`
  - hero anchor image
  - decision rail supporting visual
  - optional replacement for current lower-fidelity property storytelling art
- `src/pages/ProductPage.jsx`
  - architecture diagram image
  - feature-collection support visual
- `src/pages/PricingPage.jsx`
  - pricing and credit explainer
- `src/pages/FlipperForceComparisonPage.jsx`
  - side-by-side workflow preview
- `src/pages/ResourcesPage.jsx`
  - editorial section art later if needed

### Acquisition
- `src/pages/LeadsPage.jsx`
  - top summary image and empty states
- `src/pages/LeadDetailPage.jsx`
  - underwriting hero
  - saved report covers
- `src/pages/MarketSearchPage.jsx`
  - market search anchor image
- `src/pages/CompsReportPage.jsx`
  - report cover art
- `src/pages/CreatePropertyPage.jsx`
  - add-property panel or empty state

### Workspace
- `src/pages/DashboardPage.jsx`
  - executive snapshot anchor
- `src/pages/PropertyWorkspacePage.jsx`
  - workspace header
  - section-specific empty states
  - report center imagery

### Operations
- `src/pages/PropertiesPage.jsx`
- `src/pages/TasksPage.jsx`
- `src/pages/MasterCalendarPage.jsx`
- `src/pages/VendorsPage.jsx`

### Account and trust
- `src/pages/LoginPage.jsx`
- `src/pages/SignupPage.jsx`
- `src/pages/CompleteProfilePage.jsx`
- `src/pages/AccountCenter.jsx`
- `src/pages/PlatformManagerPage.jsx`
- `src/pages/HelpPage.jsx`
- `src/pages/EmailPreferencesPage.jsx`

## Generation workflow
1. Pick a phase.
2. Generate 3 variants per asset using built-in `image_gen`.
3. Review for:
   - calm hierarchy
   - text-free or text-minimal output
   - no fake tiny UI labels unless they are intentionally unreadable chrome
   - consistent palette and lighting
4. Move the selected final into the repo path listed above.
5. Add or update the consuming component.
6. Check desktop and mobile layouts before generating the next batch.

## Quality gates
- Avoid literal photos of houses unless the page specifically benefits from that realism.
- Prefer product mockups, system visuals, and editorial scenes over generic stock-photo energy.
- Keep visual density lower than the current data density.
- If a screen already has strong UI, use the image to support mood, trust, or empty-state guidance, not to compete with the content.

## Next execution batch
- Start with the ten Phase 1 assets.
- Use the prompt pack in `output/imagegen/phase-1-prompts.md`.
- After those are approved, wire them into:
  - `src/pages/Homepage.jsx`
  - `src/pages/ProductPage.jsx`
  - `src/pages/PricingPage.jsx`
  - `src/pages/LeadsPage.jsx`
  - `src/pages/LeadDetailPage.jsx`
  - `src/pages/MarketSearchPage.jsx`
  - `src/pages/CompsReportPage.jsx`
