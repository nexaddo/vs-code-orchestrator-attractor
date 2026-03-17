import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateDot } from "../../src/graph/dot-validator";

const fixturesRoot = path.resolve(__dirname, "../../../../test/fixtures/graph");

function loadFixture(relativePath: string): string {
  return fs.readFileSync(path.join(fixturesRoot, relativePath), "utf-8");
}

describe("validateDot", () => {
  describe("valid graphs", () => {
    it("returns valid=true and no diagnostics for a well-formed plan", () => {
      const source = loadFixture("valid/simple-plan.dot");
      const result = validateDot(source);

      expect(result.valid).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
    });

    it("returns valid=true for a minimal digraph with only start and exit", () => {
      const source = `
        digraph minimal {
          start [type=start]
          done [type=exit]
          start -> done
        }
      `;
      const result = validateDot(source);

      expect(result.valid).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
    });

    it("accepts all allowed node types", () => {
      const source = `
        digraph all_types {
          s [type=start]
          a [type=codergen]
          b [type=conditional]
          c [type="wait.human"]
          e [type=exit]
          s -> a
          a -> b
          b -> c
          c -> e
        }
      `;
      const result = validateDot(source);

      expect(result.valid).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe("missing-start diagnostic", () => {
    it("returns missing-start diagnostic when no start node exists", () => {
      const source = loadFixture("invalid/missing-start.dot");
      const result = validateDot(source);

      expect(result.valid).toBe(false);
      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("missing-start");
    });

    it("returns missing-start when node id is start but no type attribute matches", () => {
      // A node named 'start' with wrong type attribute should NOT satisfy the start check
      // unless its id alone matches (allowed fall-through). Here we confirm id-based fallthrough works.
      const source = `
        digraph id_based {
          start
          done [type=exit]
          start -> done
        }
      `;
      const result = validateDot(source);

      expect(result.valid).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe("missing-exit diagnostic", () => {
    it("returns missing-exit diagnostic when no exit node exists", () => {
      const source = loadFixture("invalid/missing-exit.dot");
      const result = validateDot(source);

      expect(result.valid).toBe(false);
      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("missing-exit");
    });
  });

  describe("unsupported-node-type diagnostic", () => {
    it("returns unsupported-node-type for a node with a disallowed type attribute", () => {
      const source = loadFixture("invalid/unsupported-type.dot");
      const result = validateDot(source);

      expect(result.valid).toBe(false);
      const unsupported = result.diagnostics.filter(
        (d) => d.code === "unsupported-node-type"
      );
      expect(unsupported.length).toBeGreaterThan(0);
      expect(unsupported[0]?.nodeId).toBe("bad");
    });

    it("includes the offending node id in the diagnostic", () => {
      const source = `
        digraph with_fan_in {
          start [type=start]
          fan [type=fan_in]
          done [type=exit]
          start -> fan
          fan -> done
        }
      `;
      const result = validateDot(source);

      const unsupported = result.diagnostics.find(
        (d) => d.code === "unsupported-node-type"
      );
      expect(unsupported).toBeDefined();
      expect(unsupported?.nodeId).toBe("fan");
    });
  });

  describe("unreachable-node diagnostic", () => {
    it("returns unreachable-node for an isolated node", () => {
      const source = loadFixture("invalid/unreachable.dot");
      const result = validateDot(source);

      expect(result.valid).toBe(false);
      const unreachable = result.diagnostics.filter(
        (d) => d.code === "unreachable-node"
      );
      expect(unreachable.length).toBeGreaterThan(0);
      expect(unreachable[0]?.nodeId).toBe("orphan");
    });

    it("does not check reachability when start node is missing", () => {
      const source = `
        digraph no_start {
          step [type=codergen]
          done [type=exit]
          step -> done
        }
      `;
      const result = validateDot(source);

      // Should only have missing-start (and no unreachable diagnostics)
      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("missing-start");
      expect(codes).not.toContain("unreachable-node");
    });
  });

  describe("parse-error diagnostic", () => {
    it("returns parse-error for empty string", () => {
      const result = validateDot("");

      expect(result.valid).toBe(false);
      expect(result.diagnostics[0]?.code).toBe("parse-error");
    });

    it("returns parse-error for invalid DOT syntax", () => {
      const result = validateDot("this is not dot language {{{");

      expect(result.valid).toBe(false);
      expect(result.diagnostics[0]?.code).toBe("parse-error");
    });

    it("does not throw — parse failures are returned as diagnostics", () => {
      expect(() => validateDot("!!!")).not.toThrow();
      const result = validateDot("!!!");
      expect(result.valid).toBe(false);
    });
  });

  describe("multiple diagnostics", () => {
    it("reports both missing-start and missing-exit together", () => {
      const source = `
        digraph empty_ish {
          a [type=codergen]
          b [type=codergen]
          a -> b
        }
      `;
      const result = validateDot(source);

      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("missing-start");
      expect(codes).toContain("missing-exit");
    });

    it("reports unsupported-node-type and unreachable together for orphan with bad type", () => {
      const source = `
        digraph mixed_errors {
          start [type=start]
          done [type=exit]
          orphan [type=parallel]
          start -> done
        }
      `;
      const result = validateDot(source);

      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("unsupported-node-type");
      expect(codes).toContain("unreachable-node");
    });
  });
});
