export const marketingNavItems = [
  { label: "Product", to: "/product" },
  { label: "Pricing", to: "/pricing" },
  { label: "Resources", to: "/resources" },
  { label: "About", to: "/about" },
];

export const heroSignals = [
  {
    label: "Starter",
    value: "Free",
    detail: "Create an operator workspace and upgrade only when premium AI workflows make sense.",
  },
  {
    label: "Pro",
    value: "$49/mo",
    detail: "Includes 10 AI comps reports each month plus premium reporting workflows.",
  },
  {
    label: "Built for",
    value: "Lean teams",
    detail: "Owners, operators, and portfolio teams who need fewer tools and clearer execution.",
  },
];

export const workflowPillars = [
  {
    title: "Acquire",
    description:
      "Move from an incoming opportunity to a confident decision without losing the assumptions behind it.",
    bullets: [
      "Track potential properties, contacts, pricing targets, and next steps",
      "Run AI comps reports from the same workspace where the deal lives",
      "Keep underwriting notes and market context attached to the asset",
    ],
  },
  {
    title: "Execute",
    description:
      "Coordinate the work between closing and stabilization with budgets, vendors, and clear task ownership.",
    bullets: [
      "Organize renovation scopes, work items, and operating tasks in one place",
      "Manage vendors, documents, and project handoffs without scattered spreadsheets",
      "Keep the calendar, due dates, and operational follow-up visible across the team",
    ],
  },
  {
    title: "Operate",
    description:
      "Run the property from a shared operating system instead of rebuilding context every week.",
    bullets: [
      "Open a property workspace with overview, financial, document, and settings views",
      "Monitor daily operations, recurring tasks, and portfolio-level work from one shell",
      "Manage billing, access, and upgrades from the account center",
    ],
  },
];

export const productModules = [
  {
    title: "Potential Properties",
    summary:
      "Keep incoming opportunities organized with pricing notes, ownership context, and decision-ready next steps.",
  },
  {
    title: "Property Workspace",
    summary:
      "Run the asset from a central record with sections for overview, financials, work, documents, analysis, and settings.",
  },
  {
    title: "AI Comps Reports",
    summary:
      "Generate comps-driven pricing guidance and investor-ready reporting without exporting the deal into another tool.",
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
      "Start on Starter, upgrade to Pro, and manage subscription access from the same account center your team already uses.",
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
      "A clean workspace for tracking properties, running daily operations, and buying premium tools only when you need them.",
    ctaLabel: "Start free",
    ctaTo: "/signup",
    features: [
      "Manage leads, property workflows, tasks, calendar, vendors, and account settings",
      "View saved reports that were previously purchased or generated",
      "Buy AI comps reports and tenant screening individually when needed",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$49",
    cadence: "/month",
    badge: "Most popular",
    description:
      "For operators who need recurring analysis, premium AI workflows, and a simple monthly plan.",
    ctaLabel: "Choose Pro",
    ctaTo: "/signup",
    features: [
      "10 AI comps reports included each month",
      "AI investment report generation",
      "Discounted tenant screening pricing",
      "Billing portal access and subscription management",
    ],
  },
];

export const addOnProducts = [
  {
    name: "AI Comps Report",
    price: "$29",
    detail: "Unlock one comps analysis run for a specific lead.",
  },
  {
    name: "Tenant Screening",
    price: "$45",
    detail: "One-off screening for an application, with a discounted Pro price available.",
  },
];

export const faqItems = [
  {
    question: "Who is Fliprop built for?",
    answer:
      "Fliprop is aimed at owners, operators, flippers, and lean real estate teams who want one workspace for acquisitions, execution, and property operations.",
  },
  {
    question: "What is included in Starter vs Pro?",
    answer:
      "Starter gives you the core operating workspace. Pro adds recurring premium AI workflows, including 10 AI comps reports per month and AI investment reports.",
  },
  {
    question: "Can I start without committing to a paid plan?",
    answer:
      "Yes. The account flow starts on Starter, then you can upgrade inside the account center whenever the Pro workflows become useful.",
  },
  {
    question: "Do I have to buy everything as a subscription?",
    answer:
      "No. Some premium actions can also be purchased individually, which is helpful if you want the workspace now and only occasional premium analysis.",
  },
];

export const aboutPrinciples = [
  {
    title: "Built for actual operator workflows",
    description:
      "The public story now reflects the product that already exists inside the workspace: leads, properties, comps, vendors, tasks, and account controls.",
  },
  {
    title: "Clarity over software theater",
    description:
      "We want the product and the marketing site to feel decisive, useful, and calm instead of bloated with noise or vague feature promises.",
  },
  {
    title: "AI that earns its place",
    description:
      "The premium workflows are designed to sit inside real acquisition and operating decisions, not as isolated novelty screens.",
  },
];

export const resourcesIntro = [
  "Actionable playbooks for acquisitions, rehab planning, and property operations.",
  "Practical content that helps teams make better decisions before they ever log in.",
  "Editorial that supports the same workflows the product is built to manage.",
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
    slug: "property-operations-command-center",
    category: "Operations",
    readTime: "5 min read",
    title: "What a property operations command center should actually centralize",
    summary:
      "The right operating system keeps the asset, the team, and the follow-up connected so nothing important lives in memory alone.",
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
          "Daily operations become expensive when tasks, due dates, and vendor follow-up live in separate systems. A useful command center ties the work together so the team can see what matters this week and why.",
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
          "Professional operations are not just about speed today. They are about making the next handoff, review, and portfolio conversation easier because the context is already there.",
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
