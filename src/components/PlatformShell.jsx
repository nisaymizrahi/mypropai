import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

import BrandLogo from "./BrandLogo";
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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell-bg min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <header className="surface-panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Minimal workspace shell" />
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="glass-chip hidden md:inline-flex">
              <CalendarDaysIcon className="mr-2 h-4 w-4" />
              {todayLabel}
            </span>
            <span className="glass-chip hidden sm:inline-flex">{getUserLabel(user)}</span>
            <Link to="/" className="ghost-action">
              Homepage
            </Link>
            <Link to="/dashboard" className="secondary-action">
              Workspace
            </Link>
            <button type="button" onClick={handleLogout} className="secondary-action">
              <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}

export default PlatformShell;
