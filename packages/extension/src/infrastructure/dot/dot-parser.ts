import type { GraphNode } from "@attractor/shared";

export interface ParsedGraph {
  nodes: GraphNode[];
}

export class DotParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DotParseError";
  }
}

/**
 * Minimal Graphviz DOT parser that extracts nodes and directed edges.
 *
 * Supported syntax:
 *   digraph G {
 *     A [label="Step A"]
 *     B [label="Step B", lane="lane1"]
 *     A -> B
 *     A -> C [label="edge label"]
 *   }
 *
 * Node attributes recognised: `label`
 * Lane annotations (`lane="..."`) are accepted but not enforced in GraphNode.
 * Edges define the `dependsOn` relationship on the target node.
 */
export function parseDot(source: string): ParsedGraph {
  const tokens = tokenise(source);
  const parser = new Parser(tokens, source);
  return parser.parse();
}

// ── Tokeniser ────────────────────────────────────────────────────────────────

type TokenKind =
  | "ident"
  | "string"
  | "arrow"
  | "lbrace"
  | "rbrace"
  | "lbracket"
  | "rbracket"
  | "eq"
  | "semi"
  | "comma"
  | "eof";

interface Token {
  kind: TokenKind;
  value: string;
  pos: number;
}

function tokenise(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    // Skip whitespace and comments
    if (/\s/.test(src[i] ?? "")) {
      i++;
      continue;
    }
    // Line comment
    if (src.startsWith("//", i)) {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    // Block comment
    if (src.startsWith("/*", i)) {
      i += 2;
      while (i < src.length && !src.startsWith("*/", i)) i++;
      i += 2;
      continue;
    }
    const ch = src[i] ?? "";
    if (ch === "{") {
      tokens.push({ kind: "lbrace", value: "{", pos: i++ });
      continue;
    }
    if (ch === "}") {
      tokens.push({ kind: "rbrace", value: "}", pos: i++ });
      continue;
    }
    if (ch === "[") {
      tokens.push({ kind: "lbracket", value: "[", pos: i++ });
      continue;
    }
    if (ch === "]") {
      tokens.push({ kind: "rbracket", value: "]", pos: i++ });
      continue;
    }
    if (ch === "=") {
      tokens.push({ kind: "eq", value: "=", pos: i++ });
      continue;
    }
    if (ch === ";") {
      tokens.push({ kind: "semi", value: ";", pos: i++ });
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma", value: ",", pos: i++ });
      continue;
    }
    // Arrow
    if (src.startsWith("->", i)) {
      tokens.push({ kind: "arrow", value: "->", pos: i });
      i += 2;
      continue;
    }
    // Quoted string
    if (ch === '"') {
      const start = i++;
      let val = "";
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\\") {
          i++;
          val += src[i] ?? "";
        } else {
          val += src[i] ?? "";
        }
        i++;
      }
      if (i >= src.length)
        throw new DotParseError(`Unterminated string at ${start}`);
      i++; // closing quote
      tokens.push({ kind: "string", value: val, pos: start });
      continue;
    }
    // Identifier (alphanumeric + underscore + dot + hyphen)
    if (/[A-Za-z_0-9.-]/.test(ch)) {
      const start = i;
      let val = "";
      while (i < src.length && /[A-Za-z_0-9.-]/.test(src[i] ?? "")) {
        val += src[i] ?? "";
        i++;
      }
      tokens.push({ kind: "ident", value: val, pos: start });
      continue;
    }
    throw new DotParseError(`Unexpected character '${ch}' at position ${i}`);
  }
  tokens.push({ kind: "eof", value: "", pos: src.length });
  return tokens;
}

// ── Parser ───────────────────────────────────────────────────────────────────

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly _source: string
  ) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { kind: "eof", value: "", pos: 0 };
  }

  private consume(kind?: TokenKind): Token {
    const t = this.tokens[this.pos];
    if (t === undefined || t.kind === "eof") {
      throw new DotParseError(`Unexpected end of input`);
    }
    if (kind !== undefined && t.kind !== kind) {
      throw new DotParseError(
        `Expected ${kind} but got '${t.value}' (${t.kind}) at pos ${t.pos}`
      );
    }
    this.pos++;
    return t;
  }

  private tryConsume(kind: TokenKind): Token | undefined {
    if (this.peek().kind === kind) {
      return this.consume(kind);
    }
    return undefined;
  }

  parse(): ParsedGraph {
    // Skip optional keywords: strict, digraph/graph, optional name
    this.skipKeyword("strict");
    if (this.peek().kind !== "lbrace") {
      const kw = this.peek().value.toLowerCase();
      if (kw === "digraph" || kw === "graph") this.consume();
      // Optional graph name
      if (this.peek().kind === "ident" || this.peek().kind === "string") {
        this.consume();
      }
    }
    this.consume("lbrace");

    const nodes = new Map<string, GraphNode>();
    const incomingEdges = new Map<string, Set<string>>(); // targetId → Set<sourceId>

    const ensureNode = (id: string): void => {
      if (!nodes.has(id)) {
        nodes.set(id, { id, label: id, dependsOn: [] });
        incomingEdges.set(id, new Set());
      }
    };

    while (this.peek().kind !== "rbrace" && this.peek().kind !== "eof") {
      // Skip semicolons
      if (this.peek().kind === "semi") {
        this.consume();
        continue;
      }

      // graph/node/edge attributes at graph level — skip
      if (
        this.isKeyword("graph") ||
        this.isKeyword("node") ||
        this.isKeyword("edge")
      ) {
        this.consume();
        if (this.peek().kind === "lbracket") this.parseAttrList();
        this.tryConsume("semi");
        continue;
      }

      // Subgraph
      if (this.isKeyword("subgraph")) {
        this.consume();
        if (this.peek().kind === "ident" || this.peek().kind === "string")
          this.consume();
        this.consume("lbrace");
        while (this.peek().kind !== "rbrace" && this.peek().kind !== "eof") {
          if (this.peek().kind === "semi") {
            this.consume();
            continue;
          }
          this.parseStatement(nodes, incomingEdges, ensureNode);
        }
        this.consume("rbrace");
        continue;
      }

      this.parseStatement(nodes, incomingEdges, ensureNode);
    }

    this.tryConsume("rbrace");

    // Attach dependsOn edges
    for (const [targetId, sources] of incomingEdges) {
      const node = nodes.get(targetId);
      if (node !== undefined) {
        node.dependsOn = [...sources];
      }
    }

    return { nodes: [...nodes.values()] };
  }

  private parseStatement(
    nodes: Map<string, GraphNode>,
    incomingEdges: Map<string, Set<string>>,
    ensureNode: (id: string) => void
  ): void {
    const idToken = this.consume();
    if (idToken.kind !== "ident" && idToken.kind !== "string") {
      throw new DotParseError(
        `Expected node id or keyword at pos ${idToken.pos}, got '${idToken.value}'`
      );
    }
    const id = idToken.value;
    ensureNode(id);

    if (this.peek().kind === "arrow") {
      // Edge statement: id -> id2 [-> id3 ...] [attrs]
      let sourceId = id;
      while (this.peek().kind === "arrow") {
        this.consume("arrow");
        const targetToken = this.consume();
        if (targetToken.kind !== "ident" && targetToken.kind !== "string") {
          throw new DotParseError(
            `Expected node id after '->' at pos ${targetToken.pos}`
          );
        }
        const targetId = targetToken.value;
        ensureNode(targetId);
        const edges = incomingEdges.get(targetId);
        if (edges !== undefined) {
          edges.add(sourceId);
        }
        sourceId = targetId;
      }
      // Optional edge attrs (ignored)
      if (this.peek().kind === "lbracket") this.parseAttrList();
    } else if (this.peek().kind === "lbracket") {
      // Node attributes
      const attrs = this.parseAttrList();
      const node = nodes.get(id);
      if (node !== undefined && attrs["label"] !== undefined) {
        node.label = attrs["label"];
      }
    }

    this.tryConsume("semi");
  }

  private parseAttrList(): Record<string, string> {
    this.consume("lbracket");
    const attrs: Record<string, string> = {};
    while (this.peek().kind !== "rbracket" && this.peek().kind !== "eof") {
      if (this.peek().kind === "semi" || this.peek().kind === "comma") {
        this.consume();
        continue;
      }
      const keyToken = this.consume();
      this.consume("eq");
      const valToken = this.consume();
      attrs[keyToken.value] = valToken.value;
    }
    this.consume("rbracket");
    return attrs;
  }

  private skipKeyword(kw: string): void {
    if (
      this.peek().kind === "ident" &&
      this.peek().value.toLowerCase() === kw
    ) {
      this.consume();
    }
  }

  private isKeyword(kw: string): boolean {
    return (
      this.peek().kind === "ident" && this.peek().value.toLowerCase() === kw
    );
  }
}
