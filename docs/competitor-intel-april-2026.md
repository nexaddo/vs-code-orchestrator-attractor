# Attractor Competitive Intelligence — April 2026 Scan

**Scanned**: 2026-04-02  
**Context**: Attractor v0.1.0 released (M5) — multi-step AI coding orchestration via DOT digraph plans  
**Prior Art Documented**: VS Code v1.109 Agent HQ, Agent Flow Builder, BLACKBOX AI  
**Deferred Features**: `parallel`, `fan_in`, `tool`, `manager_loop` node types + multi-repo execution

---

## High-Relevance Findings (Graph/DOT/Multi-Agent Role Systems)

### 1. TAKT — Agent Coordination Topology

- **Repo**: [nrslib/takt](https://github.com/nrslib/takt)
- **Stars**: 887 ⭐ | **Forks**: 49
- **Description**: "TAKT Agent Koordination Topology - Define how AI agents coordinate, where humans intervene, and what gets recorded — in YAML"
- **Key Features**:
  - YAML-based agent coordination topology
  - Explicit human-in-the-loop intervention points
  - Recording/audit capabilities
  - TypeScript-based
- **Relevance**: **DIRECT COMPETITOR** — Same problem space (declarative agent orchestration). TAKT uses YAML; Attractor uses DOT. Both aim to define multi-agent coordination as code. TAKT's YAML approach is simpler but less expressive than DOT for complex DAGs.
- **Assessment**: Monitor closely. Different formalism (YAML vs DOT) but same intent.

---

### 2. KubeRocketAI — Declarative Agentic SDLC

- **Repo**: [KubeRocketCI/kuberocketai](https://github.com/KubeRocketCI/kuberocketai)
- **Stars**: 31 ⭐ | **Forks**: 7
- **Description**: "Declarative agentic framework for AI-driven software development. Define, validate, and orchestrate AI agents as code—transparent, auditable, and CI/CD-ready."
- **Key Features**:
  - SDLC-as-Code approach
  - Pre-configured agent personas (Architect, Developer, DevOps, QA, etc.)
  - Declarative YAML/Go-based configuration
  - CI/CD integration
- **Relevance**: **COMPLEMENT** — Different target (full SDLC vs per-file orchestration). KubeRocketAI manages entire development lifecycle; Attractor focuses on code generation plans. Could integrate.
- **Assessment**: Interesting for future multi-repo/multi-agent features.

---

### 3. Mysti — Multi-Agent Collaboration

- **Repo**: [DeepMyst/Mysti](https://github.com/DeepMyst/Mysti)
- **Stars**: 1027 ⭐ | **Forks**: 43
- **Marketplace**: [Mysti - AI Coding Agent](https://marketplace.visualstudio.com/items?itemName=DeepMyst.mysti) (2,891 installs)
- **Description**: "AI coding dream team of agents for VS Code. Claude Code + OpenAI Codex collaborate in brainstorm mode, debate solutions, and synthesize the best approach."
- **Key Features**:
  - Multiple AI models (Claude, Codex, Gemini, Copilot)
  - Brainstorm/debate mode between agents
  - Synthesis of best approach
  - Collaborative decision-making
- **Relevance**: **COMPLEMENT** — Mysti coordinates multiple LLM backends. Attractor orchestrates steps within a single LLM session. Different abstraction layers.
- **Assessment**: Strong competitor for multi-model use cases. Not plan-based (no DAG).

---

### 4. HermeX — Network of AI Agents

- **Repo**: [HermeX-AI/hermex-ai-vscode](https://github.com/HermeX-AI/hermex-ai-vscode)
- **Stars**: 1 ⭐ | **Forks**: 0
- **Description**: "HermeX orchestrates a network of AI agents — Architect, Developer, Tester, Critic — to deliver production-ready features 10× faster."
- **Key Features**:
  - Role-based agent network (Architect, Developer, Tester, Critic)
  - Pipeline workflow
  - VS Code extension
- **Relevance**: **DIRECT COMPETITOR** — Same role-based multi-agent concept as Attractor's planned `manager_loop`. HermeX defines explicit agent roles in a pipeline.
- **Assessment**: Early stage (1 star). Role definitions align with Attractor's design philosophy.

---

### 5. workermill — Multi-Expert Orchestration

- **Repo**: [jarod-rosenthal/workermill](https://github.com/jarod-rosenthal/workermill)
- **Stars**: 4 ⭐ | **Forks**: 0
- **Description**: "Open-source AI coding team with multi-expert orchestration"
- **Key Features**:
  - Multi-expert coordination
  - CLI + VS Code extension
  - Ollama support
- **Relevance**: **COMPLEMENT** — Similar orchestration concept, different implementation.
- **Assessment**: Niche player.

---

## Medium-Relevance Findings (Workflow/Tooling)

### 6. kudosflow — Visual Workflow Editor

- **Repo**: [akudo7/kudosflow](https://github.com/akudo7/kudosflow)
- **Stars**: 9 ⭐ | **Forks**: 2
- **Marketplace**: [kudosflow - LangChain extension](https://marketplace.visualstudio.com/items?itemName=AkiraKudo.kudosflow) (1,174 installs)
- **Description**: "Visual workflow editor for building node-based AI agent workflows with drag-and-drop interface, A2A integration, and real-time execution"
- **Key Features**:
  - Drag-and-drop node editor (React Flow)
  - A2A (Agent-to-Agent) protocol integration
  - MCP support
  - Real-time execution
  - JSON export/import
- **Relevance**: **COMPLEMENT** — Visual graph builder. Attractor uses DOT text format; kudosflow uses visual nodes. Could inspire DOT visualizer.
- **Assessment**: Good reference for future visual plan editor.

---

### 7. FlowDrop — Visual Workflow Editor (External)

- **URL**: [flowdrop.io](https://flowdrop.io/)
- **Description**: "The visual workflow editor for AI agents. A drop-in component that lets your users design, configure, and manage AI workflows."
- **Key Features**:
  - Open source (MIT)
  - Drop-in React component
  - Any backend, any framework
- **Relevance**: **COMPLEMENT** — Could be integrated as visual DOT renderer.
- **Assessment**: Worth evaluating for plan visualization.

---

### 8. DebugMCP — Agent Debugging

- **Repo**: [microsoft/DebugMCP](https://github.com/microsoft/DebugMCP)
- **Stars**: 276 ⭐ | **Forks**: 17
- **Description**: "Gift your VS Code agent a real debugger: breakpoints, stepping, inspection."
- **Key Features**:
  - Real breakpoints for AI agents
  - Step-through debugging
  - Variable inspection
  - MCP integration
- **Relevance**: **COMPLEMENT** — Debugging for AI agents is a gap in Attractor. Could add post-M5.
- **Assessment**: Valuable integration target.

---

### 9. bitfrog-copilot — 7+1 Agent System

- **Repo**: [rainyulei/bitfrog-copilot](https://github.com/rainyulei/bitfrog-copilot)
- **Stars**: 12 ⭐ | **Forks**: 2
- **Description**: "7+1 AI development agents for GitHub Copilot with Chinese philosophy-driven thinking models. Brainstorm, plan, execute, debug, review, mentor, and Mozi autonomous deep worker."
- **Key Features**:
  - 7 role-based agents + 1 autonomous
  - Chinese philosophy thinking models
  - TDD support
  - Code review integration
- **Relevance**: **COMPETITOR** — Role-based agents like HermeX.
- **Assessment**: Interesting philosophical approach to agent roles.

---

### 10. nofx-vscode — Parallel Agents

- **Repo**: [benfinklea/nofx-vscode](https://github.com/benfinklea/nofx-vscode)
- **Stars**: 1 ⭐ | **Forks**: 0
- **Description**: "VS Code extension for orchestrating multiple Claude Code AI agents in parallel"
- **Relevance**: **DIRECT COMPETITOR** — Parallel execution matches Attractor's deferred `parallel` node type.
- **Assessment**: Early stage but validates parallel orchestration need.

---

### 11. operator — Kanban-style Multi-Agent

- **Repo**: [untra/operator](https://github.com/untra/operator)
- **Stars**: 10 ⭐ | **Forks**: 1
- **Description**: "Operator! Multi-agent orchestration application for AI assisted kanban shaped software development"
- **Key Features**:
  - Kanban-based workflow
  - Claude Code, Codex, Gemini CLI support
  - Git, Jira, Linear integration
  - Tmux/Zellij terminal multiplexing
- **Relevance**: **COMPLEMENT** — Different paradigm (Kanban vs DAG). Interesting for future workflow views.
- **Assessment**: Novel approach to agent task management.

---

### 12. retort-plugins — Retort Orchestration

- **Repo**: [phoenixvc/retort-plugins](https://github.com/phoenixvc/retort-plugins)
- **Stars**: 0 ⭐ | **Forks**: 0
- **Description**: "VSCode extension for Retort — command palette, sidebar, and status bar for AI agent orchestration"
- **Relevance**: **COMPLEMENT** — Retort appears to be an orchestration framework.
- **Assessment**: Monitor.

---

## Low-Relevance / Contextual

### 13. Skill-Dock — Agent Skill Manager

- **Repo**: [yen0304/Skill-Dock](https://github.com/yen0304/Skill-Dock)
- **Stars**: 11 ⭐ | **Forks**: 1
- **Description**: "Local-first agent skill manager for VS Code / Cursor. Manage, browse, and import skills across Claude, Cursor, Codex."
- **Relevance**: **COMPLEMENT** — Skill management aligns with Attractor's skill system.
- **Assessment**: Could integrate skill discovery.

---

### 14. Claude Code Guide (Educational)

- **Repo**: [zebbern/claude-code-guide](https://github.com/zebbern/claude-code-guide)
- **Stars**: 3789 ⭐ | **Forks**: 355
- **Description**: "Claude Code Guide - Setup, Commands, workflows, agents, skills & tips-n-tricks"
- **Relevance**: **IRRELEVANT** — Educational resource, not a competitor.

---

### 15. FlowiseAI — Visual AI Development Platform

- **URL**: [flowiseai.com](https://flowiseai.com/)
- **Description**: "Open source generative AI development platform. Modular building blocks for building any agentic systems."
- **Relevance**: **COMPLEMENT** — Low-code visual agent builder. Not VS Code specific but worth watching.

---

## VS Code Native (Context)

### VS Code 1.109+ Multi-Agent Support

- **Reference**: [Your Home for Multi-Agent Development](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development)
- **Key Features**:
  - Native agent sessions
  - Multiple agents (Claude, Codex) in parallel
  - Agent-to-agent communication
- **Relevance**: **CONTEXT** — Native competition. Attractor must differentiate on DOT-based plan execution vs native inline chat.

---

## Summary Table

| Name            | Stars | Type                      | Relevance      | Notes                                                             |
| --------------- | ----- | ------------------------- | -------------- | ----------------------------------------------------------------- |
| TAKT            | 887   | Declarative topology      | **COMPETITOR** | YAML-based agent coordination. Different formalism (YAML vs DOT). |
| KubeRocketAI    | 31    | SDLC framework            | COMPLEMENT     | Full SDLC. Could integrate for multi-repo.                        |
| Mysti           | 1027  | Multi-model collaboration | COMPLEMENT     | Multi-LLM coordination.                                           |
| HermeX          | 1     | Role-based network        | **COMPETITOR** | Architect/Developer/Tester/Critic pipeline.                       |
| kudosflow       | 9     | Visual workflow           | COMPLEMENT     | React Flow visualizer.                                            |
| DebugMCP        | 276   | Debugging                 | COMPLEMENT     | Agent debugging gap.                                              |
| bitfrog-copilot | 12    | Role agents               | COMPETITOR     | 7+1 agent system.                                                 |
| nofx-vscode     | 1     | Parallel agents           | **COMPETITOR** | Parallel execution.                                               |
| workermill      | 4     | Multi-expert              | COMPLEMENT     |                                                                   |
| operator        | 10    | Kanban                    | COMPLEMENT     | Novel workflow view.                                              |

---

## Action Items

1. **Investigate TAKT** — Compare YAML topology to DOT plans. Identify differentiation opportunities.
2. **Add to roadmap**: Visual DOT plan renderer (inspired by kudosflow/FlowDrop).
3. **Add to roadmap**: Agent debugging support (DebugMCP integration).
4. **Monitor HermeX / bitfrog** — Role-based agent patterns.
5. **Consider parallel node implementation** — nofx-vscode validates demand.

---

_Last Updated: 2026-04-02_  
_Scan Source: GitHub API, Web Search, VS Code Marketplace_
