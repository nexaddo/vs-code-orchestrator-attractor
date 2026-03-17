import { AST } from "@ts-graphviz/parser";

export type DiagnosticCode =
  | "missing-start"
  | "missing-exit"
  | "unsupported-node-type"
  | "unreachable-node"
  | "parse-error";

export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  nodeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: Diagnostic[];
}

const ALLOWED_NODE_TYPES = new Set([
  "start",
  "exit",
  "codergen",
  "conditional",
  "wait.human"
]);

type NodeStmt = AST.Node;
type EdgeStmt = AST.Edge;

function getNodeType(node: NodeStmt): string | null {
  const nodeId = node.id.value;
  const typeAttr = node.body.find((attr) => attr.key.value === "type");
  if (typeAttr) {
    return typeAttr.value.value;
  }
  // Fall back to node id as the type indicator
  if (ALLOWED_NODE_TYPES.has(nodeId)) {
    return nodeId;
  }
  return null;
}

function collectGraphBody(body: AST.ClusterStatement[]): {
  nodes: NodeStmt[];
  edges: EdgeStmt[];
} {
  const nodes: NodeStmt[] = [];
  const edges: EdgeStmt[] = [];

  for (const stmt of body) {
    if (stmt.type === "node") {
      nodes.push(stmt);
    } else if (stmt.type === "edge") {
      edges.push(stmt);
    } else if (stmt.type === "subgraph") {
      const sub = collectGraphBody(stmt.body);
      nodes.push(...sub.nodes);
      edges.push(...sub.edges);
    }
  }

  return { nodes, edges };
}

function isNodeRef(t: AST.EdgeTarget): t is AST.NodeRef {
  return t.type === "node_ref";
}

function buildAdjacency(edges: EdgeStmt[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const edge of edges) {
    const targets = edge.targets;
    for (let i = 0; i < targets.length - 1; i++) {
      const from = targets[i];
      const to = targets[i + 1];
      if (
        from !== undefined &&
        to !== undefined &&
        isNodeRef(from) &&
        isNodeRef(to)
      ) {
        const fromId = from.id.value;
        const toId = to.id.value;
        if (!adj.has(fromId)) adj.set(fromId, new Set());
        const neighbors = adj.get(fromId);
        if (neighbors !== undefined) {
          neighbors.add(toId);
        }
      }
    }
  }
  return adj;
}

function reachableFrom(
  startId: string,
  adj: Map<string, Set<string>>
): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) continue;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const neighbor of adj.get(current) ?? []) {
      queue.push(neighbor);
    }
  }
  return visited;
}

export function validateDot(source: string): ValidationResult {
  const diagnostics: Diagnostic[] = [];

  let ast: AST.Dot;
  try {
    ast = AST.parse(source);
  } catch {
    return {
      valid: false,
      diagnostics: [
        {
          code: "parse-error",
          message: "Failed to parse DOT source"
        }
      ]
    };
  }

  // Find the first graph/digraph in the AST
  const graphStmt = ast.body.find((s): s is AST.Graph => s.type === "graph");

  if (!graphStmt) {
    return {
      valid: false,
      diagnostics: [
        { code: "parse-error", message: "No graph found in DOT source" }
      ]
    };
  }

  const { nodes, edges } = collectGraphBody(graphStmt.body);

  // Identify start / exit nodes
  const startNodes = nodes.filter((n) => getNodeType(n) === "start");
  const exitNodes = nodes.filter((n) => getNodeType(n) === "exit");

  if (startNodes.length !== 1) {
    diagnostics.push({
      code: "missing-start",
      message:
        startNodes.length === 0
          ? "Graph must contain exactly one start node"
          : `Graph must contain exactly one start node, found ${startNodes.length}`
    });
  }

  if (exitNodes.length !== 1) {
    diagnostics.push({
      code: "missing-exit",
      message:
        exitNodes.length === 0
          ? "Graph must contain exactly one exit node"
          : `Graph must contain exactly one exit node, found ${exitNodes.length}`
    });
  }

  // Check each node type
  for (const node of nodes) {
    const nodeId = node.id.value;
    const nodeType = getNodeType(node);
    if (nodeType === null || !ALLOWED_NODE_TYPES.has(nodeType)) {
      diagnostics.push({
        code: "unsupported-node-type",
        message: `Node "${nodeId}" has unsupported type "${nodeType ?? nodeId}"`,
        nodeId
      });
    }
  }

  // Reachability: only check when there is exactly one start node
  const firstStart = startNodes[0];
  if (startNodes.length === 1 && firstStart !== undefined) {
    const startId = firstStart.id.value;
    const adj = buildAdjacency(edges);
    const reachable = reachableFrom(startId, adj);

    for (const node of nodes) {
      const nodeId = node.id.value;
      if (!reachable.has(nodeId)) {
        diagnostics.push({
          code: "unreachable-node",
          message: `Node "${nodeId}" is not reachable from the start node`,
          nodeId
        });
      }
    }
  }

  return { valid: diagnostics.length === 0, diagnostics };
}
