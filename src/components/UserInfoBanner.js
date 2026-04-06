import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const UserInfoBanner = () => {
  const { user, logout, stopImpersonation, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const displayName = user.name || "Fliprop User";
  const secondaryText = user.email || "Property operations";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleStopImpersonation = async () => {
    stopImpersonation();
    setIsMenuOpen(false);
    navigate("/platform-manager");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex items-center gap-3 rounded-full border border-white/70 bg-white/70 px-2 py-2 shadow-soft transition hover:bg-white"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ink-900 via-ink-700 to-verdigris-600 text-sm font-bold text-white">
          {getInitials(displayName)}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-semibold text-ink-900">{displayName}</p>
          <p className="text-xs text-ink-400">
            {isImpersonating ? "Support session active" : secondaryText}
          </p>
        </div>
        <ChevronDownIcon
          className={`hidden h-4 w-4 text-ink-400 transition md:block ${
            isMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-[24px] border border-white/80 bg-white/96 shadow-luxe backdrop-blur-xl">
          <div className="border-b border-ink-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                {isImpersonating ? "Support session" : "Account"}
              </p>
              {isImpersonating ? (
                <span className="rounded-full bg-clay-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-clay-700">
                  Impersonating
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 text-base font-semibold text-ink-900">{displayName}</h3>
            <p className="mt-1 text-sm text-ink-500">
              {isImpersonating
                ? `Working as ${secondaryText}`
                : secondaryText}
            </p>
            {isImpersonating ? (
              <p className="mt-2 text-xs leading-5 text-ink-400">
                Changes made here affect the user&apos;s live workspace until you exit the support
                session.
              </p>
            ) : null}
          </div>

          <div className="px-3 py-3">
            {isImpersonating ? (
              <button
                type="button"
                onClick={handleStopImpersonation}
                className="mb-1 flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-clay-700 transition hover:bg-clay-50"
              >
                Return to platform manager
              </button>
            ) : null}
            {user.isPlatformManager ? (
              <Link
                to="/platform-manager"
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-sand-50"
              >
                Platform Manager
              </Link>
            ) : null}
            <Link
              to="/help"
              onClick={() => setIsMenuOpen(false)}
              className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-sand-50"
            >
              Help & Support
            </Link>
            <Link
              to="/account"
              onClick={() => setIsMenuOpen(false)}
              className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-sand-50"
            >
              Account Center
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium text-clay-700 transition hover:bg-clay-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfoBanner;
