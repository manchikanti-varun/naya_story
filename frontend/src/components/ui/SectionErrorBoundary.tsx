"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional fallback UI when this section fails. Defaults to hidden. */
  fallback?: ReactNode;
  /** Section name for logging. */
  section?: string;
};

type State = {
  hasError: boolean;
};

/**
 * Error boundary for individual homepage/page sections.
 *
 * When a section throws (e.g. bad CMS data, failed fetch), this boundary
 * catches the error and renders a minimal fallback instead of blanking
 * the entire page.
 *
 * Usage:
 *   <SectionErrorBoundary section="bestsellers">
 *     <BestsellersSection ... />
 *   </SectionErrorBoundary>
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, this would report to Sentry/error tracking
    console.error(
      `[SectionErrorBoundary] ${this.props.section ?? "unknown"} crashed:`,
      error.message,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      // Default: render nothing (section disappears gracefully)
      return null;
    }
    return this.props.children;
  }
}
