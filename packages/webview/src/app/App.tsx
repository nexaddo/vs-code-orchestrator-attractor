/**
 * Root Preact component for the Attractor dashboard webview.
 *
 * Subscribes to the AppStore and renders the active surface based on
 * `state.activeSurface`.  In this slice (3), surfaces render placeholder
 * content — real compositions are wired in slices 5-8.
 */

import { Component, type JSX } from "preact";

import type { AppState, AppStore } from "./store";

// ---------------------------------------------------------------------------
// Surface placeholders (replaced in slices 5-8)
// ---------------------------------------------------------------------------

function OverviewPlaceholder(): JSX.Element {
  return <div data-surface="overview">Overview surface loading…</div>;
}

function RepositoryPlaceholder(): JSX.Element {
  return <div data-surface="repository">Repository surface loading…</div>;
}

function PlanPlaceholder(): JSX.Element {
  return <div data-surface="plan">Plan surface loading…</div>;
}

function RunPlaceholder(): JSX.Element {
  return <div data-surface="run">Run surface loading…</div>;
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

export interface AppProps {
  store: AppStore;
}

interface AppComponentState {
  appState: AppState;
}

export class App extends Component<AppProps, AppComponentState> {
  private unsubscribe: (() => void) | null = null;

  constructor(props: AppProps) {
    super(props);
    this.state = { appState: props.store.getState() };
  }

  override componentDidMount(): void {
    this.unsubscribe = this.props.store.subscribe((appState) => {
      this.setState({ appState });
    });
  }

  override componentWillUnmount(): void {
    this.unsubscribe?.();
  }

  override render(): JSX.Element {
    const { appState } = this.state;

    if (appState.loading) {
      return (
        <div class="attractor-app attractor-app--loading" data-loading="true">
          Loading…
        </div>
      );
    }

    if (appState.error) {
      return (
        <div class="attractor-app attractor-app--error" data-error="true">
          {appState.error}
        </div>
      );
    }

    return (
      <div class="attractor-app" data-surface={appState.activeSurface}>
        {this.renderSurface()}
      </div>
    );
  }

  private renderSurface(): JSX.Element {
    switch (this.state.appState.activeSurface) {
      case "overview":
        return <OverviewPlaceholder />;
      case "repository":
        return <RepositoryPlaceholder />;
      case "plan":
        return <PlanPlaceholder />;
      case "run":
        return <RunPlaceholder />;
    }
  }
}
