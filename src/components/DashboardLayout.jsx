import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  Bars3Icon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  HomeModernIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";
import UserInfoBanner from "./UserInfoBanner";
import { useAuth } from "../context/AuthContext";
import {
  getSidebarOption,
  loadSidebarPreference,
  persistSidebarPreference,
  SIDEBAR_PREFERENCE_EVENT,
} from "../utils/sidebarPreferences";

const visibleNavSections = [
  {
    title: "Workspace",
    links: [
      { to: "/dashboard", label: "Overview", icon: HomeIcon },
      { to: "/account", label: "Account Center", icon: Cog6ToothIcon },
    ],
  },
];

// Keep the current feature navigation parked here so we can restore it quickly during the rebuild.
const parkedFeatureNavSections = [
  {
    title: "Command",
    links: [
      { to: "/properties", label: "Property Hub", icon: HomeModernIcon },
      { to: "/properties/new", label: "New Property", icon: PlusCircleIcon },
      { to: "/applications", label: "Applications", icon: ClipboardDocumentListIcon },
      { to: "/applications/send", label: "Send Application", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    title: "Views",
    links: [
      { to: "/leads", label: "Leads", icon: UsersIcon },
      { to: "/investments", label: "Acquisitions View", icon: BriefcaseIcon },
      { to: "/management", label: "Management View", icon: BuildingOffice2Icon },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { to: "/comps", label: "Market Intel", icon: ChartBarIcon },
      { to: "/tools", label: "Financial Tools", icon: RectangleStackIcon },
    ],
  },
];

const parkedFeatureLinkCount = parkedFeatureNavSections.reduce(
  (count, section) => count + section.links.length,
  0
);

const getNavSections = (user) => {
  const sections = visibleNavSections.map((section) => ({
    ...section,
    links: [...section.links],
  }));

  if (user?.isPlatformManager) {
    sections.unshift({
      title: "Platform",
      links: [{ to: "/platform-manager", label: "Platform Manager", icon: ShieldCheckIcon }],
    });
  }

  return sections;
};

const resolvePageMeta = (pathname, user) => {
  if (pathname.startsWith("/investments/new")) {
    return {
      kicker: "Acquisitions",
      title: "Create Acquisition Workspace",
      subtitle: "Structure a new acquisitions workspace with underwriting details and assumptions.",
    };
  }

  if (pathname === "/properties/new") {
    return {
      kicker: "Property Hub",
      title: "Create Property",
      subtitle: "Start with the shared property record, then decide whether it belongs in pipeline, acquisitions, or management.",
    };
  }

  if (pathname.startsWith("/investments/") && pathname.endsWith("/edit")) {
    return {
      kicker: "Acquisitions",
      title: "Edit Acquisition Workspace",
      subtitle: "Refine the underwriting model, assumptions, and return targets for this property.",
    };
  }

  if (pathname.startsWith("/investments/")) {
    return {
      kicker: "Acquisitions",
      title: "Acquisition Workspace",
      subtitle: "Review underwriting, budget exposure, and execution progress for this property.",
    };
  }

  if (pathname.startsWith("/management/leases/")) {
    return {
      kicker: "Operations",
      title: "Lease Detail",
      subtitle: "Track tenant commitments, payment timelines, and lease milestones.",
    };
  }

  if (pathname.startsWith("/properties/")) {
    return {
      kicker: "Property Hub",
      title: "Property Workspace",
      subtitle: "Manage shared property details once, then move between pipeline, acquisitions, and management with less duplication.",
    };
  }

  if (pathname === "/properties") {
    return {
      kicker: "Property Hub",
      title: "Properties",
      subtitle: "View the unified property record behind every lead, investment, and managed asset in your workspace.",
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
      title: "Management Workspace",
      subtitle: "Monitor occupancy, leasing pressure, and on-site activity for this asset.",
    };
  }

  if (pathname === "/management") {
    return {
      kicker: "Operations",
      title: "Management View",
      subtitle: "Use the management-filtered view of the property hub to oversee occupancy, vacancies, and leasing operations.",
    };
  }

  if (pathname === "/applications/send") {
    return {
      kicker: "Pipeline",
      title: "Send Application",
      subtitle: "Create a leasing link for the right property and vacant unit without leaving the portfolio context.",
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

  if (pathname === "/platform-manager") {
    return {
      kicker: "Platform",
      title: "Platform Manager",
      subtitle: "Support users securely with owner-only controls, access overrides, and impersonation tools.",
    };
  }

  if (pathname === "/investments") {
    return {
      kicker: "Acquisitions",
      title: "Acquisitions View",
      subtitle: "Use the acquisitions-filtered view of the property hub to track underwriting, execution, and management readiness.",
    };
  }

  return {
    kicker: "Executive",
    title: `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`,
    subtitle: "Run acquisitions, operations, and reporting from one professional command center.",
  };
};

const getUserInitials = (name, email) => {
  const source = (name || email || "Fliprop").replace(/@.*$/, "");
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) {
    return "FL";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const SidebarSection = ({ title, links, onNavigate, collapsed }) => (
  <div>
    {!collapsed ? (
      <p className="px-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
        {title}
      </p>
    ) : null}
    <ul className={collapsed ? "space-y-2" : "mt-3 space-y-1.5"} aria-label={title}>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            onClick={onNavigate}
            title={collapsed ? link.label : undefined}
            aria-label={link.label}
            className={({ isActive }) =>
              `group flex items-center text-sm font-medium transition ${
                collapsed
                  ? "justify-center rounded-[18px] px-0 py-3"
                  : "gap-3 rounded-[18px] px-3.5 py-2.5"
              } ${
                isActive
                  ? "bg-ink-900 text-white shadow-soft"
                  : "text-ink-600 hover:bg-white hover:text-ink-900"
              }`
            }
          >
            <link.icon className="h-5 w-5 flex-shrink-0" />
            {collapsed ? <span className="sr-only">{link.label}</span> : <span>{link.label}</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const SidebarContent = ({ user, onNavigate, collapsed, onToggleCollapse }) => (
  <>
    <div
      className={`rounded-[22px] bg-ink-900 text-white shadow-soft ${
        collapsed ? "px-3 py-4" : "px-4 py-4"
      }`}
    >
      <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center gap-3"}`}>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className={collapsed ? "flex items-center justify-center" : "min-w-0 flex-1"}
          title={collapsed ? "Fliprop dashboard" : undefined}
        >
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3.5"}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10 text-base font-bold">
              FL
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="font-display text-[1.65rem] leading-none tracking-tight">Fliprop</p>
                <p className="mt-1 text-sm text-white/65">Develop, flip, and manage in one workspace</p>
              </div>
            ) : (
              <span className="sr-only">Fliprop dashboard</span>
            )}
          </div>
        </Link>

        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-white transition hover:bg-white/16"
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>

    <div className={`mt-5 ${collapsed ? "space-y-4" : "space-y-5"}`}>
      {getNavSections(user).map((section) => (
        <SidebarSection
          key={section.title}
          title={section.title}
          links={section.links}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      ))}
    </div>

    <div className={`mt-auto ${collapsed ? "space-y-3" : "space-y-4"}`}>
      {collapsed ? (
        <>
          <Link
            to="/account"
            onClick={onNavigate}
            title="Open Account Center"
            aria-label="Open Account Center"
            className="flex h-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/88 text-ink-700 shadow-soft transition hover:bg-white"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Link>
          <div
            className="flex h-11 items-center justify-center rounded-[18px] border border-ink-100 bg-sand-50/90 text-sm font-semibold text-ink-700"
            title={user?.email || user?.name || "Workspace user"}
          >
            {getUserInitials(user?.name, user?.email)}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-[22px] border border-white/80 bg-white/88 p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              Rebuild mode
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink-900">Feature links are parked</h3>
            <p className="mt-2 text-sm leading-5 text-ink-500">
              {parkedFeatureLinkCount} existing feature
              {parkedFeatureLinkCount === 1 ? " link is" : " links are"} hidden from the menu while we
              rebuild. The routes and screens are still there if we need to bring them back.
            </p>
          </div>

          <div className="rounded-[22px] border border-ink-100 bg-sand-50/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Workspace owner
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{user?.name || "Fliprop User"}</p>
            <p className="mt-1 text-sm text-ink-500">
              {user?.email || "Property operations dashboard"}
            </p>
          </div>
        </>
      )}
    </div>
  </>
);

function DashboardLayout({ children }) {
  const isMacLikePlatform =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sidebarPreference, setSidebarPreference] = useState(() => loadSidebarPreference());
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { stopImpersonation, user } = useAuth();

  const isSidebarCollapsed = sidebarPreference === "collapsed";

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
    setIsCommandPaletteOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (!isShortcut) {
        return;
      }

      event.preventDefault();
      setIsCommandPaletteOpen((current) => !current);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSidebarPreferenceChange = (event) => {
      setSidebarPreference(getSidebarOption(event.detail).value);
    };

    window.addEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
    return () => window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
  }, []);

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate("/platform-manager");
  };

  const handleSidebarToggle = () => {
    const appliedOption = persistSidebarPreference(
      isSidebarCollapsed ? "expanded" : "collapsed"
    );
    setSidebarPreference(appliedOption.value);
  };

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen app-shell-bg">
      <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 md:px-5 lg:px-7 xl:gap-5">
        <aside
          className={`hidden xl:block xl:flex-shrink-0 xl:transition-all xl:duration-200 ${
            isSidebarCollapsed ? "xl:w-[104px]" : "xl:w-[292px]"
          }`}
        >
          <div
            className={`surface-panel sticky top-6 flex h-[calc(100vh-3rem)] flex-col ${
              isSidebarCollapsed ? "px-3 py-4" : "px-4 py-5"
            }`}
          >
            <SidebarContent
              user={user}
              collapsed={isSidebarCollapsed}
              onToggleCollapse={handleSidebarToggle}
            />
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex xl:hidden">
            <div className="absolute inset-0 bg-ink-900/35" />
            <div
              ref={mobileMenuRef}
              className="relative z-10 m-4 flex w-[88vw] max-w-sm flex-col rounded-[28px] border border-white/75 bg-[rgba(255,253,248,0.96)] p-5 shadow-luxe backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
              <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                    Navigation
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-ink-900">Fliprop</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent
                user={user}
                collapsed={false}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="sticky top-4 z-30">
            <div className="surface-panel-strong flex flex-col gap-3 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/75 bg-white/80 text-ink-800 shadow-soft xl:hidden"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <span className="eyebrow">{pageMeta.kicker}</span>
                  <h1 className="mt-2.5 text-[1.72rem] font-semibold tracking-tight text-ink-900 md:text-[1.95rem]">
                    {pageMeta.title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-500">
                    {pageMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/78 text-ink-700 shadow-soft transition hover:bg-white md:hidden"
                  aria-label="Open search"
                  title="Open search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden min-w-[250px] items-center justify-between rounded-[16px] border border-white/70 bg-white/78 px-3.5 py-2.5 text-left text-sm text-ink-600 shadow-soft transition hover:bg-white md:flex"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-ink-700">
                    <MagnifyingGlassIcon className="h-4 w-4 text-ink-400" />
                    Search pages, properties, or people
                  </span>
                  <span className="rounded-full bg-sand-100 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500">
                    {isMacLikePlatform ? "Cmd K" : "Ctrl K"}
                  </span>
                </button>
                <div className="hidden rounded-full border border-white/70 bg-white/65 px-3.5 py-1.5 text-sm font-medium text-ink-500 shadow-soft md:block">
                  {todayLabel}
                </div>
                <Link to="/properties/new" className="primary-action hidden md:inline-flex">
                  <PlusCircleIcon className="mr-2 h-5 w-5" />
                  New Property
                </Link>
                <NotificationBell />
                <UserInfoBanner />
              </div>
            </div>
          </header>

          <main className="pb-8">
            <div
              className={`mx-auto w-full space-y-5 xl:transition-all xl:duration-200 ${
                isSidebarCollapsed ? "max-w-[1320px]" : "max-w-[1220px]"
              }`}
            >
              {user?.impersonation?.active ? (
                <div className="surface-panel-strong px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="eyebrow">Impersonation active</span>
                      <h2 className="mt-4 text-xl font-semibold text-ink-900">
                        Viewing the workspace as {user.name || user.email}.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        You are signed in with a temporary support session from{" "}
                        {user.impersonation.actorEmail || "the platform manager"}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStopImpersonation}
                      className="secondary-action"
                    >
                      <ArrowPathIcon className="mr-2 h-5 w-5" />
                      Return to platform manager
                    </button>
                  </div>
                </div>
              ) : null}

              <div>{children}</div>
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        user={user}
      />
    </div>
  );
}

export default DashboardLayout;
