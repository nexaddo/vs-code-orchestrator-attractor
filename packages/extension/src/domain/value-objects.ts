const RUN_ID_BRAND = Symbol("RunId");
const GRAPH_ID_BRAND = Symbol("GraphId");
const WORKTREE_ID_BRAND = Symbol("WorktreeId");

export type RunId = string & { readonly [RUN_ID_BRAND]: true };
export type GraphId = string & { readonly [GRAPH_ID_BRAND]: true };
export type WorktreeId = string & { readonly [WORKTREE_ID_BRAND]: true };

export function makeRunId(value: string): RunId {
  if (value.trim().length === 0) {
    throw new Error("RunId must not be empty");
  }
  return value as RunId;
}

export function makeGraphId(value: string): GraphId {
  if (value.trim().length === 0) {
    throw new Error("GraphId must not be empty");
  }
  return value as GraphId;
}

export function makeWorktreeId(value: string): WorktreeId {
  if (value.trim().length === 0) {
    throw new Error("WorktreeId must not be empty");
  }
  return value as WorktreeId;
}
