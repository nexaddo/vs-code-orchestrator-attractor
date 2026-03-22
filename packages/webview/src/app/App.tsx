/**
 * Root Preact component for the Attractor dashboard webview.
 *
 * Subscribes to the AppStore and renders the active surface inside a
 * SurfaceFrame.  Loading and error states use the design-system
 * SurfaceState primitives.  Real surface compositions are wired in
 * slices 5-8; until then surfaces show SurfaceLoading placeholders.
 */

import { Component, type JSX } from "preact";

import type { AppState, AppStore, ToastItem } from "./store";
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
        <>
          <SurfaceFrame title={title} testId="app-loading">
            <SurfaceLoading />
          </SurfaceFrame>
          {this.renderToastBar()}
        </>
      );
    }

    if (appState.error) {
      return (
        <>
          <SurfaceFrame title={title} testId="app-error">
            <SurfaceError message={appState.error} />
          </SurfaceFrame>
          {this.renderToastBar()}
        </>
      );
    }

    return (
      <>
        <SurfaceFrame
          title={title}
          testId={`surface-${appState.activeSurface}`}
        >
          {this.renderSurface()}
        </SurfaceFrame>
        {this.renderToastBar()}
      </>
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

  private renderToastBar(): JSX.Element | null {
    const { toasts } = this.state.appState;

    if (toasts.length === 0) {
      return null;
    }

    return (
      <div className="pointer-events-none fixed bottom-3 left-3 right-3 z-50 flex flex-col gap-2">
        {toasts.map((toast) => this.renderToast(toast))}
      </div>
    );
  }

  private renderToast(toast: ToastItem): JSX.Element {
    const severityStyle =
      toast.severity === "warning"
        ? "text-[color:var(--color-status-blocked)]"
        : toast.severity === "error"
          ? "text-[color:var(--color-status-failed)]"
          : "text-[color:var(--color-vscode-foreground,var(--color-foreground))]";

    const iconClass =
      toast.severity === "warning"
        ? "codicon codicon-warning"
        : toast.severity === "error"
          ? "codicon codicon-error"
          : "codicon codicon-info";

    return (
      <div
        key={toast.id}
        className="pointer-events-auto flex items-start gap-2 rounded-[--radius-sm] border border-[color:var(--color-vscode-panel-border,var(--color-border))] bg-[color:var(--color-vscode-editor-background,var(--color-background))] px-3 py-2 text-[length:var(--text-sm)] shadow-sm"
      >
        <span
          className={`${iconClass} mt-0.5 ${severityStyle}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className={`break-words ${severityStyle}`}>{toast.message}</p>
          {toast.actions.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2 text-[length:var(--text-xs)]">
              {toast.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="rounded-[--radius-sm] border border-[color:var(--color-vscode-panel-border,var(--color-border))] px-2 py-0.5 text-[color:var(--color-vscode-description)]"
                >
                  {action}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="codicon codicon-close mt-0.5 text-[color:var(--color-vscode-description)]"
          aria-label="Dismiss notification"
          onClick={() => {
            this.props.store.dispatch({
              type: "toast.dismiss",
              toastId: toast.id
            });
          }}
        />
      </div>
    );
  }
}
