import * as fs from "fs/promises";
import * as path from "path";

import {
  RunRecoverySnapshotSchema,
  type RunRecoverySnapshot
} from "@attractor/shared";

import type { RunSnapshotStore } from "../../application/ports";
import { assertSafeStorageId } from "../../storage/path-safety";

/**
 * Persists RunRecoverySnapshots to `.attractor/runs/<runId>/snapshot.json`.
 * Each save overwrites the previous snapshot for the same run.
 */
export class FileRunSnapshotStore implements RunSnapshotStore {
  constructor(private readonly root: string) {}

  private snapshotPath(runId: string): string {
    assertSafeStorageId(runId, "Run id");
    return path.join(this.root, ".attractor", "runs", runId, "snapshot.json");
  }

  async save(snapshot: RunRecoverySnapshot): Promise<void> {
    const validated = RunRecoverySnapshotSchema.parse(snapshot);
    const file = this.snapshotPath(validated.runId);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(validated, null, 2), "utf8");
  }

  async find(runId: string): Promise<RunRecoverySnapshot | undefined> {
    try {
      const raw = await fs.readFile(this.snapshotPath(runId), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return RunRecoverySnapshotSchema.parse(parsed);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw err;
    }
  }
}
