import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";

const getUserLabel = (user) => user?.name || user?.email || "Workspace session";

function PlatformShell({ children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell-bg relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-20" />
      <div className="ambient-orb ambient-orb-bronze float-slower left-[-8rem] top-[-3rem] h-[16rem] w-[16rem]" />
      <div className="ambient-orb ambient-orb-sage float-slow right-[-8rem] top-24 h-[18rem] w-[18rem]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
        <header className="surface-panel-strong overflow-hidden px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <Link to="/" className="flex items-start gap-4">
                <div className="brand-mark flex h-14 w-14 items-center justify-center rounded-[22px] text-xl font-semibold text-white">
                  FL
                </div>
                <div className="min-w-0">
                  <span className="eyebrow">Signature workspace</span>
                  <h1 className="mt-4 font-display text-[3rem] leading-none text-ink-900">
                    Fliprop
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
                    An elegant operating layer for acquisitions, execution, and portfolio
                    reporting.
                  </p>
                </div>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto]">
              <div className="metric-tile p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                  Today
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-700">
                  <CalendarDaysIcon className="h-5 w-5 text-verdigris-600" />
                  <span>{todayLabel}</span>
                </div>
              </div>

              <div className="metric-tile p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                  Workspace owner
                </p>
                <p className="mt-3 text-sm font-semibold text-ink-900">{getUserLabel(user)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-500">
                  Live shell redesigned for a calmer, more premium experience.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 xl:justify-end">
                <Link to="/" className="ghost-action">
                  Homepage
                </Link>
                <Link to="/dashboard" className="secondary-action">
                  Workspace
                </Link>
                <button type="button" onClick={handleLogout} className="secondary-action">
                  <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}

export default PlatformShell;
