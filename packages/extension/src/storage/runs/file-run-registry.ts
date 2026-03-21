import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { RunRecordSchema, type RunRecord } from "@attractor/shared";

import { assertSafeStorageId } from "../path-safety";

export interface RunRegistry {
  save(record: RunRecord): Promise<RunRecord>;
  getById(id: string): Promise<RunRecord | null>;
  list(): Promise<RunRecord[]>;
  listActiveRuns(): Promise<RunRecord[]>;
}

const RUNS_DIRECTORY = path.join("storage", "runs");
const ACTIVE_RUN_STATUSES = new Set<RunRecord["status"]>([
  "queued",
  "running",
  "paused"
]);

const parseRunRecord = (serialized: string, filePath: string): RunRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid run JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return RunRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid run record at ${filePath}`, {
      cause: error
    });
  }
};

export class FileRunRegistry implements RunRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: RunRecord): Promise<RunRecord> {
    const parsedRecord = RunRecordSchema.parse(record);
    assertSafeStorageId(parsedRecord.id, "Run id");

    const filePath = this.getFilePath(parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list() to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<RunRecord | null> {
    assertSafeStorageId(id, "Run id");
    const filePath = this.getFilePath(id);

    try {
      const serialized = await readFile(filePath, "utf8");
      return parseRunRecord(serialized, filePath);
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  async list(): Promise<RunRecord[]> {
    const directoryPath = this.getRunsDirectory();

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const runFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name);

      const runs: RunRecord[] = [];

      for (const fileName of runFiles) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        runs.push(parseRunRecord(serialized, filePath));
      }

      // Sort by the authoritative record id, independent of filename.
      return runs.sort((left, right) => left.id.localeCompare(right.id));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }

  async listActiveRuns(): Promise<RunRecord[]> {
    const all = await this.list();
    return all.filter((r) => ACTIVE_RUN_STATUSES.has(r.status));
  }

  private getRunsDirectory(): string {
    return path.join(this.rootDirectory, RUNS_DIRECTORY);
  }

  private getFilePath(id: string): string {
    return path.join(this.getRunsDirectory(), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
