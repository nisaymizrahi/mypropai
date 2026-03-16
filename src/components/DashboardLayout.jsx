import React, { useEffect, useMemo, useRef, useState } from "react";
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
  PlusCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import UserInfoBanner from "./UserInfoBanner";
import BrandLogo from "./BrandLogo";
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
      { to: "/leads", label: "Potential Properties", icon: UsersIcon },
      { to: "/properties", label: "Property Workspace", icon: BuildingOffice2Icon },
      { to: "/comps-report", label: "Comps Report", icon: ChartBarIcon },
      { to: "/master-calendar", label: "Master Calendar", icon: CalendarDaysIcon },
      { to: "/tasks", label: "Tasks", icon: ClipboardDocumentListIcon },
      { to: "/vendors", label: "Vendors", icon: WrenchScrewdriverIcon },
      { to: "/properties/new", label: "Add Property", icon: PlusCircleIcon },
      { to: "/account", label: "Account", icon: Cog6ToothIcon },
    ],
  },
];

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
  if (pathname === "/properties/new") {
    return {
      kicker: "Pipeline",
      title: "Add Property",
      subtitle: "Capture a new opportunity and keep the intake process simple.",
    };
  }

  if (pathname === "/properties") {
    return {
      kicker: "Property",
      title: "Property Workspace",
      subtitle: "Browse shared property records and open the right workspace from one place.",
    };
  }

  if (pathname.startsWith("/properties/")) {
    return {
      kicker: "Property",
      title: "Property Details",
      subtitle: "Review and update the core record behind this property.",
    };
  }

  if (pathname === "/comps-report") {
    return {
      kicker: "Analysis",
      title: "Comps Report",
      subtitle: "Run the same comps workflow from the deal tabs without creating a lead first.",
    };
  }

  if (pathname.startsWith("/leads/")) {
    return {
      kicker: "Pipeline",
      title: "Potential Property",
      subtitle: "Track the latest notes, pricing, and next steps for this opportunity.",
    };
  }

  if (pathname === "/leads") {
    return {
      kicker: "Pipeline",
      title: "Potential Properties",
      subtitle: "Review opportunities and keep attention on the deals worth deeper diligence.",
    };
  }

  if (pathname === "/account") {
    return {
      kicker: "Workspace",
      title: "Account Center",
      subtitle: "Manage profile settings and workspace preferences.",
    };
  }

  if (pathname === "/tasks") {
    return {
      kicker: "Workspace",
      title: "Tasks",
      subtitle: "Track work across leads, property records, and general operations from one view.",
    };
  }

  if (pathname === "/master-calendar") {
    return {
      kicker: "Workspace",
      title: "Master Calendar",
      subtitle: "See upcoming property work in one shared timeline across the workspace.",
    };
  }

  if (pathname === "/vendors") {
    return {
      kicker: "Workspace",
      title: "Vendors",
      subtitle: "Organize trades, documents, and assignment readiness from one vendor directory.",
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
    subtitle: "A simpler workspace for reviewing leads and adding the next property.",
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
      <p className="px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
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
              `group flex items-center text-sm transition ${
                collapsed
                  ? "justify-center rounded-[14px] px-0 py-2.5"
                  : "gap-3 rounded-[14px] px-3 py-2.5"
              } ${
                isActive
                  ? "bg-ink-900 text-white"
                  : "text-ink-600 hover:bg-white hover:text-ink-900"
              }`
            }
          >
            <link.icon className="h-4 w-4 flex-shrink-0" />
            {collapsed ? <span className="sr-only">{link.label}</span> : <span>{link.label}</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);

const SidebarContent = ({ user, onNavigate, collapsed, onToggleCollapse }) => (
  <>
    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3`}>
      <Link
        to="/leads"
        onClick={onNavigate}
        className={collapsed ? "flex items-center justify-center" : "flex items-center"}
        title={collapsed ? "Fliprop workspace" : undefined}
      >
        {collapsed ? <BrandLogo compact /> : <BrandLogo caption="Lead pipeline" />}
        <span className="sr-only">Fliprop workspace</span>
      </Link>

      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-9 w-9 items-center justify-center rounded-[12px] border border-ink-100 bg-white text-ink-600 xl:flex"
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
      ) : null}
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
        <div
          className="flex h-10 items-center justify-center rounded-[14px] border border-ink-100 bg-white text-xs font-medium text-ink-700"
          title={user?.email || user?.name || "Workspace user"}
        >
          {getUserInitials(user?.name, user?.email)}
        </div>
      ) : (
        <div className="section-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Workspace owner
          </p>
          <p className="mt-3 text-sm font-medium text-ink-900">{user?.name || "Fliprop User"}</p>
          <p className="mt-1 text-sm text-ink-500">{user?.email || "Property operations"}</p>
          <Link
            to="/properties/new"
            onClick={onNavigate}
            className="secondary-action mt-4 w-full justify-center"
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </div>
      )}
    </div>
  </>
);

function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  }, [location.pathname]);

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
      <div className="mx-auto flex max-w-[1440px] gap-4 px-4 py-4 md:px-5 lg:px-6">
        <aside
          className={`hidden xl:block xl:flex-shrink-0 xl:transition-all xl:duration-200 ${
            isSidebarCollapsed ? "xl:w-[92px]" : "xl:w-[250px]"
          }`}
        >
          <div
            className={`surface-panel sticky top-4 flex h-[calc(100vh-2rem)] flex-col ${
              isSidebarCollapsed ? "px-3 py-4" : "px-4 py-4"
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
            <div className="absolute inset-0 bg-ink-900/20" />
            <div
              ref={mobileMenuRef}
              className="relative z-10 m-4 flex w-[88vw] max-w-sm flex-col rounded-[18px] border border-ink-100 bg-white p-5 shadow-soft"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                    Navigation
                  </p>
                  <BrandLogo className="mt-2" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-ink-100 bg-white text-ink-700"
                >
                  <XMarkIcon className="h-4 w-4" />
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

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="sticky top-4 z-30">
            <div className="surface-panel flex flex-col gap-3 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] border border-ink-100 bg-white text-ink-800 xl:hidden"
                >
                  <Bars3Icon className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <span className="eyebrow">{pageMeta.kicker}</span>
                  <h1 className="mt-3 text-[1.55rem] font-medium tracking-tight text-ink-900 md:text-[1.75rem]">
                    {pageMeta.title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-500">
                    {pageMeta.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                <span className="glass-chip hidden md:inline-flex">{todayLabel}</span>
                <Link to="/properties/new" className="secondary-action hidden md:inline-flex">
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Property
                </Link>
                <UserInfoBanner />
              </div>
            </div>
          </header>

          <main className="pb-8">
            <div
              className={`mx-auto w-full space-y-4 xl:transition-all xl:duration-200 ${
                isSidebarCollapsed ? "max-w-[1280px]" : "max-w-[1180px]"
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

              <div>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
