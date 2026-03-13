import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  RepositoryRecordSchema,
  type RepositoryRecord
} from "@attractor/shared";

export interface RepositoryRegistry {
  save(record: RepositoryRecord): Promise<RepositoryRecord>;
  getById(id: string): Promise<RepositoryRecord | null>;
  list(): Promise<RepositoryRecord[]>;
}

const REPOSITORIES_DIRECTORY = path.join("storage", "repositories");

const assertSafeRepositoryId = (id: string): void => {
  if (id.includes("/") || id.includes("\\")) {
    throw new Error(`Repository id must not contain path separators: ${id}`);
  }
};

const parseRepositoryRecord = (
  serialized: string,
  filePath: string
): RepositoryRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(`Invalid repository JSON at ${filePath}`, {
      cause: error
    });
  }

  try {
    return RepositoryRecordSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Invalid repository record at ${filePath}`, {
      cause: error
    });
  }
};

export class FileRepositoryRegistry implements RepositoryRegistry {
  constructor(private readonly rootDirectory: string) {}

  async save(record: RepositoryRecord): Promise<RepositoryRecord> {
    const parsedRecord = RepositoryRecordSchema.parse(record);
    assertSafeRepositoryId(parsedRecord.id);

    const filePath = this.getFilePath(parsedRecord.id);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(parsedRecord, null, 2)}\n`);

    return parsedRecord;
  }

  async getById(id: string): Promise<RepositoryRecord | null> {
    assertSafeRepositoryId(id);
    const filePath = this.getFilePath(id);

    try {
      const serialized = await readFile(filePath, "utf8");
      return parseRepositoryRecord(serialized, filePath);
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  async list(): Promise<RepositoryRecord[]> {
    const directoryPath = this.getRepositoriesDirectory();

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const repositoryFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));

      const repositories: RepositoryRecord[] = [];

      for (const fileName of repositoryFiles) {
        const filePath = path.join(directoryPath, fileName);
        const serialized = await readFile(filePath, "utf8");
        repositories.push(parseRepositoryRecord(serialized, filePath));
      }

      return repositories;
    } catch (error) {
      if (this.isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }

  private getRepositoriesDirectory(): string {
    return path.join(this.rootDirectory, REPOSITORIES_DIRECTORY);
  }

  private getFilePath(id: string): string {
    return path.join(this.getRepositoriesDirectory(), `${id}.json`);
  }

  private isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error && error.code === "ENOENT";
  }
}
