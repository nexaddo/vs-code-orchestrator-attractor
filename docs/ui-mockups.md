# Attractor v1 UI Mockups

Low-fidelity textual wireframes for the first version of the UI.

## 1. Overview

```text
+--------------------------------------------------------------------------------------------------+
| Attractor                                                                 [Refresh] [Settings]   |
+--------------------------------------------------------------------------------------------------+
| Search repos / runs...                                                                            |
+----------------------+----------------------------------------------------------------------------+
| Repositories         | Overview                                                                   |
|----------------------|----------------------------------------------------------------------------|
| > repo-alpha         | +------------------------------------------------------------------------+ |
| > repo-beta          | | Workspace Summary                                                      | |
| > repo-gamma         | |------------------------------------------------------------------------| |
| | repo-delta         | | Repositories: 12   Active Runs: 3   Paused: 1   Failed: 2            | |
| + Add Repository     | | Last Activity: repo-beta / Plan "Release Prep" / 4m ago             | |
|----------------------| +------------------------------------------------------------------------+ |
| Quick Filters        |                                                                            |
| [All] [Active]       | +----------------------------------+  +--------------------------------+ |
| [Paused] [Failed]    | | Active Runs                      |  | Recent Plans                   | |
|                      | |----------------------------------|  |--------------------------------| |
|                      | | repo-alpha   Build Graph   RUN   |  | repo-beta   Release Prep      | |
|                      | | status: Running   3/8 nodes      |  | last run: Failed              | |
|                      | | [Open Run] [Cancel]              |  | [Open Plan] [Run]             | |
|                      | +----------------------------------+  +--------------------------------+ |
+----------------------+----------------------------------------------------------------------------+
```

## 2. Repository Detail

```text
+--------------------------------------------------------------------------------------------------+
| Attractor / repo-beta                                                     [Refresh] [Open Folder]|
+--------------------------------------------------------------------------------------------------+
| repo-beta                                                                                         |
| Branch: main   Worktree Root: /.attractor/worktrees   Last Sync: 3m ago                           |
| [Create Plan] [Import Graph] [Run Last Plan] [Open Git Status]                                    |
+--------------------------------------------------------------------------------------------------+
| Tabs: [Plans] [Runs] [Artifacts] [History]                                                        |
+--------------------------------------------------------------------------------------------------+
| Left Column (Plans)             | Main Column (Selected Plan Summary)                             |
|---------------------------------|------------------------------------------------------------------|
| + New Plan                      | Plan: Release Prep                                                 |
| > Release Prep                  | Status: Ready   Last Run: Failed                                  |
| > Nightly Verification          | [Run Plan] [Edit Plan] [Duplicate]                                |
| > Docs + Changelog              |                                                                  |
|                                 | Graph Preview                                                     |
|                                 | +--------------------------------------------------------------+ |
|                                 | | start -> verify -> docs -> package -> publish                | |
|                                 | +--------------------------------------------------------------+ |
|---------------------------------|------------------------------------------------------------------|
| Active Runs                     | Recent Timeline                                                   |
| - Release Prep / Running        | 10:42 plan created                                               |
| - Docs + Changelog / Paused     | 10:51 run started                                                |
| [Open Run] [Resume] [Cancel]    | 10:58 node failed: publish                                       |
+--------------------------------------------------------------------------------------------------+
```

## 3. Plan Detail

```text
+--------------------------------------------------------------------------------------------------+
| Attractor / repo-beta / Plan: Release Prep                              [Save] [Duplicate] [More]|
+--------------------------------------------------------------------------------------------------+
| Release Prep                                                                                      |
| Version: v3   Last Run: Failed   Policy: Sequential / Fail-fast                                   |
| [Run Plan] [Validate] [Edit Metadata] [Delete]                                                    |
+--------------------------------------------------------------------------------------------------+
| Left Rail                         | Main Canvas                                                   | Right Rail |
|-----------------------------------|---------------------------------------------------------------|-----------|
| Plan Info                         | Graph                                                         | Milestones|
| - Repo: repo-beta                 | +-----------------------------------------------------------+ |-----------|
| - Nodes: 8                        | | [Graph / Swimlane toggle]                                 | | M1       |
| - Entry Nodes: 1                  | |  (start) --> [verify] --> [docs] --> [package] --> [pub] | | Draft ok |
|                                   | |                    \----------------> [announce]          | | [Open]    |
| Actions                           | +-----------------------------------------------------------+ |-----------|
| [Run Plan]                        | Recent Runs                                                   | M2         |
| [Create Milestone]                | Run #142 Failed  6/8 nodes [Open] [Retry Failed]            | Ready      |
+--------------------------------------------------------------------------------------------------+
```

## 4. Run Detail

```text
+--------------------------------------------------------------------------------------------------+
| Attractor / repo-beta / Run #142                                         [Refresh] [Open Worktree]|
+--------------------------------------------------------------------------------------------------+
| Run #142   Status: Failed   Plan: Release Prep   Started: 10:51   Duration: 17m                  |
| [Resume Run] [Cancel Run] [Retry Failed] [Retry From Node]                                        |
+--------------------------------------------------------------------------------------------------+
| Main Left                                              | Main Right                               |
|--------------------------------------------------------|------------------------------------------|
| Execution Graph                                        | Timeline                                 |
| +----------------------------------------------------+ | +--------------------------------------+ |
| | start -> verify -> docs -> package -> publish X   | | | 10:51 run started                    | |
| |                    \-------------> announce OK     | | | 10:53 verify completed               | |
| +----------------------------------------------------+ | | 11:08 publish failed                 | |
| Node Detail                                            | +--------------------------------------+ |
| Selected Node: publish                                 | Run Actions                              |
| Status: Failed   Attempts: 1/2                         | [Resume] [Cancel] [Retry Failed]        |
| Error: release token missing                           | [Copy Error] [Open Milestone]           |
+--------------------------------------------------------------------------------------------------+
| Logs / Events                                                                                      |
| 11:08:14 node.publish -> command failed                                                           |
| 11:08:16 run.status -> failed                                                                     |
+--------------------------------------------------------------------------------------------------+
```

## 5. Milestone Panel

```text
+---------------------------------------------+
| Milestone Panel                         [X] |
+---------------------------------------------+
| Milestone: Release Ready                    |
| Status: In Progress                         |
| Plan: Release Prep                          |
| Linked Run: #142                            |
|---------------------------------------------|
| Progress                                    |
| [x] verify                                  |
| [x] docs                                    |
| [x] package                                 |
| [ ] publish                                 |
|---------------------------------------------|
| Actions                                     |
| [Open Node]                                 |
| [Resume Run]                                |
| [Retry Failed Step]                         |
+---------------------------------------------+
```

---

## 6. Run Detail — Orchestration Phase Strip (Happy Path)

The `OrchestrationPhaseBar` appears directly below the run header, above the graph/timeline split.
Shows the active milestone's role execution state.

```text
+--------------------------------------------------------------------------------------------------+
| Attractor / repo-beta / Run #143                                        [Refresh] [Open Worktree]|
+--------------------------------------------------------------------------------------------------+
| Run #143   Status: Running   Plan: Release Prep   Started: 11:01   Duration: 6m                 |
| [Cancel Run]                                                                                     |
+--------------------------------------------------------------------------------------------------+
| Orchestration — Milestone 2/5: "Generate changelog"                                             |
| +---------------+   +--------------+   +----------------+   +-------------+                    |
| | Orchestrator  |   |   Planner    |   |  Implementer   |   |   Reviewer  |                    |
| |   DONE  ✓     |-->|   DONE  ✓   |-->|  RUNNING  ...  |-->|   waiting   |                    |
| +---------------+   +--------------+   +----------------+   +-------------+                    |
| Currently: Implementer — "Generating CHANGELOG.md from commit log (step 2 of 3)"               |
+--------------------------------------------------------------------------------------------------+
| Main Left (Execution Graph)                        | Main Right (Timeline)                      |
|----------------------------------------------------|-------------------------------------------|
| start ✓ -> verify ✓ -> [changelog ...] -> ...      | 11:01 run started                          |
|                                                    | 11:02 orchestrator → planner               |
|                                                    | 11:03 planner → implementer                |
|                                                    | 11:07 (streaming...)                       |
+----------------------------------------------------+-------------------------------------------+
| Logs / Events                                                                                    |
| 11:03:44 handoff.created  planner → implementer  "task pack: 3 steps"                           |
| 11:04:01 run.node.started  changelog                                                             |
+--------------------------------------------------------------------------------------------------+
```

## 7. Run Detail — Orchestration Phase Strip (Implementer Failed)

```text
+--------------------------------------------------------------------------------------------------+
| Run #143   Status: Failed   Plan: Release Prep   Started: 11:01   Duration: 9m                  |
| [Retry Implementer] [Retry From Planner] [Retry Milestone] [Cancel Run]                         |
+--------------------------------------------------------------------------------------------------+
| Orchestration — Milestone 2/5: "Generate changelog"                                             |
| +---------------+   +--------------+   +----------------+   +-------------+                    |
| | Orchestrator  |   |   Planner    |   |  Implementer   |   |   Reviewer  |                    |
| |   DONE  ✓     |-->|   DONE  ✓   |-->|  FAILED  ✗     |-->|  skipped    |                    |
| +---------------+   +--------------+   +----------------+   +-------------+                    |
| Error: "git log command failed — repository has no commits"                                      |
| [Retry Implementer] [Retry From Planner] [View Artifacts]                                       |
+--------------------------------------------------------------------------------------------------+
```

## 8. Handoff Events in Timeline Panel

Handoff rows are visually distinct from node/run events (indented, role-colored prefix).

```text
+----------------------------------------------+
| Timeline — Run #143                          |
|----------------------------------------------|
| 11:01  run.started                           |
|   →    ORCH → PLAN  "Starting changelog"     |
|   →    PLAN → IMPL  "Task pack: 3 steps"     |
| 11:07  IMPL → ✗     "git log failed"         |
|----------------------------------------------|
| [Filter: All ▼]  [Full Run / This Milestone] |
+----------------------------------------------+
```

## 9. Plan Inspector — Repository Badge Row

Repo badges appear on every Plan and Run header surface.

```text
+--------------------------------------------------------------------------------------------------+
| Release Prep (v3)   Status: Ready   Last Run: Failed                                            |
| Repos: [WRITABLE repo-beta / main]  [READ-ONLY repo-docs / docs/v2]                             |
| [Run Plan] [Validate] [Edit Metadata] [Duplicate]                                               |
+--------------------------------------------------------------------------------------------------+
```

## 10. Plan Repository Picker (Plan Creation)

```text
+--------------------------------------------------------------------------------------------------+
| New Plan — Step 2 of 3: Repository Setup                             [Back] [Next: Graph]        |
+--------------------------------------------------------------------------------------------------+
| Executable Repository (writable — one per plan in v1)                                           |
| +------------------------------------------------------------------------+                      |
| | ● repo-beta     main     /.attractor/worktrees/repo-beta              |                      |
| | ○ repo-gamma    main     /.attractor/worktrees/repo-gamma             |                      |
| +------------------------------------------------------------------------+                      |
|                                                                                                  |
| Context Repositories (read-only — optional)                                                      |
| +------------------------------------------------------------------------+                      |
| | [x] repo-docs    docs/v2   mount as: docs         [Edit alias]        |                      |
| | [ ] repo-specs   main      mount as: specs         [Add]              |                      |
| +------------------------------------------------------------------------+                      |
| [+ Register Another Repository]                                                                  |
|                                                                                                  |
| ⓘ  v1 allows exactly one writable repository per plan.                                          |
+--------------------------------------------------------------------------------------------------+
```

## 11. Workspace Overview Panel (v1.1)

A new top-level panel tab for managing named virtual workspaces.

```text
+--------------------------------------------------------------------------------------------------+
| Attractor                                                                 [Refresh] [Settings]   |
+--------------------------------------------------------------------------------------------------+
| [Overview]  [Repositories]  [Workspace ▼]                                                        |
+--------------------------------------------------------------------------------------------------+
| Active Workspace: "My Project"  [Edit Name] [New Workspace]                                     |
| 3 repos  ·  1 writable  ·  2 read-only  ·  4 active plans                                       |
+--------------------------------------------------------------------------------------------------+
| +------------------+  +------------------+  +------------------+  +------------------+          |
| | repo-beta        |  | repo-docs        |  | repo-specs       |  | [+ Add Repo]     |          |
| | WRITABLE         |  | READ-ONLY        |  | READ-ONLY        |  |                  |          |
| | Branch: main     |  | Branch: docs/v2  |  | Branch: main     |  |                  |          |
| | 12 runs          |  | Last used: 2h    |  | Last used: 1d    |  |                  |          |
| | [Open] [Plans]   |  | [Open] [Remove]  |  | [Open] [Remove]  |  |                  |          |
| +------------------+  +------------------+  +------------------+  +------------------+          |
+--------------------------------------------------------------------------------------------------+
| Other Workspaces                                                                                 |
| "Docs Site"    repo-docs · repo-specs                                 [Switch] [Open]            |
| "Archive"      repo-gamma                                             [Switch] [Open]            |
+--------------------------------------------------------------------------------------------------+
```

## 12. Left Rail — Workspace-Grouped Repository List (v1.1 prep)

```text
+----------------------+
| My Project    [▼]    |  ← workspace switcher dropdown
|----------------------|
| > repo-beta  WRITE   |
| > repo-docs  READ    |
| > repo-specs READ    |
|----------------------|
| Other Repos          |
| > repo-gamma         |
|                      |
| Quick Filters        |
| [All] [Active]       |
| [Paused] [Failed]    |
+----------------------+
```
