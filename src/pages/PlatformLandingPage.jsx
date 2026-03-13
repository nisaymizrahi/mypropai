import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

function PlatformLandingPage() {
  return (
    <div className="min-h-screen app-shell-bg">
      <div className="mx-auto flex min-h-screen max-w-[1200px] items-center px-4 py-10 md:px-6 lg:px-8">
        <div className="surface-panel-strong w-full overflow-hidden px-6 py-8 md:px-10 md:py-10">
          <span className="eyebrow">Fresh start</span>
          <h1 className="mt-4 max-w-3xl text-[2.6rem] font-semibold tracking-tight text-ink-900 md:text-[3.4rem]">
            The platform is now a blank canvas.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
            Legacy features are parked in the codebase, but the live experience has been cleared down
            to a simple foundation so we can rebuild deliberately.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/dashboard" className="primary-action">
              Open the workspace
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/login" className="secondary-action">
              Sign in
            </Link>
            <Link to="/signup" className="secondary-action">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformLandingPage;
