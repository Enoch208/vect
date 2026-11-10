import { Component, type ReactNode } from "react";
import { StatusBadge } from "../components/studio/StatusBadge.js";

export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="studio-frame flex min-h-dvh items-center justify-center p-[26px]">
        <div role="alert" className="max-w-md space-y-5 border border-rule p-[26px]">
          <StatusBadge status="ERROR" />
          <h1 className="font-display text-[26.7px] leading-none font-semibold uppercase">
            This screen could not be displayed
          </h1>
          <p>Reload Vect to try again. If the problem continues, return to the studio entry.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="studio-button studio-button-primary"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload Vect
            </button>
            <a href="/studio" className="studio-button">
              Studio entry
            </a>
          </div>
        </div>
      </main>
    );
  }
}
