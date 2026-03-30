import * as fs from "fs/promises";
import * as path from "path";

import { GraphRecordSchema, type GraphRecord } from "@attractor/shared";

import type { GraphRepository } from "../../application/ports";
import { assertSafeStorageId } from "../../storage/path-safety";

/**
 * Persists GraphRecords to `.attractor/graphs/<graphId>.json` under the given root.
 */
export class FileGraphRepository implements GraphRepository {
  constructor(private readonly root: string) {}

  private graphsDir(): string {
    return path.join(this.root, ".attractor", "graphs");
  }

  private graphPath(graphId: string): string {
    assertSafeStorageId(graphId, "Graph id");
    return path.join(this.graphsDir(), `${graphId}.json`);
  }

  async save(graph: GraphRecord): Promise<void> {
    const validated = GraphRecordSchema.parse(graph);
    await fs.mkdir(this.graphsDir(), { recursive: true });
    await fs.writeFile(
      this.graphPath(validated.id),
      JSON.stringify(validated, null, 2),
      "utf8"
    );
  }

  async find(graphId: string): Promise<GraphRecord | undefined> {
    try {
      const raw = await fs.readFile(this.graphPath(graphId), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return GraphRecordSchema.parse(parsed);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw err;
    }
  }
}
