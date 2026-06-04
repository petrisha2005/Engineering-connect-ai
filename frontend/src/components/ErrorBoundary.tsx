import React from "react";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("React error boundary caught", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
          <section className="max-w-lg rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Something went wrong</p>
            <h1 className="mt-2 text-2xl font-semibold">The page could not render.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{this.state.error.message}</p>
            <button
              className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => {
                this.setState({ error: null });
                window.location.assign("/dashboard");
              }}
            >
              Go to dashboard
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
