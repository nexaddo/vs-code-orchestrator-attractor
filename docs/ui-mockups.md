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
