import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalculatorIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const coreModules = [
  {
    title: "Acquisitions and underwriting",
    description:
      "Model deals, review comps, compare opportunities, and move from intuition to disciplined underwriting.",
    icon: ChartBarIcon,
  },
  {
    title: "Property operations",
    description:
      "Track occupancy, leasing flow, maintenance, leases, and portfolio health from one command layer.",
    icon: BuildingOffice2Icon,
  },
  {
    title: "AI reporting and content",
    description:
      "Generate reports, listing copy, and operating insights without losing control of the details.",
    icon: SparklesIcon,
  },
];

const outcomes = [
  {
    title: "One place to run the business",
    description:
      "MyPropAI is a real estate operating system for investors and property managers. It brings acquisitions, leasing, applications, tenant communication, and reporting into one product.",
    icon: WrenchScrewdriverIcon,
  },
  {
    title: "Clearer decisions and cleaner execution",
    description:
      "The platform helps teams act faster with dashboards, financial tools, AI assistance, and organized workflows that feel more professional than spreadsheets and scattered apps.",
    icon: ShieldCheckIcon,
  },
];

const audiences = [
  {
    title: "Investors",
    description:
      "Track opportunities, analyze returns, and keep each asset tied to the financial story behind it.",
    icon: ChartBarIcon,
  },
  {
    title: "Property managers",
    description:
      "Oversee units, applications, leases, communications, maintenance, and performance from one workspace.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Tenants",
    description:
      "Give renters a dedicated portal to view balances, review lease details, and submit requests.",
    icon: UserGroupIcon,
  },
];

const capabilities = [
  {
    title: "Analyze deals and comps",
    description: "Underwrite acquisitions with calculators, comparable sales, and ROI modeling tools.",
    icon: CalculatorIcon,
  },
  {
    title: "Manage properties and leases",
    description: "Track units, occupancy, active leases, financials, and portfolio performance in real time.",
    icon: HomeModernIcon,
  },
  {
    title: "Handle leads and applications",
    description: "Move prospects from lead intake to application review without losing context.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Support tenant communication",
    description: "Centralize requests, lease messages, and tenant access inside a separate portal experience.",
    icon: ChatBubbleLeftRightIcon,
  },
];

const workflow = [
  {
    step: "01",
    title: "Add properties and opportunities",
    description: "Start with an investment, managed property, or new lead so each workflow begins in one system.",
  },
  {
    step: "02",
    title: "Operate the portfolio day to day",
    description: "Manage leasing, applicants, units, and tenant activity while keeping the portfolio picture visible.",
  },
  {
    step: "03",
    title: "Report, refine, and scale",
    description: "Use built-in numbers and AI help to produce clearer updates, faster decisions, and stronger execution.",
  },
];

const faqs = [
  {
    question: "What is MyPropAI?",
    answer:
      "MyPropAI is an AI-powered real estate platform for investors and property managers. It combines deal analysis, property management, leasing, tenant communication, and reporting in one workspace.",
  },
  {
    question: "Who should create an account?",
    answer:
      "Owners, operators, and property managers should create or use a manager account. Tenants should use the dedicated tenant portal instead.",
  },
  {
    question: "Does the platform support tenants too?",
    answer:
      "Yes. Tenants get a separate login experience where they can review lease details, check balances, and submit requests without entering the manager workspace.",
  },
];

const Homepage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,163,128,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,143,129,0.22),transparent_18%),linear-gradient(180deg,#111d2c_0%,#0b1320_100%)]" />
      <div className="absolute inset-0 grid-fade opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4 text-ink-900">
          <Link to="/" className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
              MP
            </div>
            <div>
              <p className="font-display text-2xl leading-none">MyPropAI</p>
              <p className="mt-1 text-sm text-ink-500">Professional property intelligence</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/tenant-login" className="secondary-action hidden sm:inline-flex">
              Tenant portal
            </Link>
            <Link to="/login" className="primary-action">
              Manager login
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
            <div className="flex flex-col justify-center">
              <span className="eyebrow">AI-powered real estate platform</span>
              <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] text-balance sm:text-6xl xl:text-7xl">
                Analyze deals, manage properties, and keep tenants connected in one workspace.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                MyPropAI helps investors and property managers run acquisitions, leasing,
                property operations, tenant communication, and AI reporting from one clean
                operating system.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/signup" className="primary-action">
                  Create account
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="secondary-action !bg-white/10 !border-white/15 !text-white hover:!bg-white/14">
                  Manager login
                </Link>
                <Link to="/tenant-login" className="secondary-action !bg-white/10 !border-white/15 !text-white hover:!bg-white/14">
                  Tenant portal
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/12 bg-white/6 p-5 backdrop-blur-sm">
                  <p className="text-sm text-white/60">Who it serves</p>
                  <p className="mt-2 text-3xl font-semibold">Managers</p>
                  <p className="mt-2 text-sm text-white/60">Built for owners, operators, and property teams</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/6 p-5 backdrop-blur-sm">
                  <p className="text-sm text-white/60">Product scope</p>
                  <p className="mt-2 text-3xl font-semibold">End-to-end</p>
                  <p className="mt-2 text-sm text-white/60">From lead intake to tenant portal activity</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/6 p-5 backdrop-blur-sm">
                  <p className="text-sm text-white/60">Why it matters</p>
                  <p className="mt-2 text-3xl font-semibold">Clearer</p>
                  <p className="mt-2 text-sm text-white/60">Better decisions, reporting, and execution</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="surface-panel-strong relative w-full max-w-xl overflow-hidden p-6 text-ink-900">
                <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(17,29,44,0.95)_0%,rgba(31,111,99,0.82)_100%)]" />
                <div className="relative">
                  <div className="rounded-[28px] border border-white/12 bg-white/10 p-6 text-white backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                      Operating model
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-white/70">New visitor takeaway</p>
                        <p className="mt-2 text-2xl font-semibold leading-tight">
                          One platform for investing, management, leasing, and tenant workflow
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Primary action</p>
                        <p className="mt-2 text-2xl font-semibold leading-tight">
                          Start as a manager or use the tenant portal
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="-mt-3 grid gap-4 pt-6 sm:grid-cols-2">
                    {coreModules.map((pillar) => (
                      <div
                        key={pillar.title}
                        className="section-card p-5 sm:first:col-span-2"
                      >
                        <pillar.icon className="h-6 w-6 text-verdigris-600" />
                        <h3 className="mt-4 text-lg font-semibold text-ink-900">{pillar.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {pillar.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <section className="relative mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">Why teams choose it</span>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance text-ink-900">
              Run acquisitions, operations, and tenant workflow without stitching together tools.
            </h2>
            <div className="mt-8 space-y-5">
              {outcomes.map((row) => (
                <div
                  key={row.title}
                  className="flex gap-4 rounded-[24px] border border-ink-100 bg-white/78 p-5"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                    <row.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink-900">{row.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{row.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">Core modules</span>
            <div className="mt-6 space-y-4">
              {coreModules.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-[24px] border border-ink-100 bg-white/78 p-5"
                >
                  <div className="flex items-start gap-3">
                    <pillar.icon className="mt-1 h-5 w-5 text-clay-500" />
                    <div>
                      <h3 className="text-base font-semibold text-ink-900">{pillar.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 surface-panel p-6 text-ink-900 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Who it is for</span>
              <h2 className="mt-5 font-display text-4xl leading-tight text-balance text-ink-900">
                Clear paths for investors, operators, and tenants.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-ink-500">
              Everyone reaches the same platform from a different doorway, but each role gets a
              focused experience inside it.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {audiences.map((audience) => (
              <div key={audience.title} className="section-card p-6">
                <audience.icon className="h-7 w-7 text-clay-500" />
                <h3 className="mt-4 text-xl font-semibold text-ink-900">{audience.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-500">{audience.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">What you can do</span>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance text-ink-900">
              Everything needed to move from lead to lease and from deal to performance review.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <div key={capability.title} className="section-card p-5">
                  <capability.icon className="h-6 w-6 text-verdigris-600" />
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{capability.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">How it works</span>
            <div className="mt-6 space-y-4">
              {workflow.map((item) => (
                <div key={item.step} className="rounded-[24px] border border-ink-100 bg-white/78 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-verdigris-600">
                    Step {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">Trust and clarity</span>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance text-ink-900">
              Clear access for each user type before they even enter the product.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                "Managers and operators use a dedicated workspace for portfolio and property oversight.",
                "Tenants get a separate portal focused on lease details, balances, and service requests.",
                "Every entry point explains the purpose of the platform before asking for credentials.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[24px] border border-ink-100 bg-white/78 p-4">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-verdigris-600" />
                  <p className="text-sm leading-6 text-ink-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel p-6 text-ink-900 sm:p-8">
            <span className="eyebrow">FAQ</span>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-[24px] border border-ink-100 bg-white/78 p-5">
                  <h3 className="text-lg font-semibold text-ink-900">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-500">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/6 px-6 py-8 backdrop-blur-sm sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <span className="eyebrow !bg-white/10 !text-white">Get started</span>
              <h2 className="mt-5 font-display text-4xl leading-tight text-balance text-white">
                Choose your workspace and get moving.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                Create a manager account if you run properties or investments. If you are a tenant,
                use the tenant portal to access lease details and requests.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="primary-action">
                Create account
              </Link>
              <Link to="/login" className="secondary-action !bg-white !text-ink-900">
                Manager login
              </Link>
              <Link to="/tenant-login" className="secondary-action !bg-white/10 !border-white/15 !text-white hover:!bg-white/14">
                Tenant portal
              </Link>
            </div>
          </div>
        </section>

        <footer className="px-2 pt-8 text-sm text-white/55">
          <div className="flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p>MyPropAI</p>
            <p>One workspace for acquisitions, leasing, operations, tenant workflow, and reporting.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;
