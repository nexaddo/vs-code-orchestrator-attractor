import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PlanRecordSchema, type PlanRecord } from "@attractor/shared";

import { assertSafeStorageId } from "../path-safety";

export interface PlanRegistry {
  save(record: PlanRecord): Promise<PlanRecord>;
  getById(id: string): Promise<PlanRecord | null>;
  list(): Promise<PlanRecord[]>;
}

const PLANS_DIRECTORY = path.join("storage", "plans");

const parsePlanRecord = (serialized: string, filePath: string): PlanRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid plan JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return PlanRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid plan record at ${filePath}`, {
      cause: error
    });
  }
};

export class FilePlanRegistry implements PlanRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: PlanRecord): Promise<PlanRecord> {
    const parsedRecord = PlanRecordSchema.parse(record);
    assertSafeStorageId(parsedRecord.id, "Plan id");

    const filePath = this.getFilePath(parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list() to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<PlanRecord | null> {
    assertSafeStorageId(id, "Plan id");
    const filePath = this.getFilePath(id);

    try {
      const serialized = await readFile(filePath, "utf8");
      return parsePlanRecord(serialized, filePath);
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  async list(): Promise<PlanRecord[]> {
    const directoryPath = this.getPlansDirectory();

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const planFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name);

      const plans: PlanRecord[] = [];

      for (const fileName of planFiles) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        plans.push(parsePlanRecord(serialized, filePath));
      }

      // Sort by the authoritative record id, independent of filename.
      return plans.sort((left, right) => left.id.localeCompare(right.id));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }

  private getPlansDirectory(): string {
    return path.join(this.rootDirectory, PLANS_DIRECTORY);
  }

  private getFilePath(id: string): string {
    return path.join(this.getPlansDirectory(), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
