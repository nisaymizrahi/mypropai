export const marketingNavItems = [
  { label: "Product", to: "/product" },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/resources" },
];

export const marketingSecondaryNavItems = [
  { label: "Compare", to: "/compare/flipper-force" },
  { label: "About", to: "/about" },
];

export const pricingModel = {
  proMonthlyPrice: "$29",
  proTrialDays: 30,
  proTrialCredits: 2,
  proMonthlyCredits: 50,
  starterPackCredits: 10,
  starterPackPrice: "$18",
  proTopUpCredits: 10,
  proTopUpPrice: "$9",
};

export const heroSignals = [
  {
    label: "Starter",
    value: "Free",
    detail: "Open the workspace, organize the pipeline, and pay only when premium analysis becomes useful.",
  },
  {
    label: "Pro",
    value: `${pricingModel.proMonthlyPrice}/mo`,
    detail: `${pricingModel.proTrialDays}-day trial, ${pricingModel.proMonthlyCredits} comps credits every paid cycle, and cheaper top-ups.`,
  },
  {
    label: "Premium actions",
    value: `${pricingModel.proTopUpPrice}-${pricingModel.starterPackPrice}`,
    detail: `Buy ${pricingModel.starterPackCredits}-credit comps packs or ${pricingModel.proTopUpCredits}-credit Pro top-ups only when needed.`,
  },
];

export const workflowPillars = [
  {
    title: "Acquire",
    description:
      "Move from a new opportunity to a decision-ready deal without losing the assumptions behind the price.",
    bullets: [
      "Track potential properties, contacts, pricing targets, and seller context",
      "Run AI comps reports and keep the recommended offer attached to the same record",
      "Save underwriting notes, market evidence, and next steps in one place",
    ],
  },
  {
    title: "Execute",
    description:
      "Coordinate the work between closing and stabilization with budgets, vendors, scopes, and clear task ownership.",
    bullets: [
      "Organize renovation scopes, bids, work items, and operating tasks in one place",
      "Manage vendors, documents, and project handoffs without scattered spreadsheets",
      "Keep the calendar, due dates, and follow-up visible across the whole team",
    ],
  },
  {
    title: "Operate",
    description:
      "Keep the property organized from one shared workspace instead of rebuilding context every week.",
    bullets: [
      "Open a property workspace with overview, financials, work, documents, analysis, and settings",
      "Track recurring tasks, active work, and portfolio-level follow-up from one shell",
      "Manage billing, access, upgrades, and credits from the account center",
    ],
  },
];

export const productModules = [
  {
    title: "Leads",
    summary:
      "Keep incoming opportunities organized with seller context, pricing notes, and decision-ready next steps.",
  },
  {
    title: "Project Workspace",
    summary:
      "Run the active project from one central record with overview, financials, work, documents, analysis, and settings.",
  },
  {
    title: "Deal Analysis",
    summary:
      "Generate comps-driven pricing guidance and investor-ready reporting without exporting the lead into another tool.",
  },
  {
    title: "AI Investment Reports",
    summary:
      "Turn pricing, scope, and assumptions into premium reporting workflows for deeper decision support.",
  },
  {
    title: "Financials and Scope",
    summary:
      "Keep budget assumptions, rehab scope, costs, and profitability context tied to the same property workspace.",
  },
  {
    title: "Tasks and Calendar",
    summary:
      "Coordinate execution across due dates, recurring work, and cross-property follow-up from one command view.",
  },
  {
    title: "Vendors and Documents",
    summary:
      "Keep contractors, documents, procurement context, and supporting files connected to the property and project.",
  },
  {
    title: "Account and Billing",
    summary:
      "Start on Starter, upgrade to Pro, manage credits, and control subscription access from the same account center your team already uses.",
  },
];

export const featureCollections = [
  {
    title: "Deal intake and pipeline",
    description: "Capture everything the team needs before a lead becomes real work.",
    bullets: [
      "Lead pipeline",
      "Seller context and decision notes",
      "Pricing targets and follow-up steps",
    ],
  },
  {
    title: "Analysis and underwriting",
    description: "Keep comps, valuation evidence, and AI reporting inside the operating workflow.",
    bullets: [
      "AI comps analysis",
      "Saved reports and deal snapshots",
      "AI investment report generation",
    ],
  },
  {
    title: "Project workspace",
    description: "Open a shared record for the active project and keep every team member on the same page.",
    bullets: [
      "Overview and status tracking",
      "Financials and cost context",
      "Settings and workspace controls",
    ],
  },
  {
    title: "Execution management",
    description: "Move the work forward with schedules, tasks, and accountable owners.",
    bullets: [
      "Tasks and recurring follow-up",
      "Master calendar and due dates",
      "Scope and workstream visibility",
    ],
  },
  {
    title: "Vendors and documentation",
    description: "Store the operational memory that usually gets lost between tools.",
    bullets: [
      "Vendor directory and trade context",
      "Property documents and supporting files",
      "Bids, notes, and handoff material",
    ],
  },
  {
    title: "Billing and premium actions",
    description:
      "Choose a pricing model that fits actual usage instead of forcing a heavy upfront commitment.",
    bullets: [
      "Starter for free",
      "Pro subscription with included credits",
      "Comps packs and top-ups when needed",
    ],
  },
];

export const comparisonRows = [
  {
    label: "Lifecycle coverage",
    fliprop:
      "Acquisitions, rehab execution, ongoing property work, documents, and billing in one workspace.",
    market:
      "Many house-flipping tools emphasize analysis and rehab project management first, with a denser software surface.",
  },
  {
    label: "Product experience",
    fliprop:
      "A clearer, easier-to-scan product experience that helps teams understand the platform quickly.",
    market:
      "Feature-heavy navigation can communicate depth, but it can also feel crowded during first evaluation.",
  },
  {
    label: "Pricing model",
    fliprop:
      `Free Starter, ${pricingModel.proMonthlyPrice}/month Pro, ${pricingModel.proTrialDays}-day trial, and flexible credits.`,
    market:
      "Category pricing often asks for a firmer plan decision earlier instead of letting teams ramp into premium usage.",
  },
];

export const operatorProfiles = [
  {
    title: "Solo operator",
    summary:
      "A better fit when one person is still holding the deal, the pricing, and the next operational move.",
    bullets: [
      "Start on Starter without subscription friction",
      "Move into Pro later when recurring analysis becomes worth it",
      "Keep pipeline, tasks, and documents together from day one",
    ],
  },
  {
    title: "Lean acquisitions and rehab team",
    summary:
      "Useful when a small team needs deal context to survive the handoff into execution work.",
    bullets: [
      "Keep recommended pricing attached to the property record",
      "Run scopes, vendors, and dates from the same workspace",
      "Avoid rebuilding context in spreadsheets and shared drives",
    ],
  },
  {
    title: "Owner-led portfolio team",
    summary:
      "A strong fit for teams that want property visibility and billing controls beside acquisitions and execution.",
    bullets: [
      "Keep the asset record stable after the deal closes",
      "Manage credits, upgrades, and account access from the same system",
      "Use editorial resources to support repeatable workflows",
    ],
  },
];

export const comparisonPageHighlights = [
  {
    title: "Why teams choose Fliprop",
    detail:
      "Fliprop is a better fit when you want a calmer operating system that spans acquisitions, execution, ongoing property work, and flexible premium usage.",
  },
  {
    title: "Where Flipper Force is strong",
    detail:
      "Flipper Force publicly emphasizes deep house-flipping analysis, rehab project management, accounting workflows, and mobile field updates.",
  },
  {
    title: "How to read this comparison",
    detail:
      "Use it to decide which product shape matches your business: a cleaner operator workspace or a denser flip-specific tool stack.",
  },
];

export const comparisonPageRows = [
  {
    label: "Best fit",
    fliprop:
      "Owner-led teams that want acquisitions, execution, ongoing property work, and billing in one calmer workspace.",
    flipperForce:
      "House flippers and rehabbers who want dense analysis, project management, mobile updates, and accounting features.",
  },
  {
    label: "Pricing shape",
    fliprop:
      `Free Starter plus a single Pro plan at ${pricingModel.proMonthlyPrice}/month with a ${pricingModel.proTrialDays}-day trial.`,
    flipperForce:
      "Website pricing shows separate Rookie, Solo Analysis, Teams Analysis, Teams, and Business plan families.",
  },
  {
    label: "Paid solo starting point",
    fliprop: `${pricingModel.proMonthlyPrice}/month on Pro.`,
    flipperForce: "Public pricing lists Solo Analysis at $49/month.",
  },
  {
    label: "Team starting point",
    fliprop:
      "The same Pro plan, then credits and top-ups as premium usage grows.",
    flipperForce:
      "Public pricing lists Team Analysis at $129/month and all-in-one Teams at $199/month.",
  },
  {
    label: "Premium usage model",
    fliprop:
      `Includes ${pricingModel.proMonthlyCredits} comps credits per paid cycle, ${pricingModel.proTopUpPrice} Pro top-ups, and ${pricingModel.starterPackPrice} Starter packs.`,
    flipperForce:
      "Feature access is packaged primarily through tiered subscriptions rather than a credits-plus-add-ons model.",
  },
  {
    label: "Public feature emphasis",
    fliprop:
      "Potential properties, property workspaces, AI comps, investment reports, tasks, vendors, documents, and billing.",
    flipperForce:
      "Public feature pages emphasize comps, flip and BRRRR analysis, rehab estimating, schedules, tasks, materials, expense tracking, photo logs, and a mobile app.",
  },
  {
    label: "Product experience",
    fliprop:
      "More editorial, more premium, and easier to understand quickly during evaluation.",
    flipperForce:
      "Broader category navigation can communicate depth, but it also creates a denser first impression.",
  },
];

export const comparisonSourceNote =
  "Comparison based on publicly available Flipper Force pricing and feature pages reviewed on April 5, 2026.";

export const pricingFacts = [
  {
    label: "Starter",
    value: "Free",
    detail: "Open the workspace first and keep the launch flow simple.",
  },
  {
    label: "Pro",
    value: `${pricingModel.proMonthlyPrice}/mo`,
    detail: "Upgrade once deal analysis becomes a weekly habit instead of an occasional need.",
  },
  {
    label: "Trial",
    value: `${pricingModel.proTrialDays} days`,
    detail: `Pro includes ${pricingModel.proTrialCredits} starter comps credits before the first paid cycle.`,
  },
  {
    label: "Extra comps",
    value: pricingModel.proTopUpPrice,
    detail: `Active Pro workspaces can add ${pricingModel.proTopUpCredits} credits at a time when they need more volume.`,
  },
];

export const planComparisonRows = [
  {
    label: "Lead capture and pipeline",
    starter: "Included",
    pro: "Included",
  },
  {
    label: "Project workspace, tasks, calendar, vendors, and documents",
    starter: "Included",
    pro: "Included",
  },
  {
    label: "Saved reports you already purchased or generated",
    starter: "Included",
    pro: "Included",
  },
  {
    label: "AI investment report generation",
    starter: "Not included",
    pro: "Included",
  },
  {
    label: "Included comps credits",
    starter: "None",
    pro: `${pricingModel.proMonthlyCredits} per paid cycle`,
  },
  {
    label: "Trial credits",
    starter: "None",
    pro: `${pricingModel.proTrialCredits} during the ${pricingModel.proTrialDays}-day trial`,
  },
  {
    label: "Additional comps credits",
    starter: `${pricingModel.starterPackPrice} for ${pricingModel.starterPackCredits}`,
    pro: `${pricingModel.proTopUpPrice} for ${pricingModel.proTopUpCredits}`,
  },
];

export const pricingPlans = [
  {
    key: "starter",
    name: "Starter",
    price: "Free",
    cadence: "",
    badge: "Start here",
    description:
      "Built for the first part of the launch flow: capture leads, centralize the project, and pay for deeper analysis only when needed.",
    ctaLabel: "Start free",
    ctaTo: "/signup",
    features: [
      "Capture leads and property details in one place",
      "Open the shared project workspace for tasks, vendors, and documents",
      "View saved reports that were already generated or purchased",
      `Buy ${pricingModel.starterPackCredits}-credit comps packs for ${pricingModel.starterPackPrice}`,
      "Keep billing details and workspace preferences in one account center",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: pricingModel.proMonthlyPrice,
    cadence: "/month",
    badge: "Most popular",
    description:
      "For fix-and-flip operators who want the lead-to-report workflow available every week without buying one-off analysis each time.",
    ctaLabel: "Choose Pro",
    ctaTo: "/signup",
    features: [
      `${pricingModel.proTrialDays}-day free trial with ${pricingModel.proTrialCredits} starter comps credits`,
      `${pricingModel.proMonthlyCredits} comps credits included every paid billing cycle`,
      "AI investment report generation and premium deal analysis workflows",
      `Buy unlimited ${pricingModel.proTopUpCredits}-credit top-ups for ${pricingModel.proTopUpPrice}`,
      "Billing portal access and subscription management",
    ],
  },
];

export const addOnProducts = [
  {
    name: "Comps Pack (10 Credits)",
    price: pricingModel.starterPackPrice,
    detail: "Permanent credits for Starter workspaces that want premium comps without a subscription.",
  },
  {
    name: "Pro Top-Up (10 Credits)",
    price: pricingModel.proTopUpPrice,
    detail: "Discounted additional credits available for active Pro subscriptions.",
  },
];

export const faqItems = [
  {
    question: "Who is Fliprop built for?",
    answer:
      "Fliprop is currently best for solo and lean fix-and-flip operators who want one clear workflow from lead intake to comps to project execution.",
  },
  {
    question: "How does the Pro trial work?",
    answer:
      `Pro includes a ${pricingModel.proTrialDays}-day free trial with ${pricingModel.proTrialCredits} comps credits. After the trial, paid Pro workspaces receive ${pricingModel.proMonthlyCredits} comps credits every billing cycle.`,
  },
  {
    question: "What is included in Starter vs Pro?",
    answer:
      "Starter gives you the core workspace for leads, project setup, tasks, vendors, documents, and saved reports. Pro adds recurring comps credits, AI investment reports, and lower-cost ongoing premium analysis.",
  },
  {
    question: "Can I start without committing to a paid plan?",
    answer:
      "Yes. You can open a Starter workspace for free, centralize the lead and project workflow first, and upgrade later when recurring comps or reporting becomes part of the weekly process.",
  },
  {
    question: "Do I have to buy everything as a subscription?",
    answer:
      `No. Starter can buy ${pricingModel.starterPackCredits}-credit comps packs for ${pricingModel.starterPackPrice}, and active Pro plans can add ${pricingModel.proTopUpCredits}-credit top-ups for ${pricingModel.proTopUpPrice}.`,
  },
];

export const aboutPrinciples = [
  {
    title: "Built for actual operator workflows",
    description:
      "Fliprop is designed around the way owner-led teams actually work: pipeline review, underwriting, rehab execution, daily operations, and billing decisions.",
  },
  {
    title: "Clarity over clutter",
    description:
      "We want the product and the public site to feel decisive, useful, and calm instead of crowded or vague.",
  },
  {
    title: "AI that earns its place",
    description:
      "The premium workflows are meant to support real acquisition and operating decisions, not live as isolated novelty screens.",
  },
];

export const resourcesIntro = [
  "Actionable playbooks for acquisitions, rehab planning, and property workspace workflows.",
  "Practical content that helps teams make better decisions before they ever log in.",
  "Editorial that supports the same workflows the product is built to handle.",
];

export const resourceArticles = [
  {
    slug: "real-estate-deal-underwriting-checklist",
    category: "Acquisitions",
    readTime: "6 min read",
    title: "A practical underwriting checklist for fast-moving real estate deals",
    summary:
      "Use this framework to qualify opportunities faster, pressure-test the assumptions, and keep the decision trail clean.",
    takeaways: [
      "Qualify the opportunity before you sink time into polishing a model",
      "Separate facts, assumptions, and decision thresholds",
      "Document the next move even when the answer is no",
    ],
    sections: [
      {
        title: "Start with the facts that change the deal",
        paragraphs: [
          "Before you debate strategy, lock down the inputs that will materially affect pricing, timing, and execution risk. That usually means address, asset type, occupancy, square footage, current condition, and the real decision-maker on the other side.",
          "The goal at this stage is not to build a perfect memo. It is to capture the facts that let you decide whether the opportunity deserves deeper attention.",
        ],
        bullets: [
          "Confirm property basics and any known legal or title friction",
          "Record seller motivation, timeline, and communication status",
          "Capture known rent, vacancy, or disposition context if it affects the business plan",
        ],
      },
      {
        title: "Separate market evidence from optimism",
        paragraphs: [
          "Fast underwriting breaks when comparable sales, rent assumptions, and rehab costs all blur together into one headline number. Treat each layer separately so the team can challenge the right assumption instead of arguing in circles.",
        ],
        bullets: [
          "Identify the pricing range supported by comps",
          "Document the rehab budget basis and what still needs validation",
          "Write down the rent or exit case that the deal depends on",
        ],
      },
      {
        title: "Make the next decision obvious",
        paragraphs: [
          "Every deal review should end with a clear next step: pass, pursue, renegotiate, inspect, or get a missing quote. If the team cannot name the next move, the process is probably carrying too much uncertainty in too many places.",
        ],
        bullets: [
          "Name the blocking questions explicitly",
          "Assign an owner for each missing input",
          "Set a decision date so the opportunity does not quietly drift",
        ],
      },
    ],
  },
  {
    slug: "rehab-budget-scope-template",
    category: "Execution",
    readTime: "7 min read",
    title: "How to structure a rehab budget so the scope survives the first surprise",
    summary:
      "A simple way to break down scope, pricing, contingency, and vendor coordination before the project starts absorbing expensive confusion.",
    takeaways: [
      "Break the project into decision-ready scopes instead of one giant budget line",
      "Track what is quoted, what is assumed, and what still needs a site walk",
      "Protect schedule and margin with an explicit contingency plan",
    ],
    sections: [
      {
        title: "Write the scope in layers",
        paragraphs: [
          "A rehab budget should not begin as a single top-line number. Split it into categories that match how the work is actually awarded and managed: exterior, systems, interior finishes, turns, punch list, and compliance work.",
          "That structure gives you cleaner vendor conversations and makes it easier to see which assumptions are still soft.",
        ],
        bullets: [
          "Use categories that align with who will bid and own the work",
          "Record both unit pricing and total estimate when possible",
          "Mark each line as confirmed, estimated, or still unknown",
        ],
      },
      {
        title: "Track risk before it becomes overrun",
        paragraphs: [
          "The budget almost always carries hidden risk before demolition, site walks, or permit feedback are complete. The professional move is to label the risk and reserve for it, not to pretend it does not exist.",
        ],
        bullets: [
          "Create a contingency bucket tied to the most likely sources of variance",
          "Keep a note on which line items are based on phone pricing only",
          "Update the budget immediately when actual quotes change the plan",
        ],
      },
      {
        title: "Connect budget and execution",
        paragraphs: [
          "A good budget should drive the task list, vendor assignments, and document collection. If those systems are disconnected, the same details get re-entered repeatedly and project memory erodes.",
        ],
        bullets: [
          "Link each major scope to a task owner and due date",
          "Keep supporting bids, insurance docs, and notes close to the work item",
          "Review the budget and schedule together in the same meeting cadence",
        ],
      },
    ],
  },
  {
    slug: "property-workspace-command-center",
    category: "Workspace",
    readTime: "5 min read",
    title: "What a property workspace should actually centralize",
    summary:
      "The right workspace keeps the asset, the team, and the follow-up connected so nothing important lives in memory alone.",
    takeaways: [
      "Property context should live with the asset, not in scattered side channels",
      "Recurring tasks and one-off work need the same source of truth",
      "Vendors, documents, and decisions should be easy to recover later",
    ],
    sections: [
      {
        title: "Keep the asset record stable",
        paragraphs: [
          "The property itself should be the center of gravity. Core facts, ownership context, financial notes, and operating documents should stay attached to the asset so future decisions do not depend on whoever happened to be in the last meeting.",
        ],
        bullets: [
          "Use one shared property workspace instead of rebuilding context in new files",
          "Store supporting documents where the whole team can recover them later",
          "Preserve the assumptions that moved the property from lead to active work",
        ],
      },
      {
        title: "Bring calendar, tasks, and vendors into the same loop",
        paragraphs: [
          "Daily execution becomes expensive when tasks, due dates, and vendor follow-up live in separate systems. A useful command center ties the work together so the team can see what matters this week and why.",
        ],
        bullets: [
          "Track recurring work and one-time tasks in the same workflow",
          "Connect vendor records to the jobs they actually support",
          "Use a shared calendar view to catch bottlenecks before they escalate",
        ],
      },
      {
        title: "Make the system useful for the next person too",
        paragraphs: [
          "Professional execution is not just about speed today. It is about making the next handoff, review, and portfolio conversation easier because the context is already there.",
        ],
        bullets: [
          "Document why decisions were made, not just what happened",
          "Keep a clean archive of notes, files, and responsible parties",
          "Review the workspace as if someone else will need to operate from it tomorrow",
        ],
      },
    ],
  },
];

export const getResourceBySlug = (slug) =>
  resourceArticles.find((article) => article.slug === slug);
