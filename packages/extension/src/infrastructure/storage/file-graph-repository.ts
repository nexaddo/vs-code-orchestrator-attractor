import * as fs from "fs/promises";
import * as path from "path";

import { GraphRecordSchema, type GraphRecord } from "@attractor/shared";

import type { GraphRepository } from "../../application/ports";

/**
 * Persists GraphRecords to `.attractor/graphs/<graphId>.json` under the given root.
 */
export class FileGraphRepository implements GraphRepository {
  constructor(private readonly root: string) {}

  private graphsDir(): string {
    return path.join(this.root, ".attractor", "graphs");
  }

  private graphPath(graphId: string): string {
    return path.join(this.graphsDir(), `${graphId}.json`);
  }

  async save(graph: GraphRecord): Promise<void> {
    await fs.mkdir(this.graphsDir(), { recursive: true });
    await fs.writeFile(
      this.graphPath(graph.id),
      JSON.stringify(graph, null, 2),
      "utf8"
    );
  }

  async find(graphId: string): Promise<GraphRecord | undefined> {
    try {
      const raw = await fs.readFile(this.graphPath(graphId), "utf8");
      const parsed: unknown = JSON.parse(raw);
      return GraphRecordSchema.parse(parsed);
    } catch {
      return undefined;
    }
  }
}
