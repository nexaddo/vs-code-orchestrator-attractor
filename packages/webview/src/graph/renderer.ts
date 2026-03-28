import type { GraphState } from "./model";
import type { NodeStatusValue } from "@attractor/shared";

const STATUS_LABELS: Record<NodeStatusValue, string> = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  failed: "Failed"
};

export function renderGraph(state: GraphState): string {
  const { runId, graph, nodeStatuses } = state;

  const statusByNodeId = new Map(
    nodeStatuses.map((ns) => [ns.nodeId, ns.status])
  );

  // Derive per-node status (nodes absent from nodeStatuses default to "pending")
  const derivedStatuses = graph.nodes.map(
    (node) => statusByNodeId.get(node.id) ?? "pending"
  );

  const nodesHtml = graph.nodes
    .map((node, i) => {
      const status = derivedStatuses[i] ?? "pending";
      const statusLabel = STATUS_LABELS[status];
      const depsHtml =
        node.dependsOn.length > 0
          ? `<span class="node-deps">← ${node.dependsOn.map(escapeHtml).join(", ")}</span>`
          : "";
      return `
<div class="graph-node graph-node--${escapeHtml(status)}" data-node-id="${escapeHtml(node.id)}">
  <span class="node-label">${escapeHtml(node.label)}</span>
  <span class="node-status-badge">${escapeHtml(statusLabel)}</span>
  ${depsHtml}
</div>`.trim();
    })
    .join("");

  // Count from derived statuses to match what the UI renders (including implicit pending)
  const summary = {
    pending: derivedStatuses.filter((s) => s === "pending").length,
    running: derivedStatuses.filter((s) => s === "running").length,
    done: derivedStatuses.filter((s) => s === "done").length,
    failed: derivedStatuses.filter((s) => s === "failed").length
  };

  return `
<div class="graph-container">
  <h1>Graph View</h1>
  <p class="graph-run-id">Run: ${escapeHtml(runId)}</p>

  <section class="graph-legend">
    <span class="legend-item legend-item--pending">Pending: ${summary.pending}</span>
    <span class="legend-item legend-item--running">Running: ${summary.running}</span>
    <span class="legend-item legend-item--done">Done: ${summary.done}</span>
    <span class="legend-item legend-item--failed">Failed: ${summary.failed}</span>
  </section>

  <section class="graph-dag">
    <div class="node-list">
      ${nodesHtml}
    </div>
  </section>
</div>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
