import * as fs from "fs/promises";
import * as path from "path";

import {
  RepositoryRecordSchema,
  type RepositoryRecord
} from "@attractor/shared";

import type { RepositoryRegistry } from "../../application/ports";

interface RegistryFile {
  version: 1;
  repositories: RepositoryRecord[];
}

function isRegistryFile(value: unknown): value is RegistryFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v["version"] === 1 && Array.isArray(v["repositories"]);
}

/**
 * Persists RepositoryRecords to `.attractor/registry.json`.
 * Supports add/remove/list/find operations.
 */
export class FileRepositoryRegistry implements RepositoryRegistry {
  constructor(private readonly root: string) {}

  private registryPath(): string {
    return path.join(this.root, ".attractor", "registry.json");
  }

  private async read(): Promise<RegistryFile> {
    try {
      const raw = await fs.readFile(this.registryPath(), "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!isRegistryFile(parsed)) {
        return { version: 1, repositories: [] };
      }
      // Validate each record
      const repositories = parsed.repositories.flatMap((r: unknown) => {
        const result = RepositoryRecordSchema.safeParse(r);
        return result.success ? [result.data] : [];
      });
      return { version: 1, repositories };
    } catch {
      return { version: 1, repositories: [] };
    }
  }

  private async write(file: RegistryFile): Promise<void> {
    const dir = path.dirname(this.registryPath());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.registryPath(),
      JSON.stringify(file, null, 2),
      "utf8"
    );
  }

  async add(repo: RepositoryRecord): Promise<void> {
    const file = await this.read();
    const idx = file.repositories.findIndex((r) => r.id === repo.id);
    if (idx >= 0) {
      file.repositories[idx] = repo;
    } else {
      file.repositories.push(repo);
    }
    await this.write(file);
  }

  async remove(repoId: string): Promise<void> {
    const file = await this.read();
    file.repositories = file.repositories.filter((r) => r.id !== repoId);
    await this.write(file);
  }

  async list(): Promise<RepositoryRecord[]> {
    const file = await this.read();
    return file.repositories;
  }

  async find(repoId: string): Promise<RepositoryRecord | undefined> {
    const file = await this.read();
    return file.repositories.find((r) => r.id === repoId);
  }
}
