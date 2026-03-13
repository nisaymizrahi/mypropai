import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlusCircleIcon,
  RectangleStackIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import NotificationBell from "./NotificationBell";
import UserInfoBanner from "./UserInfoBanner";
import { useAuth } from "../context/AuthContext";

const navSections = [
  {
    title: "Command",
    links: [
      { to: "/dashboard", label: "Overview", icon: HomeIcon },
      { to: "/investments", label: "Investments", icon: BriefcaseIcon },
      { to: "/management", label: "Operations", icon: BuildingOffice2Icon },
    ],
  },
  {
    title: "Pipeline",
    links: [
      { to: "/leads", label: "Leads", icon: UsersIcon },
      { to: "/applications", label: "Applications", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { to: "/comps", label: "Market Intel", icon: ChartBarIcon },
      { to: "/tools", label: "Financial Tools", icon: RectangleStackIcon },
      { to: "/account", label: "Account Center", icon: Cog6ToothIcon },
    ],
  },
];

const resolvePageMeta = (pathname, user) => {
  if (pathname.startsWith("/investments/new")) {
    return {
      kicker: "Acquisitions",
      title: "Create Investment",
      subtitle: "Structure a new opportunity with underwriting details and assumptions.",
    };
  }

  if (pathname.startsWith("/investments/") && pathname.endsWith("/edit")) {
    return {
      kicker: "Acquisitions",
      title: "Edit Investment",
      subtitle: "Refine the underwriting model, assumptions, and return targets.",
    };
  }

  if (pathname.startsWith("/investments/")) {
    return {
      kicker: "Acquisitions",
      title: "Investment Detail",
      subtitle: "Review deal performance, budget exposure, and execution progress.",
    };
  }

  if (pathname.startsWith("/management/leases/")) {
    return {
      kicker: "Operations",
      title: "Lease Detail",
      subtitle: "Track tenant commitments, payment timelines, and lease milestones.",
    };
  }

  if (pathname.startsWith("/management/units/")) {
    return {
      kicker: "Operations",
      title: "Listing Command",
      subtitle: "Coordinate leasing copy, imagery, and readiness for vacant inventory.",
    };
  }

  if (pathname.startsWith("/management/")) {
    return {
      kicker: "Operations",
      title: "Property Command Center",
      subtitle: "Monitor occupancy, leasing pressure, and on-site activity for this asset.",
    };
  }

  if (pathname === "/management") {
    return {
      kicker: "Operations",
      title: "Property Operations",
      subtitle: "Oversee occupancy, vacancies, and the operational posture of your portfolio.",
    };
  }

  if (pathname.startsWith("/applications/")) {
    return {
      kicker: "Pipeline",
      title: "Application Review",
      subtitle: "Move applicants from inquiry to signed lease with clarity and speed.",
    };
  }

  if (pathname === "/applications") {
    return {
      kicker: "Pipeline",
      title: "Applications",
      subtitle: "Track applicant volume, quality, and next actions across your portfolio.",
    };
  }

  if (pathname.startsWith("/leads/")) {
    return {
      kicker: "Pipeline",
      title: "Lead Detail",
      subtitle: "Keep acquisition conversations organized and move decisively on promising deals.",
    };
  }

  if (pathname === "/leads") {
    return {
      kicker: "Pipeline",
      title: "Leads",
      subtitle: "Prioritize outreach, follow-up, and diligence on inbound opportunities.",
    };
  }

  if (pathname === "/comps") {
    return {
      kicker: "Intelligence",
      title: "Market Intelligence",
      subtitle: "Benchmark pricing, demand, and positioning with comparable market data.",
    };
  }

  if (pathname === "/tools") {
    return {
      kicker: "Intelligence",
      title: "Financial Toolkit",
      subtitle: "Run the calculators and underwriting scenarios that support sharper decisions.",
    };
  }

  if (pathname === "/account") {
    return {
      kicker: "Workspace",
      title: "Account Center",
      subtitle: "Manage profile settings, access, and the context behind your workspace.",
    };
  }

  if (pathname === "/investments") {
    return {
      kicker: "Acquisitions",
      title: "Investment Portfolio",
      subtitle: "View active deals, expected returns, and where capital is currently committed.",
    };
  }

  return {
    kicker: "Executive",
    title: `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`,
    subtitle: "Run acquisitions, operations, and reporting from one professional command center.",
  };
};

const SidebarSection = ({ title, links, onNavigate }) => (
  <div>
    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
      {title}
    </p>
    <ul className="mt-3 space-y-1.5">
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-ink-900 text-white shadow-soft"
                  : "text-ink-600 hover:bg-white hover:text-ink-900"
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const SidebarContent = ({ user, onNavigate }) => (
  <>
    <div className="rounded-[24px] bg-ink-900 px-5 py-5 text-white shadow-soft">
      <Link to="/dashboard" onClick={onNavigate} className="block">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold">
            MP
          </div>
          <div>
            <p className="font-display text-2xl leading-none tracking-tight">MyPropAI</p>
            <p className="mt-1 text-sm text-white/65">Real estate operating system</p>
          </div>
        </div>
      </Link>
    </div>

    <div className="mt-6 space-y-6">
      {navSections.map((section) => (
        <SidebarSection
          key={section.title}
          title={section.title}
          links={section.links}
          onNavigate={onNavigate}
        />
      ))}
    </div>

    <div className="mt-auto space-y-4">
      <div className="rounded-[24px] border border-white/80 bg-white/88 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
          Quick start
        </p>
        <h3 className="mt-2 text-lg font-semibold text-ink-900">
          Spin up a new deal record
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Launch a fresh investment workspace for underwriting, planning, and execution.
        </p>
        <Link to="/investments/new" onClick={onNavigate} className="primary-action mt-4 w-full">
          <PlusCircleIcon className="mr-2 h-5 w-5" />
          New Investment
        </Link>
      </div>

      <div className="rounded-[24px] border border-ink-100 bg-sand-50/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          Workspace owner
        </p>
        <p className="mt-2 text-sm font-semibold text-ink-900">{user?.name || "MyPropAI User"}</p>
        <p className="mt-1 text-sm text-ink-500">
          {user?.email || "Property operations dashboard"}
        </p>
      </div>
    </div>
  </>
);

function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();

  const pageMeta = useMemo(
    () => resolvePageMeta(location.pathname, user),
    [location.pathname, user]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen app-shell-bg">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden xl:block xl:w-[320px] xl:flex-shrink-0">
          <div className="surface-panel sticky top-6 flex h-[calc(100vh-3rem)] flex-col p-6">
            <SidebarContent user={user} />
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex xl:hidden">
            <div className="absolute inset-0 bg-ink-900/35" />
            <div
              ref={mobileMenuRef}
              className="relative z-10 m-4 flex w-[88vw] max-w-sm flex-col rounded-[32px] border border-white/75 bg-[rgba(255,253,248,0.96)] p-5 shadow-luxe backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                    Navigation
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-ink-900">MyPropAI</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent user={user} onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="sticky top-4 z-30">
            <div className="surface-panel-strong flex flex-col gap-4 px-5 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-white/75 bg-white/80 text-ink-800 shadow-soft xl:hidden"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <span className="eyebrow">{pageMeta.kicker}</span>
                  <h1 className="mt-3 text-2xl font-semibold text-ink-900 md:text-3xl">
                    {pageMeta.title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500 md:text-base">
                    {pageMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="hidden rounded-full border border-white/70 bg-white/65 px-4 py-2 text-sm font-medium text-ink-500 shadow-soft md:block">
                  {todayLabel}
                </div>
                <Link to="/investments/new" className="primary-action hidden md:inline-flex">
                  <PlusCircleIcon className="mr-2 h-5 w-5" />
                  New Investment
                </Link>
                <NotificationBell />
                <UserInfoBanner />
              </div>
            </div>
          </header>

          <main className="pb-8">
            <div className="mx-auto w-full max-w-[1220px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
