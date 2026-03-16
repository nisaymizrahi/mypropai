import React from "react";

import BrandLogo from "./BrandLogo";

class AppShellErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App shell error boundary caught an error.", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleWorkspaceReturn = () => {
    window.location.assign("/leads");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="public-shell flex min-h-screen items-center justify-center px-4 py-8 text-ink-900">
          <div className="surface-panel w-full max-w-xl px-7 py-8 text-center">
            <BrandLogo imageClassName="h-12 max-w-[120px]" />
            <span className="eyebrow mt-6 inline-flex">Workspace recovery</span>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[0.96] text-ink-900">
              Something interrupted the workspace
            </h1>
            <p className="mt-4 text-sm leading-7 text-ink-600 sm:text-base">
              The app hit an unexpected problem while loading this screen. Your data is still on the
              server, and you can either reload the app or jump back into the main workspace.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={this.handleReload} className="primary-action">
                Reload app
              </button>
              <button type="button" onClick={this.handleWorkspaceReturn} className="secondary-action">
                Back to workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppShellErrorBoundary;
