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
import { RunSurface } from "../run/RunSurface";
import type { RunState } from "../run/model";
import { PlanSurface } from "../plan/PlanSurface";
import type { PlanState } from "../plan/model";
import { RepositorySurface } from "../repository/RepositorySurface";
import type { RepositoryState } from "../repository/model";

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

function RepositoryPlaceholder({ payload }: { payload: unknown }): JSX.Element {
  if (payload === undefined || payload === null) {
    return <SurfaceLoading rows={4} />;
  }

  return <RepositorySurface state={payload as RepositoryState} />;
}

function PlanPlaceholder({ payload }: { payload: unknown }): JSX.Element {
  if (payload === undefined || payload === null) {
    return <SurfaceLoading rows={6} />;
  }

  return <PlanSurface state={payload as PlanState} />;
}

function RunPlaceholder({ payload }: { payload: unknown }): JSX.Element {
  if (payload === undefined || payload === null) {
    return <SurfaceLoading rows={4} />;
  }

  return <RunSurface state={payload as RunState} />;
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
        return (
          <RepositoryPlaceholder
            payload={this.state.appState.payloads.repository}
          />
        );
      case "plan":
        return <PlanPlaceholder payload={this.state.appState.payloads.plan} />;
      case "run":
        return <RunPlaceholder payload={this.state.appState.payloads.run} />;
    }
  }
}
