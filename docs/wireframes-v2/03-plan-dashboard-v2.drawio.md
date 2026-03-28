# Plan Dashboard — v2

Three-zone layout: Left panel (PlanMetadataPanel + MilestonePanel + ValidationProblemsPanel), Center (PlanHeader + GraphCanvas), Bottom strip (PlanRunHistory). Matches `ui-design-v2.md §3 Plan Dashboard`.

```drawio
<mxfile version="21.2.8" type="device">
  <diagram id="plan-dashboard-v2" name="Plan Dashboard v2">
    <mxGraphModel dx="1440" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="0" arrows="0" fold="0" page="1" pageScale="1" pageWidth="1440" pageHeight="900">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Background -->
        <mxCell id="bg" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry width="1440" height="900" as="geometry" />
        </mxCell>

        <!-- Activity Bar -->
        <mxCell id="actbar" value="" style="rounded=0;fillColor=#333333;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry width="48" height="900" as="geometry" />
        </mxCell>
        <mxCell id="actbar-i1" value="⊞" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#cccccc;fontSize=16;" vertex="1" parent="1">
          <mxGeometry x="8" y="60" width="32" height="32" as="geometry" />
        </mxCell>
        <mxCell id="actbar-i2" value="◎" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#007acc;fontSize=16;" vertex="1" parent="1">
          <mxGeometry x="8" y="104" width="32" height="32" as="geometry" />
        </mxCell>

        <!-- ── Left Panel: PlanMetadataPanel + MilestonePanel (x=48, w=300) ── -->
        <mxCell id="left-panel" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="48" y="0" width="300" height="680" as="geometry" />
        </mxCell>

        <!-- Top bar (breadcrumb) -->
        <mxCell id="topbar" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="348" y="0" width="1092" height="36" as="geometry" />
        </mxCell>
        <mxCell id="breadcrumb" value="Overview  /  repo-alpha  /  Release Prep" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="368" y="6" width="500" height="24" as="geometry" />
        </mxCell>

        <!-- PlanMetadataPanel header -->
        <mxCell id="meta-hdr" value="Plan Metadata" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="10" width="220" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-div" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="60" y="30" width="274" height="6" as="geometry" />
        </mxCell>

        <mxCell id="meta-id-lbl" value="Plan ID" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="38" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-id-val" value="plan-0042" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#cccccc;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="38" width="150" height="18" as="geometry" />
        </mxCell>

        <mxCell id="meta-status-lbl" value="Status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="58" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-status-val" value="ready" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="240" y="56" width="60" height="20" as="geometry" />
        </mxCell>

        <mxCell id="meta-primary-lbl" value="Primary Repo" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="82" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-primary-val" value="repo-alpha" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="82" width="150" height="18" as="geometry" />
        </mxCell>

        <mxCell id="meta-ctx-lbl" value="Context Repos" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="104" width="110" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-ctx-r1" value="🔒 repo-docs" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="104" width="150" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-ctx-r2" value="🔒 repo-specs" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="124" width="150" height="18" as="geometry" />
        </mxCell>

        <mxCell id="meta-created-lbl" value="Created" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="148" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="meta-created-val" value="2024-01-15 09:00" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#cccccc;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="180" y="148" width="150" height="18" as="geometry" />
        </mxCell>

        <!-- Divider -->
        <mxCell id="meta-div2" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="60" y="172" width="274" height="6" as="geometry" />
        </mxCell>

        <!-- MilestonePanel header -->
        <mxCell id="ms-hdr" value="Milestones" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="182" width="180" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ms-progress" value="2 / 4 completed" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="182" width="130" height="18" as="geometry" />
        </mxCell>

        <!-- Milestone 1: completed -->
        <mxCell id="ms-m1-hdr" value="" style="rounded=1;fillColor=#1a3a1a;strokeColor=#4ec9b0;" vertex="1" parent="1">
          <mxGeometry x="60" y="204" width="274" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m1-arrow" value="▼" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="66" y="204" width="20" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m1-title" value="M1: Scaffold" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="86" y="204" width="160" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m1-badge" value="✓ completed  3/3" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="204" width="130" height="28" as="geometry" />
        </mxCell>
        <!-- Expanded nodes -->
        <mxCell id="ms-m1-n1" value="  ✓ planner" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="234" width="254" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ms-m1-n2" value="  ✓ codergen" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="254" width="254" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ms-m1-n3" value="  ✓ reviewer" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="274" width="254" height="20" as="geometry" />
        </mxCell>

        <!-- Milestone 2: completed -->
        <mxCell id="ms-m2-hdr" value="" style="rounded=1;fillColor=#1a3a1a;strokeColor=#4ec9b0;" vertex="1" parent="1">
          <mxGeometry x="60" y="298" width="274" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m2-arrow" value="▶" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="66" y="298" width="20" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m2-title" value="M2: Backend Spine" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="86" y="298" width="160" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m2-badge" value="✓ completed  5/5" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="298" width="130" height="28" as="geometry" />
        </mxCell>

        <!-- Milestone 3: running -->
        <mxCell id="ms-m3-hdr" value="" style="rounded=1;fillColor=#1c4a6e;strokeColor=#007acc;" vertex="1" parent="1">
          <mxGeometry x="60" y="330" width="274" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-arrow" value="▼" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="66" y="330" width="20" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-title" value="M3: Dashboard" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="86" y="330" width="160" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-badge" value="↻ running  1/3" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="330" width="130" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-n1" value="  ✓ storage-read" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="360" width="254" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-n2" value="  ↻ webview-shell" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="380" width="254" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ms-m3-n3" value="  ○ bridge-wiring" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="80" y="400" width="254" height="20" as="geometry" />
        </mxCell>

        <!-- Milestone 4: queued -->
        <mxCell id="ms-m4-hdr" value="" style="rounded=1;fillColor=#2a2d2e;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="60" y="424" width="274" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m4-arrow" value="▶" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="66" y="424" width="20" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m4-title" value="M4: Polish" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="86" y="424" width="160" height="28" as="geometry" />
        </mxCell>
        <mxCell id="ms-m4-badge" value="⏰ queued  0/4" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="200" y="424" width="130" height="28" as="geometry" />
        </mxCell>

        <!-- Divider -->
        <mxCell id="ms-div" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="60" y="458" width="274" height="6" as="geometry" />
        </mxCell>

        <!-- ValidationProblemsPanel (hidden when no errors, shown here for spec) -->
        <mxCell id="vp-hdr" value="Validation Problems" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#f44747;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="468" width="200" height="18" as="geometry" />
        </mxCell>
        <mxCell id="vp-ok" value="✓  No validation issues. Plan is ready to run." style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="60" y="490" width="274" height="18" as="geometry" />
        </mxCell>

        <!-- ── Center: PlanHeader + GraphCanvas ── -->
        <!-- PlanHeader -->
        <mxCell id="plan-hdr" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="348" y="36" width="860" height="70" as="geometry" />
        </mxCell>
        <mxCell id="plan-hdr-title" value="Release Prep" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=20;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="368" y="42" width="240" height="30" as="geometry" />
        </mxCell>
        <mxCell id="plan-hdr-status" value="ready" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="620" y="48" width="60" height="22" as="geometry" />
        </mxCell>
        <mxCell id="plan-hdr-goal" value="Prepare and validate the v2.0 release across all service repos" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="368" y="76" width="560" height="20" as="geometry" />
        </mxCell>
        <!-- Toolbar buttons -->
        <mxCell id="plan-btn-run" value="▷ Run Plan" style="rounded=1;fillColor=#007acc;strokeColor=none;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1080" y="48" width="100" height="28" as="geometry" />
        </mxCell>
        <mxCell id="plan-btn-edit-dot" value="Edit DOT" style="rounded=1;fillColor=#3a3d41;strokeColor=#5a5d60;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="960" y="48" width="110" height="28" as="geometry" />
        </mxCell>

        <!-- GraphCanvas -->
        <mxCell id="graph-canvas" value="" style="rounded=1;fillColor=#1a1a2e;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="348" y="106" width="860" height="434" as="geometry" />
        </mxCell>
        <mxCell id="gc-label" value="Graph Canvas  (DOT projection)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="362" y="112" width="300" height="20" as="geometry" />
        </mxCell>

        <!-- Graph nodes (DOT projection mockup) -->
        <mxCell id="gn-planner" value="planner" style="rounded=1;fillColor=#1a3a1a;strokeColor=#4ec9b0;fontColor=#4ec9b0;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="570" y="160" width="100" height="36" as="geometry" />
        </mxCell>
        <mxCell id="gn-codergen" value="codergen" style="rounded=1;fillColor=#1a3a1a;strokeColor=#4ec9b0;fontColor=#4ec9b0;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="440" y="240" width="100" height="36" as="geometry" />
        </mxCell>
        <mxCell id="gn-reviewer" value="reviewer" style="rounded=1;fillColor=#1a3a1a;strokeColor=#4ec9b0;fontColor=#4ec9b0;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="700" y="240" width="100" height="36" as="geometry" />
        </mxCell>
        <mxCell id="gn-webview" value="webview-shell" style="rounded=1;fillColor=#1c4a6e;strokeColor=#007acc;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="440" y="330" width="120" height="36" as="geometry" />
        </mxCell>
        <mxCell id="gn-bridge" value="bridge-wiring" style="rounded=1;fillColor=#2a2d2e;strokeColor=#5a5d60;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="700" y="330" width="120" height="36" as="geometry" />
        </mxCell>
        <mxCell id="gn-final" value="final-qa" style="rounded=1;fillColor=#2a2d2e;strokeColor=#5a5d60;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="570" y="420" width="100" height="36" as="geometry" />
        </mxCell>

        <!-- Edges (lines between nodes) -->
        <mxCell id="ge-1" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#4ec9b0;strokeWidth=1;" edge="1" source="gn-planner" target="gn-codergen" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="ge-2" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#4ec9b0;strokeWidth=1;" edge="1" source="gn-planner" target="gn-reviewer" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="ge-3" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#4fc1ff;strokeWidth=1;" edge="1" source="gn-codergen" target="gn-webview" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="ge-4" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#5a5d60;strokeWidth=1;dashed=1;" edge="1" source="gn-reviewer" target="gn-bridge" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="ge-5" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#5a5d60;strokeWidth=1;dashed=1;" edge="1" source="gn-webview" target="gn-final" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="ge-6" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#5a5d60;strokeWidth=1;dashed=1;" edge="1" source="gn-bridge" target="gn-final" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- Legend -->
        <mxCell id="gc-legend-bg" value="" style="rounded=1;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="990" y="112" width="200" height="80" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-title" value="Legend" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1002" y="116" width="160" height="16" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-succ" value="" style="ellipse;fillColor=#4ec9b0;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1002" y="138" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-succ-lbl" value="succeeded" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1018" y="134" width="80" height="18" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-run" value="" style="ellipse;fillColor=#4fc1ff;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1002" y="158" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-run-lbl" value="running" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1018" y="154" width="80" height="18" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-q" value="" style="ellipse;fillColor=#888888;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1002" y="178" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="gc-leg-q-lbl" value="queued" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1018" y="174" width="80" height="18" as="geometry" />
        </mxCell>

        <!-- ── Right panel: NodeInspector placeholder ── -->
        <mxCell id="ni-panel" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1208" y="36" width="232" height="504" as="geometry" />
        </mxCell>
        <mxCell id="ni-title" value="Node Inspector" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="44" width="200" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ni-div" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1220" y="64" width="206" height="6" as="geometry" />
        </mxCell>
        <mxCell id="ni-selected" value="webview-shell" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1220" y="74" width="200" height="24" as="geometry" />
        </mxCell>
        <mxCell id="ni-status" value="running" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="100" width="70" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ni-role-lbl" value="Role" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="130" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ni-role-val" value="Planner → Implementer" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#cccccc;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="130" width="206" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ni-task-lbl" value="Task" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="154" width="80" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ni-task-val" value="Implement webview shell with React scaffold and message bridge..." style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontColor=#cccccc;fontSize=11;whiteSpace=wrap;" vertex="1" parent="1">
          <mxGeometry x="1220" y="174" width="206" height="60" as="geometry" />
        </mxCell>
        <mxCell id="ni-artifacts-lbl" value="Artifacts" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="244" width="100" height="18" as="geometry" />
        </mxCell>
        <mxCell id="ni-art1" value="📦 task-pack-0042.json" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="266" width="206" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ni-art2" value="📄 handoff-0042.md" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="288" width="206" height="20" as="geometry" />
        </mxCell>
        <mxCell id="ni-btn-open" value="Open Artifact" style="rounded=1;fillColor=#3a3d41;strokeColor=#5a5d60;fontColor=#cccccc;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1220" y="316" width="100" height="24" as="geometry" />
        </mxCell>

        <!-- ── Bottom strip: PlanRunHistory ── -->
        <mxCell id="prh-panel" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="48" y="680" width="1392" height="198" as="geometry" />
        </mxCell>
        <mxCell id="prh-title" value="Run History  (this plan)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontStyle=1;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="70" y="688" width="300" height="24" as="geometry" />
        </mxCell>

        <!-- Run history table header -->
        <mxCell id="prh-th" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="48" y="714" width="1392" height="28" as="geometry" />
        </mxCell>
        <mxCell id="prh-th-att" value="Attempt" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="70" y="714" width="80" height="28" as="geometry" />
        </mxCell>
        <mxCell id="prh-th-start" value="Start Time" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="714" width="160" height="28" as="geometry" />
        </mxCell>
        <mxCell id="prh-th-dur" value="Duration" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="420" y="714" width="120" height="28" as="geometry" />
        </mxCell>
        <mxCell id="prh-th-ms" value="Milestones" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="600" y="714" width="120" height="28" as="geometry" />
        </mxCell>
        <mxCell id="prh-th-status" value="Status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="800" y="714" width="100" height="28" as="geometry" />
        </mxCell>

        <mxCell id="prh-r1" value="" style="rounded=0;fillColor=#252526;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="48" y="742" width="1392" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r1-att" value="#3  (current)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="70" y="742" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r1-start" value="Today 09:12 AM" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="200" y="742" width="160" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r1-dur" value="12m 34s" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="420" y="742" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r1-ms" value="2 / 4" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="600" y="742" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r1-status" value="↻ running" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="800" y="750" width="80" height="20" as="geometry" />
        </mxCell>

        <mxCell id="prh-r2" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="48" y="774" width="1392" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r2-att" value="#2" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="70" y="774" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r2-start" value="Yesterday 4:45 PM" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="200" y="774" width="160" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r2-dur" value="9m 02s" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="420" y="774" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r2-ms" value="3 / 4" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="600" y="774" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="prh-r2-status" value="✕ failed" style="rounded=1;fillColor=#4a1a1a;strokeColor=none;fontColor=#f44747;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="800" y="782" width="70" height="20" as="geometry" />
        </mxCell>

        <!-- Status Bar -->
        <mxCell id="statusbar" value="" style="rounded=0;fillColor=#007acc;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry y="878" width="1440" height="22" as="geometry" />
        </mxCell>
        <mxCell id="statusbar-left" value="$(sync~spin) 3 runs" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="10" y="878" width="160" height="22" as="geometry" />
        </mxCell>
        <mxCell id="statusbar-right" value="Attractor v2.0.0  |  repo-alpha / Release Prep (main)" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1000" y="878" width="430" height="22" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
