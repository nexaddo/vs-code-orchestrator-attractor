# Milestone Panel

Milestone Panel for Attractor extension (400px wide overlay).

```drawio
<mxfile version="21.2.8" type="device">
  <diagram id="milestone-diagram" name="Milestone Panel">
    <mxGraphModel dx="1440" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1440" pageHeight="900">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Simulate underlying screen with some opacity -->
        <mxCell id="ms-overlay-bg" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1e1e1e;strokeColor=none;opacity=50;" vertex="1" parent="1">
          <mxGeometry width="1440" height="900" as="geometry" />
        </mxCell>

        <!-- Actual Panel (400px wide, right side) -->
        <mxCell id="ms-panel" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1040" width="400" height="900" as="geometry" />
        </mxCell>

        <!-- Header -->
        <mxCell id="ms-header" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#252526;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1040" width="400" height="40" as="geometry" />
        </mxCell>
        <mxCell id="ms-title" value="Milestone Panel" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1060" y="5" width="300" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-btn-close" value="X" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#3c3c3c;fontColor=#1e1e1e;" vertex="1" parent="1">
          <mxGeometry x="1390" y="5" width="30" height="30" as="geometry" />
        </mxCell>

        <!-- Info Section -->
        <mxCell id="ms-info-1" value="Milestone: Release Ready" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="60" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-info-2" value="Status: In Progress" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="90" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-info-3" value="Plan: Release Prep" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="120" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-info-4" value="Linked Run: #142" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="150" width="360" height="30" as="geometry" />
        </mxCell>

        <!-- Divider -->
        <mxCell id="ms-div-1" value="" style="line;strokeWidth=1;html=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1040" y="190" width="400" height="10" as="geometry" />
        </mxCell>

        <!-- Progress Section -->
        <mxCell id="ms-prog-title" value="Progress" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1060" y="210" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-prog-1" value="[x] verify" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="240" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-prog-2" value="[x] docs" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="270" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-prog-3" value="[x] package" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="300" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-prog-4" value="[ ] publish" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;" vertex="1" parent="1">
          <mxGeometry x="1060" y="330" width="360" height="30" as="geometry" />
        </mxCell>

        <!-- Divider -->
        <mxCell id="ms-div-2" value="" style="line;strokeWidth=1;html=1;strokeColor=#3c3c3c;" vertex="1" parent="1">
          <mxGeometry x="1040" y="370" width="400" height="10" as="geometry" />
        </mxCell>

        <!-- Actions Section -->
        <mxCell id="ms-act-title" value="Actions" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#cccccc;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1060" y="390" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-btn-act1" value="Open Node" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#3c3c3c;fontColor=#1e1e1e;" vertex="1" parent="1">
          <mxGeometry x="1060" y="430" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-btn-act2" value="Resume Run" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#3c3c3c;fontColor=#1e1e1e;" vertex="1" parent="1">
          <mxGeometry x="1060" y="470" width="360" height="30" as="geometry" />
        </mxCell>
        <mxCell id="ms-btn-act3" value="Retry Failed Step" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#3c3c3c;fontColor=#1e1e1e;" vertex="1" parent="1">
          <mxGeometry x="1060" y="510" width="360" height="30" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
