import * as fs from "fs/promises";
import * as path from "path";

import { RunRecordSchema, type RunRecord } from "@attractor/shared";

import type { RunRepository } from "../../application/ports";
import { assertSafeStorageId } from "../../storage/path-safety";

/**
 * Persists RunRecords to `.attractor/runs/<runId>/run.json` under the given root.
 */
export class FileRunRepository implements RunRepository {
  constructor(private readonly root: string) {}

  private runDir(runId: string): string {
    assertSafeStorageId(runId, "Run id");
    return path.join(this.root, ".attractor", "runs", runId);
  }

  private runPath(runId: string): string {
    return path.join(this.runDir(runId), "run.json");
  }

  async save(run: RunRecord): Promise<void> {
    const validated = RunRecordSchema.parse(run);
    const dir = this.runDir(validated.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.runPath(validated.id),
      JSON.stringify(validated, null, 2),
      "utf8"
    );
  }

  async find(runId: string): Promise<RunRecord | undefined> {
    try {
      const raw = await fs.readFile(this.runPath(runId), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return RunRecordSchema.parse(parsed);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw err;
    }
  }

  async list(): Promise<RunRecord[]> {
    const runsDir = path.join(this.root, ".attractor", "runs");
    let entries: string[];
    try {
      entries = await fs.readdir(runsDir);
    } catch {
      return [];
    }
    const results: RunRecord[] = [];
    for (const entry of entries) {
      const record = await this.find(entry);
      if (record !== undefined) {
        results.push(record);
      }
    }
    return results;
  }
}
