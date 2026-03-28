import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ArtifactRecordSchema, type ArtifactRecord } from "@attractor/shared";

import { assertSafeStorageId } from "../path-safety";

export interface ArtifactRegistry {
  save(record: ArtifactRecord): Promise<ArtifactRecord>;
  getById(id: string): Promise<ArtifactRecord | null>;
  listByRunId(runId: string): Promise<ArtifactRecord[]>;
  listByNodeId(runId: string, nodeId: string): Promise<ArtifactRecord[]>;
}

const parseArtifactRecord = (
  serialized: string,
  filePath: string
): ArtifactRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid artifact JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return ArtifactRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid artifact record at ${filePath}`, {
      cause: error
    });
  }
};

export class FileArtifactRegistry implements ArtifactRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: ArtifactRecord): Promise<ArtifactRecord> {
    const parsedRecord = ArtifactRecordSchema.parse(record);
    assertSafeStorageId(parsedRecord.runId, "Run id");
    assertSafeStorageId(parsedRecord.id, "Artifact id");

    const filePath = this.getFilePath(parsedRecord.runId, parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    // NOTE: writeFile is not atomic. A crash mid-write can leave a partial
    // .json file that will cause list operations to throw until manually repaired.
    // Atomic temp-file-plus-rename is deferred to a future hardening slice.
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<ArtifactRecord | null> {
    assertSafeStorageId(id, "Artifact id");

    // We need to scan all runs to find an artifact by id alone,
    // since the storage path is scoped under runs/{runId}/.
    const runsDirectory = this.getRunsDirectory();

    try {
      const runEntries = await readdir(runsDirectory, { withFileTypes: true });
      const runDirs = runEntries.filter((entry) => entry.isDirectory());

      for (const runDir of runDirs) {
        const artifactsDir = path.join(runsDirectory, runDir.name, "artifacts");
        const filePath = path.join(artifactsDir, `${id}.json`);

        try {
          const serialized = await readFile(filePath, "utf8");
          return parseArtifactRecord(serialized, filePath);
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

  async listByRunId(runId: string): Promise<ArtifactRecord[]> {
    assertSafeStorageId(runId, "Run id");
    const directoryPath = this.getArtifactsDirectory(runId);

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name);

      const records: ArtifactRecord[] = [];

      for (const fileName of files) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        records.push(parseArtifactRecord(serialized, filePath));
      }

      return records.sort((left, right) => left.id.localeCompare(right.id));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }
      throw error;
    }
  }

  async listByNodeId(runId: string, nodeId: string): Promise<ArtifactRecord[]> {
    const all = await this.listByRunId(runId);
    return all.filter((r) => r.nodeId === nodeId);
  }

  private getRunsDirectory(): string {
    return path.join(this.rootDirectory, "storage", "runs");
  }

  private getArtifactsDirectory(runId: string): string {
    return path.join(this.getRunsDirectory(), runId, "artifacts");
  }

  private getFilePath(runId: string, id: string): string {
    return path.join(this.getArtifactsDirectory(runId), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
