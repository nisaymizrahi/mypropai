import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

const statusPoints = [
  {
    title: "Verifying account",
    description: "Checking the session and confirming workspace access.",
  },
  {
    title: "Preparing workspace",
    description: "Loading the next screen and restoring the signed-in view.",
  },
  {
    title: "Redirecting",
    description: "Sending you back into the app as soon as the handoff finishes.",
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
        navigate("/leads", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [authenticated, loading, navigate]);

  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Secure handoff" />
          </Link>

          <Link to="/login" className="ghost-action">
            Back to login
          </Link>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <section className="surface-panel p-6 reveal-up">
              <span className="eyebrow">Google sign in</span>
              <h1 className="mt-4 max-w-2xl font-display text-[2.8rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.3rem]">
                Finalizing your workspace access.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">
                The session is being secured and you should be redirected in a moment.
              </p>

              <div className="soft-list mt-6">
                {statusPoints.map((point) => (
                  <div key={point.title} className="py-4 first:pt-0 last:pb-0">
                    <h2 className="text-sm font-medium text-ink-900">{point.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-600">{point.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card flex flex-col items-center justify-center p-6 text-center reveal-up" style={{ animationDelay: "90ms" }}>
              <div className="loading-ring mt-5 flex h-12 w-12 animate-spin items-center justify-center rounded-full">
                <ArrowPathIcon className="h-5 w-5 text-verdigris-600" />
              </div>
              <h2 className="mt-5 font-display text-[2rem] leading-none text-ink-900">
                Please wait
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                The temporary token is cleared before you are redirected back into the app.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginContinuePage;
