import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftOnRectangleIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";

const getUserLabel = (user) => user?.name || user?.email || "Workspace session";

function PlatformShell({ children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen app-shell-bg">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
        <header className="surface-panel-strong flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <span className="eyebrow">Platform</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-ink-900 text-white shadow-soft">
                <Squares2X2Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[1.85rem] font-semibold tracking-tight text-ink-900">
                  Clean slate
                </h1>
                <p className="mt-1 text-sm text-ink-500">
                  The live platform is intentionally empty while we rebuild from scratch.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/dashboard" className="secondary-action">
              Workspace
            </Link>
            <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-ink-600 shadow-soft">
              {getUserLabel(user)}
            </div>
            <button type="button" onClick={handleLogout} className="secondary-action">
              <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
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
