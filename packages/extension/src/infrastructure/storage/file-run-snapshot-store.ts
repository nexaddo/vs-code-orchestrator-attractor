import * as fs from "fs/promises";
import * as path from "path";

import { RunSnapshotSchema, type RunSnapshot } from "@attractor/shared";

import type { RunSnapshotStore } from "../../application/ports";

/**
 * Persists RunSnapshots to `.attractor/runs/<runId>/snapshot.json`.
 * Each save overwrites the previous snapshot for the same run.
 */
export class FileRunSnapshotStore implements RunSnapshotStore {
  constructor(private readonly root: string) {}

  private snapshotPath(runId: string): string {
    return path.join(this.root, ".attractor", "runs", runId, "snapshot.json");
  }

  async save(snapshot: RunSnapshot): Promise<void> {
    const file = this.snapshotPath(snapshot.runId);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(snapshot, null, 2), "utf8");
  }

  async find(runId: string): Promise<RunSnapshot | undefined> {
    try {
      const raw = await fs.readFile(this.snapshotPath(runId), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return RunSnapshotSchema.parse(parsed);
    } catch {
      return undefined;
    }
  }
}
