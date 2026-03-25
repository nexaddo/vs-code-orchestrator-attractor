# UI Design

## Product Direction

The v1 UI is repository-first. Users should be able to answer three questions quickly:

1. What is running?
2. What is blocked or failed?
3. Where do I act next?

The dashboard should feel native to VS Code, but still deliberate and information-dense. The graph is important, but it is not the only control surface; lists, timelines, and action bars must remain strong enough for triage without depending on the graph.

## Information Architecture

### Activity Bar Container

- `Repositories`
- `Plans`
- `Runs`
- `Activity`

### Rich Webview Surfaces

- `Overview`
- `Repository Detail`
- `Plan Dashboard`
- `Run Inspector`

## Primary View Model

### Overview

- repo fleet health
- active runs
- paused runs
- recent failures
- quick actions

### Repository Detail

- repo summary
- plan list
- active and recent runs
- activity stream
- create/import plan actions

### Plan Dashboard

- plan metadata
- DOT graph projection
- milestones
- recent runs
- validation and execution actions

### Run Inspector

- run summary
- current node or milestone
- graph state
- timeline
- logs, events, and artifacts

## UI Rules

- show the executable repo prominently on every plan and run surface
- always badge context repos as read-only
- keep actions explicit: `Run`, `Resume`, `Cancel`, `Retry`
- use a single status vocabulary across plans, milestones, nodes, and runs where possible
- treat DOT as canonical text; the rendered graph is a read-only projection in v1

## Component Hierarchy

### Overview Page

- `WorkspaceSummaryCard`
- `RepositoryListPanel`
- `ActiveRunsPanel`
- `RecentFailuresPanel`

### Repository Detail

- `RepositoryHeader`
- `PlanList`
- `RunList`
- `RepositoryActivityFeed`

### Plan Dashboard

- `PlanHeader`
- `PlanMetadataPanel`
- `GraphCanvas`
- `MilestonePanel`
- `PlanRunHistory`
- `ValidationProblemsPanel`

### Run Inspector

- `RunHeader`
- `RunGraphPanel`
- `TimelinePanel`
- `NodeInspector`
- `LogsPanel`
- `ArtifactsPanel`

## Graph Presentation

- source text remains editable in the repo
- dashboard renders a read-only graph from the validated semantic plan
- selecting a node in the graph focuses the matching milestone or log record
- selecting a node in a list highlights it in the graph

## Action Model

### Repository Actions

- `Create Plan`
- `Import Graph`
- `Run Last Plan`
- `Open Folder`

### Plan Actions

- `Run Plan`
- `Validate`
- `Edit Metadata`
- `Duplicate`

### Run Actions

- `Resume Run`
- `Cancel Run`
- `Retry Failed`
- `Retry From Node`

### Milestone Actions

- `Open Node`
- `Open Artifacts`
- `Retry Failed Step`

## States

### Empty States

- no repositories configured
- repository exists but no plans yet
- plan exists but no runs yet
- invalid graph with no runnable nodes

### Loading States

- repo refresh in progress
- graph projection rebuilding
- streamed run updates still arriving

### Error States

- invalid DOT
- worktree setup failed
- model request failed
- checkpoint restore failed
- storage corruption or migration failure

Each error state should include the next best action, not just the failure.

## v1 Scope Cuts

- no visual DOT editing
- no custom graph layout tools
- no cross-run graph comparison
- no advanced telemetry dashboards
- no simultaneous writable multi-repo execution views

---

## Orchestration Workflow UI

### Design Goals

The user needs to answer three questions during an active run:

1. Which agent role is working right now, and what is it doing?
2. Where in the milestone sequence are we, and has anything failed?
3. What can I do to recover from an error or unblock a paused run?

### Orchestration Phase Model

Each milestone execution follows a fixed role sequence:

```
Orchestrator → Planner → Implementer → Reviewer → Orchestrator (next milestone)
```

Each role transition is captured as a `HandoffEnvelope` event. The UI renders these transitions as a phase strip inside the Run Inspector.

### Orchestration Phase Strip

Placed immediately below the Run header and above the graph/timeline split. Shows one row per active milestone:

- Four role boxes: `Orchestrator`, `Planner`, `Implementer`, `Reviewer`
- Each box shows: `done`, `running`, `waiting`, or `failed`
- Running box shows the active task summary from the handoff reason field
- Failed box shows the error label and surfaces recovery actions inline

### Recovery Actions (Role-Level)

When a role fails, the strip exposes targeted actions:

- `Retry Implementer` — re-enter from the implementer step with the same planner output
- `Retry From Planner` — discard the task pack and replan from the same milestone
- `Retry Milestone` — start the full milestone again from orchestrator
- `View Artifacts` — inspect handoff artifacts that were produced before failure

### Handoff Events in Timeline

Handoff transitions render as distinct event rows in the timeline, visually separated from node/run events:

```
ORCHESTRATOR → PLANNER     "Starting milestone: Generate changelog"
PLANNER → IMPLEMENTER      "Task pack ready: 3 steps identified"
IMPLEMENTER → REVIEWER     "2 files modified, tests passing"
REVIEWER → ORCHESTRATOR    "Approved with 1 note"
```

Role names are styled distinctly from node/run event names so users can scan for role transitions quickly.

### Agent Action Feed

A dedicated tab within the Run Inspector timeline panel. Shows a chronological log of what each role is actively doing — streamed artifact summaries, token counts (if available), and intermediate decisions. Scoped to the current milestone by default; switchable to full-run view.

### Orchestration Error States

| Scenario                                | Indicator                                                     | Recovery                               |
| --------------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Implementer returns compile error       | Phase strip: Implementer = `failed`                           | Retry Implementer / Retry From Planner |
| Reviewer rejects with blocking feedback | Phase strip: Reviewer = `failed`, reason shown                | Retry From Planner                     |
| Planner produces empty task pack        | Phase strip: Planner = `failed`                               | Retry Milestone                        |
| Model request timeout                   | Toast + phase strip paused                                    | Resume Run                             |
| Human wait node reached                 | Run status = `paused`, `wait.human` node highlighted in graph | Resume button in header                |

### Component Inventory (New)

| Component               | Location                                  | Description                                          |
| ----------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `OrchestrationPhaseBar` | Run Inspector, below header               | Role phase strip for the active milestone            |
| `AgentRoleStatus`       | Inside `OrchestrationPhaseBar`            | Single role badge: label + status dot + task summary |
| `HandoffEventRow`       | Timeline panel                            | Styled role-transition event row                     |
| `RetryFromRoleActions`  | Inside `OrchestrationPhaseBar` on failure | Role-targeted recovery action buttons                |
| `AgentActionFeed`       | Run Inspector, timeline tab               | Streaming artifact and decision log per role         |

---

## Multi-Repo Workspace UI

### Design Goals

Users need to:

1. Configure a plan with one executable (writable) repo and any number of read-only context repos.
2. Browse and navigate repositories without losing track of which are writable vs. read-only in the context of a given plan.
3. (v1.1) Switch between named virtual workspaces that group multiple repos under one logical project.

### Repository Role Model (v1)

Each plan has exactly one `executable` repository (read/write) and zero or more `context` repositories (read-only). The `PlanRepositoryRef` schema encodes this as `role: "executable" | "context"` and `access: "read_write" | "read_only"`.

### Repo Badges

Every Plan and Run surface shows a compact badge row listing repositories with visual role indicators:

- `[WRITABLE] repo-name / branch` — executable repo, highlighted
- `[READ-ONLY] repo-name / branch` — context repos, muted

Clicking a badge opens the repository detail view.

### Plan Repository Picker

A two-section form shown during plan creation and in plan settings:

1. **Executable Repository** — single-select from registered repos; shows branch and worktree path; only one allowed.
2. **Context Repositories** — multi-select checklist; each entry shows branch and mount alias; can add/remove after creation.

A persistent note reminds users of the v1 one-writable-repo limit.

### Left Rail Repository Grouping (v1.1 prep)

In v1, the left rail shows a flat repository list. To prepare for v1.1 workspaces, the list will include:

- A header row naming the "active workspace" (defaults to the VS Code workspace folder name).
- Repos in the active workspace shown at top.
- An "Other Repositories" collapsed section for repos not in the current workspace.

### Workspace Panel (v1.1)

A new top-level panel tab (`Workspace`) for managing named virtual workspaces:

- Active workspace summary card: name, repo count, role breakdown.
- Repository grid: one card per repo showing name, role, branch, last-used timestamp, plan count.
- Workspace switcher: dropdown in panel header to switch active workspace.
- Create/edit/delete workspace actions.

### Workspace Switcher

A dropdown in the left rail header (or activity bar tooltip) that shows:

- Current workspace name
- List of saved workspaces with repo count
- `New Workspace` action

Switching a workspace updates the left rail repo list and the Overview panel scope.

### Multi-Repo Error States

| Scenario                             | Indicator                                     | Recovery                                  |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------- |
| Executable repo missing from disk    | Plan/Run header badge: `WRITABLE — not found` | Reconfigure plan or re-register repo      |
| Context repo unavailable             | Badge: `READ-ONLY — unavailable`              | Warning only; run can continue            |
| Two plans both claim writable access | Validation error on plan creation             | Force user to pick one executable repo    |
| Worktree lease conflict              | Toast on run start                            | Retry after releasing the conflicting run |

### Component Inventory (New)

| Component              | Location                              | Description                                  |
| ---------------------- | ------------------------------------- | -------------------------------------------- |
| `RepoBadgeRow`         | Plan Inspector, Run Inspector headers | Compact writable/read-only repo badge row    |
| `PlanRepositoryPicker` | Plan creation, plan settings          | Executable + context repo configuration form |
| `WorkspacePanel`       | New top-level panel tab               | Workspace overview and repo grid (v1.1)      |
| `WorkspaceSwitcher`    | Left rail header                      | Dropdown to switch active workspace (v1.1)   |
| `RepoRoleCard`         | Inside `WorkspacePanel`               | Per-repo card: name, role, branch, stats     |
