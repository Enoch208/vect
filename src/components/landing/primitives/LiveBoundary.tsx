import { Component, type ReactNode } from "react";

type LiveBoundaryProps = { fallback: ReactNode; children: ReactNode };

export class LiveBoundary extends Component<LiveBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
