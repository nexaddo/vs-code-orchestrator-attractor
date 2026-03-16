import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { RunRecordSchema, type RunRecord } from "@attractor/shared";

export interface RunRegistry {
  save(record: RunRecord): Promise<RunRecord>;
  getById(id: string): Promise<RunRecord | null>;
  list(): Promise<RunRecord[]>;
}

const RUNS_DIRECTORY = path.join("storage", "runs");

// Windows reserved device names that are illegal as filenames on any Windows path.
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])[. ]*$/i;

const assertSafeRunId = (id: string): void => {
  if (id.includes("/") || id.includes("\\")) {
    throw new Error(`Run id must not contain path separators: ${id}`);
  }
  if (id.includes(":")) {
    throw new Error(`Run id must not contain a colon: ${id}`);
  }
  if (id.includes("\0")) {
    throw new Error(`Run id must not contain null bytes: ${id}`);
  }
  if (WINDOWS_RESERVED_NAMES.test(id)) {
    throw new Error(`Run id is a reserved filename on Windows: ${id}`);
  }
};

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
    assertSafeRunId(parsedRecord.id);

    const filePath = this.getFilePath(parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list() to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<RunRecord | null> {
    assertSafeRunId(id);
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
