# Changelog

All notable changes to the Attractor VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - UNRELEASED

### Added

- Monorepo scaffold with shared contracts, extension host, and webview packages (M0)
- Zod-validated message contracts for extension–webview communication (M1)
- DOT graph parser and validator for orchestration plans (M2)
- Repository, plan, and run storage registries with JSON-file persistence (M2)
- Append-only event log and snapshot projector for run state (M2)
- Milestone and artifact registries for plan decomposition tracking (M2)
- Overview projection surface aggregating workspace stats, active runs, and recent failures (M3)
- Repository-detail and plan-detail projection surfaces (M3)
- Webview shell with Preact, Tailwind CSS v4, and esbuild pipeline (M3)
- Dashboard bridge routing inbound webview messages to projection surfaces (M3)
- Runtime activation wiring with dependency-injection seams for testability (M3)
- Design system primitives: Button, Card, Badge, Spinner, StatusDot, EmptyState, ErrorBanner, StatBlock (M3)
- Copilot LM API integration with CopilotModelGateway adapter (M4)
- Chat participant (`@attractor`) with plan, run, and status commands (M4)
- Orchestration loop engine with phase-based milestone execution (M4)
- Handoff envelope schema for role-to-role task delegation (M4)
- Run lifecycle commands: start, cancel, and status via bridge (M4)
- Extension host esbuild bundler with webview asset staging for VSIX packaging (M5)
- `.vscodeignore` and packaging metadata for marketplace readiness (M5)
- Startup error boundary with output channel diagnostics and degraded-state handling (M5)
- VSIX packaging scripts and CI validation (M5)
