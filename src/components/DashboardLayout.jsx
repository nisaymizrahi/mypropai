import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

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
      { to: "/leads", label: "Potential Properties", icon: UsersIcon },
      { to: "/properties/new", label: "Add Property", icon: PlusCircleIcon },
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
      subtitle: "Capture the address, pull in the basic property facts, and save the opportunity into your pipeline.",
    };
  }

  if (pathname.startsWith("/properties/")) {
    return {
      kicker: "Property",
      title: "Property Details",
      subtitle: "Review and update the core record behind this property.",
    };
  }

  if (pathname === "/properties") {
    return {
      kicker: "Property",
      title: "Properties",
      subtitle: "Access the property records tied to your lead pipeline.",
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
      subtitle: "Review opportunities, move them through the pipeline, and focus on the ones worth deeper diligence.",
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

  return {
    kicker: "Workspace",
    title: `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`,
    subtitle: "Review potential properties and add the next opportunity without extra clutter.",
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
          to="/leads"
          onClick={onNavigate}
          className={collapsed ? "flex items-center justify-center" : "min-w-0 flex-1"}
          title={collapsed ? "Fliprop workspace" : undefined}
        >
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3.5"}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10 text-base font-bold">
              FL
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="font-display text-[1.65rem] leading-none tracking-tight">Fliprop</p>
                <p className="mt-1 text-sm text-white/65">Property leads and deal intake</p>
              </div>
            ) : (
              <span className="sr-only">Fliprop workspace</span>
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
            to="/properties/new"
            onClick={onNavigate}
            title="Add Property"
            aria-label="Add Property"
            className="flex h-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/88 text-ink-700 shadow-soft transition hover:bg-white"
          >
            <PlusCircleIcon className="h-5 w-5" />
          </Link>
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
              Quick action
            </p>
            <h3 className="mt-2 text-base font-semibold text-ink-900">
              Add the next property to your pipeline
            </h3>
            <p className="mt-2 text-sm leading-5 text-ink-500">
              Start with the address, let the lookup fill in the basics, and keep the workflow focused on real opportunities.
            </p>
            <Link
              to="/properties/new"
              onClick={onNavigate}
              className="primary-action mt-4 w-full justify-center"
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              Add Property
            </Link>
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
                <div className="hidden rounded-full border border-white/70 bg-white/65 px-3.5 py-1.5 text-sm font-medium text-ink-500 shadow-soft md:block">
                  {todayLabel}
                </div>
                <Link to="/properties/new" className="primary-action hidden md:inline-flex">
                  <PlusCircleIcon className="mr-2 h-5 w-5" />
                  Add Property
                </Link>
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
    </div>
  );
}

export default DashboardLayout;
