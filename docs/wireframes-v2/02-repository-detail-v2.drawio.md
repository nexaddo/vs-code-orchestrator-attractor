# Repository Detail — v2

Repository-scoped view: RepositoryHeader (title, remote URL, branch, action buttons), tabbed content (Plans / Runs / Artifacts), RepositoryActivityFeed. Matches `ui-design-v2.md §3 Repository Detail`.

```drawio
<mxfile version="21.2.8" type="device">
  <diagram id="repo-detail-v2" name="Repository Detail v2">
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

        <!-- Sidebar -->
        <mxCell id="sidebar" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="48" y="0" width="252" height="900" as="geometry" />
        </mxCell>
        <mxCell id="sb-hdr-lbl" value="ATTRACTOR EXPLORER" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#bbbbbb;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="58" y="10" width="220" height="20" as="geometry" />
        </mxCell>
        <mxCell id="sb-repos-hdr" value="REPOSITORIES" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="58" y="38" width="220" height="18" as="geometry" />
        </mxCell>
        <mxCell id="sb-r1-dot" value="" style="ellipse;fillColor=#4ec9b0;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="58" y="64" width="8" height="8" as="geometry" />
        </mxCell>
        <!-- repo rows: dot at x=58 (8px wide), name at x=70, branch clipped to w=200 (70+200=270 < sidebar right 300) -->
        <mxCell id="sb-r1" value="repo-alpha" style="text;html=1;strokeColor=none;fillColor=#2a2d2e;align=left;verticalAlign=middle;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="70" y="58" width="136" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-r1-branch" value="main" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="206" y="58" width="86" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-r2-dot" value="" style="ellipse;fillColor=#4ec9b0;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="58" y="88" width="8" height="8" as="geometry" />
        </mxCell>
        <mxCell id="sb-r2" value="repo-beta" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="70" y="82" width="136" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-r2-branch" value="feat/v2" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="206" y="82" width="86" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-r3-dot" value="" style="ellipse;fillColor=#f44747;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="58" y="112" width="8" height="8" as="geometry" />
        </mxCell>
        <mxCell id="sb-r3" value="repo-gamma" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="70" y="106" width="136" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-r3-branch" value="main" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="206" y="106" width="86" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-plans-hdr" value="PLANS" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="58" y="140" width="220" height="18" as="geometry" />
        </mxCell>
        <mxCell id="sb-p1" value="  ▷  Release Prep" style="text;html=1;strokeColor=none;fillColor=#2a2d2e;align=left;verticalAlign=middle;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="58" y="160" width="220" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-p2" value="  ▷  Build Graph" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="58" y="184" width="220" height="22" as="geometry" />
        </mxCell>
        <mxCell id="sb-p3" value="  ▷  API Scaffold" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="58" y="208" width="220" height="22" as="geometry" />
        </mxCell>

        <!-- ── Main content (x=300) ── -->
        <!-- Top bar -->
        <mxCell id="topbar" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="300" y="0" width="1140" height="40" as="geometry" />
        </mxCell>
        <mxCell id="breadcrumb" value="Overview  /  repo-alpha" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="8" width="400" height="24" as="geometry" />
        </mxCell>

        <!-- ── RepositoryHeader ── -->
        <mxCell id="repo-hdr" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="300" y="40" width="1140" height="100" as="geometry" />
        </mxCell>
        <mxCell id="repo-hdr-name" value="repo-alpha" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=22;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="320" y="48" width="400" height="32" as="geometry" />
        </mxCell>
        <mxCell id="repo-hdr-writable-badge" value="WRITABLE" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=10;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="540" y="56" width="70" height="18" as="geometry" />
        </mxCell>
        <mxCell id="repo-hdr-url" value="github.com/org/repo-alpha" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4fc1ff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="84" width="300" height="20" as="geometry" />
        </mxCell>
        <mxCell id="repo-hdr-path" value="/home/user/projects/repo-alpha" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="104" width="300" height="20" as="geometry" />
        </mxCell>
        <!-- Action buttons -->
        <mxCell id="repo-btn-create-plan" value="+ Create Plan" style="rounded=1;fillColor=#007acc;strokeColor=none;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1170" y="56" width="110" height="28" as="geometry" />
        </mxCell>
        <mxCell id="repo-btn-open-folder" value="Open Folder" style="rounded=1;fillColor=#3a3d41;strokeColor=#5a5d60;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1050" y="56" width="110" height="28" as="geometry" />
        </mxCell>

        <!-- ── Tab bar ── -->
        <mxCell id="tabs-bg" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="300" y="140" width="1140" height="38" as="geometry" />
        </mxCell>
        <mxCell id="tab-plans" value="Plans" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#cccccc;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="320" y="140" width="80" height="38" as="geometry" />
        </mxCell>
        <mxCell id="tab-plans-underline" value="" style="line;strokeWidth=2;strokeColor=#007acc;" vertex="1" parent="1">
          <mxGeometry x="320" y="176" width="80" height="2" as="geometry" />
        </mxCell>
        <mxCell id="tab-runs" value="Runs" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#888888;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="420" y="140" width="80" height="38" as="geometry" />
        </mxCell>
        <mxCell id="tab-artifacts" value="Artifacts" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#888888;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="520" y="140" width="80" height="38" as="geometry" />
        </mxCell>

        <!-- ── Plans tab content + Activity Feed side by side ── -->
        <!-- PlanList (x=300, w=800) -->
        <mxCell id="plan-list-area" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="178" width="840" height="722" as="geometry" />
        </mxCell>

        <!-- PlanList table header -->
        <mxCell id="pl-th" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="300" y="178" width="840" height="32" as="geometry" />
        </mxCell>
        <mxCell id="pl-th-title" value="Plan Title" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="320" y="178" width="300" height="32" as="geometry" />
        </mxCell>
        <mxCell id="pl-th-status" value="Status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="640" y="178" width="100" height="32" as="geometry" />
        </mxCell>
        <mxCell id="pl-th-lastrun" value="Last Run" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="760" y="178" width="120" height="32" as="geometry" />
        </mxCell>
        <mxCell id="pl-th-actions" value="Actions" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1020" y="178" width="100" height="32" as="geometry" />
        </mxCell>

        <!-- Plan row 1: ready, last run succeeded -->
        <mxCell id="pl-r1" value="" style="rounded=0;fillColor=#252526;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="210" width="840" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r1-title" value="Release Prep" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="320" y="210" width="300" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r1-status" value="ready" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="640" y="220" width="60" height="20" as="geometry" />
        </mxCell>
        <mxCell id="pl-r1-lastrun" value="✓ succeeded  2h ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="760" y="210" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r1-btn-run" value="▷ Run" style="rounded=1;fillColor=#007acc;strokeColor=none;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1060" y="220" width="60" height="22" as="geometry" />
        </mxCell>

        <!-- Plan row 2: draft, no runs -->
        <mxCell id="pl-r2" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="250" width="840" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r2-title" value="Build Graph" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="320" y="250" width="300" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r2-status" value="draft" style="rounded=1;fillColor=#2a2d2e;strokeColor=none;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="640" y="260" width="50" height="20" as="geometry" />
        </mxCell>
        <mxCell id="pl-r2-lastrun" value="Never run" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="760" y="250" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r2-btn-run" value="▷ Run" style="rounded=1;fillColor=#3a3d41;strokeColor=#5a5d60;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1060" y="260" width="60" height="22" as="geometry" />
        </mxCell>

        <!-- Plan row 3: ready, last run failed -->
        <mxCell id="pl-r3" value="" style="rounded=0;fillColor=#252526;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="290" width="840" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r3-title" value="API Scaffold" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="320" y="290" width="300" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r3-status" value="ready" style="rounded=1;fillColor=#1c4a6e;strokeColor=none;fontColor=#4fc1ff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="640" y="300" width="60" height="20" as="geometry" />
        </mxCell>
        <mxCell id="pl-r3-lastrun" value="✕ failed  45m ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#f44747;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="760" y="290" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-r3-btn-run" value="▷ Run" style="rounded=1;fillColor=#007acc;strokeColor=none;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1060" y="300" width="60" height="22" as="geometry" />
        </mxCell>

        <!-- Empty state (dimmed, under plan rows) -->
        <mxCell id="pl-empty-zone" value="" style="rounded=1;fillColor=#252526;strokeColor=#3c3c3c;dashed=1;" vertex="1" parent="1">
          <mxGeometry x="300" y="346" width="840" height="80" as="geometry" />
        </mxCell>
        <mxCell id="pl-empty-icon" value="📓" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#888888;fontSize=20;" vertex="1" parent="1">
          <mxGeometry x="560" y="356" width="40" height="40" as="geometry" />
        </mxCell>
        <mxCell id="pl-empty-msg" value="No Plans Created — Define your first orchestration workflow" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontColor=#888888;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="370" width="800" height="24" as="geometry" />
        </mxCell>
        <mxCell id="pl-empty-cta" value="+ Create New Plan" style="rounded=1;fillColor=#007acc;strokeColor=none;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="640" y="400" width="160" height="26" as="geometry" />
        </mxCell>

        <!-- RunList section (Runs tab preview, smaller) -->
        <mxCell id="rl-hdr-lbl" value="Run History" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontStyle=1;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="448" width="200" height="24" as="geometry" />
        </mxCell>
        <mxCell id="rl-th" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="300" y="474" width="840" height="28" as="geometry" />
        </mxCell>
        <mxCell id="rl-th-attempt" value="Attempt" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="320" y="474" width="80" height="28" as="geometry" />
        </mxCell>
        <mxCell id="rl-th-start" value="Start Time" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="420" y="474" width="140" height="28" as="geometry" />
        </mxCell>
        <mxCell id="rl-th-dur" value="Duration" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="580" y="474" width="100" height="28" as="geometry" />
        </mxCell>
        <mxCell id="rl-th-status" value="Status" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=11;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="700" y="474" width="100" height="28" as="geometry" />
        </mxCell>

        <mxCell id="rl-r1" value="" style="rounded=0;fillColor=#252526;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="502" width="840" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r1-attempt" value="#3" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="502" width="80" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r1-start" value="Today 09:12 AM" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="420" y="502" width="140" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r1-dur" value="12m 34s" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="580" y="502" width="100" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r1-status" value="succeeded" style="rounded=1;fillColor=#1a3a1a;strokeColor=none;fontColor=#4ec9b0;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="700" y="508" width="80" height="20" as="geometry" />
        </mxCell>

        <mxCell id="rl-r2" value="" style="rounded=0;fillColor=#1e1e1e;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="534" width="840" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r2-attempt" value="#2" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="534" width="80" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r2-start" value="Yesterday 4:45 PM" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="420" y="534" width="140" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r2-dur" value="9m 02s" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="580" y="534" width="100" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r2-status" value="failed" style="rounded=1;fillColor=#4a1a1a;strokeColor=none;fontColor=#f44747;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="700" y="540" width="60" height="20" as="geometry" />
        </mxCell>

        <mxCell id="rl-r3" value="" style="rounded=0;fillColor=#252526;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="300" y="566" width="840" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r3-attempt" value="#1" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="566" width="80" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r3-start" value="Yesterday 2:10 PM" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="420" y="566" width="140" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r3-dur" value="22m 15s" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="580" y="566" width="100" height="32" as="geometry" />
        </mxCell>
        <mxCell id="rl-r3-status" value="canceled" style="rounded=1;fillColor=#2a2d2e;strokeColor=none;fontColor=#888888;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="700" y="572" width="70" height="20" as="geometry" />
        </mxCell>

        <!-- ── Activity Feed (right sidebar, x=1140, w=300) ── -->
        <mxCell id="af-panel" value="" style="rounded=0;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1140" y="140" width="300" height="760" as="geometry" />
        </mxCell>
        <mxCell id="af-title" value="Activity" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontStyle=1;fontSize=13;" vertex="1" parent="1">
          <mxGeometry x="1156" y="148" width="200" height="24" as="geometry" />
        </mxCell>
        <mxCell id="af-div" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1156" y="174" width="268" height="8" as="geometry" />
        </mxCell>

        <!-- Activity events (timeline) -->
        <mxCell id="af-e1-dot" value="" style="ellipse;fillColor=#4ec9b0;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1158" y="192" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="af-e1-msg" value="Plan Created: Release Prep" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1174" y="186" width="240" height="22" as="geometry" />
        </mxCell>
        <mxCell id="af-e1-ts" value="2m ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1174" y="206" width="100" height="16" as="geometry" />
        </mxCell>
        <mxCell id="af-sep1" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1156" y="226" width="268" height="6" as="geometry" />
        </mxCell>

        <mxCell id="af-e2-dot" value="" style="ellipse;fillColor=#4fc1ff;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1158" y="240" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="af-e2-msg" value="Run Started: #3 (Build Graph)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1174" y="234" width="240" height="22" as="geometry" />
        </mxCell>
        <mxCell id="af-e2-ts" value="5m ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1174" y="254" width="100" height="16" as="geometry" />
        </mxCell>
        <mxCell id="af-sep2" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1156" y="274" width="268" height="6" as="geometry" />
        </mxCell>

        <mxCell id="af-e3-dot" value="" style="ellipse;fillColor=#f44747;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1158" y="288" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="af-e3-msg" value="Run Failed: #2 (API Scaffold)" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1174" y="282" width="240" height="22" as="geometry" />
        </mxCell>
        <mxCell id="af-e3-ts" value="45m ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1174" y="302" width="100" height="16" as="geometry" />
        </mxCell>
        <mxCell id="af-sep3" value="" style="line;strokeWidth=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1156" y="322" width="268" height="6" as="geometry" />
        </mxCell>

        <mxCell id="af-e4-dot" value="" style="ellipse;fillColor=#4ec9b0;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="1158" y="336" width="10" height="10" as="geometry" />
        </mxCell>
        <mxCell id="af-e4-msg" value="Checkpoint Saved: milestone-2" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#cccccc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="1174" y="330" width="240" height="22" as="geometry" />
        </mxCell>
        <mxCell id="af-e4-ts" value="1h ago" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#888888;fontSize=10;" vertex="1" parent="1">
          <mxGeometry x="1174" y="350" width="100" height="16" as="geometry" />
        </mxCell>

        <!-- Status Bar -->
        <mxCell id="statusbar" value="" style="rounded=0;fillColor=#007acc;strokeColor=none;" vertex="1" parent="1">
          <mxGeometry y="878" width="1440" height="22" as="geometry" />
        </mxCell>
        <mxCell id="statusbar-left" value="$(sync~spin) 3 runs" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="10" y="878" width="160" height="22" as="geometry" />
        </mxCell>
        <mxCell id="statusbar-right" value="Attractor v2.0.0  |  repo-alpha (main)" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=middle;fontColor=#ffffff;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="1100" y="878" width="330" height="22" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
