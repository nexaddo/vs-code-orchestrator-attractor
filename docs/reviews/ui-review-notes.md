# UI Review Notes

## Biggest Risks

- making the graph the only useful surface for triage
- overloading users with too many state badges at once
- treating multi-repo monitoring as the default instead of an explicit configuration
- mixing authoring, observability, and intervention into one dense screen

## v1 Cuts That Keep The UI Coherent

- make the current workspace the default entry point
- keep the graph read-only and diagnostic-only
- rely on a strong node list, timeline, and log view for actionability
- standardize on one status vocabulary: `queued`, `running`, `blocked`, `failed`, `succeeded`, `canceled`
- always show which repo is writable and which repos are context only

## Success Criteria For v1

- user can start a run from an open repo
- user can identify the blocked or failed node quickly
- user can act without depending on the graph
- user can open logs or artifacts from the run inspector in one step
