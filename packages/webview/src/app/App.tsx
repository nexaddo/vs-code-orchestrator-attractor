/**
 * Root Preact component for the Attractor dashboard webview.
 *
 * Subscribes to the AppStore and renders the active surface inside a
 * SurfaceFrame.  Loading and error states use the design-system
 * SurfaceState primitives.  Real surface compositions are wired in
 * slices 5-8; until then surfaces show SurfaceLoading placeholders.
 */

import { Component, type JSX } from "preact";

import type { AppState, AppStore } from "./store";
import { SurfaceFrame } from "./SurfaceFrame";
import { SurfaceError, SurfaceLoading } from "./SurfaceState";
import { OverviewSurface } from "../overview/OverviewSurface";
import type { OverviewState } from "../overview/model";

// ---------------------------------------------------------------------------
// Surface title map
// ---------------------------------------------------------------------------

const SURFACE_TITLES: Record<string, string> = {
  overview: "Dashboard",
  repository: "Repository",
  plan: "Plan",
  run: "Run Inspector"
};

// ---------------------------------------------------------------------------
// Surface placeholders (replaced in slices 5-8)
// ---------------------------------------------------------------------------

function OverviewPlaceholder({ payload }: { payload: unknown }): JSX.Element {
  if (payload === undefined || payload === null) {
    return <SurfaceLoading rows={5} />;
  }

  return <OverviewSurface state={payload as OverviewState} />;
}

function RepositoryPlaceholder(): JSX.Element {
  return <SurfaceLoading rows={4} />;
}

function PlanPlaceholder(): JSX.Element {
  return <SurfaceLoading rows={6} />;
}

function RunPlaceholder(): JSX.Element {
  return <SurfaceLoading rows={4} />;
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
    const title = SURFACE_TITLES[appState.activeSurface] ?? "Attractor";

    if (appState.loading) {
      return (
        <SurfaceFrame title={title} testId="app-loading">
          <SurfaceLoading />
        </SurfaceFrame>
      );
    }

    if (appState.error) {
      return (
        <SurfaceFrame title={title} testId="app-error">
          <SurfaceError message={appState.error} />
        </SurfaceFrame>
      );
    }

    return (
      <SurfaceFrame title={title} testId={`surface-${appState.activeSurface}`}>
        {this.renderSurface()}
      </SurfaceFrame>
    );
  }

  private renderSurface(): JSX.Element {
    switch (this.state.appState.activeSurface) {
      case "overview":
        return (
          <OverviewPlaceholder
            payload={this.state.appState.payloads.overview}
          />
        );
      case "repository":
        return <RepositoryPlaceholder />;
      case "plan":
        return <PlanPlaceholder />;
      case "run":
        return <RunPlaceholder />;
    }
  }
}
