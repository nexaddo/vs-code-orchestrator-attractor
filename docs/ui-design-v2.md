# Attractor UI Design v2

This document defines the comprehensive UI design for the Attractor VS Code extension, an AI orchestration dashboard. It builds upon the v1 design intent, incorporating updated data contracts, roadmap refinements, and VS Code integration specifics.

## 1. Design Principles

1.  **Repository-First Context**: Every view must explicitly state which repository it's operating on. The primary executable repository is the anchor for all plans and runs.
2.  **Information Density without Overload**: Surfaces should provide deep diagnostic data (logs, graph state, artifacts) while maintaining a clear hierarchy. Use progressive disclosure for detail.
3.  **Actionability Over Observation**: The UI's primary goal is to answer "Where do I act next?". Every blocked or failed state must be accompanied by a direct corrective action.
4.  **Native VS Code Feel**: Leverage `--vscode-*` CSS variables, native icons (Codicons), and standard layout patterns (Sidebars, WebviewPanels) to minimize cognitive friction for developers.
5.  **Diagnostic Graph Projection**: The DOT graph is a read-only visual aid for understanding the workflow. It is a secondary control surface; lists and timelines are the primary drivers for triage.
6.  **Explicit Permission Boundaries**: Always visually distinguish between the writable "executable" repository and read-only "context" repositories to prevent user confusion.
7.  **Status Consistency**: Use a unified status vocabulary (`queued`, `running`, `blocked`, `failed`, `succeeded`, `canceled`) across all entities (Plans, Milestones, Runs, Nodes).

## 2. VS Code Integration Points

### Activity Bar & Sidebars

- **Container ID**: `attractor-explorer`
- **Views**:
  - **Repositories**: Tree view of registered `RepositoryRecord` entities. Activation: Always.
  - **Plans**: Tree view of `PlanRecord` entities, grouped by repository. Activation: When a repository is selected.
  - **Runs**: Tree view of active and recent `RunRecord` entities. Activation: Always.
  - **Activity**: Flat list of recent `ExtensionEvent` items. Activation: Always.
- **Data Flow**: Extension -> Sidebar (One-way sync). Clicking an item triggers a `vscode.commands.executeCommand` to open the relevant WebviewPanel surface.

### WebviewPanel Registration

- **Type**: `attractor.dashboard`
- **Identity**: Single-instance panel. Opening a new surface (e.g., Run Inspector) updates the content of the existing panel rather than spawning a new one, unless explicitly requested by the user.
- **Persistence**: `retainContextWhenHidden: true` to keep the React state alive during context switching.
- **Data Flow**: Bi-directional via `postMessage`. Extension sends state updates; Webview sends user actions.

### Status Bar Item

- **ID**: `attractor.status`
- **Content**: `$(sync~spin) {activeRunCount} runs` or `$(error) Last run failed`.
- **Command**: Opens the `Overview` surface.
- **Priority**: High (visible even when the extension sidebar is collapsed).

### Notification Toasts

- **Run Completed**: Information toast with "Open Run" button.
- **Run Failed**: Error toast with "Triage" button (opens Run Inspector).
- **Worktree Conflict**: Warning toast when a worktree lease cannot be acquired.

### Command Palette Entries

| Command                   | Title                              | `when` Clause            |
| :------------------------ | :--------------------------------- | :----------------------- |
| `attractor.openOverview`  | Attractor: Open Dashboard Overview | `true`                   |
| `attractor.createPlan`    | Attractor: Create New Plan         | `true`                   |
| `attractor.importGraph`   | Attractor: Import DOT Graph        | `true`                   |
| `attractor.refreshRepos`  | Attractor: Refresh Repositories    | `true`                   |
| `attractor.resumeRun`     | Attractor: Resume Active Run       | `attractor:hasPausedRun` |
| `attractor.cancelAllRuns` | Attractor: Cancel All Active Runs  | `attractor:hasActiveRun` |

## 3. Surface Inventory

### Overview

- **Purpose**: High-level health and activity snapshot for the entire workspace.
- **Trigger**: Extension activation or `attractor.openOverview` command.
- **Layout**: 3-column grid (Summary, Active Runs, Recent Activity).
- **Components**: `WorkspaceSummaryCard`, `RepositoryListPanel`, `ActiveRunsPanel`, `RecentFailuresPanel`.
- **Empty State**: "No repositories found. Add a folder to your workspace to start." + [Add Repository] button.
- **Loading State**: Pulse animation on cards.
- **Error State**: "Failed to load workspace state." + [Retry] button.

### Repository Detail

- **Purpose**: Plan management and activity history for a specific repository.
- **Trigger**: Selecting a repository in the sidebar or clicking a repo name in the Overview.
- **Layout**: Header + Tabbed content (Plans, Runs, Artifacts).
- **Components**: `RepositoryHeader`, `PlanList`, `RunList`, `RepositoryActivityFeed`.
- **Empty State**: "No plans yet for this repository." + [Create Plan] button.
- **Loading State**: Skeleton list items.
- **Error State**: "Repository not found or inaccessible." + [Back to Overview] button.

### Plan Dashboard

- **Purpose**: Deep dive into plan structure, validation, and historical performance.
- **Trigger**: Selecting a plan in the sidebar or clicking a plan title in the Repository Detail.
- **Layout**: Left Panel (Metadata/Milestones), Center (Graph Canvas), Bottom (Run History).
- **Components**: `PlanHeader`, `PlanMetadataPanel`, `GraphCanvas`, `MilestonePanel`, `PlanRunHistory`, `ValidationProblemsPanel`.
- **Empty State**: "Invalid or empty plan graph." (Shows DOT source editor link).
- **Loading State**: Spinner over the graph canvas.
- **Error State**: "Graph validation failed." + [Edit DOT] button.

### Run Inspector

- **Purpose**: Real-time monitoring and triage of a live or completed execution.
- **Trigger**: Starting a new run, clicking a run ID, or clicking a "Triage" notification.
- **Layout**: Top (Run Header), Center Split (Live Graph / Timeline), Right (Node Inspector), Bottom (Logs/Artifacts).
- **Components**: `RunHeader`, `RunGraphPanel`, `TimelinePanel`, `NodeInspector`, `LogsPanel`, `ArtifactsPanel`.
- **Empty State**: N/A (Run records always have at least a `started` event).
- **Loading State**: "Loading run history..." with progress bar.
- **Error State**: "Run data corrupted or unavailable." + [Refresh] button.

## 4. Component Catalogue

### WorkspaceSummaryCard

- **Data shape**:
  ```ts
  interface WorkspaceSummaryStats {
    totalRepos: number;
    activeRuns: number;
    pausedRuns: number;
    failedRuns24h: number;
    lastActivity: {
      repoName: string;
      planTitle: string;
      timestamp: string;
    };
  }
  ```
- **Visual description**: Large, high-contrast metric blocks using `--vscode-notifications-background`. Icons are oversized Codicons. Layout is a horizontal flex row with centered content.
- **Interaction model**: Clicking a metric card sends a `filter.update` message to the webview to narrow down the `ActiveRunsPanel` or `RepositoryListPanel`.
- **Status badges**: Uses `--vscode-charts-red` for failures, `--vscode-charts-blue` for active, and `--vscode-charts-orange` for paused.

### RepositoryListPanel

- **Data shape**: `RepositoryRecord[]`
- **Visual description**: A dense vertical list of repository names. Each row includes a small health dot and a secondary label for the current branch. Uses `--vscode-list-hoverBackground` for row highlighting.
- **Interaction model**: Clicking a row sends `repository.open` with the `repositoryId`. Double-clicking opens the folder in the VS Code explorer.
- **Status badges**: Health dots use `--vscode-testing-iconPassed` (green) if no failed runs in 24h, else `--vscode-testing-iconFailed` (red).

### ActiveRunsPanel

- **Data shape**: `RunRecord[]` (filtered for `status: "running" | "paused" | "queued"`)
- **Visual description**: A collection of compact cards. Each card displays the Run ID, a progress bar (percentage of milestones completed), and a "time elapsed" counter.
- **Interaction model**: [Open Run] button sends `run.open`. [Cancel] button sends `run.cancel`.
- **Status badges**:
  - `running`: `$(sync~spin)` with `--vscode-progressBar-background`
  - `paused`: `$(debug-pause)` with `--vscode-debugIcon-pauseForeground`
  - `queued`: `$(clock)` with `--vscode-descriptionForeground`

### RecentFailuresPanel

- **Data shape**: `RunRecord[]` (filtered for `status: "failed"`)
- **Visual description**: A list focused on triage. Displays the failed Node ID and a truncated error message (first 100 characters). Uses a red left border (`--vscode-inputValidation-errorBorder`) for each entry.
- **Interaction model**: Clicking an entry sends `run.open` and automatically focuses the failed node in the Run Inspector.
- **Status badges**: `failed`: `$(error)` with `--vscode-errorForeground`.

### RepositoryHeader

- **Data shape**: `RepositoryRecord`
- **Visual description**: Prominent title section at the top of Repository Detail. Shows the remote URL as a clickable link and the local path. Uses `--vscode-settings-headerForeground`.
- **Interaction model**: [Create Plan] button opens the plan creation modal. [Open Folder] uses `vscode.openFolder`.
- **Status badges**: None.

### PlanList

- **Data shape**: `PlanRecord[]`
- **Visual description**: Table-like list showing Plan Title, Status, and "Last Run" date. Alternating row backgrounds using `--vscode-list-inactiveSelectionBackground`.
- **Interaction model**: Clicking a plan title opens the Plan Dashboard. [Run] button next to each plan sends `plan.run`.
- **Status badges**: Uses the canonical status vocabulary badges in the "Last Run" column.

### RunList

- **Data shape**: `RunRecord[]`
- **Visual description**: Historical log of executions. Shows Attempt #, Start Time, Duration, and Final Status.
- **Interaction model**: Clicking any row opens the Run Inspector for that specific execution record.
- **Status badges**: Full text badges for `succeeded`, `failed`, and `canceled`.

### RepositoryActivityFeed

- **Data shape**: `ExtensionEvent[]`
- **Visual description**: A vertical timeline of recent events (e.g., "Plan Created", "Run Started"). Each event has a timestamp and a descriptive string. Uses `--vscode-textSeparator-foreground` between items.
- **Interaction model**: Clicking an event that references a Run or Plan navigates to that entity's detail page.
- **Status badges**: None.

### PlanHeader

- **Data shape**: `PlanRecord`
- **Visual description**: Header for the Plan Dashboard. Displays the plan title in bold, the goal text as a sub-header, and a toolbar of actions.
- **Interaction model**: [Run Plan] sends `plan.run`. [Edit DOT] opens the source `.dot` file in the VS Code editor.
- **Status badges**: Status of the plan entity (e.g., `ready`, `draft`).

### PlanMetadataPanel

- **Data shape**: `PlanRecord` + `RepositoryRecord[]` (refs)
- **Visual description**: Side panel showing configuration details. Lists the Primary (Writable) Repository and any Context (Read-Only) Repositories.
- **Interaction model**: Clicking a repository name opens its Repository Detail page.
- **Status badges**: `read-only` context repos are badged with `$(lock)` and `--vscode-badge-background`.

### GraphCanvas

- **Data shape**: `{ source: string, activeNodes: string[], statusMap: Record<string, Status> }`
- **Visual description**: SVG rendered view of the DOT graph. Nodes are styled with VS Code theme colors. Active/Current nodes have a glowing border (`--vscode-focusBorder`).
- **Interaction model**: Clicking a node sends `graph.focus` to highlight matching logs and milestone details.
- **Status badges**: Node shapes are colored based on their execution status (e.g., green for `succeeded`, red for `failed`).

### MilestonePanel

- **Data shape**: `MilestoneRecord[]` + `MilestoneRunRecord[]`
- **Visual description**: Vertical accordion. Each milestone header shows progress (e.g., "2/3 Nodes"). Expanding reveals individual node IDs and their specific status.
- **Interaction model**: Clicking a node ID inside the milestone focuses that node in the graph and logs.
- **Status badges**: Milestone status (e.g., `completed`, `running`, `blocked`) shown in the header.

### PlanRunHistory

- **Data shape**: `RunRecord[]` (limited to this plan)
- **Visual description**: Compact version of the `RunList` displayed at the bottom of the Plan Dashboard.
- **Interaction model**: Clicking a run navigates to the Run Inspector.
- **Status badges**: Status column with color-coded badges.

### ValidationProblemsPanel

- **Data shape**: `ExtensionEvent[]` (filtered for `kind: "validation.failed"`)
- **Visual description**: Only visible when the graph is invalid. Lists syntax errors, missing node definitions, or cycles. Uses `--vscode-list-errorForeground`.
- **Interaction model**: Clicking an error with a line number opens the DOT file and moves the cursor to that line.
- **Status badges**: `$(error)` for each line.

### RunHeader

- **Data shape**: `RunRecord` + `PlanRecord`
- **Visual description**: Hero section of the Run Inspector. Displays the Run ID in large type, the parent Plan title, and a prominent status badge.
- **Interaction model**: Action buttons: [Resume], [Cancel], [Retry Failed]. All send corresponding `run.*` inbound messages.
- **Status badges**: Large status badge using `--vscode-badge-foreground` and colored background based on state.

### RunGraphPanel

- **Data shape**: `GraphCanvas` props + live execution data
- **Visual description**: The graph canvas but with live updates. Nodes pulse when `running`. Paths are colored once traversed.
- **Interaction model**: Same as `GraphCanvas`.
- **Status badges**: Inline status icons next to node labels (e.g., `$(check)` for `succeeded`).

### TimelinePanel

- **Data shape**: `ExtensionEvent[]`
- **Visual description**: Chronological list of execution milestones (e.g., "Milestone 1 Started", "Node 'codergen' Completed"). Uses `--vscode-tree-indentGuidesStroke`.
- **Interaction model**: Clicking a timeline entry scrolls the `LogsPanel` to the exact timestamp of that event.
- **Status badges**: `$(circle-filled)` for completed steps, `$(circle-outline)` for pending.

### NodeInspector

- **Data shape**: `HandoffEnvelope` + `ArtifactRecord[]` (for selected node)
- **Visual description**: Detailed side panel for the selected node. Shows inputs, generated task-packs, and handoff reasons.
- **Interaction model**: [Open Artifact] button uses `vscode.open` on the artifact's URI.
- **Status badges**: Shows node-specific status (e.g., `failed` with error details).

### LogsPanel

- **Data shape**: `string[]` (streamed)
- **Visual description**: Terminal-like output window with syntax highlighting for model logs and shell output. Uses `--vscode-terminal-background`.
- **Interaction model**: Search bar for filtering text. [Copy All] button.
- **Status badges**: None.

### ArtifactsPanel

- **Data shape**: `ArtifactRecord[]`
- **Visual description**: A grid or list of files produced during the run. Icons are determined by file extension using VS Code's theme icons.
- **Interaction model**: Clicking an artifact opens it in a new editor tab.
- **Status badges**: None.

## 5. Data Contracts → UI Mapping

### RepositoryRecord

- **Consuming Components**: `RepositoryListPanel`, `RepositoryHeader`, `PlanMetadataPanel`.
- **Field Mapping**:
  - `name` → Title text in Header and List.
  - `rootUri` → Path label in Header; used for `vscode.openFolder`.
  - `remoteUrl` → Link in Header.
  - `labels` → Filter tags in `RepositoryListPanel`.
- **Message**: Carried in `overview.state` and `repository.state`.

### PlanRecord

- **Consuming Components**: `PlanList`, `PlanHeader`, `PlanMetadataPanel`, `RunHeader`.
- **Field Mapping**:
  - `title` → Header text and list labels.
  - `goal` → Sub-header description in Plan Dashboard.
  - `status` → Status badge in `PlanList`.
  - `graphSource` → Source for `GraphCanvas` (after validation).
- **Message**: Carried in `repository.state` and `plan.state`.

### RunRecord

- **Consuming Components**: `ActiveRunsPanel`, `RecentFailuresPanel`, `RunList`, `RunHeader`, `PlanRunHistory`.
- **Field Mapping**:
  - `status` → Badge color and icon (Red for `failed`, spinning for `running`).
  - `attempt` → Label in `RunHeader` (e.g., "Attempt #2").
  - `startedAt` / `endedAt` → Duration calculation in `RunHeader` and `RunList`.
  - `currentMilestoneId` → Selection highlight in `MilestonePanel`.
- **Message**: Carried in `overview.state`, `repository.state`, and `run.state`.

### MilestoneRecord

- **Consuming Components**: `MilestonePanel`, `RunGraphPanel`.
- **Field Mapping**:
  - `title` → Accordion header text.
  - `status` → Progress indicator in header.
  - `nodeIds` → List of items inside the accordion.
- **Message**: Carried in `plan.state` and `run.state`.

### MilestoneRunRecord

- **Consuming Components**: `MilestonePanel`.
- **Field Mapping**:
  - `status` → Per-node status icon in the expanded milestone view.
  - `startedAt` → Latency indicator per node.
- **Message**: Carried in `run.state`.

### ArtifactRecord

- **Consuming Components**: `ArtifactsPanel`, `NodeInspector`.
- **Field Mapping**:
  - `title` → File name label.
  - `type` → Icon selection (e.g., `task-pack` uses `$(package)`).
  - `uri` → Target for `vscode.open`.
- **Message**: Carried in `run.state`.

### HandoffEnvelope

- **Consuming Components**: `NodeInspector`.
- **Field Mapping**:
  - `task` → Instructions text in Inspector.
  - `reason` → "Why" label in Inspector.
  - `fromRole` / `toRole` → Role transition label (e.g., "Planner → Implementer").
- **Message**: Carried in `run.state`.

### ExtensionEvent

- **Consuming Components**: `RepositoryActivityFeed`, `TimelinePanel`, `RecentFailuresPanel`, `LogsPanel`, `ValidationProblemsPanel`.
- **Field Mapping**:
  - `kind` → Event categorization (e.g., "checkpoint.saved" → Timeline icon).
  - `payload.message` → Log line text or failure description.
  - `timestamp` → Chronological ordering and label.
- **Message**: Carried in `timeline.update`.

## 6. Message Flow

### Outbound Messages (Extension -> Webview)

#### `overview.state`

- **Trigger**: App initialization or a repository being added/removed from the workspace.
- **Payload Shape**:
  ```ts
  interface OverviewState {
    repositories: RepositoryRecord[];
    activeRuns: RunRecord[];
    recentFailures: RunRecord[];
    stats: WorkspaceSummaryStats;
  }
  ```
- **Surface**: `Overview`.
- **Update**: Re-renders all summary cards and lists.
- **Latency**: Immediate.

#### `repository.state`

- **Trigger**: User selects a repository in the sidebar.
- **Payload Shape**:
  ```ts
  interface RepositoryState {
    repository: RepositoryRecord;
    plans: PlanRecord[];
    runs: RunRecord[];
    activity: ExtensionEvent[];
  }
  ```
- **Surface**: `Repository Detail`.
- **Update**: populates Plan and Run tabs; updates Header.
- **Latency**: Immediate.

#### `plan.state`

- **Trigger**: User selects a plan.
- **Payload Shape**:
  ```ts
  interface PlanState {
    plan: PlanRecord;
    milestones: MilestoneRecord[];
    history: RunRecord[];
    validationEvents: ExtensionEvent[];
  }
  ```
- **Surface**: `Plan Dashboard`.
- **Update**: Renders graph; populates milestones and run history.
- **Latency**: Re-calculating graph layout may take 100-300ms.

#### `run.state`

- **Trigger**: A run is started, resumed, or selected.
- **Payload Shape**:
  ```ts
  interface RunState {
    run: RunRecord;
    plan: PlanRecord;
    milestoneRuns: MilestoneRunRecord[];
    artifacts: ArtifactRecord[];
    currentHandoff?: HandoffEnvelope;
  }
  ```
- **Surface**: `Run Inspector`.
- **Update**: Sets header state; updates current node highlight.
- **Latency**: Immediate.

#### `timeline.update`

- **Trigger**: Runtime emits a new `ExtensionEvent`.
- **Payload Shape**: `ExtensionEvent`.
- **Surface**: `Run Inspector`, `Overview`.
- **Update**: Appends one row to `TimelinePanel` or `LogsPanel`.
- **Latency**: Streaming (real-time).

#### `graph.update`

- **Trigger**: A node status changes in the runtime.
- **Payload Shape**: `{ nodeId: string, status: Status }`.
- **Surface**: `Plan Dashboard`, `Run Inspector`.
- **Update**: Changes color of a single SVG element in the graph.
- **Latency**: Immediate.

#### `toast`

- **Trigger**: Error or long-running task completion.
- **Payload Shape**: `{ message: string, severity: "info" | "warning" | "error", actions: string[] }`.
- **Surface**: All (renders as a VS Code notification or internal overlay).
- **Update**: Shows transient UI element.
- **Latency**: Immediate.

### Inbound Messages (Webview -> Extension)

#### `repository.open`

- **Sender**: `RepositoryListPanel`.
- **Payload**: `{ repositoryId: string }`.
- **Extension Action**: Fetches repo details and plans; sends `repository.state`.

#### `plan.create`

- **Sender**: `RepositoryHeader`.
- **Payload**: `{ repositoryId: string, title: string, goal: string }`.
- **Extension Action**: Creates `PlanRecord` in storage; sends `repository.state` to update list.

#### `plan.run`

- **Sender**: `PlanHeader` or `PlanList`.
- **Payload**: `{ planId: string }`.
- **Extension Action**: Initializes worktree; creates `RunRecord`; starts orchestrator; sends `run.state`.

#### `run.resume`

- **Sender**: `RunHeader`.
- **Payload**: `{ runId: string }`.
- **Extension Action**: Restores checkpoint; signals runtime to resume; sends `run.state`.

#### `run.cancel`

- **Sender**: `RunHeader` or `ActiveRunsPanel`.
- **Payload**: `{ runId: string }`.
- **Extension Action**: Signals runtime to abort; releases worktree; sends `run.state` (updated to `canceled`).

#### `run.retry`

- **Sender**: `RunHeader` or `RecentFailuresPanel`.
- **Payload**: `{ runId: string, mode: "failed" | "fromNode", nodeId?: string }`.
- **Extension Action**: Creates new Run attempt; resumes from specified point; sends `run.state`.

#### `milestone.open`

- **Sender**: `MilestonePanel` or `NodeInspector`.
- **Payload**: `{ milestoneId: string }`.
- **Extension Action**: Opens the milestone definition or associated artifacts in VS Code.

#### `graph.focus`

- **Sender**: `GraphCanvas`.
- **Payload**: `{ nodeId: string }`.
- **Extension Action**: Synchronously updates webview focus state; may fetch additional logs for that node.

## 7. Status Vocabulary

| Status      | Entity Application         | Color (Theme Token)                 | Icon (Codicon)    |
| :---------- | :------------------------- | :---------------------------------- | :---------------- |
| `queued`    | Plan, Run, Node            | `--vscode-descriptionForeground`    | `$(clock)`        |
| `running`   | Plan, Run, Milestone, Node | `--vscode-progressBar-background`   | `$(sync~spin)`    |
| `blocked`   | Milestone, Node            | `--vscode-editorWarning-foreground` | `$(lock)`         |
| `failed`    | Plan, Run, Milestone, Node | `--vscode-errorForeground`          | `$(error)`        |
| `succeeded` | Plan, Run, Milestone, Node | `--vscode-testing-iconPassed`       | `$(check)`        |
| `canceled`  | Plan, Run                  | `--vscode-disabledForeground`       | `$(circle-slash)` |

### Badge Rules

- **Count Badge**: Used in `WorkspaceSummaryCard` and `MilestonePanel` summary (e.g., "6/8 Nodes Succeeded").
- **Dot Badge**: Used in `RepositoryListPanel` for quick health status.
- **Full Text Badge**: Used in `RunHeader` and `PlanList` for unambiguous state communication.

## 8. Action Model

| Surface    | Action         | Inbound Type     | Payload                     | Condition              |
| :--------- | :------------- | :--------------- | :-------------------------- | :--------------------- |
| Repository | Create Plan    | `plan.create`    | `{ repoId }`                | Always                 |
| Plan       | Run Plan       | `plan.run`       | `{ planId }`                | `status == 'ready'`    |
| Run        | Resume         | `run.resume`     | `{ runId }`                 | `status == 'paused'`   |
| Run        | Cancel         | `run.cancel`     | `{ runId }`                 | `status == 'running'`  |
| Run        | Retry Failed   | `run.retry`      | `{ runId, mode: 'failed' }` | `status == 'failed'`   |
| Node       | View Artifacts | `milestone.open` | `{ nodeId, runId }`         | `hasArtifacts == true` |

## 9. Empty, Loading, and Error States

### Surfaces

#### Overview

- **Empty**:
  - Icon: `$(folder-opened)`
  - Heading: "No Repositories Found"
  - Subtext: "Attractor needs at least one folder in your VS Code workspace to manage plans."
  - CTA: "Add Folder to Workspace"
- **Loading**:
  - Icon: `$(loading~spin)`
  - Message: "Discovering repositories and scanning for plans..."
- **Error**:
  - Icon: `$(warning)`
  - Heading: "Workspace Scan Failed"
  - Subtext: "The extension could not access the local filesystem to load repository records."
  - CTA: "Retry Workspace Scan"

#### Repository Detail

- **Empty**:
  - Icon: `$(notebook)`
  - Heading: "No Plans Created"
  - Subtext: "Define your first orchestration workflow to start automating coding tasks."
  - CTA: "Create New Plan"
- **Loading**:
  - Icon: `$(loading~spin)`
  - Message: "Loading repository history and plans..."
- **Error**:
  - Icon: `$(error)`
  - Heading: "Repository Offline"
  - Subtext: "The repository at this path is no longer available or has been moved."
  - CTA: "Back to Overview"

#### Plan Dashboard

- **Empty**:
  - Icon: `$(graph)`
  - Heading: "Empty Graph Definition"
  - Subtext: "This plan has no nodes. Define your workflow in the DOT source file."
  - CTA: "Open DOT Editor"
- **Loading**:
  - Icon: `$(loading~spin)`
  - Message: "Validating plan logic and projecting graph..."
- **Error**:
  - Icon: `$(beaker)`
  - Heading: "Invalid Graph Logic"
  - Subtext: "The DOT graph contains cycles or uses unsupported node types."
  - CTA: "View Validation Errors"

#### Run Inspector

- **Empty**:
  - Icon: `$(history)`
  - Heading: "No Execution Data"
  - Subtext: "This run record exists but contains no events. It may have been initialized but never started."
  - CTA: "Run Plan"
- **Loading**:
  - Icon: `$(loading~spin)`
  - Message: "Synchronizing run logs and artifacts..."
- **Error**:
  - Icon: `$(database)`
  - Heading: "Run Data Inaccessible"
  - Subtext: "Execution records for this run ID could not be loaded from storage."
  - CTA: "Refresh Dashboard"

### Components

#### WorkspaceSummaryCard

- **Empty**: Metrics show "0". Subtext: "Workspace is empty."
- **Loading**: Shimmer effect on numeric values.
- **Error**: Metrics show "??". Subtext: "Sync error."

#### RepositoryListPanel

- **Empty**: "No repositories linked."
- **Loading**: 5 skeleton list rows.
- **Error**: "Failed to load list."

#### ActiveRunsPanel

- **Empty**: "No active runs. Start a plan to see progress here."
- **Loading**: Shimmering progress bars.
- **Error**: "Execution status unavailable."

#### RecentFailuresPanel

- **Empty**: "No failures in the last 24 hours."
- **Loading**: Pulse animation on list.
- **Error**: "Could not fetch failure logs."

#### PlanList

- **Empty**: "No plans found."
- **Loading**: Loading spinner in the table body.
- **Error**: "Plan sync failed."

#### RunList

- **Empty**: "No previous runs found."
- **Loading**: Skeleton rows.
- **Error**: "History unavailable."

#### PlanRunHistory

- **Empty**: "This plan hasn't been run yet."
- **Loading**: Spinner icon.
- **Error**: "Failed to load history."

#### GraphCanvas

- **Empty**: Canvas shows a grayed-out placeholder node.
- **Loading**: Overlay with "Rendering Graph...".
- **Error**: "Syntax error in DOT source."

#### MilestonePanel

- **Empty**: "No milestones defined in this plan."
- **Loading**: Accordion headers in disabled state.
- **Error**: "Inconsistent milestone data."

#### ValidationProblemsPanel

- **Empty**: "No validation issues. Plan is ready to run."
- **Loading**: "Validating..."
- **Error**: "Validation engine crashed."

#### RunGraphPanel

- **Empty**: "Graph unavailable."
- **Loading**: "Connecting to runtime..."
- **Error**: "Real-time updates disconnected."

#### TimelinePanel

- **Empty**: "Run initialized."
- **Loading**: "Streaming events..."
- **Error**: "Timeline sync broken."

#### NodeInspector

- **Empty**: "Select a node to see details."
- **Loading**: "Reading node artifacts..."
- **Error**: "Node data missing."

#### LogsPanel

- **Empty**: "Waiting for output..."
- **Loading**: "Fetching logs..."
- **Error**: "Log stream interrupted."

#### ArtifactsPanel

- **Empty**: "No files generated."
- **Loading**: Shimmer grid.
- **Error**: "Filesystem access denied."

## 10. Accessibility and Theme

### Focus Management

- Users can navigate between panels using `Tab` and `Shift+Tab`.
- Pressing `Enter` on a node in the graph focuses its entry in the `TimelinePanel`.
- Focus is automatically trapped within active modals/dialogs.

### ARIA Roles

- Main surfaces: `role="main"`
- Sidebars/Navigation: `role="navigation"`
- Status badges: `role="status"`
- Progress bars: `role="progressbar"`

### Theme Application

The webview consumes a shared CSS bridge:

```css
:root {
  --background: var(--vscode-editor-background);
  --foreground: var(--vscode-editor-foreground);
  --button-bg: var(--vscode-button-background);
  --border: var(--vscode-panel-border);
}
```

All components must use these variables. High-contrast mode is supported by inheriting `--vscode-highContrastBorder` and related tokens.

## 11. v1 Scope Cuts and Deferred Work

### Explicit v1 Cuts

- **No Visual DOT Editing**: Graph is read-only. Editing happens in the `.attractor/*.dot` files.
- **Single Writable Repo**: Plans only support one writable repository lease at a time.
- **No Parallelism**: Nodes execute sequentially (or conditionally). `parallel` and `fan_in` are deferred.
- **No Manager Loops**: Recursive or nested orchestration is deferred.

### Deferred to v1.1

- **Cross-Run Comparison**: Comparing metrics or node outputs between two different runs.
- **Custom Layout Tools**: Manual dragging/pinning of graph nodes.
- **Advanced Telemetry**: Token usage charts, model latency heatmaps.

## 12. Open Questions

1.  **Graph Scaling**: How do we handle graphs with 50+ nodes in a read-only projection without visual clutter?
2.  **Worktree Visibility**: Should the user be able to manually browse the transient worktree from the UI, or only via the "Open Artifact" command?
3.  **Handoff UI**: Is the `HandoffEnvelope` sufficiently rendered in the `NodeInspector`, or does it need its own dedicated surface for "Human Wait" states?
