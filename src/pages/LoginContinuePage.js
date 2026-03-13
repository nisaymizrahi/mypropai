import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";

const statusPoints = [
  {
    title: "Securing your session",
    description: "We are verifying your account and preparing your workspace access.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Restoring your dashboard",
    description: "Portfolio insights, applications, and operations data will load next.",
    icon: ChartBarIcon,
  },
  {
    title: "Finishing sign in",
    description: "This handoff usually takes only a moment before redirecting you.",
    icon: SparklesIcon,
  },
];

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const { login, authenticated, loading } = useAuth();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const tokenInUrl = hashParams.get("token") || searchParams.get("token");

    if (tokenInUrl) {
      window.history.replaceState({}, document.title, window.location.pathname);
      login(tokenInUrl);
    }
  }, [login]);

  useEffect(() => {
    if (!loading) {
      if (authenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [authenticated, loading, navigate]);

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />
      <div className="ambient-orb ambient-orb-bronze float-slower left-[-8rem] top-[-3rem] h-[16rem] w-[16rem]" />
      <div className="ambient-orb ambient-orb-sage float-slow right-[-7rem] top-24 h-[15rem] w-[15rem]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1350px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-4">
            <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-semibold text-white">
              FL
            </div>
            <div>
              <p className="font-display text-[2rem] leading-none text-ink-900">Fliprop</p>
              <p className="mt-1 text-sm text-ink-500">Secure workspace handoff</p>
            </div>
          </Link>

          <Link to="/login" className="ghost-action">
            Back to login
          </Link>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
            <section className="surface-panel-strong relative overflow-hidden p-6 sm:p-8 reveal-up">
              <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-verdigris-100/30 blur-3xl" />

              <div className="relative">
                <span className="eyebrow">Google sign in</span>
                <h1 className="mt-6 max-w-3xl font-display text-[3.6rem] leading-[0.94] text-balance text-ink-900 sm:text-[4.7rem]">
                  Finalizing your secure access to the Fliprop workspace.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                  We are completing your sign in and preparing the dashboard. You should land in
                  the workspace automatically in a moment.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {statusPoints.map((point) => (
                    <div key={point.title} className="section-card p-5">
                      <point.icon className="h-6 w-6 text-verdigris-600" />
                      <h2 className="mt-4 text-lg font-semibold text-ink-900">{point.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-ink-500">{point.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="auth-card flex flex-col items-center justify-center p-8 text-center text-ink-900 reveal-up" style={{ animationDelay: "120ms" }}>
              <div className="brand-mark flex h-16 w-16 items-center justify-center rounded-[22px] text-xl font-semibold text-white">
                FL
              </div>
              <div className="loading-ring mt-8 flex h-20 w-20 animate-spin items-center justify-center rounded-full">
                <ArrowPathIcon className="h-8 w-8 text-verdigris-600" />
              </div>

              <span className="eyebrow mt-8">Please wait</span>
              <h2 className="mt-5 font-display text-[2.8rem] leading-none text-ink-900">
                Finalizing login
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-ink-500">
                If this takes longer than expected, you will be returned to the login screen and
                can try again safely.
              </p>

              <div className="mt-8 w-full rounded-[24px] border border-sand-200 bg-sand-50/80 p-4 text-sm leading-6 text-ink-600">
                We clear the temporary token from the URL before redirecting to your dashboard.
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginContinuePage;
