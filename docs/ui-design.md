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
