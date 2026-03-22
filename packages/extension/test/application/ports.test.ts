import { describe, expect, it } from "vitest";

import { NoOpModelGateway } from "../../src/application/ports";

describe("NoOpModelGateway", () => {
  it("send() returns an empty string", async () => {
    const gateway = new NoOpModelGateway();
    const result = await gateway.send([{ role: "user", content: "Hello" }]);

    expect(result).toBe("");
  });

  it("stream() resolves without calling onChunk", async () => {
    const gateway = new NoOpModelGateway();
    const chunks: string[] = [];

    await gateway.stream([{ role: "user", content: "Hello" }], (text) =>
      chunks.push(text)
    );

    expect(chunks).toHaveLength(0);
  });

  it("send() returns empty string with no arguments", async () => {
    const gateway = new NoOpModelGateway();
    const result = await gateway.send([]);

    expect(result).toBe("");
  });

  it("stream() resolves with empty messages array", async () => {
    const gateway = new NoOpModelGateway();
    const chunks: string[] = [];

    await gateway.stream([], (text) => chunks.push(text));

    expect(chunks).toHaveLength(0);
  });
});
