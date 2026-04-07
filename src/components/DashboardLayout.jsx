import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import BrandLogo from "./BrandLogo";
import CommandPalette from "./CommandPalette";
import UserInfoBanner from "./UserInfoBanner";
import { useAuth } from "../context/AuthContext";
import { getProperties } from "../utils/api";
import { buildPropertyWorkspacePath } from "../utils/propertyWorkspaceNavigation";
import {
  getSidebarOption,
  loadSidebarPreference,
  persistSidebarPreference,
  SIDEBAR_PREFERENCE_EVENT,
} from "../utils/sidebarPreferences";

const WORKSPACE_LINKS = [
  { to: "/leads", label: "Pipeline", icon: UsersIcon, end: false },
  { to: "/comps-report", label: "Analysis", icon: ChartBarIcon, end: true },
  { to: "/properties", label: "Projects", icon: BuildingOffice2Icon, end: false },
  { to: "/market-search", label: "Search", icon: MapIcon, end: true },
];

const OPERATIONS_LINKS = [
  { to: "/master-calendar", label: "Calendar", icon: CalendarDaysIcon, end: true },
  { to: "/tasks", label: "Tasks", icon: ClipboardDocumentListIcon, end: true },
  { to: "/vendors", label: "Vendors", icon: WrenchScrewdriverIcon, end: true },
];

const getUtilityLinks = (user) => {
  const links = [{ to: "/account", label: "Settings", icon: Cog6ToothIcon, end: true }];

  if (user?.isPlatformManager) {
    links.push({
      to: "/platform-manager",
      label: "Platform Manager",
      icon: ShieldCheckIcon,
      end: true,
    });
  }

  return links;
};

const getPropertyLabel = (property) =>
  property?.sharedProfile?.address ||
  property?.title ||
  property?.placement ||
  property?.propertyKey ||
  "Untitled property";

const getPropertyMeta = (property) =>
  [
    property?.workspaces?.pipeline?.status,
    property?.sharedProfile?.propertyType,
    property?.sharedProfile?.squareFootage
      ? `${Number(property.sharedProfile.squareFootage).toLocaleString()} sqft`
      : null,
  ]
    .filter(Boolean)
    .join(" • ") || "Project workspace";

const sortPropertiesByRecency = (properties = []) =>
  [...properties].sort((left, right) => {
    const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime();
    const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime();
    return rightTime - leftTime;
  });

const resolvePageMeta = (pathname, user) => {
  if (pathname === "/properties/new") {
    return {
      kicker: "Projects",
      title: "Add deal",
      subtitle:
        "Start the deal and property record together, then open the workspace only when the opportunity is worth deeper work.",
    };
  }

  if (pathname === "/properties") {
    return {
      kicker: "Projects",
      title: "Projects",
      subtitle:
        "Open the project home, jump into execution or budget, and keep every active property moving from one investor workspace.",
    };
  }

  if (pathname.startsWith("/properties/")) {
    return {
      kicker: "Projects",
      title: "Project Workspace",
      subtitle:
        "Run the project from one calm workspace with a home command center, execution, budget, files, deal context, and project setup.",
    };
  }

  if (pathname === "/comps-report") {
    return {
      kicker: "Analysis",
      title: "Deal analysis",
      subtitle:
        "Run comps, review the modeled spread, and decide whether the deal deserves the next step.",
    };
  }

  if (pathname.startsWith("/leads/")) {
    return {
      kicker: "Pipeline",
      title: "Deal",
      subtitle:
        "Keep the address, seller context, pricing case, and next action together before the project begins.",
    };
  }

  if (pathname === "/leads") {
    return {
      kicker: "Pipeline",
      title: "Pipeline",
      subtitle:
        "Capture opportunities, run analysis fast, and move the winners into active property work without losing context.",
    };
  }

  if (pathname === "/market-search") {
    return {
      kicker: "Search",
      title: "Market Search",
      subtitle:
        "Browse live inventory, compare fit quickly, and push the best addresses into the pipeline when they look worth pursuing.",
    };
  }

  if (pathname === "/account") {
    return {
      kicker: "Settings",
      title: "Account Center",
      subtitle: "Manage profile settings, preferences, and workspace controls.",
    };
  }

  if (pathname === "/tasks") {
    return {
      kicker: "Operations",
      title: "Tasks",
      subtitle: "Track work across deals, properties, and daily operations from one place.",
    };
  }

  if (pathname === "/master-calendar") {
    return {
      kicker: "Operations",
      title: "Calendar",
      subtitle: "See upcoming property work in one shared operating timeline.",
    };
  }

  if (pathname === "/vendors") {
    return {
      kicker: "Operations",
      title: "Vendors",
      subtitle: "Keep trades, documents, and assignment readiness together in one directory.",
    };
  }

  if (pathname === "/platform-manager") {
    return {
      kicker: "Platform",
      title: "Platform Manager",
      subtitle: "Support users securely with owner-only controls and access overrides.",
    };
  }

  return {
    kicker: "Workspace",
    title: `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`,
    subtitle:
      "A calmer investor workspace for reviewing deals, running analysis, and opening the next property workspace.",
  };
};

const SidebarNavItem = ({ item, onNavigate, collapsed }) => (
  <li>
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={item.label}
      className={({ isActive }) =>
        `group relative flex items-center rounded-[16px] text-sm font-medium transition ${
          collapsed
            ? "shell-nav-button justify-center px-0"
            : "shell-nav-button gap-3 px-3.5"
        } ${isActive ? "shell-nav-button-active" : ""}`
      }
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {collapsed ? (
        <>
          <span className="sr-only">{item.label}</span>
          <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-soft group-hover:block group-focus-visible:block">
            {item.label}
          </span>
        </>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
    </NavLink>
  </li>
);

const SidebarSection = ({ title, links, onNavigate, collapsed }) => (
  <section className="space-y-2.5" aria-label={title}>
    {!collapsed ? (
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        {title}
      </p>
    ) : null}
    <ul className={collapsed ? "space-y-1.5" : "space-y-1"} aria-label={title}>
      {links.map((item) => (
        <SidebarNavItem
          key={item.to}
          item={item}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      ))}
    </ul>
  </section>
);

const RecentDealsSection = ({ properties, onNavigate, pathname }) => (
  <section className="space-y-2.5" aria-label="Recent projects">
    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
      Recent projects
    </p>
    <div className="space-y-1">
      {properties.map((property) => {
        const to = buildPropertyWorkspacePath(property.propertyKey);
        const isActive = pathname.startsWith(`/properties/${encodeURIComponent(property.propertyKey)}`);

        return (
          <Link
            key={property.propertyKey}
            to={to}
            onClick={onNavigate}
            className={`block rounded-[16px] px-3 py-2.5 transition ${
              isActive
                ? "bg-ink-900 text-white shadow-soft"
                : "shell-recent-link text-ink-800 hover:bg-white"
            }`}
          >
            <p className="truncate text-sm font-medium">{getPropertyLabel(property)}</p>
            <p className={`mt-1 truncate text-xs ${isActive ? "text-white/70" : "text-ink-500"}`}>
              {getPropertyMeta(property)}
            </p>
          </Link>
        );
      })}
    </div>
  </section>
);

const SidebarSearchTrigger = ({ collapsed, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label="Jump to project, deal, or task"
    className={
      collapsed
        ? "shell-search-trigger flex h-[46px] w-full items-center justify-center rounded-[16px]"
        : "shell-search-trigger flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left"
    }
  >
    <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
      <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
      {collapsed ? (
        <span className="sr-only">Jump to property, deal, or task</span>
      ) : (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">
            Jump to project, deal, or task
          </p>
          <p className="truncate text-xs text-ink-500">
            Search pages, projects, and active pipeline records
          </p>
        </div>
      )}
    </div>
    {!collapsed ? <span className="shell-search-hint">Cmd/Ctrl K</span> : null}
  </button>
);

const SidebarContent = ({
  user,
  collapsed,
  pathname,
  onNavigate,
  onOpenSearch,
  onToggleCollapse,
  recentDeals,
  recentDealsLoading,
}) => (
  <>
    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3`}>
      <Link
        to="/leads"
        onClick={onNavigate}
        className={collapsed ? "flex items-center justify-center" : "flex items-center"}
        title={collapsed ? "Fliprop workspace" : undefined}
      >
        {collapsed ? <BrandLogo compact /> : <BrandLogo caption="Investor workspace" />}
        <span className="sr-only">Fliprop workspace</span>
      </Link>

      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-10 w-10 items-center justify-center rounded-[14px] border border-ink-100 bg-white/92 text-ink-600 transition hover:bg-white xl:flex"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>

    <div className="group relative mt-5">
      <SidebarSearchTrigger collapsed={collapsed} onOpen={onOpenSearch} />
      {collapsed ? (
        <span className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-soft group-hover:block group-focus-within:block">
          Jump to project, deal, or task
        </span>
      ) : null}
    </div>

    <div className={`mt-6 ${collapsed ? "space-y-5" : "space-y-6"}`}>
      <SidebarSection
        title="Workspace"
        links={WORKSPACE_LINKS}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
      <SidebarSection
        title="Operations"
        links={OPERATIONS_LINKS}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
      {!collapsed && recentDeals.length > 0 ? (
        <RecentDealsSection
          properties={recentDeals}
          onNavigate={onNavigate}
          pathname={pathname}
        />
      ) : null}
      {!collapsed && recentDealsLoading && !recentDeals.length ? (
        <p className="px-1 text-sm text-ink-500">Loading recent projects...</p>
      ) : null}
    </div>

    <div className={`mt-auto ${collapsed ? "pt-4" : "pt-5"} shell-sidebar-divider`}>
      <SidebarSection
        title="Utility"
        links={getUtilityLinks(user)}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
    </div>
  </>
);

function DashboardLayout({ children }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarPreference, setSidebarPreference] = useState(() => loadSidebarPreference());
  const [pageHeaderConfig, setPageHeaderConfig] = useState(null);
  const [recentDeals, setRecentDeals] = useState([]);
  const [recentDealsLoading, setRecentDealsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { stopImpersonation, user } = useAuth();

  const isSidebarCollapsed = sidebarPreference === "collapsed";
  const isMarketSearchPage = location.pathname === "/market-search";

  const basePageMeta = useMemo(
    () => resolvePageMeta(location.pathname, user),
    [location.pathname, user]
  );
  const pageMeta = useMemo(
    () => ({
      ...basePageMeta,
      ...(pageHeaderConfig?.meta || {}),
    }),
    [basePageMeta, pageHeaderConfig]
  );
  const showPipelineShortcut =
    location.pathname.startsWith("/leads") || location.pathname.startsWith("/properties");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSidebarPreferenceChange = (event) => {
      setSidebarPreference(getSidebarOption(event.detail).value);
    };

    window.addEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
    return () =>
      window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, handleSidebarPreferenceChange);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const loadRecentDeals = async () => {
      setRecentDealsLoading(true);

      try {
        const properties = await getProperties();
        if (!isSubscribed) {
          return;
        }

        setRecentDeals(
          sortPropertiesByRecency(Array.isArray(properties) ? properties : [])
            .filter((property) => Boolean(property?.propertyKey))
            .slice(0, 5)
        );
      } catch (error) {
        if (!isSubscribed) {
          return;
        }

        console.error("Failed to load recent deals", error);
        setRecentDeals([]);
      } finally {
        if (isSubscribed) {
          setRecentDealsLoading(false);
        }
      }
    };

    loadRecentDeals();

    return () => {
      isSubscribed = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCommandPaletteOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setPageHeaderConfig(null);
  }, [location.pathname]);

  useEffect(() => {
    const isTextEntryTarget = (target) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      return (
        target.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      );
    };

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isTextEntryTarget(event.target)) {
          return;
        }

        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (event.key === "Escape" && isMobileMenuOpen) {
        event.preventDefault();
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

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

  const renderedChildren = useMemo(() => {
    if (!React.isValidElement(children)) {
      return children;
    }

    return React.cloneElement(children, {
      setDashboardHeaderConfig: setPageHeaderConfig,
    });
  }, [children]);

  return (
    <div className="min-h-screen app-shell-bg">
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        user={user}
      />

      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 md:right-5 md:top-5 lg:right-6 lg:top-6">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="secondary-action xl:hidden"
          aria-label="Open navigation"
        >
          <Bars3Icon className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </button>

        {showPipelineShortcut ? (
          <Link to="/leads" className="secondary-action">
            Potential Properties
          </Link>
        ) : null}

        <UserInfoBanner />
      </div>

      <div className="mx-auto flex max-w-[1440px] gap-4 px-4 py-4 md:px-5 lg:px-6">
        <aside
          className={`hidden xl:block xl:flex-shrink-0 xl:transition-all xl:duration-200 ${
            isSidebarCollapsed ? "xl:w-[72px]" : "xl:w-[292px]"
          }`}
        >
          <div
            className={`shell-sidebar sticky top-4 flex h-[calc(100vh-2rem)] flex-col ${
              isSidebarCollapsed ? "px-3 py-4" : "px-5 py-5"
            }`}
          >
            <SidebarContent
              user={user}
              collapsed={isSidebarCollapsed}
              pathname={location.pathname}
              onNavigate={undefined}
              onOpenSearch={() => setIsCommandPaletteOpen(true)}
              onToggleCollapse={handleSidebarToggle}
              recentDeals={recentDeals}
              recentDealsLoading={recentDealsLoading}
            />
          </div>
        </aside>

        {isMobileMenuOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink-900/28 backdrop-blur-[2px]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
            />
            <div
              className="shell-mobile-drawer relative z-10 flex h-full flex-col overflow-y-auto px-5 py-5"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-ink-100 bg-white text-ink-700 transition hover:bg-ink-50"
                  aria-label="Close navigation"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent
                user={user}
                collapsed={false}
                pathname={location.pathname}
                onNavigate={() => setIsMobileMenuOpen(false)}
                onOpenSearch={() => {
                  setIsMobileMenuOpen(false);
                  setIsCommandPaletteOpen(true);
                }}
                recentDeals={recentDeals}
                recentDealsLoading={recentDealsLoading}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="pb-8">
            <div
              className={`mx-auto w-full space-y-4 xl:transition-all xl:duration-200 ${
                isMarketSearchPage
                  ? "max-w-none"
                  : isSidebarCollapsed
                    ? "max-w-[1288px]"
                    : "max-w-[1168px]"
              }`}
            >
              {user?.impersonation?.active ? (
                <div className="surface-panel px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="eyebrow">Impersonation active</span>
                      <h2 className="mt-4 text-lg font-medium text-ink-900">
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
                      <ArrowPathIcon className="mr-2 h-4 w-4" />
                      Return to platform manager
                    </button>
                  </div>
                </div>
              ) : null}

              <div>{renderedChildren}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
