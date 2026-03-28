import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MilestoneRecordSchema, type MilestoneRecord } from "@attractor/shared";

import { assertSafeStorageId } from "../path-safety";

export interface MilestoneRegistry {
  save(record: MilestoneRecord): Promise<MilestoneRecord>;
  getById(id: string): Promise<MilestoneRecord | null>;
  list(): Promise<MilestoneRecord[]>;
  listByPlanId(planId: string): Promise<MilestoneRecord[]>;
}

const parseMilestoneRecord = (
  serialized: string,
  filePath: string
): MilestoneRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid milestone JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return MilestoneRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid milestone record at ${filePath}`, {
      cause: error
    });
  }
};

export class FileMilestoneRegistry implements MilestoneRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: MilestoneRecord): Promise<MilestoneRecord> {
    const parsedRecord = MilestoneRecordSchema.parse(record);
    assertSafeStorageId(parsedRecord.id, "Milestone id");

    const filePath = this.getFilePath(parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list operations to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<MilestoneRecord | null> {
    assertSafeStorageId(id, "Milestone id");

    const filePath = this.getFilePath(id);

    try {
      const serialized = await readFile(filePath, "utf8");
      return parseMilestoneRecord(serialized, filePath);
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  async list(): Promise<MilestoneRecord[]> {
    const directoryPath = this.getMilestonesDirectory();

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name);

      const records: MilestoneRecord[] = [];

      for (const fileName of files) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        records.push(parseMilestoneRecord(serialized, filePath));
      }

      return records.sort((left, right) => left.id.localeCompare(right.id));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }
      throw error;
    }
  }

  async listByPlanId(planId: string): Promise<MilestoneRecord[]> {
    const all = await this.list();
    return all.filter((r) => r.planId === planId);
  }

  private getMilestonesDirectory(): string {
    return path.join(this.rootDirectory, "storage", "milestones");
  }

  private getFilePath(id: string): string {
    return path.join(this.getMilestonesDirectory(), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
