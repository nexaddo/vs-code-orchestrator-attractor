import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MilestoneRunRecordSchema,
  type MilestoneRunRecord
} from "@attractor/shared";

import { assertSafeStorageId } from "../path-safety";

export interface MilestoneRunRegistry {
  save(record: MilestoneRunRecord): Promise<MilestoneRunRecord>;
  getById(id: string): Promise<MilestoneRunRecord | null>;
  listByRunId(runId: string): Promise<MilestoneRunRecord[]>;
  listByMilestoneId(
    runId: string,
    milestoneId: string
  ): Promise<MilestoneRunRecord[]>;
}

const parseMilestoneRunRecord = (
  serialized: string,
  filePath: string
): MilestoneRunRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid milestone run JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return MilestoneRunRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid milestone run record at ${filePath}`, {
      cause: error
    });
  }
};

export class FileMilestoneRunRegistry implements MilestoneRunRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: MilestoneRunRecord): Promise<MilestoneRunRecord> {
    const parsedRecord = MilestoneRunRecordSchema.parse(record);
    assertSafeStorageId(parsedRecord.runId, "Run id");
    assertSafeStorageId(parsedRecord.id, "Milestone run id");

    const filePath = this.getFilePath(parsedRecord.runId, parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list operations to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<MilestoneRunRecord | null> {
    assertSafeStorageId(id, "Milestone run id");

    // We need to scan all runs to find a milestone run by id alone,
    // since the storage path is scoped under runs/{runId}/.
    const runsDirectory = this.getRunsDirectory();

    try {
      const runEntries = await readdir(runsDirectory, { withFileTypes: true });
      const runDirs = runEntries.filter((entry) => entry.isDirectory());

      for (const runDir of runDirs) {
        const milestoneRunsDir = path.join(
          runsDirectory,
          runDir.name,
          "milestone-runs"
        );
        const filePath = path.join(milestoneRunsDir, `${id}.json`);

        try {
          const serialized = await readFile(filePath, "utf8");
          return parseMilestoneRunRecord(serialized, filePath);
        } catch (error) {
          if (this.isMissingFileError(error)) {
            continue;
          }
          throw error;
        }
      }

      return null;
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  async listByRunId(runId: string): Promise<MilestoneRunRecord[]> {
    assertSafeStorageId(runId, "Run id");
    const directoryPath = this.getMilestoneRunsDirectory(runId);

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name);

      const records: MilestoneRunRecord[] = [];

      for (const fileName of files) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        records.push(parseMilestoneRunRecord(serialized, filePath));
      }

      return records.sort((left, right) => left.id.localeCompare(right.id));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }
      throw error;
    }
  }

  async listByMilestoneId(
    runId: string,
    milestoneId: string
  ): Promise<MilestoneRunRecord[]> {
    const all = await this.listByRunId(runId);
    return all.filter((r) => r.milestoneId === milestoneId);
  }

  private getRunsDirectory(): string {
    return path.join(this.rootDirectory, "storage", "runs");
  }

  private getMilestoneRunsDirectory(runId: string): string {
    return path.join(this.getRunsDirectory(), runId, "milestone-runs");
  }

  private getFilePath(runId: string, id: string): string {
    return path.join(this.getMilestoneRunsDirectory(runId), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
